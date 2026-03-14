---
Type: Pattern-Reflection
Feature-Slug: reception-roomgrid-occupancy-strip
Date: 2026-03-14
---

# Pattern Reflection — Rooms-Grid Occupancy Strip

## What worked well

**Props-driven leaf component pattern**: Keeping `OccupancyStrip` as a pure props-driven component (`occupiedCount`, `totalRooms`) and extracting the count logic into a separately-exported `computeOccupancyCount` function made the component trivially testable. The unit tests for the count logic require no React or DOM setup.

**Existing hook data was sufficient**: All booking data needed for the count was already loaded by `useGridData`. This avoided the temptation to introduce a new Firebase subscription, keeping the feature zero-cost in terms of network usage.

**Insertion point was clean**: The gap between `<StatusLegend />` and `<DndProvider>` was the right place — the strip sits outside the drag-and-drop context (it's non-interactive), doesn't interfere with the room grid layout, and follows the visual hierarchy naturally.

## What to carry forward as a pattern

When adding derived summary displays to data-rich pages:
1. Check whether existing hooks already expose the needed data before introducing new subscriptions.
2. Extract computation to a pure exported function — it's cheaper to test and documents the business rule precisely.
3. Gate derived displays on the same loading/error state as the parent to avoid flicker or misleading counts.
