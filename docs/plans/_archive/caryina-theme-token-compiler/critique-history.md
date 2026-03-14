# Critique History: caryina-theme-token-compiler

## Round 1 — 2026-03-14

Route: codemoot (score 5/10 → lp_score 2.5 — not credible)

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Critical | TASK-06 / Constraints | OS auto-dark first-paint regression: removing `@media (prefers-color-scheme: dark)` block from tokens.css without replacement causes flash of light mode on first paint for OS-dark users. `ThemeModeSwitch.tsx` confirmed OS dark mode is supported via JS + CSS. |
| 1-02 | Warning | Summary / TASK-01 | Font strategy inconsistency: Summary stated `fontVarMap` used for font vars, but TASK-01 edge cases concluded `tokenVarMap` should be used. Acceptance criteria and token count were wrong (18 instead of 20). |
| 1-03 | Warning | TASK-05 | Self-contradictory DERIVED_VARS: acceptance criteria listed `--brand-mark-color` and `--brand-accent-color` in DERIVED_VARS, but task later correctly stated those are in `global.css` only and out of scope for the generated-file-reading coverage test. |

### Issues Confirmed Resolved This Round
None (first round).

### Issues Carried Open (not yet resolved)
None (all resolved in post-round revision).

---

## Round 2 — 2026-03-14

Route: codemoot returned score=null (unknown verdict) — fallback to inline critique. lp_score: 4.0 (credible)

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Minor | TASK-06 | TC coverage for first-paint dark mode: TC-02 in TASK-06 says "dark mode visual check — html.theme-dark class produces dark tokens" but does not explicitly cover the `@media` block path (no-JS / first-paint). Advisory only — the `@media` block is specified in the acceptance criteria and Green step. |
| 2-02 | Minor | TASK-05 | `BRAND_COLOR_BRIDGE` name is brikette-specific; caryina table should be renamed `COLOR_BRIDGE` in the test implementation. Implementation detail — not a plan correctness issue. |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-01 | Critical | OS auto-dark first-paint regression | TASK-06 now adds `@media (prefers-color-scheme: dark) :root {}` block to `global.css` with direct dark HSL values; cascade order specified (before `not(.theme-dark)` block) |
| 1-02 | Warning | Font strategy inconsistency | Summary, Assumptions, Selected Approach, TASK-01 acceptance criteria all updated: font vars in `tokenVarMap` (20 total), `fontVarMap: {}` |
| 1-03 | Warning | DERIVED_VARS inconsistency | TASK-05 acceptance criteria updated: `--brand-mark-color`/`--brand-accent-color` removed from DERIVED_VARS (they're in global.css only, not in the generated file scope); `--theme-transition-duration` moved to PROFILE_BRIDGE |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 2-01 | Minor | 1 | TASK-06 TC coverage for first-paint dark mode path |
| 2-02 | Minor | 1 | BRAND_COLOR_BRIDGE renaming in test implementation |
