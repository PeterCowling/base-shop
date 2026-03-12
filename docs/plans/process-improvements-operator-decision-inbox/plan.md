---
Type: Plan
Status: Complete
Domain: BOS | Startup Loop
Workstream: Operations
Created: 2026-03-10
Last-reviewed: 2026-03-11
Last-updated: 2026-03-11
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: process-improvements-operator-decision-inbox
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-critique
Overall-confidence: 87%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort after architecture lock
Auto-Build-Intent: plan-only
---

# Process Improvements Operator App Plan

## Summary
The queue-authority cleanup is already done. The remaining problem is execution surface: the repo has a canonical queue-backed backlog, but the operator still only sees a passive report.

This plan makes `apps/business-os` the authoritative runtime for process-improvements decisions. The app will read queue-backed idea items directly from queue state through an app-local projection layer, overlay operator decisions from a dedicated append-only decision ledger, and expose exactly three actions:

- `Do`: record the operator decision and immediately hand the item into the existing routing/work-package machinery.
- `Defer`: record a 7-day snooze in the decision ledger without mutating queue lifecycle.
- `Decline`: record the operator decision and move the queue item to a terminal queue state with explicit rejection metadata.

The static generated report stays in place during this tranche, but only as a read-only reference surface with signposting into the app. It does not mirror operator decision state and it is not an action runtime or an authoritative data source for the app.

## Active tasks
- [x] TASK-01: Implement the authoritative queue-native inbox projection and lock the coexistence contract
- [x] TASK-02: Implement the append-only process-improvements decision ledger and app-side persistence helpers
- [x] TASK-03: Implement Business OS decision APIs and the dedicated operator-actions queue service
- [x] TASK-04: Implement the Business OS process-improvements inbox route and UI
- [x] TASK-05: Checkpoint the end-to-end app flow and confirm the report remains signpost-only
- [x] TASK-06: Implement static-report read-only signposting with no mirrored decision overlay
- [x] TASK-07: Add deterministic validation coverage across projection, ledger, API, UI, and report seams

## Goals
- Make the Business OS app the only authoritative action surface for process improvements.
- Keep active idea backlog authority queue-backed.
- Keep route choice hidden from the operator.
- Make `Do` immediate handoff, not approval-for-pickup.
- Make `Defer` durable, time-bounded, and queue-non-mutating.
- Make `Decline` both auditable and workflow-effective.

## Non-goals
- Preserving `file://` HTML as a mutating workflow surface.
- Adding operator-visible route choice.
- Extending the first action set beyond `Do`, `Defer`, and `Decline`.
- Applying the first action set to `risk` or `pending-review` items.
- Full autonomous execution in this tranche.

## Constraints & Assumptions
- Constraints:
  - Active actionable idea backlog is queue-backed.
  - `Do` must hand off immediately, not create a passive approval queue.
  - `Defer` must not reuse `skipped`, `suppressed`, or `completed`.
  - `Decline` must change queue workflow state and preserve explicit operator metadata.
  - Local Jest/Cypress execution remains out of scope under repo policy; CI is the test authority.
- Assumptions:
  - `apps/business-os` is the right host because it already has authenticated page/API patterns and repo-write seams.
  - The app should read queue state directly and treat generated process-improvements artifacts as downstream report outputs, not upstream authority.
  - A repo-readable append-only decision ledger is the right persistence shape because future automation needs event history, not only latest state.

## Inherited Outcome Contract
- **Why:** The repo now has one canonical actionable idea backlog, but the current operator surface is still a passive report. The missing seam is an authenticated decision surface with durable persistence and immediate action handling.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Process improvements becomes a Business OS operator app where queue-backed idea candidates can be marked `Do`, `Defer`, or `Decline`; `Do` immediately hands the item into the normal routing flow, `Defer` hides it for 7 days via a decision ledger, and `Decline` records rejection while moving the queue item to a terminal state.
- **Source:** operator

## Fact-Find Reference
- Related brief: [fact-find.md](/Users/petercowling/base-shop/docs/plans/process-improvements-operator-decision-inbox/fact-find.md)
- Key findings used:
  - The static `file://` report is the wrong mutating runtime.
  - `apps/business-os` already provides authenticated page and API seams.
  - Queue-backed idea backlog is canonical for this surface.
  - The unresolved seams are projection, decision-ledger persistence, immediate-handoff APIs, and report coexistence.

