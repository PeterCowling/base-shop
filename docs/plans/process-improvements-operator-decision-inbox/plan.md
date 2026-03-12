---
Type: Plan
Status: Active
Domain: BOS | Startup Loop
Workstream: Operations
Created: 2026-03-10
Last-reviewed: 2026-03-11
Last-updated: 2026-03-12
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: process-improvements-operator-decision-inbox
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-critique
Overall-confidence: 83%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by active-task effort after tranche-1 foundation completion
Auto-Build-Intent: plan-only
---

# Process Improvements Operator App Plan

## Summary
Tranche 1 is complete: the Business OS app is now the authoritative process-improvements runtime, with working `Do`, `Defer`, and `Decline` actions, queue-backed authority, and a durable decision ledger. The remaining gap is no longer action plumbing. It is decision quality at the point of operator review.

The current inbox card is still too system-shaped for the real audience. It exposes dispatch ids, timestamps, and raw evidence paths clearly, but it does not yet help a mixed readership of operators, business stakeholders, and non-technical reviewers decide whether an idea should be taken forward. The next tranche must turn the card into a decision brief that explains the problem, why it matters now, the business-wide benefit of acting, and what will happen after `Do`, while keeping technical evidence available behind the primary narrative.

This plan keeps the existing action semantics and queue authority intact. It focuses on app-side projection, copy contract, audit capture, and UI redesign so that the operator can make a fast decision in business terms rather than needing to interpret technical metadata.

## Active tasks
- [ ] TASK-08: Define and implement the decision-brief projection contract
- [x] TASK-09: Extend decision capture for operator rationale and durable recent-history replay — Complete (2026-03-12)
- [ ] TASK-10: Redesign the inbox UI for mixed and non-technical readers
- [ ] TASK-11: Checkpoint the end-to-end mixed-reader decision flow
- [ ] TASK-12: Add deterministic coverage and targeted frontend QA for the new decision surface

## Goals
- Make each inbox card understandable on first read by non-technical stakeholders.
- Frame benefits in business-wide terms rather than local technical cleanup terms.
- Make `Do`, `Defer`, and `Decline` consequences explicit at card level.
- Preserve route opacity while still showing the expected next step after `Do`.
- Keep technical evidence available as supporting detail without dominating the card hierarchy.
- Replace session-only “recently actioned” behavior with durable, ledger-backed replay.

## Non-goals
- Changing the locked semantics of `Do`, `Defer`, or `Decline`.
- Reopening queue authority, route selection, or report/app runtime decisions.
- Adding new action types beyond `Do`, `Defer`, and `Decline`.
- Turning the static report back into an action surface.
- Broad redesign of Business OS navigation or unrelated inbox patterns.

## Constraints & Assumptions
- Constraints:
  - Queue-backed authority, decision-ledger persistence, and authenticated action APIs are already live and must remain authoritative.
  - The first screenful of a card must work for readers with no queue, schema, or artifact knowledge.
  - Benefits must be phrased in business-wide terms such as speed, risk, clarity, capacity, delivery reliability, or customer impact.
  - Technical evidence must remain available for trust and audit, but only as secondary detail.
  - `Do` must continue to hand off immediately through the existing route machinery.
  - Local Jest/Cypress execution remains out of scope under repo policy; CI is the test authority.
- Assumptions:
  - Existing queue fields plus deterministic projection rules are sufficient to derive a decision brief without introducing speculative freeform copy.
  - Optional operator rationale is most valuable for `Decline`, but the schema should not preclude future use for other actions.
  - The existing Business OS route can absorb a richer card layout without requiring a broader design-system overhaul.

## Inherited Outcome Contract
- **Why:** The repo now has one canonical actionable idea backlog, but the current operator surface is still a passive report. The missing seam is not backlog authority; it is an authenticated decision surface with durable persistence and immediate action handling.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Process improvements becomes a Business OS operator app where queue-backed idea candidates can be marked `Do`, `Defer`, or `Decline`; `Do` immediately hands the item into the normal routing flow, `Defer` hides it for 7 days via a decision ledger, and `Decline` records rejection while moving the queue item to a terminal state.
- **Source:** operator

