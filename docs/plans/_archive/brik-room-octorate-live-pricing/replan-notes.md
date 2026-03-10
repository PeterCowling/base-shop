---
Replan-round: 1
Replan-date: 2026-02-27
Replan-trigger: approach-change — live Octobook HTML-scraping proxy replaces paid Octorate Connect API
---

# Replan Notes — brik-room-octorate-live-pricing

## Round 1 (2026-02-27)

### Trigger

All tasks in sibling plan `brik-octorate-live-availability` are now **Complete**. The paid Octorate Connect API has been abandoned; the public Octobook `result.xhtml` HTML-scraping proxy is live at `/api/availability`. All blocking dependencies for TASK-RPC, TASK-RPR, and TASK-RD-TEST are resolved.

### Evidence Gathered

| Artefact | Evidence level | Finding |
|---|---|---|
| `apps/brikette/src/app/api/availability/route.ts` | E3 (code) | Route is live. Exports `OctorateRoom` and `AvailabilityRouteResponse`. Returns `{ rooms: OctorateRoom[], fetchedAt }`. No auth required. 5-min revalidate cache. |
| `apps/brikette/src/hooks/useAvailability.ts` | E3 (code) | Existing hook re-exports `OctorateRoom` from the route. 300ms debounce, AbortController cleanup. Already wired in `BookPageContent`. |
| `apps/brikette/src/components/rooms/RoomCard.tsx:49` | E3 (code) | `availabilityRoom?: OctorateRoom` prop **already exists** (added by sibling plan TASK-04). Prop name is `availabilityRoom`, not `availabilityResult` as originally planned. TASK-RPR only needs to wire the hook call in `RoomDetailContent`. |
| `apps/brikette/src/components/rooms/RoomsSection.tsx:56` | E3 (code) | Established matching pattern: `r.widgetRoomCode === avRoom.octorateRoomName`. This is the canonical approach for the book page. |
| `apps/brikette/src/data/roomsData.ts` | E3 (code) | `widgetRoomCode` values are numeric strings: "7", "3", "4", "5", "6", "8", "9", "10", "11", "12". `widgetRoomCode: "TODO"` for apartment (out of scope). |
| `apps/brikette/src/locales/en/roomsPage.json:69` | E3 (code) | `"soldOut": "Sold out"` already present. All locales confirmed via sibling plan. TASK-RPR acceptance criterion for adding this key is already satisfied. |
| `apps/brikette/src/hooks/useAvailabilityForRoom.ts` | E3 (code) | File does **not** exist. Must be created in TASK-RPC. |

### Critical Scout Finding — Room Matching

**Risk:** `widgetRoomCode` is a numeric string ("7", "10", etc.) in `roomsData.ts`. The route parser extracts `<h1>` text content as `octorateRoomName`. Per the original live investigation, the Octobook `<h1>` text is a generic room type name (e.g., "Dorm", "Double", "Apartment").

**Implication:** `r.widgetRoomCode === avRoom.octorateRoomName` compares "7" to "Dorm" — no match. The sibling plan's `RoomsSection.tsx` matching code may be broken for live data (untested since feature flag is off).

**Two valid resolutions (TASK-RPC must scout which applies):**
1. Octorate `<h1>` actually returns numeric room codes (e.g., "7"), making widgetRoomCode match. Verify by checking actual Octorate HTML.
2. Add an `octorateRoomName?: string` field to `Room` interface in `roomsData.ts` (e.g., `"Dorm"`, `"Double"`) for explicit matching. Both `useAvailabilityForRoom` and `RoomsSection.tsx` would use this field. This would also fix the book page matching.

**Action:** TASK-RPC scout must resolve this before the Green step. If resolution 2 is needed, it is a 2-line data change in `roomsData.ts` + 1-line change in `RoomsSection.tsx` — scope is within TASK-RPC M effort.

### Task Delta Summary

| Task | Previous status | New status | Confidence change | Rationale |
|---|---|---|---|---|
| TASK-RATES-REFRESH | Blocked | **Complete** (superseded) | 90% → n/a | Live proxy makes rates.json refresh obsolete |
| TASK-CP2 | Pending | **Complete** (resolved by this replan) | 95% → n/a | All horizon assumptions confirmed with E3 evidence |
| TASK-RPC | Pending (blocked) | **Ready** | 80% → **85%** | API contract confirmed, `OctorateRoom` type available, debounce pattern established; held-back is matching scout |
| TASK-RPR | Pending (blocked) | **Ready** | 80% → **85%** | `availabilityRoom` prop exists, `rooms.soldOut` key exists; only wiring hook call remains |
| TASK-RD-TEST | Pending (blocked) | **Ready** | 82% → **85%** | All surfaces confirmed; test patterns from sibling plan directly applicable |

### Promotion Gate Check

- TASK-RPC: 80% → 85%. Gate requires E2+ for promotion. Evidence is E3 (code-level). **Gate passes.**
- TASK-RPR: 80% → 85%. Evidence is E3 (code-level). **Gate passes.**
- TASK-RD-TEST: 82% → 85%. Evidence is E3 (code-level). **Gate passes.**

### Validation Gate Check

All three pending tasks had complete validation contracts before this replan. Contracts remain valid; no changes to TC codes. **Gate passes.**

### Precursor Gate Check

The matching uncertainty (widgetRoomCode vs octorateRoomName text) is a scout task within TASK-RPC's Red step — not a standalone INVESTIGATE/SPIKE precursor. Effort is bounded (2-line data change if needed). Within M effort. **No precursor task required.**

### Sequencing Gate

Topology changed: TASK-RATES-REFRESH and TASK-CP2 marked Complete → removed from active task flow. Remaining tasks: TASK-RPC → TASK-RPR → TASK-RD-TEST. Dependency chain unchanged. `/lp-do-sequence` not required (no new tasks added, no dependency changes).

### Overall Confidence Recalculation

Active tasks remaining:
- TASK-RPC: 85%, M (weight 2)
- TASK-RPR: 85%, M (weight 2)
- TASK-RD-TEST: 85%, M (weight 2)

Sum: (85*2 + 85*2 + 85*2) / 6 = 85%
Set to **85%** in frontmatter.