## Locked Architecture
- Authoritative read model:
  - The app reads the currently authoritative startup-loop idea queue through an app-local queue-path resolver backed by the canonical startup-loop path constants.
  - For this tranche, the authoritative queue mode is explicitly `trial`; promotion to `live` is a separate future change, not an implicit resolver behavior.
  - The projection enriches queue-backed idea items with route/status/provenance fields needed for `Do`, `Defer`, and `Decline`.
  - The projection overlays operator decision state by reducing `docs/business-os/process-improvements/operator-decisions.jsonl` into the latest visible state per `idea_key`.
- Authoritative write model:
  - `Do` appends an operator-decision event first, then invokes an app-side service wrapper around a dedicated startup-loop operator-actions module.
  - `Defer` appends only an operator-decision event, including `defer_until`.
  - `Decline` appends an operator-decision event first, then invokes the operator-actions module to move the dispatch to a first-class queue state `declined` with explicit `declined_by` metadata.
  - Ledger records for `Do` and `Decline` must distinguish operator intent from execution result so partial failures do not masquerade as successful handoff.
  - The decision ledger is append-only; concurrency is resolved by optimistic append plus reducer semantics, never destructive overwrite of prior operator events.
- Static report contract:
  - `docs/business-os/process-improvements.user.html` remains read-only in this tranche.
  - The report does not consume decision-ledger state in this tranche.
  - The app, not the report, is authoritative for actions and current operator state.

## Proposed Approach
- Option A: keep the static report as the action surface and add a localhost shim.
  - Rejected because it preserves the wrong runtime and duplicates auth/write concerns that the app already solves.
- Option B: make the Business OS app authoritative and keep the report strictly read-only and signpost-only.
  - Chosen because it aligns runtime, auth, writes, audit, and workflow authority in one place.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No until critique + revalidation are complete

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Implement the queue-native projection and codify the app/report authority contract | 86% | M | Complete (2026-03-10) | - | TASK-02, TASK-03, TASK-04, TASK-05, TASK-06, TASK-07 |
| TASK-02 | IMPLEMENT | Implement the append-only operator decision ledger and persistence helpers | 84% | M | Complete (2026-03-11) | TASK-01 | TASK-03, TASK-04, TASK-05, TASK-06, TASK-07 |
| TASK-03 | IMPLEMENT | Implement authenticated decision APIs and the dedicated operator-actions queue service | 82% | M | Complete (2026-03-11) | TASK-01, TASK-02 | TASK-04, TASK-05, TASK-06, TASK-07 |
| TASK-04 | IMPLEMENT | Build the process-improvements inbox route and UI in Business OS | 84% | M | Complete (2026-03-11) | TASK-01, TASK-02, TASK-03 | TASK-05, TASK-06, TASK-07 |
| TASK-05 | CHECKPOINT | Rehearse the end-to-end app flow and confirm the report remains signpost-only | 84% | S | Complete (2026-03-11) | TASK-01, TASK-02, TASK-03, TASK-04 | TASK-06, TASK-07 |
| TASK-06 | IMPLEMENT | Implement read-only report signposting with no mirrored decision overlay | 84% | S | Complete (2026-03-11) | TASK-05 | TASK-07 |
| TASK-07 | IMPLEMENT | Add deterministic validation coverage across the new seams | 84% | M | Complete (2026-03-11) | TASK-03, TASK-04, TASK-05, TASK-06 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Lock the projection and coexistence contract in code/docs first |
| 2 | TASK-02 | TASK-01 | Ledger schema depends on the chosen projection identity |
| 3 | TASK-03 | TASK-01, TASK-02 | API and queue mutation work needs the projection, ledger, and explicit decline semantics |
| 4 | TASK-04 | TASK-01, TASK-02, TASK-03 | UI depends on the projection fields and decision endpoints |
| 5 | TASK-05 | TASK-01, TASK-02, TASK-03, TASK-04 | Checkpoint after the core app flow exists |
| 6 | TASK-06 | TASK-05 | Report stays signpost-only; no state mirroring work is allowed in this tranche |
| 7 | TASK-07 | TASK-03, TASK-04, TASK-05, TASK-06 | Final tests should hit the real seams, not placeholders |

## Tasks

