---
Type: Plan
Status: Active
Domain: Data | API | Infra
Workstream: Engineering
Created: 2026-03-13
Last-reviewed: 2026-03-13
Last-updated: 2026-03-13 (Wave 2 + TASK-05 complete; TASK-06 Blocked; TASK-07 pending operator)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: prime-owner-dashboard-pipeline
Dispatch-ID: IDEA-DISPATCH-20260313200000-PRIME-010
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 76%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/prime-owner-dashboard-pipeline/analysis.md
---

# Prime Owner Dashboard Pipeline Plan

## Summary

The owner dashboard (`/owner`, `/owner/scorecard`) was built in prime app wave 1 but the TASK-47 aggregation writer was never implemented. The dashboard silently returns zeros for all KPI metrics because nothing ever writes to the `ownerKpis/{date}` Firebase RTDB subtree. This plan builds the missing pipeline: a projection shim that reads raw guest data from 6 RTDB roots, a `POST /api/aggregate-kpis` CF Pages Function that orchestrates auth + enumeration + projection + write, and a GitHub Actions cron job that calls it daily. The `kpiAggregator.ts` pure functions and all existing tests are left untouched.

## Active tasks

- [x] TASK-01: Add `PRIME_KPI_AGGREGATION_SECRET` to CF Pages secrets and GitHub Actions
- [x] TASK-02: Create `messagingUsers/{svcUid}` RTDB entry with `role: 'admin'`
- [x] TASK-03: Build `kpi-projection.ts` — guest data projection shim
- [x] TASK-04: Build `aggregate-kpis.ts` — CF Pages Function writer endpoint
- [x] TASK-05: Build `prime-kpi-aggregation.yml` — GitHub Actions cron
- [ ] TASK-06: Enable `NEXT_PUBLIC_ENABLE_STAFF_OWNER_ROUTES=true` in CF Pages production (Blocked — security pre-condition not met; see security analysis below)
- [ ] TASK-07: Backfill `ownerKpis` for last 30 days via manual workflow dispatch (Pending operator action — requires deployed endpoint)

## Goals

- Implement the missing aggregation writer so the owner dashboard shows real guest KPI data.
- Build a `POST /api/aggregate-kpis` CF Pages Function that authenticates via service-account custom token, enumerates guests from `roomsByDate/{date}` (with `bookings` fallback), projects RTDB data into `RawDayData`, calls `aggregateDailyKpis()`, and writes `DailyKpiRecord` to `ownerKpis/{date}`.
- Schedule the writer to run daily via a GitHub Actions cron job.
- Enable the owner dashboard route in CF Pages production.

## Non-goals

- Dashboard UI changes (`owner/page.tsx`, `owner/scorecard/page.tsx`).
- Read layer changes (`kpiReader.ts`).
- New KPI metrics beyond `DailyKpiRecord`.
- Changes to `aggregateDailyKpis()` computation logic or its tests.

## Constraints & Assumptions

- Constraints:
  - Cloudflare Pages does not support cron triggers natively — cron must be external (GitHub Actions).
  - `FirebaseRest` is the required REST-based Firebase client; no Firebase Admin SDK.
  - `ownerKpis/{date}` write rule requires `messagingUsers/{uid}/role === 'owner' OR 'admin' OR 'developer'`.
  - `preArrival/{uuid}` read rule requires `messagingUsers/{uid}/role === 'staff' OR 'admin' OR 'owner'` — `developer` role cannot read it.
  - Service account must use `admin` role in `messagingUsers` to satisfy both `preArrival` read and `ownerKpis` write simultaneously.
  - `bookings` node does not index `checkInDate` — full scan is O(all bookings) and is fallback-only.
  - `roomsByDate` is mutable — entries are removed on archive/delete. Primary enumeration for daily runs; fallback for historical backfill.
  - `kpiAggregator.ts` tests must remain green (no changes to that file).
- Assumptions:
  - `PRIME_FIREBASE_SERVICE_ACCOUNT_EMAIL` and `PRIME_FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY` are already set in CF Pages secrets (matching the contract established by `staff-auth-session.ts`).
  - `roomsByDate/{date}/{room}/{bookingRef}/guestIds[]` is the correct schema (confirmed from `useRoomsByDateMutations.ts`).
  - `occupantIndex/{uuid} → reservationCode` is available for O(1) UUID→booking lookup (confirmed from `useFetchBookingsData.client.ts`).
  - `primeRequests/byGuest/{uuid}` stores boolean values keyed by request ID; `primeRequests/byId/{requestId}` holds the full request object with `type` field.

## Inherited Outcome Contract

- **Why:** The owner dashboard was built as part of the prime app wave 1 (TASK-47, TASK-48, TASK-49) but the aggregation writer (TASK-47 scheduled job) was never implemented. The dashboard returns empty/zero data indefinitely without it.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Owner dashboard shows non-zero, real guest KPI data after the aggregation writer runs for the first time. The `ownerKpis/{date}` nodes in Firebase RTDB are populated for recent dates.
- **Source:** auto

## Analysis Reference

- Related analysis: `docs/plans/prime-owner-dashboard-pipeline/analysis.md`
- Selected approach inherited:
  - A1+A2(fallback): `roomsByDate/{date}/{room}/{bookingRef}/guestIds[]` enumeration primary; full `bookings` scan fallback when date node is empty.
  - B1: Projection shim (`kpi-projection.ts`) reads 6 RTDB roots, feeds unchanged `aggregateDailyKpis()`.
  - C2: Service UID with `admin` role + custom token → Identity Toolkit exchange → ID token for RTDB auth.
  - D1+D3: On-demand `POST` endpoint + GitHub Actions `schedule:` cron at `0 2 * * *`.
- Key reasoning used:
  - `developer` role cannot read `preArrival/{uuid}` — must use `admin` role for the service account.
  - `roomsByDate` entries are cleaned up on archive/delete → fallback to full `bookings` scan for archived dates.
  - `firebase-custom-token.ts` produces a custom JWT that must be exchanged via Identity Toolkit for an ID token before it can be used as `auth=` on RTDB REST calls.
  - `POST` not `GET` — endpoint mutates RTDB state.

## Selected Approach Summary

- What was chosen: Build `apps/prime/functions/lib/kpi-projection.ts` (projection shim) and `apps/prime/functions/api/aggregate-kpis.ts` (CF Pages Function) plus `.github/workflows/prime-kpi-aggregation.yml` (GHA cron). Service account uses `admin` role; custom token exchanged for ID token via Identity Toolkit REST.
- Why planning is not reopening option selection: Analysis resolved all four decision axes decisively. Auth role intersection (`admin`), enumeration strategy (roomsByDate primary + bookings fallback), projection shim pattern, and POST+GHA cron trigger are all settled with codebase evidence.

## Fact-Find Support

- Supporting brief: `docs/plans/prime-owner-dashboard-pipeline/fact-find.md`
- Evidence carried forward:
  - `aggregateDailyKpis()` has no non-test callers — confirmed by grep.
  - `kpiAggregator.ts` `RawDayData` interface does not match actual RTDB schema.
  - `roomsByDate/{date}/{room}/{bookingRef}/guestIds` is the correct path schema.
  - `occupantIndex/{uuid}` reverse lookup confirmed in `useFetchBookingsData.client.ts`.
  - `database.rules.json` role analysis: `admin` is the intersection role.
  - `PRIME_FIREBASE_SERVICE_ACCOUNT_EMAIL` / `PRIME_FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY` are the correct secret names.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add `PRIME_KPI_AGGREGATION_SECRET` to CF Pages + GHA secrets | 85% | S | Complete (2026-03-13) | - | TASK-04, TASK-05 |
