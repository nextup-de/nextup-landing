# nextup-landing

The public NextUp website: home, pricing, book a pilot, imprint, privacy. Marketing only. There
is no database, no login and no customer data here. The product itself lives in
[`selluxhenner/nextup`](https://github.com/selluxhenner/nextup), and "Log in" links there.

This repo is **public**. Never commit secrets, `.env*` files (except `.env.example`) or anything
from a customer.

## Run

```bash
npm install
cp .env.example .env.local   # optional; without it "Log in" points at localhost:3000
npm run dev                  # http://localhost:3000
```

| Command | What |
|---|---|
| `npm run dev` | dev server |
| `npm run lint` · `npm run typecheck` · `npm test` · `npm run build` | what CI runs |

## The contact form

`/contact` validates in the browser and again on the server (`src/server/actions/pilot.ts`), then
forwards the request to the app's `POST /api/pilot-requests` with a shared bearer token. The app
saves it, and it appears in the app's `/admin` → Requests.

| Env var | Where | What |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | build time (Docker build arg) | Base URL of the app, for "Log in" |
| `PILOT_INTAKE_URL` | server only | The app's intake endpoint |
| `PILOT_INTAKE_TOKEN` | server only, **secret** | Must equal `PILOT_INTAKE_TOKEN` in the app |

Without the two intake variables the form falls back to a pre-filled `mailto:`.

## Layout

```
src/app/(marketing)/   pages: home, pricing, contact, imprint, privacy
src/components/        marketing (header, footer, contact form) + ui (Button, Field) + shell (Ground)
src/config/site.ts     name, tagline, legal operator details, APP_URL
src/features/pilot/    pilot request validation (pure, unit-tested)
src/server/            the form's server action + its rate limit
src/styles/            design tokens - keep in step with the app's src/styles/tokens.css
```

These files were split out of the app on 27 Sep 2026 (docs/PLATFORM_PLAN.md in the app repo).
The design tokens and `ui/` components are copies. If the app's look changes, copy the change
over too.

## Deploy

`sellux.ch` runs as a Docker container on our Hetzner box (Nuremberg), behind the box's nginx.
`www` redirects to it. A merge to `main` builds and scans the image and puts it live
(`.github/workflows/deploy.yml`). The runbook is [deploy/README.md](deploy/README.md).

| Setting | Where | What |
|---|---|---|
| `APP_URL` | GitHub repo variable | "Log in" target, baked into the image (default `https://acme.sellux.ch`) |
| `PILOT_INTAKE_URL`, `PILOT_INTAKE_TOKEN` | `~/nextup/landing/.env` on the box | The contact form forwarding. Unset for now: the form opens a pre-filled e-mail until `admin.sellux.ch` takes pilot requests |
