---
Type: Plan
Status: Active
Domain: Platform
Workstream: Engineering
Created: 2026-03-07
Last-reviewed: 2026-03-07
Last-updated: 2026-03-07
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-inbox-ui-polish
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception Inbox UI Polish Plan

## Summary

Fix 9 visual/UX issues across 5 files in the reception inbox. All changes are bounded CSS/markup edits in existing components — no architectural changes, no API changes, no new components. Issues range from critical (email body horizontal overflow) to moderate (redundant stat display, timestamp format). Grouped into 5 tasks by file to enable full parallel execution.

## Active tasks
- [ ] TASK-01: ThreadDetailPane — overflow, jargon, outbound accent, conversation scroll
- [ ] TASK-02: presentation.ts — shorter badges, relative timestamps
- [ ] TASK-03: DraftReviewPanel — button visual hierarchy
- [ ] TASK-04: ThreadList — scroll constraint
- [ ] TASK-05: InboxWorkspace — remove duplicate stat strip

## Goals
- Fix horizontal overflow on long email URLs in message body
- Remove internal jargon ("Source: D1") from thread header
- Strengthen inbound/outbound message visual distinction in dark mode
- Improve action button visual hierarchy (Send prominent, destructive separated)
- Constrain thread list to independent scroll within its panel
- Shorten badge labels to reduce subject truncation
- Add conversation section height constraint
- Deduplicate stat display (shown in 3 places currently)
- Use relative timestamps for recent items

## Non-goals
- Scroll containment for the entire right detail pane (operator deferred)
- Keyboard navigation between threads (operator deferred)
- Changing inbox routing, API endpoints, or data model
- Adding new components or design system primitives

## Constraints & Assumptions
- Constraints:
  - All changes must use existing design system tokens — no arbitrary hex/px values
  - No test files exist for inbox components; validation is typecheck + lint + visual
- Assumptions:
  - `break-words` Tailwind utility maps to `overflow-wrap: break-word` (verified in Tailwind docs)
  - Relative timestamp logic can use simple date arithmetic without external libraries

## Inherited Outcome Contract

- **Why:** Email body text overflows horizontally on long URLs making content unreadable. Internal jargon visible to staff. Action buttons lack hierarchy risking misclicks. Thread list and conversation area have no scroll constraints pushing content below fold. Badge labels too long. Stat display redundant.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** No horizontal overflow on any email body. No internal system terms visible to staff. Outbound messages visually distinct. Send button visually dominant. Thread list and conversation scroll independently. Badge labels ≤12 chars. Redundant stat strip removed (stats remain in header subtitle + thread list badge).
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/reception-inbox-ui-polish/fact-find.md`
- Key findings used:
  - 9 issues verified with exact line numbers and CSS class strings
  - Dark mode token values confirmed from `packages/themes/reception/src/tokens.ts`
  - No test coverage for inbox components — validation via typecheck + lint

## Proposed Approach
- Option A: One task per issue (9 tasks) — maximum granularity but excessive overhead for S-effort CSS edits
- Option B: Group by file (5 tasks) — natural boundaries, enables full parallelism, one commit per file
- Chosen approach: Option B — group by file. All 5 tasks are independent and can execute as a single wave.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---:|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | ThreadDetailPane: overflow, jargon removal, outbound accent, conversation scroll | 90% | S | Pending | - | - |
| TASK-02 | IMPLEMENT | presentation.ts: shorter badge labels, relative timestamps | 90% | S | Pending | - | - |
| TASK-03 | IMPLEMENT | DraftReviewPanel: button visual hierarchy | 90% | S | Pending | - | - |
| TASK-04 | IMPLEMENT | ThreadList: scroll constraint | 85% | S | Pending | - | - |
| TASK-05 | IMPLEMENT | InboxWorkspace: remove duplicate stat strip | 90% | S | Pending | - | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03, TASK-04, TASK-05 | - | All tasks touch different files. TASK-04 height offset is conservative and works with or without TASK-05 stat strip removal. |

## Tasks

### TASK-01: ThreadDetailPane — overflow, jargon, outbound accent, conversation scroll
- **Type:** IMPLEMENT
- **Deliverable:** CSS/markup changes in ThreadDetailPane.tsx
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/components/inbox/ThreadDetailPane.tsx`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — exact line numbers and class strings verified; each change is 1-3 class additions/removals
  - Approach: 90% — standard Tailwind utilities; `break-words` and `overflow-y-auto` are well-documented
  - Impact: 90% — overflow fix is critical for readability; jargon removal improves staff UX; outbound accent improves dark mode distinction
