# Threat model and privacy plan

**Current boundary:** synthetic local software. **Target boundary:** device,
mobile/application gateway, cloud services, clinician clients and research exports.

| Threat | Proposed control | Evidence required before clinical service |
|---|---|---|
| Device impersonation / copied credentials | Unique device keys, scoped identity, revocation and secure provisioning | Clone/revocation tests; credential inventory |
| Unauthorized patient/tenant access | Server-side assignment/role checks and least privilege | Cross-organization negative tests |
| Wrong subject or eye | Confirmed linkage, laterality display, immutable IDs and amendment trail | Workflow misuse and identity-mismatch testing |
| Lost/stolen device | Minimal local identity, encrypted queue, key protection and lock/revoke flow | Recovery and theft-response drill |
| Altered/replayed data | Authenticated transport, immutable IDs, digest/signature validation and receipt audit | Replay/tamper tests; signed-artifact design |
| Malicious/unsafe firmware | Signed release, secure boot where supported, rollback strategy | Provisioning and update failure tests |
| Secrets in source/logs | Secret management, redacted logging and review tooling | Repository/log review and rotation exercise |
| Exposed storage/backups | Private access, encryption, key management and restore policy | Access review; protected restore test |
| Model/data misuse | Purpose-bound exports, approved license/consent, recorded lineage | Data access review and export audit |
| Unreviewed alert or inference | Clinician-owned policy, visible quality and uncertainty | Human-factors and clinical workflow review |

A pseudonymous identifier can still link to a person; pseudonymization is not an
automatic finding that data is anonymous. Imaging metadata and screenshots may
contain identifying information. Strip unnecessary metadata and assess reidentification
risk before an approved export.

Before collection define purpose, lawful basis/authorization, consent and notice
versions, care/research separation, guardian arrangements if relevant, access roles,
processors, retention, participant requests, withdrawal effects, and incident
ownership. Link each collection/export to the approved protocol and maintain the
identity key in separate restricted storage. An API `synthetic` flag or a consent
boolean is not a production authorization check.

MeitY's official final rules, commencement timeline and corrigendum are listed in
S21-S22. Review applicability as of the planned activity, including staged dates;
do not treat all provisions as either immediately effective or entirely deferred.
The team must designate qualified privacy/regulatory reviewers before real-data
use. No compliance certification is asserted by this design.
