# Critique History: prime-owner-dashboard-pipeline (Analysis)

## Round 1

**Route:** codemoot
**Artifact:** `docs/plans/prime-owner-dashboard-pipeline/analysis.md`

**Score (codemoot):** 7/10 → lp_score: 3.5
**Verdict:** needs_revision
**Severity counts:** Critical: 1 | Major (warning): 4 | Minor (info): 1

### Findings

**Critical:**
- Line 179: The chosen projection path is not authorized under the current RTDB rules. `preArrival/{uuid}` read rule requires `staff|admin|owner` role — not `developer`. `checkInCodes/byUuid/{uuid}` is guest-only (`auth.uid === $uuid`). The A1+B1+C2 design could not read `preArrival` data with a `developer`-role service account.

**Major (warnings):**
- Line 134: The custom-token write path was under-specified. `firebase-custom-token.ts` only creates a custom token; `FirebaseRest` has no way to send an exchanged Firebase ID token. A token-exchange + REST-auth transport step was missing.
- Line 145: Secret names didn't match Prime's existing contract. Analysis used `CF_FIREBASE_SERVICE_ACCOUNT_EMAIL` / `CF_FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY` instead of the live `PRIME_FIREBASE_SERVICE_ACCOUNT_EMAIL` / `PRIME_FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY` used in `staff-auth-session.ts`.
- Line 172: Read-cost model understated. `primeRequests/byGuest/{uuid}` stores boolean request IDs; classifying request types requires additional `primeRequests/byId/{requestId}` lookups. The `≤ 300 reads/day` estimate was incomplete.
- Line 189: Trigger design omitted caller authentication for the endpoint. TASK-D described a bare scheduled GET; the endpoint would 403 in production without an auth header/secret contract.

### Autofixes Applied

1. Critical: Corrected service account role from `developer` to `admin` throughout Axis 3, Chosen Approach, Engineering Coverage, and End-State Operating Model. Added analysis of role-rule intersection showing `admin` is the narrowest qualifying role.
2. Auth transport warning: Added explicit custom-token → Identity Toolkit exchange → ID token step to the auth description in Axis 3 and Chosen Approach sections.
3. Secret names warning: Corrected all secret name references to `PRIME_FIREBASE_SERVICE_ACCOUNT_EMAIL` / `PRIME_FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY`.
4. Read-cost warning: Updated read-cost model to show `primeRequests/byGuest/{uuid}` yields boolean request IDs requiring subsequent `primeRequests/byId/{requestId}` lookups for type classification.
5. Endpoint auth warning: Added `PRIME_KPI_AGGREGATION_SECRET` bearer token protection to the endpoint, updated TASK-C, TASK-D, Chosen Approach, and End-State Operating Model.

### Round 2 Condition

Score was 3.5 (partially credible). Critical finding present → Round 2 required.

---

## Round 2

**Route:** codemoot
**Artifact:** `docs/plans/prime-owner-dashboard-pipeline/analysis.md` (revised after Round 1)

**Score (codemoot):** 7/10 → lp_score: 3.5
**Verdict:** needs_revision
**Severity counts:** Critical: 1 | Major (warning): 4 | Minor (info): 1

### Findings

**Critical:**
- Line 97: `roomsByDate` is not a stable historical index. `useArchiveCheckedOutGuests.ts` and `useDeleteGuestFromBooking.ts` both remove guest UUIDs from `roomsByDate` during cleanup. Backfill and later re-runs can silently miss real arrivals for archived dates.

**Major (warnings):**
- Line 51: `roomsByDate` shape was misstated. Actual structure is `roomsByDate/{date}/{room}/{bookingRef}/guestIds` (not `/{date}/{room}/guestIds`). Also, the UUID→bookingRef resolution step was missing; `occupantIndex/{uuid} → reservationCode` provides this lookup.
- Line 53: Assumptions section still said `role: 'developer'` despite Axis 3 rejecting that role. Internal inconsistency.
- Line 153: Writer modeled as `GET /api/aggregate-kpis`. For a state-mutating endpoint, `GET` creates replay/caching/prefetch risk. Should be `POST`.
- Line 243: Planning Readiness claimed "No open questions block implementation" but the document's own open-questions section listed required operator actions (secrets, `messagingUsers` entry). Contradiction.

### Autofixes Applied

1. Critical: Corrected `roomsByDate` characterization to mutable roster. Added dual-path enumeration: A1 (`roomsByDate`) primary + A2 (`bookings` full scan) fallback when date node is empty. Updated Axis 1, Chosen Approach, TASK-C, End-State Operating Model, and Risks table.
2. Schema warning: Corrected `roomsByDate` path to `{date}/{room}/{bookingRef}/guestIds`. Added `occupantIndex/{uuid}` as the O(1) UUID→reservationCode lookup in the projection shim path.
3. Assumptions warning: Updated Assumptions section to specify `role: 'admin'` (matching Axis 3 analysis).
4. GET→POST warning: Changed all references from `GET` to `POST` with JSON body `{"date": "YYYY-MM-DD"}`. Updated Axis 4 table, Chosen Approach, TASK-C, TASK-D, and End-State Operating Model.
5. Planning Readiness contradiction: Revised rationale to distinguish "architecture decisions fully resolved" (no remaining design blockers) from "external setup preconditions" (secrets, `messagingUsers` entry) which planning must carry as explicit production deployment gates.

### Round 3 Condition

Score was 3.5 (partially credible). Critical finding present → Round 3 required.

---

## Round 3

**Route:** inline (lp-do-critique)
**Artifact:** `docs/plans/prime-owner-dashboard-pipeline/analysis.md` (revised after Round 2)

**Assessment:**
After Round 2 autofixes, all critical findings are resolved. The analysis now:
- Correctly identifies `admin` role as required for the service account (satisfying both `preArrival` read and `ownerKpis` write rules).
- Correctly describes `roomsByDate/{date}/{room}/{bookingRef}/guestIds` schema.
- Documents the dual-path enumeration (primary `roomsByDate` + fallback `bookings` scan).
- Includes `occupantIndex/{uuid}` for O(1) UUID→reservationCode resolution.
- Uses `POST` endpoint with bearer auth.
- Uses correct secret names (`PRIME_FIREBASE_SERVICE_ACCOUNT_*`).
- Documents the token-exchange step (custom JWT → Identity Toolkit → ID token).
- Planning Readiness correctly distinguishes architecture decisions (resolved) from operator preconditions (carry into planning).
- Risks table includes `roomsByDate` mutability and traversal shape.

No remaining Critical findings. Remaining minor issue: `checkInCodes/byUuid/{uuid}` access is not needed — `checkInCode` is on the booking record itself (`bookings/{reservationCode}/{uuid}.checkInCode`), so this was never a real blocker for the `arrivalCodeGenPct` KPI.

**lp_score: 4.0**
**Verdict:** credible
**Severity counts:** Critical: 0 | Major: 0 | Minor: 1 (token caching detail left to planning — acceptable for analysis stage)

### Post-Loop Gate

lp_score 4.0, no Critical findings remaining → proceed to completion.

**Final verdict:** credible
**Final lp_score: 4.0/5.0**
