---
Type: Runbook
Status: Active
Last-updated: 2026-02-24
---

# XA Catalog Contract Staging Checklist

Use this checklist to validate end-to-end catalog flow after moving XA sync from repo-file writes to the deployed contract (`xa-drop-worker` R2 + `/catalog/:storefront`).

Run steps in strict order. Do not skip steps.

Required URLs:
- Cloudflare dashboard: `https://dash.cloudflare.com/`
- GitHub Actions: `https://github.com/PeterCowling/base-shop/actions`

Required local paths:
- Uploader env: `apps/xa-uploader/.env.local`
- XA-B runtime catalog: `apps/xa-b/src/data/catalog.runtime.json`
- Evidence log: `docs/runbooks/artifacts/xa-catalog-contract-staging-evidence.md`

### Step 1 - Capture Staging Contract Values
DO:
1. Open: `https://dash.cloudflare.com/`
2. Click: `Workers & Pages -> xa-drop-worker -> Overview`
3. Copy the worker host URL (for example: `https://xa-drop-worker.<subdomain>.workers.dev`).
4. In terminal, generate two tokens:
```bash
openssl rand -hex 32
openssl rand -hex 32
```
5. Assign values:
   - `CATALOG_WRITE_TOKEN` = first generated token
   - `CATALOG_READ_TOKEN` = second generated token (or same value as write token if you intentionally want one shared token)

SAVE:
- `XA_CATALOG_CONTRACT_BASE_URL` (must end with `/catalog/`) -> `docs/runbooks/artifacts/xa-catalog-contract-staging-evidence.md`
- `CATALOG_WRITE_TOKEN` and `CATALOG_READ_TOKEN` -> secret manager record `XA / staging / catalog-contract`

DONE WHEN:
- You have a base URL like `https://xa-drop-worker.<subdomain>.workers.dev/catalog/`.
- Both tokens are generated and stored in a non-repo secret store.

IF BLOCKED:
- If `xa-drop-worker` is not visible, open `Workers & Pages -> Account Home` and switch to the correct Cloudflare account.

### Step 2 - Configure Worker Secrets and Vars
DO:
1. Open: `https://dash.cloudflare.com/`
2. Click: `Workers & Pages -> xa-drop-worker -> Settings -> Variables`
3. In `Secrets`, set:
   - `CATALOG_WRITE_TOKEN` = value from Step 1
   - `CATALOG_READ_TOKEN` = value from Step 1 (optional but recommended)
4. In `Environment Variables`, set/confirm:
   - `CATALOG_PREFIX` = `catalog/`
   - `CATALOG_MAX_BYTES` = `10485760`

SAVE:
- Variable/secrets update timestamp or screenshot reference -> `docs/runbooks/artifacts/xa-catalog-contract-staging-evidence.md`

DONE WHEN:
- `CATALOG_WRITE_TOKEN` appears as masked secret.
- `CATALOG_PREFIX` and `CATALOG_MAX_BYTES` are present in environment variables.

IF BLOCKED:
- If you cannot edit variables, request Cloudflare IAM permission `Workers Scripts:Edit`.

### Step 3 - Deploy and Health-Check Worker
DO:
1. In terminal at repo root, run:
```bash
pnpm --filter @apps/xa-drop-worker build
pnpm --filter @apps/xa-drop-worker exec wrangler deploy
```
2. Open: `https://dash.cloudflare.com/`
3. Click: `Workers & Pages -> xa-drop-worker -> Deployments`
4. Confirm latest deployment status is `Active` for staging target.
5. In terminal, run:
```bash
curl -i "https://<your-worker-host>/health"
```

SAVE:
- Deploy confirmation (timestamp/version) -> `docs/runbooks/artifacts/xa-catalog-contract-staging-evidence.md`
- `/health` response headers/body -> `docs/runbooks/artifacts/xa-catalog-contract-staging-evidence.md`

DONE WHEN:
- Latest deployment is visible in Cloudflare Deployments.
- `/health` returns HTTP `200` with body containing `{"ok":true}`.

IF BLOCKED:
- If deploy fails, resolve Wrangler auth/config first, then rerun Step 3.

