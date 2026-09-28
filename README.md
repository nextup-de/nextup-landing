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
| `NEXT_PUBLIC_APP_URL` | Vercel, all environments | Base URL of the app, for "Log in" |
| `PILOT_INTAKE_URL` | Vercel, server only | The app's intake endpoint |
| `PILOT_INTAKE_TOKEN` | Vercel, server only, **secret** | Must equal `PILOT_INTAKE_TOKEN` in the app |

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

Vercel project `nextup-landing`, production branch `main` (every merge deploys), framework
Next.js, root directory `/`, server functions in `fra1` (Frankfurt). Test domain `sellux.ch`;
`www.sellux.ch` redirects there (308).

DNS for `sellux.ch` is at hostserv.eu. The apex `A` records and the `www` `CNAME` point to Vercel
(values: Project → Settings → Domains). Every other `*.sellux.ch` name stays on the wildcard to
the Hetzner box, where the company stacks run.

Production env: only `NEXT_PUBLIC_APP_URL` (`https://acme.sellux.ch` while we test). The intake
variables are unset, so the form opens a pre-filled e-mail until `admin.sellux.ch` takes pilot
requests.
