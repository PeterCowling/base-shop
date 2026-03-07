---
Type: Build-Record
Status: Complete
Feature-Slug: reception-inbox-ui-polish
Business: BRIK
Created: 2026-03-07
---

# Reception Inbox UI Polish — Build Record

## Build Summary

Fixed 9 visual/UX issues across 5 inbox component files plus a React performance bug (double-fetch on mount). All changes are bounded CSS/markup edits with no architectural changes.

## Tasks Completed

| Task | Description | Status |
|---|---|---|
| TASK-01 | ThreadDetailPane: overflow fix, jargon removal, outbound accent, conversation scroll | Complete |
| TASK-02 | presentation.ts: shorter badge labels, relative timestamps | Complete |
| TASK-03 | DraftReviewPanel: button visual hierarchy | Complete |
| TASK-04 | ThreadList: scroll constraint | Complete |
| TASK-05 | InboxWorkspace: remove duplicate stat strip | Complete |

## Key Changes

- **ThreadDetailPane.tsx**: Added `break-words` for URL overflow, removed "Source: D1" jargon, added `border-l-2 border-l-primary-main` on outbound messages, added `max-h-[50vh] overflow-y-auto` on conversation section
- **presentation.ts**: Shortened badge labels (Manual, Edited, Draft ready, Review, Sent, Pending), added relative timestamps (just now, Nm ago, Nh ago, yesterday, Nd ago) for items within 7 days
- **DraftReviewPanel.tsx**: Increased Send button padding to `px-8`, added vertical divider between "Not relevant" and "Send"
- **ThreadList.tsx**: Replaced `max-h-screen` with `max-h-[calc(100vh-12rem)]` for viewport-relative scroll containment
- **InboxWorkspace.tsx**: Removed stat strip (`hidden md:grid md:grid-cols-3` block), removed orphaned `Send` and `TriangleAlert` imports
- **useInbox.ts**: Fixed React dependency cycle causing double-fetch — replaced `selectedThreadId` state in callback deps with `selectedThreadIdRef`

## Validation Evidence

- Typecheck: passed
- Lint: passed (0 new errors; pre-existing warnings in StaffAccountsForm unchanged)
- Commit: `01b70ccfd4`

## Outcome Contract

- **Why:** Email body text overflows horizontally on long URLs making content unreadable. Internal jargon visible to staff. Action buttons lack hierarchy risking misclicks. Thread list and conversation area have no scroll constraints pushing content below fold. Badge labels too long. Stat display redundant. Double-fetch on mount wastes ~1.4s.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** No horizontal overflow on any email body. No internal system terms visible to staff. Outbound messages visually distinct. Send button visually dominant. Thread list and conversation scroll independently. Badge labels ≤12 chars. Redundant stat strip removed. No double-fetch on mount.
- **Source:** operator
