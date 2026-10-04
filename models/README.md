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
