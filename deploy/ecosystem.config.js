// PM2 process definitions for xStock.
//   pm2 start deploy/ecosystem.config.js
//
// Backend env vars are read from backend/.env at start/reload time (the Nest app
// does NOT auto-load .env, so we inject them here). The frontend reads its own
// .env via Next.js, so it only needs the port. Both bind to 127.0.0.1 — public
// traffic reaches them only through Nginx.
const fs = require('fs');
const path = require('path');

const DEPLOY_DIR = __dirname;
const APP_DIR = path.resolve(DEPLOY_DIR, '..');

function parseEnv(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const raw of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = raw.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m || raw.trim().startsWith('#')) continue;
    let v = m[2];
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

const cfg = parseEnv(path.join(DEPLOY_DIR, 'xstock.env'));
const backendEnv = parseEnv(path.join(APP_DIR, 'backend', '.env'));

const FRONTEND_PORT = cfg.FRONTEND_PORT || '3100';
const BACKEND_PORT = cfg.BACKEND_PORT || '3101';
// Interface the frontend binds to. Default loopback; set FRONTEND_HOST=0.0.0.0 in
// xstock.env when a reverse proxy in Docker must reach it via the host gateway.
const FRONTEND_HOST = cfg.FRONTEND_HOST || '127.0.0.1';
const BACKEND_HOST = cfg.BACKEND_HOST || '127.0.0.1';

module.exports = {
  apps: [
    {
      name: cfg.PM2_BACKEND_NAME || 'xstock-backend',
      cwd: path.join(APP_DIR, 'backend'),
      script: 'dist/src/main.js',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_memory_restart: '600M',
      time: true,
      env: {
        ...backendEnv,
        NODE_ENV: 'production',
        PORT: BACKEND_PORT,
        HOST: BACKEND_HOST,
      },
    },
    {
      name: cfg.PM2_FRONTEND_NAME || 'xstock-frontend',
      cwd: path.join(APP_DIR, 'frontend'),
      script: 'node_modules/next/dist/bin/next',
      args: `start -H ${FRONTEND_HOST} -p ${FRONTEND_PORT}`,
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_memory_restart: '768M',
      time: true,
      env: {
        NODE_ENV: 'production',
        PORT: FRONTEND_PORT,
      },
    },
  ],
};
