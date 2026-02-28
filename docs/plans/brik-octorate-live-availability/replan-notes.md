---
Replan-round: 1
---

# Replan Notes — brik-octorate-live-availability

---

## Replan-1: Approach change — replace Octorate Connect API with public HTML-scraping (2026-02-27)

### Trigger

Operator decision: the Octorate Connect API (paid partner portal, OAuth credentials, ARI calendar endpoint at `api.octorate.com`) costs several thousand euros. Operator does not want to use it. The plan was blocked on TASK-00 (credentials not provisioned).

### Confirmed Alternative Approach

The public Octobook booking engine at `https://book.octorate.com/octobook/site/reservation/` exposes two public HTML endpoints:

- `calendar.xhtml?codice=45111` — availability calendar
- `result.xhtml?codice=45111&date=CHECKIN&checkin=CHECKIN&checkout=CHECKOUT&pax=N&adulti=N&lang=EN` — room results with live pricing

**E2 evidence (live browser investigation — operator-confirmed):**
- No JSON/XHR API exists — JSF/PrimeFaces server-rendered app. All pricing is in the initial HTML response.
- CORS: `access-control-allow-origin: *` — proxy server-side regardless for caching.
- Session cookie NOT required — fresh GET with full query string returns full results on first request.
- `result.xhtml` renders one `<section class="room animatedParent animateOnce">` per room.
- Room name in `<h1 class="animated fadeInDownShort" data-id="N">Dorm</h1>`.
- Price in `<div class="offert">` — format: `Price from €189 ,98 Tourist Tax 5.00 EUR 2 Nights 1 Adult`.
  - Space before decimal comma: `189 ,98` = €189.98 (total for stay).
  - Per-night = priceFrom / nights.
- Sold-out rooms show: `Not available No availability`.
- Rate plans in `<h4>` elements in options `<div>` in each room section.
- `pax=1` for dorm beds; `pax=2` for doubles.
- Room names are generic ("Dorm", "Double", "Apartment") — map to Brikette room IDs via `widgetRoomCode` in `roomsData.ts`.

### Replan Gate Evaluations

**Promotion Gate:**
- TASK-01 (new approach): E2 evidence (live browser investigation) provides E2+ evidence for the HTML structure, price format, sold-out state, and CORS policy. Confidence raised from the previous 80% (mock-only) to 88% (confirmed structure + confirmed no-auth). Gate: Pass.
- TASK-02: Promoted to 88% — dependent only on TASK-01 response shape which is now confirmed. Gate: Pass.
- TASK-03, TASK-04: Promoted to 85% — TASK-CP uncertainty (ARI response shape unknown) is eliminated. Gate: Pass.
- All tasks ≥80% IMPLEMENT threshold. Gate: Pass.

**Validation Gate:**
- All tasks have complete validation contracts (TC-XX series). Gate: Pass.

**Precursor Gate:**
- No unresolved unknowns requiring formal precursor tasks. The one implementation-level risk (regex parsing of `"189 ,98"`) is bounded and well-understood — not a spike. Gate: Pass.

**Sequencing Gate:**
- Topology changed (tasks deleted/merged): TASK-00 deleted, TASK-06 (old OAuth caching) deleted, TASK-07 (rate plan extraction) merged into TASK-01, TASK-CP deleted. Sequencing run below. Gate: Pass (post-sequence).

**Escalation Gate:**
- No decisions required from operator. Approach confirmed, structure confirmed via E2 evidence. Gate: Pass — no escalation needed.

### Task Changes Applied

