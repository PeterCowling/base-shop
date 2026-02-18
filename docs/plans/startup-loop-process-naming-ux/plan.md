---
Type: Plan
Status: Superseded
Domain: Venture-Studio
Workstream: Mixed
Created: 2026-02-17
Last-reviewed: 2026-02-17
Last-updated: 2026-02-17
Relates-to charter: docs/business-os/business-os-charter.md
Superseded-by: docs/plans/startup-loop-marketing-sales-capability-gap-audit/plan.md
Feature-Slug: startup-loop-process-naming-ux
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-build
Supporting-Skills: lp-sequence
Overall-confidence: 83%
Confidence-Method: min(Implementation,Approach,Impact); overall effort-weighted (S=1, M=2, L=3)
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: BOS
Card-ID: none
---

# Startup Loop Process Naming UX Plan (Superseded)

## Summary

This plan hardens startup-loop stage naming for operator UX while keeping canonical runtime IDs
(`S0..S10`, `S1B`, `S6B`, etc.) stable. The work introduces a canonical stage dictionary with
generated operator views, so labels stop drifting across docs and skills. It also adds fail-closed
stage addressing (`--stage`, `--stage-alias`) and strict compatibility behavior for `--stage-label`
(exact match only, no fuzzy matching).

The plan is mixed-track because it combines business artifacts (operator docs/skill contracts) with
code guardrails (generator, lint, tests). Final success is measured by deterministic naming outputs
and faster operator comprehension on run-packet samples.

This plan is superseded and merged into the canonical unified plan:
`docs/plans/startup-loop-marketing-sales-capability-gap-audit/plan.md`.

## Goals

- Keep stage IDs runtime-stable while making operator surfaces meaning-first.
- Define a canonical stage dictionary schema with explicit required fields and quality gates.
- Generate stage tables/snippets from one source to prevent label drift.
- Add non-breaking run-packet display fields (`*_label`, `*_display`) for UX clarity.
- Standardize stage addressing on `--stage` and `--stage-alias`, with strict `--stage-label`
  compatibility behavior.
- Add lint/tests so naming regressions fail in validation, not in operator use.

## Non-goals

- Renaming canonical stage IDs or changing startup-loop ordering semantics.
- Changing gate logic or stage execution behavior unrelated to naming/addressing.
- Localizing stage labels in this tranche.
- Retrofitting all historical docs immediately.

## Constraints & Assumptions

- Constraints:
  - Runtime stage IDs remain canonical and unchanged.
  - Naming improvements must be additive and backwards-compatible at contract boundaries.
  - Generated views are authoritative for operator-facing stage lists; manual duplicates are
    disallowed after rollout.
  - `--stage-label` cannot be fuzzy-matched.
- Assumptions:
  - Operator UX default should be label-first with ID-secondary.
  - `S6B` and other composite stages require operator microsteps for instant comprehension.
  - Existing startup-loop test surfaces (`scripts` + `packages/mcp-server`) are sufficient to add
    deterministic naming/addressing checks.

## Fact-Find Reference

- Related brief: `docs/plans/startup-loop-process-naming-ux/fact-find.md`
- Key findings used:
  - Stage IDs are currently exposed as primary operator labels in multiple surfaces.
  - `A/B` suffixes and composite stages create taxonomy friction for non-technical operators.
  - No canonical naming dictionary exists; labels are duplicated manually.
  - Free-form `--stage-label` matching is unsafe; deterministic aliasing is preferred.
  - Required contract additions were identified: `current_stage_display`, `current_stage_label`,
    `next_stage_display`, `next_stage_label`.

## Proposed Approach

**Option A (rejected):** docs-only relabeling without schema/generation. Lower effort, but drift
returns quickly and enforcement stays weak.

**Option B (chosen):** canonical dictionary + generator + additive contract fields + alias
addressing + lint/tests. Higher effort, but directly resolves drift and ambiguity at source.

**Option C (rejected):** rename stage IDs for UX clarity. Breaks runtime contract and downstream
consumers with no compensating reliability gain.

Chosen approach: Option B.

## Plan Gates

