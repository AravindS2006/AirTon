# BOM and cost planning

No approved parts or current vendor quotes exist in this workspace. The entries
below are selection categories, not an order list or a manufacturable bill of
materials. Record exact part, revision, datasheet, authorized supplier, currency,
quote date, quantity, tax/shipping and alternatives after feasibility review.

| Subsystem | Selection evidence required | Cost concern |
|---|---|---|
| Optical detector and illumination | Observable, bandwidth, exposure, noise, alignment and lifetime | High-speed imaging/interferometry can dominate cost |
| Pressure monitor / signal chain | Dynamic accuracy, range, tubing interface, ADC/reference and calibration | Barometric resolution does not establish suitability |
| Pneumatic assembly | Characterized response, protected path, independent shutdown and repeatability | Assembly tolerances, protection and service |
| Safety/timing controller | Deterministic capture, watchdog, diagnostics and independent protections | Verification and debug/provisioning fixtures |
| Application host / connectivity | Acquisition bandwidth, power, supported lifecycle and identity | Linux storage/reliability, secure provisioning |
| Battery / supply | Runtime, protection, charging, fault behavior and applicable tests | Certified components, replacement and shipment |
| Enclosure and alignment fixture | Optical datum, user positioning, cleaning, transport and tolerances | Tooling, fixture alignment and yield |
| Display / feedback | Visibility, language, quality guidance, accessibility | Training and usability work |

Use three cost ledgers: prototype/instrumentation, nonrecurring engineering/tests,
and recurring landed unit cost. Add assembly, yield loss, calibration, packaging,
distribution, warranty, training, service and cloud operations. Prototype cost is
not expected selling price. Compare a quoted recurring cost against the selected
commercial scenario and publish sensitivity to yield and service burden.

Deck price goals vary; INR 25,000 basic / INR 40,000 advanced on page 26 are
historical proposals. There is no confirmed achievable target. Optical feasibility
is the earliest major cost decision.
