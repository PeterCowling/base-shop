---
Type: Plan
Status: Archived
Domain: BOS
Workstream: Engineering
Created: 2026-03-14
Last-reviewed: 2026-03-14
Last-updated: 2026-03-14 (TASK-04 complete)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: startup-loop-ui-audit-integration
Dispatch-ID: IDEA-DISPATCH-20260313192500-BRIK-BOS-007
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: tools-ui-contrast-sweep
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/startup-loop-ui-audit-integration/analysis.md
---

# Startup Loop UI Audit Integration — Plan

## Summary

This plan integrates `tools-ui-contrast-sweep` into the S9B stage of the startup loop by:
1. Adding a `Business: <BIZ>` frontmatter field to the sweep report template (prerequisite for business-scoped gate logic).
2. Implementing `GATE-UI-SWEEP-01` in `s9b-gates.md` — a hard gate that blocks S9B→SIGNALS advance when no recent, rendered, business-scoped sweep artifact exists or when the artifact contains unresolved S1 blockers.
3. Updating `loop-spec.yaml` to spec_version 3.16.0 with the new secondary skill and gate comment block.
4. Aligning documentation in `startup-loop/SKILL.md`, `cmd-advance.md`, and `tools-ui-contrast-sweep/SKILL.md`.
5. Adding a self-contained 9-case test file for `GATE-UI-SWEEP-01` gate logic (inline parsing helpers; no separate TypeScript module) following the `s6b-gate-simulation.test.ts` fixture pattern.

No app code, database, or API is touched. All changes are to orchestration/documentation files and a new TypeScript test file in the `scripts` package.

## Active tasks
- [x] TASK-01: Add `Business:` field to sweep report template
- [x] TASK-02: Implement `GATE-UI-SWEEP-01` in `s9b-gates.md`
- [x] TASK-03: Bump `loop-spec.yaml` to v3.16.0 and update S9B stage
- [x] TASK-04: Update alignment docs (startup-loop SKILL.md, cmd-advance.md, tools-ui-contrast-sweep SKILL.md)
- [x] TASK-05: Add unit tests for `GATE-UI-SWEEP-01`

## Goals
- Add `tools-ui-contrast-sweep` as a required step in S9B, covering all routes in both light and dark mode.
- Add a hard gate `GATE-UI-SWEEP-01` to `s9b-gates.md` blocking S9B→SIGNALS advance when no recent sweep exists or when the artifact has unresolved S1 blockers.
- Record this gate in `loop-spec.yaml` with a spec_version bump to 3.16.0.
- Update all alignment docs to reflect the new secondary skill and gate.

## Non-goals
- Redesigning the `/tools-ui-contrast-sweep` workflow.
- Changing `lp-launch-qa` or `lp-design-qa` skills.
- Adding a new loop stage (S9C).
- Automating sweep execution.
- Adding a CLI `--business` flag to `tools-ui-contrast-sweep`.

## Constraints & Assumptions
- Constraints:
  - Gate must remain filesystem-only at advance time (no HTTP calls).
  - `loop-spec.yaml` is runtime-authoritative; spec_version bump required.
  - `Business:` field population is manual (operator fills it in the frontmatter when running the sweep). No CLI flag.
  - Existing sweep artifacts without `Business:` field will hard-block the gate — operators must re-run before advancing S9B.
  - The `Routes-Tested` field may include a parenthetical description (e.g. `"0 (auth-blocked)"`); gate must parse the leading integer.
  - **Route exhaustiveness limitation**: The gate enforces that at least one route was rendered (`Routes-Tested > 0`) and that both modes were tested (`Modes-Tested` includes `light` and `dark`). It cannot verify that every screen was covered — the app's full route inventory is not statically available to the gate. This is a known limitation: the gate is a minimum-bar proxy for "some rendered sweep was done," not a guarantee of complete coverage. Full coverage is an operator responsibility documented in the sweep skill instructions.
- Assumptions:
  - 30-day staleness window matches `GATE-LAUNCH-SEC`.
  - S1 blockers = hard block; S2/S3 = advisory warn only.
  - `Status: Complete` required; `Status: In-progress` → hard block.
  - Immediate hard gate (no grace period) per Decision 3 (R1).

## Inherited Outcome Contract

- **Why:** The startup loop has no step that requires checking how every screen in the app actually looks when rendered — both in light and dark mode. Issues like invisible text in dark mode, clashing colours, and text that is too small are only caught by doing this audit manually. Adding a screen-by-screen rendered audit to the loop means these problems get found automatically for every product, every time, before launch.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The startup loop includes a required rendered UI screen audit at S9B that covers every screen in both light and dark mode, with findings saved as an artifact and blocking issues preventing advance.
- **Source:** operator

## Analysis Reference
- Related analysis: `docs/plans/startup-loop-ui-audit-integration/analysis.md`
- Selected approach inherited:
  - Option C (Business: frontmatter field) for business scoping.
  - D1 (hard-block when Routes-Tested = 0) for degraded-mode.
  - R1 (immediate hard gate) for rollout.
- Key reasoning used:
  - Slug-infix matching (Option B) is brittle for short BIZ identifiers with no enforced naming convention.
  - A non-rendered sweep does not satisfy the operator's stated rendered-screen requirement.
  - Advisory window (R2) adds complexity inconsistent with GATE-LAUNCH-SEC precedent.

## Selected Approach Summary
- What was chosen:
  - Add `Business: <BIZ>` field to sweep report frontmatter template as a required manual field.
  - Gate reads this field to scope the artifact to the correct business.
  - Missing or wrong Business field = hard block.
  - Routes-Tested = 0 = hard block (degraded/non-rendered sweep does not satisfy the requirement).
  - S1-Blockers > 0 = hard block.
  - Status not `Complete` = hard block.
  - Staleness > 30 days = hard block.
  - Immediate hard gate from merge — no grace period.
- Why planning is not reopening option selection:
  - Analysis resolved all three decisions with no remaining operator-only forks.

