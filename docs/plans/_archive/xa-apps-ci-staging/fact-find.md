---
Type: fact-find
Outcome: planning
Status: Ready-for-planning
Domain: BOS
Workstream: XA
Created: 2026-02-26
Last-updated: 2026-02-26
Feature-Slug: xa-apps-ci-staging
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: []
Related-Plan: none
Trigger-Source: IDEA-DISPATCH-20260226-0022
Trigger-Why: "Three xa- apps (xa-b storefront, xa-drop-worker catalog Worker, xa-uploader operator console) have zero CI workflows and no staging deployment. Operator requires staging on Cloudflare for user testing."
Trigger-Intended-Outcome: "All three apps pass CI (lint, typecheck, tests) and are deployed to Cloudflare staging environments accessible for user testing."
---

## Scope

### Summary

Wire `apps/xa-b`, `apps/xa-drop-worker`, and `apps/xa-uploader` into GitHub Actions CI and deploy to Cloudflare staging. The three apps form a dependency triangle: **xa-uploader** publishes catalogs → **xa-drop-worker** stores and serves them → **xa-b** (the storefront) fetches catalog at build time. Deployment order must respect this sequence. The goal is a live staging environment that user testers can access on Cloudflare.

### Goals

1. CI pipeline (lint + typecheck + test) passes for all three apps on every push.
2. `xa-drop-worker` deployed to a CF Worker staging environment.
3. `xa-b` built with catalog sync from staging drop-worker, deployed to CF Pages staging (the existing `preview` environment in its `wrangler.toml`).
4. `xa-uploader` deployed to Cloudflare via `@opennextjs/cloudflare` (operator confirmed xa-uploader must be on CF staging).
5. Post-deploy health checks confirm xa-drop-worker (`GET /health` → 200) and xa-b are reachable. Note: xa-b returns 302/403 for unauthenticated requests — health check must be adapted accordingly (check for expected redirect/auth response, not 200).

### Non-Goals

- Production deployment (this is staging/preview only).
- xa-b internationalization or SEO work.
- Changes to app functionality — CI and deploy config only.
- Brikette or other apps — changes scoped to xa- apps and shared CI only.

### Constraints & Assumptions

- Next.js 16, webpack mode throughout (Turbopack explicitly disabled in all three apps).
- **CF adapter for xa-b is unresolved (T0):** `next build --webpack` outputs to `.next/`, not `.vercel/output/static`. No `@cloudflare/next-on-pages` or `@opennextjs/cloudflare` is installed in xa-b's package.json or anywhere in the monorepo. The plan must resolve which adapter to add and update `build-xa.mjs` accordingly before any deploy task can proceed. xa-b's `next.config.mjs` already overrides `output: 'export'` correctly (inherited static export blocked) — but the CF adapter build step is missing entirely.
- xa-drop-worker must be deployed before xa-b builds in CI (build-time catalog dependency).
- CF Access stealth mode remains enabled for xa-b staging (testers get CF Access invites).
- Fallback catalog (`src/data/catalog.json`) is available if the staging drop-worker has no catalog yet — build will not fail hard.
- GitHub Actions secrets for CF API tokens and app-specific tokens need to be provisioned (operator action required — documented in T9 prerequisites).
- The existing `preview` environment in `apps/xa-b/wrangler.toml` is used as the staging target — no new CF Pages environment to create.

---

## Outcome Contract

- **Why:** User testing of the xa-b storefront requires a live staging environment. No CI or deploy pipeline exists today for any of the three xa- apps.
- **What success looks like:** A PR or push to a designated branch triggers CI for all three apps; all pass; xa-drop-worker and xa-b are deployed to Cloudflare staging; a user tester with CF Access can load the storefront and browse products.
- **Source:** operator-stated

---

## Evidence Audit (Current State)

### Entry Points

| App | Build entry | Deploy target | CI trigger |
|---|---|---|---|
| `apps/xa-b` | `node ./scripts/build-xa.mjs` → `next build --webpack` → **CF adapter step TBD (T0)** | CF Pages `xa-b-preview` project (wrangler.toml `[env.preview]`) | None today |
| `apps/xa-drop-worker` | `wrangler build` | CF Worker `xa-drop-worker` | None today |
| `apps/xa-uploader` | `pnpm exec next build --webpack` | None (no wrangler.toml) | None today |

