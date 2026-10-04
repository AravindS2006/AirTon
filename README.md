# AirTon

**Portable, affordable, connected eye-pressure measurement and glaucoma screening research.**

AirTon combines a proposed non-contact air-puff measurement device, optical sensing,
machine learning research, and reports for clinician review. This repository is the
project's working home: source material, evidence, requirements, hardware design
records, software, experiments, clinical planning, and artifacts.

**Current release: research foundation v0.1.0, 4 October 2026.** The runnable software
uses fictional synthetic data. No clinically evaluated AirTon pressure estimator,
glaucoma classifier, hardware driver, or production cloud service is included.
Eye pressure alone cannot establish or exclude glaucoma
([NEI](https://www.nei.nih.gov/eye-health-information/eye-conditions-and-diseases/glaucoma/glaucoma-and-eye-pressure)).

## Start here

| Goal | Location |
|---|---|
| Read the research and recommendations | [Research dossier](research/deep-research.md) |
| Check evidence and original deck claims | [Source register](research/source-register.md), [claim audit](research/deck-claim-audit.md) |
| Understand what exists and what is missing | [Project status](docs/project/status.md) |
| Run the synthetic demonstration | [Getting started](docs/software/getting-started.md) |
| Inspect completed checks and their limits | [Verification record](docs/software/verification.md) |
| Develop the device | [Hardware design](hardware/README.md), [optical feasibility](docs/hardware/optical-feasibility.md) |
| Develop ML models | [ML plan](ml/README.md), [data registry](data/dataset-registry.json) |
| Design connected reports | [System architecture](docs/architecture/system.md), [cloud plan](docs/cloud/architecture.md) |
| Plan studies and risk controls | [Clinical protocol](docs/clinical/validation-plan.md), [risk register](docs/quality/risk-register.md) |
| Organize the next work | [Roadmap](docs/project/roadmap.md), [backlog](docs/project/backlog.md) |
| Review affordability and commercial assumptions | [Cost and market planning](docs/business/cost-and-market.md) |
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
artifacts/       original team PDF, inspected deck figures, synthetic examples
research/        evidence synthesis, citation register, deck audit, search log
docs/            product, architecture, clinical, quality, cloud, project docs
hardware/        hardware specification, BOM planning, CAD/electronics work areas
firmware/        non-actuating firmware state model and implementation plan
src/airton/     contracts, simulator, local API, storage, reporting, evaluation
ml/             model development plan and experiment configuration
data/           dataset metadata, collection contracts; no clinical dataset
models/         model card; restricted weights stored separately
schemas/        strict synthetic measurement JSON Schema
scripts/        reproducible demo, ML exercise, repository checks
tests/          integrity, rejection, API, grouping, and report behavior checks
infra/          provider-neutral deployment and operations requirements
.github/        CI and collaboration templates
```

The device in the deck is dual-eye. The proposed engineering sequence first proves
one measurement channel, then evaluates bilateral operation. This is a development
recommendation; the original dual-eye concept is preserved. See
[ADR-001](docs/decisions/001-measurement-first.md).

Original team attribution comes from the supplied deck: Saravanan R K, Vasanth K,
and Aravindselvan C, Sri Sairam Engineering College, Chennai. Ownership and roles
need team confirmation before publication. [Licensing status](LICENSE.md),
[contributing](CONTRIBUTING.md), [security](SECURITY.md), and
[repository management](docs/project/repository-management.md) describe maintenance.
