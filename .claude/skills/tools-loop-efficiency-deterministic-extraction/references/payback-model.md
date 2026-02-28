# Payback Model

This skill uses payback as true ROI.

## Formulas

```text
MonthlyNetValueUSD = (WeeklyTokensSaved * 4.33 / 1_000_000) * ModelCostPerMTokUSD
                  + (EngineerHoursSavedPerWeek * 4.33 * LoadedEngineerRatePerHourUSD)
                  - MonthlyMaintenanceCostUSD

PaybackMonths = BuildCostUSD / MonthlyNetValueUSD
PaybackROI = MonthlyNetValueUSD / (BuildCostUSD / 12)

ExpectedMonthlyNetValueUSD = RealizationProbability * MonthlyNetValueUSD
ExpectedROI = ExpectedMonthlyNetValueUSD / (BuildCostUSD / 12)
```

## Decision Gates

- Implement now: `PaybackMonths <= 3` and `PaybackROI >= 4.0x`
- Backlog: `PaybackMonths <= 6` and `PaybackROI >= 2.0x`
- Do not implement: otherwise

## Proxy Inputs (when telemetry is unavailable)

- `WeeklyTokensSaved = (2500 * F) + (500 * D) + (300 * B)`
- `EngineerHoursSavedPerWeek = (0.16 * F) + (0.08 * B) + (0.05 * (5 - M))`
- `MonthlyMaintenanceCostUSD = 20 + (5 * M)`
- `BuildCostUSD = (6 + (1.4 * M) + (0.5 * B) + (0.4 * F)) * LoadedEngineerRatePerHourUSD`
- `RealizationProbability` defaults:
  - `proxy`: `0.50`
  - `observed`: `0.70`
  - `measured`: `0.90`
