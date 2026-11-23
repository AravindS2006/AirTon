"""Training, temperature scaling, frozen-threshold evaluation and reporting."""

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
        ImageRows(rows, build_transforms(spec, train_mode)), batch_size=config["batch_size"], shuffle=train_mode,
        drop_last=False, num_workers=int(config.get("num_workers", 0)), pin_memory=device == "cuda",
        generator=torch.Generator().manual_seed(config["seed"]))
    train_loader, val_loader = loader(parts["train"], True), loader(parts["validation"], False)
    model = build_model(config["architecture"], config["pretrained"]).to(device)
    positives = sum(r["label"] for r in parts["train"])
    pos_weight = torch.tensor([(len(parts["train"]) - positives) / max(1, positives)], dtype=torch.float32,
                              device=device)
    scaler = torch.amp.GradScaler("cuda", enabled=use_amp)
    criterion = torch.nn.BCEWithLogitsLoss(pos_weight=pos_weight)
    history, best_auc, best_path, bad = [], -1.0, None, 0
    for epoch in range(config["epochs"]):
        trainable = set_backbone_trainable(model, epoch >= config["freeze_backbone_epochs"])
        optimizer = torch.optim.AdamW([p for p in model.parameters() if p.requires_grad], lr=config["learning_rate"],
                                      weight_decay=config["weight_decay"])
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
            seen += x.shape[0]
            total += float(loss) * x.shape[0]
        logits, labels, _ = evaluate(model, val_loader, device)
        val_auc = auroc(labels.astype(bool), 1 / (1 + np.exp(-logits)))
        history.append({"epoch": epoch, "train_loss": total / max(1, seen), "train_samples_processed": seen,
                        "trainable_parameters": trainable, "validation_auroc": val_auc})
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
    logits, labels, _ = evaluate(model, val_loader, device)
    temperature = fit_temperature(logits, labels)
    val_prob = 1 / (1 + np.exp(-logits / temperature))
    threshold = choose_threshold(val_prob, labels, config["threshold_rule"], config.get("target_sensitivity"))
    frozen = {"temperature": temperature, "threshold": threshold, "checkpoint": Path(best_path).name,
              "preprocessing": spec, "label_mapping": mapping, "architecture": config["architecture"]}
    (output_dir / "frozen-decision.json").write_text(json.dumps(frozen, indent=2) + "\n", encoding="utf-8")
    # Final test: evaluated once, after every choice above is frozen.
    test_loader = loader(parts["test"], False)
    t_logits, t_labels, t_index = evaluate(model, test_loader, device)
    t_prob = 1 / (1 + np.exp(-t_logits / temperature))
    patients = np.array([parts["test"][i]["patient_id"] for i in t_index])
    report = {"synthetic": manifest.get("synthetic") is True, "dataset_id": manifest["dataset_id"],
              "clinical_use": False, "partitions": {k: {"images": len(v), "patients": len({r['patient_id'] for r in v})}
                                                    for k, v in parts.items()},
              "history": history, "frozen": frozen, "device": device, "mixed_precision": use_amp,
              "validation_report": classification_report(val_prob, labels, np.array(
                  [parts["validation"][i]["patient_id"] for i in range(len(parts["validation"]))]), threshold, mapping,
                  bootstrap=0),
              "test_report": classification_report(t_prob, t_labels, patients, threshold, mapping,
                                                   bootstrap=config["bootstrap_replicates"], seed=config["seed"]),
              "duration_seconds": round(time.time() - started, 1),
              "limitations": "Research framework output. Not a glaucoma diagnosis and not linked to IOP estimation."}
    (output_dir / "metrics.json").write_text(json.dumps(report, indent=2, default=float) + "\n", encoding="utf-8")
    return report
