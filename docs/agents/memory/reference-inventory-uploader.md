# Inventory Uploader — Deployment and Database

## Deployed Worker

- **URL**: https://inventory-uploader.peter-cowling1976.workers.dev
- **Worker name**: `inventory-uploader` (matches `wrangler.toml`)
- **Account ID**: `9e2c24d2db8e38f743f0ad6f9dfcfd65`
- **Deployed**: 2026-03-13, Version ID `e237660a-077a-4266-8107-41bfb2409951`

## Wrangler Auth

The `CLOUDFLARE_API_TOKEN` in `.env.local` is account-scoped and fails at `/memberships` endpoint when used alone.
**Always set both env vars:**
```bash
CLOUDFLARE_API_TOKEN=<from .env.local>
CLOUDFLARE_ACCOUNT_ID=9e2c24d2db8e38f743f0ad6f9dfcfd65
```
Example: `CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=9e2c24d2db8e38f743f0ad6f9dfcfd65 wrangler deploy`

## Neon Database

- **Project name**: `inventory-uploader`
- **Project ID**: `silent-flower-70372159`
- **Region**: `aws-eu-west-2`
- **Database**: `neondb`
- **Host**: `ep-weathered-union-abnk7u4d.eu-west-2.aws.neon.tech`
- **Pooler host**: `ep-weathered-union-abnk7u4d-pooler.eu-west-2.aws.neon.tech`
- **Connection string**: stored in `apps/inventory-uploader/.env.local` as `DATABASE_URL`
- **Migrations**: all 13 platform-core migrations applied as of 2026-03-13

## Prisma / CF Workers Architecture

- Standard Prisma TCP connections are blocked in CF Workers V8 isolate.
- `packages/platform-core/src/db.ts` detects the CF runtime via `EdgeRuntime` global / `CF_PAGES` / `WORKERS_RS_VERSION` env vars.
- In CF Workers: uses `@prisma/adapter-neon` + `@neondatabase/serverless` (HTTP-based).
- In Node.js (reception, prime, caryina, local dev): uses standard Prisma client — unchanged.
- `driverAdapters` preview feature enabled in `packages/platform-core/prisma/schema.prisma`.

## Worker Secrets (set via wrangler secret put)

- `DATABASE_URL` — Neon connection string
- `INVENTORY_ADMIN_TOKEN` — login token (value also in `.env.local`)
- `INVENTORY_SESSION_SECRET` — HMAC session signing key (value also in `.env.local`)
- `INVENTORY_ALLOWED_IPS` — currently `127.0.0.1,::1` — **update with real IPs before production use**

## Worker Vars (in wrangler.toml, not secrets)

- `INVENTORY_BACKEND=prisma`
- `INVENTORY_LOCAL_FS_DISABLED=1`

## KV Namespace

- **Binding**: `INVENTORY_KV`
- **ID**: `b7e28041b6644024bebd7be4f791f1fb`
- Used for: KV-backed session revocation (revokeAllSessions())

## Local Dev

- Port: 3021
- Uses `.env.local` with `DATABASE_URL` pointing at Neon, `INVENTORY_BACKEND=prisma`
- `INVENTORY_ALLOWED_IPS=127.0.0.1,::1` and `INVENTORY_TRUST_PROXY_IP_HEADERS=true` set in `.env.local`
- KV not available locally — sessions fail open (no revocation) without wrangler dev

## Migration Note

Migration `20250301010000_add_reset_token_expiry` had `DATETIME` (MySQL syntax) — fixed to `TIMESTAMP(3)` for Postgres compatibility. This fix is committed to dev.
