---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: STRATEGY
Workstream: Mixed
Created: 2026-02-27
Last-updated: 2026-02-27
Feature-Slug: startup-loop-build-reflection-gate
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/startup-loop-build-reflection-gate/plan.md
Dispatch-ID: IDEA-DISPATCH-20260227-0054
artifact: fact-find
---

# Startup Loop Build Reflection Gate — Fact-Find Brief

## Scope

### Summary

The startup loop has no structured post-build reflection step that captures reuse patterns for loop or skill improvement. When a build completes, incidental learnings — such as the need to configure data-source access upfront, repeated ad-hoc discovery steps, or multi-step patterns that are always executed the same way — are lost. Two specific routing requirements are out of scope for the existing `results-review.user.md` template: (1) folding deterministic patterns back into an existing loop stage or skill file, and (2) promoting a recurring ad-hoc pattern into a new named `tool-*` skill. This fact-find scopes where a structured reflection gate should sit, what it must produce, how routing decisions are made, and what concrete tasks the plan should contain.

### Goals

- Determine where in the post-build lifecycle a structured reflection step should sit and what triggers it.
- Define the lightweight artifact the gate produces (fields, required minimum payload, and schema shape).
- Specify routing logic for deterministic pattern → existing loop stage or skill update.
- Specify routing logic for ad-hoc pattern → new `tool-*` skill creation proposal.
- Establish data-source and API access verification as the canonical worked example: which stage owns it, what triggers it, and where it is recorded.
- Produce a planning brief with concrete tasks sufficient for `/lp-do-plan` to produce an actionable plan.

### Non-goals

- Changing the existing `results-review.user.md` contract (the reflection gate is additive, not a replacement).
- Building the full tooling automation in this cycle — this is a schema + process + wiring design.
- Expanding the scope to cover operator-facing process improvements (`process-improvements.user.html`) — that pipeline already exists and is not modified here.

### Constraints and Assumptions

- Constraints:
  - The existing reflection pipeline (`reflection-debt.user.md`, `results-review.user.md`) must not be broken. Any new gate must be additive.
  - The `results-review.user.md` `## New Idea Candidates` section already covers five idea categories (new standing data source, new open-source package, new skill, new loop process, AI-to-mechanistic). The new reflection gate must not duplicate this — it must complement it by adding structured classification and routing.
  - The `lp-do-build` SKILL.md is the canonical producer and must be the location for any instruction changes.
  - Skill creation (new `tool-*` skill) is a significant commitment — the routing criteria must be high-bar and evidence-gated.
  - The `generate-process-improvements.ts` script is a deterministic emitter — any new data it consumes must arrive via a stable structured input, not prose.

- Assumptions:
  - The operator intends the new gate to run inline inside `/lp-do-build` at plan completion (same location as `build-record.user.md` and `reflection-debt.user.md` production), not as a separate invocation.
  - "Deterministic patterns" means steps that are always executed identically (sequence is fixed, inputs are known, output is predictable) — suitable for loop stage insertion or skill file amendment.
  - "Ad-hoc patterns" means steps that are contextual and LLM-reasoned each time but follow a recognisable skeleton — suitable for new skill codification.
  - Data-source/API access verification is the primary worked example and the first pattern the schema should be tested against.

---

## Outcome Contract

- **Why:** Every build is an opportunity to identify what could be done more easily next time — e.g. ensuring API access or agent access is set up, not rediscovered mid-task. Deterministic patterns should be folded into the startup loop; ad-hoc/non-deterministic patterns should become new `tool-*` skills.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A structured post-build reflection gate is defined, schema-specified, and wired into `/lp-do-build` completion steps; routing logic for two paths (fold into loop vs. promote to skill) is documented; data-source/API access verification is delivered as the first concrete worked example.
- **Source:** operator

---

## Evidence Audit (Current State)

### Entry Points

