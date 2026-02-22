---
Type: Plan
Status: Draft
Domain: Platform
Workstream: Operations
Created: 2026-02-22
Last-reviewed: 2026-02-22
Last-updated: 2026-02-22
Last-reviewed: 2026-02-22
Relates-to charter: none
Feature-Slug: startup-loop-parallel-container-wiring
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 80%
Confidence-Method: min(Implementation,Approach,Impact); weighted by effort S=1,M=2,L=3
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: PLAT
Card-ID: none
---

# Startup Loop Parallel Container Wiring — Plan

## Summary

The startup loop spec v3.9.6 models post-MEASURE containers as a strict sequential chain, which creates confirmed dependency violations: PRODUCTS-02 (Competitor Product Scan) runs before MARKET-01 (Competitor Mapping) and PRODUCTS-04 (Bundle Hypotheses) runs before MARKET-03 (Pricing Benchmarks). The correct model is two parallel workstreams from MEASURE exit — a MARKET intelligence stream and a PRODUCTS+LOGISTICS stream — with explicit cross-stream sync points, converging at MARKET-06 (Offer Design) before the existing fan-out-1. This plan wires that model into `loop-spec.yaml` (ordering constraints), `stage-operator-dictionary.yaml` (operator routing prompts), and `startup-loop-containers-process-map.html` (swim-lane visual layout).

## Active tasks
- [x] TASK-01: Update loop-spec.yaml ordering — Complete (2026-02-22)
- [x] TASK-02: Update stage-operator-dictionary.yaml prompts — Complete (2026-02-22)
- [x] TASK-03: Prototype swim-lane CSS approach (SPIKE) — Complete (2026-02-22)
- [ ] TASK-04: HTML swim-lane redesign

## Goals
- Correct the dependency violations (PRODUCTS-02 before MARKET-01; PRODUCTS-04 before MARKET-03) by introducing parallel streams with cross-stream ordering constraints
- Declare fan-out-2 parallel group at MEASURE exit in loop-spec.yaml
- Update operator routing prompts to reflect parallel stream start from MEASURE
- Redesign HTML process map to show swim-lane parallel layout with cross-stream dependency arrows

## Non-goals
- Changes to ASSESSMENT or MEASURE container internals
- Changes to S4, S5A, S5B, S6, DO, S9B, S10
- Changes to stage skills, prompt templates, or artifact key names
- SELL container restructuring (confirmed: SELL-01 gates all SELL stages)
- New stage IDs

## Constraints & Assumptions
- Constraints:
  - Stage IDs unchanged — stage-addressing and BOS sync unaffected
  - S4 join barrier required inputs unchanged (MARKET-06 offer, S3 forecast, SELL-01 channels)
  - fan-out-1 members (S3, SELL-01, PRODUCT-02) remain triggered by MARKET-06 exit
  - LOGISTICS remains conditional; PRODUCTS-03/05/06 remain conditional (post-launch)
  - spec_version bumped to 3.10.0
  - New parallel group format must match existing fan-out-1 shape
- Assumptions:
  - `ordering.parallel_groups` is declarative documentation; runtime routing is driven by `ordering.sequential` constraints
  - LOGISTICS-01 starts after PRODUCTS-01 (needs product definition); this ordering constraint is preserved
  - Cross-stream arrows in HTML can be achieved with CSS/HTML without SVG (to be confirmed by TASK-03 SPIKE)

## Fact-Find Reference
- Related brief: `docs/plans/startup-loop-parallel-container-wiring/fact-find.md`
- Key findings used:
  - Dependency violations confirmed against `loop-spec.yaml` ordering.sequential
  - `[LOGISTICS, MARKET-01]` and `[PRODUCTS, MARKET-01]` must be deleted (not just supplemented)
  - `[MEASURE-02, MARKET-01]` is the new fan-out-2 trigger constraint
  - MARKET-06 is the synthesis join: needs `[PRODUCTS-07, MARKET-06]` and `[LOGISTICS, MARKET-06]`
  - generate-stage-operator-views.ts is the key YAML consumer to verify post-change

