"""Authenticated loopback-only synthetic API. Never deploy as a clinical service."""

import hmac
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os

from .storage import ConflictError, MeasurementStore

MAX_BODY = 16384


def create_server(db_path, host="127.0.0.1", port=8765, token=None):
    if host not in ("127.0.0.1", "::1", "localhost"):
        raise ValueError("The demonstration API only permits loopback hosts")
    token = token if token is not None else os.environ.get("AIRTON_DEMO_TOKEN", "")
    if not isinstance(token, str) or len(token) < 32 or not token.isascii() or any(c.isspace() for c in token):
        raise ValueError("AIRTON_DEMO_TOKEN must contain at least 32 non-whitespace ASCII characters")
    # The standard HTTPServer uses IPv4; the CLI intentionally uses 127.0.0.1.
    if host == "::1":
        raise ValueError("Use IPv4 loopback 127.0.0.1 for this server")
    store = MeasurementStore(db_path)

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_):
            pass  # Do not log tokens, record content, or request paths.

        def send_json(self, status, payload):
            body = json.dumps(payload, allow_nan=False).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.end_headers()
            self.wfile.write(body)

        def authorized(self):
            if hmac.compare_digest(self.headers.get("Authorization", "").encode(), ("Bearer " + token).encode()):
                return True
            self.send_json(401, {"error": "Bearer authorization required"})
            return False

        def do_GET(self):
            if self.path == "/health":
                self.send_json(200, {"status": "ok", "mode": "synthetic-only"})
            elif self.authorized():
                if self.path == "/v1/measurements":
                    self.send_json(200, {"synthetic": True, "measurements": store.list()})
                else:
                    self.send_json(404, {"error": "Not found"})

        def do_POST(self):
            self.close_connection = True
            if not self.authorized():
                return
            if self.path != "/v1/measurements":
                self.send_json(404, {"error": "Not found"})
                return
            if self.headers.get("Content-Type", "").split(";")[0].strip() != "application/json":
                self.send_json(415, {"error": "application/json required"})
                return
            if self.headers.get("Transfer-Encoding"):
                self.send_json(400, {"error": "Transfer encoding is unsupported"})
                return
            try:
                length = int(self.headers.get("Content-Length", "0"))
                if not 0 < length <= MAX_BODY:
                    self.send_json(413, {"error": "Request body size outside demo limit"})
                    return
                self.connection.settimeout(5)
                payload = self.rfile.read(length)
                if len(payload) != length:
                    raise ValueError("Incomplete body")
                record = json.loads(payload)
                outcome = store.ingest(record)
                self.send_json(201 if outcome == "created" else 200, {"status": outcome, "measurement_id": record["measurement_id"]})
            except ConflictError:
                self.send_json(409, {"error": "Conflicting measurement replay"})
            except (ValueError, TypeError, UnicodeError, TimeoutError):
                self.send_json(400, {"error": "Invalid synthetic measurement"})

    return ThreadingHTTPServer((host, port), Handler)
