---
Type: Plan
Status: Complete
Domain: UI
Workstream: Engineering
Created: 2026-03-12
Last-reviewed: 2026-03-12
Last-updated: 2026-03-12
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-inbox-two-column-layout
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 83%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/reception-inbox-two-column-layout/fact-find.md
---

# Reception Inbox Two-Column Layout Plan

## Summary

The reception inbox currently shows email and Prime messaging threads in a single merged list. Staff switch between views, losing context of one channel while working on the other. This plan introduces a two-column layout — email threads on the left, Prime threads on the right — within the existing `InboxWorkspace`, reusing `ThreadList` and `ThreadDetailPane` unchanged. A shared `ThreadDetailPane` shows whichever thread was most recently selected from either column. Mobile retains the single-list pattern with a tab strip to switch between Email and Prime views.

Three tasks execute sequentially: extend `useInbox` with two independent selection slots, create `EmailColumn` and `PrimeColumn` wrapper components, then redesign `InboxWorkspace` to the three-zone grid layout.

## Active tasks
- [x] TASK-01: Add independent selection state to useInbox
- [x] TASK-02: Create EmailColumn and PrimeColumn wrapper components
- [x] TASK-03: Redesign InboxWorkspace to two-column grid layout

## Goals
- Show email threads and Prime threads side-by-side in independent, scrollable columns on desktop (xl+).
- Let staff select a thread from either column; the shared `ThreadDetailPane` shows whichever thread was last selected.
- Preserve all existing mutations (save/send/resolve/dismiss) — they operate on the currently active selection.
- Preserve single-fetch, single-cache, single auto-refresh behaviour from `useInbox`.
- On mobile, provide a two-tab toggle (Email / Prime) above the single thread list, keeping the existing back-button detail pattern.

## Non-goals
- Two simultaneous open thread detail panes (one per column).
- Separate auto-refresh timers or separate API calls per channel.
- Changes to `ThreadList`, `ThreadDetailPane`, `DraftReviewPanel`, or any API route.
- New filter chips or filter categories beyond what already exists in `FilterBar`.

## Constraints & Assumptions
- Constraints:
  - `ThreadList` must remain unmodified — it accepts any `InboxThreadSummary[]` and renders channel badges already.
  - `ThreadDetailPane` must remain unmodified — it is already channel-agnostic.
  - Single `useInbox` instance (one fetch, one cache) must be preserved to avoid doubled network load and cache divergence.
  - All mutation actions (save, send, resolve, dismiss) must continue operating on the single `selectedThreadId` understood by the current hook internals.
- Assumptions:
  - `InboxThreadSummary.channel === "email"` is the reliable predicate for email threads; all other channel values (`prime_direct`, `prime_broadcast`) are Prime threads. The `prime:` ID prefix (`isPrimeInboxThreadId`) is an equally valid alternative.
  - `ThreadList` scroll containment (`max-h-[calc(100vh-12rem)]`) remains appropriate per-column; each column is independently scrollable.
  - The shared `ThreadDetailPane` occupying the rightmost zone (or a full-width row below the two columns) is acceptable UX — operators read one thread at a time.
  - The existing `mobileShowDetail` boolean pattern can be extended to cover both columns without a full mobile navigation refactor.

## Inherited Outcome Contract

- **Why:** Reception staff manage both guest emails and Prime campaign messages throughout the day. Currently they switch between separate views, losing sight of one channel while working on the other. A side-by-side layout lets them see everything at once and respond faster.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The inbox shows email threads and Prime messaging side by side in a two-column layout, letting staff manage both channels simultaneously.
- **Source:** operator

## Analysis Reference
- Supporting brief: `docs/plans/reception-inbox-two-column-layout/fact-find.md`
- Selected approach inherited:
  - Option C — thin `EmailColumn` and `PrimeColumn` wrappers around the existing `ThreadList`; shared `useInbox` hook with two selection slots; shared `ThreadDetailPane`.
- Key reasoning used:
  - `ThreadList` is channel-agnostic; passing a pre-filtered subset is all that is needed to create a channel column.
  - Keeping a single `useInbox` fetch avoids doubled network requests and cache divergence. A resolve or dismiss in one column immediately updates the shared thread array, so both columns reflect the change on the same render.
  - A shared `ThreadDetailPane` avoids duplicating draft review UI and keeps operator focus in one place.

