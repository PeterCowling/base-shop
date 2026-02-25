---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Product
Created: 2026-02-20
Last-updated: 2026-02-20 (critique-rev-2, questions-resolved)
Feature-Slug: startup-loop-pre-s0-problem-framing
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-plan
Supporting-Skills: lp-sequence
Related-Plan: docs/plans/startup-loop-pre-s0-problem-framing/plan.md
Business-OS-Integration: off
Business-Unit: PLAT
Card-ID: none
---

# Startup Loop Pre-S0 Problem Framing Fact-Find Brief

## Scope
### Summary
Current startup-loop entry assumes the operator already selected a product before S0. The loop has no explicit product-selection phase for operators who start from a problem statement. This brief proposes a conditional pre-intake sequence that captures problem framing, evaluates candidate product types, records kill decisions, and then hands a selected product into existing S0 intake.

### Goals
- Add an explicit problem-to-product selection path before S0.
- Preserve current S0-first path for operators with an already committed product.
- Keep GATE-BD-00 naming contract compatible with existing `*-candidate-names.user.md` behavior.
- Produce plan-ready scope for loop spec, skill, prompt, and contract updates.

### Non-goals
- Replacing S2 market intelligence depth with a new research system.
- Changing post-S0 sequencing (S1 through S10).
- Reworking demand-evidence, measurement, or S10 orchestration contracts.
- Introducing a new naming artifact contract that breaks existing gate logic.

### Constraints & Assumptions
- Constraints:
  - Canonical stage IDs must match startup-loop contracts and downstream tooling (`docs/business-os/startup-loop/stage-operator-dictionary.schema.json:46`).
  - Stage ordering authority remains `docs/business-os/startup-loop/loop-spec.yaml` (`docs/business-os/startup-loop/process-registry-v2.md:33` and loop-spec header rules).
  - Naming gate behavior is filesystem-driven by shortlist artifacts (`.claude/skills/startup-loop/modules/cmd-advance.md:24`).
  - Skill discovery uses generated registry `.agents/registry/skills.json` (not manual ad-hoc registration) (`.claude/SKILLS_INDEX.md:8`).
- Assumptions:
  - Operators starting from a problem need a lightweight pre-S0 scaffold more than deep automation.
  - New pre-S0 stages should be conditional and skipped for committed-product flows.
  - Existing prompt-handoff model is sufficient for early solution-profiling and competition scans.

## Evidence Audit (Current State)
### Entry Points
- `.claude/skills/startup-loop/modules/cmd-start.md:5` - startup-loop start requires `--business`.
- `.claude/skills/startup-loop/modules/cmd-start.md:6` - startup-loop start requires `--mode`.
- `.claude/skills/startup-loop/modules/cmd-start.md:7` - startup-loop start requires `--launch-surface`.
- `docs/business-os/workflow-prompts/_templates/intake-normalizer-prompt.md:27` - S0 intake normalizer converts products into structured list.
- `docs/business-os/startup-baselines/_templates/intake-packet-template.md:31` - intake template expects `Product 1`.
- `docs/business-os/startup-baselines/_templates/intake-packet-template.md:33` - intake template expects `Product 2` or fallback.
- `.claude/skills/startup-loop/modules/cmd-advance.md:19` - GATE-BD-00 is naming-only at S0->S1.
- `docs/business-os/startup-loop/loop-spec.yaml:43` - stage graph begins at `S0`.

### Key Modules / Files
- `docs/business-os/startup-loop/loop-spec.yaml` - authoritative stage graph, ordering, run packet fields.
- `docs/business-os/startup-loop/stage-operator-dictionary.yaml` - canonical stage dictionary used to generate addressing views.
- `scripts/src/startup-loop/stage-addressing.ts` - CLI stage resolver; CANONICAL_IDS built dynamically from generated map — only the hardcoded suggestion string at :72 requires manual update on stage additions.
- `scripts/src/startup-loop/__tests__/stage-addressing.test.ts` - regression suite for accepted stage IDs.
- `.claude/skills/startup-loop/modules/cmd-advance.md` - hard-gate contract including naming gate behavior.
- `.claude/skills/idea-forecast/SKILL.md` - requires `Products` as input.
- `.claude/skills/idea-readiness/SKILL.md` - readiness gates with no product-selection gate.
- `.claude/skills/lp-offer/SKILL.md` - S2B offer design for chosen offer hypothesis.
- `.claude/skills/lp-other-products/SKILL.md` - adjacent-product expansion after offer exists.
- `docs/business-os/startup-baselines/HEAD-2026-02-12assessment-intake-packet.user.md` - real intake example with chosen product recorded as observed.

