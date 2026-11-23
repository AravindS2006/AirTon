"""IOP ML stack: physics sanity, gates, portable runtime parity, calibration and safety."""

import importlib.util
import json
from pathlib import Path
import shutil
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

HAS_ML = all(importlib.util.find_spec(m) for m in ("numpy", "scipy", "lightgbm"))
HAS_TORCH = HAS_ML and importlib.util.find_spec("torch") is not None

if HAS_ML:
    import numpy as np

    from airton.contracts import validate_measurement
    from airton.ml.acquisition import Physiology, generate_cohort, make_devices, render_acquisition
    from airton.ml.bundle import load_bundle
    from airton.ml.dataset import load_dataset, save_dataset
    from airton.ml.features import FEATURE_NAMES, extract_features
    from airton.ml.metrics import agreement, auroc, clustered_limits_of_agreement, repeatability
    from airton.ml.models import (conformal_quantile, fit_ridge, lightgbm_to_trees, ridge_predict, simplex_weights,
                                  train_lightgbm, tree_predict)
    from airton.ml.quality import rule_reasons
    from airton.ml.runtime import IOPEngine
    from airton.ml.training import assign_partitions, load_config, run_training

LIMITS = {"max_lateral_mm": 1.0, "max_axial_mm": 1.5, "max_broad_fraction": 0.3,
          "max_saturation_fraction": 0.004, "min_snr": 20.0}


def _meta(device, **extra):
    base = {"measurement_id": "demo-m-x", "device_id": device.device_id, "calibration_id": "demo-cal-x",
            "eye": "OD", "captured_at": "2026-11-01T08:00:00+00:00", "calibration_gain": device.calibration_gain,
            "calibration_offset_mmhg": device.calibration_offset_mmhg, "calibration_expired": False,
            "clock_status": "trusted", "alignment_lateral_mm": 0.1, "alignment_axial_mm": 0.0}
    return {**base, **extra}


@unittest.skipUnless(HAS_ML, "Optional ML dependencies not installed")
class PhysicsAndFeatureTests(unittest.TestCase):
    def setUp(self):
        self.rng = np.random.default_rng(3)
        self.device = make_devices(np.random.default_rng(0), 1, 0)[0]
        self.phys = Physiology(18.0, 545.0, 0.55, 0.5)

    def features(self, **kwargs):
        meta_extra = kwargs.pop("meta", {})
        p, o, truth = render_acquisition(self.device, self.phys, self.rng, **kwargs)
        f, d = extract_features(p, o, _meta(self.device, **meta_extra))
        return f, d, truth

    def test_clean_acquisition_recovers_applanation_physics(self):
        f, d, truth = self.features()
        self.assertTrue(d["events_found"])
        self.assertGreater(f["p1_mmhg"], f["p2_mmhg"])  # viscous hysteresis
        self.assertAlmostEqual(f["p_mean_mmhg"], truth["threshold_mmhg"], delta=1.0)
        self.assertEqual(rule_reasons(f, d, _meta(self.device), LIMITS), [])

    def test_rules_reject_artifacts_with_specific_reasons(self):
        clean, _, _ = self.features()
        f, d, _ = self.features(blink=True)
        self.assertGreater(f["broad_fraction"], clean["broad_fraction"] + 0.1)  # lid occlusion is visible
        self.assertEqual("blink" in rule_reasons(f, d, _meta(self.device), LIMITS), f["broad_fraction"] > 0.3)
        f, d, _ = self.features(lateral_mm=2.0, meta={"alignment_lateral_mm": 2.0})
        self.assertIn("alignment", rule_reasons(f, d, _meta(self.device, alignment_lateral_mm=2.0), LIMITS))
        f, d, _ = self.features()
        self.assertIn("clock_untrusted", rule_reasons(f, d, _meta(self.device, clock_status="untrusted"), LIMITS))
        self.assertIn("calibration_expired", rule_reasons(f, d, _meta(self.device, calibration_expired=True), LIMITS))
        flat_p, flat_o = np.zeros(320), np.full(320, 0.05)  # failed pump: no stimulus at all
        f, d = extract_features(flat_p, flat_o, _meta(self.device))
        self.assertFalse(d["stimulus_detected"])
        self.assertIn("signal_missing", rule_reasons(f, d, _meta(self.device), LIMITS))

    def test_feature_extraction_rejects_malformed_input(self):
        with self.assertRaises(ValueError):
            extract_features(np.zeros(10), np.zeros(10), _meta(self.device))
        with self.assertRaises(ValueError):
            extract_features(np.full(320, np.nan), np.zeros(320), _meta(self.device))
        with self.assertRaises(ValueError):
            extract_features(np.zeros(320), np.zeros(320), _meta(self.device, calibration_gain=0.0))

    def test_cohort_is_deterministic_and_external_domain_is_held_out(self):
        a, b = generate_cohort(12, seed=5), generate_cohort(12, seed=5)
        self.assertTrue(np.array_equal(a["pressure"], b["pressure"]))
        self.assertEqual(a["meta"], b["meta"])
        part, _ = assign_partitions(a["meta"], {"train": .55, "validation": .15, "calibration": .15, "test": .15}, 1)
        by_subject = {}
        for p, m in zip(part, a["meta"]):
            by_subject.setdefault(m["subject_id"], set()).add(p)
            self.assertEqual(p == "external", m["domain"] == "external")
        self.assertTrue(all(len(v) == 1 for v in by_subject.values()))


