---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: BOS | Startup Loop
Workstream: Operations
Created: 2026-03-10
Last-updated: 2026-03-10
Feature-Slug: process-improvements-operator-decision-inbox
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/process-improvements-operator-decision-inbox/plan.md
Trigger-Why: The current process-improvements page is a passive `file://` report. The operator wants this to become an actionable inbox, and the correct runtime is now an authenticated app rather than a static page.
Trigger-Intended-Outcome: "type: operational | statement: Process improvements becomes a Business OS operator app where queue-backed idea candidates can be marked do, defer, or decline; do hands the item forward immediately through the existing routing flow, defer hides it for 7 days via a decision ledger, and decline records the rejection while moving the queue item to a terminal state. | source: operator"
direct-inject: true
direct-inject-rationale: The operator requested a workflow redesign directly from the current report page and then explicitly pivoted the target to an app.
---

# Process Improvements Operator App Fact-Find

## Scope
### Summary
The old target was to evolve `docs/business-os/process-improvements.user.html` from a passive report into an actionable page. That is no longer the right target. The actionable surface should be an authenticated operator app route inside `apps/business-os`, with proper API endpoints and durable server-side persistence.

The static process-improvements HTML remains useful as a generated report and compatibility surface, but it should not be the mutating runtime. The new target is an operator inbox app for queue-backed idea items with exactly three actions:

- `Do`
- `Defer`
- `Decline`

The action semantics are now locked:

- `Do` = immediate handoff through the existing routing machinery
- `Defer` = ledger-only snooze for 7 days
- `Decline` = queue terminal state plus explicit ledger record

The operator still does not choose the downstream route. The system does.

### Goals
- Move the actionable process-improvements surface into `apps/business-os`.
- Keep active idea backlog authority queue-backed.
- Make `Do` an immediate handoff using the existing routing and micro-build fast lane.
- Make `Defer` a time-bounded decision overlay, not a queue terminal state.
- Make `Decline` an explicit operator rejection with both auditability and workflow effect.
- Keep `risk` and `pending-review` out of the first triage action set.

### Non-goals
- Keeping `file://` HTML as the primary mutating surface.
- Asking the operator to choose `fact-find`, `plan`, `build`, or `briefing`.
- Replacing the static generated report entirely in the first tranche.
- Full autonomy or auto-execution without operator confirmation.
- Broad redesign of Business OS beyond the new inbox route and decision API.

### Constraints & Assumptions
- Constraints:
  - Active actionable idea backlog is now queue-backed; raw bug-scan findings no longer form a second visible idea rail.
  - Existing queue lifecycle semantics remain authoritative for active vs terminal work.
  - `Do` must hand off immediately, not create a passive approval record.
  - `Decline` must have visible workflow effect, not only a UI hide.
  - `Defer` must not be represented by `skipped`, `suppressed`, or `completed`.
- Assumptions:
  - `apps/business-os` is the correct host for the operator inbox because it already provides authenticated app routes, API routes, and repo-write/server seams.
  - The first live app version should operate on `idea` items only; `risk` and `pending-review` stay informational.
  - A repo-readable decision ledger is still useful even though the control surface is now an app, because generator/report compatibility and auditability still matter.

## Outcome Contract
- **Why:** The repo now has one canonical actionable idea backlog, but the current operator surface is still a passive report. The missing seam is not backlog authority; it is an authenticated decision surface with durable persistence and immediate action handling.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Process improvements becomes a Business OS operator app where queue-backed idea candidates can be marked `Do`, `Defer`, or `Decline`; `Do` immediately hands the item into the normal routing flow, `Defer` hides it for 7 days via a decision ledger, and `Decline` records rejection while moving the queue item to a terminal state.
- **Source:** operator

## Access Declarations
None.

## Evidence Audit (Current State)
### Entry Points
- `docs/business-os/process-improvements.user.html`
  - Current operator-visible process-improvements report; generated, static, and still framed as a report.
- `scripts/src/startup-loop/build/generate-process-improvements.ts`
  - Generator for process-improvements HTML/JSON data; active idea items are queue-backed.
