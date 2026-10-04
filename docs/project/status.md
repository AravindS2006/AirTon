# AirTon verified progress - 2026-10-04

Product priority confirmed by the founder: **home IOP monitoring for patients
already under a doctor's care**. Repository baseline v0.2.0.

This record supersedes the initial deck-only v0.1.0 assessment. The new recovery
establishes real historical software and ML work. It does not establish a
clinically validated instrument or commercial release.

| Workstream | Evidence recovered | Established progress | Remaining gap |
|---|---|---|---|
| Product origin | SIH2024 deck, modified 23 August 2024 | Home non-contact IOP concept, problem 1550 | Reviewed intended-use/clinical design inputs |
| Hardware | July 2025 block diagram/Proteus screenshots; five drawing PDFs dated 13 September 2026 | Concepts and visual design records exist | Native CAD/PCB/Proteus, as-built BOM, firmware, raw bench evidence |
| Early ML | AIRTON_ML notebook, modified 5 April 2025 | 256px Keras CNN; logs report 455 train and 64 validation images | Dataset provenance, split/label mapping, reproducible valid evaluation |
| ORIGA ML | Original and copy notebooks, May 2025 | VGG19, ResNet18, DenseNet169, custom VGG experiment code and output logs | Independent test, participant grouping, corrected preprocessing and labels |
| Published weights | my_model2.h5 and Gmodel.h5 | Files downloaded locally, provider SHA-256 matched; HDF5 structure inspected | Dataset/checkpoint lineage and clinical qualification |
| Retinal model | Thiruvizhi Hub record, 20 November 2025 | Published card/config/code/weight metadata | Card/config/code/filename conflict; AirTon linkage is unconfirmed |
| Web product | GitHub airton-web-final, 4 November 2025 | React role dashboards recovered; local working copy | Mock login/readings/business figures; no actual backend/device integration |
| IoT/cloud | Six AirTon Hugging Face app snapshots | Several inference and account/history prototypes | Production security, durable delivery, assigned clinician review and operations |
| Discovery/business | July/August pitches and financial Sheet | Survey summaries, pricing and forecasts documented | Raw customer evidence, reconciled budget, quotes, company and sales records |
| IP | Patent-forms drafting guide; patent-style drawing | Preparatory drafting/drawing work | Filed application/acknowledgement, ownership and counsel review |
| Clinical | No AirTon study report recovered | Study and home-use plans organized in repository | Authorized studies, safety/accuracy/usability results and permissions |
| Repository | Source/hash manifests, registries, specification and quality records | Actual sources now organized with a synthetic reference workflow | Team adoption, reviewed records and ongoing evidence maintenance |

[Evidence register](evidence-register.md) supplies source links and
[history](history.md) separates dated artifacts from pitch projections.
[Software audit](../software/legacy-audit.md) and
[ML audit](../../ml/recovered-model-audit.md) contain the material findings.

Do not report a single percentage complete. Design, metrology, clinical,
manufacturing and commercial readiness have different gates. Current device
stage is concept/prototype research with recovered software experiments.
The physical build, agreement, home-use validation, manufacturing readiness
and clinical/commercial release gates have not been closed by the reviewed files.

Repository additions on 4 October 2026 are repository work, not retroactive
AirTon clinical or engineering achievements. File upload/edit dates establish
artifact history, not when hardware was built or a claim independently validated.

The recovered September 2026 drawings are the latest hardware artifacts found.
The public AirTon website commit is November 2025. Later private engineering or
clinical work may exist; no assertion of an exhaustive internet inventory is made.
