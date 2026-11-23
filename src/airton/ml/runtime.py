"""Numpy-only IOP inference engine with layered abstention.

Pipeline per acquisition: features -> deterministic rules -> learned quality
gate -> out-of-domain gate -> stacked estimate -> conformal interval ->
uncertainty gate. Any failed gate produces a rejection with reasons and no
numeric estimate. Outputs are synthetic research values, never clinical IOP.
"""

import numpy as np

from airton.contracts import validate_measurement

from .bundle import load_bundle
from .deep import ensemble_predict
from .features import FEATURE_NAMES, PHYSICS_FEATURES, feature_matrix, waveform_tensor
from .models import mahalanobis_distance, ridge_predict, standardize, tree_predict
from .quality import rule_reasons

PHYSICS_INDEX = [FEATURE_NAMES.index(f) for f in PHYSICS_FEATURES]
FIRMWARE_VERSION = "demo-0.3.0"


class IOPEngine:
    def __init__(self, manifest, parts):
        if tuple(manifest["feature_names"]) != FEATURE_NAMES:
            raise ValueError("Bundle feature set does not match this runtime")
        self.manifest, self.parts = manifest, parts
        self.model_id = manifest["model_id"]
        self.cnn_states = [parts[n] for n in sorted(parts) if n.startswith("cnn_member_")]

    @classmethod
    def load(cls, directory):
        return cls(*load_bundle(directory))

    # ------------------------------------------------------------ components
    def components(self, X, wave=None):
        """Base predictions for rows with finite features (used by training parity checks)."""
        p = self.parts
        ridge = ridge_predict(p["physics_ridge"], X[:, PHYSICS_INDEX])
        gbm = ridge + tree_predict(p["residual_gbm"], X)
        out = {"physics_ridge": ridge, "ridge+gbm": gbm, "gbm_residual_abs": np.abs(gbm - ridge)}
        if self.cnn_states:
            scalars = standardize(p["cnn_scalars"], X)
            mean, sd = ensemble_predict(self.cnn_states, wave, scalars)
            out["ridge+cnn"], out["cnn_sd"] = ridge + mean, sd
        else:
            out["cnn_sd"] = np.zeros(X.shape[0])
        weights = p["stack"]["weights"]
        out["estimate"] = sum(w * out[name] for name, w in weights.items())
        difficulty_inputs = np.column_stack([X, out["gbm_residual_abs"], out["cnn_sd"]])
        out["sigma"] = np.exp(tree_predict(p["difficulty_gbm"], difficulty_inputs))
        return out

    # ------------------------------------------------------------ inference
    def infer_batch(self, pressure, optical, meta):
        settings = self.parts["settings"]
        X, diags = feature_matrix(pressure, optical, meta)
        results = []
        finite = np.isfinite(X).all(axis=1)
        idx = np.nonzero(finite)[0]
        comp, quality, distance = {}, np.full(len(meta), np.nan), np.full(len(meta), np.nan)
        if idx.size:
            wave = waveform_tensor(np.asarray(pressure)[idx], np.asarray(optical)[idx], [meta[i] for i in idx]) \
                if self.cnn_states else None
            comp = self.components(X[idx], wave)
            quality[idx] = tree_predict(self.parts["quality_gbm"], X[idx])
            distance[idx] = mahalanobis_distance(self.parts["ood"], X[idx])
        position = {int(i): k for k, i in enumerate(idx)}
        q_conf = settings["conformal_quantile"]
        lo_support, hi_support = settings["target_support_mmhg"]
        for i, m in enumerate(meta):
            features = dict(zip(FEATURE_NAMES, X[i].tolist()))
            reasons = set(rule_reasons(features, diags[i], m, settings["rule_limits"]))
            estimate = interval = None
            k = position.get(i)
            if k is None:
                reasons.add("signal_missing")
            else:
                if quality[i] >= settings["quality_threshold"]:
                    reasons.add("signal_quality")
                value = float(comp["estimate"][k])
                if distance[i] > settings["ood_threshold"] or not lo_support <= value <= hi_support:
                    reasons.add("out_of_domain")
                half = q_conf * float(comp["sigma"][k])
                if not np.isfinite(half) or half > settings["max_interval_half_width_mmhg"]:
                    reasons.add("estimate_uncertain")
                if not reasons:
                    estimate, interval = value, [value - half, value + half]
            results.append({
                "measurement_id": m["measurement_id"], "status": "reject" if reasons else "pass",
                "reasons": sorted(reasons), "iop_estimate_mmhg": estimate, "interval_mmhg": interval,
                "interval_coverage_target": 1 - settings["conformal_alpha"],
                "quality_score": None if np.isnan(quality[i]) else float(quality[i]),
                "ood_distance": None if np.isnan(distance[i]) else float(distance[i]),
                "model_id": self.model_id, "synthetic": True,
            })
        return results

    def infer(self, pressure, optical, metadata):
        return self.infer_batch(np.asarray(pressure)[None], np.asarray(optical)[None], [metadata])[0]

    def to_record(self, result, metadata):
        """Convert an inference result into a validated synthetic measurement record."""
        estimate = result["iop_estimate_mmhg"]
        record = {
            "schema_version": "1.0", "measurement_id": metadata["measurement_id"],
            "session_id": metadata["session_id"], "subject_id": metadata["subject_id"],
            "device_id": metadata["device_id"], "eye": metadata["eye"], "captured_at": metadata["captured_at"],
            "synthetic": True, "quality_status": result["status"], "quality_reasons": result["reasons"],
            "iop_estimate_mmhg": None if estimate is None else round(estimate, 1),
            "calibration_id": metadata["calibration_id"], "model_id": self.model_id,
            "firmware_version": FIRMWARE_VERSION, "raw_sha256": metadata["raw_sha256"],
            "clock_status": metadata["clock_status"],
        }
        return validate_measurement(record)
