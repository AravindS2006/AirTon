"""Residual 1D-ResNet deep ensemble for waveform-level IOP residual estimation.

Training requires torch (optional extra "deep"). Each trained member is exported
to plain numpy arrays with batch-norm folded into the convolutions, so the
runtime (airton.ml.models.cnn_forward) needs only numpy. The network predicts
the residual over the physics ridge baseline with a heteroscedastic Gaussian
head (mean, log-variance), trained with the beta-NLL objective.
"""

import os

import numpy as np

CHANNELS = (16, 32, 64, 64)
KERNEL_STEM, KERNEL_BLOCK = 7, 5


def resolve_device(preference="auto"):
    """'auto' picks CUDA when available (e.g. a Colab GPU runtime), else CPU."""
    import torch

    if preference == "auto":
        return "cuda" if torch.cuda.is_available() else "cpu"
    if preference == "cuda" and not torch.cuda.is_available():
        raise RuntimeError("CUDA requested but no GPU is available")
    if preference not in ("cpu", "cuda"):
        raise ValueError("device must be auto, cpu or cuda")
    return preference


def torch_available():
    try:
        import torch  # noqa: F401
        return True
    except ImportError:
        return False


def _build(n_scalars):
    import torch
    from torch import nn

    class ResBlock(nn.Module):
        def __init__(self, cin, cout, stride):
            super().__init__()
            self.stride = stride
            self.conv1 = nn.Conv1d(cin, cout, KERNEL_BLOCK, stride, KERNEL_BLOCK // 2, bias=False)
            self.bn1 = nn.BatchNorm1d(cout)
            self.conv2 = nn.Conv1d(cout, cout, KERNEL_BLOCK, 1, KERNEL_BLOCK // 2, bias=False)
            self.bn2 = nn.BatchNorm1d(cout)
            self.skip = nn.Conv1d(cin, cout, 1, stride, 0, bias=False)
            self.bn_skip = nn.BatchNorm1d(cout)

        def forward(self, x):
            h = torch.relu(self.bn1(self.conv1(x)))
            h = self.bn2(self.conv2(h))
            return torch.relu(h + self.bn_skip(self.skip(x)))

    class WaveformNet(nn.Module):
        def __init__(self):
            super().__init__()
            self.stem = nn.Conv1d(2, CHANNELS[0], KERNEL_STEM, 1, KERNEL_STEM // 2, bias=False)
            self.bn_stem = nn.BatchNorm1d(CHANNELS[0])
            self.blocks = nn.ModuleList(ResBlock(CHANNELS[i], CHANNELS[i + 1], 2) for i in range(len(CHANNELS) - 1))
            self.head1 = nn.Linear(CHANNELS[-1] + n_scalars, 64)
            self.head2 = nn.Linear(64, 2)
            # Zero-init output: training starts exactly at the physics baseline (residual 0, unit variance).
            nn.init.zeros_(self.head2.weight)
            nn.init.zeros_(self.head2.bias)
            self.dropout = nn.Dropout(0.1)

        def forward(self, wave, scalars):
            x = torch.relu(self.bn_stem(self.stem(wave)))
            for block in self.blocks:
                x = block(x)
            z = torch.cat([x.mean(dim=2), scalars], dim=1)
            out = self.head2(self.dropout(torch.relu(self.head1(z))))
            return out[:, 0], out[:, 1].clamp(-8.0, 8.0)

    return WaveformNet()


def _fold(conv, bn):
    w = conv.weight.detach().double().cpu().numpy()
    scale = (bn.weight / (bn.running_var + bn.eps).sqrt()).detach().double().cpu().numpy()
    bias = (bn.bias.detach().double().cpu().numpy() - bn.running_mean.detach().double().cpu().numpy() * scale)
    return w * scale[:, None, None], bias


def export_state(model, target_scale):
    model.eval()
    state = {"n_blocks": np.array(len(model.blocks)), "target_scale": np.array(float(target_scale))}
    state["stem.w"], state["stem.b"] = _fold(model.stem, model.bn_stem)
    for i, block in enumerate(model.blocks):
        p = f"block{i}."
        state[p + "stride"] = np.array(block.stride)
        state[p + "conv1.w"], state[p + "conv1.b"] = _fold(block.conv1, block.bn1)
        state[p + "conv2.w"], state[p + "conv2.b"] = _fold(block.conv2, block.bn2)
        state[p + "skip.w"], state[p + "skip.b"] = _fold(block.skip, block.bn_skip)
    for name in ("head1", "head2"):
        layer = getattr(model, name)
        state[name + ".w"] = layer.weight.detach().double().cpu().numpy()
        state[name + ".b"] = layer.bias.detach().double().cpu().numpy()
    return state


def train_member(wave, scalars, target, groups, *, seed, epochs=40, batch_size=128, lr=2e-3,
                 weight_decay=1e-4, beta=0.5, patience=8, threads=4, device="cpu"):
    """Train one ensemble member. The internal early-stopping set is a subject-grouped
    slice of the training partition; validation/calibration/test data never enter.

    CPU runs are bit-reproducible. CUDA runs use deterministic kernels where
    available but are not bit-identical to CPU runs, so they yield a different
    bundle (model ID); that is expected and recorded in the run manifest.
    """
    os.environ.setdefault("CUBLAS_WORKSPACE_CONFIG", ":4096:8")
    import torch

    torch.manual_seed(seed)
    torch.set_num_threads(threads)
    if device == "cuda":
        torch.cuda.manual_seed_all(seed)
        torch.backends.cudnn.benchmark = False
        torch.use_deterministic_algorithms(True, warn_only=True)
    else:
        torch.use_deterministic_algorithms(True)
    rng = np.random.default_rng(seed)
    subjects = np.unique(groups)
    stop_subjects = set(rng.choice(subjects, size=max(2, int(0.15 * subjects.size)), replace=False).tolist())
    stop = np.array([g in stop_subjects for g in groups])
    target_scale = float(np.std(target[~stop])) or 1.0
    t = lambda a: torch.as_tensor(np.asarray(a), dtype=torch.float32, device=device)
    W, S, Y = t(wave), t(scalars), t(np.asarray(target) / target_scale)
    tr, st = np.nonzero(~stop)[0], np.nonzero(stop)[0]
    model = _build(scalars.shape[1]).to(device)
    opt = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=weight_decay)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=epochs)

    def loss_fn(mu, logvar, y):
        var = logvar.exp()
        nll = 0.5 * (logvar + (y - mu) ** 2 / var)
        return (nll * var.detach() ** beta).mean()

    best, best_state, bad, history = float("inf"), None, 0, []
    for epoch in range(epochs):
        model.train()
        order = rng.permutation(tr)
        for start in range(0, order.size, batch_size):
            b = order[start:start + batch_size]
            if b.size < 2:
                continue
            opt.zero_grad()
            mu, logvar = model(W[b], S[b])
            loss_fn(mu, logvar, Y[b]).backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 5.0)
            opt.step()
        sched.step()
        model.eval()
        with torch.no_grad():
            mu, logvar = model(W[st], S[st])
            mse = float(((mu - Y[st]) ** 2).mean()) * target_scale ** 2
        history.append({"epoch": epoch, "early_stop_mse": mse})
        if mse < best - 1e-6:
            best, bad = mse, 0
            best_state = {k: v.clone() for k, v in model.state_dict().items()}
        else:
            bad += 1
            if bad >= patience:
                break
    model.load_state_dict(best_state)
    return export_state(model, target_scale), {"seed": seed, "device": device, "epochs_run": len(history),
                                               "best_early_stop_mse": best, "early_stop_rows": int(st.size)}


def torch_reference_forward(state_model, wave, scalars):
    """Torch-side prediction used only by parity tests."""
    import torch

    state_model.eval()
    with torch.no_grad():
        mu, logvar = state_model(torch.as_tensor(wave, dtype=torch.float32), torch.as_tensor(scalars, dtype=torch.float32))
    return mu.double().numpy(), logvar.double().numpy()


def ensemble_predict(states, wave, scalars):
    """Mean residual and total predictive SD (aleatoric + epistemic) in mmHg."""
    from .models import cnn_forward

    means, variances = [], []
    for state in states:
        scale = float(state["target_scale"])
        mu, logvar = cnn_forward(state, wave, scalars)
        means.append(mu * scale)
        variances.append(np.exp(logvar) * scale ** 2)
    means, variances = np.asarray(means), np.asarray(variances)
    mean = means.mean(axis=0)
    total_var = variances.mean(axis=0) + means.var(axis=0)
    return mean, np.sqrt(total_var)
