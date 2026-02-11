---
Type: Fact-Find
Outcome: Planning
Status: Proposed
Domain: Business-OS
Workstream: Mixed
Created: 2026-02-10
Last-updated: 2026-02-10
Last-reviewed: 2026-02-10
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: ideas-go-faster-process-hardening
Deliverable-Type: code-change
Execution-Track: mixed
Primary-Execution-Skill: build-feature
Supporting-Skills: none
Related-Plan: docs/plans/ideas-go-faster-process-hardening-plan.md
Business-OS-Integration: off
Business-Unit: BOS
---

# Ideas-Go-Faster Process Hardening Fact-Find Brief

## Scope
### Summary
Audit the `/ideas-go-faster` pipeline contract as an executable process definition and identify high-severity reliability, consistency, and drift risks before further feature additions. The immediate output is a hardened implementation plan that closes contract contradictions across the orchestrator skill, shared cabinet specs, and live Business OS agent API schemas.

### Goals
- Produce a severity-ranked defect inventory with direct evidence references.
- Separate prompt-spec issues from API/runtime issues.
- Define a practical hardening sequence that can be executed incrementally.
- Preserve the strategic model (multi-lens cabinet) while making execution deterministic.

### Non-goals
- Implementing the hardening changes in this fact-find step.
- Replacing the cabinet model with a simpler workflow.
- Redesigning unrelated skills outside the `ideas-go-faster` dependency surface.

### Constraints and Assumptions
- Constraints:
  - `ideas-go-faster` remains prompt-orchestrated in Phase 0 (`.claude/skills/ideas-go-faster/SKILL.md:872`).
  - Existing workflow loop contracts must remain intact (`docs/business-os/agent-workflows.md:206`).
  - No destructive git operations.
- Assumptions:
  - Hardening may require both prompt docs and API endpoint changes.
  - No lock-step migration tool exists today for skill-contract drift.

## Evidence Audit (Current State)
### Entry Points
- `.claude/skills/ideas-go-faster/SKILL.md` - orchestrator contract and stage pipeline.
- `.claude/skills/_shared/cabinet/data-gap-lifecycle.md` - DGP storage, tags, resurfacing semantics.
- `.claude/skills/_shared/cabinet/lens-code-review.md` - technical cabinet trigger and identity contract.
- `.claude/skills/_shared/cabinet/prioritize-drucker-porter.md` - Stage 5 gate and rigor pack contract.
- `apps/business-os/src/app/api/agent/ideas/route.ts` - idea create/list schema and defaults.
- `apps/business-os/src/app/api/agent/cards/route.ts` - card create/list schema.
- `apps/business-os/src/app/api/agent/stage-docs/route.ts` - stage-doc create/list schema.
- `packages/platform-core/src/repositories/businessOsStageDocs.server.ts` - stage-doc ID generation behavior.

### Key Modules / Files
- `.claude/skills/ideas-go-faster/SKILL.md` - extensive policy definition, but currently mixes normative rules and partially stale behavior.
- `.claude/skills/_shared/cabinet/*` - distributed contract surface where drift now occurs.
- `apps/business-os/src/app/api/agent/*` - authoritative write-path behavior; this is the real execution substrate behind sweep persistence.

### Patterns and Conventions Observed
- Prompt-first orchestration with cross-file contracts (high drift susceptibility).
- Tag-driven lifecycle semantics for DGP routing.
- Non-idempotent create flows with retry guidance.
- Determinism emphasized in prose, but not fully represented as machine-checkable fields.

### Data and Contracts
- Ideas POST schema: `business`, `content`, optional `tags`, `priority`, `location`; ID allocated server-side (`apps/business-os/src/app/api/agent/ideas/route.ts:22`, `apps/business-os/src/app/api/agent/ideas/route.ts:117`).
- Cards POST schema: requires lane/priority/owner and description or content; ID allocated server-side (`apps/business-os/src/app/api/agent/cards/route.ts:21`, `apps/business-os/src/app/api/agent/cards/route.ts:121`).
- Stage-doc POST schema: requires existing parent card; stage enum is `fact-find|plan|build|reflect` (`apps/business-os/src/app/api/agent/stage-docs/route.ts:18`, `packages/platform-core/src/repositories/businessOsStageDocs.server.ts:25`).
- Stage-doc IDs are random per create (`packages/platform-core/src/repositories/businessOsStageDocs.server.ts:226`).

### Dependency and Impact Map
- Upstream dependencies:
  - Cabinet shared specs in `.claude/skills/_shared/cabinet/`.
  - Business OS workflow contract in `docs/business-os/agent-workflows.md`.
