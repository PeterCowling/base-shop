---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Infra
Workstream: Engineering
Created: 2026-02-28
Last-updated: 2026-02-28
Feature-Slug: xa-uploader-deployment-config
Execution-Track: mixed
Deliverable-Family: doc
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: operator-config-doc
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/xa-uploader-deployment-config/plan.md
Trigger-Source: IDEA-DISPATCH-20260228-0069
Dispatch-ID: IDEA-DISPATCH-20260228-0069
---

# XA Uploader Deployment Config Fact-Find Brief

## Scope

### Summary
`apps/xa-uploader` is a Cloudflare Worker app (OpenNext) that has no `.env.example` and an
empty `[env.preview.vars]` section in `wrangler.toml`. An operator deploying or managing
this app for the first time has no documented list of required or optional environment
variables, their formats, or their defaults. This makes deployment a guessing exercise.
The deliverable is a fully annotated `.env.example` plus a corrected `wrangler.toml` with
populated `[vars]` sections for safe-to-commit public variables.

### Goals
- Create `apps/xa-uploader/.env.example` documenting all env vars (required vs optional, format, default)
- Populate `wrangler.toml` `[vars]` (production) and `[env.preview.vars]` (staging) with NEXT_PUBLIC and optional server vars
- Add deployment instructions as comments in wrangler.toml
- No secrets are ever committed — only placeholders and safe public vars

### Non-goals
- Changing any application logic
- Setting up secrets in Cloudflare dashboard (operator manual step, not automated)
- Documenting CI-only secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) — these are GitHub Actions secrets documented separately

### Constraints & Assumptions
- Constraints:
  - All 7 required secrets (`XA_UPLOADER_SESSION_SECRET`, `XA_UPLOADER_ADMIN_TOKEN`, `NEXTAUTH_SECRET`, `SESSION_SECRET`, `CART_COOKIE_SECRET`, `XA_CATALOG_CONTRACT_BASE_URL`, `XA_CATALOG_CONTRACT_WRITE_TOKEN`) must NEVER appear in committed files — only in `.env.local` (local dev) or via `wrangler secret put` (CF deployment)
  - `.env.example` must be committed to the repo (not gitignored)
  - `wrangler.toml` `[vars]` is for non-secret per-deployment configuration (NEXT_PUBLIC vars, optional tuning)
- Assumptions:
  - The current `.env.local` values are for local dev only; `wrangler secret put` is the production path
  - `NEXT_PUBLIC_XA_UPLOADER_R2_DESTINATION` and `NEXT_PUBLIC_XA_UPLOADER_R2_UPLOAD_URL` are deployment-specific public vars (correct to put in wrangler.toml [vars])

## Outcome Contract

- **Why:** xa-uploader is approaching real use but has no documented deployment path — an operator cannot configure it without reading source code
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Operator can deploy xa-uploader from scratch by following .env.example and wrangler.toml comments alone, without reading source code
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/xa-uploader/wrangler.toml` — Cloudflare Worker config; `[env.preview.vars]` exists but is empty (comment-only)
- `apps/xa-uploader/.env.local` — local dev env (gitignored); contains `SESSION_SECRET`, `XA_UPLOADER_ADMIN_TOKEN`, `XA_UPLOADER_SESSION_SECRET`, `NEXTAUTH_SECRET`, `CART_COOKIE_SECRET`; all of these are required in production (enforced by `next.config.mjs:33-44`; auto-generated randomly in non-production)`
- `.github/workflows/xa.yml` — CI pipeline; deploy-xa-uploader job uses `wrangler deploy --env preview`; no secret-setting step (secrets must be pre-configured in CF dashboard)

### Key Modules / Files

