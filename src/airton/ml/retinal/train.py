"""Training, temperature scaling, frozen-threshold evaluation and reporting."""

import hashlib
import json
import math
import time
from pathlib import Path

import numpy as np

from ..metrics import auroc
from .data import ImageRows, build_transforms, grouped_stratified_split, load_manifest, preprocessing_spec
from .model import build_model, set_backbone_trainable


def seed_everything(seed):
    import random

    import torch

    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.use_deterministic_algorithms(True, warn_only=True)


def evaluate(model, loader, device="cpu"):
    """Logits and labels for exactly the samples in loader (no global state)."""
    import torch

    model.eval()
    logits, labels, index = [], [], []
    with torch.no_grad():
        for x, y, i in loader:
            logits.append(model(x.to(device)).squeeze(1).float().cpu().numpy())
            labels.append(np.asarray(y, dtype=float))
            index.append(np.asarray(i))
    if not logits:
        return np.array([]), np.array([]), np.array([], dtype=int)
    return np.concatenate(logits), np.concatenate(labels), np.concatenate(index)


def fit_temperature(logits, labels):
    """Single temperature minimizing validation NLL (golden-section search over log T)."""
    z, y = np.asarray(logits, float), np.asarray(labels, float)

    def nll(log_t):
        p = 1 / (1 + np.exp(-z / math.exp(log_t)))
        p = np.clip(p, 1e-7, 1 - 1e-7)
        return -np.mean(y * np.log(p) + (1 - y) * np.log(1 - p))

    lo, hi = math.log(0.05), math.log(20.0)
    g = (math.sqrt(5) - 1) / 2
    for _ in range(80):
        a, b = hi - g * (hi - lo), lo + g * (hi - lo)
        if nll(a) < nll(b):
            hi = b
        else:
            lo = a
    return float(math.exp(0.5 * (lo + hi)))


def choose_threshold(probabilities, labels, rule="youden", target_sensitivity=None):
    p, y = np.asarray(probabilities, float), np.asarray(labels, bool)
    candidates = np.unique(p)
    best, best_t = -1.0, 0.5
    for t in candidates:
        pred = p >= t
        sens = np.mean(pred[y]) if y.any() else 0.0
        spec = np.mean(~pred[~y]) if (~y).any() else 0.0
        if rule == "target_sensitivity":
            score = spec if sens >= target_sensitivity else -1.0
        else:
            score = sens + spec - 1
        if score > best:
            best, best_t = score, float(t)
    return best_t


def wilson(k, n, z=1.96):
    if n == 0:
        return [None, None]
    p = k / n
    centre = (p + z * z / (2 * n)) / (1 + z * z / n)
    half = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / (1 + z * z / n)
    return [centre - half, centre + half]


def classification_report(probabilities, labels, patients, threshold, mapping, bootstrap=500, seed=0):
    p, y = np.asarray(probabilities, float), np.asarray(labels, int)
    pred = (p >= threshold).astype(int)
    tn, fp = int(np.sum((pred == 0) & (y == 0))), int(np.sum((pred == 1) & (y == 0)))
    fn, tp = int(np.sum((pred == 0) & (y == 1))), int(np.sum((pred == 1) & (y == 1)))
    bins = np.clip((p * 10).astype(int), 0, 9)
    ece = float(sum(np.abs(p[bins == b].mean() - y[bins == b].mean()) * np.mean(bins == b) for b in range(10)
                    if np.any(bins == b)))
    report = {"n_images": int(y.size), "n_patients": int(np.unique(patients).size), "threshold": threshold,
              "confusion_matrix": {"labels": [mapping["0"], mapping["1"]], "rows_true_cols_pred": [[tn, fp], [fn, tp]]},
              "sensitivity": tp / (tp + fn) if tp + fn else None, "sensitivity_wilson95": wilson(tp, tp + fn),
              "specificity": tn / (tn + fp) if tn + fp else None, "specificity_wilson95": wilson(tn, tn + fp),
              "auroc": auroc(y.astype(bool), p), "brier": float(np.mean((p - y) ** 2)), "ece_10bin": ece,
              "note": "Wilson intervals treat images as independent; use the patient bootstrap for clustered AUROC."}
    if bootstrap:
        rng = np.random.default_rng(seed)
        labels_p = np.unique(patients)
        idx = {q: np.nonzero(patients == q)[0] for q in labels_p}
        stats = []
        for _ in range(bootstrap):
            rows = np.concatenate([idx[q] for q in rng.choice(labels_p, labels_p.size)])
            a = auroc(y[rows].astype(bool), p[rows])
            if a is not None:
                stats.append(a)
        report["auroc_patient_bootstrap95"] = np.percentile(stats, [2.5, 97.5]).tolist() if stats else None
    return report