## Fact-Find Support
- Supporting brief: `docs/plans/startup-loop-ui-audit-integration/fact-find.md`
- Evidence carried forward:
  - `s9b-gates.md` canonical gate location: `.claude/skills/startup-loop/modules/cmd-advance/s9b-gates.md`
  - Sweep artifact path pattern: `docs/audits/contrast-sweeps/YYYY-MM-DD-<slug>/contrast-uniformity-report.md`
  - Existing frontmatter fields: `Type, Status, Audit-Date, Target-URL, Standard, Breakpoints-Tested, Modes-Tested, Routes-Tested, Issues-Total, S1-Blockers, S2-Major, S3-Minor`
  - Loop-spec current version: 3.15.0
  - Gate pass packet fields: `ui_sweep_gate`, `ui_sweep_gate_status`, `ui_sweep_report`
  - s6b gate test pattern confirmed applicable: `scripts/src/startup-loop/__tests__/s6b-gate-simulation.test.ts`

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add `Business:` field to sweep report template | 95% | S | Complete (2026-03-14) | - | TASK-02, TASK-05 |
| TASK-02 | IMPLEMENT | Implement GATE-UI-SWEEP-01 in s9b-gates.md | 90% | M | Complete (2026-03-14) | TASK-01 | TASK-03, TASK-05 |
| TASK-03 | IMPLEMENT | Bump loop-spec.yaml to v3.16.0 and update S9B stage | 90% | S | Complete (2026-03-14) | TASK-02 | TASK-04 |
| TASK-04 | IMPLEMENT | Update alignment docs (3 files) | 90% | S | Complete (2026-03-14) | TASK-03 | - |
| TASK-05 | IMPLEMENT | Add unit tests for GATE-UI-SWEEP-01 (9 cases, inline helpers) | 90% | M | Complete (2026-03-14) | TASK-01, TASK-02 | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | N/A — no rendered UI change | - | Gate enforces external UI quality; does not change rendered output |
| UX / states | 3 block message cases defined in TASK-02 with exact remediation instructions | TASK-02, TASK-04 | Block messages must tell operator exactly what to run |
| Security / privacy | N/A — filesystem-only read; no auth, no untrusted input | - | Same security posture as GATE-LAUNCH-SEC |
| Logging / observability / audit | Gate result added to advance packet: `ui_sweep_gate`, `ui_sweep_gate_status`, `ui_sweep_report` fields | TASK-02 | Advance packet is the audit trail |
| Testing / validation | 9-case unit tests for gate logic using filesystem fixtures | TASK-05 | Covers: no artifact, wrong business, stale, missing Business field, Routes-Tested=0, Modes-Tested missing dark, S1-Blockers>0, Status=In-progress, clean pass |
| Data / contracts | `report-template.md` gains `Business: <BIZ>` field; gate block/pass packet schema defined | TASK-01, TASK-02 | Template change is prerequisite; existing artifacts block until re-run |
| Performance / reliability | N/A — trivially fast (glob + file read) | - | Same perf posture as GATE-LAUNCH-SEC |
| Rollout / rollback | Immediate hard gate. Rollback = revert `s9b-gates.md` edits. No data migration. | TASK-02 | Block messages explain remediation for operators encountering the gate for the first time |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Template change only — smallest possible unit |
| 2 | TASK-02 | TASK-01 complete | Gate implementation; requires template schema as contract reference |
| 3 | TASK-03, TASK-05 | TASK-02 complete | Spec bump and tests can be parallel after gate exists |
| 4 | TASK-04 | TASK-03 complete | Alignment docs require spec version bump to be known |

## Delivered Processes

| Area | Trigger | Delivered step-by-step flow | Tasks / dependencies | Unresolved issues / rollback seam |
|---|---|---|---|---|
| S9B stage execution | `startup-loop advance --business <BIZ>` at S9B | 1. Operator runs `/tools-ui-contrast-sweep`, sets `Business: <BIZ>` in report frontmatter manually. 2. Operator runs `/lp-launch-qa --business <BIZ>`. 3. Operator optionally runs `/lp-design-qa`. 4. Operator runs `startup-loop advance`. Gate checks GATE-LAUNCH-SEC then GATE-UI-SWEEP-01. Both must pass. | TASK-01, TASK-02, TASK-03, TASK-04 | Ordering is operator-driven; gate doesn't enforce which step runs first. No CLI flag enforces Business field population — operator must remember. |
| S9B→SIGNALS advance gate | S9B→SIGNALS advance attempt | GATE-LAUNCH-SEC runs (unchanged). GATE-UI-SWEEP-01 runs 6 checks: (a) globs artifacts, reads `Business:` field to filter for current BIZ, (b) parses `Audit-Date:` for staleness (≤30 days), (c) checks `Status: Complete`, (d) parses `Routes-Tested` leading integer (must be > 0), (e) checks `Modes-Tested` includes both `light` and `dark`, (f) checks `S1-Blockers = 0`. Pass or block with specific message. | TASK-02 | Rollback: revert `s9b-gates.md`. Operator facing a new block must run the sweep with `Business:` field set. |
| Sweep artifact schema | Gate implementation requires `Business: <BIZ>` | `report-template.md` gains `Business: <BIZ>`. Future sweeps produce artifacts with this field. Gate reads it. | TASK-01 | Legacy artifacts (19) lack the field. Any business currently at S9B with an existing sweep must re-run before advancing. Block message explains this. |

## Tasks

---

### TASK-01: Add `Business:` field to sweep report template

- **Type:** IMPLEMENT
- **Deliverable:** Updated `report-template.md` with `Business: <BIZ>` field in frontmatter
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Affects:** `.claude/skills/tools-ui-contrast-sweep/modules/report-template.md`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-05
- **Confidence:** 95%
  - Implementation: 95% - One-line frontmatter addition to a known file; no logic, no dependencies.
  - Approach: 95% - Option C (explicit Business field) is settled by analysis. No ambiguity in the change.
  - Impact: 95% - This is the prerequisite schema change that all other tasks depend on. Its correctness is binary (field present or not).
- **Acceptance:**
  - `Business: <BIZ>` appears as a new frontmatter line in `report-template.md` above or alongside other header fields.
  - Position in frontmatter is consistent with existing field ordering (after `Type:` and `Status:` or as a natural group with other metadata).
  - No other content in the template file is changed.
  - A comment or note (or the field value `<BIZ>`) makes clear this is a required field that operators must fill.
- **Engineering Coverage:**
  - UI / visual: N/A — no rendered UI change
  - UX / states: Required — the field label and placeholder `<BIZ>` must be clear enough for operators to know what to enter without additional instruction
  - Security / privacy: N/A — local file edit, no sensitive data
  - Logging / observability / audit: N/A — template only
  - Testing / validation: N/A — this is a Markdown template; TASK-05 tests the gate that reads it
  - Data / contracts: Required — this field is the schema contract that TASK-02 and TASK-05 depend on; the exact field name must be `Business:` (case-sensitive, YAML frontmatter)
  - Performance / reliability: N/A
  - Rollout / rollback: N/A — one-line Markdown addition; rollback is trivially revert
- **Validation contract (TC-01):**
  - TC-01: Open `report-template.md` after edit → `Business:` is present in the `---` frontmatter block
  - TC-02: Existing frontmatter fields (Type, Status, Audit-Date, etc.) are all still present and unchanged
- **Execution plan:** Red -> Green -> Refactor
  - Red: Read `report-template.md` current frontmatter to confirm exact field order and spacing.
  - Green: Insert `Business: <BIZ>` after `Status:` (or equivalent natural position). Save.
  - Refactor: Verify with a quick read that no formatting artifact was introduced.
- **Planning validation (required for M/L):**
  - None: S effort — single-file, single-line addition.
- **Scouts:** None: field name and location are unambiguous from the analysis.
- **Edge Cases & Hardening:**
  - Only one change to the file. Do not reformat or reorder other fields.
  - Value placeholder `<BIZ>` should match the style of other placeholder values already in the template (e.g. `<https://...>`, `<count>`) — no deviation from existing placeholder style.