- `.claude/skills/lp-do-build/SKILL.md` (lines 164–194) — plan completion sequence; the location where any new reflection gate step must be inserted. Currently contains: build-record production, results-review auto-draft, reflection debt emission, process-improvements regeneration, completed-ideas append, archive.
- `docs/business-os/startup-loop/loop-output-contracts.md` (lines 196–224) — formal schema for `reflection-debt.user.md`; defines soft-gate mechanism, required sections, breach behavior. Extension point for a new artifact.
- `scripts/src/startup-loop/lp-do-build-reflection-debt.ts` — TypeScript emitter for reflection debt; validates `results-review.user.md` against `REQUIRED_REFLECTION_SECTIONS`. Pattern to follow for any new emitter.
- `docs/plans/_templates/results-review.user.md` — five idea categories in `## New Idea Candidates`; this is the upstream source that the new gate must complement without duplicating.

### Key Modules / Files

- `.claude/skills/lp-do-build/SKILL.md` — primary target for instruction changes; step 2 (results-review auto-draft) and step 3 (reflection debt emitter) are where the new gate step is anchored.
- `docs/business-os/startup-loop/loop-output-contracts.md` — artifact contract registry; a new artifact (`pattern-reflection.user.md` or similar) needs a contract entry here if it becomes canonical.
- `scripts/src/startup-loop/lp-do-build-reflection-debt.ts` — TypeScript emitter schema; exports `REQUIRED_REFLECTION_SECTIONS`, `ReflectionDebtLedger`, `EmitReflectionDebtInput`. The new gate's emitter should follow the same pattern.
- `scripts/src/startup-loop/generate-process-improvements.ts` — downstream consumer of `results-review.user.md` ideas; if the new reflection artifact produces structured idea candidates, this script may need to consume them.
- `docs/business-os/startup-loop/two-layer-model.md` (lines 172–180) — Layer B implementation loop structure; the reflection gate is a step inside Layer B, feeding back into Layer A standing intelligence.
- `.claude/skills/meta-reflect/SKILL.md` — existing semi-manual post-session reflection skill; the new structured gate is the systematic, mandatory version of what `meta-reflect` does optionally.
- `docs/business-os/startup-loop/2026-02-26-reflection-prioritization-expert-brief.user.md` — defines the canonical idea schema (priority tier, urgency, effort, reason_code, evidence fields) that any new idea-candidate output must conform to.
- `docs/business-os/startup-loop/process-registry-v2.md` — process registry; a new `REFL-1` or similar process entry may be needed under the `DATA` or a new `REFL` workstream.
- `scripts/src/startup-loop/mcp-preflight.ts` + `mcp-preflight-config.ts` — existing preflight pattern for MCP/tool access verification; this is the code-level analogue of the "data-source/API access" worked example.
- `docs/business-os/startup-loop/loop-spec.yaml` (lines 1178–1184) — DO stage comment documenting the build-completion soft gate and reflection debt rules; any loop-spec change to add a reflection stage must be done here.

### Patterns and Conventions Observed

- **Soft-gate pattern**: `reflection-debt.user.md` emitter validates `results-review.user.md` minimum payload; if missing, emits open debt with 7-day SLA and `block_new_admissions_same_owner_business_scope_until_resolved_or_override` breach behavior. Evidence: `lp-do-build-reflection-debt.ts` lines 4–17.
- **Inline instruction pattern**: `/lp-do-build` completion steps are inline instructions in SKILL.md (steps 1–7), not code-enforced. New reflection gate step follows the same pattern — instruction first, TypeScript emitter as optional hardening later.
- **Results-review five-category scan**: `## New Idea Candidates` in `results-review.user.md` already scans for five idea types including "New loop process" and "New skill". The new gate adds structured classification on top of this free-text capture; it does not replace it.
- **Prioritization policy**: `2026-02-26-reflection-prioritization-expert-brief.user.md` defines P0–P5 tiers, urgency U0–U3, effort XS–XL, reason_code classification tree. Idea candidates produced by the new gate must conform to this schema for downstream consumption.
- **MCP preflight as access verification pattern**: `mcp-preflight.ts` checks MCP server registration, tool metadata, and artifact freshness before loop operations. This is the existing code-level pattern for "ensure tools are set up". The data-source access worked example generalizes this concept to any external data dependency (GA4, Stripe, Firebase, Octorate API, etc.).
- **Idempotency**: `reflection-debt.ts` uses a `debt_id` keyed on `build_id` for idempotent emission — the same pattern must be applied to any new emitter.

