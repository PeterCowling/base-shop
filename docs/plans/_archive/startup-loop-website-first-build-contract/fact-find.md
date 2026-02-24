---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Venture-Studio
Workstream: Mixed
Created: 2026-02-23
Last-updated: 2026-02-23
Feature-Slug: startup-loop-website-first-build-contract
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-plan, lp-sequence
Related-Plan: docs/plans/startup-loop-website-first-build-contract/plan.md
Business-OS-Integration: off
Business-Unit: BOS
Card-ID: none
direct-inject: true
direct-inject-rationale: Operator requested direct conversion of WEBSITE-01 first-build prompt work into canonical fact-find and planning artifacts.
---

# Startup Loop WEBSITE First-Build Contract — Fact-Find Brief

## Scope
### Summary
Convert the WEBSITE-01 first-build prompt work into a canonical planning packet for startup-loop maintainers: verify where WEBSITE container semantics are already correct, identify remaining contract/documentation drift, and define executable task seeds for hardening.

### Goals
- Confirm WEBSITE container contract in `loop-spec.yaml` is complete and planning-ready.
- Confirm both WEBSITE sub-processes are named and condition-scoped (`pre-website` vs `website-live`) across operator dictionaries and startup-loop skill gates.
- Confirm WEBSITE-01 prompt template is framework-first and bounded to L1 first build.
- Identify residual consistency gaps that can stall builders or create operator ambiguity.

### Non-goals
- Building any business website in this run.
- Writing per-business WEBSITE-01 output artifacts (for example `site-v1-builder-prompt.user.md`).
- Reworking WEBSITE-02 site-upgrade methodology.

### Constraints & Assumptions
- Constraints:
  - Runtime stage ordering and stage IDs remain authoritative in `docs/business-os/startup-loop/loop-spec.yaml`.
  - WEBSITE-01 remains first-build only; WEBSITE-02 remains existing-site upgrade synthesis.
  - Changes must preserve startup-loop gate behavior and fail-closed operator handoff rules.
- Assumptions:
  - First-build and upgrade paths should stay explicitly split by `launch-surface` condition.
  - Operator-facing naming should be label-first but still traceable to canonical stage IDs.

## Evidence Audit (Current State)
### Entry Points
- `docs/business-os/startup-loop/loop-spec.yaml` - authoritative stage graph and WEBSITE container contract.
- `docs/business-os/startup-loop/stage-operator-dictionary.yaml` - canonical operator labels/aliases.
- `.claude/skills/startup-loop/modules/cmd-start.md` - startup gate behavior for WEBSITE artifacts.
- `docs/business-os/workflow-prompts/README.user.md` - canonical prompt-pack index.
- `docs/business-os/workflow-prompts/_templates/website-first-build-framework-prompt.md` - WEBSITE-01 L1 first-build prompt contract.
- `docs/business-os/startup-loop-workflow.user.md` - operator workflow and prompt handoff map.
- `docs/business-os/startup-loop/process-registry-v2.md` - process-layer naming/coverage map.

### Key Modules / Files
- `docs/business-os/startup-loop/loop-spec.yaml:1094` - WEBSITE container declared with two named child stages.
- `docs/business-os/startup-loop/loop-spec.yaml:1108` - WEBSITE-01 defined as `L1 first build framework`, condition `launch-surface = pre-website`.
- `docs/business-os/startup-loop/loop-spec.yaml:1118` - WEBSITE-02 defined as `Site-upgrade synthesis`, condition `launch-surface = website-live`.
- `docs/business-os/startup-loop/stage-operator-dictionary.yaml:903` - WEBSITE, WEBSITE-01, WEBSITE-02 operator labels/aliases are canonicalized.
- `.claude/skills/startup-loop/modules/cmd-start.md:159` - Gate C explicitly branches WEBSITE checks by launch surface and artifact path.
- `docs/business-os/workflow-prompts/README.user.md:45` - WEBSITE-01 prompt template is now first-class in prompt-pack index.
- `docs/business-os/workflow-prompts/_templates/website-first-build-framework-prompt.md:47` - template enforces framework-only structure and measurable DoD.
- `docs/business-os/startup-loop-workflow.user.md:345` - WEBSITE-01 and WEBSITE-02 are listed as separate stage outputs.
- `docs/business-os/startup-loop/process-registry-v2.md:102` - stage coverage map includes WEBSITE-02 only (no explicit WEBSITE-01 row).

### Patterns & Conventions Observed
- WEBSITE replacement is versioned and explicit in loop spec comments and stage graph.
  - Evidence: `docs/business-os/startup-loop/loop-spec.yaml:7`, `docs/business-os/startup-loop/loop-spec.yaml:1094`.
- WEBSITE sub-stages are named and conditional by launch surface.
  - Evidence: `docs/business-os/startup-loop/loop-spec.yaml:1115`, `docs/business-os/startup-loop/loop-spec.yaml:1125`.