## Fact-Find Reference
- Related brief: [fact-find.md](/Users/petercowling/base-shop/docs/plans/process-improvements-operator-decision-inbox/fact-find.md)
- Key findings used:
  - The action runtime is already correctly located in `apps/business-os`.
  - The current inbox is functionally correct but still too system-shaped for the decision moment.
  - Mixed and non-technical readers must be able to understand the first screenful without queue or artifact knowledge.
  - Benefits must be translated into business-wide terms, not framed as local technical cleanup.
  - The preferred card shape is now explicit: problem, why now, recommendation, business benefit, expected next step, impact/effort/urgency/recurrence, actions, collapsed evidence.

## Current State Snapshot
- Completed foundation already in place:
  - queue-native projection and queue-path resolver
  - append-only decision ledger
  - authenticated `Do` / `Defer` / `Decline` APIs
  - first-class `declined` queue state and operator actions module
  - Business OS `/process-improvements` route
  - static report reduced to signpost-only
- Remaining product gap:
  - the projection exposes mostly system metadata
  - the card does not explain business benefit or likely consequence clearly enough
  - `Recently actioned` is session-local UI state, not durable replay
  - there is no operator rationale capture path for `Decline`

## Proposed Approach
- Option A: tweak labels and copy in the existing card while leaving the data contract mostly unchanged.
  - Rejected because it would leave the UI dependent on raw system fields and would not reliably produce non-technical, business-framed decision support.
- Option B: add an explicit app-side decision-brief contract, extend the ledger/API for rationale capture and replay, then rebuild the card around that contract.
  - Chosen because it fixes the root problem: the app currently knows workflow state but does not yet present a decision-grade explanation.

## Locked Architecture For This Tranche
- Read model:
  - Keep queue state plus reduced decision-ledger state as authority.
  - Add an app-side decision-brief projection that maps queue/system fields into operator-facing fields such as `problem`, `why_now`, `business_benefit`, `expected_next_step`, `confidence_explainer`, and labeled evidence.
  - The decision-brief projection must be deterministic and evidence-linked; it must not invent unsupported claims.
  - Business-wide benefit wording must come from a controlled taxonomy derived from evidence-backed categories such as delivery speed, risk reduction, team capacity, clarity, customer trust, and conversion reliability.
  - Expected-next-step wording must come from an explicit mapping over `recommendedRoute` and `status`, not ad hoc UI copy.
- Write model:
  - Keep existing action APIs and queue mutations.
  - Extend the decision ledger and API contract to support optional operator rationale for all decisions, while capturing it in the UI for `Decline` in this tranche.
  - Replace session-local recent-action replay with ledger-backed recent decision replay in the app.
  - The recent-history section will show the latest 20 non-`defer` decisions from the last 7 days, ordered by `decided_at` descending.
- Presentation model:
  - Primary hierarchy is plain-language decision support.
  - Technical evidence, dispatch ids, and raw paths move behind a collapsed evidence/details affordance.
  - Action consequences remain visible at point of decision.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-08 | IMPLEMENT | Define and implement the decision-brief projection contract from queue and ledger state | 84% | M | Complete (2026-03-12) | - | TASK-09, TASK-10, TASK-11, TASK-12 |
| TASK-09 | IMPLEMENT | Extend decision capture for operator rationale and durable recent-history replay | 82% | M | Pending | TASK-08 | TASK-10, TASK-11, TASK-12 |
| TASK-10 | IMPLEMENT | Redesign the Business OS inbox UI around the decision brief and mixed-reader rules | 84% | M | Pending | TASK-08, TASK-09 | TASK-11, TASK-12 |
| TASK-11 | CHECKPOINT | Rehearse the mixed-reader end-to-end flow and lock any final wording/ordering adjustments | 83% | S | Pending | TASK-08, TASK-09, TASK-10 | TASK-12 |
| TASK-12 | IMPLEMENT | Add deterministic tests and targeted frontend QA for the decision-grade surface | 84% | M | Pending | TASK-09, TASK-10, TASK-11 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-08 | - | Lock the app-facing decision-brief contract before touching UI hierarchy |
| 2 | TASK-09 | TASK-08 | Rationale capture and durable recent-history replay depend on stable item identity and card semantics |
| 3 | TASK-10 | TASK-08, TASK-09 | UI redesign should consume the final brief and rationale/history seams, not placeholders |
| 4 | TASK-11 | TASK-08, TASK-09, TASK-10 | Rehearse only after the real mixed-reader surface exists |
| 5 | TASK-12 | TASK-09, TASK-10, TASK-11 | Tests and QA should validate the final contract and card behavior |