### TASK-01: Implement the authoritative queue-native inbox projection and lock the coexistence contract
- **Type:** IMPLEMENT
- **Deliverable:** app-local projection helper that reads queue-backed idea items directly from the authoritative queue path, overlays reduced decision state, and codifies the app/report authority contract
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-03-10)
- **Affects:** `apps/business-os/src/lib/process-improvements/**`, `apps/business-os/src/app/process-improvements/**`, any app-local queue-path resolver/helper, nearby code comments that currently imply report authority
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03, TASK-04, TASK-05, TASK-06, TASK-07
- **Confidence:** 86%
  - Implementation: 86% - the queue file, app route patterns, and generator seams already exist.
  - Approach: 87% - treating generated artifacts as downstream compatibility outputs removes the biggest source of ambiguity.
  - Impact: 87% - this contract prevents the app and report from drifting into dual authority.
- **Acceptance:**
  - The app reads queue-backed process-improvement items from the authoritative queue path, not from generated report JSON.
  - The projection exposes the route/status/provenance fields needed for action handling.
  - The projection contract explicitly states that generated report artifacts are downstream compatibility outputs, not action authority.
  - The queue-path resolver explicitly fixes queue mode to `trial` for this tranche.
- **Validation contract (TC-01):**
  - TC-01: one queue-backed dispatch can be projected into an app-facing inbox item without reading `docs/business-os/_data/process-improvements.json`.
  - TC-02: the projected item includes stable identity, current queue state, recommended route, and enough metadata to support `Do`, `Defer`, and `Decline`.
  - TC-03: the projection uses a dedicated queue-path resolver rather than hardcoding a one-off file path inside the UI route.
  - TC-04: the app/report authority rule is stated in code-facing comments or helper docs close to the new projection seam.
  - TC-05: targeted typecheck/lint pass for every touched package path.
- **Planning validation evidence:** confirm the projection seam against `queue-state.json`, `ideas/page.tsx`, and the current generator before implementation starts.
- **Rollout/rollback:** add the projection alongside the existing report first; rollback is to disable the new app route while leaving the report unchanged.
- **Documentation impact:** update this plan and any nearby code comments that currently imply the report is authoritative.
- **What would make this >=90%:** implement one projection fixture from a real queue entry and prove the app can render it without generated report data.
- **Build completion evidence:**
  - Added a queue-mode resolver in `apps/business-os/src/lib/process-improvements/queue-path.ts`.
  - Added a queue-backed projection helper in `apps/business-os/src/lib/process-improvements/projection.ts`.
  - Added deterministic projection tests in `apps/business-os/src/lib/process-improvements/projection.test.ts`.
  - Validation passed: `pnpm --filter @apps/business-os typecheck`
  - Validation passed: `pnpm --filter @apps/business-os lint`

### TASK-02: Implement the append-only process-improvements decision ledger and app-side persistence helpers
- **Type:** IMPLEMENT
- **Deliverable:** repo-readable append-only decision ledger at `docs/business-os/process-improvements/operator-decisions.jsonl` plus typed app-side read/write/reduce helpers
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-03-11)
- **Affects:** `apps/business-os/src/lib/process-improvements/**`, `apps/business-os/src/lib/repo/**`, `docs/business-os/process-improvements/operator-decisions.jsonl`
- **Depends on:** TASK-01
- **Blocks:** TASK-03, TASK-04, TASK-05, TASK-06, TASK-07
- **Confidence:** 85%
  - Implementation: 83% - repo-write helpers already exist, but append-only persistence and reducer helpers still need a clean schema and concurrency contract.
  - Approach: 86% - an append-only ledger is the cleanest way to preserve operator history without corrupting queue lifecycle.
  - Impact: 86% - `Defer`, auditability, and future automation all depend on this layer.
- **Acceptance:**
  - Each ledger event stores stable item identity, decision type, operator identity, timestamp, optional `defer_until`, and execution outcome for workflow-mutating decisions.
  - `Do` and `Decline` create durable ledger events even when they also mutate queue state.
  - A reducer derives active, deferred, and recently actioned views in the app from the append-only event stream.
- **Validation contract (TC-02):**
  - TC-01: repeated writes for the same item produce deterministic reduced state according to the chosen ledger contract.
  - TC-02: `Defer` records a future `defer_until` without mutating queue state.
  - TC-03: failed `Do` or `Decline` execution can be represented without the ledger pretending the downstream mutation succeeded.
  - TC-04: the reducer resolves multiple operator events on the same `idea_key` deterministically.
  - TC-05: ledger helpers reject malformed decision payloads before any file write occurs.
  - TC-06: targeted typecheck/lint pass for every touched package path.
