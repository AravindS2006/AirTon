# Machine learning workstream

Two separate research tasks:

| Task | Inputs and target | Needed data |
|---|---|---|
| Pressure estimator | Synchronized AirTon signals -> reference-linked IOP | Paired device/reference study; calibration and quality labels |
| Glaucoma risk research | Defined clinical/fundus inputs -> reference assessment | Rights-cleared clinical labels and external prospective evaluation |

No clinically evaluated model is included. `scripts/train_synthetic.py` demonstrates
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
