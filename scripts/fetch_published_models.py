"""Verify or explicitly fetch registered historical Keras weights; never load them."""
import argparse
import hashlib
import json
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parents[1]


def digest(path):
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--fetch", choices=["M01", "M02"], help="Explicitly download one registered historical file")
    args = parser.parse_args()
    registry = json.loads((ROOT / "models/model-registry.json").read_text(encoding="utf-8"))
    entries = [m for m in registry["models"] if m.get("local_weights")]
    for entry in entries:
        target = (ROOT / entry["local_weights"]).resolve()
        if target.parent != (ROOT / "models/weights").resolve():
            raise ValueError("Weight target is outside the registered weight directory")
        if args.fetch == entry["id"] and not target.exists():
            target.parent.mkdir(parents=True, exist_ok=True)
            partial = target.with_suffix(target.suffix + ".partial")
            try:
                with urllib.request.urlopen(entry["url"], timeout=60) as response, partial.open("wb") as output:
                    for chunk in iter(lambda: response.read(1024 * 1024), b""):
                        output.write(chunk)
                if partial.stat().st_size != entry["bytes"] or digest(partial) != entry["sha256"]:
                    raise ValueError("Downloaded weight does not match its registered size/hash")
                partial.replace(target)
            finally:
                partial.unlink(missing_ok=True)
        if not target.exists():
            print(f"{entry['id']}: not present locally; metadata retained")
        elif target.stat().st_size != entry["bytes"] or digest(target) != entry["sha256"]:
            raise SystemExit(f"{entry['id']}: local weight mismatch")
        else:
            print(f"{entry['id']}: local size and SHA-256 verified; no model deserialization performed")


if __name__ == "__main__":
    main()
