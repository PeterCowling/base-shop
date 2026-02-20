# TASK-05 Probe: Brikette Turbopack Smoke CI Placement and Timing

Date: 2026-02-19  
Plan: `docs/plans/archive/turbopack-post-migration-hardening-archived-2026-02-20/plan.md`  
Task: `TASK-05`

## Scope
- Recommend where Turbopack dev smoke should live (`brikette.yml` vs `reusable-app.yml`).
- Produce concrete timeout/budget thresholds.
- Provide runnable start/readiness/assert/teardown command skeleton and pass/fail criteria.

## Inputs Reviewed
- `.github/workflows/brikette.yml`
- `.github/workflows/reusable-app.yml`
- `apps/brikette/package.json`

## Command Evidence
### 1. Active local server/lock state
Command:
```bash
lsof -nP -iTCP:3012 -sTCP:LISTEN
test -f apps/brikette/.next/dev/lock && echo LOCK_FILE_PRESENT=1
```
Observed:
- Existing `node` process was listening on `:3012`.
- `apps/brikette/.next/dev/lock` present.

Implication:
- Local probing must account for lock contention.
- CI smoke job should run in a clean runner and own the entire lifecycle.

### 2. Live route timing observations (5 requests per route)
Command:
```bash
BASE_URL=http://127.0.0.1:3012
# 5 curls per route; recorded time_total and content assertions.
```
Observed:
- `/en/apartment`
  - times: `6.829746,2.748177,1.463490,1.660614,0.975683`
  - assertion: `application/ld+json` count `1`
- `/en/help`
  - times: `2.850730,1.949868,2.172584,2.869517,5.408239`
  - assertion: `positano` count `549`
- `/en/breakfast-menu`
  - times: `20.513374,1.692164,0.348920,1.689258,0.815517`
  - assertion: `menu|breakfast` count `144`

Interpretation:
- First-hit compile spikes are real (up to ~20.5s on breakfast menu).
- A 30s per-route timeout is appropriate with margin.

### 3. Workflow topology findings
- `brikette.yml` is app-specific and already contains Brikette-specific build/deploy details.
- `reusable-app.yml` is generic and app-agnostic; adding route-specific smoke here would require new generic inputs and branching behavior.

## Recommendation
### Placement
- **Place Turbopack smoke in `brikette.yml` as a dedicated job**, not in `reusable-app.yml`.

Why:
- Keeps app-specific route assertions with app-specific workflow ownership.
- Avoids expanding generic reusable contract for one app’s content assertions.
- Easiest rollback and observability for Brikette-only signal.

### Timing Thresholds (for TASK-06)
- **Readiness timeout:** `45s`
- **Per-route assertion timeout:** `30s`
- **Workflow step budget:** `8m`

Why:
- Route compile spike observed at ~20.5s on cold path.
- 30s per-route captures cold compile with headroom.
- 45s readiness accommodates dev boot + first compile variance.
- 8m step budget is sufficient for startup + three route assertions + teardown on `ubuntu-latest`.

## Runnable Command Skeleton (CI)
```bash
set -euo pipefail

BASE_URL="http://127.0.0.1:3012"
LOG_FILE="$(mktemp)"

cleanup() {
  if [[ -n "${DEV_PID:-}" ]] && kill -0 "$DEV_PID" >/dev/null 2>&1; then
    kill "$DEV_PID" || true
    wait "$DEV_PID" || true
  fi
}
trap cleanup EXIT

# Start Turbopack dev (no --webpack)
pnpm --filter @apps/brikette dev >"$LOG_FILE" 2>&1 &
DEV_PID=$!

# Readiness: 45s max
ready=0
for _ in $(seq 1 45); do
  if curl -fsS --max-time 5 "${BASE_URL}/en/apartment" >/tmp/brikette-apartment.html 2>/dev/null; then
    ready=1
    break
  fi
  sleep 1
done
if [[ "$ready" -ne 1 ]]; then
  echo "Readiness timeout (45s)"
  tail -n 120 "$LOG_FILE" || true
  exit 1
fi

# Route assertions: 30s max each
curl -fsS --max-time 30 "${BASE_URL}/en/help" >/tmp/brikette-help.html
curl -fsS --max-time 30 "${BASE_URL}/en/breakfast-menu" >/tmp/brikette-breakfast.html

rg -q "application/ld\\+json" /tmp/brikette-apartment.html
rg -qi "positano" /tmp/brikette-help.html
rg -qi "menu|breakfast" /tmp/brikette-breakfast.html
```

## Expected Pass/Fail Criteria
- Pass when all are true:
  - dev server reaches readiness within `45s`
  - `/en/apartment` response contains `application/ld+json`
  - `/en/help` response contains `positano` (case-insensitive)
  - `/en/breakfast-menu` response contains `menu` or `breakfast` (case-insensitive)
  - each route assertion request completes within `30s`
- Fail when any criterion above fails, or server exits early.

## TASK-06 Input Contract
1. Add `turbopack-smoke` job in `.github/workflows/brikette.yml`.
2. Keep `reusable-app.yml` unchanged for this pass.
3. Implement command skeleton with:
   - `45s` readiness timeout
   - `30s` per-route timeout
   - `8m` step timeout budget
4. Ensure robust teardown + log tail on failure.
