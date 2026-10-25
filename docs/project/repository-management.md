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

## GitHub storage

At the user's request on 25 October 2026, a private
[AravindS2006/AirTon](https://github.com/AravindS2006/AirTon) repository was created
for this project. The local origin uses its HTTPS Git URL and main is the upload
branch. Dated research/specification records retain their original 4 October
baseline; uploading them does not constitute a fresh evidence review.

The upload contains committed sources, sanitized notebooks, reports, configuration
and project history. Private working files, original notebook outputs, model
weights, raw datasets, credentials and generated working outputs stay outside
Git. The repository's private visibility is not a substitute for governed storage
or dataset rights. No public release, website deployment, issue or PR is created
by this upload.

Licensing is pending team choice. Confirm institutional ownership and third-party
rights before adopting an open-source or open-hardware license.
