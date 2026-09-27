# CLAUDE.md — rules for AI coding sessions in this repo

The public NextUp marketing site. Kevin (@selluxhenner) is the head engineer and reviews every
change. The rules of the app repo (`selluxhenner/nextup`, CLAUDE.md) apply here too. The ones
that matter most:

- **Public repo.** No secrets, no `.env*` except `.env.example`, no customer names or data, no
  internal URLs beyond what the site already links.
- **Never commit to `main`, never push to `main`, never force-push.** Branch
  (`feat/…`, `fix/…`, `chore/…`) and open a PR; Kevin merges.
- **Never change `.github/`, `.gitignore`, `CLAUDE.md`** - ask Kevin.
- **No new dependencies** without saying why in the PR. No analytics, no third-party scripts, no
  requests to outside services. Fonts are self-hosted through next/font (GDPR).
- **No database here.** The only server-side code is the contact form, which forwards to the app.
- Styling: tokens in `src/styles/tokens.css`, shared `nh-*` classes in `src/app/globals.css`,
  page styles in a sibling `*.module.css`. No Tailwind.
- Legal pages (`/imprint`, `/privacy`) and `src/config/site.ts` `LEGAL` are Kevin's. Change them
  only when asked.
- Before you say a change is done: `npm run lint && npm run typecheck && npm test && npm run build`
  pass, the page loads with no console errors, and it works below 760px.