- **What would make this >=90%:**
  - Already at 95%. Nothing further — this is a mechanical one-line addition.
- **Rollout / rollback:**
  - Rollout: File edit — immediately effective when committed.
  - Rollback: `git revert` the line. No downstream impact beyond TASK-02 gate logic.
- **Documentation impact:**
  - None beyond the template itself. TASK-04 handles the SKILL.md update that tells operators about the field.
- **Notes / references:**
  - Current template: `.claude/skills/tools-ui-contrast-sweep/modules/report-template.md`
  - Existing fields confirmed: `Type, Status, Audit-Date, Target-URL, Standard, Breakpoints-Tested, Modes-Tested, Routes-Tested, Issues-Total, S1-Blockers, S2-Major, S3-Minor`
- **Build evidence (2026-03-14):**
  - TC-01: `Business: <BIZ>` present at line 13 of report-template.md, in `---` frontmatter block ✓
  - TC-02: All 12 existing frontmatter fields confirmed present and unchanged ✓
  - Post-build validation: Mode 2 (Data Simulation), Attempt 1, Pass
  - Engineering coverage: UX/states — placeholder style `<BIZ>` consistent with template conventions ✓; Data/contracts — field name `Business:` case-sensitive YAML, exact spec ✓
  - Commit: `597462ffa9` (1 file, 1 insertion)

---

### TASK-02: Implement GATE-UI-SWEEP-01 in s9b-gates.md

- **Type:** IMPLEMENT
- **Deliverable:** New `GATE-UI-SWEEP-01` section appended to `.claude/skills/startup-loop/modules/cmd-advance/s9b-gates.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `.claude/skills/startup-loop/modules/cmd-advance/s9b-gates.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-03, TASK-05
- **Confidence:** 90%
  - Implementation: 90% - Pattern is fully established by GATE-LAUNCH-SEC in the same file. The check sequence is unambiguous. One risk: `Routes-Tested` parsing (leading integer from possible parenthetical string) — noted in planning.
  - Approach: 90% - All three decisions resolved by analysis. Filesystem-only, no architectural unknowns.
  - Impact: 90% - This gate is the core deliverable of the entire feature. Its correctness directly determines whether the operator outcome is achieved.
  - Held-back test (Implementation=90): What single unknown would drop below 80? If the `Routes-Tested` field format in real artifacts differs significantly from the confirmed format, the parse logic could be wrong. But the format is confirmed from an actual artifact (`"0 (auth-blocked — token-level + code-level analysis only)"`), so this is not a genuine unknown — the parse strategy is "extract leading integer before any space/parenthesis". Held-back test passes: no single unresolved unknown would drop below 80.
- **Acceptance:**
  - `GATE-UI-SWEEP-01` section appended to `s9b-gates.md` after `GATE-LAUNCH-SEC`.
  - Gate ID, severity (Hard), and trigger (S9B→SIGNALS advance) declared.
  - Check sequence covers all 6 conditions in order:
    1. Glob `docs/audits/contrast-sweeps/*/contrast-uniformity-report.md`. Read `Business:` field. If no matching artifact for current `<BIZ>`: BLOCK (Case A).
    2. Parse `Audit-Date:` from the most recent matching artifact. If > 30 days before today: BLOCK (Case B).
    3. Read `Status:` field. If not `Complete`: BLOCK (Case B — stale/invalid artifact).
    4. Parse leading integer from `Routes-Tested:` field. If = 0: BLOCK (Case C — degraded/non-rendered sweep).
    5. Read `Modes-Tested:` field. If it does not include both `light` and `dark`: BLOCK (Case C — incomplete mode coverage). This enforces the operator's stated requirement of "both light and dark mode."
    6. Read `S1-Blockers:` field. If > 0: BLOCK (Case C — unresolved blockers).
  - Three distinct block messages defined (see Block Messages below).
  - Pass packet fields defined: `ui_sweep_gate: GATE-UI-SWEEP-01`, `ui_sweep_gate_status: pass`, `ui_sweep_report: <path>`.
  - Block packet structure matches GATE-LAUNCH-SEC shape.
  - Notes section explains: filesystem-only; `Business:` field is manually set by operator; `Routes-Tested` leading integer parse; legacy artifacts without `Business:` field block until sweep is re-run; `Routes-Tested > 0` is a proxy (gate cannot verify route exhaustiveness — operator must ensure all routes are covered when running the sweep).
- **Block Messages (exact):**
  - Case A (no artifact found / missing Business field): `"GATE-UI-SWEEP-01: No rendered UI sweep artifact found for business <BIZ>. Run /tools-ui-contrast-sweep, then manually set 'Business: <BIZ>' in the report frontmatter before re-running advance."`
  - Case B (stale artifact or Status not Complete): `"GATE-UI-SWEEP-01: UI sweep artifact is >30 days old or not yet complete (Status must be 'Complete'). Re-run /tools-ui-contrast-sweep with Business: <BIZ> in the report frontmatter, then re-run advance."`
  - Case C (Routes-Tested = 0, Modes-Tested missing light/dark, or S1-Blockers > 0): `"GATE-UI-SWEEP-01: UI sweep artifact for <BIZ> is insufficient — either no routes were rendered (Routes-Tested: 0), both light and dark modes were not tested (Modes-Tested must include both), or S1 blocking issues remain. Resolve all S1 blockers, ensure rendered route coverage, and ensure both modes are tested before re-running advance."`
- **Engineering Coverage:**
  - UI / visual: N/A — no rendered UI change
  - UX / states: Required — three block cases with exact, actionable messages. Operator must know what to run after each block type.
  - Security / privacy: N/A — filesystem-only read of local files; no auth, no untrusted network input
  - Logging / observability / audit: Required — pass packet fields (`ui_sweep_gate`, `ui_sweep_gate_status`, `ui_sweep_report`) added to advance output
  - Testing / validation: Required — TASK-05 validates all 9 cases against this gate's logic
  - Data / contracts: Required — reads `Business:`, `Audit-Date:`, `Status:`, `Routes-Tested:`, `Modes-Tested:`, `S1-Blockers:` from frontmatter. `Routes-Tested:` may contain non-integer suffix; parse leading integer. `Modes-Tested:` must contain both "light" and "dark" as substrings. Gate consumes `Business:` field added in TASK-01.
  - Performance / reliability: N/A — single glob + file read; trivially fast
  - Rollout / rollback: Required — immediate hard gate. Rollback = revert this file. Block messages explain remediation.