- **Acceptance:**
  - [ ] Long URLs in email body wrap within container (no horizontal overflow)
  - [ ] "Source: D1" text no longer visible in thread header
  - [ ] Outbound messages have a visible left border accent (`border-l-2 border-l-primary-main`)
  - [ ] Conversation section has `max-h-[50vh] overflow-y-auto` — long threads scroll independently
  - Expected user-observable behavior:
    - [ ] Staff see email bodies with long URLs wrapping correctly, not bleeding off-screen
    - [ ] Thread header shows only message count, no "Source: D1" jargon
    - [ ] Outbound messages are visually distinct from inbound in dark mode via green left border
    - [ ] Long conversations scroll within their section without pushing draft panel below fold
- **Validation contract (TC-01):**
  - TC-01: Email body with 200-char unbroken URL -> text wraps within container
  - TC-02: Thread header displays "{N} message(s)" only, no "Source:" text
  - TC-03: Outbound message has `border-l-2 border-l-primary-main` classes
  - TC-04: Messages container div has `max-h-[50vh] overflow-y-auto`
  - TC-05: typecheck passes, lint passes
- **Execution plan:**
  - Line 176: Add `break-words` to message body className
  - Lines 98-101: Remove `{" · "} Source: {threadDetail.messageBodiesSource.toUpperCase()}` from subtitle
  - Lines 162-164: Add `border-l-2 border-l-primary-main` to outbound message className
  - Line 156: Add `max-h-[50vh] overflow-y-auto` to messages container div
- **Planning validation (required for M/L):** None: S-effort
- **Scouts:** None: all class names verified in source
- **Edge Cases & Hardening:**
  - Edge case: empty message body — `break-words` has no effect on empty/short text, safe
  - Edge case: single message thread — conversation scroll has no visible effect, safe
- **What would make this >=90%:** Already at 90%. Would reach 95% with automated visual regression tests.
- **Rollout / rollback:**
  - Rollout: Deploy via wrangler after typecheck+lint pass
  - Rollback: Revert commit (CSS-only changes, no data impact)
- **Documentation impact:** None
- **Notes / references:** Fact-find Issues 1, 2, 3, 7

### TASK-02: presentation.ts — shorter badge labels, relative timestamps
- **Type:** IMPLEMENT
- **Deliverable:** Logic changes in presentation.ts
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/components/inbox/presentation.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% — badge label changes are string replacements; timestamp logic requires simple date arithmetic
  - Approach: 90% — relative timestamps use `Date.now() - date.getTime()` with threshold checks; no external library needed
  - Impact: 90% — shorter badges reduce subject truncation; relative timestamps improve scannability
- **Acceptance:**
  - [ ] Badge labels shortened: "Manual", "Edited", "Draft ready", "Review", "Sent", "Pending"
  - [ ] All badge labels ≤12 characters
  - [ ] Timestamps within 7 days show relative format ("2h ago", "yesterday", "3d ago")
  - [ ] Timestamps older than 7 days show absolute format (existing behavior)
  - Expected user-observable behavior:
    - [ ] Thread list shows shorter badge labels, leaving more room for email subjects
    - [ ] Recent threads show "2h ago" or "yesterday" instead of full date strings
- **Validation contract (TC-02):**
  - TC-01: `buildInboxThreadBadge` returns labels matching shortened set
  - TC-02: No badge label exceeds 12 characters
  - TC-03: `formatInboxTimestamp` with ISO string 1 hour ago -> returns "1h ago"
  - TC-04: `formatInboxTimestamp` with ISO string 25 hours ago -> returns "yesterday"
  - TC-05: `formatInboxTimestamp` with ISO string 3 days ago -> returns "3d ago"
  - TC-06: `formatInboxTimestamp` with ISO string 8 days ago -> returns absolute date format
  - TC-07: `formatInboxTimestamp` with null -> returns "Unknown"
  - TC-08: typecheck passes, lint passes
- **Execution plan:**
  - Lines 22, 29, 36, 50, 56: Replace badge label strings with shortened versions
  - Lines 8-17: Rewrite `formatInboxTimestamp` to compute relative time for dates within 7 days
- **Planning validation (required for M/L):** None: S-effort
- **Scouts:** None: function signatures unchanged, all consumers safe
- **Edge Cases & Hardening:**
  - Edge case: timestamp exactly at 7-day boundary — use `>=` for absolute format at 7d
  - Edge case: future timestamps — treat as "just now" or fall through to absolute
  - Edge case: null/undefined input — existing "Unknown" guard preserved
