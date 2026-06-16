#!/usr/bin/env bash
# ============================================================================
# xStock — start under PM2, enable log rotation, persist across reboots
# ----------------------------------------------------------------------------
#   bash deploy/start.sh
# Run once after setup-app.sh. For later code updates use deploy/deploy.sh.
# ============================================================================
source "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"
load_env
load_node_runtime
require_vars APP_USER

command -v pm2 >/dev/null || die "pm2 not found. Run deploy/provision.sh first (or open a new shell so nvm loads)."

step "Starting xStock processes"
pm2 start "${DEPLOY_DIR}/ecosystem.config.js"

step "Configuring PM2 log rotation (10MB x 14 files, compressed)"
pm2 install pm2-logrotate >/dev/null 2>&1 || true
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 14
pm2 set pm2-logrotate:compress true

step "Saving process list"
pm2 save

step "Enabling PM2 on boot (systemd)"
startup_cmd="$(pm2 startup systemd -u "${APP_USER}" --hp "/home/${APP_USER}" 2>/dev/null | grep -E '^sudo ' || true)"
if [ -n "$startup_cmd" ]; then
  eval "$startup_cmd"
  pm2 save
  c_grn "PM2 will resurrect xStock on reboot."
else
  c_ylw "Could not auto-detect the 'pm2 startup' command. Run 'pm2 startup' manually and"
  c_ylw "execute the sudo line it prints, then 'pm2 save'."
fi

echo
pm2 status
echo
c_grn "Done. Smoke test:"
echo "  curl -i http://127.0.0.1:${BACKEND_PORT}/        # backend hello"
echo "  curl -I http://127.0.0.1:${FRONTEND_PORT}/       # frontend"
echo "  curl -I https://${WMS_DOMAIN}/                   # through Nginx"
