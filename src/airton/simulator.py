"""Deterministic fictional acquisitions; no physical pressure waveform model."""

from datetime import datetime, timedelta, timezone
import hashlib
import json
import random

from .contracts import validate_measurement


def simulate(count=12, seed=42):
    if type(count) is not int or not 1 <= count <= 10000:
        raise ValueError("count must be between 1 and 10000")
    rng = random.Random(seed)
    start = datetime(2026, 10, 4, 9, 0, tzinfo=timezone.utc)
    records, raw = [], {}
    for index in range(count):
        measurement_id = f"demo-m-{seed}-{index:04d}"
        signal = {"synthetic": True, "measurement_id": measurement_id,
                  "arbitrary_samples": [round(rng.uniform(0, 1), 6) for _ in range(16)]}
        blob = json.dumps(signal, sort_keys=True, separators=(",", ":")).encode()
        rejected = index % 6 == 5
        record = {
            "schema_version": "1.0", "measurement_id": measurement_id,
            "session_id": f"demo-session-{index // 4:03d}",
            "subject_id": f"demo-subject-{index // 4:03d}",
            "device_id": "demo-device-001", "eye": "OD" if index % 2 == 0 else "OS",
            "captured_at": (start + timedelta(minutes=index)).isoformat(),
            "synthetic": True, "quality_status": "reject" if rejected else "pass",
            "quality_reasons": ["blink"] if rejected else [],
            "iop_estimate_mmhg": None if rejected else round(rng.uniform(12, 26), 2),
            "calibration_id": "demo-calibration-001", "model_id": "demo-no-clinical-model",
            "firmware_version": "demo-0.1.0", "raw_sha256": hashlib.sha256(blob).hexdigest(),
            "clock_status": "trusted",
        }
        records.append(validate_measurement(record))
        raw[measurement_id] = blob
    return records, raw
