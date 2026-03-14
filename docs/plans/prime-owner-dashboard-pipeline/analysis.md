---
Type: Analysis
Status: Ready-for-planning
Domain: Data | API | Infra
Workstream: Engineering
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: prime-owner-dashboard-pipeline
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/prime-owner-dashboard-pipeline/fact-find.md
Related-Plan: docs/plans/prime-owner-dashboard-pipeline/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Prime Owner Dashboard Pipeline Analysis

## Decision Frame

### Summary

The owner dashboard (`/owner`, `/owner/scorecard`) is fully built and wired to a read layer that reads `ownerKpis/{date}` from Firebase RTDB. Nothing ever writes to those nodes. Three architectural decisions must be resolved before the writer can be built: (1) how to enumerate guests for a given date without a `checkInDate` index, (2) how to bridge the gap between the `kpiAggregator.ts` `RawDayData` interface and the actual RTDB multi-root schema, and (3) how to authenticate server-side writes against the role-gated `ownerKpis` rule.

### Goals

- Choose a guest enumeration strategy that avoids a full `bookings` scan.
- Choose a data projection approach (aggregator redesign vs projection shim) that preserves existing tests.
- Choose an auth approach for server-side RTDB writes.
- Choose a trigger mechanism (cron vs on-demand endpoint) that ships with minimal infrastructure delta.

### Non-goals

- Dashboard UI changes.
- Read layer (`kpiReader.ts`) changes.
- New KPI metrics beyond `DailyKpiRecord`.
- Changing the `aggregateDailyKpis()` computation logic.

### Constraints & Assumptions

- Constraints:
  - Cloudflare Pages does not support cron triggers natively.
  - `FirebaseRest` (REST-based, Workers-compatible) is the required write pattern — no Firebase Admin SDK.
  - `ownerKpis` RTDB write rule requires `messagingUsers/{uid}/role === 'owner' OR 'admin' OR 'developer'`.
  - `bookings` node does not index `checkInDate` — full scan without an alternative index.
  - `kpiAggregator.ts` tests must remain green.
- Assumptions:
  - `roomsByDate/{date}/{room}/{bookingRef}/guestIds[]` is populated for active booking dates and is the date-based guest enumeration index (confirmed from `useRoomsByDateMutations.ts`). However, it is a mutable roster: entries are removed when guests are archived or deleted (`useArchiveCheckedOutGuests.ts`, `useDeleteGuestFromBooking.ts`). This means it is reliable for the **daily scheduled run** (next-morning job, before archival) but may return incomplete data for **historical backfill** of archived dates.
  - The hostel has ≤ 50 guest UUIDs per date — O(N * (5 + N_requests)) Firebase reads per aggregation run is acceptable.
  - A service account with a known UID can be pre-registered in `messagingUsers` with `role: 'admin'` (required to satisfy both `preArrival` read and `ownerKpis` write rules).
  - `occupantIndex/{uuid} → reservationCode` (confirmed in `useFetchBookingsData.client.ts`) provides O(1) UUID→bookingRef lookup and is not subject to archival cleanup — available as a stable secondary lookup once UUIDs are enumerated.

## Inherited Outcome Contract

- **Why:** The owner dashboard was built as part of the prime app wave 1 (TASK-47, TASK-48, TASK-49) but the aggregation writer (TASK-47 scheduled job) was never implemented. The dashboard returns empty/zero data indefinitely without it.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Owner dashboard shows non-zero, real guest KPI data after the aggregation writer runs for the first time. The `ownerKpis/{date}` nodes in Firebase RTDB are populated for recent dates.
- **Source:** auto

## Fact-Find Reference