- **Planning validation evidence:** inspect existing repo-write helpers and confirm atomic-write expectations before choosing the helper implementation.
- **Rollout/rollback:** add the ledger file and helpers behind the new route/API only; rollback is to disable the new API while leaving the append-only event log intact for audit.
- **Documentation impact:** document the ledger path and semantics in code comments and this plan.
- **What would make this >=90%:** complete one audited append/reduce round-trip for `defer` and one failed-execution `decline` event sequence.
- **Build completion evidence:**
  - Added append-only decision-ledger helpers in `apps/business-os/src/lib/process-improvements/decision-ledger.ts`.
  - Added deterministic ledger tests in `apps/business-os/src/lib/process-improvements/decision-ledger.test.ts`.
  - Extended projection state to carry reduced execution errors for failed `Do`/`Decline` attempts.
  - Validation passed: `pnpm --filter @apps/business-os typecheck`
  - Validation passed: `pnpm --filter @apps/business-os lint`

### TASK-03: Implement Business OS decision APIs and the dedicated operator-actions queue service
- **Type:** IMPLEMENT
- **Deliverable:** authenticated API surface and a dedicated startup-loop operator-actions module for `Do`, `Defer`, and `Decline`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-03-11)
- **Affects:** `apps/business-os/src/app/api/process-improvements/**`, `apps/business-os/src/lib/auth/**`, `apps/business-os/src/lib/process-improvements/**`, `scripts/src/startup-loop/ideas/lp-do-ideas-operator-actions.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-work-packages.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-file.ts`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-04, TASK-05, TASK-06, TASK-07
- **Confidence:** 83%
  - Implementation: 81% - endpoint and auth patterns are clear, but the new operator-actions module must introduce a first-class decline path cleanly.
  - Approach: 84% - dedicated operator actions are cleaner than leaking app behavior into generic queue helpers.
  - Impact: 85% - this is the execution seam that turns the report into an operator workflow.
- **Acceptance:**
  - `Do` appends the operator-decision event first and then hands off using the operator-actions module.
  - `Defer` appends only the operator-decision event and returns the new defer state.
  - `Decline` appends the operator-decision event first and then mutates the queue to a first-class terminal state `declined` with explicit `declined_by` metadata.
  - Failed downstream execution after a ledger write is surfaced as a failed action state, not as a successful handoff or decline.
  - All endpoints are authenticated and write-authorized under Business OS rules.
- **Validation contract (TC-03):**
  - TC-01: one `micro_build_ready` queue-backed item can be actioned via `Do` without exposing route choice in the API contract.
  - TC-02: one deferred item remains `enqueued` in queue state and returns a future `defer_until`.
  - TC-03: one declined item becomes `queue_state = "declined"` and carries explicit `declined_by` metadata in queue state plus the ledger.
  - TC-04: if a `Do` or `Decline` downstream mutation fails after ledger creation, the API returns failure and the ledger records the failed execution result explicitly.
  - TC-05: unauthorized requests are rejected before any ledger or queue mutation occurs.
  - TC-06: targeted typecheck/lint pass for every touched package path.
- **Planning validation evidence:** trace one existing `lp-do-build`-ready dispatch and one terminal queue mutation path before implementation starts.
- **Rollout/rollback:** ship APIs behind the new app route only; rollback is to stop calling the new endpoints while preserving existing queue state.
- **Documentation impact:** add short API/service comments explaining action ordering and audit guarantees.
- **What would make this >=90%:** identify the precise queue helper or wrapper contract used by both `Do` and `Decline` and cover both with service-layer tests.
- **Build completion evidence:**
  - Added first-class queue `declined` state and `declined_by` metadata in `scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-file.ts`.
  - Added dedicated operator actions in `scripts/src/startup-loop/ideas/lp-do-ideas-operator-actions.ts`.
  - Added app-side decision service in `apps/business-os/src/lib/process-improvements/decision-service.ts`.
  - Added authenticated decision API route in `apps/business-os/src/app/api/process-improvements/decision/[decision]/route.ts`.
  - Added deterministic operator action tests plus API route tests.
  - Validation passed: `pnpm --filter @apps/business-os typecheck`
  - Validation passed: `pnpm --filter @apps/business-os lint`
  - Validation passed: `pnpm exec tsc -p scripts/tsconfig.json --noEmit`
  - Validation passed: `pnpm exec eslint --no-ignore scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-file.ts scripts/src/startup-loop/ideas/lp-do-ideas-operator-actions.ts scripts/src/startup-loop/__tests__/lp-do-ideas-operator-actions.test.ts`

