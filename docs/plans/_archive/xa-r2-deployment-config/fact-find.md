---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Infra
Workstream: Engineering
Created: 2026-03-04
Last-updated: 2026-03-04
Feature-Slug: xa-r2-deployment-config
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/xa-r2-deployment-config/plan.md
Trigger-Why: The R2 image upload feature is code-complete but cannot be used until the R2 bucket is created, public access enabled, and the actual public URL configured. This is the deployment blocker for the entire image upload capability.
Trigger-Intended-Outcome: type: operational | statement: R2 bucket created, public access enabled, actual public URL set in CI build env and xa-b wrangler.toml. Both xa-uploader and xa-b deployed with working image upload and display. | source: operator
Dispatch-ID: IDEA-DISPATCH-20260304001500-0232
---

# XA R2 Deployment Config — Fact-Find Brief

## Scope

### Summary

The R2 image upload feature (xa-uploader-r2-image-upload) is code-complete and archived. All code changes — API route, upload UI, R2 binding utility, tests — are committed. However, the feature cannot function until the Cloudflare R2 bucket is created, public access is enabled, and the actual public URL replaces the placeholder in xa-b's config. This fact-find covers the deployment configuration steps needed to activate the feature.

### Goals

- Create R2 buckets (`xa-media` for production, `xa-media-preview` for preview)
- Enable public access on the production bucket
- Update the placeholder URL in `apps/xa-b/wrangler.toml` with the actual R2 public URL
- Deploy both xa-uploader and xa-b
- Verify end-to-end image upload and display

### Non-goals

- Code changes to the upload route or UI (already committed and tested)
- Image transformation/CDN layer (out of scope)
- R2 lifecycle policies or object cleanup (separate dispatch 0230)

### Constraints & Assumptions

- **HARD CONSTRAINT — Cloudflare free tier ONLY:** R2 free tier provides 10GB storage, 1M Class A writes/month, 10M Class B reads/month, zero egress. No paid plans.
- **HARD CONSTRAINT — Operator dashboard access required:** Enabling R2 public access requires Cloudflare dashboard access (cannot be done via wrangler CLI alone).
- **HARD CONSTRAINT — xa-b env var must be set in CI build environment, NOT wrangler.toml:** xa-b is a static export (`output: "export"` in `next.config.mjs`). `NEXT_PUBLIC_XA_IMAGES_BASE_URL` is read by Next.js at `pnpm build` time, not at Worker runtime. The `[vars]` block in `apps/xa-b/wrangler.toml` is irrelevant for Pages static builds — there is no Worker runtime for xa-b. The env var must be set in the CI build step (`.github/workflows/xa.yml` line 127-128) or as a GitHub Actions variable/secret.
- **CONSTRAINT — CI only deploys xa-uploader to preview:** `.github/workflows/xa.yml` runs `wrangler deploy --env preview` (staging), not production. Production xa-uploader deployment requires either a separate workflow trigger or manual `wrangler deploy` without `--env preview`.
- Assumption: `wrangler` CLI is available (confirmed: `wrangler@^4.59.1` in root `package.json`).
- Assumption: CI/CD pipeline deploys xa-b to Pages and xa-uploader to staging (confirmed: `.github/workflows/xa.yml`). Production xa-uploader deploy is manual.
- Assumption: The Cloudflare API token in GitHub secrets has R2 admin permissions (or can be updated to include them).

## Outcome Contract

- **Why:** The R2 image upload feature is code-complete but cannot be used until the R2 bucket is created, public access enabled, and the actual public URL configured. This is the deployment blocker for the entire image upload capability — no product images can be uploaded or served until this is done.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** R2 bucket created, public access enabled, actual public URL configured in CI build environment (GitHub Actions variable) and xa-b wrangler.toml. Both xa-uploader and xa-b deployed with working image upload and display.
- **Source:** operator

## Access Declarations

- **Cloudflare dashboard**: Required for R2 public access toggle and obtaining the public URL. Access type: web UI login. Status: operator-held credential, not agent-accessible.
- **wrangler CLI**: Required for bucket creation. Uses `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` — confirmed in CI secrets (`.github/workflows/xa.yml`).

