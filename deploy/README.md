# Running sellux.ch on the shared Hetzner box

The site is one container on the box that also runs the company stacks (Nuremberg, `nbg1`). nginx +
certbot own ports 80/443 there, so the container listens on loopback only:

```
sellux.ch, www ──▶ nginx (TLS, www → apex) ──▶ 127.0.0.1:3151 ──▶ container `nextup-landing-web-1`
```

Port 3151 is registered in `selluxhenner/nextup` → `stack/nginx/ports.md`. DNS needs nothing: the
apex `A` record of `sellux.ch` already points at the box, and `www` is covered by `*.sellux.ch`.

## On the box

```
~/nextup/landing/
  compose.yml    from deploy/compose.yml
  deploy.sh      from deploy/deploy.sh (the CI key's forced command)
  tag            the image tag that is live (written by deploy.sh)
  .env           optional, never in git: PILOT_INTAKE_URL, PILOT_INTAKE_TOKEN
  deploy.log
```

## Install from scratch

From the laptop, in this repo:

```bash
ssh hetzner 'mkdir -p ~/nextup/landing'
scp deploy/compose.yml deploy/deploy.sh hetzner:nextup/landing/
ssh hetzner 'chmod +x ~/nextup/landing/deploy.sh && ~/nextup/landing/deploy.sh deploy main'
```

Then nginx, once (Kevin - needs sudo):

```bash
scp deploy/nginx-sellux.ch.conf hetzner:/tmp/
ssh -t hetzner 'sudo cp /tmp/nginx-sellux.ch.conf /etc/nginx/sites-available/nextup-landing && sudo ln -sf /etc/nginx/sites-available/nextup-landing /etc/nginx/sites-enabled/ && sudo nginx -t && sudo systemctl reload nginx && sudo certbot --nginx -d sellux.ch -d www.sellux.ch'
```

## Deploys

A merge to `main` runs `.github/workflows/deploy.yml`. It builds, scans with Trivy, pushes
`ghcr.io/selluxhenner/nextup-landing:main` + `:sha-<short>`, then runs `ssh … deploy sha-<short>`.
The key only reaches `deploy.sh` (forced command in `~/.ssh/authorized_keys`, comment
`nextup-landing-deploy`). If the new container doesn't answer within 30 s, `deploy.sh` goes back
to the previous tag.

- Roll back: Actions → deploy → Run workflow → tag `sha-xxxxxxx`.
- By hand on the box: `~/nextup/landing/deploy.sh deploy sha-xxxxxxx`, `… status`.

`compose.yml` and `deploy.sh` are copied to the box by hand (the `scp` above) when they change.
CI moves only the image.

## Remove

```bash
ssh hetzner 'docker compose -f ~/nextup/landing/compose.yml down && rm -rf ~/nextup/landing'
ssh -t hetzner 'sudo rm /etc/nginx/sites-enabled/nextup-landing && sudo nginx -t && sudo systemctl reload nginx'
```

Then delete the `nextup-landing-deploy` line from `~/.ssh/authorized_keys`.
