---
Type: Plan
Status: Active
Domain: BOS/Infrastructure
Created: 2026-02-07
Last-updated: 2026-02-07
Feature-Slug: bos-agent-api-availability
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Business-Unit: BOS
Card-ID:
---

# Business OS Agent API Availability Plan

## Summary

Deploy the Business OS app to Cloudflare Pages so the agent API is always reachable. Currently 7 skills silently lose card tracking whenever the dev server isn't manually started on localhost:3020. Deploying follows the exact same pattern as Brikette production (`@opennextjs/cloudflare` → D1 binding → `wrangler pages deploy`). Zero skill code changes needed — just point `BOS_AGENT_API_BASE_URL` to the deployed URL.

## Goals

- Agent API always reachable (no manual dev server required)
- Cards created at idea generation and updated through fact-find → plan → build
- Export workflow (`bos-export.yml`) gets a live URL
- Zero changes to existing skill code

## Non-goals

- Enabling user session auth (iron-session Edge incompatibility — separate concern)
- Multi-writer git locking (D1 is source of truth)
- Public-facing UI (Pete-only Phase 1)
- Migrating business catalog to D1 (BOS-D1-08)

## Constraints & Assumptions

- Constraints:
  - Must use `reusable-app.yml` pattern (consistent with all app deploys)
  - Must use `@opennextjs/cloudflare` adapter (same as brikette production)
  - API key auth maintained (timing-safe, rate-limited)
  - D1 as source of truth (no second write path)
- Assumptions:
  - Cloudflare Pages supports D1 bindings (proven by brikette)
  - D1 database `91101d18-6ba2-41e2-97ab-1ac438cd56c8` exists (configured in `wrangler.toml`)

## Fact-Find Reference

- Related brief: `docs/plans/bos-agent-api-availability-fact-find.md`
- Key findings:
  - All 27 API routes export `runtime = "edge"` — fully Edge-compatible
  - Agent API routes (`/api/agent/*`) have zero Node.js module imports
  - Node.js imports (`simple-git`, `fs`) are isolated to: `people/page.tsx`, `plans/PlanDocumentPage.tsx`, `agent-runner/`, `lib/repo/`
  - `@opennextjs/cloudflare@^1.16.3` already a dependency
  - `open-next.config.ts` does not exist yet (needs creation)
  - `wrangler.toml` has `pages_build_output_dir = ".vercel/output/static"` — may need updating
  - Middleware auth is disabled by default (`NextResponse.next()` passthrough)
  - Dev port is 3020 (docs incorrectly say 3000)
  - `bos-export.yml` reads `BOS_EXPORT_API_BASE_URL` from GitHub vars
  - 59 test files, 5,593 lines of test code cover the API surface

## Existing System Notes

- Key modules/files:
  - `apps/business-os/wrangler.toml` — D1 binding config, build output dir
  - `apps/business-os/src/lib/d1.server.ts` — `getCloudflareContext()` for D1 access
  - `apps/brikette/open-next.config.ts` — reference pattern (3 lines: `defineCloudflareConfig()`)
  - `.github/workflows/brikette.yml` — reference deployment workflow (production job)
  - `.github/workflows/reusable-app.yml` — reusable pipeline template
  - `.claude/skills/_shared/card-operations.md` — skill API prereqs doc
- Patterns to follow:
  - Brikette production deploy: `open-next.config.ts` → `opennextjs-cloudflare build` → `.open-next/` → `wrangler deploy`
  - `reusable-app.yml`: lint → typecheck → test → build → upload artifact → deploy job → health check

## Proposed Approach

Single approach — deploy Business OS to Cloudflare Pages with D1 binding. The fact-find evaluated 4 options (deploy, auto-start, queue, direct D1) and Option A (deploy) is unambiguously correct. See fact-find for full analysis.

