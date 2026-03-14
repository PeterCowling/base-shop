# Build Record — Prime Owner Dashboard Pipeline

**Date:** 2026-03-13
**Plan slug:** prime-owner-dashboard-pipeline
**Status:** Partially complete — all code tasks done; TASK-06 (owner route enablement) blocked on security pre-condition; TASK-07 (backfill) requires deployed endpoint.

---

## Outcome Contract

- **Why:** The owner dashboard was built in prime wave 1 but the aggregation writer was never implemented. The dashboard returned zeros permanently because nothing ever wrote to `ownerKpis/{date}` in Firebase RTDB.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Owner dashboard shows non-zero, real guest KPI data after the aggregation writer runs for the first time. The `ownerKpis/{date}` nodes in Firebase RTDB are populated for recent dates.
- **Source:** auto

---

## What was built

### TASK-01 — Secret registration (Complete)
`PRIME_KPI_AGGREGATION_SECRET` registered as a CF Pages secret (via `wrangler pages secret put`) and as a GitHub Actions repository secret. `apps/prime/wrangler.toml` doc comment updated to list all 4 required secrets.

### TASK-02 — RTDB service account entry (Complete)
`messagingUsers/svc-kpi-aggregator` written to Firebase RTDB with `{ role: 'admin' }`. This satisfies both the `preArrival` read rule (requires `staff`, `admin`, or `owner` role) and the `ownerKpis` write rule (requires `owner`, `admin`, or `developer` role). `admin` is the narrowest role satisfying both.

### TASK-03 — kpi-projection.ts (Complete)
`apps/prime/functions/lib/kpi-projection.ts` (290 lines) — reads 6 Firebase RTDB roots and constructs a `RawDayData` object for `aggregateDailyKpis()`:
- `roomsByDate/{date}/{room}/{bookingRef}/guestIds[]` — primary enumeration (bookingRef available directly from path)
- `bookings/{bookingRef}/{uuid}` — occupant dates and metadata
- `checkInCodes/byUuid/{uuid}.code` — check-in code for `arrivalCodeGenPct`
- `checkins/{date}/{uuid}.timestamp` (ISO → ms) — arrival timing for `medianCheckInLagMinutes`
- `preArrival/{uuid}` — checklist progress and ETA for `readinessCompletionPct` and `etaSubmissionPct`
- `primeRequests/byGuest/{uuid}` + `primeRequests/byId/{id}` — classifies `extension` and `bag_drop` types
- `bagStorage/{uuid}` — reserved (presence recorded, not yet used by aggregator)

Fallback path: when `roomsByDate/{date}` is empty, enumerates from full `bookings` scan; uses `occupantIndex/{uuid}` to resolve `reservationCode` in that path only.

7/7 unit tests pass. Existing `kpi-aggregation-daily.test.ts` (9/9) unaffected.

### TASK-04 — aggregate-kpis.ts (Complete)
`apps/prime/functions/api/aggregate-kpis.ts` (198 lines) — CF Pages POST endpoint:
1. Bearer secret validation (`PRIME_KPI_AGGREGATION_SECRET`)
2. Date format validation (YYYY-MM-DD regex + `Date.parse`)
3. Env var check (`PRIME_FIREBASE_SERVICE_ACCOUNT_EMAIL`, `PRIME_FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY`, `CF_FIREBASE_API_KEY`)
4. Custom JWT via `createFirebaseCustomToken()` (UID `svc-kpi-aggregator`, claims `{ role: 'admin' }`)
5. Identity Toolkit exchange: `POST identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken` → Firebase ID token
6. `FirebaseRest` constructed with ID token as the `auth=` parameter
7. `enumerateGuestsByDate()` → `projectGuestKpiData()` → `aggregateDailyKpis()`
8. Idempotent PUT to `ownerKpis/{date}` via `firebase.set()`
9. Structured JSON success log; error log with detail on failure
10. Returns `{ success: true, date, guestCount, enumerationPath }`

`exchangeCustomTokenForIdToken()` extracted as internal helper. 8/8 tests pass (TC-01 through TC-08). `MockEnv` in `helpers.ts` extended with `PRIME_KPI_AGGREGATION_SECRET`.

