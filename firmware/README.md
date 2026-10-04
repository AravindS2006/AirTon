# Firmware plan and non-actuating reference model

The deck's Arduino/Proteus screenshot does not include editable firmware.
`state_model.py` is a host-side conceptual state model. It has no GPIO, valve,
pump, timing or optical exposure drivers and cannot energize a device.

Target states: BOOT -> SELF_TEST -> ALIGN -> READY -> CAPTURE -> QUALITY_CHECK ->
RECORD -> IDLE, with FAULT reachable from any active state. Physical design must
provide independent protection and startup/shutdown defaults; passing a simulator
test does not verify hardware safety.

Define controller timing, watchdog, interlocks, sensor diagnostics, calibration
validity, reset/brownout behavior, explicit operator trigger, rejection/retry
behavior and signed release/update recovery before implementation. Numerical air
stimulus and optical exposure parameters are intentionally absent pending review.
