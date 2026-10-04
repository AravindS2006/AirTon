# Connected home-monitoring operations

Target design; production infrastructure is not provisioned. Device availability
and safe acquisition must not depend on cloud uptime.

## Lifecycle

Provision unique device identity and controlled firmware/calibration at the
service centre. Enrol patient and device through the clinic with a training record.
Use a secure pairing/reassignment procedure; revoke former access after a device
is returned. Credentials belong to an identity/provisioning service, never Git,
a patient-readable client bundle or a placeholder secret fallback.

Retain measurement identity and provenance in an encrypted durable outbox.
Flush only after server acknowledgement of durable storage. Retries are idempotent;
conflicts are quarantined and reported. Bound capacity and indicate full/offline
states without discarding records silently. Test power loss at each write/send/
acknowledgement boundary. Preserve untrusted clocks and ordering metadata.

Server access must check care-team/clinic assignment for every operation.
The UI role is presentation only. Separate authentication, authorization,
clinical review and administrative support access. Model/result amendments must
preserve previous observations and the actor/reason.

## Service checks to implement

| Scenario | Expected evidence |
|---|---|
| Internet loss for a session | Local records retained, explicit offline status and eventual acknowledgement |
| Reboot mid-send | Same ID delivered once; original record neither lost nor changed |
| Queue full | Clear failure/retention behavior with no false delivery |
| Wrong clinic / former doctor | Access denied and attributable audit event |
| Calibration revoked / obsolete estimator | Appropriate acquisition/result quarantine; affected devices traceable |
| Corrupt payload / altered replay | Rejection or explicit conflict; no overwrite |
| Restore from backup | Consistent observations, assignments and audit history with documented recovery |
| Patient/device return | Access revocation, reviewed retention, service and reassignment records |

Choose storage region, service objectives, recovery point/time, retention and
support coverage with the clinical/corporate owners. Do not invent24/7 review
or emergency response in marketing. A delayed report needs a visible state.

Monitor sync delay, queue backlog, rejection/failure rate, device/software/
calibration distribution, drift and service turnaround. Protect identifiers in
logs, dashboards and analytics. Track actual incidents and complaint linkage.

[Security/privacy](security-and-privacy.md), [interoperability](interoperability.md)
and [post-market/service](../quality/post-market-and-service.md) connect this
operating model to requirements. FHIR mapping is an integration specification,
not interoperability certification or automatic access to hospital records.
