"""Reproducible grouped regression exercise. No real IOP sensor model is trained."""

import argparse
import hashlib
import json
from pathlib import Path
import random
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from airton.evaluation import regression_metrics, split_subjects


def run(output, seed=42):
    try:
        import numpy as np
        import sklearn
        from sklearn.linear_model import LinearRegression
    except ImportError as exc:
        raise SystemExit('Install optional dependencies with: python -m pip install -e ".[ml]"') from exc
    rng = random.Random(seed)
    rows = []
    for subject in range(100):
        subject_offset = rng.gauss(0, 0.2)
        for eye in ("OD", "OS"):
            a, b = rng.random(), rng.random()
            rows.append({"subject_id": f"demo-subject-{subject:03d}", "eye": eye,
                         "synthetic_feature_a": a, "synthetic_feature_b": b,
                         "fictional_reference_mmhg": 10 + 12 * a + 3 * b + subject_offset + rng.gauss(0, 0.25)})
    split = split_subjects([r["subject_id"] for r in rows], seed)
    def xy(part):
        subset = [r for r in rows if r["subject_id"] in split[part]]
        return np.array([[r["synthetic_feature_a"], r["synthetic_feature_b"]] for r in subset]), np.array([r["fictional_reference_mmhg"] for r in subset])
    x_train, y_train = xy("train")
    model = LinearRegression().fit(x_train, y_train)
    x_validation, y_validation = xy("validation")
    validation = regression_metrics(y_validation.tolist(), model.predict(x_validation).tolist())
    # A fixed model with no tuning in this demonstration; test data never enter fit.
    x_test, y_test = xy("test")
    test = regression_metrics(y_test.tolist(), model.predict(x_test).tolist())
    dummy = regression_metrics(y_test.tolist(), [float(y_train.mean())] * len(y_test))
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    dataset = json.dumps(rows, sort_keys=True, indent=2).encode()
    (output / "synthetic-dataset.json").write_bytes(dataset)
    manifest = {"synthetic": True, "seed": seed, "dataset_sha256": hashlib.sha256(dataset).hexdigest(),
                "subject_splits": {k: sorted(v) for k, v in split.items()}, "numpy_version": np.__version__, "sklearn_version": sklearn.__version__,
                "limitations": "Artificial algebraic target and arbitrary features; cannot estimate real eye pressure or glaucoma risk."}
    (output / "run-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8", newline="\n")
    (output / "metrics.json").write_text(json.dumps({"synthetic": True, "validation": validation, "test": test, "test_dummy_mean_baseline": dummy}, indent=2) + "\n", encoding="utf-8", newline="\n")
    (output / "model.json").write_text(json.dumps({"synthetic": True, "model_type": "linear-regression-demo", "clinical_use": False,
        "features": ["synthetic_feature_a", "synthetic_feature_b"], "intercept": float(model.intercept_), "coefficients": model.coef_.tolist()}, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"Synthetic ML exercise saved to {output.resolve()}; not clinical performance")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="output/ml-synthetic")
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()
    run(args.output, args.seed)