- `docs/business-os/startup-loop/ideas/trial/queue-state.json`
  - Canonical active backlog source for idea items shown in process-improvements.
- `apps/business-os/src/app/ideas/page.tsx`
  - Existing authenticated operator app route with backlog-style UI patterns.
- `apps/business-os/src/app/api/ideas/route.ts`
  - Existing Next API route pattern inside the Business OS app.
- `apps/business-os/src/lib/auth/middleware.ts`
  - Existing write-authorization pattern for app-side mutations.
- `apps/business-os/src/lib/repo/CommentWriter.ts`
  - Existing repo-write helper pattern proving app-side git/repo writes are already a first-class seam.

### Key Modules / Files
- `docs/business-os/process-improvements.user.html`
  - Still useful as a generated report, but not the right mutation target.
- `scripts/src/startup-loop/build/generate-process-improvements.ts`
  - `collectProcessImprovements()` now reads active idea backlog from queue dispatches only.
  - `updateProcessImprovementsArtifacts()` syncs bridges before generating report artifacts.
  - Queue-backed items still drop route/status/action payload details when converted into `ProcessImprovementItem`.
- `scripts/src/startup-loop/ideas/lp-do-ideas-routing-adapter.ts`
  - Holds canonical route/status mapping, including `micro_build_ready -> lp-do-build`.
- `scripts/src/startup-loop/ideas/lp-do-ideas-work-packages.ts`
  - Already supports route-aware claims and processed metadata; strongest seam for immediate-handoff `Do`.
- `scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-file.ts`
  - Holds queue state semantics, including terminal states relevant to `Decline`.
- `apps/business-os/src/app/ideas/page.tsx`
  - Shows that the app already has list, filter, pagination, and triage-adjacent UI conventions.
- `apps/business-os/src/app/api/ideas/route.ts`
  - Shows existing authenticated API pattern and server-side request validation.
- `apps/business-os/src/lib/auth/middleware.ts`
  - Shows write access and request-origin guard patterns already exist.
- `apps/business-os/src/lib/repo/CommentWriter.ts`
  - Shows app-side writes into `docs/business-os/**` are already part of the app’s model.

### Patterns & Conventions Observed
- Active idea backlog is now queue-backed.
  - Evidence: process-improvements generator no longer surfaces raw bug-scan findings directly as idea cards.
- Business OS already has an operator-app runtime.
  - Evidence: `apps/business-os` has authenticated routes, API routes, and server-side write helpers.
- Static generated docs still have value as reference/report outputs.
  - Evidence: process-improvements HTML/JSON generation remains useful for non-interactive visibility and historical compatibility.
- Queue lifecycle already expresses active vs terminal state cleanly.
  - Evidence: only `queue_state === "enqueued"` items are visible in the active backlog.
- The missing seam is operator decision persistence plus immediate action handling.
  - Evidence: there is still no process-improvements decision ledger or Business OS process-improvements API route.

### Data & Contracts
- Current authoritative sources:
  - Queue-backed actionable idea items: `docs/business-os/startup-loop/ideas/trial/queue-state.json`
  - Generated report outputs: `docs/business-os/process-improvements.user.html`, `docs/business-os/_data/process-improvements.json`
- Current missing contract:
  - No persisted process-improvements operator decision ledger exists yet.
  - No app API contract exists yet for `Do`, `Defer`, `Decline`.
- Required app-side contract:
  - `Do`: record operator decision, then immediately invoke existing route handoff
  - `Defer`: record `{ decision: "defer", defer_until }`
  - `Decline`: record `{ decision: "decline" }` and move queue item to terminal state with explicit operator reason metadata

### Dependency & Impact Map
- Upstream dependencies:
  - Queue generation and queue state
  - Existing route mapping and work-package claim logic
  - Generated report artifacts for compatibility/reference
- New app dependencies:
  - `apps/business-os` route/component structure
  - `apps/business-os` API routes and auth middleware
  - repo-write helper patterns
- Downstream dependents:
  - Operator inbox workflow
  - Generator overlay/report visibility for deferred/declined state if report compatibility is retained
  - Future autonomous pickup and telemetry
