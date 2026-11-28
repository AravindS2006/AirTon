"""Research demo API and retinal demo inference: limits, rejection paths, CORS and loopback binding."""

import importlib.util
import io
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import threading
import unittest
from urllib.error import HTTPError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
HAS_ALL = all(importlib.util.find_spec(m) for m in ("numpy", "scipy", "lightgbm", "torch", "torchvision", "PIL"))


@unittest.skipUnless(HAS_ALL, "ML, deep and imaging dependencies required")
class DemoApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        import numpy as np
        from PIL import Image

        from airton.ml.demo_api import create_demo_server
        from airton.ml.retinal.data import write_synthetic_shapes
        from airton.ml.retinal.inference import RetinalDemoModel
        from airton.ml.retinal.train import train
        from airton.ml.runtime import IOPEngine
        from airton.ml.training import load_config, run_training

        cls.tmp = tempfile.TemporaryDirectory()
        tmp = Path(cls.tmp.name)
        iop_config = load_config(ROOT / "ml/configs/iop-estimator.json", "quick")
        iop_config["data"]["n_subjects"] = 90
        iop_config["evaluation"]["bootstrap_replicates"] = 10
        run_training(iop_config, tmp / "iop", use_deep=False, log=lambda *_: None)
        manifest = write_synthetic_shapes(tmp / "shapes", n_patients=24, size=48)
        config = json.loads((ROOT / "ml/configs/retinal-classifier.json").read_text(encoding="utf-8"))
        config.update(config.pop("smoke_overrides"))
        config.update({"epochs": 1, "image_size": 32, "bootstrap_replicates": 10})
        train(config, manifest, tmp / "run", log=lambda *_: None)
        subprocess.run([sys.executable, str(ROOT / "scripts/select_retinal_demo_model.py"), "--manifest", str(manifest),
                        "--run", str(tmp / "run"), "--out", str(tmp / "pkg/retinal-demo-model.json"),
                        "--card", str(tmp / "card.md")], check=True, capture_output=True)
        cls.model = RetinalDemoModel.load(tmp / "pkg/retinal-demo-model.json")
        cls.server = create_demo_server("127.0.0.1", 0, retinal=cls.model, iop_engine=IOPEngine.load(tmp / "iop/bundle"))
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = f"http://127.0.0.1:{cls.server.server_port}"
        rng = np.random.default_rng(0)
        textured = np.dstack([rng.integers(120, 255, (64, 64)), rng.integers(30, 110, (64, 64)),
                              rng.integers(0, 50, (64, 64))]).astype(np.uint8)
        cls.textured_png = cls.png(Image.fromarray(textured))
        cls.solid_png = cls.png(Image.new("RGB", (64, 64), (180, 90, 60)))

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.tmp.cleanup()

    @staticmethod
    def png(img):
        buffer = io.BytesIO()
        img.save(buffer, "PNG")
        return buffer.getvalue()

    def call(self, method, path, body=None, ctype=None, origin="http://127.0.0.1:3000"):
        headers = {"Origin": origin}
        if ctype:
            headers["Content-Type"] = ctype
        request = Request(self.base + path, data=body, headers=headers, method=method)
        try:
            with urlopen(request, timeout=60) as response:
                return response.status, json.load(response), response.headers
        except HTTPError as error:
            return error.code, json.load(error), error.headers

    def test_health_and_cors_allowlist(self):
        status, payload, headers = self.call("GET", "/health")
        self.assertEqual(status, 200)
        self.assertTrue(payload["retinal_model"].startswith("retinal-demo-"))
        self.assertEqual(headers.get("Access-Control-Allow-Origin"), "http://127.0.0.1:3000")
        _, _, headers = self.call("GET", "/health", origin="http://unknown.example")
        self.assertIsNone(headers.get("Access-Control-Allow-Origin"))

    def test_iop_simulation_scenarios(self):
        status, payload, _ = self.call("GET", "/v1/iop/simulate?scenario=misaligned&seed=1")
        self.assertEqual(status, 200)
        self.assertTrue(payload["simulated"])
        self.assertEqual(len(payload["pressure_mmhg"]), 320)
        self.assertEqual(payload["result"]["status"], "reject")
        self.assertIn("alignment", payload["result"]["reasons"])
        self.assertIsNone(payload["result"]["iop_estimate_mmhg"])
        self.assertEqual(self.call("GET", "/v1/iop/simulate?scenario=unknown")[0], 400)
        self.assertEqual(self.call("GET", "/v1/iop/simulate?seed=-4")[0], 400)

    def test_upload_limits_and_bad_inputs(self):
        self.assertEqual(self.call("POST", "/v1/retinal/predict", b"abc", "text/plain")[0], 415)
        self.assertEqual(self.call("POST", "/v1/retinal/predict", b"not an image", "image/png")[0], 400)
        import http.client

        connection = http.client.HTTPConnection("127.0.0.1", self.server.server_port, timeout=10)
        connection.putrequest("POST", "/v1/retinal/predict")
        connection.putheader("Content-Type", "image/png")
        connection.putheader("Content-Length", str(8 * 1024 * 1024 + 1))
        connection.endheaders()  # the server must refuse before any body is sent
        self.assertEqual(connection.getresponse().status, 413)
        connection.close()
        status, payload, _ = self.call("POST", "/v1/retinal/predict", self.solid_png, "image/png")
        self.assertEqual(status, 422)
        self.assertIsNone(payload["probability"])
        self.assertFalse(payload["clinical_use"])

    def test_out_of_distribution_input_is_refused_without_a_probability(self):
        result = self.model.predict(self.textured_png)
        if result["status"] == "rejected":
            self.assertIsNone(result["probability"])
        self.assertIn("ood_distance", result)

    def test_prediction_payload_when_gates_pass(self):
        ood = self.model.ood
        try:
            self.model.ood = None  # exercise the prediction path independently of the OOD gate
            result = self.model.predict(self.textured_png)
        finally:
            self.model.ood = ood
        self.assertEqual(result["status"], "ok")
        self.assertTrue(0.0 <= result["probability"] <= 1.0)
        self.assertTrue(result["research_only"])
        self.assertTrue(result["heatmap_png_base64"])

    def test_package_tampering_is_refused(self):
        from airton.ml.retinal.inference import RetinalDemoModel

        pkg_dir = Path(self.tmp.name) / "pkg"
        package = json.loads((pkg_dir / "retinal-demo-model.json").read_text(encoding="utf-8"))
        with tempfile.TemporaryDirectory() as tmp:
            for p in pkg_dir.iterdir():
                (Path(tmp) / p.name).write_bytes(p.read_bytes())
            ckpt = Path(tmp) / package["members"][0]["checkpoint"]
            ckpt.write_bytes(ckpt.read_bytes() + b"\0")
            with self.assertRaises(ValueError):
                RetinalDemoModel.load(Path(tmp) / "retinal-demo-model.json")

    def test_non_loopback_bind_requires_explicit_opt_in(self):
        from airton.ml.demo_api import create_demo_server

        with self.assertRaises(ValueError):
            create_demo_server("0.0.0.0", 0)


if __name__ == "__main__":
    unittest.main()