### TASK-04: Implement the Business OS process-improvements inbox route and UI
- **Type:** IMPLEMENT
- **Deliverable:** authenticated `/process-improvements` route in `apps/business-os` with `Awaiting decision`, `Deferred`, and `Recently actioned` views
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-03-11)
- **Affects:** `apps/business-os/src/app/process-improvements/**`, `apps/business-os/src/components/process-improvements/**`, app-local styles or existing design-system primitives as needed
- **Depends on:** TASK-01, TASK-02, TASK-03
- **Blocks:** TASK-05, TASK-06, TASK-07
- **Confidence:** 84%
  - Implementation: 84% - Business OS already has list/filter/action patterns to reuse.
  - Approach: 85% - the UI can stay intentionally narrow because route choice remains internal.
  - Impact: 84% - this is the new operator surface the user actually works in.
- **Acceptance:**
  - Only `idea` items receive triage controls in this tranche.
  - Visible actions are exactly `Do`, `Defer`, and `Decline`.
  - Deferred and recently actioned items are visibly separated from awaiting-decision items.
  - Expected user-observable behavior:
    - Operators can action an item without choosing a route.
    - A successful `Do`, `Defer`, or `Decline` immediately removes or reclassifies the item in the visible inbox.
    - No `risk` or `pending-review` item shows triage controls.
- **Validation contract (TC-04):**
  - TC-01: the route renders queue-backed process-improvement items using the authoritative app projection from TASK-01.
  - TC-02: card actions call the decision API and transition visible state correctly.
  - TC-03: loading, success, and failure states are explicit for each action path.
  - TC-04: targeted typecheck/lint pass for `@apps/business-os`.
  - TC-05: post-build QA loop runs `lp-design-qa`, `tools-ui-contrast-sweep`, and `tools-ui-breakpoint-sweep` on the changed route/components, with Critical/Major findings fixed before completion.
- **Planning validation evidence:** confirm the UI can reuse existing Business OS list/action patterns before introducing new primitives.
- **Rollout/rollback:** ship the route behind normal app auth; rollback is to hide or remove the route while keeping the report available.
- **Documentation impact:** update app navigation or nearby internal docs if the route is linked from existing Business OS pages.
- **What would make this >=90%:** cover one mocked end-to-end visible transition for each action type in app tests.
- **Build completion evidence:**
  - Added `/process-improvements` route in `apps/business-os/src/app/process-improvements/page.tsx`.
  - Added inbox client component in `apps/business-os/src/components/process-improvements/ProcessImprovementsInbox.tsx`.
  - Added mocked UI transition coverage in `apps/business-os/src/components/process-improvements/ProcessImprovementsInbox.test.tsx`.
  - Added the route to Business OS navigation in `apps/business-os/src/components/navigation/NavigationHeader.tsx`.
  - Validation passed: `pnpm --filter @apps/business-os typecheck`
  - Validation passed: `pnpm --filter @apps/business-os lint`

### TASK-05: Checkpoint the end-to-end app flow and confirm the report remains signpost-only
- **Type:** CHECKPOINT
- **Deliverable:** one explicit confirmation that the report remains signpost-only based on a working end-to-end app flow
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-03-11)
- **Affects:** `docs/plans/process-improvements-operator-decision-inbox/plan.md`, `docs/plans/process-improvements-operator-decision-inbox/fact-find.md`, any touched report/generator files only if the checkpoint changes scope
- **Depends on:** TASK-01, TASK-02, TASK-03, TASK-04
- **Blocks:** TASK-06, TASK-07
- **Confidence:** 83%
  - Implementation: 83% - the checkpoint is straightforward once the core app flow exists.
  - Approach: 84% - deferring report overlay work until after the app works prevents speculative complexity.
  - Impact: 84% - this protects the tranche from unnecessary generator work.
- **Acceptance:**
  - A working app flow exists for `Do`, `Defer`, and `Decline`.
  - The checkpoint confirms that the report remains signpost-only with no mirrored decision overlay.
  - Any scope change caused by the checkpoint is captured explicitly before TASK-06 starts.