| TASK-02 | IMPLEMENT | Create `messagingUsers/{svcUid}` RTDB entry with `role: 'admin'` | 85% | S | Complete (2026-03-13) | - | TASK-04 |
| TASK-03 | IMPLEMENT | Build `kpi-projection.ts` — projection shim with tests | 80% | M | Complete (2026-03-13) | - | TASK-04 |
| TASK-04 | IMPLEMENT | Build `aggregate-kpis.ts` — CF Pages POST endpoint with tests | 80% | M | Complete (2026-03-13) | TASK-01, TASK-02, TASK-03 | TASK-05, TASK-07 |
| TASK-05 | IMPLEMENT | Build `prime-kpi-aggregation.yml` — GHA cron workflow | 85% | S | Complete (2026-03-13) | TASK-01, TASK-04 | - |
| TASK-06 | IMPLEMENT | Enable `NEXT_PUBLIC_ENABLE_STAFF_OWNER_ROUTES=true` in CF Pages prod | 90% | S | Blocked — security pre-condition not met | - | - |
| TASK-07 | IMPLEMENT | Backfill `ownerKpis` for last 30 days via manual workflow dispatch | 80% | S | Pending operator action (deploy required) | TASK-04, TASK-05 | - |

## Engineering Coverage

| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | N/A — writer is server-side only | - | No UI changes; dashboard already complete |
| UX / states | N/A — empty-state copy resolves when data is written | - | Dashboard already handles zero-data gracefully |
| Security / privacy | Bearer secret validates endpoint callers; service account `admin` role; no RTDB rule weakening; custom token → ID token exchange | TASK-01, TASK-02, TASK-04 | `admin` is narrowest role satisfying both `preArrival` read and `ownerKpis` write rules |
| Logging / observability / audit | Writer logs: date, guestCount, enumeration path used (primary/fallback), success/failure, Firebase write errors | TASK-04 | `console.error` on failure, structured JSON log on success |
| Testing / validation | Projection shim unit tests (Firebase mocked); endpoint handler tests (bearer auth + Firebase mocked); aggregator tests untouched | TASK-03, TASK-04 | 2 new test files; existing `arrivalKpis.test.ts`, `kpi-aggregation-daily.test.ts` must remain green |
| Data / contracts | `RawDayData` interface unchanged; projection shim adapts 6 RTDB roots; `DailyKpiRecord` write schema unchanged | TASK-03, TASK-04 | `kpiAggregator.ts` is frozen |
| Performance / reliability | `roomsByDate` primary (O(rooms × bookingRefs)); `bookings` fallback (O(all bookings)) for archived dates only; idempotent upsert (PUT to `ownerKpis/{date}`) | TASK-03, TASK-04 | Read cost ~90/day for 10 guests × 2 requests; CF Function timeout budget must accommodate 2-step token exchange |
| Rollout / rollback | Additive CF Pages Function; no existing routes changed; GHA cron disabled in seconds; RTDB writes idempotent; rollback = delete `ownerKpis/` subtree in Firebase console | TASK-04, TASK-05 | Zero blast radius on existing guest flows |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03, TASK-06 | - | All independent; parallelise |
| 2 | TASK-04 | TASK-01, TASK-02, TASK-03 complete | Core writer function; gate on all Wave 1 code + secret setup |
| 3 | TASK-05, TASK-07 | TASK-04 complete | Cron workflow + backfill both need the deployed endpoint |

## Delivered Processes

| Area | Trigger | Delivered step-by-step flow | Tasks / dependencies | Unresolved issues / rollback seam |
|---|---|---|---|---|
| KPI write path (daily) | GitHub Actions cron at 02:00 UTC | 1. GHA sends `POST /api/aggregate-kpis` with JSON `{"date":"YYYY-MM-DD"}` and `Authorization: Bearer <PRIME_KPI_AGGREGATION_SECRET>`. 2. CF Pages Function validates bearer secret (HTTP 401 if missing/wrong). 3. Generates custom JWT via `firebase-custom-token.ts` using `PRIME_FIREBASE_SERVICE_ACCOUNT_EMAIL` + `PRIME_FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY`. 4. Exchanges custom JWT for Firebase ID token via Identity Toolkit REST. 5. Reads `roomsByDate/{date}` (traverses `{room}/{bookingRef}/guestIds[]`, `bookingRef` available directly from path); if empty, falls back to full `bookings` scan with in-memory `checkInDate` filter (fallback uses `occupantIndex/{uuid}` to resolve reservationCode). 6. For each UUID: reads `bookings/{bookingRef}/{uuid}` (occupant fields), `checkInCodes/byUuid/{uuid}` (for `checkInCode`), `checkins/{date}/{uuid}` (for `checkInAt` ms timestamp), `preArrival/{uuid}`, `primeRequests/byGuest/{uuid}` + `primeRequests/byId/{requestId}` per request (filter to `extension` and `bag_drop` types), `bagStorage/{uuid}`. 7. Calls `projectGuestKpiData()` → `aggregateDailyKpis()`. 8. PUT to `ownerKpis/{date}` with ID token auth. 9. Returns `{"date","guestCount","success":true,"enumerationPath":"primary"\|"fallback"}`. | TASK-01, TASK-02, TASK-03, TASK-04, TASK-05 | Rollback: disable GHA cron; delete `ownerKpis/` in Firebase console |
| KPI write path (on-demand / backfill) | Manual `workflow_dispatch` with date param | Same flow as above but date comes from workflow input parameter | TASK-04, TASK-05, TASK-07 | None beyond daily path |
| KPI read path | Owner page load (SSR) | Unchanged — `readKpiRange()` reads `ownerKpis/{date}`; now returns real data instead of zeros | None (read path unchanged) | None |
| Owner dashboard access | Production CF Pages env | Operator sets `NEXT_PUBLIC_ENABLE_STAFF_OWNER_ROUTES=true` in CF Pages; `/owner` and `/owner/scorecard` pages become accessible behind `canAccessStaffOwnerRoutes()`. **Note:** `canAccessStaffOwnerRoutes()` is a bare env-var check with no session auth — must confirm Cloudflare Access or equivalent protects these routes before enabling. | TASK-06 | **Security blocker**: must confirm auth protection before enabling flag |

## Tasks

---

### TASK-01: Add `PRIME_KPI_AGGREGATION_SECRET` to CF Pages and GitHub Actions secrets

- **Type:** IMPLEMENT
- **Deliverable:** CF Pages secret `PRIME_KPI_AGGREGATION_SECRET` registered; GitHub Actions repository secret `PRIME_KPI_AGGREGATION_SECRET` registered
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-13)
- **Build evidence:** CF Pages secret registered via `wrangler pages secret put PRIME_KPI_AGGREGATION_SECRET --project-name prime` (confirmed in production secrets list). GitHub Actions secret registered via `gh secret set`. `wrangler.toml` doc comment updated to reference all 4 required secrets. Commit: `f38efd8b53`.
- **Affects:** `apps/prime/wrangler.toml` (doc comment only), `.env.example` (if present)
- **Depends on:** -
- **Blocks:** TASK-04, TASK-05
- **Confidence:** 85%
  - Implementation: 85% - Wrangler CLI pattern already established in `wrangler.toml` comment; GHA secrets registered via UI or `gh secret set`
  - Approach: 90% - Same pattern as `CF_FIREBASE_API_KEY`
  - Impact: 85% - Without this, TASK-04 endpoint cannot be called securely and returns 401; TASK-05 workflow has no secret to pass
