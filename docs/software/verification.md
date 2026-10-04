# Verification record - v0.1.0

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

The initial test run revealed unclosed SQLite connections on Windows. Connections
now close deterministically after commit/rollback and tests pass including temporary
database cleanup. Timestamps also require an explicit ISO date-time and timezone.

The GitHub Actions workflow is configured for Windows/Linux and Python 3.11/3.12;
it has not been executed remotely. Package installation on a clean machine,
hardware, firmware drivers, real datasets, clinical efficacy, production security,
actual FHIR-profile interoperability and live cloud operation are not verified.
See project status and release gates before making a higher-level claim.
