# Changelog

Repository software and record changes. Evidence levels follow
[repository management](docs/project/repository-management.md). Nothing here is
a clinical or device release.

## Unreleased - 2026-11-28 - Immersive web interface and project presentation

Interface and presentation work only. No change to the Python package, the
measurement contract, the ML stack or any clinical setting.

### Added
- `reports/presentation-2026-11-28/`: standalone 32-slide project presentation
  with a source table, derived-image record and manifest hashes.
- `apps/web/lib/simulator.ts`: browser port of the synthetic applanation
  simulator, simplified feature extraction and deterministic rules.
- `apps/web/components/immersive/`: WebGL iris background driven by routes and
  scroll scenes; blink page transitions.
- Interactive applanation lab on the landing page; simulated practice session in
  the patient view; per-eye trend chart with uncertainty bands, rejected attempts
  and a table view.

### Changed
- `apps/web`: complete visual redesign. Fonts bundled from `@fontsource-variable`
  packages, local SVG icons and generated monograms replace the unpinned
  `lucide@latest` CDN script and placeholder photos; the interface makes no
  third-party requests. `recharts` removed.
- Fictional data is seeded and modelled as per-eye sessions with rejected
  attempts (reason, no value), uncertainty half-widths and delivery states.
- Risk-level badges replaced by review states; the automated "IOP elevated"
  notification replaced by delivery, review and service notices (R01, R13, R22, R23).
- Unavailable demo actions are disabled and labelled. Header section links no
  longer navigate to missing hash routes.

### Unchanged
- `legacy/` snapshots, the persistent fictional-data notice, loopback-only
  development server and pinned lockfile workflow.

## v0.3.0 - 2026-11-23 - ML engineering baseline (synthetic)

Plan and engineered prompt: [phase 0.3 plan](docs/project/plans/2026-11-23-ml-phase-0.3.md).
Decision: [ADR-003](docs/decisions/003-ml-architecture.md).

### Added
- `src/airton/ml/`: physics-informed synthetic air-puff acquisition simulator;
  applanation feature extraction; deterministic acquisition rules; LightGBM
  quality gate; physics ridge, residual LightGBM and residual 1D-ResNet
  heteroscedastic deep ensemble with cross-fitted stacking; normalized split
  conformal intervals; shrinkage-Mahalanobis out-of-domain detection; clustered
  Bland-Altman agreement, subject-bootstrap CIs, repeatability and session yield;
  hash-verified JSON/NPZ bundles; numpy-only inference engine producing
  contract-valid records.
- `src/airton/ml/retinal/`: corrected retinal research framework addressing the
  audited notebook defects (single logit, patient-grouped splits, validation-only
  selection, temperature scaling, frozen threshold, tensor-only checkpoints).
- `scripts/train_iop_model.py`, `scripts/train_retinal_model.py`,
  `ml/configs/`, CLI commands `iop-train` and `iop-demo`.
- 31 tests in `tests/test_ml_iop.py` and `tests/test_ml_retinal.py`, including checks that
  the Colab notebook stays output-free, credential-free and script-driven.
- Optional dependency group `deep`; `ml` now includes scipy and lightgbm.
- CI: quick IOP training and `iop-demo` on all matrix jobs; a separate CPU torch
  job for the deep and retinal tests.
- Google Colab thin runner `ml/notebooks/colab/airton_colab_training.ipynb`
  (Colab Secrets token, credential scrub, pinned ref, results zip) and CUDA
  support: `"device": "auto"` for the deep ensemble, and device plus fp16
  mixed precision for retinal training. CPU results are unchanged.
- Archived synthetic IOP model card, metrics and run manifest in `artifacts/examples/`.

### Changed
- Measurement contract and JSON Schema accept three more rejection reasons:
  `signal_quality`, `out_of_domain` and `estimate_uncertain`. This is a superset;
  existing records stay valid and the original demo output is byte-identical.
- `render_report` takes an optional model label; the default output is unchanged.
- `archive_examples.py` keeps existing deck-figure entries when local renders
  are absent, rather than dropping them from the source manifest.
- Package version 0.1.0 to 0.3.0.

### Fixed during development
- Feature extraction crashed on a flat pressure channel (failed stimulus). It now
  returns no events, which the rules turn into a `signal_missing` rejection. A
  regression test covers it.

### Unchanged
- `legacy/` snapshots, recovered notebooks and weights were not modified, executed
  or deserialized. `config/home-monitoring.json` clinical settings remain null.
- `scripts/train_synthetic.py` (M10) is retained as the historical exercise.

## v0.2.0 - 2026-10-04

Source recovery, audits, specification and quality records. See
[verification](docs/software/verification.md).
