# Data governance and contracts

No raw clinical dataset or retinal images are imported into this repository.
[dataset-registry.json](dataset-registry.json) distinguishes datasets evidenced in
historical notebook sources/logs from candidates and unverified folder/card
references. The ORIGA-derived 650-image Kaggle release and the balanced 336-image
experiment are evidenced; the earlier 455/64-image cohort has unresolved origin.
ACRIMA is claimed in a related model card, not proven training lineage. Exact
patient IDs, split manifests, labels, terms and checkpoint linkage remain gaps.
The registry does not authorize use of any dataset.

Use approved external encrypted storage for real raw/processed data. The ignored
directories are development conventions, not secure storage. Record dataset version,
source, terms, approvals, label definition, patient grouping, checksums and allowed
use before ingestion. Never commit an identity-linkage table or patient images.

See [collection plan](collection-plan.md) and the clinical/privacy documentation.
The current software contract requires `synthetic: true` and demo-prefixed IDs;
a production contract must be separately designed and reviewed.
