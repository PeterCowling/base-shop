# Critique History: reception-theme-styling-cohesion

## Round 1 — 2026-03-08

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Major | Frontmatter `Supporting-Skills` | `tools-ui-frontend-design` is not a registered skill; correct name is `frontend-design`. Same error appears in Execution Routing Packet body. |
| 1-02 | Major | Suggested Task Seeds / Scope | `POSFullBleedScreen` labeled as an archetype while fact-find simultaneously defers its migration indefinitely. Taxonomic inflation misleads planning about migration scope. |
| 1-03 | Moderate | Planning Readiness `Blocking items` | `Blocking items: None` is logically inconsistent with Delivery-Readiness at 78% (below 80% threshold). Archetype design-spec prerequisite is implicit, not enforced. |
| 1-04 | Moderate | Constraints & Assumptions | 111-file in-flight sweep nature unspecified — uncommitted vs pushed branch. Implementation tasks that touch same files need explicit dirty-state resolution step. |
| 1-05 | Moderate | Scope / Remaining Assumptions | Visual baseline ("operator-provided check-in screenshot") referenced with no file path or artifact link. Visual cohesion outcome is not measurable without a documented before-state. |
| 1-06 | Minor | Suggested Task Seeds | Route-health crash routes (`/safe-management`, `/doc-insert`) appear in route census shell assignments but are not explicitly excluded from wave-1 scope. |
| 1-07 | Minor | Patterns & Conventions | Primary-color usage count: fact-find states 145; grep of `/components` yields 144. Discrepancy of 1 (likely in non-component src file). |

### Issues Confirmed Resolved This Round
None (first round).

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 1-05 | Moderate | 1 | Visual baseline not linked — no file path or artifact reference for operator screenshot. Cannot be auto-fixed (requires operator to provide or create the artifact). |
| 1-06 | Minor | 1 | Wave-1 exclusion of crash routes not explicit — planning must add explicit exclusion to implementation task scope. |

---

## Round 2 — 2026-03-08 (Rehearsal Trace Pass)

### Issues Opened This Round
| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Critical | Patterns / Planning Constraints / Rehearsal Trace | Triple-layered gradient: `AuthenticatedApp`, `CheckinsTableView`, and `PageShell` all independently apply the same gradient. Two nested gradient roots fire on every screen. Archetype must specify gradient ownership before implementation. |
| 2-02 | Critical | Suggested Task Seeds / Task ordering | Checkout already uses `PageShell`. "Migrate checkout" = upgrade PageShell into `OperationalTableScreen`, not add a new wrapper. "Revisit PageShell" must precede checkout migration, not follow it. Task seed order corrected. |
| 2-03 | Major | Patterns / Planning Constraints | `checkins/DateSelector` and `checkout/DaySelector` are behaviorally incompatible (different role-access policies, popup vs inline UX). `FilterToolbar` cannot own date selection; must be a caller-injection slot. Unification of access policy is a separate operator decision. |
| 2-04 | Major | Patterns / Planning Constraints / Risks | `AuthenticatedApp` `p-6` wrapper creates `p-6 + p-4` double-padding on all screens. Archetype must remove `AuthenticatedApp`'s padding or explicitly define combined geometry. |
| 2-05 | Moderate | Patterns | `CheckinsHeader` uses `text-primary-main` (100%); `PageShell` uses `text-primary-main/80` (80%). Same accent-bar + h1 pattern at different opacities. `ScreenHeader` primitive must canonicalize one value in the design-spec. |
| 2-06 | Minor | Checkout/DaySelector | `username` prop immediately shadowed as `_username` in `checkout/DaySelector.tsx`. Confirms ad-hoc evolution; not a planning blocker. |

### Issues Confirmed Resolved This Round
| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-01 | Major | `tools-ui-frontend-design` non-existent skill | Fixed in frontmatter and Execution Routing Packet body (Round 1 autofix) |
| 1-02 | Major | `POSFullBleedScreen` taxonomic inflation | Renamed as non-migrating carve-out in task seeds (Round 1 autofix) |
| 1-03 | Moderate | `Blocking items: None` vs 78% delivery-readiness | Blocking items updated with threshold caveat and gating rule (Round 1 autofix) |
| 1-04 | Moderate | In-flight sweep nature unspecified | Clarified as uncommitted local workspace changes in Constraints (Round 1 autofix) |

### Issues Carried Open (not yet resolved)
| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 1-05 | Moderate | 2 | Visual baseline not linked — operator must provide or create screenshot artifact |
| 1-06 | Minor | 2 | Wave-1 exclusion of crash routes — planning must add explicit exclusion to implementation task scope |

### Autofix Summary (Round 2)
### Round 1 Autofix
- Fix 1-01: `tools-ui-frontend-design` → `frontend-design` in frontmatter and Execution Routing Packet body. **Applied.**
- Fix 1-02: Added `POSFullBleedScreen` non-migrating carve-out note to Suggested Task Seeds. **Applied.**
- Fix 1-03: Replaced `Blocking items: None` with threshold caveat and archetype-contract gating rule. **Applied.**
- Fix 1-04: Added uncommitted workspace change clarification to Constraints. **Applied.**
- Consistency cleanup: corrected orphaned `tools-ui-frontend-design` in Execution Routing Packet body (missed in initial pass). **Applied.**

### Round 2 Autofix (Rehearsal Trace)
- Fix 2-01: Expanded gradient-root pattern entry with triple-layer analysis and ownership constraint. Added to Planning Constraints. Updated Rehearsal Trace row. Added to Risks table. **Applied.**
- Fix 2-02: Rewrote Suggested Task Seeds to correct ordering (PageShell/AuthenticatedApp reconcile before checkout migration); added numbered sequence with explicit sequencing rationale. **Applied.**
- Fix 2-03: Added DateSelector/DaySelector divergence pattern entry. Added FilterToolbar injection-point constraint to Planning Constraints. Updated Rehearsal Trace row. Added to Risks table. **Applied.**
- Fix 2-04: Added AuthenticatedApp `p-6` double-padding pattern entry. Added padding constraint to Planning Constraints. Added to Risks table. **Applied.**
- Fix 2-05: Added CheckinsHeader vs PageShell heading-opacity inconsistency pattern entry. Updated Rehearsal Trace row. **Applied.**
- 2-06: Minor (unused `username` prop in DaySelector) — documented in ledger only; no fact-find change needed.