## Evidence Audit (Current State)

### Entry Points

- `apps/xa-uploader/wrangler.toml` — R2 bucket binding declaration (`XA_MEDIA_BUCKET` → `xa-media`)
- `apps/xa-b/wrangler.toml` — placeholder public URL (`NEXT_PUBLIC_XA_IMAGES_BASE_URL = "https://pub-xa-media.r2.dev"`)
- `.github/workflows/xa.yml` — CI/CD deploy pipeline for both apps

### Key Modules / Files

1. `apps/xa-uploader/wrangler.toml` — R2 binding: `[[r2_buckets]]` with `binding = "XA_MEDIA_BUCKET"`, `bucket_name = "xa-media"`. Preview env: `bucket_name = "xa-media-preview"`. Inline comments document the creation commands.
2. `apps/xa-b/wrangler.toml` — `NEXT_PUBLIC_XA_IMAGES_BASE_URL = "https://pub-xa-media.r2.dev"` — placeholder value. **However, this wrangler.toml value is NOT consumed at build time.** xa-b is a static export (Pages, not a Worker). The env var must be set in the CI build environment (`.github/workflows/xa.yml` build step `env:` block or as a GitHub Actions variable) for Next.js to bake it into the client bundle at build time.
3. `apps/xa-uploader/src/lib/r2Media.ts` — `getMediaBucket()` retrieves R2 binding via `getCloudflareContext({ async: true })`. Returns `null` if binding is unavailable (graceful degradation to 503 in route).
4. `apps/xa-uploader/src/app/api/catalog/images/route.ts` — POST route using `getMediaBucket()`. Returns 503 `r2_unavailable` if bucket is null. All other validation (auth, type, size, dimensions) is self-contained.
5. `.github/workflows/xa.yml` — deploys xa-uploader with `wrangler deploy --env preview` (staging only, not production), deploys xa-b with `wrangler pages deploy out/`. xa-b build step (line 125-128) sets `XA_CATALOG_CONTRACT_READ_URL` in env but does NOT set `NEXT_PUBLIC_XA_IMAGES_BASE_URL` — this must be added for images to resolve. Uses `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` from GitHub secrets.
6. `docs/plans/_archive/xa-uploader-r2-image-upload/post-build-analysis.md` — detailed deployment checklist (Section 5) and free tier analysis.
7. `docs/runbooks/xa-catalog-contract-staging-checklist.md` — existing XA runbook pattern for staged deployment verification.

### Patterns & Conventions Observed

- **Wrangler deploy pattern**: CI runs `pnpm exec wrangler deploy --env preview` for Workers and `pnpm exec wrangler pages deploy out/` for Pages. Auth via GitHub secrets.
- **R2 bucket creation**: Documented in wrangler.toml inline comments — `wrangler r2 bucket create xa-media`. Not automated in CI.
- **Public access enablement**: Dashboard-only operation (Cloudflare R2 → bucket → Settings → Public access → Enable). Cannot be done via wrangler CLI.
- **NEXT_PUBLIC env vars**: Baked into client bundles at build time by Next.js. xa-b is a static export (Pages) — wrangler.toml `[vars]` are NOT consumed at build time (there is no Worker runtime). The env var must be set in the CI build step's `env:` block or as a GitHub Actions variable. Changing it requires a rebuild of xa-b, not just a redeploy.
- **CI deploy scope**: xa-uploader is deployed to staging only (`--env preview`). Production xa-uploader deploy is currently manual or requires a separate CI trigger.

### Dependency & Impact Map

- **Upstream dependencies:**
  - Cloudflare account with R2 enabled (free tier)
  - wrangler CLI with appropriate API token permissions
  - Cloudflare dashboard access for public access toggle
- **Downstream dependents:**
  - xa-uploader image upload route: will return 503 until bucket exists
  - xa-b image display: will show broken images until public URL is correct
  - All future XA product publishing: blocked until images can be uploaded and served
