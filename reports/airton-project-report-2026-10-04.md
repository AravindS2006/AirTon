# AirTon project report

**Specification, recovered progress and startup baseline**

**As of 4 October 2026 | Repository baseline v0.2.0 | Working review document**

## 1. Product direction and present position

The founder has selected **home intraocular pressure (IOP) monitoring for patients
already under a doctor's care** as AirTon's first commercial direction. The system
is intended to help an enrolled patient collect eye-specific measurements at home
and share traceable history with an assigned care team. Clinical design inputs,
eligibility, measurement schedules and escalation instructions still need review.

The original 2024 idea submission already targeted a home-use non-contact
tonometer. Later decks broadened the narrative to glaucoma screening, bilateral
measurement and AI. This baseline restores a focused first indication while
preserving the historical work. Pressure alone cannot establish or exclude
glaucoma; retinal classification is a separate research task. [S01, S02, P02]

Actual historical project files have now been recovered: three training notebooks,
six Hugging Face app snapshots, one React web application, two published Keras
model files, five device drawing PDFs, pitches, a budget and IP drafting material.
These establish real software experiments and concept development. The reviewed
evidence does not establish a calibrated AirTon instrument, authorized home-use
study, manufacturing release, patent filing, incorporation or commercial launch.

This report distinguishes source records, logged experiments, new repository
work and proposed development. Source edit dates do not prove physical milestones.
There is no single defensible percentage complete across all workstreams.

The detailed [product specification](../docs/product/specification.md),
[verified status](../docs/project/status.md), [evidence register](../docs/project/evidence-register.md)
and [source register](../research/source-register.md) are maintained alongside this
dated snapshot. Original document contents are evidence, not instructions to
contact people, execute notebook code, submit forms or publish claims.

---

## 2. Recovered history and configuration

| Artifact date | Primary record | What the record establishes |
|---|---|---|
| 23 August 2024 | SIH2024 idea submission, P02 | Problem 1550: portable non-contact home eye-pressure measurement; concept, not an award or completed instrument |
| November 2024-April 2025 | AIRTON_ML notebook, P03 | Keras CNN source and logged image-classification training |
| February-March 2025 | Six Hugging Face Spaces, P06 | Static, Streamlit, Flask/FastAPI and Node prototype sources at fixed revisions |
| April-May 2025 | Original/copy DeepLearn notebooks, P04-P05 | ORIGA-derived retinal experiments, recorded logs and figures |
| June-July 2025 | Budget Sheet and supplied deck, P09/P01 | Historical financial assumptions, block diagram, simulation screenshots and broad product claims |
| 19 August 2025 | Later pitch, P08 | Arduino/ESP32 description, reported INR 7,000 prototype and projected schedule; no reconciled as-built evidence |
| 6 September 2025 | Patent-form drafting guide, P10 | Preparatory material that acknowledges missing technical detail; no filing acknowledgement |
| 4 November 2025 | airton-web-final GitHub source, P07 | React application at commit 062fa7ac95a13953b2c736f6b19a92dc502161bd |
| 20 November 2025 | Thiruvizhi model record, P12 | Related same-author retinal research; direct AirTon linkage unconfirmed |
| 13 September 2026 | Five device drawing PDFs, P11 | Concept geometry and patent-style reference views; no editable CAD or manufacturing definition |
| 4 October 2026 | Founder direction and repository work | Home monitoring priority, source recovery, audits, configuration and current report |

Provider-created/modified timestamps establish artifact history. Pitch timelines
projected development through July 2026; they are not substituted for completion
records. Later private work may exist. The searches and reviewed connected records
do not amount to an exhaustive internet inventory.

The July deck describes a Raspberry Pi 4 host, while the August pitch names
Arduino/ESP32. The repository records both descriptions and keeps the actual host,
acquisition controller and as-built configuration unresolved. No fabricated PCB,
firmware, CAD dimensions, calibration coefficients or pneumatic limits fill these
gaps. See [history](../docs/project/history.md) and
[mechanical design history](../hardware/mechanical/design-history.md).

---

## 3. Home monitoring specification and hardware

