# Recovered software audit

Sources are archived by provider/repository under legacy. Revisions and hashes
are recorded in [Hub inventory](../../research/sources/huggingface-project-inventory.json)
and [recovery manifest](../../artifacts/recovery-manifest.json).
This is a static source review; no public clinical endpoint was exercised.

| Implementation | Actual behavior | Integration/release issue |
|---|---|---|
| airton_static | FastAPI upload and Keras100px prediction; HTML/JS pages | No authentication, upload bounds or image-quality gate; deprecated Pillow ANTIALIAS; class mapping unclear |
| Airton_streamlit | Streamlit source and shared CNN training script/weight reference | Full reproduction environment not captured; missing training provenance |
| AIRTON | Gradio image prediction using same published weight | Hub runtime reported BUILD_ERROR; no independent evaluation |
| AIRTON_DOCKER | FastAPI + SQLAlchemy account/history design and frontend | Missing referenced weight; db parameter shadows db module; datetime/timedelta not imported in security.py; placeholder secret fallback |
| AIRTON_MAIN | Streamlit model-loading/inference source; two Keras files | Hub runtime SLEEPING; inspect input sizes/labels before inference |
| Airton-node | Express login, JSON user/history file and upload API | /analyze uses Math.random for glaucoma, DR and AMD probabilities; no ML inference |
| airton-web-final | Vite/React patient/doctor/admin UI | In-memory role selection, mock API, random IOP and fictional MRR; no real authorization or backend |

The July deck's Node demonstration must not be cited as model accuracy. Its
random scores demonstrate an interface response only. The later React doctor's
dashboard exists as source, which supersedes the earlier assumption that there
was no dashboard application. It still does not establish clinical integration.

Node source also uses a literal placeholder JWT secret, unbounded uploads,
filesystem persistence and no controlled retention. Docker security code falls
back to a placeholder secret. These histories inform the new threat model;
they are not deployment instructions.

The React Vite config exposed GEMINI_API_KEY through client-side define values.
No actual key was recovered. The working copy removes those unused substitutions,
binds to 127.0.0.1 and adds a persistent fictional-data notice. The original
snapshot is preserved unchanged. Its package lock, metadata and components are
retained. The active copy now corrects unsupported accuracy, fictional testimonial,
unverified company and HIPAA claims and replaces them with the reviewed project
position. Archive copy remains historical. Any publication still requires team
ownership, claims and rights review. The recovered CDN assets remain an uncontrolled
prototype dependency; icon loading now fails gracefully if unavailable. The active
copy now bundles Tailwind through pinned local build dependencies and uses system
fonts, removing the failed CDN styling and redundant import map. Placeholder
images and optional icon loading still contact external providers.

The active demo Python service is separate, synthetic-only and loopback-only.
It is not a production bridge for real hardware/patients. Integrating the React
view with it would still be a synthetic demonstration, not a clinical release.

## Production replacement work

Implement identity and clinic/care-team assignments on the server; never trust a
client-selected role. Store real observations in durable managed storage with
tenant isolation, versioned amendments and audit events. Provision device
credentials; persist encrypted outboxes; preserve IDs on retries; reject
conflicting uploads; test reboot/loss and authorization. Bound/decode image
uploads, verify input modality/quality and quarantine failed analysis. Use a
validated estimator/model registry and explicit provenance, never random scores.

Local CSS packaging is completed for the demo. Package remaining icons/assets
locally before a controlled production build. Review all dependencies
and transitive vulnerabilities at a release revision. A local build is not an
SBOM, penetration test, deployment approval or clinical validation.
