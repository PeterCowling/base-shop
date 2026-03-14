---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: BOS | Startup Loop
Workstream: Mixed
Created: 2026-03-11
Last-updated: 2026-03-11
Feature-Slug: process-improvements-operator-actions-integration
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/process-improvements-operator-actions-integration/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260311115547-9551
Trigger-Why: The operator now has two separate places to look for work that should really be managed together: the process-improvements inbox and the output-registry operator card. That splits attention, hides overdue actions, and leaves the app unable to show the most important operator decisions. Fixing this should create one integrated inbox backed by a canonical structured operator-actions source, not a fragile HTML scrape.
Trigger-Intended-Outcome: type: operational | statement: Business OS has an analysis-ready fact-find for one integrated operator inbox that can show both process improvements and structured operator actions from startup-loop sources, with distinct card styling and no runtime HTML parsing. | source: operator
---

# Process Improvements Operator Actions Integration Fact-Find Brief

## Scope
### Summary
Investigate how to integrate the startup-loop operator work currently surfaced inside `docs/business-os/startup-loop-output-registry.user.html` into the authenticated Business OS `/process-improvements` route without parsing HTML at runtime. The target outcome is one operator inbox that can show both queue-backed process-improvement items and structured operator-action items with distinct visual treatment and type-aware actions.

### Goals
- Establish the current source-of-truth boundaries for queue-backed process improvements versus registry-visible operator actions.
- Identify the minimum new structured dataset and app projection contract needed for an integrated inbox.
- Trace the UI, API, decision, and report seams that would change if operator-action cards are added.
- Carry forward the locked constraint that runtime HTML parsing is out of scope.

### Non-goals
- Implement the integrated inbox in this artifact.
- Reopen the prior decision that the Business OS app, not a static report, is the action runtime.
- Treat the existing registry HTML as a runtime data source.
- Decide final implementation tasks or sequencing.

### Constraints & Assumptions
- Constraints:
  - No runtime HTML parsing is allowed.
  - Existing queue-backed `Do`, `Defer`, and `Decline` semantics remain authoritative for process-improvement items unless later analysis proves otherwise.
  - The integrated surface must make operator-action cards visually distinct at a glance.
  - The current date is 2026-03-11, so surfaced due dates before that point should be treated as overdue in any future integrated inbox.
- Assumptions:
  - The correct host remains `apps/business-os`, not a static doc.
  - A new operator-actions dataset can be introduced without making the registry HTML authoritative.
  - Mixed card types in one route are feasible if the projection and action model become type-aware.

## Outcome Contract
- **Why:** The operator now has two separate places to look for work that should really be managed together: the process-improvements inbox and the output-registry operator card. That splits attention, hides overdue actions, and leaves the app unable to show the most important operator decisions. Fixing this should create one integrated inbox backed by a canonical structured operator-actions source, not a fragile HTML scrape.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Business OS has an analysis-ready fact-find for one integrated operator inbox that can show both process improvements and structured operator actions from startup-loop sources, with distinct card styling and no runtime HTML parsing.
- **Source:** operator

## Access Declarations
None. This investigation used repository sources only.

## Evidence Audit (Current State)
### Entry Points
- `apps/business-os/src/app/process-improvements/page.tsx` - current authenticated route wrapper and page framing.
- `apps/business-os/src/lib/process-improvements/projection.ts` - current read model for queue-backed inbox items and actioned history.
- `apps/business-os/src/components/process-improvements/ProcessImprovementsInbox.tsx` - current single-card-type operator UI and card styling.
- `apps/business-os/src/app/api/process-improvements/decision/[decision]/route.ts` - decision API boundary and auth gate.
- `apps/business-os/src/lib/process-improvements/decision-service.ts` - queue handoff/decline behavior behind the app API.
- `docs/business-os/startup-loop-output-registry.user.html` - current static surface that already contains operator-action content.
- `scripts/src/startup-loop/build/generate-build-summary.ts` - build-summary generator seam for the registry page.
- `docs/plans/process-improvements-operator-decision-inbox/plan.md` - active queue-only app plan that defines the current tranche boundary.

