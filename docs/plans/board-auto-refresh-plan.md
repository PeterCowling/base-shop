---
Type: Plan
Last-reviewed: 2026-02-05
Status: Active
Domain: Platform
Relates-to charter: none
Created: 2026-01-30
Last-updated: 2026-01-30
Feature-Slug: board-auto-refresh
Overall-confidence: 79%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Critical-Findings: Plan/repo drift (script exists, needs fix); Jest TSX broken; Branch base wrong
---

# Board Auto-Refresh Implementation Plan


## Active tasks

No active tasks at this time.

## Summary

Enable automatic board refresh when Business OS markdown documents change (cards, ideas, plans, stage docs). Currently the board shows a static snapshot at page load; users must manually refresh to see updates. This plan implements Phase 0 (worktree infrastructure) and Phase 1 (polling-based auto-refresh) to give users a live view of document changes within 30 seconds.

The implementation follows a two-phase approach: first establish the worktree-as-repoRoot architecture to ensure reads and writes operate on the same filesystem view, then add lightweight polling to detect changes via git HEAD and trigger client-side refresh.

## Goals

- Auto-refresh board when card frontmatter changes (Lane, Priority, Owner, etc.)
- Auto-refresh board when ideas are created/moved
- Detect changes from API mutations (all committed via RepoWriter)
- Multi-user support: User A sees changes made by User B without manual refresh
- 30-second refresh latency (good enough for Phase 1)

**Scope clarification:** "Plan tasks complete (reflected in corresponding cards)" is OUT OF SCOPE for this plan. The board currently reads cards + inbox ideas only (via `page.tsx`). Deriving card state from plan task completion would require a separate feature to parse plan docs and update card frontmatter/lane. This plan only refreshes the **current** board view when documents change.

## Non-goals

- Real-time collaboration (sub-second latency) — deferred to Phase 2
- Detecting uncommitted file edits — Phase 1 detects committed changes only
- Conflict resolution UI (already exists via optimistic concurrency)
- Chat/comments auto-update (separate feature)
- Mobile push notifications

## Constraints & Assumptions

**Constraints:**
- Node.js runtime required (already the case for git operations)
- Phase 0: Local-only, single-user (Pete) — but design for multi-user
- Must use worktree architecture (writes isolated on dedicated branch)
- No paid infrastructure ($0 constraint)
- Polling interval must be conservative (30s) to avoid performance issues

**Assumptions:**
- Polling overhead acceptable for MVP (<100 concurrent clients)
- 30-second refresh latency acceptable (not sub-second real-time)
- Changes infrequent enough that polling won't cause performance issues
- Git HEAD is sufficient version signal for Phase 1 (detects all committed changes)

## Fact-Find Reference

- Related brief: `docs/plans/board-auto-refresh-fact-find.md`
- Key findings:
  - Board is currently static snapshot at page load (no auto-refresh)
  - Polling pattern exists in `RunStatus.tsx` (5s interval for agent status)
  - `router.refresh()` pattern exists in `CardDetail.tsx` for manual refresh
  - **Critical**: RepoReader and RepoWriter must operate on same checkout
  - Worktree path does not exist yet (verified 2026-01-30)
  - Authorization layer validated as compatible with worktree approach
  - Repo lock validated as compatible with worktree approach

## Existing System Notes

**Key modules/files:**
- `apps/business-os/src/app/boards/[businessCode]/page.tsx` — Server Component for board page
- `apps/business-os/src/components/board/BoardView.tsx` — Client component, board UI
- `apps/business-os/src/components/agent-runs/RunStatus.tsx` — Polling pattern reference (5s interval)
- `apps/business-os/src/lib/get-repo-root.ts` — Repo root resolver (supports `BUSINESS_OS_REPO_ROOT`)
- `apps/business-os/src/lib/repo-reader.ts` — Data access layer (reads from `repoRoot/docs/business-os`)
- `apps/business-os/src/lib/repo-writer.ts` — Mutation layer (writes to `worktreePath/docs/business-os`)

