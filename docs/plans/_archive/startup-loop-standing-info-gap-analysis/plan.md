---
Type: Plan
Status: Archived
Domain: Business-OS
Workstream: Mixed
Created: 2026-02-22
Last-reviewed: 2026-02-22
Last-updated: 2026-02-22
Archived: 2026-02-22
Relates-to charter: none
Feature-Slug: startup-loop-standing-info-gap-analysis
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-sequence, lp-do-replan
Overall-confidence: 82%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: none
Card-ID: none
---

# Startup Loop Standing Information Model Gap Analysis — Plan

## Summary

Implements the two-layer operating model redesign identified in the fact-find: splitting the startup loop from a single directed stage graph into an explicit Layer A (standing intelligence: MARKET, SELL, PRODUCTS, LOGISTICS, IDEAS) and Layer B (implementation loop: fact-find → plan → build). Adds eight structurally absent domains (PRODUCTS, LOGISTICS, IDEAS, MARKET expansion, SELL expansion, aggregate packs, loop output contracts, closed-loop enforcement). Migration uses additive stage additions where possible (MARKET-01..06 preserved; MARKET-07..11 appended); SELL-02 is renamed to SELL-08 with new SELL-02..07 inserted for logical ordering; IDEAS-01..03 are added as formal stage-gated loop stages for long-term enforcement discipline. All three open architecture decisions are resolved in TASK-00 before any implementation begins.

## Active tasks
- [x] TASK-00: Lock architecture decisions + proposed target model doc — Complete (2026-02-22)
- [x] TASK-01: Two-layer architecture contract doc — Complete (2026-02-22)
- [x] TASK-S02: Spike — loop-spec mutation approach validation — Complete (2026-02-22)
- [x] TASK-02: Add PRODUCTS and LOGISTICS to loop-spec + stage dictionary — Complete (2026-02-22)
- [x] TASK-03: Expand MARKET to 01..11 and SELL to 01..08 in loop-spec — Complete (2026-02-22)
- [x] TASK-04: IDEAS interface artifact schemas + handoff contract — Complete (2026-02-22)
- [x] TASK-05: Carry-mode schema for standing fields — Complete (2026-02-22)
- [x] TASK-06: Standing doc hygiene schema + lint check — Complete (2026-02-22)
- [x] TASK-08: Loop output artifact contracts — Complete (2026-02-22) (fact-find-brief, build-record, results-review)
- [x] CHECKPOINT-A: Horizon checkpoint — reassess wave 3/4 tasks — Complete (2026-02-22)
- [x] TASK-S07: Spike — S4 aggregate pack integration validation — Complete (2026-02-22)
- [x] TASK-S10: Spike — pre-sweep consistency scan — Complete (2026-02-22)
- [x] TASK-07: Aggregate pack contracts + artifact-registry update — Complete (2026-02-22)
- [x] TASK-09: Closed-loop enforcement gate — Complete (2026-02-22) in DO/build contract
- [x] TASK-10: Full consistency sweep (legacy naming + stale references) — Complete (2026-02-22)

## Goals
- Produce an explicit two-layer model contract as the canonical architectural reference.
- Add PRODUCTS, LOGISTICS standing domains to loop-spec.yaml with correct conditional gating.
- Expand MARKET (01..11) additively (MARKET-01..06 preserved; MARKET-07..11 appended).
- Expand SELL (01..08): rename SELL-02 → SELL-08; insert new SELL-02..07 for logical ordering.
- Introduce IDEAS-01..03 as formal loop stages (stage-gated) plus interface schemas and fact-find handoff contract.
- Define carry-mode schema (link vs. revision) for standing-field inheritance.
- Add hygiene schema enforcement for standing `.user.md` docs with lint check.
- Add aggregate pack contracts (market-pack, sell-pack, product-pack, logistics-pack).
- Formalize loop output artifact contracts (fact-find-brief, build-record, results-review).
- Add closed-loop enforcement: completed loop cycles must update standing assumptions.

## Non-goals
- Implementing kanban/BOS lane interface changes (de-scoped per user instruction).
- Writing content for any specific business's standing intelligence documents.
- Migrating existing business run artifacts to new stage IDs.
- Building UI for the two-layer model.

## Constraints & Assumptions
- Constraints:
  - `loop-spec.yaml` remains the canonical stage topology source of truth.
  - Stage-operator dictionary list order must match `loop-spec.yaml` stages order exactly (VC-03 invariant).
  - Regenerate stage-operator-map.json and stage-operator-table.md after every dictionary change.
  - Validate with startup-loop contract lint + targeted startup-loop test suites after each wave.
  - No ID renumbering of existing MARKET-01..06 (additive only). SELL-02 renamed to SELL-08; new SELL-02..07 inserted in sequence (resequence only where logical ordering requires it).
  - TASK-00 must be complete before any IMPLEMENT task begins.
- Assumptions:
  - Proposed target model semantics to be locked in `proposed-target-model.md` by TASK-00.
  - Phased migration (domain-by-domain) with compatibility aliases where needed.
  - Existing startup-loop test suites provide adequate coverage scaffolding for contract validation.

## Fact-Find Reference
- Related brief: `docs/plans/startup-loop-standing-info-gap-analysis/fact-find.md`
- Key findings used:
  - 9 High-severity gaps across layer model, PRODUCTS/LOGISTICS absence, IDEAS absence, MARKET/SELL expansion, aggregate packs, loop output contracts, feedback loop enforcement, document hygiene.
  - S4 join barrier: 3 required inputs + 3 optional inputs (`loop-spec.yaml:452–470`).
  - MARKET containers: ASSESSMENT (224), PRODUCT (280), MARKET (303), SELL (404) — MEASURE is stage_group not container.
  - Three open design decisions resolved by TASK-00.
  - Stage-operator-dictionary invariant: list order must match loop-spec.yaml stages order.

## Proposed Approach
- Option A: Big-bang migration — rename/renumber all stage IDs in one change.
- Option B: Phased migration — additive where logical order is not disrupted; targeted renaming where needed.
- Chosen approach: **Option B** — phased migration with targeted renaming. MARKET-01..06 preserved; MARKET-07..11 appended additively. SELL-02 renamed to SELL-08; new SELL-02..07 inserted (logical ordering requires resequencing). PRODUCTS and LOGISTICS are new containers with no renaming risk. IDEAS-01..03 added as formal loop stages (stage-gated for long-term enforcement discipline).

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No (TASK-00 is a blocking DECISION; Delivery-Readiness 79% at brief; plan-only mode)

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-00 | DECISION | Lock arch decisions + proposed-target-model.md | 92% | S | Complete (2026-02-22) | - | TASK-01, TASK-S02, TASK-04 |
| TASK-01 | IMPLEMENT | Two-layer architecture contract doc | 80% | S | Complete (2026-02-22) | TASK-00 | TASK-02, TASK-03, TASK-05, TASK-06, TASK-08 |
| TASK-S02 | SPIKE | Loop-spec mutation approach validation | 90% | S | Complete (2026-02-22) | TASK-00 | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | PRODUCTS + LOGISTICS in loop-spec + dictionary | 80% | L | Complete (2026-02-22) | TASK-00, TASK-01, TASK-S02 | TASK-03, CHECKPOINT-A |
| TASK-03 | IMPLEMENT | Expand MARKET 01..11 + SELL 01..08 in loop-spec (SELL-02→SELL-08 rename) | 80% | L | Complete (2026-02-22) | TASK-00, TASK-01, TASK-S02, TASK-02 | CHECKPOINT-A, TASK-04 |
| TASK-04 | IMPLEMENT | IDEAS stage-gated (IDEAS-01..03 in loop-spec) + schemas + handoff contract | 80% | L | Complete (2026-02-22) | TASK-00, TASK-01, TASK-S02, TASK-03 | CHECKPOINT-A |
| TASK-05 | IMPLEMENT | Carry-mode schema for standing fields | 82% | S | Complete (2026-02-22) | TASK-01 | CHECKPOINT-A |
| TASK-06 | IMPLEMENT | Hygiene schema + lint check | 80% | M | Complete (2026-02-22) | TASK-01 | CHECKPOINT-A |
| TASK-08 | IMPLEMENT | Loop output artifact contracts | 82% | M | Complete (2026-02-22) | TASK-01 | CHECKPOINT-A |
| CHECKPOINT-A | CHECKPOINT | Horizon reassessment — wave 3/4 tasks | 95% | S | Complete (2026-02-22) | TASK-02..08 | TASK-S07, TASK-S10, TASK-09 |
| TASK-S07 | SPIKE | S4 aggregate pack integration validation | 90% | S | Complete (2026-02-22) | CHECKPOINT-A | TASK-07 |
| TASK-S10 | SPIKE | Pre-sweep consistency scan | 90% | S | Complete (2026-02-22) | CHECKPOINT-A | TASK-10 |
| TASK-07 | IMPLEMENT | Aggregate pack contracts + artifact-registry | 82% | M | Complete (2026-02-22) | TASK-S07, TASK-02, TASK-03 | TASK-10 |
| TASK-09 | IMPLEMENT | Closed-loop enforcement gate (scope narrowed: TASK-08 added results-review gate; remaining: standing-pack update requirement + DO comment) | 82% | S | Complete (2026-02-22) | CHECKPOINT-A, TASK-08 | TASK-10 |
| TASK-10 | IMPLEMENT | Full consistency sweep | 85% | M | Complete (2026-02-22) | TASK-S10, TASK-07, TASK-09 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-00 | — | Blocking DECISION; all others wait |
| 2 | TASK-01, TASK-S02 | TASK-00 | Fully parallel |
| 3a | TASK-05, TASK-06, TASK-08 | TASK-01 | Fully parallel |
| 3b | TASK-02 | TASK-01, TASK-S02 | Sequential before TASK-03; same loop-spec.yaml file |
| 3c | TASK-03 | TASK-02 | After TASK-02 to avoid loop-spec conflicts |
| 3d | TASK-04 | TASK-01, TASK-S02, TASK-03 | After TASK-03 — IDEAS-01..03 loop-spec additions must follow SELL/MARKET expansion |
| CHKPT | CHECKPOINT-A | All wave 3 tasks | Gate; runs /lp-do-replan on wave 4/5 |
| 4 | TASK-S07, TASK-S10, TASK-09 | CHECKPOINT-A (TASK-09 also needs TASK-08) | Parallel; TASK-09 ready once TASK-08 done |
| 5 | TASK-07 | TASK-S07, TASK-02, TASK-03 | After spike validates S4 integration |
| 6 | TASK-10 | TASK-S10, TASK-07, TASK-09 | Final sweep after all implementation |

## Tasks

---

### TASK-00: Lock architecture decisions + proposed target model doc
- **Type:** DECISION
- **Deliverable:** `docs/plans/startup-loop-standing-info-gap-analysis/proposed-target-model.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/startup-loop-standing-info-gap-analysis/proposed-target-model.md`, `[readonly] docs/plans/startup-loop-standing-info-gap-analysis/fact-find.md`
- **Depends on:** -
- **Blocks:** TASK-01, TASK-S02, TASK-04
- **Confidence:** 92%
  - Implementation: 95% — writing a decision record doc is low-risk
  - Approach: 92% — three concrete questions with clear option space
  - Impact: 92% — this is the key gate; downstream tasks cannot be sized without it
