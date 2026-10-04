"""Integrity, failure semantics and API boundaries for the synthetic workflow."""

import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import threading
import unittest
from urllib.error import HTTPError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
from airton.api import create_server
from airton.cli import build_demo
from airton.contracts import validate_measurement
from airton.evaluation import regression_metrics, split_subjects
from airton.reporting import fhir_observation, render_report
from airton.simulator import simulate
from airton.storage import ConflictError, MeasurementStore


class ContractTests(unittest.TestCase):
    def setUp(self):
        self.record = simulate(1)[0][0]

    def test_non_synthetic_and_extra_personal_fields_rejected(self):
        for change in ({"synthetic": False}, {"patient_name": "Sample Name"}, {"subject_id": "patient-123"}):
            with self.subTest(change=change), self.assertRaises(ValueError):
                validate_measurement({**self.record, **change})

    def test_invalid_numeric_and_laterality_values_rejected(self):
        for value in (True, False, float("nan"), float("inf"), 0, -1, 101, "17"):
            with self.subTest(value=value), self.assertRaises(ValueError):
                validate_measurement({**self.record, "iop_estimate_mmhg": value})
        with self.assertRaises(ValueError):
            validate_measurement({**self.record, "eye": "both"})

    def test_rejection_cannot_retain_estimate(self):
        rejected = {**self.record, "quality_status": "reject", "quality_reasons": ["blink"]}
        with self.assertRaises(ValueError):
            validate_measurement(rejected)
        rejected["iop_estimate_mmhg"] = None
        self.assertIsNone(validate_measurement(rejected)["iop_estimate_mmhg"])
        with self.assertRaises(ValueError):
            validate_measurement({**rejected, "quality_reasons": []})

    def test_clock_trust_requires_rejection(self):
        with self.assertRaises(ValueError):
            validate_measurement({**self.record, "clock_status": "untrusted"})
        valid = {**self.record, "clock_status": "untrusted", "quality_status": "reject",
                 "quality_reasons": ["clock_untrusted"], "iop_estimate_mmhg": None}
        validate_measurement(valid)

    def test_timezone_required(self):
        for timestamp in ("2026-10-04T09:00:00", "2026-10-04 09:00:00+00:00", "2026-10-04X09:00:00+00:00"):
            with self.subTest(timestamp=timestamp), self.assertRaises(ValueError):
                validate_measurement({**self.record, "captured_at": timestamp})

    def test_raw_hash_matches_bytes_and_simulation_reproducible(self):
        records, raw = simulate()
        self.assertEqual((records, raw), simulate())
        for r in records:
            self.assertEqual(r["raw_sha256"], hashlib.sha256(raw[r["measurement_id"]]).hexdigest())
        self.assertEqual({r["eye"] for r in records}, {"OD", "OS"})

    @unittest.skipUnless(importlib.util.find_spec("jsonschema"), "Optional JSON Schema validator not installed")
    def test_json_schema_accepts_examples_rejects_bad_clock_and_quality(self):
        from jsonschema import Draft202012Validator, FormatChecker
        schema = json.loads((ROOT / "schemas/measurement.schema.json").read_text())
        Draft202012Validator.check_schema(schema)
        validator = Draft202012Validator(schema, format_checker=FormatChecker())
        for record in simulate()[0]:
            validator.validate(record)
        for bad in ({**self.record, "clock_status": "untrusted"},
                    {**self.record, "quality_status": "reject", "quality_reasons": ["blink"]},
                    {**self.record, "captured_at": "not-a-date"}):
            self.assertTrue(list(validator.iter_errors(bad)))