**Build concern:** Two UI pages (`people/page.tsx`, `plans/PlanDocumentPage.tsx`) import `safe-fs` which uses Node.js `fs`. The OpenNext build may fail or tree-shake these. TASK-02 handles this — if the build fails, we stub these pages with Edge-compatible alternatives.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on |
|---|---|---|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add OpenNext config and verify build | 88% | S | Pending | - |
| TASK-02 | IMPLEMENT | Handle Node.js-dependent pages for Edge build | 80% | M | Pending | TASK-01 |
| TASK-03 | IMPLEMENT | Create deployment workflow | 92% | S | Pending | TASK-02 |
| TASK-04 | IMPLEMENT | Set Cloudflare secrets and verify D1 migrations | 90% | S | Pending | - |
| TASK-05 | IMPLEMENT | First deploy and smoke test | 88% | S | Pending | TASK-03, TASK-04 |
| TASK-06 | IMPLEMENT | Update skill config and export workflow URL | 92% | S | Pending | TASK-05 |
| TASK-07 | IMPLEMENT | Fix documentation (ports, outdated notes) | 95% | S | Pending | TASK-05 |

> Effort scale: S=1, M=2, L=3

## Tasks

### TASK-01: Add OpenNext config and verify build

- **Type:** IMPLEMENT
- **Affects:** `apps/business-os/open-next.config.ts` (new), `apps/business-os/package.json`
- **Depends on:** -
- **Confidence:** 88%
  - Implementation: 92% — Exact 3-line pattern exists in `apps/brikette/open-next.config.ts`; `@opennextjs/cloudflare` already a dependency
  - Approach: 90% — Same adapter, same pattern, proven in production for brikette
  - Impact: 82% — Build may fail due to Node.js imports in non-Edge pages (handled in TASK-02)
- **Acceptance:**
  - `open-next.config.ts` exists in `apps/business-os/` with `defineCloudflareConfig()`
  - `package.json` has `build:worker` script: `opennextjs-cloudflare build`
  - Build produces `.open-next/` directory with `worker.js` and `assets/`
  - Build succeeds or fails with a clear, identifiable error about Node.js modules (informing TASK-02)
- **Test contract:**
  - **Test cases:**
    - TC-01: `open-next.config.ts` created → `pnpm --filter @apps/business-os build:worker` produces `.open-next/worker.js`
    - TC-02: Build failure → error message identifies the Node.js module and file path
  - **Acceptance coverage:** TC-01 covers acceptance criteria 1-3; TC-02 covers criteria 4
  - **Test type:** manual build verification (no unit test — build output validation)
  - **Run:** `cd apps/business-os && pnpm exec opennextjs-cloudflare build`
- **What would make this ≥90%:**
  - Confirm that OpenNext handles `runtime = "edge"` route splitting correctly (Edge routes → Worker, non-Edge → error/skip)
- **Rollout / rollback:**
  - Rollout: Add file, run build locally
  - Rollback: Delete `open-next.config.ts`, revert `package.json` script
- **Documentation impact:** None
- **Notes / references:**
  - Reference: `apps/brikette/open-next.config.ts` (3 lines)
  - The `.open-next/` output is the Cloudflare Pages deployment artifact

### TASK-02: Handle Node.js-dependent pages for Edge build

- **Type:** IMPLEMENT
- **Affects:** `apps/business-os/src/app/people/page.tsx`, `apps/business-os/src/app/plans/PlanDocumentPage.tsx`, `[readonly] apps/business-os/src/lib/safe-fs.ts`
- **Depends on:** TASK-01
- **Confidence:** 80%
  - Implementation: 82% — Two known files import `safe-fs` (Node.js `fs`). Fix is either: (a) add `export const runtime = "edge"` and remove fs dependency, or (b) make pages client-only, or (c) conditionally import. Approach depends on TASK-01 build output.
  - Approach: 80% — If OpenNext tree-shakes correctly, this task may be unnecessary. If not, stubbing the pages is straightforward.
  - Impact: 78% — These are UI pages not used by agents; breaking them has zero impact on the agent API, but we should not ship broken pages.
- **Acceptance:**
  - `opennextjs-cloudflare build` succeeds without Node.js module errors
  - Agent API routes (`/api/agent/*`) are fully functional in the built output
  - UI pages either work or are gracefully degraded (not 500 errors)
- **Test contract:**
  - **Test cases:**
    - TC-03: Build succeeds → `.open-next/worker.js` exists and is valid
    - TC-04: Agent API routes included in build → verify route manifest includes `/api/agent/cards`
    - TC-05: UI pages that use `safe-fs` → either render or show graceful "unavailable in deployed mode" message (not 500)
  - **Acceptance coverage:** TC-03 covers build success; TC-04 covers agent API; TC-05 covers UI degradation
  - **Test type:** manual build verification + local `wrangler pages dev` test
  - **Run:** `cd apps/business-os && pnpm exec opennextjs-cloudflare build && pnpm exec wrangler pages dev .open-next --d1=BUSINESS_OS_DB`