- Related brief: `docs/plans/prime-owner-dashboard-pipeline/fact-find.md`
- Key findings used:
  - `aggregateDailyKpis()` in `kpiAggregator.ts` has no non-test callers — confirmed by grep across entire codebase.
  - `kpiAggregator.ts` `RawDayData` interface does not match actual RTDB schema (signals distributed across `preArrival/`, `checkInCodes/byUuid/`, `checkins/{date}/`, `primeRequests/byGuest/`, `bagStorage/`, `bookings/{id}/{uuid}`).
  - `bookings` is indexed on `start_time` and `occupants` only — `checkInDate` not indexed.
  - `roomsByDate/{date}/{room}/guestIds` is an existing date-keyed guest enumeration index (confirmed in reception schema).
  - `firebase-custom-token.ts` already exists and provides a service-account custom token generation path.
  - `ownerKpis` RTDB write rule gates on `messagingUsers/{uid}/role`.
  - `FirebaseRest` supports `GET`, `PUT` (set), `PATCH` (update), `DELETE` — full REST surface available.

## Evaluation Criteria

| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Preserves existing aggregator tests | `kpiAggregator.ts` tests are the primary correctness guarantee for KPI computation — must not break | High |
| Minimal Firebase read cost per run | Hostel scale is small but disciplined cost control is a project value | High |
| Auth security | `ownerKpis` data is business-sensitive; write access must be role-gated | High |
| Implementation complexity | Shipping speed matters — simpler is better when outcomes are equivalent | Medium |
| Trigger flexibility | Must be runnable manually (backfill) and daily (ongoing) | Medium |
| Rollback safety | First run writes real data to RTDB — should be recoverable if wrong | Low (data is additive, easily deleted) |

## Options Considered

Three independent option axes are resolved here.

### Axis 1: Guest Enumeration Strategy

**Important schema correction:** The actual `roomsByDate` structure is `roomsByDate/{date}/{room}/{bookingRef}/guestIds[]` — not `/{date}/{room}/guestIds`. The writer must read `roomsByDate/{date}` and traverse `{room} → {bookingRef} → guestIds[]` to collect UUIDs.

**Stability constraint:** `roomsByDate` is a mutable roster. Reception's `useArchiveCheckedOutGuests.ts` and `useDeleteGuestFromBooking.ts` both remove guest UUIDs from `roomsByDate` during cleanup operations. This means:
- For **daily scheduled run** (02:00 UTC, processing yesterday): `roomsByDate` is populated and reliable — archival typically happens days/weeks after checkout.
- For **historical backfill** (dates with archived guests): `roomsByDate` may be partially or fully empty. A fallback is required.

Fallback strategy for backfill: a full `bookings` scan filtered by `checkInDate` in-memory. This is O(all bookings) but acceptable for a one-time backfill operation (not the daily path). Planning should implement both paths: `roomsByDate` as primary with graceful fallback to `bookings` scan when the date node is empty.

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A1: `roomsByDate/{date}` index (primary) | Read `roomsByDate/{date}` → traverse `{room}/{bookingRef}/guestIds[]` → collect all UUIDs | O(rooms × bookingRefs) read per date; no full scan; reliable for recent dates | Mutable: entries removed on archive/delete — incomplete for historical backfill of archived dates | Silent miss for backfill without fallback; requires fallback path | Yes (primary, with fallback) |
| A2: Full `bookings` scan | Read entire `bookings` node, filter in-memory by `checkInDate` | Complete record regardless of archival state; reliable fallback for backfill | O(all bookings ever) — grows unbounded; expensive for daily use | Acceptable as backfill-only fallback, not daily path | Yes (backfill fallback only) |
| A3: Add `checkInDate` index to `bookings` in `database.rules.json` | Add `.indexOn: ["checkInDate"]` to `bookings` rules | Clean direct query; no `roomsByDate` dependency | Requires RTDB rule deploy | Minor rule deploy; would enable O(1) date-filtered query | Yes (future improvement, not in scope) |

**Recommendation for Axis 1:** A1 primary for daily runs (using correct `{date}/{room}/{bookingRef}/guestIds` traversal), with A2 as automatic fallback when `roomsByDate/{date}` returns empty. Once UUIDs are collected, `occupantIndex/{uuid}` provides the O(1) reverse lookup for the bookingRef needed by `bookings/{reservationCode}/{uuid}`. Planning must implement both paths explicitly.

