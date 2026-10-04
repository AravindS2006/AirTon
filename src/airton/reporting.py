"""Clinician-facing synthetic preview with no automated diagnosis."""

import html
import json

from .contracts import validate_measurement


def render_report(records):
    rows = []
    for record in records:
        r = validate_measurement(record)
        e = lambda key: html.escape(str(r[key]))
        pressure = "No result" if r["iop_estimate_mmhg"] is None else f'{r["iop_estimate_mmhg"]:.2f}'
        reasons = html.escape(", ".join(r["quality_reasons"]) or "Accepted synthetic acquisition")
        rows.append(f'<tr><td>{e("subject_id")}</td><td>{e("eye")}</td><td>{e("captured_at")}</td><td>{pressure}</td><td>{e("quality_status")}<br><small>{reasons}</small></td><td>{e("measurement_id")}<br><small>{e("calibration_id")}</small></td></tr>')
    return '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>AirTon synthetic review</title>
<style>body{font:16px system-ui,sans-serif;color:#19324a;background:#f3f7fa;margin:0}main{max-width:1200px;margin:40px auto;padding:24px}h1{font-size:36px;margin-bottom:8px}.banner{background:#fff0c7;border-left:6px solid #ac7200;padding:18px;line-height:1.5}.table-wrap{overflow:auto;margin-top:24px}table{width:100%;min-width:980px;background:white;border-collapse:collapse;font-size:14px}th,td{padding:14px;text-align:left;border-bottom:1px solid #dbe4ea}th{background:#173d5e;color:white}small{color:#526978}p{line-height:1.6}footer{margin-top:24px}</style><main><p>AIRTON / RESEARCH DEMONSTRATION</p><h1>Measurement review</h1><div class="banner"><strong>All values are fictional synthetic data.</strong> This preview is not a medical report. It does not detect or rule out glaucoma. Rejected acquisitions intentionally contain no numerical estimate.</div><p>OD = right eye; OS = left eye. Units: mmHg. Review status: awaiting clinician review (workflow illustration only). No clinical interpretation or treatment recommendation has been generated.</p><div class="table-wrap"><table><thead><tr><th scope="col">Synthetic subject</th><th scope="col">Eye</th><th scope="col">Acquired (UTC offset shown)</th><th scope="col">Fictional IOP</th><th scope="col">Quality</th><th scope="col">Provenance</th></tr></thead><tbody>''' + "".join(rows) + '''</tbody></table></div><footer>AirTon v0.1.0 | model: demo-no-clinical-model | Synthetic records only | No clinician sign-off</footer></main></html>'''


def fhir_observation(record):
    """Illustrative FHIR R4 shape, using local terminology; not profile-validated."""
    r = validate_measurement(record)
    result = {
        "resourceType": "Observation", "id": r["measurement_id"], "status": "preliminary",
        "code": {"text": "Synthetic AirTon IOP estimate - not for clinical use"},
        "subject": {"reference": f'Patient/{r["subject_id"]}'},
        "device": {"reference": f'Device/{r["device_id"]}'},
        "effectiveDateTime": r["captured_at"], "bodySite": {"text": "Right eye" if r["eye"] == "OD" else "Left eye"},
        "note": [{"text": "Synthetic demonstration; references and terminology require an implementation profile."}],
    }
    if r["iop_estimate_mmhg"] is None:
        result["dataAbsentReason"] = {"text": "Acquisition rejected: " + ", ".join(r["quality_reasons"])}
    else:
        result["valueQuantity"] = {"value": r["iop_estimate_mmhg"], "unit": "mmHg", "system": "http://unitsofmeasure.org", "code": "mm[Hg]"}
    return result
