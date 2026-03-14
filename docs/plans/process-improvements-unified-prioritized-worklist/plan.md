---
Type: Plan
Status: Complete
Domain: BOS | Startup Loop
Workstream: Mixed
Created: 2026-03-11
Last-reviewed: 2026-03-11
Last-updated: 2026-03-11
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: process-improvements-unified-prioritized-worklist
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 83%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan-only
Related-Analysis: docs/plans/process-improvements-operator-actions-integration/analysis.md
Related-Plan: docs/plans/process-improvements-operator-actions-integration/plan.md
---

# Process Improvements Unified Prioritized Worklist Plan

## Summary
`/process-improvements` currently aggregates queue-backed process-improvement dispatches and canonical operator actions on one route, but it still models and renders them as separate streams. The projection returns a tagged union, the component re-splits that union into separate sections, and each stream is sorted by different logic. The operator therefore still has multiple inboxes instead of one ordered list of what to do next.

This tranche replaces the mixed-inbox model with one unified work-item model. Queue-backed items and operator actions will be projected into one shared contract, ranked by one explicit prioritization policy, and rendered as one primary active list. Deferred and recently actioned states can remain visible, but only as secondary views beneath the single active worklist.

## Active tasks
- [x] TASK-01: Replace the mixed projection union with one unified work-item contract and ranking policy
- [x] TASK-02: Collapse the UI into one prioritized active list with shared secondary sections
- [x] TASK-03: Checkpoint ordering evidence, unified-state behavior, and residual contract gaps

## Goals
- Give the operator one prioritized list of active work.
- Unify queue-backed ideas and operator actions into one projection contract.
- Preserve current queue and operator-action write semantics while removing split presentation.
- Make the ranking policy explicit, deterministic, and testable.

## Non-goals
- Replacing queue state as the write authority for queue-backed ideas.
- Removing operator-action durable memory or registry parity work already completed.
- Expanding registry generation beyond the canonical operator-actions source already in place.
- Reintroducing HTML parsing or registry scraping into the app runtime.

## Constraints & Assumptions
- Constraints:
  - Queue-backed `Do`, `Defer`, and `Decline` behavior must remain correct.
  - Operator-action `done` and `snooze` behavior must remain correct.
  - Local Jest runs remain out of scope under repo policy; targeted typecheck/lint and deterministic repo-state probes are the local validation path.
  - Hydration-safe deterministic rendering must be preserved.
  - The route must remain safe when `operator-actions.json` is absent or empty.
- Assumptions:
  - One unified work-item contract is the correct route-facing seam even if the underlying write paths remain separate.
  - Active work should sort ahead of deferred/snoozed and recent history.
  - Overdue operator actions should outrank queue backlog by default unless concrete repo evidence later proves otherwise.

## Inherited Outcome Contract
- **Why:** The operator now has two separate places to look for work that should really be managed together: the process-improvements inbox and the output-registry operator card. That splits attention, hides overdue actions, and leaves the app unable to show the most important operator decisions. The next step is to stop presenting multiple inboxes inside the route itself and give the operator one prioritized list of actions.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Business OS presents one prioritized operator worklist that unifies queue-backed process improvements and canonical operator actions behind one deterministic projection contract and one active-list UI.
- **Source:** operator

## Analysis Reference
- Related analysis: `docs/plans/process-improvements-operator-actions-integration/analysis.md`
- Selected approach inherited:
  - Keep the canonical `operator-actions` source as the structured authority for startup-loop operator work.
  - Keep queue-backed and operator-action write semantics separate under the hood.
  - Preserve the no-HTML-parsing constraint and additive app-side source loading.
- Key reasoning used:
  - The completed mixed-inbox tranche solved source integration but stopped short of a single operator queue.
  - The current split now lives in projection, sorting, and UI composition, so UI-only reordering is insufficient.
  - The operator explicitly superseded the mixed-inbox requirement with a stronger requirement: one prioritized list of things to do.

## Selected Approach Summary
- What was chosen:
  - Introduce one route-facing `ProcessImprovementsWorkItem` contract, project both current sources into it, rank all active items with one deterministic policy, and render one primary active list with data-driven actions.
- Why planning is reopening option selection:
  - The previous analysis intentionally chose a mixed inbox with separate semantics and separate card families. The operator has now explicitly changed the requirement to a single prioritized list, so the prior architecture is a completed tranche, not the final product shape.

