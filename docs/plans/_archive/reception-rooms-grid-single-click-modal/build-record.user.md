---
Type: Build-Record
Feature-Slug: reception-rooms-grid-single-click-modal
Business: BRIK
Dispatch-ID: IDEA-DISPATCH-20260313140000-0002
Build-Date: 2026-03-13
Execution-Track: code
---

# Rooms Grid Single-Click Modal — Build Record

## Outcome Contract
- **Why:** Staff had to click a room cell twice within 400ms to open the booking detail. The first click was discarded by a double-click guard that existed to prevent accidental drag-and-drop triggers — but drag-and-drop is not enabled on this screen, making the guard unnecessary.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A single click on any room cell opens the booking detail modal immediately. The 400ms double-click guard is removed.
- **Source:** operator

## What Was Done

Removed the `lastClick` state variable and the `now - lastClick > 400` early-return check from `RoomGrid.onClickCell`. The callback now opens the modal on every click. Also removed `lastClick` from the `useCallback` dependency array.

Updated `RoomGrid.test.tsx`: changed three `userEvent.dblClick` calls to `userEvent.click` and renamed the test description from "double click" to "single click" to match the new behaviour.

## Engineering Coverage Evidence

| Area | Status |
|---|---|
| TypeScript (`pnpm --filter @apps/reception typecheck`) | ✅ pass |
| Lint (`eslint` on changed files) | ✅ pass |
| Test update | ✅ 3 dblClick → click; test description updated |

## Workflow Telemetry Summary

- Stage: lp-do-build
- Module: modules/build-code.md
- Context input bytes: 34724
- Deterministic checks: 1 (validate-engineering-coverage.sh — skipped/valid for micro-build)
