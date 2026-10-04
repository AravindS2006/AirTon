# Repository management

The local repository is the source-of-truth index for shareable project work.
Clinical data, private identity linkage, credentials and restricted weights stay
in approved storage outside Git, referenced by access-controlled manifests.

## Source and artifact rules

- Preserve historical inputs without rewriting them; record hash and origin.
- Keep editable source next to its README and link reviewed exports by revision.
- Label each artifact: supplied, proposed, synthetic-generated, measured-bench,
  clinical-study or released. Do not imply a higher evidence level from file type.
- Generated local runs go in `output/`; archive only reviewed shareable results
  with manifests under `artifacts/`.
- Store large approved artifacts in an appropriate artifact service; add Git LFS
  only when there is a concrete need and ownership/access has been reviewed.

## Versioning and reviews

Use topic branches such as `hardware/optical-feasibility` or `software/outbox` after
Git initialization. Pull requests identify requirements, hazards and verification.
Tag research releases with a status note; keep hardware revision, firmware version,
calibration ID and model ID independent. A source-code tag is not a clinical release.

The source PDF contains team names, institutional attribution and linked forms/sheets.
Review publication rights and any private content before creating a public remote.
No GitHub remote, issue, PR or public deployment is created by this task.

Licensing is pending team choice. Confirm institutional ownership and third-party
rights before adopting an open-source or open-hardware license.
