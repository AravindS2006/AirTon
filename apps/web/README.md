# AirTon web interface

Source: [AravindS2006/airton-web-final](https://github.com/AravindS2006/airton-web-final), commit
062fa7ac95a13953b2c736f6b19a92dc502161bd (4 November 2025).
The exact upstream snapshot is preserved in [legacy](../../legacy/README.md).

React 19 + TypeScript + Vite. A public landing story plus patient, doctor and admin
dashboards. Login only selects a demonstration role. All readings, patients,
clinics, devices and revenue are fictional. There is no device connection,
identity service, production database or deployed clinical inference.

## Immersive redesign (2026-11-28)

The working copy was redesigned to share the visual language of the
[project presentation](../../reports/presentation-2026-11-28/README.md):

- A live WebGL iris behind every page (`components/immersive/Iris.tsx`). Pages and
  scroll scenes move it like a camera; it falls back to a gradient without WebGL
  and stays still under reduced motion.
- Page changes play an eyelid blink; dashboard tabs refocus instead.
- Display, body and data typefaces (Anybody, Instrument Sans, JetBrains Mono) are
  bundled from `@fontsource-variable` packages. Icons are a local SVG set and
  avatars are generated monograms. The interface makes **no third-party requests**:
  the unpinned `lucide@latest` CDN script and the placeholder-photo service are gone.
- The landing page includes a playable version of the repository's synthetic
  applanation simulator and deterministic rules (`lib/simulator.ts`, ported from
  `src/airton/ml/acquisition.py`, `features.py` and `quality.py`). The learned
  gates and estimators do not run in the browser.
- Charts are hand-drawn SVG; `recharts` was removed, cutting the JavaScript bundle
  from over 500 kB to about 315 kB.

The redesign also aligns the interface with the specification:

| Before | Now | Reference |
|---|---|---|
| Patient and doctor views showed a "Risk Level" | Review state (awaiting, reviewed, missed sessions); no disease-risk label | R01, R13, H04 |
| Left/right readings only | Per-eye OD/OS readings with uncertainty intervals | R02, R25 |
| Every reading had a value | Rejected attempts are listed with a reason and no value | R03, H06 |
| No delivery status | Saved on device, delivered and reviewed are shown separately | R22, H16 |
| "Your 7-day IOP average is slightly elevated" | Notifications describe delivery, review and service only | R23 |
| Buttons that did nothing | Unavailable actions are disabled and labelled | R14 |

The persistent fictional-data notice is unchanged. Fictional data comes from a
fixed seed in `services/mockApiService.ts`, so every visit shows the same history.

## Run and check

```powershell
cd apps/web
npm ci --ignore-scripts --no-audit --no-fund
node node_modules/typescript/bin/tsc --noEmit
npm run build
npm run dev
```

Dependencies are pinned by package-lock.json. Development and preview bind to
127.0.0.1. Never expose server credentials through client-side configuration.
See the [software audit](../../docs/software/legacy-audit.md) and
[product specification](../../docs/product/specification.md) for integration
priorities. No clinical release is implied by a successful build.