- Foundation Gate: Pass
  - Fact-find includes required planning metadata and explicit confidence inputs.
  - Mixed-track evidence present:
    - code-side test landscape: `scripts/src/startup-loop/__tests__/`,
      `scripts/src/docs-lint.test.ts`, `packages/mcp-server/src/__tests__/`
    - business-side validation landscape: operator packet comprehension hypothesis + label quality gate.
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No
  - `Auto-Build-Intent` is `plan-only` and includes a checkpoint boundary.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | INVESTIGATE | Map startup-loop stage addressing and packet emission surfaces | 80% | S | Pending | - | TASK-06 |
| TASK-02 | IMPLEMENT | Create canonical stage dictionary schema + dataset | 85% | M | Pending | - | TASK-03 |
| TASK-03 | IMPLEMENT | Build deterministic stage-view generator and generated artifacts | 83% | M | Pending | TASK-02 | TASK-04, TASK-06, TASK-07 |
| TASK-04 | IMPLEMENT | Integrate label-first naming + derived run-packet display fields | 81% | L | Pending | TASK-03 | TASK-05, TASK-07 |
| TASK-05 | CHECKPOINT | Reassess downstream scope after contract/doc integration | 95% | S | Pending | TASK-04 | TASK-06 |
| TASK-06 | IMPLEMENT | Implement fail-closed stage addressing (`--stage-alias`, strict `--stage-label`) | 82% | M | Pending | TASK-01, TASK-03, TASK-05 | TASK-07 |
| TASK-07 | IMPLEMENT | Add lint/tests + operator comprehension pilot evidence | 80% | M | Pending | TASK-03, TASK-04, TASK-06 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | - | Discovery and dictionary definition run independently |
| 2 | TASK-03 | TASK-02 | Generator depends on dictionary schema/dataset |
| 3 | TASK-04 | TASK-03 | Integrate generated naming into contracts/docs |
| 4 | TASK-05 | TASK-04 | Checkpoint before parser/addressing hardening |
| 5 | TASK-06 | TASK-01, TASK-03, TASK-05 | Addressing implementation depends on mapped surfaces + checkpoint confirmation |
| 6 | TASK-07 | TASK-03, TASK-04, TASK-06 | Guardrails and pilot after full contract/addressing integration |

---

## Tasks

---

