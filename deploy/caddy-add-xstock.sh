#!/usr/bin/env bash
# ============================================================================
# xStock — add a site block to an EXISTING Caddy (Docker) reverse proxy
# ----------------------------------------------------------------------------
#   bash deploy/caddy-add-xstock.sh
#
# For servers where a Caddy *container* already owns 80/443 (e.g. the payslip
# stack). Appends ONLY a new xStock site block to the host-mounted Caddyfile —
# it never edits existing blocks — then validates and gracefully reloads. If the
# new config is invalid, the original Caddyfile is restored and nothing reloads,
# so the existing site(s) keep running untouched. Idempotent.
# ============================================================================
source "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"
load_env
require_vars WMS_DOMAIN FRONTEND_PORT BACKEND_PORT

CADDY_CONTAINER="${CADDY_CONTAINER:-payslip-caddy-prod}"
CADDYFILE_PATH="${CADDYFILE_PATH:-/home/ubuntu/payslip/Caddyfile}"
HOST_GATEWAY="${HOST_GATEWAY:-172.18.0.1}"

command -v docker >/dev/null || die "docker not found (need access to the Caddy container)."
[ -f "$CADDYFILE_PATH" ] || die "Caddyfile not found at ${CADDYFILE_PATH} (set CADDYFILE_PATH in xstock.env)."
docker inspect "$CADDY_CONTAINER" >/dev/null 2>&1 \
  || die "Caddy container '${CADDY_CONTAINER}' not found (set CADDY_CONTAINER in xstock.env)."

backup=""
if grep -q "${WMS_DOMAIN}" "$CADDYFILE_PATH"; then
  c_ylw "An entry for ${WMS_DOMAIN} already exists in ${CADDYFILE_PATH} — not appending again."
else
  backup="${CADDYFILE_PATH}.bak.xstock.$(date +%s)"
  cp "$CADDYFILE_PATH" "$backup"
  c_grn "Backed up Caddyfile -> ${backup}"
  step "Appending xStock site block"
  cat >> "$CADDYFILE_PATH" <<EOF

# ===== xStock WMS — added by deploy/caddy-add-xstock.sh =====
# Frontend + API run on the host (PM2); reached via the docker bridge gateway.
${WMS_DOMAIN} {
    encode zstd gzip

    # API + uploaded files -> NestJS backend (strip the /api prefix).
    handle_path /api/* {
        reverse_proxy ${HOST_GATEWAY}:${BACKEND_PORT} {
            header_up X-Real-IP {remote_host}
            header_up X-Forwarded-For {remote_host}
            header_up X-Forwarded-Proto {scheme}
        }
    }

    # Everything else -> Next.js frontend.
    handle {
        reverse_proxy ${HOST_GATEWAY}:${FRONTEND_PORT} {
            header_up X-Real-IP {remote_host}
            header_up X-Forwarded-For {remote_host}
            header_up X-Forwarded-Proto {scheme}
        }
    }

    request_body {
        max_size 25MB
    }
}
EOF
fi

step "Validating Caddy config inside ${CADDY_CONTAINER}"
if ! docker exec "$CADDY_CONTAINER" caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile; then
  c_red "Caddy config is INVALID — restoring the original Caddyfile, reloading nothing."
  [ -n "$backup" ] && cp "$backup" "$CADDYFILE_PATH" && c_ylw "Restored from ${backup}"
  die "Aborted safely; the existing site(s) were not touched."
fi

step "Reloading Caddy gracefully (zero downtime for existing sites)"
docker exec "$CADDY_CONTAINER" caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile

echo
c_grn "Caddy now serves https://${WMS_DOMAIN}"
echo "  Caddy fetches the TLS cert from Let's Encrypt within a few seconds of the first request."
echo "  Test:  curl -I https://${WMS_DOMAIN}/"
