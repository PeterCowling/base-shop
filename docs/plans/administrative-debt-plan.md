---
Type: Plan
Status: Active
Domain: Infrastructure
Last-reviewed: 2026-01-19
Created: 2026-01-19
Created-by: Claude (Opus 4.5)
Last-updated: 2026-01-19
Last-updated-by: Claude (Opus 4.5)
---

# Plan: Administrative & Infrastructure Debt

This plan tracks infrastructure, configuration, and administrative items that are prerequisites for production deployment but don't involve application code changes.

## Summary

Infrastructure debt items that need attention before production-ready deployment:
- GitHub secrets configuration
- Cloudflare resource provisioning
- SOPS/CI integration
- Security audit remediation
- Documentation gaps

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

- **Status**: ☐
- **Priority**: P0
- **Estimated effort**: Small (administrative)
- **Scope**:
  - Verify/create Vercel account with Turbo Remote Cache enabled
  - Generate `TURBO_TOKEN` from Vercel dashboard
  - Set `TURBO_TEAM` organization variable in GitHub
  - Add both to GitHub repository secrets/variables
  - Verify cache hits in CI runs
- **Dependencies**: None
- **Verification**:
  ```bash
  # After CI run, check for cache hits in logs:
  # "Remote caching enabled" and "cache hit" messages
  ```
- **Definition of done**:
  - CI builds show remote cache hits
  - Build times reduced for incremental changes

### ADMIN-02: Provision Cloudflare Resources

- **Status**: ☐
- **Priority**: P0
- **Estimated effort**: Medium (administrative)
- **Scope**:
  - Create D1 database for `product-pipeline` app
  - Create R2 bucket for `product-pipeline` app
  - Create KV namespaces for `cochlearfit-worker` (preview + production)
  - Create KV namespace for `LOGIN_RATE_LIMIT_KV` (preview + production)
  - Update all `wrangler.toml` files with real resource IDs

  **Files to update**:
  | File | Resources |
  |------|-----------|
  | `apps/product-pipeline/wrangler.toml` | D1 database_id, R2 bucket |
  | `apps/product-pipeline-queue-worker/wrangler.toml` | D1 database_id, R2 bucket |
  | `apps/cochlearfit-worker/wrangler.toml` | KV namespace IDs (preview/prod) |
  | `wrangler.toml` (root) | KV namespace IDs for rate limiting |

- **Dependencies**: Cloudflare account access
- **Verification**:
  ```bash
  # Verify wrangler can connect to resources
  pnpm wrangler d1 list
  pnpm wrangler r2 bucket list
  pnpm wrangler kv:namespace list
  ```
- **Definition of done**:
  - All placeholder IDs (`00000000...`) replaced with real resource IDs
  - `wrangler dev` works for affected apps

### ADMIN-03: Configure Cloudflare API Secrets

- **Status**: ☐
- **Priority**: P0
- **Estimated effort**: Small (administrative)
- **Scope**:
  - Generate `CLOUDFLARE_API_TOKEN` with appropriate permissions:
    - Cloudflare Pages: Edit
    - D1: Edit
    - R2: Edit
    - Workers KV: Edit
  - Add `CLOUDFLARE_ACCOUNT_ID` to GitHub secrets
  - Add `CLOUDFLARE_API_TOKEN` to GitHub secrets
  - Verify deployment workflow can authenticate
- **Dependencies**: ADMIN-02
- **Verification**:
  ```bash
  # Test token locally
  CLOUDFLARE_API_TOKEN=xxx wrangler whoami
  ```
- **Definition of done**:
  - CI deployment step authenticates successfully
  - No "authentication failed" errors in workflow logs

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

- **Status**: ☐
- **Priority**: P1
- **Estimated effort**: Medium
- **Scope**:
  - Add TruffleHog or Gitleaks to CI pipeline
  - Run on all PRs and pushes to main
  - Create allowlist for known false positives (test fixtures, etc.)

  **Workflow example** (TruffleHog):
  ```yaml
  - name: Secret scanning
    uses: trufflesecurity/trufflehog@main
    with:
      path: ./
      base: ${{ github.event.repository.default_branch }}
      extra_args: --only-verified
  ```
- **Dependencies**: None
- **Definition of done**:
  - PR checks include secret scanning
  - Known test secrets are allowlisted
  - Real secrets trigger PR failure

### ADMIN-07: Deploy Firebase Security Rules Fix (Security P0)

- **Status**: ☐
- **Priority**: P0 (SECURITY CRITICAL)
- **Estimated effort**: Small (administrative)
- **Scope**:

  **Context**: On 2026-01-21, two critical Firebase security vulnerabilities were fixed in code:
  - **Critical #2**: Root-level rules had `auth != null || now < 1819007200000` allowing unauthenticated access until 2027
  - **Critical #3**: Role checks used hardcoded array indices (`roles/0`, `roles/1`, `roles/2`) that could be bypassed

  The fix changes role storage from array (`['owner', 'staff']`) to map (`{ owner: true, staff: true }`).

  **Files created**:
  - `apps/prime/database.rules.json` — New secure Firebase rules
  - `apps/prime/scripts/migrate-user-roles.ts` — Data migration script

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
     - Copy contents of `apps/prime/database.rules.json`
     - Paste and publish

