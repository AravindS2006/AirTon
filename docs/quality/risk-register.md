# Preliminary risk register - home monitoring baseline

Qualitative preliminary hazards, not a completed ISO 14971 risk analysis. Severity,
probability, detectability, acceptance rules and residual benefit/risk require
team review. Controls listed here are proposed unless an implementation is named.

| ID | Hazard / failure | Potential effect | Proposed control / verification | Status |
|---|---|---|---|---|
| H01 | Unintended or excessive stimulus | Eye injury/discomfort | Independent physical limits/shutdown, interlocks, fault tests | Open |
| H02 | Unsafe optical exposure | Eye injury | Qualified light-hazard evaluation; exposure controls | Open |
| H03 | Invalid calibration or missed optical event | Misleading reading | Calibration validity, quality rejection, paired-reference evaluation | Synthetic software rules and gates; physical evaluation open |
| H04 | Treating IOP as diagnosis | Missed glaucoma or unnecessary referral | Separate claims, multimodal reference, clinician review | Demo wording; clinical evaluation open |
| H05 | Wrong patient or wrong eye | Incorrect care decision | Confirmed identity, laterality, immutable record, amendments | Demo laterality only |
| H06 | Blink/misalignment forced into estimate | False precision | Detect/reject; limited guided retries and safe stop | Synthetic: blink, alignment, saturation and learned quality gates; 0% artifact leakage on synthetic test; bench evidence open |
| H07 | Lost/delayed report or unreviewed alert | Missed follow-up | Durable delivery, acknowledgement and care-team policy | Open |
| H08 | Leaked health data or unauthorized export | Privacy harm | Scoped access, encryption, minimization, audit and response | Open |
| H09 | Model domain shift / subgroup error | Unequal or misleading output | Representative data, domain rejection, external evaluation and monitoring | Synthetic OOD/uncertainty abstention and subgroup reporting implemented; real external evaluation open |
| H10 | Unsafe update / stale version | Uncontrolled measurement behavior | Signed controlled release, rollback and version audit | Content-hash model IDs and tamper refusal implemented; signing and release process open |
| H11 | Battery/power/thermal fault | Burn, shutdown or corruption | Protected supply, electrical/thermal evaluation and fail-safe states | Open |
| H12 | Infection/contamination or poor cleaning | Patient/operator harm | Reviewed cleaning/air-path design; infection control assessment | Open |
| H13 | Clock error or corrupted/replayed payload | Wrong trend / report integrity | Clock quality, schema, deduplication and conflict detection | Demo software controls only |
| H14 | Lay-user misunderstanding / inaccessible feedback | Unsafe attempt or false reassurance | Representative usability testing, low-vision/language support | Open |
| H15 | Repeat attempts after alignment failures or unsuitable self-use | Excess exposure, discomfort or unusable observations | Reviewed attempt limits, eligibility/training, guided safe stop; R20/R21 | Open |
| H16 | Patient assumes upload means immediate clinician response | Delayed contact or inappropriate self-management | Explicit local/delivered/reviewed state and care instructions; R22/R23 | Open |
| H17 | Device shared, drifted, repaired or returned without controlled release | Wrong attribution, infection or inaccurate home history | Enrolment, cleaning/quarantine, calibration and serial/lot service records; R20/R24 | Open |
| H18 | Synthetic simulator assumptions or synthetic-trained model mistaken for device physics or clinical performance | False confidence; unvalidated model on a real eye | Synthetic labels on every artifact; loader refuses non-synthetic bundles; model card banner; bench refit before any real use (AT-021) | Software controls implemented; procedural control open |
| H19 | Over-trust in uncertainty intervals or abstention settings | Clinician over-relies on a narrow interval; patient loses readings | Report coverage and session yield; marginal-coverage limitation stated; clinically reviewed limits (AT-022) | Synthetic reporting implemented; review open |
| H21 | Model trained on academic-use-only data (e.g. LAG) shipped in a commercial product, demo or website, or the data/weights re-uploaded | Licence breach; withdrawal of product claims | Governance flags in manifests and model cards; weights and data git-ignored; no Colab/Drive upload; licensed commercial dataset before any product use (AT-025) | Controls implemented in software and records; procedural control open |
| H20 | Corneal-thickness-dependent bias not observable by the home device | Systematic over/under-estimation in thin or thick corneas | Subgroup reporting; clinical decision on a clinician-entered CCT covariate (AT-023); labeling | Synthetic CCT subgroup bias quantified; decision open |

For each hazard add initiating events, foreseeable misuse, risk estimates, control
requirements, implementation evidence, verification result, residual-risk review,
owner and sign-off. Unit tests for a simulator do not verify a physical interlock.
