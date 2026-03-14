---
Type: BuildRecord
Plan: docs/plans/prime-owner-dashboard-pipeline/plan.md
Feature-Slug: prime-owner-dashboard-pipeline
Build-Date: 2026-03-13
Build-Status: Partial — Wave 1+2 complete; TASK-06 blocked; TASK-07 pending operator
Commits:
  - f38efd8b53 feat(prime): build KPI aggregation pipeline Wave 1 (TASK-01, TASK-02, TASK-03)
  - 2abaa7719f feat(prime): implement KPI aggregation endpoint + daily cron (TASK-04 + TASK-05)
---

# Build Record — Prime Owner Dashboard Pipeline

## What was built

### Wave 1 (commit `f38efd8b53`)

**TASK-01:** `PRIME_KPI_AGGREGATION_SECRET` registered as CF Pages secret and GitHub Actions repository secret. `apps/prime/wrangler.toml` doc comment updated to reference all 4 required secrets.

**TASK-02:** `messagingUsers/svc-kpi-aggregator` Firebase RTDB node written with `{ role: 'admin' }` — satisfies both `preArrival` read and `ownerKpis` write RTDB rules simultaneously (the narrowest role intersection).

**TASK-03:** `apps/prime/functions/lib/kpi-projection.ts` built (302 lines). Exports `projectGuestKpiData(date, guestUuids, firebase)` → `RawDayData`. Reads 6 RTDB roots per UUID: `bookings/{bookingRef}/{uuid}`, `checkInCodes/byUuid/{uuid}` (for `checkInCode`), `checkins/{date}/{uuid}` (for `checkInAt` ISO→ms), `preArrival/{uuid}`, `primeRequests/byGuest/{uuid}` + `primeRequests/byId/{requestId}` (filtered to `extension` and `bag_drop` types), `bagStorage/{uuid}`. `kpi-projection.test.ts`: 7/7 pass.

### Wave 2 (commit `2abaa7719f`)

**TASK-04:** `apps/prime/functions/api/aggregate-kpis.ts` built (208 lines). CF Pages `onRequestPost` handler: bearer secret validation → env check → custom JWT generation via `createFirebaseCustomToken(svc-kpi-aggregator)` → Identity Toolkit token exchange → `roomsByDate/{date}` enumeration (primary) or full `bookings` scan (fallback) → `projectGuestKpiData()` → `aggregateDailyKpis()` → PUT to `ownerKpis/{date}`. `aggregate-kpis.test.ts`: 8/8 pass (TC-01 through TC-08). `apps/prime/functions/__tests__/helpers.ts` updated to add `PRIME_KPI_AGGREGATION_SECRET?: string` to `MockEnv`.

**TASK-05:** `.github/workflows/prime-kpi-aggregation.yml` written. Schedule `0 2 * * *` (02:00 UTC daily). `workflow_dispatch` with optional `date` input. Target: `https://prime.brikette.com/api/aggregate-kpis`. Fails step if HTTP status ≥ 400.

## Tasks blocked / deferred

### TASK-06: Enable `NEXT_PUBLIC_ENABLE_STAFF_OWNER_ROUTES=true` — BLOCKED

**Security pre-condition not met.**

Two gate implementations exist:

| Layer | File | Auth mechanism |
|---|---|---|
| CF Pages Functions (API) | `apps/prime/functions/lib/staff-owner-gate.ts` | Checks `cf-access-authenticated-user-email` header (Cloudflare Access aware) |
| Next.js SSR (pages) | `apps/prime/src/lib/security/staffOwnerGate.ts` | Bare `process.env.NEXT_PUBLIC_ENABLE_STAFF_OWNER_ROUTES === 'true'` check — no auth |

Setting `NEXT_PUBLIC_ENABLE_STAFF_OWNER_ROUTES=true` enables the SSR owner pages (`/owner`, `/owner/scorecard`) without any session authentication. Real guest KPI data would be accessible to unauthenticated requests.

**Required before unblocking:**
- Option A: Confirm that a Cloudflare Access rule is applied to the `/owner` path in the CF Pages production project. If CF Access is enforcing authentication at the edge, the bare env-var check is acceptable (the request never reaches Next.js unless authenticated).
- Option B: Add a session auth check to `apps/prime/src/app/owner/page.tsx` (e.g., Firebase Auth session cookie verification) so the page itself rejects unauthenticated requests.

This is operator-confirmed work. Blocked until one option is explicitly verified.

### TASK-07: Backfill `ownerKpis` for last 30 days — PENDING OPERATOR ACTION

The `prime-kpi-aggregation.yml` workflow exists and is ready. The Wave 2 code (`aggregate-kpis.ts` + `kpi-projection.ts`) is committed on branch `dev` and must be deployed to production before the workflow calls will succeed.

**Operator action after deployment:**
```bash
for i in $(seq 30 -1 1); do
  gh workflow run prime-kpi-aggregation.yml \
    --repo <owner>/base-shop \
    --field date=$(date -d "$i days ago" +%Y-%m-%d)
  sleep 2
done
```

Monitor via `gh run list --workflow=prime-kpi-aggregation.yml`. Verify backfill by checking Firebase RTDB console under `ownerKpis/`.

## Test coverage

| File | Tests | Status |
|---|---|---|
| `apps/prime/functions/lib/__tests__/kpi-projection.test.ts` | 7 (TC-01 to TC-07) | Pass |
| `apps/prime/functions/api/__tests__/aggregate-kpis.test.ts` | 8 (TC-01 to TC-08) | Pass |
| `apps/prime/src/lib/owner/__tests__/kpi-aggregation-daily.test.ts` | 9 | Pass (unchanged) |
| `apps/prime/src/lib/owner/__tests__/arrivalKpis.test.ts` | (existing) | Pass (unchanged) |

## Files changed

```
apps/prime/functions/api/aggregate-kpis.ts          (new, 208 lines)
apps/prime/functions/api/__tests__/aggregate-kpis.test.ts  (new)
apps/prime/functions/lib/kpi-projection.ts           (new, 302 lines)
apps/prime/functions/lib/__tests__/kpi-projection.test.ts  (new)
apps/prime/functions/__tests__/helpers.ts            (modified — MockEnv addition)
apps/prime/wrangler.toml                             (modified — doc comment)
.github/workflows/prime-kpi-aggregation.yml          (new)
docs/plans/prime-owner-dashboard-pipeline/plan.md    (updated)
```

## Outcome

The KPI aggregation pipeline is code-complete. The daily cron (`0 2 * * *`) will write `ownerKpis/{date}` to Firebase RTDB starting from the next 02:00 UTC run after deployment. The owner dashboard will show real guest data once:
1. Wave 2 code is deployed (merge `dev` → production)
2. At least one cron run completes (or a manual backfill is triggered per TASK-07)
3. TASK-06 is unblocked (Cloudflare Access confirmed or session auth added to owner pages)