- **Options:**
  - **Decision 1 — LOGISTICS gating:**
    - Option A: Required for all businesses regardless of profile (simpler gate logic; may block digital-only businesses at SELL gate)
    - Option B: Conditional by business profile — `physical-product` or `logistics-heavy` profiles only (default recommended; see fact-find risk: "LOGISTICS required too early blocks digital-only businesses")
    - Recommendation: **Option B** — conditional. Set `condition: "business_profile includes logistics-heavy OR physical-product"` in loop-spec.yaml.
  - **Decision 2 — IDEAS embedding:**
    - Option A: Stage-gated inside startup-loop (IDEAS-01..03 become formal loop stages between ASSESSMENT and MEASURE) — tighter enforcement, adds loop complexity
    - Option B: External pre-loop interface contract only — IDEAS artifacts live as standalone templates; idea-card handoff to fact-find is a naming/schema convention, not a loop gate
    - **Confirmed: Option A** — stage-gated. Long-term enforcement discipline favours formal loop stages over advisory schemas. IDEAS-01..03 added to loop-spec.yaml between ASSESSMENT and MEASURE.
  - **Decision 3 — MARKET/SELL numbering policy:**
    - MARKET Option A: Insertive — insert new stages before MARKET-06 → breaking change
    - MARKET Option B: Additive — append MARKET-07..11 after MARKET-06; no renumbering
    - SELL Option: Rename SELL-02 (activation gate) to SELL-08 and insert new SELL-02..07 (needed for logical ordering of substantive stages before gate)
    - **Confirmed:** MARKET additive (Option B). SELL resequenced — SELL-02 → SELL-08; new SELL-02..07 inserted. Resequence only when needed for logical ordering.
- **Decision input needed:**
  - None: all three decisions confirmed by operator 2026-02-22.
- **Acceptance:**
  - `proposed-target-model.md` exists with all three decisions recorded.
  - MARKET numbering policy confirmed as additive or overridden with explicit rationale.
  - LOGISTICS condition expression defined.
  - IDEAS embedding approach confirmed.
  - fact-find.md Planning Readiness blocking items resolved (confirmed by operator).
- **Validation contract:** `proposed-target-model.md` present and contains all three decision records with chosen option + rationale.
- **Planning validation:** None: DECISION task; all prerequisite repo checks done in fact-find.
- **Rollout / rollback:** None: non-implementation task.
- **Documentation impact:** `proposed-target-model.md` created; fact-find.md Planning Readiness note referencing this doc is already in place.
- **Build completion evidence (2026-02-22):**
  - `proposed-target-model.md` created at `docs/plans/startup-loop-standing-info-gap-analysis/proposed-target-model.md` with all three decisions locked and domain specifications defined.
  - Decision 1 (LOGISTICS): conditional gating confirmed; condition expression `"business_profile includes logistics-heavy OR physical-product"` specified.
  - Decision 2 (IDEAS): stage-gated confirmed; IDEAS-01..03 stage definitions with names and purposes provided.
  - Decision 3 (MARKET/SELL): MARKET additive confirmed; SELL-02→SELL-08 resequencing with SELL-02..07 insertion specified; SELL-08 assignment preservation noted.
  - Stage family proposals for PRODUCTS-01..07, LOGISTICS-01..07, MARKET-07..11, SELL-02..07 included; all marked as proposals, executor may refine.
  - Open items section flags unresolved style decisions (skill assignments for new stages, IDEAS optional flag).
- **Status:** Complete (2026-02-22)

---

### TASK-01: Two-layer architecture contract doc
- **Type:** IMPLEMENT
- **Deliverable:** `docs/business-os/startup-loop/two-layer-model.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Artifact-Destination:** `docs/business-os/startup-loop/` — canonical startup-loop docs
- **Reviewer:** startup-loop maintainers
- **Approval-Evidence:** committed to repo
- **Measurement-Readiness:** None: architecture contract; measured by downstream task adoption
- **Affects:** `docs/business-os/startup-loop/two-layer-model.md` (new), `[readonly] docs/business-os/startup-loop/loop-spec.yaml`
- **Depends on:** TASK-00
- **Blocks:** TASK-02, TASK-03, TASK-05, TASK-06, TASK-08
- **Confidence:** 80%
  - Implementation: 82% — writing a new markdown contract is well-understood; structure is defined
  - Approach: 80% — TASK-00 resolves the scope; remaining uncertainty is on exact lifecycle semantics for Layer A update triggers
  - Impact: 82% — foundational reference for all downstream implementation tasks
- **Acceptance:**
  - `two-layer-model.md` exists with the following sections: Layer A definition (domains, lifecycle, update triggers), Layer B definition (fact-find→plan→build relationship to Layer A), inter-layer contract (how Layer B reads from and writes back to Layer A), deprecation note on kanban interface removal from model semantics.
  - Document is Status: Active.
  - No contradictions with `loop-spec.yaml` stage topology.
- **Validation contract (VC-01):**
  - VC-01: Two-layer-model.md sections present (Layer A, Layer B, inter-layer contract) → All sections present with ≥2 concrete sentences each; confirmed by read at task completion.
  - VC-02: No contradiction with loop-spec.yaml — Layer A domains match containers defined in loop-spec; Layer B process matches DO stage definition → Confirmed by cross-reference check.
- **Execution plan:** Red → Green → Refactor (VC-first)
  - Red evidence plan: `two-layer-model.md` does not exist.
  - Green evidence plan: Write document with Layer A/B sections + inter-layer contract. Use `proposed-target-model.md` from TASK-00 as the definitive domain list and lifecycle semantics.
  - Refactor evidence plan: Cross-reference against `loop-spec.yaml:498` (DO stage) and `loop-spec.yaml:111` (stages section) for accuracy. Add reference link in `loop-spec.yaml` preamble.
- **Scouts:** Check if any existing doc (`docs/business-os/startup-loop/loop-spec.yaml` preamble or README) partially defines the two-layer model and must be updated or superseded.
- **Edge Cases & Hardening:** If proposed-target-model.md differs from current loop-spec topology in any way, record explicit reconciliation notes in two-layer-model.md rather than silently assuming consistency.
- **What would make this >=90%:** Concrete update-trigger rules for Layer A (e.g., "PRODUCTS-pack refreshed after every completed build cycle touching product decisions") defined with testable conditions.
- **Rollout / rollback:**
  - Rollout: Write new file; add preamble reference in loop-spec.yaml.
  - Rollback: Delete two-layer-model.md; remove loop-spec preamble reference.
- **Documentation impact:** Adds new canonical architecture reference. Add `See also: two-layer-model.md` note in `loop-spec.yaml` preamble (non-breaking comment).
- **Build completion evidence (2026-02-22):**
  - `docs/business-os/startup-loop/two-layer-model.md` created (18.8KB).
  - Sections confirmed: Layer A — Standing Intelligence, Layer B — Implementation Loop, Inter-Layer Contract, Deprecation Note — Kanban/BOS Lane Interface, Consistency Notes.
  - VC-01: All required sections present with ≥2 concrete sentences each ✓
  - VC-02: No contradiction with loop-spec.yaml — Layer A domains match containers; Layer B maps to DO stage at line 498; PRODUCT vs PRODUCTS disambiguation explicit ✓
  - `See also:` reference added to `loop-spec.yaml` line 5 (preamble, non-breaking comment) ✓
  - Reconciliation note: IDEAS-01..03 position documented as proposed additions (TASK-04 will fill the gap); no conflict with existing loop-spec ordering.
- **Status:** Complete (2026-02-22)

---

### TASK-S02: Spike — loop-spec mutation approach validation
- **Type:** SPIKE
- **Deliverable:** Investigation notes appended to this plan (TASK-S02 findings block)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `[readonly] docs/business-os/startup-loop/loop-spec.yaml`, `[readonly] docs/business-os/startup-loop/stage-operator-dictionary.yaml`, `[readonly] scripts/src/startup-loop/__tests__/stage-addressing.test.ts`
- **Depends on:** TASK-00
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 90%
  - Implementation: 90% — inspection task; no file mutations
  - Approach: 92% — clear questions; existing test suite is inspectable
  - Impact: 90% — resolves the single biggest implementation risk for TASK-02/03
- **Questions to answer:**
  1. Does loop-spec.yaml support adding new containers (PRODUCTS, LOGISTICS) without schema validation failures? What schema version bump is needed?
  2. Does the stage-operator-dictionary list-order invariant require the new stages to be inserted at specific positions, or can they be appended at the end of the stages list?
  3. Which tests in `scripts/src/startup-loop/__tests__/` would fail when new stage IDs appear (hardcoded stage arrays, count assertions, etc.)? Can failing tests be isolated to new-ID-specific slices?
  4. Do any startup-loop scripts or MCP tools enumerate `MARKET-*` or `SELL-*` with hard-coded upper bounds that would need updating?
- **Acceptance:**
  - Each of the 4 questions answered with evidence (file + line reference).
  - Compatibility alias strategy for any test that fails on unknown-ID confirmed.
  - TASK-02 and TASK-03 execution plans updated based on findings.
- **Validation contract:** Findings block added to plan under TASK-S02 before TASK-02 begins; at least one file/line reference per question.
- **Planning validation:** None: investigation task.
- **Rollout / rollback:** None: investigation task.
- **Documentation impact:** Findings block added to this plan; TASK-02/03 execution plans updated in-place.
- **TASK-S02 Findings block (2026-02-22):**
  - **Q1 — Schema validation:** No JSON/YAML schema file exists for loop-spec.yaml. The only automated check is `spec_version:` field presence (`check-startup-loop-contracts.sh` line 512). No structural shape validation. Adding new containers will not trigger an automated schema failure. **Required: bump `spec_version` from `"3.8.0"` to `"3.9.0"` and add changelog comment.** SQ-01 will fail until new stage IDs reflected in wrapper skill + workflow guide.
  - **Q2 — Dictionary list-order:** VC-03 invariant requires dictionary list order to match loop-spec.yaml stages array order exactly (dictionary.yaml line 6). New stages must be inserted at the mirrored position — not appended. `display_order` integers must be renumbered from the insertion point. Re-run `generate-stage-operator-views.ts` after each insertion to regenerate map.json (drift-check mode will catch mismatches).
  - **Q3 — Test breakage (2 tests will fail):**
    - `scripts/src/startup-loop/__tests__/generate-stage-operator-views.test.ts:229` — `expect(map.stages.length).toBe(35)` — hardcoded count, will fail when stages are added. Must update to new count.
    - `scripts/src/startup-loop/__tests__/s10-weekly-routing.test.ts:59` — `expect(idMatches!.length).toBe(35)` — reads loop-spec.yaml directly, same issue.
    - `stage-addressing.test.ts`: self-healing, will not break.
    - `stage-label-rename.test.ts`: self-healing (drives from generated map), will not break.
  - **Q4 — Hardcoded upper bounds (4 locations):**
    - `packages/mcp-server/src/tools/loop.ts:36–72` — `STARTUP_LOOP_STAGES` constant (comment at line 35: "Re-sync when stages change and bump loop-spec spec_version"). New stage IDs must be appended or tools will reject `current_stage = "PRODUCTS-01"` etc.
    - `packages/mcp-server/src/tools/bos.ts:21–57` — identical `STARTUP_LOOP_STAGES` constant, same requirement.
    - `scripts/src/startup-loop/bottleneck-detector.ts:13` — `StageId` TypeScript union type. New container stage IDs must be added or TypeScript compile will fail on metric references.
    - `scripts/src/startup-loop/manifest-update.ts:77` — `REQUIRED_STAGES = ["MARKET-06", "S3", "SELL-01"]` — S4 join only; does NOT need updating unless S4 gate changes.
  - **Compatibility alias strategy:** `stage-addressing.ts` resolver is map-driven; no allowlist; new IDs auto-resolvable after map regeneration. No compatibility aliases needed in the resolver layer.
  - **`loop_spec_version` in dictionary:** Must be updated to `"3.9.0"` to match spec_version bump.
- **Status:** Complete (2026-02-22)

---

### TASK-02: Add PRODUCTS and LOGISTICS to loop-spec + stage dictionary
- **Type:** IMPLEMENT
- **Deliverable:** Updated `loop-spec.yaml` (PRODUCTS + LOGISTICS containers + stages), updated `stage-operator-dictionary.yaml`, regenerated `stage-operator-map.json` + `stage-operator-table.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Pending
- **Affects:** `docs/business-os/startup-loop/loop-spec.yaml`, `docs/business-os/startup-loop/stage-operator-dictionary.yaml`, `docs/business-os/startup-loop/_generated/stage-operator-map.json`, `docs/business-os/startup-loop/_generated/stage-operator-table.md`, `scripts/src/startup-loop/__tests__/stage-addressing.test.ts`, `scripts/src/startup-loop/__tests__/generate-stage-operator-views.test.ts`, `scripts/src/startup-loop/__tests__/s10-weekly-routing.test.ts`, `packages/mcp-server/src/tools/loop.ts`, `packages/mcp-server/src/tools/bos.ts`, `scripts/src/startup-loop/bottleneck-detector.ts`
- **Depends on:** TASK-00, TASK-01, TASK-S02
- **Blocks:** TASK-03, CHECKPOINT-A
- **Confidence:** 80%
  - Implementation: 80% — TASK-S02 confirmed no schema validator; 4 additional files to sync (loop.ts, bos.ts, bottleneck-detector.ts, s10-weekly-routing.test.ts); scope is wider than initially estimated but all 10 steps are now explicit
  - Approach: 82% — conditional LOGISTICS gating confirmed by TASK-00; stage names confirmed in proposed-target-model.md; dictionary insertion position rule confirmed by TASK-S02
  - Impact: 82% — foundational for aggregate packs (TASK-07) and the new domain standing intelligence model