## Selected Approach Summary
- What was chosen:
  - Extend `useInbox` with `selectedEmailThreadId` / `selectedPrimeThreadId` slots alongside the existing `selectedThreadId` (which mutations continue to use).
  - Create `EmailColumn` and `PrimeColumn` components that filter the unified `threads` array by channel and forward selection to the workspace.
  - Revise `InboxWorkspace` grid from `xl:grid-cols-12` (4+8 split) to a three-zone layout (`xl:grid-cols-[3fr_3fr_6fr]` or equivalent 3-3-6 column split).
  - Mobile: replace the single `mobileShowDetail` bool with an `activeTab` state (`"email" | "prime"`) plus a `mobileShowDetail` bool; the tab strip selects which channel list to show.
- Why planning is not reopening option selection:
  - Option A (two `useInbox` instances) was ruled out in fact-find due to doubled fetch cost and cache divergence.
  - Option B (channel-aware `ThreadList`) adds coupling to a component that currently has none; Option C achieves the same with a thin wrapper layer.

## Fact-Find Support
- Supporting brief: `docs/plans/reception-inbox-two-column-layout/fact-find.md`
- Evidence carried forward:
  - `InboxThreadSummary.channel` field is the canonical channel discriminator; `channelLabel` badge already renders in `ThreadList` rows.
  - `useInbox` exposes a single `selectThread(threadId)` function that drives all mutations; extending to two selection slots means mutations route through whichever slot was last active.
  - `ThreadList`'s `max-h-[calc(100vh-12rem)]` scroll containment applies per-instance; placing two instances side-by-side reuses it naturally.
  - The `xl:grid-cols-12` grid in `InboxWorkspace` is the single layout anchor to change.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add independent selection state to useInbox | 85% | S | Complete | - | TASK-02 |
| TASK-02 | IMPLEMENT | Create EmailColumn and PrimeColumn wrapper components | 85% | S | Complete | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Redesign InboxWorkspace to two-column grid layout | 80% | M | Complete | TASK-02 | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | Three-zone desktop grid; two-tab mobile strip; per-column headers and empty states | TASK-02, TASK-03 | Tailwind CSS grid only; no new design tokens |
| UX / states | Independent loading/error states per column; active tab for mobile; back-button pattern preserved | TASK-01, TASK-02, TASK-03 | Mobile tab state is new; detail show/hide logic generalises existing `mobileShowDetail` |
| Security / privacy | No change — no new data surfaces, no new API calls | - | N/A: purely presentational rearrangement |
| Logging / observability / audit | No new log points needed; existing hook error paths unchanged | - | N/A |
| Testing / validation | Existing hook and component tests remain valid; new column components need unit tests for channel-filtering logic and empty states | TASK-02 | Tests run in CI only per testing policy |
| Data / contracts | `useInbox` return type gains two new fields; no API contract changes | TASK-01 | Hook return type is internal; no external API contract changes |
| Performance / reliability | Single fetch preserved; no extra auto-refresh timers; thread list split is a client-side `.filter()` — negligible cost | TASK-01 | |
| Rollout / rollback | No feature flag; layout change is visible immediately on deploy. Rollback: revert the three changed files. | TASK-03 | Contained to three files + two new components |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Hook extension; no UI dependency |
| 2 | TASK-02 | TASK-01 complete | Column components consume the new hook slots |
| 3 | TASK-03 | TASK-02 complete | Workspace grid wires up both column components |

## Delivered Processes