### Data and Contracts

- Types/schemas/events:
  - `ReflectionDebtLedger` / `ReflectionDebtItem` in `lp-do-build-reflection-debt.ts` — reference schema for the new artifact schema design.
  - `ProcessImprovementItem` in `generate-process-improvements.ts` — downstream consumer shape; new reflection ideas must be compatible with this interface.
  - `IdeaClassificationInput` in `lp-do-ideas-classifier.ts` — the classifier that assigns tier/urgency/effort; reflection gate output should be passable through this classifier.
  - Prioritization schema in `2026-02-26-reflection-prioritization-expert-brief.user.md` section 4 — canonical idea schema with identity, classification, prerequisite, and evidence fields.

- Persistence:
  - New artifact path: `docs/plans/<feature-slug>/pattern-reflection.user.md` — follows the `docs/plans/<feature-slug>/` namespace convention and the `.user.md` suffix required for agent-produced operator-facing loop artifacts (same convention as `build-record.user.md` and `reflection-debt.user.md`). This is the canonical filename; the Open Q1 is about the base name only (`pattern-reflection`), not the suffix.
  - Loop-output-contracts.md must be updated to register the new artifact if it becomes canonical.
  - `loop-spec.yaml` DO stage comment (lines 1178–1184) may need a new line for the pattern reflection step.

- API/contracts:
  - No external API calls required for the gate itself.
  - Data-source access worked example needs a schema for "access declarations" — a list of data sources the build required, whether they were verified before the build started, and whether any were discovered mid-build. This schema is new and must be designed.

### Dependency and Impact Map

- Upstream dependencies:
  - `/lp-do-build` plan completion sequence (SKILL.md steps 1–7) — the new gate is inserted as step 2.5 or 3 (after build-record, alongside or before reflection-debt).
  - `build-record.user.md` — the new gate reads build context from this artifact to identify patterns.
  - `results-review.user.md` `## New Idea Candidates` — upstream free-text idea capture; new gate classifies and routes items from this section.

- Downstream dependents:
  - `generate-process-improvements.ts` — reads `results-review.user.md`; if new artifact is separate, this script may need updating to also consume it. Risk: scope creep in this cycle.
  - `lp-do-ideas-classifier.ts` — classification engine; ideas routed to loop or skill promotion flow through this classifier.
  - Loop update path: operator or agent amends a specific SKILL.md or `loop-spec.yaml` based on reflection output.
  - Skill creation path: operator or agent creates a new `.claude/skills/tool-*/SKILL.md` based on reflection output.

- Likely blast radius:
  - **SKILL.md (`lp-do-build`)**: 1 new instruction step added to plan completion sequence (low risk — additive only).
  - **`loop-output-contracts.md`**: 1 new artifact entry (additive, no existing contracts changed).
  - **`lp-do-build-reflection-debt.ts`**: no change unless the new gate is hardened into TypeScript (deferred task).
  - **`generate-process-improvements.ts`**: no change in this cycle unless plan explicitly includes it.
  - **`loop-spec.yaml`**: DO stage comment update only (not a stage topology change).

### Hypothesis and Validation Landscape

#### Key Hypotheses

| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | A structured inline reflection step at build completion will capture patterns that would otherwise be lost, measurably reducing rediscovery events in subsequent builds | Operator comparing pre/post rediscovery rate | High (requires multiple cycles to measure) | 4–8 weeks |
| H2 | The five-category `## New Idea Candidates` scan in `results-review.user.md` produces unclassified free-text entries that are not reliably routed — adding classification fields (tier, routing target) to each entry will increase the proportion of entries that reach a concrete next action | Review of historical results-review artifacts for unactioned entries | Medium | 1 cycle |
| H3 | Data-source/API access gaps are the most frequently rediscovered category across recent builds, making them the highest-value first worked example for the new schema | Audit of recent build-records for mid-build access discoveries | Low | 1 session |
| H4 | A routing criterion of "3+ separate builds encountered the same step in the same order with the same inputs/outputs" is a sufficient bar for promoting a pattern to a loop stage update | Operator judgement on reviewed patterns | Low (judgement call) | Per operator |

