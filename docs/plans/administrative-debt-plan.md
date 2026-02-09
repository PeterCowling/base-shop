---
Type: Plan
Status: Active
Domain: Infrastructure
Last-reviewed: 2026-02-09
Relates-to charter: none
Created: 2026-01-19
Created-by: Claude (Opus 4.5)
Last-updated: 2026-02-09
Last-updated-by: Claude (Opus 4.6)
---

# Plan: Administrative & Infrastructure Debt

This plan tracks infrastructure, configuration, and administrative items that are prerequisites for production deployment but don't involve application code changes.


## Summary

**12 tasks total: 8 complete, 4 remaining.**

Remaining infrastructure debt:
- **P0 Security (manual):** Firebase rules deployment (ADMIN-07), secret rotation (ADMIN-08)
- **P1 Infrastructure:** Cloudflare resource provisioning (ADMIN-02), product-pipeline API key (ADMIN-09)

## Relationship to Launch Readiness

**Reference**: [docs/repo-quality-audit-2026-01.md](../repo-quality-audit-2026-01.md)

These items primarily affect:
- **Environment and secrets** (currently 3.0/5) — potential +1.0 with full secrets integration
- **CI/CD and deployment** (currently 4.0/5) — potential +0.5 with deploy gates
- **Security and tenancy isolation** (currently 3.5/5) — potential +0.5 with P0 security fixes

**Estimated impact**: +2.0 points toward 85+ world-class score.

---

## Active Tasks

### ADMIN-01: Configure Turbo Remote Cache

- **Status**: ✅ **COMPLETE**
- **Priority**: P0
- **Estimated effort**: Small (administrative)
- **Completed**: Pre-existing (discovered during 2026-02-09 fact-check)
- **Implementation**:
  - `TURBO_TOKEN` (secret) and `TURBO_TEAM` (variable) are already configured in GitHub
  - Referenced in 35+ locations across CI workflows (`ci.yml`, `reusable-app.yml`, `cms.yml`, `test.yml`)
  - Pattern: `turbo-token: ${{ secrets.TURBO_TOKEN }}` / `turbo-team: ${{ vars.TURBO_TEAM }}`
- **Definition of done**:
  - ✅ CI builds use remote cache
  - ✅ Build times reduced for incremental changes

### ADMIN-02: Provision Cloudflare Resources

- **Status**: ☐ (partially complete)
- **Priority**: P1 (downgraded from P0 — ADMIN-03 is already done; active apps already deploying)
- **Estimated effort**: Medium (administrative)

#### Re-plan Update (2026-02-09)
- **Priority change:** P0 → P1. ADMIN-03 (Cloudflare secrets) is already complete, so this is no longer a blocker for CI deployments. Active apps (XA, Business OS, Brikette) already deploy successfully.
- **Scope narrowed:** cochlearfit-worker and product-pipeline-queue-worker are dormant (no CI workflow, no recent commits). Defer their provisioning until they're actively needed.
- **Partially complete:** Root `wrangler.toml` `CART_KV` already has real IDs. Only `LOGIN_RATE_LIMIT_KV` still has placeholders.

- **Scope (active resources only)**:
  - Create D1 database `product-pipeline` (shared by pipeline + queue-worker)
  - Create R2 bucket `product-pipeline-evidence`
  - Create KV namespace `LOGIN_RATE_LIMIT_KV` (preview + production)
  - Update `wrangler.toml` files with real resource IDs

  **Files to update (active)**:
  | File | Resources | Status |
  |------|-----------|--------|
  | `apps/product-pipeline/wrangler.toml` | D1 database_id, R2 bucket | Placeholder |
  | `wrangler.toml` (root) | `LOGIN_RATE_LIMIT_KV` IDs | Placeholder |

  **Deferred (dormant apps — provision when needed)**:
  | File | Resources | Reason |
  |------|-----------|--------|
  | `apps/product-pipeline-queue-worker/wrangler.toml` | D1, R2 (same IDs as pipeline) | No CI workflow, no package.json, dormant |
  | `apps/cochlearfit-worker/wrangler.toml` | KV namespace IDs | No CI workflow, dormant since Dec 2025 |

- **Dependencies**: Cloudflare account access
- **Verification**:
  ```bash
  pnpm wrangler d1 list
  pnpm wrangler r2 bucket list
  pnpm wrangler kv:namespace list
  ```
- **Definition of done**:
  - Active placeholder IDs replaced with real resource IDs
  - `wrangler dev` works for product-pipeline
  - Login rate limiting KV operational

