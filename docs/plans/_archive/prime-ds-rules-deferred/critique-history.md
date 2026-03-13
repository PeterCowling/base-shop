# Critique History — prime-ds-rules-deferred

## Round 1

**Date:** 2026-03-13
**Route:** codemoot
**Score:** 7/10 → lp_score 3.5
**Verdict:** needs_revision
**Severity counts:** Critical: 1 / Major (Warning): 3 / Minor (Info): 1

### Findings

**Critical:**
- `ds/min-tap-size` remediation guidance incorrect. Rule requires `size-*` OR paired numeric `h-/min-h-` AND `w-/min-w-` classes. `w-full` does not count. Adding only `min-h-10` to a `w-full` button will still fail the rule.

**Warnings:**
- Per-line BRIK-3 inventory inaccurate: `HomePage.tsx:151` is BRIK-002 (not BRIK-3); real inline BRIK-3 disable at `digital-assistant/page.tsx:215` omitted.
- Outcome contract names `Activities`, `GuestDirectory`, and `StaffLookup` as success surface; `GuestDirectory.tsx` has no BRIK-3 disable and actual scope is 24 files.
- Container-width remediation seam misstated: `@acme/design-system/primitives` does not export `Page`/`Section`/`Container`/`Overlay`; Prime already has local `Container` component (`apps/prime/src/components/layout/Container.tsx`).

**Info:**
- `enforce-layout-primitives` leaf-only behavior correctly identified.

### Autofixes Applied

1. Corrected `min-tap-size` fix pattern to require both `min-h-10 min-w-10` (or `size-10`).
2. Corrected per-line inventory: removed `HomePage.tsx`, added `digital-assistant/page.tsx:215`.
3. Updated outcome contract statement to cover all 24 BRIK-3 files.
4. Corrected container-width seam to `apps/prime/src/components/layout/Container.tsx`; removed DS primitives exports claim.
5. Updated Planning Constraints to reflect correct fix patterns.
6. Updated Suggested Task Seeds with correct fix guidance.

---

## Round 2

**Date:** 2026-03-13
**Route:** codemoot
**Score:** 8/10 → lp_score 4.0
**Verdict:** needs_revision (no Critical findings)
**Severity counts:** Critical: 0 / Major (Warning): 4 / Minor (Info): 1

### Findings

**Warnings:**
- Scope count still off: 22 file-level BRIK-3 + 2 inline-only files = 24 unique; brief still said "24 file-level".
- Test guidance inconsistency: testing section still treated `min-h-10` alone as sufficient, contradicting corrected rule semantics.
- Default scope still referenced `HomePage.tsx` as in-scope inline target (it is BRIK-002, not BRIK-3).
- Delivery-readiness uplift guidance stale (referenced DS Container/Page primitives that don't exist).

**Info:**
- Rule-specific remediation guidance materially stronger than Round 1.

### Autofixes Applied

1. Corrected counts: 22 file-level + 2 inline-only = 24 unique files.
2. Fixed testing guidance to require both `min-h-10 min-w-10` (or `size-10`).
3. Removed `HomePage.tsx` from default scope recommendation.
4. Updated delivery-readiness confidence note to remove stale validation step.

### Post-Loop Gate Result

lp_score 4.0 ≥ 3.6 → **credible**. No Critical findings. Proceed to completion.

---

## Round 3 (Plan stage)

**Date:** 2026-03-13
**Target:** `docs/plans/prime-ds-rules-deferred/plan.md`
**Route:** lp-do-critique plan mode
**Score:** 4.0/5.0
**Verdict:** credible
**Severity counts:** Critical: 0 / Major: 2 / Moderate: 2 / Minor: 1

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| 3-01 | Major | TASK-02, TASK-03, TASK-04 Affects | Three wrong file paths: StaffOwnerDisabledNotice in `check-in/` (actual: `security/`), PositanoGuide in `positano/` (actual: `positano-guide/`), ChatOptInControls in `onboarding/` (actual: `settings/`) |
| 3-02 | Major | TASK-03 Acceptance/Edge Cases | `RouteDetail.tsx:40` BRIK-3 `ds/no-hardcoded-copy` inline disable was in scope but not listed; edge case said to preserve it which was incorrect |
| 3-03 | Moderate | TASK-05 Affects | `error/page.tsx` listed in Affects with disclaimer — creates execution ambiguity; should be absent from the list |
| 3-04 | Moderate | TASK-07 Type | TASK-07 typed as IMPLEMENT but performs no code changes (validation-only); should be INVESTIGATE or type inconsistency noted |
| 3-05 | Minor | TASK-05 Deliverable | "4 component/page files" count inaccurate — only 1 confirmed file (TaskCard.tsx) |

### Issues Confirmed Resolved This Round

| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 3-01 | Major | Three wrong file paths | Corrected in TASK-02/TASK-03/TASK-04 Affects lists |
| 3-02 | Major | RouteDetail:40 BRIK-3 scope | Full TASK-03 rewrite covers both BRIK-3 inlines in RouteDetail; fix guidance added |
| 3-03 | Moderate | TASK-05 Affects ambiguity | error/page.tsx removed from TASK-05 Affects; deliverable updated |
| 3-05 | Minor | TASK-05 deliverable count | Updated to "TaskCard.tsx confirmed plus any additional files from dry-run" |

### Issues Carried Open (not yet resolved)

| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 3-04 | Moderate | 1 | TASK-07 typed IMPLEMENT but performs no code changes; minor classification issue, does not affect build execution |
