# Critique History: prime-owner-dashboard-pipeline (Plan)

## Round 1

**Route:** codemoot
**Artifact:** `docs/plans/prime-owner-dashboard-pipeline/plan.md`

**Score (codemoot):** 6/10 → lp_score: 3.0
**Verdict:** needs_revision
**Severity counts:** Critical: 4 | Major (warning): 0 | Minor (info): 0

### Findings

**Critical:**
- Line 470: TASK-06 Security/privacy marked `N/A` but `canAccessStaffOwnerRoutes()` is a bare env-var check with no session or auth layer. Setting `NEXT_PUBLIC_ENABLE_STAFF_OWNER_ROUTES=true` would expose owner KPI data publicly in production. Cannot be carried as security N/A.
- Line 270: Projection contract filters `bagDrop` request type but `PrimeRequestType` in `primeRequests.ts` uses `bag_drop` (snake_case). As written, `bagDropRequestCount` would silently be zero.
- Line 271: TASK-03 says `occupantIndex/{uuid}` miss should log and skip. Not safe: `roomsByDate` (primary enumeration path) already includes `bookingRef` in the path shape — `occupantIndex` lookup is redundant for primary path. Skipping on miss would silently drop valid guests.
- Line 151: Projection path incomplete for two core metrics. `bookings/{reservationCode}/{uuid}` only contains occupant-level fields (`checkInDate`, `checkOutDate`, `leadGuest`, `roomNumbers` per `bookingsSchemas.ts`). No source provided for `BookingData.checkInCode` or `BookingData.checkInAt`, so `arrivalCodeGenPct` and `medianCheckInLagMinutes` would always be zero.

### Autofixes Applied

1. **bag_drop type:** Changed all `bagDrop` references to `bag_drop` (snake_case) in TASK-03 acceptance criteria, TC-04 validation contract, scouts, data/contracts engineering coverage row, and execution plan. Confirmed from `apps/prime/functions/api/bag-drop-request.ts:126` and `apps/prime/src/types/primeRequests.ts`.

2. **occupantIndex redundancy in primary path:** Updated TASK-03 acceptance to clarify that `roomsByDate` primary path provides `bookingRef` directly — no `occupantIndex` lookup needed in primary path. `occupantIndex` remains only in fallback path (`bookings` scan) to resolve UUID→reservationCode. Updated `occupantIndex` miss handling to be scoped to fallback path only.

3. **Missing checkInCode/checkInAt sources:** Updated TASK-03 reads list to include `checkInCodes/byUuid/{uuid}.code` (for `checkInCode`) and `checkins/{date}/{uuid}.timestamp` ISO string → ms (for `checkInAt`). Confirmed: `checkins/{date}/{uuid}` schema is `{ timestamp?: string }` from `apps/reception/src/hooks/orchestrations/checkin/buildCheckinRows.ts:80,136`. Updated scouts, data/contracts engineering coverage row, and execution plan accordingly.

4. **TASK-06 security:** Changed Security/privacy from `N/A` to `Required`. Added security pre-condition acceptance criterion: operator must confirm Cloudflare Access or equivalent protects `/owner` routes before enabling the flag. Lowered TASK-06 confidence from 90% to 75%. Updated Delivered Processes and Rehearsal Trace rows. Updated Overall-confidence calculation.

### Round 2 Condition

Score was 3.0 (partially credible). All 4 findings are Critical → Round 2 required.

---

## Round 2

**Route:** inline (lp-do-critique)
**Artifact:** `docs/plans/prime-owner-dashboard-pipeline/plan.md` (revised after Round 1)

**Assessment:**
After Round 1 autofixes, all four critical findings are resolved:
- `bag_drop` type now correct throughout TASK-03.
- `occupantIndex` is now correctly scoped to fallback path only; primary path uses `bookingRef` from `roomsByDate` path.
- `checkInCode` and `checkInAt` now have correct sources (`checkInCodes/byUuid/{uuid}` and `checkins/{date}/{uuid}.timestamp`).
- TASK-06 security pre-condition correctly flagged as Required with operator confirmation acceptance criterion.

Remaining minor items (not blocking):
- The projection shim reads 7 RTDB paths per UUID (up from the original 6). The read-cost model in the analysis references ≤300 reads/day — this is still valid at this scale (10 guests × 7 paths = 70 reads for a full daily run). No plan change needed.
- TASK-07 backfill shell loop uses `date -d` which is GNU coreutils (Linux only, not macOS); the loop may fail on a Mac operator's machine. Advisory: operator should run via GHA (where Linux is the runner) rather than locally.

**lp_score: 4.0**
**Verdict:** credible
**Severity counts:** Critical: 0 | Major: 0 | Minor: 2 (acceptable for plan stage)

### Post-Loop Gate

lp_score 4.0, no Critical findings remaining → proceed to completion.

**Final verdict:** credible
**Final lp_score: 4.0/5.0**
