# Running sellux.ch on the shared Hetzner box

The site is one container on the box that also runs the company stacks (Nuremberg, `nbg1`). nginx +
certbot own ports 80/443 there, so the container listens on loopback only:

```
sellux.ch, www ──▶ nginx (TLS, www → apex) ──▶ 127.0.0.1:3151 ──▶ container `nextup-landing-web-1`
```

Port 3151 is registered in `nextup-de/nextup` → `stack/nginx/ports.md`. DNS needs nothing: the
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

## Contact form → admin

The `/contact` form forwards each pilot request to `https://admin.sellux.ch/api/pilot-requests`,
where it lands on admin's `/requests` page (nextup-de/nextup-admin). One token: in full here,
as a sha256 (`PILOT_INTAKE_TOKEN_SHA256`) in admin.

Order: admin's pilot-requests release is deployed first; then, once, on the box:

```bash
ssh hetzner 'bash -s' <<'SH'
set -eu
umask 077
cd ~/nextup/landing && touch .env
t=$(sed -n 's/^PILOT_INTAKE_TOKEN=//p' .env)
[ -n "$t" ] || { t=$(openssl rand -hex 32); echo "PILOT_INTAKE_TOKEN=$t" >> .env; }
sed -i '/^PILOT_INTAKE_URL=/d' .env
echo "PILOT_INTAKE_URL=https://admin.sellux.ch/api/pilot-requests" >> .env
sed -i '/^PILOT_INTAKE_TOKEN_SHA256=/d' ~/nextup/admin/.env
echo "PILOT_INTAKE_TOKEN_SHA256=$(printf %s "$t" | sha256sum | cut -d' ' -f1)" >> ~/nextup/admin/.env
~/nextup/admin/deploy.sh deploy "$(cat ~/nextup/admin/tag)"
~/nextup/landing/deploy.sh deploy "$(cat ~/nextup/landing/tag)"
SH
```

It keeps a token that is already there and can be run again. Check: send the form on
https://sellux.ch/contact, and the request shows on admin's `/requests`. Admin answers 404 until
its hash is set, so the form shows "could not send" with the mail address - never a lost request.
Without the two variables here the form opens the visitor's mail program instead.

## Deploys

A merge to `main` runs `.github/workflows/deploy.yml`. It builds, scans with Trivy, pushes
`ghcr.io/nextup-de/nextup-landing:main` + `:sha-<short>`, then runs `ssh … deploy sha-<short>`.
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