- Downstream dependents:
  - `/fact-find` discovery freshness contract depends on sweep write correctness (`.claude/skills/fact-find/SKILL.md:825`).
  - `/plan-feature` and `/build-feature` depend on card/stage-doc integrity for lane progression.
- Likely blast radius:
  - Duplicate or inconsistent entities in ideas/cards/stage-docs.
  - Wrong prioritization or resurfacing decisions from tag/status drift.
  - Operator confusion due to contradictory run conditions.

### Delivery and Channel Landscape (for business-artifact or mixed)
- Audience/recipient:
  - Pete (operator), agent authors, maintainers of Business OS workflow.
- Channel constraints:
  - Source-of-truth is repo markdown plus API route behavior.
- Existing templates/assets:
  - Fact-find and plan templates in `.claude/skills/fact-find/SKILL.md` and `.claude/skills/plan-feature/SKILL.md`.
- Approvals/owners:
  - Repo owner/maintainer review for process contract changes.
- Compliance constraints:
  - Must preserve explicit safety/fail-closed behavior and non-destructive ops.
- Measurement hooks:
  - Sweep report run-status + create-failure accounting.
  - Discovery index freshness/staleness contract.

### Test Landscape (required for `code` or `mixed`)
#### Test Infrastructure
- Frameworks:
  - Jest-based API route tests (existing in `apps/business-os/src/app/api/agent/.../__tests__`).
- Commands:
  - Targeted package test runs via pnpm filters.
- CI integration:
  - Standard repo validation gates (typecheck/lint + targeted tests).

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Agent ideas/cards/stage-doc routes | unit/integration | `apps/business-os/src/app/api/agent/*/__tests__/route.test.ts` | Covers endpoint behavior, but not sweep orchestration contracts. |
| Cabinet prompt contracts | review-only | `.claude/skills/_shared/cabinet/*.md` | No executable drift checks today. |

#### Test Patterns and Conventions
- API schemas are runtime-validated through Zod in route handlers.
- Prompt contracts rely on manual review and can silently diverge.

#### Coverage Gaps (Planning Inputs)
- Untested paths:
  - No automated test that reconciles `ideas-go-faster` write/retry semantics with non-idempotent API behavior.
  - No contract test ensuring DGP tags emitted by orchestrator align with lifecycle docs.
  - No check for internal contradiction in orchestrator trigger/failure rules.
- Extinct tests:
  - None identified in this fact-find scope.

#### Testability Assessment
- Easy to test:
  - API route schema behavior, duplicate-write behavior under retries, tag/status query filters.
- Hard to test:
  - Prompt semantic drift across large markdown specs without explicit machine-readable contracts.
- Test seams needed:
  - Add a contract-check script (or tests) that parses key fields from orchestrator/shared docs and compares expected constants.

#### Recommended Test Approach
- Unit/integration tests for idempotency and retry-safe create semantics.
- Contract checks for tag schemas, trigger rules, and stage gate invariants.
- Targeted regression checklist against severity-ranked defects from this brief.

## Findings
### F1 (Critical): Technical cabinet activation state is contradictory
- Evidence:
  - Triggered by stance/flags/diff artifacts (`.claude/skills/ideas-go-faster/SKILL.md:604`).
  - Also marked deferred pending CS-13 (`.claude/skills/ideas-go-faster/SKILL.md:877`, `.claude/skills/ideas-go-faster/SKILL.md:851`).
  - Lens persona already exists and is active (`.claude/skills/_shared/cabinet/lens-code-review.md:17`).
- Impact:
  - Operators cannot know expected behavior; runs can be interpreted as both compliant and non-compliant.

### F2 (Critical): Retry policy plus non-idempotent POST semantics risks duplicate entities
- Evidence:
  - Retry-on-failure guidance in sweep (`.claude/skills/ideas-go-faster/SKILL.md:90`).
  - Server allocates new IDs on idea/card creation (`apps/business-os/src/app/api/agent/ideas/route.ts:117`, `apps/business-os/src/app/api/agent/cards/route.ts:121`).
  - Stage-doc IDs are random (`packages/platform-core/src/repositories/businessOsStageDocs.server.ts:226`).
- Impact:
  - Partial failures or timeout ambiguity can create duplicate ideas/cards/stage-docs.

### F3 (Critical): DGP contract drift (`gate-unresolved` tag missing in orchestrator)
- Evidence:
  - Orchestrator hold tags omit `gate-unresolved` (`.claude/skills/ideas-go-faster/SKILL.md:418`).
  - Lifecycle contract requires `gate-unresolved` for specific handling and VOI boost (`.claude/skills/_shared/cabinet/data-gap-lifecycle.md:214`, `.claude/skills/_shared/cabinet/data-gap-lifecycle.md:222`).
- Impact:
  - Contrarian-gate unresolved items can be under-prioritized and lose artifact-specific resurfacing behavior.

