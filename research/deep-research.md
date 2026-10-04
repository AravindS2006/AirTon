# AirTon deep research dossier

**Review date:** 4 October 2026. **Baseline:** the user-supplied 38-page AirTon
deck. **Status:** research recommendations, not device certification or a completed
clinical study. Source IDs link to [the source register](source-register.md).

## 1. Research conclusion and project definition

The most defensible starting project is a connected portable **IOP measurement
research platform** with clinician review. The central technical question is
whether AirTon can infer pressure accurately and repeatably from a measured
corneal response at its intended price, size and operator skill level. IoT can
move a reading and ML can fit relationships, but neither compensates for an
unobservable physical signal or incorrect reference labels.

Keep three linked workstreams with independent acceptance criteria:

1. **Measurement:** synchronized pneumatic and optical acquisition, quality
   assessment, calibration, repeatability and agreement with a clinical comparator.
2. **Risk research:** optional fundus or other clinical inputs and glaucoma labels
   supplied by a suitable ophthalmology reference assessment. A pressure-only
   input does not support a claim of comprehensive glaucoma detection.
3. **Care workflow:** traceable measurements, reliable delivery, clinician review
   and follow-up. A delivered report is not the same outcome as a completed referral.

The deck's dual-eye concept remains the long-term design direction. A single-channel
bench prototype is recommended to establish observability, timing and uncertainty
before doubling alignment, pneumatic, optical and ergonomic complexity. The
software already models eye laterality explicitly, so eventual bilateral sessions
can be represented without assuming that paired eyes are independent subjects.

## 2. Clinical framing and intended users

Glaucoma involves optic nerve damage. Elevated IOP is relevant, but people with
high pressure may not have glaucoma and people with apparently normal pressure
may have it (S01). A message such as "normal pressure, no glaucoma" creates false
reassurance. NICE case-finding combines visual fields, optic nerve examination,
Goldmann-type tonometry and anterior chamber assessment; it cautions against
referral decisions based solely on non-contact IOP (S02). Its thresholds belong
to its specific clinical setting and method, so they should not be transplanted
into an unvalidated AirTon home device.

The USPSTF finds insufficient evidence to judge the overall benefit/harm balance
of primary open-angle glaucoma screening in asymptomatic adults aged 40+ (S03).
This does not mean measurement is useless. It means AirTon should measure and
evaluate its chosen pathway instead of claiming that population screening is
already proven to reduce blindness. A clinic-supervised targeted feasibility
study and a future home-monitoring study are different intended uses.

Proposed first users are trained research operators and clinicians working with
approved test fixtures; after bench evidence and applicable approvals, supervised
adult participants may be studied. Ease of use for lay users is a design goal
requiring human-factors evidence. Avoid "operable by anyone" as an established
claim. Develop English and Tamil instructions, assess low vision, language,
dexterity and smartphone access, and record when a trained helper is necessary.
A clinician must own the follow-up policy and urgent-care guidance.

## 3. Measurement physics: what must be observed

The device's line-pressure sensor measures pressure in a pneumatic path. It does
not directly measure internal eye pressure. To estimate IOP, characterize the
stimulus delivered at the eye and detect how the cornea responds. Conventional
non-contact methods observe applanation or deformation; corneal properties and
whole-eye motion affect the response (S04, S31). Reservoir pressure, nozzle
pressure, corneal load and IOP are distinct quantities and should have separate
names, units, calibration records and channels.

A feasible experiment therefore needs a controlled stimulus, a repeatable fixture,
an optical observation of a defined event, a synchronized timestamp, and a
reference whose uncertainty is known. Record raw signals rather than only the
final pressure estimate. Include alignment, blink, saturation, reflection loss,
ambient illumination, distance, sample timing, fixture identity and temperature
in the acquisition record where measured. A model cannot infer missing calibration
provenance from an image after the fact.

The Proteus figure contains a BMP180. The manufacturer specifies a barometric
absolute-pressure device (S05); displaying its reading as mmHg does not establish
IOP measurement. Evaluate bandwidth, dynamic response, tubing resonance, location
and range before selecting a stimulus-monitoring transducer. Do not confuse high
digital resolution with accurate transient pressure measurement. No sensor part
has been approved for the final AirTon design in this repository.

Commercial high-speed imaging illustrates the timing challenge: OCULUS's manual
lists a 4330 frames/s Scheimpflug camera (S06). This is a benchmark, not a mandate
to copy the product. An ordinary video camera may miss the event needed by a
specific estimator. Photodiode/reflection detection may reduce cost and data
volume; imaging may help separate shape from motion but adds optics and processing.
Choose sample rate from the signal bandwidth and timing error budget, not from
marketing camera resolution or a convenient development board.

## 4. Optical alternatives and the interference hypothesis

| Approach | What it observes | Why consider it | Main unresolved issue |
|---|---|---|---|
| Reflection / applanation detector | Optical response around a flattening event | Smaller signal chain and lower data volume | Event definition, alignment and corneal confounding |
| High-speed side/Scheimpflug imaging | Corneal shape and motion through the event | Rich geometry and explicit rejection evidence | Frame rate, illumination safety, cost and packaging |
| Interferometric displacement sensing | Optical path/phase change in a defined geometry | Potential displacement sensitivity | Phase wrapping, speckle, motion, coherent optics and non-contact coupling |
| External fundus imaging | Optic disc/rim appearance | Supports separate glaucoma risk research | Different imaging modality, labeling and acquisition hardware |

