---
Type: Plan
Status: Active
Domain: BOS
Workstream: XA
Created: 2026-02-26
Last-reviewed: 2026-02-26
Last-updated: 2026-02-26 (Wave 4 complete)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-apps-ci-staging
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 83%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# XA Apps — CI Pipeline + Cloudflare Staging

## Summary

Wire `apps/xa-b` (storefront), `apps/xa-drop-worker` (catalog Worker), and `apps/xa-uploader` (operator console) into GitHub Actions CI and deploy all three to Cloudflare staging for user testing. The key blocker is that xa-b's build chain is incomplete — `next build --webpack` outputs to `.next/`, but deployment to Cloudflare requires `@opennextjs/cloudflare` (Worker-based SSR, same pattern as business-os and caryina production in this monorepo). xa-uploader also needs the same adapter. The plan sequences: adapter investigation first → CI workflow scaffolding in parallel → deploy jobs wired in dependency order → CHECKPOINT before xa-b and xa-uploader deploy tasks.

## Active tasks
- [x] TASK-01: Verify OpenNext compatibility with xa-b (local build smoke test)
- [x] TASK-02: Add [env.preview] staging block to xa-drop-worker/wrangler.toml
- [x] TASK-03: Create xa.yml — validate (lint+typecheck) + test jobs for all three apps
- [x] TASK-04: Add @opennextjs/cloudflare to xa-b; add build:worker script + wrangler.toml
- [x] TASK-05: Add xa-drop-worker build + deploy job to xa.yml
- [x] TASK-06: Add @opennextjs/cloudflare + wrangler.toml to xa-uploader
- [x] TASK-07: CHECKPOINT — Reassess xa-b + xa-uploader deploy after adapter verified
- [x] TASK-08: Add xa-b deploy job to xa.yml
- [x] TASK-09: Add xa-uploader deploy job to xa.yml
- [x] TASK-10: Produce operator prerequisites checklist

## Goals
- All three apps pass CI (lint + typecheck + test) on every push to a designated branch.
- xa-drop-worker deployed to CF Worker staging (`xa-drop-worker` + `--env preview`).
- xa-b deployed as a CF Worker (via `@opennextjs/cloudflare`) to staging (`--env preview`).
- xa-uploader deployed as a CF Worker (via `@opennextjs/cloudflare`) to staging.
- Operator prerequisites documented so CF Access, secrets, and R2 buckets can be provisioned.

## Non-Goals
- Production deployment.
- Changes to app functionality.
- Brikette, reception, or other apps.
- Catalog seeding (operator action, documented in T10 checklist).

## Constraints & Assumptions
- Constraints:
  - xa-drop-worker must deploy before xa-b builds in CI (build-time catalog fetch).
  - `@opennextjs/cloudflare` chosen for both xa-b and xa-uploader: xa-b has CF Access JWT middleware requiring Node.js crypto, and dynamic SSR features (cart, checkout). Business-os and caryina use this Worker deploy pattern in this monorepo (brikette production uses CF Pages static export and is not the reference here).
  - No changes to `reusable-app.yml` — xa apps get standalone `xa.yml`.
  - TASK-04 and TASK-08 are sequenced via CHECKPOINT (TASK-07); if OpenNext fails xa-b, the plan replans from there.
- Assumptions:
  - `@opennextjs/cloudflare` supports Next.js 16.1.6 (business-os and caryina both use Next.js 16.1.6 with `@opennextjs/cloudflare ^1.16.5` in Worker deploy mode — direct compatibility confirmed).
  - CF Pages projects `xa-b-site`/`xa-b-preview` may need to be replaced with CF Worker projects once xa-b switches to Worker deploy model. Operator may need to create new Worker names in CF dashboard.
  - `xa-submissions-preview` R2 bucket does not yet exist — operator creates it.
  - GitHub Actions secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` not yet provisioned for xa- apps — operator adds them.

## Inherited Outcome Contract
- **Why:** User testing of the xa-b storefront requires a live staging environment. No CI or deploy pipeline exists today for any of the three xa- apps.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All three apps pass CI and are deployed to Cloudflare staging; a user tester with CF Access can load the storefront and browse products.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/xa-apps-ci-staging/fact-find.md`
- Key findings used:
  - CF adapter gap: `next build --webpack` → `.next/`; adapter step missing.
  - xa-drop-worker Jest tests: standard `@acme/config/jest.preset.cjs`, mocked R2 bindings — no CF Worker tooling needed.
  - xa-uploader CF deploy required (operator-stated).
  - wrangler.toml `[env.preview]` = `name = "xa-b-preview"` (distinct CF project, not a branch of xa-b-site).
  - xa-b stealth middleware blocks all unauthenticated requests — health check must expect 302/403, not 200.
  - Operator prerequisites: R2 bucket, CF Access, wrangler secrets, GitHub secrets.

