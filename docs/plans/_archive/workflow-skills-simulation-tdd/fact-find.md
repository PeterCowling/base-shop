---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: STRATEGY
Workstream: Engineering
Created: 2026-02-27
Last-updated: 2026-02-27
Feature-Slug: workflow-skills-simulation-tdd
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/workflow-skills-simulation-tdd/plan.md
Trigger-Source: direct-inject
Trigger-Why: IDEA-DISPATCH-20260227-0035 — simulation-based TDD validation protocol is strictly necessary because IDEA-DISPATCH-20260227-0034 (resource offload) removes local test runs from the planning loop, requiring an agent-driven substitute that catches integration failures before plans are emitted.
Trigger-Intended-Outcome: type: operational | statement: All three workflow skills (lp-do-plan, lp-do-fact-find, lp-do-critique) gain a defined simulation-trace step with clear insertion points, issue taxonomy, and hard-gate vs advisory rules, encoded as SKILL.md edits and a shared simulation-protocol doc. | source: operator
---

# Workflow Skills Simulation-TDD Fact-Find Brief

## Scope

### Summary

The three core workflow skills — `lp-do-plan`, `lp-do-fact-find`, and `lp-do-critique` — currently have no mechanism for an agent to simulate or trace the proposed work before emitting artifacts. When TDD-style validation is needed during planning, the only available mechanism is to actually run tests locally. A parallel dispatch (IDEA-DISPATCH-20260227-0034) proposes removing those local test runs entirely to reduce resource pressure, which makes a simulation-based substitute strictly necessary rather than merely desirable.

This fact-find designs a simulation protocol that fits inside the existing skill phase sequences, defines what the agent checks, classifies the categories of issue a simulation can catch without executing code, and specifies whether simulation output constitutes a hard gate or an advisory block.

### Goals

- Define "simulation" precisely within the context of these three skills — what the agent actually does during a simulation step
- Identify the correct insertion point for a simulation step in each skill's phase sequence
- Classify the categories of issue a simulation can catch without running code
- Decide whether simulation output blocks artifact emission or appears as an advisory section
- Produce concrete SKILL.md edits for all three skills and a shared simulation-protocol doc that other skills can load

### Non-goals

- Changing how lp-do-build executes tasks (simulation is a planning/fact-find/critique concern)
- Building a code execution engine or test runner — simulation is static analysis by the agent using read-only evidence
- Replacing lp-do-factcheck (factcheck verifies factual claims about existing code; simulation traces proposed future behavior)
- Designing simulation for skills outside these three

### Constraints and Assumptions

- Constraints:
  - Simulation must be achievable by an LLM agent reading files — no test execution, no subprocess calls
  - Must not add phase count overhead that breaks the auto-handoff gates: lp-do-fact-find requires critique score ≥ 4.0 for auto-handoff to lp-do-plan; lp-do-plan allows auto-build at score ≥ 2.6 (partially-credible warning path) and blocks only at score ≤ 2.5
  - All three skills have different operating modes; simulation must respect each skill's Prohibited actions list
  - Shared protocol docs must be loadable via the `../_shared/` convention already used by `critique-loop-protocol.md` and `queue-check-gate.md`
- Assumptions:
  - IDEA-DISPATCH-20260227-0034 (resource offload) will proceed; simulation is not optional if that dispatch is implemented
  - The simulation step is agent-only (no human approval gate required mid-simulation)
  - Codemoot is already available as the critique vehicle; simulation is a separate, lighter step that happens before critique

## Outcome Contract

- **Why:** IDEA-DISPATCH-20260227-0034 removes local test runs from the planning loop. Without a simulation substitute, plans can be emitted with undetected integration gaps, circular task ordering, or missing preconditions — defects that currently surface only when lp-do-build fails. The simulation protocol closes that gap before emission, not after.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Three SKILL.md files updated with defined simulation steps at their correct insertion points, plus one shared simulation-protocol doc. Each simulation step specifies: what the agent traces, what issue categories it looks for, and whether findings block or advise.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `.claude/skills/lp-do-plan/SKILL.md` — plan orchestrator; 10 phases, critique at Phase 9, no simulation step
- `.claude/skills/lp-do-fact-find/SKILL.md` — fact-find orchestrator; 8 phases plus 6.5 and 7a, critique at Phase 7a, no simulation step
- `.claude/skills/lp-do-critique/SKILL.md` — critique + autofix; Steps 0–7 then autofix; no simulation-execution step in any step

