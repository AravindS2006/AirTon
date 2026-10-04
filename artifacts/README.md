# Artifact index

| Location | Content | Evidence level |
|---|---|---|
| `source/team-airton-2025-07-03.pdf` | Original user-supplied 38-page team deck | Supplied historical source, unchanged |
| `source/deck-figures/` | Rendered selected original deck pages | Source excerpts; no new validation |
| `source/manifest.json` | Source origin/hash and excerpt provenance | Integrity record |
| `examples/synthetic-review.html` | Fictional doctor-facing review preview | Synthetic software demonstration |
| `examples/synthetic-measurements.json` | Strict synthetic measurement records | Synthetic demonstration |
| `examples/synthetic-fhir-observations.json` | Illustrative FHIR-shaped observations | Synthetic; not profile validated |
| `examples/manifest.json` | Reproduction commands, hashes and limitations | Software artifact provenance |
| `examples/synthetic-ml-*.json` | Artificial regression coefficients, scores and grouped partitions | Synthetic ML workflow; no clinical meaning |

Research findings are maintained in `research/` so they remain easy to update.
Future CAD exports, bench calibration evidence, controlled experiment reports,
conference posters and release packages belong in versioned artifact subdirectories
with a manifest and appropriate permissions. No clinical study or manufacturing
artifact is present at this release.