## Proposed Approach
- **Option A:** `@cloudflare/next-on-pages` + CF Pages deploy — CLI transform to `.vercel/output/static`, `wrangler pages deploy`. Has known limitations with complex middleware (RS256 JWT operations), lower SSR completeness.
- **Option B:** `@opennextjs/cloudflare` + CF Worker deploy — full SSR, `wrangler deploy`, matches the Worker deploy pattern used by business-os and caryina in this monorepo. Requires wrangler.toml changes from Pages config to Worker config.
- **Chosen approach: Option B** — xa-b has complex CF Access JWT middleware requiring Node.js crypto runtime, dynamic SSR routes (cart/checkout/account), and business-os/caryina in this monorepo already use the same OpenNext Worker deploy pattern as the reference. TASK-01 smoke-tests this assumption before TASK-04 commits to the implementation.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | INVESTIGATE | Verify OpenNext + xa-b local build smoke | 75% | S | Complete (2026-02-26) | — | TASK-04 |
| TASK-02 | IMPLEMENT | xa-drop-worker wrangler.toml staging env | 90% | S | Complete (2026-02-26) | — | TASK-05 |
| TASK-03 | IMPLEMENT | xa.yml validate + test jobs | 85% | M | Complete (2026-02-26) | — | TASK-05, TASK-09 |
| TASK-04 | IMPLEMENT | Add OpenNext to xa-b + build:worker script + wrangler.toml | 85% | M | Complete (2026-02-26) | TASK-01 | TASK-07 |
| TASK-05 | IMPLEMENT | xa-drop-worker deploy job in xa.yml | 85% | S | Complete (2026-02-26) | TASK-02, TASK-03 | TASK-07 |
| TASK-06 | IMPLEMENT | Add OpenNext + wrangler.toml to xa-uploader | 80% | M | Complete (2026-02-26) | — | TASK-09 |
| TASK-07 | CHECKPOINT | Reassess xa-b + xa-uploader deploy after adapter verified | 95% | S | Complete (2026-02-26) | TASK-04, TASK-05 | TASK-08, TASK-09 |
| TASK-08 | IMPLEMENT | xa-b deploy job in xa.yml | 80% | M | Complete (2026-02-26) | TASK-07 | — |
| TASK-09 | IMPLEMENT | xa-uploader deploy job in xa.yml | 80% | S | Complete (2026-02-26) | TASK-03, TASK-06, TASK-07 | — |
| TASK-10 | IMPLEMENT | Operator prerequisites checklist | 95% | S | Complete (2026-02-26) | — | — |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03, TASK-06, TASK-10 | — | All independent; run in parallel |
| 2 | TASK-04 (after TASK-01), TASK-05 (after TASK-02+TASK-03) | Wave 1 | TASK-04 blocked until TASK-01 confirms compatibility |
| 3 | TASK-07 (CHECKPOINT) | TASK-04, TASK-05 | Stop; run /lp-do-replan if assumptions fail; do not start TASK-08 or TASK-09 until CHECKPOINT clears |
| 4 | TASK-08, TASK-09 (parallel) | TASK-07 | Post-checkpoint xa-b deploy and xa-uploader deploy; TASK-09 also requires TASK-06 (Wave 1) complete |

---

## Tasks