- **Planning validation:**
  - Files identified: `people/page.tsx:17` imports `readFileWithinRoot` from `safe-fs`; `plans/PlanDocumentPage.tsx:19` imports same
  - `safe-fs.ts` imports `fs` (type-only) but uses `fs.readFileSync` at runtime
  - No other page routes import Node.js modules
- **What would make this ≥90%:**
  - Run the build from TASK-01 and observe: if it succeeds without intervention, this task becomes trivial. If it fails, the error message tells us exactly what to fix.
- **Rollout / rollback:**
  - Rollout: Modify pages as needed based on build output
  - Rollback: Revert page changes (does not affect agent API functionality)
- **Documentation impact:** None
- **Notes / references:**
  - Only 2 files need attention — all other Node.js imports are in `agent-runner/` and `lib/repo/` which are not imported by any page or API route

### TASK-03: Create deployment workflow

- **Type:** IMPLEMENT
- **Affects:** `.github/workflows/business-os-deploy.yml` (new)
- **Depends on:** TASK-02
- **Confidence:** 92%
  - Implementation: 95% — Direct copy of brikette production pattern from `.github/workflows/brikette.yml:75-93`, using `reusable-app.yml`
  - Approach: 92% — Consistent with all other app deploys; uses proven reusable workflow
  - Impact: 90% — Additive new workflow; does not affect any existing workflows
- **Acceptance:**
  - `.github/workflows/business-os-deploy.yml` exists
  - Workflow triggers on push to `main` for `apps/business-os/**` and relevant package paths
  - Workflow uses `reusable-app.yml` with correct `app-filter`, `build-cmd`, `artifact-path`, `deploy-cmd`
  - Health check configured against `/api/healthz`
  - Merge gate updated to include business-os filter (if needed)
- **Test contract:**
  - **Test cases:**
    - TC-06: Workflow YAML is valid → `actionlint` passes
    - TC-07: Workflow triggers on correct paths → `paths` filter includes `apps/business-os/**` and relevant packages
    - TC-08: Build command produces correct artifact → `build-cmd` runs `opennextjs-cloudflare build`, `artifact-path` is `apps/business-os/.open-next`
    - TC-09: Deploy command correct → `wrangler pages deploy` with correct project name
    - TC-10: Health check configured → `healthcheck-base-url` points to deployed URL
  - **Acceptance coverage:** TC-06-07 cover structure; TC-08-09 cover build/deploy; TC-10 covers verification
  - **Test type:** YAML validation (actionlint) + manual review
  - **Test location:** `.github/workflows/business-os-deploy.yml`
  - **Run:** `actionlint .github/workflows/business-os-deploy.yml`
- **Rollout / rollback:**
  - Rollout: Merge workflow file; first run is on push to main
  - Rollback: Delete workflow file (one commit)
