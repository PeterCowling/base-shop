---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: Data | API | Infra
Workstream: Engineering
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: prime-owner-dashboard-pipeline
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/prime-owner-dashboard-pipeline/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260313200000-PRIME-010
---

# Prime Owner Dashboard Pipeline Fact-Find Brief

## Scope

### Summary

The owner dashboard (`/owner` and `/owner/scorecard`) exists and is fully wired to a read layer (`kpiReader.ts`) that pulls pre-aggregated daily KPI nodes from Firebase RTDB at `ownerKpis/{date}`. However, **nothing ever writes to those nodes**. The aggregation logic (`kpiAggregator.ts`) is a collection of pure functions with no caller in the codebase. The TASK-47 "scheduled job" referenced in the lineage doc does not exist. Until that writer is built and scheduled, the dashboard will silently return zeros for every metric on every day.

**Critical finding from factcheck:** The `kpiAggregator.ts` `RawDayData` input interface assumes `bookings/{bookingId}/occupants/{uuid}/preArrival` and `bookings/{bookingId}/checkInCode` as the data source. The actual RTDB schema distributes these signals across multiple top-level roots: pre-arrival/checklist at `preArrival/{uuid}`, check-in codes at `checkInCodes/byUuid/{uuid}`, actual check-ins at `checkins/{date}/{uuid}`, and support requests at `primeRequests/byGuest/{uuid}` / `bagStorage/{uuid}`. The writer is not a simple "query bookings → call aggregator" job. It is a multi-path join/projection across 5–6 RTDB roots for each aggregation date. The `aggregateDailyKpis()` function's assumed input contract does not match the live database topology — the writer will need either a projection layer that transforms real RTDB reads into `RawDayData` shape, or the aggregator interface must be redesigned to accept the actual data structures. This is the primary planning risk and scope driver.

### Goals

- Build the missing aggregation writer that calls `aggregateDailyKpis()` and persists results to `ownerKpis/{date}` in Firebase RTDB.
- Provide a trigger mechanism (Cloudflare Pages cron, or on-demand API endpoint, or manual backfill command) so the job can run.
- Validate that after the first run the dashboard shows real data rather than an empty-state placeholder.

### Non-goals

- Changing the dashboard UI (`owner/page.tsx`, `owner/scorecard/page.tsx`) — already complete.
- Changing the read layer (`kpiReader.ts`) — already complete and tested.
- Changing the aggregation logic (`kpiAggregator.ts`) — already complete and unit-tested.
- Adding new KPI metrics beyond those already defined in `DailyKpiRecord`.

### Constraints & Assumptions

- Constraints:
  - The prime app deploys as Cloudflare Pages + Functions. Cloudflare Pages does not support cron triggers natively — cron is only available in Workers.
  - The app uses Firebase REST client (`FirebaseRest` class in `functions/lib/firebase-rest`) for server-side Firebase writes in existing CF Pages functions. The aggregation writer should follow the same pattern.
  - Firebase RTDB rules at `ownerKpis` restrict writes to authenticated users with `owner`, `admin`, or `developer` role (`messagingUsers/{uid}/role`). The writer must use an authenticated credential with one of these roles. The existing `CF_FIREBASE_API_KEY` is an Identity Toolkit key; `firebase-rest.ts` passes it as an RTDB `auth=` token, which is an informal pattern. A proper service-account credential using `firebase-custom-token.ts` (already exists) is the correct production path.
  - The `aggregateDailyKpis()` pure function's `RawDayData` interface (`bookings/{bookingId}/occupants/{uuid}/preArrival` etc.) does NOT match the actual RTDB schema. The actual data lives across multiple top-level roots (see Critical Finding in Summary). The writer needs a projection layer or the aggregator interface needs redesign.
  - The `bookings` node is indexed on `start_time` and `occupants`, not `checkInDate`. `checkInDate` is definitively not indexed — querying by it would require a full scan of all bookings.
- Assumptions:
  - The Firebase RTDB database URL is `https://prime-f3652-default-rtdb.europe-west1.firebasedatabase.app` (confirmed from `wrangler.toml`).
  - An `owner`, `admin`, or `developer` Firebase auth credential is available or can be created for server-side writes.
  - The 7-day dashboard view is the primary use case; the 30-day view is secondary. Budget contract already defined in `budgetBaselines.ts`.
  - The production access gate (`canAccessStaffOwnerRoutes`) requires `NEXT_PUBLIC_ENABLE_STAFF_OWNER_ROUTES=true` in production. This env var is not yet confirmed as set on the deployed Cloudflare Pages app.

## Outcome Contract

