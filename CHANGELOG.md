# Changelog

Repository software and record changes. Evidence levels follow
[repository management](docs/project/repository-management.md). Nothing here is
a clinical or device release.

## v0.3.2 - 2026-11-23 - Research demo website

### Added
- `/#/demo` page in `apps/web`. The air-puff section runs simulated scenarios through the IOP engine
  with waveform charts and accept/reject explanations. The retinal section uploads a photo for a
  research score with a Grad-CAM heatmap and states its limits.
- `src/airton/ml/demo_api.py` and `scripts/serve_demo_api.py`: loopback-default demo API with CORS
  allowlist, 8 MB upload limit, early 413, in-memory image handling, concurrency limit, no logging.
- `src/airton/ml/retinal/inference.py`: hash-verified demo package; colour gate plus embedding
  OOD gate (PCA Mahalanobis and residual); Grad-CAM. `scripts/select_retinal_demo_model.py` selects
  on validation only.
- `docs/hardware/signal-interface.md`: the signals and metadata real air-puff hardware must provide.
- 7 demo API tests and 1 IOP calibration test.

### Changed / fixed
- LAG academic-use permission from the LAG team recorded (dataset registry, manifest, M14).
- Shared `prepare_fundus` used by both the manifest builder and inference, so preprocessing matches.
- IOP training now fails with a clear message when too few calibration subjects exist; previously
  it crashed while writing an infinite conformal quantile to JSON.
- Grad-CAM overlay geometry follows the package preprocessing instead of a hard-coded crop.
- A first, geometric fundus check rejected 70% of genuine LAG images; it was replaced after measurement.
- ConvNeXt-Tiny run stopped by founder decision; EfficientNet-B0 kept.

## v0.3.1 - 2026-11-23 - First real-data retinal research model (LAG)

### Added
- `scripts/build_retinal_manifest.py`: governed LAG manifest builder. It crops the field of view,
  re-encodes without metadata, groups same-eye repeat captures (thumbnail correlation >= 0.985,
  threshold chosen after visual review) and records the academic-use terms. Output goes to
  git-ignored `local-private/`.
- `ml/configs/retinal-lag.json` and model M14: EfficientNet-B0 trained locally on LAG. Test AUROC
  0.991; card in `artifacts/research/`; weights git-ignored.
- `--finalize-only` for `train_retinal_model.py`: rebuilds reports from a checkpoint and verifies
  the recomputed frozen decisions match.

### Fixed
- Retinal training rebuilt the AdamW optimizer every epoch, resetting its state. It now builds
  once per phase (frozen head, full fine-tune) and uses a cosine schedule.
- The model card, test predictions and secondary operating point were not written, because a
  code edit had silently failed to apply. The smoke test now asserts these outputs exist.

### Records
- M02 provenance corrected: `my_model2.h5` is byte-identical to the third-party
  golden-panther/glaucoma-detector model (MIT); audit addendum added.
- Dataset registry: LAG (academic use only; no re-upload) and the golden-panther images
  (not usable). Risk H21 and backlog AT-025 added. LAG and Glaucoma-master folders git-ignored.
  The Colab notebook warns not to upload LAG without the authors' written permission.

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