### TASK-01: Map startup-loop stage addressing and packet emission surfaces
- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/startup-loop-process-naming-ux/artifacts/2026-02-17-stage-addressing-surface-map.md`
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `.claude/skills/startup-loop/SKILL.md`, `docs/business-os/startup-loop/loop-spec.yaml`, `scripts/src/startup-loop/derive-state.ts`, `packages/mcp-server/src/tools/loop.ts`, `packages/mcp-server/src/tools/policy.ts`
- **Depends on:** -
- **Blocks:** TASK-06
- **Confidence:** 80%
  - Implementation: 85% - files are known and searchable
  - Approach: 80% - one pass can isolate authoritative vs generated vs consumer surfaces
  - Impact: 80% - removes ambiguity before command-addressing changes
- **Questions to answer:**
  - Where is stage addressing actually parsed/enforced today (skill-only vs executable code path)?
  - Which surfaces emit/consume run-packet stage fields and must adopt `*_label`/`*_display`?
  - Which stage-name maps are duplicated and should be replaced by generated output?
- **Acceptance:**
  - Surface map document exists and classifies each relevant file as `authoritative`, `generated`, `consumer`, or `legacy`.
  - Document includes one explicit enforcement boundary recommendation for stage-addressing behavior.
  - Document includes migration risk notes for `--stage-label` compatibility.
- **Validation contract:**
  - VC-01: Surface map lists at least 8 concrete files with classification and rationale within one execution cycle.
  - VC-02: Exactly one recommended enforcement boundary is selected and justified against alternatives.
- **Planning validation:**
  - Checks run: `rg` scans for `current_stage`, stage names, and startup-loop command contracts.
  - Validation artifacts: `.claude/skills/startup-loop/SKILL.md`, `docs/business-os/startup-loop/loop-spec.yaml`, `packages/mcp-server/src/tools/loop.ts`.
  - Unexpected findings: no direct `/startup-loop` executable parser was found in `scripts/src/startup-loop`; current contract is skill-first.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** new artifact under this plan slug
- **Notes / references:** `docs/plans/startup-loop-process-naming-ux/fact-find.md`

---

### TASK-02: Create canonical stage dictionary schema and dataset
- **Type:** IMPLEMENT
- **Deliverable:** `docs/business-os/startup-loop/stage-operator-dictionary.yaml` + `docs/business-os/startup-loop/stage-operator-dictionary.schema.json`
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `docs/business-os/startup-loop/stage-operator-dictionary.yaml`, `docs/business-os/startup-loop/stage-operator-dictionary.schema.json`, `[readonly] docs/business-os/startup-loop/loop-spec.yaml`
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** 85%
  - Implementation: 86% - schema + dataset shape is fully defined in fact-find
  - Approach: 85% - one source of truth directly addresses drift
  - Impact: 85% - all downstream naming surfaces inherit consistency
- **Acceptance:**
  - Dictionary includes all 17 stages with required fields:
    `id`, `name_machine`, `label_operator_short`, `label_operator_long`, `outcome_operator`, `aliases`, `display_order`.
  - Optional fields are represented where applicable:
    `operator_next_prompt`, `operator_microsteps`.
  - Composite stage `S6B` has explicit `operator_microsteps`.
  - Alias values are deterministic slugs and globally unique.
  - Dictionary order equals canonical stage order from `loop-spec.yaml`.
- **Validation contract (TC-02):**
  - TC-01: Schema validation passes for canonical dictionary file.
  - TC-02: Duplicate alias fixture fails validation with deterministic error message.
  - TC-03: Stage-order check fails if dictionary order diverges from `loop-spec.yaml`.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: reviewed stage IDs/order in `docs/business-os/startup-loop/loop-spec.yaml`.
  - Validation artifacts: `docs/business-os/startup-loop/loop-spec.yaml`, `docs/plans/startup-loop-process-naming-ux/fact-find.md`.
  - Unexpected findings: `S6B` semantics are composite and require microsteps to avoid ambiguity.
- **Scouts:** None: field set and ordering rules are already defined.
- **Edge Cases & Hardening:**
  - Enforce max length target (`<=28`) for `label_operator_short`.
  - Require unique `outcome_operator` phrasing to reduce stage overlap.
- **What would make this >=90%:**
  - Validate dictionary against one additional independent operator review pass.
- **Rollout / rollback:**
  - Rollout: add canonical dictionary + schema.
  - Rollback: remove dictionary files and revert references.
- **Documentation impact:** startup-loop naming contract now has one canonical source.
- **Notes / references:** fact-find section “Canonical Stage Dictionary Contract (Required)”

---

### TASK-03: Build deterministic stage-view generator and generated artifacts
- **Type:** IMPLEMENT
- **Deliverable:** generation tool + committed generated outputs for operator surfaces
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/generate-stage-operator-views.ts`, `scripts/src/startup-loop/__tests__/generate-stage-operator-views.test.ts`, `docs/business-os/startup-loop/_generated/stage-operator-map.json`, `docs/business-os/startup-loop/_generated/stage-operator-table.md`, `package.json`
- **Depends on:** TASK-02
- **Blocks:** TASK-04, TASK-06, TASK-07
- **Confidence:** 83%
  - Implementation: 84% - repository already uses generator pattern (`contract-migration.generated.ts`)
  - Approach: 83% - generated views remove manual duplication risk
  - Impact: 83% - stable output feeds docs, skill contracts, and parser helpers
- **Acceptance:**
  - Generator reads dictionary and emits deterministic JSON + Markdown views.
  - Re-running generator without input changes produces byte-identical outputs.
  - `package.json` includes a command for regeneration (for CI/local checks).
  - Generated files include source-pointer header comment linking back to dictionary path.
- **Validation contract (TC-03):**
  - TC-01: Determinism check passes (two runs produce identical hash).
  - TC-02: Generator exits non-zero with actionable errors when required dictionary fields are missing.
  - TC-03: Drift check fails when committed generated files are stale.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: reviewed existing generated artifact precedent (`apps/business-os/src/lib/contract-migration.generated.ts`).
  - Validation artifacts: `apps/business-os/scripts/generate-contract-migration.mjs`, `apps/business-os/src/lib/contract-migration.generated.ts`.
  - Unexpected findings: no existing startup-loop stage-label generator exists.
- **Scouts:** None: deterministic generator pattern is established.
- **Edge Cases & Hardening:**
  - Normalize line endings and key ordering to keep deterministic outputs across environments.