### Key Modules / Files
- `apps/business-os/src/app/process-improvements/page.tsx`
  - Frames the route as "Process Improvements" and describes it as workflow improvements awaiting a decision.
- `apps/business-os/src/lib/process-improvements/projection.ts`
  - Builds inbox items only from `queue_state === "enqueued"` dispatches and exposes one item shape.
- `apps/business-os/src/components/process-improvements/ProcessImprovementsInbox.tsx`
  - Renders one card type with shared summary tiles, shared filters, and neutral panel styling.
- `apps/business-os/src/lib/process-improvements/decision-service.ts`
  - Preserves the current decision model: `defer` writes ledger only; `do` and `decline` write ledger plus queue mutations.
- `apps/business-os/src/app/api/process-improvements/decision/[decision]/route.ts`
  - Requires admin auth and accepts only `ideaKey` plus `dispatchId`.
- `docs/business-os/startup-loop-output-registry.user.html`
  - Embeds operator-card blocks for HEAD and other businesses, including stage gates, blockers, 72h plans, and decision-register summaries.
- `scripts/src/startup-loop/build/generate-build-summary.ts`
  - Only injects build-summary JSON into the registry page; it does not synthesize the operator-action blocks now visible there.
- `apps/business-os/src/styles/global.css`
  - Exposes `warning-soft`, `warning-fg`, `danger-soft`, and related semantic tokens suitable for card differentiation without introducing hardcoded colors.

### Patterns & Conventions Observed
- Process improvements is app-authoritative for queue-backed improvement items.
  - Evidence: `projection.ts` explicitly states generated report artifacts are downstream read-only outputs and filters from queue state only.
- The registry page already contains operator work that looks like inbox material, but it is embedded in the static HTML.
  - Evidence: HEAD operator card includes stage gates, blockers, 72h actions, and decision-register rows in `startup-loop-output-registry.user.html`.
- The current generator path does not explain where those operator blocks come from.
  - Evidence: `generate-build-summary.ts` writes build-summary JSON and updates nav/inlined data only; no operator-action extraction logic is present there.
- The active app plan is still scoped to queue-backed process-improvement cards and their three actions.
  - Evidence: the active plan explicitly treats `Do`, `Defer`, and `Decline` as the action set and states that adding new action types is out of scope.
- The current app styling uses the same `bg-panel` treatment for summary cards, inbox cards, and action history cards.
  - Evidence: `ProcessImprovementsInbox.tsx` uses `bg-panel` on summary cards, inbox cards, and action-history items.

### Data & Contracts
- Types/schemas/events:
  - `ProcessImprovementsInboxItem` currently models queue dispatch attributes only: `dispatchId`, `recommendedRoute`, `priority`, `confidence`, `locationAnchors`, and decision overlay state.
  - `ProcessImprovementsActionedItem` only replays `do` and `decline` decisions from the ledger.
- Persistence:
  - Queue-backed items are read from `docs/business-os/startup-loop/ideas/trial/queue-state.json` through the queue-path resolver.
  - Decision state is appended to the process-improvements decision ledger before or alongside queue mutations.
- API/contracts:
  - The decision API accepts only `ideaKey` and `dispatchId` and restricts `decision` to `do`, `defer`, or `decline`.
  - The missing contract is a structured operator-actions dataset that can represent `blocker`, `stage_gate`, `decision_waiting`, or similar operator-task types without pretending they are queue dispatches.

### Dependency & Impact Map
- Upstream dependencies:
  - Queue state and ledger remain authoritative for process-improvement items.
  - Registry operator-card content is the visible proof that a second operator-work stream exists today.
  - The active queue-only plan constrains what is already locked and what must be treated as a new tranche.
- Downstream dependents:
  - `/process-improvements` route framing, projection, and card renderer.
  - Decision API and decision-service copy if item-type-specific actions are introduced later.
  - Registry page and any future generator/report seam once a structured operator-actions dataset exists.
- Likely blast radius:
  - App read model and UI hierarchy.
  - Filtering, sorting, and summary counts.
  - Due-date and overdue state treatment.
  - Terminology: the route likely becomes a broader operator inbox rather than queue-only "process improvements."

