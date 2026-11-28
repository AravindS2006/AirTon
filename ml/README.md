# Machine learning workstream

**Repository v0.3.0 (2026-11-23):** production-engineered ML stack, verified on
**synthetic data only**. No model here has seen a real AirTon signal or a patient.
Decision record: [ADR-003](../docs/decisions/003-ml-architecture.md). Plan:
[phase 0.3](../docs/project/plans/2026-11-23-ml-phase-0.3.md). Latest generated
card: [synthetic IOP model card](../artifacts/examples/synthetic-iop-model-card.md).

## Two separate tracks

| Track | Code | Status |
|---|---|---|
| IOP estimation from air-puff signals (first product) | `src/airton/ml/` | Full stack implemented and evaluated on a physics-informed synthetic cohort; awaiting bench data (AT-021) |
| Retinal-image research (separate intended use) | `src/airton/ml/retinal/` | Corrected training framework; awaiting a rights-reviewed dataset (AT-011, AT-017) |

The tracks share no model, data or claim. Pressure estimation does not diagnose
glaucoma, and a fundus classifier does not calibrate a tonometer.

## IOP stack

```text
raw pressure + optical waveforms (10 kHz, 320 samples) + calibration/alignment metadata
  -> conditioning: robust LS removal of offset/drift/100-200 Hz flicker, zero-phase low-pass
  -> applanation events: inward/outward peaks, sub-sample timing, P1/P2, hysteresis (26 features)
  -> rules: clock, calibration, missing signal/stimulus, alignment, blink, saturation, SNR
  -> learned quality gate (LightGBM, threshold set for artifact recall on calibration data)
  -> out-of-domain gate (shrinkage Mahalanobis + target-support guard)
  -> estimate: physics ridge + residual LightGBM + residual 1D-ResNet deep ensemble
     (heteroscedastic beta-NLL), stacked or selected on subject-grouped validation
  -> normalized split-conformal interval (one acquisition per subject on calibration)
  -> uncertainty gate -> pass with value + interval, or reject with reasons and no value
```

| Module | Role |
|---|---|
| `acquisition.py` | Synthetic dynamic-applanation simulator: corneal viscosity/stiffness, CCT, ocular pulse, devices, artifacts, held-out device lot |
| `features.py` | Signal conditioning and versioned feature set `iop-features-1` |
| `quality.py` | Deterministic, auditable rule reasons |
| `models.py` | Ridge, portable tree evaluator, Mahalanobis, conformal, stacking, numpy CNN forward pass |
| `deep.py` | Torch training of the residual 1D-ResNet ensemble; BN-folded export |
| `metrics.py` | Clustered Bland-Altman LoA (multiple observations per subject), subject bootstrap, repeatability, AUROC, coverage |
| `bundle.py` | Hash-verified JSON/NPZ bundle; content-hash model ID; refuses tampering, extra files, non-synthetic bundles |
| `runtime.py` | numpy-only `IOPEngine`: `infer`, `infer_batch`, `to_record` (validated measurement contract) |
| `dataset.py` | On-disk format for synthetic and future bench data; governance check for real data |
| `training.py` | Five-way subject partition, selection, calibration, evaluation through the runtime, model card and run manifest |

Partitions are by subject: **train** (fit), **validation** (early stopping,
selection, stacking, difficulty model), **calibration** (quality threshold, OOD
threshold, conformal quantile), **test** (once) and **external** (held-out
device lot, once). Training asserts that the exported runtime reproduces the
in-memory estimates.

```powershell
python -m pip install -e ".[ml,deep,validation]"
python scripts/train_iop_model.py --profile quick --no-deep     # seconds; used by tests/CI
python scripts/train_iop_model.py --profile full                # ~5 min CPU, 5-member deep ensemble
python -m airton.cli iop-demo --bundle output/iop-full/bundle   # gates -> store -> review.html
```

Configuration lives in [configs/iop-estimator.json](configs/iop-estimator.json).
Every numeric gate setting there is a **synthetic development value**, not an
approved limit. The clinical settings in
[home-monitoring.json](../config/home-monitoring.json) remain null.

### Where to train

The repository scripts are the single source of truth. Every environment runs
the same commands at a pinned commit, so results stay comparable and reviewable.

| Environment | Use it for | Notes |
|---|---|---|
| Local CPU | IOP stack (quick and full) | Full profile is about 5 min; bit-reproducible model ID |
| [Google Colab notebook](notebooks/colab/airton_colab_training.ipynb) | Retinal image training on a GPU; IOP runs when no local Python is set up | Thin runner: clones a pinned ref, runs the scripts, downloads a results zip. GPU runs give a different (but recorded) model ID |
| GitHub Actions | Regression checks on every push | Quick profile only |
| Approved institutional or cloud compute | **Any real bench or patient data** | Colab and personal Drive are not approved storage for health data |
| Local workstation | **LAG** (academic-use dataset) | Academic-use permission from the LAG team (2026-11-23). The terms still forbid re-uploading the database, so cloud runs need permission that explicitly covers it |

Colab is not where model code is written. Change the code in the repository,
commit it, then run it in Colab at that commit. Notebook-only edits are lost
with the runtime and break the audit trail.

### What the synthetic results do and do not show

