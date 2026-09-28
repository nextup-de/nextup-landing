#!/usr/bin/env bash
# The only thing CI may run for the landing page on the shared box: move the site to one image tag.
# A forced command, so the key can't get a shell on a box with other sites:
#
#   ~/.ssh/authorized_keys (one line):
#   command="~/nextup/landing/deploy.sh",no-port-forwarding,no-agent-forwarding,no-X11-forwarding,no-pty ssh-ed25519 AAAA... nextup-landing-deploy
#
# CI runs:   ssh box deploy <tag>     (tag: main or sha-<7 hex>)
#            ssh box status
# By hand:   ~/nextup/landing/deploy.sh deploy main
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
log="$here/deploy.log"
port=3151

read -r -a args <<< "${SSH_ORIGINAL_COMMAND:-$*}"
action="${args[0]:-}" tag="${args[1]:-}"

compose() { LANDING_TAG="$(cat "$here/tag" 2>/dev/null || echo main)" docker compose -f "$here/compose.yml" "$@"; }

case "$action" in
  status)
    echo "tag $(cat "$here/tag" 2>/dev/null || echo main)"
    compose ps --format '{{.Service}} {{.Image}} {{.Status}}' ;;
  deploy)
    [[ "$tag" =~ ^(main|sha-[0-9a-f]{7})$ ]] || { echo "deploy: tag must be main or sha-<7 hex>" >&2; exit 2; }
    echo "$(date -u +%FT%TZ) deploy $tag by ${SSH_CONNECTION%% *}" >> "$log"
    previous="$(cat "$here/tag" 2>/dev/null || echo main)"
    echo "$tag" > "$here/tag"
    compose pull --quiet
    compose up -d --remove-orphans
    # Up means answering: give it 30 s, otherwise go back to the previous tag.
    for _ in $(seq 30); do
      if curl -fsS -o /dev/null "http://127.0.0.1:$port/"; then
        echo "$(date -u +%FT%TZ) deploy $tag ok" >> "$log"; echo "ok $tag"; exit 0
      fi
      sleep 1
    done
    echo "!! $tag did not answer on :$port - rolling back to $previous" >&2
    echo "$previous" > "$here/tag"
    compose up -d --remove-orphans
    echo "$(date -u +%FT%TZ) deploy $tag FAILED, back on $previous" >> "$log"
    exit 1 ;;
  *) echo "usage: deploy <main|sha-xxxxxxx> | status" >&2; exit 2 ;;
esac
