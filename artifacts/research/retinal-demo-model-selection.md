# Retinal demo model selection: retinal-demo-d0aa5ce45627

> Research demonstration only. Selection used validation data; test results are reported once per candidate
> and were not used to choose. Academic-use data (LAG); not for commercial use.

| Candidate | Validation AUROC | Test AUROC (group-bootstrap 95% CI) | Test sensitivity | Test specificity | Chosen |
|---|---|---|---|---|---|
| efficientnet_b0 | 0.9942 | 0.9914 (0.986-0.996) | 95.7% | 94.9% | yes |

Threshold 0.557 (Youden, validation). Members: efficientnet_b0 (T=0.976, sha256 e7037f2e0912a2c0...)

Same limitations as the individual model cards: single source, no external test, possible fellow-eye leakage.
