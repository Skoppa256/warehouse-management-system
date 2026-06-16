# xStock — VPS Deployment Runbook

Deploy the xStock WMS (NestJS API + Next.js frontend) to the SumoPod Ubuntu VPS
(`43.129.49.231`, user `ubuntu`) **alongside** the existing payslip app, without
disturbing it.

You run every command yourself on the VPS. Each script is idempotent and prints
what it's doing. Total hands-on time: ~15 minutes (plus build time).

---

## How it fits together

```
                          https://<your-domain>
                                   │
                          ┌────────▼─────────┐         (public: 80/443 only)
                          │      Nginx       │
                          └───┬──────────┬───┘
              location /api/  │          │  location /
        (strip /api prefix)   │          │
                  ┌───────────▼──┐    ┌──▼─────────────┐   (127.0.0.1 only —
                  │ NestJS API   │    │  Next.js app   │    never public)
                  │ :BACKEND_PORT│    │ :FRONTEND_PORT │
                  └──────┬───────┘    └────────────────┘
            ┌────────────┼─────────────┐
       ┌────▼────┐  ┌────▼────┐   serves /uploads/* (product images)
       │Postgres │  │  Redis  │
       │ xstock  │  │  db 3   │
       └─────────┘  └─────────┘
```

- **One hostname.** The frontend is served at `/`; the API is proxied under
  `/api`. Because both share an origin, **there are no CORS issues**.
- The frontend always calls `https://<domain>/api/...`, and product images load
  from `https://<domain>/api/uploads/...`. Nginx strips `/api` so the backend
  sees its real routes.
- Both Node processes bind to **127.0.0.1** — only Nginx is reachable from the
  internet.

### Safety guarantees for the existing payslip app
- Postgres/Redis/Nginx are installed with `apt` only if missing; **existing
  versions are never upgraded or reconfigured.**
- A **dedicated** Postgres DB + role and a **separate Redis DB index** are used.
- A **new** Nginx vhost named `xstock` is added; existing vhosts are never edited
  or removed. The script refuses to proceed if another site already serves your
  domain.
- The system Node is **not replaced** if the payslip app needs an older one
  (we fall back to an isolated per-user nvm install).