### TASK-01: Verify OpenNext + xa-b local build smoke
- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/xa-apps-ci-staging/task-01-openext-compat.md` — build output confirmed, issues noted
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Build evidence:** Deliverable written at `docs/plans/xa-apps-ci-staging/task-01-openext-compat.md`. Outcome: AFFIRMING. All 5 questions answered. Key finding: two-script build pattern required (merged build script causes infinite loop); TASK-04 approach updated accordingly. TASK-04 confidence actualized to 85%.
- **Affects:** `[readonly] apps/xa-b/package.json`, `[readonly] apps/xa-b/scripts/build-xa.mjs`, `[readonly] apps/xa-b/wrangler.toml`
- **Depends on:** —
- **Blocks:** TASK-04
- **Confidence:** 75%
  - Implementation: 75% — investigation task; outcome uncertain until run
  - Approach: 80% — clear verification path (install + build + inspect output)
  - Impact: 90% — gates all xa-b deployment tasks
- **Questions to answer:**
  - Does `@opennextjs/cloudflare` install cleanly with xa-b's Next.js 16.1.6 + webpack mode?
  - Does `next build --webpack` + `pnpm exec opennextjs-cloudflare build` produce `.open-next/worker.js` and `.open-next/assets/`?
  - Does xa-b's middleware (`apps/xa-b/middleware.ts`) compile without errors under OpenNext?
  - What is the correct `wrangler.toml` config for Worker deploy (`main`, `assets`, `compatibility_flags`)?
  - Can the business-os production wrangler.toml / build config (`opennextjs-cloudflare build` + `wrangler deploy`) be directly adapted for xa-b?
- **Acceptance:**
  - [ ] Local `pnpm --filter @apps/xa-b build` completes without error after adding OpenNext.
  - [ ] `.open-next/worker.js` (or equivalent output) confirmed to exist.
  - [ ] No middleware compilation errors in build output.
  - [ ] Correct wrangler.toml Worker config identified (from business-os production as reference: `main = ".open-next/worker.js"`, `assets = { directory = ".open-next/assets" }`, `compatibility_flags = ["nodejs_compat"]`).
  - [ ] Findings written to `docs/plans/xa-apps-ci-staging/task-01-openext-compat.md`.
- **Validation contract:** Artifact at above path exists; build output dir confirmed; middleware compilation clean.
- **Planning validation:** None: S-effort investigation, no pre-run checks needed.
- **Rollout / rollback:** None: no production changes; local investigation only.
- **Documentation impact:** Produces `task-01-openext-compat.md` feeding TASK-04.
- **Notes / references:**
  - Reference: `apps/brikette/` package.json for OpenNext dep version (`^1.16.5`).
  - Reference: `apps/business-os/` `wrangler.toml` + `.github/workflows/business-os-deploy.yml` as the actual Worker deploy reference pattern in this monorepo (`pnpm exec opennextjs-cloudflare build` + `pnpm exec wrangler deploy`). Brikette CI uses CF Pages static export and is not the reference for Worker deploy.
  - If OpenNext fails with xa-b, TASK-04 replans to `@cloudflare/next-on-pages` fallback.

---

### TASK-02: Add [env.preview] staging block to xa-drop-worker/wrangler.toml
- **Type:** IMPLEMENT
- **Deliverable:** `apps/xa-drop-worker/wrangler.toml` — `[env.preview]` block added
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Build evidence:** `[env.preview]` block added with `name = "xa-drop-worker-preview"`, `[[env.preview.r2_buckets]]` with `bucket_name = "xa-submissions-preview"`, `[env.preview.vars]` with all 4 vars. `wrangler deploy --env preview --dry-run` passed: binding `env.SUBMISSIONS_BUCKET (xa-submissions-preview)` confirmed, all vars present.
- **Affects:** `apps/xa-drop-worker/wrangler.toml`
- **Depends on:** —
- **Blocks:** TASK-05
- **Confidence:** 90%
  - Implementation: 90% — simple wrangler.toml edit, well-understood pattern
  - Approach: 95% — mirror xa-b's `[env.preview]` naming convention
  - Impact: 90% — directly enables staging deploy of xa-drop-worker
- **Acceptance:**
  - [ ] `apps/xa-drop-worker/wrangler.toml` has `[env.preview]` block with `name = "xa-drop-worker-preview"`.
  - [ ] `[[env.preview.r2_buckets]]` binding uses `bucket_name = "xa-submissions-preview"` (for `wrangler deploy --env preview`; `preview_bucket_name` in root `[[r2_buckets]]` is for local `wrangler dev` only).
  - [ ] `[env.preview.vars]` carries all required vars (`R2_PREFIX`, `MAX_BYTES`, `CATALOG_PREFIX`, `CATALOG_MAX_BYTES`).
  - [ ] `wrangler deploy --env preview --dry-run` passes locally (no secrets required for dry-run).
- **Validation contract:**
  - TC-01: `wrangler deploy --env preview --dry-run` → exits 0, no parse errors.
  - TC-02: `[env.preview]` section present and syntactically valid → confirmed by `wrangler whoami` or dry-run output.
- **Execution plan:** Add `[env.preview]` block to `apps/xa-drop-worker/wrangler.toml`; run `wrangler deploy --env preview --dry-run` to verify.
- **Planning validation:** None: single-file edit, S-effort.
- **Scouts:** None: wrangler.toml format is well-understood.
- **Edge Cases & Hardening:** Secrets (`UPLOAD_TOKEN_SECRET`, `CATALOG_WRITE_TOKEN`, `CATALOG_READ_TOKEN`) must be provisioned per-env via `wrangler secret put --env preview` by operator (documented in TASK-10). Worker will deploy without secrets but endpoints will reject requests — acceptable for initial CI green run.
- **Rollout / rollback:** Rollout: merge PR. Rollback: revert wrangler.toml change.
- **Documentation impact:** None beyond plan.
- **Notes / references:**
  - xa-b/wrangler.toml `[env.preview]` format as reference.
  - Operator must create `xa-submissions-preview` R2 bucket before first real deploy (documented in TASK-10).

---

### TASK-03: Create xa.yml — validate job (lint + typecheck) + test job
- **Type:** IMPLEMENT
- **Deliverable:** `.github/workflows/xa.yml` — new workflow file with validate and test jobs
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-02-26)
- **Build evidence:** `.github/workflows/xa.yml` created. Triggers: push to main/dev with path filters + workflow_dispatch. Jobs: `validate` (lint+typecheck for all 3 apps, turbo workspace dep build) and `test` (governed Jest for all 3 apps). YAML validated: `python3 yaml.safe_load` pass + `actionlint` pass (0 warnings). TC-02/03/04 confirmed at CI push time.
- **Affects:** `.github/workflows/xa.yml` (new file)
- **Depends on:** —
- **Blocks:** TASK-05, TASK-09
- **Confidence:** 85%
  - Implementation: 85% — brikette.yml provides a direct reference; xa-specific simplifications are clear
  - Approach: 85% — standalone workflow is the right call (not extending reusable-app.yml)
  - Impact: 90% — scaffolds the entire CI structure that all deploy jobs build on
- **Acceptance:**
  - [ ] `.github/workflows/xa.yml` created and parseable by GitHub Actions.
  - [ ] Triggers: `push` to `main`/`dev` on `apps/xa-b/**`, `apps/xa-drop-worker/**`, `apps/xa-uploader/**` path filters; `workflow_dispatch`.
  - [ ] `validate` job: runs `pnpm --filter @apps/xa-b lint`, `pnpm --filter @apps/xa-drop-worker lint`, `pnpm --filter @apps/xa-uploader lint` + `typecheck` for each.
  - [ ] `test` job: runs governed Jest runner for all three apps (`pnpm --filter @apps/xa-b test`, etc.).
  - [ ] pnpm setup + caching mirrors brikette.yml pattern (actions/setup-node, pnpm/action-setup, turbo cache).
  - [ ] No Firebase, guide-manifest, or Cypress logic (stripped vs brikette.yml).
- **Validation contract:**
  - TC-01: `gh workflow run xa.yml` triggers without YAML parse errors → 200 OK from GH API.
  - TC-02: Validate job runs `pnpm lint` for each app filter → exits 0 on clean code.
  - TC-03: Test job runs governed test runner for xa-b → exits 0 (existing tests pass or are skipped).
  - TC-04: Test job runs for xa-drop-worker → `xaDropWorker.test.ts` passes (standard Jest, mocked bindings confirmed).
- **Execution plan:**
  - Red: Write `.github/workflows/xa.yml` with validate + test jobs. Use brikette.yml's pnpm/turbo setup as template. Remove all brikette-specific conditional blocks.
  - Green: Push to dev branch; verify validate job triggers. Run `pnpm --filter @apps/xa-drop-worker test` locally to pre-confirm test pass.
  - Refactor: Add path filter scoping so workflow only triggers on xa- app changes.
- **Planning validation:**
  - Checks run: reviewed brikette.yml trigger pattern, pnpm filter syntax, reusable-app.yml secrets contract.
  - Unexpected findings: reusable-app.yml requires `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` as required secrets — xa.yml will need these too in deploy jobs (added in TASK-05/08/09). Validate+test jobs don't need CF secrets.
- **Consumer tracing:**
  - New file `.github/workflows/xa.yml`: consumed by GitHub Actions runner on push.
  - TASK-05 adds deploy job to this file → dependency on file existing.
  - TASK-08 and TASK-09 also add jobs to this file.
- **Scouts:** None: workflow YAML is deterministic.
- **Edge Cases & Hardening:** pnpm cache key must include `apps/xa-*/pnpm-lock.yaml` or root lockfile. Concurrency group should cancel in-progress runs per branch.
- **Rollout / rollback:** Rollout: merge PR with new workflow file. Rollback: delete xa.yml.
- **Documentation impact:** None.
- **Notes / references:**
  - `pnpm --filter @apps/xa-b test` uses `scripts/tests/run-governed-test.sh` (sourced from jest.config.cjs scripts).
  - xa-uploader has Playwright e2e tests — these are NOT included in this CI run (requires live services).

---

### TASK-04: Add @opennextjs/cloudflare to xa-b; add build:worker script + wrangler.toml
- **Type:** IMPLEMENT
- **Deliverable:** `apps/xa-b/package.json` (dep + `build:worker` script added), `apps/xa-b/open-next.config.ts` (new), `apps/xa-b/wrangler.toml` (Worker config)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-02-26)
- **Scope expansion:** `apps/xa-b/open-next.config.ts` added (required by OpenNext); `apps/xa-b/src/app/api/search/sync/route.ts` — `export const runtime = "edge"` removed (OpenNext does not support edge runtime declarations; consistent with MEMORY.md pattern for CF Worker apps).
- **Build evidence:** `@opennextjs/cloudflare ^1.16.5` devDep added. `build:worker` script added. `pages_build_output_dir` removed; `main = ".open-next/worker.js"` + `[assets]` block added to wrangler.toml. `pnpm install` succeeded. `CI=1 pnpm --filter @apps/xa-b build` success (62 routes). `opennextjs-cloudflare build` success — `.open-next/worker.js` produced (11265 KiB total). `wrangler deploy --env preview --dry-run` exit 0; Worker name `xa-b-preview`, ASSETS binding confirmed. `typecheck` pass.
- **Affects:** `apps/xa-b/package.json`, `apps/xa-b/open-next.config.ts` (new), `apps/xa-b/wrangler.toml`
- **Depends on:** TASK-01
- **Blocks:** TASK-07 (via CHECKPOINT)
- **Confidence:** 85%
  - Implementation: 85% — TASK-01 affirming: middleware is Web Crypto only, held-back resolved
  - Approach: 85% — two-script pattern confirmed by TASK-06 validation; business-os CI pattern is the direct reference
  - Impact: 90% — xa-b cannot be deployed without this
  - Overall: min(85%, 85%, 90%) = 85% (actualized from 80% by TASK-01 affirming outcome)
- **Acceptance:**
  - [ ] `@opennextjs/cloudflare ^1.16.5` added to `apps/xa-b/package.json` devDependencies.
  - [ ] `"build:worker": "opennextjs-cloudflare build"` script added to `apps/xa-b/package.json`.
  - [ ] `build-xa.mjs` is NOT modified — catalog fetch + `next build --webpack` only. The OpenNext adapter is invoked externally by CI (see TASK-08) and via `pnpm build:worker` locally.
  - [ ] `apps/xa-b/open-next.config.ts` created: `import { defineCloudflareConfig } from "@opennextjs/cloudflare"; export default defineCloudflareConfig();`
  - [ ] `apps/xa-b/wrangler.toml` updated: remove `pages_build_output_dir = ".vercel/output/static"`, add `main = ".open-next/worker.js"`, add `[assets]` block with `directory = ".open-next/assets"` and `binding = "ASSETS"`, retain `compatibility_flags = ["nodejs_compat"]`, retain `[env.preview]` and all stealth vars.
  - [ ] `wrangler deploy --env preview --dry-run` passes locally (from `apps/xa-b/` after build).
- **Validation contract:**
  - TC-01: `CI=1 pnpm exec opennextjs-cloudflare build` from `apps/xa-b/` (after `pnpm --filter @apps/xa-b build`) → exits 0; `.open-next/worker.js` exists.
  - TC-02: `wrangler deploy --env preview --dry-run` → exits 0, correct Worker name in output.
  - TC-03: `pnpm --filter @apps/xa-b typecheck` → exits 0.
- **Execution plan:**
  - Red: Add `@opennextjs/cloudflare ^1.16.5` devDep + `build:worker` script to package.json; create `open-next.config.ts`; update wrangler.toml Worker config (remove Pages config, add Worker config).
  - Green: Run `pnpm install`; run `pnpm --filter @apps/xa-b build` (catalog fetch + next build); run `cd apps/xa-b && pnpm exec opennextjs-cloudflare build` (OpenNext adapter step); verify `.open-next/worker.js`; run dry-run deploy; run typecheck.
  - Refactor: Verify `[env.preview]` block in wrangler.toml retains all stealth vars and `name = "xa-b-preview"`.
- **Planning validation:**
  - TASK-01 deliverable: `docs/plans/xa-apps-ci-staging/task-01-openext-compat.md` — full wrangler.toml config documented.
  - Two-script pattern confirmed safe by TASK-06 (xa-uploader) direct build validation.
  - `build-xa.mjs` requires NO changes — OpenNext calls `pnpm build` internally which runs `node ./scripts/build-xa.mjs` (catalog fetch + next build only). No infinite loop.
- **Consumer tracing:**
  - `wrangler.toml` Worker config: consumed by `wrangler deploy` in TASK-08.
  - `open-next.config.ts`: consumed by `opennextjs-cloudflare build` at build time.
  - `package.json` `build:worker` script: consumed by TASK-08 CI job and local developer builds.
- **Scouts:** None — TASK-01 resolved all unknowns.
- **Edge Cases & Hardening:** xa-b's `wrangler.toml` has `[env.backup]` block — keep it unchanged alongside `[env.preview]` changes.
- **Rollout / rollback:** Rollout: merge PR. Rollback: revert package.json + delete open-next.config.ts + revert wrangler.toml.
- **Documentation impact:** None.
- **Notes / references:**
  - TASK-01 output: `docs/plans/xa-apps-ci-staging/task-01-openext-compat.md`.
  - If wrangler.toml Worker config causes incompatibility: revert to CF Pages config and replan TASK-08 to use `wrangler pages deploy`.

---

### TASK-05: Add xa-drop-worker build + deploy job to xa.yml
- **Type:** IMPLEMENT
- **Deliverable:** `.github/workflows/xa.yml` — `deploy-drop-worker` job added
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Build evidence:** `deploy-drop-worker` job appended to xa.yml. `needs: [test]`, job-scoped concurrency with `cancel-in-progress: false`. Build: `pnpm --filter @apps/xa-drop-worker build`. Deploy: `wrangler deploy --env preview` with `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID` secrets. YAML validated (python3 pass + actionlint 0 errors).
- **Affects:** `.github/workflows/xa.yml`
- **Depends on:** TASK-02, TASK-03
- **Blocks:** TASK-07 (CHECKPOINT)
- **Confidence:** 85%
  - Implementation: 85% — wrangler deploy pattern is straightforward; xa-drop-worker already has `wrangler build` script
  - Approach: 90% — `wrangler deploy --env preview` is the clear command; no CF Pages complexity
  - Impact: 85% — xa-drop-worker on staging is required before xa-b builds
- **Acceptance:**
  - [ ] `deploy-drop-worker` job added to `.github/workflows/xa.yml`.
  - [ ] Job runs only on push to `main`/`dev` (not on PR).
  - [ ] Steps: checkout → setup pnpm → `pnpm --filter @apps/xa-drop-worker build` → `wrangler deploy --env preview`.
  - [ ] Secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` passed as env vars to wrangler step.
  - [ ] Job depends on (`needs:`) `test` job from TASK-03.
  - [ ] Outputs staging Worker URL for use by downstream xa-b build job.