### Patterns & Conventions Observed
- Product choice is pre-assumed before S0:
  - S0 tooling collects and normalizes product fields; it does not evaluate candidate product types (`docs/business-os/workflow-prompts/_templates/intake-normalizer-prompt.md:27`).
- Front-end hard gate currently covers naming only:
  - GATE-BD-00 blocks on missing naming shortlist when name is unconfirmed (`.claude/skills/startup-loop/modules/cmd-advance.md:42`).
- Existing ecosystem skills assume product already selected:
  - `idea-forecast` requires product list input (`.claude/skills/idea-forecast/SKILL.md:32`).
  - `lp-offer` designs offer hypothesis rather than product selection (`.claude/skills/lp-offer/SKILL.md:8`).
  - `lp-other-products` explicitly runs after offer stage for expansion (`.claude/skills/lp-other-products/SKILL.md:12`).
- Canonical stage contract is strict and shared:
  - Stage ID format is constrained (`docs/business-os/startup-loop/stage-operator-dictionary.schema.json:46`).
  - Resolver/tests and other typed components reference fixed stage universe (`scripts/src/startup-loop/stage-addressing.ts:72`, `scripts/src/startup-loop/__tests__/stage-addressing.test.ts:22`, `scripts/src/startup-loop/bottleneck-detector.ts:13`).
- In-practice gap example exists:
  - HEAD intake records product as observed without explicit problem-to-options decision artifact (`docs/business-os/startup-baselines/HEAD-2026-02-12assessment-intake-packet.user.md:32`).
- Stage-spec-to-map pipeline is already drifted (live, pre-existing):
  - `loop-spec.yaml` has local v1.6.0 changes (S3B added, decision: 2026-02-20) but `docs/business-os/startup-loop/_generated/stage-operator-map.json` is stamped `_loop_spec_version: "1.3.0"` and does not include S3B.
  - `CANONICAL_IDS` in `scripts/src/startup-loop/stage-addressing.ts` is built dynamically from the generated map; because the map is stale, S3B is not resolvable as a canonical stage ID.
  - This is a live instance of the blast-radius scenario described in Dependency & Impact Map: spec updated without dictionary/map/resolver propagation.
  - The contract-first update sequence for S0A–S0D must address this pre-existing S3B drift before or alongside the new stage additions.

### Data & Contracts
- Stage ID contract: `^S[0-9]+[A-Z]*$` (`docs/business-os/startup-loop/stage-operator-dictionary.schema.json:46`).
- Naming gate pass artifact: `docs/business-os/strategy/<BIZ>/*-candidate-names.user.md` (`.claude/skills/startup-loop/modules/cmd-advance.md:35`).
- Naming stable pointer: `latest-candidate-names.user.md` (`.claude/skills/startup-loop/modules/cmd-advance.md:71`).
- Run packet currently includes `naming_gate` but no product-selection gate field (`docs/business-os/startup-loop/loop-spec.yaml:296`).
- Skill registry update path is generated via `scripts/agents/generate-skill-registry --write` (`.claude/SKILLS_INDEX.md:19`).

### Dependency & Impact Map
- Upstream dependencies:
  - Loop spec authority files (`loop-spec.yaml`, stage dictionary + generated map).
  - Startup-loop command modules (`cmd-start`, `cmd-advance`) and stage addressing resolver.
- Downstream dependents:
  - Startup-loop wrapper skill behavior and stage navigation.
  - Generated stage maps/tables used by resolvers and operator surfaces.
  - Planning/build skills that expect canonical routing headers and stage identities.
- Likely blast radius:
  - Medium-High if stage IDs are introduced with non-canonical format.
  - Medium if naming gate contract is altered to non-standard artifact names.
  - Medium if new skills are added without registry regeneration.

