# Fact Find: Reception Inbox Two-Column Layout

**Status: Ready-for-planning**
**Date:** 2026-03-12

---

## 1. Current State

### Layout

`InboxWorkspace` (`apps/reception/src/components/inbox/InboxWorkspace.tsx`) renders a two-zone grid using Tailwind's `xl:grid-cols-12`:

- **Left zone** (`xl:col-span-4`): `ThreadList` — the thread list with filter bar.
- **Right zone** (`xl:col-span-8`): `ThreadDetailPane` — message bubbles + `DraftReviewPanel`.

On mobile, only one zone is visible at a time, controlled by `mobileShowDetail` state. There is a back button to return from detail to the list.

### Data flow

`useInbox` (`apps/reception/src/services/useInbox.ts`) is the single data hook. It:

- Fetches all threads from `/api/mcp/inbox` (a unified endpoint that merges email + Prime threads).
- Holds a single `selectedThreadId` / `selectedThread` pair.
- Exposes one set of loading flags (`loadingList`, `loadingThread`, `savingDraft`, etc.) shared for the whole workspace.
- Auto-refreshes every 15 seconds when online and tab-visible.
- Maintains a detail cache (`detailCacheRef`) keyed by thread ID.

All mutations (save draft, send, resolve, dismiss) operate on `selectedThreadId`.

### Components

| Component | Role |
|---|---|
| `InboxWorkspace` | Orchestrates layout, owns all state from `useInbox`, wires up all event handlers |
| `ThreadList` | Renders the filterable, scrollable list of `InboxThreadSummary` items. Self-contained filter state. `max-h-[calc(100vh-12rem)]` for scroll containment. |
| `ThreadDetailPane` | Shows message bubbles and delegates draft actions to `DraftReviewPanel`. `max-h-[50vh]` scroll containment on the message area. |
| `DraftReviewPanel` | Draft edit/send/resolve/dismiss controls |
| `FilterBar` | Chip-based filter toggles (needs-draft, ready-to-send, sent, review-later, stale-sync) |

### Channel model

Three channels are defined in `apps/reception/src/lib/inbox/channels.ts`:

- `"email"` — Gmail-backed threads
- `"prime_direct"` — Prime messaging 1:1
- `"prime_broadcast"` — Prime messaging broadcast campaigns

`InboxThreadSummary.channel` (`InboxChannel`) distinguishes every thread by source. The `channelLabel` field is a human-readable string shown as a badge in both `ThreadList` and `ThreadDetailPane`.

### Prime thread IDs

Prime threads are namespaced with the prefix `prime:` (via `buildPrimeInboxThreadId` in `prime-review.server.ts`). This means `isPrimeInboxThreadId(id)` gives a reliable runtime predicate for channel membership, without needing to inspect the `channel` field.

### How threads are mixed today

`/api/mcp/inbox` merges email threads and Prime threads server-side before returning a single sorted list. `useInbox` receives them all together and `sortThreads` applies a single chronological sort. The `ThreadList` component has no awareness of channel — it receives the merged list and renders all items uniformly, relying on the `channelLabel` badge to visually distinguish source.

---

## 2. Key Questions Answered

### How are email vs Prime threads currently distinguished?

By the `channel` field on `InboxThreadSummary` (`"email"` | `"prime_direct"` | `"prime_broadcast"`) and by the `prime:` ID prefix. Both predicates are reliable. The `channelLabel` badge is rendered in `ThreadList` and `ThreadDetailPane` headers but plays no filtering or routing role today.

### What state management changes are needed for independent columns?

Currently `useInbox` manages a single `selectedThreadId`. Two independent columns need two independent selections: one for email, one for Prime. The options are:

1. **Two `useInbox` instances** — each instance would call `/api/mcp/inbox` and filter client-side. Doubled network requests, two auto-refresh timers, no shared cache. Wasteful.
2. **One `useInbox` + two selection slots** — extend the hook to expose `selectedEmailThreadId` / `selectedPrimeThreadId` with independent detail/loading state. Adds complexity to the hook but keeps a single fetch.
3. **Split at the API level** — add query params to `/api/mcp/inbox` to filter by channel, call twice. Same duplication concern as option 1.

The cleanest path is to keep the single list fetch (one auto-refresh, one cache), then split the thread list into two filtered views and maintain two separate selection states inside the hook or at the workspace level.

### Are there responsive design considerations?

Yes. The current mobile behaviour (`mobileShowDetail` bool, stacked view) will need to generalise to a two-column layout:

- **Desktop (xl+):** three-panel layout — email list | Prime list | detail pane. Or two-panel if detail occupies the full right half (selected thread from either column opens into the same detail pane).
- **Tablet (md–xl):** potentially email list + Prime list stacked vertically, or a tab switcher.
- **Mobile:** a single column with a tab/toggle to switch between email and Prime lists; tapping a thread navigates into the detail view (same back-button pattern as today).

The current `xl:grid-cols-12` system can be extended, but the mobile fallback logic will become more involved.

### Can ThreadList/ThreadDetailPane be reused for both columns?

`ThreadList` is already channel-agnostic — it accepts `InboxThreadSummary[]` and knows nothing about source. Filtering a subset of threads by channel and passing them in is enough to create a channel-specific list column. No structural changes are needed.