@unittest.skipUnless(HAS_ML, "Optional ML dependencies not installed")
class NumericalComponentTests(unittest.TestCase):
    def test_portable_trees_match_lightgbm_including_zero_values(self):
        rng = np.random.default_rng(0)
        X = rng.normal(size=(400, 5))
        X[::7, 2] = 0.0
        y = X[:, 0] * 2 + np.sin(X[:, 1]) + (X[:, 2] == 0) * 1.5
        for objective, target in (("regression", y), ("binary", (y > 0).astype(float))):
            booster = train_lightgbm(X, target, objective=objective, num_rounds=60)
            self.assertLess(np.max(np.abs(booster.predict(X) - tree_predict(lightgbm_to_trees(booster), X))), 1e-9)

    def test_ridge_recovers_linear_relation(self):
        rng = np.random.default_rng(1)
        X = rng.normal(size=(500, 3))
        y = 3 + X @ np.array([1.0, -2.0, 0.5])
        model = fit_ridge(X, y, alpha=1e-8)
        self.assertLess(np.max(np.abs(ridge_predict(model, X) - y)), 1e-6)

    def test_conformal_quantile_is_finite_sample(self):
        self.assertEqual(conformal_quantile(range(1, 10), 0.1), 9.0)
        self.assertEqual(conformal_quantile([1, 2, 3], 0.1), float("inf"))
        self.assertEqual(conformal_quantile(range(1, 101), 0.1), 91.0)

    def test_stacking_weights_are_a_simplex(self):
        rng = np.random.default_rng(2)
        P = rng.normal(size=(200, 3))
        w = simplex_weights(P, P @ np.array([0.2, 0.8, 0.0]))
        self.assertAlmostEqual(sum(w), 1.0)
        self.assertTrue(all(v >= 0 for v in w))
        np.testing.assert_allclose(w, [0.2, 0.8, 0.0], atol=1e-6)

    def test_clustered_loa_matches_anova_hand_calculation(self):
        d = np.array([1.0, 2.0, 3.0, 2.0, 4.0, 6.0])
        clusters = np.array(["a", "a", "a", "b", "b", "b"])
        bias, sd, var_b, var_w = clustered_limits_of_agreement(d, clusters)
        self.assertAlmostEqual(bias, 3.0)
        self.assertAlmostEqual(var_w, 2.5)  # ((1+0+1) + (4+0+4)) / 4
        self.assertAlmostEqual(var_b, (6.0 - 2.5) / 3.0)  # MSB = 3*(1+1)/1, divisor = (36-18)/(1*6)
        self.assertAlmostEqual(sd, np.sqrt(var_b + var_w))
        result = agreement([10, 20, 30, 40, 15, 25], [11, 22, 33, 42, 19, 31], clusters, bootstrap=50)
        self.assertLessEqual(result["bootstrap_95ci"]["bias_mmhg"][0], result["bias_mmhg"])

    def test_auroc_and_repeatability(self):
        self.assertEqual(auroc([0, 0, 1, 1], [0.1, 0.2, 0.8, 0.9]), 1.0)
        self.assertEqual(auroc([0, 1, 0, 1], [0.5, 0.5, 0.5, 0.5]), 0.5)
        r = repeatability([10, 12, 20, 20], ["s1", "s1", "s2", "s2"])
        self.assertAlmostEqual(r["within_session_sd_mmhg"], np.sqrt(2.0 / 2))