| Area | Trigger | Delivered step-by-step flow | Tasks / dependencies | Unresolved issues / rollback seam |
|---|---|---|---|---|
| Staff inbox workflow (desktop) | Staff open the inbox page | 1. Email column renders on the left with all email threads. 2. Prime column renders in the centre with all Prime threads. 3. Staff click a thread in either column → detail pane appears on the right. 4. Mutations (save/send/resolve/dismiss) act on the selected thread. 5. After resolve/dismiss the thread disappears from its column; detail pane shows the next available thread from the same column, or clears if that column is now empty. | TASK-01, TASK-02, TASK-03 | Rollback: revert `useInbox.ts`, `InboxWorkspace.tsx`, and delete `EmailColumn.tsx` / `PrimeColumn.tsx`. |
| Staff inbox workflow (mobile) | Staff open the inbox page on a small screen | 1. Tab strip shows "Email" and "Prime" tabs. 2. Active tab determines which channel list is shown. 3. Staff tap a thread → full-screen detail view with back button. 4. Back button returns to the tab that was active. | TASK-03 | Mobile tab state is new; if it causes issues, the tab strip can be removed with a single state change fallback to a merged list. |

## Tasks

---

### TASK-01: Add independent selection state to useInbox
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/services/useInbox.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete
- **Affects:** `apps/reception/src/services/useInbox.ts`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 85%
  - Implementation: 90% — the hook state shape is clear; adding two slots alongside the existing one is additive.
  - Approach: 85% — keeping a single `selectedThreadId` for mutations while exposing two display slots adds a small coordination seam.
  - Impact: 80% — mutation handlers in `InboxWorkspace` must route through the right slot; any mismatch would silently operate on the wrong thread.
- **Acceptance:**
  - `useInbox` returns `selectedEmailThreadId: string | null` and `selectedPrimeThreadId: string | null`.
  - `selectEmailThread(id)` sets `selectedEmailThreadId` and calls `selectThread(id)` internally.
  - `selectPrimeThread(id)` sets `selectedPrimeThreadId` and calls `selectThread(id)` internally.
  - Existing `selectedThreadId` and `selectedThread` continue to reflect the most recently selected thread regardless of channel.
  - All existing mutation callbacks (`saveDraft`, `sendDraft`, `resolveThread`, `dismissThread`) continue to operate on `selectedThreadId` unchanged.
  - After resolve/dismiss, `selectedThreadId` is cleared; `selectedEmailThreadId` / `selectedPrimeThreadId` for the affected slot is also cleared.
- **Engineering Coverage:**
  - UI / visual: N/A — hook only
  - UX / states: Required — after resolve/dismiss, the appropriate slot must clear; the workspace must know which slot to advance
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — verify that selecting an email thread sets `selectedEmailThreadId` and leaves `selectedPrimeThreadId` unchanged, and vice versa
  - Data / contracts: Required — `useInbox` return type gains two new fields; downstream consumers (`InboxWorkspace`) must be updated in TASK-03
  - Performance / reliability: N/A — no new fetches
  - Rollout / rollback: N/A — additive state fields; removing them reverts the change
- **Validation contract (TC-01):**
  - TC-01: Calling `selectEmailThread("email-123")` → `selectedEmailThreadId === "email-123"`, `selectedPrimeThreadId` unchanged, `selectedThreadId === "email-123"`.
  - TC-02: Calling `selectPrimeThread("prime:abc")` after TC-01 → `selectedPrimeThreadId === "prime:abc"`, `selectedEmailThreadId === "email-123"` (still set), `selectedThreadId === "prime:abc"`.
  - TC-03: After `resolveThread()` while `selectedThreadId === "email-123"` → `selectedEmailThreadId === null`, `selectedThreadId` advances to next thread or null.
- **Execution plan:** Add `selectedEmailThreadId` and `selectedPrimeThreadId` state variables. Add `selectEmailThread` and `selectPrimeThread` thin wrappers that set the appropriate slot then delegate to the existing `selectThread`. In `resolveThread` and `dismissThread`, detect which slot the resolved thread belongs to (via channel or ID prefix) and clear it. Expose the two new IDs and two new callbacks in the hook return.
- **Planning validation:**
  - Checks run: Read full `useInbox.ts` — resolve/dismiss both call `selectThread(nextSelected.id)` after removal, which re-enters the existing slot logic correctly.
  - Validation artifacts: None beyond code read.
  - Unexpected findings: `resolveThread` and `dismissThread` both call `selectThread` on the next thread inside a `setThreads` updater — the slot-clearing logic must be careful to clear the correct slot based on which thread was just removed.
