# Hardware workstream

The original deck contains concepts and a simulation screenshot. Five actual
device drawing PDFs dated 13 September 2026 are preserved with a
[mechanical design-history record](mechanical/design-history.md). Editable CAD,
electronics, Proteus and as-built firmware files were not recovered. The drawings
do not specify dimensions, tolerances or a verified physical build.

Read [optical feasibility](../docs/hardware/optical-feasibility.md),
[bench verification](../docs/hardware/bench-plan.md), and
[BOM planning](bom-planning.md). Native CAD belongs in `cad/`; schematics/PCB designs
in `electronics/`. Maintain revision, creator, tool/version, review status and an
export manifest for each. A screenshot is reference material, not a PCB source.

Preferred conceptual split: application host (Pi-class computer, exact choice
pending) plus dedicated acquisition/safety controller, characterized pressure
transducer, independently protected pneumatic path, optical detector, aligned
fixture, display and protected battery supply. Selection requires a timing, noise,
power, safety and cost budget. No actuator connections or approved human-use
parameters are provided in this release.