**Patterns to follow:**
- Polling: `apps/business-os/src/components/agent-runs/RunStatus.tsx:36-74` (useEffect + interval + cleanup)
- Manual refresh: `apps/business-os/src/components/card-detail/CardDetail.tsx:74,101,128` (router.refresh())
- Server Components: `apps/business-os/src/app/boards/[businessCode]/page.tsx:15` (async data fetching)

## Proposed Approach

**Phase 0: Worktree Infrastructure (prerequisite)**

Establish worktree-as-repoRoot architecture to ensure RepoReader and RepoWriter operate on the same filesystem view:

1. Create setup script to initialize `../base-shop-business-os-store` worktree on branch `work/business-os-store`
2. Set `BUSINESS_OS_REPO_ROOT` env var to point at worktree root
3. Validate that authorization, locking, and ID allocation work in worktree context
4. Document setup process in README and .env.example

This makes `repoRoot === worktreePath` by construction, so all reads/writes/locks observe the same git HEAD.

**Phase 1: Polling-based Auto-Refresh**

Lightweight polling approach using git HEAD as version signal:

1. Create `/api/boards/[businessCode]/version` endpoint that returns git HEAD commit hash
2. Add `useBoardAutoRefresh()` hook to BoardView that polls every 30s
3. Compare version with last known value; call `router.refresh()` when changed
4. Add "Board updated" toast notification (optional polish)

**Why polling (not SSE/WebSocket):**
- Simpler implementation (no long-lived connections, no persistent process)
- Acceptable 30s latency for Phase 1
- $0 infrastructure (works on any deployment platform)
- Easy rollback (remove hook, board reverts to manual refresh)

**Why git HEAD as version signal:**
- Detects all committed changes (all API mutations commit via RepoWriter)
- Extremely lightweight (single git command, no directory scan)
- Multi-user compatible (detects changes from any user)
- Phase 2 can add mtime scanning if uncommitted edits must be detected

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on |
|---|---|---|---:|---:|---|---|
| TASK-00 | IMPLEMENT | Fix Jest TSX config (PRE-BUILD BLOCKER) | 95% | S | Pending | - |
| TASK-01 | IMPLEMENT | Fix worktree script branch base | 90% | M | Pending | - |
| TASK-02 | IMPLEMENT | Document worktree setup & env config | 88% | S | Pending | TASK-01 |
| TASK-03 | IMPLEMENT | Validate worktree integration | 80% | M | Pending | TASK-01, TASK-02 |
| TASK-04 | IMPLEMENT | Create board version endpoint | 90% | S | Pending | TASK-03 |
| TASK-05 | IMPLEMENT | Add useBoardAutoRefresh hook | 88% | S | Pending | TASK-04 |
| TASK-06 | IMPLEMENT | Add refresh UI affordance | 92% | S | Pending | TASK-05 |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)
> Overall confidence: (95×1 + 90×2 + 88×1 + 80×2 + 90×1 + 88×1 + 92×1) / (1+2+1+2+1+1+1) = 713/9 = 79%
> **NOTE:** Confidence dropped from 82% to 79% due to added pre-build blocker and script fix tasks

## Tasks

### TASK-00: Fix Jest TSX configuration (PRE-BUILD BLOCKER)

- **Type:** IMPLEMENT
- **Affects:** `apps/business-os/tsconfig.test.json`
- **Depends on:** -
- **Confidence:** 95%
  - Implementation: 98% — Simple config change; override `"jsx": "react"` in test tsconfig
  - Approach: 95% — Standard Jest + TSX setup; pattern exists in other apps
  - Impact: 90% — Unblocks test execution; no runtime changes; isolated to test environment
- **Acceptance:**
  - [ ] Update `tsconfig.test.json` to add `"jsx": "react"` in compilerOptions
  - [ ] Run `pnpm --filter @apps/business-os test -- apps/business-os/src/components/board/BoardView.test.tsx`
  - [ ] Verify TSX files compile (no "Unexpected token '<'" error)
  - [ ] Verify existing tests can run (may fail for other reasons, but must compile)
