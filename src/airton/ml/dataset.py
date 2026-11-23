"""On-disk acquisition dataset format shared by synthetic and future bench data.

A dataset directory holds:
  dataset-manifest.json  governance, provenance and sampling description
  waveforms.npz          float32 arrays 'pressure' and 'optical' (n, N_SAMPLES); no pickle
  metadata.json          list of per-acquisition device-visible metadata

Non-synthetic data are refused unless the manifest governance block records an
approval reference, reviewed data-use terms and the absence of direct
identifiers. Storing real data in this repository remains prohibited; point the
loader at approved storage instead.
"""

import hashlib
import json
from pathlib import Path

import numpy as np

from .acquisition import N_SAMPLES, SAMPLE_RATE_HZ

REQUIRED_META = ("measurement_id", "subject_id", "session_id", "eye", "device_id", "domain", "calibration_id",
                 "calibration_gain", "calibration_offset_mmhg", "calibration_expired", "clock_status",
                 "captured_at", "alignment_lateral_mm", "alignment_axial_mm", "raw_sha256")
LABEL_FIELDS = ("reference_iop_mmhg", "artifact_label")


def dataset_sha256(pressure, optical, meta):
    digest = hashlib.sha256()
    digest.update(np.ascontiguousarray(pressure, dtype="<f4").tobytes())
    digest.update(np.ascontiguousarray(optical, dtype="<f4").tobytes())
    digest.update(json.dumps(meta, sort_keys=True, allow_nan=False).encode())
    return digest.hexdigest()


def check_governance(manifest):
    if manifest.get("synthetic") is True:
        return
    gov = manifest.get("governance") or {}
    missing = [k for k in ("approval_reference", "data_use_terms_reviewed", "direct_identifiers_removed",
                           "storage_location_approved") if not gov.get(k)]
    if missing:
        raise PermissionError("Real dataset refused; governance fields incomplete: " + ", ".join(missing))


def save_dataset(directory, cohort, description):
    directory = Path(directory)
    directory.mkdir(parents=True, exist_ok=True)
    with (directory / "waveforms.npz").open("wb") as handle:
        np.savez(handle, pressure=cohort["pressure"].astype("<f4"), optical=cohort["optical"].astype("<f4"))
    (directory / "metadata.json").write_text(json.dumps(cohort["meta"], indent=0, allow_nan=False) + "\n",
                                             encoding="utf-8", newline="\n")
    manifest = {"synthetic": True, "evidence_level": "synthetic-generated", "description": description,
                "simulator_version": cohort.get("simulator_version"), "sample_rate_hz": SAMPLE_RATE_HZ,
                "n_samples": N_SAMPLES, "n_acquisitions": len(cohort["meta"]),
                "dataset_sha256": dataset_sha256(cohort["pressure"], cohort["optical"], cohort["meta"])}
    (directory / "dataset-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8", newline="\n")
    return manifest


def load_dataset(directory):
    directory = Path(directory)
    manifest = json.loads((directory / "dataset-manifest.json").read_text(encoding="utf-8"))
    check_governance(manifest)
    if manifest.get("sample_rate_hz") != SAMPLE_RATE_HZ or manifest.get("n_samples") != N_SAMPLES:
        raise ValueError("Dataset sampling does not match feature set iop-features-1")
    with np.load(directory / "waveforms.npz", allow_pickle=False) as data:
        pressure, optical = data["pressure"].astype(np.float32), data["optical"].astype(np.float32)
    meta = json.loads((directory / "metadata.json").read_text(encoding="utf-8"))
    if pressure.shape != optical.shape or pressure.shape != (len(meta), N_SAMPLES):
        raise ValueError("Waveform arrays and metadata disagree in shape")
    for m in meta:
        missing = [k for k in REQUIRED_META + LABEL_FIELDS if k not in m]
        if missing:
            raise ValueError(f"{m.get('measurement_id')}: missing fields {missing}")
    if dataset_sha256(pressure, optical, meta) != manifest["dataset_sha256"]:
        raise ValueError("Dataset hash mismatch")
    return {"pressure": pressure, "optical": optical, "meta": meta, "manifest": manifest}