class WorkflowTests(unittest.TestCase):
    def test_idempotence_conflict_and_persistence(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "demo.sqlite3"
            store = MeasurementStore(path)
            record = simulate(1)[0][0]
            self.assertEqual(store.ingest(record), "created")
            self.assertEqual(store.ingest(record), "duplicate")
            with self.assertRaises(ConflictError):
                store.ingest({**record, "eye": "OS"})
            self.assertEqual(MeasurementStore(path).list(), [record])

    def test_report_and_fhir_do_not_impute_rejected_readings(self):
        records, _ = simulate()
        report = render_report(records)
        self.assertIn("All values are fictional synthetic data", report)
        self.assertIn("No result", report)
        rejected = [r for r in records if r["quality_status"] == "reject"][0]
        observation = fhir_observation(rejected)
        self.assertNotIn("valueQuantity", observation)
        self.assertIn("dataAbsentReason", observation)
        self.assertEqual(fhir_observation(records[0])["valueQuantity"]["code"], "mm[Hg]")

    def test_full_demo_can_be_replayed(self):
        with tempfile.TemporaryDirectory() as tmp:
            build_demo(tmp)
            original = (Path(tmp) / "measurements.json").read_bytes()
            build_demo(tmp)
            self.assertEqual((Path(tmp) / "measurements.json").read_bytes(), original)
            self.assertEqual(len(MeasurementStore(Path(tmp) / "measurements.sqlite3").list()), 12)
            self.assertTrue((Path(tmp) / "review.html").is_file())

    def test_grouped_split_keeps_both_eyes_together(self):
        subjects = [f"demo-{i}" for i in range(30) for _ in range(2)]
        parts = split_subjects(subjects)
        self.assertFalse(parts["train"] & parts["validation"])
        self.assertFalse(parts["train"] & parts["test"])
        self.assertFalse(parts["validation"] & parts["test"])
        self.assertEqual(set.union(*parts.values()), set(subjects))
        self.assertEqual(parts, split_subjects(subjects))

    def test_metrics_capture_bias_instead_of_only_correlation(self):
        metrics = regression_metrics([10, 20, 30], [15, 25, 35])
        self.assertEqual(metrics["bias_estimate_minus_reference_mmhg"], 5)
        self.assertEqual(metrics["mae_mmhg"], 5)
        self.assertEqual(metrics["exploratory_loa_lower_mmhg"], 5)
        for a, b in (([1], [2]), ([1, 2], [2]), ([1, 2], [2, float("nan")])):
            with self.assertRaises(ValueError):
                regression_metrics(a, b)


class APITests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.token = "test-disposable-token-" + "x" * 32
        self.server = create_server(Path(self.tmp.name) / "api.sqlite3", port=0, token=self.token)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.base = f"http://127.0.0.1:{self.server.server_port}"

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=5)
        self.tmp.cleanup()

    def request(self, method, path, body=None, authorized=True, headers=None):
        merged = {"Content-Type": "application/json"}
        if authorized:
            merged["Authorization"] = "Bearer " + self.token
        merged.update(headers or {})
        data = None if body is None else json.dumps(body).encode()
        request = Request(self.base + path, data=data, headers=merged, method=method)
        try:
            with urlopen(request, timeout=5) as response:
                return response.status, json.load(response)
        except HTTPError as error:
            return error.code, json.load(error)

    def test_health_and_authentication(self):
        self.assertEqual(self.request("GET", "/health", authorized=False)[0], 200)
        self.assertEqual(self.request("GET", "/v1/measurements", authorized=False)[0], 401)
        self.assertEqual(self.request("GET", "/v1/measurements", headers={"Authorization": "Bearer incorrect"})[0], 401)

    def test_ingestion_replay_conflict_and_list(self):
        record = simulate(1)[0][0]
        self.assertEqual(self.request("POST", "/v1/measurements", record)[0], 201)
        self.assertEqual(self.request("POST", "/v1/measurements", record)[0], 200)
        self.assertEqual(self.request("POST", "/v1/measurements", {**record, "eye": "OS"})[0], 409)
        status, payload = self.request("GET", "/v1/measurements")
        self.assertEqual(status, 200)
        self.assertEqual(payload["measurements"], [record])

    def test_invalid_body_media_size_and_routes(self):
        record = simulate(1)[0][0]
        self.assertEqual(self.request("POST", "/v1/measurements", {**record, "synthetic": False})[0], 400)
        self.assertEqual(self.request("POST", "/v1/measurements", record, headers={"Content-Type": "text/plain"})[0], 415)
        self.assertEqual(self.request("POST", "/v1/measurements", {"padding": "x" * 17000})[0], 413)
        self.assertEqual(self.request("GET", "/missing")[0], 404)

    def test_public_binding_and_missing_token_fail_closed(self):
        with self.assertRaises(ValueError):
            create_server(Path(self.tmp.name) / "unsafe.sqlite3", host="0.0.0.0", token=self.token)
        with self.assertRaises(ValueError):
            create_server(Path(self.tmp.name) / "unsafe.sqlite3", token="")


class StateModelTests(unittest.TestCase):
    def test_unsafe_request_and_precondition_loss_latch_fault(self):
        spec = importlib.util.spec_from_file_location("airton_state_model", ROOT / "firmware/state_model.py")
        module = importlib.util.module_from_spec(spec)
        sys.modules[spec.name] = module
        spec.loader.exec_module(module)
        safe = module.Preconditions(True, True, True, True)
        model = module.StateModel()
        with self.assertRaises(RuntimeError):
            model.request_capture(safe)  # BOOT cannot capture even with asserted conditions.
        self.assertEqual(model.assess(safe), module.State.FAULT)
        model = module.StateModel()
        model.assess(safe)
        unsafe = copy.copy(safe)
        unsafe.aligned = False
        with self.assertRaises(RuntimeError):
            model.request_capture(unsafe)
        self.assertEqual(model.state, module.State.FAULT)
        model = module.StateModel()
        model.assess(safe)
        self.assertIs(model.request_capture(safe)["hardware_enabled"], False)


if __name__ == "__main__":
    unittest.main()
