---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: prime-refetch-boilerplate
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/prime-refetch-boilerplate/plan.md
Dispatch-ID: IDEA-DISPATCH-20260309140000-0004
artifact: fact-find
---

# Prime pureData Refetch Boilerplate — Fact-Find Brief

## Scope

### Summary

Every React Query–backed pureData hook in `apps/prime/src/hooks/pureData/` wraps the library's `refetch` function in an `async () => { await rqRefetch(); }` closure before returning it to callers. This strips the library return type (`Promise<QueryObserverResult<T, E>>`) down to `Promise<void>`. The pattern is hand-rolled identically in 12 out of 14 hooks in the directory (the two exceptions — `useFetchBagStorageData` and `useFetchCompletedTasksData` — expose no `refetch` at all for different architectural reasons). This fact-find audits the full pattern, surveys all call sites for return-value consumption, and assesses three consolidation approaches.

### Goals

- Confirm which hooks carry the wrapper pattern and in what two syntactic forms it appears.
- Confirm that no caller consumes the `QueryObserverResult` return value — verifying that changing the return type would be safe.
- Evaluate three approach options (type alias, shared factory, direct cast).
- Understand whether a factory would also remove the repeated `queryKey / enabled / staleTime / gcTime` boilerplate.
- Assess risks, including mock compatibility.

### Non-goals

- Changing the `useFetchCompletedTasksData` hook (Firebase `onValue` listener — no React Query involved).
- Changing `useGuestBookingSnapshot` (different architectural layer, exposes `query.refetch` directly without a wrapper).
- Altering the orchestrator-level aggregate refetch in `useOccupantDataSources`.

### Constraints & Assumptions

- Constraints:
  - React Query `^5.62.0` is installed; the `refetch` return type is `Promise<QueryObserverResult<TData, TError>>` as of TanStack Query v5.
  - Mocks in `__mocks__/` currently have no `refetch` field (interface mismatch vs live hooks). Adding `refetch: jest.fn(async () => {})` to all 3 manual mock files is required alongside the type alias change.
  - Tests run in CI only; no local `jest` execution.
- Assumptions:
  - No caller outside pureData hooks consumes the `QueryObserverResult` value from refetch (confirmed below).

## Outcome Contract

- **Why:** Reduce mechanical repetition across 12 hooks so that the standard hook shape is enforced in one place rather than copy-pasted — lowering maintenance surface and preventing divergence as new hooks are added.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All React Query–backed pureData hooks expose `refetch: () => Promise<void>` via a single shared mechanism (type alias or factory), with zero per-hook wrapper boilerplate. New hooks added thereafter require no manual refetch wrapping.
- **Source:** auto

## Access Declarations

None. All evidence sourced from repository files only.

## Evidence Audit (Current State)

### Entry Points

- `apps/prime/src/hooks/pureData/` — the 14-file directory containing all pureData hooks; this is where changes will land.
- `apps/prime/src/hooks/dataOrchestrator/useOccupantDataSources.ts` — the primary consumer that imports 8 of the 14 pureData hooks and fans out to their `refetch` functions.

### Key Modules / Files

- `apps/prime/src/hooks/pureData/useFetchBookingsData.client.ts` — canonical example of the inline form: `refetch: async () => { await rqRefetch(); }` in the return statement.
- `apps/prime/src/hooks/pureData/useFetchCheckInCode.ts` — canonical example of the extracted form: `const refetch = async (): Promise<void> => { await refetchQuery(); }` before the return.
- `apps/prime/src/hooks/pureData/useFetchGuestProfile.ts` — extracted form; `refetch` body is plain `await refetchQuery()`. Staleness detection (`isStale`, `effectiveProfile`) is computed separately after the function — unaffected by the cast.
- `apps/prime/src/hooks/pureData/useFetchQuestProgress.ts` — extracted form; same structure as `useFetchGuestProfile`. `refetch` body is plain wrapper; staleness check is separate code.
- `apps/prime/src/hooks/pureData/useFetchBagStorageData.ts` — **no refetch** exposed; returns `bagStorageData / isLoading / error` only.
- `apps/prime/src/hooks/pureData/useFetchCompletedTasksData.ts` — **no refetch**, Firebase `onValue` listener (not React Query).
- `apps/prime/src/hooks/dataOrchestrator/useOccupantDataSources.ts` — consumes `refetch: () => Promise<void>` from 7 pureData hooks; fans them out with `Promise.all`.
- `apps/prime/src/hooks/pureData/__mocks__/` — 3 manual Jest mock files (useFetchBookingsData, useFetchGuestDetails, useFetchPreordersData). None currently includes a `refetch` field — the mock interface does not match the live hook. Updating these files with `refetch: jest.fn(async () => {})` is required alongside the type alias change.

