---
Type: Results-Review
Feature-Slug: reception-roomgrid-occupancy-strip
Status: Complete
Date: 2026-03-14
---

# Rooms-Grid Occupancy Strip — Results Review

## What was delivered

Staff can now see an at-a-glance count of how many rooms are occupied tonight directly on the rooms-grid page. The strip shows "Occupied tonight: X / 10 rooms" and requires no manual counting.

## What success looks like

- The strip appears below the status legend on the rooms-grid page when viewing a date range that includes today
- The count is accurate: rooms with active guests (any status except "free", "disabled", or "bags picked up") are counted
- The strip disappears when the date window doesn't include today — no misleading numbers when browsing historical or future dates
- No extra page load time: the count is computed from booking data that was already being fetched

## What to watch for

- The count updates as the grid loads. During the brief loading period, the strip is hidden (same as the grid itself).
- If all rooms happen to show "bags picked up" (status 16) for tonight, the count will correctly show 0.
- The strip shows rooms, not beds. A 6-bed dormitory counts as 1 room whether 1 or 6 beds are occupied.

## Rollback

If the strip causes any issues: `git revert d3883fbf4c` and redeploy.