The deck does not define an interferometer. Before claiming fringe-based IOP,
specify the light source, reference and sample paths, detector, optical access,
phase retrieval, motion compensation and the transfer from displacement to
pressure. A fringe may track displacement, instrument motion or an inserted
sensor, depending on geometry. These are not interchangeable. Paper titles alone
do not establish a portable non-contact sensing mechanism for AirTon.

Recommended go/no-go experiment: compare reflection, imaging and the proposed
interferometer on the same independently characterized moving test surface and
model-eye fixture. Evaluate signal completeness, displacement agreement, motion
sensitivity, cost envelope and repeatability across independently assembled units.
Predefine the measurable outcome, uncertainty and rejection rate; have an optics
specialist review light hazard requirements under S24 before eye-facing work.
If interference does not add sufficient usable information, select the simpler
observable signal rather than forcing it into the product claim.

## 5. Hardware architecture and affordability

Separate precise acquisition/safety timing from the Linux/network/application
computer. The Raspberry Pi proposed in the deck can host storage, UI and analysis;
a dedicated controller and independent physical protections should own permissive
checks and fail-safe shutdown. Architecture must address unintended activation,
misalignment, stuck valves, brownout, startup states and sensor disagreement.
The current firmware module is only a state-model simulator and cannot actuate
hardware. Numerical stimulus limits remain unset until an expert engineering and
clinical review establishes them.

Portable does not necessarily mean hand-held during measurement. Start with a
portable fixture that establishes reproducible alignment. Record mass, battery
runtime, setup time, recharge behavior, cleaning and transport stability as
measured outcomes. Evaluate bilateral pupil-distance adjustment and operator
visibility only after a reliable channel exists. Simultaneous stimuli may add
coupling and reaction effects; compare them against sequential operation rather
than assuming they improve accuracy.

Affordability must include more than the component list: calibrated test fixtures,
assembly yield, rejected units, safety assessment, tooling, optical alignment,
service/recalibration, warranty, training, consumables, connectivity and clinician
workload. The deck offers several different price points; none is verified by a
supplier BOM. Use the deck's INR 25,000 basic model as a provisional commercial
scenario and explicitly test whether the required measurement system fits it.
Maintain separate prototype, recurring unit and nonrecurring development costs.

## 6. What ML should and should not do

Treat pressure estimation and glaucoma risk as separate supervised tasks.
For pressure estimation, collect AirTon signals with paired reference readings,
fixture and device identities, corneal/clinical covariates where ethically
available, and operator/session metadata. Begin with an interpretable calibrated
regression and compare its residuals against richer models. Add complexity only
if it improves held-out agreement or rejection handling under the intended
operating conditions. Do not label high IOP as glaucoma and then claim that the
model detected glaucoma from its own pressure threshold.

For glaucoma assessment, a possible later pathway uses fundus images and clinical
context. Front-of-eye deformation footage is not a retinal fundus image and
cannot simply be fed to a fundus classifier. Existing public datasets are useful
for method development but not for calibrating AirTon's air-puff instrument:
REFUGE has 1200 labeled/segmented fundus images (S10), REFUGE2 reports 2000 images
(S11), and PAPILA contains 488 images of 244 patients with paired-eye information
and three diagnostic categories (S12). Preserve the suspect category and use
patient identifiers to keep both eyes together. Verify exact release licenses and
access terms before any download (S13).

Data from one camera, institution or curated cohort may not transfer to Chennai
outreach clinics, mobile capture, darker images, cataract, high myopia or low-quality
acquisition. Evidence from an external-evaluation study (S14) motivates validation
on a separate domain; it does not supply a ready-to-use AirTon model. Add an
explicit ungradable/out-of-domain result, not a forced disease probability.

Split by patient; keep both eyes, repeat visits and derivative crops within one
partition. For final evaluation, also hold out site, device or time where possible.
Fit preprocessing only on training data. Choose any operating threshold on a
development/validation set and lock it before testing. Report sensitivity and
specificity at that threshold, prevalence-aware predictive values, calibration,
failure rate, uncertainty and subgroup performance. Use clustered intervals when
patients contribute repeated data. Report results with TRIPOD+AI (S15), use GMLP
principles for lifecycle discipline (S16), and communicate limitations clearly
(S17). Model updates need controlled releases, rollback and renewed evaluation.

The included ML exercise demonstrates patient-grouped train/validation/test sets,
a mean baseline, a linear estimator and reproducible manifests using fictional
features. It contains no retinal model, hardware calibration, real patient data,
or medical performance claim.

## 7. IoT, cloud and doctor workflow

Prefer local capture and durable storage before transfer. Assign a unique
measurement ID at acquisition and preserve it across retries. A server must
acknowledge an identical replay as a duplicate and reject an existing ID with
different content. Network loss should affect delivery status, not the acquisition
or its recorded timestamp. Offline queue encryption, retention, retry backoff and
bounded storage are production tasks; the current demo illustrates ingestion
semantics, not a field-ready transport.

