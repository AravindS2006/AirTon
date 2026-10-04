# Historical AirTon source archive

Recovered sources:
- huggingface/spaces: six actual AirTon app variants at fixed Hub revisions.
- huggingface/models: AIRTON repository marker and Thiruvizhi card/config/code.
- github/airton-web-final: exact website source at commit062fa7ac95a13953b2c736f6b19a92dc502161bd.

Original bytes are preserved with legacy/** -text in .gitattributes.
[Recovery manifest](../artifacts/recovery-manifest.json) verifies SHA-256.
Model weights, retinal images, secrets.toml and runtime user data are not
imported into this source archive. Two weight files are locally preserved in the
ignored models/weights directory and recorded in the model registry.

These sources contain known correctness/security defects and unsubstantiated
clinical wording. Preserve them as history and use [software audit](../docs/software/legacy-audit.md)
before considering migration. Clinical/deployment approvals are not implied.
GitHub/most Space snapshots do not declare an open-source license. Ownership and
third-party source attribution need review before redistribution. Thiruvizhi's
card declares MIT; that does not license every dataset or every AirTon component.