- Operator dictionary reflects WEBSITE container + both sub-processes with aliases.
  - Evidence: `docs/business-os/startup-loop/stage-operator-dictionary.yaml:907`, `docs/business-os/startup-loop/stage-operator-dictionary.yaml:920`, `docs/business-os/startup-loop/stage-operator-dictionary.yaml:936`.
- WEBSITE gate behavior is now operationally unambiguous in startup-loop start path.
  - Evidence: `.claude/skills/startup-loop/modules/cmd-start.md:162`, `.claude/skills/startup-loop/modules/cmd-start.md:163`.
- WEBSITE-01 prompt contract now contains explicit sections for guardrails, defaults, build/run contract, traceability, and measurable DoD.
  - Evidence: `docs/business-os/workflow-prompts/_templates/website-first-build-framework-prompt.md:49`, `docs/business-os/workflow-prompts/_templates/website-first-build-framework-prompt.md:78`.
- Residual process-registry/operator-doc drift remains.
  - Evidence: `docs/business-os/startup-loop/process-registry-v2.md:102` (WEBSITE-01 absent), `docs/business-os/startup-loop-workflow.user.md:548` (legacy stage labels still present in prompt handoff map section).

### Data & Contracts
- Stage contract:
  - `spec_version: "3.11.0"` records WEBSITE migration and ordering constraints.
  - Evidence: `docs/business-os/startup-loop/loop-spec.yaml:7`, `docs/business-os/startup-loop/loop-spec.yaml:11`.
- Operator naming contract:
  - `loop_spec_version: "3.11.0"` in stage dictionary matches loop spec.
  - Evidence: `docs/business-os/startup-loop/stage-operator-dictionary.yaml:16`.
- Prompt contract:
  - WEBSITE-01 required output path is deterministic and strategy-local.
  - Evidence: `docs/business-os/workflow-prompts/_templates/website-first-build-framework-prompt.md:11`, `.claude/skills/startup-loop/modules/cmd-start.md:171`.

### Dependency & Impact Map
- Upstream dependencies:
  - `docs/business-os/startup-loop/loop-spec.yaml`
  - `docs/business-os/startup-loop/stage-operator-dictionary.yaml`
- Downstream dependents:
  - `.claude/skills/startup-loop/SKILL.md`
  - `.claude/skills/startup-loop/modules/cmd-start.md`
  - `docs/business-os/workflow-prompts/README.user.md`
  - `docs/business-os/startup-loop-workflow.user.md`
  - stage-operator generated outputs and startup-loop tests.
- Likely blast radius:
  - Medium: startup-loop docs, generated artifacts, and targeted tests/checks.

### Test Landscape
#### Test Infrastructure
- Frameworks:
  - Jest (scripts package), tsx-based generator checks.
- Commands:
  - `pnpm --filter ./scripts run check-stage-operator-views`
  - `pnpm --filter ./scripts test -- --testPathPattern="generate-stage-operator-views.test.ts|derive-state.test.ts" --maxWorkers=2`

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Stage operator view generation | Unit/integration | `scripts/src/startup-loop/__tests__/generate-stage-operator-views.test.ts` | Confirms dictionary-driven outputs + consistency contracts |
| Run-packet derived naming/state | Unit | `scripts/src/startup-loop/__tests__/derive-state.test.ts` | Confirms stage resolution and derived stage metadata |

#### Coverage Gaps
- Process-registry ↔ stage coverage parity for WEBSITE-01 is not currently enforced by tests.
- Legacy stage-label drift inside long-form workflow docs has no automated guard.

### Recent Git History (Targeted)
- `docs/business-os/startup-loop/loop-spec.yaml` recent history shows committed baseline up to v3.10; WEBSITE v3.11 updates are currently local working-tree changes and need canonical planning/ship flow.
  - Evidence: `git log --oneline -- docs/business-os/startup-loop/loop-spec.yaml` (latest listed commit `621740ee86` for v3.10).

## Questions
### Resolved
- Q: Is WEBSITE now a first-class container with named first-build and upgrade processes?
  - A: Yes.
  - Evidence: `docs/business-os/startup-loop/loop-spec.yaml:1094`, `docs/business-os/startup-loop/loop-spec.yaml:1108`, `docs/business-os/startup-loop/loop-spec.yaml:1118`.

- Q: Does startup-loop Gate C now route WEBSITE checks by launch-surface with explicit output artifacts?
  - A: Yes.
  - Evidence: `.claude/skills/startup-loop/modules/cmd-start.md:162`, `.claude/skills/startup-loop/modules/cmd-start.md:163`, `.claude/skills/startup-loop/modules/cmd-start.md:171`.