- **Why:** The owner dashboard was built as part of the prime app wave 1 (TASK-47, TASK-48, TASK-49) but the aggregation writer (TASK-47 scheduled job) was never implemented. The dashboard returns empty/zero data indefinitely without it.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Owner dashboard shows non-zero, real guest KPI data after the aggregation writer runs for the first time. The `ownerKpis/{date}` nodes in Firebase RTDB are populated for recent dates.
- **Source:** auto

## Current Process Map

- **Trigger:** None — no current process exists to write `ownerKpis/{date}` nodes.
- **End condition:** N/A (job does not exist)

### Process Areas

| Area | Current step-by-step flow | Owners / systems / handoffs | Evidence refs | Known issues |
|---|---|---|---|---|
| KPI read path | `OwnerPage` and `ScorecardPage` call `readKpiRange(start, end)` → `readDailyKpi(date)` → Firebase `get(ownerKpis/{date})` → returns `ZERO_SAFE_DEFAULTS` if node missing | Prime Next.js SSR → Firebase RTDB | `apps/prime/src/lib/owner/kpiReader.ts` | Silently returns zeros; no error raised. Dashboard shows "No guest data available for this period." |
| KPI write path | **Does not exist.** `aggregateDailyKpis()` is a pure function with no caller outside tests. | — | `apps/prime/src/lib/owner/kpiAggregator.ts` | No writer, no scheduler, no trigger. `ownerKpis/` subtree in RTDB is permanently empty. |
| RTDB data topology | The actual signal data lives across 6 RTDB roots: `bookings/{bookingId}/{uuid}` (booking/occupant records), `preArrival/{uuid}` (checklist + ETA), `checkInCodes/byUuid/{uuid}` (codes), `checkins/{date}/{uuid}` (actual checkins), `primeRequests/byGuest/{uuid}` (extension/bag-drop), `bagStorage/{uuid}` (bag drops) | Firebase RTDB | `apps/prime/database.rules.json`, `packages/lib/src/hospitality/index.ts`, `apps/prime/functions/api/*.ts` | `kpiAggregator.ts`'s `RawDayData` interface assumes all data under `bookings/{id}/occupants` — this does not match the live schema. The writer must perform a multi-path join. |
| Access gate | `canAccessStaffOwnerRoutes()` returns `true` in dev; in production requires `NEXT_PUBLIC_ENABLE_STAFF_OWNER_ROUTES === 'true'` | `staffOwnerGate.ts` → env var | `apps/prime/src/lib/security/staffOwnerGate.ts` | Production access status unknown — env var not confirmed as set in CF Pages deployment. |
| Firebase auth for write | `ownerKpis` write rule requires `messagingUsers/{uid}/role === 'owner' OR 'admin' OR 'developer'`. The app has a `firebase-custom-token.ts` library for generating service-account-based custom tokens for auth. | CF Pages secrets → Firebase Auth → RTDB | `apps/prime/functions/lib/firebase-custom-token.ts`, `apps/prime/functions/api/staff-auth-session.ts` | Current `FirebaseRest` read/write pattern uses `CF_FIREBASE_API_KEY` as an RTDB `auth=` token — this works for unprotected paths but is unlikely to satisfy the `messagingUsers` role check for `ownerKpis`. Proper auth requires a custom token or relaxing the RTDB rule for server-side writes. |

## Discovery Contract Output

- **Gap Case ID:** n/a
- **Recommended First Prescription:** n/a
- **Required Inputs:** n/a
- **Expected Artifacts:** n/a
- **Expected Signals:** n/a

### Prescription Candidates

Not applicable — this is a known missing feature (the write side of TASK-47), not an unknown gap.

## Evidence Audit (Current State)

### Entry Points

- `apps/prime/src/app/owner/page.tsx` — SSR async page that calls `readKpiRange()` directly. Displays 4 KPI cards + daily breakdown. Protected by `canAccessStaffOwnerRoutes()`.
- `apps/prime/src/app/owner/scorecard/page.tsx` — SSR async page that calls `readKpiRange()` + `computeBusinessScorecard()`. Shows 5 metric categories with targets + operating review. Protected by same gate.
- `apps/prime/src/app/owner/setup/page.tsx` — Setup page; shows `ActivationFunnelSummary` component (reads `localStorage`, client-only). Not part of the pipeline gap.

### Key Modules / Files