### Test Landscape
#### Test Infrastructure
- Stage-addressing regression tests:
  - `scripts/src/startup-loop/__tests__/stage-addressing.test.ts`
- Stage-addressing runtime resolver:
  - `scripts/src/startup-loop/stage-addressing.ts`
- Static contract files:
  - `docs/business-os/startup-loop/loop-spec.yaml`
  - `docs/business-os/startup-loop/stage-operator-dictionary.schema.json`

#### Existing Test Coverage
| Area | Test Type | Files/Commands | Coverage Notes |
|---|---|---|---|
| Canonical stage ID resolution | Unit | `scripts/src/startup-loop/__tests__/stage-addressing.test.ts` | Locks current canonical stage IDs and alias behavior |
| Stage ID parsing guidance | Runtime logic | `scripts/src/startup-loop/stage-addressing.ts` | Failure guidance currently enumerates known IDs |
| Stage ID schema format | Schema contract | `docs/business-os/startup-loop/stage-operator-dictionary.schema.json` | Enforces `S<number><suffix>` ID shape |
| Naming gate artifact contract | Skill contract | `.claude/skills/startup-loop/modules/cmd-advance.md` | Defines shortlist-driven pass/block behavior |

#### Coverage Gaps
- No contract test currently asserts behavior for a pre-S0 conditional stage family.
- No test currently validates interaction between new pre-S0 stage(s) and GATE-BD-00 shortcut expectations.
- No test currently guards `run_packet` extension compatibility for a product-selection gate field.

#### Testability Assessment
- Easy to test:
  - Schema validity and stage-addressing updates.
  - Gate contract preservation for naming shortlist files.
- Hard to test:
  - End-to-end operator flow for both entry paths (problem-first vs product-first) without fixture expansion.
- Test seams needed:
  - Stage-addressing fixture updates for added stage IDs.
  - Startup-loop command-level tests for conditional pre-S0 path skip/run behavior.

### Recent Git History (Targeted)
Targeted `git log` run on `docs/business-os/startup-loop/loop-spec.yaml`:

| Commit | Date | Subject |
|---|---|---|
| `2c2f55d` | 2026-02-18 | feat(startup-loop): complete capability gap audit plan — TASK-18, TASK-19, TASK-12 |
| `751cbf8` | 2026-02-17 | feat(startup-loop): infra + measurement bootstrap plan — all 8 tasks complete |
| `1448836` | 2026-02-17 | feat(startup-loop): add business naming gate (GATE-BD-00) with deep-research prompt handoff |
| `933c5ad` | 2026-02-17 | feat(startup-loop-branding-design-module): loop-spec.yaml BD-3 annotation + v1.1.0 |
| `3a97532` | 2026-02-13 | feat(startup-loop): add loop-spec.yaml and align all docs to 17-stage canonical model (LPSP-02) |

Note: `stage-operator-map.json` was last touched in commit `2c2f55d` (same as loop-spec). Since then, loop-spec.yaml has received uncommitted local edits advancing it to v1.6.0 (S3B addition). The map has not been regenerated, producing the pre-existing drift identified in Patterns & Conventions Observed.

## Gap Statement
The startup loop currently starts from S0 Intake and assumes a product is already selected. For operators who start from a customer/problem statement, there is no canonical pre-intake stage to evaluate competing product options, record kill decisions, or preserve a decision rationale before downstream offer, forecast, and channel work.

## Proposed Approach
### Current flow (condensed)
```text
[Operator decides product outside loop]
  -> S0 Intake
  -> S1 Readiness
  -> S2 Market intelligence
  -> S2B Offer design
  -> S3/S6B ...
```

### Proposed flow (conditional pre-S0 path)
```text
[If operator starts from problem]
  -> S0A Problem framing
  -> S0B Solution-profiling scan
  -> S0C Option selection + kill decisions
  -> S0D Naming handoff (existing shortlist contract)
  -> S0 Intake (selected product now explicit)
  -> existing loop unchanged
```

Operators who start with a committed product skip `S0A-S0D` and enter S0 directly.

