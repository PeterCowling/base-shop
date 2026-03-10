---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: startup-loop-signal-review-review-required-closure
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find, lp-signal-review, startup-loop
Related-Plan: docs/plans/startup-loop-signal-review-review-required-closure/plan.md
Dispatch-ID: IDEA-DISPATCH-20260309181300-9317
Trigger-Why: Signal Review is correctly finding recurring loop failures, but the closure path is still a lossy copy-paste promotion step, so repeated findings can remain visible without becoming durable operator review work.
Trigger-Intended-Outcome: "type: operational | statement: Repeated Signal Review findings create durable review-required workflow items with owner, due date, and escalation state, while keeping final promotion decisions manual. | source: operator"
---

# Startup Loop Signal Review Review-Required Closure Fact-Find Brief

## Scope
### Summary
`lp-signal-review` is right to avoid auto-executing fixes during trial, but its current manual closure path is too lossy: repeated findings become text stubs that rely on manual copy/paste into new fact-finds. This fact-find scopes a middle-ground closure mechanism: durable review-required workflow items that preserve human judgment while removing transcription loss.

### Goals
- Define a durable, operator-reviewed follow-up object for repeated Signal Review findings.
- Preserve manual decision authority while eliminating copy/paste as the primary closure mechanism.
- Add explicit recurrence/escalation handling for findings that reappear across reviews.

### Non-goals
- Auto-spawning code changes or fact-finds without human decision.
- Redesigning principle scoring or signal-review writing style.
- Hard stage-topology changes to the startup loop.

### Constraints & Assumptions
- Constraints:
  - `lp-signal-review` must remain audit-first and trial-safe.
  - Any new closure object should fit the existing startup-loop workflow and queue patterns.
  - Repeated findings need durable tracking without creating duplicate work packages every week.
- Assumptions:
  - A `review-required` queue/work item is a better fit than direct auto-promotion.
  - Escalation thresholds can be added without changing the core principle-scoring rubric.

## Outcome Contract
- **Why:** Signal Review is correctly finding recurring loop failures, but the closure path is still a lossy copy-paste promotion step, so repeated findings can remain visible without becoming durable operator review work.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Repeated Signal Review findings create durable review-required workflow items with owner, due date, and escalation state, while keeping final promotion decisions manual.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `.claude/skills/lp-signal-review/SKILL.md` - signal-review operating contract.
- `docs/business-os/strategy/BRIK/marketing/signal-review-20260226-1641-W09.md` - live repeated-finding artifact.
- `.claude/skills/startup-loop/SKILL.md` - weekly/startup-loop orchestration context.

### Key Modules / Files
- `.claude/skills/lp-signal-review/SKILL.md` - prohibits auto-spawning downstream work and leaves promotion manual.
- `docs/business-os/strategy/BRIK/marketing/signal-review-20260226-1641-W09.md` - shows repeated findings and promotion stubs.
- `docs/business-os/strategy/startup-loop-holistic-strategy.md` - strategic goal of closed-loop learning with evidence-backed action.
- `docs/plans/startup-loop-self-improvement-workflow-closure/fact-find.md` - adjacent workflow-closure work, but not specific to Signal Review recurrence handling.

### Patterns & Conventions Observed
- Signal Review currently emits high-quality findings and process-improvement stubs, but not durable follow-up objects.
  - Evidence: `.claude/skills/lp-signal-review/SKILL.md`
- Repeated findings can be identified in the artifact, but self-audit enforcement is deferred.
  - Evidence: `.claude/skills/lp-signal-review/SKILL.md`, `docs/business-os/strategy/BRIK/marketing/signal-review-20260226-1641-W09.md`
- Current operator action requires manually copying a promotion stub into a new fact-find.
  - Evidence: `docs/business-os/strategy/BRIK/marketing/signal-review-20260226-1641-W09.md`

### Data & Contracts
- Types/schemas/events:
  - Signal Review uses finding fingerprints and repeat labels, which are enough to key durable review items.
- Persistence:
  - Current persistence is the markdown artifact only.
- API/contracts:
  - Review remains manual by contract; the missing piece is durable review queueing, not autonomous execution.

### Dependency & Impact Map
- Upstream dependencies:
  - Signal Review findings and fingerprints.
  - Weekly/S10 cadence.
- Downstream dependents:
  - Operator review queue.
  - Fact-find creation for escalated recurring issues.
  - Startup-loop gate reminders for known unresolved recurring failures.
- Likely blast radius:
  - `lp-signal-review` skill/doc, startup-loop weekly closure logic, and any chosen queue/work-item persistence surface.

### Recent Git History (Targeted)
- No dedicated active plan currently scopes repeated-finding durable closure for Signal Review as a standalone problem.

## Questions
### Resolved
- Q: Does this finding require auto-promotion of Signal Review output?
  - A: No. The gap is durable manual closure, not lack of autonomous execution.
  - Evidence: `.claude/skills/lp-signal-review/SKILL.md`
- Q: Is there live evidence that repeated findings currently rely on copy/paste promotion?
  - A: Yes. The BRIK W09 review includes repeated findings plus promotion stubs and manual instructions.
  - Evidence: `docs/business-os/strategy/BRIK/marketing/signal-review-20260226-1641-W09.md`

### Open (Operator Input Required)
None.

## Confidence Inputs
- Implementation: 84%
  - Basis: this likely spans skills/docs plus a persistence surface for review-required work items.
- Approach: 92%
  - Basis: durable manual closure is the right middle ground for a trial-stage feedback system.
- Impact: 87%
  - Basis: improves repeat-finding follow-through without violating trial governance.
- Delivery-Readiness: 86%
  - Basis: finding fingerprints and repeat states already exist in current artifacts.
- Testability: 79%
  - Basis: some of the work is skill/process-layer and may be more contract-tested than unit-tested.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Review-required items become a second unmaintained backlog | Medium | Medium | Reuse an existing queue/work-item surface and add owner/due-date requirements |
| Escalation semantics become too aggressive for a trial | Medium | Medium | Keep the first implementation advisory/manual and escalate only on explicit recurrence thresholds |
| Overlap with broader workflow-closure work dilutes scope | Medium | Low | Keep this tranche strictly focused on Signal Review recurrence and manual closure quality |

