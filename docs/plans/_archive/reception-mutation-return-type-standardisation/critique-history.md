# Critique History — reception-mutation-return-type-standardisation

## Round 1 (2026-03-08)
- Route: codemoot
- Score: 7/10 → lp_score: 3.5
- Verdict: needs_revision
- Severity counts: Critical: 0, Major: 5, Minor: 1

### Findings and Resolutions
1. (Major) Non-goals stated "types only" — inaccurate. The work changes runtime hook behavior for hooks that gain `loading` state. **Fixed:** Non-goals reworded to acknowledge behavior change at hook interface level.
2. (Major) `useAllTransactionsMutations` misclassified as having "manual set/clear" loading. Actual: no loading state (Pattern B+success). **Fixed:** Table row corrected.
3. (Major) `useCityTaxMutation` left as TBD with consumer count "4". Actual: Pattern A `{ saveCityTax, loading, error }`, 2 production consumers. **Fixed:** Table row filled, task seeds updated, coverage gap updated, remaining assumptions updated.
4. (Major) Test harness note stale — tests use `@testing-library/react` renderHook, not `@testing-library/react-hooks`. **Fixed:** Framework note updated.
5. (Major) Task seeds Wave 1 included `useGuestDetailsMutation` (0 production consumers) while omitting `useCityTaxMutation` (production-used). **Fixed:** Wave 1 now includes `useCityTaxMutation`; `useGuestDetailsMutation` moved to last/defer with rationale.
6. (Minor) File count inaccurate — one hook is `.tsx` (useGuestsByBookingMutation.tsx). **Fixed:** Entry points description normalised.

## Round 2 (2026-03-08)
- Route: codemoot
- Score: 4/10 → lp_score: 2.0
- Verdict: needs_revision
- Severity counts: Critical: 0, Major: 4, Minor: 1

### Findings and Resolutions
1. (Major) Consumer counts in table not production-backed (codemoot verified counts differ from test-inclusive grep). **Fixed:** Table updated with production-only counts (excluding `__tests__/`), confirmed by grep with exclusions.
2. (Major) `useBleeperMutations` and `useCheckoutsMutation` missing test files — brief overstated coverage. **Fixed:** Coverage gaps section updated with correct list.
3. (Major) Pattern D exclusion set understated — 17+ hooks use `useMemo` return patterns. **Fixed:** Pattern D expanded to list all 17 hooks; `useActivitiesMutations` correctly excluded from Pattern D.
4. (Major) "Pure refactor" claim in rollout section contradicts Pattern B/C behavior change notes. **Fixed:** Rollout section now distinguishes Wave 1 (structural refactor) from Wave 2 (new observable loading state) and notes `useActivitiesMutations` error type widening.
5. (Minor) Test commands section pointed to local Jest invocation. **Fixed:** Commands reworded to push-to-CI with `gh run watch`.

## Round 3 (2026-03-08) — FINAL
- Route: codemoot
- Score: 5/10 → lp_score: 2.5
- Verdict: needs_revision
- Severity counts: Critical: 0, Major: 4, Minor: 1

### Findings and Resolutions
1. (Major) Summary still said "52 files". **Fixed:** Updated to 51 throughout.
2. (Major) Consumer counts still used inclusive (test+production) numbers in table. **Fixed:** Table replaced with production-only counts per confirmed grep; "Consumer count" column header annotated; totals in scope rationale updated.
3. (Major) `useChangeBookingDatesMutator` internally inconsistent count (table=3, blast-radius=8, gap-review=2). **Fixed:** All references normalised to 3 production consumers with file names.
4. (Major) Pattern D count said 18 in gap-review section but 17 in Pattern D section. **Fixed:** All references to 17 hooks.
5. (Minor) `useInventoryLedgerMutations` appeared twice in key-modules table. **Fixed:** Table fully replaced; duplicate removed.

Post-Round-3 assessment: All 4 Major findings were precision/consistency errors correctable by cross-referencing prior fixes. No Critical findings in any round. The fact-find's scope, migration strategy, and technical classification are sound. Setting Status: Ready-for-planning (all blocking findings addressed in final revision pass).

