# Interoperability plan

Target FHIR version for initial design: R4 (4.0.1). Use S26-S27 for official
resource definitions. A receiving institution may require its own profile/version.

| AirTon concept | Candidate FHIR resource / field |
|---|---|
| Per-eye measurement | Observation with coded measurement, bodySite/laterality, effective time and UCUM units |
| Rejected acquisition | Observation with dataAbsentReason and quality context; no valueQuantity |
| Instrument | Device with traceable identity/version |
| Report / panel | DiagnosticReport referencing per-eye Observations |
| Original raw artifact | Approved DocumentReference/Media mapping with authorized attachment access |
| Derivation / versions | Provenance and an agreed version/algorithm profile |
| Consent / authorization | Separate Consent and organizational authorization policy as required |
| Access / change events | AuditEvent / receiving system's protected audit model |

The demo provides isolated Observation-shaped JSON using text codes and fictional
Patient/Device references. It is not an exchanged FHIR bundle, a validated profile,
or an ABDM integration. It demonstrates laterality, units and absent-value behavior.

Before integration: select profiles and terminology with the hospital, verify
measurement method/units, create valid referenced resources, distinguish preliminary
and signed reports, validate with the target FHIR validator, test updates/amendments,
authorize exports and establish consent/identity linkage. Do not invent LOINC or
SNOMED codes merely to make a sample look standardized.