## Fact-Find Support
- Supporting brief: `docs/plans/process-improvements-operator-actions-integration/fact-find.md`
- Evidence carried forward:
  - `apps/business-os/src/lib/process-improvements/projection.ts` still projects queue and operator work as two distinct item contracts and concatenates them.
  - `apps/business-os/src/components/process-improvements/ProcessImprovementsInbox.tsx` still re-splits the data into separate active sections and applies independent stream-specific sorting.
  - Queue decisions and operator-action decisions already have separate but isolated service/API paths, so the projection can unify without collapsing the backends.
  - The completed canonical operator-actions source and registry parity work remain valid inputs and should not be undone.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No (`plan-only` requested)

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Replace mixed inbox data with one typed work-item projection and deterministic ranking policy | 84% | M | Complete (2026-03-11) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Render one prioritized active list with unified card chrome and shared deferred/recent sections | 82% | M | Complete (2026-03-11) | TASK-01 | TASK-03 |
| TASK-03 | CHECKPOINT | Verify ordering, unified state handling, and record residual contract gaps | 85% | S | Complete (2026-03-11) | TASK-01, TASK-02 | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | Replace section-based split UI with one active list and one card shell that varies by work-item metadata rather than stream section | TASK-02, TASK-03 | Prioritization must be legible without making operator items visually noisy |
| UX / states | Unify active, deferred, snoozed, and recent behavior around one route-facing work-item state model | TASK-01, TASK-02, TASK-03 | The operator should never have to infer which inbox to check first |
| Security / privacy | Preserve current admin-only decision APIs and avoid widening mutation scope while unifying presentation | TASK-01, TASK-02 | The work-item contract is read-model unification, not auth-model expansion |
| Logging / observability / audit | Preserve source IDs, queue dispatch IDs, operator action IDs, and decision replay fields in the unified model | TASK-01, TASK-03 | Existing ledgers remain authoritative per source-specific action path |
| Testing / validation | Add projection ordering coverage, UI ordering/section coverage, and rerun targeted typecheck/lint plus deterministic repo-state ordering probes | TASK-01, TASK-02, TASK-03 | Local Jest stays out of scope; CI remains the test authority |
| Data / contracts | Introduce one route-facing work-item contract with data-driven actions and unified state groups | TASK-01 | Consumer tracing is required because projection output changes materially |
| Performance / reliability | Keep empty-safe loading and deterministic ranking; avoid making the route depend on generated report artifacts | TASK-01, TASK-02 | One work-item contract must not add new runtime source coupling |
| Rollout / rollback | Keep the change additive to app projection/UI only; rollback is to restore the previous mixed-section projection consumer | TASK-01, TASK-02, TASK-03 | No queue migration or ledger migration should be required |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Lock the unified contract and ranking policy first so UI work is not built on a temporary shape |
| 2 | TASK-02 | TASK-01 | The UI should consume the final work-item contract, not duplicate ranking logic locally |
| 3 | TASK-03 | TASK-01, TASK-02 | Final checkpoint only makes sense once the route shows one real active list |

## Tasks

### TASK-01: Replace the mixed projection union with one unified work-item contract and ranking policy
- **Type:** IMPLEMENT
- **Deliverable:** one route-facing work-item contract plus deterministic active/deferred/resolved grouping and ranking across queue-backed ideas and operator actions
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-03-11)
- **Affects:** `apps/business-os/src/lib/process-improvements/projection.ts`, `apps/business-os/src/lib/process-improvements/projection.test.ts`, `apps/business-os/src/lib/process-improvements/decision-service.ts`, `apps/business-os/src/lib/process-improvements/operator-action-service.ts`, any route-facing projection consumers
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 84%
  - Implementation: 82% - the source-specific loaders and ledgers already exist, but the route-facing contract change has multiple downstream consumers.
  - Approach: 86% - projection unification is the correct seam; UI-only collapse would leave the core split intact.
  - Impact: 84% - this is the necessary foundation for a genuine single worklist.
- **Acceptance:**
  - `loadProcessImprovementsProjection()` returns one unified work-item list rather than a tagged mixed inbox union.
  - Every active item exposes one shared state/grouping model and a data-driven action set.
  - One deterministic ranking policy orders active queue-backed and operator-action items together.
  - Deferred queue items and snoozed operator actions can be derived from the same route-facing contract without stream-specific branching at the route boundary.
  - Queue and operator-action write services still resolve the correct underlying item from the unified projection.
