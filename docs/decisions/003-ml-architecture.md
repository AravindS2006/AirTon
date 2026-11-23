# ADR-003: Layered-abstention IOP estimator with a portable, pickle-free runtime

**Status:** proposed for team approval; implemented on synthetic data in v0.3.0.
**Date:** 2026-11-23. **Related:** [ADR-001](001-measurement-first.md),
[ADR-002](002-offline-and-provenance.md), [phase plan](../project/plans/2026-11-23-ml-phase-0.3.md).

## Context

The first product is home IOP monitoring. A wrong number is more harmful than no
number ([H03](../quality/risk-register.md), [H06](../quality/risk-register.md)), and
no paired AirTon/reference data exist yet. The estimator must therefore be built
so that bench data can be used without redesign, it must abstain whenever its
evidence is weak, and it must run on a gateway or device host without a heavy
ML runtime or unsafe deserialization.

## Decision

1. **Physics first.** An interpretable ridge on applanation pressures (P1, P2),
   hysteresis and alignment is the baseline. Learned models (LightGBM, a residual
   1D-ResNet deep ensemble) predict only the *residual* over that baseline, so
   tree models cannot fail to extrapolate across the pressure range.
2. **Selection by evidence, not complexity.** Candidates and a cross-fitted stack
   are compared on a subject-grouped validation partition. The physics baseline
   wins unless a richer model improves on it.
3. **Layered abstention, each with a named reason:** deterministic rules (clock,
   calibration, missing signal, alignment, blink, saturation, SNR), a learned
   quality gate with a recall-targeted threshold, a shrinkage-Mahalanobis
   out-of-domain gate plus a target-support guard, and an uncertainty gate on the
   conformal interval width. Every rejection produces no numeric estimate.
4. **Calibrated uncertainty.** Normalized split-conformal intervals, calibrated on
   a separate partition using one acquisition per subject so the exchangeability
   unit matches the clustering unit.
5. **Portable runtime.** Trees are exported to flat JSON and the CNN to NPZ with
   batch-norm folded. Inference uses numpy and scipy only. Bundles are
   hash-verified, immutable and identified by content hash (model ID). Pickle is
   never written or read. Train/serve parity is asserted at training time.
6. **Synthetic-only release gate.** The bundle loader refuses any bundle not
   marked synthetic and non-clinical. The dataset loader refuses real data
   without a completed governance block.

## Consequences

- The software stack can be verified end to end before hardware exists. The
  simulator encodes assumptions, so its results verify software behaviour only
  ([H18](../quality/risk-register.md)).
- On the synthetic cohort the richer models improve on the physics baseline only
  marginally. The error floor comes from information the signals do not carry,
  chiefly corneal thickness. This is expected, and it is why candidate
  comparison against the baseline is mandatory.
- Abstention lowers yield. Session yield (sessions with at least one accepted
  reading) is reported alongside accuracy, because a failed home session has
  clinical-workflow cost ([R14](../product/requirements.md), [R22](../product/requirements.md)).
- All numeric gate settings are synthetic development values. Approved values
  need bench evidence, risk analysis and clinical review
  ([AT-022](../project/backlog.md)).
- Revisit when bench data exist: fit or replace the simulator, re-tune gates and
  re-run the full selection with prespecified acceptance criteria.
