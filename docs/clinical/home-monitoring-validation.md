# Home IOP monitoring validation plan

Working plan for the founder-selected intended use. No clinical protocol,
permissions or acceptance limits have been approved by this document.

## Evidence packages and order

| Package | Question | Required record |
|---|---|---|
| Metrology feasibility | Does the physical signal identify pressure despite corneal/fixture confounders? | Traceable model-eye references, uncertainty, raw synchronized signals, all failures |
| Engineering verification | Can the device prevent and terminate unsafe acquisitions under faults? | Independent interlock/fault tests, maximum exposures, power/watchdog/reboot behavior |
| Supervised agreement | Does AirTon agree with the reviewed reference method in intended patients? | Prespecified paired procedure, masked readings, repeated measures and clustered analysis |
| Self-measurement | Can intended patients/caregivers position and operate it safely after realistic training? | Critical-task analysis, use errors, help needed, failures and time; representative low-vision users |
| Home-context evaluation | Does performance remain acceptable across homes, lighting, network, handling and time? | Authorized field protocol, device/site tracking, drift and return inspection |
| Care pathway | Are records delivered, visible, reviewed and acted on under an agreed workflow? | Delivery lag/failure, assignment/access, review acknowledgement, missed-session and support records |
| Post-release surveillance | Does safety/performance remain acceptable in routine use? | Complaint/adverse-event, calibration/service, change and recall processes |

The comparator, measurement order, time interval, masking, repetition, inclusion/
exclusion and corneal covariates should be fixed before enrolment. Investigate
within-patient/eye/session correlation and don't treat repeated readings as
independent subjects. Report bias and agreement with uncertainty and prespecified
acceptance criteria, repeatability, failure rate and subgroup/operator performance.
Correlation or benchmark classification accuracy is not agreement.

A preliminary authorized study can estimate variance and failure rate for a
defensible main-study sample-size calculation. No arbitrary sample number is
claimed sufficient. Biostatistical and clinical review are required before
freezing the protocol. Use [validation plan](validation-plan.md) and
[protocol template](protocol-template.md).

## Home critical tasks

Eligibility/training assessment; confirm correct person and eye; clean/setup;
recognize readiness and alignment; initiate safely; understand rejection and
bounded retry; distinguish an offline record from a delivered record; identify
stale/expired calibration; charge/store correctly; follow care instructions;
contact support/doctor without relying on an unreviewed automatic diagnosis.

Test foreseeable mistakes without coaching away failures. Consider older adults,
poor vision, hand tremor/dexterity variation, caregivers and realistic literacy/
language conditions. Use simulation and benchtop studies first for potentially
hazardous use errors. Do not create human-exposure experiments directly from
this plan.

## Report and care-plan requirements

Every record identifies patient/eye/session, accepted/rejected status, time/clock
trust, device/firmware/calibration/estimator and raw artifact reference. Doctor
views need complete history including failures, late uploads and amendments.
A result can be accepted yet unreviewed; a delivered result can be clinically
uninterpreted. Represent those states separately.

Individual monitoring schedules and contact instructions belong to the treating
clinician. Numeric alert thresholds and medication changes are outside this
repository's default configuration. Clinics must define their actual review
coverage and response obligations before patients rely on connected reporting.

Use [home design guidance](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/design-considerations-devices-intended-home-use)
as an engineering reference and the Indian regulatory framework in
[standards and regulation](../quality/standards-and-regulation.md) for the target
market. An ethics approval or a user study alone does not authorize a commercial device.
