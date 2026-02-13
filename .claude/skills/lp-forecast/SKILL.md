---
name: lp-forecast
description: S3 startup 90-day forecaster — build P10/P50/P90 scenario bands from zero operational data
---

# lp-forecast — Startup 90-Day Forecaster

Build P10/P50/P90 scenario bands and first-14-day validation plan for pre-launch or newly launched businesses with zero historical performance data.

## Invocation

```bash
/lp-forecast --business <BIZ> [--horizon-days 90] [--launch-surface pre-website|website-live]
```

- `--business`: Business name (BRIK, intshop, etc.)
- `--horizon-days`: Forecast horizon in days (default: 90)
- `--launch-surface`: Stage of launch — `pre-website` (MVP planning) or `website-live` (post-launch tracking)

## Operating Mode

READ + RESEARCH + FORECAST

- Read existing business context, offer hypothesis (from lp-offer/S2B), and available market data
- Research competitor benchmarks, channel performance ranges, and market size signals
- Forecast P10/P50/P90 scenario bands with unit economics assumptions
- Generate first-14-day validation plan (THE primary deliverable)

## Differs from idea-forecast

This skill is NOT a rename or copy of `idea-forecast`. Key differences:

1. **Works from zero operational data**: idea-forecast requires historical performance data or existing market intelligence packs. lp-forecast builds forecasts from competitor benchmarks and channel ranges only.

2. **No market intelligence pack prerequisite**: idea-forecast blocks when `latest.user.md` market research is stale and requires Deep Research prompt. lp-forecast proceeds with available evidence (competitor pricing, channel benchmarks) and marks confidence accordingly.

3. **Simpler output contract**: idea-forecast delivers a full 12-section Output Contract with detailed channel plans and financial models. lp-forecast delivers P10/P50/P90 bands, unit economics assumptions, and a first-14-day validation plan.

4. **No Deep Research gate**: idea-forecast stops and requires manual Deep Research when data is insufficient. lp-forecast proceeds with available evidence and tags assumptions as low-confidence when data is sparse.

5. **Validation-first mindset**: Both include first-14-day validation plans, but lp-forecast makes this THE central output — the forecast is a hypothesis to validate, not a plan to execute.

## Inputs

Reads from:
- Business context: `docs/business-os/startup-baselines/<BIZ>/`
- Offer hypothesis: Output from lp-offer (S2B) — `docs/business-os/startup-baselines/<BIZ>/S2-offer-hypothesis/`
- Channel selection: Output from lp-channels — `docs/business-os/startup-baselines/<BIZ>/S2-channel-selection/`
- Market data: Any available competitor pricing, channel benchmarks, market size signals (opportunistic)

No formal market intelligence pack required. If none exists, proceed with web research.

## Workflow

### Stage 1: Gather Available Evidence

- Read offer hypothesis (pricing, target customer, value prop)
- Read channel selection (which channels, why chosen)
- Web research: competitor pricing, channel benchmarks (e.g., Google Ads CPC for niche, email open rates for vertical)
- Market size signals: search volume, competitor traffic estimates, industry reports (opportunistic)
- Tag confidence: high (multiple sources), medium (single source), low (extrapolated/assumed)

### Stage 2: Build Scenario Forecast

Create P10/P50/P90 scenario bands for:
- **Revenue**: 90-day cumulative revenue range
- **Orders**: 90-day order count range
- **Traffic**: 90-day unique visitor range (if website-live)
- **Leads**: 90-day lead count range (if pre-website)

Scenarios:
- **P10** (pessimistic): Low conversion, high CAC, slow ramp
- **P50** (base case): Channel benchmark conversion, median CAC, steady ramp
- **P90** (optimistic): High conversion, low CAC, fast ramp

### Stage 3: Define Unit Economics Assumptions

For each scenario (P10/P50/P90):
- **CAC**: Customer acquisition cost per channel
- **AOV**: Average order value
- **Margin**: Gross margin per order
- **Conversion rate**: Visitor-to-order or lead-to-order
- **Channel mix**: Traffic/spend distribution across selected channels

### Stage 4: Create First-14-Day Validation Plan

THE key output. Define:
- **Metrics to track**: Which KPIs confirm or refute the forecast
- **Measurement cadence**: Daily/weekly/milestone-based
- **Decision gates**: When to pivot, pause, or accelerate
- **Validation thresholds**: What metrics must hit what values by day 7, day 14
- **Data sources**: Where to pull each metric (analytics, CRM, ads dashboard)

Example decision gate: "If Day 7 CAC exceeds P90 CAC by 50%, pause paid channels and pivot to organic."

### Stage 5: Persist Output

Write forecast to:
```
docs/business-os/startup-baselines/<BIZ>/S3-forecast/YYYY-MM-DD-lp-forecast.user.md
```

Output format:
- Scenario summary table (P10/P50/P90 bands)
- Unit economics assumptions per scenario
- Channel-specific ranges (per channel selected in lp-channels)
- First-14-day validation plan (metrics, thresholds, decision gates)
- Assumption register with confidence tags
- Source list with URLs

## Output Contract

File: `docs/business-os/startup-baselines/<BIZ>/S3-forecast/YYYY-MM-DD-lp-forecast.user.md`

Required sections:
1. **Scenario Summary**: P10/P50/P90 bands for revenue, orders, traffic/leads
2. **Unit Economics**: CAC, AOV, margin, conversion rate per scenario
3. **Channel Ranges**: Traffic, spend, CAC per channel (from lp-channels)
4. **First-14-Day Validation Plan**: Metrics, thresholds, decision gates, data sources
5. **Assumption Register**: List all assumptions with confidence tags (high/medium/low) and sources
6. **Source List**: URLs for competitor data, channel benchmarks, market signals

## Quality Checks

Self-audit before delivery:
- [ ] All three scenarios (P10/P50/P90) present with numeric ranges
- [ ] Unit economics defined for each scenario
- [ ] Channel-specific ranges match channels selected in lp-channels
- [ ] First-14-day validation plan includes metrics, thresholds, and decision gates
- [ ] Assumption register tags confidence level for each assumption
- [ ] Source list includes URLs for all claims (no unsourced assertions)
- [ ] Output file persisted to `docs/business-os/startup-baselines/<BIZ>/S3-forecast/`

## Red Flags

Invalid outputs that require rework:
- Single-point forecast (no P10/P50/P90 bands)
- Missing first-14-day validation plan
- Unsourced claims (no URLs in source list)
- Unit economics missing for any scenario
- Channel ranges don't match lp-channels output
- No confidence tags on assumptions
- Validation plan has no decision gates

## Integration

- **Consumes**: lp-offer output (S2B), lp-channels output (S2C)
- **Feeds into**: lp-prioritize (S4 prioritization), startup-loop S4 baseline (first-14-day tracking)
- **Trigger**: Called automatically by startup-loop at S3 stage, or manually via `/lp-forecast`

## Launch Surface Modes

### pre-website
- Focus on lead generation metrics (email signups, waitlist, pre-orders)
- Traffic forecast not required (no website yet)
- CAC based on pre-launch channels (social, partnerships, waitlist ads)

### website-live
- Focus on traffic, conversion, orders
- CAC based on post-launch channels (SEO, paid ads, email, partnerships)
- Include visitor-to-order funnel metrics

## Notes

- This forecast is a **hypothesis to validate**, not a prediction to execute
- Low-confidence assumptions are acceptable — tag them clearly
- First-14-day validation plan is THE critical output (the forecast exists to be tested)
- If evidence is sparse, proceed with low-confidence tags and wide P10-P90 bands
- No Deep Research gate — work with what's available and mark uncertainty