#### Existing Signal Coverage

| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | Operator-stated explicitly ("every build is an opportunity to identify what could be done more easily next time") | Dispatch packet `evidence_refs` | Medium — stated, not measured |
| H2 | Historical `results-review.user.md` files show entries like "Restore or port missing XA sync scripts" with `Suggested next action: create card` — no structured tier or routing recorded | `docs/plans/xa-uploader-usability-hardening/results-review.user.md` | High — pattern is visible |
| H3 | `mcp-preflight.ts` exists as a code-level access check; BOS memory note: "Before asking the user for credentials, check memory/data-access.md" — access discovery is a known friction point | `mcp-preflight.ts`, MEMORY.md | Medium — inference from tooling |
| H4 | No existing routing criteria documented anywhere | — | Low — must be designed |

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (governed runner via `pnpm -w run test:governed`)
- Commands: `pnpm -w run test:governed -- jest -- --config=scripts/jest.config.cjs --testPathPattern=startup-loop` (runs all startup-loop tests; narrow to a specific file by replacing `startup-loop` with the new emitter filename when it exists)
- CI integration: tests in `scripts/src/startup-loop/__tests__/` run in CI

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Reflection debt emitter | Unit | `__tests__/lp-do-build-reflection-debt.test.ts` | Full coverage of emit/validate logic |
| Process improvements generator | Unit | `__tests__/generate-process-improvements.test.ts` | Covers idea classification and HTML generation |
| Ideas classifier | Unit | `__tests__/lp-do-ideas-classifier.test.ts` | Covers tier/urgency/effort assignment |
| Build event emitter | Unit | `__tests__/lp-do-build-event-emitter.test.ts` | Covers build-event.json emission |

#### Coverage Gaps

- Untested paths:
  - Any new TypeScript emitter for the pattern-reflection artifact (does not yet exist).
  - Integration between pattern-reflection output and `generate-process-improvements.ts` (not yet designed).
  - Routing decision logic (deterministic vs. ad-hoc classification) — must be tested if implemented as TypeScript.

#### Testability Assessment

- Easy to test:
  - Schema validation for the new artifact (unit test against a fixture).
  - Required-section checking (mirrors existing reflection-debt emitter pattern).
  - Routing classification heuristic (if expressed as a function with typed inputs).
- Hard to test:
  - Whether the reflection gate actually reduces rediscovery events across builds (requires longitudinal measurement).
  - Quality of pattern descriptions (prose content is not mechanically verifiable).
- Test seams needed:
  - If a new TypeScript emitter is added: `root_dir` override param (same pattern as `EmitReflectionDebtInput.root_dir`).
  - If routing logic is added: exported pure function for classification decision, testable in isolation.

#### Recommended Test Approach

- Unit tests for: new schema validation function, required-section checker, routing classification heuristic.
- Integration tests for: end-to-end emission path (fixture build-record → emitter → artifact written to expected path).
- E2E tests for: not required in this cycle.

### Recent Git History (Targeted)

- `scripts/src/startup-loop/lp-do-build-reflection-debt.ts` — last modified as part of `startup-loop-why-intended-outcome-automation`; `WARN_REFLECTION_SECTIONS` (Intended Outcome Check) staged as warn-mode addition. Pattern confirms the schema is designed to evolve incrementally.
- `docs/business-os/startup-loop/loop-output-contracts.md` — updated 2026-02-25 (Version 1.2.0) with the `## Soft Gate Artifact: reflection-debt.user.md` section. Confirms the artifact contract file is actively maintained and is the right place to register new artifacts.
- `docs/business-os/startup-loop/2026-02-26-reflection-prioritization-expert-brief.user.md` — created 2026-02-26 with expert-reviewed idea prioritization schema. This is directly upstream of this fact-find and defines the classification contract the new artifact must respect.
- Recent `results-review.user.md` files across multiple plans confirm the current state: free-text idea candidates with plain-language `Suggested next action`, no structured tier/routing fields, some entries deferred indefinitely.

