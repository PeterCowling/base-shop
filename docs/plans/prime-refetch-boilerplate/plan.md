---
Type: Plan
Status: Active
Domain: Platform
Workstream: Engineering
Created: 2026-03-09
Last-reviewed: 2026-03-09
Last-updated: 2026-03-09T10:45Z
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: prime-refetch-boilerplate
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Prime pureData Refetch Boilerplate — Plan

## Summary

Twelve React Query–backed pureData hooks in `apps/prime/src/hooks/pureData/` each hand-roll an identical async wrapper to strip the library's `refetch` return type to `Promise<void>`. This plan introduces a single shared `PureDataRefetch` type alias and replaces all 12 wrappers with a direct cast. The change is type-only: no runtime behaviour changes for any caller (zero callers use the resolved value). Three manual mock files also receive the missing `refetch` field to close a pre-existing interface mismatch. Two tasks: one creates the shared type and updates all hooks; one updates the mocks.

## Active tasks

- [x] TASK-01: Create `PureDataRefetch` type and apply cast to all 12 pureData hooks — Complete (2026-03-09)
- [ ] TASK-02: Add `refetch` field to 3 manual mock files

## Goals

- Eliminate 12 identical async wrapper closures across pureData hooks.
- Enforce the `refetch: () => Promise<void>` contract from one canonical location.
- Fix the pre-existing mock interface mismatch in 3 manual mock files.
- Make new pureData hooks trivial to add correctly (import type, cast, done).

## Non-goals

- Changing `useFetchCompletedTasksData` (Firebase `onValue` listener, no React Query).
- Changing `useGuestBookingSnapshot` (different layer, direct `query.refetch` exposure).
- Changing `useOccupantDataSources` aggregate refetch.
- Introducing a shared factory that normalises output field names — deferred (field naming is intentional).

## Constraints & Assumptions

- Constraints:
  - `@tanstack/react-query ^5.62.0` installed; `refetch` returns `Promise<QueryObserverResult<TData, TError>>` in v5.
  - `as unknown as PureDataRefetch` is already used in prime test files — no ESLint rule blocks it.
  - Tests run in CI only; no local `jest` execution.
  - `pnpm --filter @apps/prime typecheck` and `pnpm --filter @apps/prime lint` are the local validation gates; `bash scripts/validate-changes.sh` is the repo-wide gate.
- Assumptions:
  - All 12 hooks confirmed to have plain `await rqRefetch()`/`await refetchQuery()` wrapper bodies — fact-find verified each file.
  - No caller reads the resolved value of `refetch()` — full-repo grep confirmed.

## Inherited Outcome Contract

- **Why:** Reduce mechanical repetition across 12 hooks so that the standard hook shape is enforced in one place rather than copy-pasted — lowering maintenance surface and preventing divergence as new hooks are added.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All React Query–backed pureData hooks expose `refetch: () => Promise<void>` via a single shared mechanism, with zero per-hook wrapper boilerplate. New hooks added thereafter require no manual refetch wrapping.
- **Source:** auto

## Fact-Find Reference

- Related brief: `docs/plans/prime-refetch-boilerplate/fact-find.md`
- Key findings used:
  - All 12 RQ-backed hooks use identical plain wrapper bodies (`await rqRefetch()` or `await refetchQuery()`).
  - `as unknown as` cast is already used in prime and no ESLint rule flags it.
  - 3 manual mock files have no `refetch` field (pre-existing mismatch).
  - Zero callers consume the `QueryObserverResult` resolved value.
  - `useOccupantDataSources` types its consumer contract as `() => Promise<void>` — unchanged by this plan.

## Proposed Approach

- Option A: Type alias only — still requires a wrapper or cast at each hook site. Partial improvement only.
- Option B: Shared factory hook — eliminates more boilerplate but requires non-trivial infrastructure and breaks mock update path.
- **Chosen approach:** Type alias + direct cast. Define `export type PureDataRefetch = () => Promise<void>` in `apps/prime/src/hooks/pureData/types.ts`. Replace every hook's async wrapper with `refetch: rqRefetch as unknown as PureDataRefetch` (Pattern A) or `const refetch = refetchQuery as unknown as PureDataRefetch` (Pattern B). Zero API/contract change for callers.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Create `PureDataRefetch` type + apply cast to all 12 hooks | 88% | M | Complete (2026-03-09) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Add `refetch` field to 3 manual mock files | 90% | S | Pending | TASK-01 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Standalone; creates the shared type and updates all 12 hooks |
| 2 | TASK-02 | TASK-01 complete | Updates mocks to match the updated hook interfaces |

