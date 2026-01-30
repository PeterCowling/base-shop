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
  - Must handle worktree architecture (writes to `../base-shop-business-os-store`, reads from main repo)
  - No paid infrastructure ($0 constraint)
- Assumptions:
  - Polling overhead is acceptable for MVP (<100 clients)
  - 10-30 second refresh latency is acceptable (not sub-second real-time)
  - Changes are infrequent enough that polling won't cause performance issues

## Repo Audit (Current State)
### Entry Points
- `apps/business-os/src/app/boards/[businessCode]/page.tsx` — Server Component, loads board data at request time
- `apps/business-os/src/lib/repo-reader.ts` — Data access layer, synchronous file reads
- `apps/business-os/src/lib/repo-writer.ts` — Mutation layer, writes to worktree + git commits

### Key Modules / Files
- `apps/business-os/src/components/board/BoardView.tsx` — Client component, board UI (currently no auto-refresh)
- `apps/business-os/src/components/agent-runs/RunStatus.tsx` — Example of existing polling pattern (5s interval for agent status)
- `apps/business-os/src/lib/repo-lock.ts` — Repo-level locking for concurrent writes
- `apps/business-os/src/lib/board-logic.ts` — Board filtering and ordering logic

### Patterns & Conventions Observed
- **Server Components for data fetching** — evidence: `apps/business-os/src/app/boards/[businessCode]/page.tsx:15` (async function)
- **`router.refresh()` for manual refresh** — evidence: `apps/business-os/src/components/card-detail/CardDetail.tsx:74,101,128`
- **Client polling with `useEffect`** — evidence: `apps/business-os/src/components/agent-runs/RunStatus.tsx:40-60`
- **No file watchers** — grep confirmed zero usage of `chokidar`, `fsevents`, or `fs.watch`
- **No SSE/WebSocket** — grep confirmed zero usage

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
  - All mutations write to worktree + commit to git
  - No refresh triggered after mutations (client must call `router.refresh()` manually)

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
  - Worktree architecture adds complexity (writes to worktree, reads from main repo)
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
  - `pnpm test apps/business-os/src/lib/repo-reader.test.ts`
  - `pnpm --filter @apps/business-os typecheck`

### Recent Git History (Targeted)
- `apps/business-os/src/components/board/` — Recent mobile lane stacking (BOS-P2-03), keyboard nav (BOS-P2-05)
- `apps/business-os/src/lib/repo-reader.ts` — Stable, last changed for fileSha support (optimistic concurrency)
- `apps/business-os/src/lib/repo-writer.ts` — Worktree integration, repo lock support

## External Research (If needed)
- Finding: Next.js 15 Server Components support `router.refresh()` for re-running data fetching without full navigation
  - Source: https://nextjs.org/docs/app/api-reference/functions/use-router#routerrefresh
  - Compatibility: Already using Next.js 15.3.8
- Finding: Server-Sent Events (SSE) supported via `ReadableStream` in Next.js App Router
  - Source: https://nextjs.org/docs/app/building-your-application/routing/route-handlers#streaming
  - Compatibility: Requires Node.js runtime (already the case)
- Finding: `chokidar` is the standard file watcher library for Node.js
  - Source: https://www.npmjs.com/package/chokidar (v4.0.3 latest)
  - Compatibility: Requires long-running process (not serverless)

## Questions
### Resolved
- Q: Does the board currently have any auto-refresh mechanism?
  - A: No. Board is static snapshot at page load. Manual refresh via `router.refresh()` only.
  - Evidence: Grep for polling/SSE/WebSocket returned zero results
- Q: How are mutations currently handled?
  - A: API routes write to worktree, commit to git, return success. Client must call `router.refresh()` manually.
  - Evidence: `apps/business-os/src/lib/repo-writer.ts:150-180` (write + commit flow)
- Q: Is there existing polling infrastructure?
  - A: Yes, for agent run status only (5s interval). Not for board data.
  - Evidence: `apps/business-os/src/components/agent-runs/RunStatus.tsx:40-60`
- Q: What causes the worktree vs main repo split?
  - A: Writes go to dedicated worktree (`../base-shop-business-os-store`) on branch `work/business-os-store`. Main repo stays clean.
  - Evidence: `apps/business-os/src/lib/repo-writer.ts:80-95`

