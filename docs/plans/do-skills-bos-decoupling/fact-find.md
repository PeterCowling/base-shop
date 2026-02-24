---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Operations
Created: 2026-02-24
Last-updated: 2026-02-24
Feature-Slug: do-skills-bos-decoupling
Execution-Track: business-artifact
Deliverable-Family: doc
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: doc-update
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/do-skills-bos-decoupling/plan.md
Business-OS-Integration: off
Business-Unit: none
Card-ID: none
direct-inject: true
direct-inject-rationale: Meta-tooling change to skill files — not originating from an idea card or BOS card.
---

# DO Skills BOS Decoupling Fact-Find Brief

## Scope

### Summary

Remove all Business OS (BOS) / kanban API integration from the six DO-workflow skills (`lp-do-fact-find`, `lp-do-plan`, `lp-do-build`, `lp-do-critique`, `lp-do-factcheck`, `lp-do-replan`). Three of the six already have no BOS integration. The three that do (`lp-do-fact-find` Phase 8, `lp-do-plan` Phase 9, `lp-do-build` Gate 5) use an optional-default-on pattern backed by three dedicated shared integration contracts. Removing the integration means: deleting those three shared contracts, cutting the BOS phases/gates from the three active skill files, replacing BOS-backed discovery paths with filesystem-only scans, updating the `startup-loop` advance contract for the DO stage, and updating `lp-do-critique`'s validation checklist which currently audits BOS frontmatter fields.

### Goals

- Eliminate all BOS API calls from the six DO skills.
- Replace BOS-backed discovery paths (reads of `discovery-index.json`) with direct filesystem scans of `docs/plans/`.
- Remove three shared BOS integration contract files that are exclusively consumed by the DO skills.
- Update the `startup-loop advance` DO sync contract so advance gating is filesystem-only.
- Update `lp-do-critique`'s BOS metadata validation rules.
- Remove `Business-OS-Integration`, `Business-Unit`, and `Card-ID` frontmatter fields from the `fact-find` and `plan` plan templates.
- Leave unchanged: `lp-bos-sync` (S5B), `_shared/card-operations.md`, `_shared/bos-api-payloads.md`, `_shared/stage-doc-core.md`, `_shared/stage-doc-templates.md`, `meta-reflect` BOS integration.

### Non-goals

- Changing the startup-loop stage model, S5B card promotion, or any non-DO BOS integrations.
- Removing BOS from the IDEAS pipeline (`idea-develop`, `idea-advance`, `idea-generate`).
- Migrating or back-filling existing card/stage-doc records in BOS.
- Touching production code (none of the changed files are TypeScript or compiled code).

### Constraints & Assumptions

- Constraints:
  - All changed files are markdown skill instruction files — no compilation, no tests to break.
  - `lp-bos-sync`, `_shared/card-operations.md`, `_shared/bos-api-payloads.md`, `_shared/stage-doc-core.md` must remain untouched.
  - `startup-loop/SKILL.md` global invariant "BOS sync must be confirmed complete before advance" stays for non-DO stages (S5B specifically). Only the DO entry in the sync contract table changes.
  - The `meta-reflect` skill's BOS integration (`_shared/stage-doc-integration.md` "From /meta-reflect" section) is out of scope — keep as-is.
- Assumptions:
  - The three BOS integration shared contracts (`fact-find-bos-integration.md`, `plan-bos-integration.md`, `build-bos-integration.md`) are consumed exclusively by the three DO skills and can be safely deleted.
  - `discovery-index-refresh.md` is a backward-compat alias for `discovery-index-contract.md` — retain both, no edit needed (DO skills will simply stop referencing them).
  - Existing `fact-find.md` and `plan.md` files in `docs/plans/` that have `Business-OS-Integration: on` or `Card-ID` in frontmatter become inert — no retroactive migration required.

## Evidence Audit (Current State)

### Entry Points

