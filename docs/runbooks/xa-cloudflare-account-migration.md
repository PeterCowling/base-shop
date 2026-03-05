---
Type: Runbook
Status: Active
Last-reviewed: 2026-03-05
---

# XA Cloudflare Account Migration Runbook

Purpose: capture the exact XA staging setup that currently works, plus known failure modes we already hit, so migration to a fresh Cloudflare account is deterministic.

Scope:
- `apps/xa-uploader` (Worker, OpenNext)
- `apps/xa-drop-worker` (Worker, catalog/drafts/deploy contract)
- `apps/xa-b` (static export deployed to Cloudflare Pages)
- GitHub Actions deployment wiring
- runtime security headers/CSP posture for staging

## Current Working Architecture (Staging)

1. `xa-uploader-preview` publishes catalog + draft payloads to `xa-drop-worker-preview` via:
   - direct HTTPS contract URLs, and
   - `XA_CATALOG_CONTRACT_SERVICE` service binding for internal Worker-to-Worker calls.
2. `xa-drop-worker-preview` stores contract data in R2 (catalog + drafts).
3. `xa-uploader-preview` triggers `POST /deploy/xa-b` on `xa-drop-worker-preview` after successful publish.
4. `xa-drop-worker-preview` triggers XA-B rebuild using:
   - preferred: `XA_B_PAGES_DEPLOY_HOOK_URL` (Cloudflare Pages deploy hook),
   - fallback: GitHub workflow dispatch (`xa.yml` / `xa-b-redeploy.yml`) via `XA_GITHUB_ACTIONS_TOKEN`.
5. XA-B build pulls latest contract catalog at build-time via `XA_CATALOG_CONTRACT_READ_URL` and emits static `out/` deployed by CI (`wrangler pages deploy`).
6. XA-B runtime security headers/CSP are enforced by a Pages advanced-mode worker generated at build-time (`apps/xa-b/scripts/pages-worker.js` -> `apps/xa-b/out/_worker.js`) with per-response nonce CSP for inline script/style tags.
7. xa-uploader middleware applies baseline browser security headers on all responses; unauthenticated/vendored sync routes return 404 without rate-limit headers.

Staging URL convention for `xa-b-site`:
- branch `dev` preview URL is `https://dev.xa-b-site.pages.dev/`.
- do not use `https://dev--xa-b-site.pages.dev/` (wrong hostname pattern for this Pages setup).

## What We Configured

### Cloudflare resources

- Workers:
  - `xa-uploader` + `xa-uploader-preview`
  - `xa-drop-worker` + `xa-drop-worker-preview`
- Pages:
  - project `xa-b-site`
- R2 buckets:
  - submissions: `xa-submissions`, `xa-submissions-preview`
  - media: `xa-media`, `xa-media-preview`
  - catalog storage is read from `CATALOG_BUCKET` if bound, otherwise falls back to `SUBMISSIONS_BUCKET`.
- KV:
  - `XA_UPLOADER_KV` namespace for sync lock + deploy cooldown/pending markers.

### Repo/workflow wiring

- `.github/workflows/xa.yml`
  - deploys all XA apps
  - xa-b build receives:
    - `XA_CATALOG_CONTRACT_READ_URL`
    - `NEXT_PUBLIC_XA_IMAGES_BASE_URL` from `XA_IMAGES_BASE_URL_PREVIEW || XA_IMAGES_BASE_URL`
  - xa-uploader preflight step runs:
    - `preflight:deploy -- --env preview --sync-kv-id-from-env --sync-deploy-hook-from-env`
- `.github/workflows/xa-b-redeploy.yml`
  - manual/on-demand XA-B build + deploy path

### Security hardening wiring (must preserve)

- `apps/xa-b/scripts/pages-worker.js`
  - source template for XA-B runtime CSP/security headers in Pages advanced mode.
- `apps/xa-b/scripts/build-xa.mjs`
  - copies `scripts/pages-worker.js` to `out/_worker.js` after a successful static build.
