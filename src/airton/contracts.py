"""Strict synthetic measurement contract shared by CLI, store, and API."""

from datetime import datetime
import math
import re

FIELDS = {
    "schema_version", "measurement_id", "session_id", "subject_id", "device_id",
    "eye", "captured_at", "synthetic", "quality_status", "quality_reasons",
    "iop_estimate_mmhg", "calibration_id", "model_id", "firmware_version",
    "raw_sha256", "clock_status",
}
ID_FIELDS = ("measurement_id", "session_id", "subject_id", "device_id", "calibration_id", "model_id")
ID_PATTERN = re.compile(r"demo-[A-Za-z0-9_-]{1,80}\Z")
REASONS = {"alignment", "blink", "signal_missing", "calibration_expired", "clock_untrusted"}


def validate_measurement(value):
    """Return a normalized copy, rejecting PHI-shaped extras and inconsistent results.

    The numerical range is a demo transport bound, not a validated measurement
    range, reference interval, or referral criterion.
    """
    if not isinstance(value, dict) or set(value) != FIELDS:
        raise ValueError("Record must contain exactly the documented measurement fields")
    if value["schema_version"] != "1.0" or value["synthetic"] is not True:
        raise ValueError("Only schema 1.0 synthetic records are supported")
    for key in ID_FIELDS:
        if not isinstance(value[key], str) or not ID_PATTERN.fullmatch(value[key]):
            raise ValueError(f"{key} must be a bounded demo-prefixed identifier")
    if value["eye"] not in ("OD", "OS"):
        raise ValueError("eye must be OD (right) or OS (left)")
    timestamp = value["captured_at"]
    if not isinstance(timestamp, str) or len(timestamp) > 40 or not re.fullmatch(
        r"[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]+)?(?:Z|[+-][0-9]{2}:[0-9]{2})", timestamp
    ):
        raise ValueError("captured_at must be an ISO-8601 timestamp with timezone")
    try:
        parsed = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValueError("Invalid captured_at") from exc
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        raise ValueError("Timestamp timezone is required")
    if value["clock_status"] not in ("trusted", "untrusted"):
        raise ValueError("Invalid clock_status")
    if value["quality_status"] not in ("pass", "reject"):
        raise ValueError("Invalid quality_status")
    reasons = value["quality_reasons"]
    if not isinstance(reasons, list) or any(not isinstance(r, str) or r not in REASONS for r in reasons):
        raise ValueError("Invalid quality_reasons")
    if len(reasons) != len(set(reasons)):
        raise ValueError("Duplicate quality reason")
    pressure = value["iop_estimate_mmhg"]
    if value["quality_status"] == "reject":
        if pressure is not None or not reasons:
            raise ValueError("Rejected acquisition must have reasons and a null estimate")
    else:
        if reasons or value["clock_status"] != "trusted":
            raise ValueError("Passing acquisition requires trusted clock and no rejection reasons")
        if type(pressure) not in (int, float) or not math.isfinite(pressure) or not 0 < pressure <= 100:
            raise ValueError("Estimate must be a finite demo value in (0, 100]")
    if value["clock_status"] == "untrusted" and "clock_untrusted" not in reasons:
        raise ValueError("Untrusted clock requires clock_untrusted rejection reason")
    if not isinstance(value["raw_sha256"], str) or not re.fullmatch(r"[0-9a-f]{64}", value["raw_sha256"]):
        raise ValueError("raw_sha256 must be 64 lowercase hexadecimal characters")
    if not isinstance(value["firmware_version"], str) or not re.fullmatch(r"demo-[0-9]+\.[0-9]+\.[0-9]+", value["firmware_version"]):
        raise ValueError("Invalid demo firmware version")
    return {**value, "quality_reasons": sorted(reasons)}