- `apps/xa-uploader/src/lib/uploaderAuth.ts` — `requireEnv("XA_UPLOADER_SESSION_SECRET")` + `requireEnv("XA_UPLOADER_ADMIN_TOKEN")` throw `Error` on missing; vendor mode reads `XA_UPLOADER_MODE`, `XA_UPLOADER_VENDOR_TOKEN`
- `apps/xa-uploader/src/lib/catalogContractClient.ts` — `XA_CATALOG_CONTRACT_BASE_URL` / `XA_CATALOG_CONTRACT_WRITE_TOKEN` are read without `requireEnv()`; throws `CatalogPublishError("unconfigured", ...)` at sync-time, which surfaces as 503
- `apps/xa-uploader/src/app/api/catalog/sync/route.ts` — `XA_UPLOADER_SYNC_VALIDATE_TIMEOUT_MS` (45s default), `XA_UPLOADER_SYNC_TIMEOUT_MS` (300s default), `XA_UPLOADER_SYNC_LOG_MAX_BYTES` (128KB default), `XA_UPLOADER_EXPOSE_SYNC_LOGS` (off by default), `XA_UPLOADER_MODE` (blocks sync in vendor mode)
- `apps/xa-uploader/src/lib/submissionZip.ts` — `XA_UPLOADER_MAX_FILES_SCANNED` (10000), `XA_UPLOADER_MAX_FILES_PER_SPEC` (500), `XA_UPLOADER_MAX_IMAGES_PER_PRODUCT` (100), `XA_UPLOADER_MAX_IMAGES_PER_SUBMISSION` (400), `XA_UPLOADER_MIN_IMAGE_EDGE` (1600), `XA_UPLOADER_ALLOWED_IMAGE_ROOTS` (base dir)
- `apps/xa-uploader/src/lib/rateLimit.ts` — `XA_UPLOADER_RATE_LIMIT_MAX_KEYS` (20000), `XA_TRUST_PROXY_IP_HEADERS` (trust CF IP headers; default off)
- `apps/xa-uploader/src/lib/catalogStorefront.server.ts` — `XA_UPLOADER_PRODUCTS_CSV_PATH` (override products CSV path; default: `apps/xa-uploader/data/products.<storefront>.csv`)
- `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts` — `NEXT_PUBLIC_XA_UPLOADER_MODE` (client-side mode), `NEXT_PUBLIC_XA_UPLOADER_R2_DESTINATION`, `NEXT_PUBLIC_XA_UPLOADER_R2_UPLOAD_URL`, `NEXT_PUBLIC_XA_UPLOADER_MIN_IMAGE_EDGE`

### Complete Env Var Inventory

#### Required secrets — NEVER commit; set via `wrangler secret put` for CF or `.env.local` for local dev

These are validated by `next.config.mjs` `requireEnv()` at build time in production (non-CI) builds and by `uploaderAuth.ts` at runtime.

| Var | Purpose | Behaviour if missing |
|---|---|---|
| `XA_UPLOADER_SESSION_SECRET` | HMAC-SHA256 key for signing session cookies (min 32 chars) | Build fails in prod; throws at runtime |
| `XA_UPLOADER_ADMIN_TOKEN` | Admin login credential compared via timing-safe equal (min 32 chars) | Build fails in prod; throws at runtime |
| `NEXTAUTH_SECRET` | NextAuth.js session secret — required by shared Next.js config (min 32 chars) | Build fails in prod (`next.config.mjs:34`) |
| `SESSION_SECRET` | Session encryption secret used by shared platform config (min 32 chars) | Build fails in prod (`next.config.mjs:35`) |
| `CART_COOKIE_SECRET` | Cart cookie signing secret from shared platform config | Build fails in prod (`next.config.mjs:36`) |
| `XA_CATALOG_CONTRACT_BASE_URL` | URL of catalog contract endpoint (PUT destination for catalog publish) | Sync returns 503 `unconfigured` |
| `XA_CATALOG_CONTRACT_WRITE_TOKEN` | Bearer token for catalog contract writes (`X-XA-Catalog-Token` header) | Sync returns 503 `unconfigured` |

> **Note:** In non-production (local dev, CI, test), `next.config.mjs` auto-generates random values for the first five secrets via `ensureStrongOrRandom()`. They need not be set in `.env.local` for local dev unless stable session persistence is desired.

#### Optional secrets — set via `wrangler secret put` if using vendor mode

| Var | Purpose | Default |
|---|---|---|
| `XA_UPLOADER_VENDOR_TOKEN` | Separate login token for vendor mode; falls back to admin token if unset | Falls back to `XA_UPLOADER_ADMIN_TOKEN` |

#### Optional server vars — safe for `wrangler.toml [vars]`