- **What would make this >=90%:**
  - Add CI-only drift gate that runs generator and verifies clean git diff.
- **Rollout / rollback:**
  - Rollout: add generator + generated outputs.
  - Rollback: remove generator and generated files; restore manual tables.
- **Documentation impact:** generated table source for workflow/prompt docs.
- **Notes / references:** `docs/business-os/startup-loop/contract-migration.yaml` generation model

---

### TASK-04: Integrate label-first naming and derived run-packet display fields
- **Type:** IMPLEMENT
- **Deliverable:** updated startup-loop contracts + operator docs consuming generated naming views
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Pending
- **Affects:** `docs/business-os/startup-loop/loop-spec.yaml`, `.claude/skills/startup-loop/SKILL.md`, `docs/business-os/startup-loop-workflow.user.md`, `docs/business-os/workflow-prompts/README.user.md`, `scripts/src/startup-loop/derive-state.ts`, `docs/business-os/startup-loop/event-state-schema.md`
- **Depends on:** TASK-03
- **Blocks:** TASK-05, TASK-07
- **Confidence:** 81%
  - Implementation: 82% - affected surfaces are known, but breadth is high
  - Approach: 81% - additive fields plus generated labels is non-breaking if IDs remain canonical
  - Impact: 81% - directly improves operator comprehension while preserving runtime safety
- **Acceptance:**
  - Operator-facing stage lists use label-first display with ID-secondary across touched docs.
  - `loop-spec.yaml` adds/records derived run-packet display fields:
    `current_stage_display`, `current_stage_label`, `next_stage_display`, `next_stage_label`.
  - `loop-spec.yaml` remains valid YAML and references the updated naming contract.
  - `startup-loop/SKILL.md` run packet contract includes the new derived fields and keeps `current_stage` mandatory.
  - `derive-state.ts` no longer hardcodes stage names independently of the canonical dictionary-generated map.
  - Stage ordering in touched operator docs is canonical and monotonic.
- **Validation contract (TC-04):**
  - TC-01: `python3 -c "import yaml; yaml.safe_load(open('docs/business-os/startup-loop/loop-spec.yaml'))"` exits 0.
  - TC-02: `derive-state` tests pass with stage labels sourced from generated map.
  - TC-03: Rendered operator docs contain no table row where raw `S\d+[A-Z]?` appears without adjacent label text.
  - TC-04: Spec version bump and decision reference are updated when run-packet required fields change.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: reviewed current run packet contract and stage model text in `.claude/skills/startup-loop/SKILL.md`.
  - Validation artifacts: `.claude/skills/startup-loop/SKILL.md`, `scripts/src/startup-loop/derive-state.ts`, `docs/business-os/startup-loop-workflow.user.md`.
  - Unexpected findings: `workflow-prompts/README.user.md` still references spec_version `1.0.0`, requiring alignment work.
- **Scouts:** None: integration scope is known from surface map.
- **Edge Cases & Hardening:**
  - Preserve code/log-mode ID-first formatting where needed for support/debugging.
  - Ensure no change to canonical stage IDs in data-plane schemas.
- **What would make this >=90%:**
  - Run one end-to-end dry startup-loop packet generation and verify all new display fields populate.
- **Rollout / rollback:**
  - Rollout: additive contract/doc updates with versioned spec change.
  - Rollback: revert spec/doc updates and keep ID-only display.
- **Documentation impact:** startup-loop workflow and prompt index become generated-label consumers.
- **Notes / references:** fact-find “Operator display rules”, “Runtime Contract Additions”

---