### Axis 2: Aggregator Input Bridge

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| B1: Projection shim (preferred) | Build a new `projectGuestKpiData(date, guestUuids, firebase)` function in the writer layer that reads the 6 RTDB roots per UUID and returns `RawDayData`. `aggregateDailyKpis()` unchanged. | All existing aggregator tests pass without modification. Clean separation: projection (I/O) vs aggregation (pure). | Additional function to write and test. | Projection correctness must be verified independently. | Yes |
| B2: Redesign `aggregateDailyKpis()` to accept real RTDB types | Change the function signature to take multi-root data structures directly. Update all tests. | Single function boundary; no projection layer indirection. | All 5+ `kpiAggregator.ts` tests must be rewritten. Breaks the pure/IO separation. Increases blast radius. | Existing tests are the ground truth for KPI computation accuracy — losing them risks silent regressions in KPI values. | No |

**Recommendation for Axis 2:** B1 (projection shim). Preserving the pure aggregation function and its tests is the highest-value invariant here. The projection shim is a clean, independently testable adapter layer.

### Axis 3: Server-Side Auth for `ownerKpis` Writes

The auth choice must satisfy two distinct RTDB rule sets simultaneously:

- **Read** `preArrival/{uuid}`: requires `messagingUsers/{uid}/role === 'staff' OR 'admin' OR 'owner'`. The `developer` role is NOT in this read rule.
- **Write** `ownerKpis/{date}`: requires `messagingUsers/{uid}/role === 'owner' OR 'admin' OR 'developer'`.
- **Read** `checkInCodes/byUuid/{uuid}`: guest-only (`auth.uid === $uuid`) — no role satisfies this for a service account. The alternative is `checkInCodes/byCode/$code` which is readable by `staff|admin|owner`.
- **Read** `checkins/{date}`, `primeRequests/`, `bagStorage/`, `bookings/`, `roomsByDate/`: root rule (`auth != null`) — any authenticated user can read these.

The only roles that satisfy both `preArrival` read AND `ownerKpis` write are: **`admin`** and **`owner`**. The `developer` role cannot read `preArrival`; the `staff` role cannot write `ownerKpis`.

Additionally, the token auth transport gap: `firebase-custom-token.ts` produces a custom JWT that must be exchanged for a Firebase ID token via the Identity Toolkit REST API (`signInWithCustomToken` endpoint). `FirebaseRest` currently appends `CF_FIREBASE_API_KEY` as the `auth=` query param; this pattern would need to be extended to accept a Firebase ID token instead (or a new Firebase REST helper is created that takes an ID token).

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| C1: Relax RTDB rule for `ownerKpis` writes (server-to-server) | Change the `ownerKpis` write rule to allow unauthenticated writes OR allow writes with just `CF_FIREBASE_API_KEY` | Simplest implementation — no new credential management | Weakens RTDB security model; `ownerKpis` data is business-sensitive; any authenticated user could overwrite it | High — opens write access to anyone who can obtain the database URL | No |
| C2: Pre-register service UID in `messagingUsers` with `admin` role + use custom token flow | Create a stable service account UID (e.g., `svc-kpi-aggregator`); register it in `messagingUsers/{svcUid}` with `role: 'admin'`; use `PRIME_FIREBASE_SERVICE_ACCOUNT_EMAIL` + `PRIME_FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY` (existing secret contract) via `firebase-custom-token.ts` to generate a custom JWT; exchange via Identity Toolkit for an ID token; use the ID token as the RTDB `auth=` credential | Follows existing auth pattern (`staff-auth-session.ts`). `admin` role satisfies both `preArrival` read and `ownerKpis` write. No rule changes needed. Uses existing secret names. | Requires operator to: (a) confirm `PRIME_FIREBASE_SERVICE_ACCOUNT_EMAIL` + `PRIME_FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY` are set in CF Pages; (b) create `messagingUsers/{svcUid}` entry with `role: 'admin'` in RTDB once. Writer must implement custom-token → ID-token exchange step. | One-time setup; token exchange adds one extra API call (Identity Toolkit) per run | Yes |
| C3: Relax rule only for `ownerKpis` writes from a fixed IP / CF IP range | Not feasible — CF Pages doesn't have a stable IP range | N/A | N/A | N/A | No |

