---
Type: Plan
Status: Active
Domain: Platform / Business OS
Created: 2026-02-02
Last-updated: 2026-02-02
Feature-Slug: business-os-unified-writes
Overall-confidence: 84%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Business-Unit: BOS
---

# Business OS Unified Writes + Git Mirror Plan

## Summary

Unify all Business OS writes through D1 APIs and implement a git mirror for periodic snapshots. Currently, UI users and agents write to different stores (D1 vs. markdown), causing data drift. This plan establishes D1 as the single Source of Truth (SoT), adds authenticated agent API endpoints, migrates skills to use these APIs, and implements a scheduled export job that maintains `docs/business-os/` as a deterministic mirror.

## Goals

- Single write path to SoT — all actors write to D1 via API
- Timely observability — all clients see changes within polling interval (Phase 1: ≤30s)
- Git mirror for snapshots — `docs/business-os/` provides periodic deterministic snapshots
- Multi-writer support — UI users and agents write without conflicts (optimistic locking)

## Non-goals

- Bidirectional sync (markdown is never a write path post-migration)
- Real-time collaborative editing (Google Docs style)
- Offline-first agents
- Sub-second latency (Phase 2 concern)

## Constraints & Assumptions

- Constraints:
  - D1 is the persistence layer (Cloudflare Pages edge runtime)
  - Agent skills run locally; D1 access requires authenticated API
  - Deterministic export must produce byte-identical output for identical D1 state
  - Export job runs on CI (GitHub Actions scheduled workflow)
  - **Fail-closed policy:** If agent API is unavailable, skills error with clear message; they do NOT fall back to markdown writes
- Assumptions:
  - ~300 writes/day is the expected volume; full-table export remains viable

## API Credentials & Trust Boundaries

### Agent API (Phase 1)

| Resource | Methods | Path |
|----------|---------|------|
| Cards | GET, POST | `/api/agent/cards` |
| Card | GET, PATCH | `/api/agent/cards/:id` |
| Ideas | GET, POST | `/api/agent/ideas` |
| Idea | GET, PATCH | `/api/agent/ideas/:id` |
| Stage Docs | GET, POST | `/api/agent/stage-docs` |
| Stage Doc | GET, PATCH | `/api/agent/stage-docs/:cardId/:stage` |
| ID Allocation | POST | `/api/agent/allocate-id` |

| Property | Value |
|----------|-------|
| **Auth header** | `X-Agent-API-Key: <value>` |
| **Secret name** | `BOS_AGENT_API_KEY` |
| **Key storage** | Agent machine: `.env.local` (not committed); Edge runtime: Cloudflare Pages environment secret |
| **Key validation** | Constant-time comparison (`crypto.timingSafeEqual`); rate limit: 100 req/min per key |
| **Scope** | Read/write access to Business OS entities for all businesses (Phase 1); per-business scoping deferred |
| **Authorizes** | Read/create/update cards, ideas, stage docs; allocate IDs |

### Agent API Base URL

| Environment | Value | Source |
|-------------|-------|--------|
| Local dev | `http://localhost:3000` | `BOS_AGENT_API_BASE_URL` in `.env.local` |
| Production | `https://business-os.acme.dev` | `BOS_AGENT_API_BASE_URL` in agent environment |

### Export API (Separate Trust Zone)

| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/admin/export-snapshot` |
| **Auth header** | `X-Export-API-Key: <value>` |
| **Secret name** | `BOS_EXPORT_API_KEY` |
| **Key storage** | GitHub Actions secret only |
| **Scope** | Read-only snapshot of all Business OS entities |
| **Authorizes** | Export D1 state to JSON for git mirror |

**Rationale:** Separate keys prevent CI export credentials from being reused for write operations, maintaining clear trust boundaries.

## Concurrency Model

### D1 is the Only Concurrency Control

Post-migration, **D1 optimistic concurrency is the sole write concurrency mechanism**. There is no git locking, file locking, or multi-writer coordination at the filesystem level.

- Git mirror is single-writer (CI export job only)
- No conflict possible on git side because only one actor writes

### PATCH Specification

All PATCH operations use **JSON Merge Patch (RFC 7396)**:

- Partial updates: only include fields you want to change
- `null` value removes a field
- Nested objects merge recursively
- Arrays are replaced entirely (not merged)

**Request format:**
```json
{
  "baseEntitySha": "<sha from GET response>",
  "patch": { /* RFC 7396 merge patch */ }
}
```

**Response format:**
```json
{
  "entity": { /* full updated entity */ },
  "entitySha": "<new sha>"
}
```

### PATCH Protocol (Field-Level)

To prevent "agent overwrote UI changes" scenarios, PATCH operations use the JSON Merge Patch workflow:

```
1. Agent calls GET /api/agent/cards/:id → { entity, entitySha }
2. Agent computes patch (only fields it intends to change per RFC 7396)
3. Agent sends PATCH with:
   {
     "baseEntitySha": "<sha from step 1>",
     "patch": {
       "Lane": "In progress",
       "Last-Progress": "2026-02-02"
     }
   }
4. Server:
   a. Fetch current entity
   b. Compute current SHA
   c. If baseEntitySha !== currentSha → return 409 Conflict
   d. Apply patch to current state (JSON Merge Patch semantics)
   e. Compute new SHA
   f. Save and return { entity, entitySha }
