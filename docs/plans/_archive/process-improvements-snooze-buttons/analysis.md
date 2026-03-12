---
Type: Analysis
Status: Ready-for-planning
Domain: BOS
Workstream: Operations
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: process-improvements-snooze-buttons
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/process-improvements-snooze-buttons/fact-find.md
Related-Plan: docs/plans/process-improvements-snooze-buttons/plan.md
Auto-Plan-Intent: analysis+auto
Dispatch-ID: IDEA-DISPATCH-20260312153000-0001
artifact: analysis
---

# Process Improvements Snooze Buttons Analysis

## Decision Frame

### Summary

The operator needs to temporarily hide lower-priority cards on the `/process-improvements/in-progress` page without making any formal decision. The in-progress inbox currently has no action buttons of any kind — this is the central gap. The new-ideas page already has full snooze/defer infrastructure; the only open question there is cosmetic (Defer button labelling). The analysis decision is: which storage mechanism should back in-progress snooze?

### Goals

- Operator can snooze any card on `/process-improvements/in-progress` for 3 or 7 days.
- The snoozed card hides immediately on click and reappears automatically when the period elapses.
- No new DB migration, no new API routes, no new server-side infrastructure.
- Existing formal Defer/Snooze semantics on new-ideas are not altered.

### Non-goals

- Adding snooze to pages other than `/process-improvements/in-progress` and `/process-improvements/new-ideas`.
- Replacing the formal Defer/Decline/Do queue semantics for new-ideas queue items.
- Multi-device snooze synchronisation.
- Persisting active-plan execution progress or status.
- Adding active plans to the D1 database.

### Constraints & Assumptions

- Constraints:
  - Active plans are filesystem-derived; `active-plans.ts` has no DB dependency and no snooze field. `ActivePlanProgress.slug` is the only stable identifier (plan directory name).
  - The existing operator-action snooze and queue Defer mechanisms on new-ideas must not be broken.
  - BOS is a single-operator tool. Per-device persistence is explicitly acceptable (documented in MEMORY.md).
  - CI is the test authority; no local Jest runs.
- Assumptions:
  - The 30-second auto-refresh on both pages (`/api/process-improvements/items`) means snoozed items reappear on the next refresh cycle after expiry — not exactly at the moment of expiry. Up to 30 seconds of lag after expiry is acceptable for this feature (the operator does not need second-precision reappearance).
  - The operator's stated periods (3 days, 7 days) match two of the five existing `DEFER_PERIOD_OPTIONS` values in `NewIdeasInbox.tsx`.
  - Stale localStorage entries (for plans that have been completed or renamed) should be silently ignored — filtered by checking current plan slugs on read.

---

## Inherited Outcome Contract

- **Why:** The operator has active plans that are lower priority right now but not ignorable. Without a snooze, the in-progress board becomes noisy and the operator must either scroll past irrelevant items or make formal decisions they are not ready to make.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Operator can snooze any card on `/process-improvements/in-progress` for 3 or 7 days. The card hides immediately on click and reappears on the next auto-refresh cycle after the period elapses (up to 30 seconds after expiry), requiring no manual action. The new-ideas page already has equivalent defer/snooze capability for both item types — no new capability is needed there; any new-ideas UI changes are optional and pending operator input on labelling preference. The feature does not alter any existing formal decision semantics.
- **Source:** operator

---

## Fact-Find Reference

- Related brief: `docs/plans/process-improvements-snooze-buttons/fact-find.md`
- Key findings used:
  - `InProgressInbox.tsx` has zero action buttons. The component is a pure read/display component with no mutation path. Evidence: `apps/business-os/src/components/process-improvements/InProgressInbox.tsx` (full read).
  - New-ideas operator action snooze is already fully wired end-to-end: `operator-actions-ledger.ts` → `operator-action-service.ts` → `POST /api/process-improvements/operator-actions/snooze` → projection. No work needed.
  - New-ideas queue Defer already covers 3-day and 7-day periods via `DEFER_PERIOD_OPTIONS` in `NewIdeasInbox.tsx:29-35`. The formal Defer is functionally equivalent to "remind me later" — the gap is UI prominence, not capability.
  - Active plans are identified by `plan.slug` (directory name). This is the React key in `InProgressSection` and is stable within a plan's lifetime (`InProgressInbox.tsx:353-354`).
  - D1 schema (`0001_init.sql`, `0002_add_idea_priority.sql`) covers cards, ideas, stage_docs, comments, audit_log, metadata — not active plans. No D1 migration is relevant.
  - `InProgressInbox.test.tsx` exists with component-level render tests (`apps/business-os/src/components/process-improvements/InProgressInbox.test.tsx`). The existing test infrastructure is usable; snooze-specific tests extend it rather than starting from zero. The gap is that the existing tests do not cover action buttons or localStorage interaction — those test paths must be added.