- **Blast radius:**
  - Code changes: `.github/workflows/xa.yml` (add env var to xa-b build step), `apps/xa-b/wrangler.toml` (update placeholder URL for documentation)
  - Infrastructure: two R2 buckets created, public access on one
  - GitHub Actions: add `NEXT_PUBLIC_XA_IMAGES_BASE_URL` as a repository variable
  - Deployments: both xa-uploader and xa-b need redeployment

### Test Landscape

Not investigated: all code is already committed and tested (9 route tests pass in CI). This fact-find is about deployment config, not code changes. The only "test" is end-to-end verification after deployment.

### Recent Git History (Targeted)

- `2c164f6f37` (2026-03-03): TASK-01 — R2 binding + image upload API route committed
- `1437506405` (2026-03-03): TASK-02 + TASK-03 — Upload UI + xa-b URL config committed
- `626d4c53c0` (2026-03-03): Plan archived with all tasks complete

## Questions

### Resolved

- Q: Is wrangler CLI available in the project?
  - A: Yes — `wrangler@^4.59.1` in root `package.json`. Used by CI deploy pipeline.
  - Evidence: `package.json`, `.github/workflows/xa.yml`

- Q: Does CI already deploy both apps?
  - A: Yes — `xa.yml` deploys xa-uploader (`wrangler deploy --env preview`) and xa-b (`wrangler pages deploy`).
  - Evidence: `.github/workflows/xa.yml`

- Q: Can public access be enabled via CLI?
  - A: No. R2 public access is a dashboard-only toggle (Cloudflare R2 → bucket → Settings → Public access). The wrangler CLI cannot enable it.
  - Evidence: Cloudflare R2 documentation; no `wrangler r2 bucket public-access` command exists.

- Q: What format does the R2 public URL take?
  - A: When public access is enabled, Cloudflare provides a URL like `https://pub-{hash}.r2.dev` or a custom domain can be configured. The exact URL is shown in the dashboard after enabling.
  - Evidence: Cloudflare R2 docs; existing placeholder uses this convention.

- Q: Will the image upload route work before the bucket exists?
  - A: It will return 503 `r2_unavailable` gracefully. `getMediaBucket()` returns `null` when the binding is unavailable, and the route checks for this at line 87-93 of `route.ts`.
  - Evidence: `apps/xa-uploader/src/app/api/catalog/images/route.ts:87-93`, `apps/xa-uploader/src/lib/r2Media.ts`

### Open (Operator Input Required)

- Q: Does the Cloudflare API token in GitHub secrets have R2 admin permissions?
  - Why operator input is required: Token permissions are not visible in the repository — they're configured in the Cloudflare dashboard.
  - Decision impacted: Whether `wrangler r2 bucket create` will succeed from CI or needs to be run locally with operator credentials.
  - Default assumption: Assume token has R2 permissions (it was configured for Workers deploy which requires similar account-level access). Low risk — if it fails, the operator can add permissions or run the command locally.

## Confidence Inputs

- **Implementation:** 90% — Code changes are small: update wrangler.toml placeholder, add env var to `.github/workflows/xa.yml` build step, set GitHub Actions variable. Infrastructure ops (bucket creation, public access toggle) are well-documented. What raises to 95: confirming API token R2 permissions.
- **Approach:** 95% — Steps are well-documented and follow standard Cloudflare R2 setup. The dashboard requirement for public access is the only non-automatable step.
- **Impact:** 95% — This directly unblocks the entire XA image upload and product publishing pipeline.
- **Delivery-Readiness:** 85% — Depends on operator having Cloudflare dashboard access and API token permissions. What raises to 90: confirming API token R2 permissions. What raises to 95: confirming dashboard access.
- **Testability:** 90% — End-to-end verification is straightforward: upload an image, check R2, check public URL, check xa-b.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| API token lacks R2 permissions | Low | Medium — bucket creation fails | Operator adds R2 admin permission to token, or runs locally |
| R2 public URL format differs from placeholder | Very Low | Low — just update the string | Dashboard shows the actual URL; update and redeploy |
| xa-b build step missing NEXT_PUBLIC env var | Medium | High — images resolve to empty string, all broken | Add `NEXT_PUBLIC_XA_IMAGES_BASE_URL` to `.github/workflows/xa.yml` build step env block; set as GitHub Actions variable |
| CI only deploys xa-uploader to staging (preview) | Low | Medium — production not activated | Run `wrangler deploy` without `--env preview` for production after staging verification |

