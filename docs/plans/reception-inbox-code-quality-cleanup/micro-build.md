---
Type: Micro-Build
Status: Complete
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: reception-inbox-code-quality-cleanup
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260312140000-0010
Related-Plan: none
---

# Reception Inbox Code Quality Cleanup Micro-Build

## Scope
- Change: Six targeted code quality fixes across the reception inbox codebase: extract hardcoded staff sender patterns to config constants (#23), stabilize auto-refresh interval by using a ref for busy state (#7), replace redundant type cast with a type guard in analytics route (#6), add element validation before guestRoomNumbers cast (#10), persist failed quality check names for analytics aggregation (#24), and document the message fetch upper bound (#14).
- Non-goals: No new features, no schema migrations, no UI changes, no behaviour changes to the draft pipeline outcomes.

## Execution Contract
- Affects:
  - `apps/reception/src/lib/inbox/draft-core/interpret-thread.ts` (staff sender config)
  - `apps/reception/src/services/useInbox.ts` (auto-refresh interval ref)
  - `apps/reception/src/app/api/mcp/inbox/analytics/route.ts` (type guard)
  - `apps/reception/src/components/inbox/ThreadDetailPane.tsx` (room number validation)
  - `apps/reception/src/lib/inbox/draft-pipeline.server.ts` (failed_checks in DraftFailureReason)
  - `apps/reception/src/lib/inbox/api-models.server.ts` (draftFailureChecks field)
  - `apps/reception/src/lib/inbox/repositories.server.ts` (clampLimit docs, zod schema)
  - `apps/reception/src/lib/inbox/sync.server.ts` (persist draftFailureChecks)
  - `apps/reception/src/lib/inbox/recovery.server.ts` (pass failed_checks through recovery)
- Acceptance checks: `pnpm --filter @apps/reception typecheck` passes, no new lint errors in changed files
- Validation commands: `pnpm --filter @apps/reception typecheck && pnpm exec eslint <changed-files>`
- Rollback note: All changes are additive or refactors; git revert is safe.

## Outcome Contract
- **Why:** The inbox code contained several maintainability and reliability issues: staff detection broke on personnel changes, type safety gaps could display garbled data, the auto-refresh timer restarted unnecessarily on every state change, and there was no structured tracking of which quality checks fail most often.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Staff patterns are configurable, type safety is enforced, refresh timer is stable, quality check failures are tracked, and message fetch is bounded.
- **Source:** operator

## Build Evidence

### Issue #23 -- Hardcoded staff sender names
Extracted inline string literals into two config constants: `STAFF_SENDER_PATTERNS` (domain/address patterns) and `STAFF_SENDER_NAMES` (personal names). The `isStaffSender` function now uses `.some()` over these arrays.

### Issue #7 -- Auto-refresh interval torn down on every state change
Added `isBusyRef` that tracks all loading flags. The interval `useEffect` now depends only on `online`, `tabVisible`, and `refreshInboxView` -- loading flag changes update the ref without tearing down the interval.

### Issue #6 -- Redundant type cast in analytics route
Replaced `as MetricGroup[]` cast with a type-guard filter predicate `(s): s is MetricGroup => validNames.has(s)`.

### Issue #10 -- Unsafe guestRoomNumbers cast
Added element-level validation with `filter((n): n is string => typeof n === "string")` before rendering room numbers, replacing the blind `as string[]` cast.

### Issue #24 -- Failed quality checks not tracked
Added `failed_checks?: string[]` to `DraftFailureReason` type. `deriveDraftFailureReason` now returns the structured array. Both sync and recovery pipelines persist `draftFailureChecks` in thread metadata for analytics aggregation.

### Issue #14 -- Message fetch upper bound
Added JSDoc comments to `clampLimit` and `getThreadMessages` explaining the 200-row hard cap and the rationale (D1 memory constraints).

### Validation
- `pnpm --filter @apps/reception typecheck`: passed (zero errors)
- ESLint on changed files: zero errors (one pre-existing layout warning)
