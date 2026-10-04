"""Local SQLite ingestion with immutable IDs and conflict detection."""

from contextlib import contextmanager
import json
from pathlib import Path
import sqlite3

from .contracts import validate_measurement


class ConflictError(ValueError):
    pass


class MeasurementStore:
    def __init__(self, path):
        self.path = str(path)
        Path(self.path).parent.mkdir(parents=True, exist_ok=True)
        with self._connection() as connection:
            connection.execute("CREATE TABLE IF NOT EXISTS measurements (measurement_id TEXT PRIMARY KEY, payload TEXT NOT NULL)")

    @contextmanager
    def _connection(self):
        connection = sqlite3.connect(self.path, timeout=10)
        try:
            with connection:
                yield connection
        finally:
            connection.close()

    def ingest(self, record):
        record = validate_measurement(record)
        payload = json.dumps(record, sort_keys=True, separators=(",", ":"), allow_nan=False)
        with self._connection() as connection:
            cursor = connection.execute("INSERT OR IGNORE INTO measurements VALUES (?, ?)", (record["measurement_id"], payload))
            if cursor.rowcount:
                return "created"
            existing = connection.execute("SELECT payload FROM measurements WHERE measurement_id = ?", (record["measurement_id"],)).fetchone()[0]
            if existing != payload:
                raise ConflictError("Measurement ID already exists with different content")
            return "duplicate"

    def list(self):
        with self._connection() as connection:
            rows = connection.execute("SELECT payload FROM measurements ORDER BY measurement_id").fetchall()
        return [json.loads(row[0]) for row in rows]
