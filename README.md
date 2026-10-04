# AirTon

**Portable, affordable home eye-pressure monitoring under a doctor's care.**

AirTon combines a proposed non-contact air-puff measurement device, optical sensing,
machine learning research, and reports for clinician review. The founder confirmed
home IOP monitoring as the first commercial target on 4 October 2026. This repository is the
project's working home: source material, evidence, requirements, hardware design
records, software, experiments, clinical planning, and artifacts.

**Current repository baseline: v0.2.0, 4 October 2026.** Actual historical project
sources have been recovered: three notebooks, six Hugging Face app snapshots,
the React web app, five device drawing PDFs, and two locally stored model files.
The recovered retinal classifiers are research experiments; none is a verified
AirTon pressure estimator or clinically qualified model. The runnable reference
workflow and web dashboards use fictional data. Device, clinical and production
release gates remain open.
Eye pressure alone cannot establish or exclude glaucoma
([NEI](https://www.nei.nih.gov/eye-health-information/eye-conditions-and-diseases/glaucoma/glaucoma-and-eye-pressure)).

## Start here

| Goal | Location |
|---|---|
| Read the current specification and master report | [Home monitoring specification](docs/product/specification.md), [dated master report](reports/airton-project-report-2026-10-04.md), [PDF](reports/airton-project-report-2026-10-04.pdf) |
| Inspect actual recovered project work | [Evidence register](docs/project/evidence-register.md), [project history](docs/project/history.md), [repository map](docs/project/repository-map.md) |
| Run the recovered web interface | [React app](apps/web/README.md), [legacy source audit](docs/software/legacy-audit.md) |
| Inspect actual models and datasets used | [Model registry](models/model-registry.json), [historical model audit](ml/recovered-model-audit.md), [dataset registry](data/dataset-registry.json) |
| Read the research and recommendations | [Research dossier](research/deep-research.md) |
| Check evidence and original deck claims | [Source register](research/source-register.md), [claim audit](research/deck-claim-audit.md) |
| Understand what exists and what is missing | [Project status](docs/project/status.md) |
| Run the synthetic demonstration | [Getting started](docs/software/getting-started.md) |
| Inspect completed checks and their limits | [Verification record](docs/software/verification.md) |
| Develop the device | [Hardware design](hardware/README.md), [optical feasibility](docs/hardware/optical-feasibility.md) |
| Develop ML models | [ML plan](ml/README.md), [data registry](data/dataset-registry.json) |
| Design connected reports | [System architecture](docs/architecture/system.md), [cloud plan](docs/cloud/architecture.md) |
| Plan studies and risk controls | [Clinical protocol](docs/clinical/validation-plan.md), [risk register](docs/quality/risk-register.md) |
| Plan a clinical startup's records and operations | [Quality system](docs/quality/quality-system.md), [home validation](docs/clinical/home-monitoring-validation.md), [production records](quality/production-master/README.md), [service plan](docs/quality/post-market-and-service.md) |
| Organize the next work | [Roadmap](docs/project/roadmap.md), [backlog](docs/project/backlog.md) |
| Review affordability and commercial assumptions | [Cost and market planning](docs/business/cost-and-market.md) |
| Reconcile actual business and IP artifacts | [Business baseline](docs/business/baseline.md), [financial scenarios](business/financial-scenarios.json), [IP status](docs/business/ip-status.md) |
| Review preserved and generated artifacts | [Artifact index](artifacts/README.md) |

## Run locally

Python 3.11+; the core demo requires no third-party packages. Run from this folder:

```powershell
python scripts/demo.py
python -m unittest discover -s tests -v
python scripts/check_repository.py
```

Open `output/demo/review.html`. The demo creates 12 fictional measurements, raw
sample files with SHA-256 hashes, a local SQLite store, a report preview, and
illustrative FHIR observations. A rejected acquisition has no pressure result.
Run the same command again to exercise idempotent ingestion.

The recovered React interface is independently runnable:

```powershell
cd apps/web
npm ci --ignore-scripts --no-audit --no-fund
npm run dev
```

Its role selector is a simulated login; readings, patients and revenue are mock
data. It is not connected to a device, the Python demonstration API or a clinical
service. See the app README for build and TypeScript checks.

Optional grouped ML exercise:

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install -e ".[ml,validation]"
.\.venv\Scripts\python scripts/train_synthetic.py
```

The ML exercise learns an artificial algebraic mapping. Its scores verify an
experiment workflow and have no meaning as clinical performance.

## Repository map

```text
artifacts/       team PDF, recovered drawings, notebook figures, hash manifests
legacy/          immutable recovered GitHub / Hugging Face source snapshots
apps/web/        runnable recovered React interface with explicit demo status
research/        evidence synthesis, citation register, deck audit, search log
docs/            product, architecture, clinical, quality, cloud, project docs
hardware/        hardware specification, BOM planning, CAD/electronics work areas
firmware/        non-actuating firmware state model and implementation plan
src/airton/     contracts, simulator, local API, storage, reporting, evaluation
ml/             three source-only historical notebooks, audits, experiment plan
data/           actual/candidate dataset registry; no raw clinical images
models/         actual model registry/results; two ignored local weight files
quality/        design, production-master and per-device record structure
business/       historical financial assumptions and reconciled scenarios
reports/        dated project specification/progress/evidence report and PDF
schemas/        strict synthetic measurement JSON Schema
scripts/        demo, synthetic ML, model integrity, finance and report generation
tests/          integrity, rejection, API, grouping, and report behavior checks
infra/          provider-neutral deployment and operations requirements
.github/        CI and collaboration templates
```

The device in the July deck is dual-eye. The proposed engineering sequence first proves
one measurement channel, then evaluates bilateral operation. This is a development
recommendation; the original dual-eye concept is preserved. See
[ADR-001](docs/decisions/001-measurement-first.md).

Original team attribution comes from the supplied deck: Saravanan R K, Vasanth K,
and Aravindselvan C, Sri Sairam Engineering College, Chennai. Ownership and roles
need team confirmation before publication. [Licensing status](LICENSE.md),
[contributing](CONTRIBUTING.md), [security](SECURITY.md), and
[repository management](docs/project/repository-management.md) describe maintenance.
