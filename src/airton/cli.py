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
    (output / "measurements.json").write_text(json.dumps(records, indent=2, allow_nan=False) + "\n", encoding="utf-8", newline="\n")
    (output / "review.html").write_text(render_report(records), encoding="utf-8", newline="\n")
    (output / "fhir-observations.json").write_text(json.dumps([fhir_observation(r) for r in records], indent=2) + "\n", encoding="utf-8", newline="\n")
    (output / "manifest.json").write_text(json.dumps({"synthetic": True, "seed": seed, "record_count": len(records), "clinical_model": None,
        "purpose": "Software workflow verification only", "version": "0.1.0"}, indent=2) + "\n", encoding="utf-8", newline="\n")
    return output


def build_iop_demo(bundle, output, subjects=6, seed=2026):
    """Run the synthetic IOP engine end to end: acquisitions -> gates -> records -> store -> review."""
    from .ml.acquisition import generate_cohort
    from .ml.dataset import save_dataset
    from .ml.runtime import IOPEngine

    engine = IOPEngine.load(bundle)
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    cohort = generate_cohort(subjects, seed=seed, sessions=1, external_subject_fraction=0.0)
    save_dataset(output / "raw", cohort, "Synthetic acquisitions for the IOP engine demonstration")
    results = engine.infer_batch(cohort["pressure"], cohort["optical"], cohort["meta"])
    records = [engine.to_record(r, m) for r, m in zip(results, cohort["meta"])]
    store = MeasurementStore(output / "measurements.sqlite3")
    for record in records:
        store.ingest(record)
    (output / "inference-results.json").write_text(json.dumps(results, indent=2, allow_nan=False) + "\n",
                                                   encoding="utf-8", newline="\n")
    (output / "measurements.json").write_text(json.dumps(records, indent=2, allow_nan=False) + "\n",
                                              encoding="utf-8", newline="\n")
    (output / "review.html").write_text(render_report(records, model_label=engine.model_id + " (synthetic)"),
                                        encoding="utf-8", newline="\n")
    accepted = sum(r["status"] == "pass" for r in results)
    return output, accepted, len(results)


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
    train = sub.add_parser("iop-train", help="train the synthetic IOP stack (needs .[ml], optionally .[deep])")
    train.add_argument("--config", default="ml/configs/iop-estimator.json")
    train.add_argument("--profile", default="quick", choices=["quick", "full"])
    train.add_argument("--output", default=None)
    train.add_argument("--no-deep", action="store_true")
    iop = sub.add_parser("iop-demo", help="run a trained synthetic bundle through store and review")
    iop.add_argument("--bundle", required=True)
    iop.add_argument("--output", default="output/iop-demo")
    iop.add_argument("--subjects", type=int, default=6)
    iop.add_argument("--seed", type=int, default=2026)
    args = parser.parse_args()
    if args.command == "demo":
        print(f"Synthetic artifacts written to {build_demo(args.output, args.count, args.seed).resolve()}")
    elif args.command == "iop-train":
        from .ml.training import load_config, run_training
        output = args.output or f"output/iop-{args.profile}"
        run_training(load_config(args.config, args.profile), output, use_deep=False if args.no_deep else None)
        print(f"Synthetic IOP stack written to {Path(output).resolve()}; not clinical performance")
    elif args.command == "iop-demo":
        out, accepted, total = build_iop_demo(args.bundle, args.output, args.subjects, args.seed)
        print(f"{accepted}/{total} synthetic acquisitions accepted; review at {(out / 'review.html').resolve()}")
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