- **Expected user-observable behavior:**
  - The visible list order is driven by one policy instead of “queue first, operator first, or created-date first” depending on section.
  - Deferred/snoozed items remain out of the main active list.
- **Planning validation evidence:**
  - `projection.ts` currently concatenates two incompatible item families and therefore cannot express one cross-stream order.
  - `decision-service.ts` and `operator-action-service.ts` both query the current projection and will need consumer-safe access to the unified contract.
  - `ProcessImprovementsInbox.tsx` currently derives stream-specific collections locally, proving the ranking seam is in the wrong place today.
- **Consumer tracing:**
  - New output: unified work-item contract from `loadProcessImprovementsProjection()`.
    Consumers: `apps/business-os/src/app/process-improvements/page.tsx`, `apps/business-os/src/components/process-improvements/ProcessImprovementsInbox.tsx`, `apps/business-os/src/lib/process-improvements/decision-service.ts`, `apps/business-os/src/lib/process-improvements/operator-action-service.ts`, `apps/business-os/src/lib/process-improvements/projection.test.ts`.
  - Modified behavior: `items` ceases to mean “mixed union that callers re-split” and becomes “already unified route-facing work items”.
    Consumers above must all be updated in this task or explicitly shielded behind compatibility helpers.
  - Unchanged consumer note: registry/report generation is unchanged because it already consumes canonical operator actions directly rather than the app projection.
- **Validation contract (TC-01):**
  - TC-01-A: projection tests cover unified ranking across queue-backed and operator-action items.
  - TC-01-B: projection tests cover active vs deferred/snoozed/resolved grouping on the unified contract.
  - TC-01-C: targeted `pnpm --filter @apps/business-os typecheck`.
  - TC-01-D: targeted `pnpm --filter @apps/business-os lint`.
- **Engineering Coverage:**
  - `UI / visual` — Required: expose enough metadata in the unified contract for one card shell to render meaningfully.
  - `UX / states` — Required: encode active/deferred/resolved grouping in one shared model.
  - `Security / privacy` — Required: preserve existing admin-only write paths and avoid widening action capabilities accidentally.
  - `Logging / observability / audit` — Required: retain stable queue/operator source IDs and replay fields in the unified model.
  - `Testing / validation` — Required: add deterministic ranking/grouping coverage plus targeted typecheck/lint.
  - `Data / contracts` — Required: replace the route-facing union with one shared work-item contract and action capability model.
  - `Performance / reliability` — Required: keep source loading empty-safe and ranking deterministic.
  - `Rollout / rollback` — Required: make the projection change reversible without ledger or source migrations.
- **What would make this >=90%:** a dry-run repo-state probe that prints the top-ranked unified active list from current data and matches the expected operator-first order.
- **Build completion evidence (2026-03-11):**
  - Replaced the previous mixed-union route contract in `apps/business-os/src/lib/process-improvements/projection.ts` with one shared work-item model carrying `itemKey`, `statusGroup`, `stateLabel`, `priorityBand`, `priorityReason`, and `availableActions` across both queue-backed and operator-action items.
  - Preserved source-specific write semantics by keeping `apps/business-os/src/lib/process-improvements/decision-service.ts` and `apps/business-os/src/lib/process-improvements/operator-action-service.ts` keyed off the unified projection while still resolving queue dispatch IDs and operator action IDs separately.
  - Added deterministic projection coverage in `apps/business-os/src/lib/process-improvements/projection.test.ts` for mixed-source ordering plus active/deferred/resolved grouping.
  - TC-01-A: pass — `projection.test.ts` now asserts one mixed ranking order across overdue blockers, active gates, queue backlog, deferred items, and resolved operator actions.
  - TC-01-B: pass — `projection.test.ts` now asserts unified `statusGroup` transitions and shared action metadata across deferred/snoozed/resolved items.
  - TC-01-C: pass — `scripts/agents/integrator-shell.sh --read-only -- pnpm --filter @apps/business-os typecheck`.
  - TC-01-D: pass — `scripts/agents/integrator-shell.sh --read-only -- pnpm --filter @apps/business-os lint`.
  - Confidence-raising repo-state probe: pass — live projection snapshot returned `54` total items, `54` active, `0` deferred, `0` recent, with the top eight active entries all operator actions led by overdue blockers (`HEAD-BLK-01` through `HEAD-BLK-06`) before queue backlog.