The proposed workflow starts with clinic enrolment, patient training, a named
care team, an assigned device and a clinician-defined plan. The patient confirms
identity and eye; the instrument checks calibration, battery, sensing and
alignment. Failed checks prevent acquisition. Unsuitable acquisitions produce a
reason and no pressure value. Accepted observations retain device, firmware,
calibration, quality and timestamp provenance before local storage and upload.

An encrypted durable outbox must tolerate lost connectivity and interrupted power.
The server acknowledges durable receipt using immutable measurement IDs. The
patient can distinguish saved locally, delivered and reviewed states. Clinician
review uses eye-specific trends and the complete failure history; amendments
preserve original records. The system cannot infer that an upload has been read.

An independent controller must own stimulus timing, watchdogs, exposure limits
and safe shutdown. A Linux host, phone, cloud service or model cannot bypass those
controls. Engineering should first establish one measurement channel and a
repeatable observable on model-eye fixtures, then evaluate bilateral options.

The recovered drawings show visual device concepts, not nozzle geometry,
tolerances, optical paths, material specifications, airflow waveforms, calibration
or physical performance. Air-path pressure is not automatically IOP. Barometric
sensor specifications do not validate tonometry. Corneal biomechanics and optical
timing require characterization before selecting an estimator. [S04-S07, S31]

| Unresolved design input | Required evidence |
|---|---|
| Observable, sensing rate and timing | Raw synchronized bench traces and uncertainty budget |
| Stimulus, optical exposure and safe failure | Reviewed limits, independent controls and fault verification |
| Measurement range, bias and repeatability | Comparator protocol, acceptance criteria and analysis |
| Home positioning and supported users | Representative critical-task studies, training and failure recovery |
| Form factor, battery, cleaning and service | Native design files, environmental verification and service records |
| Cost and production configuration | Supplier quotes, as-built BOM, calibration labour, yield and revision control |

No clinical or actuation numerical limit is invented. The
[home configuration](../config/home-monitoring.json) deliberately leaves them null.
See the [optical feasibility plan](../docs/hardware/optical-feasibility.md),
[bench plan](../docs/hardware/bench-plan.md) and
[home validation plan](../docs/clinical/home-monitoring-validation.md).

---

## 4. Models, datasets actually evidenced and results

The recovered classifiers operate on retinal images. They do not estimate IOP
from air-puff or optical signals. No paired AirTon/reference-pressure dataset was
recovered. The [model registry](../models/model-registry.json) has 11 entries,
including historical, related, synthetic and planned models; it does not imply 11
trained or clinically evaluated AirTon models. The
[dataset registry](../data/dataset-registry.json) distinguishes actual notebook
evidence from candidate releases and unverified folder/card references.

The early notebook defines a 256px Keras CNN with two convolution/pooling blocks,
a dense head and sigmoid output. Logs report 455 training and 64 validation
images and final validation accuracy 0.7656. Dataset origin is unresolved. Source
includes an invalid expression, a zero-valued validation-step calculation, partial
evaluation logic, inconsistent normalization and an incorrect equality check for
sigmoid classification. These logs are historical evidence, not reproducible
independent performance. [P03]

The DeepLearn notebooks download the Kaggle glaucoma-detection release containing
ORIGA-derived images. Recorded distribution: 650 images, 482 normal and 168
glaucoma. The experiment samples 168 normal images to form a balanced 336-image
cohort, then uses an unstratified 75/25 development/validation split, corresponding
to 252/84 images. No patient-group split, frozen identifiers or independent test
cohort is established. ORIGA's original publication is distinct from the mirror's
rights declaration; the exact release and original rights require review. [P04-P05,
S32-S33]

| Experiment | Recorded selected validation result | Material limitation |
|---|---|---|
| VGG19, pretrained | 62/84 = 73.81%; selected epoch 16 | Inference cell uses epoch 11; reused selection validation |
| ResNet18, pretrained | 62/84 = 73.81%; selected epoch 7 | Freeze helper re-enables parameters; no reserved test |
| DenseNet169, custom head | 73.81%; selected epoch 27 | Sigmoid output supplied to CrossEntropyLoss |
| Custom VGG19 head | 42.86%; selected epoch 2 | Sigmoid/CrossEntropyLoss mismatch |
| VGG16 | Architecture displayed | No evidenced training result |

