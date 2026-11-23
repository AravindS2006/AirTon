"""Single-logit classifiers with a correct, tested freeze helper."""

ARCHITECTURES = ("resnet18", "resnet50", "efficientnet_b0", "convnext_tiny", "densenet121")


def build_model(architecture="efficientnet_b0", pretrained=False):
    """torchvision backbone with one output logit. Pretrained weights are opt-in; review their licence."""
    import torch
    from torchvision import models

    if architecture not in ARCHITECTURES:
        raise ValueError(f"Unsupported architecture {architecture}")
    weights = "DEFAULT" if pretrained else None
    model = getattr(models, architecture)(weights=weights)
    if architecture.startswith("resnet"):
        model.fc = torch.nn.Linear(model.fc.in_features, 1)
        head = ("fc",)
    elif architecture == "densenet121":
        model.classifier = torch.nn.Linear(model.classifier.in_features, 1)
        head = ("classifier",)
    else:
        last = model.classifier[-1]
        model.classifier[-1] = torch.nn.Linear(last.in_features, 1)
        head = ("classifier",)
    model.head_names = head
    return model


def set_backbone_trainable(model, trainable):
    """Freeze or unfreeze every parameter outside the classification head; the head always trains."""
    head = tuple(f"{h}." for h in model.head_names)
    for name, parameter in model.named_parameters():
        parameter.requires_grad = True if name.startswith(head) else bool(trainable)
    return sum(p.numel() for p in model.parameters() if p.requires_grad)
