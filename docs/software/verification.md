# Verification record - repository v0.2.0

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
