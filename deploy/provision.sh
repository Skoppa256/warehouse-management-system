#!/usr/bin/env bash
# ============================================================================
# xStock — system provisioning (run ONCE, on the VPS, as the app user `ubuntu`)
# ----------------------------------------------------------------------------
#   bash deploy/provision.sh
#
# Installs Node 20 (or reuses an existing >=20), PostgreSQL, Redis, Nginx,
# Certbot and PM2; creates a DEDICATED Postgres role + database for xStock.
# Idempotent and safe to re-run. Does NOT upgrade or reconfigure services that
# the existing payslip app may rely on, and never enables the firewall for you.
# ============================================================================
source "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"
load_env
require_vars WMS_DOMAIN DB_NAME DB_USER FRONTEND_PORT BACKEND_PORT APP_USER

command -v sudo >/dev/null || die "sudo is required."
command -v openssl >/dev/null || sudo apt-get install -y openssl

step "Generating any missing secrets"
ensure_secret DB_PASSWORD
ensure_secret JWT_SECRET

# ---------------------------------------------------------------------------
step "Recon: what is already listening on this server"
c_ylw "(Review this so xStock's ports don't collide with the payslip app.)"
sudo ss -tlnp || ss -tln || true
echo
if [ -d /etc/nginx/sites-enabled ]; then
  c_ylw "Existing Nginx sites (these will NOT be touched):"
  ls -1 /etc/nginx/sites-enabled/ || true
  echo
fi
c_ylw "Firewall (ufw) status — left as-is; see DEPLOYMENT.md if it's inactive:"
sudo ufw status verbose 2>/dev/null || echo "ufw not installed / no access"
echo

step "Verifying the chosen app ports are free"
assert_port_free "$FRONTEND_PORT" "FRONTEND_PORT"
assert_port_free "$BACKEND_PORT"  "BACKEND_PORT"

# ---------------------------------------------------------------------------
step "Installing system packages (apt) — existing versions are left untouched"
sudo apt-get update -y
# Note: installing an already-present package is a no-op; this does NOT upgrade
# the payslip app's PostgreSQL/Redis to a new major version.
sudo apt-get install -y \
  curl ca-certificates gnupg git build-essential \
  postgresql postgresql-contrib \
  redis-server \
  nginx \
  certbot python3-certbot-nginx

step "Ensuring PostgreSQL, Redis and Nginx are enabled and running"
sudo systemctl enable --now postgresql
sudo systemctl enable --now redis-server || sudo systemctl enable --now redis || true
sudo systemctl enable --now nginx

# ---------------------------------------------------------------------------
step "Setting up Node.js 20"
NVM_USED=false
NODE_OK=false
if command -v node >/dev/null 2>&1; then
  CUR_MAJ="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
  if [ "${CUR_MAJ:-0}" -ge 20 ]; then
    NODE_OK=true
    c_grn "Found existing Node $(node -v) (>=20) — reusing it (system Node left as-is)."
  else
    c_ylw "System Node $(node -v) is <20 and may belong to the payslip app — NOT replacing it."
  fi
fi

if [ "$NODE_OK" = false ]; then
  c_blu "Installing Node 20 via nvm for user '$(whoami)' (isolated; no system impact)…"
  export NVM_DIR="$HOME/.nvm"
  if [ ! -s "$NVM_DIR/nvm.sh" ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  fi
  # shellcheck disable=SC1091
  source "$NVM_DIR/nvm.sh"
  nvm install 20
  nvm alias default 20
  NVM_USED=true
fi

step "Installing PM2"
if [ "$NVM_USED" = true ]; then
  npm install -g pm2
else
  command -v pm2 >/dev/null 2>&1 || sudo npm install -g pm2
fi

# Record the runtime choice so setup-app.sh / deploy.sh load the right Node.
cat > "${DEPLOY_DIR}/.runtime" <<EOF
NVM_USED=${NVM_USED}
NVM_DIR=${NVM_DIR:-$HOME/.nvm}
EOF
c_grn "Node: $(node -v)  npm: $(npm -v)  pm2: $(pm2 -v 2>/dev/null || echo '?')"

# ---------------------------------------------------------------------------
step "Creating dedicated PostgreSQL role + database (idempotent)"
role_exists="$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" || true)"
if [ "$role_exists" != "1" ]; then
  sudo -u postgres psql -c "CREATE ROLE \"${DB_USER}\" LOGIN PASSWORD '${DB_PASSWORD}';"
  c_grn "Created role ${DB_USER}."
else
  c_ylw "Role ${DB_USER} already exists — syncing its password to xstock.env."
fi
sudo -u postgres psql -c "ALTER ROLE \"${DB_USER}\" WITH PASSWORD '${DB_PASSWORD}';"

db_exists="$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" || true)"
if [ "$db_exists" != "1" ]; then
  sudo -u postgres createdb -O "${DB_USER}" "${DB_NAME}"
  c_grn "Created database ${DB_NAME} owned by ${DB_USER}."
else
  c_ylw "Database ${DB_NAME} already exists — leaving its data intact."
fi
# Ensure the role can create tables in public (matters on PostgreSQL 15+).
sudo -u postgres psql -d "${DB_NAME}" -c \
  "ALTER SCHEMA public OWNER TO \"${DB_USER}\"; GRANT ALL ON SCHEMA public TO \"${DB_USER}\";"

echo
c_grn "Provisioning complete."
echo "  • DB:     ${DB_NAME} (user ${DB_USER}) on ${DB_HOST}:${DB_PORT}"
echo "  • Redis:  ${REDIS_HOST}:${REDIS_PORT} db ${REDIS_DB}"
echo "  • Next:   bash deploy/setup-app.sh"