### Stage design (pre-S0 path)
- `S0A` Problem framing:
  - Output: explicit problem statement, affected user groups, severity/frequency, current workarounds, evidence pointers.
  - Kill condition: problem not meaningful enough for viable business.
- `S0B` Solution-profiling scan:
  - Output: 5-10 candidate product-type options with rough feasibility/regulatory flags.
  - Kill condition: candidate-level hard blockers.
- `S0C` Option selection:
  - Output: shortlist of 1-2 options plus elimination rationale for dropped options.
  - Kill gate: explicit decision record required to continue.
- `S0D` Naming handoff:
  - Reuse existing naming research and shortlist artifact contract.
  - Do not introduce a new naming file contract that bypasses `*-candidate-names.user.md`.

## Contract Compatibility Rules
- Stage IDs must remain canonical (`S0A`, `S0B`, `S0C`, `S0D`) instead of non-canonical labels such as `SPA/SPB/SPC/SPD`.
- GATE-BD-00 should remain shortlist-driven:
  - Keep `*-candidate-names.user.md` as pass artifact.
  - Keep `latest-candidate-names.user.md` pointer write.
- Any new pre-S0 metadata must be additive and backward-compatible for existing S0-first flows.
- Skill registration must follow generated registry workflow (`scripts/agents/generate-skill-registry --write`).

## Loop Spec Change Surface
### Required spec updates
- Add conditional stages `S0A-S0D` in `docs/business-os/startup-loop/loop-spec.yaml`.
- Add sequential edges:
```yaml
- [S0A, S0B]
- [S0B, S0C]
- [S0C, S0D]
- [S0D, S0]
```
- Preserve existing `S0 -> S1` onward sequence.
- Add `conditional: true` and `condition: "start-point = problem"` to S0A–S0D, mirroring the existing pattern (`condition: "launch-surface = pre-website"` on S1B, `condition: "launch-surface = website-live"` on S2A):
  ```yaml
  conditional: true
  condition: "start-point = problem"
  ```
- Skip semantics: `--start-point product` (or omitted, default) causes S0A–S0D to be skipped; loop-spec expresses this as a pass-through with no gate block, identical to how S1B is skipped for `launch-surface = website-live`.

### Required contract updates outside loop-spec
- Add `--start-point problem|product` as an optional arg to `.claude/skills/startup-loop/modules/cmd-start.md` (default: `product`, backward-compatible). Add Gate D: when `--start-point = problem`, verify S0A entry conditions before dispatching; when `product` or omitted, skip S0A–S0D and proceed directly to S0.
- Update `docs/business-os/startup-loop/stage-operator-dictionary.yaml` for `S0A-S0D`.
- Regenerate `docs/business-os/startup-loop/_generated/stage-operator-map.json` and table views by running: `node --import tsx scripts/src/startup-loop/generate-stage-operator-views.ts` (command sourced from map `_note` field). This is a separate script from the skill registry generator — do not conflate.
- Update hardcoded stage suggestion string at `scripts/src/startup-loop/stage-addressing.ts:72`. Note: `CANONICAL_IDS` is built dynamically from the generated map and requires no manual edit — map regeneration is sufficient for runtime resolution. The suggestion string in error messages is the only surgical edit needed in this file.
- Update tests that assert the canonical stage set:
  - `scripts/src/startup-loop/__tests__/stage-addressing.test.ts`
  - Any strongly typed stage unions that assume a fixed stage set (for example `scripts/src/startup-loop/bottleneck-detector.ts`).

### Optional additive run packet field
```yaml
product_selection_gate: skipped | blocked | complete
```
If added, it should mirror `naming_gate` semantics and default to `skipped` for direct S0 entry.

## New Skills Required
| Skill | Produces | Invocation point |
|---|---|---|
| `lp-problem-frame` | `docs/business-os/strategy/<BIZ>/problem-statement.user.md` | `S0A` |
| `lp-solution-profiling` | `docs/business-os/strategy/<BIZ>/s0b-solution-profiling-prompt.md` and results artifact | `S0B` |
| `lp-option-select` | `docs/business-os/strategy/<BIZ>/solution-select.user.md` | `S0C` |

`brand-naming-research` remains the naming prompt generator used in `S0D`, with shortlist output remaining `*-candidate-names.user.md` for GATE-BD-00 compatibility.