- `apps/prime/src/lib/owner/kpiAggregator.ts` — Pure aggregation logic. `aggregateDailyKpis(date, rawDayData)` takes `RawDayData` (bookings map) and returns `DailyKpiRecord`. Fully tested. **No callers exist outside tests.**
- `apps/prime/src/lib/owner/kpiReader.ts` — Firebase read functions. `readDailyKpi(date)` and `readKpiRange(start, end)`. Reads from `ownerKpis/{date}` only, never raw booking paths. Returns zero-safe defaults for missing nodes.
- `apps/prime/src/lib/owner/businessScorecard.ts` — Pure computation layer. `computeBusinessScorecard(DailyKpiRecord[])` → `BusinessScorecardMetrics`. No Firebase I/O.
- `apps/prime/src/lib/owner/SCORECARD_LINEAGE.md` — Documents the intended data flow and confirms "KPI Aggregates: Updated daily by scheduled job (TASK-47)" — the scheduled job is the missing piece.
- `apps/prime/src/lib/security/staffOwnerGate.ts` — Feature flag. In production: requires `NEXT_PUBLIC_ENABLE_STAFF_OWNER_ROUTES=true`.
- `apps/prime/database.rules.json` (line 225) — RTDB security rules. `ownerKpis/{date}` write requires `role === 'owner' OR 'admin' OR 'developer'`. Read also restricted to same roles.
- `apps/prime/src/lib/firebase/budgetBaselines.ts` — Budget contracts. `owner_kpi_dashboard_7day`: max 7 reads from `ownerKpis` path. Writer is not in scope of budget contracts (writes are cheaper than reads in RTDB billing).
- `apps/prime/functions/api/guest-booking.ts` — Reference for RTDB multi-path reads across `bookings/{bookingId}/{uuid}`, `guestsDetails/{bookingId}/{uuid}`, `guestByRoom/{uuid}`, `bagStorage/{uuid}`, `checkins/{date}/{uuid}`, and `primeRequests/byGuest/{uuid}`. Confirms that each signal lives at its own top-level root, not nested under `bookings`.
- `apps/prime/functions/lib/firebase-custom-token.ts` — Service-account custom token generator. Required for writer auth if `CF_FIREBASE_API_KEY` alone does not satisfy `messagingUsers` role check.
- `apps/prime/functions/api/staff-auth-session.ts` — Example of custom-token-based Firebase auth flow (staff login). Pattern to follow for writer service credential.
- `packages/lib/src/hospitality/index.ts` — Canonical RTDB path helpers. All RTDB roots defined here: `bookings`, `guestsDetails`, `guestByRoom`, `bagStorage`, `checkins`, `primeRequests`, `preArrival`, `checkInCodes`. These are the actual paths the writer must query.
- `apps/prime/wrangler.toml` — Confirms `CF_FIREBASE_DATABASE_URL` as var, `CF_FIREBASE_API_KEY` as secret. No cron trigger defined.

### Patterns & Conventions Observed

- CF Pages Functions use `FirebaseRest` wrapper class for REST-based Firebase access (not SDK). Evidence: `functions/api/guest-booking.ts`, `functions/api/check-in-code.ts`, `functions/api/extension-request.ts`, etc.
- Both GET and POST Pages Functions exist (contrary to initial assumption). `extension-request.ts`, `bag-drop-request.ts`, `check-in-code.ts`, and `staff-auth-session.ts` are all mutating (POST) endpoints. The pattern for a writer endpoint is already established.
- Pure computation functions are separated from I/O (aggregator is pure; reader does I/O). Writer should follow same separation: project raw multi-root data into `RawDayData` shape, call `aggregateDailyKpis()`, then persist result.
- There is no scheduled/background execution pattern in the codebase yet — this is the real pattern gap (not the absence of mutating functions).

### Data & Contracts

- Types/schemas/events:
  - `DailyKpiRecord` in `kpiAggregator.ts` — the write target schema. Fields: `date`, `guestCount`, `readinessCompletionPct`, `etaSubmissionPct`, `arrivalCodeGenPct`, `medianCheckInLagMinutes`, `extensionRequestCount`, `bagDropRequestCount`, `updatedAt`.
  - `RawDayData` in `kpiAggregator.ts` — the aggregator's assumed input shape. **This interface does NOT match the live RTDB schema.** It assumes `bookings/{bookingId}/occupants/{uuid}/preArrival` etc. The actual data is spread across top-level roots.
  - Actual RTDB signal locations (from `packages/lib/src/hospitality/index.ts` + live function code):
    - Guest/booking list for a date: `bookings/{bookingId}/{guestUuid}` contains `checkInDate`, `checkOutDate`, `firstName`, `lastName`
    - Pre-arrival checklist + ETA: `preArrival/{guestUuid}` — separate root
    - Check-in codes: `checkInCodes/byUuid/{guestUuid}`
    - Actual check-in records: `checkins/{YYYY-MM-DD}/{guestUuid}`
    - Extension requests: `primeRequests/byGuest/{guestUuid}` → `primeRequests/byId/{requestId}` (type=`extension`)
    - Bag drop requests: `bagStorage/{guestUuid}` (status field) AND `primeRequests/byGuest/{guestUuid}` (type=`bag_drop`)