**Recommendation for Axis 3:** C2 (service UID with `admin` role + custom token flow). The `admin` role satisfies both `preArrival/{uuid}` read and `ownerKpis/{date}` write. The existing `PRIME_FIREBASE_SERVICE_ACCOUNT_EMAIL` and `PRIME_FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY` secret names must be used (not new `CF_FIREBASE_*` names). The writer must implement the custom-token → ID-token exchange (calling Firebase Identity Toolkit `signInWithCustomToken` REST endpoint) and pass the resulting ID token as the RTDB `auth=` credential. This is the same pattern `staff-auth-session.ts` uses conceptually; the writer extends it server-to-server.

### Axis 4: Trigger Mechanism

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| D1: GitHub Actions `schedule:` cron | A workflow sends `POST /api/aggregate-kpis` with bearer auth daily at e.g. 02:00 UTC | No new CF infrastructure. Works immediately. Free. Backfill by running workflow manually with date param. | Depends on GitHub Actions availability for production daily operations. | GitHub Actions has rare outages; missing one day is tolerable (idempotent write can backfill). | Yes |
| D2: Separate Cloudflare Worker with cron trigger | A new Worker in the monorepo with `[triggers] crons = ["0 2 * * *"]` calls the aggregation logic | True server-side cron; no GitHub dependency | New Worker resource to deploy, manage, and pay for. Duplicates prime's CF infrastructure. | Added operational surface area for a small benefit. | Yes (secondary) |
| D3: On-demand CF Pages Function only (no automatic trigger) | Endpoint callable manually; no cron wired | Immediate unblock for backfill and manual runs. Ships fastest. | Dashboard only shows data if someone remembers to run it. | Operational debt — must be remembered to run daily. | Partial (start here, layer D1 on top) |

**Recommendation for Axis 4:** D3 first (on-demand endpoint), then D1 (GitHub Actions cron) in the same build. Shipping both together is low incremental effort and removes the operational debt of D3-only.

## Chosen Approach

**Recommendation:** Build the aggregation writer as a protected CF Pages Function (`POST /api/aggregate-kpis`) using option set **A1+A2(fallback) + B1 + C2 + D1+D3**:

1. **Guest enumeration:** Primary: read `roomsByDate/{date}` traversing `{room}/{bookingRef}/guestIds[]` to collect all guest UUIDs (correct schema: `roomsByDate/{date}/{room}/{bookingRef}/guestIds[]`). If `roomsByDate/{date}` returns empty (archived dates or missing data), fall back to full `bookings` scan filtered in-memory by `checkInDate`. Deduplication handles multi-room guests in both paths. Use `occupantIndex/{uuid}` for O(1) UUID→reservationCode lookups when resolving `bookings/{reservationCode}/{uuid}`.
2. **Data projection:** Build `projectGuestKpiData(date, guestUuids, firebase)` in the writer layer — reads the following RTDB paths per UUID, then returns `RawDayData`. Feed into unchanged `aggregateDailyKpis()`.
   - `occupantIndex/{uuid}` → `reservationCode` (O(1) reverse lookup for booking ref)
   - `bookings/{reservationCode}/{uuid}` (booking record + `checkInCode`, `checkInAt`)
   - `preArrival/{uuid}` (checklist progress + ETA; requires `admin` role)
   - `checkins/{date}/{uuid}` (actual check-in; root `auth != null` rule)
   - `primeRequests/byGuest/{uuid}` → enumerate request IDs → `primeRequests/byId/{requestId}` for type classification
   - `bagStorage/{uuid}` (bag drop; root `auth != null` rule)
   - Read cost: ≤ 50 guests × (1 occupantIndex + 1 booking + 1 preArrival + 1 checkins + N_requests_byGuest + N_requests_byId + 1 bagStorage) reads per run. For 10 guests × 2 requests avg: ~90 reads/day. Acceptable for a daily job.