- `.claude/skills/lp-do-fact-find/SKILL.md` — Phase 8 (BOS integration), Phase 9 (discovery refresh), Phase 2 (card hydration via API), Phase 1 (discovery-index.json read)
- `.claude/skills/lp-do-plan/SKILL.md` — Phase 9 (BOS integration), Phase 2 (discovery-index.json read), Phase 11 ordering note references "Phase 9 (BOS sync)"
- `.claude/skills/lp-do-build/SKILL.md` — Gate 5 "Run BOS sync hooks when enabled", `## BOS Integration` section, Discovery path reads `discovery-index.json`, Shared Utilities lists `build-bos-integration.md` + `discovery-index-contract.md`
- `.claude/skills/lp-do-critique/SKILL.md:272-274` — BOS metadata validation rules: checks `Business-OS-Integration`, `Business-Unit`, `Card-ID` correctness in fact-find frontmatter
- `.claude/skills/startup-loop/modules/cmd-advance.md` — Business OS Sync Contract table entry for DO stage; global "Never allow stage advance when BOS sync has failed" invariant

### Key Modules / Files

Primary changes:
- `.claude/skills/lp-do-fact-find/SKILL.md` — remove Phases 8–9, simplify Phase 1 discovery and Phase 2
- `.claude/skills/lp-do-plan/SKILL.md` — remove Phase 9, update Phase 2, fix Phase 11 ordering note
- `.claude/skills/lp-do-build/SKILL.md` — remove BOS Integration section + Gate 5 hook + discovery-index.json reference + two shared utility refs
- `.claude/skills/lp-do-critique/SKILL.md:272-274` — remove BOS frontmatter validation items
- `.claude/skills/startup-loop/modules/cmd-advance.md` — rewrite DO entry in BOS sync contract table
- `.claude/skills/_shared/fact-find-bos-integration.md` — DELETE (exclusively DO-skill consumer)
- `.claude/skills/_shared/plan-bos-integration.md` — DELETE (exclusively DO-skill consumer)
- `.claude/skills/_shared/build-bos-integration.md` — DELETE (exclusively DO-skill consumer)
- `.claude/skills/_shared/stage-doc-integration.md` — remove "From /lp-do-fact-find", "From /lp-do-plan", "From /lp-do-build" subsections; keep "From /meta-reflect"
- `docs/plans/_templates/fact-find-planning.md` — remove `Business-OS-Integration`, `Business-Unit`, `Card-ID` frontmatter fields
- `docs/plans/_templates/plan.md` — remove `Business-OS-Integration`, `Business-Unit`, `Card-ID` frontmatter fields
- `docs/agents/feature-workflow-guide.md` — remove BOS-default DO guidance (`Business-OS-Integration on/off`) and document filesystem-only DO behavior
- `docs/business-os/agent-workflows.md` — align DO workflow integration section with BOS-decoupled DO skills
- `docs/business-os/startup-loop/loop-output-contracts.md` — align DO artifact frontmatter requirements with decoupled templates
- `docs/business-os/_meta/rebuild-discovery-index.sh` — remove or explicitly handle `Business-Unit` / `Card-ID` reads from `docs/plans/*` artifacts

Secondary (retain, no change needed):
- `.claude/skills/lp-do-replan/SKILL.md` — already has no BOS integration; no change needed
- `.claude/skills/lp-do-critique/SKILL.md` (except lines 272-274)
- `.claude/skills/lp-do-factcheck/SKILL.md` — already has no BOS integration; no change needed
- `.claude/skills/_shared/card-operations.md` — still needed by S5B; retain
- `.claude/skills/_shared/bos-api-payloads.md` — still needed by S5B; retain
- `.claude/skills/_shared/stage-doc-core.md` — still needed by S5B; retain
- `.claude/skills/_shared/discovery-index-contract.md` — still needed by S5B; retain (DO skills simply stop referencing it)
- `.claude/skills/_shared/discovery-index-refresh.md` — backward-compat alias; retain

### Patterns & Conventions Observed

