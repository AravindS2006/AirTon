"""Physics-informed synthetic air-puff acquisitions for ML engineering.

ILLUSTRATIVE MODEL ONLY. It follows the published dynamic bidirectional
applanation concept: a cornea with viscous lag flattens once on the way in and
once on the way out of an air pulse. Every parameter below is a development
assumption. None is an AirTon measurement, calibration or clinical value. It
exists so that the signal pipeline, quality gates, estimators, uncertainty and
evaluation can be engineered and tested before bench data exist.

Model summary
-------------
* Plenum pressure P(t) is a Gaussian pulse from the device pump.
* The eye receives e * P(t), where e < 1 falls with misalignment.
* Corneal state y(t) is a first-order viscous lag of e * P(t) with time
  constant tau (corneal viscosity).
* The cornea is flat when y(t) = T = IOP + Rc, where Rc is corneal resistance
  from thickness (CCT) and stiffness. Stiffness is correlated with tau, so the
  hysteresis P1 - P2 carries partial information about Rc.
* The optical detector peaks when the cornea is flat, giving inward (P1) and
  outward (P2) applanation events.
* Artifacts: lateral/axial misalignment, blink occlusion, low or saturating
  optical gain, mains flicker, sensor noise, ADC quantization, calibration
  drift and an untrusted clock.
"""

from dataclasses import asdict, dataclass
from datetime import datetime, timedelta, timezone
import hashlib

import numpy as np
from scipy.signal import lfilter

SAMPLE_RATE_HZ = 10_000
N_SAMPLES = 320
DT_MS = 1000.0 / SAMPLE_RATE_HZ
TIME_MS = np.arange(N_SAMPLES) * DT_MS
SIMULATOR_VERSION = "airton-synthetic-applanation-1"

DEFAULT_ARTIFACT_RATES = {
    "misalignment": 0.08, "blink": 0.05, "low_signal": 0.04, "saturation": 0.02,
    "strong_flicker": 0.05, "calibration_expired": 0.02, "clock_untrusted": 0.01,
}


@dataclass(frozen=True)
class DeviceProfile:
    device_id: str
    domain: str
    pump_amplitude_mmhg: float
    pulse_sigma_ms: float
    pulse_center_ms: float
    optical_gain: float
    optical_noise: float
    pressure_gain: float
    pressure_offset_mmhg: float
    pressure_noise_mmhg: float
    calibration_gain: float
    calibration_offset_mmhg: float


def make_devices(rng, n_development=6, n_external=2):
    """Development devices vary slightly; external devices model a shifted production lot."""
    devices = []
    for i in range(n_development + n_external):
        external = i >= n_development
        gain = rng.normal(1.0, 0.01)
        offset = rng.normal(0.0, 0.6)
        devices.append(DeviceProfile(
            device_id=f"demo-device-{'ext' if external else 'dev'}-{i:02d}",
            domain="external" if external else "development",
            pump_amplitude_mmhg=float(rng.normal(73.0 if external else 72.0, 1.5)),
            pulse_sigma_ms=float(rng.normal(4.62 if external else 4.5, 0.1)),
            pulse_center_ms=float(rng.normal(16.0, 0.25)),
            optical_gain=float(rng.normal(0.66 if external else 0.70, 0.03)),
            optical_noise=float(0.013 if external else 0.010),
            pressure_gain=float(gain),
            pressure_offset_mmhg=float(offset),
            pressure_noise_mmhg=float(0.26 if external else 0.22),
            # Calibration estimates the true gain/offset with small residual error.
            calibration_gain=float(gain + rng.normal(0, 0.003)),
            calibration_offset_mmhg=float(offset + rng.normal(0, 0.15)),
        ))
    return devices


@dataclass
class Physiology:
    iop_mmhg: float
    cct_um: float
    tau_ms: float
    resistance_mmhg: float


def _lag(signal, tau_ms):
    a = 1.0 - np.exp(-DT_MS / tau_ms)
    return lfilter([a], [1.0, -(1.0 - a)], signal, zi=[(1.0 - a) * signal[0]])[0]


