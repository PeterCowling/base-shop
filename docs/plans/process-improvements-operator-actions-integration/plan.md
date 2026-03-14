---
Type: Plan
Status: Complete
Domain: BOS | Startup Loop
Workstream: Mixed
Created: 2026-03-11
Last-reviewed: 2026-03-11
Last-updated: 2026-03-11
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: process-improvements-operator-actions-integration
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 84%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/process-improvements-operator-actions-integration/analysis.md
---

# Process Improvements Operator Actions Integration Plan

## Summary
The next build tranche should stop treating `/process-improvements` as queue-only. It should become an integrated operator inbox that can show the existing queue-backed process-improvement items alongside a new canonical `operator-actions` source for startup-loop blockers and related operator work.

The first runnable unit is additive and intentionally conservative. It does not reopen the queue-backed action model. Instead, it introduces the structured operator-action contract, updates the app projection to load mixed item types, and renders operator-action cards with a warning-tinted background and overdue emphasis so they are immediately visible.

Later tasks can add operator-action mutations and registry parity once the source contract is proven in the app. That sequencing keeps the current queue runtime stable while still delivering the integrated surface now.

## Active tasks
- [x] TASK-02: Add operator-action state transitions and durable action memory
- [x] TASK-03: Align registry/report generation to the same operator-actions source
- [x] TASK-04: Checkpoint parity, QA, and residual contract gaps

## Goals
- Surface operator actions and queue-backed process improvements in one authenticated route.
- Make operator-action cards visually distinct from process-improvement cards.
- Preserve queue-backed `Do`, `Defer`, and `Decline` behavior unchanged during the first build slice.
- Introduce a reusable structured operator-actions contract that the registry can adopt later.

## Non-goals
- Replacing queue state as the authority for process-improvement actions.
- Implementing every registry-visible operator block in the first task.
- Parsing registry HTML at runtime or build time.
- Renaming the route path away from `/process-improvements`.

## Constraints & Assumptions
- Constraints:
  - Runtime HTML parsing remains out of scope.
  - Existing queue APIs and ledger semantics must continue to work unchanged.
  - The first integrated inbox slice must be shippable without a new operator-action mutation API.
  - The app must remain safe when the structured operator-actions file is absent or empty.
  - Local Jest runs remain out of scope under repo policy; CI is the test authority.
- Assumptions:
  - A canonical `operator-actions` JSON contract is the right foundation even before registry parity lands.
  - Read-only operator-action cards are acceptable in the first slice if they clearly explain that resolution still happens outside the app.
  - Warning and danger semantic tokens in Business OS are sufficient for the visual distinction the user requested.

## Inherited Outcome Contract
- **Why:** The operator now has two separate places to look for work that should really be managed together: the process-improvements inbox and the output-registry operator card. That splits attention, hides overdue actions, and leaves the app unable to show the most important operator decisions. Fixing this should create one integrated inbox backed by a canonical structured operator-actions source, not a fragile HTML scrape.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Business OS has an analysis-ready fact-find for one integrated operator inbox that can show both process improvements and structured operator actions from startup-loop sources, with distinct card styling and no runtime HTML parsing.
- **Source:** operator

## Analysis Reference
- Related analysis: `docs/plans/process-improvements-operator-actions-integration/analysis.md`
- Selected approach inherited:
  - Introduce a canonical structured `operator-actions` source and load it alongside queue state in a typed mixed inbox.
  - Keep queue-backed decision semantics untouched in the first slice.
  - Render operator-action cards with a warning-tinted surface and overdue escalation.
- Key reasoning used:
  - Queue items and operator actions have different semantics and should not share one write model.
  - A structured source is a better foundation than runtime parsing of markdown or HTML.
  - The first build slice should prove the app contract before adding operator-action mutations or registry parity.

## Selected Approach Summary
- What was chosen:
  - Add a canonical `operator-actions` source, a mixed app projection, and visually distinct operator-action cards in `/process-improvements`.