---

## Evaluation Criteria

| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Implementation simplicity | In-progress plans are filesystem-derived and have no DB backing; a server-side storage path requires new infrastructure disproportionate to the feature | High |
| Semantic fit | "Temporary organisation" snooze should not be conflated with durable formal decisions (Defer/Do/Decline) | High |
| Storage survival requirements | Single-operator, single-device is documented BOS assumption; cross-device persistence is a non-goal | Medium |
| Blast radius | Changes should be isolated to `InProgressInbox.tsx`; no changes to projection, ledger, or API routes for the minimal path | High |
| Testability | The chosen approach should have a clear test seam for CI enforcement | Medium |
| Rollback safety | Rollback should be a single revert commit with no persistent side effects | Medium |

---

## Options Considered

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A — localStorage snooze | Store `{ [slug]: isoTimestamp }` in `localStorage` under key `bos:plan-snooze:v1`. Filter active plans client-side in `InProgressInbox` before rendering. Re-check on each 30s auto-refresh poll. No API, no DB, no new file. | Zero server changes. Zero migration surface. Instant rollback (revert commit). Clean test seam (mock localStorage). Matches single-operator, single-device assumption exactly. | (1) SSR page header count will include snoozed plans (cosmetic gap). (2) Because `in-progress/page.tsx` server-renders `activePlans` into the client component as `initialActivePlans`, snoozed cards will flash briefly on initial page load before the client-side filter runs (hydration seam). This is a UX cost that must be mitigated in planning — typically via an `isClient` guard that delays rendering the plan list until after hydration. Does not survive browser storage clear. | Plan slug change (rename/archive) orphans a localStorage entry — mitigated by filtering for slugs present in the current plan list. Hydration flash requires explicit suppression logic (render null or loading state until mounted). | **Yes — Chosen** |
| B — File-based JSONL ledger | New JSONL ledger at `docs/business-os/process-improvements/active-plan-snooze-decisions.jsonl`. New API route `POST /api/process-improvements/active-plans/snooze`. Modify `loadActivePlans()` or add a projection wrapper. | Durable across sessions. Consistent with operator-actions-ledger pattern. Visible in SSR count. | New ledger file, new API route, new reducer, modifications to `loadActivePlans()`. Significant overhead for a "lightweight temporary organisation" feature. Must handle plan lifecycle transitions (completion, rename, archive). | Plan lifecycle events (archive/rename) create orphaned ledger entries unless handled — adds complexity. | No |
| C — Extend existing operator-actions ledger | Add active-plan snooze events to `operator-action-decisions.jsonl`. Reuse `operator-action-service.ts`. | No new file. | Active plans are not operator actions. Conflating them breaks `operator_action` itemType semantics used throughout `projection.ts`. Would require a new `itemType` branch or branching `actionId` namespace. | Type confusion; projection reads `itemType: operator_action` which is meaningless for active plans. | No |

---

## Engineering Coverage Comparison