def save_checkpoint(model, path):
    """Tensor-only checkpoint (safetensors when installed); never a pickled module."""
    state = {k: v.detach().cpu().contiguous() for k, v in model.state_dict().items()}
    try:
        from safetensors.torch import save_file
        save_file(state, str(path) + ".safetensors")
        return str(path) + ".safetensors"
    except ImportError:
        import torch
        torch.save(state, str(path) + ".pt")
        return str(path) + ".pt"


def load_checkpoint(model, path):
    if str(path).endswith(".safetensors"):
        from safetensors.torch import load_file
        state = load_file(str(path))
    else:
        import torch
        state = torch.load(str(path), map_location="cpu", weights_only=True)
    model.load_state_dict({k: v.to(next(model.parameters()).device) for k, v in state.items()})
    return model


def train(config, manifest_path, output_dir, log=print):
    import torch
    from torch.utils.data import DataLoader

    from ..deep import resolve_device

    started = time.time()
    seed_everything(config["seed"])
    device = resolve_device(config.get("device", "auto"))
    use_amp = bool(config.get("amp", True)) and device == "cuda"
    log(f"device: {device}; mixed precision: {use_amp}")
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    manifest = load_manifest(manifest_path)
    mapping = manifest["label_mapping"]
    parts = grouped_stratified_split(manifest["images"], config["split"], config["seed"])
    overlap = set.intersection(*[{r["patient_id"] for r in rows} for rows in parts.values()])
    if overlap:
        raise AssertionError("Patient overlap across partitions")
    spec = preprocessing_spec(config["image_size"], config["pretrained"])
    loader = lambda rows, train_mode: DataLoader(
        ImageRows(rows, build_transforms(spec, train_mode, config.get("rotation_deg", 0))),
        batch_size=config["batch_size"], shuffle=train_mode,
        drop_last=False, num_workers=int(config.get("num_workers", 0)), pin_memory=device == "cuda",
        persistent_workers=int(config.get("num_workers", 0)) > 0,
        generator=torch.Generator().manual_seed(config["seed"]))
    train_loader, val_loader = loader(parts["train"], True), loader(parts["validation"], False)
    model = build_model(config["architecture"], config["pretrained"]).to(device)
    positives = sum(r["label"] for r in parts["train"])
    pos_weight = torch.tensor([(len(parts["train"]) - positives) / max(1, positives)], dtype=torch.float32,
                              device=device)
    scaler = torch.amp.GradScaler("cuda", enabled=use_amp)
    criterion = torch.nn.BCEWithLogitsLoss(pos_weight=pos_weight)
    history, best_auc, best_path, bad = [], -1.0, None, 0
    optimizer, scheduler, trainable_state = None, None, None
    for epoch in range(config["epochs"]):
        epoch_start = time.time()
        unfrozen = epoch >= config["freeze_backbone_epochs"]
        if unfrozen != trainable_state:
            # Build the optimizer once per training phase (frozen head-only, then full fine-tune) so
            # AdamW moments and the cosine schedule persist across epochs within a phase.
            trainable = set_backbone_trainable(model, unfrozen)
            lr = config["learning_rate"] * (1.0 if unfrozen else config.get("head_lr_multiplier", 3.0))
            optimizer = torch.optim.AdamW([p for p in model.parameters() if p.requires_grad], lr=lr,
                                          weight_decay=config["weight_decay"])
            remaining = config["epochs"] - epoch if unfrozen else max(1, config["freeze_backbone_epochs"])
            scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=remaining * len(train_loader))
            trainable_state = unfrozen
        model.train()
        seen, total = 0, 0.0
        for x, y, _ in train_loader:
            x, y = x.to(device, non_blocking=True), y.to(device, non_blocking=True)
            optimizer.zero_grad()
            with torch.autocast(device_type=device, dtype=torch.float16, enabled=use_amp):
                loss = criterion(model(x).squeeze(1).float(), y.float())
            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()
            scheduler.step()
            seen += x.shape[0]
            total += float(loss) * x.shape[0]
        logits, labels, _ = evaluate(model, val_loader, device)
        val_auc = auroc(labels.astype(bool), 1 / (1 + np.exp(-logits)))
        history.append({"epoch": epoch, "train_loss": total / max(1, seen), "train_samples_processed": seen,
                        "trainable_parameters": trainable, "validation_auroc": val_auc,
                        "seconds": round(time.time() - epoch_start, 1)})
        log(f"epoch {epoch}: {history[-1]}")
        if val_auc is not None and val_auc > best_auc + 1e-6:
            best_auc, bad = val_auc, 0
            best_path = save_checkpoint(model, output_dir / "checkpoint")
        else:
            bad += 1
            if bad >= config["patience"]:
                break
    load_checkpoint(model, best_path)
    model.to(device)
    report = _finalize(model, config, manifest_path, manifest, parts, loader, device, output_dir, history, best_path,
                       started, use_amp)
    return report


