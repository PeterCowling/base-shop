---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: BOS | Startup Loop
Workstream: Operations
Created: 2026-03-06
Last-updated: 2026-03-06
Feature-Slug: ideas-work-package-promotion
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/ideas-work-package-promotion/plan.md
Trigger-Why: The ideas pipeline logs small related opportunities atomically, but promotion into fact-find/build lacks a first-class work-package seam. That forces repeated overhead for tightly related changes and pushes operators into undocumented manual bundling.
Trigger-Intended-Outcome: "type: operational | statement: Related queued idea dispatches can be promoted into one canonical fact-find / plan / build cycle with deterministic bundle discovery, explicit traceability, and queue-state updates for every dispatch in the work package. | source: operator"
direct-inject: true
direct-inject-rationale: Operator requested a workflow-level fix based on a process audit, not a queued dispatch packet.
---

# Ideas Work-Package Promotion Fact-Find Brief

## Scope
### Summary
`lp-do-ideas` intentionally emits narrow atomic dispatches, but the handoff into `lp-do-fact-find -> lp-do-plan -> lp-do-build` lacks a formal work-package model. Related small ideas can be bundled in practice, but only via undocumented frontmatter drift such as `Dispatch-IDs`. The workflow needs a proper seam that preserves atomic logging while allowing one fact-find and one plan to promote a coherent set of adjacent dispatches.

### Goals
- Add deterministic work-package candidate discovery for pending fact-find dispatches.
- Add deterministic queue-state processing support for multi-dispatch fact-find promotion.
- Make multi-dispatch fact-finds canonical in the loop output contract and template.
- Update queue-check/fact-find workflow docs so bundled promotion becomes the defined path.

### Non-goals
- Replacing atomic dispatch generation in `lp-do-ideas`.
- Changing build-time completion behavior beyond the already-supported multi-dispatch completion hook.
- Adding autonomous bundling without operator confirmation.

### Constraints & Assumptions
- Constraints:
  - Atomic dispatch logging remains the source of truth.
  - Bundling must fail closed on queue-state conflicts.
  - Queue-state writes must stay atomic and idempotent.
- Assumptions:
  - Grouping suggestions are advisory; the operator still confirms bundled promotion.
  - Existing multi-dispatch build completion by shared `fact_find_slug` remains the downstream completion mechanism.

## Outcome Contract
- **Why:** Related ideas are already being bundled manually, but the workflow contract still pretends every promotion is one dispatch to one slug. That mismatch wastes time and tokens and makes traceability inconsistent.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The ideas workflow supports canonical multi-dispatch work packages before fact-find promotion, with deterministic candidate discovery, explicit fact-find metadata, and queue-state processing for every bundled dispatch.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `.claude/skills/lp-do-ideas/SKILL.md`
- `.claude/skills/_shared/queue-check-gate.md`
- `.claude/skills/lp-do-fact-find/SKILL.md`
- `docs/business-os/startup-loop/contracts/loop-output-contracts.md`
- `scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-completion.ts`

### Key Modules / Files
- `.claude/skills/lp-do-ideas/SKILL.md` — requires one dispatch packet per gap and independent actionability.
- `.claude/skills/_shared/queue-check-gate.md` — singular packet confirmation path today.
- `docs/business-os/startup-loop/contracts/loop-output-contracts.md` — canonical fact-find frontmatter still models singular `Dispatch-ID`.
- `docs/plans/brikette-funnel-test-hardening/fact-find.md` — real multi-dispatch fact-find with five dispatches.
- `docs/plans/email-logging-observability/fact-find.md` — real multi-dispatch fact-find with three dispatches.
- `scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-completion.ts` — downstream already completes multiple dispatches via shared `fact_find_slug`.

### Patterns & Conventions Observed
- Atomic dispatch fields already exist for clustering and traceability (`root_event_id`, `cluster_key`, `cluster_fingerprint`), but no first-class work-package contract exists upstream.
- Bundled fact-finds already exist in practice, proving the need is real.
- Queue-state completion is already multi-dispatch-aware by `processed_by.fact_find_slug`.

### Data & Contracts
- Types/schemas/events:
  - `dispatch.v2` includes `root_event_id`, `cluster_key`, `cluster_fingerprint`, `processed_by`.
  - queue-state uses legacy `dispatches[]` with denormalized `counts`.
- Persistence:
  - `docs/business-os/startup-loop/ideas/trial/queue-state.json`
- API/contracts:
  - fact-find contract supports `Dispatch-ID` only today.

### Dependency & Impact Map
- Upstream:
  - queued dispatch packets in trial queue
- Downstream:
  - fact-find frontmatter
  - queue-state `processed_by`
  - build completion hook keyed by `fact_find_slug`
- Likely blast radius:
  - workflow docs/contracts
  - scripts ideas utilities
  - tests for queue/work-package behavior

## Questions
### Resolved
- Q: Is the right fix to stop decomposing ideas into atomic packets?
  - A: No. Atomic logging is still correct. The missing seam is the promotion layer between queue and fact-find.

### Open (Operator Input Required)
None.

## Confidence Inputs
- Implementation: 90%
  - Evidence: existing queue-state completion helper and real multi-dispatch fact-find precedents reduce ambiguity.
- Approach: 89%
  - Evidence: add advisory candidate discovery plus explicit queue-state promotion helper; no runtime orchestration rewrite needed.
- Impact: 88%
  - Evidence: directly reduces repeated fact-find/plan/build overhead for related small ideas while preserving traceability.
- Delivery-Readiness: 92%
  - Evidence: scope is bounded to scripts + workflow docs/contracts.
- Testability: 90%
  - Evidence: queue-state mutations and candidate derivation are deterministic and temp-file testable.

## Planning Readiness
- Go: The required seam and acceptance criteria are clear. Recommended deliverable type: `multi-deliverable`. Primary execution skill: `lp-do-build`.