3. **Auth:** Service UID registered in `messagingUsers/{svcUid}` with `role: 'admin'` (satisfies both `preArrival/{uuid}` read rule and `ownerKpis/{date}` write rule). Writer uses existing `PRIME_FIREBASE_SERVICE_ACCOUNT_EMAIL` + `PRIME_FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY` secrets via `firebase-custom-token.ts` to generate a custom JWT, then exchanges it for a Firebase ID token via Identity Toolkit REST (`signInWithCustomToken` endpoint), then uses the ID token as the RTDB `auth=` credential.
4. **Endpoint protection:** The `POST /api/aggregate-kpis` endpoint (using `POST` to avoid mutation-on-GET anti-pattern) is protected by a shared bearer secret: GHA caller passes `Authorization: Bearer <PRIME_KPI_AGGREGATION_SECRET>` header; the function validates it against a CF Pages secret before processing.
5. **Trigger:** On-demand `POST` endpoint with `{ "date": "YYYY-MM-DD" }` JSON body ships first. GitHub Actions `schedule:` cron (`0 2 * * *`) calls the endpoint daily with the bearer header and ships in the same PR.

**Why this wins:**
- Preserves all existing aggregator tests (B1 projection shim).
- Uses `roomsByDate` (correct schema) primary + `bookings` scan fallback — reliable for both daily runs and historical backfill.
- `admin` role satisfies both `preArrival` read and `ownerKpis` write rules — no RTDB rule weakening.
- Uses existing secret names (`PRIME_FIREBASE_SERVICE_ACCOUNT_EMAIL`, `PRIME_FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY`) matching the established CF Pages secret contract.
- `POST` endpoint avoids mutation-on-GET anti-pattern.
- GitHub Actions cron (D1) is the least-infrastructure daily trigger for a Cloudflare Pages app.
- The writer is an additive CF Pages Function — zero blast radius on existing guest flows.

**What it depends on (external preconditions, not implementation-blocking):**
- Operator confirms `PRIME_FIREBASE_SERVICE_ACCOUNT_EMAIL` and `PRIME_FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY` are set in CF Pages (likely already set — these match `staff-auth-session.ts` secret names).
- Operator creates `messagingUsers/{svcUid}` entry with `role: 'admin'` in RTDB (one-time setup; required before production auth works).
- Operator adds `PRIME_KPI_AGGREGATION_SECRET` as a CF Pages secret and as a GitHub Actions repository secret.
- `NEXT_PUBLIC_ENABLE_STAFF_OWNER_ROUTES=true` is set in CF Pages production env for the dashboard to be accessible (separate step; independent of pipeline).

### Rejected Approaches

- **A2 (full `bookings` scan) as primary** — Rejected as the primary daily path: unbounded cost, violates read-budget discipline. Retained as automatic fallback for backfill of archived dates when `roomsByDate` is empty.
- **B2 (redesign aggregator)** — Rejected: breaks existing tests, increases blast radius, removes the pure/IO separation.
- **C1 (relax RTDB rule)** — Rejected: unacceptable security regression; `ownerKpis` is business-sensitive.
- **C2 with `developer` role** — Rejected: `developer` role cannot read `preArrival/{uuid}` (only `staff|admin|owner` can). Service account needs `admin` role to satisfy both the `preArrival` read rule and `ownerKpis` write rule simultaneously.
- **D2 (separate CF Worker)** — Rejected: unnecessary infrastructure overhead for a daily batch job; GitHub Actions cron achieves the same with less.

### Open Questions (Operator Input Required)