- **Validation contract (TC-05):**
  - TC-01: one end-to-end rehearsal of each action path is documented against the built app flow.
  - TC-02: the report posture is explicit and leaves no ambiguity about authority.
  - TC-03: the updated plan/fact-find remain consistent after the checkpoint decision.
- **What would make this >=90%:** complete the rehearsal against a working route and capture one clear report decision with no fallback wording.
- **Checkpoint evidence:**
  - `Do` now appends a pending ledger event, creates the routed artifact through the operator-actions module, marks the queue dispatch processed, and then appends a succeeded or failed execution event.
  - `Defer` now appends only a ledger event with `defer_until` and leaves queue state `enqueued`.
  - `Decline` now appends a pending ledger event, writes first-class `queue_state = "declined"` plus `declined_by`, and then appends a succeeded or failed execution event.
  - The static report is explicitly read-only and points operators to the Business OS app route.

### TASK-06: Implement static-report read-only signposting with no mirrored decision overlay
- **Type:** IMPLEMENT
- **Deliverable:** report-side read-only messaging and app signposting only
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-03-11)
- **Affects:** `docs/business-os/process-improvements.user.html`, `docs/business-os/_data/process-improvements.json`, `scripts/src/startup-loop/build/generate-process-improvements.ts`, app/report linking paths
- **Depends on:** TASK-05
- **Blocks:** TASK-07
- **Confidence:** 84%
  - Implementation: 84% - the task is now narrow and does not require data overlay logic.
  - Approach: 85% - signposting-only is the cleanest long-term posture while the app is authoritative.
  - Impact: 84% - it reduces operator confusion without reopening app authority.
- **Acceptance:**
  - The report explicitly presents itself as read-only and directs operators to the app for actions.
  - Expected user-observable behavior:
    - Operators cannot mistake the report for the action surface.
    - No decision-state mirroring appears in the report.
- **Validation contract (TC-06):**
  - TC-01: the report no longer presents itself as an action surface.
  - TC-02: the report links or points clearly to the Business OS app route for actions.
  - TC-03: targeted typecheck/lint pass for touched `scripts` and `@apps/business-os` paths.
  - TC-04: if report UI changes materially, run `lp-design-qa`, `tools-ui-contrast-sweep`, and `tools-ui-breakpoint-sweep` on the changed report surface and fix Critical/Major findings.
- **Planning validation evidence:** checkpoint output from TASK-05 confirms no overlay work is needed.
- **Rollout/rollback:** signposting can ship independently; rollback removes signposting copy while preserving the app as authority.
- **Documentation impact:** update any nearby report copy or generator comments that describe the report as the primary operator surface.
- **What would make this >=90%:** TASK-05 confirms signposting-only posture and the report copy is validated against one real snapshot.
- **Build completion evidence:**
  - Updated `docs/business-os/process-improvements.user.html` to present the report as read-only and link directly to `http://127.0.0.1:3020/process-improvements`.
  - Confirmed the report no longer implies local actions or mirrored decision state.

### TASK-07: Add deterministic validation coverage across projection, ledger, API, UI, and report seams
- **Type:** IMPLEMENT
- **Deliverable:** targeted tests and validation checks for the new process-improvements app flow
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-03-11)
- **Affects:** `apps/business-os/src/app/**/__tests__/**`, `apps/business-os/src/app/api/**/__tests__/**`, `apps/business-os/src/lib/process-improvements/**`, `scripts/src/startup-loop/__tests__/**`
- **Depends on:** TASK-03, TASK-04, TASK-05, TASK-06
- **Blocks:** -
- **Confidence:** 84%
  - Implementation: 84% - existing app and script test patterns are available.
  - Approach: 84% - the seams are deterministic enough for focused coverage.
  - Impact: 85% - this is required to keep the new control surface safe.
- **Acceptance:**
  - App/API tests cover `Do`, `Defer`, and `Decline`.
  - Projection and ledger helpers are covered by deterministic tests.
  - Queue mutation semantics for immediate handoff and first-class terminal decline are covered.
  - Report signposting behavior is covered where it changed.
- **Validation contract (TC-07):**
  - TC-01: every action type has at least one deterministic test at the API or service layer.
  - TC-02: projection tests prove queue-backed items render without generated report JSON.
  - TC-03: queue mutation semantics for `Do` and `Decline` are covered by focused tests, including `queue_state = "declined"`.
  - TC-04: report signposting behavior is covered where TASK-06 changed the report surface.
  - TC-05: targeted typecheck/lint pass for every touched package path.
