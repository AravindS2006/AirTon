"""Deterministic acquisition rules that run before any learned model.

Limits come from configuration. The defaults in ml/configs are synthetic
development settings, not approved safety or clinical limits.
"""

import math

# Reasons shared with the measurement contract (airton.contracts.REASONS).
RULE_ORDER = ("clock_untrusted", "calibration_expired", "signal_missing", "alignment", "blink", "signal_quality")


def rule_reasons(features, diagnostics, metadata, limits):
    """Return the sorted list of rule-based rejection reasons (empty when all pass)."""
    reasons = set()
    if metadata.get("clock_status") != "trusted":
        reasons.add("clock_untrusted")
    if metadata.get("calibration_expired") is not False:
        reasons.add("calibration_expired")
    if not diagnostics.get("events_found"):
        reasons.add("signal_missing")
    lateral, axial = features["alignment_lateral_mm"], features["alignment_axial_mm"]
    if not (math.isfinite(lateral) and math.isfinite(axial)) or abs(lateral) > limits["max_lateral_mm"] \
            or abs(axial) > limits["max_axial_mm"]:
        reasons.add("alignment")
    if features["broad_fraction"] > limits["max_broad_fraction"]:
        reasons.add("blink")
    if features["saturation_fraction"] > limits["max_saturation_fraction"]:
        reasons.add("signal_quality")
    snr = features["snr_min"]
    if diagnostics.get("events_found") and not (math.isfinite(snr) and snr >= limits["min_snr"]):
        reasons.add("signal_quality")
    return sorted(reasons)
