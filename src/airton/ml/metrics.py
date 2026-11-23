"""Agreement, repeatability, uncertainty and classification metrics.

These are descriptive research statistics. Acceptance criteria must come from
an approved protocol and tonometer standard; none is implied here.
"""

import math

import numpy as np

RANGE_BINS_MMHG = ((0, 12), (12, 21), (21, 30), (30, 100))


def clustered_limits_of_agreement(differences, clusters):
    """Bland & Altman (2007) limits for multiple observations per subject (true value varies)."""
    d = np.asarray(differences, dtype=float)
    labels, inverse = np.unique(np.asarray(clusters), return_inverse=True)
    k, n = labels.size, d.size
    if k < 2 or n <= k:
        sd = float(d.std(ddof=1)) if n > 1 else float("nan")
        return float(d.mean()), sd, 0.0, sd ** 2
    counts = np.bincount(inverse)
    means = np.bincount(inverse, weights=d) / counts
    grand = d.mean()
    ms_between = float(np.sum(counts * (means - grand) ** 2) / (k - 1))
    ms_within = float(np.sum((d - means[inverse]) ** 2) / (n - k))
    divisor = (n ** 2 - np.sum(counts ** 2)) / ((k - 1) * n)
    var_between = max(0.0, (ms_between - ms_within) / divisor)
    total = var_between + ms_within
    return float(grand), math.sqrt(total), var_between, ms_within


def agreement(reference, estimate, clusters, *, bootstrap=500, seed=0):
    ref, est = np.asarray(reference, float), np.asarray(estimate, float)
    clusters = np.asarray(clusters)
    if ref.shape != est.shape or ref.size < 3:
        raise ValueError("At least three matched pairs are required")
    if not (np.isfinite(ref).all() and np.isfinite(est).all()):
        raise ValueError("All values must be finite")
    diff = est - ref
    bias, sd, var_b, var_w = clustered_limits_of_agreement(diff, clusters)
    out = {"n_pairs": int(diff.size), "n_clusters": int(np.unique(clusters).size),
           "bias_mmhg": bias, "loa_lower_mmhg": bias - 1.96 * sd, "loa_upper_mmhg": bias + 1.96 * sd,
           "sd_between_mmhg": math.sqrt(var_b), "sd_within_mmhg": math.sqrt(var_w),
           "mae_mmhg": float(np.mean(np.abs(diff))), "rmse_mmhg": float(np.sqrt(np.mean(diff ** 2))),
           "within_2_mmhg": float(np.mean(np.abs(diff) <= 2)), "within_3_mmhg": float(np.mean(np.abs(diff) <= 3)),
           "within_5_mmhg": float(np.mean(np.abs(diff) <= 5))}
    mean_pair = 0.5 * (ref + est)
    slope = np.polyfit(mean_pair, diff, 1)[0] if np.ptp(mean_pair) > 0 else 0.0
    out["proportional_bias_slope"] = float(slope)
    bins = {}
    for lo, hi in RANGE_BINS_MMHG:
        m = (ref >= lo) & (ref < hi)
        if m.sum() >= 3:
            bins[f"{lo}-{hi}"] = {"n": int(m.sum()), "bias_mmhg": float(diff[m].mean()),
                                  "mae_mmhg": float(np.abs(diff[m]).mean())}
    out["by_reference_range"] = bins
    if bootstrap:
        rng = np.random.default_rng(seed)
        labels = np.unique(clusters)
        index = {c: np.nonzero(clusters == c)[0] for c in labels}
        stats = []
        for _ in range(bootstrap):
            pick = rng.choice(labels, size=labels.size, replace=True)
            rows = np.concatenate([index[c] for c in pick])
            # Relabel resampled clusters so duplicates stay distinct clusters.
            relabel = np.concatenate([[j] * index[c].size for j, c in enumerate(pick)])
            b, s, _, _ = clustered_limits_of_agreement(diff[rows], relabel)
            stats.append((b, b - 1.96 * s, b + 1.96 * s, np.sqrt(np.mean(diff[rows] ** 2))))
        stats = np.asarray(stats)
        lo, hi = np.percentile(stats, [2.5, 97.5], axis=0)
        out["bootstrap_95ci"] = {"unit": "subject cluster", "replicates": bootstrap,
                                 "bias_mmhg": [lo[0], hi[0]], "loa_lower_mmhg": [lo[1], hi[1]],
                                 "loa_upper_mmhg": [lo[2], hi[2]], "rmse_mmhg": [lo[3], hi[3]]}
    out["note"] = "Synthetic descriptive statistics; not an agreement claim against an approved criterion."
    return out


def repeatability(estimates, sessions):
    """Pooled within-session SD and repeatability coefficient (2.77 * Sw)."""
    est, sessions = np.asarray(estimates, float), np.asarray(sessions)
    ss, dof = 0.0, 0
    for s in np.unique(sessions):
        v = est[sessions == s]
        if v.size >= 2:
            ss += float(np.sum((v - v.mean()) ** 2))
            dof += v.size - 1
    if dof == 0:
        return {"sessions_with_repeats": 0, "within_session_sd_mmhg": None, "repeatability_coefficient_mmhg": None}
    sw = math.sqrt(ss / dof)
    return {"sessions_with_repeats": int(sum((sessions == s).sum() >= 2 for s in np.unique(sessions))),
            "within_session_sd_mmhg": sw, "repeatability_coefficient_mmhg": 2.77 * sw}


def auroc(labels, scores):
    labels, scores = np.asarray(labels, bool), np.asarray(scores, float)
    pos, neg = scores[labels], scores[~labels]
    if pos.size == 0 or neg.size == 0:
        return None
    order = np.argsort(np.concatenate([pos, neg]), kind="mergesort")
    ranks = np.empty(order.size)
    combined = np.concatenate([pos, neg])[order]
    i = 0
    while i < combined.size:  # average ranks for ties
        j = i
        while j + 1 < combined.size and combined[j + 1] == combined[i]:
            j += 1
        ranks[order[i:j + 1]] = 0.5 * (i + j) + 1
        i = j + 1
    return float((ranks[:pos.size].sum() - pos.size * (pos.size + 1) / 2) / (pos.size * neg.size))


def binary_at_threshold(labels, scores, threshold):
    labels, pred = np.asarray(labels, bool), np.asarray(scores, float) >= threshold
    tp, tn = int(np.sum(pred & labels)), int(np.sum(~pred & ~labels))
    fp, fn = int(np.sum(pred & ~labels)), int(np.sum(~pred & labels))
    return {"threshold": float(threshold), "tp": tp, "fp": fp, "tn": tn, "fn": fn,
            "sensitivity": tp / (tp + fn) if tp + fn else None,
            "specificity": tn / (tn + fp) if tn + fp else None}


def interval_metrics(reference, lower, upper):
    ref, lo, hi = (np.asarray(v, float) for v in (reference, lower, upper))
    return {"n": int(ref.size), "coverage": float(np.mean((ref >= lo) & (ref <= hi))),
            "mean_width_mmhg": float(np.mean(hi - lo)), "median_width_mmhg": float(np.median(hi - lo))}
