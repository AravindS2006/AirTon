# Contributing to AirTon

Start with [the project status](docs/project/status.md) and the relevant requirement
in [requirements](docs/product/requirements.md). Describe the problem, proposed
change, source evidence, verification, and limitations in each pull request.

Use Python 3.11 or newer. The core demonstration uses only the standard library.
From the repository root:

```powershell
python -m unittest discover -s tests -v
python scripts/check_repository.py
python scripts/demo.py
```

For the optional ML exercise, install the package in a virtual environment with
`python -m pip install -e ".[ml,validation]"` and run
`python scripts/train_synthetic.py`.

Keep patient records and identifiers out of Git, screenshots, issues, and logs.
An ignored directory is a convenience, not an access-control boundary. Store real
data in approved encrypted storage; use the data access protocol before collection.
Do not fetch public datasets until the exact release and terms have been reviewed.

Keep citations and proposed requirements distinct. Do not label a survey, model
render, successful software test, or synthetic experiment as clinical validation.
Update the risk register for changes affecting the air path, optics, timing,
calibration, algorithms, patient identity, or report delivery. Hardware connection
and human studies require the gates described in the clinical and hardware docs.