- Q: Will you create the `messagingUsers/{svcUid}` entry in RTDB with `role: 'admin'` and confirm that `PRIME_FIREBASE_SERVICE_ACCOUNT_EMAIL` + `PRIME_FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY` are set in CF Pages?
  - Why operator input is required: The service account email and private key are real-world credentials the operator holds. The `messagingUsers` entry requires a write to the live Firebase project.
  - Planning impact: These must exist before the writer can authenticate. If not done before deploying, the writer will fail at auth with a clear 503 (following the pattern in `staff-auth-session.ts`).
- Q: Will you add `PRIME_KPI_AGGREGATION_SECRET` as a CF Pages secret and as a GitHub Actions repository secret?
  - Why operator input is required: This is a shared bearer secret that the operator must generate and register in two places.
  - Planning impact: Without this, TASK-C's endpoint cannot be called securely from TASK-D's cron workflow.

## Engineering Coverage Comparison

| Coverage Area | Option A1+A2(fallback)+B1+C2+D1+D3 (Chosen) | Option A2(primary)+B2+C1+D2 (Rejected composite) | Chosen implication |
|---|---|---|---|
| UI / visual | N/A — writer is server-side only | N/A | N/A — no UI changes |
| UX / states | N/A — dashboard UX unchanged; empty-state resolves when data is written | N/A | N/A |
| Security / privacy | C2: role-gated writes via custom token; no rule weakening; service account UID registered with `admin` role (satisfies both `preArrival` read and `ownerKpis` write rules); endpoint protected by `PRIME_KPI_AGGREGATION_SECRET` bearer token | C1: weakens RTDB rules — unacceptable | Service account setup + endpoint secret required before deploy; `admin` role is narrowest role satisfying both rule sets |
| Logging / observability / audit | Writer logs: date, guestCount, success/failure, Firebase write errors; `console.error` on failure (matches existing function pattern) | Same, but less isolated (aggregator redesign obscures I/O boundary) | Structured logging in writer CF Function; no new alerting infrastructure |
| Testing / validation | B1: aggregator tests untouched; new projection unit tests + writer endpoint tests added | B2: all aggregator tests must be rewritten | 2 new test files: projection shim unit tests, writer endpoint tests (Firebase mocked) |
| Data / contracts | B1: `RawDayData` interface unchanged; projection shim is a new adapter layer; `DailyKpiRecord` write contract unchanged | B2: `RawDayData` interface redesigned; all consumers updated | Projection shim is the only new contract surface; `kpiAggregator.ts` is frozen |
| Performance / reliability | A1 primary (daily): O(rooms × bookingRefs) for `roomsByDate` traversal + O(guestUuids × (6 + N_requests)) per-UUID reads (including `occupantIndex`); A2 fallback (backfill/archived): O(all bookings) scan filtered in-memory, then same per-UUID reads; both paths idempotent upsert | A2 primary every run — unbounded growth; unacceptable | Daily run: ~90 reads for 10 guests × 2 requests avg — well within Firebase free tier; fallback scan acceptable for one-time backfill only |
| Rollout / rollback | Additive CF Pages Function; no changes to existing routes; GitHub Actions cron can be disabled in seconds; RTDB writes are idempotent (re-run safe); rollback = disable cron + delete `ownerKpis/` subtree in Firebase console | D2 (separate Worker) requires a wrangler delete for rollback | Zero-risk rollout: new endpoint, new cron; existing guest flows untouched |

## End-State Operating Model

