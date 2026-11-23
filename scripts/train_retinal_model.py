"""Train the corrected retinal research classifier on a governed manifest.

  python scripts/train_retinal_model.py --manifest <approved-storage>/manifest.json
  python scripts/train_retinal_model.py --synthetic-smoke   # generated shapes only

No dataset is downloaded. Non-synthetic manifests need a completed governance block.
Requires: pip install -e ".[ml,deep]".
"""

import argparse
import json
from pathlib import Path
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--config", default=str(ROOT / "ml/configs/retinal-classifier.json"))
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--manifest")
    source.add_argument("--synthetic-smoke", action="store_true")
    parser.add_argument("--output", default="output/retinal-research")
    args = parser.parse_args()
    from airton.ml.retinal.data import write_synthetic_shapes
    from airton.ml.retinal.train import train

    config = json.loads(Path(args.config).read_text(encoding="utf-8"))
    smoke = config.pop("smoke_overrides", {})
    if config.get("clinical_use") is not False:
        raise SystemExit("Configuration must declare clinical_use false")
    if args.synthetic_smoke:
        config.update(smoke)
        with tempfile.TemporaryDirectory() as tmp:
            report = train(config, write_synthetic_shapes(tmp), args.output)
    else:
        report = train(config, args.manifest, args.output)
    print(json.dumps({"test_auroc": report["test_report"]["auroc"], "output": str(Path(args.output).resolve()),
                      "synthetic": report["synthetic"]}, indent=2))


if __name__ == "__main__":
    main()
