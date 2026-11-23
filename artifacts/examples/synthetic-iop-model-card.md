# Model card: demo-iop-7d8b9861815b (synthetic)

> **Synthetic engineering artifact. Not for clinical use.** Every number below comes from simulated
> acquisitions with assumed physics. None describes AirTon hardware, a patient, or clinical accuracy.

| Field | Value |
|---|---|
| Model ID | demo-iop-7d8b9861815b |
| Evidence level | synthetic-generated |
| Created | 2026-11-23T09:59:33+00:00 |
| Intended use | Software engineering of the AirTon IOP estimation stack on synthetic acquisitions only. |
| Prohibited uses | Any clinical measurement, diagnosis, glaucoma risk, triage or treatment decision |
| Inputs | 10 kHz pressure and optical channels (320 samples), calibration and alignment metadata; feature set iop-features-1 |
| Target | Synthetic session reference IOP (mmHg) |
| Data | Simulator airton-synthetic-applanation-1; dataset SHA-256 698ba8068d89b2fc... |
| Split | Subject-grouped {'train': 275, 'validation': 75, 'calibration': 75, 'test': 75, 'external': 100}; external = held-out device domain |
| Selected estimator | ridge+cnn with weights {"ridge+cnn": 1.0} |
| Validation RMSE by candidate | {"physics_ridge": 1.958, "ridge+gbm": 1.943, "ridge+cnn": 1.93, "stack": 1.949} |
| Abstention | Rules; quality threshold 0.999; OOD distance 10.34; max half-width 5 mmHg |
| Interval | Normalized split conformal, target coverage 0.90, 75 calibration subjects (one acquisition each) |
| Runtime | numpy-only; parity with training 0.0e+00 mmHg |
| Environment | {"python": "3.12.10", "platform": "Windows-11-10.0.26200-SP0", "numpy": "2.0.2", "scipy": "1.16.0", "lightgbm": "4.6.0", "torch": "2.6.0+cpu"} |

## Held-out results (synthetic)

| Partition | Acquisitions | Accepted | Session yield | Artifact leakage | Bias | Clustered 95% LoA | RMSE (95% CI) | Session-mean RMSE | Interval coverage | Repeatability coef. | Ridge baseline RMSE | Ungated RMSE |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| test | 900 | 67.4% | 95.7% | 0.0% | -0.02 | -3.64 to 3.60 | 1.84 (1.67-1.99) | 1.77 | 92.9% | 2.38 | 1.85 | 7.25 |
| external | 1200 | 46.3% | 79.0% | 0.0% | 0.09 | -3.98 to 4.16 | 2.07 (1.82-2.35) | 1.97 | 93.5% | 2.18 | 2.08 | 6.46 |

Subgroups (synthetic truth covariates; n, bias, RMSE, interval coverage):

- **test**: cct_low: n=196, bias -1.07, RMSE 1.76, coverage 93.9%; cct_mid: n=182, bias -0.50, RMSE 1.69, coverage 93.4%; cct_high: n=229, bias 1.26, RMSE 2.00, coverage 91.7%; elevated_iop_group: n=196, bias -0.56, RMSE 1.93, coverage 89.8%; typical_iop_group: n=411, bias 0.24, RMSE 1.79, coverage 94.4%; demo-device-dev-00: n=124, bias 0.37, RMSE 1.92, coverage 91.9%; demo-device-dev-01: n=107, bias 0.08, RMSE 1.85, coverage 91.6%; demo-device-dev-02: n=89, bias 0.09, RMSE 1.94, coverage 92.1%; demo-device-dev-03: n=74, bias -0.15, RMSE 1.59, coverage 97.3%; demo-device-dev-04: n=121, bias -0.21, RMSE 1.81, coverage 92.6%; demo-device-dev-05: n=92, bias -0.42, RMSE 1.82, coverage 93.5%
- **external**: cct_low: n=123, bias -1.86, RMSE 2.57, coverage 85.4%; cct_mid: n=253, bias 0.15, RMSE 1.72, coverage 98.4%; cct_high: n=180, bias 1.34, RMSE 2.13, coverage 92.2%; elevated_iop_group: n=140, bias -0.28, RMSE 2.38, coverage 90.0%; typical_iop_group: n=416, bias 0.21, RMSE 1.95, coverage 94.7%; demo-device-ext-06: n=275, bias 0.05, RMSE 2.09, coverage 93.5%; demo-device-ext-07: n=281, bias 0.13, RMSE 2.05, coverage 93.6%

Rejections by reason: test: {"alignment": 79, "blink": 38, "calibration_expired": 28, "clock_untrusted": 8, "estimate_uncertain": 135, "out_of_domain": 161, "signal_quality": 158}; external: {"alignment": 99, "blink": 44, "calibration_expired": 17, "clock_untrusted": 8, "estimate_uncertain": 526, "out_of_domain": 192, "signal_quality": 173}

## Limitations

- The simulator encodes assumed relationships (viscous corneal lag, CCT and stiffness resistance, alignment
  efficiency). A model that fits them proves the software, not the physics. Real bench data will differ.
- Rule limits, the quality recall target, the OOD quantile and the interval width limit are synthetic
  development settings, not approved safety or clinical limits.
- Conformal coverage is marginal under subject exchangeability; it is not conditional on subgroup or device.
- The external partition is a simulated device shift; real external validity needs other devices, sites and users.
- Central corneal thickness is not observable from the home signals. Expect thickness-dependent bias, as
  in other non-contact tonometers; the CCT subgroups above quantify it for the simulator.
- Model capacity cannot recover information the signals lack. Compare candidates against the physics
  ridge baseline rather than reading the deep model's presence as an accuracy gain.
- Pressure estimation is separate from glaucoma risk. This model makes no diagnostic statement.

## Change control

Retrain into a new bundle (new model ID). Bundles are immutable and hash-verified on load.
A clinical bundle needs an approved dataset, protocol, prespecified acceptance criteria and release review.
