---
Type: Pattern-Reflection
Status: Complete
Feature-Slug: reception-roomgrid-today-movements
Completed: 2026-03-14
---

# Today's Movements Summary — Pattern Reflection

## What worked well

**Derive-from-existing-hook pattern.** The approach of computing arrivals/departures in `RoomsGrid` using `getReservationDataForRoom` — the same seam used by `computeOccupancyCount` in `OccupancyStrip` — was the right call. Zero new data fetching, zero new loading states, minimal blast radius.

**Pure display component with typed props.** Keeping `TodayMovements` as a prop-only component (no hooks inside) made testing straightforward: pass fixture arrays, assert rendered text. The `OccupancyStrip` pattern proved a reliable template.

**`occupantId` as stable React key.** Including `occupantId` in `TodayMovementEntry` — flagged by the critique — prevents lossy rendering when guest names collide or are absent. The critique loop correctly caught this before build.

**Critique loop caught two real design gaps.** Round 1 correctly identified the missing prop contract and the internal test-strategy inconsistency. Fixing both before build produced a cleaner implementation. The three-round critique was worth the time: codemoot found substantive issues each round.

## What to carry forward

**Explicit seam documentation for hook API boundaries.** When a new display component needs data from a hook that does not expose `allData` directly, document the exact compute-and-pass pattern in the fact-find's Data & Contracts section before analysis. This avoids the Round 1 critique flag.

**`TodayMovementEntry` type export pattern.** Exporting the entry type alongside the default component (`TodayMovements, { type TodayMovementEntry }`) worked cleanly for both `RoomsGrid.tsx` usage and test file import. Use this pattern for future prop-type exports from display components.

**`Set<occupantId>` deduplication for packed rows.** The pattern of using a `Set` to deduplicate by `occupantId` when flat-mapping periods across packed rows is worth reusing in any future component that aggregates across `getReservationDataForRoom`.
