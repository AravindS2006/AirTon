"""Research evaluation utilities; results do not establish clinical validity."""

import math
import random
import statistics


def regression_metrics(reference, estimate):
    a, b = list(reference), list(estimate)
    if len(a) != len(b) or len(a) < 2:
        raise ValueError("At least two matched pairs are required")
    if any(type(x) not in (int, float) or not math.isfinite(x) for x in a + b):
        raise ValueError("All values must be finite numbers")
    differences = [y - x for x, y in zip(a, b)]
    bias, sd = statistics.mean(differences), statistics.stdev(differences)
    return {"n_pairs": len(a), "mae_mmhg": statistics.mean(abs(x) for x in differences),
            "rmse_mmhg": math.sqrt(statistics.mean(x * x for x in differences)),
            "bias_estimate_minus_reference_mmhg": bias,
            "exploratory_loa_lower_mmhg": bias - 1.96 * sd,
            "exploratory_loa_upper_mmhg": bias + 1.96 * sd,
            "note": "Descriptive normal-approximation limits only; repeated-eye data require a clustered agreement analysis."}


def split_subjects(subject_ids, seed=42):
    subjects = sorted(set(subject_ids))
    if len(subjects) < 5:
        raise ValueError("At least five subjects are needed for this demo split")
    random.Random(seed).shuffle(subjects)
    n_test, n_validation = max(1, len(subjects) // 5), max(1, len(subjects) // 5)
    test = set(subjects[:n_test])
    validation = set(subjects[n_test:n_test + n_validation])
    train = set(subjects[n_test + n_validation:])
    return {"train": train, "validation": validation, "test": test}