## Scope Signal

- **Signal:** right-sized
- **Rationale:** The scope is tightly bounded: two CLI commands, one dashboard toggle, CI workflow env var wiring, wrangler.toml placeholder update, staged+production deployments, one verification. No architectural decisions, minimal code complexity. Key uncertainty is operator's Cloudflare token permissions and dashboard access — both low-risk and easily resolved.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| R2 bucket creation via wrangler CLI | Yes | None | No |
| R2 public access (dashboard) | Yes | None — dashboard requirement documented | No |
| Public URL discovery and config update | Yes | None | No |
| xa-uploader deployment | Yes | None — CI pipeline confirmed | No |
| xa-b deployment with env var rebuild | Yes | None — NEXT_PUBLIC bake-at-build documented | No |
| End-to-end verification | Yes | None | No |
| API token permissions | Partial | [System boundary coverage] [Minor]: Token permissions not verifiable from repo | No |

## Planning Constraints & Notes

- **Must-follow patterns:**
  - R2 public access is dashboard-only — cannot be automated in CI
  - `NEXT_PUBLIC_XA_IMAGES_BASE_URL` is baked at build time — xa-b must be rebuilt after URL change
  - Use existing CI pipeline for deployment (`xa.yml`)
- **Rollout/rollback expectations:**
  - Fully additive — creating R2 buckets has no downside. If something breaks, the upload route already handles missing bucket gracefully (503).
  - Rollback: not needed. Worst case: revert the URL change in wrangler.toml.
- **Observability expectations:**
  - Cloudflare R2 dashboard shows storage usage and request counts
  - Workers analytics shows per-request CPU time for the upload route
  - Upload route returns structured error codes for all failure modes

## Suggested Task Seeds (Non-binding)

1. **IMPLEMENT: Create R2 buckets and enable public access** — `wrangler r2 bucket create xa-media` and `xa-media-preview`, enable public access on production bucket via Cloudflare dashboard, record actual public URL
2. **IMPLEMENT: Configure image URL in CI and wrangler.toml** — add `NEXT_PUBLIC_XA_IMAGES_BASE_URL` to xa-b CI build step env block (`.github/workflows/xa.yml` line 127-128) using actual R2 public URL as a GitHub Actions variable; also update the placeholder in `apps/xa-b/wrangler.toml` for documentation consistency
3. **IMPLEMENT: Deploy and verify end-to-end** — deploy xa-uploader (staging first, then production), rebuild and deploy xa-b with the new env var, upload a test image, verify R2 storage and public URL access, verify xa-b renders the image

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package: R2 buckets exist, public access enabled on production bucket, xa-b wrangler.toml has actual R2 public URL, both apps deployed, end-to-end image upload and display verified
- Post-delivery measurement plan: Check Cloudflare R2 dashboard for bucket existence and storage; check Workers analytics for upload route CPU time; upload test image and verify display in xa-b

## Evidence Gap Review

### Gaps Addressed

- Confirmed wrangler CLI availability and version
- Confirmed CI/CD pipeline deploys both apps with correct commands
- Confirmed R2 binding is declared in wrangler.toml for both prod and preview
- Confirmed upload route handles missing bucket gracefully (503)
- Confirmed NEXT_PUBLIC env var requires rebuild (not just redeploy)

### Confidence Adjustments

- No adjustments — all evidence confirmed as expected from prior build context

### Remaining Assumptions

- Cloudflare API token has R2 admin permissions (very high confidence — same account used for Workers deploy)
- R2 public access is available on free tier (confirmed by Cloudflare documentation)
- Public URL format will be discoverable from the dashboard after enabling (standard Cloudflare behavior)

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan xa-r2-deployment-config --auto`