Every report should show laterality, acquisition time and timezone/clock status,
units, accepted/rejected quality, device, calibration, algorithm and firmware
versions, provenance and review status. A missing or rejected reading should not
look like a zero. Do not collapse left and right eyes or silently substitute a
previous reading. Separate report creation, clinician acknowledgement and patient
follow-up in the eventual workflow. Do not create automated medication advice.

Use a device registry and unique credentials per unit (S29), authenticated transport,
least privilege, encrypted storage and protected audit events. If an ESP32 is
selected, secure boot/encryption capabilities depend on hardware revision and
provisioning choices; vendor documentation describes irreversible effects (S28).
Plan secure provisioning rather than adding keys to firmware source.

FHIR R4 Observation and DiagnosticReport provide useful representation patterns
(S26-S27). Real interoperability requires a chosen profile, approved terminology,
laterality representation, consistent referenced resources, consent and audit
mapping, and validation against the receiving system. The sample export uses
local text terminology and fictional references and is explicitly illustrative.
It is not a conformant ABDM integration or a clinical report export.

## 8. Clinical evidence, safety and regulatory path

Progress in stages: observable bench signal; calibrated model-eye studies;
engineering safety evaluation; supervised clinical agreement study under required
approvals; usability evaluation; external prospective evaluation of any risk
model; then the appropriate intended-use release assessment. A concept survey
cannot replace any of these. Maintain requirements, hazards, controls, verification,
changes and approval records from the start.

For pressure agreement, predefine the reference method, trained masked comparator
operator, measurement ordering, pairing interval, repeats, eligible pressure
range and handling of failed acquisitions. Analyze signed bias and limits of
agreement as well as repeatability; correlation alone is insufficient. Handle
patient/eye/visit clustering. Reference measurements have their own uncertainty
and method dependencies. Do not use test-set results to recalibrate the model.

For a glaucoma risk study, use a clinical reference assessment appropriate to
the intended diagnosis; define suspect/indeterminate cases, masking, index-test
failures, disease spectrum, subgroup analyses and follow-up completion. Plan
sample size with a biostatistician around sensitivity/specificity uncertainty,
not just total volunteers. A small 20-30-person pilot can reveal process issues
but cannot establish performance across all intended users and conditions.

CDSCO's ophthalmology list includes ophthalmic tonometers as Class B (S18). The
final hardware/software combination, home use, diagnostic claims and amendments
must be reviewed against the Medical Devices Rules and current notifications
(S19-S20). No licensing eligibility, approval route duration or permission to
test on humans is claimed here. ISO 8612 covers tonometers (S23); ISO 15004-2:2024
addresses eye-directed light hazards (S24); IEC 62304 covers software lifecycle
processes (S25). Full normative texts, applicability and test-lab requirements
remain to be obtained/reviewed. The other standards in the standards matrix are
candidate scopes, not declarations of compliance.

India's final DPDP Rules and official commencement material must be considered,
not only the early 2025 draft (S21-S22). Commencement is staged. Build a privacy
plan now covering purpose, notices, authorization, identity linkage, retention,
correction/erasure handling, processors, access controls and incidents. Have a
qualified reviewer verify which provisions and exceptions apply at the planned
study/release date, including research and healthcare contexts. A research-use
label does not by itself settle privacy or device obligations.

## 9. Commercial and project decisions

Rebuild market sizing from the chosen workflow: eligible clinics in a defined
region, reachable operators, measurements per device, budgets, procurement and
service burden. Patient prevalence is not the same as device purchasers. The
deck's market totals and financial arithmetic need reconciliation before reuse
in a grant or investor pitch. Use measured supplier quotes and separate hardware,
software service, clinician review and acquisition costs.

Compare AirTon against a clinical Goldmann pathway, clinic non-contact devices,
and existing home rebound workflows, using cost, repeatability, training,
failed-acquisition rate, maintenance and follow-up outcomes. iCare HOME2 is an
existing self-measurement comparator (S08); Keeler PSL One is a slit lamp (S09).
Avoid unverifiable star ratings or blanket "first"/"best"/"painless" claims.
Future novelty and freedom-to-operate assessment need a scoped patent review;
this dossier does not establish patentability.

Prioritize the next decisions in this order: intended-use statement; optical
observable and uncertainty budget; independent safety architecture; paired-data
protocol; achievable recurring BOM; clinician workflow; and later multimodal
models. Cloud polish and classifier accuracy cannot unblock an unvalidated
measurement channel. The roadmap converts these decisions into explicit
deliverables and evidence gates.

## 10. Evidence gaps requiring project input

Missing in this workspace: editable Proteus and CAD projects; circuit/PCB revisions;
sensor and optical part numbers; firmware; raw stimuli and optical traces;
calibration records; ethics/study records; dataset terms; model code/weights and
evaluation partitions; cloud architecture and access policy; dated supplier
quotes; anonymized survey responses; and institutional/IP agreements. The
repository provides locations and templates for these without inventing them.