- BOS integration in DO skills uses a toggle pattern: `Business-OS-Integration: on|off` in frontmatter + `Card-ID` presence check. This means removing the feature is safe — the `off` path already exists and the `on` path is the only thing being deleted.
- evidence: `.claude/skills/lp-do-fact-find/SKILL.md` Phase 8; `.claude/skills/lp-do-plan/SKILL.md` Phase 9
- Discovery paths in all three DO skills use a single common data source (`docs/business-os/_meta/discovery-index.json`). After decoupling, the replacement is direct filesystem scans via `glob` / `grep` on `docs/plans/`.
- The three shared integration contracts are thin delegators — they contain endpoint sequences and idempotency rules, no business logic. Their deletion leaves no logic hole.
- `lp-do-replan` has no dedicated BOS phase; its BOS side-effects (if any) were always delegated to `lp-do-build`'s Gate 5. Decoupling build automatically decouples replan.

### Data & Contracts

- API contracts removed: `/api/agent/cards/:id` (GET, POST, PATCH), `/api/agent/allocate-id` (POST), `/api/agent/stage-docs` (GET, POST, PATCH) — all in the three deleted shared files.
- Filesystem contracts unchanged: `docs/plans/<slug>/fact-find.md`, `docs/plans/<slug>/plan.md`, `docs/plans/<slug>/build-record.user.md` — these remain the canonical DO artifacts.
- Discovery index: `docs/business-os/_meta/discovery-index.json` — still populated by S5B (`lp-bos-sync`); DO skills stop reading it. No action needed on the index file itself.

### Dependency & Impact Map

- Upstream dependencies:
  - None: this is a change to skill instruction files, no upstream compilation dependency.
- Downstream dependents (files that reference the removed features):
  - `startup-loop/modules/cmd-advance.md` — references DO BOS sync contract (must update)
  - `lp-do-critique/SKILL.md:272-274` — validates BOS frontmatter (must update)
  - `_shared/stage-doc-integration.md` — documents DO skill→BOS writes (must update)
  - `docs/plans/_templates/fact-find-planning.md` and `plan.md` — include BOS fields (must update)
  - `docs/agents/feature-workflow-guide.md` — still documents BOS-default behavior for DO flow
  - `docs/business-os/agent-workflows.md` — still documents DO stage-doc/lane API writes and BOS-default mode
  - `docs/business-os/startup-loop/loop-output-contracts.md` — still defines `Business-Unit`/`Card-ID` expectations for DO artifacts
  - `docs/business-os/_meta/rebuild-discovery-index.sh` — still parses `Card-ID` and `Business-Unit` from `docs/plans/*` artifacts
- Likely blast radius:
  - Primary edits are in `.claude/skills/` and `docs/plans/_templates/`, but process-contract docs in `docs/agents/` and `docs/business-os/` plus one shell utility script are also impacted.
  - No TypeScript compilation paths are required for core decoupling, but discovery-index metadata quality can regress if `rebuild-discovery-index.sh` is left unchanged after frontmatter field removal.
  - Skills that call DO skills (`startup-loop`, `lp-weekly`, `lp-launch-qa`) continue to work — they invoke skills by name, not by BOS API state.

### Delivery & Channel Landscape

- Audience/recipient: Engineering/product operators using the DO workflow (lp-do-fact-find → lp-do-plan → lp-do-build)
- Channel constraints: None — these are internal skill instruction files.
- Existing templates/assets: `docs/plans/_templates/fact-find-planning.md`, `docs/plans/_templates/plan.md` — require frontmatter field removal.
- Approvals/owners: Direct operator instruction change — no external approval gate.
- Compliance constraints: None.
- Measurement hooks:
  - Verify: after changes, running `/lp-do-fact-find` on a topic produces a `fact-find.md` with no BOS frontmatter fields and no Phase 8/9 completion messages.
  - Verify: `startup-loop advance` for a business in DO stage no longer requires BOS API availability to pass.

### Hypothesis & Validation Landscape

#### Key Hypotheses

| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | Deleting the three shared integration files leaves no unresolved references in the skill system (other than the DO skills themselves which are being updated) | Grep scan of all `.claude/skills/**/*.md` for references to the three deleted filenames | Low — one grep | Minutes |
| H2 | `lp-bos-sync` (S5B) does not reference any of the three deleted shared files | Read `lp-bos-sync/SKILL.md` | Low | Minutes |
| H3 | The `startup-loop advance` DO gate can be satisfied by filesystem checks alone (already partially true via GATE-WEBSITE-DO-01) | Read cmd-advance.md DO sync contract | Confirmed — GATE-WEBSITE-DO-01 already checks filesystem-only |
| H4 | No other skills outside the 6 DO skills have a runtime dependency on `fact-find-bos-integration.md`, `plan-bos-integration.md`, or `build-bos-integration.md` | Grep results already show only DO skills reference `bos-integration` files | Confirmed by grep |

#### Existing Signal Coverage

| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | Grep of `.claude/skills/**/*.md` found only 3 DO skill SKILL.md files referencing `bos-integration` | grep scan | High |
| H2 | Confirmed — `lp-bos-sync/SKILL.md` contains zero references to `bos-integration` filenames (critique grep: 2026-02-24) | `lp-bos-sync/SKILL.md` direct grep | High |
| H3 | GATE-WEBSITE-DO-01 already uses filesystem-only checks for fact-find and plan status | `cmd-advance.md:211-251` | High |
| H4 | Confirmed by grep output | grep output | High |

#### Falsifiability Assessment

- Easy to test:
  - H1/H4 can be falsified immediately by repo-wide grep for `fact-find-bos-integration.md`, `plan-bos-integration.md`, and `build-bos-integration.md` after edits.
  - H2 can be falsified immediately by grep on `lp-bos-sync/SKILL.md`.
- Hard to test:
  - H3 requires an end-to-end `/startup-loop advance --business <BIZ>` run at a DO boundary; static file review alone cannot prove runtime gate behavior.
- Validation seams needed:
  - Repo-wide scan for BOS-default DO guidance outside `.claude/skills/` (especially `docs/agents/*` and `docs/business-os/*`).
  - Verification that `docs/business-os/_meta/rebuild-discovery-index.sh` behavior remains acceptable when `Business-Unit`/`Card-ID` are absent from `docs/plans/*`.

#### Recommended Validation Approach

- Quick probes:
  - Before TASK-07 (delete shared files), grep `.claude/skills/**/*.md` for each filename to confirm zero other consumers.
  - After all tasks: grep for `Phase 8`, `Phase 9`, `BOS Integration`, `discovery-index.json` across all six DO skill SKILL.md files to confirm clean removal.
- Deferred validation:
  - Manual smoke test of `/lp-do-fact-find` on a topic after changes, confirm no Phase 8 execution.

## Questions

### Resolved

- Q: Are `lp-do-critique` and `lp-do-factcheck` already fully decoupled?
  - A: Yes. Neither has any BOS API calls or phase-level integration. Only `lp-do-critique` has three lines validating BOS frontmatter fields as part of its checklist (lines 272-274), which need to be removed.
  - Evidence: `.claude/skills/lp-do-critique/SKILL.md`, `.claude/skills/lp-do-factcheck/SKILL.md`
- Q: Is `lp-do-replan` already fully decoupled?
  - A: Yes. It has no BOS phase. Its prior BOS side-effects were always delegated through `lp-do-build`'s Gate 5.
  - Evidence: `.claude/skills/lp-do-replan/SKILL.md`
- Q: Can the three shared integration files be deleted (not just emptied)?
  - A: Yes — confirmed by grep that only the three DO skill SKILL.md files reference them. After updating those files, the shared contracts have zero consumers.
  - Evidence: Grep of `.claude/skills/**/*.md` for `bos-integration`
- Q: Does GATE-WEBSITE-DO-01 already work filesystem-only?
  - A: Yes — it checks `Status: Ready-for-planning` in `fact-find.md` and `Status: Active` in `plan.md`. The only BOS-dependent part is the "pass contract note" which says BOS stage-doc must be upserted. That note must be removed.
  - Evidence: `cmd-advance.md:211-251`

### Open (Non-blocking Operator Confirmation)

- Note: The decision below does not block planning because the default assumption is explicit.