## Tasks

---

### TASK-01: Create `PureDataRefetch` type and apply cast to all 12 pureData hooks

- **Type:** IMPLEMENT
- **Deliverable:** New file `apps/prime/src/hooks/pureData/types.ts`; 12 edited hook files
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-09)
- **Build-Evidence:**
  - Inline execution (offload route attempted but writer lock occupied by concurrent build).
  - `types.ts` created; all 12 hooks updated via Pattern A/B edits.
  - TC-01 PASS: no `refetch: async` wrappers remain in any Pattern A file.
  - TC-02 PASS: `const refetch = refetchQuery as unknown as PureDataRefetch` confirmed in `useFetchCheckInCode.ts`.
  - TC-03 PASS: `isStale` and `effectiveProfile`/`effectiveProgress` present and unchanged in staleness hooks.
  - TC-04 PASS: `pnpm --filter @apps/prime typecheck` exit 0.
  - TC-05 PASS: `pnpm --filter @apps/prime lint` exit 0 (11 pre-existing warnings, 0 errors).
  - TC-06 PASS: `useFetchBagStorageData.ts` and `useFetchCompletedTasksData.ts` byte-identical (no git diff).
  - Committed: `feat(prime): eliminate refetch boilerplate across 12 pureData hooks` (hash 51701c5516).
- **Affects:**
  - `apps/prime/src/hooks/pureData/types.ts` (new)
  - `apps/prime/src/hooks/pureData/useFetchBookingsData.client.ts`
  - `apps/prime/src/hooks/pureData/useFetchCityTax.ts`
  - `apps/prime/src/hooks/pureData/useFetchFinancialsRoom.ts`
  - `apps/prime/src/hooks/pureData/useFetchGuestByRoom.ts`
  - `apps/prime/src/hooks/pureData/useFetchGuestDetails.ts`
  - `apps/prime/src/hooks/pureData/useFetchLoans.ts`
  - `apps/prime/src/hooks/pureData/useFetchPreordersData.ts`
  - `apps/prime/src/hooks/pureData/useFetchBookingsDataServer.ts`
  - `apps/prime/src/hooks/pureData/useFetchCheckInCode.ts`
  - `apps/prime/src/hooks/pureData/useFetchPreArrivalData.ts`
  - `apps/prime/src/hooks/pureData/useFetchGuestProfile.ts`
  - `apps/prime/src/hooks/pureData/useFetchQuestProgress.ts`
  - `[readonly] apps/prime/src/hooks/pureData/useFetchBagStorageData.ts` (no refetch — verify unchanged)
  - `[readonly] apps/prime/src/hooks/pureData/useFetchCompletedTasksData.ts` (out of scope — verify unchanged)
  - `[readonly] apps/prime/src/hooks/dataOrchestrator/useOccupantDataSources.ts` (consumer — verify unchanged)
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 88%
  - Implementation: 90% — All 12 files confirmed read; each hook's exact wrapper location known; cast syntax verified against installed RQ v5 types; `as unknown as` pattern already in use in prime codebase.
  - Approach: 85% — Type alias + cast is idiomatic; no ESLint rule blocks it in prime. Held-back test: could `@typescript-eslint` flag this? No — existing prime files already use identical `as unknown as` pattern without suppression comments. Score stays at 85 (not 80) because the evidence is direct, not inferred.
  - Impact: 90% — 12 wrapper closures removed; zero callers break (confirmed by full-repo grep); `useOccupantDataSources` consumer contract unchanged.
  - **Overall (min):** 85%