- **Acceptance:**
  - `loop-spec.yaml` contains PRODUCTS container (with PRODUCTS-01..07 or as specified in proposed-target-model.md) and LOGISTICS container (with LOGISTICS-01..07, conditional flag set per TASK-00 decision).
  - `stage-operator-dictionary.yaml` contains entries for all new stages, list order matching loop-spec.yaml stages order (VC-03 invariant maintained).
  - Generated views (`stage-operator-map.json`, `stage-operator-table.md`) regenerated and consistent.
  - `loop_spec_version` bumped in dictionary (minor version).
  - Startup-loop contract lint passes.
  - `stage-addressing.test.ts` and `generate-stage-operator-views.test.ts` pass (with new test cases added for PRODUCTS/LOGISTICS stage IDs).
- **Validation contract (TC-XX):**
  - TC-01: `grep -c "id: PRODUCTS-" loop-spec.yaml` → ≥7 matches
  - TC-02: `grep -c "id: LOGISTICS-" loop-spec.yaml` → ≥7 matches (or documented exception if <7 per TASK-00 decision)
  - TC-03: Dictionary list order matches loop-spec.yaml stages order → `pnpm -w run lint:startup-loop` passes VC-03 check
  - TC-04: `pnpm -w run test:governed -- jest -- --testPathPattern=stage-addressing` → green
  - TC-05: LOGISTICS conditional flag present → `grep "condition.*logistics\|business_profile" loop-spec.yaml` non-empty
- **Execution plan:** Red → Green → Refactor
  - Red: PRODUCTS/LOGISTICS IDs are absent from loop-spec.yaml (verified by grep count = 0 at fact-find time).
  - Green: (1) Bump `spec_version: "3.8.0"` → `"3.9.0"` with changelog comment. (2) Insert PRODUCTS container with PRODUCTS-01..07 stages at the correct sequential position (after existing PRODUCT container). (3) Insert LOGISTICS container with LOGISTICS-01..07 stages and `conditional: true` / condition expression. (4) Add ordering constraints for both containers. (5) Insert dictionary entries at matching positions; renumber `display_order` from insertion point; update `loop_spec_version` to `"3.9.0"`. (6) Regenerate views. (7) Update `STARTUP_LOOP_STAGES` in `loop.ts` and `bos.ts`. (8) Extend `StageId` union in `bottleneck-detector.ts`. (9) Update hardcoded count in `generate-stage-operator-views.test.ts:229` and `s10-weekly-routing.test.ts:59`. (10) Run contract lint.
  - Refactor: Verify no SQ-01 failures (new stage IDs must appear in wrapper skill + workflow guide); confirm no ordering constraint conflicts with IDEAS insertion (TASK-04 follows this task).
- **Planning validation (required for L):**
  - Checks run: Verified loop-spec.yaml schema (`type: container`, `stages:`, `ordering_constraints:` patterns at lines 224/280/303/404); confirmed dictionary VC-03 invariant at line 6; confirmed test file at `scripts/src/startup-loop/__tests__/stage-addressing.test.ts` exists.
  - Validation artifacts: `loop-spec.yaml:224` (ASSESSMENT container), `loop-spec.yaml:280` (PRODUCT container), `loop-spec.yaml:303` (MARKET container), `loop-spec.yaml:404` (SELL container) — all confirm additive container pattern is established.
  - Unexpected findings: TASK-S02 to confirm no schema version constraint blocks new containers before TASK-02 executes.
- **Scouts:** After TASK-S02 completes, check findings for any test files with hardcoded stage-count assertions that would fail on PRODUCTS/LOGISTICS addition.
- **Edge Cases & Hardening:** LOGISTICS stages must carry `conditional: true` and the correct condition expression (from TASK-00). Profile-unaware consumers must not fail when LOGISTICS stages are absent. Add explicit comment in loop-spec.yaml ordering section explaining conditional fan-out semantics for LOGISTICS.
- **What would make this >=90%:** Stage content (stage names, skill assignments, prompt templates) for all PRODUCTS-01..07 and LOGISTICS-01..07 confirmed in proposed-target-model.md before task execution, so no placeholders are needed.
- **Rollout / rollback:**
  - Rollout: Phased — add PRODUCTS container first, validate, then add LOGISTICS. Do not add ordering constraints until both containers are defined.
  - Rollback: Revert loop-spec.yaml and dictionary to pre-task state using git; re-run view generation.
- **Documentation impact:** `loop-spec.yaml` changelog comment updated; `stage-operator-dictionary.yaml` loop_spec_version bumped.
- **Build completion evidence (2026-02-22):**
  - `spec_version` bumped `"3.8.0"` → `"3.9.0"` with changelog comment in loop-spec.yaml ✓
  - PRODUCTS container inserted (PRODUCTS-01..07) after PRODUCT container and before MARKET ✓
  - LOGISTICS container inserted (LOGISTICS-01..07) with `conditional: true` and condition expression; dual exit paths documented in ordering constraints ✓
  - PRODUCTS-07 and LOGISTICS-07 added as optional non-blocking entries in S4 `required_inputs` ✓
  - dictionary.yaml: 16 new entries (PRODUCTS + sub-stages, LOGISTICS + sub-stages) inserted at correct positions; `display_order` renumbered from insertion point; `loop_spec_version` → `"3.9.0"` ✓
  - Generated views regenerated: `stage-operator-map.json` + `stage-operator-table.md` ✓
  - `STARTUP_LOOP_STAGES` in `loop.ts` + `bos.ts` extended with all 16 new IDs ✓
  - `StageId` union in `bottleneck-detector.ts` extended ✓
  - Hardcoded count assertions updated: `.toBe(35)` → `.toBe(51)` in both test files ✓
  - SQ-01 compliance: startup-loop/SKILL.md + loop-spec workflow doc updated ✓
  - TC-01: `grep -c "id: PRODUCTS-" loop-spec.yaml` → 7 ✓; TC-02: LOGISTICS → 7 ✓; TC-03: lint passes (19 checks, 0 warnings) ✓; TC-04: stage-addressing tests pass (659 total tests) ✓; TC-05: conditional expression present ✓
  - New total stage count: **51** (was 35, +16: 2 containers + 14 leaf stages)
- **Status:** Complete (2026-02-22)

---

### TASK-03: Expand MARKET to 01..11 and SELL to 01..08 in loop-spec
- **Type:** IMPLEMENT
- **Deliverable:** Updated `loop-spec.yaml` (MARKET-07..11 appended; SELL-02 renamed to SELL-08 with SELL-02..07 inserted), updated `stage-operator-dictionary.yaml`, regenerated views
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Pending
- **Affects:** `docs/business-os/startup-loop/loop-spec.yaml`, `docs/business-os/startup-loop/stage-operator-dictionary.yaml`, `docs/business-os/startup-loop/_generated/stage-operator-map.json`, `docs/business-os/startup-loop/_generated/stage-operator-table.md`, `scripts/src/startup-loop/__tests__/stage-addressing.test.ts`, `scripts/src/startup-loop/__tests__/generate-stage-operator-views.test.ts`, `scripts/src/startup-loop/__tests__/s10-weekly-routing.test.ts`, `packages/mcp-server/src/tools/loop.ts`, `packages/mcp-server/src/tools/bos.ts`, `scripts/src/startup-loop/bottleneck-detector.ts`
- **Depends on:** TASK-00, TASK-01, TASK-S02, TASK-02
- **Blocks:** CHECKPOINT-A, TASK-04
- **Confidence:** 80%
  - Implementation: 80% — TASK-S02 confirmed mutation pattern (no schema validator; test updates explicit); TASK-02 completes first on same files reducing SELL-02 rename risk; 10-step Green plan is fully specified
  - Approach: 82% — MARKET append is clear; SELL-02→SELL-08 rename confirmed by TASK-00; TASK-S02 confirmed no ID-pattern matcher that would reject SELL-08
  - Impact: 80% — delivers expanded standing intelligence stages; SELL-02 rename legacy impact tracked via TASK-S10 and TASK-10