- Likely blast radius:
  - New app route and components in `apps/business-os`
  - New app API route(s)
  - New decision ledger schema and write path
  - Queue mutation helpers for immediate handoff and decline
  - Optional generator/report overlay changes for compatibility with app decisions

### Delivery & Channel Landscape
- Audience/recipient:
  - Primary audience is the operator using Business OS as the working control surface.
- Channel decision:
  - Actionable mode should run over the Business OS app’s authenticated HTTP runtime, not `file://`.
  - The static HTML report becomes read-only/reference mode or is later retired.
- Existing templates/assets:
  - `apps/business-os` already has internal app navigation, list views, filters, toasts, and authenticated API patterns.
- Compliance constraints:
  - Decisions must remain auditable and attributable.
  - App writes must still respect repo write authorization.
- Measurement hooks:
  - `decision_at`
  - `decision_type`
  - `route_taken_after_do`
  - `reappeared_after_defer`
  - `declined_at`

## Hypothesis & Validation Landscape
### Key Hypotheses
| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | The correct runtime is a Business OS app route, not the static report page. | Existing app/auth/api seams are sufficient. | Low | Low |
| H2 | `Do` can be immediate handoff without exposing route choice to the operator. | Existing queue routing and work-package claim seams are sufficient. | Low | Low |
| H3 | `Defer` should remain a decision-ledger overlay and not mutate queue lifecycle. | Generator/app readers can merge the overlay cleanly. | Medium | Low |
| H4 | `Decline` should mutate queue state and also persist an explicit rejection record. | Queue mutation helper can carry operator reason metadata. | Medium | Low |
| H5 | The static report can remain a compatibility surface while the app becomes the real control surface. | Report generation can consume ledger state or remain reference-only without confusing operators. | Medium | Medium |

### Existing Signal Coverage
| Hypothesis | Evidence available | Source | Confidence |
|---|---|---|---|
| H1 | Business OS already has authenticated pages and API routes. | `apps/business-os/src/app/ideas/page.tsx`, `apps/business-os/src/app/api/ideas/route.ts`, `apps/business-os/src/lib/auth/middleware.ts` | High |
| H2 | Existing route mapping already supports micro-build and non-micro-build handoff. | `lp-do-ideas-routing-adapter.ts`, `lp-do-ideas-work-packages.ts` | High |
| H3 | Queue terminal states hide items permanently from the active backlog. | `generate-process-improvements.ts`, queue state semantics | High |
| H4 | Queue terminal states exist, but explicit operator rejection metadata does not yet. | `lp-do-ideas-queue-state-file.ts` | Medium |
| H5 | Static report generation still exists and is useful, but not actionable. | `generate-process-improvements.ts`, `process-improvements.user.html` | High |

### Falsifiability Assessment
- Easy to test:
  - Immediate-handoff `Do` against one queue-backed micro-build item
  - `Defer` visibility suppression and timed reappearance
  - `Decline` removal from active inbox and terminal queue mutation
- Hard to test:
  - Exact report/app coexistence UX unless both surfaces are exercised together
- Validation seams needed:
  - App route data loader for queue-backed idea inbox
  - App API route for `Do`, `Defer`, `Decline`
  - Decision ledger schema

### Recommended Validation Approach
- Quick probes:
  - Prototype one Business OS route that renders queue-backed process-improvement items
  - Prototype one `POST` decision route with `Do`
- Structured tests:
  - App API tests for action semantics
  - Queue mutation tests for immediate handoff and decline
  - Generator/report compatibility tests if deferred/declined state is still surfaced outside the app

## Test Landscape
### Existing Coverage
| Area | Type | Evidence |
|---|---|---|
| Queue-backed report generation | Unit/integration | `scripts/src/startup-loop/__tests__/generate-process-improvements.test.ts` |
| Route mapping | Unit | `scripts/src/startup-loop/__tests__/lp-do-ideas-routing-adapter.test.ts` |
| Work-package claim semantics | Unit/integration | `scripts/src/startup-loop/__tests__/lp-do-ideas-work-packages.test.ts` |
| Business OS page/API patterns | Unit/integration | `apps/business-os/src/app/ideas/[id]/__tests__/actions.test.ts`, `apps/business-os/src/app/api/ideas/__tests__/route.test.ts` |

