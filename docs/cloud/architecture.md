# Cloud and connected-report design

This is a provider-neutral target design. v0.1.0 implements only loopback ingestion,
SQLite persistence and static synthetic report generation. Cloud accounts,
managed databases, MQTT, encrypted outboxes, user accounts and notifications are
not configured.

## Proposed flow

1. Device acquires and assesses quality locally. Assign stable measurement/session
   IDs, laterality and acquisition time. Preserve raw data and version provenance.
2. Save a durable encrypted outbox entry before upload. Mark pending, acknowledged,
   retryable failure or terminal conflict separately from acquisition quality.
3. Establish authenticated transport using unique device identity. MQTT with TLS
   or HTTPS can carry metadata; larger raw files use protected object upload.
4. Gateway authorizes the device/organization binding, validates the production
   schema, deduplicates by immutable identity, verifies artifact hashes and commits
   metadata plus receipt/audit event before acknowledging.
5. Assemble a versioned report only after required artifacts are durable. Associate
   it with the correct subject, eye and care team using an approved identity flow.
6. Clinician reviews, acknowledges or requests reacquisition. Corrections create
   an amendment with author/time/reason. Record follow-up separately.

## Proposed storage boundaries

| Store | Contents | Access |
|---|---|---|
| Clinical identity service | Identifying patient information and linkage | Restricted clinical staff; separate from ML export |
| Metadata database | Sessions, quality, readings, calibration/version IDs | Assigned care team and scoped device ingestion |
| Protected object storage | Raw traces/images and reviewed report files | Short-lived authorized access; no public bucket |
| Audit service | Capture/ingest/read/export/review/amend/admin events | Protected security/compliance roles |
| Research export | Approved pseudonymized subset and manifest | Authorized research project only |

Data residency, retention and processor arrangements require an approved policy;
do not assume that an India region alone satisfies all obligations. Partition
authorization by organization and patient assignment, never only a URL identifier.

## Provider selection and cost

Evaluate managed IoT identity versus a smaller authenticated HTTPS gateway, managed
PostgreSQL, object storage, backups, key management, audit retention and recovery.
Use expected device count, sessions/day, raw bytes/session, retention and clinician
usage to estimate cost. AWS documentation S29 is a security example, not a provider
decision. Obtain dated quotes; no live infrastructure or recurring bill is created.

## Operational acceptance

Verify network loss, device reboot during upload, full queue, credential revocation,
duplicate/conflicting payloads, object mismatch, clock uncertainty, identity
misbinding, backup restore, report amendment and unauthorized cross-organization
access. Define delivery/review targets with the care team before introducing alerts.
Notifications should carry minimal information and links requiring authentication.