- **Scouts:** Confirm `isPrimeInboxThreadId` is importable from the same layer as `useInbox.ts` to avoid a circular dep when classifying thread IDs for slot routing.
- **Edge Cases & Hardening:**
  - If the thread list contains only email or only Prime threads, the corresponding slot remains null and the empty column renders its empty state.
  - If `selectEmailThread` is called with a thread ID that turns out to be Prime (e.g. stale cached data), the slot assignment will be incorrect. Mitigate by always checking the thread's `channel` field from the thread list rather than relying solely on the caller.
  - After dismiss/resolve, if the dismissed thread was the email selection and no email threads remain, `selectedEmailThreadId` clears and the email column shows empty state; Prime column is unaffected.
- **What would make this >=90%:**
  - A cleaner separation where mutations always target `selectedThreadId` and the slot IDs are purely display state (no coordination needed on dismiss/resolve). This requires the workspace to manage "which slot was last active" rather than the hook.
- **Rollout / rollback:**
  - Rollout: Additive state fields; no existing callsites break until TASK-03 wires up the new callbacks.
  - Rollback: Remove the two new state variables and callbacks; restore original hook return shape.
- **Documentation impact:** None — hook is internal.
- **Notes / references:** `apps/reception/src/lib/inbox/channels.ts` defines `InboxChannel`. The `prime:` prefix predicate is in `prime-review.server.ts` (server-side); prefer `channel !== "email"` in client code to avoid importing server modules.

---