- **Documentation impact:** None (workflow is self-documenting)
- **Notes / references:**
  - Reference: `.github/workflows/brikette.yml:75-93` (production job pattern)
  - Must use `include-hidden-files: true` for `.open-next/` artifact upload
  - `secrets: inherit` passes `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `SOPS_AGE_KEY`

### TASK-04: Set Cloudflare secrets and verify D1 migrations

- **Type:** IMPLEMENT
- **Affects:** Cloudflare dashboard (external), `apps/business-os/db/migrations/0001_init.sql` (readonly)
- **Depends on:** -
- **Confidence:** 90%
  - Implementation: 92% — Standard Cloudflare Pages setup; `wrangler secret put` and `wrangler d1 migrations apply` are well-documented
  - Approach: 90% — Same pattern as all other Cloudflare deploys
  - Impact: 88% — If D1 migrations aren't applied, API returns 500s. Easily verified and fixed.
- **Acceptance:**
  - `BOS_AGENT_API_KEY` set as Cloudflare Pages environment variable (encrypted)
  - `BOS_EXPORT_API_KEY` set as Cloudflare Pages environment variable (encrypted)
  - D1 migrations applied to production database (6 tables created)
  - `wrangler d1 execute business-os --command "SELECT name FROM sqlite_master WHERE type='table'"` returns all 6 tables
- **Test contract:**
  - **Test cases:**
    - TC-11: D1 tables exist → query returns `business_os_cards`, `business_os_ideas`, `business_os_stage_docs`, `business_os_comments`, `business_os_audit_log`, `business_os_metadata`
    - TC-12: API key set → Cloudflare Pages settings show `BOS_AGENT_API_KEY` as encrypted variable
  - **Acceptance coverage:** TC-11 covers D1; TC-12 covers secrets
  - **Test type:** wrangler CLI verification
  - **Run:** `wrangler d1 migrations list business-os` and `wrangler d1 execute business-os --command "SELECT name FROM sqlite_master WHERE type='table'"`
- **Rollout / rollback:**
  - Rollout: Run migrations, set secrets via dashboard/CLI
  - Rollback: Secrets can be removed from dashboard; D1 tables persist (harmless)
- **Documentation impact:** None
- **Notes / references:**
  - Migration file: `apps/business-os/db/migrations/0001_init.sql`
  - D1 database ID: `91101d18-6ba2-41e2-97ab-1ac438cd56c8`

### TASK-05: First deploy and smoke test

- **Type:** IMPLEMENT
- **Affects:** Cloudflare Pages (external)
- **Depends on:** TASK-03, TASK-04
- **Confidence:** 88%
  - Implementation: 90% — Push to main triggers workflow; health check is automatic via `reusable-app.yml`
  - Approach: 88% — First deploy may reveal unexpected Edge runtime issues; mitigated by health check and manual verification
  - Impact: 85% — If deploy fails, skills are unaffected (same fail-closed behavior as today)
- **Acceptance:**
  - Workflow runs successfully (green check)
  - `/api/healthz` returns 200 on deployed URL
  - `POST /api/agent/cards` creates a test card successfully (manual `curl` test)
  - `GET /api/agent/cards` returns the test card
  - `DELETE` or cleanup of test card
  - Deployed URL noted for TASK-06
- **Test contract:**
  - **Test cases:**
    - TC-13: Health check → `curl https://<deployed-url>/api/healthz` returns 200 with status JSON
    - TC-14: Card creation → `curl -X POST .../api/agent/cards` with valid payload and API key returns 201 with `cardId`
    - TC-15: Card read → `curl .../api/agent/cards/<id>` returns the created card
    - TC-16: Auth rejection → `curl .../api/agent/cards` without API key returns 401
  - **Acceptance coverage:** TC-13 covers health; TC-14-15 cover CRUD; TC-16 covers auth
  - **Test type:** post-deploy integration (manual curl + workflow health check)
  - **Run:** Workflow health check automatic; manual curl for card CRUD test
- **What would make this ≥90%:**
  - Add an automated post-deploy integration test to the workflow (card create → read → delete)
- **Rollout / rollback:**
  - Rollout: Push workflow + build config to main → auto-deploys
  - Rollback: Disable workflow or delete Pages project from Cloudflare dashboard
- **Documentation impact:** None
- **Notes / references:**
  - The deployed URL will be `https://business-os.pages.dev` (or custom project name)
  - First deploy may take longer due to D1 cold start

### TASK-06: Update skill config and export workflow URL

- **Type:** IMPLEMENT
- **Affects:** `.claude/skills/_shared/card-operations.md`, `.github/workflows/bos-export.yml`, GitHub repository variables
- **Depends on:** TASK-05
- **Confidence:** 92%
  - Implementation: 95% — Single URL change in `card-operations.md`; single GitHub var update for `bos-export.yml`
  - Approach: 92% — Minimal change, maximum impact — all 7 skills immediately gain reliable API access
  - Impact: 90% — All skills pick up the new URL; export workflow starts working. If URL is wrong, skills fail-closed (safe).
- **Acceptance:**
  - `card-operations.md` updated: `Local: http://localhost:3020` and `Prod: https://<deployed-url>`
  - GitHub repository variable `BOS_AGENT_API_BASE_URL` set to deployed URL
  - GitHub repository variable `BOS_EXPORT_API_BASE_URL` set to deployed URL
  - `bos-export.yml` runs successfully with new URL (hourly cron or manual trigger)
  - At least one skill (`/fact-find` or `/work-idea`) successfully creates a card via the deployed API
