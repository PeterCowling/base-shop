---
Type: Runbook
Status: Active
Domain: Platform
Last-updated: 2026-03-04
Feature-Slug: reception-blind-mode-variance-measurement
---

# Live Export + Weekly Report Runbook

### Step 1 — Export cash discrepancies from Firebase
DO:
1. Open terminal in repo root: `/Users/petercowling/base-shop`
2. Run:
   ```bash
   mkdir -p docs/plans/reception-blind-mode-variance-measurement/artifacts/live
   pnpm dlx firebase-tools@13.35.1 database:get /cashDiscrepancies --project prime-f3652 \
     > docs/plans/reception-blind-mode-variance-measurement/artifacts/live/cash-discrepancies.live.json
   ```

SAVE:
- `cash-discrepancies.live.json` -> `docs/plans/reception-blind-mode-variance-measurement/artifacts/live/`

DONE WHEN:
- File exists and is non-empty:
  ```bash
  test -s docs/plans/reception-blind-mode-variance-measurement/artifacts/live/cash-discrepancies.live.json && echo OK
  ```

IF BLOCKED:
- If auth error, run `pnpm dlx firebase-tools@13.35.1 login` and retry.
- If project mismatch, verify alias in `.firebaserc` and use `--project prime-f3652` explicitly.

### Step 2 — Export keycard discrepancies from Firebase
DO:
1. Run:
   ```bash
   pnpm dlx firebase-tools@13.35.1 database:get /keycardDiscrepancies --project prime-f3652 \
     > docs/plans/reception-blind-mode-variance-measurement/artifacts/live/keycard-discrepancies.live.json
   ```

SAVE:
- `keycard-discrepancies.live.json` -> `docs/plans/reception-blind-mode-variance-measurement/artifacts/live/`

DONE WHEN:
- File exists and is non-empty:
  ```bash
  test -s docs/plans/reception-blind-mode-variance-measurement/artifacts/live/keycard-discrepancies.live.json && echo OK
  ```

IF BLOCKED:
- If path is missing in RTDB, ensure discrepancy writes are active in Reception and retry after data exists.

### Step 3 — Generate weekly blind-mode variance report
DO:
1. Choose runtime values:
   - `ACTIVATION_DATE` -> blind-mode production activation date (YYYY-MM-DD)
   - `REPORT_END_DATE` -> last fully closed Italy date (YYYY-MM-DD)
2. Run:
   ```bash
   ACTIVATION_DATE=2026-03-01
   REPORT_END_DATE=2026-03-04
   GENERATED_AT=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

   pnpm --filter scripts reception:blind-mode-variance-report -- \
     --cash ../docs/plans/reception-blind-mode-variance-measurement/artifacts/live/cash-discrepancies.live.json \
     --keycard ../docs/plans/reception-blind-mode-variance-measurement/artifacts/live/keycard-discrepancies.live.json \
     --activation-date "$ACTIVATION_DATE" \
     --report-end-date "$REPORT_END_DATE" \
     --window-days 28 \
     --generated-at "$GENERATED_AT" \
     --output ../docs/plans/reception-blind-mode-variance-measurement/artifacts/live/blind-mode-variance-weekly.live.md \
     --json-output ../docs/plans/reception-blind-mode-variance-measurement/artifacts/live/blind-mode-variance-weekly.live.json
   ```

SAVE:
- `blind-mode-variance-weekly.live.md` -> `docs/plans/reception-blind-mode-variance-measurement/artifacts/live/`
- `blind-mode-variance-weekly.live.json` -> `docs/plans/reception-blind-mode-variance-measurement/artifacts/live/`

DONE WHEN:
- CLI returns `"ok": true` and both files exist.

IF BLOCKED:
- If `ENOENT` appears, confirm command is run from repo root and paths use `../docs/...` for `pnpm --filter scripts` context.
- If post window truncation warning appears, verify `ACTIVATION_DATE` and `REPORT_END_DATE` values.

### Step 4 — Record threshold action (A/B/C)
DO:
1. Open `blind-mode-variance-weekly.live.json`.
2. Read `deltas.combined_abs_improvement_percent`.
3. Apply action contract from `task-03-review-cadence.md`:
   - A: >= 10
   - B: 0 to < 10
   - C: < 0

SAVE:
- Action note (A/B/C + owner + rationale) -> append to weekly operations log in plan notes or results-review follow-up.

DONE WHEN:
- Weekly artifact and action note both exist.

IF BLOCKED:
- If value is `null`, baseline mean is zero; raise a fact-find to redefine comparator for zero-baseline weeks.