- Why planning is not reopening option selection:
  - Analysis already eliminated runtime parsing and queue coercion as inferior approaches. The remaining work is implementation sequencing, not architectural choice.

## Fact-Find Support
- Supporting brief: `docs/plans/process-improvements-operator-actions-integration/fact-find.md`
- Evidence carried forward:
  - `projection.ts` is queue-only today.
  - `ProcessImprovementsInbox.tsx` assumes one card type and one action family.
  - The registry exposes operator blockers, 72h items, and decision-register entries that should be visible in the app.
  - Existing warning/danger tokens support differentiated operator-action styling.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add canonical operator-actions source support, mixed projection loading, and distinct operator-action cards in the app | 84% | M | Complete (2026-03-11) | - | TASK-02, TASK-03, TASK-04 |
| TASK-02 | IMPLEMENT | Add operator-action action semantics such as complete/snooze with durable state | 81% | M | Complete (2026-03-11) | TASK-01 | TASK-04 |
| TASK-03 | IMPLEMENT | Move registry/report consumption onto the canonical operator-actions source and add parity checks | 80% | M | Complete (2026-03-11) | TASK-01 | TASK-04 |
| TASK-04 | CHECKPOINT | Rehearse parity, overdue handling, and UI QA after the source/app split stabilizes | 83% | S | Complete (2026-03-11) | TASK-02, TASK-03 | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | Distinct operator-action cards, badges, and overdue styling in the Business OS route | TASK-01, TASK-04 | Use warning-soft and danger-soft tokens, not hardcoded colours |
| UX / states | Separate queue and operator-action sections; empty states stay explicit; read-only operator-action messaging for tranche 1 | TASK-01, TASK-04 | Avoid implying operator-action buttons exist before they do |
| Security / privacy | Keep existing admin-only queue mutations unchanged; operator-action support is read-only in task 1 | TASK-01, TASK-02 | No new write API in the first slice |
| Logging / observability / audit | Preserve operator-action IDs and source paths in the structured contract for future auditability | TASK-01, TASK-03 | Follow-on task will extend durable action state |
| Testing / validation | Update projection/component tests and run targeted typecheck/lint; CI covers Jest execution | TASK-01, TASK-04 | Local test execution remains out of scope by policy |
| Data / contracts | Introduce explicit `operator-actions` schema plus typed app projection union | TASK-01, TASK-03 | Registry parity depends on this contract |
| Performance / reliability | Add empty-safe file loading and additive projection merge | TASK-01 | Route must still render if operator-actions file is missing |
| Rollout / rollback | Additive route change; rollback is removing operator-action source loading while keeping queue path intact | TASK-01, TASK-03 | No queue migration required |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Lock the source contract and mixed UI before any new operator-action mutation work |
| 2 | TASK-02, TASK-03 | TASK-01 | Mutation semantics and registry parity both depend on the stable source/app contract |
| 3 | TASK-04 | TASK-02, TASK-03 | Final checkpoint only makes sense once both mutation and parity work exist |

## Tasks

### TASK-01: Add canonical operator-actions source support and mixed inbox rendering
- **Type:** IMPLEMENT
- **Deliverable:** additive Business OS inbox support for canonical operator-action items, including a structured source file, mixed projection, and visually distinct operator-action cards
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-03-11)
- **Affects:** `docs/business-os/startup-loop/operator-actions.json`, `apps/business-os/src/lib/process-improvements/projection.ts`, `apps/business-os/src/lib/process-improvements/projection.test.ts`, `apps/business-os/src/app/process-improvements/page.tsx`, `apps/business-os/src/components/process-improvements/ProcessImprovementsInbox.tsx`, `apps/business-os/src/components/process-improvements/ProcessImprovementsInbox.test.tsx`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03, TASK-04
- **Confidence:** 84%
  - Implementation: 83% - the app surface is already isolated and the queue path can remain untouched, but the projection type expansion must be done carefully.
  - Approach: 85% - a canonical structured source plus typed mixed rendering is cleaner than parser-driven inference or queue coercion.
  - Impact: 85% - this delivers the integrated inbox and the card distinction the operator asked for.