They show the software trains reproducibly, abstains with specific reasons,
keeps artifacts out of accepted readings, produces intervals close to nominal
coverage on held-out subjects and a shifted device lot, and reports clustered
agreement and subgroups. They do **not** show AirTon accuracy. The simulator's
physics are assumptions. On it, richer models barely beat the physics
baseline, because the remaining error comes from quantities the signals do not
carry, chiefly corneal thickness. Expect the same reasoning to apply to real
non-contact tonometry: improvements will come from better signals and
covariates, not from model size alone.

## Retinal research framework

`src/airton/ml/retinal/` replaces the defective notebook workflow (see the audit
below) with: governed manifests, patient-grouped label-stratified partitions,
torchvision backbones with a single logit and `BCEWithLogitsLoss`, a tested
freeze helper, one preprocessing spec saved with each checkpoint, validation-only
checkpoint and threshold selection, temperature scaling, a test set evaluated
once, patient-bootstrap AUROC, Wilson intervals, calibration error, explicitly
labelled confusion matrices and tensor-only checkpoints. Run
`python scripts/train_retinal_model.py --synthetic-smoke` to exercise it on
generated shapes.

### First real-data run: LAG (2026-11-23, M14)

```powershell
python scripts/build_retinal_manifest.py --lag "LAG Dataset" --out local-private/datasets/lag-v1
python scripts/train_retinal_model.py --config ml/configs/retinal-lag.json --manifest local-private/datasets/lag-v1/manifest.json --output output/retinal-lag
```

EfficientNet-B0 from ImageNet weights, about 1 h 50 min on a 16-core CPU. Held-out
test (728 images): AUROC 0.991 (95% CI 0.986-0.996); sensitivity 95.7% and
specificity 94.9% at the validation-frozen Youden threshold. Full card:
[lag-efficientnet-b0-model-card.md](../artifacts/research/lag-efficientnet-b0-model-card.md).
These are **single-source, internal** results. No other camera, site or population
was tested, and fellow-eye leakage cannot be excluded without patient IDs. LAG is
academic-use only, so this model cannot go into the product (AT-025, H21).

The supplied `Glaucoma-master` folder is a third-party code repository with 184
web-sourced optic-disc crops of unknown provenance. It is not used for training.
Its `my_model2.h5` is byte-identical to M02 (see the
[audit addendum](recovered-model-audit.md#addendum-2026-11-23-origin-of-my_model2h5-m02)).

### Research demo (website)

`scripts/select_retinal_demo_model.py` picks the demo model on **validation**
data, freezes its threshold and fits an out-of-distribution guard (PCA
Mahalanobis plus residual on the network's embedding, about 0.5% of in-domain
test images flagged). It writes a hash-verified package to the ignored
`models/weights/`. `scripts/serve_demo_api.py` serves it with the IOP engine
for the website's `/#/demo` page (see [apps/web/README.md](../apps/web/README.md)).
A heavier ConvNeXt-Tiny run was started and stopped at the founder's request
because EfficientNet-B0 was sufficient. On 183 differently framed optic-disc
crops the model scored near chance (AUROC 0.59), so the demo states that it
supports full-field photographs only.

For the air-puff model and hardware, see the [signal interface](../docs/hardware/signal-interface.md).

## Historical record (v0.2.0)

Actual historical work is now preserved in three [source-only notebooks](notebooks/README.md).
Read the [recovered experiment audit](recovered-model-audit.md),
[model registry](../models/model-registry.json),
[historical results](../models/historical-results.json) and
[dataset registry](../data/dataset-registry.json). These record source/log evidence,
not a new training run. Two published Keras files are stored locally outside Git
and verified by hash; their exact training lineage is unresolved.

Two separate research tasks:

| Task | Inputs and target | Needed data |
|---|---|---|
| Pressure estimator | Synchronized AirTon signals -> reference-linked IOP | Paired device/reference study; calibration and quality labels |
| Glaucoma risk research | Defined clinical/fundus inputs -> reference assessment | Rights-cleared clinical labels and external prospective evaluation |

No clinically evaluated model is included. The historical `scripts/train_synthetic.py` (M10) demonstrates
patient-grouped partitions, a fixed linear estimator, mean baseline, metrics and
dataset/run hashes. It uses fictional features and targets. It is not connected
to the simulator's random displayed values and cannot estimate real eye pressure.

## Real development workflow

1. Approve task/intended use and data rights; freeze label definitions.
2. Audit identities, duplicates and overlap across public/local datasets.
3. Split by patient before fitting preprocessing; hold out site/device/time for
   external evaluation where appropriate.
4. Establish a simple calibrated baseline and quality/domain rejection.
5. Compare richer models using development data; choose threshold only on a
   validation partition and lock model/preprocessing/configuration.
6. Evaluate once against the reserved test domain; quantify uncertainty,
   failure rates and subgroup results. Repeated eyes need clustered analysis.
7. Complete a model card, independent review and controlled release decision.

IOP: report bias, agreement limits, repeatability, errors by range and rejection
rate. Glaucoma: sensitivity/specificity at a frozen threshold, predictive values
at applicable prevalence, calibration and referral outcomes. Neither accuracy
alone nor a favorable ROC AUC establishes clinical usefulness.

Use [experiment templates](../templates/experiment-manifest.json),
[the model card](../models/model-card-template.md) and the clinical analysis plan.
Public fundus images do not contain AirTon optical/pneumatic signals.