class ColabRunnerTests(unittest.TestCase):
    """The Colab notebook must stay a thin, output-free, credential-free runner."""

    def setUp(self):
        self.path = ROOT / "ml/notebooks/colab/airton_colab_training.ipynb"
        self.notebook = json.loads(self.path.read_text(encoding="utf-8"))
        self.source = "".join("".join(c["source"]) for c in self.notebook["cells"])

    def test_notebook_is_source_only(self):
        for cell in self.notebook["cells"]:
            self.assertFalse(cell.get("outputs"))
            self.assertIsNone(cell.get("execution_count"))

    def test_notebook_uses_secrets_and_scrubs_the_remote(self):
        self.assertIn('userdata.get("GITHUB_TOKEN")', self.source)
        self.assertIn("remote", self.source)
        self.assertIn("set-url", self.source)
        for pattern in ("ghp_", "github_pat_", "gho_"):
            self.assertNotIn(pattern, self.source)

    def test_notebook_runs_repository_scripts_rather_than_its_own_model_code(self):
        for script in ("scripts/train_iop_model.py", "scripts/train_retinal_model.py", "unittest discover"):
            self.assertIn(script, self.source)
        for forbidden in ("import lightgbm", "nn.Module", "def train"):
            self.assertNotIn(forbidden, self.source)


@unittest.skipUnless(HAS_TORCH, "torch not installed")
class DeepParityTests(unittest.TestCase):
    def test_device_resolution_and_cpu_member_training(self):
        from airton.ml.deep import ensemble_predict, resolve_device, train_member

        self.assertIn(resolve_device("auto"), ("cpu", "cuda"))
        self.assertEqual(resolve_device("cpu"), "cpu")
        with self.assertRaises(ValueError):
            resolve_device("tpu")
        rng = np.random.default_rng(0)
        wave = rng.normal(size=(60, 2, 320)).astype(np.float32)
        scalars = rng.normal(size=(60, 3)).astype(np.float32)
        target = scalars[:, 0] * 0.5
        groups = np.repeat(np.arange(20), 3)
        state, info = train_member(wave, scalars, target, groups, seed=1, epochs=2, batch_size=16, threads=1)
        self.assertEqual(info["device"], "cpu")
        mean, sd = ensemble_predict([state], wave[:5], scalars[:5])
        self.assertEqual(mean.shape, (5,))
        self.assertTrue(np.all(sd > 0))

    def test_numpy_runtime_matches_torch_with_folded_batchnorm(self):
        import torch

        from airton.ml.deep import _build, export_state
        from airton.ml.models import cnn_forward

        torch.manual_seed(0)
        model = _build(4)
        torch.nn.init.normal_(model.head2.weight, std=0.1)
        model.train()
        wave, scalars = torch.randn(32, 2, 320), torch.randn(32, 4)
        for _ in range(3):
            model(wave, scalars)  # move batch-norm statistics away from identity
        model.eval()
        with torch.no_grad():
            mu, logvar = model(wave[:6], scalars[:6])
        mu2, logvar2 = cnn_forward(export_state(model, 1.0), wave[:6].numpy(), scalars[:6].numpy())
        self.assertLess(np.max(np.abs(mu.numpy() - mu2)), 1e-5)
        self.assertLess(np.max(np.abs(logvar.numpy() - logvar2)), 1e-5)