### Key Modules / Files

- `.claude/skills/lp-do-plan/SKILL.md` — Phases 1–10; Phase 5.5 Consumer Tracing is the closest existing analog to simulation for code/mixed M/L tasks
- `.claude/skills/lp-do-fact-find/SKILL.md` — Phases 0–7a; Phase 6.5 Open Question Self-Resolve Gate is the closest existing analog (agent reasons over evidence before emitting)
- `.claude/skills/lp-do-critique/SKILL.md` — Steps 0–7 + autofix; Step 5 (Feasibility and Execution Reality) is the closest existing analog — checks paths exist, dependency chain realism, failure points
- `.claude/skills/_shared/critique-loop-protocol.md` — shared protocol loaded by both lp-do-plan and lp-do-fact-find; establishes the pattern for shared step insertion
- `.claude/skills/_shared/queue-check-gate.md` — second example of shared protocol loaded by both skills
- `docs/plans/_templates/evidence-gap-review-checklist.md` — reference for what gap-check structure looks like

### Patterns and Conventions Observed

- Shared protocol pattern: `../_shared/<name>.md` — evidence: `critique-loop-protocol.md` loaded by both lp-do-plan Phase 9 and lp-do-fact-find Phase 7a; `queue-check-gate.md` loaded by lp-do-fact-find Phase 0
- Phase numbering with decimal sub-phases: lp-do-fact-find uses 6.5 and 7a to inject steps between named phases without renumbering — evidence: SKILL.md lines 115–171
- Consumer Tracing in lp-do-plan Phase 5.5: already performs a structured static walk — "for each new value this task introduces, list every code path that will consume it" — evidence: SKILL.md lines 162–187. This is the closest existing precursor to simulation.
- Step 5 in lp-do-critique (Feasibility and Execution Reality): checks paths/patterns exist, dependency chain realism, failure points and rollback paths, effort honesty — evidence: SKILL.md lines 248–258. Already performs some simulation-adjacent reasoning but is not a dedicated trace pass.
- No existing step in any of the three skills asks the agent to trace proposed execution forward from a precondition through each task/step in sequence, checking for failures at each boundary.

### Current Protocol Steps: Where Simulation Would Insert

#### lp-do-plan insertion point

Current phase sequence:
1. Phase 1: Intake and Mode Selection
2. Phase 2: Discovery and De-duplication
3. Phase 3: Plan Gates (Foundation, Build, Auto-Continue)
4. Phase 4: Track Classification and Routing
5. Phase 4.5: DECISION Task Self-Resolve Gate
6. Phase 5: Decompose Tasks with External Templates
7. **Phase 5.5: Consumer Tracing** (code/mixed M/L only — closest existing analog)
8. Phase 6: Confidence Scoring
9. Phase 7: Sequence + Edge-Case Review
10. Phase 8: Persist Plan
11. Phase 9: Critique Loop (1–3 rounds, mandatory)
12. Phase 10: Optional Handoff to Build

Insertion point: **After Phase 7 (Sequence + Edge-Case Review), before Phase 8 (Persist Plan)** — as a new Phase 7.5. Rationale: simulation should run on the fully-sequenced, edge-case-reviewed plan, not on an intermediate draft. It must complete before persistence so that hard-gate blocks can prevent a flawed plan from being written.

#### lp-do-fact-find insertion point

Current phase sequence:
1. Phase 0: Queue Check Gate
2. Phase 1: Discovery and Selection
3. Phase 2: Context Hydration
4. Phase 3: Sufficiency Gate
5. Phase 4: Classification
6. Phase 5: Route to a Single Module
7. Phase 6: Persist Artifact with Shared Templates
8. **Phase 6.5: Open Question Self-Resolve Gate** (closest existing analog)
9. Phase 7: Mandatory Evidence Gap Review
10. Phase 7a: Critique Loop (1–3 rounds, mandatory)

