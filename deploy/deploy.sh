#!/usr/bin/env bash
# ============================================================================
# xStock — one-command update (run on the VPS after the initial setup)
# ----------------------------------------------------------------------------
#   bash deploy/deploy.sh
#
# Pulls the latest code, installs deps, runs migrations, rebuilds both apps,
# and reloads PM2 with zero downtime. Safe to run repeatedly.
# ============================================================================
source "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"
load_env
load_node_runtime

cd "${APP_DIR}"

step "Pulling latest code"
git pull --ff-only

# Rebuild the .env files in case config changed (idempotent).
step "Refreshing .env files from xstock.env"
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"
REDIS_URL="redis://${REDIS_HOST}:${REDIS_PORT}/${REDIS_DB}"
cat > "${APP_DIR}/backend/.env" <<EOF
DATABASE_URL="${DATABASE_URL}"
JWT_SECRET="${JWT_SECRET}"
REDIS_URL="${REDIS_URL}"
RESEND_API_KEY="${RESEND_API_KEY:-}"
CORS_ORIGINS="https://${WMS_DOMAIN}"
PORT=${BACKEND_PORT}
HOST=${BACKEND_HOST:-127.0.0.1}
SEED_ADMIN_PASSWORD="${SEED_ADMIN_PASSWORD:-password123}"
EOF
chmod 600 "${APP_DIR}/backend/.env"
echo "NEXT_PUBLIC_API_URL=\"https://${WMS_DOMAIN}/api\"" > "${APP_DIR}/frontend/.env"
chmod 600 "${APP_DIR}/frontend/.env"

step "Backend: install + prisma + migrate + build"
cd "${APP_DIR}/backend"
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
mkdir -p "${APP_DIR}/backend/uploads"

step "Frontend: install + build"
cd "${APP_DIR}/frontend"
npm install
npm run build

step "Reloading PM2 (zero-downtime)"
cd "${APP_DIR}"
pm2 reload "${DEPLOY_DIR}/ecosystem.config.js" --update-env \
  || pm2 start "${DEPLOY_DIR}/ecosystem.config.js"
pm2 save

c_grn "Update complete."
pm2 status
