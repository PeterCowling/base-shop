---
Type: Results-Review
Status: Complete
Feature-Slug: reception-roomgrid-today-movements
Completed: 2026-03-14
---

# Today's Movements Summary — Results Review

## What was delivered

The rooms-grid page now shows which guests are checking in and checking out today. When the visible date window includes today, a new panel appears below the occupancy count:

- **Arriving today** — lists each guest's room number and name for check-ins on today's date.
- **Departing today** — lists each guest's room number and name for check-outs on today's date.
- If both lists are empty, a single "No movements today" message is shown.
- If today is outside the visible date window (staff scrolled the grid away), the panel is hidden — the same behaviour as the occupancy count.

## How to verify

Open the rooms-grid page in the reception app. With today's date visible in the grid window, the "Today's Movements" panel appears immediately below the occupancy strip. Room numbers and guest names are listed for each arriving and departing guest.

## Outcome against intent

The intended outcome was: staff no longer need to scan each room's timeline individually to identify today's arrivals and departures.

The panel delivers this directly: arrivals and departures are surfaced as a flat named list on load, without any interaction required.

## What is not yet done

- The panel does not persist when staff scroll the grid away from today — this is an accepted design decision (contextual overlay, consistent with OccupancyStrip).
- No edit or action capability — read-only display only, as specified.