Reference CI entry: `.github/workflows/brikette.yml` calls `.github/workflows/reusable-app.yml` (733 lines). New `xa.yml` workflow modelled on the same pattern but purpose-built for these three apps.

### Key Modules / Files

| File | Role |
|---|---|
| `apps/xa-b/wrangler.toml` | CF Pages deploy config. `pages_build_output_dir = ".vercel/output/static"`. Environments: default, `preview`, `backup`. Stealth + CF Access enforced in all envs. |
| `apps/xa-b/scripts/build-xa.mjs` | Pre-build: fetches live catalog from drop-worker via `XA_CATALOG_CONTRACT_READ_URL`, writes `catalog.runtime.json`. Falls back to `catalog.json` on failure. Resolves `NEXT_PUBLIC_XA_SW_VERSION` from CI env. Runs `next build --webpack`. |
| `apps/xa-b/next.config.mjs` | Extends shared config. Overrides `output` to block static-export inheritance. Adds image remote patterns (`imagedelivery.net`, Unsplash, `NEXT_PUBLIC_XA_IMAGES_BASE_URL`). |
| `apps/xa-b/middleware.ts` | Three-layer stealth gate: host allowlist → invite-code cookie → CF Access JWT (RS256). Builds CSP from i18n-keyed strings. Default: all three gates enabled in production. |
| `apps/xa-drop-worker/wrangler.toml` | CF Worker config. R2 binding `SUBMISSIONS_BUCKET` → `xa-submissions` (prod) / `xa-submissions-preview` (preview). Upload token and catalog tokens are secrets. No staging/preview env defined yet. |
| `apps/xa-drop-worker/src/index.ts` | Worker handler: `PUT /upload`, `PUT /catalog/:storefront`, `GET /catalog/:storefront`, `GET /health`. |
| `apps/xa-uploader/package.json` | Scripts: `build` uses `--webpack`. No wrangler.toml. Richer test surface: `test:api`, `test:local`, `test:e2e` (Playwright). |
| `apps/xa-uploader/next.config.mjs` | CI skips production secret validation (`!process.env.CI`). Overrides `output` same as xa-b. Supports `XA_UPLOADER_NEXT_DIST_DIR` override. |
| `.github/workflows/brikette.yml` | Reference CI workflow (~199 lines). Calls reusable-app.yml for validate/test/build/deploy jobs. |
| `.github/workflows/reusable-app.yml` | Reusable workflow (~734 lines). Jobs: validate, test, test-sharded, build, deploy. Contains heavy brikette-specific logic (Firebase, guide validation, Cypress). **Not a candidate for reuse as-is** for xa apps — new workflow preferred. |

### Data & Contracts

**xa-b ← xa-drop-worker (build-time)**
- `GET /catalog/xa-b` → `{ catalog: {...} }` JSON
- Env vars on xa-b build side: `XA_CATALOG_CONTRACT_READ_URL` or `XA_CATALOG_CONTRACT_BASE_URL` + `XA_CATALOG_CONTRACT_READ_TOKEN` (optional)
- If `XA_CATALOG_CONTRACT_READ_REQUIRED=1`, build hard-fails on fetch error; otherwise falls back to `catalog.json`
- Runtime catalog path: `apps/xa-b/src/data/catalog.runtime.json`

**xa-uploader → xa-drop-worker (catalog publish)**
- `PUT /catalog/xa-b` → writes `catalog/xa-b/latest.json` + versioned snapshot to R2
- Auth: `CATALOG_WRITE_TOKEN` (secret)

**xa-drop-worker secrets (all stored as Wrangler secrets, not in wrangler.toml)**
- `UPLOAD_TOKEN_SECRET` — HMAC-SHA256 key for signed upload tokens
- `CATALOG_WRITE_TOKEN` — auth for catalog publish
- `CATALOG_READ_TOKEN` — auth for catalog read (if token-gated)

**xa-b stealth secrets (set in CF Pages dashboard per environment)**
- `XA_ALLOWED_HOSTS` — allowlisted hostnames
- `XA_CF_ACCESS_AUDIENCE` — CF Access JWT audience tag
- `XA_CF_ACCESS_ISSUER` / `XA_CF_ACCESS_ISSUERS` — CF Access issuer URL
- These are intentionally NOT in `wrangler.toml` — must be set manually in CF Pages dashboard.

