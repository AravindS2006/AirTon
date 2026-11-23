"""Portable numerical components: numpy-only inference, JSON/NPZ-serializable state.

Training may use LightGBM or torch, but every component here is evaluated with
numpy alone so that a gateway or device host needs no native ML library and no
pickle deserialization.
"""

import math

import numpy as np
from scipy.optimize import nnls

MISSING_CODES = {"None": 0, "Zero": 1, "NaN": 2}


# ---------------------------------------------------------------- linear / scaling
def fit_standardizer(X):
    X = np.asarray(X, dtype=float)
    scale = X.std(axis=0)
    return {"mean": X.mean(axis=0).tolist(), "scale": np.where(scale > 1e-9, scale, 1.0).tolist()}


def standardize(params, X):
    return (np.asarray(X, dtype=float) - np.asarray(params["mean"])) / np.asarray(params["scale"])


def fit_ridge(X, y, alpha=1.0):
    """Closed-form ridge on standardized inputs with an unpenalized intercept."""
    scaler = fit_standardizer(X)
    Z = standardize(scaler, X)
    y = np.asarray(y, dtype=float)
    y_mean = float(y.mean())
    coef = np.linalg.solve(Z.T @ Z + alpha * np.eye(Z.shape[1]), Z.T @ (y - y_mean))
    return {"type": "ridge", "alpha": alpha, "scaler": scaler, "coef": coef.tolist(), "intercept": y_mean}


def ridge_predict(params, X):
    return standardize(params["scaler"], X) @ np.asarray(params["coef"]) + params["intercept"]


# ---------------------------------------------------------------- tree ensembles
def lightgbm_to_trees(booster):
    """Convert a trained LightGBM booster into a flat, JSON-safe tree ensemble."""
    dump = booster.dump_model()
    objective = str(dump.get("objective", "regression")).split()[0]
    trees = []
    for info in dump["tree_info"]:
        nodes = {"feature": [], "threshold": [], "left": [], "right": [], "default_left": [],
                 "missing": [], "value": []}

        def visit(node):
            idx = len(nodes["feature"])
            for key in nodes:
                nodes[key].append(None)
            if "leaf_value" in node and "split_feature" not in node:
                nodes["feature"][idx], nodes["threshold"][idx] = -1, 0.0
                nodes["left"][idx] = nodes["right"][idx] = -1
                nodes["default_left"][idx], nodes["missing"][idx] = True, 0
                nodes["value"][idx] = float(node["leaf_value"])
                return idx
            if node.get("decision_type", "<=") != "<=":
                raise ValueError("Categorical splits are not supported by the portable runtime")
            nodes["feature"][idx] = int(node["split_feature"])
            nodes["threshold"][idx] = float(node["threshold"])
            nodes["default_left"][idx] = bool(node.get("default_left", True))
            nodes["missing"][idx] = MISSING_CODES[node.get("missing_type", "None")]
            nodes["value"][idx] = 0.0
            nodes["left"][idx] = visit(node["left_child"])
            nodes["right"][idx] = visit(node["right_child"])
            return idx

        visit(info["tree_structure"])
        trees.append(nodes)
    return {"type": "tree_ensemble", "objective": objective, "num_features": int(dump["max_feature_idx"]) + 1,
            "trees": trees}


def tree_predict(model, X):
    """Raw score (sum of leaves); applies the sigmoid for binary objectives."""
    X = np.asarray(X, dtype=float)
    if X.ndim != 2 or X.shape[1] != model["num_features"]:
        raise ValueError("Feature matrix width does not match the tree ensemble")
    rows = np.arange(X.shape[0])
    total = np.zeros(X.shape[0])
    for tree in model["trees"]:
        feature = np.asarray(tree["feature"], dtype=int)
        threshold = np.asarray(tree["threshold"], dtype=float)
        left, right = np.asarray(tree["left"], dtype=int), np.asarray(tree["right"], dtype=int)
        default_left = np.asarray(tree["default_left"], dtype=bool)
        missing = np.asarray(tree["missing"], dtype=int)
        node = np.zeros(X.shape[0], dtype=int)
        while True:
            active = feature[node] >= 0
            if not active.any():
                break
            r, n = rows[active], node[active]
            x = X[r, feature[n]]
            is_nan = np.isnan(x)
            go_left = np.where(is_nan, 0.0, x) <= threshold[n]
            as_missing = ((missing[n] == 2) & is_nan) | ((missing[n] == 1) & (is_nan | (np.abs(x) <= 1e-35)))
            go_left = np.where(as_missing, default_left[n], go_left)
            node[active] = np.where(go_left, left[n], right[n])
        total += np.asarray(tree["value"], dtype=float)[node]
    if model["objective"] == "binary":
        return 1.0 / (1.0 + np.exp(-total))
    return total


