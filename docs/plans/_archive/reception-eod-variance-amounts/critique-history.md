# Critique History — reception-eod-variance-amounts

## Plan Critique — Round 1 — 2026-03-01

- Route: codemoot
- Artifact: plan.md
- Score: 7/10 → lp_score 3.5 (partially credible)
- Verdict: NEEDS_REVISION
- Findings: 4 warnings (Major), 1 info (Minor)
  - Dependency inconsistency: Parallelism Wave 3 said TASK-03/TASK-04 parallel but TASK-04 Depends-on listed TASK-03. Fixed: TASK-04 depends only on TASK-01; Parallelism updated (TASK-02 and TASK-04 now both in Wave 2).
  - TASK-05 dependency gap: Task Summary said TASK-05 depends on TASK-04 only; Parallelism said both TASK-03 and TASK-04. Fixed: TASK-05 now depends on TASK-03, TASK-04.
  - Zod undefined stripping: Acceptance said "Zod strips undefined optionals" — incorrect. Fixed: acceptance and execution plan updated to require explicit conditional omission of undefined keys before safeParse.
  - Fallback contract inconsistency: Constraints said "omit or show `—`"; TASK-04 acceptance said omission-only. Fixed: Constraints updated to omission-only.
  - `Outcome Contract Why: TBD` — carried as Minor (non-blocking).

## Plan Critique — Round 2 — 2026-03-01

- Route: codemoot
- Artifact: plan.md
- Score: 8/10 → lp_score 4.0 (credible)
- Verdict: NEEDS_REVISION (3 Major still present)
- Findings: 3 warnings (Major), 1 info (Minor)
  - Dependency model still inconsistent: Wave 3 still showed TASK-04 under "TASK-02 complete" prerequisite. Fixed: Parallelism completely rewritten — Wave 2 is now TASK-02+TASK-04 (both depend only on TASK-01); Wave 3 is TASK-03 (depends on TASK-02).
  - Firebase `undefined` key note technically inaccurate: said "would write a null key". Fixed: Note corrected — Firebase RTDB silently drops undefined-valued keys; implementation must explicitly omit them regardless, making the guard testable.
  - UI behavior ambiguous: TASK-03 acceptance said "absent (or shows `—`)". Fixed: updated to "absent — omitted entirely" consistent with omission-only contract.
  - `Outcome Contract Why: TBD` — carried as Minor.

## Plan Critique — Round 3 — 2026-03-01 (final)

- Route: codemoot
- Artifact: plan.md
- Score: 8/10 → lp_score 4.0 (credible)
- Verdict: NEEDS_REVISION (advisory only — 1 warning downgraded to assumption note; 2 info)
- Findings: 1 warning (advisory), 2 info (Minor)
  - Firebase behavior should be marked as implementation assumption: Fixed — acceptance note now explicitly labels it as "Implementation assumption" and states the guard is explicit-and-testable regardless of SDK version.
  - `Outcome Contract Why: TBD` — carried as Minor (non-blocking).
  - `useEodClosureData.ts` blast-radius precision: Fact-Find Reference listed it in blast radius but plan has no task for it. Fixed: note added clarifying it is unchanged-by-design (type inference flows through automatically).
- Gate: credible (lp_score ≥4.0), no Critical findings → proceed to build.

## Fact-Find Critique History

## Round 1 — 2026-03-01

- Route: codemoot
- Score: 6/10 → lp_score 3.0 (partially credible)
- Verdict: NEEDS_REVISION
- Findings: 4 warnings (Major), 1 info (Minor)
  - Scope inconsistency: Goals listed `safeVariance`/`keycardVariance` but scope narrowed to `cashVariance`/`stockItemsCounted`. Fixed: Goals section clarified and Non-goals updated to explicitly exclude safe/keycard variance.
  - `limitToLast: 10` could silently undercount shifts. Fixed: Constraints and TASK-03 updated to bump limit to 20; Remaining Assumptions updated.
  - Signed-value direction was inverted in example. Fixed: Direction corrected (positive = over, negative = short).
  - Positional optional args `(cashVariance?, stockItemsCounted?)` brittle. Fixed: Standardised on typed object `(snapshot?: { cashVariance?: number; stockItemsCounted?: number })` throughout.
  - `Outcome Contract Why: TBD` — non-blocking; inherent to auto-dispatched work.

## Round 2 — 2026-03-01

- Route: codemoot
- Score: 8/10 → lp_score 4.0 (credible)
- Verdict: NEEDS_REVISION (2+ Major still present)
- Findings: 2 warnings (Major), 1 info (Minor)
  - Remaining Assumptions still said `limitToLast: 10`. Fixed: updated to reference limit 20.
  - Test seams section still referenced positional signature. Fixed: updated to typed object contract.
  - `Outcome Contract Why: TBD` — carried as Minor.

## Round 3 — 2026-03-01 (final)

- Route: codemoot
- Score: 9/10 → lp_score 4.5 (credible)
- Verdict: APPROVED
- Findings: 0 Critical, 0 Major, 1 info (Minor — `Why: TBD`, non-blocking)
- Gate: credible (≥4.0), no Critical → proceed to planning.
