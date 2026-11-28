"""Select the retinal demo model on VALIDATION data and write a hash-verified demo package.

  python scripts/select_retinal_demo_model.py --manifest local-private/datasets/lag-v1/manifest.json \
      --run output/retinal-lag --run output/retinal-lag-convnext

Candidates: each trained run and the mean of all runs' calibrated probabilities.
The candidate with the best validation AUROC is chosen (ties: fewer members);
its threshold is frozen on validation (Youden). Test results are reported for
every candidate but never used for the choice. Checkpoints are copied into the
git-ignored models/weights/ folder next to retinal-demo-model.json.
"""

import argparse
import hashlib
import itertools
import json
from pathlib import Path
import shutil
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))


def main():
    import numpy as np
    from torch.utils.data import DataLoader

    from airton.ml.retinal.data import ImageRows, build_transforms, grouped_stratified_split, load_manifest
    from airton.ml.retinal.model import build_model
    from airton.ml.retinal.train import choose_threshold, classification_report, evaluate, load_checkpoint

    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--run", action="append", required=True)
    parser.add_argument("--out", default=str(ROOT / "models/weights/retinal-demo-model.json"))
    parser.add_argument("--card", default=str(ROOT / "artifacts/research/retinal-demo-model-selection.md"))
    args = parser.parse_args()
    manifest = load_manifest(args.manifest)
    runs = []
    for run in map(Path, args.run):
        frozen = json.loads((run / "frozen-decision.json").read_text(encoding="utf-8"))
        metrics = json.loads((run / "metrics.json").read_text(encoding="utf-8"))
        runs.append({"dir": run, "frozen": frozen, "config": metrics["config"],
                     "checkpoint": next(p for p in run.iterdir() if p.name.startswith("checkpoint."))})
    specs = {json.dumps(r["frozen"]["preprocessing"], sort_keys=True) for r in runs}
    seeds = {(r["config"]["seed"], json.dumps(r["config"]["split"], sort_keys=True)) for r in runs}
    if len(specs) != 1 or len(seeds) != 1:
        raise SystemExit("Runs must share preprocessing, seed and split to be compared or ensembled")
    spec = runs[0]["frozen"]["preprocessing"]
    config = runs[0]["config"]
    parts = grouped_stratified_split(manifest["images"], config["split"], config["seed"])
    probs = {}
    for r in runs:
        model = load_checkpoint(build_model(r["frozen"]["architecture"], False), r["checkpoint"]).eval()
        for part in ("validation", "test"):
            loader = DataLoader(ImageRows(parts[part], build_transforms(spec, False)), batch_size=32, num_workers=0)
            logits, labels, index = evaluate(model, loader)
            order = np.argsort(index)
            r.setdefault("prob", {})[part] = 1 / (1 + np.exp(-logits[order] / r["frozen"]["temperature"]))
            r.setdefault("labels", {})[part] = labels[order]
        print(f"evaluated {r['dir'].name}")
    groups = {p: np.array([row["patient_id"] for row in parts[p]]) for p in ("validation", "test")}
    labels = runs[0]["labels"]
    mapping = manifest["label_mapping"]
    candidates = []
    for k in range(1, len(runs) + 1):
        for combo in itertools.combinations(range(len(runs)), k):
            if k > 1 and k != len(runs):
                continue
            val = np.mean([runs[i]["prob"]["validation"] for i in combo], axis=0)
            test = np.mean([runs[i]["prob"]["test"] for i in combo], axis=0)
            threshold = choose_threshold(val, labels["validation"], "youden")
            candidates.append({
                "members": [runs[i]["frozen"]["architecture"] for i in combo], "index": combo, "threshold": threshold,
                "validation": classification_report(val, labels["validation"], groups["validation"], threshold, mapping, bootstrap=0),
                "test": classification_report(test, labels["test"], groups["test"], threshold, mapping, bootstrap=1000,
                                              seed=config["seed"])})
    chosen = max(candidates, key=lambda c: (round(c["validation"]["auroc"], 4), -len(c["index"])))
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    members = []
    for i in chosen["index"]:
        r = runs[i]
        digest = hashlib.sha256(r["checkpoint"].read_bytes()).hexdigest()
        name = f"retinal-{r['frozen']['architecture']}-{digest[:8]}{r['checkpoint'].suffix}"
        if (out.parent / name).resolve() != r["checkpoint"].resolve():
            shutil.copyfile(r["checkpoint"], out.parent / name)
        members.append({"architecture": r["frozen"]["architecture"], "checkpoint": name, "sha256": digest,
                        "temperature": r["frozen"]["temperature"], "source_run": r["dir"].name})
    # Out-of-distribution statistics from the first member's embeddings: PCA + shrinkage Mahalanobis
    # fitted on training images; threshold = 99.5th percentile of validation distances.
    from airton.ml.retinal.inference import embed_and_logit, ood_distance, ood_residual
    import torch

    first = runs[chosen["index"][0]]
    model = load_checkpoint(build_model(first["frozen"]["architecture"], False), first["checkpoint"]).eval()
    def embeddings(rows):
        loader = DataLoader(ImageRows(rows, build_transforms(spec, False)), batch_size=32, num_workers=0)
        return np.concatenate([embed_and_logit(model, x)[0] for x, _, _ in loader])
    rng = np.random.default_rng(config["seed"])
    train_rows = [parts["train"][i] for i in sorted(rng.choice(len(parts["train"]), min(1500, len(parts["train"])), replace=False))]
    E = embeddings(train_rows)
    mean = E.mean(axis=0)
    _, _, vt = np.linalg.svd(E - mean, full_matrices=False)
    components = vt[:32]
    Z = (E - mean) @ components.T
    cov = np.cov(Z, rowvar=False)
    cov = 0.9 * cov + 0.1 * np.eye(cov.shape[0]) * np.trace(cov) / cov.shape[0]
    ood = {"mean": mean, "components": components, "precision": np.linalg.inv(cov)}
    val_e, test_e = embeddings(parts["validation"]), embeddings(parts["test"])
    val_d, test_d = ood_distance(ood, val_e), ood_distance(ood, test_e)
    val_r, test_r = ood_residual(ood, val_e), ood_residual(ood, test_e)
    ood_threshold = float(np.quantile(val_d, 0.997, method="higher"))
    residual_threshold = float(np.quantile(val_r, 0.997, method="higher"))
    flagged = (test_d > ood_threshold) | (test_r > residual_threshold)
    ood_path = out.parent / "retinal-demo-ood.npz"
    with ood_path.open("wb") as handle:
        np.savez(handle, **ood)
    ood_entry = {"file": ood_path.name, "sha256": hashlib.sha256(ood_path.read_bytes()).hexdigest(),
                 "threshold": ood_threshold, "residual_threshold": residual_threshold,
                 "method": "PCA-32 shrinkage Mahalanobis plus out-of-subspace residual on penultimate embedding; "
                           "each threshold at the 99.7th validation percentile",
                 "test_flag_rate": float(np.mean(flagged))}
    print(f"OOD threshold {ood_threshold:.2f}; test images flagged {ood_entry['test_flag_rate']:.3%}")
    content = hashlib.sha256("".join(m["sha256"] for m in members).encode() + str(chosen["threshold"]).encode()
                             + ood_entry["sha256"].encode()).hexdigest()
    gov = manifest.get("governance") or {}
    package = {
        "format": "airton-retinal-demo/1", "model_id": f"retinal-demo-{content[:12]}", "clinical_use": False,
        "members": members, "combination": "mean of temperature-calibrated probabilities",
        "threshold": chosen["threshold"], "threshold_rule": "Youden on validation", "preprocessing": spec,
        "label_mapping": mapping, "dataset_id": manifest["dataset_id"], "citation": manifest.get("citation"),
        "licence": {"commercial_use_permitted": gov.get("commercial_use_permitted"),
                    "redistribution_permitted": gov.get("redistribution_permitted"),
                    "permission": gov.get("approval_reference")},
        "disclaimer": ("College research demonstration. Not a medical device, diagnosis or screening result. "
                       "Trained on the LAG database under academic-use permission; weights are not distributed."),
        "selection": {"metric": "validation AUROC", "validation_auroc": chosen["validation"]["auroc"]},
        "ood": ood_entry,
        "test_report": chosen["test"],
    }
    out.write_text(json.dumps(package, indent=2, default=float) + "\n", encoding="utf-8")
    lines = [f"# Retinal demo model selection: {package['model_id']}", "",
             "> Research demonstration only. Selection used validation data; test results are reported once per candidate",
             "> and were not used to choose. Academic-use data (LAG); not for commercial use.", "",
             "| Candidate | Validation AUROC | Test AUROC (group-bootstrap 95% CI) | Test sensitivity | Test specificity | Chosen |",
             "|---|---|---|---|---|---|"]
    for c in candidates:
        t, ci = c["test"], c["test"].get("auroc_patient_bootstrap95") or [float("nan")] * 2
        lines.append(f"| {' + '.join(c['members'])} | {c['validation']['auroc']:.4f} | {t['auroc']:.4f} ({ci[0]:.3f}-{ci[1]:.3f}) | "
                     f"{100 * t['sensitivity']:.1f}% | {100 * t['specificity']:.1f}% | {'yes' if c is chosen else ''} |")
    lines += ["", f"Threshold {chosen['threshold']:.3f} (Youden, validation). Members: "
              + ", ".join(f"{m['architecture']} (T={m['temperature']:.3f}, sha256 {m['sha256'][:16]}...)" for m in members),
              "", "Same limitations as the individual model cards: single source, no external test, possible fellow-eye leakage.", ""]
    Path(args.card).write_text("\n".join(lines), encoding="utf-8", newline="\n")
    print(json.dumps({"chosen": chosen["members"], "validation_auroc": chosen["validation"]["auroc"],
                      "test_auroc": chosen["test"]["auroc"], "package": str(out)}, indent=1))


if __name__ == "__main__":
    main()
