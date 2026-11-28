"""Local demonstration API for the AirTon research website (not a clinical service).

Endpoints
  GET  /health                          which demo models are loaded
  GET  /v1/iop/simulate?scenario=...    simulated air-puff acquisition through the IOP engine
  POST /v1/retinal/predict              JPEG/PNG body -> research probability + Grad-CAM

Uploaded images are processed in memory, never written to disk and never
logged. The server binds to loopback unless allow_network is set explicitly.
"""

import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

import numpy as np

MAX_IMAGE_BYTES = 8 * 1024 * 1024
SCENARIOS = {
    "clean": {"label": "Good alignment, no artifacts"},
    "high_pressure": {"label": "Higher simulated pressure"},
    "blink": {"label": "Eyelid blink during the puff"},
    "misaligned": {"label": "Device 2 mm off-centre"},
    "low_signal": {"label": "Weak optical signal"},
}
LOOPBACK = ("127.0.0.1", "localhost", "::1")


def simulate_scenario(engine, scenario, seed=0):
    from .acquisition import TIME_MS, Physiology, make_devices, render_acquisition
    from .features import calibrated_pressure, extract_features

    if scenario not in SCENARIOS:
        raise ValueError("Unknown scenario")
    rng = np.random.default_rng(seed)
    device = make_devices(np.random.default_rng(7), 1, 0)[0]
    iop = float(rng.uniform(26, 34) if scenario == "high_pressure" else rng.uniform(12, 22))
    phys = Physiology(iop, float(rng.normal(545, 25)), float(rng.uniform(0.45, 0.65)), float(rng.normal(0, 1.0)))
    lateral = 2.0 if scenario == "misaligned" else abs(rng.normal(0, 0.2))
    p, o, truth = render_acquisition(device, phys, rng, lateral_mm=lateral, axial_mm=float(rng.normal(0, 0.2)),
                                     blink=scenario == "blink", gain_scale=0.1 if scenario == "low_signal" else 1.0)
    meta = {"measurement_id": f"demo-sim-{scenario}-{seed}", "device_id": device.device_id,
            "calibration_id": "demo-cal-sim", "eye": "OD", "captured_at": "2026-11-23T10:00:00+00:00",
            "calibration_gain": device.calibration_gain, "calibration_offset_mmhg": device.calibration_offset_mmhg,
            "calibration_expired": False, "clock_status": "trusted",
            "alignment_lateral_mm": float(lateral + rng.normal(0, 0.05)), "alignment_axial_mm": 0.0}
    result = engine.infer(p, o, meta)
    features, diag = extract_features(p, o, meta)
    events = [float(TIME_MS[i]) for i in (diag.get("inward_index"), diag.get("outward_index")) if i is not None]
    return {"scenario": scenario, "description": SCENARIOS[scenario]["label"], "simulated": True,
            "time_ms": [round(float(t), 2) for t in TIME_MS],
            "pressure_mmhg": [round(float(v), 3) for v in calibrated_pressure(p, meta)],
            "optical": [round(float(v), 4) for v in o], "applanation_times_ms": events,
            "p1_mmhg": None if np.isnan(features["p1_mmhg"]) else features["p1_mmhg"],
            "p2_mmhg": None if np.isnan(features["p2_mmhg"]) else features["p2_mmhg"],
            "simulated_true_iop_mmhg": round(iop, 2), "result": result,
            "disclaimer": "Simulated signals from an assumed physics model; no device or eye was measured."}