## Proposed Approach
- Chosen approach: Parallel streams with explicit cross-stream ordering constraints in `ordering.sequential`. No new stage IDs. fan-out-2 label added to `ordering.parallel_groups` for human clarity. MARKET-06 becomes an implicit multi-stream join (gated by `[PRODUCTS-07, MARKET-06]` and `[LOGISTICS, MARKET-06]` alongside existing `[MARKET-05, MARKET-06]`). HTML uses CSS flexbox swim lanes.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No (plan-only mode)

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Update loop-spec.yaml ordering | 85% | M | Complete (2026-02-22) | - | TASK-04 |
| TASK-02 | IMPLEMENT | Update stage-operator-dictionary.yaml prompts | 85% | S | Complete (2026-02-22) | - | TASK-04 |
| TASK-03 | SPIKE | Prototype swim-lane CSS + cross-stream arrows | 90% | S | Complete (2026-02-22) | - | TASK-04 |
| TASK-04 | IMPLEMENT | HTML swim-lane redesign | 82% | L | Pending | TASK-01, TASK-02, TASK-03 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03 | - | All independent; run in parallel |
| 2 | TASK-04 | TASK-01, TASK-02, TASK-03 complete | HTML redesign uses confirmed spec + CSS approach |

## Tasks

---

### TASK-01: Update loop-spec.yaml ordering
- **Type:** IMPLEMENT
- **Deliverable:** Updated `docs/business-os/startup-loop/loop-spec.yaml` — spec_version 3.10.0, fan-out-2 parallel group, cross-stream ordering constraints, old sequential chain removed
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `docs/business-os/startup-loop/loop-spec.yaml`
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 85% — know exactly which constraints to add/remove; format confirmed from existing patterns (`[A, B]` array pairs); parallel group format follows fan-out-1 exactly. Gap: spec_version bump impact on run_packet validation is assumed safe but not verified against `check-startup-loop-contracts.sh`.
  - Approach: 85% — adding cross-stream constraints to existing ordering.sequential mechanism is confirmed viable; parallel group is declarative only. Held-back test: no single unknown would push below 80 — the constraint format is verified, deletions are explicit, additions are enumerated.
  - Impact: 90% — resolves the two confirmed dependency violations; does not affect S4 join barrier or stage IDs; generate-stage-operator-views.ts format unchanged.
- **Acceptance:**
  - [ ] `spec_version` is `"3.10.0"`
  - [ ] `[MEASURE-02, MARKET-01]` present in `ordering.sequential`
  - [ ] `[MARKET-01, PRODUCTS-02]` present in `ordering.sequential`
  - [ ] `[MARKET-03, PRODUCTS-04]` present in `ordering.sequential`
  - [ ] `[PRODUCTS-07, MARKET-06]` present in `ordering.sequential`
  - [ ] `[LOGISTICS, MARKET-06]` present in `ordering.sequential`
  - [ ] `[LOGISTICS, MARKET-01]` absent from `ordering.sequential`
  - [ ] `[PRODUCTS, MARKET-01]` absent from `ordering.sequential`
  - [ ] `fan-out-2` entry present in `ordering.parallel_groups` with `members: [MARKET-01, PRODUCT-01]` and `join_at: MARKET-06`
  - [ ] `generate-stage-operator-views.ts` runs without parse errors after change
  - [ ] Manual topological sort of `ordering.sequential` confirms no cycles
- **Validation contract (TC-01..05):**
  - TC-01: `ordering.sequential` contains `[MEASURE-02, MARKET-01]` → MARKET stream can start at MEASURE exit
  - TC-02: `ordering.sequential` does NOT contain `[LOGISTICS, MARKET-01]` OR `[PRODUCTS, MARKET-01]` → MARKET-01 no longer gated on sequential chain completion
  - TC-03: `ordering.sequential` contains `[MARKET-01, PRODUCTS-02]` AND `[MARKET-03, PRODUCTS-04]` → cross-stream sync points enforce correct dependency ordering
  - TC-04: `ordering.sequential` contains `[PRODUCTS-07, MARKET-06]` AND `[LOGISTICS, MARKET-06]` → MARKET-06 synthesis join is correctly wired
  - TC-05: Run `node scripts/src/startup-loop/generate-stage-operator-views.ts` → exits 0, no YAML parse errors
