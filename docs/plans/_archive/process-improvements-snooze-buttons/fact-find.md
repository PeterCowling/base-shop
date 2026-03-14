---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: BOS
Workstream: Operations
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: process-improvements-snooze-buttons
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Dispatch-ID: IDEA-DISPATCH-20260312153000-0001
---

# Process Improvements Snooze Buttons Fact-Find Brief

## Scope
### Summary
Add "Remind me in 3 days" and "Remind me in 7 days" snooze buttons to cards on both `/process-improvements/in-progress` (active plans) and `/process-improvements/new-ideas` (queue items and operator actions). When clicked, the card disappears from the active view until the period elapses, then reappears automatically. This gives the operator a lightweight way to temporarily park lower-priority items without making a formal decision.

The key design question is whether this new snooze capability for in-progress plans should reuse the existing snooze mechanism (already live on operator action items in `new-ideas`) or introduce a separate storage path (e.g. localStorage or a new ledger). A secondary question is whether the new `in-progress` snooze is semantically the same as the `new-ideas` queue `Defer` — it is not, as explored below.

### Goals
- Operator can snooze a card on `/process-improvements/in-progress` for 3 or 7 days.
- Operator can snooze a queue dispatch card on `/process-improvements/new-ideas` for 3 or 7 days (extending or replacing the current multi-period Defer).
- Operator can snooze an operator action card on `/process-improvements/new-ideas` for 3 or 7 days (this already works; assess whether the UI needs to change).
- Snoozed cards disappear from the active list and reappear when the period elapses.
- The implementation is lightweight and does not require a new DB migration.

### Non-goals
- Adding snooze to any page other than `/process-improvements/in-progress` and `/process-improvements/new-ideas`.
- Replacing the formal `Defer` / `Decline` / `Do` queue semantics for new-ideas queue items.
- Persisting active-plan progress state or execution results.
- Multi-device snooze synchronisation (single-operator, single-device is sufficient).
- Adding snooze to the BOS cards D1 database.

### Constraints & Assumptions
- Constraints:
  - The existing `operator-action snooze` mechanism on `new-ideas` is already fully wired (ledger, API, UI). Any new snooze must be consistent with it or clearly differentiated.
  - The formal `Defer` mechanism for new-ideas queue items uses `decision-ledger.ts` / `/api/process-improvements/decision/[decision]/route.ts` — this must not be broken.
  - BOS is a single-operator tool. Per-device persistence is acceptable.
  - `active-plans` are identified by their `slug` (plan directory name), not by a queue dispatch ID.
  - There is no D1 table for active plans — they are file-system derived.
  - CI is the test authority; no local Jest runs.
- Assumptions:
  - The operator is the only user of BOS, so localStorage is a valid snooze store for the in-progress page.
  - The 30-second auto-refresh on both pages means a re-expanded snooze will reappear naturally.
  - The operator's stated periods are 3 days and 7 days. These match two of the five options already present in `DEFER_PERIOD_OPTIONS` in `NewIdeasInbox.tsx`.

---

## Outcome Contract

- **Why:** The operator has active plans and ideas that are lower priority right now but not ignorable. Without a snooze, the board becomes visually noisy and the operator either has to scroll past irrelevant items or make formal decisions they are not ready to make.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Operator can snooze any card on `/process-improvements/in-progress` or `/process-improvements/new-ideas` for 3 or 7 days. The card hides immediately on click and reappears automatically when the period elapses, requiring no page reload or manual action. The feature does not alter any existing formal decision semantics.
- **Source:** operator

---

## Current Process Map

- Trigger: Operator views `/process-improvements/in-progress` or `/process-improvements/new-ideas` and decides a card is low priority right now.
- End condition: Card is hidden for the chosen period, then reappears in the active list.