Manual segmentation masks are used to crop the optic disc, but the deployment
path does not reproduce that input pipeline. Training normalization and inference
normalization differ. A copied cup-to-disc function returns a fixed 0.6 ratio; it
is a placeholder, not segmentation or measured CDR.

---

## 5. Weight integrity, result audit and data governance

Two published HDF5 weight files have been downloaded to ignored local storage.
Provider SHA-256 values matched the complete downloaded bytes. HDF5 model
configuration was inspected without Keras deserialization or inference.

| Registry entry | Local artifact | Inspected structure / disposition |
|---|---|---|
| M01 | Gmodel.h5; 189,104,112 bytes | Input 256 x 256 x 3; final single sigmoid output; exact training lineage unproven |
| M02 | my_model2.h5; 74,157,296 bytes | Input 100 x 100 x 3; final single sigmoid output; exact training lineage unproven |
| M08 | Thiruvizhi Hub metadata/code | Card claims EfficientNet/ACRIMA; config and model.py conflict; ViT-named weight not downloaded |
| M09 | AIRTON Hub model repository | Repository exists; no model weight in the inspected revision |

Full hashes, immutable revisions and retrieval commands are in the registry.
`scripts/fetch_published_models.py` verifies local files by default and requires an
explicit fetch selection for downloading. It never executes a model. Artifact
integrity establishes identity, not dataset rights, training lineage or clinical
suitability. Model licences and class mappings remain unresolved. [P06, P12]

The aggregate VGG19 and ResNet18 confusion plots label the classes in the opposite
order to numeric labels used in the source. Interpreting numeric label 0 as normal
and 1 as glaucoma gives VGG19 TN/FP/FN/TP = 39/9/13/23 and ResNet18 = 35/13/9/27.
The resulting audit calculations are sensitivity 63.89% / specificity 81.25% for
VGG19 and 75.00% / 72.92% for ResNet18. Both give 73.81% accuracy on the same
84-image selection-validation cohort. These are recalculations from recorded
figures, not new experiments or clinical performance estimates.

ACRIMA's provider record identifies version 1 and CC BY 4.0. Its original paper
describes 705 images: 309 normal and 396 glaucoma. It is mentioned in the related
Thiruvizhi card but checkpoint use is not verified. Drishti-GS-named files are
present in connected Drive metadata; their use by an AirTon checkpoint is not
established. REFUGE, REFUGE2 and PAPILA remain candidates in the registry. [S10-S13,
S34-S35]

No raw retinal images or patient records were imported into Git. Three tracked
notebooks retain code with outputs removed; originals containing embedded images
and private Drive listings remain under ignored local-private/. Only aggregate
audit figures are retained. All real-data work needs rights, governance, identity
and duplicate review, patient-group partitions, frozen preprocessing, a reserved
external test and a controlled model card. [S15-S17]

Read the [full model audit](../ml/recovered-model-audit.md) and
[historical model card](../models/historical-model-card.md).

---

## 6. Software, IoT, cloud and repository configuration

The actual React 19 / Vite / TypeScript app is preserved at its fixed GitHub commit
under legacy/github/airton-web-final. The editable working copy is apps/web. It
has patient, doctor and admin views, mock service data and a role-selection login.
Random IOP values and financial figures are fictional. There is no authenticated
clinical backend, device integration or verified care-team workflow. [P07]

The working copy now states demonstration status on every route, reflects the
home-monitoring direction, removes unsupported accuracy/testimonial/company and
HIPAA claims, restores the missing stylesheet, binds local development/preview to
loopback, and removes the Vite definition that would expose a Gemini API key.
Original upstream files remain unchanged. Styling now builds locally with pinned
Tailwind/PostCSS dependencies and system fonts after a CDN failure was observed.
Optional icons and placeholder images remain external prototype dependencies.

Six recovered Hugging Face apps document real historical implementation attempts.
They are not interchangeable production services. Material issues include random
disease scores in the Node API, hardcoded secret placeholders, unrestricted
uploads, fragile JSON user storage, missing/import-conflicting dependencies,
preprocessing mismatch and missing referenced checkpoints. Runtime metadata is a
dated Hub snapshot, not end-to-end service verification. No patient data was
uploaded to any public demo. See [legacy audit](../docs/software/legacy-audit.md).