### TASK-05: Horizon checkpoint — reassess downstream parser and guardrail scope
- **Type:** CHECKPOINT
- **Deliverable:** updated downstream execution notes in this plan via `/lp-replan` if assumptions break
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/startup-loop-process-naming-ux/plan.md`
- **Depends on:** TASK-04
- **Blocks:** TASK-06
- **Confidence:** 95%
  - Implementation: 95% - checkpoint process is defined
  - Approach: 95% - avoids locking into wrong parser surface assumptions
  - Impact: 95% - prevents downstream rework
- **Acceptance:**
  - `/lp-build` checkpoint executor run before TASK-06.
  - If assumptions diverged, `/lp-replan` updates TASK-06/TASK-07 with revised dependencies/confidence.
  - Plan re-sequenced after any topology changes.
- **Horizon assumptions to validate:**
  - Stage-addressing enforcement boundary identified in TASK-01 still matches post-TASK-04 architecture.
  - Contract changes in TASK-04 did not introduce new parser consumers requiring additional tasks.
- **Validation contract:** checkpoint closure requires explicit note in this plan that assumptions were either confirmed or replan changes were applied.
- **Planning validation:** None: planning control task.
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** plan update only.

---

### TASK-06: Implement fail-closed stage addressing (`--stage`, `--stage-alias`, strict `--stage-label`)
- **Type:** IMPLEMENT
- **Deliverable:** stage addressing resolver + contract updates with strict compatibility behavior
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/stage-addressing.ts`, `scripts/src/startup-loop/__tests__/stage-addressing.test.ts`, `.claude/skills/startup-loop/SKILL.md`, `docs/business-os/startup-loop/contract-migration.yaml`
- **Depends on:** TASK-01, TASK-03, TASK-05
- **Blocks:** TASK-07
- **Confidence:** 82%
  - Implementation: 83% - resolver behavior is deterministic and testable
  - Approach: 82% - alias-first plus strict label compatibility is safe and user-friendly
  - Impact: 82% - removes free-form command ambiguity and localization brittleness
- **Acceptance:**
  - Stage addressing accepts canonical `--stage <ID>`.
  - Stage addressing accepts deterministic `--stage-alias <slug>`.
  - If `--stage-label` is accepted, behavior is exact-match only against canonical labels.
  - Unknown/ambiguous values fail closed with deterministic suggestions; no fuzzy matching.
  - Compatibility metadata (if used) defines explicit sunset handling for strict label path.
- **Validation contract (TC-06):**
  - TC-01: Valid alias resolves to expected stage ID.
  - TC-02: Unknown alias returns non-success result with suggestion list.
  - TC-03: Near-match label does not resolve; exact canonical label does.
  - TC-04: Canonical stage ID path behavior remains unchanged.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: reviewed existing alias migration artifact and policy preflight behavior.
  - Validation artifacts: `docs/business-os/startup-loop/contract-migration.yaml`, `apps/business-os/src/lib/contract-migration.generated.ts`, `packages/mcp-server/src/tools/policy.ts`.
  - Unexpected findings: existing alias migration currently targets stage keys, not operator stage labels.
- **Scouts:** None: resolver behavior is fully specifiable from dictionary data.
- **Edge Cases & Hardening:**
  - Alias collision rejection must happen at generation/validation time, not resolution time.
  - Label matching must be case-sensitive exact-match only to avoid hidden ambiguity.
- **What would make this >=90%:**
  - Exercise resolver against real operator command transcripts across at least 10 historical examples.
- **Rollout / rollback:**
  - Rollout: deploy strict addressing resolver and update operator contract text.
  - Rollback: keep `--stage` only and disable alias/label adapters.
- **Documentation impact:** startup-loop command examples updated to alias-safe syntax.
- **Notes / references:** fact-find “Submit Command Addressing (Fail-Closed)”

---

### TASK-07: Add guardrails (lint/tests) and capture operator comprehension evidence
- **Type:** IMPLEMENT
- **Deliverable:** lint/test coverage + operator comprehension pilot artifact
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `scripts/src/docs-lint.ts`, `scripts/src/docs-lint.test.ts`, `scripts/src/startup-loop/__tests__/derive-state.test.ts`, `scripts/src/startup-loop/__tests__/generate-stage-operator-views.test.ts`, `scripts/src/startup-loop/__tests__/stage-addressing.test.ts`, `docs/plans/startup-loop-process-naming-ux/artifacts/2026-02-17-stage-label-comprehension-pilot.md`
- **Depends on:** TASK-03, TASK-04, TASK-06
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 81% - checks are straightforward but span code + docs + operator evidence
  - Approach: 80% - guardrails directly prevent regression and drift
  - Impact: 80% - converts UX intent into enforceable quality gates
- **Acceptance:**
  - Docs lint includes rule for operator docs: raw stage IDs outside code blocks require adjacent label text.
  - Tests exist for dictionary schema, generator determinism/drift, and stage-addressing resolver behavior.
  - Pilot artifact records timed comprehension results for label-first packets.
  - Pilot pass threshold: median stage identification time <=10 seconds over at least 5 sample packets.