- Q: Should WEBSITE-01 be explicitly represented in process-layer coverage?
  - A: Yes. Confirmed policy: explicit WEBSITE-01 coverage is mapped through `OFF-3` as bootstrap + recurring website content/merchandising responsibility.
  - Evidence: `docs/business-os/startup-loop/process-registry-v2.md:60`, `docs/business-os/startup-loop/process-registry-v2.md:102`, `docs/business-os/startup-loop/process-registry-v2.md:248`.

### Open (User Input Needed)
- None.

## Confidence Inputs
- Implementation: 84%
  - Evidence basis: core WEBSITE contract already exists across loop-spec, dictionary, gate docs, and prompt pack.
  - What raises to >=80: met.
  - What raises to >=90: close process-registry coverage ambiguity and validate all authoritative docs against drift checks.

- Approach: 82%
  - Evidence basis: framework-first prompt + launch-surface split is aligned with gate logic.
  - What raises to >=80: met.
  - What raises to >=90: add explicit process-registry policy for one-time stage processes and enforce it in documentation checks.

- Impact: 85%
  - Evidence basis: reducing WEBSITE ambiguity directly improves first-build agent execution quality and startup-loop operator clarity.
  - What raises to >=80: met.
  - What raises to >=90: complete residual legacy label cleanup in operator workflow references.

- Delivery-Readiness: 80%
  - Evidence basis: target files and validation commands are known; artifacts are in canonical paths.
  - What raises to >=80: met.
  - What raises to >=90: complete one end-to-end dry run for a business producing `site-v1-builder-prompt.user.md` from template.

- Testability: 78%
  - Evidence basis: generator/state tests pass; process-registry and workflow drift still rely on manual review.
  - What raises to >=80: add one deterministic guard for WEBSITE coverage in process-registry/workflow surfaces.
  - What raises to >=90: wire guard into CI and prove fail/green behavior with fixtures.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| WEBSITE-01 process accountability remains implicit in process-registry | Medium | Medium | Add explicit WEBSITE-01 process row or explicit exemption rule with rationale |
| Legacy stage labels in workflow reference tables cause operator confusion | Medium | Medium | Normalize authoritative workflow references to current stage model |
| Prompt contract drift between template and gate docs | Low | High | Keep prompt path/output path pinned in loop-spec + cmd-start + prompt index checks |
| First-build prompt gets overloaded with WEBSITE-02 concerns | Medium | Medium | Keep explicit in/out scope clauses and enforce in review checklist |
| No automated check for WEBSITE-stage registry parity | Medium | Medium | Add targeted doc-level drift check in scripts validation suite |

## Planning Constraints & Notes
- Must-follow patterns:
  - Keep WEBSITE split by launch surface (`WEBSITE-01` pre-website, `WEBSITE-02` website-live).
  - Keep WEBSITE-01 prompt framework-first; no per-feature micro-spec expansion.
  - Keep all unknown business facts as traceable TODOs in downstream business artifacts.
- Rollout/rollback expectations:
  - Rollout: additive documentation/contract hardening.
  - Rollback: revert WEBSITE-specific docs/tests together to avoid partial contract drift.
- Observability expectations:
  - Stage-operator view checks must remain green.
  - Targeted startup-loop tests for dictionary/state behavior must pass.

## Suggested Task Seeds (Non-binding)
1. Decide and encode WEBSITE-01 process-registry treatment (explicit coverage vs explicit exemption).
2. Update process-registry stage coverage map to remove WEBSITE ambiguity.
3. Normalize legacy stage references in authoritative workflow handoff tables.
4. Add a deterministic drift check for WEBSITE-stage coverage across loop-spec/dictionary/workflow registry surfaces.
5. Run one business dry-run path for WEBSITE-01 prompt instantiation and capture acceptance evidence.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - `lp-do-plan`, `lp-sequence`
- Deliverable acceptance package:
  - updated process registry semantics for WEBSITE-01/02,
  - aligned operator workflow references,
  - drift guard check/tests,
  - validation run evidence.
- Post-delivery measurement plan:
  - zero WEBSITE coverage ambiguity in process registry,
  - zero stale stage-label references in authoritative WEBSITE handoff surfaces,
  - green targeted startup-loop checks.

## Evidence Gap Review
### Gaps Addressed
- Verified WEBSITE contract at source (`loop-spec.yaml`) and operator naming map (`stage-operator-dictionary.yaml`).
- Verified gate-level behavior in startup-loop command module (`cmd-start.md`).
- Verified WEBSITE-01 prompt template includes framework-contract sections and measurable DoD.
- Ran targeted generator/state checks for startup-loop stage operator artifacts.

### Confidence Adjustments
- Raised implementation confidence after green check/test runs.
- Kept testability below 80 due to missing deterministic guard for process-registry/workflow parity.

### Remaining Assumptions
- WEBSITE-01 should be represented as a named process responsibility in process-layer documentation (or explicitly exempted).
- Workflow prompt handoff map should be treated as authoritative enough to require stage-label normalization.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None.
- Recommended next step:
  - `/lp-do-build startup-loop-website-first-build-contract`