- `apps/xa-b/out/_worker.js` (build artifact)
  - generates nonce per HTML response,
  - rewrites inline `<script>` / `<style>` tags to include nonce,
  - sets `Content-Security-Policy` with nonce-based `script-src` and `style-src`,
  - applies baseline headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`),
  - serves `/csp-report` as `204` for CSP report collection.
- `apps/xa-b/public/_headers`
  - keeps static baseline headers only (no static CSP line; CSP is runtime nonce-based).
- `apps/xa-uploader/src/middleware.ts`
  - applies baseline security headers for both allowlisted and denied requests.
- `apps/xa-uploader/src/app/api/catalog/sync/route.ts`
  - auth/vendor checks run before rate-limit handling for 404 paths (prevents `x-ratelimit-*` leakage on unauthenticated probes).

### Required GitHub repository configuration

Secrets:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `XA_B_DEPLOY_HOOK_URL_PREVIEW` (used by uploader preflight sync)
- `XA_CATALOG_CONTRACT_READ_TOKEN` (used by xa-b build to read protected catalog contract)

Variables:
- `XA_CATALOG_CONTRACT_READ_URL`
- `XA_IMAGES_BASE_URL_PREVIEW` (staging image host)
- optional fallback `XA_IMAGES_BASE_URL`
- `XA_UPLOADER_KV_NAMESPACE_ID_PREVIEW`

### Required Worker secrets/vars

`xa-uploader` (preview/prod as applicable):
- `XA_UPLOADER_SESSION_SECRET`
- `XA_UPLOADER_ADMIN_TOKEN`
- `NEXTAUTH_SECRET`
- `SESSION_SECRET`
- `CART_COOKIE_SECRET`
- `XA_CATALOG_CONTRACT_BASE_URL`
- `XA_CATALOG_CONTRACT_WRITE_TOKEN`
- `XA_B_DEPLOY_HOOK_URL` (secret only; do not hardcode in `wrangler.toml`)
- `XA_B_DEPLOY_HOOK_TOKEN`
- `XA_UPLOADER_DEPLOY_DRAIN_TOKEN`
- optional deploy-trigger controls (defaults shown; keep unless you intentionally tune):
  - `XA_B_DEPLOY_HOOK_COOLDOWN_SECONDS` (default `900`)
  - `XA_B_DEPLOY_HOOK_MAX_RETRIES` (default `2`, max `5`)
  - `XA_B_DEPLOY_HOOK_RETRY_BASE_DELAY_MS` (default `800`, max `5000`)

`xa-drop-worker` (preview/prod as applicable):
- `CATALOG_WRITE_TOKEN`
- `CATALOG_READ_TOKEN` (required for hardened read auth separation; do not leave unset)
- `XA_DEPLOY_TRIGGER_TOKEN`
- `XA_B_PAGES_DEPLOY_HOOK_URL` (preferred live rebuild trigger)
- optional fallback: `XA_GITHUB_ACTIONS_TOKEN`

Important vars:
- `XA_GITHUB_REPO_OWNER`
- `XA_GITHUB_REPO_NAME`
- `XA_GITHUB_WORKFLOW_FILE`
- `XA_GITHUB_WORKFLOW_REF`
- `CATALOG_PREFIX`
- `ALLOWED_IPS` (empty for preview unless explicitly managed)

Important config invariant:
- `apps/xa-uploader/wrangler.toml` must not contain concrete deploy hook hostnames. Set `XA_B_DEPLOY_HOOK_URL` via Cloudflare secret or GitHub-to-Cloudflare preflight sync only.

## What Did Not Work (Observed) and Why

1. Cloudflare Pages Git-connected build path failed for this monorepo.
- Symptom:
  - Pages build log errors reading root `wrangler.toml` (`Durable Objects bindings should specify script_name`, internal error after clone).
- Why:
  - Pages auto-build scanned repo Wrangler config not intended for XA-B static Pages deploy.
- Decision:
  - Use CI direct deploy (`wrangler pages deploy out/`) as the canonical path.

2. Dashboard "Create deployment" upload flow was a dead end for automated staging.
- Symptom:
  - UI provided manual file/folder upload flow, not the reliable automated trigger path needed for publish-driven rebuild.
- Decision:
  - Keep deploys CI-driven and triggerable through deploy endpoint + deploy hook.

3. Cloud sync readiness could be green while publish still failed (`catalog_publish_failed`, 502/404).
- Symptom:
  - `GET /api/catalog/sync` ready=true, but POST publish failed with upstream 404.
- Why:
  - contract endpoint/config mismatch can pass readiness but fail at runtime publish.
- Fix in code:
  - contract root normalization + explicit publish error mapping in uploader contract clients.

4. Image upload succeeded but image URL 404’d in storefront.
- Symptom:
  - R2 object existed, public URL used by XA-B returned 404.
- Why:
  - mismatch between actual public bucket host and build-time `NEXT_PUBLIC_XA_IMAGES_BASE_URL`, or bucket public access not enabled for the correct bucket/environment.
- Fix:
  - use staging-specific `XA_IMAGES_BASE_URL_PREVIEW` and verify bucket public endpoint + object prefix alignment.

5. Deploy trigger token scoping/UI assumptions were error-prone.
- Symptom:
  - confusion in Cloudflare token UI around account scoping and permission row semantics.
- Mitigation:
  - document exact minimum permissions and keep token purpose-specific.

6. Staging URL confusion (`dev--` vs `dev.`) caused false outage signals.
- Symptom:
  - `dev--xa-b-site.pages.dev` failed DNS lookup while a valid `dev` deployment existed.
- Why:
  - this project resolves preview branch URL as `https://dev.xa-b-site.pages.dev/`.
