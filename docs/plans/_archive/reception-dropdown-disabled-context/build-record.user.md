---
Status: Complete
Feature-Slug: reception-dropdown-disabled-context
Completed-date: 2026-03-14
artifact: build-record
---

# Build Record: Disabled Dropdown Context Tooltip

## Outcome Contract

- **Why:** Shift-gated action items showed no explanation when disabled. Staff didn't know they needed to open a shift first.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Disabled dropdown items show a tooltip "Open a shift first" on hover/focus.
- **Source:** operator

## Build Summary

An optional `disabledReason` field was added to the `DropdownOption` type in `ActionDropdown.tsx` and rendered as a native HTML `title` attribute on disabled list items. `ActionButtons.tsx` was updated to pass `disabledReason: "Open a shift first"` for Cash and Keycards options that are gated on `!shiftOpenTime`. The native `title` tooltip approach requires no additional library and works across keyboard and pointer interactions.

## Engineering Coverage Evidence

- TypeScript validation passed: `pnpm --filter @apps/reception typecheck` — no errors.
- No new tests required: the change adds an optional prop and a `title` attribute render — no new logic branches, conditional data paths, or async operations introduced.

## Workflow Telemetry Summary

Telemetry recorded via `lp-do-ideas-record-workflow-telemetry`. Gaps are expected for micro-builds (no fact-find/plan stages).

| Module | Context Bytes |
|---|---:|
| .claude/skills/lp-do-build/modules/build-code.md | 4577 |

Gaps noted: stages lp-do-ideas, lp-do-fact-find, lp-do-analysis, lp-do-plan — expected (micro-build track). Token capture: not available (deterministic execution).