- **What would make this >=90%:** Already at 90%. Would reach 95% with unit tests for timestamp edge cases.
- **Rollout / rollback:**
  - Rollout: Deploy via wrangler after typecheck+lint pass
  - Rollback: Revert commit
- **Documentation impact:** None
- **Notes / references:** Fact-find Issues 6, 9. `formatInboxTimestamp` is consumed by ThreadDetailPane (line 173) and ThreadList (line 119 area) — signature unchanged, only output format changes.

### TASK-03: DraftReviewPanel — button visual hierarchy
- **Type:** IMPLEMENT
- **Deliverable:** CSS/markup changes in DraftReviewPanel.tsx
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/components/inbox/DraftReviewPanel.tsx`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% — class changes to existing Button components; adding a divider element between destructive and primary
  - Approach: 90% — standard pattern: increase Send padding, add visual separator
  - Impact: 90% — reduces misclick risk between destructive "Not relevant" and primary "Send"
- **Acceptance:**
  - [ ] Send button has increased padding (`px-8`) and larger text weight for visual dominance
  - [ ] Visual separator (gap or `border-l`) between "Not relevant" and "Send" buttons
  - [ ] No other button styling changes
  - Expected user-observable behavior:
    - [ ] Send button is clearly the most prominent action
    - [ ] "Not relevant" (destructive) is visually separated from Send to prevent misclicks
- **Validation contract (TC-03):**
  - TC-01: Send button has `px-8` class (was `px-5`)
  - TC-02: Gap or divider exists between "Not relevant" and "Send" buttons
  - TC-03: All other buttons unchanged (Save, Regenerate, Resolve)
  - TC-04: typecheck passes, lint passes
- **Execution plan:**
  - Line 323: Change `px-5` to `px-8` on Send button
  - Lines 304-327: Add `gap-3` to right Cluster and insert a visual divider (`div` with `border-l border-border-1 h-8`) between the two buttons
- **Planning validation (required for M/L):** None: S-effort
- **Scouts:** None: Button component props verified
- **Edge Cases & Hardening:**
  - Edge case: mobile wrap — `flex-wrap` already present on parent; buttons will stack cleanly
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:**
  - Rollout: Deploy via wrangler after typecheck+lint pass
  - Rollback: Revert commit
- **Documentation impact:** None
- **Notes / references:** Fact-find Issue 4

### TASK-04: ThreadList — scroll constraint
- **Type:** IMPLEMENT
- **Deliverable:** CSS changes in ThreadList.tsx
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/components/inbox/ThreadList.tsx`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — `calc(100vh - Xrem)` depends on accurate header+stat height estimation; may need visual tuning
  - Approach: 90% — standard CSS scroll containment pattern
  - Impact: 85% — scroll constraint keeps detail pane visible without scrolling page
- **Acceptance:**
  - [ ] Thread list scrolls independently within its panel
  - [ ] Thread list does not push detail pane below the fold
  - [ ] Thread list height adapts to viewport minus header/controls
  - Expected user-observable behavior:
    - [ ] With 14+ threads, the list scrolls within its section; the right detail pane stays visible
- **Validation contract (TC-04):**
  - TC-01: Thread list container has `max-h-[calc(100vh-12rem)]` (or similar viewport-relative constraint) instead of `max-h-screen`
  - TC-02: `overflow-y-auto` is still present
  - TC-03: typecheck passes, lint passes
- **Execution plan:**
  - Line 84: Replace `max-h-screen` with `max-h-[calc(100vh-12rem)]`
  - Note: 12rem accounts for header (~4rem) + controls (~4rem) + padding (~4rem). Stat strip is being removed in TASK-05, which frees ~4rem — but since tasks are parallel and stat strip removal is `hidden md:grid` (desktop-only), use 12rem as conservative estimate.
- **Planning validation (required for M/L):** None: S-effort
- **Scouts:** None: single class change
- **Edge Cases & Hardening:**
  - Edge case: very short viewport (mobile) — `calc(100vh-12rem)` could be very small; but ThreadList is already hidden on mobile when viewing detail (`mobileShowDetail` toggle in InboxWorkspace)
  - Edge case: stat strip removed (TASK-05) — gives more space; 12rem is conservative and will still work
