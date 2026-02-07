---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: BOS/Infrastructure
Created: 2026-02-06
Last-updated: 2026-02-06
Feature-Slug: bos-agent-api-availability
Related-Plan: docs/plans/bos-agent-api-availability-plan.md
Business-Unit: BOS
Card-ID:
---

# Business OS Agent API Availability — Fact-Find Brief

## Scope

### Summary

Make the Business OS agent API reliably accessible so that skills (`/fact-find`, `/plan-feature`, `/build-feature`, `/work-idea`, `/propose-lane-move`, `/kanban-sweep`) can always create and update cards throughout the workflow pipeline. Currently the API is local-only (Phase 0) and requires manually starting the dev server — when it's not running, card tracking silently drops off the entire skill pipeline.

### Goals

- Agent API is always reachable when skills run (no manual dev server startup required)
- Cards are created at idea generation and automatically updated as they progress through fact-find → plan → build
- Zero change to the existing skill code (they already use `${BOS_AGENT_API_BASE_URL}` — just need a live URL)
- Export workflow (`bos-export.yml`) continues to work (git mirror of D1 state)

### Non-goals

- Enabling user session auth (currently disabled due to `iron-session` Edge incompatibility — separate concern)
- Multi-writer git locking (D1 is the source of truth; git is read-only mirror)
- Public-facing UI for the Business OS (Pete-only for Phase 1)
- Migrating the business catalog from hard-coded to D1 (BOS-D1-08)

### Constraints & Assumptions

- Constraints:
  - D1 is the source of truth; all writes go through the agent API — evidence: `docs/business-os/business-os-charter.md` line 138
  - Agent API key auth must be maintained (timing-safe, rate-limited) — evidence: `apps/business-os/src/lib/auth/agent-auth.ts`
  - Skills reference `${BOS_AGENT_API_BASE_URL}` and `${BOS_AGENT_API_KEY}` — 7 skills, 60+ references across `.claude/skills/`
  - Export workflow reads from the agent API (`/api/admin/export-snapshot`) — it needs the same live URL
  - Must use `@opennextjs/cloudflare` (already a dependency) — not static export (needs D1 Edge binding)
- Assumptions:
  - Cloudflare Pages free tier supports D1 bindings and Edge runtime (confirmed by Brikette production pattern)
  - The existing D1 database (`91101d18-6ba2-41e2-97ab-1ac438cd56c8`) has migrations applied and contains data
  - `BOS_AGENT_API_KEY` can be stored as a GitHub Actions secret and Cloudflare Pages secret

## Repo Audit (Current State)

### Entry Points

- `apps/business-os/src/app/api/agent/cards/route.ts` — GET/POST cards
- `apps/business-os/src/app/api/agent/cards/[id]/route.ts` — GET/PATCH single card
- `apps/business-os/src/app/api/agent/ideas/route.ts` — GET/POST ideas
- `apps/business-os/src/app/api/agent/stage-docs/route.ts` — GET/POST stage docs
- `apps/business-os/src/app/api/agent/allocate-id/route.ts` — POST atomic ID allocation
- `apps/business-os/src/app/api/agent/businesses/route.ts` — GET business catalog
- `apps/business-os/src/app/api/agent/people/route.ts` — GET people/capacity
- `apps/business-os/src/app/api/admin/export-snapshot/route.ts` — GET D1 → markdown snapshot
- `apps/business-os/src/app/api/healthz/route.ts` — GET health check

### Key Modules / Files

| File | Role |
|------|------|
| `apps/business-os/wrangler.toml` | Cloudflare config — D1 binding, compatibility flags, build output dir |
| `apps/business-os/src/lib/d1.server.ts` | D1 access via `getCloudflareContext()` from `@opennextjs/cloudflare` |
| `apps/business-os/src/lib/auth/agent-auth.ts` | API key auth with timing-safe comparison + rate limiting |
| `apps/business-os/src/lib/business-catalog.ts` | Hard-coded business list (PLAT, BRIK, BOS) |
| `apps/business-os/db/migrations/0001_init.sql` | D1 schema (6 tables, optimized indexes) |
| `apps/business-os/next.config.mjs` | Shared config + webpack client-side Node fallbacks |
| `apps/business-os/src/scripts/export-to-pr.ts` | Export script called by `bos-export.yml` |
| `.github/workflows/bos-export.yml` | Hourly D1 → Git export (reads from deployed API) |
| `.claude/skills/_shared/card-operations.md` | Shared skill reference for API prereqs |

### Patterns & Conventions Observed