- Q: Should `_shared/stage-doc-integration.md` be deleted entirely, or kept with only the `meta-reflect` section?
  - Why it matters: After removing the three DO sections, only the `meta-reflect` section remains. If `meta-reflect` BOS integration is also being removed eventually, deleting the file now is cleaner. If not, keep the file.
  - Decision impacted: TASK-08 scope (edit vs delete).
  - Decision owner: Operator.
  - Default assumption + risk: Keep the file, remove only the three DO sections. Low risk.

## Confidence Inputs

- Implementation: 95%
  - All 11+ target files fully identified. Changes are mechanical text edits and deletions to markdown files. No code paths, no compilation. What would raise to 99%: verify `lp-bos-sync/SKILL.md` doesn't reference deleted files (confirmed by critique grep 2026-02-24: zero hits).
- Approach: 95%
  - Option B (full removal) is validated. The optional-default-on toggle pattern confirms that removing the `on` path leaves no logic hole. Discovery path replacement (filesystem scan) is a well-understood pattern already used by other parts of the repo. What would raise to 99%: confirm `startup-loop` advance passes cleanly with filesystem-only DO gate in a live run.
- Impact: 85%
  - Core implementation blast radius is bounded, but adjacent process contracts (`feature-workflow-guide`, `agent-workflows`, `loop-output-contracts`) and `rebuild-discovery-index.sh` still carry BOS-linked DO assumptions that must be aligned. What would raise: complete and verify those doc/script alignments in the same change set.
- Delivery-Readiness: 98%
  - Owner clear (operator), all files identified, no external approvals needed, no deployment step. Straightforward markdown edit + delete sequence.
- Testability: 90%
  - Smoke test is well-specified: invoke `/lp-do-fact-find` on a topic and confirm no Phase 8/9 in output, no BOS frontmatter fields in result. Post-change grep acceptance criteria are explicit. What would raise to 99%: perform a live smoke test after changes are applied.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| A skill outside the six DO skills references one of the three deleted shared files | Low | Medium — that skill would reference a missing file | Pre-flight grep before TASK-07; already partially confirmed by existing grep |
| `lp-bos-sync` silently depends on `build-bos-integration.md` or similar | Low | Medium — S5B would lose a referenced module | Read `lp-bos-sync/SKILL.md` as TASK pre-flight |
| `docs/business-os/_meta/rebuild-discovery-index.sh` still parses `Card-ID`/`Business-Unit` from `docs/plans/*` after those fields are removed from templates | Medium | Medium — discovery index metadata can degrade (`cardId`/`business` empty or malformed) | Add TASK-11 to remove field dependency or codify fallback behavior with explicit validation |
| Operator-facing docs still describe BOS-default DO behavior (`docs/agents/feature-workflow-guide.md`, `docs/business-os/agent-workflows.md`, `docs/business-os/startup-loop/loop-output-contracts.md`) | High | Medium — stale instructions can drive contradictory artifacts/process usage | Add TASK-10 doc-contract alignment edits in the same rollout |
| Existing `fact-find.md` or `plan.md` files with `Card-ID: BRIK-ENG-xxxx` cause confusion after decoupling (skill might try to look up card that no longer matches any integration phase) | Low | Low — inert frontmatter fields are ignored since integration phases are gone | No action needed; fields become inert |
| Discovery UX regression: operators used `discovery-index.json` table in DO skills to browse available work; filesystem scan is less polished | Medium | Low — functional but less ergonomic | Acceptable trade-off; document new scan pattern in each skill's updated discovery path |
| `startup-loop advance` for DO stage tries to confirm BOS sync and fails during a transition period (before cmd-advance.md is updated) | Medium | High — advance would be permanently blocked | TASK-06 (cmd-advance.md update) must happen in the same commit/session as TASK-01–03 |
| Phase 11 ordering note in `lp-do-plan` still says "after Phase 9 (BOS sync)" — causes confusion | High | Low | Covered by TASK-02 |
| Lane Transitions table in `_shared/stage-doc-integration.md` references DO-skill-originated stage docs after TASK-08 removes subsections but leaves table intact | Medium | Low | Add to TASK-08 scope (covered by updated task seed) |