def render_acquisition(device, physiology, rng, *, lateral_mm=0.0, axial_mm=0.0, blink=False,
                       gain_scale=1.0, flicker_amplitude=0.004, offset_drift_mmhg=0.0):
    """Return (pressure_mmhg_raw, optical_raw, truth) for one acquisition."""
    t = TIME_MS
    amplitude = device.pump_amplitude_mmhg * rng.normal(1.0, 0.015)
    pulse = amplitude * np.exp(-0.5 * ((t - device.pulse_center_ms) / device.pulse_sigma_ms) ** 2)
    efficiency = float(np.clip(1.0 - 0.032 * lateral_mm ** 2 - 0.025 * abs(axial_mm), 0.45, 1.0))
    corneal_state = _lag(efficiency * pulse, physiology.tau_ms)
    threshold = physiology.iop_mmhg + physiology.resistance_mmhg
    width = 3.5 * (1.0 + 0.35 * lateral_mm)
    alignment_amplitude = np.exp(-(lateral_mm / 2.0) ** 2) * np.exp(-(axial_mm / 3.0) ** 2)
    reflect = alignment_amplitude * np.exp(-((corneal_state - threshold) / width) ** 2)
    reflect += 0.03  # weak specular background from a convex cornea
    if blink:
        start = rng.uniform(4.0, 26.0)
        occlusion = 1.0 / (1.0 + np.exp(-(t - start) / 0.6))
        lid = rng.uniform(0.55, 0.9)
        reflect = reflect * (1.0 - occlusion) + lid * occlusion
    gain = device.optical_gain * gain_scale * rng.normal(1.0, 0.04)
    phase = rng.uniform(0, 2 * np.pi)
    ambient = rng.uniform(0.02, 0.08)
    flicker = flicker_amplitude * np.sin(2 * np.pi * 0.1 * t + phase)  # 100 Hz with t in ms
    optical = gain * reflect + ambient + flicker + rng.normal(0, device.optical_noise, t.size)
    optical = np.round(np.clip(optical, 0.0, 1.0) * 4095) / 4095  # 12-bit ADC
    pressure = (device.pressure_gain * pulse + device.pressure_offset_mmhg + offset_drift_mmhg
                + rng.normal(0, device.pressure_noise_mmhg, t.size))
    pressure = np.round(pressure / 0.05) * 0.05
    applanated = bool(corneal_state.max() > threshold + 0.5 * width)
    truth = {"efficiency": efficiency, "threshold_mmhg": float(threshold), "applanated": applanated,
             "saturated": bool(np.mean(optical >= 0.999) > 0.004), "pulse_amplitude_mmhg": float(amplitude)}
    return pressure.astype(np.float32), optical.astype(np.float32), truth


def acquisition_sha256(pressure, optical, metadata):
    digest = hashlib.sha256()
    digest.update(np.ascontiguousarray(pressure, dtype="<f4").tobytes())
    digest.update(np.ascontiguousarray(optical, dtype="<f4").tobytes())
    for key in ("measurement_id", "device_id", "calibration_id", "eye", "captured_at"):
        digest.update(str(metadata[key]).encode())
    return digest.hexdigest()