The separate Python reference workflow is synthetic-only. It provides strict
contracts, quality/clock rejection, null IOP on rejected acquisitions, raw-file
hashes, immutable idempotent SQLite ingestion, loopback bearer-token HTTP examples,
HTML reports and illustrative FHIR observations. Its artificial regression
exercise demonstrates subject-group splits and experiment provenance; scores have
no clinical meaning. The React app is not wired to this API.

| Repository area | Purpose |
|---|---|
| legacy/, ml/notebooks/archive/, artifacts/ | Preserved sources, sanitized notebooks, drawings and integrity manifests |
| apps/web/, src/airton/, tests/, scripts/ | Runnable prototype/reference software and verification tools |
| hardware/, firmware/, config/, schemas/ | Engineering work areas and explicit current configuration boundaries |
| docs/, quality/, business/, reports/ | Specification, decisions, clinical/quality/startup records and dated reports |
| data/, models/, research/ | Dataset/model lineage, historical results and primary-source citations |

Production work requires unique device identities, secure provisioning, patient
and care-team authorization, encrypted storage/transport, durable acknowledgements,
clock trust, audit trails, backup/restore evidence and incident operations. FHIR
shapes are examples until a profile and interoperability testing are completed.
[S26-S29] See [cloud operations](../docs/cloud/operations.md).

---

## 7. Clinical, regulatory and quality pathway

The first evidence programme needs to answer three separate questions: does the
instrument measure a defensible physical observable, does the complete calibrated
device agree with an appropriate reference, and can intended patients operate it
at home safely and produce usable records? Office accuracy alone does not answer
the home-use question. FDA home-use guidance is a design reference; it does not
authorize use in India. [S36]

Begin with controlled model-eye and fault verification. An authorized supervised
comparator study then needs frozen design, eligibility, reference method,
clinically reviewed acceptance criteria, masking/order controls, repeatability,
subgroup analysis, adverse-event management and all failure/rejection records.
Paired and repeated observations need appropriate clustered analysis. Sample size
must follow precision and risk requirements, not a convenient round number.

Home validation adds low-vision, dexterity, language, caregiver, training-retention,
alignment, storage, cleaning, network and power interruption tasks. A patient can
complete a session while delivery fails; those outcomes must remain distinguishable.
Clinical review assignment and support capacity are parts of the system.

CDSCO's ophthalmology list places an ophthalmic tonometer in Class B. AirTon's
final indication and added software claims require qualified classification and
pathway review under the Medical Devices Rules and applicable amendments. There
is no recovered AirTon authorization. ISO 8612 tonometer requirements,
ISO 15004-2:2024 optical hazard protection, ISO 14971:2019 risk management and
IEC 62304 software lifecycle are relevant reference areas. Catalogues establish
scope; licensed normative clauses and applicability assessment are still needed.
[S18-S20, S23-S25, S37]

India's final DPDP Rules were notified in 2025 with staged commencement. The
official rule, timeline and corrigendum must be read together at the time of each
processing/release decision; this repository does not treat all obligations as
already commenced on 4 October 2026. Data notices, purpose, rights handling,
vendor responsibilities and security controls need reviewed implementation.
[S21-S22]

The repository now provides a design record index, risk and requirements records,
review/change/CAPA concepts, design-history structure, production-master structure
and per-device history template. These are organized working records, not an
ISO certificate or approved manufacturing file. Supplier qualification, incoming
inspection, production tests, calibration traceability, serial/lot history,
complaints, service and surveillance remain release work. See
[quality system](../docs/quality/quality-system.md) and
[post-market/service plan](../docs/quality/post-market-and-service.md).

---

## 8. Business, affordability and intellectual property

The pitches describe a low-cost product, but prototype price and a business
forecast are not an as-built cost or sales ledger. The reported INR 7,000 prototype
has no itemized supporting BOM. Other capital/prototype estimates differ across
documents. No incorporation, financing receipt, commercial invoice or sales
record was recovered. These states remain unverified. [P01, P08-P09]

