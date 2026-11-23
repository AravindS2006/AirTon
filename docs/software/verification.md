# Verification record

## Repository v0.3.0 - ML engineering baseline

**Date:** 2026-11-23. Windows 11; Python 3.12.10, numpy 2.0.2, scipy 1.16.0,
LightGBM 4.6.0, torch 2.6.0+cpu, torchvision 0.21.0. Synthetic data only. This
verifies software behaviour, not a device or clinical performance.

| Check | Result | Scope / limit |
|---|---|---|
| `python -m unittest discover -s tests -v` | 48 tests passed (17 existing + 31 new) | Physics sanity, rules, feature robustness, LightGBM-to-numpy tree parity, CNN torch/numpy parity, conformal, clustered LoA hand calculation, bundle tamper refusal, contract-valid inference, dataset governance; retinal grouping, freeze, loader, temperature, labels, checkpoints, smoke training |
| `python scripts/check_repository.py` | Passed; 179 local Markdown links | Links, JSON/Python syntax, retained artifact hashes |
| `python scripts/demo.py` | Output byte-identical to archived synthetic examples | Contract reason superset and report label are backward compatible |
| `python scripts/train_iop_model.py --profile quick --no-deep` | Passed in about 13 s; same model ID on repeat | Used by CI |
| `python scripts/train_iop_model.py --profile full` | Passed in about 4.5 min; model `demo-iop-7d8b9861815b` reproduced exactly on a second run | 600 subjects, 7,200 acquisitions, 5-member deep ensemble; train/serve parity 0.0 mmHg |
| `python -m airton.cli iop-demo` | 22/36 new synthetic acquisitions accepted; contract-valid records stored; review rendered | Rejections carry reasons and no value |
| `python scripts/train_retinal_model.py --synthetic-smoke` | Passed | Generated shapes; verifies plumbing, not learning |
| `python scripts/archive_examples.py` | Only the three new IOP files and the examples manifest changed | Previously retained examples and deck manifest byte-identical |

Held-out synthetic results ([generated card](../../artifacts/examples/synthetic-iop-model-card.md)):

| Partition | Accepted | Session yield | Artifact leakage | Bias, clustered 95% LoA (mmHg) | RMSE (95% CI) | 90% interval coverage | Ungated RMSE |
|---|---|---|---|---|---|---|---|
| Test (75 subjects) | 67.4% | 95.7% | 0.0% | -0.02, -3.64 to 3.60 | 1.84 (1.67-1.99) | 92.9% | 7.25 |
| External device lot (100 subjects) | 46.3% | 79.0% | 0.0% | 0.09, -3.98 to 4.16 | 2.07 (1.82-2.35) | 93.5% | 6.46 |

Validation RMSE: physics ridge 1.958, ridge+GBM 1.943, ridge+CNN ensemble 1.930
(selected), stack 1.949. Findings to carry forward: gating is what makes the
estimate usable (ungated error is about four times larger); richer models give
only marginal gains over the physics baseline because the simulator's remaining
error comes from unobserved corneal thickness, ocular pulse and reference noise;
thickness subgroups show -1.1 to +1.3 mmHg bias on test; coverage is marginal,
not conditional, with 85.4% in the external thin-cornea subgroup; and under the
device-lot shift the system abstains more rather than reporting worse values.

Colab runner and CUDA path: the notebook is checked by tests to be output-free,
credential-free and script-driven. It was **not executed in Colab**, and the
CUDA code path was not run because no GPU was available locally. After the
device changes the CPU full profile was re-run to confirm the model ID was
unchanged (see below).

Development defect found by the new tests: a flat pressure channel crashed
feature extraction. It now yields a `signal_missing` rejection with a
regression test. GitHub Actions changes (quick IOP training, `iop-demo` and a
CPU torch job) were not run remotely.

## Repository v0.2.0

**Date:** 2026-10-04. Windows; bundled Python 3.12.14 and Node.js 22.14.0.
The following extends the original synthetic reference checks with actual source
recovery and local prototype verification. It does not verify a medical device.