### Process Areas
| Area | Current step-by-step flow | Owners / systems / handoffs | Evidence refs | Known issues |
|---|---|---|---|---|
| in-progress snooze | No mechanism exists. Operator must scroll past all active plans or make a formal decision (not applicable to plans). | `InProgressInbox.tsx`, `active-plans.ts` | `apps/business-os/src/components/process-improvements/InProgressInbox.tsx` | No snooze path at all |
| new-ideas queue defer | Operator clicks Defer → multi-period picker → `POST /api/process-improvements/decision/defer` → `decision-ledger.ts` writes event → projection re-reads state | `NewIdeasInbox.tsx`, `decision-ledger.ts`, `decision-service.ts`, `projection.ts` | `apps/business-os/src/components/process-improvements/NewIdeasInbox.tsx:408-441` | Defer is a formal ledger decision; conflated with lightweight snooze |
| new-ideas operator action snooze | Operator clicks Snooze → period picker → `POST /api/process-improvements/operator-actions/snooze` → `operator-actions-ledger.ts` writes event → projection re-reads state | `NewIdeasInbox.tsx`, `operator-actions-ledger.ts`, `operator-action-service.ts`, `projection.ts` | `apps/business-os/src/components/process-improvements/NewIdeasInbox.tsx:457-518` | Already fully functional; 1/7/14/30-day options available |

---

## Discovery Contract Output

- **Gap Case ID:** n/a
- **Recommended First Prescription:** n/a

---

## Evidence Audit (Current State)

### Entry Points
- `apps/business-os/src/app/process-improvements/in-progress/page.tsx` — server component, loads `activePlans` via `loadActivePlans()`, mounts `<InProgressInbox initialActivePlans={activePlans} />`
- `apps/business-os/src/app/process-improvements/new-ideas/page.tsx` — server component, loads `projection.items` + `recentActions` + `inProgressDispatchIds`, mounts `<NewIdeasInbox>`

### Key Modules / Files
- `apps/business-os/src/components/process-improvements/InProgressInbox.tsx` — renders active plans as `<ActivePlanCard>` cards. Card key is `plan.slug`. No action buttons. Auto-refresh polls `/api/process-improvements/items` every 30s.
- `apps/business-os/src/components/process-improvements/NewIdeasInbox.tsx` — renders two item types: `process_improvement` (queue dispatches) and `operator_action`. Both have action buttons. Snooze is already implemented for `operator_action` items. Defer (multi-period) is implemented for `process_improvement` items.
- `apps/business-os/src/lib/process-improvements/active-plans.ts` — `loadActivePlans()` reads `docs/plans/*/plan.md`, parses frontmatter/tasks/activity. `ActivePlanProgress.slug` is the plan directory name (e.g. `process-improvements-snooze-buttons`). No snooze field.
- `apps/business-os/src/lib/process-improvements/operator-actions-ledger.ts` — append-only JSONL ledger at `docs/business-os/process-improvements/operator-action-decisions.jsonl`. Supports `snooze` decisions with `snooze_until` timestamp. Full write/read/reduce cycle implemented.
- `apps/business-os/src/lib/process-improvements/decision-ledger.ts` — append-only JSONL ledger at `docs/business-os/process-improvements/operator-decisions.jsonl`. Supports `defer` decisions with `defer_until` timestamp. Ledger path constant: `PROCESS_IMPROVEMENTS_DECISION_LEDGER_PATH`.
- `apps/business-os/src/lib/process-improvements/operator-action-service.ts` — `performProcessImprovementsOperatorActionDecision()` handles `done` and `snooze` decisions; computes `snoozeUntil` from `snoozeDays`.
- `apps/business-os/src/lib/process-improvements/projection.ts` — `loadProcessImprovementsProjection()` merges queue items and operator action items with their ledger states. `isOperatorSnoozed()` checks whether an operator action is currently snoozed by reading `snoozeUntil`. `isDeferredDecisionActive()` does the same for queue defers. Both push snoozed/deferred items into `statusGroup: "deferred"` with `priorityBand: 80`.
- `apps/business-os/src/app/api/process-improvements/items/route.ts` — GET endpoint used by both pages' auto-refresh. Returns `{ items, recentActions, activePlans, inProgressDispatchIds }`. Used by `InProgressInbox` to refresh active plans and by `NewIdeasInbox` to refresh queue items.
- `apps/business-os/src/app/api/process-improvements/operator-actions/[decision]/route.ts` — POST endpoint for `done` and `snooze` decisions on operator action items. Accepts `{ actionId, snoozeDays }`.
- `apps/business-os/src/app/api/process-improvements/decision/[decision]/route.ts` — POST endpoint for `do`, `defer`, `decline` decisions on queue items. Accepts `{ ideaKey, dispatchId, deferDays, rationale }`.
- `scripts/src/startup-loop/operator-action-decisions-contract.ts` — contract types and reducer for operator action decision events. `ProcessImprovementsOperatorActionDecisionType = "done" | "snooze"`. Ledger path: `docs/business-os/process-improvements/operator-action-decisions.jsonl`.