### Step 4 - Point XA Uploader at Contract and Publish
DO:
1. Edit `apps/xa-uploader/.env.local` and set:
```bash
XA_CATALOG_CONTRACT_BASE_URL=https://<your-worker-host>/catalog/
XA_CATALOG_CONTRACT_WRITE_TOKEN=<CATALOG_WRITE_TOKEN>
```
2. Start uploader:
```bash
pnpm --filter @apps/xa-uploader dev
```
3. Open: `http://localhost:3020`
4. Click: `Login -> Enter console token -> Validate & sync -> Run sync`.
5. If the API returns `catalog_input_empty`, explicitly confirm the retry only when an empty catalog publish is intentional.

SAVE:
- Sync result message + timestamp -> `docs/runbooks/artifacts/xa-catalog-contract-staging-evidence.md`
- Returned `publishedVersion` value (if present) -> `docs/runbooks/artifacts/xa-catalog-contract-staging-evidence.md`

DONE WHEN:
- UI shows `Sync completed.`
- No `catalog_publish_unconfigured` or `catalog_publish_failed` error is shown.

IF BLOCKED:
- If publish fails, confirm Step 1/2 values and rerun Step 4.

### Step 5 - Verify Contract Read Endpoint + ETag Behavior
DO:
1. Run first read request:
```bash
curl -i \
  -H "X-XA-Catalog-Token: <CATALOG_READ_TOKEN_OR_WRITE_TOKEN>" \
  "https://<your-worker-host>/catalog/xa-b"
```
2. Copy the `ETag` value from the first response.
3. Run conditional read using that exact ETag:
```bash
curl -i \
  -H "X-XA-Catalog-Token: <CATALOG_READ_TOKEN_OR_WRITE_TOKEN>" \
  -H "If-None-Match: <ETAG_FROM_STEP_5_1>" \
  "https://<your-worker-host>/catalog/xa-b"
```

SAVE:
- First read status + ETag -> `docs/runbooks/artifacts/xa-catalog-contract-staging-evidence.md`
- Conditional read status -> `docs/runbooks/artifacts/xa-catalog-contract-staging-evidence.md`

DONE WHEN:
- First request returns HTTP `200` with JSON containing `ok`, `storefront`, `catalog`, `mediaIndex`.
- Second request returns HTTP `304` with matching `ETag`.

IF BLOCKED:
- If first request is `401`, verify token.
- If first request is `404`, rerun Step 4 publish.

### Step 6 - Wire XA-B Build to Contract Read
DO:
1. In terminal at repo root, run:
```bash
XA_CATALOG_CONTRACT_BASE_URL=https://<your-worker-host>/catalog/ \
XA_CATALOG_CONTRACT_READ_TOKEN=<CATALOG_READ_TOKEN_OR_WRITE_TOKEN> \
XA_CATALOG_CONTRACT_READ_REQUIRED=1 \
pnpm --filter @apps/xa-b build
```
2. Confirm build log includes:
```text
[xa-build] synced runtime catalog from contract:
```
3. Open file: `apps/xa-b/src/data/catalog.runtime.json` and verify content changed to latest published payload when applicable.

SAVE:
- XA-B build output snippet with sync log line -> `docs/runbooks/artifacts/xa-catalog-contract-staging-evidence.md`
- Runtime catalog verification note -> `docs/runbooks/artifacts/xa-catalog-contract-staging-evidence.md`

DONE WHEN:
- XA-B build succeeds.
- Build logs confirm contract sync.

IF BLOCKED:
- If build fails on contract read, rerun Step 5 and verify `XA_CATALOG_CONTRACT_BASE_URL` plus token.

### Step 7 - Verify XA App Runtime API Uses Synced Catalog
DO:
1. Start XA-B locally:
```bash
pnpm --filter @apps/xa-b dev
```
2. In a second terminal, run:
```bash
curl -sS "http://localhost:3013/api/search/sync"
```
3. Confirm response includes both fields:
   - `version`
   - `products` (non-empty array)

SAVE:
- `/api/search/sync` JSON response snippet -> `docs/runbooks/artifacts/xa-catalog-contract-staging-evidence.md`
- Product count observed -> `docs/runbooks/artifacts/xa-catalog-contract-staging-evidence.md`

DONE WHEN:
- `/api/search/sync` returns HTTP `200`.
- Response shows valid `version` and expected product count for latest catalog.

IF BLOCKED:
- If product count is stale, rerun Step 6 build and restart XA-B dev server.

## Exit Criteria
- Worker deploy, publish, and read endpoints are verified.
- XA uploader successfully publishes to contract.
- XA-B build and runtime API consume the contract-backed catalog.
- Evidence file has entries for all seven steps.