- **The firewall is never auto-enabled** (that could cut off payslip's ports).
  See [step 6](#6-firewall-ufw--read-before-touching).

---

## Prerequisites (do these first)

1. **DNS:** point an A record for your domain/subdomain at `43.129.49.231`.
   Example: `wms.yourdomain.com  A  43.129.49.231`. TLS needs this live.
2. **Get the code on the VPS.** Because `deploy.sh` does `git pull`, the cleanest
   path is to **fork** the repo (so it includes this `deploy/` folder and the two
   small production fixes), then on the VPS:
   ```bash
   cd ~
   git clone https://github.com/<you>/warehouse-management-system.git
   cd warehouse-management-system
   ```
   (Alternatively `rsync`/`scp` your local copy up — but then `deploy.sh`'s
   `git pull` won't have a matching remote.)

---

## Deploy — step by step

All commands run **as `ubuntu`** from the repo root.

### 1. Configure
```bash
cp deploy/xstock.env.example deploy/xstock.env
nano deploy/xstock.env
```
Set at minimum **`WMS_DOMAIN`** and **`LETSENCRYPT_EMAIL`**. Leave `DB_PASSWORD`
and `JWT_SECRET` **blank** — they're auto-generated and saved back. Optionally set
`RESEND_API_KEY` (email verification) and adjust ports if 3100/3101 are taken.

### 2. Provision the system + database
```bash
bash deploy/provision.sh
```
Installs Node 20 / Postgres / Redis / Nginx / Certbot / PM2, prints everything
currently listening (review for conflicts), verifies your ports are free, and
creates the dedicated DB + role.
> If it installed Node via nvm, **open a new shell** (or `source ~/.bashrc`)
> before the next step so `node`/`pm2` are on your PATH.

### 3. Set up the app (env, deps, migrations, build)
```bash
bash deploy/setup-app.sh
```
Writes `backend/.env` + `frontend/.env`, installs deps, runs `prisma migrate
deploy`, seeds (if `RUN_SEED=true`), and builds both apps.

### 4. Nginx + HTTPS
```bash
bash deploy/nginx-setup.sh
```
Adds the `xstock` vhost, tests config, reloads, then runs Certbot for HTTPS.
If DNS hasn't propagated yet, the site still works over HTTP — re-run later.

### 5. Start under PM2 (with log rotation + boot persistence)
```bash
bash deploy/start.sh
```

### 6. Firewall (ufw) — READ before touching
`provision.sh` prints `ufw status` but **does not change it**. Both app ports are
already bound to `127.0.0.1`, so they're not publicly reachable regardless.
- **If ufw is _active_:** make sure web + SSH are allowed (don't lock yourself out
  or break payslip):
  ```bash
  sudo ufw allow 'Nginx Full'   # 80 + 443
  sudo ufw allow OpenSSH
  ```
- **If ufw is _inactive_:** leave it inactive unless you know every port the
  payslip app needs. Enabling it with only web/SSH allowed can break payslip.
  SumoPod may also have a provider-level firewall/security group — open 80/443
  there if the site isn't reachable.

### 7. Smoke test
```bash
curl -i  http://127.0.0.1:$(grep BACKEND_PORT deploy/xstock.env|cut -d'"' -f2)/   # backend "Hello"
curl -I  https://<your-domain>/                                                   # frontend via Nginx
```
Then open `https://<your-domain>/` and log in.

**Seeded login** (if `RUN_SEED=true`): `admin@xstock.test` / the
`SEED_ADMIN_PASSWORD` you set (default `password123`). Also `manager@`, `staff@`,
`viewer@`. **Change these before real use.**

---

## Updating later (one command)
```bash
bash deploy/deploy.sh
```
Pulls latest, reinstalls, migrates, rebuilds, and reloads PM2 with zero downtime.

---

## Managing the app
```bash
pm2 status                       # both processes
pm2 logs xstock-backend          # tail backend logs
pm2 logs xstock-frontend         # tail frontend logs
pm2 reload xstock-backend        # restart one process
sudo tail -f /var/log/nginx/error.log
```

---

## Troubleshooting
- **502 Bad Gateway** → a Node process is down: `pm2 status`, then `pm2 logs`.
  Most common cause: backend exited because `JWT_SECRET` is empty (check
  `backend/.env`).
- **Login works but images 404** → `NEXT_PUBLIC_API_URL` must be
  `https://<domain>/api` and the frontend must have been **rebuilt** after it was
  set (it's baked in at build time). Re-run `deploy/deploy.sh`.
- **CORS errors** → shouldn't happen (same origin). If you split into two
  subdomains later, set `CORS_ORIGINS` to the frontend origin and rebuild.
- **Certbot failed** → DNS not pointing here yet. Fix DNS, then
  `sudo certbot --nginx -d <domain> --redirect`.
- **Prisma can't reach DB** → confirm `DATABASE_URL` in `backend/.env` matches the
  role/password in `deploy/xstock.env` (re-run `provision.sh` to resync).

---

## What I changed in the repo (vs. the GitHub clone)
- `backend/src/main.ts` — `app.listen()` now honors an optional `HOST` env var so
  production can bind to `127.0.0.1`. **Default is unchanged** (`0.0.0.0`), so
  local dev is unaffected.
- `backend/package.json` — fixed `start:prod` from `node dist/main` (broken: the
  compiled entry is actually `dist/src/main.js`) to `node dist/src/main`.
- `frontend/package.json` — moved the macOS-only `@next/swc-darwin-arm64` from
  `dependencies` to `optionalDependencies` so `npm install` doesn't hard-fail on
  the Linux VPS. Still installs on macOS; Linux pulls its own SWC binary.
- Added this `deploy/` folder.

---

## Manual steps only you can do
- [ ] Point the domain's DNS A record at `43.129.49.231`.
- [ ] Fill `WMS_DOMAIN` + `LETSENCRYPT_EMAIL` in `deploy/xstock.env`.
- [ ] (Optional) Provide a real `RESEND_API_KEY` for registration emails.
- [ ] Decide the ufw policy (step 6) given the payslip app.
- [ ] Change the seeded passwords after first login.
