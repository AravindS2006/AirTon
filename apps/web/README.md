# AirTon recovered web application

Source: [AravindS2006/airton-web-final](https://github.com/AravindS2006/airton-web-final), commit
062fa7ac95a13953b2c736f6b19a92dc502161bd (4 November 2025).
The exact upstream snapshot is preserved in [legacy](../../legacy/README.md).

React 19 + TypeScript + Vite, with patient, doctor and admin dashboards.
Login only selects a demonstration role. The mock API generates random IOP
readings, sample patients and illustrative revenue. There is no device connection,
identity service, production database or deployed clinical inference.

This working copy adds a persistent demonstration notice, corrects unsupported
marketing, testimonial, company and privacy claims, and reflects the home-monitoring
direction. It restores the missing stylesheet, makes demo access visible on mobile,
guards optional CDN icon loading and binds development/preview to loopback.
Dashboard tables preserve readable column widths and scroll on narrow views.
Unused build-time injection of GEMINI_API_KEY was removed;
never expose server credentials through client-side configuration.

```powershell
cd apps/web
npm ci --ignore-scripts --no-audit --no-fund
node node_modules/typescript/bin/tsc --noEmit
npm run build
npm run dev
```

Dependencies are pinned by package-lock.json. The active copy bundles Tailwind
3.4.17 through PostCSS and uses system fonts; the CDN stylesheet and import map
were removed after browser verification exposed unstyled views. This follows the
[official Tailwind Vite configuration](https://v3.tailwindcss.com/docs/guides/vite).
Optional Lucide icons and placeholder images still use external providers; text
and layout remain usable without them. See [software audit](../../docs/software/legacy-audit.md)
and [product specification](../../docs/product/specification.md) for integration priorities.
No clinical release is implied by a successful build.