### Dependency & Impact Map

```
GitHub push
    │
    ▼
xa.yml (new workflow)
    │
    ├─► xa-drop-worker: lint → typecheck → test → wrangler deploy --env staging
    │       │
    │       ▼ (xa-drop-worker staging URL available)
    ├─► xa-b: lint → typecheck → test → build (CF adapter step TBD T0) → wrangler pages deploy --project-name xa-b-preview
    │
    └─► xa-uploader: lint → typecheck → test → build (OpenNext) → wrangler pages deploy --project-name xa-uploader-preview
```

**Blast radius:** xa- apps only. No shared packages modified. No impact on brikette, reception, business-os, or prime.

**Integration boundaries:**
- Cloudflare API (wrangler deploy needs `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`)
- CF R2 bucket `xa-submissions-preview` must exist in the CF account before worker deploy
- CF Access must be configured for the staging CF Pages project (for user testers to authenticate)

### Test Landscape

| App | Test type | File(s) | Status |
|---|---|---|---|
| `xa-b` | Jest (governed) | `apps/xa-b` (jest.config.cjs present) | Exists; not yet run in CI |
| `xa-drop-worker` | Jest (governed) | `apps/xa-drop-worker/__tests__/xaDropWorker.test.ts` | Single file; not yet run in CI |
| `xa-uploader` | Jest (governed) | `apps/xa-uploader` (jest.config.cjs present) | Exists; not yet run in CI |
| `xa-uploader` | Playwright e2e | `apps/xa-uploader/e2e/catalog-console.spec.ts` | Exists; not appropriate for CI staging (requires live services) |

**Coverage gaps:** Unknown — tests have never run in CI. First-pass CI should run existing tests; coverage gaps to be addressed iteratively after CI is green.

**Testability constraints:** xa-drop-worker uses the standard `@acme/config/jest.preset.cjs` (not a CF Worker-specific environment). Tests mock R2 bindings directly (`{} as unknown as R2Bucket`) and polyfill WebCrypto via `node:crypto` in `beforeAll` — no miniflare or `@cloudflare/vitest-pool-workers` required. Playwright e2e skipped in initial CI (requires live xa-drop-worker endpoint).

### Recent Git History (Targeted)

No targeted investigation of xa- app git history conducted. Not investigated: no git blame or log commands run on xa- directories. These apps appear to have been developed outside of CI — no recent changes relevant to the deploy pipeline were flagged in the git status snapshot.

---

## External Research

Not required. CF Pages and CF Worker deploy patterns are well-established in this repo (brikette workflow), and wrangler.toml configuration is documented in the app files. No external documentation consulted.

---

## Questions

### Resolved

**Q: Which xa-b CF Pages environment should be used as staging?**
Use the existing `preview` environment (`xa-b-preview` in wrangler.toml). This is the natural staging slot — already defined with stealth mode and CF Access enabled. Adding a fourth `staging` environment would create unnecessary complexity.
*Confidence: high. wrangler.toml confirms `[env.preview]` with appropriate vars.*

**Q: Should `XA_CATALOG_CONTRACT_READ_REQUIRED` be set to `1` in CI?**
No. Set it to `0` (or omit it) for the initial staging pipeline. The fallback to `catalog.json` is a safe build path and avoids a hard CI dependency on the drop-worker staging deployment being active before the xa-b build step. Once the pipeline is proven stable, `READ_REQUIRED=1` can be added to enforce the dependency.
*Confidence: high. build-xa.mjs fallback logic is explicit and well-handled.*

**Q: Can `reusable-app.yml` be extended for xa apps?**
No — it has too much brikette/firebase/guide-manifest/Cypress logic that is inapplicable. A new standalone `xa.yml` workflow is the right approach, modelled structurally on the reusable workflow but stripped to what xa apps need: lint, typecheck, test, build, wrangler deploy.
*Confidence: high. Reviewed reusable-app.yml structure; 734 lines, heavily conditional on app-specific logic.*

