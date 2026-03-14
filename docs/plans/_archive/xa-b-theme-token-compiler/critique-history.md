# Critique History: xa-b-theme-token-compiler

## Round 1 — 2026-03-14

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Major | TASK-03 Acceptance vs Scouts | Acceptance block described `colorVarMap: 19 entries` + `derivedVars.light: 54`; Scouts resolved to `colorVarMap: {}` + `derivedVars.light: 73`. Mutually exclusive; builder would receive contradictory instructions. |
| 1-02 | Major | `## Selected Approach Summary` | Still described old "use `colorVarMap` for swatches/FAB" approach after Scouts resolved to `colorVarMap: {}`. |
| 1-03 | Major | `## Analysis Reference` | Lines 74–76 described discarded approach (swatches in `brandColors`/`colorVarMap`, FAB as `string` literal) rather than resolved approach. |
| 1-04 | Moderate | TASK-03 TC-03 | `derivedVars.light` count stated as "exactly 54" in TC-03 but post-resolution is 73. |
| 1-05 | Moderate | TASK-04 execution plan | Referenced "Generation pattern: `packages/themes/brikette/scripts/generate.ts` if it exists" — script not confirmed to exist; builder needs explicit instructions. |
| 1-06 | Minor | `## Engineering Coverage` plan table | `Data / contracts` note said "FAB HSL triplet stored as `string` in `brandColors` (not `BrandColor`)" — misleading post-resolution. |
| 1-07 | Minor | TASK-06 Acceptance + Delivered Processes | Import path used `./styles/` in several places; correct relative path is `../styles/` from `src/app/globals.css`. |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-01 | Major | TASK-03 Acceptance vs Scouts contradiction | Acceptance updated to `colorVarMap: {}` + `derivedVars.light: 73 entries`; TC-03 updated accordingly |
| 1-02 | Major | Selected Approach Summary stale | Replaced with correct resolved approach description |
| 1-03 | Major | Analysis Reference stale approach | Updated to reflect `colorVarMap: {}` and all-`derivedVars` approach |
| 1-04 | Moderate | TC-03 count 54 vs 73 | TC-03 updated to "exactly 73 entries" with derivation |
| 1-05 | Moderate | TASK-04 script reference unconfirmed | Execution plan updated with explicit "new file — no existing brikette equivalent" and full invocation instructions |
| 1-06 | Minor | Engineering Coverage note misleading | Updated to correctly describe `colorVarMap: {}` and FAB in derivedVars |
| 1-07 | Minor | Import path `./styles/` vs `../styles/` | Fixed in Acceptance, TC-01, execution plan, and Delivered Processes table |

### Issues Carried Open (not yet resolved)
_None — all issues opened this round were also resolved this round via autofix._
