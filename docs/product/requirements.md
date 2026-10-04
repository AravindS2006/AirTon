# Proposed product requirements and traceability

These are working requirements for team review, not approved design inputs.
Numeric clinical, pneumatic and optical limits must be specified by qualified
reviewers before hardware freeze. No numeric safety limit is inferred from the demo.

| ID | Requirement | Verification / evidence | Status |
|---|---|---|---|
| R01 | Separate IOP estimate from glaucoma risk and clinician interpretation | Report wording review; source S01-S03 | Implemented for synthetic preview only |
| R02 | Record OD/OS and retain distinct measurements | Contract/report/FHIR tests | Implemented in demo |
| R03 | Reject bad acquisition with no numerical pressure result | Contract tests; bench fault injection later | Demo implemented; hardware open |
| R04 | Trace stimulus and optical signals to measured time and raw artifact hashes | Synthetic hash test; real timing/uncertainty study | Demo provenance only |
| R05 | Identify device, firmware, calibration and model for every result | Contract tests; controlled release records | Demo implemented |
| R06 | Acquisition safety and shutdown independent of cloud/network/Linux UI | Hardware architecture and fault analysis | Open |
| R07 | No stimulus while misaligned, unhealthy, expired calibration or unsafe condition | Controller simulation plus hardware interlock tests | Simulation only; physical controls open |
| R08 | IOP agreement and repeatability meet approved intended-use criteria | Masked comparator study with clustered analysis | Criteria and study open |
| R09 | Record clock trust and timezone; no silent timestamp correction | Contract tests; real clock-loss study | Demo implemented |
| R10 | Preserve measurement ID on retries; conflicting replay is an error | Storage and HTTP conflict tests | Implemented locally |
| R11 | Capture safely during network loss with bounded encrypted queue | Disconnection/reboot/queue-full tests | Production queue open |
| R12 | Device credentials unique; access limited to assigned care team | Provisioning, isolation and access-control tests | Production open |
| R13 | Reports show quality, provenance and review state without disease reassurance | Synthetic report check; clinician/human-factors review | Preview only |
| R14 | Lay-use success and safe failure meet approved human-factors criteria | Representative usability study; language/low-vision evaluation | Open |
| R15 | Portability, battery life and cleaning criteria fit intended environment | Transport, runtime, cleaning and environmental evidence | Targets open |
| R16 | Train/evaluate ML with patient grouping and independent final test | Split checks, model card, external-domain evaluation | Synthetic split implemented; real study open |
| R17 | Store real data only with approved purpose, governance, controls and retention | Protocol/privacy audit and restore/deletion tests | Open |
| R18 | Serviceability and landed recurring cost meet approved affordability target | Quoted BOM, yield/service cost model | Open |
| R19 | All clinical output/release claims trace to approved evidence | Claim/evidence review and release checklist | Open |

Human safety acceptance criteria include independent shutdown behavior and defined
maximum exposure/pressure/energy, but their numerical values are deliberately
unassigned. Define them through risk management and relevant standards. Proposed
engineering targets such as enclosure mass, session duration and storage capacity
also remain design decisions until approved and measured.