- **Validation contract:**
  - TC-01: Workflow YAML validates (`actionlint` or GitHub parser) → no errors.
  - TC-02: `wrangler deploy --env preview` with valid CF token → deploys `xa-drop-worker-preview` Worker.
  - TC-03: `GET https://xa-drop-worker-preview.<account>.workers.dev/health` → `{"ok":true}`.
- **Execution plan:**
  - Red: Add `deploy-drop-worker` job to xa.yml; add `needs: [test]`; add CF secrets env vars.
  - Green: Push; verify job triggers; confirm Worker deploys.
  - Refactor: Add `timeout-minutes` and concurrency control to deploy job.
- **Planning validation:** Verified `wrangler deploy --env preview` is the correct command for Worker environments. Confirmed xa-drop-worker has no Pages config (pure Worker).
- **Scouts:** None.
- **Edge Cases & Hardening:** `wrangler deploy` requires R2 bucket to exist at bind time — operator must create `xa-submissions-preview` before first deploy (documented in TASK-10). If bucket missing, deploy fails with a clear wrangler error.
- **Rollout / rollback:** Rollout: merge. Rollback: remove deploy job from xa.yml.
- **Documentation impact:** None.

---

### TASK-06: Add @opennextjs/cloudflare + wrangler.toml to xa-uploader
- **Type:** IMPLEMENT
- **Deliverable:** `apps/xa-uploader/package.json` (dep + `build:worker` added), `apps/xa-uploader/open-next.config.ts` (new), `apps/xa-uploader/wrangler.toml` (new)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-02-26)
- **Scope expansion:** `apps/xa-uploader/open-next.config.ts` added (required by OpenNext); `pnpm-lock.yaml` updated (package added); build script approach corrected to two-script pattern.
- **Build evidence:** `@opennextjs/cloudflare ^1.16.5` added to devDeps. `"build:worker": "opennextjs-cloudflare build"` added (NOT merged into `build` — merged pattern causes infinite loop). `open-next.config.ts` created. `wrangler.toml` created with Worker config + `[env.preview]`. `pnpm install` succeeded. `CI=1 pnpm --filter @apps/xa-uploader build` → success, 9 routes compiled. `opennextjs-cloudflare build` → `.open-next/worker.js` produced (4720 KiB total). `wrangler deploy --env preview --dry-run` → exit 0, ASSETS binding confirmed. `typecheck` → pass.
- **Affects:** `apps/xa-uploader/package.json`, `apps/xa-uploader/wrangler.toml` (new)
- **Depends on:** —
- **Blocks:** TASK-09
- **Confidence:** 80%
  - Implementation: 75% — xa-uploader has no prior CF config; same pattern as TASK-04 but fewer middleware unknowns (no CF Access JWT, simpler session auth)
  - Approach: 85% — OpenNext + Worker deploy mirrors xa-b approach; xa-uploader next.config.mjs already handles CI env validation skip
  - Impact: 85% — operator confirmed xa-uploader must be on CF staging
  - Overall: min(75%, 85%, 85%) = 75%; scored at 80% as this is lower-risk than xa-b (no complex middleware crypto).