- **Test plan:**
  - Run existing BoardView.test.tsx, verify it compiles
  - Run any other .test.tsx file, verify it compiles
- **Planning validation:** (S-effort)
  - Tests run: Attempted BoardView.test.tsx, failed with JSX parse error (confirms issue)
  - Test stubs written: N/A
  - Unexpected findings: tsconfig.test.json inherits "jsx": "preserve" from tsconfig.json, breaks Jest
- **Rollout / rollback:**
  - Rollout: Commit config change; tests can now run
  - Rollback: Revert commit; tests break again (but already broken)
- **Documentation impact:** None
- **Notes / references:**
  - Current error: "SyntaxError: Unexpected token '<'" in BoardView.test.tsx:86
  - Root cause: tsconfig.test.json:2 extends tsconfig.json which has "jsx": "preserve" (line 10)
  - Fix: Add `"jsx": "react"` to tsconfig.test.json compilerOptions to override parent

---

### TASK-01: Fix worktree setup script branch base

- **Type:** IMPLEMENT
- **Affects:** `apps/business-os/scripts/setup-worktree.sh` (EXISTS, needs fix)
- **Depends on:** -
- **Confidence:** 90%
  - Implementation: 92% — Change one line (git branch → git branch from origin/main); well-understood
  - Approach: 95% — Branch base must be origin/main for consistency; clear requirement
  - Impact: 85% — Affects worktree data lineage; wrong base means wrong starting point for work branch
- **Acceptance:**
  - [ ] Script creates branch from `origin/main` not current HEAD
  - [ ] Change line 51: `git branch "$WORK_BRANCH"` → `git branch "$WORK_BRANCH" origin/main`
  - [ ] Verify: If on feature branch, worktree is still based on main
  - [ ] Script still handles existing worktree correctly (lines 21-42)
  - [ ] Script still handles existing branch correctly (lines 49-52)
- **Test plan:**
  - Checkout feature branch: `git checkout work/agents-ci-motivation`
  - Remove existing worktree if present: `git worktree remove ../base-shop-business-os-store --force`
  - Delete branch if present: `git branch -D work/business-os-store`
  - Run script: `./apps/business-os/scripts/setup-worktree.sh`
  - Verify: `cd ../base-shop-business-os-store && git merge-base --is-ancestor origin/main HEAD` (should succeed)
- **Planning validation:** (M-effort)
  - Tests run: Read existing script, confirmed line 51 creates from current HEAD
  - Test stubs written: N/A (bash script, manual validation)
  - Unexpected findings: **CRITICAL DRIFT** — Fact-find claimed script doesn't exist, but it does (created Jan 28)
  - Current behavior: Script exists but creates branch from wrong base (current HEAD not origin/main)
- **What would make this ≥90%:**
  - Add explicit git fetch before creating branch (ensure origin/main is up to date)
  - Add verification step (confirm branch base matches origin/main)
- **Rollout / rollback:**
  - Rollout: Commit script fix; re-run script to recreate worktree with correct base
  - Rollback: Revert to line 51 original (creates from current HEAD)
- **Documentation impact:**
  - Update `apps/business-os/README.md` with setup instructions (covered in TASK-02)
- **Notes / references:**
  - Existing script: `apps/business-os/scripts/setup-worktree.sh:1-66`
  - Problem line: Line 51 `git branch "$WORK_BRANCH"` (creates from current HEAD)
  - Fix: `git branch "$WORK_BRANCH" origin/main` (creates from origin/main)
  - Current branch: `work/agents-ci-motivation` (from gitStatus)

---

### TASK-02: Document worktree setup and env configuration