### Patterns & Conventions Observed

**Pattern A — inline wrapper (7 hooks):**

```ts
const { data, isLoading, error, refetch: rqRefetch } = useQuery({ ... });
return { ..., refetch: async () => { await rqRefetch(); } };
```

Hooks: `useFetchBookingsData.client`, `useFetchCityTax`, `useFetchFinancialsRoom`, `useFetchGuestByRoom`, `useFetchGuestDetails`, `useFetchLoans`, `useFetchPreordersData`.

**Pattern B — extracted wrapper (5 hooks):**

```ts
const { ..., refetch: refetchQuery } = useQuery({ ... });
const refetch = async (): Promise<void> => { await refetchQuery(); };
return { ..., refetch };
```

Hooks: `useFetchBookingsDataServer`, `useFetchCheckInCode`, `useFetchGuestProfile`, `useFetchPreArrivalData`, `useFetchQuestProgress`.

All five Pattern B hooks have an identical plain body (`await refetchQuery()`). The two hooks `useFetchGuestProfile` and `useFetchQuestProgress` include staleness detection, but that logic is separate code outside the `refetch` function — the `const refetch` body itself is still the plain wrapper. All 5 Pattern B hooks can therefore be fully replaced with a cast.

**Hooks with no refetch (2):**
- `useFetchBagStorageData` — exposes no `refetch`. Orchestrator excludes it from the fan-out.
- `useFetchCompletedTasksData` — Firebase realtime listener; no React Query.

**Return field naming inconsistency:**

Hooks return data under different field names (`bookingsData`, `preordersData` vs `data`, `data` for most). A factory cannot normalize this without breaking existing destructuring at call sites.

**staleTime / gcTime variation:**

| Hook | staleTime | gcTime |
|---|---|---|
| useFetchBagStorageData | none | none |
| useFetchBookingsData.client | none | none |
| useFetchBookingsDataServer | 5 min | 10 min |
| useFetchCheckInCode | 5 min | 30 min |
| useFetchCityTax | none | none |
| useFetchFinancialsRoom | none | none |
| useFetchGuestByRoom | none | none |
| useFetchGuestDetails | none | none |
| useFetchGuestProfile | 5 min | 30 min |
| useFetchLoans | none | none |
| useFetchPreArrivalData | 2 min | 10 min |
| useFetchPreordersData | 2 min | none |
| useFetchQuestProgress | 5 min | 30 min |

Values differ across hooks; a factory accepting optional `staleTime/gcTime` could encode them.

### Data & Contracts

- **React Query version:** `@tanstack/react-query ^5.62.0`
- **`refetch` return type in v5:** `Promise<QueryObserverResult<TData, TError>>` — confirmed from installed types at `node_modules/@tanstack/query-core/build/modern/hydration-CdBkFt9i.d.cts` line 912.
- **Public contract exposed by hooks:** `refetch: () => Promise<void>` — declared in each hook's return interface or inferred from the async wrapper.
- **Consumer contract:** `useOccupantDataSources` types its aggregate `refetch: () => Promise<void>` (line 73). Feeds into `useUnifiedBookingData` which also types it `refetch: () => Promise<void>` (line 106).
- **Mock contract:** All three manual mock files (`__mocks__/useFetchBookingsData.ts`, `__mocks__/useFetchGuestDetails.ts`, `__mocks__/useFetchPreordersData.ts`) expose **no `refetch` field at all**. These mocks have never included refetch. The `useOccupantDataSources.test.ts` compensates by supplying its own inline mocks that do include `refetch: jest.fn(async () => {})`. This means mock files and live hook interfaces are currently mismatched — the type alias change makes this mismatch explicit and the mock files should be updated as part of the same change.