- **Held-back test:** Single unknown: xa-uploader's session/auth middleware behaves correctly under OpenNext Workers. Less complex than xa-b's CF Access JWT — risk is lower. No held-back failure.
- **Acceptance:**
  - [ ] `@opennextjs/cloudflare` added to `apps/xa-uploader/package.json` devDependencies.
  - [ ] `apps/xa-uploader/wrangler.toml` created: `name = "xa-uploader"`, `main = ".open-next/worker.js"`, `assets = { directory = ".open-next/assets" }`, `compatibility_date`, `compatibility_flags = ["nodejs_compat"]`. `[env.preview]` block: `name = "xa-uploader-preview"`.
  - [ ] Build script in `package.json` updated to run OpenNext adapter step: `next build --webpack && pnpm exec opennextjs-cloudflare build` (xa-uploader has no separate build script file; update `package.json` scripts directly).
  - [ ] `pnpm --filter @apps/xa-uploader build` completes; `.open-next/` dir produced.
  - [ ] `wrangler deploy --env preview --dry-run` passes locally.
- **Validation contract:**
  - TC-01: `pnpm --filter @apps/xa-uploader build` → exits 0; `.open-next/worker.js` exists.
  - TC-02: `wrangler deploy --env preview --dry-run` → exits 0.
  - TC-03: `pnpm --filter @apps/xa-uploader typecheck` → exits 0.