| Area | Current state | Trigger | Delivered step-by-step end state | What remains unchanged | Risks / seams to carry into planning |
|---|---|---|---|---|---|
| KPI write path | Does not exist; `ownerKpis/` subtree is empty | GitHub Actions cron fires at 02:00 UTC (or manual POST call) | 1. GitHub Actions sends `POST /api/aggregate-kpis` with body `{"date":"YYYY-MM-DD"}` and `Authorization: Bearer <PRIME_KPI_AGGREGATION_SECRET>` header (previous day by default). 2. CF Pages Function validates bearer secret, then authenticates to Firebase: calls `firebase-custom-token.ts` with `PRIME_FIREBASE_SERVICE_ACCOUNT_EMAIL` + `PRIME_FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY` → custom JWT → exchanges via Identity Toolkit for Firebase ID token → uses ID token as RTDB `auth=` credential. 3. Reads `roomsByDate/{date}/{room}/{bookingRef}/guestIds[]` → collects all guest UUIDs; if empty falls back to full `bookings` scan. 4. For each UUID: reads `occupantIndex/{uuid}` → reservationCode, then `bookings/{reservationCode}/{uuid}`, `preArrival/{uuid}` (requires `admin` role), `checkins/{date}/{uuid}`, `primeRequests/byGuest/{uuid}` + `primeRequests/byId/{requestId}` for each, `bagStorage/{uuid}`. 5. Calls `projectGuestKpiData()` → `aggregateDailyKpis()`. 6. Writes `DailyKpiRecord` to `ownerKpis/{date}`. 7. Returns `{date, guestCount, success: true}`. | `kpiReader.ts` read path unchanged; dashboard pages unchanged; aggregation pure functions unchanged | Service account secrets (`PRIME_FIREBASE_SERVICE_ACCOUNT_*`) must be in CF Pages; `messagingUsers/{svcUid}` with `role: 'admin'` must exist; `PRIME_KPI_AGGREGATION_SECRET` must be in CF Pages and GitHub Actions |
| KPI read path | Reads `ownerKpis/{date}`; returns zeros if missing | Owner page load | No change — read path already works; dashboard now shows real data instead of zeros | Same as today | None |
| Owner dashboard access gate | `NEXT_PUBLIC_ENABLE_STAFF_OWNER_ROUTES` unknown in production | N/A | Operator sets `NEXT_PUBLIC_ENABLE_STAFF_OWNER_ROUTES=true` in CF Pages dashboard; owner pages become accessible in production | Dev behavior (`true` always) unchanged | Must be done separately; otherwise dashboard shows `StaffOwnerDisabledNotice` despite populated data |

## Planning Handoff

- Planning focus:
  - TASK-A: One-time RTDB setup — create `messagingUsers/{svcUid}` entry with `role: 'admin'`; operator confirms `PRIME_FIREBASE_SERVICE_ACCOUNT_EMAIL` + `PRIME_FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY` are set in CF Pages; operator adds `PRIME_KPI_AGGREGATION_SECRET` to CF Pages + as GitHub Actions repository secret.
  - TASK-B: `apps/prime/functions/lib/kpi-projection.ts` — projection shim. Reads `occupantIndex/{uuid}` (reservationCode), `bookings/{reservationCode}/{uuid}`, `preArrival/{uuid}`, `checkins/{date}/{uuid}`, `primeRequests/byGuest/{uuid}` + `primeRequests/byId/{requestId}` (for type classification), `bagStorage/{uuid}`. Returns `RawDayData`. Unit-tested with Firebase mocked.
  - TASK-C: `apps/prime/functions/api/aggregate-kpis.ts` — `POST` CF Pages Function. Validates `PRIME_KPI_AGGREGATION_SECRET` bearer header. Auth: custom-token → Identity Toolkit exchange → ID token → RTDB `auth=` (using `admin`-role service UID). Calls `roomsByDate/{date}/{room}/{bookingRef}/guestIds[]` enumeration (with `bookings` fallback scan when empty) → projection → `aggregateDailyKpis` → `ownerKpis/{date}` RTDB write. Structured logging. Unit-tested.
  - TASK-D: `.github/workflows/prime-kpi-aggregation.yml` — GitHub Actions `schedule:` cron at `0 2 * * *`. Sends `POST` with JSON body `{"date":"$(date -d yesterday +%Y-%m-%d)"}` and `Authorization: Bearer ${{ secrets.PRIME_KPI_AGGREGATION_SECRET }}`. Includes manual `workflow_dispatch` with optional date override.
  - TASK-E: Enable `NEXT_PUBLIC_ENABLE_STAFF_OWNER_ROUTES=true` in CF Pages production env.
  - TASK-F: Backfill run for last 30 days (manual `workflow_dispatch` calls for each date, or add a `?startDate=&endDate=` range parameter to the endpoint).