- **What would make this >=90%:** Visual verification after deploy that the height value is correct for the actual header heights. Held-back test for 85%: if header height changes or stat strip removal shifts layout, the 12rem offset might need adjustment — but 12rem is conservative enough that this is unlikely to break.
- **Rollout / rollback:**
  - Rollout: Deploy via wrangler after typecheck+lint pass
  - Rollback: Revert commit
- **Documentation impact:** None
- **Notes / references:** Fact-find Issue 5. Using 12rem instead of fact-find's suggested 16rem because TASK-05 removes the stat strip (saves ~4rem).

### TASK-05: InboxWorkspace — remove duplicate stat strip
- **Type:** IMPLEMENT
- **Deliverable:** Markup removal in InboxWorkspace.tsx
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/components/inbox/InboxWorkspace.tsx`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — straightforward deletion of a `div` block (lines 183-206)
  - Approach: 90% — header subtitle already shows the same counts; stat strip is redundant
  - Impact: 85% — reduces visual clutter; one fewer place to maintain stat display
- **Acceptance:**
  - [ ] Stat strip (lines 183-206) is removed entirely
  - [ ] Header subtitle still shows active count, need-draft count, and ready count
  - [ ] ThreadList badge still shows thread count
  - [ ] No visual gap where stat strip was
  - Expected user-observable behavior:
    - [ ] On desktop, the 3-card stat strip below the header is gone
    - [ ] Active/need-draft/ready counts remain visible in the header subtitle
- **Validation contract (TC-05):**
  - TC-01: No `md:grid md:grid-cols-3` stat strip markup in InboxWorkspace
  - TC-02: Header subtitle still renders thread count, manualDraftCount, readyToSendCount
  - TC-03: Unused imports (if any) removed — check if `TriangleAlert` and `Send` are still used elsewhere
  - TC-04: typecheck passes, lint passes
- **Execution plan:**
  - Lines 183-206: Delete the entire stat strip `div` block
  - Check: `TriangleAlert` icon is imported at top — verify if it's used elsewhere in the file; remove import if orphaned
  - Check: `Send` icon — verify if used elsewhere; remove import if orphaned
- **Planning validation (required for M/L):** None: S-effort
- **Scouts:** None: deletion of self-contained UI block
- **Edge Cases & Hardening:**
  - Edge case: `manualDraftCount` and `readyToSendCount` variables — still used by header subtitle (lines 152-163), so the computed values must remain
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:**
  - Rollout: Deploy via wrangler after typecheck+lint pass
  - Rollback: Revert commit
- **Documentation impact:** None
- **Notes / references:** Fact-find Issue 8. Stat data shown in 3 places → reduced to 2 (header subtitle + thread list badge).

## Risks & Mitigations
- **Risk:** `calc(100vh-12rem)` height in TASK-04 might not perfectly match actual header height. **Mitigation:** 12rem is conservative; visual verification post-deploy. Easy to adjust via single class change.
- **Risk:** Badge label shortening in TASK-02 loses context for staff unfamiliar with the tool. **Mitigation:** Labels like "Draft ready" and "Manual" are still self-explanatory in context; tooltip could be added later if needed.

## Observability
- Logging: None: presentational changes only
- Metrics: None: no new data flows
- Alerts/Dashboards: None

## Acceptance Criteria (overall)
- [ ] No horizontal overflow on email bodies with long URLs
- [ ] No "Source: D1" jargon visible to staff
- [ ] Outbound messages visually distinct from inbound in dark mode
- [ ] Send button clearly most prominent action
- [ ] Thread list scrolls independently within its panel
- [ ] All badge labels ≤12 characters
- [ ] Conversation section scrolls independently
- [ ] Redundant stat strip removed (counts remain in header subtitle + thread list badge)
- [ ] Recent timestamps show relative format
- [ ] typecheck + lint pass

## Decision Log
- 2026-03-07: Grouped 9 issues into 5 tasks by file for full parallelism. No DECISION tasks needed — all fixes have clear evidence and approach.
- 2026-03-07: Used 12rem instead of 16rem for thread list height offset since TASK-05 removes stat strip.

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: ThreadDetailPane fixes | Yes | None | No |
| TASK-02: presentation.ts fixes | Yes | None | No |
| TASK-03: DraftReviewPanel buttons | Yes | None | No |
| TASK-04: ThreadList scroll | Yes | None | No |
| TASK-05: InboxWorkspace stat strip | Yes | None | No |

## Overall-confidence Calculation
- All tasks S-effort (weight=1): (90+90+90+85+90) / 5 = 89% → rounded to 90%
