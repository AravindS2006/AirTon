# Quality system and controlled product records

Working startup operating design, not an ISO13485 certificate or approved QMS.
The repository is a controlled evidence index; Git by itself does not provide
electronic signatures, training records, clinical access control or document approval.

## Record responsibilities

Name a product owner, design authority, clinical reviewer, quality/regulatory lead,
security owner and manufacturing/service lead. Individuals may hold multiple
roles early on, but clinical/safety release review must be competent and recorded.
A source author's name or pitch title is not acceptance of an assigned duty.

For each controlled record retain ID, revision, author, review/approval,
effective date, change reason, linked requirements/risks and replaced revision.
Drafts must say draft. A reviewed PDF/hash is a record; a silently edited file is
not a new approved baseline. The
[design record index](design-record-index.csv) currently shows real disposition.

## Design history / production / device history

- Design history: intended use, user needs, inputs, architecture, outputs,
  verification, validation, risk file, review and transfer decisions.
- Production master: released BOM, drawings, firmware/software hashes,
  procurement controls, assembly instructions, calibration/acceptance procedures,
  labeling/packaging and service instructions.
- Individual device history: serial/lot/component traceability, manufacturing
  version, inspections, calibration, final acceptance, release and service record.
- Clinical records: approved protocol, permissions, consent/access, provenance,
  reference measurements, deviations and analysis in controlled restricted storage.
- Commercial/corporate records: incorporation, ownership/assignments, grants,
  accounts, contracts and signed customer records with appropriate access.

The folders quality/design-history, quality/production-master and
quality/device-history hold indexes and controlled metadata. Native CAD/PCB,
licensed standards, restricted studies and patient/identity data remain in
appropriate secured systems; use attributable references instead of pretending
an empty folder is an implemented control.

## Change control and release

Start a change record with trigger and affected versions. Assess clinical claim,
hazards, calibration, model/data/preprocessing, cybersecurity, usability,
manufacturing/service, labeling and regulatory impact. Link the tests/studies
to rerun. Review results and residual risk before approving a version.
Preserve deployed identities and a rollback/service strategy.

Research releases can package synthetic demos and source archives with explicit
limitations. Bench firmware releases require approved hardware controls and
procedures. Patient-facing or commercial releases require actual clinical,
home-use, quality and regulatory evidence. No tier inherits approval from a
lower tier.

## Nonconformance, CAPA and suppliers

Quarantine nonconforming hardware/data/model releases; retain the observation,
scope, immediate containment and disposition. Assess root cause and recurrence
risk before deciding whether corrective/preventive action is necessary. Verify
effectiveness against predefined evidence, not just an action-completed checkbox.

Supplier acceptance includes specification, change notification, traceability,
inspection and reliability evidence. Price quotes are separate from qualification.
Changes in sensors, valves, optics, suppliers or trained models may affect
calibration/performance and require re-verification.

Risk management is a lifecycle activity. [ISO14971:2019](https://www.iso.org/standard/72704.html)
was confirmed by ISO in2025; the catalogue establishes edition/status, not
AirTon compliance. Obtain the applicable licensed requirements and competent
review before claiming conformance.
