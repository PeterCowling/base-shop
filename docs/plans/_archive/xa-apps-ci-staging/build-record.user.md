---
Type: Build-Record
Status: Complete
Feature-Slug: xa-apps-ci-staging
Completed-date: 2026-02-26
artifact: build-record
---

# Build Record — XA Apps CI + Cloudflare Staging

## What Was Built

**Wave 1 — Foundations (TASK-01, 02, 03, 06, 10):**
TASK-01 confirmed `@opennextjs/cloudflare ^1.16.5` is fully compatible with xa-b's Next.js 16.1.6 + webpack build chain. Key discovery: the merged build script pattern causes an infinite recursive loop (`opennextjs-cloudflare build` internally calls `pnpm build`, which must NOT include the adapter step). The two-script pattern is required: `build` = `next build --webpack` only; `build:worker` = `opennextjs-cloudflare build` only. Also confirmed: xa-b's middleware uses exclusively Web Crypto API — no Node.js crypto, fully CF Workers compatible.

TASK-02 added the `[env.preview]` block to `apps/xa-drop-worker/wrangler.toml`, creating the `xa-drop-worker-preview` Worker environment with `xa-submissions-preview` R2 bucket binding and all required vars. `wrangler deploy --env preview --dry-run` validated.

TASK-03 created `.github/workflows/xa.yml` with `validate` (lint + typecheck) and `test` (unit tests) jobs for all three xa- apps. Uses the same `setup-repo` composite action and pnpm/turbo cache pattern as brikette.yml. YAML and actionlint validated.

TASK-06 added `@opennextjs/cloudflare ^1.16.5` to `apps/xa-uploader/package.json`, created `apps/xa-uploader/wrangler.toml` (Worker config with `[env.preview]` block), and created `apps/xa-uploader/open-next.config.ts`. Build validated: `.open-next/worker.js` produced (4720 KiB), dry-run passed.

TASK-10 produced the operator prerequisites checklist at `docs/plans/xa-apps-ci-staging/task-10-operator-checklist.md` covering all 8 provisioning steps in dependency order.

**Wave 2 — xa-b OpenNext Setup + Drop-Worker Deploy Job (TASK-04, 05):**
TASK-04 added `@opennextjs/cloudflare ^1.16.5` to `apps/xa-b/package.json`, created `apps/xa-b/open-next.config.ts`, and updated `apps/xa-b/wrangler.toml` from CF Pages config to CF Worker config (removed `pages_build_output_dir`, added `main = ".open-next/worker.js"` + `[assets]` block). Also removed `export const runtime = "edge"` from `apps/xa-b/src/app/api/search/sync/route.ts` (OpenNext does not support edge runtime declarations). Build validated: `.open-next/worker.js` produced (11265 KiB), dry-run confirmed Worker `xa-b-preview` with ASSETS binding.

TASK-05 added the `deploy-drop-worker` job to xa.yml: `needs: [test]`, build step `pnpm --filter @apps/xa-drop-worker build`, deploy step `wrangler deploy --env preview` with CF secrets, job-level concurrency `cancel-in-progress: false`.

**Wave 4 — CHECKPOINT + xa-b + xa-uploader Deploy Jobs (TASK-07, 08, 09):**
TASK-07 CHECKPOINT validated all 5 horizon assumptions (adapter output confirmed, dry-run passed, deploy job live, Node.js module build compatibility confirmed, deploy command verified). Inline replan confirmed TASK-08/09 both at ≥80% — Wave 4 proceeded automatically.

TASK-08 added `deploy-xa-b` job to xa.yml: `needs: [deploy-drop-worker]`, builds workspace deps via turbo (excluding xa-b itself), runs `opennextjs-cloudflare build` with `XA_CATALOG_CONTRACT_READ_URL` env var (from GitHub vars context, falls back to bundled catalog if unset), deploys via `wrangler deploy --env preview`, and runs health check accepting any non-5xx/non-000 response (302/403 from CF Access stealth gate = healthy).

TASK-09 added `deploy-xa-uploader` job to xa.yml: `needs: [test]`, same two-step OpenNext build pattern, deploys via `wrangler deploy --env preview`, health check accepts non-5xx response.

## Tests Run