### Patterns & Conventions Observed
- **Snooze on operator actions is already fully implemented** end-to-end: ledger append → projection re-read → UI update in `NewIdeasInbox.tsx`. The UI currently shows a "Snooze" button with a period picker for operator action items. Evidence: `projection.ts:184-187` (`OPERATOR_ACTIONS_ACTIVE` has `{ decision: "snooze", label: "Snooze", variant: "secondary" }`).
- **Defer on queue items already has multi-period options** (1, 3, 7, 14, 30 days) defined in `NewIdeasInbox.tsx:29-35`. The 3-day and 7-day options are already available. The operator's stated request for "Remind me in 3 days / 7 days" is a UI labelling question for queue items, not a new capability.
- **ActivePlanProgress has no snooze field** and no snooze mechanism. Active plans are pure filesystem-derived data. `active-plans.ts` does not touch any ledger or decision store.
- **Active plans are identified by `slug`** (string, directory name). This is stable and unique. Example: `process-improvements-snooze-buttons`.
- **InProgressInbox has no action buttons at all** — it is a pure read/display component. The only mutation path is the 30s auto-refresh from `/api/process-improvements/items`.
- **There is no D1 schema for active plans**. The D1 schema (`0001_init.sql`) covers cards, ideas, stage_docs, comments, audit_log, and metadata — not active plans. The `0002_add_idea_priority.sql` migration adds a priority column to ideas. Neither migration is relevant to active plan snooze.
- **Both pages auto-refresh every 30 seconds** from the same `/api/process-improvements/items` endpoint. On in-progress, the endpoint returns `activePlans`; on new-ideas, it returns `items` and `recentActions`.

### Data & Contracts

#### Types / schemas / events
- `ActivePlanProgress` (in `active-plans.ts`): `slug: string` is the stable identifier. No `snoozedUntil` field exists.
- `ProcessImprovementsOperatorActionDecisionType = "done" | "snooze"` (in `operator-action-decisions-contract.ts`). The `snooze` type already carries `snooze_until?: string`.
- `ProcessImprovementsDecisionType = "do" | "defer" | "decline"` (in `decision-ledger.ts`). The `defer` type already carries `defer_until?: string`.
- `ProcessImprovementsWorkItemDecisionState` (in `projection.ts`): unified decision state used by `NewIdeasInbox` for both item types. Carries `snoozeUntil?: string` and `deferUntil?: string`.

#### Persistence options for in-progress snooze
Two viable options exist:

**Option A — localStorage (client-only)**
- Store: `{ [slug: string]: isoTimestamp }` keyed by plan slug.
- Filter active plans client-side in `InProgressInbox` before rendering.
- Re-check on each 30s refresh; items reappear automatically when `now > snoozeUntil`.
- No server round-trip, no new file, no new API route.
- Consistent with "single-operator, single-device" BOS assumption.
- Limitations: does not survive clearing browser storage; not visible in server-side count on the page header (the page header stat is SSR from `loadActivePlans()` at route render time).

**Option B — new file-based ledger (mirrors operator-actions-ledger pattern)**
- New JSONL file at e.g. `docs/business-os/process-improvements/active-plan-snooze-decisions.jsonl`.
- New API route `POST /api/process-improvements/active-plans/snooze`.
- `loadActivePlans()` or a projection wrapper reads the ledger and filters snoozed slugs.
- Survives page reload, works across devices.
- Requires new ledger file, new API route, new reducer, modifications to `loadActivePlans` or a new wrapper.

