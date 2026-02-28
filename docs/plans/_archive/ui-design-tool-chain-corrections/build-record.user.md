---
Status: Complete
Feature-Slug: ui-design-tool-chain-corrections
Completed-date: 2026-02-27
artifact: build-record
---

# Build Record — UI Design Tool Chain Corrections

## What Was Built

**TASK-01 — lp-design-spec:** Seven targeted edits applied to `.claude/skills/lp-design-spec/SKILL.md`.
(1) Added base-system business exception to GATE-BD-07 (Step 6), allowing PLAT/BOS/PIPE/XA to bypass the brand dossier requirement and use `packages/themes/base/src/tokens.ts` directly.
(2) Fixed stale shadcn/ui token names in the Step 4 example table: `text-foreground` → `text-fg`; `bg-card` → `bg-[hsl(var(--surface-2))]`.
(3) Fixed stale token names in the Design Spec Template Token Binding table: `bg-background` → `bg-bg`; interaction states `hover:bg-primary-hover` → `hover:bg-primary/90` and `active:bg-primary-active` → `active:bg-primary/80`.
(4) Added a QA Matrix section to the Design Spec Template to pre-populate expected token/class bindings for downstream `lp-design-qa` use.
(5) Updated the template `Brand-Language:` frontmatter field to show the conditional value `| None — base theme` for base-system businesses.
(6) Updated the template Prerequisites checkbox to accept either an Active brand dossier OR a confirmed base-system business.

**TASK-02 — lp-design-qa:** Two edits applied to `.claude/skills/lp-design-qa/SKILL.md`.
(1) Added a re-run instruction to the Step 8 completion message: agents must re-run `lp-design-qa` after `lp-do-build` fixes before routing to S9C sweeps.
(2) Updated the Integration section upstream reference to include `tools-ui-frontend-design` as the S9A UI build executor, clarifying the full upstream chain.

**TASK-03 — tools-ui-contrast-sweep:** One edit to `.claude/skills/tools-ui-contrast-sweep/SKILL.md` Section 8: added re-run instruction after the no-issues statement, directing agents to re-run the sweep after `lp-do-build` fixes before routing to `tools-refactor`.

**TASK-04 — tools-web-breakpoint:** One edit to `.claude/skills/tools-web-breakpoint/SKILL.md` Section 7: added identical re-run instruction for the responsive breakpoint sweep.

**TASK-05 — frontend-design:** One edit to `.claude/skills/frontend-design/SKILL.md` Step 1: added a "Quick-reference only" label above the hardcoded business table, directing agents to always consult `docs/business-os/strategy/businesses.json` for the authoritative app → business → theme mapping.

**TASK-06 — tools-refactor:** One edit to `.claude/skills/tools-refactor/SKILL.md` Integration section: renamed S9D label from "Refactor" to "Conditional Refactor" and added a skip note when no QA findings meet the Entry Criteria.

All 6 tasks delivered as a single Wave 1 commit: `83f7d13fcf`.

## Tests Run

- No automated test suite applies to SKILL.md documentation files.
- Validation was performed via grep checks against all 11 acceptance criteria (see Validation Evidence below).

## Validation Evidence

All 11 plan acceptance criteria passed via grep:

| Check | Pattern | Result |
|---|---|---|
| AC-01 | `bg-background\|bg-card\|text-foreground` in lp-design-spec | 0 matches — PASS |
| AC-02 | `Base-System` in lp-design-spec | 1 match (line 172) — PASS |
| AC-03 | `None — base theme` in lp-design-spec | 2 matches (lines 172, 198) — PASS |
| AC-04 | `confirmed base-system` in lp-design-spec | 1 match (line 290) — PASS |
| AC-05 | `QA Matrix` in lp-design-spec | 1 match (line 299) — PASS |
| AC-06 | `re-run` in lp-design-qa | 1 match (line in Step 8) — PASS |
| AC-07 | `tools-ui-frontend-design` in lp-design-qa | 1 match (line 143) — PASS |
| AC-08 | `re-run` in tools-ui-contrast-sweep | 1 match (line 191) — PASS |
| AC-09 | `re-run` in tools-web-breakpoint | 1 match (line 189) — PASS |
| AC-10 | `Quick-reference` in frontend-design | 1 match (line 75) — PASS |
| AC-11 | `Conditional Refactor` in tools-refactor | 1 match (line 131) — PASS |

## Scope Deviations

None. All edits were bounded to the six SKILL.md files specified in the plan. No application code was modified.

## Outcome Contract

- **Why:** Agents running `lp-design-spec` for PLAT/BOS/PIPE/XA hard-block on a gate intended only for brand-identity businesses; template token names do not match the actual repo design system; QA tools lack a re-run loop instruction, meaning fixes are not validated before routing to the next stage.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `lp-design-spec` passes for base-system businesses; template tokens are correct; three QA SKILL.md files instruct re-run after fixes; pipeline stage labels are accurate.
- **Source:** operator