- **D1 access pattern**: `getCloudflareContext()` → `env.BUSINESS_OS_DB` — requires Edge runtime, requires Cloudflare deployment — evidence: `apps/business-os/src/lib/d1.server.ts`
- **All 27 API routes export `runtime = "edge"`** — fully Edge-compatible, no Node.js runtime required for API routes
- **Already migrated from `@cloudflare/next-on-pages` to `@opennextjs/cloudflare`** — uses `getCloudflareContext()` not deprecated `getRequestContext()`. Note: MEMORY.md says "apps/business-os still imports getRequestContext from @cloudflare/next-on-pages — needs migration later" — **this is outdated/wrong**.
- **Fail-closed in all skills**: If API is unavailable, skills stop and report error — no markdown fallback — evidence: `.claude/skills/_shared/card-operations.md` line 7
- **Port discrepancy in docs**: `card-operations.md` says `localhost:3000`, but `apps/business-os/package.json` dev script uses port 3020 — evidence: grep results

### Data & Contracts

- Types/schemas:
  - `CreateAgentCardSchema` (Zod) — validated on POST `/api/agent/cards`
  - `CreateAgentIdeaSchema` (Zod) — validated on POST `/api/agent/ideas`
  - `CreateStageDocSchema` (Zod) — validated on POST `/api/agent/stage-docs`
- Persistence:
  - D1 tables: `business_os_cards`, `business_os_ideas`, `business_os_stage_docs`, `business_os_comments`, `business_os_audit_log`, `business_os_metadata`
  - Atomic counters for ID allocation: `business_os_metadata` with `INSERT ... ON CONFLICT DO UPDATE` pattern
  - Optimistic concurrency: `entitySha` computed per entity, 409 on stale PATCH
- API/event contracts:
  - Agent auth: `X-Agent-API-Key` header, min 32 chars, alphanumeric + special
  - Rate limit: 100 req/60s per API key (in-memory — resets on cold start)
  - Export auth: `X-Export-API-Key` header (separate key, `BOS_EXPORT_API_KEY`)

### Dependency & Impact Map

- Upstream dependencies:
  - `@opennextjs/cloudflare@^1.16.3` — Cloudflare context for D1 binding
  - Cloudflare D1 database `91101d18-6ba2-41e2-97ab-1ac438cd56c8`
  - `@acme/platform-core` — repository layer for D1 operations
- Downstream dependents (skills that need this API):
  - `/work-idea` — Creates cards (required — entire skill fails without API)
  - `/fact-find` — Creates cards (optional — brief works, card tracking lost)
  - `/plan-feature` — Updates cards, creates plan stage docs
  - `/build-feature` — Updates cards, creates build stage docs, lane transitions
  - `/propose-lane-move` — Updates Proposed-Lane field
  - `/kanban-sweep` — Reads cards, ideas, stage docs, creates ideas
  - `bos-export.yml` — Reads `/api/admin/export-snapshot` for Git mirror
- Likely blast radius:
  - Deploying Business OS: additive, no impact on other apps
  - Changing `BOS_AGENT_API_BASE_URL` from localhost to deployed URL: single config change, all skills pick it up
  - If deployment has bugs: skills fail-closed (same behavior as "app not running"), no data loss

### Test Landscape

#### Test Infrastructure

- **Frameworks:** Jest
- **Commands:** `pnpm --filter @apps/business-os test` (runs `jest --ci --runInBand --detectOpenHandles --passWithNoTests`)
- **CI integration:** Run via `reusable-app.yml` when business-os paths change
- **Coverage:** Standard 80% threshold via `@acme/config/jest.preset.cjs`

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|------|-----------|-------|----------------|
| Agent API cards | unit | `api/agent/cards/__tests__/route.test.ts` | GET, POST, auth, validation |
| Agent API ideas | unit | `api/agent/ideas/__tests__/route.test.ts` | GET, POST, auth |
| Agent API allocate-id | unit | `api/agent/allocate-id/__tests__/route.test.ts` | Atomic counter, collision prevention |
| Agent API stage-docs | unit | `api/agent/stage-docs/__tests__/route.test.ts` | GET, POST, parent validation |
| Agent auth | unit | `lib/auth/agent-auth.test.ts` | Key validation, timing-safe, rate limiting |
| D1 repositories | unit | `platform-core/.../businessOsCards.server.test.ts` | SQL construction, param binding |
| Export serializer | unit | `lib/export/serializer.test.ts` | Deterministic YAML, normalization |
| Export-to-PR | unit | `scripts/export-to-pr.test.ts` | File writing, PR creation, no-change handling |

**59 total test files, 5,593 lines of test code.**