| Check | Result | Scope / limit |
|---|---|---|
| Python unit/integration suite | 17 tests passed again | Synthetic contracts, rejection, provenance, replay, storage, report/API and non-actuating state model |
| Recovered source integrity | 80 retained artifact hashes recorded and checked | Exact fixed-revision public source, source-only notebooks, five drawings and aggregate figures |
| Notebook privacy structure | Outputs/attachments/execution counts removed | Three archive notebooks; originals remain ignored and were not executed |
| Keras weight verification | M01/M02 size and SHA-256 matched | No model deserialization/inference; HDF5 configuration only |
| React dependencies | Fresh npm ci --ignore-scripts --offline completed, 178 locked packages | Local cache used; not a vulnerability assessment or clinical release |
| React production build | Passed | Bundled CSS; large JavaScript chunk and aged browser-compatibility data warnings remain |
| TypeScript | tsc --noEmit passed | Active working copy; historical archive intentionally not repaired |
| Browser routes | Patient, doctor and admin demo routes inspected | Role selection and mock data; no actual authentication/device/cloud |
| Styling repair | Failed CDN layout observed; CSS moved to local Tailwind/PostCSS build | Local visual recheck; optional icons/images still external |
| Financial arithmetic | Two historical scenarios generated | Monthly rows sum to 200 vs stated 180; not actual accounts |
| Project report | Ten-page PDF rendered and visually inspected | Specification, progress, audits, startup/clinical plans and linked citations |
| Shareable-file review | 242 files reviewed; no token-pattern/private-path/weight/notebook-output findings | Pattern/static checks are not a penetration test or privacy certification |
| Repository checks | Links, JSON/Python syntax, notebook structure and artifact/report hashes checked | See script output; not validation of historical notebook correctness |

GitHub Actions now also configures locked npm installation, TypeScript and web
build checks. No workflow was run remotely. Neither the public inference endpoints
nor clinical uploads/registrations were exercised. Browser checks use only the
local mock app. No raw patient dataset was imported into Git.

The original CDN script generated a tailwind-not-defined error before its removal.
Current layouts were rechecked after the local CSS build. Recharts can still emit
initial container-size warnings on mount; chart labels and the plotted patient
history were visible. This is prototype route/layout verification, not a complete
accessibility, responsive, browser-matrix or clinical workflow acceptance test.

## Original v0.1.0 reference verification

**Date:** 2026-10-04. **Environment:** Windows, bundled Python 3.12.14.
These results establish software behaviors on synthetic data only.

| Check | Result | Scope |
|---|---|---|
| `python -m unittest discover -s tests -v` | 17 tests passed | Strict contracts; quality/clock rejection; raw hashes; replay/conflict/persistence; report/FHIR absent values; grouped splits; bias metrics; HTTP auth/routes/body limits; non-actuating state model |
| `python scripts/demo.py` | Completed; replay tested | 12 fictional records, raw artifacts, SQLite, HTML, illustrative FHIR and manifest |
| `python scripts/train_synthetic.py` | Completed | 100 fictional subjects / 200 eyes, grouped 60/20/20 split, fixed regression, mean baseline and version/hash manifest |
| `python scripts/archive_examples.py` | Completed | Only explicitly selected synthetic outputs and original source material retained |
| `python scripts/check_repository.py` | Passed | Local Markdown links, Python/JSON syntax and retained artifact hashes |
| Browser review of synthetic HTML | Reviewed | Explicit fictional-data banner; OD/OS; timestamps; quality and no-result rows; scrollable table |
| Original PDF inspection | 38-page text extraction; selected design pages rendered/reviewed | Block diagram, MVP requirements/render, Proteus and fundus-output figure |
| Git content integrity | Retained artifact hashes checked against committed blobs | LF text generation and Git attributes preserve manifests across checkout platforms |

The initial test run revealed unclosed SQLite connections on Windows. Connections
now close deterministically after commit/rollback and tests pass including temporary
database cleanup. Timestamps also require an explicit ISO date-time and timezone.

The GitHub Actions workflow is configured for Windows/Linux and Python 3.11/3.12;
it has not been executed remotely. Package installation on a clean machine,
hardware, firmware drivers, real datasets, clinical efficacy, production security,
actual FHIR-profile interoperability and live cloud operation are not verified.
See project status and release gates before making a higher-level claim.