```

**409 Conflict response:**
```json
{
  "error": "CONFLICT",
  "message": "Entity modified since last read",
  "currentEntitySha": "<current sha>",
  "entity": { /* current state for retry */ }
}
```

**Full-document updates:** If agent sends complete payload instead of patch, the risk of overwriting concurrent changes exists. This is acceptable for Phase 1 with low write volume (~300/day), but field-level patching is the target.

### Branch Protection Bypass Policy

In emergencies where manual edits to `docs/business-os/` are required:

1. **Temporary bypass:** Admin temporarily disables branch protection, makes change via PR, re-enables protection
2. **Audit requirement:** All bypasses must be logged in `docs/business-os/MANUAL_EDITS.md` with:
   - Date and author
   - Reason for bypass
   - Files changed
   - Approval (who authorized)
3. **Post-bypass:** D1 must be updated to match (via UI or API) to prevent export from reverting the manual change
4. **Never allowed:** Direct pushes to main, even with bypass (always use PR for audit trail)

This policy exists for rare emergencies (e.g., broken export job, urgent data fix). Normal operations use D1 exclusively.

## Fact-Find Reference

- Related brief: `docs/plans/business-os-unified-writes-fact-find.md`
- Key findings:
  - D1-canonical premise locked per `docs/plans/database-backed-business-os-plan.md`
  - UI has functional create and edit pages writing to D1
  - Agents write markdown directly, causing drift
  - Board-version endpoint exists but lacks delta/cursor support
  - Optimistic concurrency via SHA-256 entity hashes exists
  - Agent identity: Option A (generic API key) recommended
  - Cursor contract: use `audit_log.id` as monotonic cursor

## Recent Skill Changes (2026-02-02)

The following skill changes impact this plan:

| Skill | Change | Impact on Plan |
|-------|--------|----------------|
| **fact-find** | Added `Feature-Slug` to card frontmatter during BOS integration | TASK-02 must support `Feature-Slug` field in POST/PATCH |
| **fact-find** | Creates fact-finding stage doc via BOS integration | TASK-02b (stage-docs API) required before TASK-11 |
| **plan-feature** | Reads `Feature-Slug` from card (Slug Stability rule) | API must return `Feature-Slug` in GET responses |
| **plan-feature** | Added Test Foundation Check | No direct impact (documentation change) |
| **build-feature** | Automatic `Planned → In progress` lane transition on first task | TASK-10 must handle lane PATCH on build start |
| **build-feature** | Creates `build.user.md` stage doc on first task | TASK-10 depends on TASK-02b |
| **build-feature** | Updates `Last-Progress` field after each task | TASK-02 must support `Last-Progress` field in PATCH |
| **All three** | Broadened commit permissions for BOS integration | Skills can commit card files + stage docs (already planned) |

## Existing System Notes

- Key modules/files:
  - `apps/business-os/src/app/api/cards/route.ts` — POST endpoint for card creation
  - `apps/business-os/src/app/api/cards/[id]/route.ts` — PATCH endpoint for card updates
  - `apps/business-os/src/app/api/board-version/route.ts` — version signal (no delta support yet)
  - `packages/platform-core/src/repositories/businessOsIds.server.ts` — ID allocation
  - `packages/platform-core/src/repositories/businessOsCards.server.ts` — card upsert
  - `apps/business-os/src/lib/entity-sha.ts` — optimistic concurrency SHA
  - `.claude/skills/_shared/card-operations.md` — scan-based ID allocation (to be deprecated)
- Patterns to follow:
  - Zod schema validation at API boundary (see `CreateCardSchema` in cards route)
  - `getCurrentUserServer()` for auth (UI path)
  - `appendAuditEntry()` for audit logging
  - `computeEntitySha()` for optimistic concurrency

## Proposed Approach

**API Unification:** Create new `/api/agent/*` endpoints that mirror the UI endpoints but authenticate via API key header instead of session cookie. Agents call these endpoints using the WebFetch tool.

**Cursor-Based Delta:** Enhance board polling with `audit_log.id`-based cursor for incremental change detection.

**Git Mirror:** Scheduled CI job exports D1 state to markdown using deterministic serialization rules. Export job opens PRs (not direct commits) to maintain auditability.

**Skill Migration:** Update shared skill helpers to write via API; deprecate direct markdown writes.

- Option A: Skills use WebFetch tool to call `/api/agent/*` endpoints
- Option B: MCP tool wraps API calls (cleaner agent UX)
- Chosen: **Option A** for Phase 1 (simpler, no MCP infrastructure); consider Option B as enhancement

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on |
|---|---|---|---:|---:|---|---|
| TASK-00 | IMPLEMENT | One-time markdown → D1 backfill migration | 85% | M | Complete (2026-02-02) | - |
| TASK-01 | IMPLEMENT | Create agent authentication middleware | 88% | S | Complete (2026-02-02) | - |
| TASK-02 | IMPLEMENT | Create `/api/agent/cards` endpoint (GET/POST/PATCH) | 85% | M | Complete (2026-02-02) | TASK-01 |
| TASK-02a | IMPLEMENT | Create `/api/agent/ideas` endpoint (GET/POST/PATCH) | 85% | M | Complete (2026-02-02) | TASK-01 |
| TASK-02b | IMPLEMENT | Create `/api/agent/stage-docs` endpoint (GET/POST/PATCH) | 82% | M | Complete (2026-02-02) | TASK-01 |
| TASK-03 | IMPLEMENT | Create `/api/agent/allocate-id` endpoint | 90% | S | Complete (2026-02-02) | TASK-01 |
| TASK-04 | IMPLEMENT | Create `/api/board-changes` cursor-based delta endpoint | 82% | M | Complete (2026-02-02) | - |
| TASK-04b | IMPLEMENT | Wire UI to `/api/board-changes` endpoint | 82% | S | Complete (2026-02-02) | TASK-04 |
| TASK-05 | IMPLEMENT | Implement deterministic D1→markdown serializer | 82% | M | Complete (2026-02-02) | - |
| TASK-05a | IMPLEMENT | Create `/api/admin/export-snapshot` endpoint | 85% | S | Pending | TASK-05 |
| TASK-06 | IMPLEMENT | Create git export CI job (PR-based, hourly) | 82% | M | Pending | TASK-05a |
| TASK-07 | IMPLEMENT | Add CI guard + branch protection for `docs/business-os/` | 85% | M | Pending | TASK-06 |
| TASK-08 | IMPLEMENT | Update `card-operations.md` to use agent API | 85% | S | Pending | TASK-02, TASK-02a, TASK-02b, TASK-03 |
| TASK-09 | IMPLEMENT | Migrate `/work-idea` skill to API writes | 82% | M | Pending | TASK-08 |
| TASK-10 | IMPLEMENT | Migrate `/build-feature` skill to API writes | 82% | M | Pending | TASK-08, TASK-02b |
| TASK-11 | IMPLEMENT | Migrate remaining skills (`/fact-find`, etc.) | 82% | M | Pending | TASK-08 |
| TASK-12 | IMPLEMENT | Update Business OS charter for D1-canonical reality | 90% | S | Pending | TASK-09 |
| TASK-13 | IMPLEMENT | Remove deprecated `repo-writer.ts` and scan-based allocation | 85% | S | Pending | TASK-11, TASK-06 |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Tasks

### TASK-00: One-time markdown → D1 backfill migration

- **Type:** IMPLEMENT
- **Affects:** `apps/business-os/src/scripts/backfill-from-markdown.ts` (new), D1 database
- **Depends on:** -
- **Confidence:** 85%
  - Implementation: 90% — gray-matter parsing is well-understood; existing parsers available
  - Approach: 85% — one-time script with dry-run mode
  - Impact: 80% — destructive operation; requires careful validation
- **Acceptance:**
  - Script reads all entities from `docs/business-os/` (cards, ideas, stage-docs)
  - Parses frontmatter and markdown body using gray-matter
  - Upserts into D1 with `source: "backfill"` audit log entry
  - **Dry-run mode:** `--dry-run` flag shows what would be inserted without writing
  - **Conflict handling:** If entity exists in D1 with different content, report conflict (don't overwrite)
  - **Validation:** After backfill, export from D1 and diff against source markdown
  - **ID counter sync:** Update ID allocation counters to max(existing IDs) + 1
- **Test contract:**
  - **TC-01:** Dry-run mode → no database writes
    - Run with `--dry-run` flag → reports entities to insert → D1 remains unchanged
  - **TC-02:** Full backfill → entities inserted with audit log
    - Run without `--dry-run` → entities inserted → audit log shows `source: "backfill"`
  - **TC-03:** Round-trip validation → export matches source
    - After backfill → export from D1 → diff against source → byte-identical (after normalization)
  - **TC-04:** Conflict detection → existing entity not overwritten
    - Entity exists in D1 with different content → script reports conflict → does NOT overwrite
  - **TC-05:** ID counter sync → allocation counter updated
    - After backfill → max ID is BRIK-ENG-0020 → next allocation returns BRIK-ENG-0021
  - **Acceptance coverage:** TC-01 covers dry-run; TC-02,03 covers backfill+validation; TC-04 covers conflict handling; TC-05 covers ID sync
  - **Test type:** Integration (script execution against test database)
  - **Test location:** `apps/business-os/src/scripts/backfill-from-markdown.test.ts` (new)
  - **Run:** `pnpm --filter business-os test --testPathPattern=backfill`
- **Planning validation:**
  - Tests run: Reviewed markdown structure in `docs/business-os/`
  - Test stubs written: N/A (M effort)
  - Unexpected findings: Some cards may only exist in markdown; those are the primary backfill target
- **What would make this ≥90%:** Successful dry-run with zero conflicts
- **Rollout / rollback:**
  - Rollout: Run script once after API endpoints are deployed
  - Rollback: Truncate D1 tables (destructive; only in dev)
- **Documentation impact:**
  - None
- **Notes / references:**
  - Run this BEFORE enabling skills to use API (otherwise skills create new entities while markdown entities are missing)
  - Parser: Use gray-matter library consistent with existing codebase


#### Build Completion (2026-02-02)
- **Status:** Complete
- **Commits:** 2050ba5cba
- **TDD cycle:**
  - Test cases executed: TC-01, TC-02, TC-03, TC-04, TC-05
  - Red-green cycles: 2 (initial failure due to Jest module resolution; second run PASS)
  - Initial test run: FAIL (module resolution for @acme/platform-core/d1)
  - Post-implementation: PASS
- **Confidence reassessment:**
  - Original: 85%
  - Post-test: 85%
  - Delta reason: Tests validated assumptions; extra cycle due to runtime import resolution
- **Validation:**
  - Ran: `pnpm --filter business-os test --testPathPattern=backfill` — PASS (5 tests)
  - Ran: `pnpm --filter @apps/business-os typecheck` — PASS
  - Ran: `pnpm --filter @apps/business-os lint` — PASS (warnings only; pre-existing)
- **Documentation updated:** None
- **Implementation notes:** Added backfill script + tests; lazy-loaded `getD1FromGlobalThis` in CLI to avoid Jest module resolution errors.


### TASK-01: Create agent authentication middleware

- **Type:** IMPLEMENT
- **Affects:** `apps/business-os/src/lib/auth/agent-auth.ts` (new), `apps/business-os/src/lib/auth/middleware.ts`
- **Depends on:** -
- **Confidence:** 88%
  - Implementation: 90% — existing auth patterns in `getCurrentUserServer()` and `authorize.ts` provide clear template
  - Approach: 85% — API key header auth is standard pattern
  - Impact: 88% — isolated to new middleware; no changes to existing UI auth
- **Acceptance:**
  - Middleware reads `X-Agent-API-Key` header and validates against `BOS_AGENT_API_KEY` env var
  - Returns 401 if missing/invalid, proceeds if valid
  - Sets `actor: "agent"` for audit logging
  - Works in edge runtime (no Node.js crypto dependencies)
  - **Never logs or includes API key in error responses**
  - **Security hardening requirements:**
    - Constant-time comparison using `crypto.subtle.timingSafeEqual` (WebCrypto API for edge runtime)
    - Rate limiting: 100 requests/minute per key (use Cloudflare rate limiting or in-memory counter)
    - Key format: minimum 32 characters, alphanumeric + special chars
    - Failed auth attempts logged (without revealing key) for security monitoring
- **Test contract:**
  - **TC-01:** Valid API key → request proceeds
    - Request with valid `X-Agent-API-Key` header → middleware returns `{ actor: "agent" }` → request continues
  - **TC-02:** Missing API key → 401 Unauthorized
    - Request without header → middleware returns 401 → response body does NOT contain key
  - **TC-03:** Invalid API key → 401 Unauthorized
    - Request with wrong key → middleware returns 401 → no timing leak (constant-time compare)
  - **TC-04:** Timing-safe comparison → crypto.subtle.timingSafeEqual used
    - Mock crypto.subtle → verify timingSafeEqual called (not === or localeCompare)
  - **TC-05:** Rate limiting → excessive requests blocked
    - Send 101 requests in 60s → 101st request returns 429 Too Many Requests
  - **Acceptance coverage:** TC-01,02,03 cover auth flow; TC-04 covers security hardening; TC-05 covers rate limiting
  - **Test type:** Unit (middleware tests with mocked crypto)
  - **Test location:** `apps/business-os/src/lib/auth/agent-auth.test.ts` (new)
  - **Run:** `pnpm --filter business-os test --testPathPattern=agent-auth`
- **Planning validation:**
  - Tests run: `pnpm --filter business-os test --testPathPattern=auth` — existing auth tests pass
  - Test stubs written: N/A (S effort)
  - Unexpected findings: None
- **What would make this ≥90%:** Test the env var loading in Cloudflare Pages preview
- **Rollout / rollback:**
  - Rollout: Deploy middleware; no feature flag needed (endpoints don't exist yet)
  - Rollback: Remove middleware file; dependent endpoints return 404
- **Documentation impact:**
  - Update skill docs with API key setup instructions
- **Notes / references:**
  - Pattern: `apps/business-os/src/lib/auth/authorize.ts`
  - Env var: `BOS_AGENT_API_KEY` — set in `.env.local` locally, Cloudflare Pages secret in prod
  - Edge-compatible timing-safe compare: Use TextEncoder to convert strings to Uint8Array for `crypto.subtle.timingSafeEqual`


#### Build Completion (2026-02-02)
- **Status:** Complete
- **Commits:** 3a30afa364
- **TDD cycle:**
  - Test cases executed: TC-01, TC-02, TC-03, TC-04, TC-05
  - Red-green cycles: 2 (initial failure due to console.warn test guard; second run PASS)
  - Initial test run: FAIL (unexpected console.warn)
  - Post-implementation: PASS
- **Confidence reassessment:**
  - Original: 88%
  - Post-test: 88%
  - Delta reason: Tests validated assumptions
- **Validation:**
  - Ran: `pnpm --filter business-os test --testPathPattern=agent-auth` — PASS (5 tests)
  - Ran: `pnpm --filter @apps/business-os typecheck` — PASS
  - Ran: `pnpm --filter @apps/business-os lint` — PASS (warnings only; pre-existing)
- **Documentation updated:** None
- **Implementation notes:** Added agent auth middleware with timing-safe compare, rate limiting, and format validation; exported from auth middleware; added unit tests.


### TASK-02: Create `/api/agent/cards` endpoint (GET/POST/PATCH)

- **Type:** IMPLEMENT
- **Affects:** `apps/business-os/src/app/api/agent/cards/route.ts` (new), `apps/business-os/src/app/api/agent/cards/[id]/route.ts` (new), `packages/platform-core/src/repositories/businessOsCards.server.ts`, `docs/business-os/agent-workflows.md`
- **Depends on:** TASK-01
- **Confidence:** 85%
  - Implementation: 90% — existing `/api/cards` endpoints provide exact pattern to follow
  - Approach: 85% — mirrors UI endpoints with full CRUD
  - Impact: 80% — new endpoints; no changes to existing UI paths
- **Acceptance:**
  - GET `/api/agent/cards` returns list of cards (supports `?business=BRIK&lane=In+progress` filters)
  - GET `/api/agent/cards/:id` returns single card with `entitySha` (required for PATCH protocol)
  - POST `/api/agent/cards` creates card with API key auth
  - PATCH `/api/agent/cards/:id` updates card with optimistic concurrency (JSON Merge Patch)
  - PATCH supports field-level patching (see Concurrency Model section)
  - All endpoints record `actor: "agent"` in audit log
  - Request/response schemas match existing `/api/cards` endpoints **plus skill-required fields:**
    - `Feature-Slug` (string, optional) — for slug stability across fact-find → plan → build
    - `Last-Progress` (date string, optional) — for build-feature progress tracking
    - `Plan-Link` (string, optional) — for linking to plan documents
  - Returns 409 on conflict (baseEntitySha mismatch)
- **Test contract:**
  - **TC-01:** GET /api/agent/cards → list of cards returned
    - Authenticated request → returns array of cards with business filter support
  - **TC-02:** GET /api/agent/cards/:id → single card with entitySha
    - Request existing card ID → returns card object + `entitySha` field
  - **TC-03:** POST /api/agent/cards → card created with audit log
    - Valid card payload → 201 Created → audit log has `actor: "agent"`
  - **TC-04:** POST with Feature-Slug field → field persisted
    - Payload includes `Feature-Slug: my-feature` → GET returns card with Feature-Slug
  - **TC-05:** PATCH /api/agent/cards/:id → field-level update succeeds
    - PATCH with `{ patch: { Lane: "In progress" } }` → only Lane updated → other fields unchanged
  - **TC-06:** PATCH with stale baseEntitySha → 409 Conflict
    - PATCH with old SHA → returns 409 + current entity + currentEntitySha
  - **TC-07:** Missing auth → 401 Unauthorized
    - Request without X-Agent-API-Key → 401 returned
  - **Acceptance coverage:** TC-01,02 cover GET; TC-03,04 cover POST; TC-05,06 cover PATCH; TC-07 covers auth
  - **Test type:** Integration (API route tests with test database)
  - **Test location:** `apps/business-os/src/app/api/agent/cards/__tests__/route.test.ts` (new)
  - **Run:** `pnpm --filter business-os test --testPathPattern=agent/cards`
- **Planning validation:**
  - Tests run: Reviewed existing `/api/cards` routes for patterns
  - Test stubs written: N/A (M effort, patterns well-established)
  - Unexpected findings: None
- **What would make this ≥90%:** End-to-end test with actual WebFetch call from skill
- **Rollout / rollback:**
  - Rollout: Deploy endpoints; skills can use them
  - Rollback: Remove endpoint files; skills fail with clear error message (fail-closed)
- **Documentation impact:**
  - Add API documentation for agent endpoints
- **Notes / references:**
  - Pattern: `apps/business-os/src/app/api/cards/route.ts`
  - Zod schemas: `CreateCardSchema`, `UpdateCardSchema`


#### Re-plan Update (2026-02-02)
- **Previous confidence:** 85%
- **Updated confidence:** 85%
  - Implementation: 90% — API routes mirror existing `/api/cards` patterns; schema additions are straightforward.
  - Approach: 85% — same endpoint shape plus agent auth; JSON Merge Patch retained.
  - Impact: 80% — card schema change affects D1 payload validation; blast radius now explicit.
- **Investigation performed:**
  - Repo: `apps/business-os/src/app/api/cards/route.ts`, `apps/business-os/src/app/api/cards/[id]/route.ts`, `packages/platform-core/src/repositories/businessOsCards.server.ts`
- **Decision / resolution:**
  - Added card schema file to Affects so `Feature-Slug`, `Last-Progress`, `Plan-Link` can be stored/validated.
- **Changes to task:**
  - Affects: include card schema (`packages/platform-core/src/repositories/businessOsCards.server.ts`) and agent workflow doc (`docs/business-os/agent-workflows.md`).

#### Build Completion (2026-02-02)
- **Status:** Complete
- **Commits:** d80c9649ab
- **TDD cycle:**
  - Test cases executed: TC-01, TC-02, TC-03, TC-04, TC-05, TC-06, TC-07
  - Red-green cycles: 2 (initial failure due to missing agent card route module; second run PASS)
  - Initial test run: FAIL (module not found for `/api/agent/cards/[id]`)
  - Post-implementation: PASS
- **Confidence reassessment:**
  - Original: 85%
  - Post-test: 85%
  - Delta reason: Tests validated merge-patch and conflict behavior
- **Validation:**
  - Ran: `pnpm --filter business-os test --testPathPattern=agent/cards` — PASS (7 tests)
  - Ran: `pnpm --filter @apps/business-os typecheck` — PASS
  - Ran: `pnpm --filter @apps/business-os lint` — PASS (warnings only; pre-existing)
- **Documentation updated:** `docs/business-os/agent-workflows.md`
- **Implementation notes:** Added agent cards GET/POST/PATCH endpoints with merge-patch concurrency, conflict responses, audit logging (`actor: "agent"`), and card schema expansion for `Feature-Slug`, `Last-Progress`, `Plan-Link`.


### TASK-02a: Create `/api/agent/ideas` endpoint (GET/POST/PATCH)

- **Type:** IMPLEMENT
- **Affects:** `apps/business-os/src/app/api/agent/ideas/route.ts` (new), `apps/business-os/src/app/api/agent/ideas/[id]/route.ts` (new)
- **Depends on:** TASK-01
- **Confidence:** 85%
  - Implementation: 90% — follows same pattern as cards endpoint
  - Approach: 85% — mirrors UI ideas endpoint with full CRUD
  - Impact: 80% — new endpoint for idea creation/update by agents
- **Acceptance:**
  - GET `/api/agent/ideas` returns list of ideas (supports `?business=BRIK` filter)
  - GET `/api/agent/ideas/:id` returns single idea with `entitySha`
  - POST `/api/agent/ideas` creates idea with API key auth
  - PATCH `/api/agent/ideas/:id` updates idea with optimistic concurrency (JSON Merge Patch)
  - Records `actor: "agent"` in audit log
  - Supports location field (`inbox` | `worked`)
  - Returns 409 on conflict (baseEntitySha mismatch)
- **Test contract:**
  - **TC-01:** GET /api/agent/ideas → list of ideas returned
    - Authenticated request → returns array of ideas with business filter support
  - **TC-02:** GET /api/agent/ideas/:id → single idea with entitySha
    - Request existing idea ID → returns idea object + `entitySha` field
  - **TC-03:** POST /api/agent/ideas → idea created with audit log
    - Valid idea payload → 201 Created → audit log has `actor: "agent"`
  - **TC-04:** PATCH /api/agent/ideas/:id → field-level update succeeds
    - PATCH with `{ patch: { location: "worked" } }` → location updated → other fields unchanged
  - **TC-05:** PATCH with stale baseEntitySha → 409 Conflict
    - PATCH with old SHA → returns 409 + current entity + currentEntitySha
  - **TC-06:** Missing auth → 401 Unauthorized
    - Request without X-Agent-API-Key → 401 returned
  - **Acceptance coverage:** TC-01,02 cover GET; TC-03 covers POST; TC-04,05 cover PATCH; TC-06 covers auth
  - **Test type:** Integration (API route tests with test database)
  - **Test location:** `apps/business-os/src/app/api/agent/ideas/__tests__/route.test.ts` (new)
  - **Run:** `pnpm --filter business-os test --testPathPattern=agent/ideas`
- **Planning validation:**
  - Tests run: Reviewed existing `/api/ideas` route
  - Test stubs written: N/A (M effort — upgraded from S due to PATCH)
  - Unexpected findings: None
- **Rollout / rollback:**
  - Rollout: Deploy endpoint
  - Rollback: Remove endpoint; skills fail with clear error (fail-closed)
- **Documentation impact:**
  - Covered in TASK-08
- **Notes / references:**
  - Pattern: `apps/business-os/src/app/api/ideas/route.ts`

#### Build Completion (2026-02-02)
- **Status:** Complete
- **Commits:** 6c6acac83b
- **TDD cycle:**
  - Test cases executed: TC-01, TC-02, TC-03, TC-04, TC-05, TC-06
  - Red-green cycles: 2 (initial failure due to missing agent ideas route module; second run PASS)
  - Initial test run: FAIL (module not found for `/api/agent/ideas/[id]`)
  - Post-implementation: PASS
- **Confidence reassessment:**
  - Original: 85%
  - Post-test: 85%
  - Delta reason: Tests validated merge-patch and conflict behavior
- **Validation:**
  - Ran: `pnpm --filter business-os test --testPathPattern=agent/ideas` — PASS (6 tests)
  - Ran: `pnpm --filter @apps/business-os typecheck` — PASS
  - Ran: `pnpm --filter @apps/business-os lint` — PASS (warnings only; pre-existing)
- **Documentation updated:** None
- **Implementation notes:** Added agent ideas GET/POST/PATCH endpoints with merge-patch concurrency, conflict responses, audit logging (`actor: "agent"`), and location updates (`inbox`/`worked`).

### TASK-02b: Create `/api/agent/stage-docs` endpoint (GET/POST/PATCH)

- **Type:** IMPLEMENT
- **Affects:** `apps/business-os/src/app/api/agent/stage-docs/route.ts` (new), `apps/business-os/src/app/api/agent/stage-docs/[cardId]/[stage]/route.ts` (new)
- **Depends on:** TASK-01
- **Confidence:** 82%
  - Implementation: 85% — follows cards pattern but with composite key (cardId + stage)
  - Approach: 80% — stage docs have card-id + stage type as composite key
  - Impact: 80% — new endpoint; needed for `/fact-find` skill migration
- **Acceptance:**
  - GET `/api/agent/stage-docs` returns list of stage docs (supports `?cardId=BRIK-ENG-0021` filter)
  - GET `/api/agent/stage-docs/:cardId/:stage` returns single stage doc with `entitySha`
  - POST `/api/agent/stage-docs` creates stage doc with API key auth
  - PATCH `/api/agent/stage-docs/:cardId/:stage` updates stage doc with optimistic concurrency (JSON Merge Patch)
  - Requires `cardId` and `stage` (`fact-finding` | `planned` | `build` | `reflect`)
  - Validates that parent card exists
  - Records `actor: "agent"` in audit log
  - Returns 409 on conflict (baseEntitySha mismatch)
- **Test contract:**
  - **TC-01:** GET /api/agent/stage-docs → list of stage docs returned
    - Authenticated request → returns array with cardId filter support
  - **TC-02:** GET /api/agent/stage-docs/:cardId/:stage → single stage doc with entitySha
    - Request existing composite key → returns stage doc + `entitySha` field
  - **TC-03:** POST /api/agent/stage-docs → stage doc created with parent validation
    - Valid payload with existing card → 201 Created → audit log has `actor: "agent"`
  - **TC-04:** POST with non-existent card → 400 Bad Request
    - Payload references non-existent card ID → 400 error with "parent card not found"
  - **TC-05:** PATCH /api/agent/stage-docs/:cardId/:stage → field-level update succeeds
    - PATCH with content update → content updated → other fields unchanged
  - **TC-06:** PATCH with stale baseEntitySha → 409 Conflict
    - PATCH with old SHA → returns 409 + current entity + currentEntitySha
  - **TC-07:** Missing auth → 401 Unauthorized
    - Request without X-Agent-API-Key → 401 returned
  - **Acceptance coverage:** TC-01,02 cover GET; TC-03,04 cover POST with validation; TC-05,06 cover PATCH; TC-07 covers auth
  - **Test type:** Integration (API route tests with test database)
  - **Test location:** `apps/business-os/src/app/api/agent/stage-docs/__tests__/route.test.ts` (new)
  - **Run:** `pnpm --filter business-os test --testPathPattern=agent/stage-docs`
- **Planning validation:**
  - Tests run: Reviewed stage doc schema in types.ts
  - Test stubs written: N/A (M effort)
  - Unexpected findings: Stage docs are stored in subdirectories; API must handle path generation
- **What would make this ≥90%:** Test with `/fact-find` skill creating stage doc
- **Rollout / rollback:**
  - Rollout: Deploy endpoint
  - Rollback: Remove endpoint; skills fail with clear error (fail-closed)
- **Documentation impact:**
  - Covered in TASK-08
- **Notes / references:**
  - Stage doc locations: `docs/business-os/cards/{card-id}/{stage}.user.md`
  - Composite key: `(cardId, stage)` uniquely identifies a stage doc

#### Build Completion (2026-02-02)
- **Status:** Complete
- **Commits:** c032c3c1b4
- **TDD cycle:**
  - Test cases executed: TC-01, TC-02, TC-03, TC-04, TC-05, TC-06, TC-07, TC-08
  - Red-green cycles: 2 (initial failure due to missing agent stage-docs route module; second run PASS)
  - Initial test run: FAIL (module not found for `/api/agent/stage-docs/[cardId]/[stage]`)
  - Post-implementation: PASS
- **Confidence reassessment:**
  - Original: 82%
  - Post-test: 82%
  - Delta reason: Tests validated merge-patch and conflict behavior
- **Validation:**
  - Ran: `pnpm --filter business-os test --testPathPattern=agent/stage-docs` — PASS (8 tests)
  - Ran: `pnpm --filter @apps/business-os typecheck` — PASS
  - Ran: `pnpm --filter @apps/business-os lint` — PASS (warnings only; pre-existing)
- **Documentation updated:** None
- **Implementation notes:** Added agent stage-docs GET/POST/PATCH endpoints with merge-patch concurrency, conflict responses, audit logging (`actor: "agent"`), and parent card validation for POST.

### TASK-03: Create `/api/agent/allocate-id` endpoint

- **Type:** IMPLEMENT
- **Affects:** `apps/business-os/src/app/api/agent/allocate-id/route.ts` (new)
- **Depends on:** TASK-01
- **Confidence:** 90%
  - Implementation: 95% — `allocateNextCardId()` already exists in platform-core
  - Approach: 90% — simple wrapper endpoint
  - Impact: 85% — new endpoint; replaces scan-based allocation
- **Acceptance:**
  - POST `/api/agent/allocate-id` with `{ business: "BRIK", type: "card" }` returns `{ id: "BRIK-ENG-0024" }`
  - Supports `type: "card"` and `type: "idea"`
  - Uses existing `allocateNextCardId()` / `allocateNextIdeaId()` functions
  - API key auth required
- **Test contract:**
  - **TC-01:** POST with type=card → card ID allocated
    - `{ business: "BRIK", type: "card" }` → returns `{ id: "BRIK-ENG-XXXX" }`
  - **TC-02:** POST with type=idea → idea ID allocated
    - `{ business: "BRIK", type: "idea" }` → returns `{ id: "BRIK-OPP-XXXX" }`
  - **TC-03:** Sequential allocations → monotonically increasing IDs
    - Two consecutive calls → second ID > first ID
  - **TC-04:** Missing auth → 401 Unauthorized
    - Request without X-Agent-API-Key → 401 returned
  - **Acceptance coverage:** TC-01,02 cover ID allocation; TC-03 covers atomicity; TC-04 covers auth
  - **Test type:** Unit (endpoint test with mocked repository)
  - **Test location:** `apps/business-os/src/app/api/agent/allocate-id/__tests__/route.test.ts` (new)
  - **Run:** `pnpm --filter business-os test --testPathPattern=allocate-id`
- **Planning validation:**
  - Tests run: Reviewed `businessOsIds.server.ts` — counter-based allocation is atomic
  - Test stubs written: N/A (S effort)
  - Unexpected findings: None
- **Rollout / rollback:**
  - Rollout: Deploy endpoint; update skills to use it
  - Rollback: Remove endpoint; skills fail with clear error (fail-closed, not fallback to scan)
- **Documentation impact:**
  - None (covered in TASK-08)
- **Notes / references:**
  - Implementation: `packages/platform-core/src/repositories/businessOsIds.server.ts`

#### Build Completion (2026-02-02)
- **Status:** Complete
- **Commits:** 7abcf536ce
- **TDD cycle:**
  - Test cases executed: TC-01, TC-02, TC-03, TC-04
  - Red-green cycles: 2 (initial failure due to missing allocate-id route module; second run PASS)
  - Initial test run: FAIL (module not found for `/api/agent/allocate-id`)
  - Post-implementation: PASS
- **Confidence reassessment:**
  - Original: 90%
  - Post-test: 90%
  - Delta reason: Tests validated allocation paths
- **Validation:**
  - Ran: `pnpm --filter business-os test --testPathPattern=allocate-id` — PASS (4 tests)
  - Ran: `pnpm --filter @apps/business-os typecheck` — PASS
  - Ran: `pnpm --filter @apps/business-os lint` — PASS (warnings only; pre-existing)
- **Documentation updated:** None
- **Implementation notes:** Added agent allocate-id POST endpoint with auth, business validation, and card/idea ID allocation.

### TASK-04: Create `/api/board-changes` cursor-based delta endpoint

- **Type:** IMPLEMENT
- **Affects:** `apps/business-os/src/app/api/board-changes/route.ts` (new)
- **Depends on:** -
- **Confidence:** 82%
  - Implementation: 85% — query pattern clear; need to join audit_log with entity tables
  - Approach: 85% — cursor-based delta is specified in fact-find
  - Impact: 75% — UI polling will need update to use new endpoint
- **Acceptance:**
  - GET `/api/board-changes?cursor=12345&business=BRIK` returns changes since cursor
  - Response includes `{ cursor: <latest_audit_id>, changes: { cards: [...], ideas: [...], stage_docs: [...] } }`
  - When `cursor=0` or omitted, returns all entities + latest cursor
  - Filters by business when provided
- **Test contract:**
  - **TC-01:** GET with cursor=0 → all entities returned
    - `GET /api/board-changes?cursor=0` → returns all cards, ideas, stage docs + latest cursor
  - **TC-02:** GET with valid cursor → only changes since cursor
    - Create entity → note cursor → create another → GET with old cursor → only new entity returned
  - **TC-03:** GET with business filter → filtered results
    - `GET /api/board-changes?cursor=0&business=BRIK` → only BRIK entities returned
  - **TC-04:** Response includes latest cursor → can be used for next poll
    - Response has `cursor` field → subsequent call with that cursor returns empty changes
  - **TC-05:** Stale cursor (audit log trimmed) → error response with reset instruction
    - GET with very old cursor → error with `code: "CURSOR_STALE"` + current cursor
  - **Acceptance coverage:** TC-01 covers initial load; TC-02,04 cover incremental polling; TC-03 covers filtering; TC-05 covers edge case
  - **Test type:** Integration (API route tests with test database)
  - **Test location:** `apps/business-os/src/app/api/board-changes/__tests__/route.test.ts` (new)
  - **Run:** `pnpm --filter business-os test --testPathPattern=board-changes`
- **Planning validation:**
  - Tests run: Reviewed `board-version/route.ts` for existing query patterns
  - Test stubs written: N/A (M effort)
  - Unexpected findings: Current board-version uses `updated_at` timestamp; migration to audit_log.id needed
- **What would make this ≥90%:** Validate audit_log schema has appropriate indexes
- **Rollout / rollback:**
  - Rollout: Deploy alongside existing board-version; UI switches when ready
  - Rollback: UI falls back to board-version endpoint
- **Documentation impact:**
  - None (internal API)
- **Notes / references:**
  - Cursor contract: Fact-find section "Cursor contract (Phase 1)"

#### Build Completion (2026-02-02)
- **Status:** Complete
- **Commits:** 49d9746cb9
- **TDD cycle:**
  - Test cases executed: TC-01, TC-02, TC-03, TC-04, TC-05
  - Red-green cycles: 1
  - Initial test run: FAIL (expected — endpoint not implemented)
  - Post-implementation: PASS
- **Confidence reassessment:**
  - Original: 82%
  - Post-test: 82%
  - Delta reason: Tests validated cursor + filter behavior
- **Validation:**
  - Ran: `pnpm --filter business-os test --testPathPattern=board-changes` — PASS (5 tests)
  - Ran: `pnpm --filter @apps/business-os typecheck` — PASS
  - Ran: `pnpm exec eslint apps/business-os/src/app/api/board-changes/route.ts apps/business-os/src/app/api/board-changes/__tests__/route.test.ts` — PASS
- **Documentation updated:** None
- **Implementation notes:** Added `/api/board-changes` endpoint with full vs delta responses, stale cursor handling, business filters, and audit-log-based cursor changes.


### TASK-04b: Wire UI to `/api/board-changes` endpoint

- **Type:** IMPLEMENT
- **Affects:** `apps/business-os/src/components/board/useBoardAutoRefresh.ts`, `apps/business-os/src/components/board/BoardView.tsx`
- **Depends on:** TASK-04
- **Confidence:** 82%
  - Implementation: 85% — update polling hook to use new endpoint
  - Approach: 82% — incremental migration; fallback documented
  - Impact: 80% — UI behavior change; test contract covers key scenarios
- **Acceptance:**
  - UI uses `/api/board-changes?cursor=<last_cursor>` for polling
  - Stores cursor in local state; persists across page refresh (localStorage)
  - On cursor=0 (initial load), fetches all entities
  - Merges incremental changes into board state
  - Falls back to full refresh if cursor is stale (server returns error)
- **Test contract:**
  - **TC-01:** Initial load (cursor=0) → fetches all entities
    - First page load → `GET /api/board-changes?cursor=0` → returns all cards/ideas
  - **TC-02:** Incremental poll → fetches only changes
    - After initial load with cursor=100 → subsequent poll uses cursor=100 → returns only changes since 100
  - **TC-03:** Cursor persisted → survives page refresh
    - Store cursor in localStorage → refresh page → next poll uses stored cursor
  - **TC-04:** Incremental merge → board state updated correctly
    - Card moved in another tab → poll returns change → board UI reflects new lane
  - **TC-05:** Stale cursor → full refresh fallback
    - Server returns "cursor too old" error → UI resets to cursor=0 and refetches all
  - **Test type:** Unit (merge logic) + Integration (polling behavior)
  - **Test location:** `apps/business-os/src/components/board/useBoardAutoRefresh.test.ts` (new)
  - **Run:** `pnpm --filter business-os test --testPathPattern=useBoardData`
- **Planning validation:**
  - Tests run: Reviewed `useBoardAutoRefresh.ts` (polling hook) and `BoardView.tsx` integration
  - Test stubs written: N/A (S effort)
  - Unexpected findings: Existing polling uses `/api/board-version`; can be swapped to cursor-based `/api/board-changes`
- **Rollout / rollback:**
  - Rollout: Deploy UI changes; existing endpoint remains available
  - Rollback: Revert to board-version polling
- **Documentation impact:**
  - None
- **Notes / references:**
  - Current hook: `apps/business-os/src/components/board/useBoardAutoRefresh.ts`

#### Build Completion (2026-02-02)
- **Status:** Complete
- **Commits:** 3c695340c0
- **TDD cycle:**
  - Test cases executed: TC-01, TC-02, TC-03, TC-04, TC-05
  - Red-green cycles: 2 (initial tests timed out due to polling loop; resolved with cursor ref + test waitFor)
  - Initial test run: FAIL (hook test timeouts)
  - Post-implementation: PASS
- **Confidence reassessment:**
  - Original: 82%
  - Post-test: 82%
  - Delta reason: Tests validated cursor persistence + refresh triggers
- **Validation:**
  - Ran: `pnpm --filter business-os test --testPathPattern=useBoardAutoRefresh` — PASS (5 tests)
  - Ran: `pnpm exec eslint apps/business-os/src/components/board/useBoardAutoRefresh.ts apps/business-os/src/components/board/useBoardAutoRefresh.test.ts` — PASS
  - Not run: `pnpm --filter @apps/business-os typecheck` (per instruction to avoid repo-wide checks outside edited files)
- **Documentation updated:** None
- **Implementation notes:** Switched polling to `/api/board-changes` with cursor state + localStorage persistence; triggers `router.refresh()` on changes or stale cursor reset.


### TASK-05: Implement deterministic D1→markdown serializer

- **Type:** IMPLEMENT
- **Affects:** `apps/business-os/src/lib/export/serializer.ts` (new), `apps/business-os/src/lib/export/serializer.test.ts` (new)
- **Depends on:** -
- **Confidence:** 82%
  - Implementation: 85% — gray-matter library for YAML; clear rules specified below
  - Approach: 82% — determinism rules specified; test contract covers round-trip validation
  - Impact: 80% — must match existing markdown structure; TC-05 validates compatibility
- **Acceptance:**
  - `serializeCard(card: Card): { userMd: string, agentMd: string }` produces deterministic output
  - `serializeIdea(idea: Idea): string` produces deterministic output
  - `serializeStageDoc(stageDoc: StageDoc): string` produces deterministic output
  - **Determinism canonicalization rules:**
    - YAML frontmatter:
      - Keys sorted alphabetically (case-insensitive)
      - Dates as `YYYY-MM-DD` (no time component)
      - `null` and `undefined` values omitted entirely
      - Strings: use plain style unless special characters require quoting
      - Quoting: prefer double quotes when quoting required; never use single quotes for consistency
      - Nested objects: keys sorted at each level
      - Arrays: maintain source order (arrays are not sorted)
      - Booleans: lowercase `true`/`false`
      - Numbers: no leading zeros, no trailing zeros after decimal
    - Markdown body:
      - Unix line endings (`\n`, never `\r\n`)
      - No trailing whitespace on any line
      - Exactly one trailing newline at end of file
      - Heading levels preserved from source
      - List indentation: 2 spaces per level
    - File-level:
      - UTF-8 encoding without BOM
      - No invisible unicode characters
  - Round-trip test: `D1 → markdown → parse → D1` produces identical `payload_json`
- **Test contract:**
  - **TC-01:** Card serialization → deterministic output
    - Same card entity → identical markdown bytes on repeated serialization
    - `serializeCard(card)` twice → output1 === output2
  - **TC-02:** YAML key ordering → alphabetical
    - Card with keys {Z, A, M} → frontmatter has keys in order A, M, Z
  - **TC-03:** Date normalization → YYYY-MM-DD only
    - Card with `Created: "2026-02-02T14:30:00Z"` → serializes as `Created: 2026-02-02`
  - **TC-04:** Null/undefined → omitted
    - Card with `Priority: null` → no Priority key in frontmatter
  - **TC-05:** Round-trip → identical payload_json
    - D1 card → serialize → parse → compare payload_json → identical
  - **TC-06:** Unicode handling → preserved correctly
    - Card title "Café ☕ émoji" → roundtrips without corruption
  - **TC-07:** Line endings → Unix only
    - All output uses `\n`, never `\r\n`
  - **TC-08:** Trailing whitespace → none
    - No lines end with spaces or tabs
  - **Test type:** Unit (pure function tests)
  - **Test location:** `apps/business-os/src/lib/export/serializer.test.ts` (new)
  - **Run:** `pnpm --filter business-os test --testPathPattern=serializer`
- **Planning validation:**
  - Tests run: Reviewed `entity-sha.ts` for stable JSON serialization pattern
  - Test stubs written: N/A (M effort)
  - Unexpected findings: Need to handle `.agent.md` derivation rules from fact-find
- **What would make this ≥90%:** Validate against 10+ existing cards to ensure format compatibility
- **Rollout / rollback:**
  - Rollout: Used by export job only; no direct impact until job is enabled
  - Rollback: Disable export job
- **Documentation impact:**
  - None
- **Notes / references:**
  - Serialization rules: These canonicalization rules supersede any conflicting guidance in fact-find

#### Build Completion (2026-02-02)
- **Status:** Complete
- **Commits:** bde036fab9
- **TDD cycle:**
  - Test cases executed: TC-01, TC-02, TC-03, TC-04, TC-05, TC-06, TC-07, TC-08
  - Red-green cycles: 3 (initial test parse errors from escaped strings; round-trip mismatch resolved with normalized parse)
  - Initial test run: FAIL (serializer test syntax/round-trip issues)
  - Post-implementation: PASS
- **Confidence reassessment:**
  - Original: 82%
  - Post-test: 82%
  - Delta reason: Tests validated deterministic serialization and normalization rules
- **Validation:**
  - Ran: `pnpm --filter business-os test --testPathPattern=serializer` — PASS (8 tests)
  - Ran: `pnpm exec eslint apps/business-os/src/lib/export/serializer.ts apps/business-os/src/lib/export/serializer.test.ts` — PASS
  - Not run: `pnpm --filter @apps/business-os typecheck` (per instruction to avoid repo-wide checks outside edited files)
- **Documentation updated:** None
- **Implementation notes:** Added deterministic YAML/frontmatter serializer with date normalization, content canonicalization, and agent-doc template; round-trip test uses stable key ordering to compare payloads.


### TASK-05a: Create `/api/admin/export-snapshot` endpoint

- **Type:** IMPLEMENT
- **Affects:** `apps/business-os/src/app/api/admin/export-snapshot/route.ts` (new)
- **Depends on:** TASK-05
- **Confidence:** 85%
  - Implementation: 90% — query all entities, serialize, return JSON
  - Approach: 85% — read-only endpoint with separate auth
  - Impact: 80% — new endpoint, CI-only access
- **Acceptance:**
  - GET `/api/admin/export-snapshot` returns all Business OS entities serialized as markdown
  - Auth via `X-Export-API-Key` header (separate from agent API key)
  - **Response format:**
    ```json
    {
      "exportId": "<uuid>",
      "timestamp": "2026-02-02T14:00:00Z",
      "auditCursor": 12345,
      "cards": [
        {
          "id": "BRIK-ENG-0021",
          "path": "docs/business-os/cards/BRIK-ENG-0021.user.md",
          "content": "---\nType: Card\n...\n---\n\n# Card Title\n...\n",
          "agentPath": "docs/business-os/cards/BRIK-ENG-0021.agent.md",
          "agentContent": "---\nType: Card\n...\n---\n\n## Card: BRIK-ENG-0021\n..."
        }
      ],
      "ideas": [
        {
          "id": "BRIK-OPP-0003",
          "path": "docs/business-os/ideas/inbox/BRIK-OPP-0003.user.md",
          "content": "..."
        }
      ],
      "stageDocs": [
        {
          "cardId": "BRIK-ENG-0021",
          "stage": "fact-finding",
          "path": "docs/business-os/cards/BRIK-ENG-0021/fact-finding.user.md",
          "content": "..."
        }
      ]
    }
    ```
  - **Content format:** Pre-serialized markdown strings (not raw JSON entities)
  - **Path format:** Full relative paths from repo root
  - **Coupling constraint:** Export includes `auditCursor` for incremental export in Phase 2
  - Pagination not required at current scale (~500 entities)
- **Test contract:**
  - **TC-01:** GET with valid auth → complete snapshot returned
    - Request with `X-Export-API-Key` → returns exportId, timestamp, auditCursor, cards, ideas, stageDocs
  - **TC-02:** Response paths match directory structure
    - Card path is `docs/business-os/cards/{id}.user.md`; agentPath is `docs/business-os/cards/{id}.agent.md`
  - **TC-03:** Content is pre-serialized markdown
    - `cards[0].content` is valid markdown string (starts with `---`); not raw JSON
  - **TC-04:** Missing/invalid auth → 401 Unauthorized
    - Request without `X-Export-API-Key` or with agent API key → 401 returned
  - **TC-05:** auditCursor matches latest audit log entry
    - Create entity → export → auditCursor equals latest audit_log.id
  - **Acceptance coverage:** TC-01,02,03 cover response format; TC-04 covers auth separation; TC-05 covers cursor
  - **Test type:** Integration (API route tests with test database)
  - **Test location:** `apps/business-os/src/app/api/admin/export-snapshot/__tests__/route.test.ts` (new)
  - **Run:** `pnpm --filter business-os test --testPathPattern=export-snapshot`
- **Planning validation:**
  - Tests run: N/A (new endpoint)
  - Test stubs written: N/A (S effort)
  - Unexpected findings: None
- **Rollout / rollback:**
  - Rollout: Deploy endpoint; only CI can call it
  - Rollback: Remove endpoint; export job fails (acceptable during dev)
- **Documentation impact:**
  - None (internal API)
- **Notes / references:**
  - Separate secret: `BOS_EXPORT_API_KEY` (GitHub Actions secret only)
  - Content is pre-serialized markdown; CI job writes directly to files without transformation

### TASK-06: Create git export CI job (PR-based, hourly)

- **Type:** IMPLEMENT
- **Affects:** `.github/workflows/bos-export.yml` (new), `apps/business-os/src/scripts/export-to-pr.ts` (new)
- **Depends on:** TASK-05a
- **Confidence:** 82%
  - Implementation: 85% — GitHub Actions scheduled workflow with PR creation
  - Approach: 80% — PR-based approach is more secure than direct commits
  - Impact: 80% — creates PRs to main; requires auto-merge setup
- **Acceptance:**
  - Workflow runs hourly on schedule
  - Calls `GET /api/admin/export-snapshot` with `BOS_EXPORT_API_KEY`
  - Creates branch `bos-export/<timestamp>` (e.g., `bos-export/2026-02-02T14-00`)
  - Writes serialized markdown to `docs/business-os/`
  - Opens PR with title: `chore(bos): export D1 snapshot [changed: BRIK-ENG-0021, ...]`
  - **PR body includes workflow-verifiable marker:**
    ```markdown
    Export-Run-ID: ${{ github.run_id }}
    Export-Timestamp: 2026-02-02T14:00:00Z
    Audit-Cursor: 12345

    ## Changes
    - BRIK-ENG-0021: Updated Lane from Inbox to In progress
    - ...
    ```
  - PR author: workflow bot identity (`github-actions[bot]`)
  - Auto-merges if CI passes (uses `gh pr merge --auto --squash`)
  - Skips PR if no changes (empty diff)
- **Test contract:**
  - **TC-01:** Export script → files written to correct paths
    - Mock API response with 2 cards → script writes to `docs/business-os/cards/{id}.user.md` and `.agent.md`
  - **TC-02:** No changes → no PR created
    - Export produces identical files → script exits with "no changes" message → no branch created
  - **TC-03:** Changes detected → PR created with correct title
    - Export produces different files → PR created with title matching `chore(bos): export D1 snapshot [changed: ...]`
  - **TC-04:** PR body includes Export-Run-ID marker
    - Created PR body contains `Export-Run-ID: ${{ github.run_id }}`
  - **TC-05:** Auto-merge enabled on PR
    - `gh pr merge --auto --squash` called after PR creation
  - **TC-06:** API call fails → script fails with clear error
    - API returns 500 → script exits non-zero with error message
  - **Acceptance coverage:** TC-01 covers file writing; TC-02,03 cover PR creation logic; TC-04 covers marker; TC-05 covers auto-merge; TC-06 covers error handling
  - **Test type:** Unit (script tests with mocked API) + Manual validation (workflow dispatch)
  - **Test location:** `apps/business-os/src/scripts/export-to-pr.test.ts` (new)
  - **Run:** `pnpm --filter business-os test --testPathPattern=export-to-pr`
- **Planning validation:**
  - Tests run: N/A (CI workflow)
  - Test stubs written: N/A (M effort)
  - Unexpected findings: Need to configure auto-merge for export PRs
- **What would make this ≥90%:** Successful manual dispatch on feature branch
- **Rollout / rollback:**
  - Rollout: Merge workflow file; enable schedule
  - Rollback: Disable workflow schedule
- **Documentation impact:**
  - Add README to `docs/business-os/` explaining generated nature
- **Notes / references:**
  - Git attribution: PR author is workflow identity, not spoofable git author string

### TASK-07: Add CI guard + branch protection for `docs/business-os/`

- **Type:** IMPLEMENT
- **Affects:** `.github/workflows/ci.yml`, `.github/workflows/bos-export.yml`, GitHub repository settings
- **Depends on:** TASK-06
- **Confidence:** 85%
  - Implementation: 90% — CI check + branch protection rules
  - Approach: 85% — workflow-verifiable marker is secure
  - Impact: 80% — may block valid PRs during transition; need clear error message
- **Acceptance:**
  - **Branch protection (manual setup):**
    - Require PRs for `main` (no direct pushes)
    - Require status checks to pass (including BOS mirror guard)
    - Disallow force pushes
  - **Export-Run-ID marker (workflow-verifiable):**
    - Export workflow writes `Export-Run-ID: <github.run_id>` in PR body
    - This ID is workflow-generated and cannot be forged by manual PRs
  - **CI guard:**
    - If PR modifies `docs/business-os/**` (excluding allowlist), check:
      1. PR branch matches `bos-export/*`
      2. PR actor is the workflow bot identity (`github-actions[bot]`)
      3. PR body contains `Export-Run-ID: <run_id>` where `<run_id>` matches a valid workflow run
    - Validation: CI calls `gh api /repos/{owner}/{repo}/actions/runs/{run_id}` to verify run exists and completed successfully
    - If all conditions met → pass
    - If any condition fails → fail with message: "Business OS data is managed in D1. Use the UI or API. Manual edits to docs/business-os/ are not allowed."
  - **Allowlist (direct writes permitted):**
    - `docs/business-os/README.md` (documentation)
    - `docs/business-os/business-os-charter.md` (documentation)
    - `docs/business-os/MANUAL_EDITS.md` (audit log)
    - `docs/business-os/scans/**` (scan-repo skill output — metadata only)
    - `docs/business-os/strategy/**` (update-business-plan skill — reference docs)
    - `docs/business-os/people/**` (update-people skill — reference docs)
- **Test contract:**
  - **TC-01:** Export PR (valid) → CI guard passes
    - PR from `bos-export/*` branch by `github-actions[bot]` with valid Export-Run-ID → guard passes
  - **TC-02:** Manual edit to cards/ → CI guard fails
    - PR modifying `docs/business-os/cards/` without export markers → guard fails with clear message
  - **TC-03:** Forged Export-Run-ID → CI guard fails
    - PR with fake Export-Run-ID (invalid workflow run) → API validation fails → guard fails
  - **TC-04:** Allowlist paths → CI guard passes
    - PR modifying only `docs/business-os/README.md` → guard passes (not blocked)
  - **TC-05:** Mixed allowlist + blocked paths → CI guard fails
    - PR modifying both `README.md` and `cards/` → guard fails (blocked path takes precedence)
  - **TC-06:** Excluded skill paths → CI guard passes
    - PR modifying `docs/business-os/scans/` or `docs/business-os/strategy/` → guard passes
  - **Acceptance coverage:** TC-01 covers export flow; TC-02,03 cover block scenarios; TC-04,05,06 cover allowlist
  - **Test type:** Integration (GitHub Actions workflow test) + Manual validation
  - **Test location:** `.github/workflows/ci.yml` (inline step) + manual PR tests
  - **Run:** Create test PRs and verify CI outcomes
- **Planning validation:**
  - Tests run: N/A (CI config)
  - Test stubs written: N/A (M effort)
  - Unexpected findings: None
- **Rollout / rollback:**
  - Rollout: Add CI check after export job is running; configure branch protection
  - Rollback: Remove CI check; revert branch protection
- **Documentation impact:**
  - None
- **Notes / references:**
  - **Key insight:** Export-Run-ID is workflow-generated; forging requires access to workflow secrets
  - **Why not labels:** Labels can be added by any collaborator; Run-ID requires workflow execution

### TASK-08: Update `card-operations.md` to use agent API

- **Type:** IMPLEMENT
- **Affects:** `.claude/skills/_shared/card-operations.md`
- **Depends on:** TASK-02, TASK-02a, TASK-02b, TASK-03
- **Confidence:** 85%
  - Implementation: 90% — documentation update with WebFetch examples
  - Approach: 85% — direct HTTP is clean
  - Impact: 80% — all card-creating skills inherit this change
- **Acceptance:**
  - Replace scan-based ID allocation with `/api/agent/allocate-id` call
  - Replace `Write` tool usage with WebFetch to `/api/agent/cards`, `/api/agent/ideas`, `/api/agent/stage-docs`
  - Include API key header setup instructions
  - Include `BOS_AGENT_API_BASE_URL` configuration
  - Document fail-closed behavior: "If API call fails, stop with error; do NOT write markdown directly"
  - Mark old scan-based instructions as deprecated
- **Test contract:**
  - **TC-01:** Documentation includes API call examples → skills can follow pattern
    - Doc shows WebFetch to `/api/agent/cards` with correct headers and body
  - **TC-02:** Fail-closed behavior documented
    - Doc explicitly states: "If API call fails, stop with error; do NOT write markdown directly"
  - **TC-03:** Deprecated scan-based instructions marked
    - Old allocation code block marked with "DEPRECATED" comment
  - **Acceptance coverage:** TC-01 covers API pattern; TC-02 covers fail-closed; TC-03 covers deprecation
  - **Test type:** Manual review (documentation correctness)
  - **Test location:** `.claude/skills/_shared/card-operations.md`
  - **Run:** Manual review + invoke `/work-idea` skill to verify pattern works
- **Planning validation:**
  - Tests run: N/A (documentation)
  - Test stubs written: N/A (S effort)
  - Unexpected findings: None
- **Rollout / rollback:**
  - Rollout: Update docs; skills immediately use new pattern
  - Rollback: Revert docs (temporary fallback to old pattern during emergency only)
- **Documentation impact:**
  - This IS the documentation update
- **Notes / references:**
  - Current file: `.claude/skills/_shared/card-operations.md`

### TASK-09: Migrate `/work-idea` skill to API writes

- **Type:** IMPLEMENT
- **Affects:** `.claude/skills/work-idea/SKILL.md`
- **Depends on:** TASK-08
- **Confidence:** 82%
  - Implementation: 85% — follow updated `card-operations.md` pattern
  - Approach: 85% — straightforward skill update
  - Impact: 75% — first skill to migrate; validates the pattern
- **Acceptance:**
  - Skill creates cards via API instead of direct markdown writes
  - Skill creates ideas via API instead of direct markdown writes
  - Card visible in UI immediately after creation
  - Audit log shows `actor: "agent"`
  - **Fail-closed:** If API unavailable, skill fails with clear error message
- **Test contract:**
  - **TC-01:** Skill creates card via API → visible in UI
    - Invoke `/work-idea` → card created via POST `/api/agent/cards` → appears in UI within 30s
  - **TC-02:** Skill creates idea via API → visible in UI
    - Invoke `/work-idea` → idea created via POST `/api/agent/ideas` → appears in UI
  - **TC-03:** Audit log shows agent actor
    - After creation → audit_log entry has `actor: "agent"`
  - **TC-04:** API unavailable → skill fails with clear error
    - Set invalid API URL → skill errors with "API unavailable" message → no markdown written
  - **Acceptance coverage:** TC-01,02 cover API writes; TC-03 covers audit; TC-04 covers fail-closed
  - **Test type:** Integration (end-to-end skill invocation)
  - **Test location:** Manual validation during skill invocation
  - **Run:** Invoke `/work-idea` on test idea; verify in UI and audit log
- **Planning validation:**
  - Tests run: Reviewed skill structure
  - Test stubs written: N/A (M effort)
  - Unexpected findings: Skill creates both `.user.md` and `.agent.md` — API handles dual-file serialization
- **What would make this ≥90%:** Successful end-to-end test with real API
- **Rollout / rollback:**
  - Rollout: Update skill; immediate effect on next invocation
  - Rollback: Revert skill (emergency only; re-introduces drift)
- **Documentation impact:**
  - None (skill is self-documenting)
- **Notes / references:**
  - Skill: `.claude/skills/work-idea/SKILL.md`

### TASK-10: Migrate `/build-feature` skill to API writes

- **Type:** IMPLEMENT
- **Affects:** `.claude/skills/build-feature/SKILL.md`
- **Depends on:** TASK-08, TASK-02b
- **Confidence:** 82%
  - Implementation: 85% — follow pattern from TASK-09
  - Approach: 82% — skill edits card progress; optimistic concurrency pattern documented
  - Impact: 80% — progress updates become visible in UI; blast radius limited to card updates + stage docs
- **Acceptance:**
  - Skill updates card progress via PATCH API
  - Handles 409 conflicts: refetch current state, re-apply changes, retry once
  - Audit log shows task-level progress updates
  - **Start Build Transition (BOS integration):**
    - On first task start: PATCH card to set `Lane: In progress` (if currently `Planned`)
    - On first task start: POST `/api/agent/stage-docs` to create `build.user.md` stage doc
    - Update card's `Last-Progress` field with today's date
  - **Progress Updates (after each task):**
    - PATCH card to update `Last-Progress` field
    - PATCH stage doc to update build log and progress tracker
  - **Completion Transition:**
    - When all tasks complete: PATCH card to set `Proposed-Lane: Done`
  - **Fail-closed:** If API unavailable after retry, skill fails with clear error
- **Test contract:**
  - **TC-01:** First task start → lane transition Planned → In progress
    - Card at `Lane: Planned` → start first task → PATCH with `Lane: In progress` → 200 OK
  - **TC-02:** First task start → build stage doc created
    - No existing build stage doc → POST `/api/agent/stage-docs` → 201 Created
  - **TC-03:** Progress update → card Last-Progress updated in D1
    - Complete task → PATCH `/api/agent/cards/:id` with `Last-Progress: today` → 200 OK
  - **TC-04:** All tasks complete → Proposed-Lane set to Done
    - All IMPLEMENT tasks complete → PATCH with `Proposed-Lane: Done` → 200 OK
  - **TC-05:** Conflict (409) → retry succeeds
    - Concurrent UI edit → first PATCH returns 409 → skill refetches → retry PATCH → 200 OK
  - **TC-06:** Conflict retry fails → skill errors (fail-closed)
    - Double conflict → skill errors with "Conflict after retry" message
  - **TC-07:** API unavailable → skill errors (fail-closed)
    - Invalid API URL → skill errors with "API unavailable", no markdown written
  - **Test type:** Integration (skill invocation with real API)
  - **Test location:** Manual validation during build session
  - **Run:** Invoke `/build-feature` on test plan; verify API calls in D1 audit log
- **Planning validation:**
  - Tests run: Reviewed skill structure
  - Test stubs written: N/A (M effort)
  - Unexpected findings: Skill updates `Last-Progress` field; confirmed field is in update schema
- **What would make this ≥90%:** Conflict resolution tested end-to-end
- **Rollout / rollback:**
  - Rollout: Update skill
  - Rollback: Revert skill (emergency only)
- **Documentation impact:**
  - None
- **Notes / references:**
  - Skill: `.claude/skills/build-feature/SKILL.md`

### TASK-11: Migrate remaining skills (`/fact-find`, `/propose-lane-move`, etc.)

- **Type:** IMPLEMENT
- **Affects:**
  - `.claude/skills/fact-find/SKILL.md` (creates stage docs, cards)
  - `.claude/skills/plan-feature/SKILL.md` (creates/updates cards, stage docs)
  - `.claude/skills/propose-lane-move/SKILL.md` (updates card frontmatter)
  - `[readonly] .claude/skills/scan-repo/SKILL.md` (excluded — see notes)
  - `[readonly] .claude/skills/update-business-plan/SKILL.md` (excluded — see notes)
  - `[readonly] .claude/skills/update-people/SKILL.md` (excluded — see notes)
- **Depends on:** TASK-08
- **Confidence:** 82%
  - Implementation: 85% — follow established pattern from TASK-09/10
  - Approach: 82% — systematic update; excluded skills clarified
  - Impact: 80% — blast radius now fully mapped (see Re-plan Update)
- **Acceptance:**
  - All skills that create/edit cards use API instead of direct writes
  - All skills that create stage docs use `/api/agent/stage-docs`
  - Skills that only read cards are unaffected
  - No skill writes to `docs/business-os/cards/`, `docs/business-os/ideas/`, or `docs/business-os/cards/*/` directly
  - **Fail-closed:** All skills fail with clear error if API unavailable
  - **Excluded from migration:** scan-repo, update-business-plan, update-people (see notes)
  - **fact-find BOS integration:**
    - Uses `/api/agent/allocate-id` instead of scan-based allocation (replaces Step 2)
    - Uses POST `/api/agent/cards` to create card with `Feature-Slug` field (replaces Step 3)
    - Uses POST `/api/agent/stage-docs` to create fact-finding stage doc (replaces Step 4)
    - Reads `Feature-Slug` from card frontmatter for consistency (per Slug Stability rule)
  - **plan-feature BOS integration:**
    - Reads `Feature-Slug` from card frontmatter (not re-derived from title)
    - Uses PATCH `/api/agent/cards/:id` to update `Plan-Link` field
    - Uses POST `/api/agent/stage-docs` to create planned stage doc (if applicable)
  - **propose-lane-move BOS integration:**
    - Uses PATCH `/api/agent/cards/:id` to update `Proposed-Lane` field
- **Test contract:**
  - **TC-01:** fact-find allocates ID via API → no scan-based allocation
    - Invoke `/fact-find` with Business-Unit → calls POST `/api/agent/allocate-id` → returns valid ID
  - **TC-02:** fact-find creates card via API → card visible in UI
    - Invoke `/fact-find` → POST `/api/agent/cards` with `Feature-Slug` → card appears in UI
  - **TC-03:** fact-find creates stage doc via API → stage doc visible
    - Invoke `/fact-find` → POST `/api/agent/stage-docs` → fact-finding stage doc created
  - **TC-04:** plan-feature reads Feature-Slug from card → not re-derived
    - Card has `Feature-Slug: my-feature` → plan uses `my-feature-plan.md` (not derived from title)
  - **TC-05:** propose-lane-move updates Proposed-Lane via API → visible in UI
    - Invoke `/propose-lane-move` → PATCH card with `Proposed-Lane: Done` → UI shows proposal
  - **TC-06:** API unavailable → skill fails with clear error (fail-closed)
    - Set invalid API URL → skill errors with "API unavailable" message, no markdown written
  - **TC-07:** Conflict on PATCH → skill retries once
    - Simulate 409 response → skill refetches and retries
  - **Test type:** Integration (end-to-end skill invocation with real API)
  - **Test location:** Manual validation per skill; consider `apps/business-os/src/app/api/agent/**/*.test.ts` for API-side assertions
  - **Run:** Manual skill invocation + `pnpm --filter business-os test --testPathPattern=agent`
- **Planning validation:**
  - Tests run: Reviewed skill file list; identified all skills writing to Business OS
  - Unexpected findings: Three skills write to paths outside cards/ideas/stage-docs scope
- **What would make this ≥90%:** All skills tested end-to-end with real API; excluded skills verified as unaffected by CI guard
- **Rollout / rollback:**
  - Rollout: Update skills incrementally (fact-find first, then plan-feature, then propose-lane-move)
  - Rollback: Revert individual skills (emergency only)
- **Documentation impact:**
  - None
- **Notes / references:**
  - Skills directory: `.claude/skills/`
  - **Excluded skills rationale:** scan-repo, update-business-plan, update-people write to `docs/business-os/scans/`, `docs/business-os/strategy/`, `docs/business-os/people/` respectively. These are metadata/reference paths, not core business entities (cards/ideas/stage-docs). They are NOT migrated to D1 in this phase. TASK-07's CI guard allowlist must include these paths to avoid blocking these skills.

#### Re-plan Update (2026-02-02)
- **Previous confidence:** 78%
- **Updated confidence:** 82%
  - Implementation: 85% — pattern established by TASK-09/10
  - Approach: 82% — excluded skills clarified; scope well-defined
  - Impact: 80% — full skill inventory mapped; excluded paths identified
- **Investigation performed:**
  - Repo: Searched all skills for `docs/business-os` references
  - Found 8 skills total: build-feature, plan-feature, fact-find, process-emails, update-people, work-idea, scan-repo, update-business-plan
  - Categorized: 3 in TASK-11 scope, 2 in earlier tasks (TASK-09/10), 3 excluded (non-entity paths)
- **Decision / resolution:**
  - Skills writing to cards/ideas/stage-docs: migrate to API (in scope)
  - Skills writing to scans/strategy/people: exclude from migration, add paths to TASK-07 allowlist
  - This prevents scope creep while maintaining CI guard integrity
- **Changes to task:**
  - Affects: Added `[readonly]` entries for excluded skills
  - Acceptance: Added "Excluded from migration" clause
  - Test contract: Added TC-01 through TC-05 with specific scenarios
  - Notes: Added excluded skills rationale

### TASK-12: Update Business OS charter for D1-canonical reality

- **Type:** IMPLEMENT
- **Affects:** `docs/business-os/business-os-charter.md` (README.md to be created)
- **Depends on:** TASK-09
- **Confidence:** 90%
  - Implementation: 95% — documentation update
  - Approach: 90% — clear statement of D1-canonical architecture
  - Impact: 85% — affects how users understand the system
- **Acceptance:**
  - Charter reflects D1 as Source of Truth
  - Documents that markdown is a mirror, not the canonical store
  - Explains how to interact with Business OS (UI or API)
  - Removes references to direct markdown editing
  - Documents fail-closed behavior for agents
- **Test contract:**
  - **TC-01:** Charter reflects D1 as Source of Truth
    - Doc states "D1 is the single source of truth" or equivalent
  - **TC-02:** Markdown mirror nature documented
    - Doc states markdown is "read-only mirror" or "snapshot"
  - **TC-03:** No references to direct markdown editing
    - Search for "edit markdown" or "write to docs/" → zero matches
  - **Acceptance coverage:** TC-01,02,03 cover documentation accuracy
  - **Test type:** Manual review (documentation correctness)
  - **Test location:** `docs/business-os/business-os-charter.md`
  - **Run:** Manual review for content accuracy
- **Planning validation:**
  - Tests run: N/A (documentation)
  - Test stubs written: N/A (S effort)
  - Unexpected findings: None
- **Rollout / rollback:**
  - Rollout: Merge docs update
  - Rollback: Revert docs
- **Documentation impact:**
  - This IS the documentation update
- **Notes / references:**
  - Charter: `docs/business-os/business-os-charter.md`

### TASK-13: Remove deprecated `repo-writer.ts` and scan-based allocation

- **Type:** IMPLEMENT
- **Affects:** `apps/business-os/src/lib/repo-writer.ts`, `.claude/skills/_shared/card-operations.md`
- **Depends on:** TASK-11, TASK-06
- **Confidence:** 85%
  - Implementation: 90% — delete files; remove references
  - Approach: 85% — clean break after migration complete
  - Impact: 80% — breaking change for any unmigrated skills
- **Acceptance:**
  - `repo-writer.ts` deleted
  - Scan-based ID allocation removed from `card-operations.md`
  - CI guard catches any direct markdown writes
  - No imports of `repo-writer` remain in codebase
- **Test contract:**
  - **TC-01:** repo-writer.ts deleted → file does not exist
    - `ls apps/business-os/src/lib/repo-writer.ts` → "No such file"
  - **TC-02:** No imports of repo-writer remain
    - `rg repo-writer apps/` → zero matches
  - **TC-03:** Scan-based allocation removed from card-operations.md
    - Search card-operations.md for `MAX_ID=` → zero matches (old pattern gone)
  - **TC-04:** CI guard catches direct markdown writes
    - After removal, any skill attempting markdown write → CI guard blocks PR
  - **Acceptance coverage:** TC-01,02 cover file deletion; TC-03 covers doc cleanup; TC-04 covers guard verification
  - **Test type:** Manual verification (file system + grep checks)
  - **Test location:** `apps/business-os/src/lib/`, `.claude/skills/_shared/card-operations.md`
  - **Run:** `rg repo-writer apps/ && rg MAX_ID= .claude/skills/_shared/card-operations.md`
- **Planning validation:**
  - Tests run: N/A (removal)
  - Test stubs written: N/A (S effort)
  - Unexpected findings: `repo-writer.ts` may be used by sync endpoint — verify and update
- **Rollout / rollback:**
  - Rollout: Delete after all skills migrated and export job running
  - Rollback: Restore files (emergency only; re-introduces dual-write risk)
- **Documentation impact:**
  - None (covered in TASK-08)
- **Notes / references:**
  - File: `apps/business-os/src/lib/repo-writer.ts`

## Risks & Mitigations

- **Risk:** Agent API key leaked in logs or error messages
  - **Mitigation:** Redact API key from error responses; never log full key; review middleware code
- **Risk:** Export job creates invalid markdown that breaks skill parsing
  - **Mitigation:** Round-trip tests in TASK-05; validate against existing cards
- **Risk:** Skills fail during migration window (new API not ready)
  - **Mitigation:** Ship TASK-00/01/02/02a/02b/03 before updating skills; test incrementally
- **Risk:** Concurrent writes cause frequent 409 conflicts
  - **Mitigation:** Skills retry once on 409; field-level patching reduces conflict surface; audit log shows conflict frequency
- **Risk:** Manual edits bypass CI guard via direct push
  - **Mitigation:** Branch protection disallows direct pushes to main; all changes via PR
- **Risk:** Rollback to markdown writes re-introduces drift
  - **Mitigation:** Fail-closed policy; rollback is emergency-only with explicit acknowledgment of drift risk
- **Risk:** Timing attacks on API key validation
  - **Mitigation:** Constant-time comparison using `crypto.subtle.timingSafeEqual`
- **Risk:** Existing markdown entities not in D1 after migration
  - **Mitigation:** TASK-00 backfill runs before skills are migrated; dry-run validation
- **Risk:** Export-Run-ID forged in manual PR
  - **Mitigation:** CI validates run_id against GitHub API; invalid runs fail guard

## Observability

- Logging: All API calls logged with `actor`, `action`, `entity_id`
- Metrics: Audit log counts by action type (create, update, move)
- Alerts/Dashboards: None for Phase 1; add if conflict rate exceeds 5%

## Acceptance Criteria (overall)

- [ ] Existing markdown entities backfilled to D1 (TASK-00)
- [ ] Agent-created cards visible in UI within 30s
- [ ] Agent-edited cards visible in UI within 30s
- [ ] UI changes visible to agent API immediately
- [ ] UI polling uses cursor-based delta endpoint (TASK-04b)
- [ ] Git mirror PRs created hourly with deterministic output
- [ ] Export uses workflow-verifiable Export-Run-ID marker
- [ ] No ID collisions between UI and agent
- [ ] All skills use API instead of direct markdown writes
- [ ] API key validation uses constant-time comparison
- [ ] CI guard blocks PRs that manually modify `docs/business-os/`
- [ ] Branch protection prevents direct pushes to main
- [ ] Fail-closed: skills error (not fall back) when API unavailable

## Decision Log

- 2026-02-02: Agent identity model — Option A (generic API key) selected for simplicity
- 2026-02-02: Agent write interface — Option A (direct HTTP/WebFetch) selected for Phase 1
- 2026-02-02: Real-time notification — Phase 1 uses polling (≤30s); SSE deferred to Phase 2
- 2026-02-02: Export access — Dedicated `/api/admin/export-snapshot` endpoint with separate `BOS_EXPORT_API_KEY` (not reusing agent API key)
- 2026-02-02: Git mirror mechanism — PR-based workflow (not direct commits) for secure audit trail
- 2026-02-02: Failure mode — Fail-closed policy; skills error when API unavailable, no fallback to markdown
- 2026-02-02: PATCH semantics — JSON Merge Patch (RFC 7396) selected for simplicity over JSON Patch (RFC 6902)
- 2026-02-02: CI guard mechanism — Export-Run-ID (workflow-verifiable) selected over labels (label can be added by any collaborator)
- 2026-02-02: Export format — Pre-serialized markdown strings in JSON envelope (not raw JSON entities)
- 2026-02-02: API key validation — Constant-time comparison required; timing attacks prevented
- 2026-02-02 (re-plan): Skill migration scope — Skills writing to scans/, strategy/, people/ excluded from D1 migration. These paths added to CI guard allowlist. Rationale: These are reference/metadata paths, not core business entities; adding API endpoints would expand scope without proportional benefit.
- 2026-02-02 (skill review): API schema expansion — Added `Feature-Slug`, `Last-Progress`, `Plan-Link` fields to TASK-02 acceptance criteria. These fields are required by updated skill BOS integration: fact-find sets Feature-Slug on card creation; build-feature updates Last-Progress and performs lane transitions; plan-feature reads Feature-Slug for slug stability.
- 2026-02-02 (skill review): build-feature dependencies — Added TASK-02b dependency to TASK-10. build-feature creates build stage docs on first task start, requiring the stage-docs API endpoint.
- 2026-02-02 (re-plan TDD): Test contract compliance — Added TC-XX enumeration to all IMPLEMENT tasks per revised `/re-plan` TDD Compliance Requirement. Tasks TASK-00, TASK-01, TASK-02, TASK-02a, TASK-02b, TASK-03, TASK-04, TASK-05a, TASK-06, TASK-07, TASK-08, TASK-09, TASK-12, TASK-13 now have complete test contracts. All tasks meet minimum TC requirements (S: ≥1, M: ≥3).