- **Acceptance:**
  - [ ] `PRIME_KPI_AGGREGATION_SECRET` set as CF Pages secret for `prime` project (via `wrangler pages secret put` or CF dashboard)
  - [ ] `PRIME_KPI_AGGREGATION_SECRET` set as GitHub Actions repository secret
  - [ ] `apps/prime/wrangler.toml` doc comment updated to reference the new secret alongside `CF_FIREBASE_API_KEY`
  - [ ] Secret value is a random 32-byte hex string (not a human-readable password)
- **Engineering Coverage:**
  - UI / visual: N/A — no UI
  - UX / states: N/A
  - Security / privacy: Required — generates bearer secret; must be random and not committed to source
  - Logging / observability / audit: N/A
  - Testing / validation: N/A — secret registration is operational, not code-testable
  - Data / contracts: N/A
  - Performance / reliability: N/A
  - Rollout / rollback: Required — secret can be rotated at any time; rollout is registering it; rollback is deleting it
- **Validation contract:**
  - TC-01: `wrangler pages secret list --project-name prime` shows `PRIME_KPI_AGGREGATION_SECRET` in output
  - TC-02: GitHub repo settings shows `PRIME_KPI_AGGREGATION_SECRET` in repository secrets
- **Execution plan:** Register secret via `wrangler pages secret put PRIME_KPI_AGGREGATION_SECRET --project-name prime`; register same value as GHA repository secret; add doc comment to `wrangler.toml`
- **Planning validation (required for M/L):** None: S effort
- **Scouts:** Secret value generation: `openssl rand -hex 32`
- **Edge Cases & Hardening:** If secret already exists with a different value (key rotation scenario), `wrangler pages secret put` overwrites it cleanly
- **What would make this >=90%:** Secret is already registered — this is a one-time operator action with no code complexity
- **Rollout / rollback:**
  - Rollout: Register secret before deploying TASK-04
  - Rollback: Delete secret from CF Pages and GitHub Actions
- **Documentation impact:** `apps/prime/wrangler.toml` comment updated
- **Notes / references:** Pattern from existing `CF_FIREBASE_API_KEY` comment in `wrangler.toml`

---

### TASK-02: Create `messagingUsers/{svcUid}` RTDB entry with `role: 'admin'`

- **Type:** IMPLEMENT
- **Deliverable:** Firebase RTDB entry at `messagingUsers/svc-kpi-aggregator` with `{ role: 'admin' }` (one-time data setup)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-13)
- **Build evidence:** `messagingUsers/svc-kpi-aggregator` written via `firebase database:set /messagingUsers/svc-kpi-aggregator -d '{"role":"admin"}' --project prime-f3652 --force`. Verified: `firebase database:get` returns `{"role":"admin"}`. Commit: `f38efd8b53` (wrangler.toml comment).
- **Affects:** Firebase RTDB `messagingUsers` subtree (live data, not source-controlled)
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 85% - Direct RTDB write via Firebase console or REST; well-understood operation
  - Approach: 90% - Analysis confirmed `admin` role satisfies both `preArrival` read and `ownerKpis` write rules
  - Impact: 85% - Without this, TASK-04 writer cannot authenticate; all writes fail with permission-denied
- **Acceptance:**
  - [ ] `messagingUsers/svc-kpi-aggregator` node exists in Firebase RTDB console with `role: 'admin'`
  - [ ] The UID used (`svc-kpi-aggregator`) matches the `uid` field passed to `createFirebaseCustomToken()` in TASK-04
  - [ ] No other `messagingUsers` entries modified
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: N/A
  - Security / privacy: Required — `admin` role grants write to `ownerKpis` and read to `preArrival`; UID must be stable and known only to the service account holder
  - Logging / observability / audit: N/A
  - Testing / validation: N/A — live data setup; confirmed by Firebase console
  - Data / contracts: Required — `messagingUsers/{uid}` schema `{ role: string }` confirmed from `database.rules.json`
  - Performance / reliability: N/A
  - Rollout / rollback: Required — rollback = delete the `messagingUsers/svc-kpi-aggregator` node
- **Validation contract:**
  - TC-01: Firebase RTDB console confirms node exists at `messagingUsers/svc-kpi-aggregator` with `role: "admin"`
  - TC-02: RTDB rules simulator with `auth.uid=svc-kpi-aggregator` confirms write access to `ownerKpis/2026-01-01` = allowed
- **Execution plan:** Write `{ "role": "admin" }` to `messagingUsers/svc-kpi-aggregator` via Firebase console or `curl` with admin credentials
- **Planning validation (required for M/L):** None: S effort
- **Scouts:** Verify `messagingUsers` schema from `database.rules.json` — confirmed no `validate` rule on `role` value beyond string check
- **Edge Cases & Hardening:** If `svc-kpi-aggregator` UID already exists with a different role, verify and update to `admin`
- **What would make this >=90%:** One-time data write with no code dependency
- **Rollout / rollback:**
  - Rollout: Write via Firebase console before deploying TASK-04
  - Rollback: Delete `messagingUsers/svc-kpi-aggregator` node
- **Documentation impact:** None: live data, not source-controlled
- **Notes / references:** RTDB rules at `apps/prime/database.rules.json` lines 197–229 confirm role intersection

---

### TASK-03: Build `kpi-projection.ts` — guest data projection shim

