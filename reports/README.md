# Project reports

[Current master report](airton-project-report-2026-10-04.md) is the dated
cross-workstream specification/progress/evidence report. A generated PDF of the
same report is retained as airton-project-report-2026-10-04.pdf after verification.

The current PDF has ten pages, visually reviewed after rendering with Poppler.
[manifest.json](manifest.json) records the final Markdown/PDF integrity hashes.

To rebuild using the optional report dependencies:

```powershell
python -m pip install -e ".[reports]"
python scripts/build_project_report.py
pdftoppm -png output/pdf/airton-project-report-2026-10-04.pdf tmp/pdfs/airton-report
```

Create the temporary render directory first. The builder writes to ignored
output/pdf/. Review every final page before copying an updated PDF into reports/
and updating the manifest. A rebuilt PDF can differ in creation metadata/hash.
Do not change dated report claims without retaining the prior review/version.

Keep dated snapshots rather than silently changing prior claims. Each report
needs source identifiers, actual completed work, unresolved evidence and the
current intended use. The public prototype, recorded notebook outputs and
synthetic reference workflow are distinct evidence categories.