- **Validation contract (TC-01 through TC-08):**
  - TC-01: No artifact in `docs/audits/contrast-sweeps/` with `Business: TEST-BIZ` → BLOCK (Case A)
  - TC-02: Artifact exists, `Business: TEST-BIZ`, `Audit-Date` > 30 days ago, `Status: Complete` → BLOCK (Case B — stale)
  - TC-03: Artifact exists, `Business: TEST-BIZ`, fresh date, `Status: In-progress` → BLOCK (Case B — not complete)
  - TC-04: Artifact exists, `Business: TEST-BIZ`, fresh, `Status: Complete`, `Routes-Tested: 0 (auth-blocked)` → BLOCK (Case C — degraded)
  - TC-05: Artifact exists, `Business: TEST-BIZ`, fresh, `Status: Complete`, `Routes-Tested: 5`, `Modes-Tested: light` (dark missing) → BLOCK (Case C — incomplete mode coverage)
  - TC-06: Artifact exists, `Business: TEST-BIZ`, fresh, `Status: Complete`, `Routes-Tested: 5`, `Modes-Tested: light,dark`, `S1-Blockers: 2` → BLOCK (Case C — blockers)
  - TC-07: Artifact exists, `Business: TEST-BIZ`, fresh, `Status: Complete`, `Routes-Tested: 5`, `Modes-Tested: light,dark`, `S1-Blockers: 0` → PASS; advance packet includes `ui_sweep_gate` fields
  - TC-08: Artifact exists, no `Business:` field (legacy artifact) → BLOCK (Case A — treated as no scoped artifact)
- **Execution plan:** Red -> Green -> Refactor
  - Red: Read the current `s9b-gates.md` to confirm structure and existing GATE-LAUNCH-SEC format. Understand exact field names, heading levels, and note conventions.
  - Green: Append `GATE-UI-SWEEP-01` section as a new `## GATE-UI-SWEEP-01` block following the exact same structure as `## GATE-LAUNCH-SEC`. Include: Gate ID header, severity, trigger, check steps 1–6 (Business scoping, staleness, Status, Routes-Tested, Modes-Tested, S1-Blockers), block messages for each case (A, B, C), pass packet, block packet, notes section.
  - Refactor: Re-read the appended section to confirm heading levels, formatting consistency, no stray content, and exact block message strings match what is specified above.
- **Planning validation (required for M/L):**
  - Checks run:
    - Confirmed `s9b-gates.md` current structure via fact-find.
    - Confirmed `Routes-Tested: "0 (auth-blocked — token-level + code-level analysis only)"` format exists in `docs/audits/contrast-sweeps/2026-03-12-reception-remaining-theming/contrast-uniformity-report.md` — leading integer parse strategy confirmed.
    - Confirmed `Business:` field is not currently in any existing artifact — all legacy artifacts will block until re-run (expected and intended).
    - Confirmed `Audit-Date:` is the frontmatter field name for dates (not parsed from filename as in GATE-LAUNCH-SEC). This is a difference from GATE-LAUNCH-SEC which parses date from filename. The sweep artifact has `Audit-Date:` in frontmatter; gate should read this field directly rather than parsing the directory name slug date.
  - Validation artifacts: `docs/audits/contrast-sweeps/2026-03-12-reception-remaining-theming/contrast-uniformity-report.md` (confirmed frontmatter schema)
  - Unexpected findings:
    - GATE-LAUNCH-SEC parses date from filename; sweep artifacts have `Audit-Date:` as an explicit frontmatter field. Plan uses the frontmatter field for staleness — this is simpler and more reliable than parsing the directory slug. TASK-05 tests must use `Audit-Date:` not slug-derived date.
- **Consumer tracing:**
  - New outputs: `ui_sweep_gate`, `ui_sweep_gate_status`, `ui_sweep_report` fields in the advance pass packet.
  - Consumers: `startup-loop advance` operator output (displayed to operator). No downstream code consumes the advance packet fields programmatically — they are informational output to the operator. Safe to add without updating callers.
  - Modified behavior: `startup-loop advance` at S9B now has an additional hard gate. Any business attempting S9B→SIGNALS advance without a compliant sweep artifact will block. This is intentional.
- **Scouts:** Confirm `Audit-Date:` is the correct frontmatter key (not `date:` or a different key) by reading an actual artifact before writing the gate logic.
- **Edge Cases & Hardening:**
  - `Routes-Tested` parse: extract leading integer using `parseInt(value)` — `parseInt("0 (auth-blocked)")` = 0, `parseInt("5")` = 5. Handle `NaN` (malformed field) as 0 (block).
  - Multiple artifacts for the same business: use the most recent by `Audit-Date:` descending.
  - `Business:` field matching: case-insensitive comparison recommended (e.g. `brik` matches `BRIK`) — confirm in TASK-05 fixtures.
  - Missing `Business:` field: treated as no matching artifact (Case A block), not as a separate case. Simplifies the check tree.
- **What would make this >=90%:**
  - Already at 90%. Held-back test passed. Could reach 95% once TASK-05 tests confirm all 9 cases pass against the actual gate logic (including the Modes-Tested check added per critique).
- **Rollout / rollback:**
  - Rollout: Append to `s9b-gates.md` and commit. Gate is active immediately on next `startup-loop advance` invocation.
  - Rollback: Remove or comment out the `## GATE-UI-SWEEP-01` section from `s9b-gates.md`. No data migration needed.
- **Documentation impact:**
  - Notes section within the gate definition explains the manual `Business:` field requirement and the legacy artifact remediation path.
- **Notes / references:**
  - Reference implementation: `.claude/skills/startup-loop/modules/cmd-advance/s9b-gates.md` (GATE-LAUNCH-SEC section)
  - Confirmed frontmatter schema: `docs/audits/contrast-sweeps/2026-03-12-reception-remaining-theming/contrast-uniformity-report.md`

---

### TASK-03: Bump loop-spec.yaml to v3.16.0 and update S9B stage