---

## Questions

### Resolved

- Q: Should the reflection gate be a new artifact (separate `.md` file) or fields added to `results-review.user.md`?
  - A: New lightweight artifact at `docs/plans/<feature-slug>/pattern-reflection.user.md`, produced by `/lp-do-build` as a peer to `build-record.user.md`. The `.user.md` suffix is required — all agent-produced operator-facing loop artifacts use it (see `build-record.user.md`, `reflection-debt.user.md`). This keeps `results-review.user.md` as the operator-authored observation document and separates the agent-produced structured routing output. Evidence: `loop-output-contracts.md` precedent with `reflection-debt.user.md` as a peer system-generated artifact; `results-review.user.md` is operator-authored and should not be auto-populated with structured fields.

- Q: Where in the build completion sequence should the new gate run?
  - A: After step 2 (results-review auto-draft), before step 3 (reflection debt emitter). The gate reads the auto-drafted results-review and structures the `## New Idea Candidates` entries into the new artifact with classification and routing fields. This means the gate can enrich the reflection debt check — if pattern-reflection has high-priority routing items, the debt emitter can reference them.
  - Evidence: `lp-do-build` SKILL.md steps 1–7; the slot between results-review auto-draft and reflection-debt emission is the natural location.

- Q: What is the difference between "deterministic pattern" and "ad-hoc pattern" for routing purposes?
  - A: **Deterministic pattern**: the same sequence of steps with the same inputs and outputs is executed identically in 3 or more separate builds. It is predictable enough to be expressed as a numbered checklist or SKILL.md instruction block. Routing target: amend an existing loop stage instruction or skill file. **Ad-hoc pattern**: a recurring pattern that requires LLM judgment on each invocation (variable inputs, context-sensitive outputs) but follows a recognisable skeleton. Routing target: a new `tool-*` skill. The bar for skill creation is high — the pattern must appear across at least 2 builds, have a clear name, and the operator must confirm before creation is triggered.
  - Evidence: Operator dispatch packet ("deterministic patterns should be folded into the startup loop; ad-hoc/non-deterministic patterns should become new tool-* skills"), `meta-reflect` SKILL.md "Platform evolution signals" section.

- Q: Which stage of the startup loop "owns" data-source/API access verification?
  - A: The DO stage (fact-find intake phase). Data-source access should be verified during the fact-find phase — when entry points are being identified, the agent should also declare which external data sources (GA4, Stripe, Octorate, Firebase, etc.) will be needed and verify access is configured. This aligns with `mcp-preflight.ts` (existing pattern for MCP tool access) and with the memory note: "Before asking the user for credentials, check memory/data-access.md." The reflection gate records whether each declared data source was verified before the build started or was discovered mid-build (a rediscovery event).
  - Evidence: `mcp-preflight.ts`, MEMORY.md `data-access.md` reference, dispatch packet evidence_refs.

- Q: Should the new artifact's idea candidates be routed through the existing `lp-do-ideas-classifier.ts` for tier/urgency/effort assignment?
  - A: Yes. The ideas classifier already implements the prioritization policy defined in `2026-02-26-reflection-prioritization-expert-brief.user.md`. Any new structured idea candidate produced by the reflection gate should be expressed in a format compatible with `IdeaClassificationInput` so the classifier can assign `priority_tier`, `urgency`, `effort`, and `reason_code` deterministically.
  - Evidence: `generate-process-improvements.ts` imports `classifyIdea` and `IdeaClassificationInput`; `lp-do-ideas-classifier.ts` test coverage.

- Q: Does the new gate need to update `generate-process-improvements.ts` in this cycle?
  - A: No — defer to a follow-on task. The `generate-process-improvements.ts` script currently reads `results-review.user.md` and the ideas classifier. The new pattern-reflection artifact can be wired into this pipeline in a follow-on cycle once the artifact schema is stable. This avoids scope creep.
  - Evidence: `generate-process-improvements.ts` line 14–16 (data sources defined at module level); adding a new source is a single-line change, suitable for a follow-on.