**Q: Does xa-b need `output: 'export'` to deploy to CF Pages?**
No. xa-b's `next.config.mjs` already overrides the shared config's `output: 'export'` to `undefined` — this is correct (xa-b needs SSR, not static export). However, **xa-b still needs a CF adapter to produce deployable output.** `next build --webpack` alone outputs to `.next/`; CF Pages requires `.vercel/output/static` (via `@cloudflare/next-on-pages`) or a Worker bundle (via `@opennextjs/cloudflare`). Neither adapter is currently installed. The `pages_build_output_dir = ".vercel/output/static"` in wrangler.toml is a config target, not evidence the output is produced. Selecting and adding the adapter is T0.
*Confidence: medium. next.config.mjs confirmed; build adapter gap confirmed by package.json inspection and absence of `.vercel/output/static` directory.*

**Q: Should xa-b's CF Access gating be disabled for the initial staging user test?**
Retain CF Access. This is a stealth product — disabling CF Access even on staging undermines the security model. User testers should be added to the CF Access application as permitted users. This is an operator setup step (adding tester emails in the CF dashboard), not a code change.
*Confidence: high. All three stealth env vars are `"true"` across all wrangler.toml environments. Disabling would require a wrangler.toml change + dashboard change; better to provision testers instead.*

**Q: Does the staging R2 bucket `xa-submissions-preview` need to exist before CI runs?**
Yes. The `xa-submissions-preview` bucket is declared in `xa-drop-worker/wrangler.toml` as `preview_bucket_name`. Wrangler will try to bind it at deploy time. It must exist in the CF account before the worker can be deployed. This is an operator one-time setup step.
*Confidence: high. R2 bucket creation is a CF dashboard/CLI action, not a code action.*

**Q1: Does xa-uploader need to be deployed to Cloudflare for the initial user test?**
Yes. Operator stated: *"xa app and uploaded needs to be made ready, and placed on staging on cloudflare."* "Uploaded" = xa-uploader. Both xa-b and xa-uploader are in scope. T7/T8 are now unconditional. Adding xa-uploader to CF Pages requires: (a) `@opennextjs/cloudflare` as a dependency, (b) a new `wrangler.toml` in `apps/xa-uploader/`. This is ~2 hours of work and can run in parallel with the core CI wiring.
*Evidence: operator original request, 2026-02-26.*

### Open

*(No open questions remaining.)*

---

## Confidence Inputs

| Dimension | Score | Basis |
|---|---|---|
| Implementation | 68 | CI pattern established (brikette reference). xa-b CF adapter selection is unresolved — the build chain is incomplete until T0 determines and installs the correct adapter. All other patterns are clear. |
| Approach | 72 | New xa.yml workflow is the right call. Dependency ordering (drop-worker → xa-b) is clear. xa-uploader OpenNext path confirmed. CF adapter for xa-b must be resolved in T0 before build tasks proceed. |
| Impact | 92 | Directly unblocks user testing. No apps work without this. |
| Delivery-Readiness | 68 | Blocked on: (a) GitHub secrets provisioning (CF API tokens, app tokens), (b) CF dashboard setup (R2 bucket, CF Access for testers, xa-b stealth env vars), (c) T0 CF adapter resolution for xa-b. Operator setup steps + T0 investigation must complete before first staging deploy. |
| Testability | 78 | Existing tests will run in CI once wired. xa-drop-worker uses standard Jest preset with mocked bindings — no CF Worker tooling needed (verified). Coverage gaps unknown but manageable. Playwright e2e deferred. |

**What raises Implementation to ≥90:** Resolve T0 (select and install CF adapter for xa-b; update build-xa.mjs; confirm `.vercel/output/static` is produced). Confirm xa-drop-worker tests pass locally. Confirm `wrangler build` output matches what `wrangler deploy` expects.