### TASK-02: Collapse the UI into one prioritized active list with shared secondary sections
- **Type:** IMPLEMENT
- **Deliverable:** one active worklist UI backed by the unified contract, with shared deferred and recent sections and data-driven action controls
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-03-11)
- **Affects:** `apps/business-os/src/app/process-improvements/page.tsx`, `apps/business-os/src/components/process-improvements/ProcessImprovementsInbox.tsx`, `apps/business-os/src/components/process-improvements/ProcessImprovementsInbox.test.tsx`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 82%
  - Implementation: 80% - the current component already centralizes inbox state, but it still assumes stream-specific cards and handlers.
  - Approach: 84% - once the projection is unified, the UI collapse is straightforward and avoids duplicated ranking logic.
  - Impact: 83% - this is the user-visible removal of the split inbox problem.
- **Acceptance:**
  - The route shows one primary active list instead of separate “Operator actions” and “Awaiting decision” sections.
  - Deferred queue items and snoozed operator actions appear in one shared deferred section.
  - Recent completed actions remain in one recent section without reintroducing stream separation.
  - Card chrome is shared; source-specific labels and actions are driven by work-item metadata rather than section type.
  - Queue items still expose `Do` / `Defer` / `Decline`, and operator actions still expose `Mark done` / `Snooze`.
- **Expected user-observable behavior:**
  - The top of the page shows one ordered list of current work.
  - The operator no longer has to scan multiple active sections to decide what to do first.
  - Deferred and recent items remain visible, but clearly secondary to the active queue.
- **Planning validation evidence:**
  - `ProcessImprovementsInbox.tsx` currently re-splits items into four stream-derived collections and renders two separate active sections.
  - The current component already owns both fetch paths, so a data-driven per-item action dispatch layer can replace section-based branching.
- **Validation contract (TC-02):**
  - TC-02-A: component tests cover one active list with mixed work-item ordering.
  - TC-02-B: component tests cover unified deferred section behavior for both queue defers and operator snoozes.
  - TC-02-C: targeted `pnpm --filter @apps/business-os typecheck`.
  - TC-02-D: targeted `pnpm --filter @apps/business-os lint`.
  - TC-02-E: targeted route walkthrough of `/process-improvements` confirms one active prioritized list and preserved actions per item.
- **Engineering Coverage:**
  - `UI / visual` — Required: replace section-based chrome with one primary list and shared card shell.
  - `UX / states` — Required: make active vs deferred vs recent state legible without stream-specific headings doing the work.
  - `Security / privacy` — Required: keep current route auth assumptions and do not expose unsupported actions on the wrong item type.
  - `Logging / observability / audit` — Required: keep action errors and notices attributable per item key.
  - `Testing / validation` — Required: update component coverage for ordering, action visibility, and state movement.
  - `Data / contracts` — Required: consume the unified work-item contract with no stream re-splitting in the component.
  - `Performance / reliability` — Required: avoid duplicating ranking/splitting logic in the client.
  - `Rollout / rollback` — Required: keep the UI refactor limited to this route and reversible to the previous mixed-section rendering.
- **Scoped post-build QA requirement:**
  - Run targeted `lp-design-qa`, `tools-ui-contrast-sweep`, and `tools-ui-breakpoint-sweep` on `/process-improvements`.
  - Fix all Critical/Major findings before closing the task; Minor findings may be deferred only with explicit rationale.
- **What would make this >=90%:** a screenshot-backed walkthrough at desktop and mobile widths showing the single active list remains legible under mixed data.
- **Build completion evidence (2026-03-11):**
  - Reworked `apps/business-os/src/components/process-improvements/ProcessImprovementsInbox.tsx` so the client consumes the unified work-item contract directly, derives one active list plus one deferred list from `statusGroup`, and dispatches actions from `availableActions` instead of section-specific stream logic.
  - Replaced the old “Operator actions” / “Awaiting decision” / “Snoozed operator actions” split with one `Active worklist` section, one shared `Deferred` section, and the existing `Recently actioned` section.
  - Updated route framing in `apps/business-os/src/app/process-improvements/page.tsx` and component coverage in `apps/business-os/src/components/process-improvements/ProcessImprovementsInbox.test.tsx` to assert mixed ordering, shared deferred behavior, and preserved queue/operator actions.
  - TC-02-A: pass — `ProcessImprovementsInbox.test.tsx` now asserts one active worklist with overdue operator work ordered ahead of queue backlog.
  - TC-02-B: pass — `ProcessImprovementsInbox.test.tsx` now asserts queue defers and operator snoozes land in the same deferred section.
  - TC-02-C: pass — `scripts/agents/integrator-shell.sh --read-only -- pnpm --filter @apps/business-os typecheck`.
  - TC-02-D: pass — `scripts/agents/integrator-shell.sh --read-only -- pnpm --filter @apps/business-os lint`.
  - TC-02-E: pass — live route walkthrough at `http://127.0.0.1:3020/process-improvements` loaded with no blocking overlay and exposed both `Mark done` / `Snooze` and `Do` / `Defer` / `Decline` actions on the same page.
  - Scoped QA note: no Critical/Major issues were found in the live route walkthrough. Dedicated breakpoint and contrast sweep automation was not separately captured in this turn; see TASK-03 residual gaps.