- **Dependencies**: Firebase Console access, service account key
- **Reference**: [docs/security-audit-2026-01.md](../security-audit-2026-01.md) Critical #2 and #3
- **Definition of done**:
  - All existing user profiles migrated to new role format
  - New rules deployed to Firebase Console
  - Unauthenticated requests to Firebase are rejected
  - Users with appropriate roles can still access their data

### ADMIN-08: Rotate Exposed Secrets (Security P0)

- **Status**: ☐
- **Priority**: P0 (SECURITY CRITICAL)
- **Estimated effort**: Medium
- **Scope**:
  - Identify all secrets that may have been committed to git history:
    - `SESSION_SECRET`
    - `NEXTAUTH_SECRET`
    - Firebase credentials (if any)
    - Any API keys in `.env` files
  - Rotate all identified secrets in their respective services
  - Update encrypted SOPS files with new values
  - Consider running `git filter-repo` to remove sensitive files from history
  - Update `.gitignore` to prevent future `.env` commits
- **Dependencies**: None
- **Reference**: [docs/security-audit-2026-01.md](../security-audit-2026-01.md) P0 items
- **Definition of done**:
  - All potentially exposed secrets have been rotated
  - New secrets are only in encrypted SOPS files
  - `.gitignore` updated to prevent `.env` commits

### ADMIN-09: Deploy Product-Pipeline API Key Authentication (Security P1)

- **Status**: ☐
- **Priority**: P1 (SECURITY)
- **Estimated effort**: Small (administrative)
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

- **Dependencies**: Cloudflare account access
- **Reference**: [docs/security-audit-2026-01.md](../security-audit-2026-01.md) High #12
- **Definition of done**:
  - `PIPELINE_API_KEY` secret set in staging and production
  - `PIPELINE_ENV` set to non-dev value in staging and production
  - Unauthenticated requests return 401
  - Authenticated requests with valid key succeed
  - All internal services/scripts updated to include API key

### ADMIN-10: Create CMS Cloudflare Pages Project

- **Status**: ☐
- **Priority**: P2
- **Estimated effort**: Small (administrative)
- **Scope**:
  - Create Cloudflare Pages project for CMS app
  - Configure build settings:
    - Build command: `pnpm build`
    - Build output: `.next`
    - Root directory: `apps/cms`
  - Configure preview branch deployments
  - Configure production branch (main)
  - Add custom domain if applicable
- **Dependencies**: ADMIN-03 (Cloudflare API access)
- **Reference**: [docs/ci-and-deploy-roadmap.md](../ci-and-deploy-roadmap.md) Phase 3.3
- **Definition of done**:
  - CMS deploys to Cloudflare Pages via CI
  - Preview URLs generated for PRs
  - Production URL accessible

### ADMIN-11: Add Dependency Audit to CI

- **Status**: ☐
- **Priority**: P2
- **Estimated effort**: Small
- **Scope**:
  - Add `pnpm audit --production` to CI pipeline
  - Configure to fail on high/critical vulnerabilities
  - Run weekly on schedule + on PRs that modify package.json

  **Workflow addition**:
  ```yaml
  - name: Security audit
    run: pnpm audit --production --audit-level=high
  ```
- **Dependencies**: None
- **Definition of done**:
  - CI fails if high/critical vulnerabilities exist
  - Weekly audit runs and creates issues for new vulnerabilities

### ADMIN-12: Document GitHub Environment Requirements

- **Status**: ☐
- **Priority**: P2
- **Estimated effort**: Small
- **Scope**:
  - Create `docs/github-setup.md` documenting:
    - Required repository secrets
    - Required repository variables
    - Environment configuration (production approval gates)
    - Branch protection rules
  - Include checklist for new repository setup
- **Dependencies**: All ADMIN-01 through ADMIN-03 complete
- **Definition of done**:
  - New developer can follow doc to set up fork/clone
  - All secrets and variables documented with descriptions

---

## Implementation Priority Path

### Phase 1: Critical Infrastructure (Immediate)

| Task | Type | Blocker For |
|------|------|-------------|
| ADMIN-07 | Security | Firebase access (DEPLOY ASAP) |
| ADMIN-08 | Security | All production deploys |
| ADMIN-01 | Performance | Nothing (but improves DX) |
| ADMIN-02 | Infrastructure | ADMIN-03 |
| ADMIN-03 | Infrastructure | CI deployments |

### Phase 2: CI Integration (Short-term)

| Task | Type | Blocker For |
|------|------|-------------|
| ADMIN-04 | CI | Encrypted secrets in prod |
| ADMIN-05 | CI | Safe deployments |
| ADMIN-06 | Security | PR safety |
| ADMIN-09 | Security | Product-pipeline production |

### Phase 3: Polish (Medium-term)

| Task | Type | Blocker For |
|------|------|-------------|
| ADMIN-10 | Infrastructure | CMS production |
| ADMIN-11 | Security | Ongoing safety |
| ADMIN-12 | Documentation | Onboarding |

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
- [ ] PRs are scanned for secrets
- [ ] No exposed secrets remain in git history
- [ ] `docs/github-setup.md` exists and is complete

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