| Coverage Area | Option A (localStorage) | Option B (JSONL ledger) | Chosen implication |
|---|---|---|---|
| UI / visual | Snooze buttons (3-day, 7-day) added to each `ActivePlanCard`. No snoozed indicator — snoozed cards are entirely hidden. Identical button shape in all options. | Same UI surface. | Add snooze buttons to `ActivePlanCard` in `InProgressInbox.tsx`. No snoozed-indicator state — snoozed cards are absent from the list. |
| UX / states | Three visible states per card: default (shown with snooze buttons), snoozed (filtered out — not rendered), reappeared (after expiry, on next refresh cycle up to 30s after). Snoozed cards do not have a visible indicator; they are absent. Empty-list state handled by existing `InProgressInbox` empty path. **Hydration flash**: because `activePlans` is server-rendered into `initialActivePlans` prop, snoozed cards momentarily appear before client-side filtering runs. Two mitigation options: (a) `isMounted` guard delays the plan list render until hydration — eliminates flash but briefly hides all cards including unsnoozed ones; (b) accept the brief flash as cosmetic. Choice to be made in planning. | Same visible states. Hydration flash also present; server-side ledger filtering could eliminate it. | Three states: shown / snoozed (hidden) / reappeared. No snoozed indicator. Hydration flash mitigation approach to be finalised in planning — both options (mount guard or accept flash) are workable. Empty-state after snoozing all plans must render correctly. |
| Security / privacy | BOS is admin-only (`getCurrentUserServer` auth). localStorage is client-only and not authoritative — no security surface. | Adds a new unauthenticated write endpoint risk if route auth is misconfigured. | Option A: no security surface added. |
| Logging / observability / audit | No server-side audit trail by design — lightweight temp org. Acceptable. | Durable server-side ledger; audit trail created per event. | Option A: audit trail explicitly omitted. This is correct for "remind me later" semantics (not a formal decision). |
| Testing / validation | Clear test seam: mock `localStorage` in Jest. Test snooze filter logic, button rendering, expiry re-check on refresh, stale entry cleanup. `InProgressInbox.test.tsx` exists with component-level render tests — snooze tests extend existing setup rather than starting from zero. The existing tests do not cover action buttons or localStorage interaction — those paths must be added. | Route test + ledger unit test + `loadActivePlans()` integration test needed additionally. | Option A: snooze-specific tests extend `InProgressInbox.test.tsx`. localStorage mock and mount-guard tests are the new additions. |
| Data / contracts | No type changes. `ActivePlanProgress` type unchanged. localStorage key `bos:plan-snooze:v1` is new but isolated. No downstream consumers affected. | Requires new event type in ledger contract. Requires modification of `loadActivePlans()` or a new projection wrapper. | Option A: zero contract changes. Lowest migration surface. |
| Performance / reliability | localStorage reads are synchronous and sub-millisecond. Filtering is O(n) on active plans (typically <20 items). 30s auto-refresh already in place — no new polling needed. | Adds a server round-trip per snooze action and a ledger read on every `loadActivePlans()` call. | Option A: negligible performance impact. |
| Rollout / rollback | Rollback is a revert commit. No DB migration to reverse. Stale localStorage entries after rollback are harmless (ignored by the code). | Rollback requires reverting the new API route, the ledger reducer, and `loadActivePlans()` changes. Ledger file on disk persists after rollback. | Option A: cleanest rollback path. Single revert commit. No residual server-side state. |

---

## Chosen Approach

- **Recommendation:** Option A — localStorage-backed snooze in `InProgressInbox.tsx`. No new API routes, no new ledger, no DB changes.
- **Why this wins:**
  1. Active plans are filesystem-derived and have no database backing. A server-side ledger would need to handle plan lifecycle transitions (completion, rename, archive) that add disproportionate complexity for a "remind me later" feature.
  2. BOS is explicitly single-operator, single-device. The storage choice maps precisely to the documented assumption.
  3. The known costs — (a) SSR page header count includes snoozed plans (cosmetic), (b) reappearance is on the next 30s refresh cycle not at exact expiry (acceptable for "remind me later" semantics), (c) brief hydration flash on page load (mitigable) — are all low-impact for a single-operator internal tool.
  4. The existing operator-action snooze (durable JSONL) exists because those actions need replay and audit across sessions. Active plan snooze is different in intent: "I want to see this less right now" rather than "I am recording a formal decision about this item."
  5. Rollback is a single revert commit with no residual server state.
- **What it depends on:**
  - The 30s auto-refresh in `InProgressInbox` must return the full current `activePlans[]` list on each poll so the client-side snooze filter can re-evaluate expiry without extra API changes. Evidence confirms this: `/api/process-improvements/items` already returns `activePlans` in its response (`fact-find.md`, API / contracts section).

### Rejected Approaches