def create_demo_server(host="127.0.0.1", port=8770, *, retinal=None, iop_engine=None,
                       allowed_origins=("http://127.0.0.1:3000", "http://localhost:3000"), allow_network=False,
                       max_concurrent=2):
    if host not in LOOPBACK and not allow_network:
        raise ValueError("Binding beyond loopback requires allow_network=True (protect it with access control)")
    gate = threading.BoundedSemaphore(max_concurrent)
    origins = set(allowed_origins)

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_):
            pass  # never log uploads or request details

        def _cors(self):
            origin = self.headers.get("Origin")
            if origin in origins:
                self.send_header("Access-Control-Allow-Origin", origin)
                self.send_header("Vary", "Origin")

        def send_json(self, status, payload):
            body = json.dumps(payload, allow_nan=False, default=float).encode()
            self.send_response(status)
            self._cors()
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.end_headers()
            self.wfile.write(body)

        def do_OPTIONS(self):
            self.send_response(204)
            self._cors()
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.send_header("Access-Control-Max-Age", "600")
            self.end_headers()

        def do_GET(self):
            url = urlparse(self.path)
            if url.path == "/health":
                self.send_json(200, {"status": "ok", "retinal_model": retinal.package["model_id"] if retinal else None,
                                     "iop_model": iop_engine.model_id if iop_engine else None,
                                     "scenarios": {k: v["label"] for k, v in SCENARIOS.items()}})
            elif url.path == "/v1/iop/simulate":
                if iop_engine is None:
                    return self.send_json(503, {"error": "IOP demo bundle not loaded"})
                query = parse_qs(url.query)
                scenario = query.get("scenario", ["clean"])[0]
                try:
                    seed = int(query.get("seed", ["0"])[0])
                    if not 0 <= seed < 1_000_000:
                        raise ValueError
                    payload = simulate_scenario(iop_engine, scenario, seed)
                except ValueError:
                    return self.send_json(400, {"error": "Unknown scenario or invalid seed"})
                self.send_json(200, payload)
            else:
                self.send_json(404, {"error": "Not found"})

        def do_POST(self):
            self.close_connection = True
            if urlparse(self.path).path != "/v1/retinal/predict":
                return self.send_json(404, {"error": "Not found"})
            if retinal is None:
                return self.send_json(503, {"error": "Retinal demo model not loaded"})
            if self.headers.get("Content-Type", "").split(";")[0].strip() not in ("image/jpeg", "image/png"):
                return self.send_json(415, {"error": "Send a JPEG or PNG image body"})
            try:
                length = int(self.headers.get("Content-Length", "0"))
            except ValueError:
                return self.send_json(400, {"error": "Invalid Content-Length"})
            if not 0 < length <= MAX_IMAGE_BYTES:
                return self.send_json(413, {"error": "Image must be at most 8 MB"})
            self.connection.settimeout(15)
            body = self.rfile.read(length)
            if len(body) != length:
                return self.send_json(400, {"error": "Incomplete upload"})
            if not gate.acquire(blocking=False):
                return self.send_json(503, {"error": "Busy; try again shortly"})
            try:
                result = retinal.predict(body)
            except Exception:  # malformed or hostile images must not crash the server
                return self.send_json(400, {"error": "Could not read this image"})
            finally:
                gate.release()
            self.send_json(422 if result["status"] == "rejected" else 200, result)

    return ThreadingHTTPServer((host, port), Handler)


def main():
    import argparse

    parser = argparse.ArgumentParser(description="AirTon research demo API (local)")
    parser.add_argument("--retinal-package", default="models/weights/retinal-demo-model.json")
    parser.add_argument("--iop-bundle", default="output/iop-full/bundle")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8770)
    parser.add_argument("--origin", action="append", help="allowed browser origin (repeatable)")
    parser.add_argument("--allow-network", action="store_true", help="permit a non-loopback bind")
    args = parser.parse_args()
    from pathlib import Path

    retinal = iop = None
    if Path(args.retinal_package).is_file():
        from .retinal.inference import RetinalDemoModel
        retinal = RetinalDemoModel.load(args.retinal_package)
    if Path(args.iop_bundle, "bundle.json").is_file():
        from .runtime import IOPEngine
        iop = IOPEngine.load(args.iop_bundle)
    if retinal is None and iop is None:
        raise SystemExit("No demo model found; train one first (see ml/README.md)")
    origins = args.origin or ["http://127.0.0.1:3000", "http://localhost:3000"]
    server = create_demo_server(args.host, args.port, retinal=retinal, iop_engine=iop, allowed_origins=origins,
                                allow_network=args.allow_network)
    print(f"AirTon research demo API on http://{args.host}:{args.port} "
          f"(retinal: {retinal.package['model_id'] if retinal else 'off'}, iop: {iop.model_id if iop else 'off'})")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
