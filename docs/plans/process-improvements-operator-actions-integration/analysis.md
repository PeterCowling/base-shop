---
Type: Analysis
Status: Ready-for-planning
Domain: BOS | Startup Loop
Workstream: Mixed
Created: 2026-03-11
Last-updated: 2026-03-11
Feature-Slug: process-improvements-operator-actions-integration
Execution-Track: mixed
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/process-improvements-operator-actions-integration/fact-find.md
Related-Plan: docs/plans/process-improvements-operator-actions-integration/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Process Improvements Operator Actions Integration Analysis

## Decision Frame
### Summary
Choose the first credible architecture for moving operator work out of the startup-loop registry surface and into the authenticated Business OS `/process-improvements` route without runtime HTML parsing. The decision now is not whether to integrate. It is which structured source and app contract should become the foundation for that integrated inbox.

### Goals
- Introduce one canonical structured source for operator-action items.
- Let the app render queue-backed process improvements and operator-action items together without collapsing their semantics.
- Make operator-action cards visually distinct enough to spot instantly.
- Preserve existing queue-backed `Do`, `Defer`, and `Decline` behavior unchanged in the first tranche.

### Non-goals
- Reworking the queue-backed process-improvements write path.
- Parsing registry HTML at runtime or treating it as an app source of truth.
- Solving operator-action completion/snooze mutations in the first build slice.
- Migrating the registry page to the new source in the same first task.

### Constraints & Assumptions
- Constraints:
  - Runtime HTML parsing is out of scope.
  - Queue-backed process-improvement actions remain authoritative and unchanged for the current runtime.
  - Operator-action cards must be visually distinct from process-improvement cards.
  - The integrated route must remain inside `apps/business-os`.
  - Current overdue dates visible in the registry are before 2026-03-11 and must not be hidden by the new model.
- Assumptions:
  - A structured operator-actions source can be added independently of the queue state.
  - A typed mixed inbox is simpler and safer than trying to coerce operator actions into the queue dispatch contract.
  - The first build slice can be useful even if operator-action mutations remain read-only.

## Inherited Outcome Contract

