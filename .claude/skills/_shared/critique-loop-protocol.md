# Critique Loop Protocol (Shared)

Used by `lp-do-fact-find` (Phase 7a, fact-find mode) and `lp-do-plan` (Phase 9, plan mode).

## Pre-Critique Factcheck Gate

Before Round 1, evaluate whether `/lp-do-factcheck` should run. Run it if the artifact contains:
- Specific file paths or module names stated as facts
- Function names/signatures, API behavior, or interface claims
- Test coverage assertions

> **Fact-find mode:** Also check for architecture descriptions referencing actual code structure. Skip factcheck if the artifact is purely business/hypothesis-based with no codebase claims.

> **Plan mode:** Items also include "Test coverage or CI behavior assertions". This check may run before Round 1 or between rounds if critique surfaces factual claim issues — use judgment on timing.

## Iteration Rules

Run `/lp-do-critique` at least once and up to three times:

| After round | Condition to run next round |
|---|---|
| Round 1 | Any Critical finding, OR 2+ Major findings |
| Round 2 | Any Critical finding still present |
| Round 3 | Final round — always the last regardless of outcome |

Before each round after the first: revise the artifact to address prior-round findings, then re-run.

**Round 1 (mandatory — always runs)**
1. Invoke `/lp-do-critique`:
   - Fact-find mode: `docs/plans/<slug>/fact-find.md` (CRITIQUE + AUTOFIX)
   - Plan mode: `docs/plans/<slug>/plan.md` (CRITIQUE + AUTOFIX, scope: full)
2. Record: round number, score, severity counts (Critical / Major / Minor).
3. Apply the round 2 condition above.

**Round 2 (conditional — any Critical, or 2+ Major in Round 1)**
1. Revise the artifact to address Round 1 findings.
2. Re-invoke `/lp-do-critique`. Record results. Apply the round 3 condition.

**Round 3 (conditional — any Critical still present after Round 2)**
1. Revise the artifact to address Round 2 findings.
2. Re-invoke `/lp-do-critique`. Record results. Final round — do not loop further.

## Post-Loop Gate

**Fact-find mode:**
- `credible` (score ≥ 4.0), no Critical remaining → proceed to completion.
- `partially credible` OR Critical remain after final round → set `Status: Needs-input`, surface top findings, stop. Do not route to planning.
- `not credible` (score < 3.0) → evaluate recoverability: Recoverable → `Needs-input`; Structural → `Infeasible` + `## Kill Rationale`.

**Plan mode:**
- `not credible` or score ≤ 2.5 → set `Status: Draft`, block auto-build, recommend `/lp-do-replan`.
- `partially credible` (3.0–3.5): `plan+auto` → proceed with `Critique-Warning: partially-credible`; `plan-only` → stop, recommend `/lp-do-replan`.
- `credible` (score ≥ 4.0) → proceed normally.
- Ordering: runs after Phase 8 (persist), before Phase 10 (build handoff). Re-evaluate build eligibility after autofixes.

## Idempotency (Fact-Find Mode Only)

Critique creates/updates `docs/plans/<slug>/critique-history.md`. Multiple rounds append to the same ledger — expected, does not require user approval.