- Validation implications:
  - Writer unit tests use the same Firebase mock pattern as existing `aggregate-read-path.test.tsx`.
  - Projection shim tests verify correct RTDB path construction and data mapping for each of the 6 signal roots.
  - End-to-end validation: after TASK-C deploys and TASK-D runs once, check Firebase RTDB console for `ownerKpis/{yesterday}` node; then load `/owner` dashboard and confirm non-zero values.
- Sequencing constraints:
  - TASK-A (RTDB setup + secrets) must complete before TASK-C can be tested in production.
  - TASK-B (projection shim) must precede TASK-C (writer endpoint).
  - TASK-C must deploy before TASK-D (cron) makes any sense.
  - TASK-E (access gate) can be done any time after TASK-C deploys.
- Risks to carry into planning:
  - `roomsByDate/{date}` may be empty for dates before the reception app started populating it — backfill (TASK-F) must handle gracefully (log warning, write zero-record, do not fail).
  - Custom token exchange involves two API calls (custom JWT generation + Identity Toolkit `signInWithCustomToken` exchange) — must be factored into CF Function timeout budget. Token should be cached for the duration of a single run.
  - `primeRequests/byGuest/{uuid}` stores boolean values keyed by request ID — the full request object (including `type`) lives at `primeRequests/byId/{requestId}`. Projection shim must traverse both paths to classify `extension` vs `bag_drop` requests for the count fields.
  - The endpoint bearer secret (`PRIME_KPI_AGGREGATION_SECRET`) must exist in both CF Pages and GitHub Actions secrets before TASK-C deploys and TASK-D wires up.

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| `roomsByDate/{date}` mutable — entries removed on guest archive/delete | High | Medium — backfill for archived dates may return incomplete UUID list | Confirmed: `useArchiveCheckedOutGuests.ts` and `useDeleteGuestFromBooking.ts` both clean up `roomsByDate` entries | Dual-path enumeration: `roomsByDate` primary + `bookings` full scan fallback when date node is empty; projection shim logs warning when fallback path is used |
| `roomsByDate/{date}` shape `{room}/{bookingRef}/guestIds[]` — traversal requires two levels of nesting | Low | Low — implementation detail | Confirmed: `useRoomsByDateMutations.ts` line 32 shows `roomsByDate/{date}/{room}/{bookingRef}/guestIds` | Projection shim must traverse date → room → bookingRef → guestIds correctly |
| Service account custom token exchange failure in CF Pages environment | Low | High — writer cannot authenticate; all writes fail silently | Requires integration test against live Firebase Identity Toolkit; not possible in static analysis | Writer must catch auth errors explicitly and return HTTP 500 with clear log message; cron should alert on failure |
| `primeRequests/byGuest/{uuid}` structure differs from expectation | Low | Medium — extension/bag-drop counts would be wrong | Cannot verify without live data access | Projection shim must type-guard and log unexpected request record structures |
| `NEXT_PUBLIC_ENABLE_STAFF_OWNER_ROUTES` not set in production | Medium | Low for pipeline; High for dashboard visibility | Separate operator action; analysis cannot enforce it | Document as a post-deploy checklist step; do not block pipeline build on it |

## Planning Readiness

- **Status:** Go
- **Rationale:** All four architectural decision axes are resolved with decisive recommendations. The projection shim approach eliminates the aggregator-redesign risk. The `roomsByDate` enumeration strategy (with `bookings` fallback) avoids unbounded scans on the daily path. Auth via custom token with `admin` role satisfies both RTDB read and write rules. `POST` endpoint with bearer auth avoids mutation-on-GET issues. Architecture decisions are fully resolved — no design questions remain open. The remaining operator preconditions (service account secrets, `messagingUsers` RTDB entry, `PRIME_KPI_AGGREGATION_SECRET`) are external setup steps, not design decisions. Planning must carry these as explicit preconditions for the production deployment, not as blockers to code implementation.
