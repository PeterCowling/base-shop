# Critique History — prime-refetch-boilerplate

## Round 3 (Final)

- **Route:** codemoot
- **Score:** 8/10 → lp_score 4.0
- **Verdict:** needs_revision (advisory only — Round 3 is final; lp_score 4.0 is credible)
- **Severity counts:** Critical: 0, Major (warnings): 3, Minor: 0

### Findings

1. [Major] Key Modules section still described mocks as "typed as `{ refetch: jest.fn(async () => {}) }`" — inaccurate; mocks have no `refetch` field at all.
2. [Major] `Testability` section said mock update was optional ("can be updated optionally") after other sections said it was required — internal inconsistency.
3. [Major] Rollback/observability section claimed "no runtime behaviour change" — technically incorrect since the fulfilled value changes from `undefined` to `QueryObserverResult` (safe, as no caller reads it, but not literally no-change).

### Autofixes applied

- Key Modules entry for `__mocks__/` corrected: no `refetch` field currently; update is required.
- `Testability` section aligned: mock update is required, not optional.
- Rollback framing corrected: notes fulfilled value change and confirms nil net impact via caller audit.
- `useFetchGuestProfile` and `useFetchQuestProgress` Key Modules descriptions corrected: plain wrapper body, staleness logic is separate.

### Post-loop gate

lp_score 4.0 ≥ 4.0 threshold, no Critical findings → **credible** → proceed to planning.

---

## Round 2

- **Route:** codemoot
- **Score:** 8/10 → lp_score 4.0
- **Verdict:** needs_revision (3 Major warnings remaining)
- **Severity counts:** Critical: 0, Major: 3, Minor: 0

### Findings

1. [Major] Mock-compatibility constraint in Constraints section still inaccurate.
2. [Major] Internal inconsistency on staleness hooks vs uniform cast across multiple sections.
3. [Major] Validation commands missing `bash scripts/validate-changes.sh`.

### Autofixes applied

- Constraints section corrected: mocks have no `refetch` field; update is required.
- Removed remaining references to staleness hooks as exceptions.
- Added `bash scripts/validate-changes.sh` to acceptance package.

---

## Round 1

- **Route:** codemoot
- **Score:** 7/10 → lp_score 3.5
- **Verdict:** needs_revision
- **Severity counts:** Critical: 0, Major (warnings): 3, Minor: 0

### Findings

1. [Major] Staleness-logic hooks (`useFetchGuestProfile`, `useFetchQuestProgress`) misclassified — `refetch` body is plain wrapper; staleness logic is outside the function. Recommendation to exclude them from pure-cast was evidence-weak.
2. [Major] Mock compatibility evidence overstated — the three manual mock files do not include `refetch` field; this understated the cleanup needed.
3. [Major] Validation command used wrong filter name (`prime` instead of `@apps/prime`).

### Autofixes applied

- Corrected staleness-hook classification: both hooks confirmed to have plain `await refetchQuery()` body; all 12 hooks now treated uniformly.
- Corrected mock contract description: manual mock files have no `refetch` field; mock update is now required deliverable.
- Fixed filter name in validation commands and acceptance package to `@apps/prime`.
- Updated Rehearsal Trace: Moderate finding on staleness hooks removed (no issue confirmed).
- Updated Planning Constraints: removed exception for staleness hooks; all 5 Pattern B hooks use cast uniformly.