**What raises Delivery-Readiness to ≥80:** Operator provisions: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` in GitHub secrets; creates `xa-submissions-preview` R2 bucket; sets stealth env vars in CF Pages dashboard for xa-b-preview; adds tester emails to CF Access.

---

## Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R0 | xa-b build produces `.next/` not `.vercel/output/static` — CF adapter missing, deploy step fails immediately | **High (confirmed)** | **High — blocks xa-b deploy entirely** | T0: select `@cloudflare/next-on-pages` or `@opennextjs/cloudflare`; add to xa-b package.json; add adapter step to `build-xa.mjs`; verify output dir locally before CI wiring |
| R1 | xa-drop-worker deploy fails in CI because `xa-submissions-preview` R2 bucket doesn't exist | Medium | High — blocks worker deploy | Operator creates bucket in CF dashboard before CI runs; document in plan tasks |
| R2 | xa-b build fails in CI because drop-worker staging is unreachable during catalog fetch | Low (fallback exists) | Medium — degraded build, using stale catalog | Do NOT set `XA_CATALOG_CONTRACT_READ_REQUIRED=1` in initial CI; use fallback |
| R3 | xa-b stealth middleware blocks all staging requests because CF Access env vars not set | High if not pre-configured | High — staging inaccessible | Operator must set `XA_ALLOWED_HOSTS`, `XA_CF_ACCESS_AUDIENCE`, `XA_CF_ACCESS_ISSUER` in CF Pages dashboard for xa-b-preview before testing; document as prerequisite |
| R4 | xa-drop-worker Jest tests fail in CI due to environment differences | Low | Medium — CI fails on test step | Standard Jest preset confirmed; tests mock R2 bindings + polyfill WebCrypto. Verify with a local run before CI wiring. |
| R5 | wrangler secrets (UPLOAD_TOKEN_SECRET etc.) not provisioned in staging environment | High (none provisioned today) | Medium — worker deploys but upload/catalog endpoints reject requests | Operator runs `wrangler secret put` for each secret against staging env; document in plan tasks |
| R6 | xa-uploader CF Pages deploy fails without OpenNext config | Medium (no wrangler.toml exists yet) | High — xa-uploader staging inaccessible | Add `@opennextjs/cloudflare` + `wrangler.toml` to xa-uploader (T7); ~2 hours; Q1 confirmed yes |
| R7 | GitHub Actions pnpm cache miss on first run causes slow build | Low | Low — first run slow, self-heals | Accept for initial run; cache will populate |

---

## Planning Constraints & Notes

- **Deployment order is a hard constraint:** `xa-drop-worker` deploy → `xa-b` build+deploy. These must be sequential jobs in the workflow, not parallel.
- **xa-uploader is independent:** It can be built/tested in parallel with drop-worker. T6 (OpenNext config + wrangler.toml) is unconditional — xa-uploader deploys to CF staging as confirmed by operator.
- **Do not touch `reusable-app.yml`** — xa apps get their own `xa.yml` workflow. Zero risk of breaking brikette CI.
- **wrangler.toml staging env for drop-worker:** Need to add `[env.staging]` or use the default env for staging. Recommendation: use a dedicated `[env.preview]` block for staging to mirror xa-b's nomenclature. The `--env preview` flag maps to `xa-drop-worker-preview` or similar.
- **CF Pages vs CF Workers deploy commands differ:**
  - xa-b (Pages): `wrangler pages deploy <adapter-output-dir> --project-name xa-b-preview` — output dir and project name depend on T0 adapter choice; `[env.preview]` sets `name = "xa-b-preview"` (distinct CF Pages project, not a branch of `xa-b-site`)
  - xa-drop-worker (Worker): `wrangler deploy --env preview`
  - xa-uploader (Pages via OpenNext): `wrangler pages deploy <adapter-output-dir> --project-name <xa-uploader-preview>` — project name TBD when wrangler.toml is added (T7)
- **Wrangler secrets for staging:** Worker secrets must be put per-environment: `wrangler secret put UPLOAD_TOKEN_SECRET --env preview`
- **No SOPS needed:** xa apps don't use the SOPS-encrypted secrets pattern from brikette. Plain GitHub Actions secrets passed as env vars.

---

## Suggested Task Seeds

| # | Task | Scope | Prerequisite |
|---|---|---|---|
| T0 | **Determine and install CF adapter for xa-b:** evaluate `@cloudflare/next-on-pages` vs `@opennextjs/cloudflare`; add to `apps/xa-b/package.json`; add adapter step to `build-xa.mjs` after `next build --webpack`; run local build and verify `<adapter-output-dir>` is produced | ~2h investigation + code change | None — **blocks T5** |
| T1 | Add `[env.preview]` staging block to `apps/xa-drop-worker/wrangler.toml` | 15-line wrangler.toml edit | None |
| T2 | Create `.github/workflows/xa.yml` — validate job (lint + typecheck for all three apps) | New file ~80 lines | None |
| T3 | Add test job to `xa.yml` — governed Jest runner for all three apps | Extends T2 | T2 |
| T4 | Add xa-drop-worker build + deploy job to `xa.yml` (`wrangler deploy --env preview`) | ~30 lines | T1, T3 |
| T5 | Add xa-b build + deploy job to `xa.yml` (build-xa.mjs + adapter → `wrangler pages deploy <output-dir> --project-name xa-b-preview`); health check: verify 302/403 response (CF Access gate expected, not 200) | ~40 lines | T0, T4 |
| T6 | Add xa-uploader build + OpenNext config (`@opennextjs/cloudflare` + `wrangler.toml`) | New wrangler.toml + dep update | None |
| T7 | Add xa-uploader deploy job to `xa.yml` (`wrangler pages deploy --project-name <xa-uploader-preview>`) | ~30 lines | T3, T6 |
| T8 | Confirm xa-drop-worker tests pass locally — run `pnpm --filter @apps/xa-drop-worker test` before wiring CI (standard Jest preset; mocked bindings verified) | ~5 min validation | None |
| T9 | Document operator pre-requisite steps: R2 bucket `xa-submissions-preview`, CF Access for xa-b-preview testers, wrangler secrets (per-env), GitHub Actions secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`), **seed initial catalog to xa-b staging via xa-uploader dev before user testing begins** | Operator-facing checklist | None — deliver early |