- Persistence:
  - Write target: Firebase RTDB at `ownerKpis/{YYYY-MM-DD}` (REST PUT or SET).
  - Raw data source: Multi-root — needs to iterate `bookings` for a date (no `checkInDate` index; full scan required or `roomsByDate/{date}` can be used as a date index if it carries booking/guest IDs).
- API/contracts:
  - No existing API endpoint for triggering aggregation. Needs to be created.
  - `bookings` node is indexed on `start_time` and `occupants` only — `checkInDate` is NOT indexed. A full scan of `bookings` is required unless an alternative date-based index (e.g., `roomsByDate/{date}`) can be used to enumerate guest UUIDs for a given date.

### Dependency & Impact Map

- Upstream dependencies:
  - Firebase RTDB `bookings/{bookingId}` data — source of raw data for aggregation. The Firebase schema already contains the required fields (`checkInDate`, `checkInCode`, `checkInAt`, occupant pre-arrival data).
  - `CF_FIREBASE_API_KEY` secret — must be valid and have write access to `ownerKpis/` path.
- Downstream dependents:
  - `OwnerPage` (`/owner`) — directly consumes `readKpiRange()` output.
  - `ScorecardPage` (`/owner/scorecard`) — directly consumes `readKpiRange()` output.
  - `DirectTelemetryPanel` component — uses a separate `/api/direct-telemetry` endpoint, not part of this pipeline.
- Likely blast radius:
  - Adding a new CF Pages Function for the writer endpoint: isolated, no risk to existing guest flows.
  - Writing to `ownerKpis/{date}` in RTDB: no existing consumers other than the dashboard pages. Zero risk of breaking guest-facing flows.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (unit/component tests), Firebase mocked via `jest.mock('firebase/database')`
- Commands: per CI policy, tests run in CI only via `gh run watch`
- CI integration: per `.github/workflows/ci.yml`

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `aggregateDailyKpis()` pure function | Unit | `src/lib/owner/__tests__/kpi-aggregation-daily.test.ts` | Full coverage: TC-01, TC-03 — readiness, ETA, code gen, check-in lag, extension/bag drop, zero defaults, date filtering |
| `readKpiRange()` / `readDailyKpi()` | Unit (Firebase mocked) | `src/app/owner/__tests__/aggregate-read-path.test.tsx` | TC-02, TC-04 — path contract, budget enforcement, partial data handling |
| `computeBusinessScorecard()` | Unit | `src/lib/owner/__tests__/businessScorecard.test.ts` | Metric computation, target thresholds, insufficient data handling |
| `OwnerPage` UI | Component (kpiReader mocked) | `src/app/owner/__tests__/page.test.tsx` | TC-03 — renders KPI cards, handles empty/zero data |
| `ScorecardPage` UI | Component (kpiReader mocked) | `src/app/owner/__tests__/scorecard-page.test.tsx` | TC-03 — status states, targets, sections, lineage display |

#### Coverage Gaps

- Untested paths:
  - The aggregation **writer** (does not exist yet) — needs a new test that mocks Firebase write and verifies the correct path is targeted with the correct payload.
  - Integration between writer and raw booking data: no test verifies that the RTDB query shape (`orderBy checkInDate`) returns data in the format `aggregateDailyKpis()` expects.
  - The production access gate: no test covering the deployed env var state (`NEXT_PUBLIC_ENABLE_STAFF_OWNER_ROUTES`).
- Extinct tests: None identified.

#### Testability Assessment

- Easy to test:
  - Writer unit test: mock `FirebaseRest.get()` (return raw booking fixtures) and `FirebaseRest.set()`; verify path and payload.
  - Backfill endpoint test: mock Firebase calls; verify date range iteration and idempotent write behavior.
- Hard to test:
  - Cron/scheduled trigger: Cloudflare Pages does not expose cron in the standard Pages Function test harness. May need to test the handler function directly rather than the scheduling mechanism.
- Test seams needed:
  - Writer function should accept a `FirebaseRest`-compatible interface argument (or env-based construction, matching existing pattern) so tests can inject a mock.

### Recent Git History (Targeted)