- Q: Should the pattern-reflection gate apply to all builds, or only to builds above a certain complexity threshold?
  - A: All builds, with a "None identified" empty-state for simple builds. This mirrors the `results-review.user.md` pattern (`None.` is a valid entry for `## New Idea Candidates`). Requiring the gate on all builds ensures the reflection habit is systematic, not optional. A simple build with no patterns produces a short valid artifact.
  - Evidence: `lp-do-build-reflection-debt.ts` always-emit pattern; `results-review.user.md` template `None.` convention.

### Open (Operator Input Required)

- Q: What is the preferred canonical name for the new artifact file?
  - Why operator input is required: this is a naming preference that will appear in `loop-output-contracts.md`, the SKILL.md step instruction, and potentially the TypeScript emitter filename. The operator's preference is the deciding factor and is not documented.
  - Decision impacted: artifact path, emitter filename, contract entry name.
  - Decision owner: operator (Peter Cowling).
  - Default assumption + risk: Default to `pattern-reflection.user.md` (base name `pattern-reflection` + required `.user.md` suffix). Low risk — base name can be changed before the contract is published; the `.user.md` suffix is non-negotiable.

---

## Confidence Inputs

- **Implementation**: 82%
  - Evidence basis: The insertion point is clearly identified (lp-do-build SKILL.md step 2.5). The artifact schema can be modelled directly on `lp-do-build-reflection-debt.ts`. The idea classification pipeline (`lp-do-ideas-classifier.ts`) already exists. TypeScript emitter is a follow-on hardening task, not required for the initial cycle (instructions-first).
  - What raises to >=90: TypeScript emitter SPIKE completed with passing tests; `loop-output-contracts.md` updated with new artifact entry; SKILL.md step verified end-to-end with a real build.

- **Approach**: 78%
  - Evidence basis: The two-track routing design (deterministic → loop update, ad-hoc → skill proposal) is well-grounded in operator intent and `meta-reflect` SKILL.md patterns. The main uncertainty is the routing criteria threshold (how many occurrences before promotion?) — documented as H4, with a recommended default of 3 for deterministic and 2 for ad-hoc.
  - What raises to >=80: Operator confirms the routing threshold defaults (3 for deterministic, 2 for ad-hoc). The threshold is currently a reasoned default, not confirmed preference.
  - What raises to >=90: A pilot run on 2–3 recent builds validates that the schema captures meaningful patterns without being noisy.

- **Impact**: 75%
  - Evidence basis: Historical `results-review.user.md` files show free-text idea candidates that are not reliably acted upon. The operator has stated this problem explicitly. The impact is measurable in principle (rediscovery rate) but requires multiple cycles to observe.
  - What raises to >=80: Audit of 5+ recent builds produces 3+ identifiable patterns that would have been captured by the new gate.
  - What raises to >=90: Longitudinal measurement (4+ weeks) shows reduction in mid-build access discoveries.

- **Delivery-Readiness**: 80%
  - Evidence basis: The plan can be written now. The SKILL.md instruction changes are straightforward. The TypeScript emitter is a follow-on hardening task. The schema design requires 1 SPIKE task to finalize field names and routing criteria. The data-source access worked example provides a concrete first pattern to validate the schema against.
  - What raises to >=90: SPIKE task completes with a validated schema fixture and operator sign-off on field names.

- **Testability**: 77%
  - Evidence basis: TypeScript emitter tests follow an established pattern (`lp-do-build-reflection-debt.test.ts`). Schema validation and routing classification are unit-testable. The main untestable dimension is whether the gate reduces rediscovery longitudinally.
  - What raises to >=80: SPIKE task includes a fixture-based unit test for the schema validator and routing classifier.
  - What raises to >=90: Integration test added that exercises the full SKILL.md instruction chain on a synthetic build context.