| Task | Change | Rationale |
|---|---|---|
| TASK-00 (Pre-build ARI schema verification) | **DELETED** | No credentials needed. HTML structure confirmed from E2 live investigation — eliminates the entire TASK-00 investigation scope. |
| TASK-01 (API route) | **REPLACED** | Old: OAuth to `api.octorate.com` ARI endpoint. New: HTML-scrape `result.xhtml?codice=45111`. 5-min `next: { revalidate: 300 }` cache. Parses rooms, prices, sold-out, rate plans in one pass. Return `{ rooms: OctorateRoom[], fetchedAt }`. Input params: `checkin`, `checkout`, `pax`. Returns 400 on bad/missing params. |
| TASK-02 (useAvailability hook) | **SIMPLIFIED** | Returns `{ rooms: OctorateRoom[], loading, error }` instead of a `Record<string, ...>` map. Debounce reduced from 600ms to 300ms (no OAuth round-trip). |
| TASK-03 (BookPageContent wire-through) | **KEPT, minor prop rename** | `availabilityData` → `availabilityRooms` (now array, not record). TASK-CP dependency removed (no longer needed). Consumer matches by `widgetRoomCode`. |
| TASK-04 (RoomCard display) | **KEPT, minor type update** | `availabilityResult?: AvailabilityResult` → `availabilityRoom?: OctorateRoom`. TASK-CP dependency removed. |
| TASK-05 (Env vars) | **KEPT (already complete) + cleanup** | Original build done (2026-02-27). Replan adds cleanup: remove `OCTORATE_CLIENT_ID` and `OCTORATE_CLIENT_SECRET` from `docs/.env.reference.md` and `apps/brikette/.env.example`. `env.ts` and `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY` retained unchanged. |
| TASK-06 (old: OAuth token caching) | **DELETED** | No OAuth token caching needed — no auth. |
| TASK-06 (tests: renumbered from old TASK-06 tests) | **RETAINED** | Now covers HTML fixture tests for price parsing (space-before-comma), sold-out detection, and rate plan extraction. Simpler than OAuth mock approach. |
| TASK-07 (old: E2E smoke test) | **RETAINED as TASK-07** | Unchanged in scope. No credentials needed for E2E (public endpoint). |
| TASK-07 (old: rate plan extraction) | **MERGED INTO TASK-01** | Rate plan parsing happens in the same HTML section pass as room/price parsing. No separate task needed. |
| TASK-08 (i18n strings) | **KEPT** | Unchanged. TASK-CP dependency removed. |
| TASK-CP (horizon checkpoint) | **DELETED** | Purpose was to validate ARI response shape before consumer tasks. E2 evidence confirms the HTML structure — no horizon uncertainty remains. |

### Topology Change Summary

Tasks removed: TASK-00, TASK-CP, old TASK-06 (OAuth caching), old TASK-07 (rate plan extraction — merged).
Tasks retained with updates: TASK-01 (replaced), TASK-02 (simplified), TASK-03 (minor rename), TASK-04 (minor type), TASK-05 (cleanup), TASK-06 (tests, renumbered slot), TASK-07 (E2E, renumbered slot), TASK-08 (i18n, unchanged).

Final task count: 8 tasks (was 10 plus 2 now-deleted tasks). TASK-IDs preserved.

### Dependency Graph (post-replan)

```
TASK-05 → TASK-01 → TASK-02 → TASK-03 → TASK-07
                           ↘ TASK-04 → TASK-06
                                     → TASK-07
                                     → TASK-08
```

TASK-06 also depends on TASK-01 and TASK-02 (tests cover all surfaces).

### Previous Blocker (resolved)

**Date raised:** 2026-02-27

**Was blocked:** TASK-00 (Pre-build ARI endpoint schema verification — INVESTIGATE), which blocked TASK-01.

**Why resolved:** Operator confirmed the Octorate Connect API will not be used. E2 live browser investigation confirmed the public Octobook HTML endpoint structure. TASK-00 deleted. TASK-01 replaced. No credentials required.

---

## Replan Round History

| Round | Date | Trigger | Outcome |
|---|---|---|---|
| 1 | 2026-02-27 | Operator: abandon Octorate Connect API; use public Octobook HTML endpoint | All tasks unblocked. Plan confidence raised to 88%. Proceeding to build. |