def generate_cohort(n_subjects=400, *, seed=42, sessions=2, repeats=3, n_development_devices=6,
                    n_external_devices=2, external_subject_fraction=0.15, artifact_rates=None):
    """Generate a synthetic cohort.

    Returns a dict with float32 arrays 'pressure' and 'optical' of shape
    (n, N_SAMPLES) and a list 'meta' holding device-visible metadata plus a
    separate 'truth' dict that a real device would not have. Subjects assigned
    to external devices use only those devices, so the external domain is held
    out by construction.
    """
    rates = {**DEFAULT_ARTIFACT_RATES, **(artifact_rates or {})}
    rng = np.random.default_rng(seed)
    devices = make_devices(rng, n_development_devices, n_external_devices)
    development = [d for d in devices if d.domain == "development"]
    external = [d for d in devices if d.domain == "external"]
    start = datetime(2026, 11, 1, 8, 0, tzinfo=timezone.utc)
    pressures, opticals, meta = [], [], []
    for s in range(n_subjects):
        subject_id = f"demo-subject-{s:04d}"
        is_external = bool(external) and rng.random() < external_subject_fraction
        pool = external if is_external else development
        elevated = rng.random() < 0.30
        base = rng.normal(24.0, 4.5) if elevated else rng.normal(15.5, 2.5)
        cct = rng.normal(545.0, 35.0)
        z_visc, z_other = rng.normal(size=2)
        z_stiff = 0.6 * z_visc + 0.8 * z_other
        tau = float(np.clip(0.55 + 0.10 * z_visc, 0.3, 0.9))
        for eye in ("OD", "OS"):
            eye_iop = float(np.clip(base + rng.normal(0, 1.2), 7.0, 44.0))
            eye_cct = cct + rng.normal(0, 6.0)
            resistance = 0.04 * (eye_cct - 545.0) + 1.2 * z_stiff
            for visit in range(sessions):
                session_iop = float(np.clip(eye_iop + rng.normal(0, 1.5), 6.0, 46.0))
                reference = session_iop + rng.normal(0, 0.8)
                device = pool[rng.integers(len(pool))]
                session_id = f"demo-session-{s:04d}-{eye}-{visit}"
                opa = max(0.5, rng.normal(2.5, 0.6))
                for rep in range(repeats):
                    flags = {k: bool(rng.random() < v) for k, v in rates.items()}
                    lateral = rng.uniform(1.0, 2.6) if flags["misalignment"] else abs(rng.normal(0, 0.25))
                    axial = (rng.uniform(1.0, 3.0) * rng.choice([-1, 1]) if flags["misalignment"]
                             else rng.normal(0, 0.3))
                    gain_scale = (rng.uniform(0.06, 0.18) if flags["low_signal"]
                                  else rng.uniform(2.6, 4.0) if flags["saturation"] else 1.0)
                    flicker = rng.uniform(0.05, 0.14) if flags["strong_flicker"] else rng.uniform(0.0, 0.01)
                    drift = rng.normal(0, 2.5) if flags["calibration_expired"] else 0.0
                    iop = session_iop + 0.5 * opa * np.sin(rng.uniform(0, 2 * np.pi))
                    phys = Physiology(float(iop), float(eye_cct), tau, float(resistance))
                    pressure, optical, truth = render_acquisition(
                        device, phys, rng, lateral_mm=lateral, axial_mm=axial, blink=flags["blink"],
                        gain_scale=gain_scale, flicker_amplitude=flicker, offset_drift_mmhg=drift)
                    index = len(meta)
                    captured = start + timedelta(days=30 * visit + s % 7, minutes=rep * 2 + (eye == "OS"))
                    record = {
                        "measurement_id": f"demo-m-{seed}-{index:06d}", "subject_id": subject_id,
                        "session_id": session_id, "eye": eye, "visit": visit, "repeat": rep,
                        "device_id": device.device_id, "domain": device.domain,
                        "calibration_id": f"demo-cal-{device.device_id[12:]}",
                        "calibration_gain": device.calibration_gain,
                        "calibration_offset_mmhg": device.calibration_offset_mmhg,
                        "calibration_expired": flags["calibration_expired"],
                        "clock_status": "untrusted" if flags["clock_untrusted"] else "trusted",
                        "captured_at": captured.isoformat(),
                        "alignment_lateral_mm": float(lateral + rng.normal(0, 0.12)),
                        "alignment_axial_mm": float(axial + rng.normal(0, 0.15)),
                        "reference_iop_mmhg": float(reference),
                    }
                    artifact = (flags["misalignment"] or flags["blink"] or flags["low_signal"]
                                or truth["saturated"] or not truth["applanated"])
                    # Ground truth a real device never sees; evaluation-only covariates.
                    record["truth"] = {**asdict(phys), **truth, **{f"flag_{k}": v for k, v in flags.items()},
                                       "artifact": bool(artifact), "elevated_group": bool(elevated)}
                    # Stand-in for a reviewer's artifact annotation in a bench dataset.
                    record["artifact_label"] = bool(artifact)
                    record["raw_sha256"] = acquisition_sha256(pressure, optical, record)
                    pressures.append(pressure)
                    opticals.append(optical)
                    meta.append(record)
    return {"simulator_version": SIMULATOR_VERSION, "sample_rate_hz": SAMPLE_RATE_HZ, "seed": seed,
            "pressure": np.stack(pressures), "optical": np.stack(opticals), "meta": meta,
            "devices": [asdict(d) for d in devices]}
