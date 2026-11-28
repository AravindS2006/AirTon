# Retinal research model card: lag-v1-local / efficientnet_b0

> **Research only. Not a glaucoma diagnosis, not a screening device, not linked to IOP estimation.**
> Trained on data licensed for **academic use only**: do not use it in a commercial product,
> public demo or website, and do not redistribute the weights or images.

| Field | Value |
|---|---|
| Data | LAG database (Li et al., CVPR 2019), first public part, supplied locally by the founder |
| Citation | Li L, Xu M, Wang X, Jiang L, Liu H. Attention Based Glaucoma Detection: A Large-Scale Database and CNN Model. CVPR 2019. |
| Labels | 0 = non-glaucoma (LAG negative); 1 = suspicious glaucoma (LAG positive) |
| Partitions | {"train": {"images": 3399, "patients": 3384}, "validation": {"images": 727, "patients": 725}, "test": {"images": 728, "patients": 725}} |
| Grouping | {"method": "green-channel 64px thumbnail correlation, connected components", "threshold": 0.985, "unit": "same-eye repeat group (surrogate for patient)", "groups_with_repeats": 20, "limitation": "fellow eyes of one patient are not linked; patient-level leakage cannot be excluded"} |
| Architecture | efficientnet_b0, ImageNet-pretrained start: True |
| Preprocessing | {"resize": 256, "center_crop": 224, "mean": [0.485, 0.456, 0.406], "std": [0.229, 0.224, 0.225], "colour": "RGB", "annotation_dependent_crop": false} |
| Training | 9 epochs run; best validation AUROC epoch kept; device cpu |
| Calibration | temperature 0.976, fitted on validation |
| Checkpoint SHA-256 | e7037f2e0912a2c0a5b414d1f594853a59299eafb3e0bcc965219a12f4152539 |

## Test set (held out; thresholds frozen on validation)

| Operating point | Threshold | Sensitivity (95% CI) | Specificity (95% CI) |
|---|---|---|---|
| primary: youden | 0.557 | 95.7% (92.5%-97.6%) | 94.9% (92.5%-96.6%) |
| secondary: sensitivity >= 0.9 on validation | 0.924 | 88.7% (84.3%-92.0%) | 98.7% (97.2%-99.4%) |

AUROC 0.991 (group-bootstrap 95% CI 0.986-0.996)

Brier 0.038; expected calibration error (10 bins) 0.033

Confusion matrix (rows = truth, columns = prediction; order ['non-glaucoma (LAG negative)', 'suspicious glaucoma (LAG positive)']): [[447, 24], [11, 246]]

## Limitations

- Single-source dataset; no external site, camera or population was evaluated. Expect lower performance elsewhere.
- No patient identifiers: same-eye repeats are grouped, but fellow eyes of one patient may span partitions,
  which can inflate test results.
- The positive class is LAG's 'suspicious glaucoma' label; the labelling protocol is not published in detail.
- Test prevalence differs from screening populations; predictive values are not reported.
- AUROC, sensitivity and specificity do not establish clinical usefulness; see docs/clinical/validation-plan.md.