def train_lightgbm(X, y, *, objective="regression", seed=42, num_rounds=400, learning_rate=0.03,
                   num_leaves=15, min_data_in_leaf=20, feature_fraction=0.9, bagging_fraction=0.8,
                   lambda_l2=1.0, X_valid=None, y_valid=None, early_stopping_rounds=50):
    import lightgbm as lgb

    params = {"objective": objective, "learning_rate": learning_rate, "num_leaves": num_leaves,
              "min_data_in_leaf": min_data_in_leaf, "feature_fraction": feature_fraction,
              "bagging_fraction": bagging_fraction, "bagging_freq": 1, "lambda_l2": lambda_l2,
              "seed": seed, "deterministic": True, "force_row_wise": True, "num_threads": 1,
              "verbosity": -1, "use_missing": False}
    train = lgb.Dataset(np.asarray(X, float), np.asarray(y, float), params={"verbosity": -1})
    callbacks, valid_sets = [], []
    if X_valid is not None:
        valid_sets = [lgb.Dataset(np.asarray(X_valid, float), np.asarray(y_valid, float), reference=train)]
        callbacks = [lgb.early_stopping(early_stopping_rounds, verbose=False)]
    booster = lgb.train(params, train, num_boost_round=num_rounds, valid_sets=valid_sets, callbacks=callbacks)
    if X_valid is not None and booster.best_iteration > 0:
        booster = lgb.Booster(model_str=booster.model_to_string(num_iteration=booster.best_iteration))
    return booster


# ---------------------------------------------------------------- domain detection
def fit_mahalanobis(X, shrinkage=0.1):
    """Shrinkage-covariance Mahalanobis detector on standardized features."""
    scaler = fit_standardizer(X)
    Z = standardize(scaler, X)
    cov = np.cov(Z, rowvar=False)
    cov = (1 - shrinkage) * cov + shrinkage * np.eye(cov.shape[0]) * np.trace(cov) / cov.shape[0]
    return {"type": "mahalanobis", "scaler": scaler, "precision": np.linalg.inv(cov).tolist(),
            "shrinkage": shrinkage}


def mahalanobis_distance(params, X):
    Z = standardize(params["scaler"], X)
    P = np.asarray(params["precision"])
    return np.sqrt(np.maximum(np.einsum("ij,jk,ik->i", Z, P, Z), 0.0))


# ---------------------------------------------------------------- conformal + stacking
def conformal_quantile(scores, alpha):
    """Finite-sample split-conformal quantile: the ceil((n+1)(1-alpha))-th smallest score."""
    scores = np.sort(np.asarray(scores, dtype=float))
    n = scores.size
    if n == 0:
        raise ValueError("Conformal calibration requires scores")
    k = math.ceil((n + 1) * (1 - alpha))
    return float("inf") if k > n else float(scores[k - 1])


def simplex_weights(P, y):
    """Non-negative stacking weights that sum to one (least squares)."""
    P, y = np.asarray(P, dtype=float), np.asarray(y, dtype=float)
    big = 1e3 * max(1.0, float(np.abs(y).max()))
    A = np.vstack([P, big * np.ones((1, P.shape[1]))])
    b = np.concatenate([y, [big]])
    w, _ = nnls(A, b)
    return (w / w.sum()).tolist() if w.sum() > 0 else (np.ones(P.shape[1]) / P.shape[1]).tolist()


# ---------------------------------------------------------------- 1D CNN (numpy runtime)
def _conv1d(x, weight, bias, stride):
    k = weight.shape[2]
    pad = k // 2
    xp = np.pad(x, ((0, 0), (0, 0), (pad, pad)))
    windows = np.lib.stride_tricks.sliding_window_view(xp, k, axis=2)[:, :, ::stride, :]
    return np.einsum("bclk,ock->bol", windows, weight, optimize=True) + bias[None, :, None]


def cnn_forward(state, waveform, scalars):
    """Numpy forward pass of the exported residual 1D-CNN (batch-norm already folded).

    Returns (mean, log_variance) arrays.
    """
    relu = lambda v: np.maximum(v, 0.0)
    x = np.asarray(waveform, dtype=np.float64)
    x = relu(_conv1d(x, state["stem.w"], state["stem.b"], 1))
    for i in range(int(state["n_blocks"])):
        p = f"block{i}."
        stride = int(state[p + "stride"])
        h = relu(_conv1d(x, state[p + "conv1.w"], state[p + "conv1.b"], stride))
        h = _conv1d(h, state[p + "conv2.w"], state[p + "conv2.b"], 1)
        x = relu(h + _conv1d(x, state[p + "skip.w"], state[p + "skip.b"], stride))
    pooled = x.mean(axis=2)
    z = np.concatenate([pooled, np.asarray(scalars, dtype=np.float64)], axis=1)
    z = relu(z @ state["head1.w"].T + state["head1.b"])
    out = z @ state["head2.w"].T + state["head2.b"]
    return out[:, 0], out[:, 1]
