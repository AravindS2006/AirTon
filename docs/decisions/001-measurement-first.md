# ADR-001: Establish the measurement channel before diagnostic claims

**Status:** proposed for team approval. **Date:** 2026-10-04.

The source deck combines pressure measurement, bilateral operation, interference
patterns and glaucoma outputs. Their dependencies and evidence needs differ.

Recommendation: first establish a single optical/pneumatic channel on a model-eye
fixture; introduce bilateral operation after repeatability and coupling tests.
Maintain separate pressure-estimation and glaucoma-risk model tracks. Require
additional clinically relevant inputs and an appropriate reference assessment
for any glaucoma claim.

Consequences: earlier experiments become smaller and interpretable; the eventual
dual-eye goal is preserved, but its implementation is evidence-dependent. Hardware
cost and optical observability can invalidate a preferred sensing approach. Revisit
after a documented bench feasibility result and clinician review.