---

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Build completion sequence (SKILL.md steps 1–7) — insertion point for new step | Yes | None | No |
| Artifact schema design — modelled on reflection-debt.ts pattern | Yes | Minor: artifact base name not yet confirmed by operator (Open Q1); `.user.md` suffix is resolved as required | No |
| Routing logic — two-track (deterministic/ad-hoc) | Partial | Moderate: routing threshold defaults (3 for deterministic, 2 for ad-hoc) are reasoned but not operator-confirmed | No |
| `loop-output-contracts.md` — new artifact registration | Yes | None — additive change, no existing contracts broken | No |
| `lp-do-ideas-classifier.ts` — ideas compatibility | Yes | None — `IdeaClassificationInput` is a stable interface | No |
| `generate-process-improvements.ts` — downstream consumer | Yes | Minor: deferred to follow-on cycle intentionally; not a gap | No |
| Data-source access worked example — schema for access declarations | Partial | Moderate: access declaration schema fields not yet fully specified; SPIKE task required | No |
| `loop-spec.yaml` DO stage comment update | Yes | None — comment-only change, not a topology change | No |
| Test landscape — emitter and schema validation | Yes | None — existing pattern covers the required approach | No |
| SKILL.md instruction change — operator-facing plain language rule | Yes | None — additive instruction step | No |

---

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Schema too complex → agents skip it or produce low-quality entries | Medium | High | Keep required fields minimal: pattern summary (≤100 chars), category (deterministic/ad-hoc/access-gap), routing target, occurrence count; all other fields optional |
| Routing criteria are subjective → classification is inconsistent | Medium | Medium | Express routing as a typed enum with explicit conditions; SPIKE task produces test fixtures for each routing branch |
| `results-review.user.md` and pattern-reflection overlap → duplication | Low | Medium | Clear boundary rule: results-review captures free-text observations; pattern-reflection classifies and routes structured patterns; no free-text duplication required |
| `lp-do-build` SKILL.md instruction grows too long | Low | Low | New step is concise (instruction + artifact path + minimum payload); modular — detailed schema reference links to `loop-output-contracts.md` |
| Operator doesn't fill pattern-reflection → gate is silent | Medium | Low | Same soft-gate mechanism as reflection-debt: if pattern-reflection is absent 7 days after build completion, open a non-blocking debt item |
| Skill creation promotions occur too often → skill proliferation | Low | Medium | High bar: skill creation proposals require operator sign-off; the gate produces a *proposal*, not an automatic creation |

---

## Planning Constraints and Notes

- Must-follow patterns:
  - New SKILL.md instruction step must follow the plain-language rule (MEMORY.md "Operator-Facing Content: Plain Language Rule") — describe what the step does for the operator, not which mechanism produces it.
  - New artifact must use the `.user.md` suffix — it is agent-produced and operator-facing (same pattern as `build-record.user.md` and `reflection-debt.user.md`). Canonical path: `docs/plans/<feature-slug>/pattern-reflection.user.md`.
  - TypeScript emitter (if built in this cycle) must use `root_dir` override pattern for testability.
  - Any new idea candidates produced must be expressible in `IdeaClassificationInput` format for downstream compatibility.

- Rollout/rollback expectations:
  - Instruction-first rollout: SKILL.md step added first; TypeScript emitter hardening is a follow-on task. If the instruction step proves noisy or unhelpful, it can be removed without code changes.
  - No schema breakage risk: new artifact is standalone; existing artifacts unchanged.

- Observability expectations:
  - Pattern-reflection artifacts accumulate in `docs/plans/<feature-slug>/` alongside existing artifacts — operator can review them in any editor.
  - If wired into `generate-process-improvements.ts` in a follow-on cycle, pattern entries will appear in `process-improvements.user.html`.

---

## Suggested Task Seeds (Non-binding)

