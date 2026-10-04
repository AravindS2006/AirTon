# Where everything belongs

This is a clinical hardware startup repository, so its control records extend
beyond Python/React source. The current source/status is mapped below.

| Area | Folder | Actual content / purpose |
|---|---|---|
| Product | docs/product | Founder-selected home-monitoring specification, requirements and traceability |
| Verified progress | docs/project | Dated history, evidence, open gates, roadmap and backlog |
| External evidence | research | Cited clinical/technical/regulatory dossier, searches and claim audit |
| Original artifacts | artifacts/source | Original deck, reviewed figures and September2026 device drawing PDFs |
| Historical source | legacy | Fixed public Hugging Face and GitHub source snapshots |
| Training history | ml/notebooks/archive | Three actual notebook sources, stripped of private outputs/images |
| Actual model lineage | models | Registry, saved-weight structure, historical results and model cards |
| Large weights | models/weights, ignored | Two actual Keras files preserved locally; hash-verified, not clinically qualified |
| Dataset records | data | Actual/candidate dataset registry, rights and grouping plan; no raw retinal data in Git |
| Hardware | hardware | Recovered mechanical history, proposed electronics/BOM and native-file requirements |
| Firmware | firmware | Non-actuating reference state model; no verified physical driver |
| Active web prototype | apps/web | Recovered React app with fictional-data notice and local configuration |
| Reference backend | src/airton | Tested synthetic acquisition/storage/report/API example |
| Cloud/operations | docs/cloud, infra | Architecture, provisioning, care-team security and operating requirements |
| Clinical | docs/clinical | Paired-reference and home-use validation work packages, protocol planning |
| Quality/design records | docs/quality, quality | Risk, record index, changes/releases, manufacture/service/surveillance |
| Commercial/corporate | docs/business, business | Reconciled historical forecasts and ownership/diligence record guidance |
| Reports | reports | Current master report and later dated project reports |
| Configuration | config, schemas, templates | Baselines, contracts and review-required design settings |
| Verification | scripts, tests, .github | Source/hash/link checks, synthetic tests, scenario generation and CI |
| Restricted local evidence | local-private, ignored | Original notebook outputs and private drafts/extractions; this folder is not an access-control system |

Use actual native files when available: KiCad/Proteus project, editable CAD,
STEP/STL, firmware source/build/flash manifest, acquisition traces and calibration
records. An index identifies missing material without inventing a file.

Do not put patient records, credentials, restricted images, unreviewed model
binaries or confidential legal/corporate originals into Git. Maintain controlled
storage with authorized access and reference hashes/IDs. A public-source snapshot
is preserved as historical evidence; license review is still needed for
redistribution.

To update progress, attach the actual evidence, update its manifest/registry,
record the dated change and review status, and close only the gate demonstrated.
New information can supersede older conclusions without erasing history.