- `apps/prime/src/lib/owner/` — created in commit `42bc667052` ("feat(prime): implement Wave 1 tasks — KPI pipeline") — confirms TASK-47 was supposed to include both the aggregation logic AND the scheduled job. The scheduled job was never committed.
- `apps/prime/src/app/owner/` — created in commit `7f92cf57e9` ("feat(prime): implement owner dashboard and business scorecard (TASK-48, TASK-49)") — dashboard UI added in separate commit, after aggregation logic.

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | N/A | Dashboard UI complete. Writer is server-side only. | None | No |
| UX / states | N/A | Dashboard shows empty-state copy ("No guest data available") gracefully. Writer does not affect UX directly. | The empty-state message will disappear once the writer runs — this is the intended outcome. | No |
| Security / privacy | Required | RTDB rules restrict `ownerKpis` write to `messagingUsers/{uid}/role === 'owner OR admin OR developer'`. `firebase-custom-token.ts` already exists for generating service-account custom tokens. `staff-auth-session.ts` shows the pattern for custom-token-based Firebase auth. | `CF_FIREBASE_API_KEY` alone is unlikely to satisfy role check (it is an Identity Toolkit key, not a Firebase Auth UID with a role entry). Writer needs either: (a) a dedicated `messagingUsers` entry with `developer` role for a service account UID, exchanged via custom token flow; or (b) a relaxed RTDB rule for server-to-server writes to `ownerKpis`. | Yes — resolve service-account auth path before implementation |
| Logging / observability / audit | Required | No existing logging in `kpiAggregator.ts` (pure function). `kpiReader.ts` logs errors to `console.error`. | Writer should log: date processed, guestCount aggregated, success/failure, and any Firebase write errors. No alerting hook exists for aggregation failures. | Yes — add structured logging to writer |
| Testing / validation | Required | Aggregation logic fully tested. Read layer fully tested. No writer tests exist. | Writer test needed. Integration test for Firebase query shape needed. | Yes — writer unit test required |
| Data / contracts | Required | `DailyKpiRecord` schema and write path `ownerKpis/{date}` defined. `RawDayData` input interface exists but does not match actual RTDB schema (confirmed by factcheck). Actual signals distributed across 6 RTDB roots. | `kpiAggregator.ts`'s `RawDayData` input interface needs redesign or a projection shim so the writer can feed it from actual RTDB paths. `checkInDate` is NOT indexed on `bookings` (confirmed: `database.rules.json` indexes `start_time`, `occupants` only). | Yes — redesign aggregator input OR build projection shim; confirm date-lookup strategy |
| Performance / reliability | Required | Budget baseline: 7 reads per 7-day view. Write cost: 1 write per date per aggregation run (idempotent upsert). | `bookings` node has no `checkInDate` index → full scan required. Each aggregation run for one date requires: 1 bookings scan + N reads across 5 additional roots (one per guest per root) = O(N * 5) reads. For 10 guests on a date that is ~50 reads. Acceptable for a daily job, but must be designed as a batch with bounded parallelism. Writer must be idempotent (re-running same date overwrites cleanly). | Yes — design bounded-parallelism batch; implement idempotent upsert |
| Rollout / rollback | Required | No feature flag on the writer (it does not exist yet). `canAccessStaffOwnerRoutes` gates dashboard reads in production. | First run will populate RTDB with real data — no rollback path for that data. Writer endpoint should be protected (staff/admin only). Rollback = disable the trigger/cron; existing zero-default behavior is the fallback state. | Yes — protect endpoint, document rollback |

## Questions

### Resolved

- Q: Does an owner dashboard exist?
  - A: Yes. Two routes: `/owner` (KPI summary + daily breakdown) and `/owner/scorecard` (target-based scorecard with operating review). A third route `/owner/setup` shows activation funnel summary from localStorage (not part of the pipeline gap).
  - Evidence: `apps/prime/src/app/owner/page.tsx`, `apps/prime/src/app/owner/scorecard/page.tsx`

- Q: Is any data hardcoded or static in the dashboard?
  - A: No. All values come from `readKpiRange()` → Firebase RTDB. The dashboard gracefully shows zeros/empty-state when no data is present. There is no hardcoded placeholder data.
  - Evidence: `apps/prime/src/app/owner/page.tsx` lines 41-66

- Q: What is the missing pipeline component?
  - A: The aggregation writer — a server-side job that calls `aggregateDailyKpis(date, rawBookingData)` with real data from `bookings/{bookingId}` and writes the result to `ownerKpis/{date}`. The TASK-47 "scheduled job" documented in `SCORECARD_LINEAGE.md` was never built.
  - Evidence: `apps/prime/src/lib/owner/kpiAggregator.ts` — `aggregateDailyKpis()` has no non-test callers in the entire codebase (confirmed by grep)

- Q: Is there a cron mechanism in the prime app?
  - A: No. `wrangler.toml` has no `[triggers]` cron entry. Cloudflare Pages does not support cron natively — only Cloudflare Workers do.
  - Evidence: `apps/prime/wrangler.toml`

- Q: What is the recommended write trigger approach given Pages limitations?
  - A: Three options exist: (A) an on-demand API endpoint that can be called manually or from an external scheduler; (B) a separate lightweight Cloudflare Worker (cron-capable) that calls the prime RTDB; (C) a GitHub Actions scheduled workflow. Option A (on-demand endpoint) is the lowest-friction starting point that unblocks the dashboard without infrastructure changes. Option C (GitHub Actions cron) is a clean interim solution.
  - Evidence: Cloudflare Pages Function architecture observed in `apps/prime/functions/api/`