### Coverage Gaps
- No Business OS route exists yet for process-improvements inbox
- No Business OS API route exists yet for process-improvements decisions
- No decision ledger tests exist yet
- No tests yet cover app/report coexistence after decisions are written

### Recommended Test Approach
- App tests:
  - route rendering for queue-backed process-improvement items
  - API tests for `Do`, `Defer`, `Decline`
  - auth/write-authorization tests for the new API surface
- Queue tests:
  - `Do` immediate handoff path
  - `Decline` terminal-state path with operator metadata
- Report compatibility tests:
  - deferred/declined visibility behavior if the generator still consumes the ledger

## Questions
### Resolved
- Q: Should this still be built as a static page enhancement?
  - A: No. The actionable target is now an app route in `apps/business-os`.

- Q: Does a fast lane for non-complex ideas already exist?
  - A: Yes. `micro_build_ready` already maps directly to `lp-do-build`.

- Q: Should `Do` be immediate handoff or approval-for-pickup?
  - A: Immediate handoff.

- Q: Should `Decline` be queue terminal state or ledger-only hide?
  - A: Queue terminal state plus explicit ledger record.

- Q: Should `Defer` mutate queue state?
  - A: No. It should remain ledger-only with `defer_until`.

### Open
None. The architecture pivot and action semantics are now specific enough to plan.

## Rehearsal Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Queue-backed backlog authority | Yes | None | No |
| Existing routing and micro-build lane reuse | Yes | None | No |
| Business OS app substrate | Yes | No process-improvements route/API exists yet | Yes |
| `Do` immediate handoff semantics | Partial | Needs a concrete app API to queue/work-package mutation seam | Yes |
| `Defer` semantics | Yes | Needs ledger schema and visibility merge | Yes |
| `Decline` semantics | Partial | Needs explicit queue metadata contract plus ledger entry | Yes |

## Resulting System Rehearsal
### Forward Trace
| Step | Expected System Behavior | Issues Observed | Opportunities |
|---|---|---|---|
| 1. Operator opens Business OS process-improvements inbox | App shows queue-backed idea candidates plus informational non-idea sections | No route exists yet | Add `/process-improvements` under `apps/business-os` |
| 2. Operator reviews an idea card | Card shows only `Do`, `Defer`, `Decline`; route remains hidden | Current generated data drops route/status/action payload context | Add app-side queue projection or enrich app loader directly from queue packets |
| 3. Operator presses `Do` | App records decision and immediately hands off through the existing route machinery | No current app API exists for this | Build a dedicated action API backed by existing queue/work-package seams |
| 4. Operator presses `Defer` | App records `defer_until` and removes the item from the active inbox | No decision ledger exists yet | Add ledger schema keyed by `idea_key` |
| 5. Operator presses `Decline` | App records the rejection and moves the queue item to a terminal state | Terminal state + operator metadata contract does not yet exist | Add explicit decline metadata contract to queue mutation path |
| 6. Static report is viewed later | Report remains consistent with app-recorded decisions if compatibility is retained | Generator does not yet merge a decision ledger | Add compatibility merge only if needed; otherwise label report read-only |

### Issues
| Issue | Severity | Why it matters |
|---|---|---|
| No Business OS process-improvements app route exists yet | Critical | There is no actionable runtime yet |
| No process-improvements decision API exists yet | Critical | `Do`, `Defer`, and `Decline` cannot be persisted or executed |
| No decision ledger schema exists yet | Major | `Defer` and auditability have nowhere durable to live |
| Queue-backed items still lose route/status/action payload details when projected | Major | The app needs enough hidden context to keep route choice internal while executing actions |
| `Decline` queue metadata contract is not yet explicit | Major | Terminal state alone is not enough to distinguish operator rejection from other skip semantics |
| Static report/app coexistence is not yet defined | Moderate | Operators could see conflicting surfaces if the report is left looking active while the app becomes authoritative |

