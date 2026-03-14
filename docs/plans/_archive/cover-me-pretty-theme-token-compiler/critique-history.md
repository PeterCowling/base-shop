# Critique History: cover-me-pretty-theme-token-compiler

## Round 1 — 2026-03-14

Route: inline (`/lp-do-critique`) — codemoot route attempted but Codex API timed out after 4+ minutes.
Score: 4.0 (credible). Severity: Critical 0 / Major 0 / Moderate 1 / Minor 2.

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Moderate | Constraints & Assumptions, TASK-01 Notes/References, Decision Log | Wrong caryina precedent: plan cited `derivedVars.light` as "following the caryina approach" but caryina uses a `TokenMap` → pre-built static CSS approach and does not use `generateThemeCSS()` at all. `tokenVarMap` is the semantically appropriate mechanism for cover-me-pretty's flat 20-token surface. |
| 1-02 | Minor | TASK-02 TC-05, Summary, Non-goals | "No `.dark` block" claim is wrong: `generateThemeCSS()` always emits a minimal `.dark { color-scheme: dark; }` block. TC-05 "exactly 20" var count is also wrong — compiler always emits `--theme-transition-duration` plus token vars. |
| 1-03 | Minor | TASK-03 TC-06 | Line number assertions in TC-06 ("line 3", "line 4") are fragile; replaced with positional assertion. |

### Issues Confirmed Resolved This Round

None (first round).

### Issues Carried Open (not yet resolved)

None — all issues were autofixed in this round.

### Autofix Summary

7 point fixes applied across:
- Constraints & Assumptions (assumptions block): replaced `derivedVars.light` rationale with `tokenVarMap` + corrected `.dark` block description
- Selected Approach Summary: updated to `tokenVarMap`
- Fact-Find Support: updated evidence note for build-theme-css.ts
- TASK-01 Acceptance, Engineering Coverage, Data/contracts, TC-03, Execution plan (Green step), Notes/references: replaced `derivedVars.light` with `tokenVarMap` throughout
- TASK-01 Planning Validation: updated `derivedVars.light` reference to `tokenVarMap`
- TASK-02 Acceptance (generated file bullets): corrected "exactly 20" to "20+ token declarations plus structural vars"; corrected "no `.dark` block" to "minimal `.dark { color-scheme: dark; }` block"
- TASK-02 TC-05: updated var count claim and `.dark` block description
- TASK-02 Execution plan Green step: "verify no `.dark` block" → "verify `.dark` block contains only `color-scheme: dark;`"
- TASK-03 TC-06: removed fragile line number assertions
- Decision Log: corrected caryina precedent attribution; changed from `derivedVars.light` to `tokenVarMap`
- Summary: clarified `.dark` block presence
- Non-goals: clarified dark mode non-goal language

Post-fix validators: `validate-plan.sh` ✓ valid | `validate-engineering-coverage.sh` ✓ valid