- **Type:** IMPLEMENT
- **Affects:** `apps/business-os/README.md`, `apps/business-os/.env.example`
- **Depends on:** TASK-01 (setup script must exist to document it)
- **Confidence:** 88%
  - Implementation: 90% — Straightforward documentation update; .env.example and README already exist
  - Approach: 88% — Clear what needs documenting (setup steps, env var, warnings); format matches existing README structure
  - Impact: 85% — Documentation changes only; no code changes; risk is incomplete docs leading to developer confusion
- **Acceptance:**
  - [ ] README.md includes new "Worktree Setup" section before "Development" section
  - [ ] Setup section explains why worktree is needed (isolation of WIP changes)
  - [ ] Setup section includes command: `./apps/business-os/scripts/setup-worktree.sh`
  - [ ] Setup section explains `BUSINESS_OS_REPO_ROOT` env var requirement
  - [ ] README includes warning: "Edits to main repo `docs/business-os/` are invisible to app when using worktree"
  - [ ] .env.example updated with worktree-specific `BUSINESS_OS_REPO_ROOT` example
  - [ ] .env.example comment explains difference between dev (inferred) and worktree mode (explicit env var)
- **Test plan:**
  - Manual review: Read updated docs, verify clarity and completeness
  - Verify: New developer can follow instructions without external help
- **Planning validation:** (S-effort)
  - Tests run: N/A (documentation only)
  - Test stubs written: N/A
  - Unexpected findings: None
  - Pattern reference: Existing README.md structure (sections for Auth, Deployment, etc.)
- **What would make this ≥90%:**
  - Add troubleshooting section (common errors, how to verify setup)
  - Include screenshot or example output from setup script
- **Rollout / rollback:**
  - Rollout: Commit updated docs; immediate visibility to all developers
  - Rollback: Revert commit; docs rollback cleanly
- **Documentation impact:**
  - This task IS the documentation impact (self-documenting)
- **Notes / references:**
  - Existing .env.example: `apps/business-os/.env.example:1-37` (template for new entries)
  - Existing README sections: `apps/business-os/README.md:59-115` (Auth section as pattern)

---

### TASK-03: Validate worktree-as-repoRoot integration

- **Type:** IMPLEMENT
- **Affects:** Plan doc only (validation results recorded in plan)
- **Depends on:** TASK-01 (worktree must exist), TASK-02 (docs must explain how to configure)
- **Confidence:** 80%
  - Implementation: 80% — Manual validation checklist; each item is straightforward to test; risk is missing edge cases
  - Approach: 85% — Validation approach is correct (test each integration point); covers critical paths
  - Impact: 75% — Validation reveals whether worktree architecture works end-to-end; failure would require architecture changes (high impact)
- **Acceptance:**
  - [ ] Set `BUSINESS_OS_REPO_ROOT` to worktree path in .env.local
  - [ ] Verify authorization: Create card via API, check `authorizeWrite()` returns true
  - [ ] Verify repo lock: Check lock files appear in `worktree/docs/business-os/.locks/`
  - [ ] Verify ID allocation: Check counter file in worktree (not main repo)
  - [ ] Verify read/write coherence: Create card via API → immediately visible on board refresh
  - [ ] Verify read/write coherence: Update card via API → immediately visible on board refresh
  - [ ] Record all validation results in plan doc under "Validation Evidence" section
- **Test plan:**
  - Manual validation using dev server:
    1. Run `./apps/business-os/scripts/setup-worktree.sh`
    2. Set `BUSINESS_OS_REPO_ROOT=/Users/petercowling/base-shop-business-os-store` in .env.local
    3. Start dev server: `pnpm --filter @apps/business-os dev`
    4. Create card via UI (POST /api/cards)
    5. Verify card file exists in worktree: `ls ../base-shop-business-os-store/docs/business-os/cards/`
    6. Refresh board (manual router.refresh() or navigation)
    7. Verify card appears on board (read from worktree)
    8. Update card via UI (PATCH /api/cards/[id])
    9. Refresh board, verify update visible