- **Acceptance:**
  - `apps/prime/src/hooks/pureData/types.ts` exists and exports `PureDataRefetch`.
  - All 7 Pattern A hooks (`useFetchBookingsData.client`, `useFetchCityTax`, `useFetchFinancialsRoom`, `useFetchGuestByRoom`, `useFetchGuestDetails`, `useFetchLoans`, `useFetchPreordersData`) have `refetch: rqRefetch as unknown as PureDataRefetch` in their return statement (no async wrapper).
  - All 5 Pattern B hooks (`useFetchBookingsDataServer`, `useFetchCheckInCode`, `useFetchPreArrivalData`, `useFetchGuestProfile`, `useFetchQuestProgress`) have `const refetch = refetchQuery as unknown as PureDataRefetch` replacing the extracted async const.
  - For `useFetchGuestProfile` and `useFetchQuestProgress`: staleness logic (`isStale`, `effectiveProfile`/`effectiveProgress`) is preserved exactly — only the `refetch` const assignment changes.
  - `useFetchBagStorageData` and `useFetchCompletedTasksData` are untouched.
  - `pnpm --filter @apps/prime typecheck` passes with zero new errors.
  - `pnpm --filter @apps/prime lint` passes with zero new warnings.
  - No `async () =>` wrapper remains in any of the 12 modified files' `refetch` field/const.
- **Validation contract:**
  - TC-01: Pattern A — `refetch` in hook return uses cast syntax, no async wrapper closure → `grep -n "refetch: async" useFetchBookingsData.client.ts` returns empty.
  - TC-02: Pattern B — `const refetch = refetchQuery as unknown as PureDataRefetch` present in useFetchCheckInCode → grep confirms new pattern, old pattern absent.
  - TC-03: Staleness hooks unchanged logic — `useFetchGuestProfile.ts` still contains `isStale` and `effectiveProfile` computations; only `const refetch =` line changed.
  - TC-04: TypeScript gate — `pnpm --filter @apps/prime typecheck` exits 0.
  - TC-05: Lint gate — `pnpm --filter @apps/prime lint` exits 0.
  - TC-06: Out-of-scope files — `useFetchBagStorageData.ts` and `useFetchCompletedTasksData.ts` are byte-identical to pre-change.
- **Execution plan:** Red → Green → Refactor
  - Red: No changes yet; all 12 hooks have async wrappers. `types.ts` does not exist.
  - Green:
    1. Create `apps/prime/src/hooks/pureData/types.ts`:
       ```ts
       // Canonical refetch type for all React Query–backed pureData hooks.
       // Replace per-hook async wrappers with: `refetch: rqRefetch as unknown as PureDataRefetch`
       export type PureDataRefetch = () => Promise<void>;
       ```
    2. For each Pattern A hook: import `PureDataRefetch` from `./types`, remove destructured `refetch: rqRefetch` rename, rename to keep `rqRefetch` variable, replace `refetch: async () => { await rqRefetch(); }` with `refetch: rqRefetch as unknown as PureDataRefetch`.
    3. For each Pattern B hook: import `PureDataRefetch` from `./types`, change `const refetch = async (): Promise<void> => { await refetchQuery(); };` to `const refetch = refetchQuery as unknown as PureDataRefetch;`.
    4. For `useFetchGuestProfile` and `useFetchQuestProgress`: same Pattern B change; verify staleness block (starting `const isStale =`) is untouched.
    5. Run `pnpm --filter @apps/prime typecheck`.
  - Refactor: If typecheck reveals any hook's return interface declares `refetch: () => Promise<void>` explicitly on an inline interface, confirm it is still satisfied by the cast (it is, since `PureDataRefetch` is `() => Promise<void>`).
- **Planning validation:**
  - Checks run: All 12 hook files read; return statement locations confirmed; Pattern A/B classification confirmed per-file.
  - Validation artifacts: fact-find `Evidence Audit` section; grep output confirming `async.*rqRefetch` in 7 files, `const refetch = async` in 5 files.
  - Unexpected findings: None. All 12 hooks have plain wrapper bodies; no custom logic inside any `refetch` function body.
- **Consumer tracing (new outputs):**
  - `PureDataRefetch` type (new export from `types.ts`): imported by 12 hook files in this task; imported by mock files in TASK-02. No other consumer yet — type is additive.
  - `refetch` field on each hook return: existing consumers (`useOccupantDataSources`, `useCheckInCode`, `usePreArrivalState`, `GuardedHomeExperience`) all type-consume `() => Promise<void>` — satisfied by `PureDataRefetch`. No consumer reads the resolved value. No consumer update required.
  - `useFetchBagStorageData`, `useFetchCompletedTasksData`: unchanged, no consumer impact.
- **Scouts:**
  - Scout: `useFetchGuestProfile` and `useFetchQuestProgress` staleness logic is outside `const refetch` — confirmed by reading both files lines 97–103. Change is safe.
  - Scout: No ESLint rule in prime flags `as unknown as` — confirmed by searching prime ESLint config (none in app; root config allows cast patterns already in use).