- **Test contract:**
  - **Test cases:**
    - TC-17: Export workflow → manual trigger of `bos-export.yml` succeeds (or creates "no changes" PR)
    - TC-18: Skill card creation → run a skill that creates a card, verify card appears in D1
  - **Acceptance coverage:** TC-17 covers export; TC-18 covers skill integration
  - **Test type:** manual workflow trigger + skill invocation
  - **Run:** `gh workflow run bos-export.yml` then verify
- **Rollout / rollback:**
  - Rollout: Update docs and GitHub vars after TASK-05 verification
  - Rollback: Revert GitHub vars to empty or localhost (skills fail-closed, same as before)
- **Documentation impact:** `.claude/skills/_shared/card-operations.md` updated with deployed URL
- **Notes / references:**
  - `bos-export.yml` reads `BOS_EXPORT_API_BASE_URL` from `vars` context (not secrets)
  - Skills read `BOS_AGENT_API_BASE_URL` from environment

### TASK-07: Fix documentation (ports, outdated notes)

- **Type:** IMPLEMENT
- **Affects:** `.claude/skills/_shared/card-operations.md`, `.claude/skills/work-idea/SKILL.md`, `.claude/skills/kanban-sweep/SKILL.md`
- **Depends on:** TASK-05
- **Confidence:** 95%
  - Implementation: 98% — Text edits only
  - Approach: 95% — Fixing inaccurate docs prevents future confusion
  - Impact: 92% — No code impact; prevents agents from using wrong port
- **Acceptance:**
  - `card-operations.md` line 12: `localhost:3000` → `localhost:3020`
  - `work-idea/SKILL.md` line 40: `localhost:3000` → `localhost:3020`
  - `kanban-sweep/SKILL.md`: verify port references are correct
  - All skills reference correct dev port and mention deployed URL as primary
- **Test contract:**
  - **Test cases:**
    - TC-19: Grep for `localhost:3000` in `.claude/skills/` → zero results
    - TC-20: Grep for `localhost:3020` or deployed URL → matches in card-operations.md and skill docs
  - **Acceptance coverage:** TC-19-20 cover doc accuracy
  - **Test type:** grep validation
  - **Run:** `grep -r "localhost:3000" .claude/skills/`
- **Rollout / rollback:**
  - Rollout: Edit docs
  - Rollback: Revert edits (trivial)
- **Documentation impact:** This IS the documentation task
- **Notes / references:**
  - MEMORY.md already fixed (outdated `getRequestContext` note removed in fact-find session)

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| OpenNext build fails on Node.js page imports | TASK-02 handles this explicitly; pages can be stubbed without affecting agent API |
| D1 migrations not applied to production | TASK-04 verifies before first deploy; `wrangler d1 migrations apply` is idempotent |
| Cloudflare Pages free tier doesn't support D1 | Extremely unlikely (D1 is a Cloudflare product); brikette production uses same stack |
| API key exposed | Key is server-side only (not in client bundles); rate limiting + timing-safe comparison prevent brute force |
| Deploy breaks, skills can't create cards | Same behavior as today (fail-closed); rollback by reverting `BOS_AGENT_API_BASE_URL` |
| UI pages broken in deployed version | Agent API is the priority; UI pages are Phase 2 concern (auth still disabled) |

## Observability

- Logging: Cloudflare Workers logs (via `wrangler tail` or dashboard)
- Metrics: Cloudflare analytics (requests, errors, latency) — free tier
- Alerts/Dashboards: `bos-export.yml` failure = GitHub Actions notification; post-deploy health check in workflow

## Acceptance Criteria (overall)

- [ ] Business OS deployed to Cloudflare Pages with D1 binding
- [ ] Agent API routes (`/api/agent/*`) return correct responses
- [ ] Health check (`/api/healthz`) returns 200
- [ ] Skills can create/read/update cards via deployed URL
- [ ] Export workflow (`bos-export.yml`) runs successfully against deployed URL
- [ ] No regressions to existing skills or workflows
- [ ] Documentation accurate (ports, URLs)

## Decision Log

- 2026-02-07: Deploy to Cloudflare Pages (Option A) — only option that solves root cause, requires zero skill changes, enables export workflow. Options B/C/D rejected (see fact-find).
- 2026-02-07: API key auth only (no Cloudflare Access) for Phase 1 — 32+ char key with timing-safe comparison + rate limiting is sufficient for single-user. Cloudflare Access can be added later if needed.
