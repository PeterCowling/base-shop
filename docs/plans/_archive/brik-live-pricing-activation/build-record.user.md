---
Status: Complete
Feature-Slug: brik-live-pricing-activation
Completed-date: 2026-02-27
artifact: build-record
---

# Build Record — BRIK Live Pricing Activation

## What Was Built

**TASK-01: Cloudflare Pages Function for `/api/availability`**

Created `apps/brikette/functions/api/availability.js` — a Cloudflare Pages Function that replicates the existing Next.js API route handler logic in plain JavaScript. The function exports `onRequestGet(context)`, reads the feature flag from `context.env.NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY` (not `process.env`, which is unavailable in the CF Workers runtime), and inlines `BOOKING_CODE = "45111"`. All six helper functions from `route.ts` were ported verbatim (`countNights`, `isValidDate`, `parseTotalPrice`, `stripTags`, `parseRoomSection`, `parseOctobookHtml`). The `NextResponse` import and `next: { revalidate: 300 }` fetch option were removed. The function returns `{ rooms: [], fetchedAt }` when the flag is off, HTTP 400 for missing/invalid params, and HTTP 200 with `{ rooms: [], fetchedAt, error: "upstream_error" }` when Octobook is unreachable.

**TASK-02: Hide `api/` from static export builds + add production flag**

Modified `.github/workflows/brikette.yml` at three build locations (static-export-check, staging, production) to hide `src/app/api` → `src/app/_api-off` before the static export build and restore it unconditionally after, mirroring the established `[...slug]` hide/restore pattern. Added `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY=1` to the production build-cmd inline env var string only — staging builds without the flag by default to avoid surfacing live pricing to guests before production validation.

**TASK-03: Post-deploy health check for `/api/availability`**

Added `healthcheck-extra-routes: "/api/health /api/availability?checkin=2026-05-01&checkout=2026-05-03&pax=1"` to the production job `with:` block in `brikette.yml`. The production health check now verifies both the existing `/api/health` redirect and the Pages Function `/api/availability` endpoint after every production deploy. Dates are fixed absolute values (GitHub Actions does not support dynamic `with:` values); they should be refreshed annually.

**TASK-04: Operator smoke test instructions**

Produced `docs/plans/brik-live-pricing-activation/task-04-smoke-test-results.md` with full operator run instructions (dev server startup command with flag, correct port 3012, `PLAYWRIGHT_BASE_URL` env var), TC-07-01/02/03 results table awaiting operator fill-in, troubleshooting guide, and a CF Pages environment variable verification reminder. Per `AGENTS.md` line 93, the agent does not execute e2e tests.

## Tests Run

- YAML syntax validation on `.github/workflows/brikette.yml`: passed (`python3 -c "import yaml; yaml.safe_load(...)"`)
- Pre-commit hooks on both commits: typecheck (turbo cached, no TS in scope), lint-staged (brikette scope), validate-agent-context — all passed
- TC validation (Mode 2 data simulation — no CI run performed in this build cycle):
  - TASK-01: 5 TCs verified against file content
  - TASK-02: 3 TCs verified against updated brikette.yml content
  - TASK-03: 2 TCs verified against updated brikette.yml content
  - TASK-04: 3 TCs verified (artifact created, instructions complete, results table present)
- Playwright availability smoke test (TC-07-01/02/03): NOT executed by agent — awaiting operator run per `AGENTS.md` line 93

## Validation Evidence

**TASK-01 TCs (all pass):**
- TC-01 (happy path, flag on): `onRequestGet` fetches Octobook and returns `{ rooms: [...], fetchedAt }` HTTP 200
- TC-02 (flag-off fast path): `context.env.NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY !== "1"` → returns `{ rooms: [], fetchedAt }` HTTP 200
- TC-03 (missing params): missing `checkin`/`checkout` → returns `{ error: "missing_params" }` HTTP 400
- TC-04 (invalid range): checkout before checkin → `countNights <= 0` → returns `{ error: "invalid_range" }` HTTP 400
- TC-05 (upstream error): fetch throws → returns `{ rooms: [], fetchedAt, error: "upstream_error" }` HTTP 200
- No TypeScript syntax: file is plain JS, confirmed by inspection
- `BOOKING_CODE = "45111"` inlined with sync comment, confirmed against `constants.ts`

**TASK-02 TCs (all pass):**
- TC-01: `[ -d "src/app/api" ] && mv "src/app/api" "src/app/_api-off" || true` present before build in static-export-check (line 103), staging (line 149), production (line 191)
- TC-02: `[ -d "src/app/_api-off" ] && mv "src/app/_api-off" "src/app/api" || true` present after build (unconditionally) in all 3 locations (lines 116, 154, 196)
- TC-03: `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY=1` present in production build-cmd (line 192); absent from staging and static-export-check

**TASK-03 TCs (all pass):**
- TC-01: `healthcheck-extra-routes` in production `with:` block includes `/api/availability?checkin=2026-05-01&checkout=2026-05-03&pax=1` (line 217)
- TC-02: `/api/health` still included in the extra-routes string (line 217)

**TASK-04 TCs (all pass):**
- TC-01: `task-04-smoke-test-results.md` created with run instructions, TC results table, troubleshooting guide, CF Pages env var reminder
- TC-02: dev port 3012 confirmed from `apps/brikette/package.json` dev script; `PLAYWRIGHT_BASE_URL=http://localhost:3012` in instructions
- TC-03: TC-07-01/02/03 results table present (Status: PENDING, awaiting operator)

## Scope Deviations

None. All changes are within the planned `Affects` scope:
- `apps/brikette/functions/api/availability.js` (new) — TASK-01
- `.github/workflows/brikette.yml` — TASK-02, TASK-03
- `docs/plans/brik-live-pricing-activation/task-04-smoke-test-results.md` (new) — TASK-04
- `docs/plans/brik-live-pricing-activation/plan.md` (status updates) — post-task updates

## Outcome Contract

- **Why:** The live pricing feature was built and remains inactive on production. Activating it completes the original intent of the brik-octorate-live-availability plan: showing guests real-time room prices and availability directly on room detail pages.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY=1` is set in the production build environment, the deployment succeeds, and live prices from Octorate appear on the book page (`/en/book`) or room detail pages within 15 seconds of date entry.
- **Source:** operator
