---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-07
Last-updated: 2026-03-07
Feature-Slug: reception-inbox-ui-polish
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-inbox-ui-polish/plan.md
Dispatch-IDs: IDEA-DISPATCH-20260307130300-9040, IDEA-DISPATCH-20260307130300-9041, IDEA-DISPATCH-20260307130300-9042, IDEA-DISPATCH-20260307130300-9043, IDEA-DISPATCH-20260307130300-9044, IDEA-DISPATCH-20260307130300-9045
Work-Package-Reason: All 6 dispatches target the same reception inbox UI surface (4 component files + 1 presentation helper). Bundling avoids 6 redundant fact-finds for overlapping file scopes.
---

# Reception Inbox UI Polish Fact-Find Brief

## Scope

### Summary

Visual audit of the reception inbox identified 9 design issues across 5 files. The inbox is a staff-facing operations tool used daily for triaging guest emails, reviewing AI-generated draft replies, and sending responses. Issues range from critical (email body horizontal overflow) to moderate (redundant stat display). All are bounded CSS/markup fixes in existing components with no architectural changes.

### Goals
- Fix horizontal overflow on long email URLs in message body
- Remove internal jargon ("Source: D1") from thread header
- Strengthen inbound/outbound message visual distinction in dark mode
- Improve action button visual hierarchy (Send prominent, destructive separated)
- Constrain thread list to independent scroll within its panel
- Shorten badge labels to reduce subject truncation
- Add conversation section height constraint
- Deduplicate stat display (shown in 3 places currently)
- Use relative timestamps for recent items

### Non-goals
- Scroll containment for the entire right detail pane (operator deferred)
- Keyboard navigation between threads (operator deferred)
- Changing inbox routing, API endpoints, or data model
- Adding new components or design system primitives

## Access Declarations

None. All changes are client-side UI in existing components.

## Evidence Audit

### Entry Points and Key Files

| File | Role | Lines of Interest |
|---|---|---|
| `apps/reception/src/components/inbox/ThreadDetailPane.tsx` | Thread detail view — messages, header, guest context | 101 (source jargon), 150-183 (conversation section), 162-166 (inbound/outbound), 176 (message body) |
| `apps/reception/src/components/inbox/ThreadList.tsx` | Thread list panel | 84 (max-h-screen), 108-112 (badge rendering) |
| `apps/reception/src/components/inbox/DraftReviewPanel.tsx` | Draft editing + action buttons | 264-329 (button layout, colors, grouping) |
| `apps/reception/src/components/inbox/InboxWorkspace.tsx` | Top-level layout — header, stat strip, panels | 152-164 (header subtitle), 183-206 (stat strip) |
| `apps/reception/src/components/inbox/presentation.ts` | Badge builder + timestamp formatter | 19-59 (buildInboxThreadBadge), 8-17 (formatInboxTimestamp) |

### Issue Evidence

**Issue 1 — Message body horizontal overflow (Critical)**
- `ThreadDetailPane.tsx:176`: `className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90"`
- `whitespace-pre-wrap` preserves newlines but does NOT break long unbroken strings (URLs). No `break-words` or `overflow-wrap` present.
- Screenshot confirms: Google Flights email URLs bleed off right edge.
- Fix: Add `break-words` to the className.

**Issue 2 — "Source: D1" internal jargon (Major)**
- `ThreadDetailPane.tsx:101`: `Source: {threadDetail.messageBodiesSource.toUpperCase()}`
- Displays "Source: D1" — meaningless to staff. This was a debug artifact from Gmail/D1 source switching.
- Fix: Remove the source display entirely, keep message count only.

**Issue 3 — Inbound/outbound message distinction (Major)**
- `ThreadDetailPane.tsx:162-166`:
  - Outbound: `ml-6 border border-primary-main/20 bg-primary-soft/50`
  - Inbound: `mr-6 border border-border-1 bg-surface-2`
- In dark mode: primary-soft is `oklch(0.298 0.0583 153.17)` at 50% opacity, surface-2 is `oklch(0.196 0.0055 173.75)`. Both read as near-identical dark cards.
- Fix: Add left border accent (`border-l-2 border-l-primary-main`) on outbound messages for clear visual differentiation.

**Issue 4 — Action button visual hierarchy (Major)**
- `DraftReviewPanel.tsx:264-329`: 5 buttons in 2 clusters, separated by `justify-between`.
  - Left: Save (`default/outline`), Regenerate (`default/outline`), Resolve (`default/outline`)
  - Right: Not relevant (`danger/outline`), Send (`success/solid`, `px-5`)
- Send already has `solid` tone and extra padding, but all buttons are `min-h-10` with same icon size. The visual weight difference is insufficient.
- "Not relevant" (destructive) sits directly adjacent to "Send" — risky for misclicks.
- Fix: Increase Send padding further, add gap or divider between Not relevant and Send.