### Dependency & Impact Map

- **Upstream (inputs to pureData hooks):** `useUuid()`, `useFirebaseDatabase()`, Firebase `get/ref`, HTTP fetch for server-side hooks.
- **Downstream (consumers of pureData hook `refetch`):**
  - `useOccupantDataSources` (7 hooks' refetch fanned out via `Promise.all`)
  - `useCheckInCode.ts` (destructures `refetch` from `useFetchCheckInCode`, calls `await refetch()` at line 123)
  - `usePreArrivalState.ts` (destructures `refetch` from `useFetchPreArrivalData`, re-exports it)
  - `apps/prime/src/app/(guarded)/bag-storage/page.tsx` (calls `await refetch()` — but this comes from `useGuestBookingSnapshot`, not a pureData hook)
  - `apps/prime/src/components/homepage/GuardedHomeExperience.tsx` (uses `refetchCheckInCode` aliased from `useFetchCheckInCode` refetch)
  - `apps/prime/src/test-utils/useFirebase-mock.ts` (defines its own `refetch: () => Promise<void>` inline — not from pureData hooks)
- **No caller chains `.then()` or reads the resolved value.** All call sites either `await refetch()` (fire-and-forget) or `void refetch()` (no await). Confirmed by full-repo grep.
- **Blast radius of returning `Promise<QueryObserverResult>` instead of `Promise<void>`:** Zero consumer breakage — callers ignore the resolved value. TypeScript would flag assignments like `const result = await refetch()` only if `result` were then used, which it is not.

### Test Landscape

#### Test Infrastructure

- Framework: Jest (configured via `apps/prime/jest.config.cjs`)
- CI integration: governed test runner `pnpm -w run test:governed`. Do not run locally.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| pureData hooks (listener) | Unit (renderHook) | `__tests__/useFetchCompletedTasks.listener-leak.test.tsx` | Covers only the Firebase listener hook; no RQ-backed hook unit tests |
| useOccupantDataSources | Unit (renderHook, mock-all-pureData) | `dataOrchestrator/useOccupantDataSources.test.ts` | Tests fan-out refetch call counts; mocks all pureData hooks inline |
| pureData manual mocks | Jest manual mocks | `pureData/__mocks__/*.ts` | 3 files (bookingsData, guestDetails, preordersData) — none include `refetch` field |

#### Coverage Gaps

- No unit tests for any of the 12 RQ-backed pureData hooks' `refetch` behaviour.
- Manual mocks missing `refetch` field will cause TypeScript errors if any consumer destructures `refetch` from a mocked hook — not currently a problem because `useOccupantDataSources.test.ts` mocks hooks inline rather than using manual mock files.
- If a shared factory or type is introduced in a new file, that file needs no new tests itself (it's type-only or a thin wrapper), but any hook that changes its refetch exposure should have its `useOccupantDataSources.test.ts` mock updated for consistency.

#### Testability Assessment

- Easy to test: confirming refetch is callable and returns `Promise<void>` (existing mock pattern already does this).
- Hard to test: verifying the factory produces a stable function reference (referential equality) — would require a `renderHook` + `rerender` test with a real `QueryClientProvider`.
- Test seams: `QueryClientProvider` wrapper already established by `apps/prime/src/providers/QueryProvider.tsx`.

### Recent Git History (Targeted)

- `c49db5dbb6` — "Fix Prime changed-file lint CI gate" — lint configuration; no pureData changes.
- `0e8cd553d4` — "prime-guest-access-hardening: TASK-05 — HttpOnly cookie migration" — touched `useGuestBookingSnapshot` (adds `refetch: query.refetch` directly, not wrapped).
- No commit in the recent log specifically targets pureData hook shape. The async wrapper pattern is established baseline, not a recent regression.

## Questions

### Resolved

- **Q: Does any caller consume the `QueryObserverResult` return value of refetch?**
  - A: No. Full-repo search for `.then()` after `refetch`, `await refetch()` with result binding, or `void refetch()` confirms zero consumers use the resolved value. Callers treat it as fire-and-forget.
  - Evidence: `apps/prime/src/hooks/useCheckInCode.ts:123`, `apps/prime/src/app/(guarded)/bag-storage/page.tsx:61` — both `await refetch()` with no result binding. `apps/prime/src/app/(guarded)/main-door-access/page.tsx:133` — `void refetch()`.

- **Q: How many hooks actually have the async wrapper pattern?**
  - A: 12 out of 14 pureData hooks. 7 use the inline form (Pattern A), 5 use the extracted form (Pattern B). Two hooks expose no refetch (`useFetchBagStorageData`, `useFetchCompletedTasksData`).
  - Evidence: grepped all `useFetch*.ts` files in pureData for `async.*rqRefetch|async.*refetchQuery|refetch: async`.

- **Q: What does React Query v5 `refetch` actually return?**
  - A: `Promise<QueryObserverResult<TData, TError>>`. The wrappers strip this to `Promise<void>`. Since no caller consumes the result, the cast is safe either way.
  - Evidence: `node_modules/@tanstack/query-core/build/modern/hydration-CdBkFt9i.d.cts:912`.

- **Q: Would a shared factory also eliminate staleTime/gcTime/queryKey repetition?**
  - A: Yes, a factory accepting `{ queryKey, queryFn, enabled, staleTime?, gcTime? }` could encode all boilerplate. However, the data field naming varies (`bookingsData`, `preordersData`, `data`) — a factory cannot normalise output field names without breaking all destructuring at call sites. The factory would therefore wrap `useQuery` and return `{ data, isLoading, error, refetch }` with a fixed field name, requiring callers to rename on destructure. Given the asymmetric field names are by design (semantic clarity), a factory that addresses only the `refetch` wrapper is lower-risk than one that also normalises output shape.
  - Evidence: survey of all 14 return statements confirms heterogeneous field names.

- **Q: Which option is best — type alias, shared factory, or direct cast?**
  - A: **Type alias + direct cast (Option C)** is the lowest-risk, highest-value approach for the short term:
    - Define `export type PureDataRefetch = () => Promise<void>` in a shared types file (e.g., `hooks/pureData/types.ts`).
    - In each hook, replace the wrapper with `refetch: rqRefetch as unknown as PureDataRefetch` (Pattern A) or `const refetch = refetchQuery as unknown as PureDataRefetch` (Pattern B).
    - This eliminates all 12 wrapper closures, removes the async boilerplate, preserves the `Promise<void>` contract for all callers, and requires no factory infrastructure.
    - **All 12 hooks** (including `useFetchGuestProfile` and `useFetchQuestProgress`) can use the pure cast — the staleness logic in those two hooks is outside the `refetch` body and is unaffected.
    - Option A (type alias only without cast) still requires a wrapper or cast at each hook — partial improvement.
    - Option B (shared factory) addresses more boilerplate but requires a non-trivial factory hook and risks breaking the three manual mock files that currently have no `refetch` field.
    - **Preferred approach:** Type alias + cast for all 12 hooks uniformly.
  - Evidence: code review of all 14 hooks; `useFetchGuestProfile.ts:97–99` and `useFetchQuestProgress.ts:97–99` confirm plain `await refetchQuery()` body; staleness logic at lines 102–103 is separate.

- **Q: Do mock files need updating?**
  - A: The 3 manual mock files (`__mocks__/useFetchBookingsData.ts`, `__mocks__/useFetchGuestDetails.ts`, `__mocks__/useFetchPreordersData.ts`) currently have no `refetch` field — a pre-existing interface mismatch. `useOccupantDataSources.test.ts` compensates by supplying its own inline mocks that include `refetch`. Updating the manual mock files with `refetch: jest.fn(async () => {})` is required as part of this change so that the mock interface matches the updated hook interface.

### Open (Operator Input Required)

No questions require operator input. All key decisions are resolvable from codebase evidence and engineering judgment.

## Confidence Inputs

- **Implementation:** 92%
  - Evidence: all 14 files read; pattern confirmed; cast approach is one-line-per-hook with no logic change. All 12 RQ-backed hooks use a plain `await rqRefetch()`/`await refetchQuery()` body — uniform cast applies to all without exception.
  - To reach >=90: already at 92%. Cast syntax and TypeScript compatibility verified against installed types.

- **Approach:** 88%
  - Evidence: type alias + cast is idiomatic TypeScript; callers typed as `() => Promise<void>` remain satisfied; existing mocks remain compatible.
  - To reach >=90: verify TypeScript does not flag `rqRefetch as unknown as PureDataRefetch` across all targeted hooks via `pnpm typecheck` post-change.

- **Impact:** 85%
  - Evidence: 12 wrapper closures removed; future hooks simplified; no runtime behaviour change since callers ignore resolved value.
  - To reach >=90: confirm in CI typecheck that no consumer breaks.

- **Delivery-Readiness:** 90%
  - All affected file paths known, pattern classified per hook, approach decided.

- **Testability:** 80%
  - The fulfilled value of `refetch()` changes from `undefined` (async wrapper always resolves void) to `QueryObserverResult` (cast exposes underlying value), but no current consumer reads this value — confirmed by caller audit. Existing tests remain valid. Updating 3 manual mock files with `refetch: jest.fn(async () => {})` is required (not optional) to keep mock interfaces in sync. No new test infrastructure needed.
  - To reach >=90: add `refetch` field to 3 manual mock files and confirm CI passes.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| TypeScript rejects `as unknown as PureDataRefetch` cast in strict mode | Low | Low | TypeScript's double cast through `unknown` is always valid; the cast is explicit and lint-suppressable if needed. |
| Staleness-logic hooks (`useFetchGuestProfile`, `useFetchQuestProgress`) accidentally modified | Low | Low | Staleness logic is outside the `refetch` body; the cast change is safe. Confirmed by reading `useFetchGuestProfile.ts:97–103` and `useFetchQuestProgress.ts:97–103`. |
| Manual mock files missing `refetch` field break future tests | Low | Low | Mocks currently unused for refetch in tests; adding the field is a low-effort clean-up. |
| Orchestrator `useOccupantDataSources.ts` uses optional chaining (`refetchBookingsData?.()`) on refetch | Low | Low | Optional chaining on `() => Promise<void>` remains valid; no change needed in orchestrator. |
| New hooks added in parallel by another agent without the shared type | Low | Low | Type alias in shared file makes adoption opt-in; existing per-hook wrapper pattern still compiles. Document the type alias in a short code comment at definition. |

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| All 14 pureData hooks — pattern classification | Yes | None | No |
| Caller audit — return value consumption | Yes | None | No |
| React Query v5 refetch type signature | Yes | None | No |
| staleTime/gcTime variation per hook | Yes | None | No |
| Mock file compatibility | Yes | Minor: 3 manual mock files lack `refetch` field; update required as part of this change | No |
| Staleness-logic hooks (useFetchGuestProfile, useFetchQuestProgress) | Yes | None — staleness logic is outside the `refetch` body; plain cast applies uniformly | No |
| `useOccupantDataSources` fan-out and orchestrator chain | Yes | None | No |
| Test landscape — existing tests remain valid | Yes | None | No |

No Critical findings. All scope areas clear. All 12 pureData RQ-backed hooks can use a uniform cast — no exceptions.

## Scope Signal

- **Signal:** right-sized
- **Rationale:** 12 hooks with identical boilerplate; approach is one-line-per-hook cast; no new infrastructure beyond a 3-line shared type file; caller survey is complete; test impact is minimal. Scope is proportionate to the problem.

## Evidence Gap Review

### Gaps Addressed

- Confirmed return-type stripping is harmless (no caller uses resolved value) — eliminates the main risk of exposing `QueryObserverResult`.
- Confirmed mock files do not include `refetch`, which means the type alias approach does not break any existing mock.
- Confirmed all 12 RQ-backed hooks have a plain `await rqRefetch()`/`await refetchQuery()` body — uniform cast applies to all without exception. Staleness logic in `useFetchGuestProfile` and `useFetchQuestProgress` is outside the `refetch` function and is unaffected.
- Confirmed React Query v5 type signature from installed node_modules.

### Confidence Adjustments

- Implementation raised to 92% after confirming all 14 files and verifying uniform plain-wrapper pattern across all 12 RQ-backed hooks.
- Testability held at 80% because no new unit tests cover the cast change (runtime behaviour is identical; only TypeScript compilation validates correctness).

### Remaining Assumptions

- A `// @ts-expect-error` or double cast is not flagged by the project's ESLint configuration as a lint error — standard in most projects, but not verified. If it is, a thin wrapper `(r: typeof rqRefetch): PureDataRefetch => r` function in the shared file would replace the inline cast.
- The existing `QueryProvider.tsx` wraps all prime pages with `QueryClientProvider`; all pureData hooks are therefore in-context (confirmed by the provider location at `apps/prime/src/providers/QueryProvider.tsx`).

## Planning Constraints & Notes

- **Must-follow patterns:**
  - Define `PureDataRefetch` in `apps/prime/src/hooks/pureData/types.ts` (new file, or add to an existing shared types module if one exists).
  - Pattern A hooks: replace `refetch: async () => { await rqRefetch(); }` with `refetch: rqRefetch as unknown as PureDataRefetch`.
  - Pattern B hooks (all 5: `useFetchBookingsDataServer`, `useFetchCheckInCode`, `useFetchPreArrivalData`, `useFetchGuestProfile`, `useFetchQuestProgress`): replace the `const refetch = async (): Promise<void> => { await refetchQuery(); }` block with `const refetch = refetchQuery as unknown as PureDataRefetch`. The staleness logic in the last two hooks is separate code outside the function and is unaffected.
  - Hook without refetch (`useFetchBagStorageData`): no change.
  - Firebase listener hook (`useFetchCompletedTasksData`): out of scope.
- **Rollout/rollback expectations:** The cast changes the fulfilled value of `refetch()` from `undefined` to `QueryObserverResult`, but the caller audit confirms zero consumers use this value — net runtime impact is nil. Rollback is a revert of affected lines if typecheck or lint fails.
- **Observability expectations:** None required — no runtime state changes.

## Suggested Task Seeds (Non-binding)

1. Create `apps/prime/src/hooks/pureData/types.ts` with `export type PureDataRefetch = () => Promise<void>`.
2. Update Pattern A hooks (7 files): inline cast.
3. Update Pattern B hooks (all 5 files: `useFetchBookingsDataServer`, `useFetchCheckInCode`, `useFetchPreArrivalData`, `useFetchGuestProfile`, `useFetchQuestProgress`): replace extracted const with cast (`const refetch = refetchQuery as unknown as PureDataRefetch`).
4. Update 3 manual mock files to add `refetch: jest.fn(async () => {})`.
5. Run `pnpm --filter @apps/prime typecheck && pnpm --filter @apps/prime lint` and confirm clean.

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package: `bash scripts/validate-changes.sh` passes; `pnpm --filter @apps/prime typecheck` passes; `pnpm --filter @apps/prime lint` passes; all 12 pureData hooks use `PureDataRefetch` type; no async wrapper closures remain (all replaced with cast); 3 manual mock files updated with `refetch` field.
- Post-delivery measurement plan: none (type-only refactor; no runtime metric change expected).

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan prime-refetch-boilerplate --auto`
