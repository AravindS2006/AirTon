"""Retain only reproducible synthetic examples and original deck excerpts."""

import hashlib
from datetime import datetime, timezone
import json
from pathlib import Path
import shutil
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
from airton.contracts import validate_measurement


def entry(path, evidence_level):
    return {"path": path.relative_to(ROOT).as_posix(), "sha256": hashlib.sha256(path.read_bytes()).hexdigest(), "evidence_level": evidence_level}


def main():
    source = ROOT / "output/demo"
    records = json.loads((source / "measurements.json").read_text(encoding="utf-8"))
    for record in records:
        validate_measurement(record)
        raw = (source / "raw" / (record["measurement_id"] + ".json")).read_bytes()
        if hashlib.sha256(raw).hexdigest() != record["raw_sha256"]:
            raise ValueError("Raw synthetic artifact hash mismatch")
    target = ROOT / "artifacts/examples"
    target.mkdir(parents=True, exist_ok=True)
    files = []
    for old, new in (("review.html", "synthetic-review.html"), ("measurements.json", "synthetic-measurements.json"),
                     ("fhir-observations.json", "synthetic-fhir-observations.json")):
        shutil.copyfile(source / old, target / new)
        files.append(entry(target / new, "synthetic-generated"))
    # Explicit allowlist; never copy arbitrary output or database directories.
    ml_source = ROOT / "output/ml-synthetic"
    if ml_source.exists():
        for old, new in (("metrics.json", "synthetic-ml-metrics.json"), ("model.json", "synthetic-ml-model.json"),
                         ("run-manifest.json", "synthetic-ml-run-manifest.json")):
            data = json.loads((ml_source / old).read_text(encoding="utf-8"))
            if data.get("synthetic") is not True:
                raise ValueError("Only synthetic ML results can be archived by this script")
            shutil.copyfile(ml_source / old, target / new)
            files.append(entry(target / new, "synthetic-generated"))
    (target / "manifest.json").write_text(json.dumps({"release_date": "2026-10-04", "generated_at": datetime.now(timezone.utc).isoformat(), "synthetic": True,
        "commands": ["python scripts/demo.py", "python scripts/train_synthetic.py", "python scripts/archive_examples.py"],
        "limitations": "Fictional values; software verification only; FHIR example not profile-validated; ML scores have no clinical meaning.",
        "artifacts": files}, indent=2) + "\n", encoding="utf-8")
    deck_source = ROOT / "artifacts/source"
    figures = deck_source / "deck-figures"
    figures.mkdir(exist_ok=True)
    original = deck_source / "team-airton-2025-07-03.pdf"
    source_files = [entry(original, "supplied-original")]
    for page in (13, 18, 19, 20, 23):
        rendered = ROOT / f"tmp/pdfs/deck-page-{page}.png"
        if rendered.is_file():
            copied = figures / f"page-{page:02d}.png"
            shutil.copyfile(rendered, copied)
            source_files.append(entry(copied, "rendered-original-excerpt"))
    extracted = ROOT / "research/sources/team-deck-extracted.txt"
    source_files.append(entry(extracted, "text-extraction-original"))
    (deck_source / "manifest.json").write_text(json.dumps({"imported_on": "2026-10-04",
        "origin": "User-supplied Team AirTon_20250703_080412_0000.pdf; copied without editing",
        "page_count": 38, "rendering": "pypdfium2 at scale 1.2; original pages; no image edits",
        "extraction": "pypdf text extraction; figure text may be omitted",
        "rights": "Team/institution/third-party rights require publication review", "artifacts": source_files}, indent=2) + "\n", encoding="utf-8")
    print("Archived only allowlisted synthetic examples and original source artifacts")


if __name__ == "__main__":
    main()