### TASK-02: Create EmailColumn and PrimeColumn wrapper components
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/components/inbox/EmailColumn.tsx` (new), `apps/reception/src/components/inbox/PrimeColumn.tsx` (new)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete
- **Affects:** `apps/reception/src/components/inbox/EmailColumn.tsx` (new), `apps/reception/src/components/inbox/PrimeColumn.tsx` (new)
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 85%
  - Implementation: 90% — thin wrapper; `ThreadList` accepts any `InboxThreadSummary[]` unchanged.
  - Approach: 85% — column header and empty state copy needs to be appropriate for each channel type.
  - Impact: 80% — user-observable behaviour change; empty Prime column must not alarm staff when Prime threads are absent.
- **Acceptance:**
  - `EmailColumn` accepts `threads: InboxThreadSummary[]`, `selectedThreadId: string | null`, `loading: boolean`, `error: string | null`, `onSelect: (id: string) => void | Promise<void>`. It filters `threads` to `channel === "email"` internally and renders a `ThreadList`.
  - `PrimeColumn` accepts the same props signature. It filters `threads` to `channel !== "email"` internally and renders a `ThreadList`.
  - Each component renders a column header ("Email" / "Prime") with a thread count badge.
  - Each component renders an appropriate empty state when its filtered list is empty and loading is false.
  - `ThreadList` receives only the filtered subset — it is not aware of channel.
- **Expected user-observable behavior:**
  - Staff see two clearly labelled list panels. Email threads appear only in the Email column; Prime threads appear only in the Prime column. Selecting a thread in either column opens it in the detail pane. When no Prime threads are present, the Prime column shows a calm empty state ("No Prime messages") rather than an error.
- **Engineering Coverage:**
  - UI / visual: Required — column header style, count badge, empty state per channel
  - UX / states: Required — loading skeleton (delegated to ThreadList), empty state per channel, error state per channel
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — unit test that EmailColumn passes only email threads to ThreadList; PrimeColumn passes only non-email threads; empty states render when filtered list is empty
  - Data / contracts: N/A — props mirror ThreadList's existing interface
  - Performance / reliability: N/A — `.filter()` on an in-memory array
  - Rollout / rollback: N/A — new files; deletion reverts the change
- **Validation contract (TC-02):**
  - TC-01: Given `threads` containing 3 email + 2 prime_direct threads → `EmailColumn` renders 3 items in its `ThreadList`; `PrimeColumn` renders 2 items.
  - TC-02: Given `threads` with zero prime threads → `PrimeColumn` renders its empty state (not ThreadList's empty state, which would show "No active threads").
  - TC-03: `onSelect` called from `EmailColumn` → parent receives the correct thread ID.
- **Execution plan:** Create `EmailColumn.tsx` and `PrimeColumn.tsx`. Each filters the `threads` prop, renders a header with count, and passes the filtered subset to `ThreadList`. Reuse existing styling tokens (`rounded-2xl border border-border-1 bg-surface-2`) for the column wrapper to match `ThreadList`'s card appearance. Channel-specific empty states use distinct copy and the `MailSearch` / messaging icon respectively.
- **Planning validation:**
  - Checks run: Read `ThreadList.tsx` — confirmed it is fully channel-agnostic; the header ("Threads") and empty state copy ("No active threads") inside `ThreadList` will still appear per-instance. The column header from the wrapper can sit above or replace the inner section header. The inner `ThreadList` section header saying "Threads" may be redundant — consider passing a `label` prop or suppressing it via CSS. This is a presentation detail for the build phase.
  - Validation artifacts: None beyond code read.
  - Unexpected findings: `ThreadList` renders its own `<section>` with a "Threads" header and its own empty state. The wrapper column header would duplicate this. The build phase should decide whether to: (a) add an optional `label` prop to `ThreadList` to override the "Threads" heading, or (b) accept the double header temporarily and refine in a follow-on. Option (b) is safer for this plan's scope constraint.
- **Scouts:** Check whether `ThreadList`'s inner "Threads" section heading plus the wrapper column heading creates a confusing double-label. Flag for build agent to decide per option (a)/(b) above.
- **Edge Cases & Hardening:**
  - If all threads are email (zero Prime), the Prime column shows a dedicated empty state; the workspace does not collapse or hide it.
  - If `loading` is true and no threads are present, each column shows the `ThreadList` skeleton independently.
  - `error` prop is passed through to `ThreadList` unchanged; both columns can display their own error state independently.
- **What would make this >=90%:** A `label` prop on `ThreadList` to override the "Threads" section heading, eliminating the double-header concern without requiring workarounds.
- **Rollout / rollback:**
  - Rollout: New files only; no existing file changes until TASK-03 imports them.
  - Rollback: Delete `EmailColumn.tsx` and `PrimeColumn.tsx`.
- **Documentation impact:** None.
- **Notes / references:** The `prime_broadcast` and `prime_direct` channels both belong to the Prime column — filter condition is `channel !== "email"`, not a strict equality check per prime type.

---

### TASK-03: Redesign InboxWorkspace to two-column grid layout
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/components/inbox/InboxWorkspace.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete
- **Affects:** `apps/reception/src/components/inbox/InboxWorkspace.tsx`
- **Depends on:** TASK-02
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 85% — grid layout change is straightforward; mobile tab logic is a small but novel addition.
  - Approach: 80% — shared `ThreadDetailPane` means only one thread's detail is visible; operators must understand which column's selection is shown.
  - Impact: 75% — visible layout change; mobile tab strip is net-new UX that has not been tested with staff.
- **Acceptance:**
  - Desktop (xl+): Three-zone grid renders — `EmailColumn` (left), `PrimeColumn` (centre), `ThreadDetailPane` (right). Approximate column widths: 3fr / 3fr / 6fr (or 3-3-6 of a 12-col grid).
  - Mobile: A two-tab strip ("Email" / "Prime") appears above the single visible list. Tapping a tab switches which column's threads are shown. Tapping a thread opens the detail view with the existing back button.
  - The detail pane always shows the most recently selected thread regardless of which column it came from.
  - `handleSelectThread` is replaced by `handleSelectEmailThread` and `handleSelectPrimeThread`, each calling the corresponding hook callback from TASK-01.
  - All existing mutation handlers (`handleSaveDraft`, `handleSendDraft`, `handleResolveThread`, `handleDismissThread`) are wired to the shared `selectedThread` / `selectedThreadId` as before — no change to their logic.
  - Header counts (`manualDraftCount`, `readyToSendCount`) continue operating over the full `threads` array — no change.
- **Expected user-observable behavior:**
  - On desktop, staff see the inbox as three panels. Email threads are on the left, Prime threads in the middle, and the open thread detail on the right. Clicking any thread from either panel updates the right panel. After resolving or dismissing a thread, the detail panel advances to the next thread in that column (or clears if the column is now empty). On mobile, staff see a tab strip at the top: "Email" and "Prime". The active tab highlights the selected channel. Tapping a thread navigates into the detail view; the back button returns to the same tab.
- **Engineering Coverage:**
  - UI / visual: Required — new grid layout, tab strip, column visibility logic
  - UX / states: Required — mobile tab state, active tab indicator, back-button destination tracks active tab
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — layout integration test confirming both columns render and selection routes correctly; mobile tab switching behaviour
  - Data / contracts: Required — `useInbox` return shape now includes `selectEmailThread` / `selectPrimeThread` from TASK-01; workspace must consume them
  - Performance / reliability: N/A — CSS grid change; no new data fetches
  - Rollout / rollback: Required — this is the user-visible change; rollback is revert of this single file
- **Validation contract (TC-03):**
  - TC-01: On desktop viewport (xl+), `EmailColumn` and `PrimeColumn` and `ThreadDetailPane` are all visible simultaneously.
  - TC-02: Clicking a thread in `PrimeColumn` → `ThreadDetailPane` shows that thread's detail; `EmailColumn` selection highlight unchanged.
  - TC-03: On mobile viewport, only one column (matching active tab) is visible; tab strip is present; tapping the other tab switches the visible list.
  - TC-04: After `handleResolveThread` from a Prime thread, the detail pane either advances to the next Prime thread or clears; the Email column is unaffected.
- **Execution plan:** Replace the two-zone grid div (`xl:grid-cols-12` with col-span-4 and col-span-8) with a three-zone grid (`xl:grid-cols-12` with col-span-3, col-span-3, col-span-6, or use `xl:grid-cols-[1fr_1fr_2fr]`). Render `<EmailColumn>` in zone 1, `<PrimeColumn>` in zone 2, `<ThreadDetailPane>` in zone 3. Add `activeTab: "email" | "prime"` state for mobile. On mobile, render the tab strip above the single visible column (conditionally render `<EmailColumn>` or `<PrimeColumn>` based on `activeTab`). Wire `onSelect` of each column to the appropriate handler. Mobile back button continues to set `mobileShowDetail(false)`.
- **Planning validation:**
  - Checks run: Read `InboxWorkspace.tsx` fully. The existing mobile toggle uses `mobileShowDetail` boolean; adding `activeTab` alongside it is compatible without any mobile breakage risk.
  - Validation artifacts: None beyond code read.
  - Unexpected findings: `loadingThread` and `detailError` are currently single values shared for all thread selections. With two columns, a loading spinner in the detail pane could be ambiguous about which column triggered it. This is acceptable for the initial implementation — one detail pane, one loading state. The `loadingThread` flag will reflect the most recent click regardless of column.
- **Scouts:** None — `InboxWorkspace` is the integration point; all dependencies are already confirmed by TASK-01 and TASK-02.
- **Edge Cases & Hardening:**
  - If both columns have selections and the user resolves the currently active thread, the detail pane should attempt to auto-advance within the same column (email → next email, prime → next prime). This requires `resolveThread` / `dismissThread` in the hook to know which column was active. The workspace can track `lastActiveColumn: "email" | "prime"` and pass it to an optional `{ preferColumn }` param on the hook callbacks. This is a hardening consideration; the base build can initially advance to the globally next thread and refine if needed.
  - If `selectedEmailThreadId` is set but the email thread was dismissed by the server between refreshes, the detail pane may briefly show stale data — handled by the existing 15-second auto-refresh already.
  - Three-column grid on a 1280px screen may make columns narrow. The 3-3-6 split gives approximately 240px / 240px / 480px at xl breakpoint — borderline for thread list readability. The build agent should validate at actual breakpoint and adjust to 4-4-4 (equal thirds) if the detail pane is too constrained, or use 3-3-6 with a min-width guard.
- **What would make this >=90%:** A column-aware post-resolve/dismiss navigation that auto-advances within the same channel column rather than the globally next thread. This is deferred as hardening.
- **Rollout / rollback:**
  - Rollout: Single file change; visible immediately on deploy. No feature flag.
  - Rollback: `git revert` of `InboxWorkspace.tsx`; optionally delete `EmailColumn.tsx` and `PrimeColumn.tsx`.
- **Documentation impact:** None — internal UI component.
- **Notes / references:** Tailwind v4 CSS grid: `grid-cols-[3fr_3fr_6fr]` or `grid-cols-12` with `col-span-3` / `col-span-3` / `col-span-6`. Use whichever is consistent with the existing `xl:grid-cols-12` convention in this file.

---

## Risks & Mitigations
- **Narrow column widths at xl breakpoint:** Three columns at `xl:grid-cols-12` (3-3-6) may render thread list columns at ~240px, which is tight. Mitigation: build agent validates at 1280px and adjusts to equal-thirds (4-4-4) if needed, accepting a narrower detail pane.
- **Double column header (ThreadList inner "Threads" label + wrapper label):** `ThreadList` renders its own "Threads" section heading. Two labels may feel redundant. Mitigation: accept double heading in v1; follow-on plan can add a `label` prop to `ThreadList` to override it.
- **Post-resolve/dismiss column navigation:** After dismissing a Prime thread, the auto-advance picks globally first thread, which may be an email thread — opening the email column's detail without changing the visible column on mobile. Mitigation: track `lastActiveColumn` in workspace and use it to guide the next selection; deferred to hardening pass.
- **Mobile UX unfamiliarity:** The tab strip is new UI for staff. Mitigation: ship with clear tab labels ("Email" / "Prime") and maintain the existing back-button pattern so the mobile flow stays familiar.

## Observability
- Logging: None new — hook error paths unchanged; existing toast notifications cover failure states.
- Metrics: None new — thread count badges in column headers give staff a visual signal of queue depth per channel.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)
- [x] Desktop (xl+): Email and Prime threads appear in separate, independently scrollable columns side by side.
- [x] Selecting a thread from either column opens its detail in the shared `ThreadDetailPane`.
- [x] All mutations (save draft, send, resolve, dismiss) operate correctly on the selected thread.
- [x] After resolve/dismiss, the resolved thread disappears from its column; the detail pane updates.
- [x] Mobile: two-tab strip ("Email" / "Prime") is present above the single visible thread list.
- [x] Mobile: switching tabs changes which channel's threads are shown.
- [x] Mobile: tapping a thread opens the detail view; back button returns to the last active tab.
- [x] Header counts (manual draft count, ready-to-send count) remain accurate over the full thread set.
- [x] No additional API calls introduced; auto-refresh continues as a single interval.
- [x] `ThreadList` and `ThreadDetailPane` source files are not modified.

## Decision Log
- 2026-03-12: Selected Option C (thin column wrappers) over Option A (two useInbox instances) to preserve single-fetch shared cache. Selected shared `ThreadDetailPane` over two separate detail panes to avoid duplicating draft review UI.
- 2026-03-12: Mutation callbacks continue to target `selectedThreadId` (single slot) to avoid rewriting all mutation handlers. The two new selection slots (`selectedEmailThreadId`, `selectedPrimeThreadId`) are display-only identifiers for column highlight state.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Extend useInbox with two selection slots | Yes — hook is self-contained; adding state variables and callbacks is additive | Minor: resolve/dismiss auto-advance must clear the correct slot (email or prime) based on the dismissed thread's channel | No — build agent handles during implementation; predicate is `channel === "email"` |
| TASK-02: Create EmailColumn and PrimeColumn | Yes — TASK-01 delivers the new hook callbacks; `ThreadList` is already channel-agnostic | Minor: inner "Threads" heading inside `ThreadList` may double up with the column wrapper header | No — acceptable in v1; can be refined with a `label` prop follow-on |
| TASK-03: Redesign InboxWorkspace grid | Yes — TASK-02 delivers both column components ready to compose | Moderate: three-column grid at xl may be too narrow at 3-3-6 split; build agent must validate at 1280px | No — adjust to 4-4-4 if needed during build; does not require replanning |

## Overall-confidence Calculation
- TASK-01: confidence 85%, effort S (weight 1)
- TASK-02: confidence 85%, effort S (weight 1)
- TASK-03: confidence 80%, effort M (weight 2)
- Overall = (85×1 + 85×1 + 80×2) / (1+1+2) = (85 + 85 + 160) / 4 = 330 / 4 = **82.5% → 83%**