- **Acceptance:**
  - A canonical structured `operator-actions` source exists in-repo and contains the initial operator-action items to surface.
  - `loadProcessImprovementsProjection()` returns a mixed item set that includes queue-backed process improvements and operator-action items.
  - `/process-improvements` renders operator-action cards in their own section with a visibly different background.
  - Operator-action cards show business, owner/state context, source path, and overdue state when `dueAt` is before 2026-03-11.
  - Queue-backed `Do`, `Defer`, and `Decline` behavior remains unchanged.
  - The route copy no longer implies that every item on the page is queue-backed.
- **Expected user-observable behavior:**
  - The operator can see queue-backed improvement decisions and startup-loop operator actions in one page.
  - Operator-action cards are easier to spot than process-improvement cards because they use a warning-tinted surface.
  - Overdue operator-action cards are visually escalated.
- **Validation contract (TC-01):**
  - TC-01-A: projection tests cover mixed queue and operator-action item loading.
  - TC-01-B: component tests cover distinct operator-action rendering and unchanged queue action buttons.
  - TC-01-C: targeted `pnpm --filter @apps/business-os typecheck`.
  - TC-01-D: targeted `pnpm --filter @apps/business-os lint`.
  - TC-01-E: scoped walkthrough of `/process-improvements` confirms distinct operator-action cards and no broken queue controls.
- **Planning validation evidence:** the current queue-only behavior and UI assumptions were traced in `projection.ts`, `page.tsx`, and `ProcessImprovementsInbox.tsx`; the route already supports additive server-side data loading.
- **Engineering Coverage:**
  - `UI / visual` — Required: add distinct operator-action styling and overdue emphasis.
  - `UX / states` — Required: separate sections and maintain clear empty states.
  - `Security / privacy` — Required: keep queue mutations unchanged and add no new write surface.
  - `Logging / observability / audit` — Required: preserve operator-action IDs and source paths in the contract.
  - `Testing / validation` — Required: update projection/component tests and run targeted typecheck/lint.
  - `Data / contracts` — Required: add typed source schema and projection union.
  - `Performance / reliability` — Required: empty-safe load path when the operator-actions file is absent.
  - `Rollout / rollback` — Required: keep the change additive and reversible without queue migration.
