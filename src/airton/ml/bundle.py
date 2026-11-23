"""Hash-verified model bundle: JSON and NPZ files only, never pickle.

Layout: bundle.json (manifest with per-file SHA-256) plus component files.
Loading refuses missing, altered, unlisted or pickle-capable files.
"""

import hashlib
import json
from pathlib import Path

import numpy as np

FORMAT = "airton-iop-bundle/1"
ALLOWED_SUFFIXES = {".json", ".npz"}


def _sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def _dump(obj):
    return (json.dumps(obj, indent=1, sort_keys=True, allow_nan=False) + "\n").encode()


def save_bundle(directory, manifest, json_parts, npz_parts):
    directory = Path(directory)
    directory.mkdir(parents=True, exist_ok=True)
    for stale in directory.iterdir():
        if stale.is_file():
            stale.unlink()
    files = {}
    for name, obj in sorted(json_parts.items()):
        path = directory / f"{name}.json"
        path.write_bytes(_dump(obj))
        files[path.name] = _sha256(path)
    for name, arrays in sorted(npz_parts.items()):
        path = directory / f"{name}.npz"
        with path.open("wb") as handle:
            np.savez(handle, **{k: np.asarray(v) for k, v in sorted(arrays.items())})
        files[path.name] = _sha256(path)
    content = hashlib.sha256("".join(f"{k}:{v};" for k, v in sorted(files.items())).encode()).hexdigest()
    model_id = f"demo-iop-{content[:12]}"
    full = {**manifest, "format": FORMAT, "model_id": model_id, "content_sha256": content, "files": files}
    (directory / "bundle.json").write_bytes(_dump(full))
    return full


def load_bundle(directory):
    directory = Path(directory)
    manifest = json.loads((directory / "bundle.json").read_text(encoding="utf-8"))
    if manifest.get("format") != FORMAT:
        raise ValueError("Unsupported bundle format")
    if manifest.get("synthetic") is not True or manifest.get("clinical_use") is not False:
        raise ValueError("Only synthetic, non-clinical bundles are supported by this release")
    files = manifest.get("files", {})
    present = {p.name for p in directory.iterdir() if p.is_file()} - {"bundle.json"}
    if present != set(files):
        raise ValueError("Bundle directory contains unlisted or missing files")
    content = hashlib.sha256("".join(f"{k}:{v};" for k, v in sorted(files.items())).encode()).hexdigest()
    if content != manifest.get("content_sha256") or manifest.get("model_id") != f"demo-iop-{content[:12]}":
        raise ValueError("Bundle identity does not match its file hashes")
    parts = {}
    for name, digest in files.items():
        path = directory / name
        if path.suffix not in ALLOWED_SUFFIXES:
            raise ValueError(f"Disallowed bundle file type: {name}")
        if _sha256(path) != digest:
            raise ValueError(f"Bundle file hash mismatch: {name}")
        if path.suffix == ".json":
            parts[path.stem] = json.loads(path.read_text(encoding="utf-8"))
        else:
            with np.load(path, allow_pickle=False) as data:
                parts[path.stem] = {k: data[k] for k in data.files}
    return manifest, parts