- Q: Does the Firebase RTDB `bookings` node support indexed queries by `checkInDate`?
  - A: Confirmed: NO. `database.rules.json` line 6 shows `"bookings": { ".indexOn": ["start_time", "occupants"] }`. `checkInDate` is definitively not indexed. The writer will require a full scan of `bookings` (or use an alternative date index like `roomsByDate/{date}`) to enumerate guests for a given date.
  - Evidence: `apps/prime/database.rules.json` line 5-7

- Q: Is the production access gate (`NEXT_PUBLIC_ENABLE_STAFF_OWNER_ROUTES`) currently set?
  - A: Unknown from codebase. The env var is not in `wrangler.toml` (only runtime vars are there, env vars are in CF Pages dashboard). The gate defaults to disabled in production if the var is absent. This is a separate concern from the pipeline — the writer works regardless of the gate, and the gate can be enabled independently once data exists.
  - Evidence: `apps/prime/src/lib/security/staffOwnerGate.ts`

### Open (Operator Input Required)

- Q: Should the writer be triggered via (A) a new CF Pages Function endpoint, (B) a GitHub Actions cron job, or (C) a separate Cloudflare Worker?
  - Why operator input is required: This is an infrastructure/ops preference decision. Option A requires manual invocation or an external cron service. Option B requires GitHub Actions scheduled workflow setup. Option C requires creating a new Worker resource.
  - Decision impacted: Implementation scope and deployment complexity.
  - Decision owner: Peter Cowling
  - Default assumption (if any) + risk: Default to Option A (on-demand API endpoint) — simplest, ships fastest, can be called manually or wired to a GitHub Actions cron later. Risk: no automatic daily execution until a cron caller is set up.

- Q: What Firebase auth credential should the writer use to satisfy the RTDB `ownerKpis` write rule?
  - Why operator input is required: The rule requires `messagingUsers/{uid}/role === 'owner' OR 'admin' OR 'developer'`. Whether a service account with such a role exists, and how to obtain its auth token for the REST writer, depends on the Firebase project configuration the operator controls.
  - Decision impacted: Auth implementation for the writer. Could be: (a) existing `CF_FIREBASE_API_KEY` if it has an associated user with the right role; (b) a new Firebase service account; (c) relaxing the RTDB rule to allow server-side writes without role check.
  - Decision owner: Peter Cowling
  - Default assumption (if any) + risk: Default to checking whether the existing `CF_FIREBASE_API_KEY` allows unauthenticated writes to `ownerKpis` (REST API with `CF_FIREBASE_API_KEY` in URL does bypass Firebase Auth rules if the database has public write enabled — this needs a rule check). Risk: may need a rule change or new credential.

## Confidence Inputs

- **Implementation:** 65%
  - Evidence: `aggregateDailyKpis()` is fully implemented and tested. `kpiReader.ts` provides the read pattern. CF Pages Function POST pattern is clear from existing functions (`extension-request.ts`, etc.). However, the aggregator's `RawDayData` input contract does not match the real RTDB schema — the writer requires a non-trivial projection layer and the aggregator interface may need redesign. Auth path is also unresolved.
  - Raise to ≥80: Choose aggregator-redesign vs projection-shim approach; confirm auth strategy.
  - Raise to ≥90: Confirm all 6 RTDB signal paths are readable by the service credential; implement and test the projection layer.

- **Approach:** 65%
  - Evidence: The high-level architecture is clear (projection → aggregation → write). The specific approach for (a) enumerating guests by date, (b) joining 6 RTDB roots, (c) auth credential, and (d) trigger mechanism are all open.
  - Raise to ≥80: Operator confirms trigger preference; analysis confirms guest enumeration strategy.
  - Raise to ≥90: Auth strategy implemented and tested.

- **Impact:** 90%
  - Evidence: Without this writer, the dashboard shows zeros permanently. With it, the dashboard shows real data. No other factor is blocking the dashboard.
  - Raise to ≥90: Already there — the impact is unambiguous.

- **Delivery-Readiness:** 65%
  - Evidence: Aggregation logic is done. Read layer is done. But the RTDB schema mismatch, missing index, and unresolved auth add planning complexity above initial estimate.
  - Raise to ≥80: Resolve projection approach and auth strategy in planning phase.

