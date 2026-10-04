# Preliminary risk register - home monitoring baseline

Qualitative preliminary hazards, not a completed ISO 14971 risk analysis. Severity,
probability, detectability, acceptance rules and residual benefit/risk require
team review. Controls listed here are proposed unless an implementation is named.

| ID | Hazard / failure | Potential effect | Proposed control / verification | Status |
|---|---|---|---|---|
| H01 | Unintended or excessive stimulus | Eye injury/discomfort | Independent physical limits/shutdown, interlocks, fault tests | Open |
| H02 | Unsafe optical exposure | Eye injury | Qualified light-hazard evaluation; exposure controls | Open |
| H03 | Invalid calibration or missed optical event | Misleading reading | Calibration validity, quality rejection, paired-reference evaluation | Demo rejection only |
| H04 | Treating IOP as diagnosis | Missed glaucoma or unnecessary referral | Separate claims, multimodal reference, clinician review | Demo wording; clinical evaluation open |
| H05 | Wrong patient or wrong eye | Incorrect care decision | Confirmed identity, laterality, immutable record, amendments | Demo laterality only |
| H06 | Blink/misalignment forced into estimate | False precision | Detect/reject; limited guided retries and safe stop | Demo rejection only |
| H07 | Lost/delayed report or unreviewed alert | Missed follow-up | Durable delivery, acknowledgement and care-team policy | Open |
| H08 | Leaked health data or unauthorized export | Privacy harm | Scoped access, encryption, minimization, audit and response | Open |
| H09 | Model domain shift / subgroup error | Unequal or misleading risk output | Representative data, domain rejection, external evaluation and monitoring | Open |
| H10 | Unsafe update / stale version | Uncontrolled measurement behavior | Signed controlled release, rollback and version audit | Open |
| H11 | Battery/power/thermal fault | Burn, shutdown or corruption | Protected supply, electrical/thermal evaluation and fail-safe states | Open |
| H12 | Infection/contamination or poor cleaning | Patient/operator harm | Reviewed cleaning/air-path design; infection control assessment | Open |
| H13 | Clock error or corrupted/replayed payload | Wrong trend / report integrity | Clock quality, schema, deduplication and conflict detection | Demo software controls only |
| H14 | Lay-user misunderstanding / inaccessible feedback | Unsafe attempt or false reassurance | Representative usability testing, low-vision/language support | Open |
| H15 | Repeat attempts after alignment failures or unsuitable self-use | Excess exposure, discomfort or unusable observations | Reviewed attempt limits, eligibility/training, guided safe stop; R20/R21 | Open |
| H16 | Patient assumes upload means immediate clinician response | Delayed contact or inappropriate self-management | Explicit local/delivered/reviewed state and care instructions; R22/R23 | Open |
| H17 | Device shared, drifted, repaired or returned without controlled release | Wrong attribution, infection or inaccurate home history | Enrolment, cleaning/quarantine, calibration and serial/lot service records; R20/R24 | Open |

For each hazard add initiating events, foreseeable misuse, risk estimates, control
requirements, implementation evidence, verification result, residual-risk review,
owner and sign-off. Unit tests for a simulator do not verify a physical interlock.
