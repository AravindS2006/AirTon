"""Corrected retinal research framework: governance, grouping and audited-defect fixes."""

import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
HAS_TORCH = all(importlib.util.find_spec(m) for m in ("numpy", "scipy", "torch", "torchvision", "PIL"))

if HAS_TORCH:
    import numpy as np
    import torch
    from torch.utils.data import DataLoader

    from airton.ml.retinal.data import (ImageRows, build_transforms, crop_box, grouped_stratified_split,
                                        load_manifest, preprocessing_spec, write_synthetic_shapes)
    from airton.ml.retinal.model import build_model, set_backbone_trainable
    from airton.ml.retinal.train import (choose_threshold, classification_report, evaluate, fit_temperature,
                                         finalize_from_checkpoint, load_checkpoint, save_checkpoint, train)


@unittest.skipUnless(HAS_TORCH, "torch/torchvision not installed")
class RetinalFrameworkTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        cls.manifest_path = write_synthetic_shapes(cls.tmp.name, n_patients=24, size=48)

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def test_real_manifest_without_governance_is_refused(self):
        raw = json.loads(self.manifest_path.read_text(encoding="utf-8"))
        raw["synthetic"] = False
        path = Path(self.tmp.name) / "real.json"
        path.write_text(json.dumps(raw), encoding="utf-8")
        with self.assertRaises(PermissionError):
            load_manifest(path)

    def test_patient_grouped_split_has_no_overlap_and_both_labels(self):
        rows = load_manifest(self.manifest_path)["images"]
        parts = grouped_stratified_split(rows, {"train": 0.6, "validation": 0.2, "test": 0.2}, 1)
        patients = [{r["patient_id"] for r in p} for p in parts.values()]
        for i in range(3):
            for j in range(i + 1, 3):
                self.assertFalse(patients[i] & patients[j])
        self.assertTrue(all({r["label"] for r in p} == {0, 1} for p in parts.values()))
        self.assertEqual(sum(len(p) for p in parts.values()), len(rows))

    def test_crop_box_is_clamped(self):
        self.assertEqual(crop_box(100, 80, 5, 5, 20), (0, 0, 25, 25))
        self.assertEqual(crop_box(100, 80, 95, 75, 20), (75, 55, 100, 80))
        with self.assertRaises(ValueError):
            crop_box(100, 80, -50, -50, 10)

    def test_freeze_helper_really_freezes_backbone(self):
        model = build_model("resnet18")
        frozen = set_backbone_trainable(model, False)
        head = sum(p.numel() for n, p in model.named_parameters() if n.startswith("fc."))
        self.assertEqual(frozen, head)
        self.assertEqual(set_backbone_trainable(model, True), sum(p.numel() for p in model.parameters()))

    def test_single_logit_head(self):
        model = build_model("resnet18").eval()
        with torch.no_grad():
            self.assertEqual(tuple(model(torch.zeros(2, 3, 32, 32)).shape), (2, 1))

    def test_evaluate_uses_only_the_given_loader(self):
        rows = load_manifest(self.manifest_path)["images"]
        spec = preprocessing_spec(32, False)
        model = build_model("resnet18")
        small = DataLoader(ImageRows(rows[:3], build_transforms(spec, False)), batch_size=2)
        large = DataLoader(ImageRows(rows[:7], build_transforms(spec, False)), batch_size=2)
        self.assertEqual(evaluate(model, small)[0].size, 3)
        self.assertEqual(evaluate(model, large)[0].size, 7)

    def test_temperature_threshold_and_labelled_confusion_matrix(self):
        rng = np.random.default_rng(0)
        y = rng.integers(0, 2, 4000)
        true_logit = rng.normal(0, 1.5, 4000) + (2 * y - 1) * 1.5
        y = (rng.random(4000) < 1 / (1 + np.exp(-true_logit))).astype(int)
        self.assertAlmostEqual(fit_temperature(true_logit * 3.0, y), 3.0, delta=0.4)
        p = 1 / (1 + np.exp(-true_logit))
        t = choose_threshold(p, y)
        report = classification_report(p, y, np.arange(y.size), t, {"0": "normal", "1": "glaucoma"}, bootstrap=0)
        self.assertEqual(report["confusion_matrix"]["labels"], ["normal", "glaucoma"])
        (tn, fp), (fn, tp) = report["confusion_matrix"]["rows_true_cols_pred"]
        self.assertEqual(tn + fp, int(np.sum(y == 0)))
        self.assertEqual(fn + tp, int(np.sum(y == 1)))

    def test_checkpoint_is_tensor_only_and_round_trips(self):
        model = build_model("resnet18")
        path = save_checkpoint(model, Path(self.tmp.name) / "ckpt")
        clone = load_checkpoint(build_model("resnet18"), path)
        for (k, a), (_, b) in zip(model.state_dict().items(), clone.state_dict().items()):
            self.assertTrue(torch.equal(a, b), k)

    def test_lag_manifest_builder_groups_repeats_and_records_terms(self):
        spec = importlib.util.spec_from_file_location("build_retinal_manifest", ROOT / "scripts/build_retinal_manifest.py")
        builder = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(builder)
        from PIL import Image

        rows = load_manifest(self.manifest_path)["images"]
        with tempfile.TemporaryDirectory() as tmp:
            src = Path(tmp) / "LAG"
            for folder, label in builder.CLASSES:
                for sub in ("image", "label", "attention_map"):
                    (src / folder / sub).mkdir(parents=True)
                picks = [r for r in rows if r["label"] == label][:4]
                for k, r in enumerate(picks):
                    Image.open(r["resolved_path"]).save(src / folder / "image" / f"{k:04d}.jpg", quality=98)
                    (src / folder / "label" / f"{k:04d}.txt").write_text(str(label))
            # A repeat capture of the same eye must share a group with its original.
            Image.open(src / "non_glaucoma/image/0000.jpg").save(src / "non_glaucoma/image/0009.jpg", quality=90)
            (src / "non_glaucoma/label/0009.txt").write_text("0")
            manifest = builder.build(src, Path(tmp) / "out")
            groups = {r["source_file"].split("/")[-1]: r["patient_id"] for r in manifest["images"]
                      if r["source_file"].startswith("non_glaucoma")}
            self.assertEqual(groups["0000.jpg"], groups["0009.jpg"])
            self.assertFalse(manifest["governance"]["commercial_use_permitted"])
            self.assertEqual(load_manifest(Path(tmp) / "out/manifest.json")["dataset_id"], "lag-v1-local")
            (src / "non_glaucoma/label/0001.txt").write_text("1")
            with self.assertRaises(ValueError):
                builder.build(src, Path(tmp) / "out2")

    def test_smoke_training_freezes_decisions_before_test(self):
        config = json.loads((ROOT / "ml/configs/retinal-classifier.json").read_text(encoding="utf-8"))
        config.update(config.pop("smoke_overrides"))
        config.update({"epochs": 1, "image_size": 32, "bootstrap_replicates": 10})
        with tempfile.TemporaryDirectory() as out:
            report = train(config, self.manifest_path, out, log=lambda *_: None)
            for name in ("frozen-decision.json", "model-card.md", "test-predictions.csv", "metrics.json"):
                self.assertTrue((Path(out) / name).is_file(), name)
            self.assertIn("Research only", (Path(out) / "model-card.md").read_text(encoding="utf-8"))
            again = finalize_from_checkpoint(config, self.manifest_path, out, log=lambda *_: None)
            self.assertAlmostEqual(again["frozen"]["threshold"], report["frozen"]["threshold"], places=6)
            self.assertAlmostEqual(again["test_report"]["auroc"] or 0, report["test_report"]["auroc"] or 0, places=6)
        self.assertTrue(report["synthetic"])
        self.assertFalse(report["clinical_use"])
        self.assertEqual(report["history"][0]["train_samples_processed"], report["partitions"]["train"]["images"])
        self.assertFalse(report["frozen"]["preprocessing"]["annotation_dependent_crop"])


if __name__ == "__main__":
    unittest.main()