### Delivery & Channel Landscape
- Audience/recipient:
  - Primary operator using Business OS as the working surface.
  - Secondary mixed readers who need to scan operator decisions without deep queue or artifact knowledge.
- Channel constraints:
  - The mutating runtime stays in the authenticated Business OS app.
  - Static HTML can remain as a reference/report surface but must not become a runtime API.
- Existing templates/assets:
  - Current process-improvements inbox layout and registry operator-card sections.
  - Existing semantic warning/danger tokens in app CSS that can support differentiated card backgrounds.
- Approvals/owners:
  - Operator direction is explicit: integrate surfaced operator work into the app and make the cards visually distinct.
  - Implementation ownership would likely sit across platform/startup-loop and Business OS app seams.
- Compliance constraints:
  - No external or regulated data sources were identified in this scope.
  - Admin-only decision actions are already enforced for the existing process-improvements API surface.
- Measurement hooks:
  - Current route exposes only counts for awaiting, deferred, and actioned queue items.
  - An integrated inbox will likely need additional hooks for item type, overdue count, and operator-action completion/snooze, but those hooks do not exist yet.

### Hypothesis & Validation Landscape
#### Key Hypotheses
| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | A canonical structured operator-actions dataset is required before the app can integrate registry-visible operator work safely. | The registry HTML is not already backed by a reusable structured source. | Low | Low |
| H2 | The existing queue-backed process-improvements read model cannot simply absorb operator actions without a typed contract split. | Current item type, API, and action semantics are queue-specific. | Low | Low |
| H3 | A soft warning-tinted card background will make operator-action cards easier to spot without needing a separate route. | Existing semantic token set is sufficient and mixed-card presentation remains readable. | Low | Low |
| H4 | Overdue treatment matters immediately because surfaced blocker due dates are already in the past relative to 2026-03-11. | The integrated source preserves due dates and status cleanly. | Low | Low |

#### Existing Signal Coverage
| Hypothesis | Evidence available | Source | Confidence |
|---|---|---|---|
| H1 | Operator work is present in the registry but not in the app projection, and build-summary injection does not generate it. | `startup-loop-output-registry.user.html`, `generate-build-summary.ts`, `projection.ts` | High |
| H2 | App items and API payloads are queue-dispatch-shaped only. | `projection.ts`, `ProcessImprovementsInbox.tsx`, `decision/[decision]/route.ts`, `decision-service.ts` | High |
| H3 | App CSS already exposes semantic warning tokens and the current route uses neutral panel styling everywhere. | `apps/business-os/src/styles/global.css`, `ProcessImprovementsInbox.tsx` | High |
| H4 | HEAD blocker due dates of 2026-02-27 and 2026-03-03 are already past due on 2026-03-11. | `startup-loop-output-registry.user.html` | High |

#### Falsifiability Assessment
- Easy to test:
  - Whether a separate structured operator-actions dataset already exists in repo-visible sources.
  - Whether the current app read model can represent due-date, owner, and source-path operator tasks without contract changes.
  - Whether current token inventory supports visually distinct card surfaces.
- Hard to test:
  - The best long-term ownership point for operator-actions generation, because the current registry operator-card pipeline is not yet traced to code in this brief.
- Validation seams needed:
  - Source-generation path for current operator-card content.
  - Future typed action model for integrated inbox items.
  - Report/app coexistence contract once the structured dataset exists.

#### Recommended Validation Approach
- Quick probes:
  - Trace where current operator-card blocks are authored/generated.
  - Define a draft `operator_action` item contract and check which current app filters and actions break against it.
  - Mock one warning-tinted card style using existing semantic tokens.
- Structured tests:
  - Projection tests for mixed item types.
  - Route/component tests for sectioning, filtering, and overdue state display.
  - Generator/report tests once the structured operator-actions dataset exists.
- Deferred validation:
  - True operator scanning-speed or missed-action reduction should be validated after a real integrated inbox ships.

### Test Landscape
#### Test Infrastructure
- Frameworks:
  - Jest-based route and component tests in `apps/business-os`.
- Commands:
  - Repo policy keeps test execution in CI only; no local Jest runs in this session.
- CI integration:
  - Existing route and component tests already cover the current queue-only app surface.

