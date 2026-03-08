---
Type: Validation
Status: Complete
Domain: Platform
Last-updated: 2026-03-04
Feature-Slug: reception-blind-mode-variance-measurement
Task-ID: TASK-02
---

# TASK-02 Validation

## Implemented
- CLI: `scripts/src/reception/blind-mode-variance-report.ts`
- Script entry: `reception:blind-mode-variance-report` in `scripts/package.json`

## Fixture Inputs
- `docs/plans/reception-blind-mode-variance-measurement/artifacts/fixtures/cash-discrepancies.sample.json`
- `docs/plans/reception-blind-mode-variance-measurement/artifacts/fixtures/keycard-discrepancies.sample.json`

## Output Artifacts
- `docs/plans/reception-blind-mode-variance-measurement/artifacts/blind-mode-variance-weekly.sample.md`
- `docs/plans/reception-blind-mode-variance-measurement/artifacts/blind-mode-variance-weekly.sample.json`

## Determinism Proof
The generator was run twice with identical inputs and a fixed `--generated-at` timestamp.

- Markdown SHA-1 (run1): `1074615dabd3d5b080e227b7a6c944f14c208950`
- Markdown SHA-1 (run2): `1074615dabd3d5b080e227b7a6c944f14c208950`
- JSON SHA-1 (run1): `948a050677d16c2e0e5db542dfa6454702b0db7e`
- JSON SHA-1 (run2): `948a050677d16c2e0e5db542dfa6454702b0db7e`

## Command Used
```bash
pnpm --filter scripts reception:blind-mode-variance-report -- \
  --cash ../docs/plans/reception-blind-mode-variance-measurement/artifacts/fixtures/cash-discrepancies.sample.json \
  --keycard ../docs/plans/reception-blind-mode-variance-measurement/artifacts/fixtures/keycard-discrepancies.sample.json \
  --activation-date 2026-03-01 \
  --report-end-date 2026-03-03 \
  --window-days 28 \
  --generated-at 2026-03-04T20:30:00.000Z \
  --output ../docs/plans/reception-blind-mode-variance-measurement/artifacts/blind-mode-variance-weekly.sample.md \
  --json-output ../docs/plans/reception-blind-mode-variance-measurement/artifacts/blind-mode-variance-weekly.sample.json
```

## Notes
- Post window truncation warning is expected in fixture run (`activation-date` inside 28-day window).
- Production run should provide actual export snapshots from Firebase discrepancy nodes.
