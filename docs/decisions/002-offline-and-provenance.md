# ADR-002: Acquire locally and preserve immutable measurement identity

**Status:** proposed target; ingestion semantics implemented in the demo.

Assign the measurement ID at capture. Keep laterality, acquisition time, clock
trust, raw hash and version identifiers together. Retries retain this identity.
Exact duplicate payloads acknowledge success; changed content under an existing
ID is a conflict. Amendments become separate audited events rather than overwrites.

A production encrypted outbox is still required. Cloud failure must not alter
instrument safety or manufacture a result. SHA-256 alone is not a device signature.