- **Type:** IMPLEMENT
- **Deliverable:** Updated `loop-spec.yaml` with spec_version 3.16.0, S9B secondary skills list updated, GATE-UI-SWEEP-01 comment block added to S9B stage
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/business-os/startup-loop/specifications/loop-spec.yaml`
- **Depends on:** TASK-02
- **Blocks:** TASK-04
- **Confidence:** 90%
  - Implementation: 90% - Exact YAML structure confirmed. Version bump + secondary skills list append + comment block. Pattern established by v3.15.0. Low risk of breaking YAML parsing.
  - Approach: 90% - Analysis settled: spec_version must bump, S9B entry must add secondary skill and gate comment.
  - Impact: 90% - loop-spec.yaml is the runtime-authoritative spec. This change makes the gate official.
- **Acceptance:**
  - `spec_version` at the top of the file bumped from `3.15.0` to `3.16.0`.
  - New changelog comment block added at the top of the changelog section, documenting v3.16.0: adds GATE-UI-SWEEP-01 (Hard) to S9B stage; adds `tools-ui-contrast-sweep` to S9B secondary skills; specifies Business-field scoping and hard-block conditions.
  - S9B `secondary_skills:` list updated from `[/lp-design-qa]` to `[/lp-design-qa, /tools-ui-contrast-sweep]`.
  - S9B stage block gains a new comment for GATE-UI-SWEEP-01 following the GATE-LAUNCH-SEC comment pattern: gate ID, severity, trigger, pass condition summary, enforced-by reference.
  - `scripts/check-startup-loop-contracts.sh` passes after this change.
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: N/A — spec file only
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — `scripts/check-startup-loop-contracts.sh` must pass after edit
  - Data / contracts: Required — spec_version is the canonical version reference; downstream alignment docs (TASK-04) must cite 3.16.0
  - Performance / reliability: N/A
  - Rollout / rollback: N/A — YAML edit; rollback is revert
- **Validation contract (TC-01):**
  - TC-01: `scripts/check-startup-loop-contracts.sh` exits 0 after the edit
  - TC-02: `grep "spec_version" loop-spec.yaml` → `3.16.0`
  - TC-03: S9B `secondary_skills:` contains both `/lp-design-qa` and `/tools-ui-contrast-sweep`
- **Execution plan:** Red -> Green -> Refactor
  - Red: Read the current S9B section and changelog header in `loop-spec.yaml` to confirm exact format and indentation.
  - Green: (1) Bump spec_version. (2) Add v3.16.0 changelog comment block. (3) Add `/tools-ui-contrast-sweep` to S9B `secondary_skills`. (4) Add GATE-UI-SWEEP-01 comment block to S9B stage.
  - Refactor: Run `scripts/check-startup-loop-contracts.sh`. Fix any contract failures.
- **Planning validation (required for M/L):**
  - None: S effort.
- **Scouts:** Confirm `secondary_skills` YAML list format accepts string items with `/` prefix (confirmed: existing `[/lp-design-qa]` uses this format).
- **Edge Cases & Hardening:**
  - YAML indentation must be consistent with surrounding file. Use 2-space indent for comment lines that align with the existing GATE-LAUNCH-SEC comment.
  - Do not accidentally change any other stage entries.
- **What would make this >=90%:**
  - Already at 90%. Reaches 95% when `check-startup-loop-contracts.sh` confirms pass.
- **Rollout / rollback:**
  - Rollout: Commit. Effective immediately.
  - Rollback: Revert the three changes (spec_version, secondary_skills, comment block) in one commit.
- **Documentation impact:**
  - TASK-04 handles downstream alignment docs that reference spec_version.
- **Notes / references:**
  - Current S9B block: `loop-spec.yaml` (lines ~1214–1228 from fact-find evidence)

---

### TASK-04: Update alignment docs

- **Type:** IMPLEMENT
- **Deliverable:** Updated `startup-loop/SKILL.md`, `cmd-advance.md`, and `tools-ui-contrast-sweep/SKILL.md` to reflect the new secondary skill and gate
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Affects:**
  - `.claude/skills/startup-loop/SKILL.md`
  - `.claude/skills/startup-loop/modules/cmd-advance.md`
  - `.claude/skills/tools-ui-contrast-sweep/SKILL.md` (3 changes: (1) loop-position update, (2) `Business: <BIZ>` manual operator requirement, (3) full-route-coverage requirement for S9B advance)
- **Depends on:** TASK-03
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% - Three Markdown doc edits. No logic. Exact lines confirmed by fact-find.
  - Approach: 90% - Analysis determined all three files require updates.
  - Impact: 90% - VC-02 alignment: out-of-date skill docs cause operator confusion about loop stage requirements.
- **Acceptance:**
  - `startup-loop/SKILL.md` stage map table S9B row: `tools-ui-contrast-sweep` added alongside `lp-launch-qa` and `lp-design-qa`.
  - `cmd-advance.md` step 6 (or equivalent S9B gate summary section): `GATE-UI-SWEEP-01` listed alongside `GATE-LAUNCH-SEC` in the gate list/summary.
  - `tools-ui-contrast-sweep/SKILL.md` three changes:
    1. "Loop position" updated from `"S9C (Parallel Sweep)"` to `"S9B secondary skill, required before S9B→SIGNALS advance"`.
    2. New requirement note added: operators must manually set `Business: <BIZ>` in the report frontmatter before saving. Exact instruction required: "Set `Business: <BIZ>` in the report frontmatter (replace `<BIZ>` with the business identifier, e.g. BRIK). GATE-UI-SWEEP-01 requires this field to scope the artifact to the correct business."
    3. New requirement note added: operators must sweep all application routes (not a best-effort subset) when running for S9B advance. Exact instruction required: "When running for S9B→SIGNALS advance, cover all routes in the deployed application. GATE-UI-SWEEP-01 requires Routes-Tested > 0 and both light and dark modes, but cannot verify completeness — you must ensure all screens are included."
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: Required — SKILL.md for tools-ui-contrast-sweep must document: (1) operators must manually set `Business: <BIZ>` in the report frontmatter; (2) operators must cover all application routes (not a best-effort subset) when running for S9B advance
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: N/A — documentation only
  - Data / contracts: N/A
  - Performance / reliability: N/A
  - Rollout / rollback: N/A — Markdown only
- **Validation contract (TC-01):**
  - TC-01: `grep -n "tools-ui-contrast-sweep" .claude/skills/startup-loop/SKILL.md` → S9B row updated
  - TC-02: `grep -n "GATE-UI-SWEEP-01" .claude/skills/startup-loop/modules/cmd-advance.md` → found
  - TC-03: `grep -n "S9C" .claude/skills/tools-ui-contrast-sweep/SKILL.md` → no result (removed)
  - TC-04: `grep -n "S9B secondary" .claude/skills/tools-ui-contrast-sweep/SKILL.md` → found
  - TC-05: `grep -in "routes.*all\|all routes\|full coverage\|every route" .claude/skills/tools-ui-contrast-sweep/SKILL.md` → language about covering all routes present (for S9B advance context)
  - TC-06: `grep -in "Business.*frontmatter\|frontmatter.*Business\|manually.*Business\|set.*Business" .claude/skills/tools-ui-contrast-sweep/SKILL.md` → found; confirms the SKILL.md explicitly instructs operators to manually set the `Business:` field in the frontmatter (not just that the token appears somewhere)
- **Execution plan:** Red -> Green -> Refactor
  - Red: Read the relevant sections of each file to confirm exact line text and context.
  - Green: Make targeted edits to each file — no wholesale rewrites.
  - Refactor: Run TC-01 through TC-06 grep checks (all six validation checks).
- **Planning validation (required for M/L):**
  - None: S effort.
- **Scouts:** None — exact lines confirmed by fact-find.
- **Edge Cases & Hardening:**
  - `tools-ui-contrast-sweep/SKILL.md`: add a note that `Business: <BIZ>` must be manually set in the report frontmatter. This is the primary operator-facing instruction for the new field — if it is absent here, operators will not know to set it.
- **What would make this >=90%:**
  - Already at 90%. Mechanical doc updates with zero implementation risk.
- **Rollout / rollback:**
  - Rollout: Commit.
  - Rollback: Revert Markdown edits.
- **Documentation impact:**
  - These files ARE the documentation. All changes are in scope.
- **Notes / references:**
  - `startup-loop/SKILL.md` stage table line (from fact-find): `| S9B | QA gates | \`/lp-launch-qa\`, \`/lp-design-qa\` | — |`
  - `cmd-advance.md` step 6 routes to `s9b-gates.md` and lists `GATE-LAUNCH-SEC` in summary
  - `tools-ui-contrast-sweep/SKILL.md` line declares `Loop position: S9C (Parallel Sweep)`