- **Testability:** 75%
  - Evidence: Existing tests mock Firebase. Writer unit test pattern is clear. However, the multi-root projection adds surface area for integration-test complexity.
  - Raise to ≥90: Build projection helper with isolated unit tests; confirm Firebase mock covers all 6 root paths.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| `kpiAggregator.ts` `RawDayData` interface does not match actual RTDB schema → writer cannot directly feed aggregator | High — confirmed by factcheck | High — blocks writer implementation | Either (a) rewrite `aggregateDailyKpis()` to accept the real multi-root data structures, or (b) build a projection layer that maps real RTDB reads into `RawDayData` shape. Option (b) is lower-risk (keeps existing aggregator tests valid). |
| RTDB `bookings` node lacks `checkInDate` index → full scan required on every aggregation run | High — confirmed: only `start_time` and `occupants` indexed | Medium — full scan is slow and costly for large booking datasets | Alternative: use `roomsByDate/{date}` as a date-based enumeration index if it contains guest UUIDs; or add `checkInDate` to `bookings` index. Must be evaluated in analysis. |
| Firebase auth credential for server-side write does not satisfy `messagingUsers` role check → writes fail | High — `CF_FIREBASE_API_KEY` pattern does not include a UID with role | High — dashboard remains empty despite writer running | Use `firebase-custom-token.ts` pattern to generate a service-account custom token; register a `messagingUsers/{serviceUid}` entry with `developer` role; or relax the `ownerKpis` write rule for unauthenticated server-side writes |
| Writer reads 5–6 RTDB paths per guest per run — O(N * 6) reads for N guests per date | Low-Medium (for small hostel) | Low — bounded by guest count (typically ≤ 30/day) | Design with bounded parallelism (e.g., `Promise.all` per guest batch); document read budget per run |
| `NEXT_PUBLIC_ENABLE_STAFF_OWNER_ROUTES` not set in production → dashboard inaccessible even after data is populated | Medium | Low (for this task) — gate is a separate concern | Enable the flag in CF Pages dashboard after pipeline is live and data is confirmed |
| Backfill of historical dates requires a separate trigger run per date → manual effort | Low | Low | Include a `/api/aggregate-kpis?startDate=X&endDate=Y` date-range backfill parameter in the writer endpoint design |

## Planning Constraints & Notes

- Must-follow patterns:
  - Use `FirebaseRest` class (REST-based) for all Firebase I/O in CF Pages Functions. Do not introduce Firebase Admin SDK.
  - Writer must be idempotent: calling it for the same date twice should overwrite the previous record cleanly.
  - Keep `aggregateDailyKpis()` pure — do not add Firebase I/O to it. The writer is a separate caller.
  - Follow `apps/prime/functions/api/guest-booking.ts` as the reference implementation for CF Pages Function structure.
- Rollout/rollback expectations:
  - No migration needed — `ownerKpis/` is an empty new subtree in RTDB.
  - Rollback = disable the trigger endpoint (or revoke the cron caller). Dashboard degrades to zero-default state gracefully.
- Observability expectations:
  - Writer should log date, guestCount, success/failure per run.
  - Consider writing `updatedAt` timestamp to `ownerKpis/meta/lastRunAt` so the dashboard can show data freshness.

## Suggested Task Seeds (Non-binding)

1. **TASK-A**: Resolve RTDB data topology and aggregator input contract. Either (a) extend `kpiAggregator.ts` `RawDayData` to accept the real multi-root schema, OR (b) build a `projectRawDayData(date, firebase)` helper that reads the actual RTDB paths and returns a `RawDayData`-compatible structure. Choose the option that keeps existing aggregator tests passing. Document the guest enumeration strategy (full `bookings` scan vs `roomsByDate/{date}` lookup).
2. **TASK-B**: Resolve Firebase auth for server-side write: create a `messagingUsers/{serviceUid}` entry with `developer` role in RTDB; use `firebase-custom-token.ts` to generate a token for that UID; or relax the `ownerKpis` RTDB rule for unauthenticated server writes. Document chosen approach.
3. **TASK-C**: Implement `apps/prime/functions/api/aggregate-kpis.ts` — CF Pages Function that accepts `?date=YYYY-MM-DD` (default: yesterday), authenticates as service account, reads the required multi-path RTDB data, calls projection + `aggregateDailyKpis()`, writes result to `ownerKpis/{date}`. Include unit test.
4. **TASK-D**: Wire daily trigger — GitHub Actions `schedule:` cron job — to call the endpoint each morning.
5. **TASK-E**: Enable `NEXT_PUBLIC_ENABLE_STAFF_OWNER_ROUTES=true` in the CF Pages production dashboard and validate owner pages render with real data.
6. **TASK-F**: Backfill last 30 days by calling the endpoint for a date range.

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - `ownerKpis/{date}` node exists in Firebase RTDB after writer runs for a date with bookings.
  - `/owner` dashboard shows non-zero `guestCount` and KPI percentages for that date.
  - Writer unit test passes.