#### Existing Test Coverage
| Area | Type | Evidence |
|---|---|---|
| Decision API auth and response mapping | Unit/integration | `apps/business-os/src/app/api/process-improvements/decision/[decision]/route.test.ts` |
| Current queue-backed inbox rendering and action flow | Component test | `apps/business-os/src/components/process-improvements/ProcessImprovementsInbox.test.tsx` |
| Queue-backed generator/report seams | Unit/integration | `scripts/src/startup-loop/__tests__/generate-build-summary.test.ts`, `scripts/src/startup-loop/__tests__/generate-process-improvements.test.ts` |

#### Coverage Gaps
- No test currently proves where registry operator-card content is generated or maintained.
- No test exists for an integrated mixed-card inbox.
- No test exists for due-date/overdue rendering in the app inbox.
- No test exists for typed operator-action actions such as `mark done` or `snooze`, because that contract does not exist yet.

#### Testability Assessment
- Easy to test:
  - Projection-level type branching and summary counts.
  - Card-style class branching by item type.
  - Admin-auth route branching if new action endpoints are introduced.
- Hard to test:
  - Any solution that leaves operator-action content hand-authored inside registry HTML rather than expressed through a structured dataset.
- Test seams needed:
  - Stable fixture format for structured operator-action items.
  - Clear item-type-specific action contract before UI tests are written.

#### Recommended Test Approach
- Unit tests for:
  - Mixed projection output and type-aware derived fields.
- Integration tests for:
  - Route loader and UI rendering across queue-backed and operator-action sections.
- Contract tests for:
  - Operator-actions dataset schema and report/app consumer expectations.

### Recent Git History (Targeted)
- `e09b4a381c Build process improvements operator inbox`
  - Established the current app runtime and queue-backed decision surface; future integration must treat that as the foundation rather than restart the runtime decision.
- `d635d989cd startup-loop: add deterministic build summary integration`
  - Added build-summary integration to the registry page, which confirms the registry is already receiving generated data but does not show operator-action extraction logic.
- `112c341f04 feat(business-os): add startup loop output registry HTML artifact`
  - Added the registry artifact that now visibly contains the operator-card sections under discussion.

## Engineering Coverage Matrix
| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | `ProcessImprovementsInbox.tsx` uses a single neutral card treatment; app CSS exposes semantic warning/danger tokens. | Operator-action cards are not visually distinct today. | Compare section-based versus mixed-list card treatments using semantic tokens only. |
| UX / states | Required | Current inbox supports awaiting, deferred, and actioned queue states only. | Operator actions need due-date, overdue, owner, and likely different actions. | Define typed states and item-specific consequences before UI tasks are planned. |
| Security / privacy | Required | Current decision API is admin-gated. | Any new operator-action mutation endpoints must preserve equivalent authz. | Keep auth boundary explicit in any future typed action model. |
| Logging / observability / audit | Required | Queue and ledger provide auditability for process-improvement decisions. | Structured operator actions currently have no traced audit dataset in this brief. | Identify the authoritative write seam and required audit trail before plan. |
| Testing / validation | Required | Queue-only route and component tests already exist. | No mixed-type or overdue-state coverage exists. | Require projection, route, and schema tests for the integrated inbox. |
| Data / contracts | Required | `ProcessImprovementsInboxItem` and API payloads are queue-shaped only. | New typed operator-action contract is missing and is the main architecture seam. | Compare contract options and choose one canonical operator-actions dataset. |
| Performance / reliability | Required | Current route reads queue state and ledger only. | Adding another source without a clean contract could create drift or double-read complexity. | Evaluate consumer model that keeps report and app in sync without runtime HTML parsing. |
| Rollout / rollback | Required | Current queue-only app surface is already live. | An integrated inbox could confuse operators if terminology and sections shift abruptly. | Plan additive rollout with fallback to existing queue-only route behavior if needed. |

## Questions
### Resolved
- Q: Is runtime HTML parsing an option for the integrated inbox?
  - A: No. This is a locked constraint from operator direction and should remain a hard boundary.
  - Evidence: operator request plus absence of any runtime HTML-read path in the current app architecture.

- Q: Is the current app already reading registry data?
  - A: No. It reads queue state plus decision ledger only.
  - Evidence: `apps/business-os/src/lib/process-improvements/projection.ts`.