**Execution order:** T0 + T1 + T2 + T8 + T9 can start in parallel. T3 follows T2. T4 follows T1+T3. T5 follows T0+T4. T6 is independent (parallel with T1/T2). T7 follows T3+T6.

---

## Execution Routing Packet

```yaml
Primary-Execution-Skill: lp-do-build
Deliverable-Type: code-change
Feature-Slug: xa-apps-ci-staging
Status: Ready-for-planning
Open-Questions-Blocking: 0
Critical-Investigation-Required: T0 (CF adapter for xa-b — must be resolved before deploy tasks proceed)
```

---

## Evidence Gap Review

### Gaps Addressed

- All three app configs read directly (wrangler.toml, package.json, next.config.mjs, build scripts).
- Reference CI patterns reviewed (brikette.yml + reusable-app.yml structure and content).
- Build-time catalog dependency chain fully traced (build-xa.mjs → XA_CATALOG_CONTRACT_READ_URL → drop-worker).
- Test landscape surveyed (test scripts, test file locations confirmed in all three apps).
- xa-drop-worker Jest environment verified: standard preset with mocked bindings — no CF Worker tooling needed.
- Middleware security model understood (three-layer stealth gate; CF Access required).
- Deploy command patterns partially confirmed (Pages vs Worker differ; xa-b deploy command pending T0).
- Q1 resolved from operator statement — xa-uploader on CF staging is required.

### Confidence Adjustments

- Implementation reduced to 68: CF adapter for xa-b is missing and unresolved — build chain is incomplete. T0 must be resolved before deploy tasks are valid.
- Approach reduced to 72: xa-b deploy command corrected (xa-b-preview project, not xa-b-site+branch); T7/T8 now unconditional (Q1 resolved).
- Delivery-Readiness remains at 68: blocked on operator prerequisites (secrets, CF dashboard) and T0 adapter resolution.
- Testability raised to 78: xa-drop-worker jest.config.cjs verified as standard preset with mocked bindings — no CF Worker tooling needed.

### Remaining Assumptions

- `wrangler build` for xa-drop-worker produces output that `wrangler deploy` in CI can consume directly (standard wrangler behavior, assumed true).
- The `xa-b-preview` CF Pages project exists in the Cloudflare account (referenced in wrangler.toml `[env.preview]`; not verified — `wrangler pages list` would confirm).
- The `xa-submissions-preview` R2 bucket does not yet exist — operator must create it (risk R1).
- **Unresolved:** which CF adapter (`@cloudflare/next-on-pages` or `@opennextjs/cloudflare`) is correct for xa-b, and what the resulting output directory will be — this is T0.

---

## Planning Readiness

**Status: Ready-for-planning**

No open questions remaining. The CF adapter gap (T0) is a known investigation task that the plan must sequence first — it does not block planning, but the plan must mark deploy tasks (T5, T7) as blocked on T0. All code-track evidence floors are met: entry points identified, key modules listed, test landscape characterised. Risk table updated with R0 (CF adapter, high likelihood + high impact).