def _finalize(model, config, manifest_path, manifest, parts, loader, device, output_dir, history, best_path, started,
              use_amp, expected_frozen=None):
    """Freeze temperature/thresholds on validation, then evaluate the test partition once."""
    mapping = manifest["label_mapping"]
    spec = preprocessing_spec(config["image_size"], config["pretrained"])
    val_loader = loader(parts["validation"], False)
    logits, labels, v_index = evaluate(model, val_loader, device)
    temperature = fit_temperature(logits, labels)
    val_prob = 1 / (1 + np.exp(-logits / temperature))
    threshold = choose_threshold(val_prob, labels, config["threshold_rule"], config.get("target_sensitivity"))
    secondary = config.get("secondary_target_sensitivity")
    secondary_threshold = choose_threshold(val_prob, labels, "target_sensitivity", secondary) if secondary else None
    frozen = {"temperature": temperature, "threshold": threshold, "threshold_rule": config["threshold_rule"],
              "secondary_threshold": secondary_threshold, "secondary_target_sensitivity": secondary,
              "checkpoint": Path(best_path).name, "preprocessing": spec, "label_mapping": mapping,
              "architecture": config["architecture"]}
    if expected_frozen is not None:
        for key in ("temperature", "threshold"):
            if abs(frozen[key] - expected_frozen[key]) > 1e-4:
                raise AssertionError(f"Recomputed {key} differs from the frozen decision")
    (output_dir / "frozen-decision.json").write_text(json.dumps(frozen, indent=2) + "\n", encoding="utf-8")
    # Final test: evaluated after every choice above is frozen.
    test_loader = loader(parts["test"], False)
    t_logits, t_labels, t_index = evaluate(model, test_loader, device)
    t_prob = 1 / (1 + np.exp(-t_logits / temperature))
    patients = np.array([parts["test"][i]["patient_id"] for i in t_index])
    v_patients = np.array([parts["validation"][i]["patient_id"] for i in v_index])
    report = {"synthetic": manifest.get("synthetic") is True, "dataset_id": manifest["dataset_id"],
              "clinical_use": False, "partitions": {k: {"images": len(v), "patients": len({r['patient_id'] for r in v})}
                                                    for k, v in parts.items()},
              "history": history, "frozen": frozen, "device": device, "mixed_precision": use_amp,
              "validation_report": classification_report(val_prob, labels, v_patients, threshold, mapping, bootstrap=0),
              "test_report": classification_report(t_prob, t_labels, patients, threshold, mapping,
                                                   bootstrap=config["bootstrap_replicates"], seed=config["seed"]),
              "duration_seconds": round(time.time() - started, 1),
              "limitations": "Research framework output. Not a glaucoma diagnosis and not linked to IOP estimation."}
    if secondary_threshold is not None:
        report["test_report_secondary_operating_point"] = classification_report(
            t_prob, t_labels, patients, secondary_threshold, mapping, bootstrap=0)
    report["governance"] = dict(manifest.get("governance") or {})
    report["manifest_sha256"] = hashlib.sha256(Path(manifest_path).read_bytes()).hexdigest()
    report["checkpoint_sha256"] = hashlib.sha256(Path(best_path).read_bytes()).hexdigest()
    report["config"] = config
    (output_dir / "metrics.json").write_text(json.dumps(report, indent=2, default=float) + "\n", encoding="utf-8")
    with (output_dir / "test-predictions.csv").open("w", encoding="utf-8", newline="\n") as handle:
        handle.write("image_path,group_id,label,probability\n")
        for i, prob in zip(t_index, t_prob):
            row = parts["test"][i]
            handle.write(f"{row['image_path']},{row['patient_id']},{row['label']},{prob:.6f}\n")
    (output_dir / "model-card.md").write_text(render_retinal_card(report, manifest), encoding="utf-8", newline="\n")
    return report