## Planning Constraints & Notes

- Must-follow patterns:
  - All tasks are markdown edits/deletes; use `Edit` and `Bash rm` tools only.
  - TASK-07 (delete shared files) should be executed last among skill file changes to maintain referential consistency while editing.
  - Tasks 01-04 are independent and can be parallelized. TASK-05 and TASK-06 must be applied in the same session, and TASK-05 should precede or accompany TASK-06: a state where TASK-06 is applied but TASK-05 is not will block `startup-loop advance` for DO-stage businesses via the un-scoped global invariant in `startup-loop/SKILL.md:172` ("BOS sync must be confirmed complete before advance"). TASK-07 should follow 01-06.
  - TASK-08, TASK-09 are independent of each other and can run in parallel with TASK-07.
  - TASK-10 and TASK-11 should ship in the same rollout as TASK-01..TASK-09 to avoid a temporary state where operator docs and discovery tooling contradict decoupled DO skills.
- Rollout/rollback expectations:
  - All changes are in `.claude/skills/` and `docs/plans/_templates/`. Git revert is the rollback mechanism.
  - No migration of existing docs/artifacts needed; existing `Card-ID` / `Business-OS-Integration` fields in live `fact-find.md` and `plan.md` files become inert.

## Suggested Task Seeds (Non-binding)

- TASK-01: Edit `lp-do-fact-find/SKILL.md` — remove Phase 8, Phase 9; simplify Phase 1 discovery to filesystem scan; simplify Phase 2 to remove card hydration path; remove `direct-inject` pattern (no longer needed since there is only one path); update skill description list to remove "Optional Business OS sync"; remove BOS sync item from Quick Validation Gate
- TASK-02: Edit `lp-do-plan/SKILL.md` — remove Phase 9; update Phase 2 discovery to filesystem scan of `docs/plans/*/fact-find.md` for `Status: Ready-for-planning`; fix Phase 11 ordering note; remove "Optional BOS sync" from the skill's owned-items list; update Quick Checklist
- TASK-03: Edit `lp-do-build/SKILL.md` — remove `## BOS Integration` section; remove Gate 5 "Run BOS sync hooks when enabled" line; update Discovery path to filesystem scan of `docs/plans/*/plan.md` for `Status: Active`; remove `build-bos-integration.md` and `discovery-index-contract.md` from Shared Utilities; remove Quick Checklist "BOS/discovery hooks" item
- TASK-04: Edit `lp-do-critique/SKILL.md` — remove BOS frontmatter validation items (lines 272-274: `Business-OS-Integration`, `Business-Unit`, `Card-ID` checks)
- TASK-05: Edit `startup-loop/SKILL.md` — update global invariant to scope "BOS sync must be confirmed complete before advance" to non-DO stages (or add parenthetical exception for DO)
- TASK-06: Edit `startup-loop/modules/cmd-advance.md` — rewrite DO entry in Business OS Sync Contract table from "upsert stage docs and lane transitions via API" to filesystem-only: "advance gating is filesystem-only (fact-find.md Status: Ready-for-planning, plan.md Status: Active, build-record.user.md for completion)"; remove "Never allow stage advance when BOS sync has failed" qualifier for DO scope
- TASK-07: Delete `.claude/skills/_shared/fact-find-bos-integration.md`, `.claude/skills/_shared/plan-bos-integration.md`, `.claude/skills/_shared/build-bos-integration.md` (pre-flight: grep to confirm zero consumers)
- TASK-08: Edit `_shared/stage-doc-integration.md` — remove "From /lp-do-fact-find", "From /lp-do-plan", "From /lp-do-build" subsections under "Integration with Skills"; retain "From /meta-reflect"; update "Lane Transitions" table header note to clarify these apply only to meta-reflect/idea-advance context; remove the three rows mapping DO-skill stage docs (`fact-find.user.md → Inbox -> Fact-finding`, `plan.user.md → Fact-finding -> Planned`, `build.user.md → Planned -> In progress`) from the Lane Transitions table, since DO skills will no longer trigger these transitions after decoupling
- TASK-09: Edit `docs/plans/_templates/fact-find-planning.md` and `docs/plans/_templates/plan.md` — remove `Business-OS-Integration`, `Business-Unit`, `Card-ID` frontmatter fields; also remove `direct-inject` and `direct-inject-rationale` fields from `fact-find-planning.md`, as these fields exist solely to bypass the BOS card creation requirement that is being removed — after decoupling, all fact-finds are implicitly direct-inject and these fields are vestigial
- TASK-10: Edit `docs/agents/feature-workflow-guide.md`, `docs/business-os/agent-workflows.md`, and `docs/business-os/startup-loop/loop-output-contracts.md` — remove BOS-default DO claims (`Business-OS-Integration on/off` behavior, DO stage-doc/lane API side-effects) and align instructions/contracts with filesystem-only DO workflow
- TASK-11: Edit `docs/business-os/_meta/rebuild-discovery-index.sh` — remove or harden `Card-ID` / `Business-Unit` extraction for `docs/plans/*` artifacts (post-template-removal), then validate generated JSON remains correct

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - All eleven task edits/deletes committed.
  - Post-change grep confirms: no reference to `Phase 8`, `Phase 9`, `discovery-index.json`, `bos-integration` in the six DO skill SKILL.md files.
  - Post-change grep confirms: the three deleted shared files no longer exist at their paths.
  - Post-change docs check confirms no BOS-default DO behavior remains in `feature-workflow-guide.md`, `agent-workflows.md`, or `loop-output-contracts.md`.
  - Post-change discovery-index rebuild check confirms valid JSON output and expected metadata behavior for `readyForPlanning`/`readyForBuild` entries.
  - `startup-loop advance` DO sync contract entry updated to filesystem-only.
