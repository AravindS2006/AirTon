# Model weights

Two published research weight files are preserved locally: Gmodel.h5 and
my_model2.h5, approximately 189 MB and 74 MB. They are ignored by Git. Their exact
hashes, source revisions, inspected input shapes and unresolved lineage appear
in the [model registry](../model-registry.json). Neither is clinically qualified
or an IOP estimator. No model was deserialized or executed during recovery.

Run `python scripts/fetch_published_models.py` from the repository root to verify
both local files. The script can retrieve the same fixed-revision artifacts on a
different workstation using explicit `--fetch M01` / `--fetch M02`; it validates
the expected hash and never loads the model. Review rights and intended use first.

Use approved artifact storage and immutable
hashes/versions rather than committing restricted or large model files. Record
license, provenance, evaluated input domain and release approval. Demo coefficients
are generated as JSON under ignored `output/ml-synthetic/`.