`ThreadDetailPane` is also channel-agnostic. It renders whatever `InboxThreadDetail` it receives. The `channelLabel` badge and campaign block already handle Prime-specific display. It can be shared for the selected thread from either column without modification.

The only coupling is in `InboxWorkspace`, which currently wires one `selectedThread` to one `ThreadDetailPane`. That wiring needs to support two selection paths.

---

## 3. Approach Options

### Option A: Duplicate ThreadList/ThreadDetailPane for Prime column

Create a second instance of `ThreadList` for Prime threads and a second `ThreadDetailPane` (or a second slot) in the workspace. Each column manages its own selection and detail state independently, likely by mounting two separate `useInbox` hooks (one filtered to email, one to Prime).

**Pros:** No changes to existing components or the hook.
**Cons:** Two API fetches on every load and auto-refresh. Two caches that can diverge. A dismiss/resolve action in one column has no effect on the other column's thread list until the next refresh cycle. Significant code duplication in `InboxWorkspace`.

### Option B: Make ThreadList/ThreadDetailPane channel-aware via a source prop

Add a `channel` or `source` prop to `ThreadList` and filter internally. Extend `useInbox` to expose two selection slots (`selectedEmailThreadId`, `selectedPrimeThreadId`) and the corresponding detail/loading state pairs.

**Pros:** Single fetch, single cache, single auto-refresh. Mutations in one column immediately update shared state. All business logic remains in one hook.
**Cons:** The hook interface grows substantially. `ThreadList` becomes slightly less pure (it now knows it is showing a filtered subset). `InboxWorkspace` becomes more complex as it wires two sets of selection/detail props.

### Option C: Create a new PrimeColumn component that wraps existing primitives

Introduce a `PrimeColumn` component that accepts the Prime-filtered thread list and a Prime-specific selection state. It renders a `ThreadList` internally and emits `onSelect` up to the workspace. The workspace holds two independent selections in local state and routes them into a shared `ThreadDetailPane`.

**Pros:** The new column is an encapsulated unit (filter logic, scroll state, column header, empty state). `ThreadList` and `ThreadDetailPane` remain unmodified. The workspace renders `<EmailColumn> | <PrimeColumn> | <ThreadDetailPane>` in a clean three-zone grid. The hook only needs two selection slots added (or the workspace manages them locally alongside calling `selectThread` with the relevant ID).
**Cons:** A thin new component layer; marginal extra file. The selection model still needs a decision (shared `ThreadDetailPane` vs two separate panes).

---

## 4. Recommendation

**Option C** — create a `PrimeColumn` component (and a matching `EmailColumn` for symmetry), both wrapping `ThreadList`, with a single shared `ThreadDetailPane`.

**Rationale:**

- `ThreadList` needs no changes. It already renders any list of `InboxThreadSummary` items correctly.
- `ThreadDetailPane` needs no changes. It already renders any `InboxThreadDetail` regardless of channel.
- The only new code is: (a) `EmailColumn` and `PrimeColumn` thin wrapper components that each receive a pre-filtered thread list, a `selectedThreadId`, and an `onSelect` callback; (b) a small extension to `useInbox` (or local workspace state) to hold two `selectedThreadId` / `selectedThread` / `loadingThread` slots; (c) a revised grid layout in `InboxWorkspace`.
- Keeping a single `useInbox` fetch preserves the shared cache and auto-refresh behaviour. A resolve or dismiss action will correctly update the unified thread list and both columns reflect the change on the same render.
- A shared `ThreadDetailPane` avoids duplicating the draft review panel and keeps the operator's focus in one place when reading a message.

**Proposed layout:**

```
Desktop (xl+):
┌─────────────────────────────────────────────────────┐
│ Header (Inbox title, counts, Refresh/Sync, Analytics)│
├────────────────┬──────────────────┬─────────────────┤
│  EmailColumn   │  PrimeColumn     │ ThreadDetailPane│
│  (threads      │  (prime_direct + │ (selected from  │
│   channel=     │   prime_broadcast│  either column) │
│   "email")     │   threads)       │                 │
│  scrollable    │  scrollable      │                 │
└────────────────┴──────────────────┴─────────────────┘

Mobile:
Tab strip: [Email | Prime] → single list → tap → detail (back button)
```

**Implementation steps (for planning):**

1. Extend `useInbox` to hold two selection slots: `selectedEmailThreadId` / `selectedPrimeThreadId` with independent `loadingThread` / `detailError` / `selectedThread` pairs. The `selectThread` entry point branches on thread ID prefix.
2. Split the unified `threads` array inside the workspace (or inside each Column component): `emailThreads = threads.filter(t => t.channel === "email")` and `primeThreads = threads.filter(t => t.channel !== "email")`.
3. Create `EmailColumn` and `PrimeColumn` components — each renders a labelled header, a `ThreadList`, and an empty/loading state appropriate to that channel.
4. Revise `InboxWorkspace` grid to `xl:grid-cols-[1fr_1fr_2fr]` (or equivalent 12-col splits such as 3-3-6).
5. Pass the last-selected thread (from whichever column was clicked most recently) to the single `ThreadDetailPane`.
6. Revise mobile UX: add a two-tab strip (Email / Prime) above the single thread list; keep the existing back-button pattern for entering detail view.
7. Update `countThreadsNeedingManualDraft` and `countThreadsReadyToSend` in `InboxWorkspace` — these already operate over the full `threads` array and require no changes; their counts shown in the header remain valid as a combined summary.
