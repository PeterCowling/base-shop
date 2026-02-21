<!-- AUTO-GENERATED — do not edit directly. Edit stage-operator-dictionary.yaml and re-run: node --import tsx scripts/src/startup-loop/generate-stage-operator-views.ts -->
<!-- Source: docs/business-os/startup-loop/stage-operator-dictionary.yaml | loop-spec: 3.0.0 -->

# Startup Loop — Stage Operator Reference

| # | Stage ID | Short label | Outcome | Aliases | Conditional |
|---|---|---|---|---|---|
| 1 | `DISCOVERY-01` | Problem framing | Clear problem statement with articulated pain, affected customer, and evidence of real demand. | `problem-framing`, `discovery-01` | start-point = problem |
| 1 | `DISCOVERY-02` | Solution-space scan | Mapped solution space with at least three distinct options and comparative feasibility notes. | `solution-space`, `discovery-02` | start-point = problem |
| 1 | `DISCOVERY-03` | Option selection | Selected solution option with rationale, key assumptions, and handoff brief for DISCOVERY intake. | `option-selection`, `discovery-03` | start-point = problem |
| 1 | `DISCOVERY-04` | Naming handoff | Validated business or product name with brand-safety check and domain availability confirmed. | `naming-handoff`, `discovery-04` | start-point = problem |
| 1 | `DISCOVERY-05` | Channel Plan | Distribution plan with ≥2 launch channels, cost/effort estimates, and ICP fit rationale. | `distribution-planning`, `discovery-05`, `channel-plan` | start-point = problem |
| 1 | `DISCOVERY-06` | Measure Plan | Measurement plan with tracking method, ≥2 key metrics, success thresholds, and data collection feasibility confirmed. | `measurement-plan`, `discovery-06`, `measure-plan` | start-point = problem |
| 1 | `DISCOVERY-07` | Operator evidence | Operator evidence packet: launch surface, stock status, pricing model, channel pre-decisions, and open evidence gaps documented. | `operator-evidence`, `our-stance`, `discovery-07` | start-point = problem |
| 1 | `DISCOVERY` | Intake | Structured startup context packet ready for all downstream stages. | `intake`, `discovery` | — |
| 1 | `BRAND-01` | Brand-01 | Business name confirmed; personality adjective pairs, audience, voice & tone documented. | `brand-strategy`, `brand-01` | — |
| 1 | `BRAND-02` | Brand-02 | Visual language: colour palette, typography, imagery direction, token overrides. Brand dossier at Draft+. | `brand-identity`, `brand-02`, `brand-dossier` | — |
| 1 | `BRAND` | Brand | Brand stage complete. Proceeds to S1 (no gate). | `brand`, `brand-intake` | — |
| 2 | `S1` | Readiness check | Readiness report with blocker list. All 7 gates checked. | `readiness`, `s1` | — |
| 3 | `S1B` | Measure | Analytics stack live with GA4, Search Console, and conversion events verified before any paid traffic. | `measure`, `measurement-bootstrap`, `measurement-setup`, `s1b` | launch-surface = pre-website |
| 4 | `S2A` | Results | Consolidated business history document with net value, booking data, and traffic logs as a decision baseline. | `results`, `historical-baseline`, `baseline-history`, `s2a` | launch-surface = website-live |
| 5 | `S2` | Market intelligence | Decision-grade market intelligence pack covering competitors, demand, pricing, and channels. | `market-intelligence`, `market-intel`, `s2` | — |
| 6 | `S2B` | Offer design | Offer artifact: target customer, positioning, pricing model, and messaging hierarchy. | `offer-design`, `offer`, `s2b` | — |
| 7 | `S3` | Forecast | 90-day P10/P50/P90 revenue forecast with assumption register and sparse-evidence guardrails. | `forecast`, `s3` | — |
| 7 | `S3B` | Adjacent product research | Adjacent product research results: 5-10 candidate product types with feasibility flags and ICP fit scoring for product range expansion. | `adjacent-product-research`, `adjacent-products`, `s3b` | growth_intent includes product_range OR operator_invoked |
| 8 | `S6B` | Channel strategy + GTM | Channel plan with 2-3 selected launch channels, 30-day GTM timeline, and SEO strategy. | `channel-strategy`, `channels`, `gtm`, `s6b` | — |
| 9 | `S4` | Baseline merge | Candidate baseline snapshot and draft manifest combining offer, forecast, and channel artifacts. | `baseline-merge`, `s4` | — |
| 10 | `S5A` | Prioritize | Scored and ranked action list — top 2-3 items to work on next. | `prioritize`, `s5a` | — |
| 11 | `S5B` | BOS sync | Business OS cards and stage docs persisted to D1. Manifest pointer committed. | `bos-sync`, `s5b` | — |
| 12 | `S6` | Site-upgrade synthesis | Site upgrade brief with prioritized improvement backlog derived from competitor best-of analysis. | `site-upgrade`, `site-upgrade-synthesis`, `s6` | — |
| 13 | `DO` | Do | Feature or artifact delivered: fact-find brief, sequenced plan, and implementation with validation evidence. | `do`, `fact-find`, `plan`, `build`, `s7`, `s8`, `s9` | — |
| 14 | `S9B` | QA gates | QA gate pass evidence: conversion flows, SEO readiness, performance budget, and legal compliance verified. | `qa-gates`, `qa`, `s9b` | — |
| 15 | `S10` | Weekly decision | Weekly K/P/C/S decision document with denominator-valid KPI assessment and next actions. | `weekly-readout`, `weekly-decision`, `weekly`, `s10` | — |

### `S6B` microsteps

| Gate ID | Label | Type | Description |
|---|---|---|---|
| `GATE-S6B-STRAT-01` | Strategy design complete | Hard | Channel hypothesis and strategy design are complete. Requires S2B offer artifact. Allows channel plan artifact generation. Does not require measurement verification. |
| `GATE-S6B-ACT-01` | Spend authorization | Hard | Spend activation gate. Requires decision-grade measurement signal verified (GATE-MEAS-01 pass). Blocks any live spend or channel activation until measurement thresholds are met. |
