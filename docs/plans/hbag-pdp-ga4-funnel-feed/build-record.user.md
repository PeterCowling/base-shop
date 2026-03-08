---
Type: Build-Record
Status: Complete
Feature-Slug: hbag-pdp-ga4-funnel-feed
Completed-date: 2026-03-04
artifact: build-record
---

# Build Record: HBAG PDP GA4 Funnel Feed

## Outcome Contract
- **Why:** The trust-cues improvement can only be validated if we can repeatedly observe whether PDP visitors progress from view_item to begin_checkout. Without a standing feed, each cycle remains evidence-light and cannot close the KPI loop.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** A standing HBAG PDP funnel artifact is produced weekly with GA4 counts/rates for view_item and begin_checkout so outcome reviews can compare trend direction and detect regression within one cycle.
- **Source:** operator

## What Was Built
Implemented a standing HBAG PDP funnel feed generator at `scripts/src/startup-loop/diagnostics/hbag-pdp-funnel-feed.ts` with a locked alias contract (`product_view -> view_item`, `checkout_started -> begin_checkout`) and deterministic 7-day window reporting. Added a script entrypoint (`startup-loop:hbag-pdp-funnel-feed`) in `scripts/package.json` and emitted canonical artifacts under `docs/business-os/startup-baselines/HBAG/` (`pdp-funnel-feed.json` and `pdp-funnel-feed.user.md`). Added regression tests in `scripts/src/startup-loop/__tests__/hbag-pdp-funnel-feed.test.ts` for alias locking, windowed counting, and markdown contract fields. Added operator runbook usage in `docs/business-os/startup-baselines/HBAG/pdp-funnel-feed-runbook.user.md` and integrated standing feed citation guidance into `docs/plans/_templates/results-review.user.md`.

## Tests Run
| Command | Result | Notes |
|---|---|---|
| `pnpm --filter scripts exec eslint src/startup-loop/diagnostics/hbag-pdp-funnel-feed.ts src/startup-loop/__tests__/hbag-pdp-funnel-feed.test.ts` | Pass | Clean after import-sort autofix |
| `pnpm --filter scripts exec tsc -p tsconfig.json --noEmit` | Pass | No type errors |

## Validation Evidence
### TASK-01
- VC-01: Alias mapping constant exists and is centralized in `HBAG_PDP_FUNNEL_KPI_ALIASES`.
- VC-02: Feed schema fields present (`schema_version`, `alias_contract_version`, `window`, `metrics`, `notes`).

### TASK-02
- VC-01: CLI command writes reproducible artifacts to `docs/business-os/startup-baselines/HBAG/pdp-funnel-feed.json` and `.user.md`.
- VC-02: Output includes `view_item_count`, `begin_checkout_count`, and `begin_checkout_rate`.

### TASK-03
- VC-01: Test locks alias contract values and fails on unexpected mapping changes.
- VC-02: Test verifies 7-day window filtering and rate computation.
- VC-03: Test verifies markdown output includes required KPI fields and alias section.

### TASK-04
- VC-01: Runbook added at `docs/business-os/startup-baselines/HBAG/pdp-funnel-feed-runbook.user.md`.
- VC-02: Results-review template now includes standing feed citation guidance with KPI examples.

## Scope Deviations
None.