- **Option B (JSONL ledger)** — Disproportionate infrastructure overhead for a lightweight "remind me later" feature. Plan lifecycle events (rename, archive, completion) create orphaned ledger entries without explicit handling. The formal operator-action ledger exists for a different reason: durable audit of decision events. Snooze is not a decision event.
- **Option C (extend operator-actions ledger)** — Active plans are not operator actions. Conflating them breaks the `operator_action` itemType semantics throughout `projection.ts`. The existing ledger has a defined contract (`ProcessImprovementsOperatorActionDecisionType = "done" | "snooze"`) tied to action items, not plan cards. This path requires branching the entire projection path for a concept that does not belong there.

### Open Questions (Operator Input Required)

- Q: Should the new-ideas `Defer` button be relabelled as "Remind me later" or should 3-day / 7-day quick-pick buttons be added alongside the existing multi-period picker?
  - Why operator input is required: This is a UI labelling preference. The underlying capability (3-day and 7-day Defer) already exists. The choice affects whether the Defer button remains a formal-sounding queue action or becomes a lightweight "remind me" affordance. Either direction is implementable.
  - Planning impact: If the operator wants quick-picks, TASK-01 expands to include `NewIdeasInbox.tsx` changes. If no change is wanted, the new-ideas page is out of scope entirely. Default assumption: leave new-ideas Defer unchanged; add snooze buttons on in-progress only.

---

## End-State Operating Model

| Area | Current state | Trigger | Delivered step-by-step end state | What remains unchanged | Risks / seams to carry into planning |
|---|---|---|---|---|---|
| In-progress snooze | `InProgressInbox.tsx` has no action buttons. Operator must scroll past all active plan cards regardless of priority. | Operator clicks "Snooze for 3 days" or "Snooze for 7 days" on an `ActivePlanCard` | (1) Click handler writes `{ [slug]: expiryIsoTimestamp }` to localStorage under `bos:plan-snooze:v1`. (2) Component re-renders; that plan card is filtered from the active list immediately (snoozed cards are absent — no visible indicator). (3) On each subsequent 30s auto-refresh, `activePlans[]` is received; snooze filter re-evaluates — cards past expiry reappear on the next refresh cycle (up to 30s after expiry). (4) Stale localStorage entries (for completed/renamed plans) are silently pruned on read by checking against current plan slugs. **Hydration flash**: because `activePlans` is SSR-rendered into the client component as `initialActivePlans`, snoozed cards briefly appear before the client filter runs. Mitigation choice for planning: (a) `isMounted` guard — eliminates flash but briefly hides all cards on every page visit until hydration completes; (b) accept flash as cosmetic for single-operator tool. | 30s auto-refresh from `/api/process-improvements/items`. `ActivePlanProgress` type contract. All projection, ledger, and API route behaviour. New-ideas Defer and Snooze mechanisms. | (a) SSR page header count (`loadActivePlans()`) includes snoozed plans — cosmetic gap, accepted. (b) Reappearance is on next refresh cycle, not at exact expiry moment — up to 30s lag. (c) Hydration mitigation approach to be finalised in planning. (d) Stale-entry cleanup logic must be tested to avoid false positives on rename. |
| New-ideas operator action snooze | Already fully implemented: `operator-actions-ledger.ts` → `operator-action-service.ts` → `POST /api/process-improvements/operator-actions/snooze` → projection | No change | No change | All existing behaviour preserved | None |
| New-ideas queue Defer | Already functionally supports 3-day and 7-day periods via `DEFER_PERIOD_OPTIONS`. UI may not surface these prominently. | No change (pending operator input on labelling) | No change unless operator requests quick-pick UI | All existing Defer/Decline/Do semantics preserved | Operator input question on labelling is open; default is no change |

---

## Planning Handoff