## Tasks

### TASK-08: Define and implement the decision-brief projection contract
- **Type:** IMPLEMENT
- **Deliverable:** app-side projection layer that transforms queue and ledger state into a deterministic decision brief for each actionable idea
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/business-os/src/lib/process-improvements/projection.ts`, nearby types, any app-side helpers that shape process-improvements copy
- **Depends on:** -
- **Blocks:** TASK-09, TASK-10, TASK-11, TASK-12
- **Confidence:** 84%
  - Implementation: 82% - the existing projection already carries enough raw fields, but the transformation contract must stay evidence-based.
  - Approach: 85% - a dedicated decision-brief layer is cleaner than letting UI components interpret raw queue fields ad hoc.
  - Impact: 85% - this is the core seam that makes the inbox understandable to mixed readers.
- **Acceptance:**
  - The projection emits operator-facing fields that answer:
    - what is the problem
    - why it matters now
    - what business-wide benefit is expected if acted on
    - what will happen next if `Do` is pressed
  - The projection emits a confidence explanation in plain language when confidence is shown.
  - The projection emits labeled evidence summaries suitable for collapsed details UI.
  - The projection contract explicitly separates plain-language decision fields from raw technical evidence.
  - Business-wide benefit output is selected from a controlled, documented taxonomy rather than freeform per-card invention.
  - Expected-next-step output is derived from an explicit mapping table over route/status evidence.
  - New outputs introduced by this task are traced to all consumers in the app route/UI.
- **Expected user-observable behavior:**
  - Card copy reads like a short decision brief rather than a dispatch record.
  - A non-technical reviewer can understand the gist of an item without reading raw file paths.
- **Validation contract (TC-08):**
  - TC-01: a queue-backed dispatch projects into a decision brief without relying on generated report JSON.
  - TC-02: every new field introduced by the brief contract has at least one named consumer in the route or UI layer.
  - TC-03: business-wide benefit copy is derived from the controlled taxonomy via evidence-backed rules, not unsupported speculation.
  - TC-04: expected-next-step copy comes from the explicit route/status mapping and matches one real handoff path.
  - TC-05: confidence narrative falls back safely when evidence is insufficient.
  - TC-06: targeted typecheck/lint pass for `@apps/business-os`.
- **Planning validation evidence:** trace current raw fields in [projection.ts](/Users/petercowling/base-shop/apps/business-os/src/lib/process-improvements/projection.ts) to the card renderer and identify every new consumer before implementation.
- **Rollout/rollback:** keep the existing raw projection contract available behind the app route while the new brief fields are introduced; rollback is to fall back to the previous card mapping without altering queue or ledger semantics.
- **Documentation impact:** update projection comments and this plan to document the distinction between operator brief fields and raw evidence fields.
- **What would make this >=90%:** confirm one real queue item can be projected into a credible decision brief with no unsupported claims and all new fields consumed explicitly.

### TASK-09: Extend decision capture for operator rationale and durable recent-history replay
- **Type:** IMPLEMENT
- **Deliverable:** optional operator rationale capture, persisted in the decision ledger and surfaced as durable recent decision history in the app
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/business-os/src/lib/process-improvements/decision-ledger.ts`, `apps/business-os/src/lib/process-improvements/decision-service.ts`, `apps/business-os/src/app/api/process-improvements/decision/[decision]/route.ts`, `apps/business-os/src/components/process-improvements/**`
- **Depends on:** TASK-08
- **Blocks:** TASK-10, TASK-11, TASK-12
- **Confidence:** 82%
  - Implementation: 80% - the ledger and API seams already exist, but schema and replay behavior must evolve without muddying execution-state semantics.
  - Approach: 83% - rationale and durable replay belong in the ledger rather than in client-only state.
  - Impact: 84% - this increases audit quality and removes the current refresh-loss problem for recent actions.