def finalize_from_checkpoint(config, manifest_path, output_dir, log=print):
    """Rebuild reports from a saved checkpoint without retraining (same split, same frozen rules)."""
    import torch
    from torch.utils.data import DataLoader

    from ..deep import resolve_device

    started = time.time()
    seed_everything(config["seed"])
    output_dir = Path(output_dir)
    device = resolve_device(config.get("device", "auto"))
    manifest = load_manifest(manifest_path)
    parts = grouped_stratified_split(manifest["images"], config["split"], config["seed"])
    spec = preprocessing_spec(config["image_size"], config["pretrained"])
    loader = lambda rows, train_mode: DataLoader(
        ImageRows(rows, build_transforms(spec, train_mode)), batch_size=config["batch_size"], shuffle=False,
        num_workers=0)
    best_path = next(p for p in output_dir.iterdir() if p.name.startswith("checkpoint."))
    model = load_checkpoint(build_model(config["architecture"], False), best_path).to(device)
    previous = json.loads((output_dir / "metrics.json").read_text(encoding="utf-8"))
    expected = json.loads((output_dir / "frozen-decision.json").read_text(encoding="utf-8"))
    report = _finalize(model, config, manifest_path, manifest, parts, loader, device, output_dir,
                       previous.get("history", []), best_path, started, False, expected_frozen=expected)
    report["finalized_from_checkpoint"] = True
    (output_dir / "metrics.json").write_text(json.dumps(report, indent=2, default=float) + "\n", encoding="utf-8")
    log(f"finalized from {best_path.name}; test AUROC {report['test_report']['auroc']:.4f}")
    return report


def _pct(v):
    return "n/a" if v is None else f"{100 * v:.1f}%"


def render_retinal_card(report, manifest):
    t, f = report["test_report"], report["frozen"]
    gov = manifest.get("governance") or {}
    lines = [f"# Retinal research model card: {manifest['dataset_id']} / {f['architecture']}", ""]
    if report["synthetic"]:
        lines += ["> **Synthetic smoke run.** Generated shapes; verifies plumbing only.", ""]
    lines += ["> **Research only. Not a glaucoma diagnosis, not a screening device, not linked to IOP estimation.**"]
    if gov.get("commercial_use_permitted") is False:
        lines += ["> Trained on data licensed for **academic use only**: do not use it in a commercial product,",
                  "> public demo or website, and do not redistribute the weights or images."]
    ci = t.get("auroc_patient_bootstrap95") or [None, None]
    lines += ["", "| Field | Value |", "|---|---|",
              f"| Data | {manifest.get('source', manifest['dataset_id'])} |",
              f"| Citation | {manifest.get('citation', 'n/a')} |",
              f"| Labels | 0 = {manifest['label_mapping']['0']}; 1 = {manifest['label_mapping']['1']} |",
              f"| Partitions | {json.dumps(report['partitions'])} |",
              f"| Grouping | {json.dumps(manifest.get('grouping', 'patient_id'))} |",
              f"| Architecture | {f['architecture']}, ImageNet-pretrained start: {report['config'].get('pretrained')} |",
              f"| Preprocessing | {json.dumps(f['preprocessing'])} |",
              f"| Training | {len(report['history'])} epochs run; best validation AUROC epoch kept; device {report.get('device')} |",
              f"| Calibration | temperature {f['temperature']:.3f}, fitted on validation |",
              f"| Checkpoint SHA-256 | {report['checkpoint_sha256']} |", "",
              "## Test set (held out; thresholds frozen on validation)", "",
              "| Operating point | Threshold | Sensitivity (95% CI) | Specificity (95% CI) |", "|---|---|---|---|"]
    ops = [("primary: " + f["threshold_rule"], t)]
    if "test_report_secondary_operating_point" in report:
        ops.append((f"secondary: sensitivity >= {f['secondary_target_sensitivity']} on validation",
                    report["test_report_secondary_operating_point"]))
    for name, r in ops:
        s, sp = r["sensitivity_wilson95"], r["specificity_wilson95"]
        lines.append(f"| {name} | {r['threshold']:.3f} | {_pct(r['sensitivity'])} ({_pct(s[0])}-{_pct(s[1])}) | "
                     f"{_pct(r['specificity'])} ({_pct(sp[0])}-{_pct(sp[1])}) |")
    cm = t["confusion_matrix"]
    auc = (f"AUROC {t['auroc']:.3f} (group-bootstrap 95% CI {ci[0]:.3f}-{ci[1]:.3f})" if ci[0] is not None
           else f"AUROC {t['auroc']}")
    lines += ["", auc, "", f"Brier {t['brier']:.3f}; expected calibration error (10 bins) {t['ece_10bin']:.3f}", "",
              f"Confusion matrix (rows = truth, columns = prediction; order {cm['labels']}): {cm['rows_true_cols_pred']}",
              "", "## Limitations", "",
              "- Single-source dataset; no external site, camera or population was evaluated. Expect lower performance elsewhere.",
              "- No patient identifiers: same-eye repeats are grouped, but fellow eyes of one patient may span partitions,",
              "  which can inflate test results.",
              "- The positive class is LAG's 'suspicious glaucoma' label; the labelling protocol is not published in detail.",
              "- Test prevalence differs from screening populations; predictive values are not reported.",
              "- AUROC, sensitivity and specificity do not establish clinical usefulness; see docs/clinical/validation-plan.md.", ""]
    return "\n".join(lines)
