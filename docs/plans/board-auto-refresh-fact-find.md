---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Created: 2026-01-30
Last-updated: 2026-01-30
Feature-Slug: board-auto-refresh
Related-Plan: docs/plans/board-auto-refresh-plan.md
---

# Board Auto-Refresh Fact-Find Brief

## Scope
### Summary
Enable the Business OS board to automatically refresh when markdown document changes occur (cards, ideas, plans, stage docs). Currently, the board is a static snapshot at page load and requires manual refresh or `router.refresh()` calls after mutations.

User expectation: "Every time the status of documents changes, reflect those changes in what's presented on the board. This should include marking tasks as complete in ongoing work."

**Critical prerequisite (confirmed):** Business OS reads and writes must point at the *same* checkout. The codebase is designed around a dedicated git worktree for writes (`../base-shop-business-os-store`), but `RepoReader` reads from `repoRoot/docs/business-os` while `RepoWriter` writes under `worktreePath/docs/business-os`. The recommended approach is to **initialize the worktree** and then set `BUSINESS_OS_REPO_ROOT` to the worktree root so the entire Business OS stack (reader, writer, locks, ID allocation, queue/runs) uses a single filesystem + git view.

### Goals
- Auto-refresh board when card frontmatter changes (Lane, Priority, Owner, etc.)
- Auto-refresh board when ideas are created/moved
- Auto-refresh board when plan tasks complete (reflect in corresponding cards)
- Detect changes from both API mutations AND direct file edits
- Multi-user support: User A sees changes made by User B without manual refresh

### Non-goals
- Real-time collaboration cursors or presence indicators
- Conflict resolution UI (already exists via optimistic concurrency)
- Chat or comments auto-update (separate feature)
- Mobile push notifications

### Constraints & Assumptions
- Constraints:
  - Node.js runtime required (already the case for git operations)
  - Phase 0: Local-only, single-user (Pete) - but design for multi-user
  - Must handle worktree architecture (writes are committed in a dedicated worktree checkout)
  - Business OS repo root must be configurable (`BUSINESS_OS_REPO_ROOT`) so reads/writes align on the same checkout
  - No paid infrastructure ($0 constraint)
- Assumptions:
  - Polling overhead is acceptable for MVP (<100 clients)
  - 10-30 second refresh latency is acceptable (not sub-second real-time)
  - Changes are infrequent enough that polling won't cause performance issues

## Repo Audit (Current State)
### Entry Points
- `apps/business-os/src/app/boards/[businessCode]/page.tsx` — Server Component, loads board data at request time
- `apps/business-os/src/components/board/BoardView.tsx` — Client component, board UI (no auto-refresh)
- `apps/business-os/src/lib/get-repo-root.ts` — Central resolver for Business OS repo root (`BUSINESS_OS_REPO_ROOT` or dev inference)
- `apps/business-os/src/lib/repo-reader.ts` — Data access layer (async reads via `fs/promises`)
- `apps/business-os/src/lib/repo-writer.ts` — Mutation layer (writes + commits to worktree)
- Worktree bootstrap script — **Does not exist yet** (verified 2026-01-30); needs to be created as part of implementation

### Key Modules / Files
- `apps/business-os/src/components/agent-runs/RunStatus.tsx` — Example polling pattern (5s interval for agent status)
- `apps/business-os/src/lib/auth/authorize.ts` — Path-based allowlist; requires writes to be within `repoRoot` and under `docs/business-os/`
- `apps/business-os/src/lib/repo/RepoLock.ts` — Repo-level locking for concurrent writes (writes lock file under `docs/business-os/.locks/`)
- `apps/business-os/src/lib/board-logic.ts` — Board filtering and ordering logic
- `apps/business-os/src/lib/safe-fs.ts` — Root-bound FS helpers used by reader/writer