## Questions
### Resolved
- Q: Does current S0 intake require already-decided product fields?
  - A: Yes.
  - Evidence: `docs/business-os/workflow-prompts/_templates/intake-normalizer-prompt.md:27`, `docs/business-os/startup-baselines/_templates/intake-packet-template.md:31`.
- Q: Is there a pre-S0 product-selection gate in current loop spec?
  - A: No.
  - Evidence: `docs/business-os/startup-loop/loop-spec.yaml:43`.
- Q: Does existing hard gate logic already support pre-completed naming via shortlist artifacts?
  - A: Yes.
  - Evidence: `.claude/skills/startup-loop/modules/cmd-advance.md:35`, `.claude/skills/startup-loop/modules/cmd-advance.md:71`.
- Q: Should pre-S0 entry be declared by an explicit flag or inferred from intake content?
  - A: **Explicit flag** — `--start-point problem|product` added as an optional arg to `cmd-start`, defaulting to `product` for backward compatibility. Consistent with `--launch-surface` pattern. Inference rejected: boundary cases (vague product idea vs. genuine problem-first) are ambiguous under inference and produce non-deterministic routing.
  - Decision owner: Platform owner. Decided: 2026-02-20.
  - Impact: cmd-start gains a new optional arg; Gate D added to cmd-start for `--start-point problem`; loop-spec `condition:` for S0A–S0D is `"start-point = problem"`.
- Q: Should `S0A-S0D` be first-class canonical stages or an internal S0 subprocess?
  - A: **First-class canonical stages.** Consistent with S1B, S2A, S3B — all conditional but canonical. Subprocess rejected: current stack (stage addressing resolver, map generator, operator map) has no nested-stage infrastructure; implementing it would require more work for less observability.
  - Decision owner: Platform owner. Decided: 2026-02-20.
  - Impact: stage-operator-dictionary.yaml and generated map must include S0A–S0D as full entries; resolver and typed unions update as per Loop Spec Change Surface.

### Open (User Input Needed)
None.

## Confidence Inputs
- Implementation: 82%
  - Evidence basis: impacted contracts and files are identified with explicit entry points.
  - To >=90: add a concrete file-by-file patch plan for stage dictionary generation and resolver tests.
- Approach: 90%
  - Evidence basis: conditional pre-S0 path preserves existing S0-first behavior while adding missing decision scaffold. Entry routing decision locked (explicit `--start-point` flag, consistent with `--launch-surface` pattern). Stage representation decision locked (first-class canonical stages, consistent with S1B/S2A/S3B pattern).
  - To >=95: pilot with one business and verify S0A–S0C artifact quality at S0 handoff.
- Impact: 84%
  - Evidence basis: directly addresses documented intake assumption gap without changing post-S0 workflow.
  - To >=90: pilot with one business and verify artifact quality at S0 handoff.