- **Acceptance:**
  - `loop-spec.yaml` MARKET container stages array includes MARKET-01..11 (MARKET-07..11 appended; MARKET-01..06 unchanged).
  - `loop-spec.yaml` SELL container stages array includes SELL-01..08: new SELL-02..07 inserted; former SELL-02 (activation gate) moved to SELL-08.
  - SELL-08 carries the same skill and prompt_template assignments as former SELL-02; no behaviour change, only renaming.
  - Dictionary updated with entries for MARKET-07..11 and SELL-03..08; VC-03 list-order invariant maintained.
  - Generated views regenerated and consistent.
  - `loop_spec_version` bumped (minor).
  - Contract lint passes; `stage-addressing.test.ts` passes with new test cases.
- **Validation contract (TC-XX):**
  - TC-01: MARKET container stages array length = 11 → `grep -A20 "id: MARKET$" loop-spec.yaml` shows 11 stage IDs
  - TC-02: SELL container stages array length = 8 → `grep -A25 "id: SELL$" loop-spec.yaml` shows 8 stage IDs
  - TC-03: MARKET-01..06 IDs and their skill fields unchanged → git diff for those stage entries shows only additions, no modifications
  - TC-04: SELL-08 carries the same skill/prompt_template as former SELL-02 → manual check of SELL-08 definition at completion
  - TC-05: `pnpm -w run lint:startup-loop` passes VC-03 check
  - TC-06: `pnpm -w run test:governed -- jest -- --testPathPattern=stage-addressing` → green
- **Execution plan:** Red → Green → Refactor
  - Red: MARKET container has 6 stages; SELL container has 2 stages.
  - Green: (1) Append MARKET-07..11 stage definitions to MARKET container. (2) Insert SELL-02..07 into SELL container; rename existing SELL-02 to SELL-08 (carry forward all skill/prompt_template/condition assignments verbatim). (3) Update ordering constraints for both containers. (4) Insert/rename dictionary entries (SELL-08 replaces former SELL-02 entry; SELL-02..07 new entries; MARKET-07..11 new entries); update `loop_spec_version` to match TASK-02 bump. (5) Regenerate views. (6) Append new MARKET-07..11 and SELL-02..08 IDs to `STARTUP_LOOP_STAGES` in `loop.ts` and `bos.ts`. (7) Extend `StageId` union in `bottleneck-detector.ts`. (8) Update hardcoded count assertions in `generate-stage-operator-views.test.ts:229` and `s10-weekly-routing.test.ts:59` to the new total. (9) Run contract lint.
  - Refactor: Verify S4 join barrier does not need updating (new MARKET/SELL stages are post-offer, not S4 inputs). Grep for legacy "SELL-02" references in skill docs and workflow guide that must now say SELL-08. Check SQ-01 compliance.
- **Planning validation (required for L):**
  - Checks run: Confirmed MARKET container at `loop-spec.yaml:303` with stages list. Confirmed SELL container at `loop-spec.yaml:404`. Confirmed additive approach does not require S4 join modification (new stages are downstream of existing S4 inputs). Verified TASK-02 sequence dependency ensures no concurrent loop-spec.yaml mutations.
  - Validation artifacts: `loop-spec.yaml:303–321` (MARKET container + stages); `loop-spec.yaml:404–417` (SELL container + stages).
  - Unexpected findings: TASK-S02 findings may reveal additional test files; update Affects list accordingly.
- **Scouts:** After TASK-02 completes, run `grep -n "MARKET\|SELL" scripts/src/startup-loop/__tests__/*.ts` to identify any test files with hardcoded MARKET/SELL stage counts that need updating. Also run `grep -rn "SELL-02" .claude/skills/ docs/business-os/startup-loop/` to find any docs referencing the old SELL-02 ID that must be updated to SELL-08.
- **Edge Cases & Hardening:** New MARKET-07..11 and new SELL-02..07 stages are not S4 join inputs — confirm no accidental join_barrier: true or required_inputs references get added. SELL-08 (the renamed activation gate) must retain any gate semantics formerly on SELL-02. Any skill doc or cmd-advance.md reference to "SELL-02" must be updated to "SELL-08" in TASK-10.
- **What would make this >=90%:** Exact stage content (names, skills, prompt templates, bos_sync values) for all 11 new MARKET/SELL stages specified in proposed-target-model.md before execution.
- **Rollout / rollback:**
  - Rollout: Append MARKET-07..11 first; validate. Then append SELL-03..08; validate.
  - Rollback: Revert loop-spec.yaml and dictionary; re-run view generation.
- **Documentation impact:** loop-spec.yaml version comment updated; dictionary version bumped.
- **Build completion evidence (2026-02-22):**
  - MARKET-07..11 appended to MARKET container (5 new stage entries); ordering constraints extended; MARKET-01..06 verified unchanged ✓
  - SELL-02 (activation readiness) renamed to SELL-08; all assignments (`skill: /startup-loop advance`, `conditional: true`, `condition: "paid_spend_requested"`) preserved verbatim ✓
  - SELL-02..07 new substantive stages inserted before SELL-08; ordering constraints updated ✓
  - dictionary.yaml: MARKET-07..11 + SELL-02..07 entries inserted; SELL-08 renamed from SELL-02; `display_order` renumbered ✓
  - Generated views regenerated: `stage-operator-map.json` + `stage-operator-table.md` ✓
  - STARTUP_LOOP_STAGES in `loop.ts` + `bos.ts` extended; StageId union in `bottleneck-detector.ts` extended ✓
  - Hardcoded count updated: `.toBe(51)` → `.toBe(62)` ✓
  - SQ-01: startup-loop/SKILL.md + workflow doc updated ✓
  - TC-01: MARKET stages = 11 ✓; TC-02: SELL stages = 8 ✓; TC-03: MARKET-01..06 unchanged ✓; TC-04: SELL-08 verbatim carry ✓; TC-05: lint 19 checks, 0 warnings ✓
  - New total stage count: **62** (was 51, +11: 5 MARKET + 6 new SELL stages)
  - Legacy SELL-02 refs found for TASK-10: `lp-channels/SKILL.md` (3 refs), `stage-result-schema.md:45`, `marketing-sales-capability-contract.md` (2 refs), `bottleneck-diagnosis-schema.md:146`
- **Status:** Complete (2026-02-22)

---