**Issue 5 — Thread list scroll (Major)**
- `ThreadList.tsx:84`: `className="max-h-screen overflow-y-auto p-2"`
- `max-h-screen` allows the list to be the full viewport height. With 14 threads + header + stat strip above, the detail pane is pushed below the fold.
- Fix: Use `max-h-[calc(100vh-16rem)]` (approximate header+stat height) so list scrolls within its allocated space.

**Issue 6 — Badge labels too long (Moderate)**
- `presentation.ts:19-59` returns these labels:
  - `"Needs manual draft"` (18 chars)
  - `"Staff edited draft"` (17 chars)
  - `"Agent draft ready"` (16 chars)
  - `"Review later"` (12 chars)
  - `"Sent"` (4 chars)
  - `"Pending"` (7 chars)
- The 16-18 char labels consume ~40% of the thread row width, truncating subjects.
- Fix: Shorten to `"Manual"`, `"Edited"`, `"Draft ready"`, `"Review"`, `"Sent"`, `"Pending"`.

**Issue 7 — Conversation section no height constraint (Moderate)**
- `ThreadDetailPane.tsx:150-183`: Conversation section has `space-y-3 p-3` on the messages container but no max-height or overflow. Long threads push the draft panel below the fold.
- Fix: Add `max-h-[50vh] overflow-y-auto` to the messages container div.

**Issue 8 — Stat strip duplicates header subtitle (Moderate)**
- `InboxWorkspace.tsx:152-164` (header): shows `"{threads.length} active"` + optional need-draft and ready counts.
- `InboxWorkspace.tsx:183-206` (stat strip): shows same 3 numbers in a `hidden md:grid md:grid-cols-3` layout.
- `ThreadList.tsx:34-38`: shows count badge `{threads.length}` next to "THREADS" header.
- Same data in 3 places. Stat strip is desktop-only (`hidden md:grid`).
- Fix: Remove stat strip entirely. Keep counts in header subtitle (always visible) and thread list badge.

**Issue 9 — Timestamp format (Moderate)**
- `presentation.ts:8-17`: `formatInboxTimestamp` uses `toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })` → `"07/03/2026, 14:30"` (20 chars).
- For recent items, relative timestamps ("2h ago", "yesterday") would be more scannable and save horizontal space.
- Fix: Return relative format for items within 7 days, absolute for older.

### Test Landscape

No test files exist in `apps/reception/src/components/inbox/`. These components have no direct unit tests. Validation will rely on typecheck + lint + visual confirmation.

### Design System Token Context

Dark mode tokens from `packages/themes/reception/src/tokens.ts`:
- `--color-primary`: `oklch(0.753 0.2001 149.55)` (hospitality green)
- `--color-primary-soft`: `oklch(0.298 0.0583 153.17)` (dark soft green)
- `--surface-2`: `oklch(0.196 0.0055 173.75)` (very dark)
- `--surface-3`: `oklch(0.241 0.0059 173.86)` (slightly lighter)

## Confidence Inputs

- Delivery-readiness: 90% — all issues are bounded CSS/markup changes in known files with verified class strings. No architectural decisions needed.
- Implementation confidence per issue: 85-95% — each fix is 1-5 lines of CSS class changes.
- Risk: Low — all changes are presentational. No data model, API, or routing changes.

## Scope Signal

- Signal: right-sized
- Rationale: 9 issues across 5 files, all bounded CSS/markup fixes. No dependencies on external systems. Clear validation path (typecheck + lint + visual). No meaningful expansion opportunities — the operator already deferred the two larger items (scroll containment, keyboard nav).

## Outcome Contract

- **Why:** Email body text overflows horizontally on long URLs making content unreadable. Internal jargon visible to staff. Action buttons lack hierarchy risking misclicks. Thread list and conversation area have no scroll constraints pushing content below fold. Badge labels too long. Stat display redundant.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** No horizontal overflow on any email body. No internal system terms visible to staff. Outbound messages visually distinct. Send button visually dominant. Thread list and conversation scroll independently. Badge labels ≤12 chars. Stats shown in one place only.
- **Source:** operator

## Open Questions

None. All issues have clear evidence and clear fixes.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| ThreadDetailPane message body | Yes | None | No |
| ThreadDetailPane source display | Yes | None | No |
| ThreadDetailPane inbound/outbound styling | Yes | None | No |
| ThreadDetailPane conversation scroll | Yes | None | No |
| ThreadList scroll + badges | Yes | None | No |
| DraftReviewPanel button hierarchy | Yes | None | No |
| InboxWorkspace stat strip | Yes | None | No |
| presentation.ts timestamps | Yes | None | No |
| Design system tokens | Yes | None | No |

## Evidence Gap Review

### Gaps Addressed
- All 9 issues verified with exact line numbers, class strings, and token values from source code
- Dark mode token contrast verified from `packages/themes/reception/src/tokens.ts`
- Badge labels enumerated from `presentation.ts:19-59`
- Stat display locations traced across 3 files

### Confidence Adjustments
- None required. Evidence is complete for all issues.

### Remaining Assumptions
- Visual confirmation of fixes will be done post-deploy (no automated visual regression tests exist for inbox components)