### Patterns & Conventions Observed
- **Server Components for data fetching** — evidence: `apps/business-os/src/app/boards/[businessCode]/page.tsx:15` (async function)
- **`router.refresh()` for manual refresh** — evidence: `apps/business-os/src/components/card-detail/CardDetail.tsx:74,101,128`
- **Client polling with `useEffect`** — evidence: `apps/business-os/src/components/agent-runs/RunStatus.tsx:40-60`
- **No file watchers in Business OS app** — repo search finds no `chokidar`/`fs.watch` usage under `apps/business-os/`
- **No SSE/WebSocket in Business OS app** — repo search finds no `EventSource`/WebSocket usage under `apps/business-os/`

### Critical Finding: Repo Root / Worktree Alignment

**Problem:** `RepoReader` and `RepoWriter` are designed to operate against a configurable `repoRoot`, but the writer’s default worktree is a *separate* checkout. Auto-refresh only works once the board is reading from the same checkout that receives writes.

**Evidence (code):**
- Reader root: `repoRoot/docs/business-os` (`apps/business-os/src/lib/repo-reader.ts:34`)
- Writer default worktree: `path.join(repoRoot, "../base-shop-business-os-store")` (`apps/business-os/src/lib/repo-writer.ts:80-83`)
- Write authorization requires the write target to be within `repoRoot` (`apps/business-os/src/lib/auth/authorize.ts:24-36`)
- `getRepoRoot()` supports overriding `repoRoot` via `BUSINESS_OS_REPO_ROOT` (`apps/business-os/src/lib/get-repo-root.ts:33-46`)

**Current local state (verified 2026-01-30):**
- `../base-shop-business-os-store` does not exist and is not in `git worktree list`, so `RepoWriter.isWorktreeReady()` fails and write API routes return a “worktree not initialized” error.

**Recommended approach (decision made):**
1. Create and run a worktree setup script to initialize `../base-shop-business-os-store` on branch `work/business-os-store`.
2. Set `BUSINESS_OS_REPO_ROOT` to the worktree root (e.g. `/Users/petercowling/base-shop-business-os-store`).

This makes `repoRoot === worktreePath` (by construction of the default worktree path), so reads/writes/locks/ID allocation all observe the same filesystem state and git HEAD.

**Scope boundary (important):** All Business OS reads and writes will use the worktree as the source of truth. Edits to the main repo checkout at `/Users/petercowling/base-shop/docs/business-os` will **not be visible** to the application when `BUSINESS_OS_REPO_ROOT` points to the worktree. This is by design for isolation.

### Data & Contracts
- Types/schemas:
  - `apps/business-os/src/lib/types.ts` — Card, Idea, Lane, Priority types
  - Frontmatter fields: Type, Lane, Priority, Owner, ID, Business, Tags, Due-Date, Created, Updated
- Persistence:
  - Cards: `docs/business-os/cards/*.user.md`
  - Ideas: `docs/business-os/ideas/inbox/*.user.md`, `ideas/worked/*.user.md`
  - Stage docs: `docs/business-os/cards/{ID}/*.user.md`
  - Businesses: `docs/business-os/strategy/businesses.json`
- API/event contracts:
  - Mutations: POST /api/cards, PATCH /api/cards/[id], POST /api/cards/claim, etc.
  - All mutations use `RepoWriter` and commit via git (worktree checkout)
  - UI patterns for showing fresh server data include `router.refresh()` (e.g., claim/accept/complete) and navigation back to server-rendered pages

### Dependency & Impact Map
- Upstream dependencies:
  - `gray-matter` — frontmatter parsing
  - `simple-git` — git operations
  - Next.js 15 Server Components + `router.refresh()`
  - Node.js `fs` module (via `safe-fs.ts`)
- Downstream dependents:
  - Board page (`/boards/[businessCode]`) — primary consumer
  - Card detail pages — show individual cards
  - "My Work" view — filtered card view
- Likely blast radius:
  - Low: Board refresh is additive feature, no breaking changes to existing code
  - Worktree configuration impacts *all* Business OS reads/writes (intentionally, once `BUSINESS_OS_REPO_ROOT` is set)
  - Multi-user: Need to detect changes from other users (not just local API mutations)