### ADMIN-03: Configure Cloudflare API Secrets

- **Status**: ✅ **COMPLETE**
- **Priority**: P0
- **Estimated effort**: Small (administrative)
- **Completed**: Pre-existing (discovered during 2026-02-09 re-plan)
- **Implementation**:
  - `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are already configured as GitHub secrets
  - Referenced in `ci.yml`, `cms.yml`, `reusable-app.yml`, `business-os-export.yml`, `xa.yml`
  - Multiple apps actively deploying: XA (`wrangler deploy`), Business OS (`wrangler deploy`), Brikette (Pages), product-pipeline (Pages)
- **Definition of done**:
  - ✅ CI deployment step authenticates successfully
  - ✅ Multiple apps deploying via Cloudflare in CI

### ADMIN-04: Wire SOPS Decryption into CI

- **Status**: ✅ **COMPLETE**
- **Priority**: P1
- **Estimated effort**: Medium
- **Completed**: 2026-01-19
- **Implementation**:
  - Created reusable GitHub Action at `.github/actions/decrypt-secrets/action.yml`
    - Installs SOPS automatically if needed
    - Supports per-app or all-apps decryption
    - Gracefully skips if `SOPS_AGE_KEY` is not configured
  - Added decrypt step to `ci.yml` (release job, before build)
  - Added decrypt step to `reusable-app.yml` (deploy job, before deploy)
  - Added decrypt step to `cms.yml` (deploy job, before deploy)
  - Fixed `.gitignore` to ensure `.env.production` files are ignored (removed erroneous exception)
- **Remaining manual step**: Add `SOPS_AGE_KEY` to GitHub repository secrets
- **Verification**:
  ```bash
  # Locally test decryption
  SOPS_AGE_KEY=$(cat ~/.config/sops/age/keys.txt) sops -d apps/cms/.env.preview.sops
  ```
- **Definition of done**:
  - ✅ CI can decrypt `.sops` files before build (action created and wired)
  - ✅ Decrypted files are not committed to git (.gitignore fixed)
  - ⏳ Deploy succeeds with real environment variables (requires SOPS_AGE_KEY secret)

### ADMIN-05: Add Deploy Environment Validation Gate

- **Status**: ✅ **COMPLETE**
- **Priority**: P1
- **Estimated effort**: Small
- **Completed**: 2026-01-19
- **Implementation**:
  - Added validation step to `ci.yml` (release job, after decrypt, before build)
  - Added validation step to `reusable-app.yml` (deploy job, after decrypt, before deploy)
  - Added validation step to `cms.yml` (deploy job, after decrypt, before deploy)
  - Uses existing `scripts/validate-deploy-env.sh` which:
    - Validates required env vars (AUTH, DEPLOY, PAYMENTS, etc.)
    - Rejects `TODO_`, `CHANGEME`, and other placeholder patterns
    - Is non-leaky (never prints secret values)
    - Conditionally checks based on enabled providers
- **Dependencies**: ADMIN-04 (needs decrypted env file to validate) ✅
- **Definition of done**:
  - ✅ Deployments fail if env file contains `TODO_` placeholders
  - ✅ Clear error message indicates which variables need attention

### ADMIN-06: Implement CI Secret Scanning

- **Status**: ✅ **COMPLETE**
- **Priority**: P1
- **Estimated effort**: Medium
- **Completed**: 2026-02-09

#### Build Completion (2026-02-09)
- **Commits:** `8f842a5af3`
- **Implementation:**
  - Added `secret-scanning` job to `ci.yml` (runs on all PRs and pushes — catches secrets before merge)
  - Added `secret-scanning` job to `test.yml` (runs nightly at 3am UTC + pushes to main — catches secrets in history)
  - Uses `trufflesecurity/trufflehog@v3.93.1` with `--only-verified` (reduces false positives) and `--fail` (blocks PRs)
  - Full history scan via `fetch-depth: 0`
  - No allowlist needed yet — `--only-verified` only flags confirmed-real secrets
- **Definition of done**:
  - ✅ PR checks include secret scanning (`ci.yml`)
  - ✅ Real secrets trigger PR failure (`--fail` flag)
  - ✅ Nightly scanning covers git history (`test.yml`)

### ADMIN-07: Deploy Firebase Security Rules Fix (Security P0)

- **Status**: ☐
- **Priority**: P0 (SECURITY CRITICAL)
- **Estimated effort**: Medium (upgraded from Small — scope expanded)

#### Re-plan Update (2026-02-09)
- **Effort change:** Small → Medium. Investigation revealed significant scope gaps.
- **Critical finding #1:** `firebase.json` in repo root points to `apps/reception/database.rules.json` (the OLD vulnerable rules), not to `apps/prime/database.rules.json`. The secure rules are orphaned.
- **Critical finding #2:** `apps/reception/database.rules.json` contains 39 occurrences of the vulnerable `child('0')`, `child('1')` pattern (Critical #3). Reception is using the same Firebase project and its rules file is the one actually configured for deployment.
- **Critical finding #3:** No `.firebaserc` file exists — no Firebase project ID is configured for CLI deployment.
- **Open question:** Do prime and reception share the same Firebase Realtime Database? If yes, one rules file must cover both. If no, each needs separate deployment config.

- **Scope**:

  **Context**: On 2026-01-21, two critical Firebase security vulnerabilities were fixed in code:
  - **Critical #2**: Root-level rules had `auth != null || now < 1819007200000` allowing unauthenticated access until 2027
  - **Critical #3**: Role checks used hardcoded array indices (`roles/0`, `roles/1`, `roles/2`) that could be bypassed

  The fix changes role storage from array (`['owner', 'staff']`) to map (`{ owner: true, staff: true }`).

  **Files created**:
  - `apps/prime/database.rules.json` — New secure Firebase rules (39 secure role checks)
  - `apps/prime/scripts/migrate-user-roles.ts` — Data migration script

  **Pre-deployment investigation required**:
  1. **Determine Firebase project structure** — are prime and reception sharing one database?
  2. **Reconcile rules files** — `apps/reception/database.rules.json` (222 lines, vulnerable) vs `apps/prime/database.rules.json` (232 lines, secure). If shared database, merge into one authoritative file.
  3. **Create `.firebaserc`** with correct project ID(s)
  4. **Update `firebase.json`** to reference the secure rules file

  **Deployment steps**:
  1. **Run data migration first** (before deploying rules, or existing users lose access):
     ```bash
     cd apps/prime
     FIREBASE_SERVICE_ACCOUNT_KEY=/path/to/service-account.json npx tsx scripts/migrate-user-roles.ts --dry-run
     # Review output carefully, then run without --dry-run to apply
     FIREBASE_SERVICE_ACCOUNT_KEY=/path/to/service-account.json npx tsx scripts/migrate-user-roles.ts
     ```
  2. **Deploy new rules** to Firebase Console:
     - Go to Firebase Console → Realtime Database → Rules
     - Copy contents of the reconciled secure rules file
     - Paste and publish

- **Dependencies**: Firebase Console access, service account key, **clarity on prime/reception Firebase project topology**
- **Reference**: [docs/security-audit-2026-01.md](../security-audit-2026-01.md) Critical #2 and #3
- **Definition of done**:
  - All existing user profiles migrated to new role format
  - New rules deployed to Firebase Console
  - Unauthenticated requests to Firebase are rejected
  - Users with appropriate roles can still access their data
  - `firebase.json` points to secure rules file
  - Reception's vulnerable rules file updated or removed

### ADMIN-08: Rotate Exposed Secrets (Security P0)

- **Status**: ☐ (partially complete)
- **Priority**: P0 (SECURITY CRITICAL)
- **Estimated effort**: Medium

#### Re-plan Update (2026-02-09)
- **Partially complete:** `.gitignore` already fixed (`.env*` pattern covers all env files). No unencrypted `.env` files currently tracked in git. SOPS infrastructure operational with one encrypted file (`apps/cms/.env.preview.sops`).
- **Confirmed exposure:** Commit `6639161ca1` (2025-08-28) added `apps/cms/.env.local` with `NEXTAUTH_SECRET="Zybn8rg2S47UnbB3zsyG+pIigj671YVeS86egWcxQGE="`, `SESSION_SECRET`, `CART_COOKIE_SECRET`. Removed in commit `65cef5fc8a` (2025-09-04) but **still accessible via `git show`**. No `git filter-repo` has been run.
- **Good news:** Codebase is clean of hardcoded production secrets. Secret registry at `packages/platform-core/src/secrets/registry.ts` provides excellent rotation infrastructure (25+ secrets, validation rules, rotation policies).

- **Scope**:
  - ~~Update `.gitignore` to prevent future `.env` commits~~ ✅ Already done
  - **Verify and rotate** the specific exposed secrets:
    - `NEXTAUTH_SECRET` — **confirmed exposed** in git history (commit `6639161ca1`)
    - `SESSION_SECRET` — confirmed exposed (same commit, value: `change-me-session-secret`)
    - `CART_COOKIE_SECRET` — confirmed exposed (same commit)
  - Check if production deployment still uses the exposed `NEXTAUTH_SECRET` value — if so, rotate immediately
  - Run `git filter-repo` to scrub `apps/cms/.env.local` from history
  - Update encrypted SOPS files with new rotated values
  - Create `.env.production.sops` files for apps needing production secrets (currently only `apps/cms/.env.preview.sops` exists)
- **Dependencies**: None
- **Reference**: [docs/security-audit-2026-01.md](../security-audit-2026-01.md) P0 items
- **Definition of done**:
  - ✅ `.gitignore` updated to prevent `.env` commits
  - All exposed secrets verified rotated in production
  - `git filter-repo` executed to scrub history (requires force-push coordination)
  - New secrets stored in encrypted SOPS files

### ADMIN-09: Deploy Product-Pipeline API Key Authentication (Security P1)

- **Status**: ☐
- **Priority**: P1 (SECURITY)
- **Estimated effort**: Small (administrative)

#### Re-plan Update (2026-02-09)
- **Still valid.** Code is complete and verified (auth.ts, api-context.ts, db.ts all confirmed during fact-check). Product-pipeline has a CI workflow (`.github/workflows/product-pipeline.yml`) deploying to Cloudflare Pages.
- **Dependency updated:** No longer blocked by ADMIN-03 (Cloudflare secrets already configured). Still practically blocked by ADMIN-02 (D1/R2 placeholder IDs mean the app can't fully function even with auth).
- **Note:** Product-pipeline deploys as static export to Pages (`OUTPUT_EXPORT=1`), but `wrangler.toml` defines D1/R2/Queue bindings for the Worker runtime. The API key auth is in the Worker code path. Need to verify which deployment mode is active for the API endpoints.

- **Scope**:

  **Context**: On 2026-01-21, API key authentication was added to all product-pipeline endpoints (High #12 fix). The code is complete but requires deployment configuration.

  **Files changed**:
  - `apps/product-pipeline/src/lib/auth.ts` — API key validation module
  - `apps/product-pipeline/src/lib/api-context.ts` — Auth middleware in `withPipelineContext`
  - `apps/product-pipeline/src/routes/api/_lib/db.ts` — Environment type updates
  - `apps/product-pipeline/wrangler.toml` — Documentation for API key config

  **Deployment steps**:
  1. **Generate a secure API key**:
     ```bash
     openssl rand -base64 32
     ```
  2. **Set the API key as a Cloudflare secret** (for each environment):
     ```bash
     # For production
     wrangler secret put PIPELINE_API_KEY --env production

     # For staging (if applicable)
     wrangler secret put PIPELINE_API_KEY --env staging
     ```
  3. **Set `PIPELINE_ENV` appropriately**:
     - In `wrangler.toml` or Cloudflare dashboard, set:
       - Staging: `PIPELINE_ENV=staging`
       - Production: `PIPELINE_ENV=production`
     - Dev mode (`PIPELINE_ENV=dev`) allows unauthenticated requests
  4. **Update all clients** that call product-pipeline APIs to include the key:
     ```
     Authorization: Bearer <your-api-key>
     # or
     X-API-Key: <your-api-key>
     ```
  5. **Document the API key** in your secrets manager (1Password, etc.)

- **Dependencies**: ADMIN-02 (D1/R2 resources needed for product-pipeline to function)
- **Reference**: [docs/security-audit-2026-01.md](../security-audit-2026-01.md) High #12
- **Definition of done**:
  - `PIPELINE_API_KEY` secret set in staging and production
  - `PIPELINE_ENV` set to non-dev value in staging and production
  - Unauthenticated requests return 401
  - Authenticated requests with valid key succeed
  - All internal services/scripts updated to include API key

### ADMIN-10: Deploy CMS to Cloudflare Workers (via OpenNext)

- **Status**: ✅ **COMPLETE**
- **Priority**: P2
- **Estimated effort**: Medium (upgraded from Small — requires code changes + config)
- **Completed**: 2026-02-09

#### Re-plan Update (2026-02-09)
- **Task rewritten.** Original scope (Cloudflare Pages with `.next` output) is invalid. CMS has 100+ dynamic API routes, NextAuth, session management, and explicitly disables static export (`next.config.mjs` line 149). Plain Pages cannot host it.
- **Correct approach:** Cloudflare Workers with `@opennextjs/cloudflare`, matching the pattern used by Business OS, Brikette (production), and XA.
- **CI bug found:** `.github/workflows/cms.yml` line 171 uses `next-on-pages deploy` — the `@cloudflare/next-on-pages` package was removed from the repo on 2026-02-06 (commit `13c046ebbb`, archived/deprecated). This deploy command would fail if triggered.
- **This is no longer purely administrative** — requires adding dependencies and config files.

#### Build Completion (2026-02-09)
- **Commits:** `c86b266304`
- **Implementation:**
  - Added `@opennextjs/cloudflare` (`^1.16.3`) to `apps/cms/package.json` devDependencies
  - Added `build:worker` script to `apps/cms/package.json`
  - Created `apps/cms/open-next.config.ts` (matching business-os/XA pattern)
  - Created `apps/cms/wrangler.toml` (Workers config with `main` + `[assets]`)
  - Fixed `apps/cms/src/app/api/sanity/verify/route.ts`: changed `runtime = "edge"` → `runtime = "nodejs"` (OpenNext doesn't support edge runtime)
  - Updated `.github/workflows/cms.yml` deploy step: replaced broken `next-on-pages deploy` with `opennextjs-cloudflare build` + `wrangler deploy`
  - `.gitignore` already had `**/.open-next/` — no change needed
- **Validation:**
  - `pnpm typecheck` — PASS
  - `pnpm lint` — PASS
- **Definition of done**:
  - ✅ CMS configured for Cloudflare Workers via OpenNext
  - ✅ CI deploy step uses correct commands
  - ⏳ End-to-end deploy verification (requires Cloudflare project setup)

### ADMIN-11: Add Dependency Audit to CI

- **Status**: ✅ **COMPLETE** (core requirement met)
- **Priority**: P2
- **Estimated effort**: Small
- **Completed**: Pre-existing (discovered during 2026-02-09 fact-check)
- **Implementation**:
  - `pnpm audit --audit-level=high` already runs in `ci.yml` (lines 56-60)
  - Ignores known false positive: `--ignore GHSA-p6mc-m468-83gw`
  - Fails CI on high/critical vulnerabilities
- **Remaining**: Weekly scheduled run not yet configured (only runs on PR/push)
- **Definition of done**:
  - ✅ CI fails if high/critical vulnerabilities exist
  - ⏳ Weekly audit runs and creates issues for new vulnerabilities

### ADMIN-12: Document GitHub Environment Requirements

- **Status**: ✅ **COMPLETE**
- **Priority**: P2
- **Estimated effort**: Small
- **Completed**: 2026-02-09

#### Build Completion (2026-02-09)
- **Commits:** `6f7ac68a71`
- **Validation:**
  - `pnpm typecheck` — PASS (51 tasks)
  - `pnpm lint` — PASS (68 tasks)
- **Implementation:**
  - Created `docs/github-setup.md` covering:
    - All repository secrets (20+ secrets, grouped by purpose)
    - All repository variables (6 variables with defaults)
    - All GitHub environments (production, staging, staging-pages, xa-staging)
    - App deployment summary table (9 apps with URLs, methods, Cloudflare targets)
    - CODEOWNERS and branch protection rules
    - New-repository setup checklist
  - Cross-references `secrets.md` and `.env.reference.md` (no duplication)
- **Definition of done**:
  - ✅ New developer can follow doc to set up fork/clone
  - ✅ All secrets and variables documented with descriptions

---

## Implementation Priority Path

### Completed Tasks

| Task | Status |
|------|--------|
| ADMIN-01 | ✅ Turbo remote cache already configured |
| ADMIN-03 | ✅ Cloudflare API secrets already in GitHub |
| ADMIN-04 | ✅ SOPS decryption wired into CI |
| ADMIN-05 | ✅ Deploy env validation gate added |
| ADMIN-11 | ✅ Dependency audit already in CI |
| ADMIN-06 | ✅ TruffleHog secret scanning in CI + nightly |
| ADMIN-12 | ✅ GitHub setup docs created (`docs/github-setup.md`) |

### Phase 1: Security Critical (Immediate — requires your manual action)

| Task | Type | Notes |
|------|------|-------|
| ADMIN-07 | Security P0 | Firebase rules deployment — scope expanded: reception rules also vulnerable, no `.firebaserc` exists |
| ADMIN-08 | Security P0 | Secret rotation — `NEXTAUTH_SECRET` confirmed exposed in git history (commit `6639161ca1`) |

### Phase 2: Infrastructure (Short-term)

| Task | Type | Notes |
|------|------|-------|
| ADMIN-02 | Infrastructure P1 | Provision D1, R2, KV — scope narrowed to active apps only |
| ~~ADMIN-06~~ | ~~Security P1~~ | ✅ TruffleHog added to CI + nightly |
| ADMIN-09 | Security P1 | Product-pipeline API key — blocked by ADMIN-02 |

### Phase 3: Polish (Medium-term)

| Task | Type | Notes |
|------|------|-------|
| ~~ADMIN-10~~ | ~~Infrastructure P2~~ | ✅ CMS migrated to Cloudflare Workers via OpenNext (`c86b266304`) |

---

## Verification Checklist

After completing all tasks, verify:

- [ ] Firebase rules deployed and reject unauthenticated requests (ADMIN-07)
- [ ] All existing Firebase user profiles migrated to map-based roles (ADMIN-07)
- [ ] Product-pipeline API key configured in staging/production (ADMIN-09)
- [ ] Product-pipeline unauthenticated requests return 401 (ADMIN-09)
- [ ] `pnpm turbo build` shows remote cache hits in CI
- [ ] `wrangler d1 list` shows real database IDs
- [ ] `wrangler kv:namespace list` shows real namespace IDs
- [ ] CI can deploy to Cloudflare Pages
- [ ] Encrypted secrets are decrypted in CI before build
- [ ] Deployments fail if env contains `TODO_` placeholders
- [x] PRs are scanned for secrets (ADMIN-06, TruffleHog in ci.yml + test.yml)
- [ ] No exposed secrets remain in git history
- [x] `docs/github-setup.md` exists and is complete (ADMIN-12)

---

## Related Documents

- [docs/repo-quality-audit-2026-01.md](../repo-quality-audit-2026-01.md) — Launch readiness audit
- [docs/security-audit-2026-01.md](../security-audit-2026-01.md) — Security audit with P0 items
- [docs/secrets.md](../secrets.md) — SOPS/age encryption documentation
- [docs/ci-and-deploy-roadmap.md](../ci-and-deploy-roadmap.md) — CI/CD roadmap
- [docs/.env.reference.md](../.env.reference.md) — Environment variable reference

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-01-19 | Claude (Opus 4.5) | Initial plan created from infrastructure audit |
| 2026-01-21 | Claude (Opus 4.5) | Added ADMIN-07 (Firebase security rules deployment). Renumbered ADMIN-08 through ADMIN-11. Firebase rules fix (Critical #2 and #3) implemented in code, awaiting deployment. |
| 2026-01-21 | Claude (Opus 4.5) | Added ADMIN-09 (Product-pipeline API key deployment). Renumbered ADMIN-10 through ADMIN-12. Product-pipeline auth fix (High #12) implemented in code, awaiting deployment configuration. |
| 2026-02-09 | Claude (Opus 4.6) | Fact-check audit at `7dad9cc`. Marked ADMIN-01 as COMPLETE (Turbo cache already configured in CI). Marked ADMIN-11 as COMPLETE (pnpm audit already in ci.yml). Added partial-completion note to ADMIN-02 (CART_KV has real IDs). Flagged ADMIN-10 deployment target issue (CMS requires dynamic server, not static Pages). |
| 2026-02-09 | Claude (Opus 4.6) | Re-plan of all 8 remaining tasks. **Marked ADMIN-03 COMPLETE** (Cloudflare secrets already in GitHub, apps deploying). **ADMIN-07 scope expanded** (reception rules also vulnerable, no `.firebaserc`, needs reconciliation). **ADMIN-08 exposure confirmed** (NEXTAUTH_SECRET in commit `6639161ca1`). **ADMIN-02 downgraded P0→P1** and scope narrowed (dormant apps deferred). **ADMIN-10 rewritten** (Workers+OpenNext, not Pages; CI has broken `next-on-pages` command). **ADMIN-09** dependency updated (ADMIN-03 done, still needs ADMIN-02). **ADMIN-12** dependencies now satisfied. Net: 7 open → 5 complete + 7 open. |
| 2026-02-09 | Claude (Opus 4.6) | Completed ADMIN-12 (GitHub setup docs, `6f7ac68a71`), ADMIN-06 (TruffleHog secret scanning, `8f842a5af3`), ADMIN-10 (CMS Workers+OpenNext migration, `c86b266304`). Net: 8 complete, 4 remaining. |