- Post-delivery measurement plan:
  - Smoke test: invoke `/lp-do-fact-find` on a topic; confirm no Phase 8/9 in output; confirm frontmatter has no BOS fields.
  - Smoke test: invoke `/startup-loop advance --business <BIZ>` for a business in DO stage; confirm it no longer checks BOS API availability.
  - Smoke test: run `docs/business-os/_meta/rebuild-discovery-index.sh` and validate `readyForPlanning`/`readyForBuild` rows no longer rely on removed frontmatter fields.

## Evidence Gap Review

### Gaps Addressed

- BOS integration phases confirmed by direct file reads of all three active SKILL.md files.
- Shared module list confirmed by `_shared/` glob — all three target deletion files present.
- Downstream dependency map confirmed by grep across all `.claude/skills/**/*.md`.
- `startup-loop` advance gate behavior confirmed by full read of `cmd-advance.md`.
- `lp-do-critique` BOS validation lines confirmed by targeted grep (lines 272-274).
- Non-skill contracts checked: `feature-workflow-guide.md`, `agent-workflows.md`, `loop-output-contracts.md`, and `rebuild-discovery-index.sh` still encode BOS-linked DO assumptions and are now explicitly in scope.

### Confidence Adjustments

- H4 (no other consumers of deleted files) upgraded from "assumption" to "confirmed" by grep evidence.
- H2 (`lp-bos-sync` not consuming deleted files) confirmed by critique grep (2026-02-24): zero hits for `bos-integration` in `lp-bos-sync/SKILL.md`. Pre-flight grep in TASK-07 retained as a belt-and-suspenders check.

### Remaining Assumptions

- `lp-bos-sync/SKILL.md` does not reference the three files to be deleted. (Confirmed — critique grep 2026-02-24 returned zero hits. Pre-flight grep in TASK-07 retained as belt-and-suspenders.)
- `docs/business-os/_meta/rebuild-discovery-index.sh` currently reads `Card-ID` and `Business-Unit` from `docs/plans/*`; removing those fields from templates will not crash the script but can degrade index metadata unless TASK-11 is completed. (Confirmed by direct file read of script lines 62-75 and 82-97.)

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan docs/plans/do-skills-bos-decoupling/fact-find.md`
