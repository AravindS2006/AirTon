# Hardware workstream

The PDF contains concepts and a simulation screenshot. Editable electronics and
mechanical projects have not been supplied. This directory intentionally contains
design inputs and work-area instructions, not fabricated manufacturing files.

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
