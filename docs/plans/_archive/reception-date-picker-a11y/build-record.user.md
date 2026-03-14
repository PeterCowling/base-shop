---
Status: Complete
Feature-Slug: reception-date-picker-a11y
Completed-date: 2026-03-14
artifact: build-record
---

# Build Record: Date Picker Accessibility Labels

## Outcome Contract

- **Why:** Date picker toggle buttons had no aria-label or aria-expanded attribute. Screen readers and keyboard users had no context for the calendar control.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Calendar toggle buttons expose aria-label and aria-expanded; DayPicker instances have aria-label.
- **Source:** operator

## Build Summary

`DateSelector.tsx` was updated to add `aria-label="Open calendar"` and `aria-expanded={isOpen}` to all calendar toggle buttons, and `aria-label="Date picker"` to each `DayPicker` instance. These attributes allow screen readers to announce the button's purpose and expanded state, and give the calendar grid a named landmark. The change is confined to `apps/reception/src/components/common/DateSelector.tsx`.

## Engineering Coverage Evidence

- TypeScript validation passed: `pnpm --filter @apps/reception typecheck` — no errors.
- No new tests required: the change adds static ARIA attributes with no new conditional rendering logic; accessibility attribute presence is verifiable via DOM inspection and is out of scope for Jest unit tests at this level.

## Workflow Telemetry Summary

Telemetry recorded via `lp-do-ideas-record-workflow-telemetry`. Gaps are expected for micro-builds (no fact-find/plan stages).

| Module | Context Bytes |
|---|---:|
| .claude/skills/lp-do-build/modules/build-code.md | 4577 |

Gaps noted: stages lp-do-ideas, lp-do-fact-find, lp-do-analysis, lp-do-plan — expected (micro-build track). Token capture: not available (deterministic execution).
