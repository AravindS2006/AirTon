"""Build a governed, preprocessed retinal manifest from the locally supplied LAG copy.

  python scripts/build_retinal_manifest.py --lag "LAG Dataset" --out local-private/datasets/lag-v1

Writes re-encoded images (field-of-view crop, square pad, 256 px, no metadata)
and manifest.json into an ignored folder. Nothing is downloaded or uploaded.

LAG terms (AG-CNN README, read 2026-11-23): academic use only, other usage
refused, no re-upload to the internet; cite Li et al., CVPR 2019. A model
trained on it is research-only and must not ship in a commercial product.

LAG has no patient identifiers. Repeat captures of the same eye are grouped by
green-channel thumbnail correlation (>= 0.985, chosen after visual review), and
groups never cross partitions. Fellow eyes of one patient cannot be detected.
Groups whose images carry conflicting labels are excluded and listed.
"""

import argparse
import hashlib
import json
from pathlib import Path

import sys

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
from airton.ml.retinal.data import PREPARED_SIZE, prepare_fundus  # noqa: E402  (same code as inference)
CLASSES = (("non_glaucoma", 0), ("suspicious_glaucoma", 1))
DUPLICATE_CORRELATION = 0.985
SIZE = PREPARED_SIZE


def thumb(img, n=64):
    g = np.asarray(img.resize((n, n), Image.BILINEAR), dtype=np.float32)[:, :, 1].ravel()
    g -= g.mean()
    return g / (np.linalg.norm(g) + 1e-6)


def groups_from_similarity(T, threshold):
    parent = list(range(len(T)))

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    for start in range(0, len(T), 512):
        block = T[start:start + 512] @ T.T
        for a, b in zip(*np.nonzero(block >= threshold)):
            i, j = start + int(a), int(b)
            if i < j:
                parent[find(i)] = find(j)
    return [find(i) for i in range(len(T))]


def build(src, out, permission=None):
    src, out = Path(src), Path(out)
    if not (out.resolve().is_relative_to(ROOT / "local-private") or not out.resolve().is_relative_to(ROOT)):
        raise SystemExit("Write the processed dataset to local-private/ or outside the repository")
    (out / "images").mkdir(parents=True, exist_ok=True)
    rows, thumbs = [], []
    for folder, label in CLASSES:
        for path in sorted((src / folder / "image").glob("*.jpg")):
            stated = (src / folder / "label" / f"{path.stem}.txt").read_text().strip()
            if stated != str(label):
                raise ValueError(f"Label file disagrees with folder for {path}")
            raw = path.read_bytes()
            with Image.open(path) as im:
                rgb = im.convert("RGB")
                original_size = list(rgb.size)
                processed = prepare_fundus(rgb)
            name = f"images/lag-{label}-{path.stem}.png"
            processed.save(out / name, optimize=True)  # re-encode drops EXIF/metadata
            thumbs.append(thumb(processed))
            rows.append({"image_path": name, "label": label, "eye": "unknown", "site": "LAG",
                         "source_file": f"{folder}/image/{path.name}", "source_sha256": hashlib.sha256(raw).hexdigest(),
                         "original_size": original_size,
                         "has_attention_map": (src / folder / "attention_map" / path.name).is_file()})
    roots = groups_from_similarity(np.stack(thumbs), DUPLICATE_CORRELATION)
    members = {}
    for row, r in zip(rows, roots):
        members.setdefault(r, []).append(row)
    excluded, kept = [], []
    for k, (r, group) in enumerate(sorted(members.items(), key=lambda kv: kv[1][0]["source_file"])):
        gid = f"lag-group-{k:05d}"
        if len({g["label"] for g in group}) > 1:
            excluded += [{"source_file": g["source_file"], "label": g["label"], "reason": "conflicting labels within duplicate group"} for g in group]
            continue
        for g in group:
            g["patient_id"] = gid  # surrogate: same-eye repeat group, not a verified patient identity
            kept.append(g)
    multi = sum(1 for g in members.values() if len(g) > 1)
    manifest = {
        "dataset_id": "lag-v1-local", "synthetic": False, "evidence_level": "public-research-dataset",
        "source": "LAG database (Li et al., CVPR 2019), first public part, supplied locally by the founder",
        "citation": "Li L, Xu M, Wang X, Jiang L, Liu H. Attention Based Glaucoma Detection: A Large-Scale Database and CNN Model. CVPR 2019.",
        "governance": {
            "approval_reference": permission or "Founder instruction 2026-11-23: train the AirTon retinal research model on the supplied LAG copy (academic research use)",
            "data_use_terms_reviewed": "AG-CNN README read 2026-11-23: academic use only, other usage refused; re-upload to the internet not allowed",
            "direct_identifiers_removed": "Public de-identified images with numeric file names; re-encoded without metadata",
            "storage_location_approved": "Git-ignored local-private on the developer workstation; not uploaded; institutional confirmation pending",
            "commercial_use_permitted": False, "redistribution_permitted": False,
        },
        "label_mapping": {"0": "non-glaucoma (LAG negative)", "1": "suspicious glaucoma (LAG positive)"},
        "grouping": {"method": "green-channel 64px thumbnail correlation, connected components", "threshold": DUPLICATE_CORRELATION,
                     "unit": "same-eye repeat group (surrogate for patient)", "groups_with_repeats": multi,
                     "limitation": "fellow eyes of one patient are not linked; patient-level leakage cannot be excluded"},
        "preprocessing": {"crop": "field-of-view bounding box (red > 15)", "pad": "square, black", "size": SIZE, "format": "PNG"},
        "counts": {"source_images": len(rows), "kept": len(kept), "excluded": len(excluded),
                   "kept_by_label": {str(l): sum(r["label"] == l for r in kept) for l in (0, 1)}},
        "excluded": excluded, "images": kept,
    }
    (out / "manifest.json").write_text(json.dumps(manifest, indent=1) + "\n", encoding="utf-8")
    return manifest


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--lag", default="LAG Dataset")
    parser.add_argument("--out", default="local-private/datasets/lag-v1")
    parser.add_argument("--permission", default=None, help="reference to written permission from the LAG authors")
    args = parser.parse_args()
    manifest = build(args.lag, args.out, args.permission)
    print(json.dumps(manifest["counts"] | {"groups_with_repeats": manifest["grouping"]["groups_with_repeats"]}, indent=1))


if __name__ == "__main__":
    main()