@unittest.skipUnless(HAS_ML, "Optional ML dependencies not installed")
class EndToEndTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        config = load_config(ROOT / "ml/configs/iop-estimator.json", "quick")
        config["data"]["n_subjects"] = 90
        config["evaluation"]["bootstrap_replicates"] = 20
        cls.metrics = run_training(config, cls.tmp.name, use_deep=False, log=lambda *_: None)
        cls.bundle = Path(cls.tmp.name) / "bundle"
        cls.engine = IOPEngine.load(cls.bundle)
        cls.cohort = generate_cohort(10, seed=77)

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def test_outputs_are_synthetic_and_documented(self):
        self.assertTrue(self.metrics["synthetic"])
        self.assertFalse(self.metrics["clinical_use"])
        card = (Path(self.tmp.name) / "model-card.md").read_text(encoding="utf-8")
        self.assertIn("Not for clinical use", card)
        manifest = json.loads((Path(self.tmp.name) / "run-manifest.json").read_text(encoding="utf-8"))
        self.assertEqual(manifest["evidence_level"], "synthetic-generated")
        self.assertLess(self.metrics["runtime_parity_max_abs_mmhg"], 1e-6)
        for name in ("test", "external"):
            self.assertIn(name, self.metrics["evaluation"])

    def test_bundle_contains_no_pickle_capable_files(self):
        self.assertTrue(all(p.suffix in (".json", ".npz") for p in self.bundle.iterdir()))

    def test_tampered_or_extra_bundle_files_are_refused(self):
        with tempfile.TemporaryDirectory() as tmp:
            copy = Path(tmp) / "b"
            shutil.copytree(self.bundle, copy)
            path = copy / "settings.json"
            settings = json.loads(path.read_text(encoding="utf-8"))
            settings["max_interval_half_width_mmhg"] = 99.0
            path.write_text(json.dumps(settings), encoding="utf-8")
            with self.assertRaises(ValueError):
                load_bundle(copy)
        with tempfile.TemporaryDirectory() as tmp:
            copy = Path(tmp) / "b"
            shutil.copytree(self.bundle, copy)
            (copy / "payload.pkl").write_bytes(b"not allowed")
            with self.assertRaises(ValueError):
                load_bundle(copy)

    def test_inference_records_are_contract_valid_and_rejections_have_no_value(self):
        c = self.cohort
        results = self.engine.infer_batch(c["pressure"], c["optical"], c["meta"])
        self.assertEqual(len(results), len(c["meta"]))
        statuses = {r["status"] for r in results}
        self.assertEqual(statuses, {"pass", "reject"})
        for result, meta in zip(results, c["meta"]):
            record = self.engine.to_record(result, meta)
            validate_measurement(record)
            if result["status"] == "reject":
                self.assertIsNone(record["iop_estimate_mmhg"])
                self.assertIsNone(result["interval_mmhg"])
                self.assertTrue(result["reasons"])
            else:
                lo, hi = result["interval_mmhg"]
                self.assertLessEqual(lo, result["iop_estimate_mmhg"])
                self.assertLessEqual(result["iop_estimate_mmhg"], hi)
            if meta["clock_status"] == "untrusted":
                self.assertIn("clock_untrusted", result["reasons"])
            if meta["calibration_expired"]:
                self.assertIn("calibration_expired", result["reasons"])

    def test_single_acquisition_inference_matches_batch(self):
        c = self.cohort
        single = self.engine.infer(c["pressure"][0], c["optical"][0], c["meta"][0])
        self.assertEqual(single, self.engine.infer_batch(c["pressure"][:1], c["optical"][:1], c["meta"][:1])[0])

    def test_dataset_roundtrip_and_governance(self):
        c = generate_cohort(3, seed=9)
        with tempfile.TemporaryDirectory() as tmp:
            save_dataset(tmp, c, "test cohort")
            loaded = load_dataset(tmp)
            self.assertTrue(np.array_equal(loaded["pressure"], c["pressure"]))
            path = Path(tmp) / "dataset-manifest.json"
            manifest = json.loads(path.read_text(encoding="utf-8"))
            path.write_text(json.dumps({**manifest, "synthetic": False}), encoding="utf-8")
            with self.assertRaises(PermissionError):
                load_dataset(tmp)
            path.write_text(json.dumps({**manifest, "dataset_sha256": "0" * 64}), encoding="utf-8")
            with self.assertRaises(ValueError):
                load_dataset(tmp)

    def test_config_must_remain_non_clinical(self):
        with tempfile.TemporaryDirectory() as tmp:
            raw = json.loads((ROOT / "ml/configs/iop-estimator.json").read_text(encoding="utf-8"))
            raw["clinical_use"] = True
            path = Path(tmp) / "c.json"
            path.write_text(json.dumps(raw), encoding="utf-8")
            with self.assertRaises(ValueError):
                load_config(path, "quick")


if __name__ == "__main__":
    unittest.main()
