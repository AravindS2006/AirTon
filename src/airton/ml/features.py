"""Signal conditioning and applanation-event features (feature set iop-features-1).

Inputs are a raw pressure channel (mmHg before calibration), a raw optical
channel (0..1 ADC fraction) and device-visible metadata. Ground-truth fields
are never read here.
"""

import math

import numpy as np
from scipy.signal import butter, find_peaks, peak_widths, sosfiltfilt

from .acquisition import DT_MS, N_SAMPLES, SAMPLE_RATE_HZ, TIME_MS

FEATURE_NAMES = (
    "p1_mmhg", "p2_mmhg", "p_mean_mmhg", "p_diff_mmhg", "t1_ms", "t2_ms", "dt_ms",
    "p_peak_mmhg", "t_peak_ms", "pulse_fwhm_ms", "dpdt_t1", "dpdt_t2", "amp1", "amp2",
    "amp_ratio", "width1_ms", "width2_ms", "snr_min", "n_candidate_peaks", "baseline_level",
    "flicker_rms", "noise_mad", "saturation_fraction", "broad_fraction",
    "alignment_lateral_mm", "alignment_axial_mm",
)
# Interpretable physics baseline: applanation pressures, hysteresis and alignment.
PHYSICS_FEATURES = ("p1_mmhg", "p2_mmhg", "p_diff_mmhg", "alignment_lateral_mm", "alignment_axial_mm")
MIN_STIMULUS_MMHG = 5.0  # below this the pulse is treated as absent (synthetic development setting)
_LOWPASS = butter(4, 2500, fs=SAMPLE_RATE_HZ, output="sos")
_PRESSURE_SMOOTH = butter(2, 1500, fs=SAMPLE_RATE_HZ, output="sos")


def _design_matrix():
    t = TIME_MS / 1000.0
    cols = [np.ones_like(t), t - t.mean()]
    for f in (100.0, 200.0):
        cols += [np.sin(2 * np.pi * f * t), np.cos(2 * np.pi * f * t)]
    return np.stack(cols, axis=1)


_DESIGN = _design_matrix()


def condition_optical(optical):
    """Remove offset, drift and mains flicker by robust least squares, then low-pass."""
    x = np.asarray(optical, dtype=float)
    weights = np.ones_like(x)
    coef = np.zeros(_DESIGN.shape[1])
    for _ in range(3):
        w = np.sqrt(weights)
        coef, *_ = np.linalg.lstsq(_DESIGN * w[:, None], x * w, rcond=None)
        residual = x - _DESIGN @ coef
        mad = np.median(np.abs(residual - np.median(residual))) + 1e-9
        weights = (np.abs(residual) < 3.0 * 1.4826 * mad).astype(float) + 1e-3
    cleaned = sosfiltfilt(_LOWPASS, x - _DESIGN @ coef)
    flicker_rms = float(np.sqrt(0.5 * np.sum(coef[2:] ** 2)))
    return cleaned, float(coef[0]), flicker_rms


def _parabolic(y, i):
    if 0 < i < len(y) - 1:
        denom = y[i - 1] - 2 * y[i] + y[i + 1]
        if denom != 0:
            return float(np.clip(0.5 * (y[i - 1] - y[i + 1]) / denom, -0.5, 0.5))
    return 0.0


def calibrated_pressure(pressure_raw, metadata):
    gain, offset = float(metadata["calibration_gain"]), float(metadata["calibration_offset_mmhg"])
    if not (0.5 < gain < 2.0 and math.isfinite(offset)):
        raise ValueError("Calibration coefficients outside plausible range")
    return (np.asarray(pressure_raw, dtype=float) - offset) / gain