- **Build evidence (2026-03-14):**
  - Commit: `5b147ae36b` — `feat(startup-loop): add GATE-UI-SWEEP-01 to alignment docs and contrast-sweep skill`
  - TC-01 pass: `grep -n "tools-ui-contrast-sweep" .claude/skills/startup-loop/SKILL.md` → S9B row updated (tools-ui-contrast-sweep added)
  - TC-02 pass: `grep -n "GATE-UI-SWEEP-01" .claude/skills/startup-loop/modules/cmd-advance.md` → line 73 found
  - TC-03 pass: `grep -n "S9C (Parallel Sweep)" .claude/skills/tools-ui-contrast-sweep/SKILL.md` → no match (removed)
  - TC-04 pass: `grep -n "S9B secondary" .claude/skills/tools-ui-contrast-sweep/SKILL.md` → line 237 found
  - TC-05 pass: all-routes language found at line 238 (`All application routes must be covered`)
  - TC-06 pass: `Business.*frontmatter\|manually.*Business` found at line 238 (`must manually set \`Business: <BIZ>\` in the report frontmatter`)

---

### TASK-05: Add unit tests for GATE-UI-SWEEP-01

- **Type:** IMPLEMENT
- **Deliverable:** New self-contained test file `scripts/src/startup-loop/__tests__/s9b-ui-sweep-gate.test.ts` covering 9 gate scenarios; gate-parsing helpers defined inline within the test file (no separate `s9b-gates.ts` module)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `scripts/src/startup-loop/__tests__/s9b-ui-sweep-gate.test.ts` (new — self-contained; no external module import for gate logic)
- **Depends on:** TASK-01, TASK-02
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% - Test pattern established by `s6b-gate-simulation.test.ts` (fixture helpers, `fs.mkdtemp` isolation, afterEach cleanup). Key replan decision: gate-parsing helpers (frontmatter extraction, field reading, date parsing, integer parsing) are defined inline within the test file itself — no separate `s9b-gates.ts` module. This eliminates the drift risk between a TypeScript module and the authoritative Markdown spec entirely. The `Modes-Tested` field format is now confirmed from live artifacts: both `"light, dark"` (with space) and `"light,dark"` (without space) appear in the repo — parsing must normalize by checking for "light" and "dark" as independent substrings (not exact string match). Held-back test passes: no remaining single unknown would drop below 80.
  - Approach: 90% - Inline helpers is the architecturally correct choice for a gate whose authoritative spec is a Markdown file read by an AI agent at runtime, not a TypeScript runtime. There is no value in a separate importable module when that module has no runtime consumer — tests with inline helpers are simpler, less surface area for drift, and fully self-documenting.
  - Impact: 90% - Tests prevent gate logic regression against the 9 specified cases. The inline approach means any future change to `s9b-gates.md` that requires test updates will be visible in a single file, not split across two files.
  - Confidence method: min(Implementation, Approach, Impact) = min(90, 90, 90) = **90%**.
- **Acceptance:**
  - Test file exists at `scripts/src/startup-loop/__tests__/s9b-ui-sweep-gate.test.ts`.
  - No `s9b-gates.ts` module is created — all gate-parsing helpers are defined inline within the test file.
  - All 9 test cases pass:
    1. No artifact for business → BLOCK (Case A)
    2. Artifact exists for wrong business → BLOCK (Case A)
    3. Artifact exists, fresh, but `Business:` field missing (legacy) → BLOCK (Case A)
    4. Artifact exists, correct `Business:`, but `Audit-Date:` > 30 days ago → BLOCK (Case B)
    5. Artifact exists, fresh, `Status: In-progress` → BLOCK (Case B)
    6. Artifact exists, fresh, `Status: Complete`, `Routes-Tested: 0 (auth-blocked)` → BLOCK (Case C — degraded)
    7. Artifact exists, fresh, `Status: Complete`, `Routes-Tested: 5`, `Modes-Tested: light` (dark missing) → BLOCK (Case C — mode coverage)
    8. Artifact exists, fresh, `Status: Complete`, `Routes-Tested: 5`, `Modes-Tested: light,dark`, `S1-Blockers: 2` → BLOCK (Case C — blockers)
    9. Artifact exists, fresh, `Status: Complete`, `Routes-Tested: 5`, `Modes-Tested: light,dark`, `S1-Blockers: 0` → PASS; advance packet includes `ui_sweep_gate` fields
  - Fixture files are created in a `tmp` directory using `fs.mkdtemp` — no permanent fixture files in the repo.
  - `Modes-Tested` parsing uses substring checks for `"light"` and `"dark"` independently (not exact string equality) — handles both `"light, dark"` (space) and `"light,dark"` (no space) confirmed in existing repo artifacts.
  - Test file includes a file-level comment referencing `s9b-gates.md` as the authoritative gate specification that these tests verify: `// Tests verifying gate logic specified in .claude/skills/startup-loop/modules/cmd-advance/s9b-gates.md`
  - `pnpm typecheck` (root) passes (run locally before push). `pnpm lint` (root) passes (run locally before push).
  - Tests are CI-only per repo testing policy (`docs/testing-policy.md`). Verified in CI on push — not run locally.
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: Required — test cases include block message verification (the message string for each case)
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — this task IS the testing coverage for the gate
  - Data / contracts: Required — fixture files use the `Business: <BIZ>` field added by TASK-01; `Routes-Tested:` format uses the non-integer suffix form confirmed in existing artifacts; `Modes-Tested:` parsing confirmed against live artifact formats (`"light, dark"` and `"light,dark"`)
  - Performance / reliability: N/A
  - Rollout / rollback: N/A — test file; rollback is delete
- **Validation contract:**
  - TC-01: CI passes on push — `scripts` package tests run via CI only (per repo testing policy: `docs/testing-policy.md`); test pattern `s9b-ui-sweep-gate` must appear in CI output with all 9 cases passing
  - TC-02: `pnpm typecheck` (root) exits 0 (no new type errors — run locally before push)
  - TC-03: `pnpm lint` (root) exits 0 (no new lint errors — run locally before push)
  - TC-04a: `grep -rn "from.*s9b-gates\|require.*s9b-gates\|s9b-gates\.ts" scripts/src/` → no results; confirms no separate `s9b-gates.ts` module is imported anywhere (the file-level comment referencing `s9b-gates.md` does not match this pattern)
  - TC-04b: `test ! -f scripts/src/startup-loop/s9b-gates.ts` → exits 0; confirms no separate module was accidentally created (negated test: exits 0 when file does not exist, fails when file exists)
