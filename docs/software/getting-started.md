# Getting started

Run commands from the repository root using Python 3.11+. The core demo and tests
use only the Python standard library; no cloud account or physical device is needed.

```powershell
python scripts/demo.py
python -m unittest discover -s tests -v
python scripts/check_repository.py
```

Open `output/demo/review.html`. Files are regenerated deterministically from seed
42. Use a different output folder when changing seed or record count; existing
records are immutable and a conflicting reused ID is an error. The SQLite store
is local unencrypted synthetic data, not production storage.

## Local API exercise

Generate a disposable token in your own terminal and start the server:

```powershell
$env:AIRTON_DEMO_TOKEN = python -c "import secrets; print(secrets.token_urlsafe(32))"
python scripts/serve.py
```

In a second terminal, use the same token without storing it in a source file:

```powershell
# Set AIRTON_DEMO_TOKEN to the same disposable value in this terminal first.
$headers = @{ Authorization = "Bearer $env:AIRTON_DEMO_TOKEN" }
$records = Get-Content -Raw output/demo/measurements.json | ConvertFrom-Json
$body = $records[0] | ConvertTo-Json -Depth 10
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8765/v1/measurements -Headers $headers -ContentType application/json -Body $body
Invoke-RestMethod -Uri http://127.0.0.1:8765/v1/measurements -Headers $headers
```

Alternatively run both the server and requests from a process manager that passes
the environment to both. Environment variables set in one existing terminal are
not automatically shared with another. Ctrl+C stops the server. Do not expose
the demo endpoint externally or use real clinical data with it.

| Endpoint | Behavior |
|---|---|
| GET `/health` | Public synthetic-mode health status |
| GET `/v1/measurements` | Token required; synthetic records |
| POST `/v1/measurements` | Token + JSON required; exact contract; maximum 16 KiB |

New record: 201. Identical replay: 200. Changed payload with existing ID: 409.
Invalid contract: 400. Missing/incorrect authorization: 401. Oversized/empty
payload: 413. Unsupported media type: 415. Unknown route: 404.

## Optional ML exercise

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install -e ".[ml,validation]"
.\.venv\Scripts\python scripts/train_synthetic.py
```

Inspect `output/ml-synthetic/run-manifest.json`, `metrics.json` and `model.json`.
No pickle is produced. The model learns a made-up algebraic target from made-up
features; its scores are not estimates of AirTon or glaucoma performance.

## IOP estimation stack (synthetic)

```powershell
.\.venv\Scripts\python -m pip install -e ".[ml,deep,validation]"
.\.venv\Scripts\python scripts/train_iop_model.py --profile quick --no-deep   # seconds
.\.venv\Scripts\python scripts/train_iop_model.py --profile full              # about 5 minutes on CPU
.\.venv\Scripts\python -m airton.cli iop-demo --bundle output/iop-full/bundle
```

Training writes `bundle/` (hash-verified JSON/NPZ, no pickle), `metrics.json`,
`run-manifest.json` and `model-card.md`. `iop-demo` generates new synthetic
acquisitions, runs them through every gate, stores contract-valid records in
SQLite and writes `review.html`. Rejected acquisitions show reasons and no
value. Use the engine from Python:

```python
from airton.ml.runtime import IOPEngine
engine = IOPEngine.load("output/iop-full/bundle")
result = engine.infer(pressure, optical, metadata)   # status, reasons, estimate, interval
record = engine.to_record(result, metadata)           # validated measurement contract
```

Bench data can replace the simulator through the `airton.ml.dataset` format.
Non-synthetic datasets are refused until their governance block is complete,
and this release will not train a non-synthetic bundle.

### Running in Google Colab

Open `ml/notebooks/colab/airton_colab_training.ipynb` in Colab (*File > Open
notebook > GitHub*, or upload it). Add a read-only fine-grained GitHub token as
the Colab Secret `GITHUB_TOKEN`, choose a GPU runtime if training the retinal
model, set `REF` to the commit you want and run all cells. Device selection is
automatic (`"device": "auto"` in `ml/configs/*.json`). Bring the downloaded
results into the local ignored `output/` folder before review and archiving.

## Research demo website

```powershell
python scripts/serve_demo_api.py          # loads models/weights/retinal-demo-model.json and output/iop-full/bundle
cd apps/web; npm run dev                  # open http://127.0.0.1:3000/#/demo
```

Build the retinal demo package first with `scripts/select_retinal_demo_model.py`
(see [ml/README.md](../../ml/README.md)) and the IOP bundle with
`scripts/train_iop_model.py --profile full`.

## Retinal research framework

```powershell
.\.venv\Scripts\python scripts/train_retinal_model.py --synthetic-smoke
```

The smoke run uses generated shapes, not fundus images. A real run needs a
governed manifest in approved storage (`--manifest`); see AT-011 and AT-017.

## Artifact management

Generated experiments belong in ignored `output/`. Only reviewed synthetic examples
are retained under `artifacts/examples/`. Follow the experiment manifest before
archiving a real study. Do not move real patient data into the repository merely
because a directory is ignored. See the collection and privacy plans.