1. **SPIKE — Schema design**: Define `pattern-reflection.user.md` schema fields, routing criteria thresholds, and access-declaration sub-schema. Produce fixture and unit test. (Confidence gate: >=80 for IMPLEMENT tasks downstream.)
2. **IMPLEMENT — SKILL.md step**: Add step 2.5 to `lp-do-build` plan completion sequence; instruction covers: read build-record + results-review, classify patterns into artifact, apply routing labels, write `pattern-reflection.user.md`. Update `loop-output-contracts.md` with new artifact entry.
3. **IMPLEMENT — Data-source access worked example**: Update fact-find module (`lp-do-fact-find` SKILL.md or a shared module) to include a "data-source declarations" step: list required external data sources, verify access before build, record access status. Amend `loop-output-contracts.md` fact-find contract entry.
4. **IMPLEMENT — TypeScript emitter hardening** (optional, lower confidence): Port the SKILL.md instruction into a TypeScript emitter following the `lp-do-build-reflection-debt.ts` pattern. Add unit tests. (Can be deferred post-instruction validation.)
5. **CHECKPOINT — Pilot validation**: Run pattern-reflection gate on 3 completed builds (applying the schema retrospectively); verify the schema captures meaningful patterns; surface to operator for routing decision on any identified patterns.

---

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - `pattern-reflection.user.md` schema documented in `loop-output-contracts.md`
  - New step in `lp-do-build` SKILL.md completion sequence
  - Data-source access declarations step in `lp-do-fact-find` SKILL.md
  - Pilot validation on 3 completed builds with documented results
- Post-delivery measurement plan:
  - Audit next 5 builds to confirm pattern-reflection artifact is being produced and entries are routed to concrete actions (not deferred indefinitely)
  - Count mid-build access discovery events in next 10 builds vs. pre-gate baseline

---

## Evidence Gap Review

### Gaps Addressed

1. **Routing criteria undefined** — Investigated `meta-reflect` SKILL.md (existing ad-hoc reflection), `results-review.user.md` historical artifacts, and `lp-do-ideas-classifier.ts`. Established a reasoned two-track routing model with explicit threshold defaults, grounded in operator intent and existing classification infrastructure.

2. **Stage ownership of data-source access verification** — Investigated `mcp-preflight.ts`, MEMORY.md data-access references, and the fact-find module structure. Determined that fact-find is the correct stage (access verification before build starts, not after), consistent with the existing MCP preflight pattern.

3. **Schema shape and complexity** — Investigated `lp-do-build-reflection-debt.ts` for a directly reusable pattern; `generate-process-improvements.ts` for downstream compatibility; `2026-02-26-reflection-prioritization-expert-brief.user.md` for the canonical idea schema. Established minimum viable schema (4 required fields) with optional extension fields.

4. **Risk of duplication with results-review** — Investigated `results-review.user.md` template `## New Idea Candidates` section in detail. Established clear boundary: results-review = operator-authored observations; pattern-reflection = agent-produced structured routing output. No duplication.

### Confidence Adjustments

- Implementation lowered from 85% → 82%: The TypeScript emitter hardening is deferred to a follow-on task, which is appropriate, but means the initial cycle relies on instruction-only enforcement. This is lower confidence than a fully hardened emitter.
- Approach raised from 70% → 78%: Evidence from `lp-do-ideas-classifier.ts` and the prioritization brief confirms the routing infrastructure exists and is compatible; the main gap (routing threshold confirmation) is a quick operator confirmation, not a design problem.

### Remaining Assumptions

- The operator intends inline SKILL.md instruction changes (not a separate new skill file) for the initial implementation.
- The routing threshold defaults (3 occurrences for deterministic, 2 for ad-hoc) are acceptable starting points pending operator confirmation.
- "Data-source/API access" is confirmed as the highest-priority first worked example (H3 — medium confidence; audit of recent builds would confirm this but is not blocking planning).
- The artifact filename defaults to `pattern-reflection.user.md` (`.user.md` suffix is non-negotiable; base name `pattern-reflection` is the open question).

---

## Planning Readiness

- Status: Ready-for-planning
- Critique: Round 1, lp_score 4.0/5.0 (codemoot 8/10), verdict `credible` after autofix; naming inconsistency (`pattern-reflection.md` vs `.user.md`) resolved.
- Blocking items: None
- Recommended next step:
  - `/lp-do-plan startup-loop-build-reflection-gate --auto`
  - Note: operator may wish to confirm the base name preference (Open Q1 — currently defaults to `pattern-reflection.user.md`) before the plan is finalised, but this is not a hard blocker — the plan can proceed with the default.
