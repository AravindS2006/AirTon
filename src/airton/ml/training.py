"""Config-driven training, selection, calibration and evaluation for the IOP stack.

Partition discipline (all by subject):
  train        fits ridge, residual GBM, CNN members, quality model, OOD detector
  validation   early stopping, candidate selection, stacking weights, difficulty model
  calibration  quality threshold, OOD threshold, conformal quantile
  test         evaluated once through the exported runtime
  external     held-out device domain, evaluated once through the exported runtime
"""

import copy
import hashlib
import json
import platform
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

from . import FEATURE_SET_VERSION
from .acquisition import SIMULATOR_VERSION, generate_cohort
from .bundle import save_bundle
from .dataset import dataset_sha256, load_dataset
from .deep import ensemble_predict, resolve_device, torch_available, train_member
from .features import FEATURE_NAMES, PHYSICS_FEATURES, feature_matrix, waveform_tensor
from .metrics import agreement, auroc, binary_at_threshold, interval_metrics, repeatability
from .models import (conformal_quantile, fit_mahalanobis, fit_ridge, fit_standardizer, lightgbm_to_trees,
                     mahalanobis_distance, ridge_predict, simplex_weights, standardize, train_lightgbm,
                     tree_predict)
from .quality import rule_reasons
from .runtime import IOPEngine

PARTITIONS = ("train", "validation", "calibration", "test", "external")
PHYSICS_INDEX = [FEATURE_NAMES.index(f) for f in PHYSICS_FEATURES]


def _merge(base, override):
    out = copy.deepcopy(base)
    for key, value in override.items():
        out[key] = _merge(out[key], value) if isinstance(value, dict) and isinstance(out.get(key), dict) else value
    return out


def load_config(path, profile="full"):
    raw = json.loads(Path(path).read_text(encoding="utf-8"))
    profiles = raw.pop("profiles", {})
    if profile not in profiles:
        raise ValueError(f"Unknown profile {profile!r}; choose from {sorted(profiles)}")
    config = _merge(raw, profiles[profile])
    config["profile"] = profile
    if config.get("clinical_use") is not False:
        raise ValueError("Configuration must declare clinical_use false")
    fractions = config["split"]["fractions"]
    if abs(sum(fractions.values()) - 1.0) > 1e-9 or set(fractions) != set(PARTITIONS[:4]):
        raise ValueError("Split fractions must cover train/validation/calibration/test and sum to 1")
    return config


def assign_partitions(meta, fractions, seed):
    """Subject-level partition labels; external-domain subjects are held out entirely."""
    subjects = sorted({m["subject_id"] for m in meta})
    external = sorted({m["subject_id"] for m in meta if m["domain"] == "external"})
    if set(external) & {m["subject_id"] for m in meta if m["domain"] != "external"}:
        raise ValueError("A subject appears in both development and external domains")
    development = [s for s in subjects if s not in set(external)]
    order = list(np.random.default_rng(seed).permutation(development))
    cuts, start, by_subject = {}, 0, {s: "external" for s in external}
    for i, name in enumerate(PARTITIONS[:4]):
        end = len(order) if i == 3 else start + int(round(fractions[name] * len(order)))
        for s in order[start:end]:
            by_subject[s] = name
        cuts[name] = end - start
        start = end
    return np.array([by_subject[m["subject_id"]] for m in meta]), by_subject


def _recall_threshold(scores, target, default=0.5):
    scores = np.sort(np.asarray(scores, dtype=float))
    if scores.size == 0:
        return default
    k = int(np.floor((1.0 - target) * scores.size))
    return float(scores[min(k, scores.size - 1)])


def _rmse(a, b):
    return float(np.sqrt(np.mean((np.asarray(a) - np.asarray(b)) ** 2)))