Insertion point: **Between Phase 5 (Route to a Single Module) and Phase 6 (Persist Artifact)** — as a new Phase 5.5. Rationale: simulation must run before persistence to function as a pre-persistence hard gate. Phase 6 is the persist step; simulation at Phase 6.5 or 6.7 would be post-persist and cannot enforce blocking semantics. Inserting at Phase 5.5 means: module investigation completes (Phase 5), simulation traces the resulting scope for structural gaps (Phase 5.5), and only then does the artifact get written (Phase 6). The Open Question Self-Resolve Gate (Phase 6.5) and Evidence Gap Review (Phase 7) remain unchanged — they operate on the already-persisted artifact. Simulation findings that raise issues at Phase 5.5 result in the agent resolving them before writing the artifact, not after.

#### lp-do-critique insertion point

Current step sequence:
- Step 0: Frame the Decision
- Step 1: Structural Map
- Step 2: Claim-Evidence Audit
- Step 2A: Source Conflict Arbitration
- Step 3: Assumption Mining
- Step 4: Logic Check
- **Step 5: Feasibility and Execution Reality** (closest existing analog — checks paths exist, dependency chain realism, failure points)
- Step 6: Contrarian Attacks
- Step 7: Fix List
- Autofix Phase (AF-1 through AF-4)

Insertion point: **Expand Step 5 (Feasibility and Execution Reality)** rather than adding a new numbered step. Rationale: Step 5 already asks "are paths real? Is the dependency chain realistic? What are the failure points?" A simulation-trace sub-step fits naturally here as a structured forward trace of the proposed plan/fact-find execution path. Expanding within Step 5 rather than creating a new numbered step preserves design stability — the Required Output Template uses fixed numbered sections (`### 5) Feasibility...`) and adding a new top-level step would require renumbering 6, 7, and the autofix phase, creating unnecessary churn and risk of misalignment with the existing output template.

### Data and Contracts

- Types/schemas/events:
  - No new schema required for the simulation step itself — the simulation produces a markdown section (`## Simulation Trace`) inside the existing artifact or as a separate advisory block
  - Simulation issues map to the existing severity taxonomy already used by lp-do-critique: Critical / Major / Moderate / Minor
- Persistence:
  - Simulation trace results are written into the plan/fact-find artifact before persistence (not a separate file)
  - A hard-gate block prevents `Status: Active` from being set on a plan if Critical simulation issues remain unresolved
- API/contracts:
  - Simulation integrates with the existing critique scoring — if simulation surfaces Critical issues that survive unresolved into critique, they will degrade Evidence, Feasibility, and Risk-handling dimension scores. Note: lp-do-critique's score caps are tied to specific named conditions (unresolved source conflict, internal contradiction, top-3 claims unverified, missing VCs on >30% IMPLEMENT tasks) — not a blanket "any Critical finding" cap. Simulation findings that remain unresolved will affect the weighted score through the affected dimensions, not through a categorical cap.

### Dependency and Impact Map