- **Execution plan:** Red → Green → Refactor
  - **Red:** Current ordering.sequential forces `PRODUCTS → LOGISTICS → MARKET-01` sequentially; PRODUCTS-02 runs before MARKET-01, violating the cross-stream dependency.
  - **Green:**
    1. Bump `spec_version: "3.9.6"` → `"3.10.0"` in YAML header; add changelog comment for v3.10.0
    2. In `ordering.sequential`, remove `[LOGISTICS, MARKET-01]` and `[PRODUCTS, MARKET-01]`
    3. Add `[MEASURE-02, MARKET-01]` to `ordering.sequential` (fan-out-2 second branch)
    4. Add cross-stream constraints: `[MARKET-01, PRODUCTS-02]`, `[MARKET-03, PRODUCTS-04]`
    5. Add synthesis join constraints: `[PRODUCTS-07, MARKET-06]`, `[LOGISTICS, MARKET-06]`
    6. Add `fan-out-2` entry to `ordering.parallel_groups`: `members: [MARKET-01, PRODUCT-01]`, `join_at: MARKET-06`, `conditional_members: []`
    7. Run generate-stage-operator-views.ts; confirm exit 0
  - **Refactor:** Scan remaining `ordering.sequential` array for any orphaned references to old sequential model; verify LOGISTICS conditional path still reads correctly with new constraints.
- **Planning validation:**
  - Checks run: Read loop-spec.yaml ordering section lines 1180–1230; confirmed existing constraint format; confirmed `[LOGISTICS, MARKET-01]` and `[PRODUCTS, MARKET-01]` are present and must be deleted; confirmed fan-out-1 shape for fan-out-2 template
  - Validation artifacts: `docs/plans/startup-loop-parallel-container-wiring/fact-find.md` — Data & Contracts section
  - Unexpected findings: None
- **Consumer Tracing:**
  - `ordering.sequential` additions: consumed by `scripts/src/startup-loop/stage-addressing.ts` (routing) and `generate-stage-operator-views.ts` (view generation). Stage-addressing will correctly block PRODUCTS-02 until MARKET-01 completes — intended behavior. View generation reads YAML format which is unchanged.
  - `ordering.parallel_groups` addition: declarative only; no known code consumer reads this programmatically (runtime routing is driven by sequential constraints). Safe addition.
  - `spec_version` bump: consumed by `run_packet.loop_spec_version` field (runtime manifest snapshot). Existing manifests retain 3.9.6 — no retroactive breakage. `check-startup-loop-contracts.sh` may validate — confirm this does not compare spec file version against manifest version at plan time.
  - Consumer `LOGISTICS → MARKET-06` (new): LOGISTICS is conditional. When LOGISTICS is absent, `[LOGISTICS, MARKET-06]` constraint must not block MARKET-06. Existing conditional skip logic handles absent stages — verify this is the case for MARKET-06 specifically.
- **Scouts:** Verify `check-startup-loop-contracts.sh` does not do a live spec_version equality check that would fail on existing test fixtures after bump.
- **Edge Cases & Hardening:**
  - LOGISTICS absent (condition not met): `[LOGISTICS, MARKET-06]` constraint must be skippable. Existing conditional handling should apply — confirm.
  - PRODUCTS-03/05/06 absent (pre-launch): these stages are between PRODUCTS-02 and PRODUCTS-04 in the stream. With `[MARKET-03, PRODUCTS-04]` added, PRODUCTS-04 waits for both PRODUCTS-03 (sequential within stream) and MARKET-03 (cross-stream). When PRODUCTS-03 is skipped (pre-launch), the next eligible stage is PRODUCTS-04 — but PRODUCTS-04 still waits for MARKET-03. This is correct behavior.