The financial Sheet uses INR 35,000 selling price, INR 25,000 COGS and INR 12,59,000
annual fixed costs. Its monthly unit rows sum to 200; the displayed annual total
says 180. Both are preserved as historical planning scenarios, recalculated by
scripts/financial_scenarios.py.

| Reconciled hardware-only scenario | Stated 180 units | Row-derived 200 units |
|---|---|---|
| Revenue | INR 63,00,000 | INR 70,00,000 |
| COGS | INR 45,00,000 | INR 50,00,000 |
| Contribution | INR 18,00,000 | INR 20,00,000 |
| Result after listed fixed costs | INR 5,41,000 | INR 7,41,000 |

Contribution is INR 10,000 per unit, or 28.57% of selling price; hardware-only
break-even is 126 units using these assumptions. Consulting revenue is separately
assumed at INR 20,000/month, without a cost estimate. Taxes, financing, yield,
clinical/regulatory work, warranty, service/calibration and working-capital timing
are not fully represented. These values are scenario arithmetic, not profit or
revenue achieved by AirTon.

Capital totals and debt/equity splits also conflict. Component costs summing to
INR 20,000, a separate INR 5,000 variable-cost figure and INR 25,000 COGS require
reconciliation. A startup budget must include landed parts, fixture/tooling,
calibration labour, rejects, field service, replacements, study/regulatory work,
cloud operations and clinician workflow cost. Device sale versus clinic-managed
rental/loan needs attributable affordability and service-capacity research.

The recovered patent document is a drafting guide, and the 2026 patent-style
drawing is a concept record. Neither proves filing, novelty or grant. Prior
portable non-contact and handheld tonometer publications exist. A scoped prior-art
and freedom-to-operate review needs current legal status, claim mapping, ownership,
inventorship and counsel review; no legal conclusion is made here. [S38-S40]

See [business reconciliation](../docs/business/baseline.md),
[financial scenarios](../business/financial-scenarios.json) and
[IP status](../docs/business/ip-status.md).

---

## 9. Next decisions and evidence gates

| Priority | Work package | Reviewable exit evidence |
|---|---|---|
| Immediate | Review founder-selected indication, users and care responsibilities | Clinician-reviewed intended use and signed design inputs |
| Immediate | Obtain native CAD/PCB/Proteus, firmware, as-built BOM and bench records | Provenance/revision inventory and measured evidence |
| Immediate | Select and characterize a physical observable | Model-eye traces, timing/uncertainty budget and go/no-go review |
| Immediate | Define independent safety controls | Risk/control crosswalk and bench fault-verification criteria |
| Before further ML claims | Resolve dataset/checkpoint/classes and correct evaluation | Rights-cleared patient-group splits, reproducible preprocessing, reserved test and reviewed card |
| Before supervised study | Freeze comparator protocol and permissions | Authorized protocol, statistics, consent/data plan and trained operators |
| Before home study | Verify training, positioning and complete delivery/review pathway | Critical-task plan, safe failures, care assignment and service capability |
| Before production | Control manufacturing, calibration and operations | Reviewed master/device history records, supplier evidence and release decision |
| Before launch claims | Reconcile legal, clinical, business and IP states | Applicable permissions, verified claims, attributable costs and service capacity |

Retinal classification and bilateral acquisition are optional expansions with
their own evidence gates. They should not prevent the pressure-monitoring problem
from receiving adequate metrology, home-use and service work. The dated
[roadmap](../docs/project/roadmap.md), [backlog](../docs/project/backlog.md) and
[design record index](../docs/quality/design-record-index.csv) track this work.

Local software checks address fictional reference behavior and prototype build
integrity. They cannot close physical, clinical, usability, manufacturing or
regulatory gates. The [verification record](../docs/software/verification.md)
records executed checks and their limits; CI is configured, not remotely executed.

Repository maintenance should retain dated reports, immutable source versions,
review states and change impact. Attach new results to requirements/risks and
record actual failures as well as successful measurements. Store patient data and
restricted weights in governed artifact storage, not merely ignored directories.

---

## 10. Citations and project provenance

S-identifiers refer to the full [40-source primary evidence register](../research/source-register.md).
The following references support the central decisions in this report. Publication
results, comparator specifications and regulator guidance do not validate AirTon.