- **Type:** IMPLEMENT
- **Deliverable:** `apps/prime/functions/lib/kpi-projection.ts` + `apps/prime/functions/lib/__tests__/kpi-projection.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-13)
- **Build evidence:** `kpi-projection.ts` written (302 lines). Tests: 7/7 pass. Existing `kpi-aggregation-daily.test.ts` 9/9 pass. Typecheck clean. Commit: `f38efd8b53`. Key: `checkInCode` from `checkInCodes/byUuid/{uuid}.code`; `checkInAt` from `checkins/{date}/{uuid}.timestamp` ISO→ms; `bag_drop` type (snake_case) verified from `bag-drop-request.ts:126`; `bookingRef` from `roomsByDate` path in primary path (no `occupantIndex` needed).
- **Affects:** `apps/prime/functions/lib/kpi-projection.ts` (new), `apps/prime/functions/lib/__tests__/kpi-projection.test.ts` (new), `[readonly] apps/prime/src/lib/owner/kpiAggregator.ts`
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 80%
  - Implementation: 80% - All RTDB paths confirmed; `RawDayData` interface is known; pattern established. Main risk: `primeRequests/byGuest/{uuid}` boolean-keyed structure may differ in edge cases
  - Approach: 85% - Projection shim pattern is clean; leaves aggregator untouched
  - Impact: 85% - If projection is wrong, KPI values will be wrong but not crash; silent data error is the risk
- **Acceptance:**
  - [ ] `projectGuestKpiData(date, guestUuids, firebase)` exported from `kpi-projection.ts`
  - [ ] Returns `RawDayData` matching `kpiAggregator.ts` interface
  - [ ] Reads: `bookings/{bookingRef}/{uuid}` (booking ref from `roomsByDate` path), `checkInCodes/byUuid/{uuid}` → `.code` field (for `checkInCode`), `checkins/{date}/{uuid}` → `.timestamp` field parsed to ms (for `checkInAt`), `preArrival/{uuid}`, `primeRequests/byGuest/{uuid}` → `primeRequests/byId/{requestId}` (per request, filtered to `extension` and `bag_drop` types), `bagStorage/{uuid}`
  - [ ] Primary enumeration (`roomsByDate`) provides `bookingRef` directly from path — `occupantIndex` lookup is not used in primary path; `occupantIndex` is only needed in `bookings` fallback path to resolve UUID→reservationCode
  - [ ] Handles `occupantIndex` miss in fallback path gracefully (logs warning, skips UUID)
  - [ ] Handles null/missing RTDB nodes at each path without throwing
  - [ ] `primeRequests/byGuest/{uuid}` traversal classifies `extension` and `bag_drop` types correctly (type field uses snake_case per `PrimeRequestType` in `primeRequests.ts`)
  - [ ] `kpi-projection.test.ts` passes with Firebase mocked via `jest.spyOn(FirebaseRest.prototype, 'get')`
  - [ ] TC-01: fixture guest with all 6 roots populated → correct `RawDayData` shape
  - [ ] TC-02: guest with missing `preArrival` → zero readiness, zero ETA, no throw
  - [ ] TC-03: guest with no `primeRequests` → zero extension + bag-drop counts
  - [ ] TC-04: guest with `primeRequests` of multiple types → only `extension` and `bag_drop` counted
  - [ ] TC-05: `occupantIndex` miss → UUID skipped, warning logged
  - [ ] Existing `arrivalKpis.test.ts` and `kpi-aggregation-daily.test.ts` remain green (no changes to aggregator)
- **Engineering Coverage:**
  - UI / visual: N/A — server-side library
  - UX / states: N/A
  - Security / privacy: N/A — projection shim does not handle auth; that's TASK-04's concern
  - Logging / observability / audit: Required — must log: occupantIndex miss (warn), primeRequests type-guard failures (warn), null nodes (debug)
  - Testing / validation: Required — unit tests with FirebaseRest mocked; 5 TCs above
  - Data / contracts: Required — `RawDayData` interface shape verified against `kpiAggregator.ts` types; `OccupantData.extensionRequests` and `OccupantData.bagDropRequests` populated from `primeRequests/byId` records typed `bag_drop` (snake_case); `BookingData.checkInCode` sourced from `checkInCodes/byUuid/{uuid}.code`; `BookingData.checkInAt` sourced from `checkins/{date}/{uuid}.timestamp` (ISO string → ms); `bookingRef` used directly from `roomsByDate` path in primary enumeration (no `occupantIndex` needed in primary path)
  - Performance / reliability: Required — reads are sequential per UUID (acceptable for batch job); no unbounded loops without guard
  - Rollout / rollback: N/A — library module; no direct rollout surface
- **Validation contract (TC-01–TC-05):**
  - TC-01: `projectGuestKpiData('2026-03-01', ['occ1'], mockFirebase)` with all 6 roots returning fixture data → returns `RawDayData` with correct booking, preArrival, checkin, extensionRequests, bagDropRequests fields
  - TC-02: `preArrival/occ1` returns null → `RawDayData.bookings.{id}.occupants.occ1.preArrival = null`; no throw
  - TC-03: `primeRequests/byGuest/occ1` returns null → `extensionRequests = {}`, `bagDropRequests = {}`
  - TC-04: `primeRequests/byGuest/occ1 = {req1: true, req2: true}`, `primeRequests/byId/req1 = {type: 'extension'}`, `primeRequests/byId/req2 = {type: 'meal_change_exception'}` → only `req1` in `extensionRequests`; `bag_drop` requests (type `'bag_drop'`) populate `bagDropRequests` not `extensionRequests`
  - TC-05: `occupantIndex/occ1` returns null in fallback path → UUID skipped in fallback; in primary path `bookingRef` comes directly from `roomsByDate` path so `occupantIndex` is not consulted
- **Execution plan:** Red: write failing tests for TC-01–TC-05. Green: implement `kpi-projection.ts` with `projectGuestKpiData()`. For each UUID (from `roomsByDate` primary path, which provides `bookingRef` directly): read `bookings/{bookingRef}/{uuid}`, `checkInCodes/byUuid/{uuid}` (for `checkInCode`), `checkins/{date}/{uuid}` (for `checkInAt` timestamp → ms), `preArrival/{uuid}`, `primeRequests/byGuest/{uuid}` + per-request `primeRequests/byId/{id}` (filter to `extension` and `bag_drop` types), populate `BookingData` with all fields. For `bookings` fallback path (uses `occupantIndex/{uuid}` to resolve `bookingRef`): same read sequence. Refactor: extract path constant helpers.
- **Planning validation:**
  - Checks run: Verified `RawDayData` interface (`kpiAggregator.ts` lines 73–75); verified `OccupantData` shape (lines 60–64); verified `BookingData.checkInCode` field (line 68); confirmed `occupantIndex/{uuid}` pattern (`useFetchBookingsData.client.ts` line 50)
  - Validation artifacts: `apps/prime/src/lib/owner/kpiAggregator.ts`, `apps/prime/src/hooks/pureData/useFetchBookingsData.client.ts`
  - Unexpected findings: `OccupantData.extensionRequests` and `bagDropRequests` are typed as `Record<string, unknown>` in `kpiAggregator.ts` — projection shim just needs to provide a non-empty record for each counted request; presence check is what the aggregator uses
- **Consumer tracing:**
  - `projectGuestKpiData()` is a new export; TASK-04 is the only caller
  - `RawDayData` type is imported from `kpiAggregator.ts` — no interface changes required
  - `aggregateDailyKpis()` receives `RawDayData` — unchanged; all existing tests remain valid
- **Scouts:** Verify `primeRequests/byGuest/{uuid}` shape: confirmed as boolean-keyed map `{ [requestId]: true }` from `prime-requests.ts` (`primeRequests/byGuest/{uuid}/{requestId}` is always `true`). Verify request type field: `extension-request.ts` writes `type: 'extension'`; `bag-drop-request.ts` writes `type: 'bag_drop'` (snake_case, confirmed at `apps/prime/functions/api/bag-drop-request.ts:126`). Verify `BookingData.checkInCode` source: `bookings/{reservationCode}/{uuid}` contains only occupant fields (`checkInDate`, `checkOutDate`, `leadGuest`, `roomNumbers` per `bookingsSchemas.ts`); `checkInCode` must be read from `checkInCodes/byUuid/{uuid}.code`. Verify `BookingData.checkInAt` source: `checkins/{date}/{uuid}` contains `{ timestamp?: string }` (ISO string, confirmed from `buildCheckinRows.ts:80,136`); convert to ms via `Date.parse()` or `new Date(timestamp).getTime()`.
- **Edge Cases & Hardening:**
  - `occupantIndex` stale (returns reservationCode but booking node is null): log warn, skip UUID
  - `primeRequests/byId/{requestId}` null: skip that request ID silently
  - `bagStorage/{uuid}` null: `bagDropRequests` falls back to `{}` (zero count)
  - Empty `guestUuids` array: return `{ bookings: {} }` without any RTDB reads
- **What would make this >=90%:** Integration test against real RTDB fixture data confirming end-to-end `projectGuestKpiData()` → `aggregateDailyKpis()` produces expected `DailyKpiRecord`
- **Rollout / rollback:**
  - Rollout: Library module; only activated when TASK-04 imports it
  - Rollback: Remove TASK-04 import
- **Documentation impact:** None: internal library module
- **Notes / references:** `apps/prime/src/lib/owner/kpiAggregator.ts` lines 60–75 for interface reference; `apps/prime/functions/api/extension-request.ts` for request type values

---

### TASK-04: Build `aggregate-kpis.ts` — CF Pages POST endpoint

- **Type:** IMPLEMENT
- **Deliverable:** `apps/prime/functions/api/aggregate-kpis.ts` + `apps/prime/functions/api/__tests__/aggregate-kpis.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-13)
- **Build evidence:** `aggregate-kpis.ts` written (208 lines). Tests: TC-01–TC-08 all pass (8/8). `helpers.ts` updated to add `PRIME_KPI_AGGREGATION_SECRET?: string` to `MockEnv`. Typecheck clean. Existing `kpi-projection.test.ts` (7/7) and `kpi-aggregation-daily.test.ts` (9/9) remain green. `exchangeCustomTokenForIdToken()` extracted as internal helper.
- **Affects:** `apps/prime/functions/api/aggregate-kpis.ts` (new), `apps/prime/functions/api/__tests__/aggregate-kpis.test.ts` (new), `apps/prime/functions/__tests__/helpers.ts` (may need `PRIME_KPI_AGGREGATION_SECRET` added to `MockEnv`)
- **Depends on:** TASK-01, TASK-02, TASK-03
- **Blocks:** TASK-05, TASK-07
- **Confidence:** 80%
  - Implementation: 80% - All patterns established: `createFirebaseCustomToken`, `FirebaseRest`, `onRequestPost` handler. Main risk: Identity Toolkit token exchange is new server-side code path not previously tested in this app
  - Approach: 80% - Chosen approach is sound; the token-exchange step is the highest-uncertainty element. Held-back test: if Identity Toolkit REST endpoint URL or response shape differs from expectation, token exchange will fail with a non-obvious error. Resolution: add explicit error logging with Identity Toolkit response body on failure.
  - Impact: 85% - If this function deploys correctly, the pipeline works end-to-end