**Option C — extend existing operator-actions ledger**
- Active plans are not operator actions; conflating them would break the `operator_action` itemType semantics used throughout the projection.
- Ruled out.

**Recommended: Option A (localStorage) for in-progress snooze.** Rationale:
1. Active plans are filesystem-derived and change on every git commit. A ledger would need to handle plan renames, completions, and archival — adding complexity for a "temporary organisation" feature.
2. Single-operator, single-device is the documented BOS assumption.
3. The only cost is that the SSR page header count does not reflect client-side snooze. This is acceptable — the count is a rough signal, not an authoritative metric.
4. The existing operator-action snooze (Option B equivalent) exists because those actions need durability across sessions for replay and audit. Active plan snooze is explicitly described as "lightweight temporary organisation" — a different intent.

#### Persistence for new-ideas queue defer (existing)
- Already persisted via `decision-ledger.ts` at `docs/business-os/process-improvements/operator-decisions.jsonl`.
- The existing `Defer` button on queue items already supports 1/3/7/14/30-day periods.
- No new persistence needed. The UI label change ("Remind me in 3 days / 7 days") is cosmetic.

#### Persistence for new-ideas operator action snooze (existing)
- Already persisted via `operator-actions-ledger.ts` at `docs/business-os/process-improvements/operator-action-decisions.jsonl`.
- The existing `Snooze` button on operator action items already supports multi-period options.
- No change needed unless the operator wants to rename buttons or restrict to 3/7 only.

### API / contracts
- Existing routes are sufficient for new-ideas. No new routes needed.
- For in-progress snooze (localStorage path): no API route needed. Client reads/writes localStorage directly.
- If Option B were chosen for in-progress, a new route `POST /api/process-improvements/active-plans/snooze` would be needed. Not recommended.

### Dependency & Impact Map
- Upstream dependencies:
  - `active-plans.ts` → filesystem reads of `docs/plans/*/plan.md`. No database dependency.
  - `projection.ts` → reads queue state JSON + operator-actions JSONL + decision JSONL.
  - Both inboxes → `/api/process-improvements/items` for auto-refresh.
- Downstream dependents:
  - `InProgressInbox.tsx` uses `ActivePlanProgress[]`; adding client-side snooze filter does not change the type contract.
  - `NewIdeasInbox.tsx` uses `ProcessImprovementsInboxItem[]`; existing defer/snooze mechanisms are unchanged.
  - The `/process-improvements/in-progress/page.tsx` header count is SSR; it will not reflect client-side snooze. Minor cosmetic gap, acceptable.
- Likely blast radius:
  - Small. Changes are isolated to `InProgressInbox.tsx` (add snooze state + filter + buttons).
  - The new-ideas changes are entirely cosmetic (if the only goal is to surface 3/7 day shortcuts more prominently).
  - No changes to projection, ledger, or API routes for the minimal path.

---

## Overlap Analysis: Existing Defer vs. Requested Snooze

| Dimension | New-ideas queue `Defer` | New-ideas operator action `Snooze` | New in-progress `Snooze` |
|---|---|---|---|
| Semantics | Formal queue decision: delays re-evaluation | Temporary hide: no formal queue state change | Temporary client-side hide: no state change |
| Storage | `decision-ledger.ts` JSONL, server-side | `operator-actions-ledger.ts` JSONL, server-side | localStorage (recommended) |
| Replay | Durable; survives reload; visible in projection | Durable; survives reload; visible in projection | Client-only; clears with browser storage |
| Existing UI | "Defer" with multi-period picker (1/3/7/14/30 days) | "Snooze" with multi-period picker | Not yet implemented |
| Identifier | `ideaKey` (SHA-1 of sourcePath + dispatchId) | `actionId` | `slug` (plan directory name) |
| Reappearance | At defer expiry; checked by projection on each request | At snooze expiry; checked by projection on each request | At snooze expiry; checked client-side on each render/refresh |

