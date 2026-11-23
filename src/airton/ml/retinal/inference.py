"""Research demonstration inference for the retinal classifier (not a diagnosis).

A demo package (JSON) lists hash-verified tensor-only checkpoints, their
temperatures, the validation-frozen threshold and licence notes. Inputs pass a
heuristic fundus check first; other images are refused without a prediction.
"""

import base64
import hashlib
import io
import json
from pathlib import Path

import numpy as np

from .data import build_transforms, fundus_check, prepare_fundus
from .model import build_model
from .train import load_checkpoint

MAX_PIXELS = 40_000_000
ALLOWED_FORMATS = {"JPEG", "PNG"}


def _sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def _target_layer(model):
    features = getattr(model, "features", None)
    if features is not None:
        return features[-1] if hasattr(features, "__getitem__") else features
    return model.layer4


def head_linear(model):
    head = getattr(model, "fc", None)
    if head is None:
        classifier = model.classifier
        head = classifier[-1] if hasattr(classifier, "__getitem__") else classifier
    return head


def embed_and_logit(model, x):
    """Penultimate embedding (input of the final linear layer) and logit, without gradients."""
    import torch

    store = {}
    handle = head_linear(model).register_forward_hook(lambda m, i, o: store.__setitem__("e", i[0].detach()))
    try:
        with torch.no_grad():
            logit = model(x).squeeze(1)
    finally:
        handle.remove()
    return store["e"].double().numpy(), logit.double().numpy()


def ood_distance(ood, embeddings):
    """Mahalanobis distance inside the PCA subspace."""
    z = (np.asarray(embeddings) - ood["mean"]) @ ood["components"].T
    return np.sqrt(np.maximum(np.einsum("ij,jk,ik->i", z, ood["precision"], z), 0.0))


def ood_residual(ood, embeddings):
    """Norm of the embedding outside the PCA subspace (catches inputs far from every training direction)."""
    centred = np.asarray(embeddings) - ood["mean"]
    return np.linalg.norm(centred - (centred @ ood["components"].T) @ ood["components"], axis=1)


def _colormap(v):
    """Small jet-like colormap without matplotlib; v in [0, 1]."""
    r = np.clip(1.5 - np.abs(4 * v - 3), 0, 1)
    g = np.clip(1.5 - np.abs(4 * v - 2), 0, 1)
    b = np.clip(1.5 - np.abs(4 * v - 1), 0, 1)
    return np.stack([r, g, b], axis=-1)


class RetinalDemoModel:
    def __init__(self, package, members, transform, ood=None):
        self.package, self.members, self.transform, self.ood = package, members, transform, ood

    @classmethod
    def load(cls, package_path):
        import torch

        package_path = Path(package_path)
        package = json.loads(package_path.read_text(encoding="utf-8"))
        if package.get("clinical_use") is not False or package.get("format") != "airton-retinal-demo/1":
            raise ValueError("Unsupported or clinical-use retinal package")
        members = []
        for m in package["members"]:
            path = package_path.parent / m["checkpoint"]
            if _sha256(path) != m["sha256"]:
                raise ValueError(f"Checkpoint hash mismatch: {m['checkpoint']}")
            model = load_checkpoint(build_model(m["architecture"], False), path).eval()
            for p in model.parameters():
                p.requires_grad_(False)
            members.append((m, model))
        ood = None
        if package.get("ood"):
            path = package_path.parent / package["ood"]["file"]
            if _sha256(path) != package["ood"]["sha256"]:
                raise ValueError("OOD statistics hash mismatch")
            with np.load(path, allow_pickle=False) as data:
                ood = {k: data[k] for k in data.files}
        return cls(package, members, build_transforms(package["preprocessing"], train=False), ood)

    def _gradcam(self, model, x):
        import torch
        import torch.nn.functional as F

        store = {}

        def forward_hook(_module, _inputs, output):
            store["a"] = output
            output.register_hook(lambda grad: store.__setitem__("g", grad))

        handle = _target_layer(model).register_forward_hook(forward_hook)
        try:
            with torch.enable_grad():
                inp = x.clone().requires_grad_(True)
                logit = model(inp).squeeze()
                logit.backward()
        finally:
            handle.remove()
        a, g = store["a"][0].detach(), store["g"][0].detach()
        cam = torch.relu((g.mean(dim=(1, 2))[:, None, None] * a).sum(0))
        cam = F.interpolate(cam[None, None], size=x.shape[-2:], mode="bilinear", align_corners=False)[0, 0]
        cam = cam.numpy()
        return (cam - cam.min()) / (cam.max() - cam.min() + 1e-8)

    def predict(self, image_bytes, heatmap=True):
        import torch
        from PIL import Image

        Image.MAX_IMAGE_PIXELS = MAX_PIXELS
        with Image.open(io.BytesIO(image_bytes)) as probe:
            if probe.format not in ALLOWED_FORMATS:
                raise ValueError("Only JPEG and PNG images are accepted")
            probe.verify()
        with Image.open(io.BytesIO(image_bytes)) as img:
            prepared = prepare_fundus(img)
        check = fundus_check(prepared)
        base = {"model_id": self.package["model_id"], "research_only": True, "clinical_use": False,
                "disclaimer": self.package["disclaimer"], "fundus_check": check}
        if not check["looks_like_fundus"]:
            return {**base, "status": "rejected", "probability": None,
                    "message": "This does not look like a colour fundus photograph, so no prediction was made."}
        x = self.transform(prepared)[None]
        probabilities = []
        for k, (meta, model) in enumerate(self.members):
            embedding, logit = embed_and_logit(model, x)
            if k == 0 and self.ood is not None:
                distance = float(ood_distance(self.ood, embedding)[0])
                residual = float(ood_residual(self.ood, embedding)[0])
                base.update({"ood_distance": distance, "ood_threshold": self.package["ood"]["threshold"],
                             "ood_residual": residual, "ood_residual_threshold": self.package["ood"]["residual_threshold"]})
                if distance > self.package["ood"]["threshold"] or residual > self.package["ood"]["residual_threshold"]:
                    return {**base, "status": "rejected", "probability": None,
                            "message": ("This image is unlike the photographs the model was trained on "
                                        "(different camera, framing or not a fundus photo), so no prediction was made.")}
            probabilities.append(1.0 / (1.0 + np.exp(-float(logit[0]) / meta["temperature"])))
        probability = float(np.mean(probabilities))
        threshold = self.package["threshold"]
        result = {**base, "status": "ok", "probability": probability, "member_probabilities": probabilities,
                  "threshold": threshold, "above_research_threshold": probability >= threshold,
                  "label_if_above": self.package["label_mapping"]["1"],
                  "label_if_below": self.package["label_mapping"]["0"]}
        if heatmap:
            cam = self._gradcam(self.members[0][1], x)
            spec = self.package["preprocessing"]
            size, side = int(spec["resize"]), int(spec["center_crop"])
            offset = (size - side) // 2
            crop = np.asarray(prepared.resize((size, size)), dtype=np.float32)[offset:offset + side, offset:offset + side] / 255.0
            overlay = (0.55 * crop + 0.45 * _colormap(cam)) * 255
            buffer = io.BytesIO()
            Image.fromarray(np.clip(overlay, 0, 255).astype(np.uint8)).save(buffer, format="PNG")
            result["heatmap_png_base64"] = base64.b64encode(buffer.getvalue()).decode()
            result["heatmap_note"] = ("Grad-CAM of the first ensemble member: regions that most increased the score. "
                                      "It is an explanation aid, not a lesion map.")
        return result
