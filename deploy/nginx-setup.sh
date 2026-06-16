#!/usr/bin/env bash
# ============================================================================
# xStock — Nginx reverse proxy + Let's Encrypt TLS (run on the VPS)
# ----------------------------------------------------------------------------
#   bash deploy/nginx-setup.sh
#
# Creates a NEW Nginx vhost named `xstock`. It never edits or removes any
# existing config, and warns (instead of clobbering) if another enabled site
# already claims the same server_name.
# ============================================================================
source "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"
load_env
require_vars WMS_DOMAIN FRONTEND_PORT BACKEND_PORT LETSENCRYPT_EMAIL

AVAIL="/etc/nginx/sites-available/xstock"
ENABLED="/etc/nginx/sites-enabled/xstock"

step "Checking for server_name conflicts with existing sites"
if [ -d /etc/nginx/sites-enabled ]; then
  conflict="$(sudo grep -rl "server_name[[:space:]].*${WMS_DOMAIN}" /etc/nginx/sites-enabled/ 2>/dev/null | grep -v '/xstock$' || true)"
  if [ -n "$conflict" ]; then
    c_red "Another enabled Nginx site already serves ${WMS_DOMAIN}:"
    echo "$conflict"
    die "Resolve the conflict (use a different subdomain) before continuing — nothing was changed."
  fi
fi

step "Rendering ${AVAIL}"
if [ -f "$AVAIL" ]; then
  sudo cp "$AVAIL" "${AVAIL}.bak.$(date +%s)"
  c_ylw "Existing ${AVAIL} backed up."
fi
sudo bash -c "sed \
  -e 's|__WMS_DOMAIN__|${WMS_DOMAIN}|g' \
  -e 's|__FRONTEND_PORT__|${FRONTEND_PORT}|g' \
  -e 's|__BACKEND_PORT__|${BACKEND_PORT}|g' \
  '${DEPLOY_DIR}/nginx-xstock.conf.template' > '${AVAIL}'"

step "Enabling the site"
sudo ln -sfn "$AVAIL" "$ENABLED"

step "Testing Nginx config (existing sites included)"
sudo nginx -t || die "nginx -t failed — NOT reloading. Fix the error above."

step "Reloading Nginx"
sudo systemctl reload nginx
c_grn "xStock vhost is live over HTTP at http://${WMS_DOMAIN}"

# ---------------------------------------------------------------------------
step "Requesting a Let's Encrypt certificate (Certbot)"
c_ylw "This needs ${WMS_DOMAIN}'s DNS A record to already point at this server."
if sudo certbot --nginx -d "${WMS_DOMAIN}" \
      --non-interactive --agree-tos -m "${LETSENCRYPT_EMAIL}" --redirect; then
  c_grn "TLS enabled: https://${WMS_DOMAIN}"
else
  c_ylw "Certbot did not complete (DNS not propagated yet?)."
  c_ylw "The site works over HTTP now; re-run this once DNS resolves, or just:"
  c_ylw "  sudo certbot --nginx -d ${WMS_DOMAIN} --redirect -m ${LETSENCRYPT_EMAIL} --agree-tos"
fi