### Open (User Input Needed)
- Q: What refresh latency is acceptable?
  - Why it matters: Determines polling interval (10s? 30s? 60s?) vs real-time (SSE)
  - Decision impacted: Polling vs SSE architecture choice
  - Default assumption: 10-30 seconds acceptable for MVP
- Q: Should board refresh when OTHER users make changes (multi-user)?
  - Why it matters: Polling would detect external changes, but increases complexity
  - Decision impacted: Scope of change detection (local only vs global)
  - Default assumption: Yes, detect all changes (design for multi-user)
- Q: Should direct file edits (outside API) trigger refresh?
  - Why it matters: File watcher would detect these, polling wouldn't (unless version check includes file mtime)
  - Decision impacted: Whether file watcher is required
  - Default assumption: Yes, detect direct file edits (use file watcher or git log polling)

## Confidence Inputs (for /plan-feature)
- **Implementation:** 85%
  - High confidence: Polling pattern exists (agent run status), `router.refresh()` works, version check endpoint is straightforward
  - Medium confidence: Worktree vs main repo read path needs investigation (do we read from worktree or main repo?)
  - Missing: Need to verify whether RepoReader reads from worktree or main repo
- **Approach:** 80%
  - Multiple viable approaches: Polling (simple), SSE (real-time), webhook (distributed)
  - Trade-offs: Polling overhead vs SSE complexity vs webhook deployment
  - Recommendation: Start with polling (Phase 1), migrate to SSE if needed (Phase 2)
  - Missing: User preference on latency vs complexity trade-off
- **Impact:** 88%
  - Low risk: Additive feature, no breaking changes
  - Board View is already client component, can add `useEffect` hook
  - Worktree architecture adds complexity but doesn't block implementation
  - Missing: Need to test multi-user scenario (concurrent changes)

## Planning Constraints & Notes
- Must-follow patterns:
  - Use `router.refresh()` from Next.js 15 for triggering board refresh
  - Follow existing polling pattern from `RunStatus.tsx` (useEffect + interval + cleanup)
  - Respect repo lock when reading/writing (if `BUSINESS_OS_REPO_LOCK_ENABLED=true`)
- Rollout/rollback expectations:
  - Feature flag: `BUSINESS_OS_AUTO_REFRESH_ENABLED` (default: true)
  - Rollback: Set flag to false, board reverts to manual refresh
  - Gradual rollout: Start with 10s polling, increase interval if performance issues
- Observability expectations:
  - Log polling requests (rate, latency, cache hits/misses)
  - Log refresh triggers (what changed, how often)
  - Metrics: refresh count per user session, polling overhead

## Suggested Task Seeds (Non-binding)
1. **Create version check endpoint** (`GET /api/boards/[businessCode]/version`)
   - Return git commit hash or aggregate file mtime
   - Include card count, idea count for quick change detection
   - S-effort, 1 file

2. **Add auto-refresh hook to BoardView** (`useBoardAutoRefresh()`)
   - Poll version endpoint every 10-30s
   - Compare version with last known, call `router.refresh()` if changed
   - Store last known version in component state
   - S-effort, 1 file

3. **Handle worktree vs main repo read path** (investigation)
   - Verify whether RepoReader reads from worktree or main repo
   - If main repo, ensure worktree changes are visible (may need to read from worktree)
   - S-effort, investigation + potential fix

4. **Add refresh indicator to board UI**
   - Show "Board updated" toast when refresh occurs
   - Optional: Show "Refreshing..." indicator during fetch
   - S-effort, UI polish

5. **Optional: File watcher + SSE for real-time** (Phase 2)
   - Add `chokidar` file watcher for `docs/business-os/`
   - Create SSE endpoint (`GET /api/board-updates`)
   - Replace polling with SSE connection in `useBoardAutoRefresh()`
   - L-effort, 3+ files, requires persistent process

## Planning Readiness
- Status: **Ready-for-planning**
- Blocking items: None (open questions have acceptable defaults)
- Recommended next step: Proceed to `/plan-feature` with polling approach (Phase 1)
  - Phase 1: Polling (10-30s interval) — quick win, low complexity
  - Phase 2: SSE (optional) — if real-time is needed later