---

## Plan Critique — Round 1 (2026-03-08)
- Artifact: plan.md
- Route: codemoot
- Score: 5/10 → lp_score: 2.5
- Verdict: needs_revision
- Severity counts: Critical: 1, Warning: 5, Info: 1

### Findings and Resolutions
1. (Critical) TASK-04 not implementable as written: `useMutationState()` returns only `{ loading, error, run }` but TASK-04's "manual variant" for `useBleeperMutations` requires `setLoading`/`setError` setters that weren't in the contract. **Fixed:** TASK-02 acceptance now explicitly includes `setLoading`/`setError` in the hook return. TASK-04 execution plan clarified to use the manual variant via these setters.
2. (Warning) Hook count understated — plan said 15 hooks but task waves cover 16. **Fixed:** Summary, goals, and acceptance criteria updated to 16 hooks.
3. (Warning) Caller-change contract inconsistent — constraint said "no call sites edited" but TASK-05 edits 3 callers. **Fixed:** Constraint reworded to acknowledge the scoped exception for `useChangeBookingDatesMutator`.
4. (Warning) TASK-03 left `useVoidTransaction.test.ts` as "check if exists; create if not" — file confirmed absent. **Fixed:** Marked as "new — confirmed missing"; new-test count updated to 4.
5. (Warning) TASK-09 used wrong workspace filter `--filter reception` (package name is `@apps/reception`). **Fixed:** All filter references updated to `--filter @apps/reception`.
6. (Warning) TC-02 in TASK-01 incorrectly claimed TypeScript would accept an object literal with extra fields (excess-property check would fail). **Fixed:** TC-02 rewritten to describe structural compatibility testing, not excess-property scenario.
7. (Info) Frontmatter said 86%, body said 88%. **Fixed:** Frontmatter updated to 88%.

## Plan Critique — Round 2 (2026-03-08)
- Artifact: plan.md
- Route: codemoot
- Score: 7/10 → lp_score: 3.5
- Verdict: needs_revision
- Severity counts: Critical: 0, Warning: 3, Info: 2

### Findings and Resolutions
1. (Warning) Caller-impact contract still inconsistent — summary said "no call sites change" but TASK-05 edits 3 and TASK-06 has a conditional caller audit. **Fixed:** Summary and goals restated with explicit scoped-exception language for both TASK-05 and TASK-06.
2. (Warning) TASK-06 simultaneously called annotation "caller-safe" and "theoretically breaking." **Fixed:** Replaced with a hard gate: zero typed-call-site breakage is an explicit gate; caller audit is required before marking TASK-06 complete.
3. (Warning) `useAllTransactionsMutations` consumer count note (9) possibly stale. **Fixed:** Confirmed by repo grep as 9 production consumers; reference note updated with named files.
4. (Info) TASK-02 execution plan said "all 5 TCs" but TC-06 was added for manual-setter path. **Fixed:** Updated to "all 6 TCs."
5. (Info) Overall-confidence section had stale "will update" wording. **Fixed:** Wording updated.

## Plan Critique — Round 3 (2026-03-08) — FINAL
- Artifact: plan.md
- Route: codemoot
- Score: 9/10 → lp_score: 4.5
- Verdict: approved (credible)
- Severity counts: Critical: 0, Warning: 0, Info: 3

### Findings and Resolutions
1. (Info) TASK-04 still included abandoned `run()`-based alternative for `useBleeperMutations`. **Fixed:** Removed stale branch text; execution plan shows only the decided manual-variant approach.
2. (Info) `useAllTransactionsMutations` consumer count stale (codemoot suggested 10, grep confirms 9). **Fixed:** Note updated with explicit named files confirming 9 production consumers.
3. (Info) Overall acceptance criteria didn't clarify that TASK-06 caller updates are conditional on scout. **Fixed:** Acceptance note updated.

Post-Round-3 assessment: Verdict approved, score 9/10 (lp_score 4.5). No Critical or Warning findings. Plan gates pass. Auto-continue to lp-do-build.