| Var | Purpose | Default |
|---|---|---|
| `XA_UPLOADER_MODE` | Set to `"vendor"` to enable vendor mode (hides sync, uses vendor token for auth) | internal mode |
| `XA_CATALOG_CONTRACT_TIMEOUT_MS` | HTTP timeout for catalog contract publish (ms) | `20000` |
| `XA_UPLOADER_SYNC_VALIDATE_TIMEOUT_MS` | Timeout for validate phase of sync script (ms) | `45000` |
| `XA_UPLOADER_SYNC_TIMEOUT_MS` | Timeout for full sync script run (ms) | `300000` |
| `XA_UPLOADER_SYNC_LOG_MAX_BYTES` | Max bytes of sync log captured in response | `131072` (128KB) |
| `XA_UPLOADER_EXPOSE_SYNC_LOGS` | Set `"1"` to include sync stdout/stderr in non-prod responses | off |
| `XA_UPLOADER_MAX_FILES_SCANNED` | Max files scanned in a submission zip | `10000` |
| `XA_UPLOADER_MAX_FILES_PER_SPEC` | Max files per product spec in submission | `500` |
| `XA_UPLOADER_MAX_IMAGES_PER_PRODUCT` | Max images per product in submission | `100` |
| `XA_UPLOADER_MAX_IMAGES_PER_SUBMISSION` | Max total images in a submission | `400` |
| `XA_UPLOADER_MIN_IMAGE_EDGE` | Min image edge (server-side validation, px) | `1600` |
| `XA_UPLOADER_ALLOWED_IMAGE_ROOTS` | Comma-separated additional allowed image root paths | base dir only |
| `XA_UPLOADER_RATE_LIMIT_MAX_KEYS` | Max in-memory rate limit keys | `20000` |
| `XA_TRUST_PROXY_IP_HEADERS` | Set `"1"` to trust Cloudflare IP headers for rate limiting | off |

#### Local dev / filesystem-only vars — `.env.local` only; NOT for `wrangler.toml [vars]`

| Var | Purpose | Default |
|---|---|---|
| `XA_UPLOADER_PRODUCTS_CSV_PATH` | Override products CSV path (absolute or repo-relative). Only meaningful with direct filesystem access. | `apps/xa-uploader/data/products.<storefront>.csv` |
| `XA_UPLOADER_NEXT_DIST_DIR` | Override Next.js `.next` dist output directory (build tooling) | `.next` |

#### NEXT_PUBLIC vars — safe for `wrangler.toml [vars]` (exposed to browser)

| Var | Purpose | Default |
|---|---|---|
| `NEXT_PUBLIC_XA_UPLOADER_MODE` | Client-side mode indicator; set `"vendor"` in vendor deployments | internal mode |
| `NEXT_PUBLIC_XA_UPLOADER_MIN_IMAGE_EDGE` | Min image edge for client-side pre-validation (px string) | `"1600"` |
| `NEXT_PUBLIC_XA_UPLOADER_R2_DESTINATION` | R2 destination path displayed in the submission UI (display text, not the upload enablement toggle) | `"https://<upload-domain>/upload/<one-time-link>"` (UI placeholder — set to the R2 bucket path for your deployment) |
| `NEXT_PUBLIC_XA_UPLOADER_R2_UPLOAD_URL` | R2 upload URL used to submit image packages — **this is the enablement toggle** | `""` (empty = R2 upload feature disabled) |

#### Dev/E2E only — never commit, never set in production

| Var | Purpose | Behaviour |
|---|---|---|
| `XA_UPLOADER_E2E_ADMIN_TOKEN` | Override admin token in non-production for E2E test auth bypass | Only active in `NODE_ENV !== 'production'` |

### Data & Contracts

- `.env.local` holds `NEXTAUTH_SECRET`, `SESSION_SECRET`, `CART_COOKIE_SECRET` — required at build time in production (`next.config.mjs:34-36`); auto-generated randomly in non-production so they need not be set in `.env.local` for local dev. Must appear in `.env.example` as required production secrets.
- `wrangler secret put <VAR> --env preview` sets a secret for the preview environment in Cloudflare; `wrangler secret put <VAR>` sets it for production.
- `[vars]` in `wrangler.toml` are committed, visible in the repo, and appropriate for non-secret configuration.

### Dependency & Impact Map

