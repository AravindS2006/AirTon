# Bench verification and calibration plan

**Scope:** test fixtures and model eyes only. This is not authorization for
eye-facing use. Use the risk register and have the bench setup reviewed before
energizing it. Firmware in this repository cannot control the hardware.

| Experiment | Evidence to preserve | Requirement |
|---|---|---|
| Reference calibration | Traceability, uncertainty, environmental range and due date | R04-R05 |
| Pressure-channel characterization | Sensor location, dynamic response, zero/span, tubing response | R04, R08 |
| Optical displacement/event detection | Raw data, alignment, saturation and missing-event behavior | R03-R04 |
| Timing synchronization | Trigger/ADC/frame timing, latency, drift and uncertainty | R04, R09 |
| Model-eye sweep | Independently characterized pressure and material conditions; all repeats | R08 |
| Operator and assembled-unit transfer | Fixture/device IDs; operators; recalibration effects | R08, R14 |
| Fail-safe behavior | Startup, brownout, watchdog, sensor fault, stuck-path simulation, misalignment | R06-R07 |
| Connectivity fault | Wi-Fi loss/recovery, queue full, reboot and exact replay | R10-R11 |
| Bilateral feasibility | Separate-eye alignment, cross-channel coupling, sequential comparison | R02, R08 |
| Portable enclosure | Setup, transport, runtime, thermal behavior and cleaning procedure | R15 |

Before testing, define independent variable, number of fixture conditions, repeat
schedule, operator masking where useful, pass/fail criteria, permitted changes,
equipment versions and data locations. Freeze settings before evaluation. Separate
calibration/fit conditions from held-out evaluation fixtures. Failure logs are
part of the denominator, not records to discard until metrics improve.

Calibration records should include certificate/reference ID, method, uncertainty,
date, temperature, equipment identity, coefficients, operator/reviewer, validity
domain and expiry. Unknown or expired calibration must block reportable results.
Bench agreement against a model eye does not establish human corneal agreement.