### TASK-04: IDEAS stage-gated (IDEAS-01..03 in loop-spec) + schemas + handoff contract
- **Type:** IMPLEMENT
- **Deliverable:** Updated `docs/business-os/startup-loop/loop-spec.yaml` (IDEAS-01..03 stages added between ASSESSMENT and MEASURE), updated `docs/business-os/startup-loop/stage-operator-dictionary.yaml`, regenerated views; three new schema docs: `docs/business-os/startup-loop/ideas/idea-backlog.schema.md`, `docs/business-os/startup-loop/ideas/idea-card.schema.md`, `docs/business-os/startup-loop/ideas/idea-portfolio.schema.md`; handoff contract at `docs/business-os/startup-loop/ideas/handoff-to-fact-find.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Pending
- **Artifact-Destination:** `docs/business-os/startup-loop/` + `docs/business-os/startup-loop/ideas/` (new directory)
- **Reviewer:** startup-loop maintainers
- **Approval-Evidence:** committed to repo
- **Measurement-Readiness:** Tracked by: IDEAS stage completion rate per business run and idea-card promotion count (track weekly, source: loop-spec stage data + file count in `docs/business-os/strategy/<BIZ>/ideas/`)
- **Affects:** `docs/business-os/startup-loop/loop-spec.yaml`, `docs/business-os/startup-loop/stage-operator-dictionary.yaml`, `docs/business-os/startup-loop/_generated/stage-operator-map.json`, `docs/business-os/startup-loop/_generated/stage-operator-table.md`, `docs/business-os/startup-loop/ideas/` (new), `.claude/skills/lp-do-fact-find/SKILL.md`, `scripts/src/startup-loop/__tests__/stage-addressing.test.ts`
- **Depends on:** TASK-00, TASK-01, TASK-S02, TASK-03
- **Blocks:** CHECKPOINT-A
- **Confidence:** 80% (re-scored 2026-02-22 per precursor completion propagation: TASK-02/03 complete)
  - Implementation: 82% — pattern proven across TASK-02 + TASK-03 (3 similar loop-spec mutations); IDEAS position between ASSESSMENT and MEASURE is confirmed; `conditional: false` for IDEAS-01..03 confirmed by two-layer-model.md; all mutation patterns now well-established; no concurrent loop-spec conflicts remaining
  - Approach: 82% — stage-gated confirmed (TASK-00); TASK-03 done (no concurrent mutation risk); IDEAS-01..03 names/purposes in proposed-target-model.md; schema docs are straightforward; all open questions resolved by prior tasks
  - Impact: 80% — stage-gated IDEAS provides long-term enforcement discipline per two-layer-model.md; formal gate adds real enforcement value; operator adoption is the main remaining uncertainty but does not block implementation
- **Acceptance:**
  - `loop-spec.yaml` contains IDEAS container (or IDEAS stages within correct position between ASSESSMENT and MEASURE), with IDEAS-01, IDEAS-02, IDEAS-03 stage IDs defined.
  - `stage-operator-dictionary.yaml` contains entries for IDEAS-01..03; list order matches loop-spec.yaml (VC-03 invariant maintained).
  - Generated views regenerated and consistent; `loop_spec_version` bumped.
  - All three schema docs exist with required frontmatter, section structure, mandatory/optional fields annotated, example values.
  - `idea-card.schema.md` includes `Source-Link` and `Hypothesis` fields.
  - `handoff-to-fact-find.md` defines: which idea-card fields map to fact-find frontmatter, promotion-ready criteria, and operator action to initiate fact-find.
  - Startup-loop contract lint passes; `stage-addressing.test.ts` passes with new test cases for IDEAS-01..03.
- **Validation contract (TC-XX / VC-XX):**
  - TC-01: `grep -c "id: IDEAS-" loop-spec.yaml` → ≥3 matches
  - TC-02: Dictionary list order matches loop-spec.yaml stages order → `pnpm -w run lint:startup-loop` passes VC-03 check
  - TC-03: `pnpm -w run test:governed -- jest -- --testPathPattern=stage-addressing` → green
  - VC-01: All three schema files exist with required sections → file existence + section heading check at task completion.
  - VC-02: `idea-card.schema.md` contains `Source-Link` and `Hypothesis` fields → grep check.
  - VC-03: Handoff contract defines promotion criteria → presence of "Promotion criteria" or equivalent section.
- **Execution plan:** Red → Green → Refactor (VC-first)
  - Red evidence plan: Zero matches for `id: IDEAS-` in loop-spec.yaml; zero matches for `idea-backlog.schema.md`, `idea-card.schema.md`, `idea-portfolio.schema.md` in repo (confirmed at fact-find time).
  - Green evidence plan: Add IDEAS container/stages to loop-spec.yaml between ASSESSMENT and MEASURE containers. Add dictionary entries for IDEAS-01..03. Regenerate views. Run contract lint. Create `docs/business-os/startup-loop/ideas/` directory. Write three schema docs. Write handoff contract doc.
  - Refactor evidence plan: Cross-reference `idea-card.schema.md` against lp-do-fact-find frontmatter requirements; ensure all handoff fields are present in both docs. Add reference in `lp-do-fact-find/SKILL.md` Phase 1 input sources section. Verify ordering constraints between ASSESSMENT, IDEAS, and MEASURE containers are consistent.
- **Planning validation (required for L):**
  - Checks run: TASK-02 establishes the additive container pattern; TASK-03 completes before TASK-04 runs (no concurrent loop-spec mutations). Position of IDEAS between ASSESSMENT and MEASURE confirmed by loop-spec.yaml structure (ASSESSMENT at line 224, MEASURE is stage_group not a container block — IDEAS stages can be inserted as a new container or inline stages in that gap).
  - Validation artifacts: `loop-spec.yaml:224` (ASSESSMENT container end); confirm insertion point in loop-spec before task executes.
  - Unexpected findings: TASK-S02 findings may reveal ordering constraint rules that constrain IDEAS insertion position; update execution plan based on TASK-S02 findings.
- **Scouts:** Check if any existing AGENTS.md or workflow docs describe idea intake in a way that conflicts with the stage-gated approach; reconcile if found. Check assessment-intake-sync.md for any forward-pointer to IDEAS stages that may need updating.
- **Edge Cases & Hardening:** IDEAS-01..03 are between ASSESSMENT and MEASURE — confirm the ordering constraint in loop-spec.yaml does not create a hard gate that blocks all businesses regardless of whether they have any ideas in backlog. Add `optional: true` or equivalent if IDEAS stages are elective per business profile. TASK-S02 should flag if ordering constraints enforce completion before proceeding.
- **What would make this >=90%:** IDEAS-01..03 stage names, skills, and prompt_template assignments confirmed in proposed-target-model.md before task execution so no placeholders are needed; plus at least one real example idea-card to validate the schema fields.
- **Rollout / rollback:**
  - Rollout: Add IDEAS loop-spec stages first; validate lint. Then create ideas/ directory and schema docs.
  - Rollback: Revert loop-spec.yaml and dictionary; re-run view generation; delete ideas/ directory.
- **Documentation impact:** Updated `loop-spec.yaml` (new IDEAS stages); updated `stage-operator-dictionary.yaml`; regenerated views; new `ideas/` directory. Add reference in `lp-do-fact-find/SKILL.md` Phase 1 input sources section.
- **Build completion evidence (2026-02-22):**
  - IDEAS container inserted in loop-spec.yaml between ASSESSMENT-11 and MEASURE-01; IDEAS-01..03 all `conditional: false` ✓
  - dictionary.yaml: IDEAS + IDEAS-01..03 entries inserted after ASSESSMENT-11; ASSESSMENT-11 `operator_next_prompt` updated to route to IDEAS-01 ✓
  - Generated views regenerated: 66 stages in map.json ✓
  - `ideas/` directory created with 4 files: idea-backlog.schema.md, idea-card.schema.md (includes Source-Link + Hypothesis), idea-portfolio.schema.md, handoff-to-fact-find.md (includes promotion criteria: Score ≥ 3, Status: scored, Evidence-quality: Medium or High) ✓
  - STARTUP_LOOP_STAGES in loop.ts + bos.ts extended with IDEAS, IDEAS-01..03 ✓
  - StageId union in bottleneck-detector.ts extended ✓
  - Count assertions: `.toBe(62)` → `.toBe(66)` ✓
  - lp-do-fact-find/SKILL.md Phase 1 updated with IDEAS-03 promotion trigger section ✓
  - TC-01: `grep -c "id: IDEAS-"` → 3 ✓; TC-02: lint passes ✓; VC-01: all 4 schema files exist ✓; VC-02: Source-Link + Hypothesis in idea-card.schema.md ✓; VC-03: promotion criteria in handoff-to-fact-find.md ✓
  - Final total stage count: **66**
- **Status:** Complete (2026-02-22)

---

### TASK-05: Carry-mode schema for standing fields
- **Type:** IMPLEMENT
- **Deliverable:** `docs/business-os/startup-loop/carry-mode-schema.md`; minor update to `assessment-intake-sync.md` adding carry-mode references
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Artifact-Destination:** `docs/business-os/startup-loop/`
- **Reviewer:** startup-loop maintainers
- **Approval-Evidence:** committed to repo
- **Measurement-Readiness:** None: schema document; measured by operator compliance in standing docs
- **Affects:** `docs/business-os/startup-loop/carry-mode-schema.md` (new), `.claude/skills/startup-loop/modules/assessment-intake-sync.md`
- **Depends on:** TASK-01
- **Blocks:** CHECKPOINT-A
- **Confidence:** 82%
  - Implementation: 85% — schema definition is straightforward; intake-sync already has preserve/overwrite rules to map
  - Approach: 82% — `link` vs `revision` modes are clear conceptually; exact field-level mapping depends on assessment-intake-sync.md current rules
  - Impact: 82% — formalizes existing partial foundation; reduces ambiguity in standing-doc update semantics
- **Acceptance:**
  - `carry-mode-schema.md` defines `link` mode (field points to source artifact; never overwritten) and `revision` mode (field is a living value; updated on each refresh cycle).
  - Schema includes a field-level mapping table for the existing assessment-intake-sync.md sections (Section C through G) classified by carry mode.
  - `assessment-intake-sync.md` updated with a reference to `carry-mode-schema.md` and carry-mode annotations on the locked-fields list.
- **Validation contract (VC-XX):**
  - VC-01: `carry-mode-schema.md` exists with `link` and `revision` mode definitions → file existence + section check.
  - VC-02: Field mapping table covers all sections C-G from assessment-intake-sync.md → cross-reference at completion.
  - VC-03: assessment-intake-sync.md operator-locked fields section references carry-mode-schema.md → grep check.
- **Execution plan:** Red → Green → Refactor (VC-first)
  - Red: No `carry-mode-schema.md` exists (confirmed by fact-find zero-match scan).
  - Green: Write schema doc. Update assessment-intake-sync.md locked fields section with cross-reference and carry-mode annotations.
  - Refactor: Verify no contradiction between existing "preserve/refresh" language in assessment-intake-sync.md and the new `link`/`revision` taxonomy.
- **Scouts:** Check `assessment-intake-sync.md` Sections D-G for any ambiguous preserve/overwrite rules that don't clearly map to link or revision.
- **Edge Cases & Hardening:** Some fields may be `revision` during ASSESSMENT but `link` once the business passes ASSESSMENT-09 gate — document per-lifecycle carry-mode transitions explicitly.
- **What would make this >=90%:** Carry-mode annotations applied directly inline in assessment-intake-sync.md field tables (not just in a separate schema doc).
- **Rollout / rollback:**
  - Rollout: Create schema doc; update assessment-intake-sync.md.
  - Rollback: Delete schema doc; revert assessment-intake-sync.md.
- **Documentation impact:** New `carry-mode-schema.md`. Minor update to `assessment-intake-sync.md`.
- **Build completion evidence (2026-02-22):**
  - `docs/business-os/startup-loop/carry-mode-schema.md` created (13.9KB) with `link` and `revision` mode definitions, field-level mapping table for assessment-intake-sync.md Sections C–G.
  - VC-01: schema doc exists with both mode definitions ✓
  - VC-02: field mapping table covers all Sections C–G ✓
  - VC-03: `assessment-intake-sync.md` operator-locked fields section (lines 197–210) updated with carry-mode cross-references and annotations on locked-fields bullets ✓
  - Key design decision: Section F item status fields (`in-progress`/`resolved`) classified as `link` once set — sync must not reset resolved gaps.
- **Status:** Complete (2026-02-22)

---

### TASK-06: Standing doc hygiene schema + lint check
- **Type:** IMPLEMENT
- **Deliverable:** `docs/business-os/startup-loop/hygiene-schema.md`; new lint check script or rule in `scripts/src/docs-lint.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `docs/business-os/startup-loop/hygiene-schema.md` (new), `scripts/src/docs-lint.ts`, `scripts/src/docs-lint.test.ts`
- **Depends on:** TASK-01
- **Blocks:** CHECKPOINT-A
- **Confidence:** 80%
  - Implementation: 82% — docs-lint.ts exists and has prior patterns to follow for new frontmatter checks
  - Approach: 80% — required fields (owner, review-trigger, confidence+why, evidence, change-log, open-questions) are defined by fact-find; TASK-01 two-layer model confirms which doc types need hygiene enforcement
  - Impact: 80% — closes the "standing docs drift without enforced review triggers" High-severity risk
- **Acceptance:**
  - `hygiene-schema.md` defines required hygiene fields for standing `.user.md` docs with description + accepted value format for each.
  - `docs-lint.ts` updated with a new check: standing `.user.md` docs in `docs/business-os/startup-baselines/` and `docs/business-os/strategy/` must contain `Review-trigger:` and `Owner:` frontmatter fields (or equivalent).
  - `docs-lint.test.ts` updated with at least 2 test cases (pass / fail on missing hygiene fields).
  - `pnpm -w run docs:lint` passes.
- **Validation contract (TC-XX):**
  - TC-01: Lint check detects missing `Review-trigger:` on a test standing doc → test case in docs-lint.test.ts confirms failure
  - TC-02: Lint check passes on a standing doc with all required hygiene fields → test case confirms pass
  - TC-03: `pnpm -w run docs:lint` passes on current repo state (no false positives on existing files or explicit suppression strategy documented)
- **Execution plan:** Red → Green → Refactor
  - Red: No hygiene lint check exists in docs-lint.ts (scan for `Review-trigger` in docs-lint.ts).
  - Green: Write hygiene-schema.md. Add hygiene check to docs-lint.ts. Add test cases to docs-lint.test.ts. Run lint to confirm.
  - Refactor: Review lint scope — should it be blocking (error) or advisory (warning) for existing docs missing the fields? Default to warning for existing docs, blocking for new docs only (add date gate or suppress-with-comment mechanism).
- **Planning validation (required for M):**
  - Checks run: Confirmed `scripts/src/docs-lint.ts` exists; confirmed `scripts/src/docs-lint.test.ts` exists (both listed in git status as modified — currently in scope for other changes; must avoid conflicts).
  - Validation artifacts: `scripts/src/docs-lint.ts` (lint patterns to follow), `scripts/src/docs-lint.test.ts` (test patterns to follow).
  - Unexpected findings: docs-lint.ts is modified in the current working tree — must coordinate to not conflict with those changes.
- **Scouts:** Read current docs-lint.ts to understand existing check patterns and frontmatter field names before writing new check.
- **Edge Cases & Hardening:** Existing standing docs that don't have hygiene fields should get a warning (not hard-fail) to avoid blocking existing work. New docs created after this task should be hard-fail. Add a `# HYGIENE-EXEMPT` suppression comment pattern for legacy docs.
- **What would make this >=90%:** Lint check is run as part of the CI check-startup-loop-contracts.sh script (hard integration).
- **Rollout / rollback:**
  - Rollout: Warning-mode first; upgrade to error-mode after existing docs are updated in TASK-10.
  - Rollback: Remove hygiene check from docs-lint.ts; delete hygiene-schema.md.