- Planning focus:
  - TASK-01: Add localStorage-backed snooze state to `InProgressInbox.tsx`. Includes: snooze hook or inline state, `bos:plan-snooze:v1` read/write/prune, filter applied before rendering `ActivePlanCard` list (snoozed cards are entirely absent — no visible indicator), snooze buttons with 3-day / 7-day options on each card, expiry re-check on each 30s auto-refresh (cards reappear on the refresh cycle after expiry, up to 30s lag), hydration flash mitigation (choice between isMounted guard or accepting the flash — to be decided in planning).
  - TASK-02: Jest unit tests for the snooze filter logic and `ActivePlanCard` snooze button rendering, extending the existing `InProgressInbox.test.tsx`. Must cover: button click writes correct expiry, snoozed cards filtered from list, expired snooze causes card to reappear on the next render cycle, stale entries (slug not in current plan list) are pruned. Tests to follow `docs/testing-policy.md`; CI is the authority. Tests should be written alongside TASK-01.
  - TASK-03 (optional, operator input required): Surface 3-day / 7-day snooze quick-picks on new-ideas queue items if operator wants to change the Defer labelling. Default assumption is no change.
- Validation implications:
  - TypeScript types: no changes to `ActivePlanProgress` or any shared type. The localStorage payload shape is internal to `InProgressInbox.tsx`.
  - Hydration flash: snoozed cards appear briefly on page load before client-side filtering runs. For a single-operator internal tool this is cosmetic and accepted. Planning may add an `isMounted` guard to eliminate the flash — that guard would briefly hide all cards on every page visit until hydration completes. Both approaches are acceptable; the analysis does not mandate either. Chosen approach must be noted in TASK-01 acceptance criteria.
  - Lint and typecheck must pass on `apps/business-os` before CI push.
  - Jest tests for snooze logic must be co-developed with the implementation in TASK-01.
- Sequencing constraints:
  - Tests for snooze filter logic should be developed alongside TASK-01 implementation, not as a follow-on phase. The existing `InProgressInbox.test.tsx` infrastructure is the starting point.
  - TASK-03 is independent and can be skipped pending operator input.
- Risks to carry into planning:
  - `InProgressInbox.test.tsx` exists with component-level render tests. TASK-02 extends this file — the test infrastructure is in place. The gap is action button and localStorage interaction coverage.
  - Hydration flash is a cosmetic known limitation for this localStorage approach. Whether to suppress it with a mount guard is a planning-level UX decision, not a blocking requirement.
  - The SSR page header count gap (snoozed plans still counted) is accepted as a known limitation. Plan docs should note this to avoid it being raised as a bug.
  - Stale localStorage entry cleanup logic (filtering for slugs not in current plan list) is a small correctness seam — must be explicit in TASK-01 acceptance criteria.

---

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| SSR page header count includes snoozed plans | Certain | Low — cosmetic only | Accepted limitation of localStorage approach; would require SSR-aware storage to fix | Document as known limitation in plan; do not present as a bug |
| Hydration flash — snoozed cards appear momentarily on page load before client filter runs | Certain | Low — cosmetic for single-operator tool | Inherent to localStorage + SSR prop pattern; accepted as cosmetic. An `isMounted` guard can eliminate the flash but introduces a brief hide of all cards on every page visit. Neither option has a material impact for this tool. | Document accepted limitation. Planning may opt in to the `isMounted` guard for cleaner UX — not required. Chosen approach noted in TASK-01 acceptance criteria. |
| Stale localStorage entry after plan rename/archive | Low | Low — entry is silently ignored on read | Mitigated by filtering current slugs on read; no residual effect | TASK-01 acceptance criteria must include stale-entry pruning |
| `InProgressInbox.tsx` action button / localStorage tests do not yet exist | Certain | Medium — CI will catch regressions only if tests are written | Analysis does not write code | TASK-02 extends existing `InProgressInbox.test.tsx`; test infrastructure already present but action button and localStorage paths must be added |
| localStorage cleared by operator (browser data clear) | Low | Low — operator can re-snooze | Single-operator, single-device; deliberate action required | Document as acceptable limitation |
| Confusion between in-progress "Snooze" and new-ideas "Defer" labels | Medium | Low | UX labelling choice; default assumption is leave new-ideas unchanged | If operator later requests alignment, TASK-03 covers it |

---

## Planning Readiness

- Status: Go
- Rationale: All key questions are answered by code evidence. Storage choice is decisive (localStorage). Blast radius is minimal (one client component). No new API routes, no schema migration, no new packages. One open operator input question (new-ideas Defer labelling) has a clear default assumption that does not block planning or implementation.