def extract_features(pressure_raw, optical_raw, metadata):
    """Return (features dict holding every FEATURE_NAMES key, diagnostics dict).

    Missing applanation events produce NaN event features and
    diagnostics["events_found"] = False; quality rules turn that into a rejection.
    """
    p = np.asarray(pressure_raw, dtype=float)
    o = np.asarray(optical_raw, dtype=float)
    if p.shape != (N_SAMPLES,) or o.shape != (N_SAMPLES,):
        raise ValueError(f"Expected {N_SAMPLES}-sample pressure and optical channels")
    if not (np.isfinite(p).all() and np.isfinite(o).all()):
        raise ValueError("Raw channels must be finite")
    p_smooth = sosfiltfilt(_PRESSURE_SMOOTH, calibrated_pressure(p, metadata))
    i_peak = int(np.argmax(p_smooth))
    # A missing or failed stimulus (flat channel) yields no pulse width and no events.
    stimulus = p_smooth[i_peak] > MIN_STIMULUS_MMHG
    above = np.nonzero(p_smooth >= p_smooth[i_peak] / 2.0)[0] if stimulus else np.array([], dtype=int)
    cleaned, baseline, flicker_rms = condition_optical(o)
    noise_mad = float(1.4826 * np.median(np.abs(np.diff(cleaned))) / math.sqrt(2) + 1e-6)
    saturation = float(np.mean(o >= 0.999))
    broad = np.convolve(o - np.percentile(o, 5), np.ones(50) / 50.0, mode="same")
    broad_fraction = float(np.mean(broad > 0.25))
    peaks, props = find_peaks(cleaned, prominence=max(6.0 * noise_mad, 0.02), distance=8)
    f = {name: float("nan") for name in FEATURE_NAMES}
    f.update({"p_peak_mmhg": float(p_smooth[i_peak]), "t_peak_ms": float(i_peak * DT_MS),
              "pulse_fwhm_ms": float((above[-1] - above[0]) * DT_MS) if above.size else float("nan"),
              "n_candidate_peaks": float(len(peaks)), "baseline_level": baseline,
              "flicker_rms": flicker_rms, "noise_mad": noise_mad, "saturation_fraction": saturation,
              "broad_fraction": broad_fraction,
              "alignment_lateral_mm": float(metadata["alignment_lateral_mm"]),
              "alignment_axial_mm": float(metadata["alignment_axial_mm"])})
    diagnostics = {"events_found": False, "inward_index": None, "outward_index": None, "stimulus_detected": bool(stimulus)}
    if not stimulus:
        return f, diagnostics
    prominence = props.get("prominences", np.array([]))
    inward = [k for k, i in enumerate(peaks) if i < i_peak]
    outward = [k for k, i in enumerate(peaks) if i > i_peak]
    if not inward or not outward:
        return f, diagnostics
    k1 = max(inward, key=lambda k: prominence[k])
    k2 = max(outward, key=lambda k: prominence[k])
    i1, i2 = int(peaks[k1]), int(peaks[k2])
    t1 = (i1 + _parabolic(cleaned, i1)) * DT_MS
    t2 = (i2 + _parabolic(cleaned, i2)) * DT_MS
    p1, p2 = float(np.interp(t1, TIME_MS, p_smooth)), float(np.interp(t2, TIME_MS, p_smooth))
    widths = peak_widths(cleaned, [i1, i2], rel_height=0.5)[0] * DT_MS
    grad = np.gradient(p_smooth, DT_MS)
    a1, a2 = float(cleaned[i1]), float(cleaned[i2])
    f.update({"p1_mmhg": p1, "p2_mmhg": p2, "p_mean_mmhg": 0.5 * (p1 + p2), "p_diff_mmhg": p1 - p2,
              "t1_ms": t1, "t2_ms": t2, "dt_ms": t2 - t1,
              "dpdt_t1": float(np.interp(t1, TIME_MS, grad)), "dpdt_t2": float(np.interp(t2, TIME_MS, grad)),
              "amp1": a1, "amp2": a2, "amp_ratio": a1 / a2 if abs(a2) > 1e-6 else float("nan"),
              "width1_ms": float(widths[0]), "width2_ms": float(widths[1]),
              "snr_min": float(min(prominence[k1], prominence[k2]) / noise_mad)})
    diagnostics.update({"events_found": bool(np.isfinite([f[n] for n in FEATURE_NAMES]).all()),
                        "inward_index": i1, "outward_index": i2})
    return f, diagnostics


def feature_matrix(pressure, optical, meta):
    rows, diags = [], []
    for p, o, m in zip(pressure, optical, meta):
        f, d = extract_features(p, o, m)
        rows.append([f[n] for n in FEATURE_NAMES])
        diags.append(d)
    return np.asarray(rows, dtype=float).reshape(-1, len(FEATURE_NAMES)), diags


def waveform_tensor(pressure, optical, meta):
    """Model-ready 2-channel waveform: calibrated pressure / 80 and baseline-removed optical."""
    pressure = np.atleast_2d(np.asarray(pressure, dtype=float))
    optical = np.atleast_2d(np.asarray(optical, dtype=float))
    meta = list(meta) if isinstance(meta, (list, tuple)) else [meta]
    gains = np.array([m["calibration_gain"] for m in meta], dtype=float)[:, None]
    offsets = np.array([m["calibration_offset_mmhg"] for m in meta], dtype=float)[:, None]
    p = ((pressure - offsets) / gains) / 80.0
    o = optical - np.percentile(optical, 5, axis=1, keepdims=True)
    return np.stack([p, o], axis=1).astype(np.float32)