- **Validation contract (VC-07):**
  - VC-01: Lint seeded-failure fixture triggers expected violation and passes when fixed within one run.
  - VC-02: Targeted tests for new generator/addressing modules pass in `scripts` package.
  - VC-03: Pilot run recorded within 5 business days of implementation; pass if median <=10s over >=5 packets, else file follow-up task in this plan.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: seeded doc and resolver fixtures fail before implementation.
  - Green evidence plan: implement lint/test coverage and rerun targeted checks.
  - Refactor evidence plan: tighten error text and remove brittle test duplication.
- **Planning validation (required for M/L):**
  - Checks run: reviewed current docs lint and test entry points.
  - Validation artifacts: `scripts/src/docs-lint.ts`, `scripts/src/docs-lint.test.ts`, `scripts/package.json`.
  - Unexpected findings: docs-lint currently lacks stage-label adjacency checks.
- **Scouts:** None: validation surfaces already exist.
- **Edge Cases & Hardening:**
  - Ensure regex excludes fenced code blocks to avoid false positives.
  - Ensure pilot timings are captured consistently (same packet set, same instructions).
- **What would make this >=90%:**
  - Repeat pilot with two operators and compare variance.
- **Rollout / rollback:**
  - Rollout: enable lint/test guardrails and commit pilot artifact.
  - Rollback: temporarily downgrade new lint rule to warning while fixing false positives.
- **Documentation impact:** adds operator UX evidence artifact under this plan.
- **Notes / references:** business VC checklist `docs/business-os/_shared/business-vc-quality-checklist.md`

---

## Risks & Mitigations

- **Dictionary drift from manual edits**
  - Mitigation: generator + drift check + lint rule requiring generated outputs.
- **Alias collisions or ambiguous addressing**
  - Mitigation: schema uniqueness constraints and fail-closed resolver behavior.
- **Hidden parser surface not covered by contract updates**
  - Mitigation: TASK-01 surface mapping + TASK-05 checkpoint before TASK-06.
- **Operator confusion persists for composite stages**
  - Mitigation: required `operator_microsteps` for composites and pilot validation threshold.
- **Breaking legacy command habits too abruptly**
  - Mitigation: strict exact-match compatibility for `--stage-label` with explicit migration notes.

## Observability

- Logging:
  - Track stage-address normalization events (where available) and strict-rejection reasons.
- Metrics:
  - alias usage count vs canonical ID usage.
  - docs-lint naming violations per run.
  - comprehension pilot median identification time.
- Alerts/Dashboards:
  - Alert if post-rollout alias/label parsing failures exceed agreed threshold in first 2 weeks.

## Acceptance Criteria (overall)

- [ ] Canonical stage dictionary schema and dataset exist and cover all startup-loop stages.
- [ ] Generated naming views are deterministic and consumed by operator-facing startup-loop surfaces.
- [ ] Run packet contract includes additive display fields while preserving canonical `current_stage`.
- [ ] Stage addressing supports deterministic alias path; free-form label ambiguity is removed.
- [ ] Lint/tests enforce no-drift naming quality gates.
- [ ] Operator comprehension pilot evidence is captured and meets threshold, or follow-up action is logged.

## Decision Log

- 2026-02-17: Keep startup-loop stage IDs stable as runtime contracts; improve UX through additive operator labels and generated views.
- 2026-02-17: Standardize addressing on `--stage` + `--stage-alias`; `--stage-label` remains strict exact-match compatibility only (no fuzzy matching).
- 2026-02-17: Plan mode remains `plan-only`; no automatic handoff to `/lp-build` in this step.

## Overall-confidence Calculation

| Task | Confidence | Effort | Weight |
|---|---:|---|---:|
| TASK-01 | 80% | S | 1 |
| TASK-02 | 85% | M | 2 |
| TASK-03 | 83% | M | 2 |
| TASK-04 | 81% | L | 3 |
| TASK-05 | 95% | S | 1 |
| TASK-06 | 82% | M | 2 |
| TASK-07 | 80% | M | 2 |

Weighted sum: (80×1 + 85×2 + 83×2 + 81×3 + 95×1 + 82×2 + 80×2) / (1+2+2+3+1+2+2) = 1078 / 13 = **83%**