- **Execution plan:**
  - Red: Create wrangler.toml; add `@opennextjs/cloudflare` dep to package.json; update `package.json` build script to `next build --webpack && pnpm exec opennextjs-cloudflare build`; run local build.
  - Green: Verify `.open-next/` output; dry-run deploy; typecheck.
  - Refactor: Ensure CI env var (`!process.env.CI`) secret-validation skip continues to work under OpenNext build.
- **Planning validation:** xa-uploader's `next.config.mjs` already skips production secret validation in CI (`!process.env.CI`) — this is compatible with OpenNext's build environment. No changes needed to that logic.
- **Consumer tracing:**
  - New `wrangler.toml`: consumed by TASK-09 deploy job.
  - Updated build script: consumed by TASK-09 CI build step.
- **Scouts:** xa-uploader uses `fast-csv`, `yazl`/`yauzl` (zip handling) — these are Node.js-native modules. Need to verify they're compatible with CF Workers runtime under OpenNext. Note in TASK-07 CHECKPOINT validation.
- **Edge Cases & Hardening:** `fast-csv` and `yazl`/`yauzl` use Node.js streams — may require `nodejs_compat` flag (already included). If incompatible, CHECKPOINT will surface this.
- **Rollout / rollback:** Rollout: merge. Rollback: delete wrangler.toml; revert package.json + build script.
- **Documentation impact:** None.

---

### TASK-07: CHECKPOINT — Reassess xa-b + xa-uploader deploy after adapter verified
- **Type:** CHECKPOINT
- **Deliverable:** Updated plan evidence via `/lp-do-replan`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Build evidence:** Checkpoint cleared. All 5 horizon assumptions confirmed: (1) `.open-next/worker.js` produced for xa-b (TASK-04 evidence: 11265 KiB); (2) `wrangler deploy --env preview --dry-run` exit 0 for xa-b (Worker `xa-b-preview`, ASSETS binding); (3) xa-drop-worker deploy job live in xa.yml — first actual deploy awaits operator provisioning per TASK-10; (4) `fast-csv`/`yazl`/`yauzl` build-compatible (TASK-06: build + dry-run passed, `nodejs_compat` flag included); (5) TASK-08 deploy command confirmed. Inline replan: TASK-08 confidence maintained at 80%; TASK-09 confidence maintained at 80%. Both at IMPLEMENT threshold — Wave 4 proceeds.
- **Affects:** `docs/plans/xa-apps-ci-staging/plan.md`
- **Depends on:** TASK-04, TASK-05
- **Blocks:** TASK-08, TASK-09
- **Confidence:** 95%
  - Implementation: 95% — process is defined
  - Approach: 95% — prevents dead-end execution on xa-b and xa-uploader deploy tasks
  - Impact: 95% — controls downstream risk from OpenNext unknowns for both xa-b and xa-uploader
- **Horizon assumptions to validate:**
  - OpenNext adapter produced correct `.open-next/` output for xa-b (from TASK-04 TC-01).
  - xa-b `wrangler deploy --env preview --dry-run` passed (from TASK-04 TC-02).
  - xa-drop-worker is live and reachable at staging URL (from TASK-05 TC-03).
  - xa-uploader Node.js modules (`fast-csv`, `yazl`/`yauzl`) are compatible with CF Workers runtime (from TASK-06 scouts).
  - TASK-08 deploy command (`wrangler deploy --env preview`) uses correct project name and output dir.
- **Validation contract:** `/lp-do-replan` run; TASK-08 and TASK-09 confidence recalibrated to ≥85% each, or blocked with specific issues listed.
- **Planning validation:** None: planning control task.
- **Rollout / rollback:** None: planning control task.
- **Documentation impact:** `docs/plans/xa-apps-ci-staging/plan.md` updated by replan.

---

### TASK-08: Add xa-b build + deploy job to xa.yml
- **Type:** IMPLEMENT
- **Deliverable:** `.github/workflows/xa.yml` — `deploy-xa-b` job added
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-02-26)
- **Build evidence:** `deploy-xa-b` job added to xa.yml. `needs: [deploy-drop-worker]`. Steps: checkout → setup-repo → turbo workspace dep build (`--filter=@apps/xa-b^...`) → `cd apps/xa-b && pnpm exec opennextjs-cloudflare build` (with `XA_CATALOG_CONTRACT_READ_URL` env var from vars context) → `wrangler deploy --env preview` (with CF secrets) → health check (`curl` to `xa-b-preview.<account>.workers.dev`, accepts any non-5xx/000 response). Job concurrency: `xa-deploy-xa-b-${{ github.ref }}`, `cancel-in-progress: false`. YAML validated: python3 pass + actionlint 0 errors.
- **Affects:** `.github/workflows/xa.yml`
- **Depends on:** TASK-07 (CHECKPOINT)
- **Blocks:** —
- **Confidence:** 80%
  - Implementation: 80% — post-checkpoint, OpenNext output dir and deploy command confirmed; 80% reflects residual risk of first real deploy encountering CF Access config issues
  - Approach: 85% — `wrangler deploy --env preview` with `XA_CATALOG_CONTRACT_READ_URL` pointing at staging drop-worker URL
  - Impact: 90% — this is the core user-testing deliverable (xa-b on staging)
- **Held-back test:** Single unknown that would drop below 80: CF Access env vars not set in CF dashboard → middleware blocks all requests, site appears broken despite successful deploy. Mitigation: TASK-10 documents this prerequisite; CI health check expects 302/403 not 200.
- **Acceptance:**
  - [ ] `deploy-xa-b` job added to xa.yml; `needs: [deploy-drop-worker]` (sequential after drop-worker).
  - [ ] Build step: `pnpm --filter @apps/xa-b build` with `XA_CATALOG_CONTRACT_READ_URL` env var set to staging drop-worker URL.
  - [ ] Deploy step: `wrangler deploy --env preview` (Worker deploy, not Pages deploy).
  - [ ] Health check step: `curl -s -o /dev/null -w "%{http_code}" https://xa-b-preview.<account>.workers.dev/` → check response is not 5xx (302/403 = healthy, stealth gate working).
  - [ ] `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` passed as secrets.
  - [ ] `NEXT_PUBLIC_XA_SW_VERSION` resolved from `GITHUB_SHA` (already handled in build-xa.mjs).