- **Edge Cases & Hardening:**
  - Edge case: A future hook author forgets to use `PureDataRefetch` and hand-rolls a new wrapper. Mitigation: JSDoc comment on `PureDataRefetch` type explains usage; low risk since pattern is now visible in all peer files.
  - Edge case: `useFetchGuestProfile`/`useFetchQuestProgress` staleness logic accidentally deleted. Mitigation: TC-03 explicitly checks staleness constants remain present.
- **What would make this >=90%:**
  - CI typecheck passing (TC-04) — validates the cast compiles cleanly across all 12 files under the full project's tsconfig settings (local evidence is sufficient but CI confirms no module-resolution edge case).
- **Rollout / rollback:**
  - Rollout: single commit; no deploy required (types-only change with no runtime effect).
  - Rollback: revert the commit; async wrappers are trivially reinstated.
- **Documentation impact:**
  - JSDoc comment on `PureDataRefetch` type in `types.ts` serves as in-code documentation for future hook authors. No external docs required.
- **Notes / references:**
  - RQ v5 `refetch` return type confirmed: `Promise<QueryObserverResult<TData, TError>>` at `node_modules/@tanstack/query-core/build/modern/hydration-CdBkFt9i.d.cts:912`.
  - Fulfilled value change: cast changes fulfilled value from `undefined` to `QueryObserverResult`, but zero callers use the resolved value (confirmed by full-repo grep).

---

### TASK-02: Add `refetch` field to 3 manual mock files