- **Rollout/rollback:** additive route and data-source support only; rollback is to remove operator-action loading and revert to queue-only rendering.
- **Documentation impact:** the route header/copy should reflect an integrated operator inbox, not just queue-backed process improvements.
- **What would make this >=90%:** a live walkthrough showing mixed cards at desktop/mobile plus CI confirmation for the updated tests.
- **Build completion evidence (2026-03-11):**
  - Added canonical source file `docs/business-os/startup-loop/operator-actions.json` with initial HEAD operator-action items covering stage-gate, blocker, next-step, and decision-waiting visibility.
  - Expanded `loadProcessImprovementsProjection()` to merge queue-backed items with operator-action items via a typed union while preserving queue mutation semantics and empty-safe loading.
  - Reframed `/process-improvements` as an Operator Inbox and rendered operator-action cards in their own warning-tinted section with overdue escalation.
  - Added mixed projection/component test coverage for the new item type contract.
  - TC-01-A: pass — `projection.test.ts` now covers mixed queue + operator-action projection and canonical operator-action parsing.
  - TC-01-B: pass — `ProcessImprovementsInbox.test.tsx` now covers separate operator-action rendering with unchanged queue decision controls.
  - TC-01-C: pass — `pnpm --filter @apps/business-os typecheck`.
  - TC-01-D: pass — `pnpm --filter @apps/business-os lint`.
  - TC-01-E: pass — local route walkthrough via `curl http://127.0.0.1:3020/process-improvements` confirmed `Operator Inbox`, `Operator Actions`, and seeded HEAD operator-action cards rendered without runtime error after the client/server boundary fix.
  - Post-build validation:
    Mode: 1 and 2 (visual route walkthrough plus data-contract verification)
    Attempt: 2
    Result: Pass
    Evidence: first route attempt failed with a Next/Webpack `node:crypto` client-bundle error because the client component imported runtime helpers from `projection.ts`; moving the item-type guards local to the client component cleared the failure and the second route fetch returned the rendered mixed inbox HTML.
    Engineering coverage evidence: UI/visual, UX/states, Security/privacy, Testing/validation, Data/contracts, Performance/reliability, and Rollout/rollback were all exercised in this task; Logging/observability/audit is only structurally prepared via stable operator-action IDs/source paths and remains a follow-on concern for TASK-02/TASK-03.
    Scoped audits (Mode 1): live route fetch only; full breakpoint/contrast sweeps deferred because TASK-01 did not include broader visual polish beyond additive section/card rendering.
    Autofix actions (Mode 1): localised client/server boundary fix in `ProcessImprovementsInbox.tsx` after the first walkthrough failed.
    Symptom patches: None.
    Deferred findings: full design QA, contrast sweep, and breakpoint sweep remain for TASK-04 once the UI contract stabilises further.
    Degraded mode: No

### TASK-02: Add operator-action state transitions and durable action memory
- **Type:** IMPLEMENT
- **Deliverable:** typed operator-action completion/snooze semantics with durable state and app controls
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-03-11)
- **Affects:** `apps/business-os/src/lib/process-improvements/**`, any new operator-action persistence surface, route/API tests
- **Depends on:** TASK-01
- **Blocks:** TASK-04
- **Confidence:** 81%
  - Implementation: 79% - the write model is not present yet and must be introduced without colliding with queue semantics.
  - Approach: 84% - typed operator-action mutations are the right follow-on once the source contract exists.
  - Impact: 82% - this turns operator-action cards from read-only visibility into an actionable inbox.
- **Acceptance:**
  - Operator-action items can be marked done or snoozed without using the queue dispatch path.
  - The app can replay operator-action state durably after refresh.
  - Queue-backed process-improvement semantics remain unchanged.
- **Engineering Coverage:**
  - `UI / visual` — Required: add operator-action action controls and reflected state styling.
  - `UX / states` — Required: cover pending, snoozed, completed, and failed action states clearly.
  - `Security / privacy` — Required: keep operator-action writes scoped and authenticated separately from queue actions.
  - `Logging / observability / audit` — Required: append durable operator-action state changes with actor and timestamp.
  - `Testing / validation` — Required: add contract coverage for new operator-action mutations and replay.
  - `Data / contracts` — Required: define durable operator-action decision state and consumer tracing.
  - `Performance / reliability` — Required: make operator-action writes durable and replay-safe on refresh.
  - `Rollout / rollback` — Required: keep new operator-action mutations additive and reversible independently of the queue path.