- Upstream dependencies:
  - Cloudflare Workers runtime (secrets via `wrangler secret put`)
  - GitHub Actions (CI secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`)
  - `.github/workflows/xa.yml` — deploy job passes no env vars beyond CF credentials; secrets must be pre-set in CF dashboard
- Downstream dependents:
  - Operator deploying xa-uploader for the first time
  - Any future onboarding documentation
- Likely blast radius:
  - New files only (`.env.example`) + edits to `wrangler.toml`; no code logic changes

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest (unit), Playwright (E2E)
- Commands: `pnpm --filter @apps/xa-uploader test` (Jest), `pnpm --filter @apps/xa-uploader test:e2e` (Playwright)
- CI integration: `xa.yml` runs Jest on push to main/dev

#### Existing Test Coverage
| Area | Test Type | Coverage Notes |
|---|---|---|
| `uploaderAuth.ts` | Unit | Session token sign/verify covered |
| `catalogContractClient.ts` | Unit | Publish flow covered |
| `.env.example` (new file) | None needed | Documentation, not executable |
| `wrangler.toml` changes | None needed | Config file, not testable |

#### Coverage Gaps
- No test for "missing env var at startup" — acceptable; `requireEnv()` throws at runtime and is relied upon to surface misconfiguration at first request

### Recent Git History (Targeted)

- `apps/xa-uploader/` — `86b65ed9b4` added currency rates API and pipeline integration; `998af9afcf` set up CI and OpenNext config; no `.env.example` has ever been committed

## Questions

### Resolved

- Q: Should `NEXTAUTH_SECRET` / `CART_COOKIE_SECRET` / `SESSION_SECRET` be in `.env.example`?
  - A: Yes — `apps/xa-uploader/next.config.mjs:34-36` calls `requireEnv()` for all three in production non-CI non-vendor builds. They are required secrets. In non-production they are auto-generated randomly via `ensureStrongOrRandom()`, so they are not needed in `.env.local` for local dev, but they must be set via `wrangler secret put` for production deployment. They must appear in `.env.example` with `wrangler secret put` instructions.
  - Evidence: `apps/xa-uploader/next.config.mjs:33-38`

- Q: Should `XA_UPLOADER_PRODUCTS_CSV_PATH` go in `wrangler.toml [vars]`?
  - A: No — it's a filesystem path specific to a local/CI environment, not a CF Worker var. Document in `.env.example` only.
  - Evidence: `catalogStorefront.server.ts:34` — used to override CSV path; only meaningful in a server environment with direct filesystem access

- Q: Should the R2 vars be included in `wrangler.toml [vars]`?
  - A: Yes — they are `NEXT_PUBLIC_*` (safe to commit), deployment-specific, and currently absent from `wrangler.toml`. The correct place is `[vars]` with empty-string defaults (disabled by default).
  - Evidence: `useCatalogConsole.client.ts:68,94` — uses `?? ""` fallback confirming empty string = feature disabled

- Q: Does the CI deploy job need to set any vars?
  - A: No — CI uses `wrangler deploy --env preview` which reads `[env.preview.vars]` from the committed `wrangler.toml`; secrets are set separately via `wrangler secret put` in Cloudflare dashboard.
  - Evidence: `.github/workflows/xa.yml:172` — deploy step has no env vars beyond CF credentials

### Open (Operator Input Required)

- Q: What values should `NEXT_PUBLIC_XA_UPLOADER_R2_DESTINATION` and `NEXT_PUBLIC_XA_UPLOADER_R2_UPLOAD_URL` be set to for the staging deployment?
  - Why operator input is required: R2 bucket name and upload URL are deployment-specific; agent cannot determine the intended R2 bucket from source code.
  - Decision impacted: Whether the image upload feature is enabled in preview environment.
  - Decision owner: Operator (Peter)
  - Default assumption: Leave empty in `wrangler.toml` (feature disabled) until operator provides R2 details. This is safe — the feature degrades gracefully with empty strings.

## Confidence Inputs

- Implementation: 95% — exact file list known, exact content determined from source investigation
- Approach: 90% — single correct approach; wrangler.toml [vars] pattern is well-established
- Impact: 85% — directly enables operator deployment; R2 vars open question is low-risk with empty-string default
- Delivery-Readiness: 92% — low-risk documentation task; one open question has a safe default
- Testability: N/A — documentation deliverable, no tests needed or appropriate

Each score reaches ≥90 once the R2 vars open question is answered; the open question has a safe default (empty string = disabled) so it does not block `Ready-for-planning`.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Developer accidentally commits a real secret to `.env.example` | Low | High | `.env.example` uses placeholder strings (e.g. `your-session-secret-here`); build comment explicitly says not to use real values |
| `wrangler.toml [vars]` set to wrong values causes misconfiguration | Low | Medium | Optional vars have safe defaults; NEXT_PUBLIC vars degrade gracefully (empty = feature off) |
| `NEXTAUTH_SECRET` / `SESSION_SECRET` / `CART_COOKIE_SECRET` cause operator confusion about their origin | Low | Low | Included in `.env.example` under required secrets with a comment explaining they are required by the shared Next.js config at build time and auto-generated randomly in local dev |

## Planning Constraints & Notes

- Must-follow patterns:
  - Secrets go in `wrangler secret put` only — never in committed files
  - Format for `.env.example` values: use descriptive placeholder strings like `your-session-secret-here`, not actual hex values
  - `[vars]` in `wrangler.toml` is for non-secrets only
- Rollout/rollback expectations:
  - Pure documentation; no rollback needed
- Observability expectations:
  - None — documentation change

## Suggested Task Seeds (Non-binding)

1. Create `apps/xa-uploader/.env.example` with all required, optional, and NEXT_PUBLIC vars documented (required vs optional clearly marked; defaults shown; secrets use placeholder values with comments saying to use `wrangler secret put` for CF deployment)
2. Update `apps/xa-uploader/wrangler.toml` — add top-level `[vars]` section with NEXT_PUBLIC defaults; populate `[env.preview.vars]` with same NEXT_PUBLIC vars + optional server tuning vars; add comment block listing required secrets and `wrangler secret put` commands
3. Verify no secrets were introduced into committed files (spot-check / grep)

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - `apps/xa-uploader/.env.example` exists, contains all env vars, uses placeholder values for secrets
  - `wrangler.toml` `[vars]` populated with NEXT_PUBLIC defaults + optional server vars
  - `wrangler.toml` `[env.preview.vars]` populated
  - No real secret values in any committed file
- Post-delivery measurement plan: operator can deploy xa-uploader to a fresh Cloudflare account using `.env.example` and `wrangler.toml` comments as the only guide

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Required secrets inventory | Yes | None | No |
| Optional vars with defaults | Yes | None | No |
| NEXT_PUBLIC vars | Yes | None | No |
| wrangler.toml `[vars]` structure | Yes | None | No |
| `.env.example` content | Yes | None | No |
| Secrets never committed | Yes | None | No |
| R2 vars deployment values | Partial | [Missing domain coverage] Minor: R2 bucket values unknown | No — safe default (empty string) documented |

## Evidence Gap Review

### Gaps Addressed

- All xa-uploader-specific env vars identified via `process.env.*` grep of `apps/xa-uploader/src/` and `apps/xa-uploader/next.config.mjs`; shared-config platform vars (`CMS_SPACE_URL`, `CMS_ACCESS_TOKEN`, `SANITY_API_VERSION`, `EMAIL_PROVIDER`) set to safe defaults in `next.config.mjs:47-50` and not xa-uploader-specific — omitted from `.env.example` intentionally
- Default values confirmed from source (`toPositiveInt(env, default, 1)` pattern throughout)
- `requireEnv()` callers confirmed — 5 secrets enforced at build time by `next.config.mjs` (`NEXTAUTH_SECRET`, `SESSION_SECRET`, `CART_COOKIE_SECRET`, `XA_UPLOADER_SESSION_SECRET`, `XA_UPLOADER_ADMIN_TOKEN`); 2 additional required at sync-time (`XA_CATALOG_CONTRACT_BASE_URL`, `XA_CATALOG_CONTRACT_WRITE_TOKEN`); total 7 required secrets for production
- Catalog contract "unconfigured" path confirmed from `catalogContractClient.ts`
- CI deploy flow confirmed from `xa.yml` (no env injection — must pre-set in CF)

### Confidence Adjustments

- Delivery-Readiness raised to 92% from initial 80%: full var inventory removes uncertainty; only R2 deployment values remain open with a safe default

### Remaining Assumptions

- `NEXTAUTH_SECRET`, `SESSION_SECRET`, `CART_COOKIE_SECRET` are required in production but auto-generated randomly in non-production — `.env.example` documents them as required secrets for CF deployment, notes they are auto-generated locally
- `NEXT_PUBLIC_XA_UPLOADER_R2_DESTINATION` defaults to a UI placeholder string in code; documenting empty string in `.env.example` is the correct approach (operator sets the real value when enabling R2 upload)
- R2 upload feature can remain disabled (empty vars) in staging until operator configures R2

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none (R2 open question has safe default)
- Recommended next step: `/lp-do-plan xa-uploader-deployment-config --auto`