- **Execution plan:** Red -> Green -> Refactor
  - Red: Write the test file with all 9 failing test cases. Define inline gate-parsing helpers at the top of the test file: `extractFrontmatter`, `readField`, `parseDate`, `parseLeadingInt`. These are private to the test file — not exported. Write fixture-building helpers (`buildSweepArtifact`).
  - Green: Implement `evaluateUiSweepGate(sweepsDir: string, biz: string, now?: Date)` as a local async function inside the test file (not exported). This function encodes the 6-check sequence from `s9b-gates.md`. All 9 test cases pass.
  - Refactor: Ensure `afterEach` cleanup is reliable. Add assertions on block message strings (not just gate status). Verify `Modes-Tested` parsing handles `"light, dark"` and `"light,dark"` variations. Add `parseInt("0 (auth-blocked)")` test case assertion.
- **Planning validation (required for M/L):**
  - Checks run:
    - Confirmed `s6b-gate-simulation.test.ts` pattern: `fs.mkdtemp`, `beforeEach`/`afterEach`, `writeFile` helpers, inline fixture constants.
    - Confirmed `Modes-Tested` field values from live repo artifacts: `"light, dark"` (with space, e.g. `2026-03-01-brik-homepage`), `"light,dark"` (no space, e.g. `2026-03-12-reception-remaining-theming`). Parsing must use substring checks (`includes("light")` and `includes("dark")`), not exact string equality.
    - Confirmed `Routes-Tested` format from `2026-03-12-reception-remaining-theming`: `"0 (auth-blocked — token-level + code-level analysis only)"` — `parseInt()` correctly extracts leading 0.
    - Confirmed `Business:` field is absent from all 19 existing sweep artifacts (confirmed by `grep -rL "Business:" docs/audits/contrast-sweeps/*/contrast-uniformity-report.md`) — legacy artifacts correctly trigger Case A.
    - Decision to use inline helpers (not a separate module) eliminates the persistent Critical finding (s9b-gates.ts has no runtime consumer, creating drift risk). This is the architecturally correct design: a gate whose spec lives in an AI-readable Markdown file should have its test helpers co-located with the tests, not extracted into a separately maintained module.
  - Validation artifacts: `scripts/src/startup-loop/__tests__/s6b-gate-simulation.test.ts` (pattern reference); live artifacts in `docs/audits/contrast-sweeps/` (field format confirmation)
  - Replan decision: drop `s9b-gates.ts` module entirely. Self-contained test file with inline helpers is the correct implementation for a Markdown-spec gate.
- **Consumer tracing (new outputs):**
  - New output: `scripts/src/startup-loop/__tests__/s9b-ui-sweep-gate.test.ts` (test file only).
  - No new module exported — all helpers are local to the test file. No downstream consumer changes needed.
  - The `startup-loop advance` command reads `s9b-gates.md` at runtime. The test file's inline helpers verify the same logic. No TypeScript module sits between them.
- **Scouts:** None — all field format uncertainties resolved by live artifact inspection.
- **Edge Cases & Hardening:**
  - `parseInt("0 (auth-blocked)")` must return 0 — test case 6 explicitly asserts this.
  - `Modes-Tested: light, dark` (with space) must pass test case 9; `Modes-Tested: light` (dark missing) must fail test case 7.
  - Multiple artifacts for the same business in temp dir: test that the most recent `Audit-Date:` is selected (latest wins).
  - `Business:` field missing from artifact → treated as Case A block (no scoped artifact found), same as wrong-business case.
- **What would make this >=95%:**
  - All 9 test cases passing in CI (post-build verification). Remaining 10% reflects pre-build uncertainty about test execution environment (Jest + TSX config in `scripts` package).
- **Rollout / rollback:**
  - Rollout: New test file added to `scripts` package. CI picks it up on next run.
  - Rollback: Delete `s9b-ui-sweep-gate.test.ts`. No impact on gate behavior (gate spec is in `s9b-gates.md`). No module to delete.
- **Documentation impact:**
  - None beyond the test file itself.
- **Notes / references:**
  - Reference test pattern: `scripts/src/startup-loop/__tests__/s6b-gate-simulation.test.ts`
  - Authoritative gate spec: `.claude/skills/startup-loop/modules/cmd-advance/s9b-gates.md`
  - Live artifact field format evidence: `docs/audits/contrast-sweeps/2026-03-01-brik-homepage/contrast-uniformity-report.md` (`Modes-Tested: light, dark`); `docs/audits/contrast-sweeps/2026-03-12-reception-remaining-theming/contrast-uniformity-report.md` (`Modes-Tested: light,dark`)

#### Re-plan Update (2026-03-14)
- Confidence: 85% -> 90% (Evidence: E2 — live artifact field format confirmed; E1 — critical design decision resolved)
- Key change: Dropped `s9b-gates.ts` module entirely. Gate-parsing helpers are now inline in the test file. Eliminates drift risk between TypeScript module and Markdown spec. Addresses the persistent Critical finding from all 3 critique rounds.
- Dependencies: TASK-01, TASK-02 — unchanged
- Validation contract: TC-04 added (grep confirms no separate module imported)
- Notes: `Modes-Tested` field format confirmed from live artifacts — substring check required (both `"light, dark"` and `"light,dark"` appear in repo)

---

## Risks & Mitigations
- **Routes-Tested parse robustness:** Field value in real artifacts is `"0 (auth-blocked — token-level + code-level analysis only)"`. `parseInt()` handles this correctly. TASK-05 test case 6 verifies this explicitly.
- **Legacy artifacts blocking operators:** 19 existing sweep artifacts lack `Business:` field. Block message (Case A) explains exactly what to do. Accepted and intentional per Decision 3 (R1).
- **Auth-blocked products cannot advance S9B:** If a product requires auth on all routes, rendered contrast sweeps are not possible. The gate correctly blocks in this case. This is a structural constraint that must be resolved at the product level (e.g., preview mode), not at the gate level. Documented in block message Case C.
- **spec_version VC-02 alignment drift:** TASK-04 covers all known alignment docs. Any new consumer discovered during build should be updated in the same commit.
- **Gate logic drift between test helpers and s9b-gates.md:** The test file's inline helpers implement the same logic described in `s9b-gates.md`. Risk: if `s9b-gates.md` gate logic is updated without updating the test file, tests may pass against stale behavior. Mitigation: the test file's file-level comment explicitly references `s9b-gates.md` as the authoritative spec, making the coupling visible. This is the minimal-surface-area approach — a single file to update vs. two (module + test) in the original design. Risk level: lower than the `s9b-gates.ts` module approach.
- **Route exhaustiveness: gate is a proxy, not a guarantee:** The gate enforces `Routes-Tested > 0` (some routes rendered) and `Modes-Tested` includes both light and dark, but cannot verify complete route coverage. Operators must ensure the sweep covers all routes as a manual discipline. The gate's purpose is to enforce that a rendered sweep was done at all — preventing the case where no visual check occurs. Complete coverage is an operator responsibility enforced by the sweep skill documentation, not by the gate.