- Delivery-Readiness: 81%
  - Evidence basis: pre-existing S3B pipeline drift identified and pre-conditioned (task seed #0); no additional hard blockers found; scope and dependencies are clear.
  - To >=90: confirm S3B propagation complete; capture full affected-file list for all stage-ID consumers beyond resolver/tests.
- Testability: 80%
  - Evidence basis: strong seam coverage for stage IDs and gate artifacts exists, but pre-S0 flow tests are missing.
  - To >=90: add command-level tests for both entry paths and gating transitions.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Non-canonical stage IDs break resolver and stage contracts | Medium | High | Use `S0A-S0D` format and update dictionary + resolver + tests together |
| Naming gate regression from new artifact names | Medium | High | Keep `*-candidate-names.user.md` as canonical pass artifact; avoid alternate SPD-only filename contracts |
| Added stage complexity increases operator confusion | Medium | Medium | Add explicit skip/run rule and concise operator guide examples for both start modes |
| Typed stage unions become stale after stage additions | Medium | Medium | Grep and update all typed stage enumerations in same task wave |
| S0B solution-profiling scan anchors operator on unvalidated product before S2 market intel | Medium | High | Cap S0B output format to candidate rows with feasibility flag only; no demand scoring until S2 |
| Skill registry drift hides new skills | Low-Medium | Medium | Regenerate `.agents/registry/skills.json` via canonical script in same change set |

## Planning Constraints & Notes
- Pre-conditions:
  - The stage-spec-to-map pipeline has pre-existing drift: loop-spec.yaml is at v1.6.0 (S3B added locally, uncommitted) but `_generated/stage-operator-map.json` is at v1.3.0 and does not include S3B. Propagate S3B through dictionary → map regeneration → resolver error-string update before or in the same task wave as S0A–S0D.
  - Resolve Open Q1 (flag vs. inference) before writing task seeds 1 and 6.
- Must-follow patterns:
  - Preserve loop-spec as stage-ordering source of truth.
  - Keep GATE-BD-00 shortlist contract unchanged.
  - Keep pre-S0 path conditional and non-breaking for direct S0 users.
- Rollout/rollback expectations:
  - Rollout as contract-first sequence: spec/dictionary/resolver/tests before operator-facing guide updates.
  - Rollback by removing `S0A-S0D` from spec and dictionary, then reverting resolver/test changes as one atomic revert.
- Observability expectations:
  - Stage status and next-stage display fields must resolve for new IDs.
  - Pre-S0 decision artifacts should be discoverable in strategy paths with stable naming.

## Suggested Task Seeds (Non-binding)
0. Propagate S3B through stage-operator-dictionary → map regeneration → resolver error-string update (fixes pre-existing drift before S0A–S0D additions land on top of a stale pipeline).
1. Add pre-S0 stage contract (`S0A-S0D`) to `loop-spec.yaml` with conditional routing and ordering (requires Q1 resolved for skip-condition syntax).
2. Add/validate stage dictionary entries and regenerate stage operator map/table outputs.
3. Update stage addressing resolver and tests for new canonical stage IDs.
4. Implement `lp-problem-frame`, `lp-solution-profiling`, and `lp-option-select` skill scaffolds.
5. Integrate `S0D` naming handoff with existing `brand-naming-research` and shortlist contract.
6. Add `--start-point problem|product` optional arg and Gate D to `.claude/skills/startup-loop/modules/cmd-start.md`; default `product` for backward compatibility.
7. Regenerate skill registry via `scripts/agents/generate-skill-registry --write`.
8. Update `docs/agents/feature-workflow-guide.md` with a concise pre-S0 entry section.

## Execution Routing Packet
- Primary execution skill:
  - `lp-plan`
- Supporting skills:
  - `lp-sequence`
- Deliverable acceptance package:
  - Pre-S0 conditional path exists and is contract-valid.
  - Existing S0-first path remains unchanged and tested.
  - Naming gate compatibility preserved with shortlist artifact contract.
  - Stage addressing and typed stage consumers are updated and green.
- Post-delivery measurement plan:
  - Run one dry-run startup-loop progression for problem-first mode and one for product-first mode.
  - Track gate outcomes (`naming_gate`, optional `product_selection_gate`) for first adoption cycle.
  - Monitor for resolver failures on new stage IDs in CI.

## Evidence Gap Review
### Gaps Addressed
- Confirmed startup-loop entry and intake contracts currently assume preselected products.
- Confirmed no existing pre-S0 product-selection stage in loop spec.
- Confirmed naming gate artifact contract and stable pointer behavior.
- Confirmed stage-ID contract constraints and concrete downstream consumers.

### Confidence Adjustments
- Increased implementation confidence by replacing non-canonical `SPA/SPB/SPC/SPD` with canonical `S0A-S0D`.
- Increased compatibility confidence by removing proposal to add non-standard naming gate artifacts.
- Increased planning handoff quality by adding missing routing frontmatter fields, including `Deliverable-Type`.

### Remaining Assumptions
- Explicit problem-vs-product entry signal will be accepted in startup-loop UX.
- Pre-S0 artifacts can stay lightweight enough to avoid duplicating S2 depth.
- Stage-addition blast radius remains manageable with contract-first sequencing.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - none
- Recommended next step:
  - `/lp-plan docs/plans/startup-loop-pre-s0-problem-framing/fact-find.md`

## Section Omission Rule
None: all template sections above are relevant for this run.