- Fix:
  - treat `https://dev.xa-b-site.pages.dev/` as canonical staging URL and validate it in CI after deploy.

7. Static CSP in `_headers` was too broad for inline script/style.
- Symptom:
  - policy allowed `'unsafe-inline'` for script/style.
- Fix:
  - moved CSP enforcement to Pages advanced worker (`out/_worker.js`) with nonce-based CSP for script/style tags.
- Migration requirement:
  - keep `apps/xa-b/scripts/pages-worker.js` as the source of truth and ensure build copies it to `out/_worker.js`; avoid reintroducing static CSP lines in `public/_headers`.

8. Unauthenticated sync probes leaked endpoint shape via rate-limit headers.
- Symptom:
  - unauthenticated `POST /api/catalog/sync` 404 still returned `X-RateLimit-*`.
- Fix:
  - moved auth/vendor checks ahead of rate-limit for 404 paths.
- Migration requirement:
  - preserve route order in `apps/xa-uploader/src/app/api/catalog/sync/route.ts`.

9. Catch-all Pages Functions route attempts failed in this account/runtime.
- Symptom:
  - deploying `functions/[[all]].ts` (or `[[path]]`) produced runtime 1101 errors (`Missing parameter name at index ... /:all*`).
- Why:
  - Pages route pattern parsing in this runtime rejected catch-all function syntax for our setup.
- Decision:
  - do not rely on catch-all Pages Functions for CSP rewriting here; use advanced-mode `_worker.js` in output directory.

10. Deploy hook transient failures caused missed rebuilds before retry/backoff handling.
- Symptom:
  - intermittent 5xx/network failures from deploy target caused catalog publish success without storefront rebuild.
- Fix:
  - retry + backoff in deploy trigger logic (`XA_B_DEPLOY_HOOK_MAX_RETRIES`, `XA_B_DEPLOY_HOOK_RETRY_BASE_DELAY_MS`) with bounded attempts.
- Migration requirement:
  - preserve default retry settings unless a stricter SLO requires tuning.

11. Catalog read endpoint was left public when `CATALOG_READ_TOKEN` was unset.
- Symptom:
  - `GET /catalog/:storefront` returned 200 without token.
- Fix:
  - enforce catalog read auth in worker code with `requireCatalogReadToken` (falls back to write token when read token is unset),
  - configure dedicated `CATALOG_READ_TOKEN` in preview and production,
  - pass `XA_CATALOG_CONTRACT_READ_TOKEN` to xa-b build workflows.
- Migration requirement:
  - treat unauthenticated read access as a blocking misconfiguration.

## Migration Checklist for a Fresh Cloudflare Account

1. Create foundational resources first.
- Workers (preview + prod): `xa-drop-worker`, `xa-uploader`
- Pages project: `xa-b-site`
- R2 buckets: submissions/media preview+prod
- KV namespace: uploader lock/debounce namespace preview+prod

2. Configure Wrangler bindings/ids for new account.
- Update `wrangler.toml` ids/names for new KV + R2 resources.
- Confirm `XA_CATALOG_CONTRACT_SERVICE` binding points to new drop-worker service names.

3. Set Worker secrets before first deploy.
- Apply all secrets listed above for both preview and production environments.

4. Configure GitHub repository secrets/vars for the new account.
- Replace Cloudflare account/token values.
- Replace XA vars (`XA_CATALOG_CONTRACT_READ_URL`, `XA_IMAGES_BASE_URL_PREVIEW`, `XA_UPLOADER_KV_NAMESPACE_ID_PREVIEW`, deploy hook URL secret).
- Ensure `XA_B_DEPLOY_HOOK_URL_PREVIEW` is set as a GitHub Secret (not a repo variable, not in code).