- S01: [National Eye Institute, Glaucoma and Eye Pressure](https://www.nei.nih.gov/eye-health-information/eye-conditions-and-diseases/glaucoma/glaucoma-and-eye-pressure).
- S02: [NICE NG81, glaucoma recommendations](https://www.nice.org.uk/guidance/ng81/chapter/Recommendations).
- S04: [Kempf et al., eye deformation in non-contact tonometry](https://pubmed.ncbi.nlm.nih.gov/17945901/), DOI 10.1109/IEMBS.2006.259905.
- S08: [iCare HOME2 patient instructions](https://patients.icare-world.com/wp-content/uploads/2022/08/iCare_HOME2_Instruction_Manual_TA023-117-US-2_0.pdf): existing home-use comparator, different technology; verify market-specific current IFU.
- S15: [TRIPOD+AI reporting guidance](https://www.bmj.com/content/385/bmj-2023-078378).
- S16: [Good Machine Learning Practice principles](https://www.fda.gov/media/153486/download?attachment=).
- S18: [CDSCO ophthalmology device classification](https://cdsco.gov.in/opencms/resources/UploadCDSCOWeb/2018/UploadPublic_NoticesFiles/9Ophthalmology_classification.pdf).
- S19: [Medical Devices Rules, 2017](https://www.mohfw.gov.in/sites/default/files/Medical%20Device%20Rules%2C%202017.pdf), read with applicable amendments in the [official Gazette index](https://cdsco.gov.in/opencms/opencms/en/Notifications/Gazette-Notifications/).
- S21-S22: [MeitY final DPDP Rules and timeline index](https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa?pageTitle=Digital-Personal-Data-Protection-Rules-2025%3B), [Gazette text](https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf).
- S23: [ISO 8612:2009 catalogue](https://www.iso.org/cms/live/live/en/sites/isoorg/contents/data/standard/04/45/44536.html?browse=tc).
- S24: [ISO 15004-2:2024 catalogue](https://www.iso.org/standard/79919.html).
- S25: [IEC 62304 catalogue, 2006+A1:2015](https://webstore.iec.ch/en/publication/22794).
- S26-S27: [FHIR R4 Observation](https://hl7.org/fhir/R4/observation.html), [DiagnosticReport](https://hl7.org/fhir/R4/diagnosticreport.html).
- S31: [Air-puff model-cornea numerical study](https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0165669).
- S32: [ORIGA original publication](https://doi.org/10.1109/IEMBS.2010.5626137), [author bibliographic record](https://scholars.duke.edu/publication/1148065).
- S33: [Kaggle glaucoma-detection mirror named in notebook](https://www.kaggle.com/datasets/sshikamaru/glaucoma-detection).
- S34-S35: [ACRIMA data record](https://figshare.com/articles/dataset/ACRIMA_database/7613135), [original 2019 study](https://pmc.ncbi.nlm.nih.gov/articles/PMC6425593/).
- S36: [FDA, Design Considerations for Devices Intended for Home Use](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/design-considerations-devices-intended-home-use), final November 2014.
- S37: [ISO 14971:2019 catalogue](https://www.iso.org/standard/72704.html), confirmed 2025.
- S38-S40: [IP India e-services](https://www.ipindia.gov.in/pages/e-services), [US8652044B2](https://patents.google.com/patent/US8652044B2/en), [US4724843A](https://patents.google.com/patent/US4724843A/en): prior-art orientation, not an FTO opinion.

Actual project sources P01-P14, connected-provider metadata and immutable revisions
are in the [project evidence register](../docs/project/evidence-register.md) and
[recovery manifest](../artifacts/recovery-manifest.json). The user-linked original
[DeepLearn notebook](https://drive.google.com/file/d/1tcB_8hYnjPvaf0TgD9H_0mBMxsYeHvoA/view)
and actual [React repository](https://github.com/AravindS2006/airton-web-final/tree/062fa7ac95a13953b2c736f6b19a92dc502161bd)
are central recovered source records. The supplied 38-page July deck is preserved
unchanged locally. Original source documents retain their own attribution and
rights; repository organization does not confer permission to redistribute or
commercially use datasets, code or models.