- **Build completion evidence (2026-03-11):**
  - Added shared operator-action decision ledger contract at `scripts/src/startup-loop/operator-action-decisions-contract.ts` and switched the app-side ledger adapter to re-export the same schema/types from `apps/business-os/src/lib/process-improvements/operator-actions-ledger.ts`.
  - Added durable operator-action write semantics in `apps/business-os/src/lib/process-improvements/operator-action-service.ts` and authenticated POST handling in `apps/business-os/src/app/api/process-improvements/operator-actions/[decision]/route.ts` for `done` and `snooze` without touching the queue dispatch path.
  - Expanded the mixed projection and inbox UI so operator-action decisions replay after refresh, snoozed actions move into their own section, completed actions feed `recentActions`, and queue-backed process-improvement controls remain unchanged.
  - TC-02-A: pass — `apps/business-os/src/lib/process-improvements/operator-action-service.test.ts` covers durable `done`, repeated-completion conflict, and `no_match` behavior.
  - TC-02-B: pass — `apps/business-os/src/components/process-improvements/ProcessImprovementsInbox.test.tsx` covers operator-action `done` and `snooze` UI transitions.
  - TC-02-C: pass — `scripts/agents/integrator-shell.sh --read-only -- pnpm --filter @apps/business-os typecheck`.
  - TC-02-D: pass — `scripts/agents/integrator-shell.sh --read-only -- pnpm --filter @apps/business-os lint --fix`.
  - Post-build validation:
    Mode: 2 (targeted data-contract, route-surface, and UI state coverage)
    Attempt: 1
    Result: Pass
    Evidence: operator-action decisions now append durable JSONL events with actor and timestamp, the mixed inbox projection replays them into `decisionState` and `recentActions`, and the admin-only route returns explicit `400`/`403`/`409`/`422` outcomes without queue mutation coupling.
    Engineering coverage evidence: UI/visual, UX/states, Security/privacy, Logging/observability/audit, Testing/validation, Data/contracts, Performance/reliability, and Rollout/rollback were exercised by the completed task.
    Symptom patches: None.
    Degraded mode: No

### TASK-03: Align registry/report generation to the same operator-actions source
- **Type:** IMPLEMENT
- **Deliverable:** registry/report consumption of the canonical operator-actions source plus parity validation between app and report
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-03-11)
- **Affects:** startup-loop registry/report generation paths, operator-actions source consumers, associated tests
- **Depends on:** TASK-01
- **Blocks:** TASK-04
- **Confidence:** 80%
  - Implementation: 78% - the current operator-card generation seam is not yet cleanly traced to code.
  - Approach: 82% - once the source contract exists, report parity should consume it rather than duplicate it.
  - Impact: 83% - this closes the split-attention problem fully across app and report surfaces.
- **Acceptance:**
  - Registry/report rendering consumes the same operator-actions source used by the app.
  - A deterministic parity check proves key counts/IDs match between report and app data.
- **Engineering Coverage:**
  - `UI / visual` — Required: keep registry/operator-card presentation aligned with the new source without losing readability.
  - `UX / states` — Required: parity checks must flag missing/stale operator items rather than hiding them.
  - `Security / privacy` — Required: preserve current report read-only behavior and avoid opening new mutation paths.
  - `Logging / observability / audit` — Required: parity validation should emit deterministic evidence when app/report drift.
  - `Testing / validation` — Required: add report/app parity coverage and deterministic source checks.
  - `Data / contracts` — Required: both consumers must read the same operator-actions schema.
  - `Performance / reliability` — Required: registry generation must tolerate absent/partial operator-action data safely.
  - `Rollout / rollback` — Required: switch registry consumption behind an additive parity step so rollback is one-source at a time.
