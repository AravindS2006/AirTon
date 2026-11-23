"""Train, calibrate and evaluate the synthetic AirTon IOP estimation stack.

Examples:
  python scripts/train_iop_model.py --profile quick --output output/iop-quick
  python scripts/train_iop_model.py --profile full --output output/iop-full
Requires: pip install -e ".[ml]" (and ".[deep]" for the CNN ensemble).
"""

import argparse
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--config", default=str(ROOT / "ml/configs/iop-estimator.json"))
    parser.add_argument("--profile", default="full", choices=["quick", "full"])
    parser.add_argument("--output", default=None)
    deep = parser.add_mutually_exclusive_group()
    deep.add_argument("--deep", dest="deep", action="store_true", default=None, help="force CNN ensemble on")
    deep.add_argument("--no-deep", dest="deep", action="store_false", help="force CNN ensemble off")
    args = parser.parse_args()
    try:
        from airton.ml.training import load_config, run_training
    except ImportError as exc:
        raise SystemExit('Install optional dependencies with: python -m pip install -e ".[ml]"') from exc
    config = load_config(args.config, args.profile)
    output = args.output or f"output/iop-{args.profile}"
    run_training(config, output, use_deep=args.deep, repo_root=ROOT)
    print(f"Synthetic IOP stack written to {Path(output).resolve()}; not clinical performance")


if __name__ == "__main__":
    main()