**Key finding:** The new-ideas `Defer` is already functionally equivalent to "Remind me in N days" for queue items. The 3-day and 7-day options are already in `DEFER_PERIOD_OPTIONS`. The operator's stated need for `/new-ideas` may be satisfied by improving the existing Defer UI to surface 3 and 7 day options more prominently (e.g. as quick-pick buttons) rather than building new infrastructure.

The new-ideas operator action `Snooze` is already fully implemented. No work needed there unless the operator wants to rename or restrict the period options.

The only missing piece is in-progress snooze — `InProgressInbox.tsx` has no action buttons and no snooze mechanism at all.

---

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | `InProgressInbox.tsx` renders cards with no action buttons. `NewIdeasInbox.tsx` has Defer/Snooze UI already. | In-progress cards need snooze button + period picker + snoozed state indicator | Yes |
| UX / states | Required | Snoozed operator actions move to `statusGroup: "deferred"` band in new-ideas. In-progress has no state changes. | In-progress: need to filter snoozed slugs from active list, show "Snoozed" indicator when visible, reappear on expiry | Yes |
| Security / privacy | N/A | BOS is authenticated (admin-only via `getCurrentUserServer`). localStorage snooze has no auth requirement as it is client-only, not authoritative. | None | No |
| Logging / observability / audit | Required | Operator action snooze logs to JSONL. Queue defer logs to JSONL. In-progress snooze (localStorage) has no server-side audit trail. | localStorage path: no audit trail by design (lightweight). Acceptable for temporary org. | No |
| Testing / validation | Required | CI is the test authority. Existing pattern: Jest unit tests for service/ledger, route tests for API. In-progress currently has no action-button tests. | New: unit test for snooze filter logic in InProgressInbox (localStorage read/write); UI state tests for button + dismiss. New-ideas: if UI changes, update snapshot/integration tests. | Yes |
| Data / contracts | Required | `ActivePlanProgress` has no snooze field. `ProcessImprovementsWorkItemDecisionState` has `snoozeUntil` for operator actions. `decision-ledger.ts` has `defer_until` for queue items. | For localStorage: no type change needed. For ledger: new type field required. localStorage approach avoids contract change. | No (localStorage) |
| Performance / reliability | N/A | Both inboxes auto-refresh every 30s. localStorage reads are synchronous and sub-millisecond. | No risk | No |
| Rollout / rollback | Required | No feature flags in BOS. Rollback is a revert commit. | Straightforward revert. localStorage state cleared on rollback. | No |

---

## Questions

### Resolved
- Q: Does the in-progress page already have a snooze/defer mechanism?
  - A: No. `InProgressInbox.tsx` has no action buttons at all. `ActivePlanProgress` has no snooze field. The page is pure read/display.
  - Evidence: `apps/business-os/src/components/process-improvements/InProgressInbox.tsx` (full read — no buttons, no action handlers)

- Q: Is the existing `Defer` on new-ideas queue items the same as the requested "Remind me in 3/7 days" snooze?
  - A: Yes, functionally. `DEFER_PERIOD_OPTIONS` already includes `{ label: "3 days", days: 3 }` and `{ label: "7 days", days: 7 }`. The mechanism is wired end-to-end. The gap is UI labelling — the current picker may not be prominent enough as a "remind me later" affordance.
  - Evidence: `apps/business-os/src/components/process-improvements/NewIdeasInbox.tsx:29-35`

- Q: Is the existing `Snooze` on new-ideas operator action items already fully implemented?
  - A: Yes. The full stack is implemented: `operator-actions-ledger.ts` → `operator-action-service.ts` → `POST /api/process-improvements/operator-actions/snooze` → `applySnoozedOperatorActionDecision()` in the UI → `DEFER_PERIOD_OPTIONS` picker.
  - Evidence: `apps/business-os/src/components/process-improvements/NewIdeasInbox.tsx:457-518`, `apps/business-os/src/lib/process-improvements/operator-action-service.ts`

- Q: What is the stable identifier for in-progress plan cards?
  - A: `plan.slug` — the plan directory name (e.g. `process-improvements-snooze-buttons`). This is used as the React key in `InProgressSection` and is stable within a plan's lifetime.
  - Evidence: `apps/business-os/src/components/process-improvements/InProgressInbox.tsx:353-354`