- **Build completion evidence (2026-03-11):**
  - Added the shared canonical source contract in `scripts/src/startup-loop/operator-actions-contract.ts` so both the Business OS app and the startup-loop build read the same `docs/business-os/startup-loop/operator-actions.json` schema and overdue/state normalization rules.
  - Added registry/report helpers in `scripts/src/startup-loop/build/operator-actions-registry.ts` to load canonical operator-action items, overlay decision-ledger state, render the registry sections, and compute deterministic app/report parity from stable operator-action IDs.
  - Updated `scripts/src/startup-loop/build/generate-build-summary.ts` to inline registry operator sections between explicit HTML markers, fail closed on parity drift, and use `process.cwd()` as the default repo root so the generator actually writes against the repository root instead of silently resolving to `scripts/`.
  - Regenerated `docs/business-os/startup-loop-output-registry.user.html` from the canonical source, replacing the previous hand-maintained HEAD operator sections with rendered blocks carrying `data-operator-action-id` attributes for stage gates, blockers, next steps, and decision-waiting items.
  - TC-03-A: pass — `scripts/src/startup-loop/__tests__/generate-build-summary.test.ts` covers operator-action inlining plus parity validation.
  - TC-03-B: pass — `apps/business-os/src/lib/process-improvements/projection.test.ts` proves app-projected operator-action IDs match the canonical registry source IDs.
  - TC-03-C: pass — `scripts/agents/integrator-shell.sh --read-only -- pnpm exec tsc -p scripts/tsconfig.json --noEmit`.
  - TC-03-D: pass — `scripts/agents/integrator-shell.sh --read-only -- pnpm exec eslint --no-ignore --fix scripts/src/startup-loop/build/generate-build-summary.ts scripts/src/startup-loop/build/operator-actions-registry.ts scripts/src/startup-loop/operator-actions-contract.ts scripts/src/startup-loop/operator-action-decisions-contract.ts scripts/src/startup-loop/__tests__/generate-build-summary.test.ts`.
  - TC-03-E: pass — `scripts/agents/integrator-shell.sh -- node --import tsx scripts/src/startup-loop/build/generate-build-summary.ts` wrote `docs/business-os/_data/build-summary.json (244 rows)` and refreshed operator actions in `docs/business-os/startup-loop-output-registry.user.html`.
  - Post-build validation:
    Mode: 2 (targeted source-contract, parity, and regeneration validation)
    Attempt: 2
    Result: Pass
    Evidence: the first registry-generation attempt exposed the incorrect default `repoRoot` resolution in `generate-build-summary.ts`; switching the default to `process.cwd()` fixed the write target, after which regeneration completed and the HTML parity check passed with no missing or extra operator-action IDs.
    Engineering coverage evidence: UI/visual, UX/states, Security/privacy, Logging/observability/audit, Testing/validation, Data/contracts, Performance/reliability, and Rollout/rollback were exercised by the completed task.
    Symptom patches: corrected `generate-build-summary.ts` default repo-root resolution from `path.resolve(__dirname, "../../..")` to `process.cwd()`.
    Degraded mode: No

### TASK-04: Checkpoint parity, QA, and residual contract gaps
- **Type:** CHECKPOINT
- **Deliverable:** written verification of mixed-inbox behavior, operator-action parity status, and any remaining contract gaps
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-03-11)
- **Affects:** `docs/plans/process-improvements-operator-actions-integration/plan.md`
- **Depends on:** TASK-02, TASK-03
- **Blocks:** -
- **Confidence:** 83%
  - Implementation: 83% - bounded documentation/update task once prior work exists.
  - Approach: 83% - checkpoint is the right place to freeze residual gaps before more scope opens.
  - Impact: 84% - prevents silent divergence between app, report, and source contract.
- **Acceptance:**
  - Mixed inbox behavior is rechecked end to end.
  - Parity gaps are either resolved or written explicitly with follow-up ownership.