- **Why:** The operator now has two separate places to look for work that should really be managed together: the process-improvements inbox and the output-registry operator card. That splits attention, hides overdue actions, and leaves the app unable to show the most important operator decisions. Fixing this should create one integrated inbox backed by a canonical structured operator-actions source, not a fragile HTML scrape.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Business OS has an analysis-ready fact-find for one integrated operator inbox that can show both process improvements and structured operator actions from startup-loop sources, with distinct card styling and no runtime HTML parsing.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/process-improvements-operator-actions-integration/fact-find.md`
- Key findings used:
  - The current app projection is queue-only and exposes one item contract.
  - The registry already shows actionable operator work, including blockers, 72h items, and decision-register rows.
  - The current app UI assumes one card family and one action family.
  - Existing app tokens already support warning/danger surfaces suitable for differentiated operator-action cards.

## Evaluation Criteria
| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Canonical source quality | The app and registry need one stable source for operator work | High |
| Semantic fit | Operator actions do not behave like queue-backed improvement dispatches | High |
| Buildability now | The first task must be implementable without reopening discovery | High |
| UI clarity | The operator must be able to spot action cards immediately | High |
| Change isolation | Queue-backed `Do` / `Defer` / `Decline` must stay reliable | High |
| Future parity | The chosen source should be reusable by the registry later | Medium |

## Options Considered
| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A | Add a canonical `operator-actions` JSON contract, have the app load it alongside queue state, and render typed mixed cards | Clean separation between queue items and operator actions, immediately buildable, reusable by the registry later | Requires introducing and maintaining a new structured source before generator parity exists | The new source could drift from the registry until parity work lands | Yes |
| B | Parse startup-loop markdown sources directly at app request time and infer operator actions server-side | Avoids a new stored dataset and stays closer to source docs | Runtime parsing is brittle, source docs do not consistently carry IDs/due dates/status, and the app would own extraction logic | Silent drift, fragile parsing, missing overdue semantics | No |
| C | Convert operator actions into queue dispatches and let the existing inbox machinery handle everything | Single app contract and one action transport | Forces different semantics into the queue model, muddies `Do`/`Defer`/`Decline`, and would require API/ledger changes before basic surfacing works | Hidden behavioral regressions in the current queue path | No |
| D | Extract operator actions from the registry HTML into app data at build time | Quick parity with what operators already see | Leaves generated HTML as source-of-truth-adjacent and hardens the wrong layer | Build-time scrape tech debt and brittle selectors | No |

## Engineering Coverage Comparison
| Coverage Area | Option A | Option B | Chosen implication |
|---|---|---|---|
| UI / visual | Straightforward typed card branching and warning-surface styling | UI waits on inferred runtime data quality | Use typed card rendering with warning-soft/danger-soft treatment |
| UX / states | Keeps queue actions stable and allows read-only operator cards first | Mixed semantics hidden behind one inferred runtime path | Separate sections and badges by item type |
| Security / privacy | Read-only file load plus existing admin queue APIs unchanged | More runtime parsing surface in the app | No new mutation path in tranche 1 |
| Logging / observability / audit | Structured operator-action IDs can be logged later | Runtime parsing failures would be opaque to operators | Start with additive structured IDs and source paths |
| Testing / validation | Projection/component tests can target a stable JSON fixture | Markdown/runtime parsing would need fragile fixture coverage | Add deterministic projection/component coverage around the new contract |
| Data / contracts | Explicit typed union for queue vs operator items | Implicit inferred shape from docs | Add one canonical contract and keep queue contract intact |
| Performance / reliability | Small JSON load, deterministic branching | Runtime markdown parsing on every request | Favor additive JSON load with empty-safe fallback |
| Rollout / rollback | Additive route change; fallback is empty operator-action set | Runtime parser entangles load failures with route rendering | Ship additive support first and keep existing queue path untouched |

## Chosen Approach
- **Recommendation:** Introduce a canonical structured `operator-actions` source and have the Business OS route load it alongside the existing queue projection, using a typed mixed inbox that renders operator-action cards with a warning-tinted background and overdue escalation while keeping queue-backed decision semantics untouched.
- **Why this wins:** It fixes the architectural gap without pretending operator actions are queue dispatches. It is immediately buildable, it gives the user-visible integrated inbox now, and it creates the reusable contract the registry can adopt later.
- **What it depends on:** A stable JSON contract for operator-action items, app projection updates for typed mixed items, and UI branching that separates queue action controls from read-only operator-action context.

### Rejected Approaches
- Option B — rejected because runtime markdown parsing would make the app responsible for fragile extraction from heterogeneous source docs that do not reliably carry operator IDs, due dates, or statuses.
- Option C — rejected because queue dispatches and operator-action items have different lifecycle semantics, and forcing them together would risk breaking the existing queue-backed decision surface.
- Option D — rejected because HTML extraction would keep the generated registry too close to being a source of truth and would harden the wrong contract.

### Open Questions (Operator Input Required)
None. The remaining open items are implementation choices that can be resolved from repo evidence and the already-stated direction.

## Planning Handoff
- Planning focus:
  - First build slice should add the canonical `operator-actions` source, app loader, typed projection, and visually distinct cards.
  - Later slices should add operator-action mutation semantics and registry parity against the same source.
- Validation implications:
  - Projection tests need mixed item coverage.
  - Component tests need differentiated card rendering and section counts.
  - Targeted `typecheck` and `lint` for `@apps/business-os` are required; CI remains the test authority.
- Sequencing constraints:
  - Lock the operator-actions contract before modifying the UI.
  - Add typed projection before rewriting the route header or summary cards.
  - Delay any new action API until after the mixed read model is stable.
- Risks to carry into planning:
  - The initial structured source may not yet cover every registry-visible operator block.
  - Existing dirty files in the Business OS inbox area require careful additive edits.

## Risks to Carry Forward
| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| Initial operator-actions source does not yet cover full registry parity | Medium | Medium | The source contract exists only conceptually today | Plan separate parity task after the first integrated surface ships |
| Mixed card rendering confuses section semantics if not clearly separated | Medium | High | Requires implementation and UI proof, not analysis | Plan explicit sectioning and type badges |
| Queue-only tests may break after the projection type expands | Medium | Medium | Needs code changes and updated fixtures | Include controlled test updates in the first build task |
| Existing app files already have unrelated local modifications | Medium | Medium | This is workspace state, not approach quality | Keep scope tight and avoid touching unrelated logic |

## Planning Readiness
- Status: Go
- Rationale: Evidence is sufficient, the option comparison is decisive, the first implementation slice is bounded, and no unresolved operator-only decision remains.