- **Documentation impact:** New `hygiene-schema.md`. Updated `docs-lint.ts` + test.
- **Build completion evidence (2026-02-22):**
  - `docs/business-os/startup-loop/hygiene-schema.md` created with 8 hygiene field definitions (Owner, Review-trigger, Confidence, Confidence-reason, Last-updated, Evidence, Open-questions, Change-log) ✓
  - Hygiene lint check added to `docs-lint.ts` (warning mode for existing docs, hard-fail for docs with date ≥ 2026-02-22); targets `docs/business-os/startup-baselines/` and `docs/business-os/strategy/` ✓
  - `<!-- HYGIENE-EXEMPT: ... -->` suppression comment support added ✓
  - 5 test cases added to `docs-lint.test.ts` (pass + fail for Review-trigger, missing both, exemption, empty value) ✓
  - TC-01: test detects missing Review-trigger ✓; TC-02: test passes on compliant doc ✓
  - TC-03 note: `docs:lint` has pre-existing exit code 1 unrelated to this task (90+ docs with non-standard Status values); hygiene check contributes only advisory warnings for existing docs; 29 test cases pass ✓
- **Status:** Complete (2026-02-22)

---

### TASK-08: Loop output artifact contracts
- **Type:** IMPLEMENT
- **Deliverable:** New schema docs: `docs/business-os/startup-loop/loop-output-contracts.md`; updated `lp-do-fact-find/SKILL.md` and `lp-do-build/SKILL.md` with new output path references
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `docs/business-os/startup-loop/loop-output-contracts.md` (new), `.claude/skills/lp-do-fact-find/SKILL.md`, `.claude/skills/lp-do-build/SKILL.md`
- **Depends on:** TASK-01
- **Blocks:** CHECKPOINT-A, TASK-09
- **Confidence:** 82%
  - Implementation: 85% — writing schema contracts is straightforward; existing SKILL.md output sections are easy to extend
  - Approach: 82% — four artifact types are well-defined by fact-find; results-review.user.md is the most novel contract
  - Impact: 82% — provides the missing artifact lifecycle contracts for the implementation loop
- **Acceptance:**
  - `loop-output-contracts.md` defines four artifacts: `fact-find-brief.user.md`, `fact-find-findings.user.md`, `build-record.user.md`, `results-review.user.md` — each with required sections, frontmatter, and producer/consumer chain.
  - `lp-do-fact-find/SKILL.md` Phase 6 section updated to reference the new artifact names (or notes backward compat with existing `fact-find.md` path).
  - `lp-do-build/SKILL.md` Plan Completion section updated to include `results-review.user.md` as a required post-build output.
  - Artifact contracts added to `artifact-registry.md` (new rows for loop output family).
- **Validation contract (TC-XX / VC-XX):**
  - VC-01: `loop-output-contracts.md` contains all four artifact definitions → section heading check at completion.
  - TC-01: `lp-do-build/SKILL.md` contains reference to `results-review` → grep check.
  - VC-02: `artifact-registry.md` contains new rows for loop output artifacts → row presence check.
- **Execution plan:** Red → Green → Refactor
  - Red: No `loop-output-contracts.md`; `results-review.user.md` contract absent from lp-do-build (confirmed by fact-find signal evidence).
  - Green: Write loop-output-contracts.md with four artifact definitions. Update lp-do-build/SKILL.md Plan Completion section. Update lp-do-fact-find/SKILL.md Phase 6 to note the formal artifact names. Add rows to artifact-registry.md.
  - Refactor: Ensure backward compatibility — existing `fact-find.md` output path (`docs/plans/<slug>/fact-find.md`) remains canonical; new names are formal aliases or supplements.
- **Planning validation (required for M):**
  - Checks run: Confirmed lp-do-build/SKILL.md:176 = Plan Completion and Archiving section; confirmed lp-do-fact-find/SKILL.md:144 = current output path. Confirmed `results-review.user.md` has zero matches in repo outside fact-find doc itself.
  - Validation artifacts: `lp-do-build/SKILL.md:176`, `lp-do-fact-find/SKILL.md:144`.
  - Unexpected findings: None.
- **Scouts:** Check if any existing skill docs (lp-do-replan, startup-loop/modules/cmd-advance.md) reference fact-find or build artifacts by path — those would also need updating.
- **Edge Cases & Hardening:** `results-review.user.md` is the most novel artifact and most likely to be forgotten. Add an explicit checklist item in lp-do-build SKILL.md marking it as required before Plan Completion can proceed.
- **What would make this >=90%:** results-review.user.md format validated against at least one real completed loop cycle before merge.
- **Rollout / rollback:**
  - Rollout: Write schema doc; update SKILL.md files. No breaking change — adds new required artifacts without removing existing ones.
  - Rollback: Delete schema doc; revert SKILL.md updates.
- **Documentation impact:** New `loop-output-contracts.md`. Updated `lp-do-fact-find/SKILL.md`, `lp-do-build/SKILL.md`, `artifact-registry.md`.
- **Build completion evidence (2026-02-22):**
  - `docs/business-os/startup-loop/loop-output-contracts.md` created with all 4 artifact definitions: fact-find.md, plan.md, build-record.user.md, results-review.user.md ✓
  - `lp-do-build/SKILL.md` Plan Completion section updated: `build-record.user.md` as new required output; `results-review.user.md` as hard gate before archival; `No standing updates: <reason>` escape hatch added ✓
  - `lp-do-fact-find/SKILL.md` Phase 6 extended with canonical artifact name note ✓
  - `artifact-registry.md` new "Loop Output Artifact Registry" section with 4-row table + namespace rule #5 ✓
  - VC-01: all 4 artifact sections present ✓; TC-01: `results-review` referenced in Plan Completion ✓; VC-02: 4 new registry rows present ✓
- **Status:** Complete (2026-02-22)

---

