# Reception Inbox UI State Spec

Date: 2026-03-06
Status: Draft for implementation
Depends on: TASK-06 route contract

## Goal

Define the minimum UI contract for `TASK-07` so the inbox page can be implemented without making route, navigation, or state decisions ad hoc during build.

## Navigation and Auth Anchors

- Navigation entry lives in `apps/reception/src/components/appNav/OperationsModal.tsx`.
- Add one new operations action:
  - `label: "Inbox"`
  - `route: "/inbox"`
  - icon can reuse `Inbox` from `lucide-react`.
- The inbox page is rendered at `apps/reception/src/app/inbox/page.tsx`.
- Page auth follows the existing reception model from `apps/reception/src/App.tsx`.
  - Do not add a route-group auth wrapper.
  - Rely on the app-level authenticated shell; unauthenticated users already land on `Login`.

## Route Contract Used by the UI

| User action | Route | Method | Notes |
|---|---|---|---|
| Load active inbox list | `/api/mcp/inbox` | `GET` | Default view; excludes `auto_archived` and `resolved` threads |
| Load specific thread | `/api/mcp/inbox/[threadId]` | `GET` | Returns thread summary, metadata, messages, events, admission outcomes, current draft, `messageBodiesSource`, optional `warning` |
| Load current draft only | `/api/mcp/inbox/[threadId]/draft` | `GET` | Returns `draft` and `needsManualDraft` |
| Save staff edits | `/api/mcp/inbox/[threadId]/draft` | `PUT` | Body: `{ subject?, recipientEmails?, plainText, html? }` |
| Regenerate draft | `/api/mcp/inbox/[threadId]/draft/regenerate` | `POST` | Body: `{ force?: boolean }` |
| Send draft | `/api/mcp/inbox/[threadId]/send` | `POST` | Uses stored draft; returns sent message id |
| Resolve thread | `/api/mcp/inbox/[threadId]/resolve` | `POST` | Removes thread from active list after refresh |
| Manual refresh/sync | `/api/mcp/inbox-sync` | `POST` | Optional body: `{ rescanWindowDays? }` |

## Page Layout

Desktop:
- Two-column layout inside the existing authenticated shell.
- Left rail: thread list, refresh button, list-level loading/error/empty states.
- Right pane: thread detail and draft workflow.

Mobile:
- Single-column stack.
- Thread list first.
- Selecting a thread transitions to the detail panel with a back action.

## State Matrix

| Surface | State | Trigger / route | UI treatment | Primary actions |
|---|---|---|---|---|
| Inbox page | Initial loading | first `GET /api/mcp/inbox` | full-page skeleton with list rows and empty detail placeholder | none |
| Inbox page | List loaded | `GET /api/mcp/inbox` success with rows | show thread rail sorted by `latestMessageAt` descending | select thread, refresh |
| Inbox page | Empty | `GET /api/mcp/inbox` success with zero rows | show empty illustration/message plus refresh CTA | refresh |
| Inbox page | List error | `GET /api/mcp/inbox` failure | inline error banner above thread list; preserve retry button | retry, refresh |
| Thread detail | No selection | list loaded but no thread chosen | instructional placeholder in detail pane | select thread |
| Thread detail | Loading | `GET /api/mcp/inbox/[threadId]` in flight | preserve list selection; show message/draft skeletons | none |
| Thread detail | Loaded with Gmail bodies | detail route returns `messageBodiesSource="gmail"` | show full history and draft panel | edit, regenerate, send, resolve |
| Thread detail | Loaded with D1 fallback | detail route returns `messageBodiesSource="d1"` and `warning` | show warning callout above messages; still render data | retry detail, edit, resolve |
| Thread detail | Error | detail route fails | inline error state in detail pane; keep list usable | retry detail |
| Draft panel | Agent draft loaded | `currentDraft` present and `needsManualDraft=false` | pre-populate subject, recipients, body, template label, quality badge | edit, regenerate, send |
| Draft panel | Manual draft required | detail/draft route returns `needsManualDraft=true` | open editable draft form with explanatory note; no template/quality badge required | compose, save, send |
| Draft panel | No draft yet | `currentDraft=null`, `needsManualDraft=false` | neutral empty panel with regenerate CTA | regenerate |
| Draft panel | Saving edits | `PUT /draft` in flight | disable save/send/regenerate buttons, keep form values visible | none |
| Draft panel | Save error | `PUT /draft` failure | inline error under toolbar; preserve unsaved values in form state | retry save |
| Draft panel | Regenerate confirm | current draft status is edited and staff clicks regenerate | blocking confirmation modal: overwrite staff edits? | cancel, confirm regenerate |
| Draft panel | Regenerating | `POST /draft/regenerate` in flight | disable draft actions; spinner on regenerate button | none |
| Draft panel | Regenerate error | regenerate route fails | inline error banner; keep current draft intact | retry regenerate |
| Approval bar | Ready to send | draft has at least one recipient and non-empty body | sticky action bar with send + resolve actions | send, resolve |
| Approval bar | Send confirm | user clicks Send | confirmation modal summarizing recipient + subject | cancel, confirm send |
| Approval bar | Sending | `POST /send` in flight | disable all mutating actions; loading label on send button | none |
| Approval bar | Send error | send route fails | inline error callout; draft stays editable | retry send |
| Approval bar | Sent | `POST /send` success | success toast/banner, thread status badge updates to `sent` | resolve or move selection |
| Thread lifecycle | Resolve confirm | user clicks Resolve | lightweight confirmation or undo toast | cancel, confirm resolve |
| Thread lifecycle | Resolved | `POST /resolve` success | remove thread from active list and clear detail pane selection | select another thread |
| Refresh | Syncing | `POST /api/mcp/inbox-sync` in flight | disable refresh button, keep current data visible | none |
| Refresh | Sync error | sync route fails | non-blocking toast/banner; current list remains visible | retry refresh |