def _cross_fitted_stack_rmse(P, y, subjects, seed):
    labels = np.unique(subjects)
    half = set(np.random.default_rng(seed).permutation(labels)[: labels.size // 2].tolist())
    fold = np.array([s in half for s in subjects])
    errors = []
    for holdout in (True, False):
        fit, ev = fold != holdout, fold == holdout
        w = np.asarray(simplex_weights(P[fit], y[fit]))
        errors.append((P[ev] @ w - y[ev]) ** 2)
    return float(np.sqrt(np.mean(np.concatenate(errors))))


def _git_revision(root):
    try:
        out = subprocess.run(["git", "-C", str(root), "rev-parse", "HEAD"], capture_output=True, text=True, timeout=10)
        return out.stdout.strip() or None
    except (OSError, subprocess.SubprocessError):
        return None


def _environment():
    env = {"python": platform.python_version(), "platform": platform.platform()}
    for name in ("numpy", "scipy", "lightgbm", "torch"):
        try:
            env[name] = __import__(name).__version__
        except ImportError:
            env[name] = None
    if env["torch"]:
        import torch
        env["cuda_device"] = torch.cuda.get_device_name(0) if torch.cuda.is_available() else None
    return env


def run_training(config, output_dir, *, use_deep=None, log=print, repo_root=None):
    started = time.time()
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    seed = int(config["seed"])
    data_cfg = config["data"]
    # ------------------------------------------------------------ data
    if data_cfg["source"] == "synthetic":
        cohort = generate_cohort(data_cfg["n_subjects"], seed=seed, sessions=data_cfg["sessions"],
                                 repeats=data_cfg["repeats"], n_development_devices=data_cfg["n_development_devices"],
                                 n_external_devices=data_cfg["n_external_devices"],
                                 external_subject_fraction=data_cfg["external_subject_fraction"])
        synthetic = True
    else:
        cohort = load_dataset(data_cfg["dataset_path"])
        synthetic = cohort["manifest"].get("synthetic") is True
    if not synthetic:
        raise PermissionError("This release trains only on synthetic data; real-data bundles need a reviewed release path")
    pressure, optical, meta = cohort["pressure"], cohort["optical"], cohort["meta"]
    data_hash = dataset_sha256(pressure, optical, meta)
    log(f"data: {len(meta)} acquisitions, sha256 {data_hash[:12]}")
    X, diags = feature_matrix(pressure, optical, meta)
    finite = np.isfinite(X).all(axis=1)
    y = np.array([m["reference_iop_mmhg"] for m in meta], dtype=float)
    artifact = np.array([bool(m["artifact_label"]) for m in meta])
    subjects = np.array([m["subject_id"] for m in meta])
    part, by_subject = assign_partitions(meta, config["split"]["fractions"], seed)
    limits = config["rules"]
    rule_pass = np.array([not rule_reasons(dict(zip(FEATURE_NAMES, X[i])), diags[i], meta[i], limits)
                          for i in range(len(meta))])
    is_ = {p: part == p for p in PARTITIONS}
    log("partitions: " + ", ".join(f"{p}={int(is_[p].sum())}" for p in PARTITIONS))

    # ------------------------------------------------------------ quality gate
    qc = config["quality"]
    q_train, q_val = is_["train"] & finite, is_["validation"] & finite
    q_booster = train_lightgbm(X[q_train], artifact[q_train].astype(float), objective="binary", seed=seed,
                               num_rounds=qc["num_rounds"], learning_rate=qc["learning_rate"],
                               num_leaves=qc["num_leaves"], X_valid=X[q_val], y_valid=artifact[q_val].astype(float))
    quality_model = lightgbm_to_trees(q_booster)
    qscore = np.full(len(meta), np.nan)
    qscore[finite] = tree_predict(quality_model, X[finite])
    q_cal = is_["calibration"] & rule_pass & finite & artifact
    quality_threshold = _recall_threshold(qscore[q_cal], qc["target_artifact_recall"])
    gate = rule_pass & finite & (qscore < quality_threshold)
    log(f"quality threshold {quality_threshold:.4f} from {int(q_cal.sum())} calibration artifacts")

    # ------------------------------------------------------------ estimators
    ec = config["estimator"]
    fit_rows = is_["train"] & rule_pass & finite & ~artifact
    stop_rows = is_["validation"] & rule_pass & finite & ~artifact
    ridge = fit_ridge(X[fit_rows][:, PHYSICS_INDEX], y[fit_rows], ec["ridge_alpha"])
    pred = {"physics_ridge": np.full(len(meta), np.nan)}
    pred["physics_ridge"][finite] = ridge_predict(ridge, X[finite][:, PHYSICS_INDEX])
    g = ec["gbm"]
    gbm_booster = train_lightgbm(X[fit_rows], y[fit_rows] - pred["physics_ridge"][fit_rows], seed=seed,
                                 num_rounds=g["num_rounds"], learning_rate=g["learning_rate"],
                                 num_leaves=g["num_leaves"], min_data_in_leaf=g["min_data_in_leaf"],
                                 X_valid=X[stop_rows], y_valid=y[stop_rows] - pred["physics_ridge"][stop_rows],
                                 early_stopping_rounds=g["early_stopping_rounds"])
    residual_gbm = lightgbm_to_trees(gbm_booster)
    pred["ridge+gbm"] = np.full(len(meta), np.nan)
    pred["ridge+gbm"][finite] = pred["physics_ridge"][finite] + tree_predict(residual_gbm, X[finite])
    log(f"residual GBM: {len(residual_gbm['trees'])} trees")

    deep_cfg = ec["deep"]
    use_deep = deep_cfg["enabled"] if use_deep is None else use_deep
    if use_deep and not torch_available():
        raise RuntimeError("Deep members requested but torch is not installed (pip install -e .[deep])")
    cnn_states, cnn_logs, cnn_scaler = [], [], None
    cnn_sd = np.zeros(len(meta))
    if use_deep:
        device = resolve_device(deep_cfg.get("device", "auto"))
        log(f"deep ensemble device: {device}")
        cnn_scaler = fit_standardizer(X[fit_rows])
        rows = np.nonzero(finite)[0]
        wave = waveform_tensor(pressure[rows], optical[rows], [meta[i] for i in rows])
        scal = standardize(cnn_scaler, X[rows])
        local_fit = fit_rows[rows]
        target = y[rows][local_fit] - pred["physics_ridge"][rows][local_fit]
        for member in range(deep_cfg["members"]):
            t0 = time.time()
            state, info = train_member(wave[local_fit], scal[local_fit], target, subjects[rows][local_fit],
                                       seed=seed + 1000 + member, epochs=deep_cfg["epochs"],
                                       batch_size=deep_cfg["batch_size"], lr=deep_cfg["learning_rate"],
                                       weight_decay=deep_cfg["weight_decay"], beta=deep_cfg["beta_nll"],
                                       patience=deep_cfg["patience"], threads=deep_cfg["threads"],
                                       device=device)
            info["seconds"] = round(time.time() - t0, 1)
            cnn_states.append(state)
            cnn_logs.append(info)
            log(f"cnn member {member}: {info}")
        mean, sd = ensemble_predict(cnn_states, wave, scal)
        pred["ridge+cnn"] = np.full(len(meta), np.nan)
        pred["ridge+cnn"][rows] = pred["physics_ridge"][rows] + mean
        cnn_sd[rows] = sd

    # ------------------------------------------------------------ selection and stacking
    sel = is_["validation"] & gate
    names = [n for n in ("physics_ridge", "ridge+gbm", "ridge+cnn") if n in pred]
    P = np.column_stack([pred[n][sel] for n in names])
    scores = {n: _rmse(pred[n][sel], y[sel]) for n in names}
    if len(names) > 1:
        scores["stack"] = _cross_fitted_stack_rmse(P, y[sel], subjects[sel], seed)
    chosen = min(scores, key=scores.get)
    if chosen == "stack":
        weights = dict(zip(names, simplex_weights(P, y[sel])))
    else:
        weights = {chosen: 1.0}
    weights = {k: float(v) for k, v in weights.items() if v > 1e-6}
    total = sum(weights.values())
    weights = {k: v / total for k, v in weights.items()}
    estimate = sum(w * pred[n] for n, w in weights.items())
    log(f"validation RMSE {json.dumps({k: round(v, 3) for k, v in scores.items()})}; chosen {chosen} {weights}")

    # ------------------------------------------------------------ OOD and difficulty
    oc = config["ood"]
    ood = fit_mahalanobis(X[fit_rows], oc["shrinkage"])
    dist = np.full(len(meta), np.nan)
    dist[finite] = mahalanobis_distance(ood, X[finite])
    ood_threshold = float(np.quantile(dist[is_["calibration"] & gate], oc["calibration_quantile"], method="higher"))
    support = [float(y[fit_rows].min() - oc["target_support_margin_mmhg"]),
               float(y[fit_rows].max() + oc["target_support_margin_mmhg"])]
    uc = config["uncertainty"]
    D = np.column_stack([X, np.abs(pred["ridge+gbm"] - pred["physics_ridge"]), cnn_sd])
    dg = uc["difficulty_gbm"]
    diff_booster = train_lightgbm(D[sel], np.log(np.abs(y[sel] - estimate[sel]) + 0.25), seed=seed,
                                  num_rounds=dg["num_rounds"], learning_rate=dg["learning_rate"],
                                  num_leaves=dg["num_leaves"], min_data_in_leaf=dg["min_data_in_leaf"])
    difficulty = lightgbm_to_trees(diff_booster)
    sigma = np.full(len(meta), np.nan)
    sigma[finite] = np.exp(tree_predict(difficulty, D[finite]))
    in_support = (estimate >= support[0]) & (estimate <= support[1])
    conf_rows = np.nonzero(is_["calibration"] & gate & (dist <= ood_threshold) & in_support)[0]
    rng = np.random.default_rng(seed + 7)
    one_per_subject = []
    for s in np.unique(subjects[conf_rows]):
        candidates = conf_rows[subjects[conf_rows] == s]
        one_per_subject.append(int(rng.choice(candidates)))
    one_per_subject = np.array(sorted(one_per_subject))
    conf_scores = np.abs(y[one_per_subject] - estimate[one_per_subject]) / sigma[one_per_subject]
    q_conf = conformal_quantile(conf_scores, uc["conformal_alpha"])
    log(f"conformal quantile {q_conf:.3f} from {one_per_subject.size} subjects; OOD threshold {ood_threshold:.2f}")

    # ------------------------------------------------------------ bundle
    settings = {"rule_limits": limits, "quality_threshold": quality_threshold, "ood_threshold": ood_threshold,
                "target_support_mmhg": support, "conformal_quantile": q_conf,
                "conformal_alpha": uc["conformal_alpha"],
                "max_interval_half_width_mmhg": uc["max_interval_half_width_mmhg"],
                "status": "synthetic development settings; not approved limits"}
    json_parts = {"settings": settings, "physics_ridge": ridge, "residual_gbm": residual_gbm,
                  "quality_gbm": quality_model, "difficulty_gbm": difficulty, "ood": ood,
                  "stack": {"weights": weights, "candidates": names, "validation_rmse": scores, "chosen": chosen}}
    if cnn_scaler is not None:
        json_parts["cnn_scalars"] = cnn_scaler
    npz_parts = {f"cnn_member_{i}": s for i, s in enumerate(cnn_states)}
    bundle_manifest = save_bundle(output_dir / "bundle", {
        "synthetic": True, "clinical_use": False, "evidence_level": "synthetic-generated",
        "intended_use": "Software engineering of the AirTon IOP estimation stack on synthetic acquisitions only.",
        "feature_set": FEATURE_SET_VERSION, "feature_names": list(FEATURE_NAMES),
        "physics_features": list(PHYSICS_FEATURES), "simulator_version": SIMULATOR_VERSION,
        "dataset_sha256": data_hash, "config_id": config["config_id"], "profile": config["profile"],
        "created_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }, json_parts, npz_parts)
    engine = IOPEngine.load(output_dir / "bundle")
    log(f"bundle {engine.model_id}")

    # Train/serve parity: the exported runtime must reproduce in-memory estimates.
    check = np.nonzero(sel)[0][:200]
    wave = waveform_tensor(pressure[check], optical[check], [meta[i] for i in check]) if cnn_states else None
    served = engine.components(X[check], wave)
    parity = float(np.max(np.abs(served["estimate"] - estimate[check]))) if check.size else 0.0
    if parity > 1e-6:
        raise AssertionError(f"Runtime parity failure: {parity}")

    # ------------------------------------------------------------ evaluation through the runtime
    ev_cfg = config["evaluation"]
    truth_available = all("truth" in m for m in meta)
    cct_cuts = None
    if truth_available:
        cct_cuts = np.quantile([m["truth"]["cct_um"] for m in np.array(meta)[is_["train"]]], [1 / 3, 2 / 3])
    evaluation = {}
    for name in ("test", "external"):
        rows = np.nonzero(is_[name])[0]
        if rows.size == 0:
            continue
        results = engine.infer_batch(pressure[rows], optical[rows], [meta[i] for i in rows])
        evaluation[name] = _evaluate_partition(name, rows, results, y, artifact, subjects, meta, qscore, rule_pass,
                                               finite, pred, estimate, quality_threshold, ev_cfg, seed, cct_cuts)
        log(f"{name}: accepted {evaluation[name]['acceptance']['accepted_fraction']:.3f}, "
            f"RMSE {evaluation[name]['agreement_accepted']['rmse_mmhg']:.3f}, "
            f"coverage {evaluation[name]['intervals']['coverage']:.3f}")

    # ------------------------------------------------------------ records
    split_hashes = {p: hashlib.sha256("\n".join(sorted(s for s, q in by_subject.items() if q == p)).encode()).hexdigest()
                    for p in PARTITIONS}
    metrics = {"synthetic": True, "clinical_use": False, "model_id": engine.model_id,
               "validation_rmse_by_candidate": scores, "chosen": chosen, "stack_weights": weights,
               "quality_threshold": quality_threshold, "conformal_quantile": q_conf,
               "conformal_calibration_subjects": int(one_per_subject.size),
               "ood_threshold": ood_threshold, "runtime_parity_max_abs_mmhg": parity,
               "cnn_members": cnn_logs, "evaluation": evaluation,
               "note": "Synthetic engineering results. They do not estimate AirTon or clinical performance."}
    _write_json(output_dir / "metrics.json", metrics)
    manifest = {
        "template": False, "experiment_id": f"{config['config_id']}-{config['profile']}-{engine.model_id}",
        "evidence_level": "synthetic-generated",
        "intended_question": "Does the IOP software stack train, abstain, calibrate and evaluate correctly end to end?",
        "requirement_ids": ["R03", "R04", "R05", "R08", "R13", "R16", "R19"],
        "protocol_version": None, "approval_references": [], "device_revision": None,
        "firmware_version": None, "calibration_ids": sorted({m["calibration_id"] for m in meta}),
        "model_id": engine.model_id, "dataset_manifest_sha256": data_hash,
        "source_revision": _git_revision(repo_root) if repo_root else None,
        "environment": _environment(), "seed": seed,
        "split_definition": {"unit": "subject_id", "fractions": config["split"]["fractions"],
                             "external": "external-domain devices", "subject_list_sha256": split_hashes,
                             "subjects": {p: int(sum(q == p for q in by_subject.values())) for p in PARTITIONS}},
        "prespecified_acceptance": None, "raw_storage_reference": "regenerated deterministically from seed",
        "artifact_hashes": bundle_manifest["files"], "config": config,
        "failures_and_exclusions": "Rejected acquisitions are retained in evaluation denominators by reason.",
        "results": "metrics.json", "duration_seconds": round(time.time() - started, 1),
        "limitations": "Synthetic physics model with assumed parameters; no bench, human or clinical data.",
        "reviewer": None, "review_date": None,
    }
    _write_json(output_dir / "run-manifest.json", manifest)
    (output_dir / "model-card.md").write_text(render_model_card(metrics, manifest, bundle_manifest), encoding="utf-8",
                                              newline="\n")
    log(f"done in {manifest['duration_seconds']} s -> {output_dir}")
    return metrics


def _write_json(path, obj):
    Path(path).write_text(json.dumps(obj, indent=2, allow_nan=False, default=float) + "\n", encoding="utf-8",
                          newline="\n")


def _evaluate_partition(name, rows, results, y, artifact, subjects, meta, qscore, rule_pass, finite, pred,
                        estimate, quality_threshold, ev_cfg, seed, cct_cuts):
    accepted = np.array([r["status"] == "pass" for r in results])
    reasons = {}
    for r in results:
        for reason in r["reasons"]:
            reasons[reason] = reasons.get(reason, 0) + 1
    acc_rows = rows[accepted]
    est = np.array([r["iop_estimate_mmhg"] for r in results if r["status"] == "pass"], dtype=float)
    lo = np.array([r["interval_mmhg"][0] for r in results if r["status"] == "pass"], dtype=float)
    hi = np.array([r["interval_mmhg"][1] for r in results if r["status"] == "pass"], dtype=float)
    boot = ev_cfg["bootstrap_replicates"]
    out = {"n_acquisitions": int(rows.size), "n_subjects": int(np.unique(subjects[rows]).size),
           "acceptance": {"accepted": int(accepted.sum()), "accepted_fraction": float(accepted.mean()),
                          "rejection_reasons": dict(sorted(reasons.items())),
                          "artifact_prevalence": float(artifact[rows].mean()),
                          "artifact_leakage_among_accepted": float(artifact[acc_rows].mean()) if acc_rows.size else None,
                          "clean_acquisitions_rejected": float(np.mean(~accepted[~artifact[rows]]))
                          if (~artifact[rows]).any() else None}}
    out["agreement_accepted"] = agreement(y[acc_rows], est, subjects[acc_rows], bootstrap=boot, seed=seed)
    out["intervals"] = interval_metrics(y[acc_rows], lo, hi)
    out["repeatability_accepted"] = repeatability(est, np.array([meta[i]["session_id"] for i in acc_rows]))
    # Session level: mean of accepted repeats against the session reference (descriptive; the
    # averaging rule for care belongs to a reviewed care plan, not this analysis).
    sessions = np.array([meta[i]["session_id"] for i in rows])
    session_ids = np.unique(sessions)
    accepted_sessions = [s for s in session_ids if np.any(accepted[sessions == s])]
    s_est = np.array([est[np.array([meta[i]["session_id"] for i in acc_rows]) == s].mean() for s in accepted_sessions])
    s_ref = np.array([y[rows][sessions == s][0] for s in accepted_sessions])
    s_sub = np.array([subjects[rows][sessions == s][0] for s in accepted_sessions])
    out["session_level"] = {"sessions": int(session_ids.size), "sessions_with_accepted_reading": len(accepted_sessions),
                            "session_yield": len(accepted_sessions) / session_ids.size if session_ids.size else None}
    if len(accepted_sessions) >= 3:
        out["session_level"]["agreement_mean_of_accepted"] = agreement(s_ref, s_est, s_sub, bootstrap=0)
    baseline = pred["physics_ridge"][acc_rows]
    out["baseline_physics_ridge_on_same_rows"] = agreement(y[acc_rows], baseline, subjects[acc_rows], bootstrap=0)
    ungated = rows[finite[rows]]
    out["ungated_model_on_all_detectable_rows"] = agreement(y[ungated], estimate[ungated], subjects[ungated],
                                                            bootstrap=0)
    q_rows = rows[rule_pass[rows] & finite[rows]]
    out["quality_model"] = {"auroc_on_rule_passing_rows": auroc(artifact[q_rows], qscore[q_rows]),
                            **binary_at_threshold(artifact[q_rows], qscore[q_rows], quality_threshold)}
    subgroups = {}
    if cct_cuts is not None and acc_rows.size:
        cct = np.array([meta[i]["truth"]["cct_um"] for i in acc_rows])
        elevated = np.array([meta[i]["truth"]["elevated_group"] for i in acc_rows])
        groups = {"cct_low": cct < cct_cuts[0], "cct_mid": (cct >= cct_cuts[0]) & (cct < cct_cuts[1]),
                  "cct_high": cct >= cct_cuts[1], "elevated_iop_group": elevated, "typical_iop_group": ~elevated}
        for device in sorted({meta[i]["device_id"] for i in acc_rows}):
            groups[device] = np.array([meta[i]["device_id"] == device for i in acc_rows])
        for g, mask in groups.items():
            if mask.sum() >= 10:
                a = agreement(y[acc_rows][mask], est[mask], subjects[acc_rows][mask], bootstrap=0)
                subgroups[g] = {k: a[k] for k in ("n_pairs", "n_clusters", "bias_mmhg", "loa_lower_mmhg",
                                                  "loa_upper_mmhg", "rmse_mmhg")}
                subgroups[g]["interval_coverage"] = interval_metrics(y[acc_rows][mask], lo[mask], hi[mask])["coverage"]
    out["subgroups_synthetic_truth"] = subgroups
    return out


def _fmt(v, digits=2):
    return "n/a" if v is None else f"{v:.{digits}f}"


def render_model_card(metrics, manifest, bundle):
    ev = metrics["evaluation"]
    lines = [
        f"# Model card: {metrics['model_id']} (synthetic)", "",
        "> **Synthetic engineering artifact. Not for clinical use.** Every number below comes from simulated",
        "> acquisitions with assumed physics. None describes AirTon hardware, a patient, or clinical accuracy.", "",
        "| Field | Value |", "|---|---|",
        f"| Model ID | {metrics['model_id']} |",
        f"| Evidence level | {manifest['evidence_level']} |",
        f"| Created | {bundle['created_at']} |",
        f"| Intended use | {bundle['intended_use']} |",
        "| Prohibited uses | Any clinical measurement, diagnosis, glaucoma risk, triage or treatment decision |",
        f"| Inputs | 10 kHz pressure and optical channels (320 samples), calibration and alignment metadata; feature set {bundle['feature_set']} |",
        "| Target | Synthetic session reference IOP (mmHg) |",
        f"| Data | Simulator {bundle['simulator_version']}; dataset SHA-256 {manifest['dataset_manifest_sha256'][:16]}... |",
        f"| Split | Subject-grouped {manifest['split_definition']['subjects']}; external = held-out device domain |",
        f"| Selected estimator | {metrics['chosen']} with weights {json.dumps({k: round(v, 3) for k, v in metrics['stack_weights'].items()})} |",
        f"| Validation RMSE by candidate | {json.dumps({k: round(v, 3) for k, v in metrics['validation_rmse_by_candidate'].items()})} |",
        f"| Abstention | Rules; quality threshold {metrics['quality_threshold']:.3f}; OOD distance {metrics['ood_threshold']:.2f}; max half-width {manifest['config']['uncertainty']['max_interval_half_width_mmhg']} mmHg |",
        f"| Interval | Normalized split conformal, target coverage {1 - manifest['config']['uncertainty']['conformal_alpha']:.2f}, {metrics['conformal_calibration_subjects']} calibration subjects (one acquisition each) |",
        f"| Runtime | numpy-only; parity with training {metrics['runtime_parity_max_abs_mmhg']:.1e} mmHg |",
        f"| Environment | {json.dumps(manifest['environment'])} |", "",
        "## Held-out results (synthetic)", "",
        "| Partition | Acquisitions | Accepted | Session yield | Artifact leakage | Bias | Clustered 95% LoA | RMSE (95% CI) | Session-mean RMSE | Interval coverage | Repeatability coef. | Ridge baseline RMSE | Ungated RMSE |",
        "|---|---|---|---|---|---|---|---|---|---|---|---|---|",
    ]
    for name, e in ev.items():
        a, ci = e["agreement_accepted"], e["agreement_accepted"].get("bootstrap_95ci", {})
        rmse_ci = ci.get("rmse_mmhg", [None, None])
        lines.append(
            f"| {name} | {e['n_acquisitions']} | {_fmt(e['acceptance']['accepted_fraction'] * 100, 1)}% | "
            f"{_fmt((e['session_level']['session_yield'] or 0) * 100, 1)}% | "
            f"{_fmt((e['acceptance']['artifact_leakage_among_accepted'] or 0) * 100, 1)}% | {_fmt(a['bias_mmhg'])} | "
            f"{_fmt(a['loa_lower_mmhg'])} to {_fmt(a['loa_upper_mmhg'])} | {_fmt(a['rmse_mmhg'])} "
            f"({_fmt(rmse_ci[0])}-{_fmt(rmse_ci[1])}) | "
            f"{_fmt(e['session_level'].get('agreement_mean_of_accepted', {}).get('rmse_mmhg'))} | "
            f"{_fmt(e['intervals']['coverage'] * 100, 1)}% | "
            f"{_fmt(e['repeatability_accepted']['repeatability_coefficient_mmhg'])} | "
            f"{_fmt(e['baseline_physics_ridge_on_same_rows']['rmse_mmhg'])} | "
            f"{_fmt(e['ungated_model_on_all_detectable_rows']['rmse_mmhg'])} |")
    lines += ["", "Subgroups (synthetic truth covariates; n, bias, RMSE, interval coverage):", ""]
    for name, e in ev.items():
        parts = [f"{g}: n={v['n_pairs']}, bias {_fmt(v['bias_mmhg'])}, RMSE {_fmt(v['rmse_mmhg'])}, "
                 f"coverage {_fmt(v['interval_coverage'] * 100, 1)}%" for g, v in e["subgroups_synthetic_truth"].items()]
        lines.append(f"- **{name}**: " + "; ".join(parts))
    lines += ["", "Rejections by reason: " + "; ".join(
        f"{n}: {json.dumps(e['acceptance']['rejection_reasons'])}" for n, e in ev.items()), "",
        "## Limitations", "",
        "- The simulator encodes assumed relationships (viscous corneal lag, CCT and stiffness resistance, alignment",
        "  efficiency). A model that fits them proves the software, not the physics. Real bench data will differ.",
        "- Rule limits, the quality recall target, the OOD quantile and the interval width limit are synthetic",
        "  development settings, not approved safety or clinical limits.",
        "- Conformal coverage is marginal under subject exchangeability; it is not conditional on subgroup or device.",
        "- The external partition is a simulated device shift; real external validity needs other devices, sites and users.",
        "- Central corneal thickness is not observable from the home signals. Expect thickness-dependent bias, as",
        "  in other non-contact tonometers; the CCT subgroups above quantify it for the simulator.",
        "- Model capacity cannot recover information the signals lack. Compare candidates against the physics",
        "  ridge baseline rather than reading the deep model's presence as an accuracy gain.",
        "- Pressure estimation is separate from glaucoma risk. This model makes no diagnostic statement.", "",
        "## Change control", "",
        "Retrain into a new bundle (new model ID). Bundles are immutable and hash-verified on load.",
        "A clinical bundle needs an approved dataset, protocol, prespecified acceptance criteria and release review.", ""]
    return "\n".join(lines)