- Q: Should in-progress snooze use localStorage or a new server-side ledger?
  - A: localStorage. BOS is single-operator, single-device. Active plans are filesystem-derived and ephemeral in the sense that they complete, get renamed, or get archived — a ledger would require handling these lifecycle transitions. "Lightweight temporary organisation" maps precisely to localStorage.
  - Evidence: `apps/business-os/src/lib/process-improvements/active-plans.ts` (no DB dependency, no snooze field), operator intent in dispatch

- Q: Does in-progress snooze risk conflating with the new-ideas Defer/Snooze mechanisms?
  - A: No. They are on different pages, different item types, different storage paths. The in-progress page shows `ActivePlanProgress` items (plans already in execution); the new-ideas page shows `ProcessImprovementsInboxItem` items (queue candidates and operator actions). The concepts do not overlap.
  - Evidence: `apps/business-os/src/app/process-improvements/in-progress/page.tsx`, `apps/business-os/src/app/process-improvements/new-ideas/page.tsx`

- Q: Is there a risk that a new in-progress snooze overlaps confusingly with the existing Defer button on new-ideas cards?
  - A: No. In-progress cards are active plans; new-ideas cards are idea candidates. Users visiting each page are in different decision contexts. The button label "Snooze" on in-progress is clearly about plan visibility, not about queue decision semantics.

### Open (Operator Input Required)
- Q: Should the new-ideas `Defer` button label be changed to "Remind me later" or similar, or should the 3/7-day options be surfaced as quick-pick buttons alongside the existing multi-period picker?
  - Why operator input is required: this is a labelling / UX preference that depends on how the operator thinks about the action semantics. The agent can implement either approach, but the choice affects whether Defer remains a formal-sounding action or becomes a lightweight "remind me" affordance.
  - Decision impacted: whether `NewIdeasInbox.tsx` gets new quick-pick buttons vs. relabelled existing Defer.
  - Decision owner: operator
  - Default assumption: add 3-day and 7-day quick-pick snooze buttons to in-progress only (the explicit new feature), leave new-ideas Defer unchanged. Risk: operator sees inconsistency between in-progress "Snooze" and new-ideas "Defer".

---

## Confidence Inputs
- Implementation: 88% — the in-progress localStorage snooze is a self-contained client-side change with no server dependencies; the pattern is clear from the existing operator action snooze. Would reach 90% with a confirmed decision on new-ideas UI changes.
- Approach: 87% — localStorage for in-progress is the right tradeoff given single-operator BOS. The risk of a separate ledger outweighs the benefit of cross-device persistence. Would reach 90% with operator confirmation on new-ideas labelling.
- Impact: 85% — the feature directly addresses the operator need stated in the dispatch. Snoozed plan cards disappear and reappear automatically. Would reach 90% after confirming the new-ideas scope is Defer-only or also includes a UI rename.
- Delivery-Readiness: 90% — all dependencies are understood, the affected files are identified, no new packages needed, no schema migration needed.
- Testability: 83% — localStorage-dependent UI logic requires careful test seaming. The existing pattern for operator action snooze provides a model. The gap is that `InProgressInbox.tsx` currently has no tests to build on.

For each score:
- Implementation: would reach 90% by confirming that the `AutoRefresh` poll in `InProgressInbox.tsx` (every 30s from `/api/process-improvements/items`) returns enough data to re-evaluate snooze expiry without extra API changes.
- Approach: would reach 90% with operator answer to the open question on new-ideas Defer labelling.

---

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| localStorage snooze state lost on browser data clear | Low | Low — single operator, deliberate action required | Acceptable. Snooze is explicitly "lightweight temporary"; operator can snooze again. |
| Page header SSR count includes snoozed plans | High — will happen | Low — cosmetic | Accept as a known limitation; document in plan. |
| Confusion between in-progress "Snooze" and new-ideas "Defer" button labels | Medium | Low | Use "Snooze for 3 days" / "Snooze for 7 days" labels consistently on in-progress; leave new-ideas Defer unchanged. |
| Plan slug changes (rename/archive) orphan localStorage entry | Low | Low — entry is ignored when plan no longer exists | Clean up stale entries on read (filter for slugs that exist in the current plan list). |
| Existing tests for InProgressInbox break on new action button UI | Low | Medium — CI would catch | Write tests alongside the implementation. |

