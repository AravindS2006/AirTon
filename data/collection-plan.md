# Proposed data collection record

Before collection, approve protocol, intended use, safety gates, data purpose,
notice/consent, access and retention. Define a production schema separately from
the synthetic demo contract.

| Category | Required record |
|---|---|
| Study context | Protocol/version, site, approval linkage, operator role |
| Subject linkage | Pseudonymous study ID; separate protected identity map |
| Acquisition | Measurement/session IDs, OD/OS, timestamp/timezone, clock uncertainty |
| Device | Unit/assembly revision, firmware, calibration, diagnostic state |
| Raw stimulus / optics | Channel identity/units, sample times, acquisition settings, integrity hashes |
| Quality | Every attempt, rejection reason, missing/saturated signals, alignment/blink |
| Reference | Method/device, trained operator, calibration, pairing time and repeats |
| Clinical context | Approved covariates, corneal conditions, prior surgery and treatment context |
| Labels | Reference assessment definition, adjudication, suspect/indeterminate category |
| Follow-up | Review/acknowledgement and referral completion where in protocol |
| Governance | Access class, allowed purpose, retention, export approval, derivative lineage |

Do not infer missing covariates, manufacture a clinical diagnosis from IOP, or
exclude failures without preserving them in the enrollment/acquisition denominator.
Inspect metadata for identifying content before any approved export. Data manifests
should point to authorized storage, not public URLs to health records.