- **Validation contract:**
  - TC-01: `wrangler deploy --env preview` → exit 0; Worker URL in output.
  - TC-02: Health check `curl` → returns 302 or 403 (stealth gate active; not 500/502/503).
  - TC-03: `pnpm --filter @apps/xa-b build` with `XA_CATALOG_CONTRACT_READ_URL` pointing at staging → exits 0 (catalog fetched or fallback used).
- **Execution plan:**
  - Red: Add `deploy-xa-b` job to xa.yml; set `XA_CATALOG_CONTRACT_READ_URL` from drop-worker staging URL (output from TASK-05 job); add health check step.
  - Green: Push; verify deploy succeeds; verify health check passes (302/403 accepted).
  - Refactor: Add `timeout-minutes`; concurrency group to prevent parallel deploys.
- **Planning validation:**
  - Confirmed: xa-b/wrangler.toml `[env.preview]` block uses `name = "xa-b-preview"` → `wrangler deploy --env preview` targets correct Worker.
  - Confirmed: `XA_CATALOG_CONTRACT_READ_REQUIRED` not set → build falls back to catalog.json if staging drop-worker unreachable.
  - Post-TASK-07: TASK-04 output dir and `wrangler deploy` command confirmed.
- **Consumer tracing:**
  - New deploy job: consumed by GitHub Actions runner; output is live xa-b staging Worker.
  - Health check: CI gate; confirms site is up.
- **Scouts:** `XA_CATALOG_CONTRACT_READ_URL` for staging drop-worker — this URL is known only after TASK-05 first deploy. Must be stored as GitHub Actions variable or derived from known Worker naming pattern.
- **Edge Cases & Hardening:**
  - Health check must NOT require 200 — CF Access will 302 redirect all unauthenticated requests.
  - If `XA_CATALOG_CONTRACT_READ_URL` not available yet (first run), fallback catalog.json is used — acceptable for initial staging.
- **Rollout / rollback:** Rollout: merge. Rollback: remove job from xa.yml.
- **Documentation impact:** None.

---

### TASK-09: Add xa-uploader deploy job to xa.yml
- **Type:** IMPLEMENT
- **Deliverable:** `.github/workflows/xa.yml` — `deploy-xa-uploader` job added
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Build evidence:** `deploy-xa-uploader` job added to xa.yml. `needs: [test]`. Steps: checkout → setup-repo → turbo workspace dep build (`--filter=@apps/xa-uploader^...`) → `cd apps/xa-uploader && pnpm exec opennextjs-cloudflare build` (two-script pattern: OpenNext calls `pnpm build` internally = `next build --webpack`) → `wrangler deploy --env preview` (with CF secrets) → health check (`curl` to `xa-uploader-preview.<account>.workers.dev`, accepts any non-5xx/000). Job concurrency: `xa-deploy-xa-uploader-${{ github.ref }}`, `cancel-in-progress: false`. YAML validated: python3 pass + actionlint 0 errors.
- **Affects:** `.github/workflows/xa.yml`
- **Depends on:** TASK-03, TASK-06, TASK-07
- **Blocks:** —
- **Confidence:** 80%
  - Implementation: 80% — parallel to TASK-05 pattern; xa-uploader is simpler (no catalog fetch at build)
  - Approach: 85% — `wrangler deploy --env preview` with standard secrets
  - Impact: 80% — operator confirmed staging xa-uploader required; needed for catalog management during user test
- **Acceptance:**
  - [ ] `deploy-xa-uploader` job added to xa.yml; `needs: [test]` (TASK-07 CHECKPOINT is a planning gate — TASK-09 is not authored into xa.yml until CHECKPOINT passes; no runtime CI dependency on deploy-drop-worker required for xa-uploader).
  - [ ] Build step: `pnpm exec turbo run build --filter=@apps/xa-uploader^... && cd apps/xa-uploader && pnpm exec opennextjs-cloudflare build` (matches business-os-deploy.yml pattern; OpenNext calls `pnpm build` internally = next build only, no loop).
  - [ ] Deploy step: `wrangler deploy --env preview` with `--config apps/xa-uploader/wrangler.toml`.
  - [ ] `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` passed as secrets.
  - [ ] Health check: curl staging xa-uploader URL → 200 or 302 (login redirect = healthy).
- **Validation contract:**
  - TC-01: `wrangler deploy --env preview` → exit 0; Worker URL in output.
  - TC-02: Health check → not 500/502/503.
- **Execution plan:**
  - Red: After TASK-07 CHECKPOINT clears, add `deploy-xa-uploader` job to xa.yml; `needs: [test]`; build cmd = `pnpm exec turbo run build --filter=@apps/xa-uploader^... && cd apps/xa-uploader && pnpm exec opennextjs-cloudflare build`; deploy = `cd apps/xa-uploader && pnpm exec wrangler deploy --env preview`.
  - Green: Push; verify job triggers and deploys; run health check.
  - Refactor: `timeout-minutes`; concurrency group.
- **Planning validation:** xa-uploader's build script updated in TASK-06 to `next build --webpack && pnpm exec opennextjs-cloudflare build` — the CI job just calls `pnpm --filter @apps/xa-uploader build`, which runs the full adapter chain.
- **Consumer tracing:** Deployed xa-uploader Worker consumed by operator during user test for catalog management.
- **Scouts:** None.
- **Edge Cases & Hardening:** xa-uploader is an operator tool, not user-facing — does not require CF Access gating. Secrets (session keys etc.) are randomised in CI via `next.config.mjs` when not set. These are per-request ephemeral values; the deployed Worker needs persistent session secrets set as wrangler secrets for production-like behaviour. Document in TASK-10.
- **Rollout / rollback:** Rollout: merge. Rollback: remove job from xa.yml.
- **Documentation impact:** None.

---