### TASK-05 — prime-kpi-aggregation.yml (Complete)
`.github/workflows/prime-kpi-aggregation.yml` — GitHub Actions cron workflow:
- Schedule: `0 2 * * *` (02:00 UTC daily)
- `workflow_dispatch` with optional `date` input for backfill runs
- Date defaults to `$(date -u -d 'yesterday' '+%Y-%m-%d')` on Linux
- `PRIME_KPI_AGGREGATION_SECRET` from GHA repository secrets
- `curl` sends `POST` with bearer auth + JSON body to `https://prime.brikette.com/api/aggregate-kpis`
- Step fails (exit non-zero) on non-200 response

### TASK-06 — Route enablement (Blocked)
Blocked on security pre-condition: `canAccessStaffOwnerRoutes()` is a bare env-var check with no session or auth layer. Enabling `NEXT_PUBLIC_ENABLE_STAFF_OWNER_ROUTES=true` would expose owner KPI data to unauthenticated requests without additional protection. Operator must confirm Cloudflare Access or equivalent protects these routes before enabling.

### TASK-07 — Backfill (Pending deployment)
Requires the endpoint to be deployed and the workflow to be confirmed working. Execute via `gh workflow run prime-kpi-aggregation.yml --field date=YYYY-MM-DD` for each of the last 30 dates.

---

## Engineering Coverage Evidence

| Coverage Area | Status | Notes |
|---|---|---|
| UI / visual | N/A | Server-side only; dashboard UI was already complete |
| UX / states | N/A | Empty-state copy already handles zero-data; non-zero data resolves it |
| Security / privacy | Covered | Bearer secret (TASK-01+04), service account `admin` role (TASK-02), custom token → ID token exchange (TASK-04); TASK-06 security blocker documented |
| Logging / observability | Covered | Structured JSON log on success; error log with IT response on auth failure; `enumerationPath` logged per run |
| Testing / validation | Covered | 8 new tests for `aggregate-kpis.ts`; 7 for `kpi-projection.ts`; all pre-existing tests pass |
| Data / contracts | Covered | `RawDayData` interface unchanged; `DailyKpiRecord` write schema unchanged; `kpiAggregator.ts` frozen |
| Performance / reliability | Covered | `roomsByDate` primary O(rooms × bookingRefs); `bookings` fallback O(all bookings) for backfill only; idempotent PUT |
| Rollout / rollback | Covered | Additive function; GHA cron disabled in seconds; RTDB writes idempotent |

---

## Validation Evidence

- `scripts/validate-engineering-coverage.sh docs/plans/prime-owner-dashboard-pipeline/plan.md` → `{ "valid": true, "errors": [], "warnings": [] }`
- `apps/prime/functions/api/__tests__/aggregate-kpis.test.ts`: 8/8 tests pass
- `apps/prime/functions/lib/__tests__/kpi-projection.test.ts`: 7/7 tests pass
- `apps/prime/src/lib/owner/__tests__/kpi-aggregation-daily.test.ts`: 9/9 tests pass (unchanged)
- `pnpm typecheck` for `apps/prime`: clean (both `typecheck:app` and `typecheck:functions`)
- ESLint: 0 errors on new files (i18n-exempt annotations applied to server API error strings)

---

## Open Items for Next Run

1. **TASK-06** — security pre-condition: operator must confirm `/owner` route is protected by Cloudflare Access or equivalent before enabling `NEXT_PUBLIC_ENABLE_STAFF_OWNER_ROUTES=true`.
2. **TASK-07** — backfill: run `gh workflow run prime-kpi-aggregation.yml` for each of the last 30 days after deployment is confirmed.
3. **CF Pages URL** — `prime-kpi-aggregation.yml` uses `https://prime.brikette.com/api/aggregate-kpis`; confirm this is the correct production URL.

---

## Workflow Telemetry Summary

| Stage | Records | Modules | Context input bytes | Artifact bytes | Token capture |
|---|---:|---:|---:|---:|---|
| lp-do-fact-find | 1 | 1.00 | 86601 | 14634 | 0.0% |
| lp-do-analysis | 1 | 1.00 | 72294 | 0 | 0.0% |
| lp-do-plan | 1 | 1.00 | 149988 | 54810 | 0.0% |
| lp-do-build | 1 | 2.00 | 146883 | 0 | 0.0% |

**Totals:** Context input ~456k bytes across 6 modules; 7 deterministic checks run.
