# The public site as an image: install -> build -> a runtime carrying no toolchain.
# Same shape as the app's ops/Dockerfile (selluxhenner/nextup). Runs on the shared Hetzner box
# behind nginx (deploy/README.md); published to ghcr.io/selluxhenner/nextup-landing.

FROM node:26-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ── build ────────────────────────────────────────────────────────────────────
FROM deps AS build
WORKDIR /app
COPY . .
# NEXT_PUBLIC_* is inlined at build time, and every page is prerendered, so the "Log in" target
# is part of the image. CI passes it from the repo variable APP_URL.
ARG NEXT_PUBLIC_APP_URL=https://acme.sellux.ch
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── runtime ──────────────────────────────────────────────────────────────────
FROM node:26-bookworm-slim AS run
WORKDIR /app
# Only `node server.js` runs. npm, npx and corepack bring their own dependency tree (and CVEs)
# and nothing needs them at runtime.
RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs \
 && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# standalone has server.js + traced node_modules; public and .next/static go next to it.
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/').then(r => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
CMD ["node", "server.js"]