### Opportunities
| Opportunity | Benefit |
|---|---|
| Build on `apps/business-os` rather than inventing a one-off localhost shim | Uses an existing authenticated app and avoids `file://` persistence problems entirely |
| Keep queue as workflow authority and add a narrow decision ledger | Cleanly separates machine workflow from human intent |
| Preserve route opacity while using existing routing machinery | Keeps operator UX simple without sacrificing precision |
| Reuse Business OS API/auth/repo-write patterns | Reduces implementation risk and keeps the new surface consistent with the app |
| Keep the generated report as read-only/reference mode during rollout | Lowers migration risk while the app becomes authoritative |

## Scope Signal
- **Signal:** right-sized
- **Rationale:** The architectural ambiguity is now much lower. The work is no longer “make static HTML interactive”; it is “add one focused operator inbox route plus decision API inside an existing app.” That is still meaningful work, but it is cleaner and more defensible.

## Confidence Inputs
- **Implementation: 84%**
  - Evidence basis: app substrate, route patterns, API patterns, queue routing, and repo-write seams already exist.
  - To raise to >=90: map the exact queue mutation helper used by `Do` and `Decline`.

- **Approach: 91%**
  - Evidence basis: moving to an app directly resolves the main `file://` persistence flaw without inventing a local shim.
  - To raise to >=90: already met.

- **Impact: 91%**
  - Evidence basis: the resulting system directly matches the operator’s intended workflow and creates a clean path toward autonomy.
  - To raise to >=90: already met.

- **Delivery-Readiness: 82%**
  - Evidence basis: the target surface is now clear, but route/API/ledger seams still need explicit implementation design.
  - To raise to >=90: define the exact decision ledger path and exact queue mutation contract.

- **Testability: 87%**
  - Evidence basis: the app already has page and API test patterns, and the queue logic already has deterministic unit seams.
  - To raise to >=90: settle the app/report coexistence contract so compatibility tests can be scoped cleanly.

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| App route is built but still reads the under-specified generator projection instead of queue-native action data | Medium | High | Either enrich the projection or have the app load directly from queue-backed packet shape |
| `Do` immediate handoff mutates queue/work-package state without preserving an explicit operator audit record | Medium | High | Always write the decision ledger before or alongside the handoff mutation |
| `Decline` is implemented as a generic terminal state without explicit operator metadata | Medium | Medium | Add explicit decline metadata fields in the mutation path |
| Static report remains visually actionable after the app becomes authoritative | Medium | Medium | Make the report visibly read-only or redirect operators to the app |
| `Defer` is accidentally coupled to queue lifecycle | Low | High | Keep `Defer` ledger-only by contract |

## Planning Constraints & Notes
- Must-follow patterns:
  - Build the actionable surface in `apps/business-os`
  - Keep route choice hidden from the operator
  - Keep queue as workflow authority
  - Keep `Defer` out of queue terminal states
  - Record explicit audit data for `Do` and `Decline`
- Rollout expectations:
  - First ship the app as authoritative for actions
  - Then decide whether the static report remains as read-only compatibility or is retired

## Suggested Task Seeds (Non-binding)
- TASK-01: Define the Business OS process-improvements inbox route and app data loader.
- TASK-02: Define the process-improvements decision ledger schema and storage path.
- TASK-03: Implement Business OS API routes for `Do`, `Defer`, and `Decline`.
- TASK-04: Implement immediate-handoff `Do` using existing queue routing/work-package seams.
- TASK-05: Implement `Decline` queue terminal-state mutation with explicit operator metadata.
- TASK-06: Build the app inbox UI and decision-state sections.
- TASK-07: Decide and implement static report coexistence: read-only compatibility or retirement.
- TASK-08: Add deterministic app/API/queue compatibility tests.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - none
- Deliverable acceptance package:
  - Business OS inbox route
  - decision API
  - decision ledger
  - queue mutation wiring for `Do` and `Decline`
  - app UI
  - compatibility decision for the static report
  - targeted tests