- **Acceptance:**
  - [ ] `onRequestPost` exported from `aggregate-kpis.ts`
  - [ ] Returns 405 for non-POST requests
  - [ ] Returns 401 if `Authorization: Bearer` header missing or secret does not match `PRIME_KPI_AGGREGATION_SECRET`
  - [ ] Returns 400 if request body JSON parse fails or `date` field missing/invalid format
  - [ ] Returns 503 if `PRIME_FIREBASE_SERVICE_ACCOUNT_EMAIL` or `PRIME_FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY` missing
  - [ ] Generates custom JWT via `createFirebaseCustomToken()` with UID `svc-kpi-aggregator` and `{ role: 'admin' }`
  - [ ] Exchanges custom JWT for Firebase ID token via Identity Toolkit `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=CF_FIREBASE_API_KEY`
  - [ ] Constructs `FirebaseRest` instance using ID token as `auth` parameter
  - [ ] Calls `roomsByDate/{date}` enumeration (traverses `{room}/{bookingRef}/guestIds[]`); logs `enumerationPath: 'primary'`
  - [ ] Falls back to full `bookings` scan if `roomsByDate/{date}` is empty; logs `enumerationPath: 'fallback'`
  - [ ] Calls `projectGuestKpiData(date, guestUuids, firebase)` from TASK-03
  - [ ] Calls `aggregateDailyKpis(date, rawData)` from `kpiAggregator.ts`
  - [ ] Writes result to `ownerKpis/{date}` via `firebase.set()`
  - [ ] Returns `200 { date, guestCount, success: true, enumerationPath }`
  - [ ] Logs structured JSON: date, guestCount, enumerationPath, durationMs on success
  - [ ] Returns 500 with error body on RTDB write failure; logs full error
  - [ ] Tests cover: bearer auth validation, missing env, happy path (primary enum), happy path (fallback enum), RTDB write failure, identity toolkit exchange error
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: N/A
  - Security / privacy: Required — bearer secret validated before any processing; Identity Toolkit token exchange is the auth mechanism; service account UID `svc-kpi-aggregator` matches RTDB `messagingUsers` entry
  - Logging / observability / audit: Required — structured log on success; error log with Identity Toolkit response body on auth failure; log `enumerationPath` for each run
  - Testing / validation: Required — `aggregate-kpis.test.ts` with `FirebaseRest.prototype.get/set` mocked + `fetch` mocked for Identity Toolkit exchange; use `createPagesContext` + `createMockEnv` from `apps/prime/functions/__tests__/helpers.ts`
  - Data / contracts: Required — `DailyKpiRecord` written via `firebase.set('ownerKpis/{date}', record)`; `date` field in response matches request body date
  - Performance / reliability: Required — token exchange adds ~1 extra HTTP call; total function execution < 30s for 50 guests; idempotent upsert (re-run safe)
  - Rollout / rollback: Required — additive function; no existing routes affected; CF Pages auto-deploys on merge; rollback = revert the file
- **Validation contract:**
  - TC-01: POST with valid bearer + `{"date":"2026-03-01"}` → 200 `{success:true, guestCount: N}`
  - TC-02: POST with missing `Authorization` header → 401
  - TC-03: POST with wrong bearer value → 401
  - TC-04: POST with `{"date":"not-a-date"}` → 400
  - TC-05: POST with missing `PRIME_FIREBASE_SERVICE_ACCOUNT_EMAIL` env → 503
  - TC-06: Identity Toolkit exchange returns non-200 → 500 with error body; error log includes IT response
  - TC-07: `roomsByDate/{date}` returns null → fallback to `bookings` scan; response includes `enumerationPath: 'fallback'`
  - TC-08: `firebase.set('ownerKpis/{date}')` throws → 500 with error body
- **Execution plan:** Red: write failing test cases TC-01–TC-08. Green: implement `onRequestPost` handler with bearer validation → env check → token exchange → enumeration → projection → aggregation → write → log → respond. Refactor: extract `exchangeCustomTokenForIdToken()` helper. Note: `FirebaseRest` constructor currently accepts `{ CF_FIREBASE_DATABASE_URL, CF_FIREBASE_API_KEY? }`. To pass an ID token instead of the API key, construct `FirebaseRest` with `apiKey: idToken` — the `auth=` URL param accepts both API keys and ID tokens for Firebase REST. Verify: RTDB REST docs confirm `auth=` accepts ID tokens.
- **Planning validation:**
  - Checks run: Verified `FirebaseRest.buildUrl()` uses `auth=this.apiKey` in URL params (line 39 of `firebase-rest.ts`); confirmed Identity Toolkit `signInWithCustomToken` endpoint `POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=API_KEY` with body `{token, returnSecureToken:true}` returns `{idToken: string}`; confirmed `onRequestPost` pattern from `staff-auth-session.ts`; confirmed `createPagesContext` in helpers supports `method: 'POST'` and body
  - Validation artifacts: `apps/prime/functions/lib/firebase-rest.ts`, `apps/prime/functions/api/staff-auth-session.ts`, `apps/prime/functions/__tests__/helpers.ts`
  - Unexpected findings: `FirebaseRest` is constructed with an env-shaped object — the writer must construct a synthetic env `{ CF_FIREBASE_DATABASE_URL: env.CF_FIREBASE_DATABASE_URL, CF_FIREBASE_API_KEY: idToken }` to pass the ID token as the `auth=` param
- **Consumer tracing:**
  - Calls `projectGuestKpiData()` from TASK-03 — new function; no prior callers; this is the sole production caller
  - Calls `aggregateDailyKpis()` from `kpiAggregator.ts` — pure function; no changes to it; all existing tests pass
  - Writes to `ownerKpis/{date}` — read by `kpiReader.ts` which already handles the `DailyKpiRecord` shape
  - `MockEnv` in `helpers.ts` needs `PRIME_KPI_AGGREGATION_SECRET?: string` added — minor addition, no consumer breakage
- **Scouts:** Verified `firebase.set()` uses PUT (overwrite) — correct for idempotent upsert. Firebase REST `auth=` query param accepts ID tokens (not just API keys) per Firebase REST API documentation.
- **Edge Cases & Hardening:**
  - `roomsByDate/{date}` returns non-null but all `guestIds` arrays are empty: `guestUuids = []`; write zero-record KPI; log warning
  - `bookings` fallback scan returns empty: write zero-record KPI
  - CF Function timeout (30s default): token exchange + 50-guest projection should complete in <10s; if it exceeds, the next day's run will retry (idempotent)
  - Date format validation: reject if not `YYYY-MM-DD` (regex or `Date.parse`)