### TASK-10: Produce operator prerequisites checklist
- **Type:** IMPLEMENT
- **Deliverable:** `docs/plans/xa-apps-ci-staging/task-10-operator-checklist.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Build evidence:** Checklist written at `docs/plans/xa-apps-ci-staging/task-10-operator-checklist.md`. Covers all 8 required items: GitHub secrets, R2 bucket creation, xa-drop-worker secrets, xa-uploader secrets, xa-b secrets/env vars, CF Access Application setup, XA_CATALOG_CONTRACT_READ_URL variable, catalog seeding. Ordered by dependency.
- **Affects:** `docs/plans/xa-apps-ci-staging/task-10-operator-checklist.md` (new file)
- **Depends on:** —
- **Blocks:** —
- **Confidence:** 95%
  - Implementation: 95% — writing a checklist from known requirements
  - Approach: 95% — all required prerequisites are documented in fact-find
  - Impact: 95% — without this, first CI run will fail on operator-controlled prerequisites
- **Acceptance:**
  - [ ] Checklist covers: GitHub Actions secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`).
  - [ ] Covers: R2 bucket `xa-submissions-preview` creation (`wrangler r2 bucket create xa-submissions-preview`).
  - [ ] Covers: wrangler secrets per staging env for xa-drop-worker (`wrangler secret put UPLOAD_TOKEN_SECRET --env preview`, `CATALOG_WRITE_TOKEN`, `CATALOG_READ_TOKEN`).
  - [ ] Covers: xa-uploader staging Worker secrets (`XA_UPLOADER_SESSION_SECRET`, `XA_UPLOADER_ADMIN_TOKEN` — set via `wrangler secret put --env preview`).
  - [ ] Covers: CF Access setup for xa-b-preview (audience tag, issuer URL, tester email provisioning).
  - [ ] Covers: xa-b Worker env vars (`XA_ALLOWED_HOSTS`, `XA_CF_ACCESS_AUDIENCE`, `XA_CF_ACCESS_ISSUER`) — these must be set via `wrangler secret put --env preview` or `[env.preview.vars]` in xa-b/wrangler.toml (not CF Pages dashboard; xa-b deploys as a CF Worker).
  - [ ] Covers: Catalog seeding — "Before user testing begins, seed initial catalog to xa-b staging via xa-uploader dev or direct R2 upload."
  - [ ] Checklist items are ordered by dependency (GitHub secrets first, R2 + CF Access before CI runs).
- **Validation contract:** File exists at above path with all checklist items present.
- **Execution plan:** Write `task-10-operator-checklist.md` from fact-find R0–R7 mitigations and T9 prerequisites. Use numbered list with command examples.
- **Planning validation:** None: doc writing task.
- **Rollout / rollback:** None: documentation only.
- **Documentation impact:** Produces operator-facing checklist.

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| R0: OpenNext fails with xa-b middleware (RS256 JWT) | Medium | High — blocks xa-b staging entirely | TASK-01 investigates first; CHECKPOINT (TASK-07) gates TASK-08 on successful build |
| R1: `xa-submissions-preview` R2 bucket missing | High | High — xa-drop-worker deploy fails | TASK-10 documents creation command; operator runs before first CI run |
| R2: xa-b CF Access env vars not set in dashboard | High | High — staging inaccessible to testers | TASK-10 documents CF Access setup; health check expects 302/403 not 200 |
| R3: Catalog empty for user test | Medium | High — user test shows empty store | TASK-10 documents catalog seeding step |
| R4: xa-uploader Node.js stream modules incompatible with CF Workers | Medium | Medium — xa-uploader staging broken | `nodejs_compat` flag included; CHECKPOINT validates; fallback: host xa-uploader separately |
| R5: wrangler secrets not provisioned in staging env | High | Medium — endpoints reject requests | TASK-10 documents all `wrangler secret put --env preview` commands |
| R6: First CI run slow (pnpm cache miss) | Low | Low — self-heals on second run | Accept |

## Observability
- Logging: GitHub Actions workflow logs for each job; wrangler deploy output.
- Metrics: Health check exit codes in CI.
- Alerts/Dashboards: None for initial staging; Cloudflare dashboard for Worker invocation counts.

## Acceptance Criteria (overall)
- [ ] `xa.yml` workflow exists and triggers on push to designated branch.
- [ ] All three apps pass lint + typecheck + test in CI.
- [ ] xa-drop-worker deployed to `xa-drop-worker-preview` (or equivalent) CF Worker.
- [ ] xa-b deployed to `xa-b-preview` CF Worker; CI health check returns non-5xx.
- [ ] xa-uploader deployed to `xa-uploader-preview` CF Worker; CI health check returns non-5xx.
- [ ] Operator prerequisites checklist delivered and actioned before user testing begins.

## Decision Log
- 2026-02-26: Chose `@opennextjs/cloudflare` (Worker deploy) over `@cloudflare/next-on-pages` (Pages deploy) for both xa-b and xa-uploader. Rationale: xa-b has CF Access RS256 JWT middleware requiring Node.js crypto; business-os and caryina use OpenNext Worker deploy in this monorepo (brikette production uses CF Pages static export). TASK-01 validates this assumption before TASK-04 commits.
- 2026-02-26: xa-uploader staging required (operator confirmed in original request: "uploaded needs to be made ready").
- 2026-02-26: Health check for CF Access-gated xa-b must accept 302/403 (not 200-only).

## Overall-confidence Calculation
- TASK-01: 75% × S(1) = 75; TASK-02: 90% × S(1) = 90; TASK-03: 85% × M(2) = 170; TASK-04: 80% × M(2) = 160; TASK-05: 85% × S(1) = 85; TASK-06: 80% × M(2) = 160; TASK-07: 95% × S(1) = 95; TASK-08: 80% × M(2) = 160; TASK-09: 80% × S(1) = 80; TASK-10: 95% × S(1) = 95
- Sum: 75+90+170+160+85+160+95+160+80+95 = 1170
- Weight total: 1+1+2+2+1+2+1+2+1+1 = 14
- Overall-confidence: 1170/14 = **83.6% → 83%**