#### Test Patterns & Conventions

- **D1 mocking (two-tier):**
  - App level: mock `getDb()` → stub object, mock repository functions
  - Repository level: custom `MockD1Database` class implementing full D1 interface
- **Auth testing:** Uses `VALID_KEY = "A".repeat(31) + "!"` pattern; `__resetAgentRateLimitForTests()` helper
- **No integration tests with real D1** — all tests run against mocks

#### Coverage Gaps (Planning Inputs)

- **No smoke test for deployed API** — no test verifies D1 binding works in production context
- **No build validation test** — no test verifies OpenNext build output structure
- **Rate limiting resets on cold start** — in-memory Map, not durable (low risk for single-user Phase 1)

#### Testability Assessment

- **Easy to test:** Deployment workflow (follows brikette pattern exactly), skill URL configuration (single env var change)
- **Hard to test:** D1 binding in Cloudflare context (requires real deployment), cold-start rate limiting behavior
- **Test seams needed:** Post-deploy smoke test hitting `/api/healthz` (already exists in reusable-app.yml pattern)

#### Recommended Test Approach

- **Smoke test:** Post-deploy health check against `/api/healthz` (already supported by `reusable-app.yml`)
- **Integration test:** `curl` the deployed agent API with test card creation/deletion after first deploy
- **No new unit tests needed** — existing 59 test files cover the API surface well

### Recent Git History (Targeted)

- `apps/business-os/` — Last major changes were D1 migration (unified writes plan, TASK-00 through TASK-13). All API routes already migrated to `@opennextjs/cloudflare`. Export workflow operational.
- `.github/workflows/bos-export.yml` — Operational, runs hourly, currently targets `BOS_EXPORT_API_BASE_URL` (needs a deployed URL to work)

## Option Analysis

### Option A: Deploy Business OS to Cloudflare Pages (Recommended)

**What:** Deploy `apps/business-os` as a Cloudflare Pages project with D1 binding, following the exact same pattern as Brikette production.

**How it works:**
1. Add `open-next.config.ts` (same as brikette: `defineCloudflareConfig()`)
2. Build: `opennextjs-cloudflare build` → `.open-next/`
3. Deploy: `wrangler pages deploy .open-next --project-name business-os`
4. D1 binding: already configured in `wrangler.toml` (`BUSINESS_OS_DB`)
5. Secrets: `BOS_AGENT_API_KEY` set via Cloudflare Pages env vars
6. Update `BOS_AGENT_API_BASE_URL` to deployed URL
7. Update `bos-export.yml` to use deployed URL

**Deployment workflow:** New `.github/workflows/business-os-deploy.yml` using `reusable-app.yml` pattern.

**What works immediately (Edge + D1):**
- All 9 agent API routes (cards, ideas, stage-docs, allocate-id, businesses, people)
- All D1 operations (CRUD, atomic counters, audit log)
- Agent API key auth (timing-safe, Edge-compatible)
- Health check endpoint
- Export snapshot endpoint

**What doesn't work (Node.js dependencies):**
- `simple-git` operations (used by some admin routes, not agent API routes)
- Session auth middleware (`iron-session` — already disabled)
- File system access (used by repo reader — not needed for agent API)

**Critical insight:** The agent API routes are 100% Edge-compatible already. The Node.js dependencies are in admin/UI routes that aren't needed for Phase 1. Agent skills only call `/api/agent/*` endpoints.

**Pros:**
- Follows proven pattern (same as brikette production)
- Zero changes to existing skills (just point `BOS_AGENT_API_BASE_URL` to deployed URL)
- D1 binding already configured
- All agent API routes already Edge-compatible
- Enables `bos-export.yml` to work (currently needs a live URL)
- Enables multi-device/multi-agent workflows

**Cons:**
- Need to handle/stub Node.js-dependent routes (admin routes use `simple-git`, `fs`)
- Initial setup work (~2-4 hours estimated)
- Another deployed service to maintain

**Estimated effort:** Small-Medium. Most infrastructure already exists.

### Option B: Auto-Start Dev Server Locally

**What:** Before making API calls, skills detect if the app is running and start it if not.

**How:** A wrapper script or Claude Code hook that checks `curl -s http://localhost:3020/api/healthz` and runs `pnpm --filter @apps/business-os dev &` if it fails.

**Pros:**
- No deployment needed
- Works offline

**Cons:**
- Fragile — dev server takes 10-15s to start, skills would need to wait
- Port conflicts if other apps run on 3020
- Doesn't work for multi-agent (each agent instance would fight over the dev server)
- Doesn't fix `bos-export.yml` (runs in GitHub Actions, not locally)
- D1 local data can diverge from production
- Not a real solution — just delays the deployment problem

