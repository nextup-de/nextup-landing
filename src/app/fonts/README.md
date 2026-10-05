# Fonts

Latin-subset woff2 files from Google Fonts, committed so `next build` never needs the network.
All three families are under the SIL Open Font License 1.1 (https://openfontlicense.org).
Same files as the app (`selluxhenner/nextup`, `apps/app/src/app/fonts/`).

| File | Family | Weights |
|---|---|---|
| manrope-var.woff2 | Manrope (variable) | 400-800 |
| plex-mono-400/500/600.woff2 | IBM Plex Mono | 400, 500, 600 |
| instrument-serif-400.woff2 | Instrument Serif | 400 |

To refresh one: request `https://fonts.googleapis.com/css2?family=<Family>:wght@<range>` with a current
browser user agent and download the url under the `/* latin */` block.