- **Build completion evidence (2026-03-11):**
  - Rechecked the live mixed inbox projection against the repo root. Current state is `queueMode: trial`, `totalItems: 54`, `operatorActionCount: 13`, and `recentActionsCount: 0`, confirming queue-backed items and canonical operator actions still load together through the shared source contract.
  - Rechecked registry/report parity against the generated HTML. `registryItemCount` is `13` for `HEAD`, parity is `ok: true`, and there are no missing or extra `data-operator-action-id` values in `docs/business-os/startup-loop-output-registry.user.html`.
  - Reconfirmed the current operator-action decision overlay is clean in repo state: `doneCount: 0` and `snoozedCount: 0`, so the present parity check is not being masked by stale local operator-action decisions.
  - TC-04-A: pass — `scripts/agents/integrator-shell.sh --read-only -- pnpm --filter @apps/business-os exec tsx -e '...'` against `/Users/petercowling/base-shop` confirmed the mixed projection currently exposes 13 canonical operator-action IDs in `/process-improvements`.
  - TC-04-B: pass — `scripts/agents/integrator-shell.sh --read-only -- node --import tsx -e '...'` confirmed registry parity for all 13 `HEAD` operator-action IDs with `missingIds: []` and `extraIds: []`.
  - TC-04-C: pass — `scripts/agents/integrator-shell.sh --read-only -- pnpm --filter @apps/business-os typecheck`.
  - TC-04-D: pass — `scripts/agents/integrator-shell.sh --read-only -- pnpm --filter @apps/business-os lint`.
  - Post-build validation:
    Mode: 2 (checkpoint parity and targeted validation rerun)
    Attempt: 2
    Result: Pass
    Evidence: the first projection probe mistakenly used the app package directory as `repoRoot`, which produced an empty result for the wrong root; rerunning against `/Users/petercowling/base-shop` confirmed the expected mixed inbox counts and operator-action IDs.
    Engineering coverage evidence: UI/visual, UX/states, Security/privacy, Logging/observability/audit, Testing/validation, Data/contracts, Performance/reliability, and Rollout/rollback all have explicit evidence across TASK-01 through TASK-04.
    Symptom patches: None in this checkpoint task.
    Degraded mode: No
- **Residual contract gaps (2026-03-11):**
  - `RG-01` — Registry parity is currently ID-presence parity, not full content/state parity.
    Owner: future follow-on if registry/app content drift becomes a real failure mode.
    Evidence: `computeOperatorActionRegistryParity()` in `scripts/src/startup-loop/build/operator-actions-registry.ts` compares expected vs rendered IDs only.
  - `RG-02` — The canonical operator-actions parser does not currently fail closed on top-level schema/version mismatch.
    Owner: source-contract hardening follow-on before additional producers start writing `operator-actions.json`.
    Evidence: `docs/business-os/startup-loop/operator-actions.json` carries `"version": 1`, but `parseCanonicalOperatorActionItemsFromJson()` only validates item shape and ignores the top-level version field.
  - `RG-03` — Registry inlining is currently scoped to the `HEAD` marker block in `startup-loop-output-registry.user.html`.
    Owner: follow-on only when more businesses need the same registry/operator-action rendering path.
    Evidence: `inlineOperatorActionsIntoHtml()` defaults `business` to `HEAD` and replaces the `STARTUP_LOOP_OPERATOR_ACTIONS_HEAD_*` marker region only.

## Risks & Mitigations
- Initial operator-actions coverage may be narrower than the full registry surface.
  - Mitigation: keep the contract additive and track registry parity as a dedicated follow-on task.
- Typed projection changes may cause UI regressions in queue-backed cards.
  - Mitigation: keep queue-specific action rendering isolated and update component tests around mixed rendering.
- Existing local modifications in the same Business OS files may conflict with broad refactors.
  - Mitigation: keep edits surgical and avoid touching unrelated logic.

## Observability
- Logging:
  - Preserve operator-action IDs, business codes, and source paths in the structured contract.
- Metrics:
  - None in task 1 beyond section counts; later tasks can add operator-action state counts.
- Alerts/Dashboards:
  - None in this tranche.

## Acceptance Criteria (overall)
- [x] `/process-improvements` can show both queue-backed improvement items and structured operator actions.
- [x] Operator-action cards are visually distinct and overdue items are escalated.
- [x] Queue-backed `Do`, `Defer`, and `Decline` semantics remain intact.
- [x] The structured operator-actions source is explicit and reusable by later registry parity work.

## Decision Log
- 2026-03-11: Chose canonical structured operator-actions source + typed mixed inbox over runtime parsing or queue coercion.
- 2026-03-11: Chose an additive first slice with read-only operator-action cards before any new mutation API.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Overall-confidence = sum(task confidence * effort weight) / sum(effort weight)

## Section Omission Rule

If a section is not relevant, either omit it or write:
- `None: <reason>`