- Upstream dependencies:
  - Phase 5.5 Consumer Tracing (lp-do-plan) is superseded in spirit by Phase 7.5 Simulation — Phase 5.5 should remain as the task-level micro-check; Phase 7.5 is the plan-level forward trace
  - lp-do-factcheck (referenced in both SKILLs' quick-validation checklists) checks existing codebase claims; simulation checks proposed future behavior — the two are complementary and distinct
- Downstream dependents:
  - lp-do-build receives plans that have passed simulation; if simulation is a hard gate, build agents will receive higher-quality plans with fewer mid-build replans needed
  - lp-do-replan is triggered less frequently if simulation catches issues before plan emission
  - The critique loop (Phases 7a and 9) benefits from receiving already-simulation-checked artifacts: fewer Critical findings expected, meaning faster critique convergence
- Likely blast radius:
  - Three SKILL.md files modified
  - One new shared protocol doc created at `.claude/skills/_shared/simulation-protocol.md`
  - No changes to plan templates, task templates, or loop-output-contracts
  - No changes to lp-do-build, lp-do-replan, or lp-do-sequence

### Test Landscape

#### Test Infrastructure

- Frameworks: The skills themselves are markdown documents followed by agents — no unit test framework applies. Validation is through critique scoring and operator review of output artifacts.
- Commands: None applicable for SKILL.md documents
- CI integration: `docs-lint` and `plans-lint.ts` validate plan artifacts, not SKILL.md files

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| lp-do-plan output plans | Structural lint | `plans-lint.ts` | Checks plan frontmatter and task completeness — does not test skill execution path |
| lp-do-fact-find output | Structural lint | `docs-lint` | Checks fact-find frontmatter — does not test skill execution path |
| lp-do-critique | Critique loop score | Per-artifact | Each critique run produces a scored output — quality validated by score gate ≥ 4.0 |

#### Coverage Gaps

- No test for whether a plan emitted by lp-do-plan actually has all its preconditions met before task 1 executes
- No test for whether a fact-find investigation scope covers all relevant evidence areas
- No test for whether lp-do-critique's feasibility check catches integration boundary mismatches

#### Testability Assessment

- The simulation step itself is agent reasoning over document content — testable by running the skill on known-defective plans and verifying the simulation finds the planted issues
- Validation seams needed: a set of "simulation smoke test" artifacts (deliberately broken plans/fact-finds) that can be used to verify the simulation step catches known issue categories

## Simulation Taxonomy

This section defines what an agent can catch without executing code, and what remains outside the reach of static simulation.

### What Simulation Means Here

Simulation in this context is a **structured forward trace** performed by the agent reading the proposed artifact (plan task sequence, fact-find scope, or critique target) and asking, at each step:

> If I were an agent executing this step, given only what is stated or discoverable in the repository at planning time, would this step succeed or fail? Why?

The agent does not run code. It reads file paths, interface signatures, config keys, API shapes, and task ordering — all from the repository — and reasons about whether each proposed step has what it needs to proceed.

The trace is:
- **Sequential**: each task or investigation step is visited in order
- **Precondition-checking**: for each step, the agent verifies that all inputs required by that step are produced by a prior step or already exist in the repository
- **Boundary-aware**: integration points (API calls, config lookups, type intersections, environment variables) are inspected for contract mismatches
- **Formality**: structured markdown output per step, not prose narration; issues are classified by the existing severity taxonomy

### Issue Categories an Agent Can Catch

| Category | Description | Example |
|---|---|---|
| Missing precondition | Task N requires an output from task M, but M is sequenced after N or not in the plan | Task to write a migration runs before task to define the schema |
| Circular task dependency | Task A depends on output of task B, which depends on output of task A | Two IMPLEMENT tasks whose outputs feed each other's inputs |
| Undefined config key | A task references an environment variable or config key not present in any env schema or `.env.example` | Task calls `process.env.AXERVE_SECRET_KEY` but key is absent from all schema files |
| API signature mismatch | A task calls a function or endpoint with arguments that do not match the current signature in the repository | Plan calls `createOrder(shopId, sessionId)` but actual signature is `createOrder(sessionId, shopId, options)` |
| Type contract gap | A task produces a value of type A and passes it to a consumer expecting type B, with no conversion step in the plan | New field added as `string | null` but consumed by a function typed for `string` only |
| Missing data dependency | A task needs a database record, a file, or an artifact that no prior task creates and that does not already exist | Task reads from a table that no migration creates |
| Integration boundary not handled | A task calls an external service but the plan has no step for error handling, retry, or fallback when that service fails | Payment gateway call with no fallback task |
| Scope gap in investigation | (lp-do-fact-find only) The proposed investigation scope does not cover a domain that is materially affected by the change | Fact-find on a new API route that does not investigate existing auth middleware |
| Execution path not traced | (lp-do-critique only) The critique asserts feasibility for a step without having checked whether the relevant code path actually exists | Critique approves a plan step referencing a module that does not exist |
| Ordering inversion | Steps are sequenced in an order that will produce a failure at runtime even if individually correct | Database seeded before schema migrated; component registered before its dependency is installed |

### What Simulation Cannot Catch (Limits)

| Limit | Why |
|---|---|
| Runtime-only failures | Race conditions, flaky network responses, memory pressure — require actual execution |
| Test assertion failures | Whether a test passes or fails against the implemented code — requires running the test suite |
| Business validation | Whether a hypothesis is true, whether users will adopt a feature — requires real-world signal |
| Compiler/bundler edge cases | Turbopack module identity conflicts, CSS layer cascade issues — require build execution |
| Dynamic config at runtime | Secrets injected by CI, feature flags evaluated at request time — not visible statically |
| Emergent integration behaviour | Two systems each correct individually but incorrect together — requires integration test execution |

### Simulation Is Not a Test Replacement

Simulation catches **structural** and **contract** issues that are visible from the plan and the repository at planning time. It does not replace running tests. The correct framing: simulation raises the baseline quality floor before build begins; tests enforce correctness after build.

## Design Options: Hard Gate vs Advisory Output

### Option A: Hard Gate (blocks plan/fact-find emission)

Simulation runs before persistence. If any Critical simulation issue is found, the artifact is not persisted with `Status: Active` (plan) or `Status: Ready-for-planning` (fact-find). The agent must resolve or explicitly waive the issue with a documented rationale before proceeding.

**Pros:**
- Guarantees no known-Critical issue enters the build pipeline
- Prevents lp-do-build from discovering mid-build what simulation would have caught
- Consistent with how Foundation Gate works in lp-do-plan (stops planning if required fields missing)

**Cons:**
- Simulation may have false positives — agent incorrectly identifies a missing precondition that actually exists but is stated implicitly
- Could block plans for issues the operator knows are acceptable
- Adds a resolution burden that may slow the pipeline for low-risk plans

### Option B: Advisory Block (never blocks, always informational)

Simulation runs but findings are written into an advisory section of the artifact. The gate is informational only. Critique sees the simulation findings and can factor them into its score.

**Pros:**
- No false-positive-induced blocking
- Operator and critique can override
- Lower implementation friction — no new blocking condition to tune

**Cons:**
- Advisory sections are frequently ignored
- A plan with Critical simulation findings that the agent does not block will proceed to lp-do-build and fail there instead
- Defeats the purpose of replacing local test runs — the replacement must have equivalent stopping power

### Option C: Tiered Gate (hard for Critical, advisory for Major/Moderate/Minor)

Critical simulation issues block emission. Major/Moderate/Minor issues are written as advisory blocks. Agent must resolve Criticals or explicitly waive with documented rationale.

**Pros:**
- Stops genuinely broken plans without blocking plans that have merely suboptimal structure
- False positives are recoverable — operator can waive with a rationale, creating an audit trail
- Consistent with how the critique scoring caps work (Critical = score cap ≤ 2.0)
- Major/Moderate issues visible to critique and operator without creating a hard stop

**Cons:**
- Requires defining a waiver mechanism (documented inline in the artifact)
- Slightly more complex to specify than a pure binary gate

## Recommended Approach

**Option C (Tiered Gate) is recommended.** Rationale:

1. **Simulation replaces a hard local test run, not a soft advisory.** If the purpose of simulation is to substitute for running tests locally, it must have equivalent stopping power for the issue categories tests would catch. Critical-category issues (missing preconditions, circular dependencies, undefined config) are exactly the issues a failing test would catch — blocking on these is correct.

2. **False positives are real but manageable.** An agent can incorrectly classify something as missing that actually exists. The waiver mechanism handles this without removing the gate entirely. A waiver requires the agent to state why the critical flag is incorrect — this forces explicit reasoning rather than silent override.

3. **Advisory for Major/Moderate preserves flow.** Most simulation findings will be Major or Moderate (API signature uncertainty, type contract ambiguity). Advisory treatment for these means the plan proceeds while the operator and critique are informed. This avoids paralysis while ensuring issues are visible.

4. **Consistency with existing gate patterns.** Foundation Gate (hard stop for missing fields), Build Gate (hard stop for missing IMPLEMENT tasks), and Auto-Continue Gate all use hard stops for critical structural conditions. Simulation adding a hard stop for Critical issues is consistent with the existing gate philosophy.

5. **Critique score integration.** Any Critical simulation issue that reaches critique unresolved will degrade Evidence, Feasibility, and Risk-handling dimension scores in the weighted critique score. lp-do-plan blocks auto-build at score ≤ 2.5; lp-do-fact-find blocks auto-handoff at score < 4.0. Tiered simulation enforces a pre-critique threshold that reduces the likelihood of these post-emission blocks.

## Questions

### Resolved

- Q: Should simulation run before or after persistence?
  - A: Before persistence in both skills. For lp-do-plan: Phase 7.5 (after Sequence + Edge-Case Review, before Phase 8 Persist). For lp-do-fact-find: Phase 5.5 (after Route to Module, before Phase 6 Persist). The key constraint is that Phase 6 in lp-do-fact-find is the persist step — placing simulation at any Phase 6.x sub-step would be post-persist and cannot enforce blocking semantics. Phase 5.5 is the only pre-persist slot that comes after investigation is complete.
  - Evidence: lp-do-fact-find SKILL.md Phase 6 = "Persist Artifact with Shared Templates" (lines 108–113); Phase 6.5 and later are already post-persist. Foundation Gate in lp-do-plan also runs before persistence (Phase 3, well before Phase 8).

- Q: Should lp-do-critique get a new simulation step, or should Step 5 be expanded?
  - A: Expand Step 5. Adding a new numbered step risks breaking the output template and the linter checks that expect a fixed structure. Step 5 is explicitly about "Feasibility and Execution Reality" — simulation-trace reasoning is a natural sub-step within it. The output template section "### 8) Risks and Second-Order Effects" and "### 9) What Is Missing to Make This Decisionable" already capture simulation-adjacent findings. A sub-step within Step 5 that explicitly performs a forward trace is the correct scope.
  - Evidence: lp-do-critique SKILL.md Step 5 (lines 248–258) already checks "paths/patterns exist", "dependency chain realism", "failure points and rollback paths".

- Q: Is Consumer Tracing (lp-do-plan Phase 5.5) superseded by simulation (lp-do-plan Phase 7.5)?
  - A: No. Consumer Tracing is a task-level micro-check — it asks "for each new value this task produces, what consumes it?" Simulation (Phase 7.5) is a plan-level forward trace — it asks "can this entire sequence of tasks execute without a structural failure?" They operate at different granularities and are complementary. Phase 5.5 should remain unchanged. Note: lp-do-fact-find also gets a Phase 5.5 (Scope Simulation), which is a different step in a different skill — the naming collision is unavoidable given the decimal sub-phase convention; both Phase 5.5 steps are distinct in their respective skills.
  - Evidence: lp-do-plan SKILL.md Phase 5.5 (lines 162–187) — it runs per-task, not across the whole plan.

- Q: How does the simulation step interact with lp-do-sequence (Phase 7)?
  - A: Simulation (Phase 7.5) runs after lp-do-sequence (Phase 7). lp-do-sequence establishes task order; simulation then traces that order forward to check whether it is executable. The two steps are sequential by design. Simulation depends on sequence being complete — it cannot meaningfully trace a plan whose task order has not yet been finalized.
  - Evidence: lp-do-plan SKILL.md Phase 7 (lines 196–206) — sequencing and edge-case review happen before plan is in final form.

- Q: What is the waiver mechanism for false-positive Critical findings?
  - A: The agent writes a `Simulation-Critical-Waiver` block inline in the plan/fact-find artifact immediately below the simulation trace section. It states the critical flag, the reason it is a false positive, and which task or scope element provides the missing piece the simulation could not see. This creates an audit trail without blocking the pipeline. The waiver is visible to critique.
  - Evidence: Analogy to how lp-do-plan handles DECISION tasks — agent must state a decisive position, not hedge. A waiver forces the same explicit reasoning standard.

- Q: For lp-do-fact-find, what does "simulating the investigation scope" mean concretely?
  - A: The agent walks through each evidence area named in the fact-find scope and asks: (1) Is there a concrete investigation path for this area? (2) Does any evidence area depend on another that has not been investigated first? (3) Are there material system boundaries (APIs, config, auth) referenced in the scope that have no corresponding evidence pointer? The output is a list of scope gaps, not a trace of code execution.
  - Evidence: Fact-find template's Evidence Audit section structure — Entry Points, Key Modules, Dependency & Impact Map — provides the checklist backbone for scope simulation.

- Q: What format does the simulation output take inside the artifact?
  - A: A `## Simulation Trace` section added to the artifact before the persistence step. Structure: one row per task (plan) or per scope area (fact-find), columns: Step, Preconditions Met (Yes/Partial/No), Issues Found (with category and severity), Resolution Required (Yes/No). For lp-do-critique, findings are folded into Step 5 output rather than a separate section.
  - Evidence: Analogy to lp-do-critique's Claim-Evidence Audit table structure (table per claim) — structured per-item output is the established pattern.

### Open (Operator Input Required)

- Q: Should simulation also run on lp-do-replan artifacts?
  - Why operator input is required: lp-do-replan is a separate skill not included in the current dispatch scope. Extending to it is a separate decision with its own scope and insertion point analysis.
  - Decision impacted: Whether the shared simulation-protocol doc is designed for 3 skills or 4+
  - Decision owner: Operator
  - Default assumption: Simulation is scoped to the three named skills for this plan; lp-do-replan extension is deferred as adjacent work.

## Confidence Inputs

- Implementation: 90%
  - Evidence: All three SKILL.md files fully read; insertion points identified with exact phase/step numbers; shared protocol pattern well-established from existing examples
  - What raises to 95%: operator confirms the waiver mechanism format; simulation smoke test artifacts defined
  - What raises to 99%: first live plan run through Phase 7.5 produces a simulation trace that catches a genuine issue

- Approach: 88%
  - Evidence: Option C (tiered gate) is well-supported by analogy to existing gate patterns; false-positive risk is real but mitigated by waiver
  - What raises to 90%: operator confirms hard gate for Critical is acceptable given expected false-positive rate
  - What raises to 95%: one calibration run on a known-defective plan demonstrates false-positive rate is low

- Impact: 85%
  - Evidence: The primary impact claim (simulation catches integration failures before build) is supported by the issue taxonomy — categories like missing precondition, circular dependency, undefined config key are directly observable from plan artifacts
  - What raises to 90%: operator validates that these categories represent the actual failure modes seen in past build failures

- Delivery-Readiness: 92%
  - Evidence: All insertion points are concrete; all SKILL.md edits are specified as phase additions with exact section targets; shared protocol doc design mirrors existing `_shared/` docs
  - What raises to 95%: plan tasks written and reviewed

- Testability: 75%
  - Evidence: SKILL.md docs are not unit-testable; validation is through live runs and critique scoring. Testability is inherently lower for skill documents than for code.
  - What raises to 80%: at least one "simulation smoke test" plan created as a reference artifact that the simulation step is expected to flag

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| High false-positive rate blocks legitimate plans | Medium | High | Waiver mechanism with documented rationale; calibrate by running simulation on 3 recent plans and measuring false positives before enforcing the hard gate |
| Agent forgets to run simulation step (skill not followed) | Medium | Medium | Add to Quick Validation Gate checklists in all three SKILLs; critique penalises missing simulation trace |
| Simulation finds issues critique would find anyway (redundant overhead) | Low | Medium | Simulation runs before critique; if simulation and critique find the same issues, the plan is still better for being caught before critique. Overlap is acceptable — the cost is low |
| Shared protocol doc becomes stale relative to individual SKILL.md edits | Low | Low | Shared docs are the authoritative source; SKILL.md loads and follows — if shared doc drifts, all three skills drift together (same risk applies to existing shared docs) |
| Simulation scope-gap detection for lp-do-fact-find is subjective | Medium | Low | Provide concrete checklist in shared protocol doc: 5 specific scope-gap categories the agent checks rather than open-ended reasoning |

## Planning Constraints and Notes

- Must-follow patterns:
  - New simulation phases must use decimal sub-numbering to avoid renumbering existing phases: `Phase 7.5` in lp-do-plan (after Phase 7, before Phase 8), `Phase 5.5` in lp-do-fact-find (after Phase 5, before Phase 6 persist)
  - Step 5 expansion in lp-do-critique must not change the section numbering in the Required Output Template (which uses `### 5) Feasibility...`)
  - Shared protocol doc must follow the established header/body pattern of `_shared/critique-loop-protocol.md` and `_shared/queue-check-gate.md`
  - Simulation severity taxonomy must use the same labels as lp-do-critique: Critical / Major / Moderate / Minor
- Rollout/rollback expectations:
  - Rollback: remove the simulation phase from each SKILL.md and delete the shared protocol doc. No data migration required.
  - Rollout: SKILL.md edits take effect on the next skill invocation — no deployment step needed
- Observability expectations:
  - Simulation trace section present in plan/fact-find artifacts = simulation ran
  - Critique score improvement over a baseline sample of plans = simulation is adding value
  - Number of Critical waivers written = proxy for false-positive rate

## Suggested Task Seeds (Non-binding)

1. IMPLEMENT: Create `.claude/skills/_shared/simulation-protocol.md` — shared simulation protocol doc with issue taxonomy, trace format, tiered gate rules, and waiver format
2. IMPLEMENT: Edit `lp-do-plan/SKILL.md` — add Phase 7.5 Simulation Trace after Phase 7, before Phase 8; add to Quick Checklist
3. IMPLEMENT: Edit `lp-do-fact-find/SKILL.md` — add Phase 5.5 Scope Simulation after Phase 5 (Route to Module), before Phase 6 (Persist); add to Quick Validation Gate
4. IMPLEMENT: Edit `lp-do-critique/SKILL.md` — expand Step 5 with a Simulation-Trace sub-step; update Required Output Template step 5 accordingly
5. CHECKPOINT: Verify all three SKILL.md edits are internally consistent and cross-reference the shared protocol doc correctly

## Execution Routing Packet

- Primary execution skill:
  - `lp-do-build` (code-change track, editing SKILL.md docs and creating shared protocol doc)
- Supporting skills:
  - none (all deliverables are SKILL.md edits and one new shared protocol doc)
- Deliverable acceptance package:
  - `.claude/skills/_shared/simulation-protocol.md` created and loadable
  - `lp-do-plan/SKILL.md` Phase 7.5 present with correct insertion point and gate logic
  - `lp-do-fact-find/SKILL.md` Phase 5.5 present with correct pre-persistence insertion point and gate logic
  - `lp-do-critique/SKILL.md` Step 5 expanded with forward-trace sub-step
  - All three SKILL.md Quick Validation Gate checklists updated with simulation gate item
- Post-delivery measurement plan:
  - Run simulation step on 3 recent plan artifacts (as dry-run calibration) and record issue category distribution
  - Check critique score on next 5 plans that go through simulation — compare to baseline

## Evidence Gap Review

### Gaps Addressed

1. **All three SKILL.md files read in full.** Every existing phase and step was catalogued, including phase numbers, step names, and the nearest existing analog to simulation in each skill. No gap here.
2. **Shared protocol pattern confirmed.** Both `critique-loop-protocol.md` and `queue-check-gate.md` were read and their loading patterns confirmed. The shared protocol approach is well-established.
3. **Insertion points justified by phase sequencing.** Each insertion point was chosen based on the dependency between phases (simulation needs sequenced plan for lp-do-plan; simulation must precede persistence for the hard gate to be enforceable). For lp-do-fact-find, the insertion is Phase 5.5 — after module investigation, before Phase 6 persistence — correcting an earlier draft that incorrectly placed it at Phase 6.7 (post-persist), which could not have enforced blocking semantics.
4. **Issue taxonomy grounded in observable plan content.** Each category in the simulation taxonomy (missing precondition, circular dependency, undefined config key, API signature mismatch, type contract gap, missing data dependency, integration boundary not handled, scope gap, ordering inversion) is detectable from plan text + repository reads.
5. **Gate options analysed with pros/cons.** Three options evaluated; Option C selected with explicit rationale tied to existing gate patterns.

### Confidence Adjustments

- Implementation confidence set at 90% (not higher) because the waiver mechanism format is new and may need calibration after first use.
- Testability set at 75% because SKILL.md docs are not unit-testable; this is inherent to the deliverable type, not a gap in the fact-find.
- No confidence adjustments required for the issue taxonomy — all categories are directly supported by reasoning about what is visible in plan artifacts.

### Remaining Assumptions

1. The agent executing simulation will read the relevant repository files (schemas, env files, type definitions) to verify preconditions — this is within lp-do-plan's allowed actions ("read/search files and docs") but requires the agent to know which files to check. The shared protocol doc must include guidance on which file types to inspect for each issue category.
2. The false-positive rate for Critical simulation issues is assumed to be low enough that the hard gate does not create significant friction. This assumption should be validated by calibration on recent plans before the hard gate is enforced.
3. Simulation findings fed into the critique loop will improve critique scores by reducing the number of Critical findings the critique must discover itself. This is assumed but not yet empirically demonstrated.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan workflow-skills-simulation-tdd --auto`