- **Planning validation evidence:** reuse existing Business OS action tests and startup-loop queue tests rather than inventing a new test style.
- **Rollout/rollback:** tests ship with the feature; rollback is not applicable.
- **Documentation impact:** add or update nearby test comments only where the seam would otherwise be unclear.
- **What would make this >=90%:** complete service-layer coverage for all three actions plus one route-render test using the final projection model.
- **Build completion evidence:**
  - Added projection coverage in `apps/business-os/src/lib/process-improvements/projection.test.ts`.
  - Added decision-ledger coverage in `apps/business-os/src/lib/process-improvements/decision-ledger.test.ts`.
  - Added operator action coverage in `scripts/src/startup-loop/__tests__/lp-do-ideas-operator-actions.test.ts`.
  - Added API route coverage in `apps/business-os/src/app/api/process-improvements/decision/[decision]/route.test.ts`.
  - Added inbox UI coverage in `apps/business-os/src/components/process-improvements/ProcessImprovementsInbox.test.tsx`.
  - Added report-signpost coverage in `scripts/src/startup-loop/__tests__/generate-process-improvements.test.ts`.

## Risks & Mitigations
- The app could become authoritative while the report still appears actionable.
  - Mitigation: TASK-06 must explicitly mark the report read-only and direct operators to the app.
- `Do` could mutate workflow state without durable operator audit.
  - Mitigation: TASK-03 requires ledger-first write ordering and test coverage for it.
- `Decline` could collapse into generic skip semantics.
  - Mitigation: TASK-03 introduces explicit operator rejection metadata and TASK-07 tests it.
- `Defer` could accidentally become a queue-state transition.
  - Mitigation: TASK-02 and TASK-03 keep `Defer` ledger-only and TASK-07 tests queue non-mutation.
- The report overlay could expand into unnecessary generator complexity.
  - Mitigation: the plan now forbids mirrored decision overlay in this tranche; TASK-05 only confirms that posture.

## Observability
- Logging:
  - decision API request outcome
  - queue handoff result for `Do`
  - terminal mutation result for `Decline`
  - ledger read/write failures
- Metrics:
  - count of `Do`, `Defer`, `Decline`
  - average defer duration
  - route chosen after `Do`
  - reappearance rate after `Defer`
  - action failure count
- Alerts/Dashboards:
  - none in this tranche

## Acceptance Criteria (overall)
- [ ] Business OS has an authenticated process-improvements inbox route for queue-backed idea items.
- [ ] The app reads queue-backed items from queue state plus decision-ledger overlay, not from generated report JSON.
- [ ] `Do`, `Defer`, and `Decline` are implemented with the locked semantics from the fact-find.
- [ ] Route choice remains hidden from the operator.
- [ ] The static report is explicitly read-only and signpost-only, with no mirrored decision overlay.
- [ ] Deterministic validation covers the projection, ledger, API, UI, and any retained report seam.

## Decision Log
- 2026-03-10: Chose app runtime in `apps/business-os` over extending the `file://` report.
- 2026-03-10: Locked action semantics to `Do = immediate handoff`, `Defer = ledger-only snooze`, `Decline = terminal queue state + ledger record`.
- 2026-03-10: Locked the app read model to queue state plus reduced decision-ledger overlay; generated process-improvements artifacts remain downstream compatibility outputs only.
- 2026-03-10: Locked the decision-ledger authority to append-only `docs/business-os/process-improvements/operator-decisions.jsonl`.
- 2026-03-10: Chose first-class `queue_state = "declined"` plus `declined_by` metadata instead of overloading generic terminal queue states.
- 2026-03-10: Chose a dedicated startup-loop operator-actions module instead of embedding operator behavior directly into generic queue helpers.
- 2026-03-10: Locked the static report to signpost-only with no mirrored decision overlay.

## What Would Make This >=90%
- Prove the queue-native projection against one real queue entry and one full app render.
- Prove append/reduce ledger behavior and failed-execution action recording.
- Complete TASK-05 so the signpost-only report posture is evidenced, not just asserted.

## Overall-confidence Calculation
- Confidence dimensions:
  - Implementation: 84%
  - Approach: 87%
  - Impact: 87%
- Effort weights: S=1, M=2, L=3
- Overall-confidence = sum(task confidence * effort weight) / sum(effort weight) = 84%
