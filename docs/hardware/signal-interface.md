# Signal interface expected by the IOP estimator

**Status:** software requirement derived from the v0.3 estimator (feature set
`iop-features-1`). It describes what the estimator consumes, not an approved
hardware design. No part numbers, pressures or exposure limits are specified
here. Those need bench evidence and safety review ([bench plan](bench-plan.md),
[risk register](../quality/risk-register.md)).

## Why hardware is needed

The trained IOP model has only seen **simulated** signals. To measure an eye it
needs real, synchronized recordings from an air-puff instrument. The model then
has to be retrained and re-validated on those recordings. Until then, the
website's air-puff section is a simulation that explains the method.

## Functional blocks the signals come from

| Block | Role in the measurement | Signal the software needs |
|---|---|---|
| Air pulse generator (pump or solenoid with a plenum and nozzle) | Produces a short, repeatable puff | - |
| Plenum pressure sensor | Measures the puff as it rises and falls | Channel 1: pressure (raw units, converted with calibration gain/offset) |
| Corneal reflection sensor (light source and photodetector aimed at the cornea) | Peaks when the cornea is flat (inward and outward applanation) | Channel 2: optical intensity, 0..1 ADC fraction |
| Alignment sensing (camera or position sensors) | Confirms the nozzle is centred and at the working distance | Lateral and axial offset in mm |
| Independent safety and timing controller | Triggers synchronized sampling; enforces limits and safe shutdown | Timestamp, clock trust, fault flags |
| Calibration record | Links the pressure channel to a traceable reference | Calibration ID, gain, offset, expiry |

## Data contract per acquisition

- Two channels sampled **synchronously at 10 kHz, 320 samples (32 ms)**, with the
  puff peak roughly centred. A different rate or length needs a new feature-set
  version and retraining.
- Metadata: `measurement_id`, `subject_id`, `session_id`, `eye` (OD/OS),
  `device_id`, `calibration_id`, `calibration_gain`, `calibration_offset_mmhg`,
  `calibration_expired`, `clock_status`, `captured_at` (ISO-8601 with timezone),
  `alignment_lateral_mm`, `alignment_axial_mm`, `raw_sha256`.
- Training labels (bench or study only): `reference_iop_mmhg` from the reference
  method and `artifact_label` from reviewer annotation.
- Storage format: `airton.ml.dataset` (`waveforms.npz` + `metadata.json` +
  `dataset-manifest.json`). Non-synthetic data need the governance block.

## Path from bench to a real model

1. Build a single-channel bench rig and record **model eyes** at independently
   measured pressures (no human eyes): [bench plan](bench-plan.md), backlog AT-005/AT-007.
2. Export the recordings in the dataset format above, including all failed
   acquisitions.
3. Compare real signals with the simulator, then refit or replace it (AT-021).
4. Retrain with `scripts/train_iop_model.py`, pointing `data.dataset_path` at
   the bench dataset, and review the generated model card.
5. Human measurements need an approved protocol, ethics approval and safety
   evidence first ([clinical validation plan](../clinical/validation-plan.md)).