### F4 (High): DGP resurfacing query assumptions are under-specified against API defaults
- Evidence:
  - Resurfacing requires DGPs with `status=raw` (`.claude/skills/ideas-go-faster/SKILL.md:191`).
  - Ideas list defaults to `location=inbox` when unspecified (`apps/business-os/src/app/api/agent/ideas/route.ts:68`).
  - Lifecycle includes raw-to-worked progression (`.claude/skills/_shared/cabinet/data-gap-lifecycle.md:617`).
- Impact:
  - Resurfacing can silently miss eligible backlog items.

### F5 (High): Lens identity mismatch (`engineering` vs `code-review`)
- Evidence:
  - Orchestrator assigns `Originator-Lens: engineering` for technical cabinet output (`.claude/skills/ideas-go-faster/SKILL.md:620`).
  - Technical lens defines canonical originator as `code-review` (`.claude/skills/_shared/cabinet/lens-code-review.md:3`).
- Impact:
  - Clustering, reporting, and filtering can fragment technical ideas.

### F6 (High): Stage 7b activation contract has no invocation surface
- Evidence:
  - Stage 7b needs explicit `stage7b_backfill_enabled=true` (`.claude/skills/ideas-go-faster/SKILL.md:573`).
  - Invocation examples expose stance and force-code-review only (`.claude/skills/ideas-go-faster/SKILL.md:17`).
- Impact:
  - Optional feature cannot be reliably invoked as documented.

### F7 (Medium): Internal consistency quality debt in report grammar/rules
- Evidence:
  - Duplicate section numbering (`.claude/skills/ideas-go-faster/SKILL.md:700`, `.claude/skills/ideas-go-faster/SKILL.md:701`).
  - Fatal fallback paradox around report writing (`.claude/skills/ideas-go-faster/SKILL.md:84`, `.claude/skills/ideas-go-faster/SKILL.md:86`).
  - Hardcoded owner in card payload despite ownership invariants (`.claude/skills/ideas-go-faster/SKILL.md:517`).
- Impact:
  - Reduces operator trust and increases interpretation drift.

## Questions
### Resolved
- Q: Are the major failures mostly stylistic?
  - A: No. Multiple issues are execution-critical (idempotency, tag contract drift, contradictory triggers).
- Q: Is the API contract itself incompatible with the sweep design?
  - A: Not inherently, but current retry semantics are unsafe without an idempotency layer.
- Q: Can hardening proceed without replacing the cabinet architecture?
  - A: Yes. Most defects are contract and reliability hardening, not model replacement.

### Open (User Input Needed)
- None required for planning. The plan can proceed with defaults and includes any strategic choices as explicit DECISION tasks where needed.

## Confidence Inputs (for /plan-feature)
- Implementation: 87%
  - Strong evidence map and concrete file-level defect locations.
  - Remaining uncertainty is mostly around implementation shape for idempotency.
- Approach: 90%
  - Hardening-first approach is clearly indicated by severity profile.
- Impact: 93%
  - Directly protects core workflow reliability (`ideas -> cards -> stage-docs`).
- Delivery-Readiness: 89%
  - Required artifacts and owners are clear; no external dependency blocks planning.
- Testability: 80%
  - API behaviors are testable; prompt-contract drift needs new check tooling.

## Planning Constraints and Notes
- Must-follow patterns:
  - Keep top-k deterministic semantics once normalized.
  - Preserve workflow loop (`ideas-go-faster -> fact-find -> plan-feature -> build-feature`).
- Rollout/rollback expectations:
  - Deploy in bounded slices: docs contract first, idempotency next, then regression checks.
  - Keep reversible migrations for API behavior changes.
- Observability expectations:
  - Explicit metrics for duplicate create attempts and contract-check failures.

## Suggested Task Seeds (Non-binding)
- Normalize orchestrator invariants and trigger rules against active lens contracts.
- Implement idempotency strategy for create endpoints and align sweep retry policy.
- Align DGP tag/status contracts across orchestrator and lifecycle docs.
- Add deterministic contract checks for top-k ranking and stage7b activation path.
- Introduce automated drift checks between shared cabinet files and orchestrator constants.

## Execution Routing Packet
- Primary execution skill:
  - `/build-feature`
- Supporting skills:
  - `/sequence-plan` for dependency waves.
- Deliverable acceptance package:
  - Updated orchestrator/shared cabinet docs, targeted API behavior tests, and documented reconciliation runbook.
- Post-delivery measurement plan:
  - Track duplicate-write incidence, resurfacing hit-rate, and contract-check pass/fail per sweep.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None
- Recommended next step:
  - Proceed to `/plan-feature ideas-go-faster-process-hardening`
