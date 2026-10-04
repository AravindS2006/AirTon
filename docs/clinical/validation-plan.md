# Draft clinical validation plan

**Status:** planning template requiring ophthalmologist, biomedical engineering,
biostatistics, ethics and applicable regulatory review. No human study is authorized
by this repository. Fill the protocol template and close the bench/safety gates
before recruiting or applying an experimental stimulus to an eye.

## Study separation

| Stage | Question | Evidence |
|---|---|---|
| Bench / model eye | Is the measured signal observable and reproducible? | Instrument characterization, uncertainty and fault behavior |
| Supervised clinical agreement | Does AirTon's estimate agree sufficiently with the selected comparator? | Paired per-eye measurements, masking, repeats and failure counts |
| Usability | Can intended operators complete or safely stop a session? | Observed tasks, errors, comprehension and assistance |
| Glaucoma risk evaluation | Does a separately defined model support the intended case-finding pathway? | Appropriate clinical reference, frozen threshold and external prospective evaluation |
| Connected workflow | Are reports reviewed and follow-up completed? | Delivery, acknowledgement, referral and missed-follow-up outcomes |

## Pressure agreement study

Specify intended population, care setting, eligible pressure spectrum, exclusions
and operator competency. Define comparator (e.g., clinician-performed Goldmann-type
assessment where appropriate), calibration, pairing interval and measurement-order
plan. Mask comparator operators to AirTon output where feasible. Record both eyes,
all attempts, successful readings, failures, discomfort/adverse events, corneal
context, prior surgery and relevant clinical covariates under the approved protocol.

Predefine repeatability and agreement criteria with the clinical team and relevant
tonometer standard. Use signed bias, limits of agreement and their uncertainty;
analyze range-dependent/proportional errors and participant/eye/visit clustering.
Agreement is not established by correlation or average error alone. Report failure
rate and performance for prespecified subgroups; do not discard failed sessions
from the usability or intent-to-screen denominator.

## Glaucoma risk study

Define the index model/input modality, reference assessment, adjudication and suspect
cases. Reference assessment should support the intended claim rather than reuse
the model's own IOP threshold. Lock preprocessing, weights, domain checks and operating
threshold before final evaluation. Mask reference assessors where feasible and
avoid including test outcome information in predictors. Include ungradable cases
and complete referrals in pathway reporting.

Plan sensitivity, specificity, PPV/NPV at relevant prevalence, calibration, referral
rate, failure rate and subgroup uncertainty. Use independent sites/devices/populations
for external evaluation. Diagnose algorithm performance and clinical pathway
benefit separately. Follow the applicable reporting guidance, including S15.

## Sample size

A survey sample or small process pilot is not a diagnostic accuracy sample-size
justification. As a planning illustration only, an independent-binomial normal
approximation for sensitivity p=0.90 with a 95% half-width d=0.05 gives
`n_positive ≈ 1.96^2 * p * (1-p) / d^2 ≈ 139` **disease-positive independent units**.
This is not 139 total recruits, a final power calculation, or an approved target.
Exact/Wilson planning, specificity precision, prevalence, missing/indeterminate
cases and clustered eyes may change the required count substantially. Have a
biostatistician plan the actual protocol and analysis before enrollment.

## Safety and operational safeguards to specify

Predefined stopping/adverse-event procedures, clinical escalation, participant
withdrawal, investigational-device accountability, operator training, data handling,
monitoring, insurance/compensation where applicable and responsibilities. Consent
does not substitute for device/ethics permissions. No study results or subject
enrollment are present in this repository.