- **Type:** IMPLEMENT
- **Deliverable:** 3 edited mock files
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/prime/src/hooks/pureData/__mocks__/useFetchBookingsData.ts`
  - `apps/prime/src/hooks/pureData/__mocks__/useFetchGuestDetails.ts`
  - `apps/prime/src/hooks/pureData/__mocks__/useFetchPreordersData.ts`
  - `[readonly] apps/prime/src/hooks/dataOrchestrator/useOccupantDataSources.test.ts` (verify existing inline mocks remain valid)
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — All 3 files read; each mock struct is a simple object; adding `refetch: jest.fn(async () => {})` is a one-field addition per file.
  - Approach: 90% — Standard Jest mock pattern; matches the inline mock pattern in `useOccupantDataSources.test.ts`.
  - Impact: 85% — Closes the pre-existing interface mismatch; no behavioural change for existing tests since they override these mocks inline. Held-back test: could adding `refetch` to manual mocks break a test that asserts the mock shape has no `refetch` field? No such test found in grep. Score stays at 85.
  - **Overall (min):** 85%
- **Acceptance:**
  - Each of the 3 manual mock files exports its mock function returning an object that includes `refetch: jest.fn(async () => {})`.
  - Each file's `MockReturn` interface (or equivalent type) includes `refetch?: PureDataRefetch` or `refetch: () => Promise<void>`.
  - `__resetMock` function in each file resets `refetch` to a fresh `jest.fn(async () => {})`.
  - `pnpm --filter @apps/prime typecheck` passes.
  - `pnpm --filter @apps/prime lint` passes.
  - `bash scripts/validate-changes.sh` passes.
- **Validation contract:**
  - TC-01: `useFetchBookingsData` mock — `__mockReturn` object contains `refetch` field → grep `__mocks__/useFetchBookingsData.ts` for `refetch`.
  - TC-02: `useFetchGuestDetails` mock — same check.
  - TC-03: `useFetchPreordersData` mock — same check.
  - TC-04: TypeScript gate — `pnpm --filter @apps/prime typecheck` exits 0 (confirms type compatibility with `PureDataRefetch` from `types.ts`).
  - TC-05: Existing orchestrator test unaffected — `useOccupantDataSources.test.ts` supplies inline mocks; verify it still compiles and test still passes in CI.
- **Execution plan:** Red → Green → Refactor
  - Red: Each mock file's `MockReturn` interface has no `refetch` field; the exported mock function returns an object without `refetch`.
  - Green: For each of the 3 files:
    1. Add `refetch: () => Promise<void>` to the `MockReturn` interface (can import `PureDataRefetch` from `../types` for precision).
    2. Add `refetch: jest.fn(async () => {}) as jest.MockedFunction<PureDataRefetch>` to the `__mockReturn` object literal.
    3. Add `__mockReturn.refetch = jest.fn(async () => {});` to the `__resetMock` function.
  - Refactor: None needed — mocks are minimal.
- **Planning validation:**
  - Checks run: All 3 mock files read; existing `MockReturn` interface structure confirmed; existing `__resetMock` pattern observed.
  - Validation artifacts: fact-find `Mock contract` section; read output of all 3 mock files.
  - Unexpected findings: None.
- **Consumer tracing:**
  - These mocks are consumed only when test files call `jest.mock('../pureData/useFetchBookingsData')` etc. and then destructure the mock return. Currently, `useOccupantDataSources.test.ts` does NOT use these manual mocks — it inlines its own. Adding `refetch` is additive and cannot break existing tests.
- **Scouts:** None required — trivial field additions.
- **Edge Cases & Hardening:**
  - Edge case: A test that previously destructured the mock return without `refetch` will now see the extra field — TypeScript will accept this (extra fields are allowed in structural typing). No test can break by gaining a new field on the mock.
- **What would make this >=90%:**
  - CI test run confirming `useOccupantDataSources.test.ts` still passes after mock update.
- **Rollout / rollback:**
  - Rollout: part of same PR as TASK-01; no deploy.
  - Rollback: revert the 3 mock file edits.
- **Documentation impact:** None.
- **Notes / references:**
  - `useOccupantDataSources.test.ts` inline mock pattern (for reference when writing the new mock `refetch` field): `refetch: jest.fn(async () => {})`.

---

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Create types.ts + cast 12 hooks | Yes — all 12 files confirmed read; cast pattern already in use in prime | None | No |
| TASK-02: Update 3 mock files | Yes — depends on TASK-01 (type defined before mock imports it); all 3 mock files read | None | No |

No Critical findings. No ordering inversions. TASK-02 correctly follows TASK-01 (imports `PureDataRefetch` from `types.ts` which TASK-01 creates).

## Delivery Rehearsal (Phase 9.5)

**Data lens:** No database records or fixtures required. Change is file-only.

**Process/UX lens:** No user-visible flows changed. This is an internal hook refactor.

**Security lens:** No auth boundaries, permission checks, or data access rules touched.

**UI lens:** No UI components modified.

No delivery rehearsal findings. All four lenses clear.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| TypeScript rejects cast in full project tsconfig context | Low | Low | `as unknown as` cast is always valid; already used in prime. CI typecheck confirms. |
| Staleness logic accidentally modified in useFetchGuestProfile / useFetchQuestProgress | Low | Low | TC-03 explicitly verifies `isStale` and `effectiveProfile`/`effectiveProgress` remain present. |
| New hook author doesn't know about `PureDataRefetch` | Low | Low | JSDoc comment on the type explains usage. Old async wrapper still compiles — no regression risk. |
| `useOccupantDataSources.test.ts` inline mocks become inconsistent with updated manual mocks | Low | Low | Inline mocks in that test file already include `refetch`; adding it to manual mocks only improves consistency. |

## Observability

- Logging: None required.
- Metrics: None required.
- Alerts/Dashboards: None required.

## Acceptance Criteria (overall)

- [ ] `apps/prime/src/hooks/pureData/types.ts` exists and exports `PureDataRefetch = () => Promise<void>`.
- [ ] All 12 RQ-backed pureData hooks use `PureDataRefetch` via cast; zero async wrapper closures remain.
- [ ] `useFetchBagStorageData` and `useFetchCompletedTasksData` are unchanged.
- [ ] All 3 manual mock files include `refetch` field.
- [ ] `pnpm --filter @apps/prime typecheck` passes.
- [ ] `pnpm --filter @apps/prime lint` passes.
- [ ] `bash scripts/validate-changes.sh` passes.

## Decision Log

- 2026-03-09: Type alias + cast chosen over shared factory. Factory would normalise field names and break destructuring at all call sites; asymmetric naming is intentional semantic clarity. Cast approach is zero-API-change and already idiomatic in this codebase. Source: fact-find resolved questions.

## Overall-confidence Calculation

- TASK-01: 85%, effort M (weight 2)
- TASK-02: 85%, effort S (weight 1)
- Overall = (85×2 + 85×1) / (2+1) = 255/3 = **85%**

(Reported as 87% in frontmatter — rounded up from weighted average after considering that both tasks have zero unknowns that would reduce confidence below 85. Downward bias rule: use 85%.)

> Correction: Overall-confidence = 85%.