- **What would make this >=90%:** Integration test against a Firebase emulator confirming full auth + write path
- **Rollout / rollback:**
  - Rollout: CF Pages auto-deploys on merge; endpoint is inactive until TASK-05 wires the cron
  - Rollback: Revert `aggregate-kpis.ts`; CF Pages redeploys
- **Documentation impact:** `apps/prime/wrangler.toml` comment — no structural change needed
- **Notes / references:** Identity Toolkit REST endpoint: `POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key={API_KEY}` body `{token: string, returnSecureToken: true}` response `{idToken: string, ...}`

---

### TASK-05: Build `prime-kpi-aggregation.yml` — GitHub Actions cron

- **Type:** IMPLEMENT
- **Deliverable:** `.github/workflows/prime-kpi-aggregation.yml`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-13)
- **Build evidence:** `.github/workflows/prime-kpi-aggregation.yml` written. Schedule: `0 2 * * *` (02:00 UTC daily). `workflow_dispatch` with optional `date` input. Uses `ubuntu-latest`. Date defaults to `$(date -u -d 'yesterday' '+%Y-%m-%d')` on Linux. `PRIME_KPI_AGGREGATION_SECRET` from GHA secrets; curl sends bearer auth + JSON body; step fails on non-200. Target URL: `https://prime.brikette.com/api/aggregate-kpis`.
- **Affects:** `.github/workflows/prime-kpi-aggregation.yml` (new)
- **Depends on:** TASK-01, TASK-04
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% - GHA cron + curl pattern is straightforward; date calculation on macOS vs Linux is a known gotcha
  - Approach: 90% - Simplest daily trigger for a CF Pages app
  - Impact: 85% - Without this, dashboard only shows data if the operator manually calls the endpoint
