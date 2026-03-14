---
Type: Build-Record
Feature-Slug: reception-rooms-grid-empty-state
Business: BRIK
Dispatch-ID: IDEA-DISPATCH-20260313140000-0003
Build-Date: 2026-03-13
Execution-Track: code
---

# Rooms Grid Empty State — Build Record

## Outcome Contract
- **Why:** When a room had no bookings in the system, its grid row was completely blank — no message, no placeholder. Staff could not tell whether the room was genuinely empty or whether something had failed to load.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Rooms with no bookings show a clear "No bookings" message in their grid row instead of a blank space.
- **Source:** operator

## What Was Done

In `Grid.tsx`:
- Added `TableCell` and `TableRow` to the `@acme/design-system` imports.
- Wrapped `TableBody` content in a conditional: when `data.length === 0`, render a single `TableRow` with a full-width `TableCell` containing "No bookings" (italic, muted, centered); otherwise render the normal row map.

In `GridComponents.test.tsx`:
- Added a new test "renders No bookings message when data is empty" that renders `Grid` with `data={[]}` and asserts `screen.getByText("No bookings")` is present and the header still renders.

## Engineering Coverage Evidence

| Area | Status |
|---|---|
| TypeScript (`pnpm --filter @apps/reception typecheck`) | ✅ pass |
| Lint (`eslint` on changed files) | ✅ pass |
| New test for empty state | ✅ added to GridComponents.test.tsx |

## Workflow Telemetry Summary

- Stage: lp-do-build
- Module: modules/build-code.md
- Context input bytes: 34478
- Deterministic checks: 1 (validate-engineering-coverage.sh — skipped/valid for micro-build)