**Verdict:** Band-aid. Not recommended.

### Option C: Local Queue + Replay

**What:** When API is unavailable, write card operations to a JSON queue file. Replay when the app comes up.

**How:** Skills write to `.cache/bos-card-queue.json` with the operation details. A replay script processes the queue when the API is reachable.

**Pros:**
- Skills never lose card operations
- Works offline
- No deployment needed

**Cons:**
- Significant complexity in skills (dual write path: API or queue)
- Queue conflicts if multiple agents write simultaneously
- Card IDs can't be allocated without the API (breaks the ID contract)
- Replay ordering matters (create before update)
- Every skill needs modification (currently 7 skills, 60+ API references)
- Still doesn't fix `bos-export.yml`

**Verdict:** High complexity, doesn't solve the root cause. Not recommended.

### Option D: Direct D1 via Wrangler CLI

**What:** Use `wrangler d1 execute` commands to write directly to D1 without the app running.

**How:** Skills shell out to `wrangler d1 execute business-os --command "INSERT INTO..."` instead of HTTP API calls.

**Pros:**
- No app deployment needed
- Direct D1 access

**Cons:**
- Bypasses all validation (Zod schemas, business rules, lane transition logic)
- Bypasses auth and rate limiting
- Bypasses audit logging
- SQL injection risk if card content isn't properly escaped
- Every skill needs complete rewrite of API interaction layer
- `wrangler` CLI may not be installed in all environments
- Breaks the repository pattern completely

**Verdict:** Dangerous. Absolutely not recommended.

### Recommendation

**Option A (Deploy to Cloudflare Pages)** is the clear winner:
- It's the only option that solves the root cause
- It enables `bos-export.yml` to work
- It requires zero changes to existing skills
- It follows a proven deployment pattern already used by brikette
- The agent API is already 100% Edge-compatible

## Questions

### Resolved

- Q: Are all agent API routes Edge-compatible?
  - A: Yes. All 27 API routes export `runtime = "edge"`. Agent routes use D1 via `getCloudflareContext()`, which requires Edge runtime on Cloudflare.
  - Evidence: grep for `export const runtime` across `apps/business-os/src/app/api/`

- Q: What about the Node.js dependencies (`simple-git`, `fs`)?
  - A: These are used by admin/UI routes, NOT by agent API routes. Agent skills only call `/api/agent/*` endpoints which are pure Edge + D1. The Node.js routes can be stubbed or disabled for the deployed version.
  - Evidence: `simple-git` imported in `src/lib/repo/` and admin routes; no imports in `src/app/api/agent/`

- Q: Does the D1 database already have data?
  - A: The D1 database exists (`91101d18-6ba2-41e2-97ab-1ac438cd56c8` in `wrangler.toml`). Whether migrations are applied and data exists needs verification during deployment.
  - Evidence: `wrangler.toml` D1 config

- Q: Is `@opennextjs/cloudflare` build already proven for this app?
  - A: The dependency is installed (`@opennextjs/cloudflare@^1.16.3`), but no `open-next.config.ts` exists and no build has been attempted. However, the brikette production deploy uses the exact same adapter successfully.
  - Evidence: `apps/business-os/package.json` dependencies, absence of `open-next.config.ts`

- Q: What port does the dev server run on?
  - A: Port 3020, NOT 3000. `card-operations.md` incorrectly says `localhost:3000`.
  - Evidence: `apps/business-os/package.json` dev script

- Q: Is MEMORY.md accurate about `getRequestContext`?
  - A: No. MEMORY.md says "apps/business-os still imports getRequestContext from @cloudflare/next-on-pages — needs migration later". This is **outdated** — the codebase already uses `getCloudflareContext` from `@opennextjs/cloudflare`.
  - Evidence: `apps/business-os/src/lib/d1.server.ts` imports `getCloudflareContext`

- Q: How does the export workflow get data?
  - A: `bos-export.yml` calls `GET /api/admin/export-snapshot` on the deployed URL (`BOS_EXPORT_API_BASE_URL`). It needs a live deployed app to work. Currently this URL is either not set or points to the test deployment at `e4b2d615.business-os.pages.dev`.
  - Evidence: `.github/workflows/bos-export.yml`, `apps/business-os/src/scripts/export-to-pr.ts`

### Open (User Input Needed)

