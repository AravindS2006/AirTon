# Artifact index

| Location | Content | Evidence level |
|---|---|---|
| `source/team-airton-2025-07-03.pdf` | Original user-supplied 38-page team deck | Supplied historical source, unchanged |
| `source/deck-figures/` | Rendered selected original deck pages | Source excerpts; no new validation |
| `source/manifest.json` | Source origin/hash and excerpt provenance | Integrity record |
| `source/device-drawings/` | Five actual September 2026 device drawing PDFs | Concept drawings; no native CAD or as-built proof |
| `research/` | Two aggregate notebook confusion-matrix figures | Historical output excerpts; class-label audit required |
| `research/lag-efficientnet-b0-*` | M14 model card and metrics (text only; no images or weights) | Public research dataset, internal held-out test; academic-use only |
| `recovery-manifest.json` | 80 retained recovered source/figure/drawing hashes | Exact legacy sources; notebook outputs stripped |
| `../legacy/` | Fixed-revision public GitHub / Hugging Face app and model source | Historical prototype implementations |
| `../reports/` | Dated master report in Markdown and PDF | Current evidence synthesis; not clinical validation |
| `examples/synthetic-review.html` | Fictional doctor-facing review preview | Synthetic software demonstration |
| `examples/synthetic-measurements.json` | Strict synthetic measurement records | Synthetic demonstration |
| `examples/synthetic-fhir-observations.json` | Illustrative FHIR-shaped observations | Synthetic; not profile validated |
| `examples/manifest.json` | Reproduction commands, hashes and limitations | Software artifact provenance |
| `examples/synthetic-ml-*.json` | Artificial regression coefficients, scores and grouped partitions | Synthetic ML workflow; no clinical meaning |
| `examples/synthetic-iop-model-card.md` | Generated card for the v0.3.0 synthetic IOP stack | Synthetic engineering result; not clinical performance |
| `examples/synthetic-iop-metrics.json`, `examples/synthetic-iop-run-manifest.json` | Held-out synthetic agreement, abstention, coverage, subgroups, environment and hashes | Synthetic; bundle weights are regenerated, not stored in Git |

Research findings are maintained in `research/` so they remain easy to update.
Future CAD exports, bench calibration evidence, controlled experiment reports,
conference posters and release packages belong in versioned artifact subdirectories
with a manifest and appropriate permissions. No clinical study or manufacturing
artifact is present at this release.
