---
Status: Complete
Feature-Slug: do-skills-bos-decoupling
Completed-date: 2026-02-24
artifact: build-record
---

# DO Skills BOS Decoupling — Build Record

## What Was Built

**Wave 1 — Core DO skill decoupling (TASK-01, TASK-02, TASK-03):**
Removed Business OS integration phases from all three DO skills. `lp-do-fact-find` had Phase 8 (BOS API integration) and Phase 9 (discovery index refresh) deleted; discovery path replaced with filesystem scan of `docs/plans/*/` and `docs/business-os/strategy/*/idea-cards/`. `lp-do-plan` had Phase 9 (BOS integration) removed; discovery path now scans `docs/plans/*/fact-find.md` for `Status: Ready-for-planning`. `lp-do-build` had the `## BOS Integration` section, Gate 5 BOS hook text, and `build-bos-integration.md`/`discovery-index-contract.md` shared utility references removed; discovery path now scans `docs/plans/*/plan.md` for `Status: Active`.

**Wave 2 — Contract alignment (TASK-04, TASK-05):**
Updated startup-loop DO sync contract in `startup-loop/SKILL.md` (BOS sync requirement scoped to non-DO stages) and `startup-loop/modules/cmd-advance.md` (DO row changed from API upsert to filesystem-only; Red Flag #2 scoped to non-DO stages). Removed BOS validation assumptions from `lp-do-critique/SKILL.md` (4 stale frontmatter requirement lines) and `_shared/stage-doc-integration.md` (three DO skill subsections and corresponding lane transition table rows removed; `meta-reflect` section and `Done -> Reflected` row retained).

**Wave 3 — Template and shared file cleanup (TASK-06, TASK-09):**
Removed `Business-OS-Integration`, `Business-Unit`, and `Card-ID` frontmatter fields from `docs/plans/_templates/fact-find-planning.md` and `docs/plans/_templates/plan.md`. Deleted three obsolete shared files after zero-consumer preflight grep: `_shared/fact-find-bos-integration.md`, `_shared/plan-bos-integration.md`, `_shared/build-bos-integration.md`.

**Wave 4 — Operator docs and tooling alignment (TASK-07, TASK-08):**
Updated `docs/agents/feature-workflow-guide.md`: "Business OS Card Tracking" section rewritten as filesystem-only DO; BOS-default on/off language removed. Updated `docs/business-os/agent-workflows.md`: automation table rows for DO skills corrected to Filesystem-only; idea-advance section corrected (all lane transitions now require explicit operator action via `/idea-advance`); Typical Card Lifecycle diagram rewritten from 8 steps to 5 (BOS lane move steps removed); Next Steps item 2 updated; footnote added. Updated `docs/business-os/startup-loop/loop-output-contracts.md`: `Business-Unit` and `Card-ID` removed from required frontmatter specs for all 4 artifacts. `rebuild-discovery-index.sh` required no code changes — `grep | sed || echo ""` pattern already handles missing fields gracefully.

**Wave 5 — Validation sweep (TASK-10):**
Full closure sweep confirmed all contracts in their expected final state. See Decision Log for command outputs.

## Tests Run

This plan operates on markdown contract files and shell scripts — no Jest/Playwright tests applicable. Validation was performed via targeted `rg` (ripgrep) checks per task VC contract.

| Check | Command | Result |
|---|---|---|
| TASK-01 VC-01 | `rg "Phase 8|Phase 9|fact-find-bos-integration|discovery-index.json" lp-do-fact-find/SKILL.md` | PASS (0 hits) |
| TASK-02 VC-01 | `rg "Phase 9|plan-bos-integration|discovery-index.json" lp-do-plan/SKILL.md` | PASS (0 hits) |
| TASK-03 VC-01 | `rg "BOS Integration|build-bos-integration|discovery-index.json" lp-do-build/SKILL.md` | PASS (0 hits) |
| TASK-04 VC-01 | cmd-advance.md DO row filesystem-only | PASS |
| TASK-04 VC-02 | startup-loop invariant scoped to non-DO stages | PASS |
| TASK-05 VC-01 | `rg "Business-OS-Integration|Business-Unit|Card-ID" lp-do-critique/SKILL.md` | PASS (0 hits) |
| TASK-05 VC-02 | DO subsections and lane transition rows absent from stage-doc-integration.md | PASS |
| TASK-06 VC-01 | `rg "Business-OS-Integration|Business-Unit|Card-ID|direct-inject" docs/plans/_templates/` | PASS (0 hits) |
| TASK-07 VC-01 | `rg "Business-OS-Integration|baseline core-loop transitions are deterministic"` in 3 operator docs | PASS (0 hits) |
| TASK-07 VC-02 | DO skill references in workflow docs are filesystem-only | PASS |
| TASK-08 VC-01 | Script runs successfully on current repo state | PASS |
| TASK-08 VC-02 | `rebuild-discovery-index.sh | python3 -m json.tool` | PASS (valid JSON) |
| TASK-09 VC-01 | Pre-delete `rg "fact-find-bos-integration|plan-bos-integration|build-bos-integration"` in `.claude/skills/` | PASS (0 hits) |
| TASK-09 VC-02 | Post-delete same grep | PASS (0 hits) |
| TASK-10 Sweep 1 | No BOS phases in DO skills (Phase 8 hit in lp-do-plan is "Persist Plan" — false positive) | PASS |
| TASK-10 Sweep 2 | startup-loop DO sync line correctly scoped | PASS |
| TASK-10 Sweep 3 | Zero references to deleted shared files | PASS |
| TASK-10 Sweep 4 | discovery-index script produces valid JSON | PASS |

## Validation Evidence

All 17 VC/sweep checks above passed. Full command output recorded in plan Decision Log (2026-02-24 Wave 5 entry).

Key invariants confirmed:
- **Zero BOS API calls in DO skills**: `lp-do-fact-find`, `lp-do-plan`, `lp-do-build` contain no references to `/api/agent/stage-docs`, `/api/agent/cards`, `fact-find-bos-integration.md`, `plan-bos-integration.md`, `build-bos-integration.md`.
- **Startup-loop DO advance**: filesystem-only; no longer blocked by BOS sync requirement.
- **Templates clean**: `Business-OS-Integration`, `Business-Unit`, `Card-ID` absent from plan/fact-find templates.
- **Operator docs aligned**: feature-workflow-guide and agent-workflows correctly describe DO as filesystem-only; lane transitions require `/idea-advance`.
- **Loop-output-contracts updated**: 4 artifact frontmatter specs no longer require BOS fields.
- **Three shared files deleted**: confirmed no broken references.
- **Discovery index script**: handles missing frontmatter fields; produces valid JSON.

## Scope Deviations

**Post-completion addition:** After build-record was produced, operator identified that `lp-do-fact-find/SKILL.md` Phase 1 still contained an IDEAS-03 promotion trigger block (reads idea cards from `docs/business-os/strategy/<BIZ>/idea-cards/`, writes `Status: promoted` back to idea cards, updates `idea-portfolio.user.md`). This is BOS pipeline integration (filesystem-flavored) and was removed as an out-of-band fix to TASK-01 scope. Discovery path also cleaned: idea card scan removed, plans-only scan retained. VC confirms zero IDEAS pipeline references remain.
