# Project status - 2026-10-04

## Evidence available

- User describes portable, low-cost hardware plus ML and connected clinician reports.
- Supplied deck describes a Raspberry Pi 4 block diagram, air pump/valve/nozzle,
  optical sensing, dual-eye concept, Proteus screenshot, 3D model views, Wix site,
  mobile views and a fundus-analysis demo screenshot.
- Deck reports 21 discovery respondents and 25 concept/MVP respondents. No raw
  responses or clinical measurements were supplied.

## Added in repository v0.1.0

- Reviewed research dossier with 31 primary-source entries and a claim audit.
- Product requirements, architecture, feasibility experiments, proposed BOM and
  controlled development gates.
- Clinical, safety, privacy, model-card, collection and experiment templates.
- Runnable synthetic acquisition/storage/report workflow and authenticated local API.
- Grouped synthetic regression exercise; strict schema and automated checks.
- Source artifact preservation and generated-artifact provenance.

## Not available / not demonstrated

No native schematic/PCB/CAD project, actuator driver, physical instrument,
validated optical geometry, reference-linked clinical dataset, clinically evaluated
IOP model, glaucoma classifier, approved clinical protocol, regulatory approval,
secure production cloud or clinician dashboard application has been established
in this workspace. Folder READMEs identify the required deliverables.

Site URLs in the deck could not be fetched by the research reader; their present
availability and source code are unknown. No inference was made about their
deployment status. The default starting assumption is concept/simulation evidence
only until additional team files are supplied.

## Readiness

| Area | Readiness | Next evidence |
|---|---|---|
| Measurement hardware | Concept; native files absent | Optical observable and instrumented bench prototype |
| Firmware | Non-actuating reference state model | Controller selection, interlock specification, hardware verification |
| Software | Tested synthetic research tools | Approved real-data contract and production requirements |
| ML | Pipeline exercise only | Rights-cleared paired signal/reference dataset and frozen evaluation |
| Clinical | Draft study plan | Specialist review, required ethics/regulatory permissions |
| Business | Deck assumptions audited | Supplier quotes and scoped customer pathway |

All clinical/device release gates remain open. Completed software checks establish
only the behaviors covered by those checks.
