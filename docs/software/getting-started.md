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

## Artifact management

Generated experiments belong in ignored `output/`. Only reviewed synthetic examples
are retained under `artifacts/examples/`. Follow the experiment manifest before
archiving a real study. Do not move real patient data into the repository merely
because a directory is ignored. See the collection and privacy plans.