- **Planning validation:** (M-effort)
  - Tests run: Manual validation steps above (no automated test suite for this)
  - Test stubs written: N/A (validation task, not implementation)
  - Unexpected findings: TBD during validation (record in plan)
  - Evidence collected: Authorization layer compatible (fact-find verification), Repo lock compatible (fact-find verification)
- **What would make this ≥90%:**
  - Automated integration test for read/write coherence
  - Test with multiple concurrent writes (verify repo lock prevents corruption)
  - Test with agent runs (verify agent commits visible on board)
- **Rollout / rollback:**
  - Rollout: Validation only, no production changes
  - Rollback: N/A (validation task)
- **Documentation impact:**
  - None (validation results recorded in plan doc)
- **Notes / references:**
  - Fact-find validation: Authorization compatible (authorize.ts:19-41), Lock compatible (RepoLock.ts)
  - Integration boundary: RepoReader + RepoWriter + authorize + lock + ID allocation

---

### TASK-04: Create board version endpoint

- **Type:** IMPLEMENT
- **Affects:** `apps/business-os/src/app/api/boards/[businessCode]/version/route.ts` (new file)
- **Depends on:** TASK-03 (worktree integration validated; read/write coherence confirmed)
- **Confidence:** 90%
  - Implementation: 95% — Simple git command; pattern exists in agent-runs status endpoint; Next.js route handler is straightforward
  - Approach: 90% — Git HEAD as version signal is correct for Phase 1 (detects all committed changes); lightweight and multi-user compatible
  - Impact: 85% — New endpoint only; no changes to existing code; risk is incorrect version signal (doesn't change when expected) OR caching prevents detection
- **Acceptance:**
  - [ ] Route handler at `apps/business-os/src/app/api/boards/[businessCode]/version/route.ts`
  - [ ] Declare runtime: `export const runtime = "nodejs";` (required for git operations)
  - [ ] Declare dynamic rendering: `export const dynamic = "force-dynamic";` (prevent caching)
  - [ ] Endpoint accepts GET requests: `GET /api/boards/[businessCode]/version`
  - [ ] Returns JSON: `{ version: "<git-commit-hash>", timestamp: "<ISO-8601>" }`
  - [ ] Uses `getRepoRoot()` to respect `BUSINESS_OS_REPO_ROOT` env var
  - [ ] Uses `simple-git` to get HEAD commit hash: `git.revparse(['HEAD'])`
  - [ ] Handles errors gracefully (git command fails → 500 error with message)
  - [ ] Returns 200 status with `Cache-Control: no-store, no-cache, must-revalidate` headers
  - [ ] Endpoint is cheap (<10ms response time for git HEAD read)
- **Test plan:**
  - Unit test: Mock `simple-git`, verify correct git command and response format
  - Integration test: Start dev server, call endpoint, verify response matches `git rev-parse HEAD`
  - Manual test: Commit a change, call endpoint twice, verify version changes both times (not cached)
  - Manual test: No commit, verify version stays the same
  - Performance test: Verify response time <10ms (git rev-parse is fast)
- **Planning validation:** (S-effort)
  - Tests run: Existing `apps/business-os/src/app/api/agent-runs/[id]/status/route.test.ts` (pattern reference, passes)
  - Test stubs written: N/A (S-effort, unit test sufficient)
  - Unexpected findings: All API routes declare `export const runtime = "nodejs";` (15 files confirmed)
  - Pattern reference: `apps/business-os/src/app/api/agent-runs/[id]/status/route.ts:10,38-60` (runtime + getRepoRoot + error handling)
- **What would make this ≥90%:**
  - Add short-lived cache (5-10s) with manual invalidation to reduce git overhead
  - Add metrics logging (endpoint call count, latency)
  - Add health check integration (version endpoint as liveness probe)
- **Rollout / rollback:**
  - Rollout: Deploy endpoint; no clients yet (safe to deploy before TASK-05)
  - Rollback: Remove route file; no breaking changes (clients don't exist yet)
- **Documentation impact:**
  - None (internal API, not user-facing)
- **Notes / references:**
  - Pattern: All Business OS API routes use `export const runtime = "nodejs";` (grep confirmed 15 files)
  - Pattern: `apps/business-os/src/app/api/agent-runs/[id]/status/route.ts` (Next.js App Router GET handler)
  - Git command: `git rev-parse HEAD` via `simple-git` library
  - Cache prevention: `export const dynamic = "force-dynamic";` prevents Next.js from caching responses
  - Fact-find: Git HEAD as version signal (straightforward, detects all committed changes)

---

### TASK-05: Add useBoardAutoRefresh hook

- **Type:** IMPLEMENT
- **Affects:** `apps/business-os/src/components/board/BoardView.tsx`
- **Depends on:** TASK-04 (version endpoint must exist and work correctly)
- **Confidence:** 88%
  - Implementation: 90% — Polling pattern exists in RunStatus.tsx; useEffect + interval + cleanup is well-understood; router.refresh() pattern exists
  - Approach: 88% — Polling approach is correct for Phase 1; 30s interval is conservative; tab visibility check prevents unnecessary polling
  - Impact: 85% — Changes client component only; adds polling loop; risk is polling overhead or infinite refresh loops
- **Acceptance:**
  - [ ] Add `useBoardAutoRefresh` custom hook inside BoardView.tsx (inline, not separate file for S-effort)
  - [ ] Hook polls `/api/boards/[businessCode]/version` every 30 seconds
  - [ ] Hook compares version with last known value (useState)
  - [ ] Hook calls `router.refresh()` when version changes
  - [ ] Hook uses `useRouter` from `next/navigation`
  - [ ] Hook includes tab visibility check (don't poll when tab hidden)
  - [ ] Hook cleans up interval on unmount (return cleanup function from useEffect)
  - [ ] Hook handles errors gracefully (log error, continue polling)
  - [ ] Initial fetch happens immediately (don't wait 30s for first check)
- **Test plan:**
  - Unit test: Mock fetch, verify polling interval (30s)
  - Unit test: Mock fetch, verify router.refresh() called when version changes
  - Unit test: Mock fetch, verify router.refresh() NOT called when version same
  - Unit test: Verify interval cleanup on unmount
  - Integration test: Create card via API, verify board refreshes within 30s
  - Manual test: Open board, create card in separate tab, verify board auto-refreshes
- **Planning validation:** (S-effort)
  - Tests run: Existing `apps/business-os/src/components/board/BoardView.test.tsx` (Jest config broken, but test file exists as pattern)
  - Test stubs written: N/A (S-effort, unit test sufficient)
  - Unexpected findings: Jest config issue (not blocking, can fix separately)
  - Pattern reference: `apps/business-os/src/components/agent-runs/RunStatus.tsx:36-74` (polling with useEffect + interval)
- **What would make this ≥90%:**
  - Add exponential backoff on errors (prevent thundering herd)
  - Add jitter to polling interval (prevent synchronized requests from multiple clients)
  - Test with slow network (verify timeout handling)
- **Rollout / rollback:**
  - Rollout: Deploy updated component; auto-refresh enabled for all users
  - Rollback: Remove hook code; board reverts to manual refresh (safe, no data loss)
- **Documentation impact:**
  - None (internal feature, no user-facing docs needed)
- **Notes / references:**
  - Pattern: `apps/business-os/src/components/agent-runs/RunStatus.tsx:36-74` (useEffect polling)
  - Pattern: `apps/business-os/src/components/card-detail/CardDetail.tsx:74,101,128` (router.refresh())
  - Tab visibility API: `document.visibilityState` (prevents background polling)

---

### TASK-06: Add refresh UI affordance

- **Type:** IMPLEMENT
- **Affects:** `apps/business-os/src/components/board/BoardView.tsx`
- **Depends on:** TASK-05 (auto-refresh hook must work before adding UI feedback)
- **Confidence:** 92%
  - Implementation: 95% — Toast system already exists; simple state update + toast.success() call; no new patterns
  - Approach: 90% — Toast notification is correct UX pattern for background updates; non-intrusive, dismissible
  - Impact: 90% — UI polish only; no functional changes; risk is toast spam if refresh loops incorrectly
- **Acceptance:**
  - [ ] Import toast system (already exists in app)
  - [ ] Show toast when board refreshes: "Board updated"
  - [ ] Toast is dismissible (auto-dismiss after 3s)
  - [ ] Toast appears bottom-right (consistent with existing toast position)
  - [ ] Toast does NOT appear on initial page load (only on refresh)
  - [ ] Optional: Show subtle "Checking for updates..." indicator (defer if time-consuming)
- **Test plan:**
  - Manual test: Create card via API, verify toast appears after refresh
  - Manual test: No changes, verify toast does NOT appear
  - Manual test: Multiple changes, verify single toast per refresh (not multiple)
  - Visual review: Toast positioning and styling match design system
- **Planning validation:** (S-effort)
  - Tests run: N/A (UI polish, manual testing sufficient)
  - Test stubs written: N/A
  - Unexpected findings: None
  - Pattern reference: Toast system already integrated (fact-find: ToastProvider exists)
- **What would make this ≥90%:**
  - Show number of changes in toast ("3 cards updated")
  - Add animation/transition for smoother UX
  - Include undo/dismiss action in toast
- **Rollout / rollback:**
  - Rollout: Deploy updated component; toast feedback enabled
  - Rollback: Remove toast call; board still auto-refreshes, just no visual feedback
- **Documentation impact:**
  - None (UI feedback, no docs needed)
- **Notes / references:**
  - Toast system: Already integrated (fact-find: ToastProvider in layout)
  - Pattern: Use existing toast.success() or similar API

---

## Risks & Mitigations

- **Risk**: Developer edits files in main repo (`/Users/petercowling/base-shop/docs/business-os`), changes invisible to app
  - **Mitigation**: Document clearly in README (TASK-02); worktree setup script prints warning
  - **Severity**: Medium (dev confusion, not production issue)
  - **Validation**: TASK-02 acceptance criteria include warning in docs

- **Risk**: Worktree gets out of sync with main/remote branches
  - **Mitigation**: Existing sync endpoint (`/api/sync`) handles push; document pull workflow in README
  - **Severity**: Low (normal git workflow)
  - **Validation**: Document git workflow in TASK-02

- **Risk**: Polling overhead impacts performance with many concurrent users
  - **Mitigation**: Conservative 30s interval; version endpoint is cheap (git HEAD read only); monitor metrics
  - **Severity**: Medium (can adjust interval based on observed load)
  - **Validation**: TASK-04 acceptance includes <10ms response time requirement

- **Risk**: Infinite refresh loops (version endpoint triggers refresh, which calls endpoint again)
  - **Mitigation**: Version endpoint returns git HEAD (stable unless new commit); polling only triggers refresh when version **changes**
  - **Severity**: Low (architecture prevents this by design)
  - **Validation**: TASK-05 acceptance includes "router.refresh() NOT called when version same"

- **Risk**: Read/write split reappears (developer runs app without setting BUSINESS_OS_REPO_ROOT)
  - **Mitigation**: Setup script prints clear instructions; README documents env var requirement
  - **Severity**: Medium (dev confusion, API writes fail with "worktree not ready")
  - **Validation**: TASK-02 acceptance includes env var documentation

- **Risk**: Authorization or lock mechanisms fail in worktree context
  - **Mitigation**: Already validated in fact-find (authorize.ts:19-41, RepoLock.ts compatible)
  - **Severity**: Low (already validated)
  - **Validation**: TASK-03 re-validates in practice

- **Risk**: Operational incoherence — different processes use different BUSINESS_OS_REPO_ROOT
  - **Mitigation**: ALL cooperating processes must share the same env var (Next server, agent runner, scripts using getRepoRoot())
  - **Severity**: HIGH (reintroduces read/write split if processes diverge)
  - **Validation**: Document in TASK-02; verify all process invocations use same .env
  - **Example failure**: UI reads worktree, agent queue writes to main repo → changes invisible

- **Risk**: router.refresh() resets board UI state (filters/search/view selection lost)
  - **Mitigation**: Verify during TASK-05 testing; if state resets, add state persistence (URL params or sessionStorage)
  - **Severity**: Medium (poor UX if filters reset on every refresh)
  - **Validation**: Manual test in TASK-05 — set filters, trigger refresh, verify filters persist
  - **Note**: BoardView uses useState for filters/search; router.refresh() re-runs server component but client state should persist

- **Risk**: Polling load with many cards + many clients causes performance issues
  - **Mitigation**: Refresh re-reads/parses all cards/ideas; with 100s of cards + 10s of clients refreshing simultaneously, could spike CPU
  - **Severity**: Low-Medium (depends on scale)
  - **Validation**: Monitor during rollout; consider caching keyed by version if needed
  - **Note**: Phase 1 targets <100 clients; defer optimization until metrics show problem

## Observability

**Logging:**
- Version endpoint: Log git command errors (if any)
- Auto-refresh hook: Log when refresh triggered (version change detected)
- Setup script: Log worktree creation success/failure

**Metrics:** (Future, not in Phase 1)
- Version endpoint call count per minute (detect polling load)
- Version endpoint latency (p50, p95, p99)
- Refresh count per user session (how often board actually refreshes)

**Alerts/Dashboards:** (Future, not in Phase 1)
- Alert if version endpoint latency >100ms (indicates git performance issue)
- Dashboard showing refresh frequency per business/user

## Acceptance Criteria (overall)

- [ ] Worktree initialized at `../base-shop-business-os-store` on branch `work/business-os-store`
- [ ] `BUSINESS_OS_REPO_ROOT` env var documented and configured
- [ ] Manual validation confirms read/write coherence (TASK-03 checklist complete)
- [ ] Version endpoint returns git HEAD commit hash
- [ ] Board auto-refreshes within 30s of card creation via API
- [ ] Board auto-refreshes within 30s of card update via API
- [ ] Toast notification shows "Board updated" after refresh
- [ ] No infinite refresh loops
- [ ] No regressions in existing board functionality (search, filters, navigation)
- [ ] All existing tests pass (or test config fixed separately if needed)

## Decision Log

- **2026-01-30 (initial)**: Worktree architecture decision — Initialize worktree and set `BUSINESS_OS_REPO_ROOT` to worktree root (not abandon worktree). Rationale: Preserves architectural intent of isolating WIP changes; maintains multi-user story; authorization and lock mechanisms already compatible.
- **2026-01-30 (initial)**: Phase 1 approach decision — Polling (not SSE/WebSocket). Rationale: Simpler implementation, acceptable 30s latency, $0 infrastructure, easy rollback. Phase 2 can add SSE if real-time needed.
- **2026-01-30 (initial)**: Version signal decision — Git HEAD commit hash (not mtime scanning). Rationale: Detects all committed changes (all API mutations commit via RepoWriter), extremely lightweight, multi-user compatible. Phase 2 can add mtime if uncommitted edits must be detected.
- **2026-01-30 (revision)**: **CRITICAL PLAN/REPO DRIFT IDENTIFIED** — Fact-find claimed setup script doesn't exist, but it DOES exist at `apps/business-os/scripts/setup-worktree.sh` (created Jan 28, 2 days before fact-find). Script has bug: creates branch from current HEAD not origin/main. Plan updated to fix script (TASK-01) instead of creating from scratch. Added TASK-00 to fix Jest TSX config (test blocker). Overall confidence dropped 82% → 79% due to added complexity.
- **2026-01-30 (revision)**: Scope clarification — "Plan tasks complete (reflected in cards)" is OUT OF SCOPE. Board reads cards + ideas only; deriving card state from plan tasks would require separate feature. This plan only refreshes current view when documents change.
