#!/usr/bin/env bash
# Shared helpers sourced by every xStock deploy script. Not meant to be run directly.

set -euo pipefail

# Directory this library (and the other deploy scripts) live in.
DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${DEPLOY_DIR}/xstock.env"

c_red()  { printf '\033[31m%s\033[0m\n' "$*"; }
c_grn()  { printf '\033[32m%s\033[0m\n' "$*"; }
c_ylw()  { printf '\033[33m%s\033[0m\n' "$*"; }
c_blu()  { printf '\033[36m%s\033[0m\n' "$*"; }
die()    { c_red "ERROR: $*" >&2; exit 1; }
step()   { c_blu "==> $*"; }

# --- Load configuration -----------------------------------------------------
load_env() {
  [ -f "$ENV_FILE" ] || die "Missing ${ENV_FILE}. Run: cp xstock.env.example xstock.env  (then edit it)."
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a

  # Resolve APP_DIR (repo root) if not set: parent of the deploy/ folder.
  if [ -z "${APP_DIR:-}" ]; then
    APP_DIR="$(cd "${DEPLOY_DIR}/.." && pwd)"
  fi
  [ -d "${APP_DIR}/backend" ] && [ -d "${APP_DIR}/frontend" ] \
    || die "APP_DIR (${APP_DIR}) does not look like the repo root (no backend/ + frontend/)."
}

require_vars() {
  local missing=()
  for v in "$@"; do
    [ -n "${!v:-}" ] || missing+=("$v")
  done
  [ ${#missing[@]} -eq 0 ] || die "These required values are unset in xstock.env: ${missing[*]}"
}

# Generate a secret into a config key if it's currently blank, and persist it
# back into xstock.env. Uses hex so there are no sed-escaping surprises.
ensure_secret() {
  local key="$1"
  local current="${!key:-}"
  if [ -z "$current" ]; then
    local val
    val="$(openssl rand -hex 32)"
    # Replace `KEY=...` (quoted or not) in the env file.
    sed -i "s|^${key}=.*|${key}=\"${val}\"|" "$ENV_FILE"
    export "$key"="$val"
    c_grn "Generated ${key} and saved it to xstock.env"
  fi
}

# Confirm a TCP port is not already bound on this host.
assert_port_free() {
  local port="$1" label="$2"
  if ss -ltnH "( sport = :${port} )" 2>/dev/null | grep -q ":${port}"; then
    c_red "Port ${port} (${label}) is already in use:"
    ss -ltnp "( sport = :${port} )" 2>/dev/null || true
    die "Pick a different ${label} in xstock.env and re-run."
  fi
  c_grn "Port ${port} (${label}) is free."
}

# Make the chosen Node available on PATH. provision.sh records whether nvm was
# used in deploy/.runtime so later scripts (setup-app, deploy) load it too.
load_node_runtime() {
  local rt="${DEPLOY_DIR}/.runtime"
  if [ -f "$rt" ]; then
    # shellcheck disable=SC1090
    source "$rt"
  fi
  if [ "${NVM_USED:-false}" = "true" ]; then
    export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
    # shellcheck disable=SC1091
    [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
  fi
}
