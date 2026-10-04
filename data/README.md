# Data governance and contracts

No clinical dataset is present. `dataset-registry.json` records candidate datasets
and their compatibility with AirTon tasks. It does not authorize downloads or use.

Use approved external encrypted storage for real raw/processed data. The ignored
directories are development conventions, not secure storage. Record dataset version,
source, terms, approvals, label definition, patient grouping, checksums and allowed
use before ingestion. Never commit an identity-linkage table or patient images.

See [collection plan](collection-plan.md) and the clinical/privacy documentation.
The current software contract requires `synthetic: true` and demo-prefixed IDs;
a production contract must be separately designed and reviewed.
