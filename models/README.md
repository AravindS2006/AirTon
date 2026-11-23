# Actual models, lineage and research status

[Registry](model-registry.json) contains the recovered models, related publication,
architecture demonstrations, synthetic exercise and planned physical IOP estimator.
[Historical result record](historical-results.json) distinguishes notebook output
from calculations performed during the source audit.

Two actual Keras files are preserved under ignored models/weights:
Gmodel.h5 (189,104,112bytes) and my_model2.h5 (74,157,296bytes).
Their sizes and SHA-256 match the public fixed-revision Hub metadata. Only HDF5
configuration was inspected; no prediction or TensorFlow model loading was run.

```powershell
python scripts/fetch_published_models.py
# Optional explicit recovery on another machine:
python scripts/fetch_published_models.py --fetch M01
python scripts/fetch_published_models.py --fetch M02
```

See [historical model card](historical-model-card.md) and
[recovered ML audit](../ml/recovered-model-audit.md). Keep clinical and licensing
limitations attached to every use of these artifacts. No validated AirTon
physical-signal IOP model has been recovered.

## v0.3.0 synthetic models

- **M12, synthetic IOP stack.** Generated card:
  [synthetic-iop-model-card.md](../artifacts/examples/synthetic-iop-model-card.md).
  Bundles (JSON/NPZ, hash-verified, no pickle) are regenerated with
  `python scripts/train_iop_model.py --profile full` and are not stored in Git.
  The model ID is the bundle's content hash. The design is in
  [ADR-003](../docs/decisions/003-ml-architecture.md).
- **M13, retinal research framework.** Code only; no weights trained or stored.

Use [model-card-template.md](model-card-template.md) for any non-synthetic model.
Generated synthetic cards follow its fields but cannot substitute for it.