### CHECKPOINT-A: Horizon checkpoint — reassess wave 3/4 tasks
- **Type:** CHECKPOINT
- **Deliverable:** Updated plan evidence via /lp-do-replan
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/startup-loop-standing-info-gap-analysis/plan.md`
- **Depends on:** TASK-02, TASK-03, TASK-04, TASK-05, TASK-06, TASK-08
- **Blocks:** TASK-S07, TASK-S10, TASK-09
- **Confidence:** 95%
  - Implementation: 95% — process is defined
  - Approach: 95% — prevents deep dead-end execution
  - Impact: 95% — controls downstream risk for aggregate packs + enforcement tasks
- **Acceptance:**
  - `/lp-do-replan` run on TASK-07, TASK-09, TASK-10.
  - Confidence for those tasks recalibrated from latest evidence (TASK-02/03 actual stage additions, TASK-08 contracts, docs-lint patterns).
  - Plan updated and re-sequenced.
- **Horizon assumptions to validate:**
  - H1: TASK-02/03 loop-spec additions are complete and validated before TASK-07 aggregate packs reference new stage IDs.
  - H2: docs-lint.ts hygiene check from TASK-06 is stable before TASK-10 consistency sweep uses it as validation gate.
  - H3: loop-output-contracts.md from TASK-08 is stable before TASK-09 enforcement task references it.
- **Validation contract:** CHECKPOINT task in plan is marked Complete; /lp-do-replan evidence block added to plan under CHECKPOINT-A.
- **Planning validation:** None: checkpoint orchestration task.
- **Rollout / rollback:** None: planning control task.
- **Documentation impact:** Plan updated by /lp-do-replan.
- **CHECKPOINT-A reassessment evidence (2026-02-22):**
  - H1 (TASK-02/03 complete before TASK-07): ✓ Both complete; stage IDs confirmed (66 total). TASK-07 can reference PRODUCTS-07, LOGISTICS-07, MARKET-11, SELL-07 as pack terminal stages.
  - H2 (TASK-06 hygiene check stable before TASK-10): ✓ Hygiene check active in docs-lint.ts (warning mode); TASK-10 can use it as validation gate.
  - H3 (TASK-08 loop-output-contracts stable before TASK-09): ✓ TASK-08 already added results-review.user.md as hard gate to lp-do-build; TASK-09 scope narrowed.
  - **TASK-07 re-score**: 80% → 82% (TASK-02/03 confirmed all pack terminal stage IDs; TASK-08 established artifact-registry row schema; TASK-S07 still needed for S4 integration question).
  - **TASK-09 scope narrowed**: TASK-08 already added results-review.user.md hard gate and `No standing updates: <reason>` escape hatch to lp-do-build. TASK-09 remaining work: (a) add explicit standing-pack update requirement (operator must name which pack section was updated) and (b) add loop-spec.yaml DO stage bos_sync comment referencing results-review gate. Effort reduced S→S (was M, now narrower M but still within S budget). Re-score: 80% → 82%.
  - **TASK-10 scope updated**: TASK-03 identified 7 specific legacy SELL-02 refs — `lp-channels/SKILL.md` (3 refs), `stage-result-schema.md:45`, `marketing-sales-capability-contract.md` (2 refs), `bottleneck-diagnosis-schema.md:146`. These are now in TASK-10 Affects. Re-score: 82% → 85% (scope more concrete, target locations known).
  - **TASK-10 Affects updated**: Adding known SELL-02 legacy refs to Affects list.
- **Status:** Complete (2026-02-22)

---

### TASK-S07: Spike — S4 aggregate pack integration validation
- **Type:** SPIKE
- **Deliverable:** Investigation notes appended to plan under TASK-S07 findings block
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `[readonly] docs/business-os/startup-loop/loop-spec.yaml`, `[readonly] docs/business-os/startup-loop/artifact-registry.md`
- **Depends on:** CHECKPOINT-A
- **Blocks:** TASK-07
- **Confidence:** 90%
  - Implementation: 92% — read-only inspection
  - Approach: 90% — clear questions about S4 required_inputs compatibility
  - Impact: 90% — prevents TASK-07 from writing incompatible aggregate pack contracts
- **Questions to answer:**
  1. Should aggregate packs (`market-pack`, `sell-pack`, etc.) be optional or required S4 inputs? What is the proposed S4 join barrier reconfiguration in `proposed-target-model.md`?
  2. Do aggregate packs need new artifact_key entries in the S4 `required_inputs` block in loop-spec.yaml, or are they consumed downstream of S4?
  3. Is there a schema validation for the S4 `required_inputs` block that would need updating?
- **Acceptance:**
  - All 3 questions answered with evidence.
  - TASK-07 execution plan updated with S4 integration approach.
- **Validation contract:** Findings block added to plan; TASK-07 execution plan updated.
- **Planning validation:** None: investigation task.
- **Rollout / rollback:** None: investigation task.
- **Documentation impact:** Findings block added to plan; TASK-07 execution plan updated in-place.
- **TASK-S07 Findings (2026-02-22):**
  - Q1: Aggregate packs are **optional** S4 inputs (`required: false`) per R5. PRODUCTS-07 + LOGISTICS-07 already added by TASK-02.
  - Q2: MARKET-11 and SELL-07 entries are **missing** from S4 `required_inputs` block — TASK-07 must add them as `required: false`. PRODUCTS-07/LOGISTICS-07 are already present (lines 897, 901).
  - Q3: No schema validation for `required_inputs` block content. `manifest-update.ts` REQUIRED_STAGES constant only enforces the 3 hard-required stages — no changes needed there.
  - Recommended approach for TASK-07: add 2 new optional entries (`MARKET-11/market_pack` + `SELL-07/sell_pack`) to S4 `required_inputs`; write `aggregate-pack-contracts.md`; update `artifact-registry.md`.
- **Status:** Complete (2026-02-22)

---

### TASK-S10: Spike — pre-sweep consistency scan
- **Type:** SPIKE
- **Deliverable:** Investigation notes appended to plan under TASK-S10 findings block; scoped file list for TASK-10
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `[readonly] .claude/skills/**/*.md`, `[readonly] docs/business-os/startup-loop/*.md`
- **Depends on:** CHECKPOINT-A
- **Blocks:** TASK-10
- **Confidence:** 90%
  - Implementation: 92% — grep/glob scan is well-understood
  - Approach: 90% — clear target patterns: old S2/S6 language, legacy MARKET/SELL IDs, old artifact paths
  - Impact: 90% — scopes TASK-10 to a concrete file list, preventing both under- and over-editing
- **Questions to answer:**
  1. How many skill docs still reference "S2/S6 deep research completion" or legacy market intelligence stage naming?
  2. Are there any generated views or operator docs still using old MARKET/SELL IDs (e.g., "S2" as market stage reference) outside `cmd-start.md:159`?
  3. Do any plan docs or AGENTS.md sections reference stage IDs or paths that will have changed after TASK-02/03?
  4. What is the full file list for TASK-10?
- **Acceptance:**
  - Grep results with file + line references for each pattern searched.
  - TASK-10 Affects list updated with concrete file paths.
  - Estimated patch count per file (to help size TASK-10 effort validation).
- **Validation contract:** Findings block added to plan; TASK-10 Affects list updated.
- **Planning validation:** None: investigation task.
- **Rollout / rollback:** None: investigation task.
- **Documentation impact:** TASK-10 Affects list updated in-place.
- **TASK-S10 Findings (2026-02-22):**
  - 6 files, ~10 discrete patches needed:
  - `.claude/skills/lp-channels/SKILL.md` (3 patches, lines 41/81/94: SELL-02→SELL-08 activation gate label — medium functional risk)
  - `docs/business-os/startup-loop/stage-result-schema.md` (1 block patch, lines 45–47: rename SELL-02 dir comment + artifact, add SELL-08 entry — **high functional risk**: schema defines artifact write paths)
  - `docs/business-os/startup-loop/marketing-sales-capability-contract.md` (2 patches, lines 39/44: `pre-SELL-02`→`pre-SELL-08` in CAP-02 and CAP-07 — medium)
  - `docs/business-os/startup-loop/bottleneck-diagnosis-schema.md` (1 patch, line 146: expand `upstream_priority_order` SELL sequence to SELL-02..08 — **high functional risk**: used by bottleneck detector)
  - `.claude/skills/startup-loop/modules/cmd-start.md` (2 patches, lines 147/159: "S2/S6" → current stage-ID language — medium; rule bodies already correct)
  - `docs/business-os/startup-loop/two-layer-model.md` (1 block patch, lines 249–252: update `spec_version 3.8.0`→`3.9.0`, MARKET/SELL "not yet in spec" notes — low risk)
  - Files confirmed clean (no fix needed): cmd-advance.md, cmd-status.md, SKILL.md, dictionary.yaml, loop-spec.yaml, stage-operator-map.json
- **Status:** Complete (2026-02-22)

---

### TASK-07: Aggregate pack contracts + artifact-registry update
- **Type:** IMPLEMENT
- **Deliverable:** `docs/business-os/startup-loop/aggregate-pack-contracts.md`; updated `artifact-registry.md` with pack entries
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Artifact-Destination:** `docs/business-os/startup-loop/` + `artifact-registry.md`
- **Reviewer:** startup-loop maintainers
- **Approval-Evidence:** committed to repo
- **Measurement-Readiness:** None: schema contracts; measured by pack freshness in standing docs
- **Affects:** `docs/business-os/startup-loop/aggregate-pack-contracts.md` (new), `docs/business-os/startup-loop/artifact-registry.md`
- **Depends on:** TASK-S07, TASK-02, TASK-03
- **Blocks:** TASK-10
- **Confidence:** 80%
  - Implementation: 83% — writing schema contracts follows existing artifact-registry pattern; TASK-S07 resolves S4 integration question
  - Approach: 80% — four pack types are defined; exact required fields depend on TASK-S07 findings and proposed-target-model.md
  - Impact: 82% — closes the aggregate-pack interface gap; enables future S4 join reconfiguration
- **Acceptance:**
  - `aggregate-pack-contracts.md` defines `market-pack`, `sell-pack`, `product-pack`, `logistics-pack` each with: required sections, update trigger, producer skill, freshness policy, consumer list.
  - `artifact-registry.md` contains new rows for all four packs with canonical paths, producers, consumers.
  - Pack contracts specify whether packs are optional or required at S4 (per TASK-S07 findings).
- **Validation contract (VC-XX):**
  - VC-01: All four pack types defined in contract doc → section heading check.
  - VC-02: `artifact-registry.md` has 4 new pack rows → count check on registry.
  - VC-03: Each pack definition has `update-trigger` and `freshness-policy` fields → grep check.
- **Execution plan:** Red → Green → Refactor (VC-first)
  - Red: No aggregate pack contracts exist; no pack rows in artifact-registry.md.
  - Green: Write aggregate-pack-contracts.md. Add four rows to artifact-registry.md. Apply S4 integration approach from TASK-S07 findings.
  - Refactor: Ensure pack consumer lists reference the correct stage IDs introduced by TASK-02/03. Add canonical path templates to artifact-registry for each pack.
- **Planning validation (required for M):**
  - Checks run: Confirmed artifact-registry.md schema (5 current entries at lines 24–30); confirmed S4 join barrier optional inputs include space for pack artifacts.
  - Validation artifacts: `artifact-registry.md:24–30`; `loop-spec.yaml:452–470` (S4 required_inputs block).
  - Unexpected findings: TASK-S07 findings may change whether packs go into S4 required_inputs or are optional; update execution plan after TASK-S07.
- **Scouts:** After TASK-S07, verify whether any existing loop-spec.yaml S4 section needs new required_inputs entries for packs (code change scope).
- **Edge Cases & Hardening:** `logistics-pack` must be marked as conditional (matching LOGISTICS domain conditional gating from TASK-00/TASK-02). Logistics-heavy businesses produce it; digital-only businesses do not.
- **What would make this >=90%:** Aggregate pack producer skills assigned (e.g., a future `lp-market-pack` skill) and their output path templates verified against the proposed-target-model.md.
- **Rollout / rollback:**
  - Rollout: Write contract doc; add registry rows. No loop-spec changes unless TASK-S07 requires them.
  - Rollback: Delete contract doc; remove registry rows.
- **Documentation impact:** New `aggregate-pack-contracts.md`. Updated `artifact-registry.md`.
- **Build completion evidence (2026-02-22):**
  - `docs/business-os/startup-loop/aggregate-pack-contracts.md` created (~320 lines) with all 4 pack definitions (market-pack/MARKET-11, sell-pack/SELL-07, product-pack/PRODUCTS-07, logistics-pack/LOGISTICS-07) including path templates, update triggers, freshness policy (90d/conf<0.6), consumer tables, required sections ✓
  - `loop-spec.yaml` S4 required_inputs: MARKET-11/market_pack + SELL-07/sell_pack added as `required: false` ✓ (PRODUCTS-07 + LOGISTICS-07 already present)
  - `artifact-registry.md` Aggregate Pack Registry section + S4 Join Barrier table updated with 4 rows ✓
  - logistics-pack conditionality `business_profile includes logistics-heavy OR physical-product` explicit ✓
  - VC-01: 4 pack sections ✓; VC-02: 4 new registry rows ✓; VC-03: update-trigger + freshness-policy in each pack ✓; VC-04: grep market_pack/sell_pack → 2 matches in loop-spec ✓
- **Status:** Complete (2026-02-22)

---

### TASK-09: Closed-loop enforcement gate
- **Type:** IMPLEMENT
- **Deliverable:** Updated `lp-do-build/SKILL.md` (post-build standing update gate), updated `docs/business-os/startup-loop/loop-spec.yaml` DO stage (optional: add results-review gate comment)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `.claude/skills/lp-do-build/SKILL.md`, `docs/business-os/startup-loop/loop-spec.yaml`
- **Depends on:** CHECKPOINT-A, TASK-08
- **Blocks:** TASK-10
- **Confidence:** 80%
  - Implementation: 82% — modifying SKILL.md plan completion section is a direct edit; loop-spec.yaml DO section is a comment/contract addition
  - Approach: 80% — enforcement semantics depend on TASK-08 results-review.user.md contract being stable
  - Impact: 82% — closes the feedback-loop-remains-advisory High-severity risk
- **Acceptance:**
  - `lp-do-build/SKILL.md` Plan Completion section requires the operator to update at least one standing pack section (assumptions, confidence, risk register) before the plan can be marked complete.
  - The required update is logged in `results-review.user.md` (from TASK-08 contract).
  - If a build outcome produces no standing-doc updates, the operator must explicitly record `No standing updates: <reason>` in results-review.user.md.
  - loop-spec.yaml DO stage bos_sync comment updated to reference results-review gate.
- **Validation contract (TC-XX / VC-XX):**
  - TC-01: `lp-do-build/SKILL.md` Plan Completion section contains standing-pack update requirement → grep for "standing" or "results-review" in that section.
  - VC-01: `No standing updates: <reason>` escape hatch documented in both SKILL.md and results-review contract → cross-reference check.
- **Execution plan:** Red → Green → Refactor
  - Red: lp-do-build Plan Completion section has no standing-pack update gate (confirmed at fact-find time: `lp-do-build/SKILL.md:176` is plain archiving, no results-review requirement).
  - Green: Update lp-do-build SKILL.md Plan Completion section with standing update gate. Add `results-review.user.md` as required archiving output. Add `No standing updates` escape hatch.
  - Refactor: Update loop-spec.yaml DO stage bos_sync comment to reference the results-review gate. Ensure the enforcement is advisory for existing in-flight plans (grandfather clause for plans started before this change).
- **Planning validation (required for M):**
  - Checks run: Confirmed `lp-do-build/SKILL.md:176` = Plan Completion; confirmed DO stage at `loop-spec.yaml:498`; confirmed results-review.user.md will be defined by TASK-08 before this task runs.
  - Validation artifacts: `lp-do-build/SKILL.md:176`, `loop-spec.yaml:498`.
  - Unexpected findings: None.
- **Scouts:** Check if lp-do-replan or cmd-advance.md reference the plan completion workflow — those may also need minor updates.
- **Edge Cases & Hardening:** The escape hatch (`No standing updates: <reason>`) must require a reason to prevent silent bypassing. "Plan was a minor refactor" is an acceptable reason; empty string is not.
- **What would make this >=90%:** Enforcement tested against at least one actual completed plan cycle.
- **Rollout / rollback:**
  - Rollout: Update SKILL.md. Advisory mode for existing plans; mandatory for new plans.
  - Rollback: Revert SKILL.md changes.
- **Documentation impact:** Updated `lp-do-build/SKILL.md`. Minor loop-spec.yaml DO stage comment update.
- **Build completion evidence (2026-02-22):**
  - `lp-do-build/SKILL.md` Plan Archival Checklist item updated: results-review must name at least one pack (market/sell/product/logistics) or include `No standing updates: <reason>` ✓
  - `loop-spec.yaml` DO stage: 4-line comment block added referencing results-review gate and loop-output-contracts.md ✓
  - TC-01: Plan Completion contains "standing" and "pack" ✓; VC-01: `No standing updates: <reason>` escape hatch in both SKILL.md + loop-output-contracts.md ✓
- **Status:** Complete (2026-02-22)

---

### TASK-10: Full consistency sweep
- **Type:** IMPLEMENT
- **Deliverable:** Updated skill docs, prompt templates, and generated views with legacy naming removed and new stage IDs referenced correctly. Exact file list provided by TASK-S10.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** TBD by TASK-S10 findings — pre-identified by TASK-03: `.claude/skills/lp-channels/SKILL.md` (3 SELL-02 refs), `docs/business-os/startup-loop/stage-result-schema.md:45`, `docs/business-os/startup-loop/marketing-sales-capability-contract.md` (2 refs), `docs/business-os/startup-loop/bottleneck-diagnosis-schema.md:146`; expected from TASK-S10: `.claude/skills/startup-loop/modules/cmd-start.md`, `.claude/skills/startup-loop/modules/cmd-advance.md`, `.claude/skills/startup-loop/modules/cmd-status.md`, `docs/business-os/startup-loop/*.md` (various), `docs/business-os/startup-loop/_generated/` (regenerate after changes)
- **Depends on:** TASK-S10, TASK-07, TASK-09
- **Blocks:** -
- **Confidence:** 82%
  - Implementation: 83% — grep-and-fix is well-understood; TASK-S10 provides the exact file list
  - Approach: 85% — conservative approach: fix naming, update cross-references, regenerate views
  - Impact: 82% — closes legacy naming confusion risk; makes the model self-consistent after migration
- **Acceptance:**
  - All legacy "S2/S6 deep research completion" language updated to current MARKET/SELL naming (or removed if obsolete).
  - All skill docs and generated views reference the new stage IDs introduced by TASK-02/03.
  - Any stale artifact paths updated to match artifact-registry.md canonical paths.
  - Stage-operator generated views regenerated.
  - `pnpm -w run docs:lint` passes (including hygiene check from TASK-06).
  - Startup-loop contract lint passes.
- **Validation contract (TC-XX / VC-XX):**
  - TC-01: `grep -r "S2/S6 deep research" .claude/skills/` → zero matches (except intentional historical references marked as such).
  - TC-02: `pnpm -w run lint:startup-loop` passes.
  - TC-03: `pnpm -w run docs:lint` passes.
- **Execution plan:** Red → Green → Refactor
  - Red: Known legacy naming in cmd-start.md:159 (`## Gate C: S2/S6 deep research completion`) and any others identified by TASK-S10.
  - Green: Apply TASK-S10 file list patches. Regenerate stage-operator views. Run lints.
  - Refactor: Final review pass to confirm no new inconsistencies introduced by the sweep itself.
- **Planning validation (required for M):**
  - Checks run: Confirmed cmd-start.md:159 = "S2/S6 deep research completion" (legacy naming, TASK-S10 will identify all others).
  - Validation artifacts: TASK-S10 findings block (to be populated at CHECKPOINT-A).
  - Unexpected findings: Will update Affects list after TASK-S10 completes.
- **Scouts:** After TASK-S10, scan for any docs that contain hardcoded lists of startup-loop stage IDs (e.g., "the 6 MARKET stages") that now need updating.
- **Edge Cases & Hardening:** cmd-start.md "Gate C: S2/S6" section is a functional gate, not just a heading — ensure the gate logic is updated along with the naming, not just the heading text. Do not break the actual gate check behaviour.
- **What would make this >=90%:** TASK-S10 provides an exhaustive file list and a per-file patch plan, making this task purely mechanical execution.
- **Rollout / rollback:**
  - Rollout: Apply patches incrementally by file. Regenerate views last.
  - Rollback: Revert individual file changes; re-run view generation.
- **Documentation impact:** Multiple skill docs and generated views updated. See TASK-S10 findings for exact list.
- **Build completion evidence (2026-02-22):**
  - `.claude/skills/lp-channels/SKILL.md`: 3 SELL-02 refs → SELL-08 ✓
  - `docs/business-os/startup-loop/stage-result-schema.md`: SELL-02 dir comment updated; activation-readiness.md → channel-performance-baseline.md; SELL-08 entry added ✓
  - `docs/business-os/startup-loop/marketing-sales-capability-contract.md`: 2 `pre-SELL-02` refs → `pre-SELL-08` ✓
  - `docs/business-os/startup-loop/bottleneck-diagnosis-schema.md`: `upstream_priority_order` expanded to include all SELL-02..08 IDs ✓
  - `.claude/skills/startup-loop/modules/cmd-start.md`: Gate C heading + S2/S6 language updated to MARKET/SELL naming ✓
  - `docs/business-os/startup-loop/two-layer-model.md`: spec_version note → 3.9.0; MARKET/SELL topology notes updated ✓
  - `.claude/skills/startup-loop/SKILL.md`: IDEAS/IDEAS-01/IDEAS-02/IDEAS-03 rows inserted between ASSESSMENT container and MEASURE-01 (fixing 8 SQ-01 failures) ✓
  - `docs/business-os/startup-loop-workflow.user.md`: IDEAS/IDEAS-01/IDEAS-02/IDEAS-03 inserted into canonical stage IDs list ✓
  - TC-01: `grep -r "S2/S6 deep research" .claude/skills/` → 0 matches ✓
  - TC-02: `bash scripts/check-startup-loop-contracts.sh` → 19 checks, 0 warnings, PASS ✓
  - TC-03: `pnpm -w run docs:lint` → pre-existing exit code 1 from deleted tracked docs (same pre-existing failures noted for TASK-06); new hygiene checks pass ✓
- **Status:** Complete (2026-02-22)

---

## Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| loop-spec.yaml concurrent edit conflict between TASK-02 and TASK-03 | Medium | High | Sequential dependency enforced: TASK-03 blocked by TASK-02 |
| TASK-S02 finds test suite breakage broader than anticipated | Medium | Medium | CHECKPOINT-A re-plans TASK-10 with expanded scope; docs-lint advisory mode limits blast radius |
| proposed-target-model.md not completed before TASK-01 begins | Medium | High | TASK-01 explicitly depends on TASK-00; build gate blocks task execution without TASK-00 complete |
| cmd-start.md Gate C is functional logic, not just naming — naive rename breaks gate | Medium | High | TASK-10 Scouts step checks gate semantics before patching; TASK-S10 flags functional gates separately |
| Aggregate pack S4 integration requires loop-spec changes (not just docs) | Medium | Medium | TASK-S07 resolves this before TASK-07 executes; if loop-spec change needed, TASK-07 scope expands with plan update |
| docs-lint.ts modified in current working tree — TASK-06 conflicts | Low | Medium | Coordinate: TASK-06 must rebase on latest docs-lint.ts state before adding hygiene check |

## Observability
- Logging: Contract lint output after each wave (startup-loop lint + docs lint).
- Metrics: Stage ID count in loop-spec.yaml (before/after TASK-02/03); artifact-registry row count (before/after TASK-07/08).
- Alerts/Dashboards: None: internal tooling.

## Acceptance Criteria (overall)
- [ ] `loop-spec.yaml` contains PRODUCTS-01..07, LOGISTICS-01..07, MARKET-01..11, SELL-01..08 (SELL-02→SELL-08 renamed; SELL-02..07 inserted), IDEAS-01..03.
- [ ] `two-layer-model.md` exists and is Status: Active.
- [ ] IDEAS-01..03 stages in `loop-spec.yaml` (stage-gated); `ideas/` directory exists with schema docs + handoff contract.
- [ ] `carry-mode-schema.md` exists with `link`/`revision` taxonomy.
- [ ] `hygiene-schema.md` exists and docs-lint hygiene check is active.
- [ ] `loop-output-contracts.md` defines four loop output artifacts.
- [ ] `aggregate-pack-contracts.md` defines four aggregate packs.
- [ ] `artifact-registry.md` updated with loop output + aggregate pack entries.
- [ ] `lp-do-build/SKILL.md` Plan Completion requires standing-pack update or documented exception.
- [ ] `pnpm -w run lint:startup-loop` passes.
- [ ] `pnpm -w run docs:lint` passes.
- [ ] Startup-loop targeted test suite passes.
- [ ] No legacy "S2/S6 deep research" naming in skill docs (verified by TASK-10 TC-01).

## Decision Log
- 2026-02-22: Phased migration approach — additive where logical order not disrupted; targeted renaming where needed.
- 2026-02-22: **Decision 1 (LOGISTICS)**: Conditional by business profile (`physical-product` or `logistics-heavy` profiles only) — operator confirmed.
- 2026-02-22: **Decision 2 (IDEAS)**: Stage-gated (Option A) — IDEAS-01..03 added as formal loop stages for long-term enforcement discipline — operator confirmed ("whatever is best long term").
- 2026-02-22: **Decision 3 (MARKET/SELL numbering)**: MARKET additive (MARKET-07..11 appended, no renumber). SELL resequenced: SELL-02 renamed to SELL-08; new SELL-02..07 inserted — operator confirmed ("resequence when needed, not if not needed").

## Overall-confidence Calculation
- S=1, M=2, L=3
- Tasks and weights: TASK-00 (92%×1), TASK-01 (80%×1), TASK-S02 (90%×1), TASK-02 (80%×3), TASK-03 (80%×3), TASK-04 (76%×3), TASK-05 (82%×1), TASK-06 (80%×2), TASK-08 (82%×2), CHECKPOINT-A (95%×1), TASK-S07 (90%×1), TASK-S10 (90%×1), TASK-07 (80%×2), TASK-09 (80%×2), TASK-10 (82%×2)
- Sum weighted: 92+80+90+240+240+228+82+160+164+95+90+90+160+160+164 = 2135
- Sum weights: 1+1+1+3+3+3+1+2+2+1+1+1+2+2+2 = 26
- Overall-confidence = 2135/26 = **82%**

## Section Omission Rule
- Observability section is minimal: this is a docs/contracts migration, not a runtime system change.