- Q: Does the current registry build-summary generator already expose a reusable operator-actions JSON feed?
  - A: No evidence of that was found in this brief. The generator injects build-summary JSON only.
  - Evidence: `scripts/src/startup-loop/build/generate-build-summary.ts`.

- Q: Are the visible registry operator tasks already overdue?
  - A: Yes. At least the HEAD blocker rows dated 2026-02-27 and 2026-03-03 are overdue relative to 2026-03-11.
  - Evidence: `docs/business-os/startup-loop-output-registry.user.html`.

### Open (Operator Input Required)
- None. The next unresolved questions are architecture and source-generation questions that should be answered in analysis, not by additional operator input.

## Rehearsal Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Registry operator-action source | Partial | [Scope gap] [Minor]: The brief proves the app does not consume these items today, but it does not yet trace the authoring/generation path for the current operator-card blocks. | No |
| Process-improvements app read model | Yes | None | No |
| Decision/action boundary | Yes | None | No |
| Visual differentiation and overdue states | Yes | None | No |

## Scope Signal
- **Signal:** right-sized
- **Rationale:** The work is clearly bounded to one integrated inbox problem: establish the missing structured operator-actions source, typed read model, and differentiated card treatment without reopening the queue-runtime decision or jumping into implementation.

## Evidence Gap Review
### Gaps Addressed
- Corrected the earlier assumption that registry-visible operator tasks came from `plan.user.md`; the brief now treats the current operator-card content as embedded in the registry HTML until a generation path is proven.
- Traced the existing app read and write seams so the integration problem is framed as a missing typed contract, not a missing route or decision API.
- Captured the overdue-state implication using exact dates visible in the current registry output.

### Confidence Adjustments
- Reduced delivery-readiness because the current operator-card generation source is not yet traced, even though the downstream app seams are clear.
- Kept impact high because the operator problem is explicit and visible in the current product surfaces.

### Remaining Assumptions
- A structured operator-actions dataset can be introduced without invalidating existing queue-backed process-improvement behavior.
- Existing semantic warning tokens will be acceptable for differentiated card styling.

## Confidence Inputs
| Dimension | Score | Evidence | What raises this to >=80 | What raises this to >=90 |
|---|---:|---|---|---|
| Implementation | 84 | The affected app route, projection, UI, API, and report seams are all identified. | Already >=80. | Trace the current operator-card generation path and confirm the best authoritative write seam. |
| Approach | 86 | The repo evidence strongly supports a typed structured source over runtime HTML parsing or queue-shape reuse. | Already >=80. | Compare at least two concrete source-of-truth options in analysis with explicit drift risks. |
| Impact | 88 | The operator has explicitly requested integration, and current registry dates show real overdue operator work. | Already >=80. | Validate one concrete mixed-card prototype against the current operator scanning flow. |
| Delivery-Readiness | 74 | App seams are ready, but the upstream structured operator-actions source is not yet defined. | Lock the source-generation seam and dataset ownership. | Demonstrate one end-to-end structured operator-action fixture consumed by both app and report code. |
| Testability | 79 | The app already has queue-only route/component tests, but the new typed data contract does not exist yet. | Add a stable operator-action fixture schema. | Land schema-level fixtures and at least one mixed-projection test seam. |

## Analysis Readiness
- **Ready for analysis:** Yes
- **Reason:** The brief identifies the current app/runtime boundaries, the visible second operator-work stream, the missing structured contract, the immediate overdue-state implication, and the main unanswered architecture comparison that analysis must resolve.
- **Best next step:** Compare authoritative-source options for operator actions and select the integrated inbox read model that preserves queue semantics while avoiding runtime HTML parsing.

## Risks
- Introducing operator-action cards without a canonical dataset would create a second fragile source of truth.
- Reusing the queue-only card contract for operator actions would blur action semantics and confuse operators.
- Renaming or broadening the page without additive rollout could make the current queue-only workflow harder to find.
- Styling differentiation that is too subtle will fail the operator request even if the underlying data integration is correct.
- If overdue handling is skipped, the integrated inbox could surface stale work without clear urgency cues.