- Q: Should the deployed Business OS be accessible to the public internet, or restricted?
  - Why it matters: If public, anyone with the API key could create cards. If restricted (Cloudflare Access or IP allowlist), agents running in GitHub Actions also need access.
  - Decision impacted: Whether to add Cloudflare Access or rely solely on API key auth.
  - Default assumption: API key auth only (same as brikette production). The key is 32+ chars with timing-safe comparison + rate limiting — sufficient for Phase 1 with a single user. Risk: Low — rate limiting prevents brute force, key is not exposed in client-side code.

## Confidence Inputs (for /plan-feature)

- **Implementation:** 90%
  - The deployment follows the exact pattern used for brikette production. `@opennextjs/cloudflare` is already a dependency. All agent API routes are Edge-compatible. D1 binding is configured. The only unknowns are: (a) whether Node.js-dependent routes need to be stubbed or if the build handles them gracefully, and (b) whether D1 migrations are applied to the production database.
  - What would raise to 95%: A test build with `opennextjs-cloudflare build` to verify the output works.

- **Approach:** 92%
  - Deploying the app is unambiguously the right approach — it's the only option that solves the root cause, requires zero skill changes, and enables the export workflow. The alternatives (auto-start, queue, direct D1) are all worse in every dimension.
  - What would raise to 95%: Confirmation that Cloudflare Pages free tier supports D1 bindings (believed to be true but not verified for this specific project).

- **Impact:** 95%
  - Blast radius is minimal and well-understood. The deployment is additive — nothing existing breaks. Skills just need `BOS_AGENT_API_BASE_URL` pointed to the deployed URL. The export workflow gets a real URL. If the deployment has bugs, skills fail-closed (same as today when the app isn't running).

- **Testability:** 80%
  - Post-deploy smoke test via `/api/healthz` is trivial (already part of `reusable-app.yml` pattern). Existing 59 test files cover the API surface. Gap: no integration test with real D1 — but the risk is low given the same adapter works for brikette.
  - What would raise to 90%: Add a post-deploy integration test that creates and deletes a test card via the agent API.

## Planning Constraints & Notes

- Must-follow patterns:
  - Use `reusable-app.yml` for the deployment workflow (consistent with all other apps)
  - Use `@opennextjs/cloudflare` adapter (same as brikette production)
  - Keep API key auth (don't weaken security for convenience)
  - D1 as source of truth (don't introduce a second write path)
- Rollout/rollback expectations:
  - Deploy with `BOS_AGENT_API_KEY` as Cloudflare Pages secret
  - Verify via `/api/healthz` and a test card creation
  - Update `BOS_AGENT_API_BASE_URL` in skill config / environment only after verification
  - Rollback: revert `BOS_AGENT_API_BASE_URL` to localhost (skills fail-closed, same as before)
- Observability expectations:
  - Health check monitored via post-deploy step
  - `bos-export.yml` success/failure indicates API availability
- Doc fixes needed during build:
  - Fix `card-operations.md` port: `localhost:3000` → `localhost:3020` (or deployed URL)
  - Fix MEMORY.md: remove outdated `getRequestContext` note about business-os

## Suggested Task Seeds (Non-binding)

1. **Add `open-next.config.ts` to Business OS** — Copy from brikette, verify build produces `.open-next/`
2. **Fix `wrangler.toml` build output dir** — Currently `pages_build_output_dir = ".vercel/output/static"`, may need updating for OpenNext output
3. **Handle Node.js-dependent routes** — Determine if admin routes (`simple-git`, `fs`) need stubbing or if the build skips them naturally when they fail to resolve
4. **Verify D1 migrations applied** — Run `wrangler d1 migrations list business-os` and `apply` if needed
5. **Create deployment workflow** — `.github/workflows/business-os-deploy.yml` using `reusable-app.yml`
6. **Set Cloudflare Pages secrets** — `BOS_AGENT_API_KEY`, `BOS_EXPORT_API_KEY` via dashboard or wrangler
7. **Deploy and smoke test** — First deploy, verify `/api/healthz`, create/delete a test card
8. **Update skill config** — Point `BOS_AGENT_API_BASE_URL` to deployed URL
9. **Update `bos-export.yml`** — Point `BOS_EXPORT_API_BASE_URL` to deployed URL, verify hourly export works
10. **Fix docs** — Update `card-operations.md` port, fix MEMORY.md outdated note
11. **Post-deploy integration test** — Optional: add a test card create/read/delete cycle to the deploy workflow

## Planning Readiness

- Status: **Ready-for-planning**
- Blocking items: None — the open question (API key auth vs Cloudflare Access) has a safe default.
- Recommended next step: Proceed to `/plan-feature bos-agent-api-availability`
