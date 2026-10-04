# Historical retinal model card

Scope: M01-M07 in [model registry](model-registry.json). Historical fundus image
classification research. None is qualified for home IOP monitoring, autonomous
diagnosis or exclusion of glaucoma.

Owners/source authors are recorded in the original sources. Exact training-to-
checkpoint identity is incomplete. M01/M02 files are locally preserved with Hub
SHA-256 matching and HDF5 structure inspected. M03-M06 checkpoint names and
metrics come from notebook outputs; those checkpoint files were not recovered.
VGG16 is a displayed architecture, not a verified trained release.

Dataset provenance, class mapping, preprocessing, image/patient partitions,
selection bias, architecture/loss mismatches and recorded result interpretation
are documented in [the audit](../ml/recovered-model-audit.md). These are material
release limitations, not a completed validation checklist.

No target-home-population study, independent final test, calibration analysis,
external camera/site evaluation, fairness assessment or clinical utility study
was recovered. The available classification outputs cannot calibrate an air-puff
tonometer. No accuracy number applies to AirTon's intended IOP product.

Unknown source/dataset license and third-party attribution must be resolved
before commercial reuse or redistribution. Hash verification establishes file
identity, not rights, safety, effectiveness or model correctness.
