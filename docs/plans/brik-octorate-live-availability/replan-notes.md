# Replan Notes — brik-octorate-live-availability

## Blocker: TASK-00 requires Octorate Connect API credentials

**Date raised:** 2026-02-27

**Blocked task:** TASK-00 (Pre-build ARI endpoint schema verification — INVESTIGATE)

**Why blocked:** TASK-00 must make a live authenticated GET call to `https://api.octorate.com/connect/rest/v1/ari/calendar` to confirm the exact query parameter names (Q1), response field names (Q3), and data types (Q4). This requires:

- `OCTORATE_CLIENT_ID` — client ID from the Octorate Connect API partner portal
- `OCTORATE_CLIENT_SECRET` — client secret from the same portal

Neither credential is currently present in any `.env` file in the repo.

**Decision input needed from operator:**

> Please provision `OCTORATE_CLIENT_ID` and `OCTORATE_CLIENT_SECRET` by obtaining them from the Octorate Connect API partner portal (https://api.octorate.com), then add them to `apps/brikette/.env.local` (for local development) and as Cloudflare Worker secrets (`wrangler secret put OCTORATE_CLIENT_ID` / `wrangler secret put OCTORATE_CLIENT_SECRET`).

Once credentials are available, resume the build with `/lp-do-build brik-octorate-live-availability` and TASK-00 will run automatically.

**Unblocking TASK-01 without TASK-00:** TASK-01 can begin in mock mode (Red phase only — stub returning `{ rooms: {} }`) without credentials. However, the Green phase of TASK-01 (actual ARI request construction) requires the query param names confirmed by TASK-00. If you want to start TASK-01 mock work now, say so explicitly.

**Current build state:**
- Wave 1 (TASK-05): Complete (2026-02-27)
- Wave 2 (TASK-00): Blocked — credentials not provisioned
- All downstream tasks (TASK-01 through TASK-08): Pending