- Post-delivery measurement plan:
  - Check Firebase RTDB console for `ownerKpis/` subtree 24 hours after cron is set up.
  - Load `/owner` dashboard and confirm non-zero values.

## Evidence Gap Review

### Gaps Addressed

- Confirmed that `aggregateDailyKpis()` has no non-test callers (grep over entire codebase).
- Confirmed RTDB security rules require `messagingUsers` role-based auth for `ownerKpis` writes.
- Confirmed wrangler.toml has no cron trigger.
- Confirmed `FirebaseRest` pattern is used for both read and write (GET + POST) in CF Pages Functions.
- Confirmed `checkInDate` is definitively NOT indexed in `database.rules.json` (only `start_time`, `occupants`).
- Confirmed that the `kpiAggregator.ts` `RawDayData` input interface does NOT match the actual RTDB schema — signals are distributed across 6 top-level roots (`preArrival/`, `checkInCodes/`, `checkins/`, `primeRequests/`, `bagStorage/`, `bookings/`).
- Confirmed `firebase-custom-token.ts` and `staff-auth-session.ts` exist as the correct auth pattern for role-gated Firebase writes.

### Confidence Adjustments

- Implementation confidence revised DOWN to 65% (initial estimate was ~80%) after discovering the `RawDayData` / actual RTDB schema mismatch — the writer is more complex than initially assumed.
- Approach confidence revised DOWN to 65% — multiple unresolved choices (projection vs aggregator redesign, guest enumeration strategy, auth approach).
- Auth risk elevated from Medium to High — `CF_FIREBASE_API_KEY` pattern is definitively insufficient for `messagingUsers` role check.

### Remaining Assumptions

- `roomsByDate/{date}` contains guest UUIDs or booking IDs that could serve as a date-based enumeration index — unconfirmed but plausible from path helper naming in `packages/lib/src/hospitality/index.ts`.
- The actual `bookings/{bookingId}/{guestUuid}` structure contains `checkInDate` at the occupant level (confirmed from `extension-request.ts` line 138-139 reading `checkOutDate` from this path; `checkInDate` is consistent).
- The hostel has a bounded number of check-ins per day (likely ≤ 30) — makes O(N * 6) reads acceptable for a daily batch job.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Owner dashboard pages (read path) | Yes | None | No |
| KPI reader module | Yes | None — reads correctly, returns zeros for missing data | No |
| KPI aggregation pure functions | Yes | None — fully unit-tested | No |
| Missing writer (pipeline gap) | Yes | [Missing Domain Coverage] [Blocking]: No writer exists — `aggregateDailyKpis()` has no non-test caller in the codebase | No (this is the work) |
| RTDB security rules for `ownerKpis` | Yes | [Missing Domain Coverage] [Advisory]: Write rule requires role check — auth strategy for server-side write is an open question | Yes (resolved as open question for planning) |
| Trigger/scheduling mechanism | Yes | [Missing Domain Coverage] [Advisory]: No cron trigger in prime app. Options identified (CF Worker, GitHub Actions, on-demand endpoint) but decision deferred to operator. | Yes (open question for planning) |
| RTDB `bookings` index for `checkInDate` | Yes | [System Boundary Coverage] [Blocking]: `checkInDate` is definitively NOT indexed in `database.rules.json` (only `start_time`, `occupants`). Full scan confirmed as necessary unless `roomsByDate/{date}` is usable. | Yes (task seed TASK-A) |
| RTDB data topology mismatch | Yes | [Missing Domain Coverage] [Blocking]: `kpiAggregator.ts` `RawDayData` assumes `bookings/{bookingId}/occupants/{uuid}/preArrival` etc. Actual schema distributes signals across 6 roots: `preArrival/`, `checkInCodes/byUuid/`, `checkins/{date}/`, `primeRequests/byGuest/`, `bagStorage/`. Writer must project from real paths. | Yes (task seed TASK-A) |
| Test coverage for writer | Yes | None — writer tests documented as gap; existing patterns provide clear seam for new tests | No (captured in test landscape) |
| Production access gate | Partial | [System Boundary Coverage] [Advisory]: `NEXT_PUBLIC_ENABLE_STAFF_OWNER_ROUTES` env var status in production unknown | No (separate concern, captured as risk) |

## Scope Signal

- **Signal:** right-sized
- **Rationale:** The gap is precisely identified — one missing server-side function (the writer) plus a trigger mechanism. All surrounding code is complete. The open questions are resolvable in planning. Expanding scope to redesign the dashboard, add new metrics, or restructure the aggregation architecture is not warranted by the evidence.

## Analysis Readiness

- **Status:** Ready-for-analysis
- Blocking items: None
- Recommended next step: `/lp-do-analysis prime-owner-dashboard-pipeline`