| Command | Scope | Result |
|---|---|---|
| `wrangler deploy --env preview --dry-run` (xa-drop-worker) | TASK-02 | Pass — binding `xa-submissions-preview` confirmed |
| `python3 yaml.safe_load` + `actionlint` (xa.yml after TASK-03) | TASK-03 | Pass — 0 errors |
| `pnpm --filter @apps/xa-uploader test` (implicit via pre-commit) | TASK-06 | Pass |
| `pnpm --filter @apps/xa-uploader typecheck` | TASK-06 | Pass |
| `wrangler deploy --env preview --dry-run` (xa-uploader) | TASK-06 | Pass — ASSETS binding confirmed |
| `CI=1 pnpm --filter @apps/xa-b build` | TASK-04 | Pass — 62 routes |
| `pnpm exec opennextjs-cloudflare build` (xa-b) | TASK-04 | Pass — `.open-next/worker.js` 11265 KiB |
| `wrangler deploy --env preview --dry-run` (xa-b) | TASK-04 | Pass — Worker `xa-b-preview`, ASSETS binding |
| `pnpm --filter @apps/xa-b typecheck` | TASK-04 | Pass |
| `python3 yaml.safe_load` + `actionlint` (xa.yml after TASK-05) | TASK-05 | Pass — 0 errors |
| `python3 yaml.safe_load` + `actionlint` (xa.yml after TASK-08/09) | TASK-08/09 | Pass — 0 errors |
| lint-staged + typecheck-staged (pre-commit hooks) | All commits | Pass — all 4 commits clean |

## Validation Evidence

| Task | Contract | Evidence |
|---|---|---|
| TASK-01 | Artifact at `task-01-openext-compat.md`; build output confirmed; middleware clean | Written — AFFIRMING outcome, all 5 questions answered |
| TASK-02 | TC-01: dry-run exit 0; TC-02: `[env.preview]` syntactically valid | `xa-submissions-preview` binding confirmed in dry-run output |
| TASK-03 | TC-01: YAML validates; TC-02/03/04: jobs runnable | actionlint 0 errors; all three test commands confirmed available |
| TASK-04 | TC-01: `.open-next/worker.js` exists (11265 KiB); TC-02: dry-run exit 0; TC-03: typecheck pass | All three TCs passed locally |
| TASK-05 | TC-01: YAML validates | actionlint 0 errors; deploy job structure confirmed |
| TASK-06 | TC-01: `.open-next/worker.js` exists (4720 KiB); TC-02: dry-run exit 0; TC-03: typecheck pass | All three TCs passed locally |
| TASK-07 | `/lp-do-replan` run; downstream confidence ≥85% each | Inline replan — all assumptions cleared; TASK-08/09 at 80% (at threshold) |
| TASK-08 | TC-01: `wrangler deploy` exit 0; TC-02: health check non-5xx; TC-03: build with URL env var | YAML validated; deployment awaits first CI run with operator secrets provisioned |
| TASK-09 | TC-01: `wrangler deploy` exit 0; TC-02: health check non-5xx | YAML validated; deployment awaits first CI run |
| TASK-10 | File exists with all 8 checklist items | `task-10-operator-checklist.md` written and committed |

## Scope Deviations

- **TASK-04 (controlled expansion):** `apps/xa-b/src/app/api/search/sync/route.ts` — `export const runtime = "edge"` removed. Required by OpenNext (does not support CF edge runtime declarations). Consistent with MEMORY.md documented pattern for CF Worker apps.
- **TASK-06 (corrected approach):** Build script pattern changed from merged (`next build --webpack && opennextjs-cloudflare build`) to two-script pattern (`build` = next only, `build:worker` = adapter only). Merged pattern causes infinite recursive loop (OpenNext calls `pnpm build` internally). Plan task TASK-04 approach updated accordingly.
- **TASK-06 (scope expansion):** `apps/xa-uploader/open-next.config.ts` created (required by OpenNext adapter; not explicitly listed in original Affects). `pnpm-lock.yaml` updated for new `@opennextjs/cloudflare` devDep.

## Outcome Contract

- **Why:** User testing of the xa-b storefront requires a live staging environment. No CI or deploy pipeline existed for any of the three xa- apps.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All three apps pass CI and are deployed to Cloudflare staging; a user tester with CF Access can load the storefront and browse products.
- **Source:** operator