- **Acceptance:**
  - The decision contract supports optional operator rationale for all decision types, with first-class UI capture for `Decline` in this tranche.
  - Rationale is stored durably alongside the decision event without weakening existing execution-result semantics.
  - The app can render recent decisions from reduced ledger state after refresh, rather than relying on session-local state only.
  - The recent-history replay contract is explicit: latest 20 non-`defer` decisions from the last 7 days, ordered newest first.
  - Consumer tracing covers every new ledger/API field introduced by this task.
- **Expected user-observable behavior:**
  - An operator can supply a short note when declining an idea.
  - Recently actioned decisions remain visible after refresh or revisit, subject to the chosen replay window.
- **Validation contract (TC-09):**
  - TC-01: rationale capture is optional, validated, and preserved end to end from UI to ledger.
  - TC-02: a declined item with rationale can be replayed into the recent-history UI after reload.
  - TC-03: replay includes only non-`defer` decisions from the chosen 7-day / 20-item window.
  - TC-04: existing `Do` and `Defer` semantics remain unchanged if no rationale is supplied.
  - TC-05: targeted typecheck/lint pass for touched app and script paths.
- **Planning validation evidence:** confirm the existing ledger reducer and API request schema can be extended without conflicting with execution-result replay.
- **Rollout/rollback:** rationale fields are additive; rollback is to stop rendering/capturing notes while keeping ledger entries parseable.
- **Documentation impact:** document new ledger fields and recent-history replay window/selection rules near the reducer/service code.
- **What would make this >=90%:** settle the replay window and demonstrate one persisted decline rationale visible after full route reload.

### TASK-10: Redesign the Business OS inbox UI around the decision brief and mixed-reader rules
- **Type:** IMPLEMENT
- **Deliverable:** redesigned `/process-improvements` card layout and action affordances optimized for mixed and non-technical readers
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/business-os/src/app/process-improvements/page.tsx`, `apps/business-os/src/components/process-improvements/ProcessImprovementsInbox.tsx`, any nearby component tests or style helpers
- **Depends on:** TASK-08, TASK-09
- **Blocks:** TASK-11, TASK-12
- **Confidence:** 84%
  - Implementation: 83% - the route already exists, so this is a focused redesign rather than a greenfield build.
  - Approach: 85% - building the card around a stable decision brief keeps the UI simpler and less fragile.
  - Impact: 85% - this is the visible change that turns the inbox into a usable decision tool.
- **Acceptance:**
  - The card hierarchy follows the preferred structure from fact-find:
    - headline
    - why this matters now
    - recommended action and reason
    - business-wide benefit if done
    - expected next step if `Do`
    - impact / effort / urgency / recurrence
    - actions
    - collapsed evidence details
  - Button consequences are visible at card level.
  - Raw dispatch ids and artifact paths are demoted into collapsed details.
  - The recent-history section is ledger-backed, not session-only.
  - Expected user-observable behavior:
    - a non-technical reader can understand what is at stake without opening evidence details
    - `Do`, `Defer`, and `Decline` meanings are visible without relying on the page header alone
    - evidence remains accessible for trust and audit
- **Validation contract (TC-10):**
  - TC-01: the route renders the new decision brief fields end to end.
  - TC-02: action transitions continue to work for `Do`, `Defer`, and `Decline`.
  - TC-03: the recent-history section survives a route refresh because it is replayed from the ledger.
  - TC-04: targeted typecheck/lint pass for `@apps/business-os`.
  - TC-05: post-build QA loop runs `lp-design-qa`, `tools-ui-contrast-sweep`, and `tools-ui-breakpoint-sweep` on the changed route/components, with Critical/Major findings fixed before completion.
- **Planning validation evidence:** review the current card structure in [ProcessImprovementsInbox.tsx](/Users/petercowling/base-shop/apps/business-os/src/components/process-improvements/ProcessImprovementsInbox.tsx) and map every removed/retained metadata element before implementation.
- **Rollout/rollback:** ship behind the existing authenticated route; rollback is to revert to the previous card presentation while keeping the same backend semantics.
- **Documentation impact:** update any route-level description text that still frames the surface as a raw queue review tool rather than a decision brief.
- **What would make this >=90%:** verify one full card renders all required sections cleanly at desktop and mobile breakpoints with no major accessibility or contrast issues.

### TASK-11: Checkpoint the mixed-reader end-to-end flow
- **Type:** CHECKPOINT
- **Deliverable:** one explicit rehearsal of the built flow against mixed-reader and business-framing criteria
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/process-improvements-operator-decision-inbox/plan.md`, `docs/plans/process-improvements-operator-decision-inbox/fact-find.md`, nearby UI copy only if the checkpoint requires a wording correction
- **Depends on:** TASK-08, TASK-09, TASK-10
- **Blocks:** TASK-12
- **Confidence:** 83%
  - Implementation: 83% - the checkpoint is straightforward once the redesigned surface exists.
  - Approach: 83% - a rehearsal against the actual mixed-reader rules is the right gate before final QA.
  - Impact: 84% - this prevents shipping a technically complete but still jargon-heavy decision surface.