### Tests & Quality Gates
- Existing tests:
  - `apps/business-os/src/lib/repo-reader.test.ts` — Data access layer tests
  - `apps/business-os/src/components/board/BoardView.test.tsx` — Board UI tests
  - No tests for auto-refresh (feature doesn't exist)
- Gaps:
  - No integration tests for file system change detection
  - No tests for polling behavior or SSE connections
- Commands/suites:
  - `pnpm --filter @apps/business-os test -- apps/business-os/src/lib/repo-reader.test.ts`
  - `pnpm --filter @apps/business-os test -- apps/business-os/src/components/board/BoardView.test.tsx`
  - `pnpm --filter @apps/business-os typecheck`

### Recent Git History (Targeted)
- `apps/business-os/src/components/board/` — Recent mobile lane stacking (BOS-P2-03), keyboard nav (BOS-P2-05)
- `apps/business-os/src/lib/repo-reader.ts` — Stable, last changed for fileSha support (optimistic concurrency)
- `apps/business-os/src/lib/repo-writer.ts` — Worktree integration, repo lock support

### Verification Completed (2026-01-30)
**Setup script existence:**
- Status: ❌ Does not exist
- Command: `ls -la apps/business-os/scripts/setup-worktree.sh`
- Result: `No such file or directory` (scripts directory doesn't exist either)
- Impact: TASK-01 must create the script, not just run it

**Authorization layer compatibility:**
- Status: ✅ Compatible with worktree approach
- Evidence: `apps/business-os/src/lib/auth/authorize.ts:19-41`
- Logic: Checks `filePath.startsWith(repoRoot)` and `relativePath.startsWith("docs/business-os/")`
- Example: When `repoRoot=/path/to/worktree`, filePath=`/path/to/worktree/docs/business-os/cards/X.md` → passes both checks
- Impact: No code changes needed, works as-is

**Repo lock compatibility:**
- Status: ✅ Compatible with worktree approach
- Evidence: `apps/business-os/src/lib/repo/RepoLock.ts` uses `path.join(repoRoot, "docs/business-os/.locks")`
- Logic: Lock files are relative to `repoRoot`, so they work in any checkout
- Impact: No code changes needed, works as-is

## External Research (If needed)
- No external research needed. Repo contains the required patterns:
  - `router.refresh()` usage: `apps/business-os/src/components/card-detail/CardDetail.tsx`
  - Polling pattern: `apps/business-os/src/components/agent-runs/RunStatus.tsx`
  - SSE examples exist elsewhere in the monorepo (not currently in Business OS): `apps/cms/src/app/api/launch-shop/route.ts`

## Questions
### Resolved
- Q: Does the board currently have any auto-refresh mechanism?
  - A: No. Board is static snapshot at page load. Manual refresh via `router.refresh()` only.
  - Evidence: `apps/business-os/src/components/board/BoardView.tsx` has no polling/refresh logic
- Q: How are mutations currently handled?
  - A: API routes use `RepoWriter` to write and commit Business OS documents; UI refreshes server data via navigation and/or `router.refresh()` depending on the screen.
  - Evidence: `apps/business-os/src/lib/repo-writer.ts`, `apps/business-os/src/components/card-detail/CardDetail.tsx:74,101,128`
- Q: Is there existing polling infrastructure?
  - A: Yes, for agent run status only (5s interval). Not for board data.
  - Evidence: `apps/business-os/src/components/agent-runs/RunStatus.tsx:40-60`
- Q: What is the decided approach for fixing the read/write split?
  - A: Keep the worktree architecture, and set `BUSINESS_OS_REPO_ROOT` to the worktree root so the Business OS app reads/writes from the same checkout.
  - Evidence: `apps/business-os/src/lib/get-repo-root.ts`, `apps/business-os/src/lib/repo-reader.ts:34`, `apps/business-os/src/lib/repo-writer.ts:80-83`, `apps/business-os/src/lib/auth/authorize.ts:24-36`

### Open (User Input Needed)
- Q: What refresh latency is acceptable?
  - Why it matters: Determines polling interval (30s? 60s?) vs real-time (SSE)
  - Decision impacted: Polling vs SSE architecture choice
  - Default assumption: 30 seconds acceptable for Phase 1
- Q: Should direct file edits (outside API) trigger refresh?
  - Why it matters: File watcher would detect these, polling might not
  - Decision impacted: Whether file watcher is required for Phase 1
  - Default assumption + risk:
    - Phase 1 detects committed changes (via git HEAD/version endpoint); Phase 2 adds watcher/mtime scanning if uncommitted edits must be detected.
    - With worktree-as-repoRoot, “direct edits” must be made in the worktree checkout to be visible to the app.

## Confidence Inputs (for /plan-feature)
- **Implementation:** 78%
  - Known: Polling pattern exists (`RunStatus.tsx`), and `router.refresh()` is used successfully elsewhere.
  - Known: Authorization layer validated (2026-01-30) — works correctly with worktree paths
  - Missing: Setup script doesn't exist yet (verified 2026-01-30) — needs to be created
  - Straightforward: Git HEAD as version signal (simple git command, pattern exists)
- **Approach:** 82%
  - Phase 1 polling is the simplest fit for “good enough” latency and $0 infra.
  - SSE/file watching is viable later, but increases operational requirements (long-lived process) and complexity.
- **Impact:** 80%
  - Primary blast radius is Business OS board UX plus a small new API route/hook.
  - Worktree-as-repoRoot affects all Business OS pages that read `docs/business-os/` (intended), so rollout should include a quick sanity check of boards/cards/ideas/people pages.

## Risks & Mitigations
- **Risk**: Developer edits files in main repo (`/Users/petercowling/base-shop/docs/business-os`), changes invisible to app
  - **Mitigation**: Document clearly in `apps/business-os/README.md` and `.env.example`; add startup warning if `BUSINESS_OS_REPO_ROOT` not set in dev
  - **Severity**: Medium (dev confusion, not production issue)
- **Risk**: Worktree gets out of sync with main/remote branches
  - **Mitigation**: Existing sync endpoint (`/api/sync`) handles push to remote; document pull workflow in README
  - **Severity**: Low (normal git workflow)
- **Risk**: Authorization layer rejects worktree paths
  - **Mitigation**: Validated (2026-01-30) — `authorizeWrite()` checks `filePath.startsWith(repoRoot)` and `relativePath.startsWith("docs/business-os/")`, which works correctly when `repoRoot` is the worktree root
  - **Evidence**: `apps/business-os/src/lib/auth/authorize.ts:19-41`
  - **Severity**: Low (already validated)
- **Risk**: Repo lock mechanism fails in worktree context
  - **Mitigation**: Lock files are written under `docs/business-os/.locks/` relative to `repoRoot`, so they work in any checkout
  - **Evidence**: `apps/business-os/src/lib/repo/RepoLock.ts` uses `path.join(repoRoot, "docs/business-os/.locks")`
  - **Severity**: Low (architecture supports it)
- **Risk**: Polling overhead impacts performance with many concurrent users
  - **Mitigation**: Conservative 30s interval for Phase 1; version endpoint must be cheap (git HEAD read, no full scan); monitor metrics
  - **Severity**: Medium (can adjust interval based on observed load)

## Planning Constraints & Notes
- Must-follow patterns:
  - Use `router.refresh()` from Next.js 15 for triggering board refresh
  - Follow existing polling pattern from `RunStatus.tsx` (useEffect + interval + cleanup)
  - Respect repo lock when reading/writing (if `BUSINESS_OS_REPO_LOCK_ENABLED=true`)
  - Use `getRepoRoot()` and `BUSINESS_OS_REPO_ROOT` so reads/writes align
- Rollout/rollback expectations:
  - Phase 1 can ship without a feature flag if polling interval is conservative (30s) and the endpoint is cheap.
  - If we want a kill-switch, it must be client-visible (e.g. `NEXT_PUBLIC_*`) since the polling hook runs in the browser.
  - Rollback: Remove polling hook, board reverts to manual refresh
  - Gradual rollout: Start with 30s polling, decrease interval after validating performance
- Observability expectations:
  - Log polling requests (rate, latency)
  - Log refresh triggers (what changed, how often)
  - Metrics: refresh count per user session, polling overhead

## Suggested Task Seeds (Non-binding)

### Phase 0: Worktree Infrastructure (prerequisite for auto-refresh)

- **TASK-01: Create worktree setup script** (M-effort, blocking)
  - Create `apps/business-os/scripts/setup-worktree.sh` (directory doesn't exist yet)
  - Script should:
    - Create worktree: `git worktree add ../base-shop-business-os-store work/business-os-store`
    - If branch doesn't exist locally, create it from `main`
    - Verify worktree is on correct branch
    - Print instructions for setting `BUSINESS_OS_REPO_ROOT`
  - Test manually: run script, verify worktree created
  - Affects: New file `apps/business-os/scripts/setup-worktree.sh`

- **TASK-02: Document worktree setup and env configuration** (S-effort)
  - Update `apps/business-os/README.md` with:
    - Worktree setup instructions (run setup script)
    - `BUSINESS_OS_REPO_ROOT` env var requirement
    - Warning that main repo edits are invisible when using worktree
  - Create/update `apps/business-os/.env.example` with `BUSINESS_OS_REPO_ROOT=/Users/you/base-shop-business-os-store`
  - Affects: `apps/business-os/README.md`, `apps/business-os/.env.example`

- **TASK-03: Validate worktree-as-repoRoot integration** (M-effort, test validation)
  - Manual validation checklist:
    - [ ] Authorization layer accepts worktree paths (`authorizeWrite()` returns true)
    - [ ] Repo lock creates lock files in worktree (check `docs/business-os/.locks/`)
    - [ ] ID allocation reads/writes to worktree counter file
    - [ ] Create card via API → immediately visible on board refresh
    - [ ] Update card via API → immediately visible on board refresh
  - Record results in plan doc
  - No code changes (validation only)

### Phase 1: Auto-Refresh Implementation (after Phase 0 complete)

- **TASK-04: Create board version endpoint** (`GET /api/boards/[businessCode]/version`)
  - Return version based on `repoRoot` (worktree) that changes when board-relevant docs change
  - Phase 1 implementation: git HEAD commit hash (detects all committed changes via API mutations)
  - Lightweight: single git command, no full directory scan
  - S-effort, 1 file

- **TASK-05: Add `useBoardAutoRefresh()` hook to BoardView** (S-effort)
  - Poll version endpoint every 30s
  - Compare version with last known value (useState)
  - Call `router.refresh()` when version changes
  - Include tab visibility check (don't poll when tab hidden)
  - Affects: `apps/business-os/src/components/board/BoardView.tsx`

- **TASK-06: Add refresh UI affordance** (S-effort, optional polish)
  - Show "Board updated" toast when refresh occurs
  - Optional: Show subtle "Checking for updates..." indicator
  - Use existing toast system
  - Affects: `apps/business-os/src/components/board/BoardView.tsx`

### Phase 2: Real-time / Uncommitted Changes (future, optional)

- **TASK-07: File watcher + SSE for real-time updates** (L-effort, requires long-lived process)
  - Add `chokidar` file watcher for `docs/business-os/` in worktree
  - Create SSE endpoint (`GET /api/board-updates`)
  - Replace polling with SSE connection in `useBoardAutoRefresh()`
  - Detects uncommitted changes immediately (no 30s delay)
  - Requires persistent Node.js process (not serverless-compatible)
  - Affects: 3+ files, new dependencies

## Planning Readiness
- Status: **Ready-for-planning**
- Blocking items (if any):
  - None (open questions are non-blocking; defaults are acceptable for Phase 1)
- Recommended next step:
  - Proceed to `/plan-feature` using the worktree-as-repoRoot approach and Phase 1 polling.
