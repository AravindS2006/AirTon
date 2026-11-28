# AirTon project presentation - 2026-11-28

A 32-slide technical presentation of the project as recorded in repository
v0.3.0. It covers the problem, dated history, the founder-selected home-monitoring
direction, measurement physics, hardware and firmware records, the IOP estimation
stack, the retinal research audit, verification, evidence status, hazards,
historical economics and the roadmap.

**State:** presentation of existing repository evidence. It adds no new
measurement, clinical, model or commercial claim. Every slide shows the evidence
levels from [repository management](../../docs/project/repository-management.md)
(supplied, proposed, synthetic, bench, clinical, released). Bench, clinical and
released are never lit because no such evidence exists yet.

## Open it

Open `index.html` in a current desktop browser. It needs WebGL for the background
iris and falls back to a plain gradient without it. Display fonts load from Google
Fonts when online; offline, system fonts are used. The page makes no other network
requests and stores only the sound on/off preference in the browser.

Keys: → or space next, ← back, O all slides, N speaker notes, A autoplay,
M sound, F full screen, . black screen. Slide 8 is interactive.

## Sources for the content

| Slides | Repository source |
|---|---|
| Problem, decision, home workflow | [Specification](../../docs/product/specification.md), [requirements](../../docs/product/requirements.md) |
| Clinic comparison, survey, economics | [July 2025 deck extract](../../research/sources/team-deck-extracted.txt), [SIH 2024 extract](../../research/sources/airton-sih2024-extracted.txt), [claim audit](../../research/deck-claim-audit.md), [business baseline](../../docs/business/baseline.md), [cost and market](../../docs/business/cost-and-market.md) |
| Timeline | [Project history](../../docs/project/history.md), [evidence register](../../docs/project/evidence-register.md) |
| Physics, equations, interactive slide | [Synthetic simulator](../../src/airton/ml/acquisition.py), [features](../../src/airton/ml/features.py), [rules](../../src/airton/ml/quality.py), [estimator config](../../ml/configs/iop-estimator.json) |
| Hardware, drawings, firmware | [Hardware](../../hardware/README.md), [design history](../../hardware/mechanical/design-history.md), [firmware plan](../../firmware/README.md), [state model](../../firmware/state_model.py) |
| Estimation stack and results | [ADR-003](../../docs/decisions/003-ml-architecture.md), [ML workstream](../../ml/README.md), [synthetic model card](../../artifacts/examples/synthetic-iop-model-card.md), [synthetic metrics](../../artifacts/examples/synthetic-iop-metrics.json) |
| Runtime and records | [Measurement contract](../../src/airton/contracts.py), [example records](../../artifacts/examples/synthetic-measurements.json), [ADR-002](../../docs/decisions/002-offline-and-provenance.md) |
| Connected pathway | [Cloud architecture](../../docs/cloud/architecture.md), [interoperability](../../docs/cloud/interoperability.md) |
| Retinal research | [Recovered model audit](../../ml/recovered-model-audit.md), [historical results](../../models/historical-results.json) |
| Verification, evidence, safety, roadmap | [Verification](../../docs/software/verification.md), [status](../../docs/project/status.md), [risk register](../../docs/quality/risk-register.md), [standards](../../docs/quality/standards-and-regulation.md), [roadmap](../../docs/project/roadmap.md), [backlog](../../docs/project/backlog.md) |

The interactive slide re-implements the synthetic simulator and deterministic
rules in JavaScript with the synthetic development limits. The learned gates and
estimators do not run in the presentation. All ML figures are synthetic engineering
results and are labelled as such on the slides.

Left out on purpose: the pitch's global prevalence figure (no source in this
repository), the deck's market sizing (withdrawn by the claim audit) and the Node
prototype's disease probabilities (random numbers).

## Derived images

| File | Derived from | Change |
|---|---|---|
| img/mvp-renders-2025-07.webp | [artifacts/source/deck-figures/page-19.png](../../artifacts/source/deck-figures/page-19.png) | Resized to 1600 px, WebP |
| img/proteus-2025-07.webp | [artifacts/source/deck-figures/page-20.png](../../artifacts/source/deck-figures/page-20.png) | Resized to 1500 px, WebP |
| img/patent-sheet-2026-09.webp | [patent-style drawing PDF](../../artifacts/source/device-drawings/patentdrawing-2026-09-13.pdf) | Rendered at 160 dpi, colours inverted for a dark slide, WebP |

The originals stay unchanged under `artifacts/source/`. Integrity hashes for the
files in this folder are recorded in [the reports manifest](../manifest.json).
Keep this dated folder as it is; a revised presentation belongs in a new dated
folder.