- **Acceptance:**
  - One end-to-end rehearsal confirms that a mixed or non-technical reader can understand:
    - the problem
    - why now
    - the business benefit
    - what happens after `Do`
  - Any remaining wording ambiguity is resolved before TASK-12 closes.
  - The checkpoint explicitly confirms that route choice remains hidden while next-step meaning is visible.
- **Validation contract (TC-11):**
  - TC-01: the rehearsal is documented against the built route, not the prior mockup.
  - TC-02: any residual jargon or business-framing gaps are either fixed or recorded as explicit follow-up.
  - TC-03: plan and fact-find remain aligned after the checkpoint.
- **What would make this >=90%:** complete one full rehearsal against a real card after the redesign lands, with no major wording issues left open.

### TASK-12: Add deterministic coverage and targeted frontend QA for the decision-grade surface
- **Type:** IMPLEMENT
- **Deliverable:** focused tests and QA evidence covering the new brief contract, rationale/replay semantics, and mixed-reader UI behavior
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/business-os/src/lib/process-improvements/**`, `apps/business-os/src/components/process-improvements/**`, `apps/business-os/src/app/api/process-improvements/**`, related tests
- **Depends on:** TASK-09, TASK-10, TASK-11
- **Blocks:** -
- **Confidence:** 84%
  - Implementation: 83% - the seams are deterministic enough for focused tests.
  - Approach: 84% - coverage should lock both behavioral correctness and decision-surface clarity.
  - Impact: 85% - this is required to keep the new presentation trustworthy as it evolves.
- **Acceptance:**
  - Projection tests cover the new decision-brief fields and safe fallbacks.
  - API/service tests cover optional rationale persistence and replay.
  - UI tests cover visible business-benefit/next-step/action-consequence rendering and durable recent-history replay.
  - Targeted frontend QA on the changed route/components records no Critical/Major issues.
- **Validation contract (TC-12):**
  - TC-01: every new projection field introduced by TASK-08 is covered either by projection tests or route/UI tests.
  - TC-02: rationale capture and recent-history replay are covered by deterministic tests.
  - TC-03: `Do`, `Defer`, and `Decline` still behave according to the locked semantics after the UI redesign.
  - TC-04: targeted typecheck/lint pass for `@apps/business-os` and any touched script path.
  - TC-05: `lp-design-qa`, `tools-ui-contrast-sweep`, and `tools-ui-breakpoint-sweep` run on the changed surface and any Critical/Major findings are fixed before completion.
- **Planning validation evidence:** reuse the existing process-improvements route/API test patterns instead of inventing a new test style.
- **Rollout/rollback:** tests and QA ship with the feature; rollback is not applicable.
- **Documentation impact:** update nearby test comments only where the new brief contract would otherwise be unclear.
- **What would make this >=90%:** complete end-to-end deterministic coverage for one full decline-with-note flow and one `Do` flow that shows the expected-next-step copy correctly.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-08: Define and implement the decision-brief projection contract | Yes | None | No |
| TASK-09: Extend decision capture for operator rationale and durable recent-history replay | Yes | None | No |
| TASK-10: Redesign the Business OS inbox UI around the decision brief and mixed-reader rules | Yes | Moderate: if the UI starts before TASK-08 fields and TASK-09 replay semantics are locked, the card will regress into ad hoc copy mapping | Yes |
| TASK-11: Checkpoint the mixed-reader end-to-end flow | Yes | None | No |
| TASK-12: Add deterministic coverage and targeted frontend QA for the decision-grade surface | Yes | None | No |

## Risks & Mitigations
- The new business-wide benefit copy could overstate impact beyond the evidence.
  - Mitigation: TASK-08 requires deterministic, evidence-linked phrasing with safe fallbacks and no unsupported claims.
- The UI could remain readable only to technical users if jargon leaks through from raw fields.
  - Mitigation: TASK-10 acceptance requires first-screen comprehension without queue or artifact knowledge, and TASK-11 rehearses this explicitly.
- Recent-history replay could confuse action status if ledger rationale/history is not reduced cleanly.
  - Mitigation: TASK-09 keeps rationale additive and requires durable replay semantics before UI adoption.
- The redesign could bury technical evidence too deeply and reduce operator trust.
  - Mitigation: TASK-10 keeps evidence present in collapsed details rather than removing it.
- The page could say one thing and the backend do another about `Do` next steps.
  - Mitigation: TASK-08 derives expected-next-step copy from route/status evidence, and TASK-12 covers it.

## Observability
- Logging:
  - decision API outcome with rationale-presence flag
  - projection fallback usage for missing business-benefit or next-step copy
  - ledger replay/read failures for recent-history rendering
- Metrics:
  - count of decisions with rationale
  - count of cards using fallback copy
  - count of replayed recent decisions shown in UI
- Alerts/Dashboards:
  - None: internal operator route only in this tranche

## Acceptance Criteria (overall)
- [ ] The `/process-improvements` card is understandable on first read by mixed and non-technical readers.
- [ ] Benefits are framed in business-wide terms, not only as technical cleanup.
- [ ] `Do`, `Defer`, and `Decline` consequences are visible at card level.
- [ ] The app shows an expected next step for `Do` without exposing route choice as a control.
- [ ] Raw dispatch ids and artifact paths are secondary details behind collapsed evidence.
- [ ] Optional operator rationale and durable recent-history replay are supported through the ledger and app UI.
- [ ] Deterministic tests and targeted frontend QA cover the new brief contract and card behavior.

## Decision Log
- 2026-03-10: Chose app runtime in `apps/business-os` over extending the `file://` report.
- 2026-03-10: Locked action semantics to `Do = immediate handoff`, `Defer = ledger-only snooze`, `Decline = terminal queue state + ledger record`.
- 2026-03-10: Locked the app read model to queue state plus reduced decision-ledger overlay; generated process-improvements artifacts remain downstream compatibility outputs only.
- 2026-03-10: Locked the decision-ledger authority to append-only `docs/business-os/process-improvements/operator-decisions.jsonl`.
- 2026-03-10: Chose first-class `queue_state = "declined"` plus `declined_by` metadata instead of overloading generic terminal queue states.
- 2026-03-10: Locked the static report to signpost-only with no mirrored decision overlay.
- 2026-03-11: Opened tranche 2 to turn the inbox from a working action surface into a decision-grade mixed-reader surface.
- 2026-03-11: Locked business-wide benefit framing and non-technical first-read comprehensibility as hard UI requirements.
- 2026-03-11: Locked business-benefit wording to a controlled evidence-backed taxonomy rather than freeform copy generation.
- 2026-03-11: Locked recent-history replay to the latest 20 non-`defer` decisions from the last 7 days, with optional rationale stored for all decision types and UI capture first for `Decline`.

## What Would Make This >=90%
- Prove one real queue item can be transformed into a decision brief with credible business-wide benefit wording and no unsupported claims.
- Complete TASK-11 with no major jargon or ambiguity findings.

## Overall-confidence Calculation
- Active-task confidence dimensions:
  - TASK-08: 84% (M)
  - TASK-09: 82% (M)
  - TASK-10: 84% (M)
  - TASK-11: 83% (S)
  - TASK-12: 84% (M)
- S=1, M=2, L=3
- Overall-confidence = (84x2 + 82x2 + 84x2 + 83x1 + 84x2) / 9 = 83%