---

## Planning Constraints & Notes
- Must-follow patterns:
  - `"use client"` already on both inbox components; no change needed.
  - Action buttons on new-ideas follow the `availableActions` array from the projection. In-progress has no such pattern; add buttons directly to `ActivePlanCard`.
  - localStorage key must be namespaced to avoid collisions: `bos:plan-snooze:v1` → `{ [slug]: isoTimestamp }`.
  - Auto-refresh in `InProgressInbox` already refreshes the `activePlans` list; the snooze filter should be applied after refresh, client-side.
  - Test patterns: Jest unit tests per `docs/testing-policy.md`; no local runs.
- Rollout/rollback expectations:
  - Rollback is a revert commit. localStorage state is harmless if left behind (ignored by the code after rollback).
- Observability expectations:
  - None needed — lightweight client-only feature. No server-side logging required.

---

## Suggested Task Seeds (Non-binding)
- TASK-01: Add localStorage-backed snooze state to `InProgressInbox.tsx` — snooze filter, snooze buttons on `ActivePlanCard`, 3-day / 7-day period picker, snoozed indicator, expiry re-check on auto-refresh.
- TASK-02: Add unit tests for the in-progress snooze filter logic and `ActivePlanCard` snooze button rendering.
- TASK-03: (Optional, pending operator input) Surface 3-day / 7-day snooze quick-picks on new-ideas queue items alongside or instead of the existing Defer multi-period picker.

---

## Execution Routing Packet
- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - `InProgressInbox.tsx` renders snooze buttons on each `ActivePlanCard` with 3-day and 7-day options.
  - Snoozed plans are filtered from the active list until expiry.
  - Snoozed plans reappear automatically on the next auto-refresh after expiry.
  - Tests cover the snooze filter logic and button rendering.
  - Typecheck and lint pass on `apps/business-os`.
- Post-delivery measurement plan:
  - Operator uses snooze buttons; snoozed plans disappear and reappear as expected. No formal measurement needed for this lightweight feature.

---

## Evidence Gap Review

### Gaps Addressed
- Confirmed that in-progress has no snooze mechanism: verified by full read of `InProgressInbox.tsx`.
- Confirmed that new-ideas operator action snooze is fully wired: verified by full read of `NewIdeasInbox.tsx` and `operator-action-service.ts`.
- Confirmed that new-ideas queue Defer already covers 3 and 7 day periods: verified by `DEFER_PERIOD_OPTIONS` constant.
- Confirmed that D1 schema does not cover active plans: verified by `0001_init.sql` and `0002_add_idea_priority.sql`.
- Confirmed stable identifier for active plan cards: `plan.slug` in `InProgressInbox.tsx:353`.

### Confidence Adjustments
- None required. All key questions are resolved by code evidence.

### Remaining Assumptions
- Single-operator, single-device is the correct BOS assumption for the storage decision. Documented in MEMORY.md (BOS is an internal tool; i18n not needed; English-only).

---

## Rehearsal Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| In-progress snooze mechanism | Yes | None — localStorage is sufficient, no server changes needed | No |
| In-progress card identifier | Yes | None — `plan.slug` is stable | No |
| New-ideas Defer overlap | Yes | Minor: open question on UI labelling | Operator input preferred but default assumption acceptable |
| New-ideas operator action snooze | Yes | None — already fully implemented | No |
| Storage decision | Yes | None | No |
| Test coverage gaps | Yes | InProgressInbox has no existing tests to build on | Yes — include test task in plan |
| D1 / database impact | Yes | None — in-progress plans are filesystem-derived | No |

---

## Analysis Readiness
- Status: Ready-for-analysis
- Blocking items:
  - None. The open operator input question (new-ideas Defer relabelling) has a clear default assumption and does not block implementation.
- Recommended next step:
  - `/lp-do-analysis process-improvements-snooze-buttons`