### TASK-03: Checkpoint ordering evidence, unified-state behavior, and residual contract gaps
- **Type:** CHECKPOINT
- **Deliverable:** written verification that one prioritized active list is real in repo state, plus any remaining contract gaps and follow-up ownership
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-03-11)
- **Affects:** `docs/plans/process-improvements-unified-prioritized-worklist/plan.md`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% - bounded verification task once the route-facing contract and UI are complete.
  - Approach: 85% - a checkpoint is the right point to lock in ordering evidence and residual gaps before more inbox scope opens.
  - Impact: 86% - prevents silently drifting back into multiple active streams under a different visual treatment.
- **Acceptance:**
  - Repo-state evidence shows one active list with deterministic ordering.
  - Deferred and recent behavior are rechecked against current data.
  - Any remaining gaps are written explicitly with ownership and evidence.
- **Build completion evidence (2026-03-11):**
  - Engineering-coverage validation: pass — `bash scripts/validate-engineering-coverage.sh docs/plans/process-improvements-unified-prioritized-worklist/plan.md`.
  - Repo-state probe: pass — live projection snapshot reported `54` total items, `54` active, `0` deferred, `0` recent; the top active items were operator actions with `priorityReason` values led by `Overdue blocker` and `Active stage gate` before any queue backlog.
  - Route walkthrough: pass — browser session opened `http://127.0.0.1:3020/process-improvements`, reported `primaryHeading: "Operator Inbox"`, no blocking overlay, and visible `Mark done`, `Snooze`, `Do`, `Defer`, and `Decline` actions from the same route.
  - Residual gaps:
    - Current repo state does not exercise the shared deferred/recent sections with live data (`0` deferred, `0` recent), so those states are covered locally by component/projection tests rather than live repo content.
    - Dedicated `lp-design-qa`, contrast, and breakpoint sweep artifacts were not separately recorded in this turn; live browser walkthrough found no blocking UI issue, but a future polish pass can add screenshot-backed breakpoint evidence if required.

## Risks & Mitigations
- Ranking policy may feel arbitrary if it is only visible in UI order.
  - Mitigation: encode and test the ranking policy in projection-level tests and describe it in the plan/build record.
- Unifying the card shell may accidentally hide source-specific actions or labels.
  - Mitigation: keep actions data-driven per work item and validate button visibility in component coverage.
- Queue and operator decision replay may diverge after projection refactor.
  - Mitigation: keep source-specific ledgers/services intact and validate replay/grouping behavior through the unified contract.

## Observability
- Logging:
  - Preserve stable queue idea keys, dispatch IDs, operator action IDs, and source paths in the unified work-item model.
- Metrics:
  - None required for this tranche beyond deterministic counts for active/deferred/recent items in validation evidence.
- Alerts/Dashboards:
  - None in this tranche.

## Acceptance Criteria (overall)
- [x] `/process-improvements` shows one active prioritized list instead of separate queue/operator active sections.
- [x] Queue-backed and operator-action items are projected through one shared work-item contract.
- [x] Deferred queue items and snoozed operator actions share one deferred section.
- [x] Recent actions remain visible without reintroducing stream separation.
- [x] The ranking logic is deterministic and documented in code/tests.

## Decision Log
- 2026-03-11: Operator explicitly changed the requirement from “integrated inbox” to “one prioritized list of things to do.”
- 2026-03-11: Chose projection unification as the primary seam; UI-only reordering was rejected because it would leave the split data contract intact.
- 2026-03-11: Kept queue and operator-action backends separate under the hood while unifying the route-facing read model.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Overall-confidence = sum(task confidence * effort weight) / sum(effort weight)

## Section Omission Rule

If a section is not relevant, either omit it or write:
- `None: <reason>`