## Status and Badge Rules

Thread badge derives from thread status plus draft metadata:

| Condition | Badge text |
|---|---|
| `needsManualDraft=true` | `Needs manual draft` |
| current draft status `edited` | `Staff edited draft` |
| current draft status `generated` | `Agent draft ready` |
| thread status `sent` | `Sent` |
| thread status `review_later` | `Review later` |
| thread status `pending` with no draft | `Pending` |

Quality badge:
- Show only when `currentDraft.quality` exists.
- `passed=true` -> success badge.
- `passed=false` -> warning badge with short copy such as `Check before send`.

## Minimum Component Split for TASK-07

- `InboxPageShell`
  - owns layout, selected thread id, and mobile/desktop presentation
- `InboxToolbar`
  - refresh button, list-level retry, active sync state
- `ThreadList`
  - list rendering, empty state, thread selection
- `ThreadListItem`
  - snippet, date, status badge, manual-draft flag
- `ThreadDetailPane`
  - message history + warning banner + admission metadata
- `MessageHistory`
  - ordered messages with sender, timestamp, body
- `DraftReviewPanel`
  - subject, recipients, body editor, template/quality summary
- `DraftActionsBar`
  - save, regenerate, send, resolve actions
- `RegenerateDraftDialog`
  - only shown when overwrite confirmation is required
- `SendDraftDialog`
  - confirmation before send

## Service Hook Contract for TASK-07

`apps/reception/src/services/useInbox.ts` should follow the same thin-fetcher pattern as `useEmailGuest.ts`.

Minimum hook surface:
- `threads`
- `selectedThreadId`
- `selectedThread`
- `loadingList`
- `loadingThread`
- `savingDraft`
- `regeneratingDraft`
- `sendingDraft`
- `syncing`
- `error`
- `loadThreads()`
- `selectThread(threadId)`
- `saveDraft(input)`
- `regenerateDraft({ force? })`
- `sendDraft()`
- `resolveThread()`
- `syncInbox()`

Recommended fetch helpers:
- `fetchInboxThreads()`
- `fetchInboxThread(threadId)`
- `fetchInboxDraft(threadId)`
- `updateInboxDraft(threadId, payload)`
- `regenerateInboxDraft(threadId, payload)`
- `sendInboxDraft(threadId)`
- `resolveInboxThread(threadId)`
- `runInboxSync()`

## Interaction Rules

- Selecting a thread should fetch detail immediately even if thread summary already contains `currentDraft`.
  - Reason: the detail route is the only source that includes hydrated messages, events, admissions, and the Gmail/D1 warning state.
- After save/regenerate/send/resolve, refresh both:
  - selected thread detail
  - thread list summary
- After successful resolve:
  - remove the resolved thread from the active list in local state immediately
  - if the resolved thread was selected, clear selection or move to the next visible thread
- After successful send:
  - keep the thread visible until the user resolves it
  - update badge/state to `Sent`

## Implementation Notes for TASK-07

- Do not build a blank-compose-first UI. The default experience is review of an existing agent draft when one exists.
- Do not hide the `warning` field from the detail route; it is the operator signal that Gmail hydration failed and the UI is showing stale D1-only bodies.
- Treat `needsManualDraft=true` as a first-class state, not just missing data.
- Keep the refresh action explicit and manual; no background polling is required for v1.
