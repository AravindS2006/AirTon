"""Governed manifests, patient-grouped splits and preprocessing for retinal research."""

import json
from pathlib import Path

import numpy as np

from ..dataset import check_governance

IMAGENET_MEAN, IMAGENET_STD = (0.485, 0.456, 0.406), (0.229, 0.224, 0.225)


def load_manifest(path):
    """Manifest JSON: dataset_id, synthetic, governance, label_mapping {"0": name, "1": name}, images[]."""
    path = Path(path)
    manifest = json.loads(path.read_text(encoding="utf-8"))
    check_governance(manifest)
    mapping = manifest.get("label_mapping")
    if not isinstance(mapping, dict) or set(mapping) != {"0", "1"}:
        raise ValueError("label_mapping must define exactly labels '0' and '1'")
    rows = manifest.get("images") or []
    required = {"image_path", "patient_id", "eye", "label"}
    for row in rows:
        if not required <= set(row) or row["label"] not in (0, 1) or row["eye"] not in ("OD", "OS", "unknown"):
            raise ValueError(f"Invalid manifest row: {row}")
        row["resolved_path"] = str((path.parent / row["image_path"]).resolve())
    return manifest


def grouped_stratified_split(rows, fractions, seed):
    """Partition by patient (both eyes together), stratified by the patient's highest label."""
    if abs(sum(fractions.values()) - 1) > 1e-9:
        raise ValueError("Fractions must sum to 1")
    patients = {}
    for row in rows:
        patients[row["patient_id"]] = max(patients.get(row["patient_id"], 0), row["label"])
    rng = np.random.default_rng(seed)
    assignment = {}
    names = list(fractions)
    for label in (0, 1):
        group = sorted(p for p, l in patients.items() if l == label)
        group = list(rng.permutation(group)) if group else []
        start = 0
        for i, name in enumerate(names):
            end = len(group) if i == len(names) - 1 else start + int(round(fractions[name] * len(group)))
            for p in group[start:end]:
                assignment[p] = name
            start = end
    return {name: [r for r in rows if assignment[r["patient_id"]] == name] for name in names}


def crop_box(width, height, x, y, half):
    """Square crop around (x, y) clamped to the image (fixes unchecked negative bounds)."""
    half = max(1, int(half))
    left, top = max(0, int(x) - half), max(0, int(y) - half)
    right, bottom = min(width, int(x) + half), min(height, int(y) + half)
    if right <= left or bottom <= top:
        raise ValueError("Crop is empty after clamping")
    return left, top, right, bottom


def preprocessing_spec(image_size, pretrained):
    """Single preprocessing definition saved with every checkpoint and reused at inference."""
    mean, std = (IMAGENET_MEAN, IMAGENET_STD) if pretrained else ((0.5, 0.5, 0.5), (0.25, 0.25, 0.25))
    return {"resize": int(image_size * 1.143), "center_crop": int(image_size), "mean": list(mean), "std": list(std),
            "colour": "RGB", "annotation_dependent_crop": False}


def build_transforms(spec, train):
    from torchvision import transforms as T

    norm = [T.ToTensor(), T.Normalize(spec["mean"], spec["std"])]
    if train:
        return T.Compose([T.RandomResizedCrop(spec["center_crop"], scale=(0.8, 1.0), ratio=(0.95, 1.05)),
                          T.RandomHorizontalFlip(), T.ColorJitter(0.15, 0.15, 0.1, 0.02), *norm])
    return T.Compose([T.Resize(spec["resize"]), T.CenterCrop(spec["center_crop"]), *norm])


class ImageRows:
    """Minimal torch-compatible dataset over manifest rows."""

    def __init__(self, rows, transform):
        self.rows, self.transform = rows, transform

    def __len__(self):
        return len(self.rows)

    def __getitem__(self, i):
        from PIL import Image

        row = self.rows[i]
        with Image.open(row["resolved_path"]) as img:
            x = self.transform(img.convert("RGB"))
        return x, float(row["label"]), i


def write_synthetic_shapes(directory, n_patients=40, size=96, seed=0):
    """Write a tiny SYNTHETIC shapes dataset (not fundus images) for pipeline smoke tests.

    A bright disc with a darker inner circle whose relative size depends on the
    label. It verifies plumbing only and carries no clinical meaning.
    """
    from PIL import Image, ImageDraw

    directory = Path(directory)
    (directory / "images").mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(seed)
    rows = []
    for p in range(n_patients):
        label = int(p % 2)
        for eye in ("OD", "OS"):
            img = Image.new("RGB", (size, size), tuple(int(v) for v in rng.integers(60, 90, 3)))
            draw = ImageDraw.Draw(img)
            cx, cy = rng.integers(size // 3, 2 * size // 3, 2)
            r = int(size * rng.uniform(0.14, 0.2))
            inner = int(r * (rng.uniform(0.55, 0.75) if label else rng.uniform(0.2, 0.4)))
            draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(235, 200, 120))
            draw.ellipse([cx - inner, cy - inner, cx + inner, cy + inner], fill=(250, 240, 210))
            name = f"images/demo-p{p:03d}-{eye}.png"
            img.save(directory / name)
            rows.append({"image_path": name, "patient_id": f"demo-p{p:03d}", "eye": eye, "label": label,
                         "site": "synthetic"})
    manifest = {"dataset_id": "synthetic-shapes", "synthetic": True, "evidence_level": "synthetic-generated",
                "label_mapping": {"0": "class-0 (synthetic small inner circle)",
                                  "1": "class-1 (synthetic large inner circle)"},
                "note": "Generated shapes for software tests; not retinal images.", "images": rows}
    path = directory / "manifest.json"
    path.write_text(json.dumps(manifest, indent=1) + "\n", encoding="utf-8")
    return path
