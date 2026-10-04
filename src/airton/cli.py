import argparse
import json
from pathlib import Path

from .api import create_server
from .reporting import fhir_observation, render_report
from .simulator import simulate
from .storage import MeasurementStore


def build_demo(output, count=12, seed=42):
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    records, raw = simulate(count, seed)
    raw_dir = output / "raw"
    raw_dir.mkdir(exist_ok=True)
    store = MeasurementStore(output / "measurements.sqlite3")
    for record in records:
        store.ingest(record)
        (raw_dir / (record["measurement_id"] + ".json")).write_bytes(raw[record["measurement_id"]])
    (output / "measurements.json").write_text(json.dumps(records, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    (output / "review.html").write_text(render_report(records), encoding="utf-8")
    (output / "fhir-observations.json").write_text(json.dumps([fhir_observation(r) for r in records], indent=2) + "\n", encoding="utf-8")
    (output / "manifest.json").write_text(json.dumps({"synthetic": True, "seed": seed, "record_count": len(records), "clinical_model": None,
        "purpose": "Software workflow verification only", "version": "0.1.0"}, indent=2) + "\n", encoding="utf-8")
    return output


def main():
    parser = argparse.ArgumentParser(description="AirTon synthetic research tools")
    sub = parser.add_subparsers(dest="command", required=True)
    demo = sub.add_parser("demo")
    demo.add_argument("--output", default="output/demo")
    demo.add_argument("--count", type=int, default=12)
    demo.add_argument("--seed", type=int, default=42)
    serve = sub.add_parser("serve")
    serve.add_argument("--database", default="output/api/measurements.sqlite3")
    serve.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    if args.command == "demo":
        print(f"Synthetic artifacts written to {build_demo(args.output, args.count, args.seed).resolve()}")
    else:
        server = create_server(args.database, port=args.port)
        print(f"Synthetic-only API: http://127.0.0.1:{args.port}; Ctrl+C to stop")
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
        finally:
            server.server_close()


if __name__ == "__main__":
    main()