## Observability
- Logging: Gate pass/block surfaced via the advance packet output (structured text displayed to operator).
- Metrics: None — advance is an operator-invoked command, not a background service.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)
- [ ] `s9b-gates.md` contains `GATE-UI-SWEEP-01` with all 6 check conditions (including Modes-Tested), 3 block message cases, pass/block packet shapes, and notes.
- [ ] `tools-ui-contrast-sweep/modules/report-template.md` contains `Business: <BIZ>` in frontmatter.
- [ ] `loop-spec.yaml` spec_version = `3.16.0`; S9B secondary_skills = `[/lp-design-qa, /tools-ui-contrast-sweep]`; GATE-UI-SWEEP-01 comment block present in S9B stage.
- [ ] `startup-loop/SKILL.md` S9B row includes `tools-ui-contrast-sweep`.
- [ ] `cmd-advance.md` references `GATE-UI-SWEEP-01`.
- [ ] `tools-ui-contrast-sweep/SKILL.md` three changes: (1) loop position updated from S9C to S9B secondary, (2) `Business: <BIZ>` requirement documented (manual operator step), (3) all-routes coverage requirement documented for S9B advance context.
- [ ] All 9 unit test cases pass in `s9b-ui-sweep-gate.test.ts` (including Modes-Tested check); no separate `s9b-gates.ts` module created — all helpers inline.
- [ ] `pnpm typecheck` and `pnpm lint` (root-level) pass with no new errors from scripts package.
- [ ] `scripts/check-startup-loop-contracts.sh` passes.

## Decision Log
- 2026-03-14: Analysis settled: Option C (Business: frontmatter field) for scoping, D1 (hard-block Routes-Tested=0) for degraded mode, R1 (immediate hard gate) for rollout. No operator-only forks remain.
- ~~2026-03-14: TASK-05 scope expanded to include `scripts/src/startup-loop/s9b-gates.ts` TypeScript implementation. Required for testability. Same-outcome (tests are in TASK-05 scope per analysis). [Same-outcome: TASK-05]~~ **[Superseded by replan 2026-03-14: `s9b-gates.ts` module dropped entirely — see replan entry below]**
- 2026-03-14: Gate staleness uses `Audit-Date:` frontmatter field, not slug-derived date. This is simpler and more reliable than GATE-LAUNCH-SEC's filename-parse approach. [Same-outcome: TASK-02]
- 2026-03-14: Test case count is 9 — 8 from plan (added "wrong business" case vs analysis's 7) + 1 from critique (added "Modes-Tested missing dark" case). Final canonical count: 9. [Same-outcome: TASK-05]
- 2026-03-14: Gate check 5 added — `Modes-Tested:` must include both "light" and "dark". Critique (Round 1) flagged that gate didn't enforce "both light and dark mode" from the operator outcome statement. TASK-02 updated to 6 conditions (from 5). Block message Case C updated to include mode coverage failure. [Same-outcome: TASK-02]
- 2026-03-14: `pnpm --filter scripts typecheck/lint` corrected to root-level `pnpm typecheck` and `pnpm lint`. `scripts` package has no per-package typecheck/lint scripts. [Same-outcome: TASK-05]
- ~~2026-03-14: `s9b-gates.ts` sync obligation documented. TypeScript module has no runtime consumer (same as `s6b-gates.ts`). File-level comment references `s9b-gates.md` as authoritative spec. [Same-outcome: TASK-05]~~ **[Superseded by replan 2026-03-14: `s9b-gates.ts` module dropped entirely — see replan entry below]**
- 2026-03-14: Route-exhaustiveness limitation acknowledged. Gate enforces `Routes-Tested > 0` and `Modes-Tested` includes light+dark — it cannot verify complete screen coverage. This is a known and accepted proxy; full coverage is operator-responsibility documented in sweep skill instructions. [Round 2 critique]
- 2026-03-14: TASK-05 dependency corrected to `TASK-01, TASK-02` (previously only TASK-01). Gate spec must exist before TypeScript implementation can be written. Parallelism guide Wave 3 already correctly states TASK-02 as prerequisite. [Round 2 critique]
- 2026-03-14 (replan): TASK-05 restructured — `s9b-gates.ts` module dropped entirely. Gate-parsing helpers defined inline within the test file. Resolves persistent Critical finding (all 3 critique rounds) that `s9b-gates.ts` had no runtime consumer and posed a drift risk vs. `s9b-gates.md`. Inline helpers are architecturally correct for a gate whose spec is an AI-readable Markdown file: no separate module = no synchronization obligation between two TypeScript files. `Modes-Tested` field format confirmed from live artifacts (`"light, dark"` and `"light,dark"` both appear). TASK-05 confidence raised from 85% → 90%. [lp-do-replan round 1]

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Add `Business:` field to report template | Yes — file confirmed at `.claude/skills/tools-ui-contrast-sweep/modules/report-template.md`; no dependencies | None | No |
| TASK-02: Implement GATE-UI-SWEEP-01 in s9b-gates.md | Yes — TASK-01 must complete first (field name confirmed); `s9b-gates.md` structure confirmed; `Audit-Date:` frontmatter key confirmed from live artifact | [Minor]: Gate uses `Audit-Date:` from frontmatter (not filename parse) — deliberate. `Modes-Tested` check added (6 conditions). Route-exhaustiveness limitation explicitly acknowledged (gate is a proxy, not a guarantee). | No |
| TASK-03: Bump loop-spec.yaml to v3.16.0 | Yes — TASK-02 must complete (gate ID must be known); `loop-spec.yaml` structure confirmed from fact-find | None | No |
| TASK-04: Update alignment docs | Yes — TASK-03 must complete (spec_version must be known for alignment docs); exact lines confirmed from fact-find | None | No |
| TASK-05: Add unit tests for GATE-UI-SWEEP-01 | Yes — TASK-01 and TASK-02 must complete first (Business field schema + gate spec both needed for fixtures and inline helpers). | None — `s9b-gates.ts` module dropped; inline helpers eliminate drift risk. `Modes-Tested` field format confirmed from live artifacts. | No |

## Overall-confidence Calculation
- TASK-01: S=1, confidence 95% → weighted 95
- TASK-02: M=2, confidence 90% → weighted 180
- TASK-03: S=1, confidence 90% → weighted 90
- TASK-04: S=1, confidence 90% → weighted 90
- TASK-05: M=2, confidence 90% → weighted 180 (raised from 85% after replan: s9b-gates.ts dropped, inline helpers confirmed, Modes-Tested field format confirmed from live artifacts)
- Sum weights: 1+2+1+1+2 = 7
- Overall-confidence = (95+180+90+90+180) / 7 = 635/7 ≈ **90%**
- Reported: **90%**

## Section Omission Rule

None applied. All sections are relevant for this code-track plan.