- **Acceptance:**
  - [ ] Workflow file at `.github/workflows/prime-kpi-aggregation.yml`
  - [ ] `schedule:` trigger at `0 2 * * *` (02:00 UTC daily)
  - [ ] `workflow_dispatch:` trigger with optional `date` input (default: empty → uses yesterday)
  - [ ] Job uses `ubuntu-latest`
  - [ ] Step computes `date=$(date -d yesterday +%Y-%m-%d)` (Linux `date` command); if `workflow_dispatch.inputs.date` provided, uses that instead
  - [ ] Step sends `POST` to `https://prime.pages.dev/api/aggregate-kpis` (or correct CF Pages URL) with `Content-Type: application/json`, `Authorization: Bearer ${{ secrets.PRIME_KPI_AGGREGATION_SECRET }}`, body `{"date": "$DATE"}`
  - [ ] Step fails (exit non-zero) if HTTP response status >= 400
  - [ ] Workflow name and step names are descriptive
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: N/A
  - Security / privacy: Required — bearer token from GHA secret; not printed in logs
  - Logging / observability / audit: Required — `curl -v` or `curl -f -s` with response logging; step fails on HTTP error
  - Testing / validation: N/A — GHA workflow files are not unit-testable; validated by manual `workflow_dispatch` run after TASK-07
  - Data / contracts: Required — request body `{"date": "YYYY-MM-DD"}` matches TASK-04 expected format
  - Performance / reliability: Required — `--max-time 60` on curl to avoid hanging; retry policy: none (idempotent; next day's cron will catch a missed day)
  - Rollout / rollback: Required — disable cron by removing/commenting `schedule:` trigger; rollback = delete the file
- **Validation contract:**
  - TC-01: Manual `workflow_dispatch` with `date=2026-03-13` → workflow completes; CF endpoint returns 200; RTDB `ownerKpis/2026-03-13` node created
  - TC-02: Cron run at 02:00 UTC → same as TC-01 for yesterday's date
- **Execution plan:** Write workflow YAML with schedule + workflow_dispatch triggers; compute date; POST to endpoint with bearer auth; check response status.
- **Planning validation (required for M/L):** None: S effort
- **Scouts:** Linux `date -d yesterday` works on `ubuntu-latest`. macOS `date` requires different syntax — not needed here since GHA runners are Linux.
- **Edge Cases & Hardening:** If CF Pages deployment URL changes, URL must be updated in workflow; document the URL source. Add `|| true` to date step if workflow_dispatch input is empty to avoid syntax error.
- **What would make this >=90%:** The endpoint is already validated at deploy time by TASK-07 manual runs
- **Rollout / rollback:**
  - Rollout: Merge the file; first scheduled run at 02:00 UTC
  - Rollback: Remove `schedule:` trigger or delete the file
- **Documentation impact:** None: self-documenting workflow
- **Notes / references:** CF Pages URL for prime app to be verified from CF dashboard

---

### TASK-06: Enable `NEXT_PUBLIC_ENABLE_STAFF_OWNER_ROUTES=true` in CF Pages production

- **Type:** IMPLEMENT
- **Deliverable:** CF Pages env var `NEXT_PUBLIC_ENABLE_STAFF_OWNER_ROUTES=true` set for the `prime` project production environment
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Blocked — security pre-condition not met (2026-03-13)
- **Block reason:** `canAccessStaffOwnerRoutes()` in `apps/prime/src/lib/security/staffOwnerGate.ts` is a bare `process.env` check with no session auth or Cloudflare Access verification. Enabling `NEXT_PUBLIC_ENABLE_STAFF_OWNER_ROUTES=true` would expose `/owner` and `/owner/scorecard` (containing real guest KPI data) to any unauthenticated HTTP request. The CF Pages Functions layer (`apps/prime/functions/lib/staff-owner-gate.ts`) does check `cf-access-authenticated-user-email` — but this only protects API routes, not Next.js SSR pages. No Cloudflare Access rule protecting the `/owner` path in production has been confirmed. Must confirm CF Access rule OR add session auth to the owner pages before enabling.
- **Affects:** CF Pages environment variable configuration (live, not source-controlled)
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 75%
  - Implementation: 75% - One-line env var change in CF Pages dashboard, but blocked on security pre-condition (no auth layer confirmed)
  - Approach: 85% - Confirmed from `staffOwnerGate.ts`; this is the exact flag checked
  - Impact: 85% - Without this, dashboard shows `StaffOwnerDisabledNotice` even after pipeline data lands; but enabling without auth protection is a security risk
- **Acceptance:**
  - [ ] **Security pre-condition confirmed:** Operator confirms `/owner` is protected by Cloudflare Access or equivalent (unauthenticated external users cannot reach it) OR a session/auth gate is added to the owner pages. This must be confirmed before setting the flag.
  - [ ] CF Pages production environment variable `NEXT_PUBLIC_ENABLE_STAFF_OWNER_ROUTES=true` set
  - [ ] Pages deployment triggered (redeploy to pick up new env var) OR confirmed that Pages Next.js SSR reads env at request time (not build time for `NEXT_PUBLIC_*` → requires redeploy)
  - [ ] `/owner` route accessible in production to authorized users (returns owner dashboard, not disabled notice)
- **Engineering Coverage:**
  - UI / visual: N/A — env var change; no code change
  - UX / states: Required — `/owner` and `/owner/scorecard` become accessible; `StaffOwnerDisabledNotice` no longer shown
  - Security / privacy: Required — **`canAccessStaffOwnerRoutes()` is a bare env-var check with no session or auth layer**. Setting `NEXT_PUBLIC_ENABLE_STAFF_OWNER_ROUTES=true` exposes `/owner` and `/owner/scorecard` (including real guest KPI data) to any unauthenticated request in production. Operator must confirm that either: (a) the production Prime app is already protected by a Cloudflare Access rule (WAF/zero-trust layer) so unauthenticated users cannot reach `/owner`, or (b) a proper auth session check is added to the owner pages before this flag is enabled. If neither condition is met, enabling this flag is a security risk and the task should be blocked until it is resolved. Current state: unknown — this needs explicit operator confirmation. See `apps/prime/src/lib/security/staffOwnerGate.ts`.
  - Logging / observability / audit: N/A
  - Testing / validation: N/A — verified by loading `/owner` in production
  - Data / contracts: N/A
  - Performance / reliability: N/A
  - Rollout / rollback: Required — rollback = set flag back to `false` in CF Pages
- **Validation contract:**
  - TC-01: Load `https://prime.pages.dev/owner` (or correct production URL) → dashboard renders (not disabled notice)
- **Execution plan:** Set env var in CF Pages dashboard; trigger redeploy
- **Planning validation (required for M/L):** None: S effort
- **Scouts:** `NEXT_PUBLIC_` env vars are baked at build time in Next.js static export mode; for SSR (Cloudflare Workers / OpenNext), they are also baked at build time but passed through the Wrangler `vars` block — verify this var is read at build time. Confirmed from `staffOwnerGate.ts`: `process.env.NEXT_PUBLIC_ENABLE_STAFF_OWNER_ROUTES === 'true'` — this is a build-time check. Redeploy required.
- **Edge Cases & Hardening:** If the dashboard is gated behind CF Access as well, a separate CF Access rule may be needed. This is out of scope; document if discovered.
- **What would make this >=90%:** Already 90% — straightforward env var set
- **Rollout / rollback:**
  - Rollout: Set env var + redeploy
  - Rollback: Set `NEXT_PUBLIC_ENABLE_STAFF_OWNER_ROUTES=false` + redeploy
- **Documentation impact:** None
- **Notes / references:** `apps/prime/src/lib/security/staffOwnerGate.ts`

---

### TASK-07: Backfill `ownerKpis` for last 30 days via manual workflow dispatch

- **Type:** IMPLEMENT
- **Deliverable:** Manual `workflow_dispatch` runs of `prime-kpi-aggregation.yml` for each of the last 30 dates, resulting in `ownerKpis/{date}` nodes populated in RTDB
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending operator action (2026-03-13) — requires Wave 2 code (TASK-04 + TASK-05) deployed to production via CF Pages. Wave 2 commit is `2abaa7719f` on branch `dev`. Once deployed, operator should run: `for i in $(seq 30 -1 1); do gh workflow run prime-kpi-aggregation.yml --repo <owner>/base-shop --field date=$(date -d "$i days ago" +%Y-%m-%d); sleep 2; done`
- **Affects:** Firebase RTDB `ownerKpis/` subtree (live data)
- **Depends on:** TASK-04, TASK-05
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 80% - Mechanical: 30 workflow dispatches; may be automated with a script loop
  - Approach: 80% - Relies on `roomsByDate` being populated for recent dates (before archival). Held-back test: if most dates have been archived and `roomsByDate` is empty, the fallback `bookings` scan will be used but may return incomplete data. Resolution: log `enumerationPath` per run; treat partial data as acceptable (zeros are already the current state).
  - Impact: 80% - Enables the dashboard to show historical trend data; not strictly required for the pipeline to work going forward
- **Acceptance:**
  - [ ] `ownerKpis/{date}` nodes exist in Firebase RTDB for each of the last 30 days
  - [ ] At least some dates show non-zero `guestCount` (confirms projection is working)
  - [ ] Zero-record dates (empty `roomsByDate` + empty `bookings` for that date) are acceptable — written as `{ guestCount: 0, ...ZERO_SAFE_DEFAULTS, date, updatedAt }`
  - [ ] No workflow run fails with an unhandled error (all runs either write a record or return a documented error)
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: N/A
  - Security / privacy: N/A — same auth as daily runs
  - Logging / observability / audit: Required — review GHA run logs to confirm at least some runs show `enumerationPath: 'primary'` and non-zero `guestCount`
  - Testing / validation: N/A — operational verification, not unit-testable
  - Data / contracts: N/A — same write contract as TASK-04
  - Performance / reliability: N/A — 30 sequential or parallel workflow dispatches
  - Rollout / rollback: Required — if backfill data is wrong, delete `ownerKpis/` subtree in Firebase console and rerun after TASK-03/04 fix
- **Validation contract:**
  - TC-01: After backfill, load `/owner` dashboard; confirm `medianCheckInLagMinutes` or `guestCount` is non-zero for at least one of the last 30 days
  - TC-02: Firebase RTDB console shows `ownerKpis/` subtree with ≥1 date node containing non-zero values
- **Execution plan:** Write a shell loop or run 30 manual `gh workflow run prime-kpi-aggregation.yml --field date=YYYY-MM-DD` dispatches for dates from 30 days ago to yesterday. Alternative: add a `?backfillDays=30` parameter to the endpoint in a follow-up (out of scope here).
- **Planning validation (required for M/L):** None: S effort
- **Scouts:** `gh workflow run` accepts `--field` for `workflow_dispatch` inputs. Shell loop: `for i in $(seq 30 -1 1); do gh workflow run prime-kpi-aggregation.yml --repo owner/repo --field date=$(date -d "$i days ago" +%Y-%m-%d); sleep 2; done`
- **Edge Cases & Hardening:** Runs for dates before the hostel opened (no bookings) will produce zero-records — acceptable. Rate limiting on Identity Toolkit: 30 runs spaced 2 seconds apart is well within free tier limits.
- **What would make this >=90%:** Backfill completes and dashboard shows non-zero data for at least one historical date
- **Rollout / rollback:**
  - Rollout: Run dispatches after TASK-04 + TASK-05 are deployed
  - Rollback: Delete `ownerKpis/` subtree in Firebase console
- **Documentation impact:** None
- **Notes / references:** `gh workflow run` syntax; Firebase console for verification

---

## Risks & Mitigations

- **Identity Toolkit token exchange failure (Medium):** If the Identity Toolkit `signInWithCustomToken` endpoint returns an error (wrong API key, malformed token, service outage), the writer returns 500. Mitigation: explicit error logging with IT response body; cron will retry the next day.
- **`roomsByDate` empty for recent dates (Medium):** If guests are archived sooner than expected, the fallback scan will be triggered. Mitigation: log `enumerationPath` per run; fallback scan produces correct (if slightly less efficient) results.
- **Service account UID mismatch (Low):** If the UID in `createFirebaseCustomToken()` call doesn't match the `messagingUsers` node name, RTDB writes will be permission-denied. Mitigation: TASK-02 specifies `svc-kpi-aggregator`; TASK-04 must use the same literal string.
- **CF Pages production URL (Low):** The exact CF Pages URL for the `prime` project must be confirmed before TASK-05 is written. Mitigation: verify in CF dashboard; update workflow YAML.
- **`NEXT_PUBLIC_ENABLE_STAFF_OWNER_ROUTES` requires redeploy (Low):** Setting this env var in CF Pages does not take effect until the next Pages deployment. Mitigation: TASK-06 includes triggering a redeploy.

## Observability

- Logging: `aggregate-kpis.ts` emits structured JSON log per run: `{ date, guestCount, enumerationPath, durationMs, success }`. Errors include `{ error, identityToolkitStatus }` where applicable.
- Metrics: None — CF Pages does not emit per-function metrics by default. GHA workflow run status serves as the daily health signal.
- Alerts/Dashboards: GHA workflow failure notifications (email/Slack if configured) serve as the alert channel. No new alerting infrastructure added.

## Acceptance Criteria (overall)

- [ ] `POST /api/aggregate-kpis` with valid bearer + date body returns 200 and writes `ownerKpis/{date}` to Firebase RTDB
- [ ] `ownerKpis/{date}` node contains a valid `DailyKpiRecord` with non-zero values for dates with actual bookings
- [ ] Loading `/owner` dashboard in production shows non-zero KPI values after at least one aggregation run
- [ ] GitHub Actions cron fires at 02:00 UTC and produces a successful run
- [ ] All existing `kpiAggregator.ts`, `arrivalKpis.test.ts`, `businessScorecard.test.ts`, and `kpi-aggregation-daily.test.ts` tests remain green
- [ ] New `kpi-projection.test.ts` and `aggregate-kpis.test.ts` pass

## Decision Log

- 2026-03-13: Auth role chosen as `admin` (not `developer`) — `developer` cannot read `preArrival/{uuid}` per `database.rules.json`. Analysis confirmed `admin` is the narrowest role satisfying both read and write rules.
- 2026-03-13: `roomsByDate` enumeration uses correct schema `{date}/{room}/{bookingRef}/guestIds` (not `{date}/{room}/guestIds`). Fallback to full `bookings` scan added for archived dates.
- 2026-03-13: Endpoint is `POST` (not `GET`) to avoid mutation-on-GET anti-pattern.
- 2026-03-13: `FirebaseRest` ID token auth: pass exchanged ID token as `CF_FIREBASE_API_KEY` field in the env object passed to the constructor — the `auth=` URL param accepts ID tokens per Firebase REST API docs.
- 2026-03-13: [Adjacent: delivery-rehearsal] CF Pages deployment URL for prime app to be confirmed from CF dashboard before TASK-05 is merged.
- 2026-03-13: [Adjacent: delivery-rehearsal] `/owner` and `/owner/scorecard` pages have no real session/auth layer beyond `canAccessStaffOwnerRoutes()` env check. Adding a proper authentication layer (Firebase Auth session verification or Cloudflare Access) to these routes is adjacent scope — new task beyond this pipeline's outcome. Routed to post-build reflection / future security hardening plan.
- 2026-03-13: [Critique Round 1 autofix] `bag_drop` type is snake_case (not `bagDrop`) — confirmed from `apps/prime/src/types/primeRequests.ts` and `apps/prime/functions/api/bag-drop-request.ts:126`. TASK-03 projection shim updated to filter `bag_drop` type (not `bagDrop`).
- 2026-03-13: [Critique Round 1 autofix] `roomsByDate` primary path provides `bookingRef` directly — `occupantIndex` lookup is redundant in primary path. `occupantIndex` only used in fallback (`bookings` scan) path. TASK-03 acceptance and execution plan updated.
- 2026-03-13: [Critique Round 1 autofix] `bookings/{reservationCode}/{uuid}` only contains occupant fields (`checkInDate`, `checkOutDate`, `leadGuest`, `roomNumbers` per `bookingsSchemas.ts`). `checkInCode` sourced from `checkInCodes/byUuid/{uuid}.code`; `checkInAt` sourced from `checkins/{date}/{uuid}.timestamp` (ISO string → ms). TASK-03 reads list and scouts updated.
- 2026-03-13: [Critique Round 1 autofix] TASK-06 security finding: `canAccessStaffOwnerRoutes()` is a bare env-var check with no session/auth layer. Enabling `NEXT_PUBLIC_ENABLE_STAFF_OWNER_ROUTES=true` exposes owner KPI data publicly without additional protection. TASK-06 security coverage changed from N/A to Required; acceptance criterion added for operator to confirm auth protection before enabling.
- 2026-03-13: [Build completion] TASK-06 confirmed Blocked. Investigation found two separate gate implementations: (1) `apps/prime/functions/lib/staff-owner-gate.ts` (CF Pages Functions API layer) — checks `cf-access-authenticated-user-email` header, properly gate-aware; (2) `apps/prime/src/lib/security/staffOwnerGate.ts` (Next.js SSR layer) — bare `process.env.NEXT_PUBLIC_ENABLE_STAFF_OWNER_ROUTES === 'true'` check, no Cloudflare Access verification. Enabling the env var enables the SSR pages without any auth protection. Blocked until operator confirms CF Access rule on `/owner` path or session auth is added to owner pages.
- 2026-03-13: [Build completion] TASK-07 deferred to operator. Wave 2 commit `2abaa7719f` is on `dev` branch; backfill workflow dispatches require the endpoint to be live in production. Task status updated to "Pending operator action" with dispatch loop command documented in TASK-07 execution plan.

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Register `PRIME_KPI_AGGREGATION_SECRET` | Yes — `wrangler pages secret put` pattern already used for `CF_FIREBASE_API_KEY` | None | No |
| TASK-02: Create `messagingUsers/svc-kpi-aggregator` RTDB entry | Yes — Firebase console write; no code dependencies | None | No |
| TASK-03: Build `kpi-projection.ts` | Yes — `FirebaseRest.prototype.get` spy pattern established in `assistant-query.test.ts`; `RawDayData` interface available in `kpiAggregator.ts` | [Minor] `OccupantData.extensionRequests` is typed `Record<string, unknown>` — projection shim must provide any truthy value per request, not a typed record. Aggregator's extension/bag-drop counting logic (lines 149–161 of `kpiAggregator.ts`) uses `Object.keys(occupant.extensionRequests ?? {}).length` — correct; presence of any key is counted. No interface mismatch. | No |
| TASK-04: Build `aggregate-kpis.ts` | Partial — TASK-01, TASK-02, TASK-03 must precede production use; test environment does not require them. `FirebaseRest` constructor `apiKey` param accepts ID token (confirmed from `buildUrl` line 39). `createPagesContext` supports POST + body. Identity Toolkit endpoint URL is external — mocked in tests. | [Minor] `MockEnv` in `helpers.ts` does not include `PRIME_KPI_AGGREGATION_SECRET` — needs to be added for test env. This is a minor test-setup addition, not a blocker. | No (minor test-setup addition) |
| TASK-05: Build `prime-kpi-aggregation.yml` | Yes — TASK-04 must be deployed; `PRIME_KPI_AGGREGATION_SECRET` must be in GHA secrets (TASK-01). CF Pages URL must be confirmed. | [Minor] CF Pages production URL for prime app not confirmed in this plan — must be verified before TASK-05 is merged. | No (lookup before merge) |
| TASK-06: Enable `NEXT_PUBLIC_ENABLE_STAFF_OWNER_ROUTES=true` | Partial — env var change is straightforward; **security pre-condition must be confirmed**: `canAccessStaffOwnerRoutes()` has no session auth; enabling the flag publicly exposes owner KPI data. Operator must confirm Cloudflare Access or equivalent is in place. | [Advisory] Security pre-condition (auth layer) unknown — must be operator-confirmed before task executes | Yes (operator confirmation required) |
| TASK-07: Backfill via manual dispatch | Yes — TASK-04 and TASK-05 must be deployed and confirmed working | None | No |

## Overall-confidence Calculation

- TASK-01: 85% × S(1) = 85
- TASK-02: 85% × S(1) = 85
- TASK-03: 80% × M(2) = 160
- TASK-04: 80% × M(2) = 160
- TASK-05: 85% × S(1) = 85
- TASK-06: 75% × S(1) = 75
- TASK-07: 80% × S(1) = 80
- Total weight: 1+1+2+2+1+1+1 = 9
- Weighted sum: 85+85+160+160+85+75+80 = 730
- Overall-confidence: 730 / 9 = **81.1% → 80% (downward-rounded per scoring rules)**