- **What would make this >=90%:** Verify `check-startup-loop-contracts.sh` doesn't reject spec_version bump against fixtures; confirm LOGISTICS conditional skip applies to `[LOGISTICS, MARKET-06]` constraint.
- **Rollout / rollback:**
  - Rollout: Edit YAML file; verify via generate-stage-operator-views.ts; commit
  - Rollback: `git revert` — no runtime service impact
- **Documentation impact:** `loop-spec.yaml` changelog comment added for v3.10.0
- **Build completion (2026-02-22):** All 6 edits applied. TC-01..05 passed. `generate-stage-operator-views.ts` exits 0. All new constraints verified present; `[LOGISTICS, MARKET-01]` and `[PRODUCTS, MARKET-01]` confirmed absent. fan-out-2 group with `members: [MARKET-01, PRODUCT-01]`, `join_at: MARKET-06` present. spec_version = "3.10.0". Scout confirmed: `check-startup-loop-contracts.sh` only checks field presence, not value — bump is safe.

---

### TASK-02: Update stage-operator-dictionary.yaml prompts
- **Type:** IMPLEMENT
- **Deliverable:** Updated `docs/business-os/startup-loop/stage-operator-dictionary.yaml` — revised `operator_next_prompt` for MEASURE-02, PRODUCTS-01, and any other affected routing prompts
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/business-os/startup-loop/stage-operator-dictionary.yaml`
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 90% — simple text field updates; know exactly which fields to change; no structural changes required
  - Approach: 85% — human-readable routing prompts follow existing style; no format constraints beyond readability. Held-back test: no unknown would drop below 80 — this is a text edit with clear target content.
  - Impact: 85% — operators will receive correct parallel stream routing instructions; incorrect prompts are the primary usability risk of the wiring change
- **Acceptance:**
  - [ ] MEASURE-02 `operator_next_prompt` instructs operator that two parallel streams start from MEASURE exit: PRODUCT-01 (products stream) and MARKET-01 (market intelligence stream)
  - [ ] PRODUCTS-01 `operator_next_prompt` notes that PRODUCTS-02 requires MARKET-01 to complete before it can run
  - [ ] Any other affected routing prompts (PRODUCTS-03/05/06 conditional skips, LOGISTICS conditional skip path to MARKET-06) are consistent with the new wiring
- **Validation contract (TC-01..02):**
  - TC-01: Read MEASURE-02 `operator_next_prompt` → contains instruction to start both PRODUCT-01 and MARKET-01 in parallel
  - TC-02: Read PRODUCTS-01 `operator_next_prompt` → contains note that PRODUCTS-02 waits for MARKET-01 completion
- **Execution plan:** Red → Green → Refactor
  - **Red:** MEASURE-02 prompt tells operator "proceed to PRODUCT-01" — single sequential exit; no mention of parallel market stream start.
  - **Green:**
    1. Update MEASURE-02 `operator_next_prompt`: "Two parallel streams now start from MEASURE exit: (1) PRODUCT-01 — Products stream starts now. (2) MARKET-01 — Market intelligence stream also starts now, in parallel. Both streams converge at MARKET-06. Run PRODUCT-01 and MARKET-01 concurrently."
    2. Update PRODUCTS-01 `operator_next_prompt`: add note that PRODUCTS-02 cannot start until MARKET-01 is complete (cross-stream sync point).
    3. Audit PRODUCTS-02 `operator_next_prompt` — add note that this stage requires MARKET-01 completion.
    4. Audit LOGISTICS container prompts — confirm exit prompt routes to MARKET-06 (not MARKET-01) as synthesis join target.
  - **Refactor:** Read all affected prompts together; verify consistent language across the parallel model description.
- **Planning validation:**
  - Checks run: Read stage-operator-dictionary.yaml MEASURE-02 and PRODUCTS-01 entries; confirmed current prompts route sequentially
  - Validation artifacts: fact-find.md Data & Contracts section
  - Unexpected findings: None
- **Consumer Tracing:** `operator_next_prompt` fields are human-facing only — consumed by operators reading the dictionary; no code consumer. Safe text-only change.
- **Scouts:** None: text-only change with no code consumers.
- **Edge Cases & Hardening:** None: no conditional logic in prompt text; worst case is unclear wording, correctable by re-edit.
- **What would make this >=90%:** None beyond completing the task — confidence gap is minor style uncertainty.
- **Rollout / rollback:**
  - Rollout: Edit YAML file; commit
  - Rollback: `git revert`
- **Documentation impact:** None beyond the dictionary file itself.
- **Build completion (2026-02-22):** 9 prompts updated (6 in original scope + 3 controlled scope expansion). Scope expansion: PRODUCT container prompt, PRODUCT-01 prompt, and PRODUCTS-03 exit prompt were stale (incorrectly routed to MARKET-01 or missing MARKET-03 sync note). Fixed inline as same task objective. TC-01..02 passed. `generate-stage-operator-views.ts` exits 0 after all edits confirming YAML is parse-clean.

---

### TASK-03: Prototype swim-lane CSS + cross-stream arrows (SPIKE)
- **Type:** SPIKE
- **Deliverable:** Written note in `docs/plans/startup-loop-parallel-container-wiring/task-03-swimlane-spike.md` documenting chosen CSS approach for swim lanes and cross-stream arrows, with prototype confirmation
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `[readonly] docs/business-os/startup-loop-containers-process-map.html`
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 90%
  - Implementation: 90% — prototyping CSS is low-risk; current HTML structure is well-understood from active editing this session
  - Approach: 90% — CSS flexbox columns for swim lanes is a standard pattern; cross-stream arrows have several known approaches (CSS borders, SVG overlay, or positioned `::before`/`::after` elements)
  - Impact: 90% — SPIKE output unblocks TASK-04 with confirmed approach; prevents redesign rework
- **Questions to answer:**
  - Can swim lanes be achieved with CSS flexbox columns within the existing HTML structure?
  - How should cross-stream dependency arrows be rendered? Options: (a) CSS-only border/arrow with absolute positioning, (b) SVG `<line>` elements overlaid on lanes, (c) CSS `::after` pseudo-elements on source stage cards
  - Does the chosen arrow approach work with the existing `.sfrom` annotation pattern already in the HTML?
- **Acceptance:**
  - [ ] A working prototype (even in a scratch `<div>` in the HTML) shows three swim-lane columns rendering correctly
  - [ ] At least one cross-stream arrow is visually confirmed working
  - [ ] Chosen approach documented in `task-03-swimlane-spike.md` with: approach name, CSS/HTML snippet, known limitations
- **Validation contract:** Spike output document exists with confirmed approach and prototype evidence; TASK-04 can proceed without CSS uncertainty.
- **Planning validation:** None: spike validates the approach itself.
- **Rollout / rollback:** None: non-implementation task; prototype is discarded or used directly in TASK-04.
- **Documentation impact:** `task-03-swimlane-spike.md` created as input to TASK-04.
- **Notes:** If CSS-only arrows are not viable across lane boundaries, use positioned SVG lines. The `.sfrom` annotation pattern already in the HTML provides a precedent for custom visual indicators on stage cards.
- **Build completion (2026-02-22):** Spike document written to `docs/plans/startup-loop-parallel-container-wiring/task-03-swimlane-spike.md`. All three spike questions answered. Chosen approach: CSS flexbox swim lanes + SVG overlay for cross-stream arrows (CSS-only rejected: cannot handle variable vertical offsets; connector-div rejected: same reason). Full CSS snippet, SVG HTML snippet, and JS `getBoundingClientRect()` snippet provided. 13-step TASK-04 implementation checklist included. `.sfrom` compatibility confirmed. TASK-04 confidence raised from 75% to 82% (post-SPIKE; all approach uncertainty resolved).

---

### TASK-04: HTML swim-lane redesign
- **Type:** IMPLEMENT
- **Deliverable:** Updated `docs/business-os/startup-loop-containers-process-map.html` — swim-lane layout with MARKET stream, PRODUCTS+LOGISTICS stream, cross-stream dependency arrows at sync points, MARKET-06 shown as synthesis join
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Pending
- **Affects:** `docs/business-os/startup-loop-containers-process-map.html`
- **Depends on:** TASK-01, TASK-02, TASK-03
- **Blocks:** -
- **Confidence:** 82% (updated post-TASK-03 SPIKE — was 75%)
  - Implementation: 82% — TASK-03 SPIKE confirmed CSS flexbox lanes viable. SVG overlay for arrows confirmed with full code snippets. 13-step implementation checklist provided. Remaining uncertainty is execution of large HTML edit; approach is fully resolved. Threshold: ≥80 for IMPLEMENT.
  - Approach: 85% — SVG overlay fully validated by SPIKE with getBoundingClientRect() handling variable vertical offsets. Dark amber dashed style confirmed matches existing document palette.
  - Impact: 90% — replaces the misleading sequential stack with an accurate parallel model; makes the workflow comprehensible to readers
- **Acceptance:**
  - [ ] MEASURE container spans full width above the swim-lane split
  - [ ] Three visible swim-lane columns: MARKET stream (MARKET-01..05), PRODUCTS+LOGISTICS stream (PRODUCT-01, PRODUCTS-01..07, LOGISTICS conditional), SELL column (placeholder or "starts after MARKET-06")
  - [ ] Cross-stream dependency arrows visually connect MARKET-01 → PRODUCTS-02 and MARKET-03 → PRODUCTS-04
  - [ ] MARKET-06 spans full width below the swim lanes, labeled as synthesis join
  - [ ] fan-out-1 (S3, SELL-01, PRODUCT-02) and S4 remain below MARKET-06 unchanged
  - [ ] Conditional stages (PRODUCTS-03/05/06, LOGISTICS) retain `.conditional` styling
  - [ ] `.sfrom` annotations retained on stages that have them
  - [ ] Document renders correctly in browser without layout overflow or broken arrows
  - [ ] Open in browser to visually confirm after completion
- **Validation contract (TC-01..03):**
  - TC-01: Open HTML in browser → three swim-lane columns visible between MEASURE and MARKET-06 blocks
  - TC-02: Two cross-stream dependency arrows visible → MARKET-01→PRODUCTS-02 and MARKET-03→PRODUCTS-04
  - TC-03: MARKET-06 block clearly identified as synthesis join spanning full width; conditional stages styled correctly
- **Execution plan:** Red → Green → Refactor
  - **Red:** Current HTML shows linear vertical stack (MEASURE → PRODUCT → PRODUCTS → LOGISTICS → MARKET → SELL → S4) — misleading sequential model.
  - **Green:**
    1. Add swim-lane CSS to `<style>` block: `.lane-container` (flexbox row wrapper), `.lane` (flex column for each stream), `.lane-header` (stream label)
    2. Restructure HTML: MEASURE block full-width → `.lane-container` div containing three `.lane` columns → MARKET-06 block full-width
    3. MARKET lane: MARKET-01 through MARKET-05 stage cards in sequence
    4. PRODUCTS+LOGISTICS lane: PRODUCT-01, PRODUCTS-01 through PRODUCTS-07, LOGISTICS conditional block
    5. SELL lane: placeholder card "Starts after MARKET-06 (fan-out-1)" — SELL stages remain below
    6. Add cross-stream arrows: apply TASK-03 SPIKE's chosen approach for MARKET-01→PRODUCTS-02 and MARKET-03→PRODUCTS-04
    7. Label MARKET-06 as synthesis join with visual indicator
    8. Open in browser; verify layout
  - **Refactor:** Adjust CSS sizing, spacing, and arrow positioning for readability; ensure conditional stage colors are visible in lane context; check `.sfrom` annotations still readable.
- **Planning validation:**
  - Checks run: Read current HTML structure (CSS at lines 155–165, container block pattern); confirmed swim-lane is additive layout change; `.sfrom` and `.conditional` CSS classes are preserved
  - Validation artifacts: TASK-03 SPIKE output document
  - Unexpected findings: None (TASK-03 SPIKE surfaces any surprises before this task runs)
- **Consumer Tracing:** HTML is standalone; no code consumers. Browser rendering only. Safe.
- **Scouts:** If TASK-03 SPIKE reveals that cross-stream arrows require SVG, update the Green step to use SVG `<line>` elements with absolute positioning instead of CSS.
- **Edge Cases & Hardening:**
  - LOGISTICS conditional: LOGISTICS lane content should include conditional styling wrapper so it is visually distinct (already handled by `.conditional` CSS class)
  - Narrow viewport: swim-lane columns may need min-width or horizontal scroll to remain readable — add `overflow-x: auto` to `.lane-container`
  - SELL column: SELL stages (SELL-01..07) currently render after fan-out-1. In the new layout, the SELL column in the parallel section is a placeholder — the actual SELL stages remain in their current position below MARKET-06. The column header makes this clear.
- **What would make this >=90%:** Complete TASK-03 SPIKE and confirm cross-stream arrow approach works at scale across multiple sync points.
- **Rollout / rollback:**
  - Rollout: Edit HTML file; open in browser to verify; commit
  - Rollback: `git revert` — standalone file, no build pipeline
- **Documentation impact:** None beyond the HTML file itself.

---

## Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `[LOGISTICS, MARKET-06]` constraint blocks MARKET-06 when LOGISTICS absent | Low | High | Existing conditional skip logic handles absent stages; verify during TASK-01 Green step that LOGISTICS absence is handled gracefully for MARKET-06 gating |
| `check-startup-loop-contracts.sh` rejects spec_version 3.10.0 against test fixtures | Low | Medium | Scout in TASK-01: read the script before editing; if it does a live version comparison, update fixtures accordingly |
| Cross-stream arrows not viable with CSS alone at scale | Low | Medium | TASK-03 SPIKE validates before TASK-04 commits to full implementation; fallback is SVG lines |
| Topological sort cycle introduced by new constraints | Low | High | TC-05 in TASK-01: manual topological sort verification after all constraint changes |
| operator_next_prompt wording creates operator confusion | Low | Low | TASK-02 refactor step audits all affected prompts for consistency |

## Observability
- None: spec/doc changes only; no runtime services affected.

## Acceptance Criteria (overall)
- [ ] loop-spec.yaml spec_version = 3.10.0 with fan-out-2 parallel group and all cross-stream constraints present
- [ ] `[LOGISTICS, MARKET-01]` and `[PRODUCTS, MARKET-01]` absent from loop-spec.yaml
- [ ] generate-stage-operator-views.ts runs without errors after TASK-01
- [ ] stage-operator-dictionary.yaml MEASURE-02 prompt instructs parallel stream start
- [ ] HTML renders swim-lane layout with cross-stream arrows in browser
- [ ] No ordering cycles (topological sort clean)

## Decision Log
- 2026-02-22: SELL stream decoupling — confirmed NO (user). SELL-01 gates all SELL stages; fan-out-1 unchanged. TASK-01 INVESTIGATE (from fact-find task seeds) removed as moot.
- 2026-02-22: LOGISTICS fits as sub-stream of PRODUCTS (starts after PRODUCTS-01, feeds MARKET-06) — resolved in fact-find.
- 2026-02-22: MARKET-06 confirmed as synthesis join point — all streams converge before fan-out-1.

## Overall-confidence Calculation
- TASK-01: 85% × 2 (M) = 170
- TASK-02: 85% × 1 (S) = 85
- TASK-03: 90% × 1 (S) = 90
- TASK-04: 75% × 3 (L) = 225
- Sum weights: 7
- Overall = (170 + 85 + 90 + 225) / 7 = 570 / 7 = **81.4% → 80%** (rounded to multiple of 5)