5. Deploy order (strict).
- Deploy `xa-drop-worker-preview` first.
- Deploy `xa-uploader-preview` second.
- Deploy xa-b via CI Pages step third.

6. Validate full publish path.
- Login in uploader.
- Upload image.
- Save/edit product draft.
- Run sync publish (non-dry-run).
- Confirm deploy trigger accepted (202).
- Confirm latest xa-b Pages deployment includes new catalog/image.
- Confirm unauthenticated sync probe (`POST /api/catalog/sync` without session) returns 404 and does not include `X-RateLimit-*` headers.
- Confirm xa-uploader endpoints include baseline browser security headers.
- Confirm xa-b HTML responses include nonce-based `Content-Security-Policy` and baseline headers.
- Confirm deploy cooldown behavior:
  - first publish triggers deploy,
  - immediate second publish reports cooldown skip (`skipped_cooldown`) instead of triggering another deploy.
- Confirm catalog read auth:
  - unauthenticated `GET <drop-worker>/catalog/xa-b` returns `401`,
  - authenticated read with `X-XA-Catalog-Token: <CATALOG_READ_TOKEN>` returns `200`.

7. Run/verify CI regression coverage for publish + deploy failure handling.
- `apps/xa-uploader/src/app/api/catalog/sync/__tests__/route.cloud-publish.test.ts`
  - publish failure maps to `502 catalog_publish_failed` with `publishStatus` and skips finalize/deploy,
  - finalize write failure records warning but still attempts deploy.
- `apps/xa-uploader/src/lib/__tests__/deployHook.test.ts`
  - transient deploy failures retry and recover,
  - retry exhaustion returns failed status with bounded attempts,
  - cooldown gate prevents rapid redeploy spam.
- `apps/xa-uploader/src/app/api/catalog/sync/__tests__/route.test.ts`
  - cloud sync publish path behavior when local fs is disabled.

## Post-Migration Verification (Must Pass)

- `GET <drop-worker>/health` returns 200 `{ "ok": true }`
- unauthenticated `GET <drop-worker>/catalog/xa-b` returns 401
- `GET /api/catalog/sync?storefront=xa-b` returns `ready: true` and `contractConfigured: true`
- `POST /api/catalog/sync` returns `ok: true` (no `catalog_publish_failed`)
- deploy trigger response is `ok: true` from hook or dispatch provider
- repeated immediate sync publish does not spam deploys (cooldown skip is reported)
- xa-b staging URL renders newly published product edits and uploaded images
- unauthenticated `POST /api/catalog/sync` 404 does not expose `X-RateLimit-*`
- xa-uploader `/` and `/api/uploader/session` responses include:
  - `Content-Security-Policy`
  - `X-Frame-Options`
  - `X-Content-Type-Options`
  - `Referrer-Policy`
  - `Permissions-Policy`
  - `Strict-Transport-Security`
- xa-b HTML response includes:
  - `Content-Security-Policy` with `script-src 'nonce-...'` and `style-src 'nonce-...'`
  - `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`

## References

- `.github/workflows/xa.yml`
- `.github/workflows/xa-b-redeploy.yml`
- `apps/xa-uploader/wrangler.toml`
- `apps/xa-drop-worker/wrangler.toml`
- `apps/xa-b/wrangler.toml`
- `apps/xa-b/scripts/pages-worker.js`
- `apps/xa-b/scripts/build-xa.mjs`
- `apps/xa-uploader/scripts/preflight-deploy.ts`
- `apps/xa-uploader/src/middleware.ts`
- `apps/xa-uploader/src/app/api/catalog/sync/route.ts`
- `apps/xa-uploader/src/lib/catalogContractClient.ts`
- `apps/xa-uploader/src/lib/catalogDraftContractClient.ts`
- `apps/xa-uploader/src/lib/deployHook.ts`
- `apps/xa-uploader/src/app/api/catalog/sync/__tests__/route.cloud-publish.test.ts`
- `apps/xa-uploader/src/lib/__tests__/deployHook.test.ts`
- `apps/xa-uploader/src/app/api/catalog/sync/__tests__/route.test.ts`
- `apps/xa-drop-worker/src/index.ts`
