---
Type: Investigation-Evidence
Status: Complete
Task: TASK-01
Feature-Slug: lp-do-ideas-source-trigger-operating-model
Created: 2026-02-25
Last-updated: 2026-02-25
---

# Registry v1 Inventory and v2 Candidate Classification

## Executive summary
- Live registry file expected by trial contract (`docs/business-os/startup-loop/ideas/trial/standing-registry.json`) is missing.
- Current monitor behavior is effectively implicit (skill/runtime contracts), not registry-driven.
- Pack-oriented monitoring is present; process-level source monitoring is documented as desired but not operationalized in registry data.

## Evidence sources
- `.claude/skills/idea-scan/SKILL.md`
- `docs/business-os/startup-loop/artifact-registry.md`
- `docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md`
- `docs/business-os/startup-loop/process-registry-v2.md`
- `docs/business-os/startup-loop/ideas/trial/queue-state.json`

## Current runtime-known entries (implicit)
| Entry | Evidence | Current role | Candidate `artifact_class` (v2) | Candidate `trigger_policy` (v2) | Notes |
|---|---|---|---|---|---|
| `MARKET-11` / `market-pack.user.md` | `idea-scan` pack scope + artifact registry | Aggregate standing pack | `projection_summary` | `manual_override_only` | Keep non-trigger by default in source-primary cutover |
| `SELL-07` / `sell-pack.user.md` | `idea-scan` pack scope + artifact registry | Aggregate standing pack | `projection_summary` | `manual_override_only` | Keep non-trigger by default in source-primary cutover |
| `PRODUCTS-07` / `product-pack.user.md` | `idea-scan` pack scope + artifact registry | Aggregate standing pack | `projection_summary` | `manual_override_only` | Keep non-trigger by default in source-primary cutover |
| `LOGISTICS-07` / `logistics-pack.user.md` | `idea-scan` pack scope + artifact registry | Aggregate standing pack (conditional) | `projection_summary` | `manual_override_only` | Conditional availability; remain absent-safe |
| `docs/business-os/startup-loop/ideas/trial/queue-state.json` | trial contract + runtime snapshot | Trial queue state | `system_telemetry` | `never` | Non-trigger telemetry artifact |
| `docs/business-os/startup-loop/ideas/trial/dispatch-ledger.jsonl` | trial contract path list (missing on disk) | Trial ledger | `system_telemetry` | `never` | Missing file in current runtime snapshot |
| `docs/business-os/startup-loop/ideas/trial/telemetry.jsonl` | trial contract path list (missing on disk) | Trial telemetry stream | `system_telemetry` | `never` | Missing file in current runtime snapshot |

## High-priority source candidates not currently registry-backed
These paths are process-level artifacts in `process-registry-v2.md` and should be onboarded as `source_process` candidates once source-trigger intake is implemented.

| Path pattern | Candidate `artifact_class` | Candidate `trigger_policy` | Rationale |
|---|---|---|---|
| `docs/business-os/strategy/<BIZ>/insight-log.user.md` | `source_process` | `eligible` | Standing insight synthesis should seed idea intake |
| `docs/business-os/strategy/<BIZ>/customer-interviews.user.md` | `source_process` | `eligible` | Customer evidence updates are high-signal |
| `docs/business-os/strategy/<BIZ>/competitor-scan.user.md` | `source_process` | `eligible` | Competitive shifts are direct trigger candidates |
| `docs/business-os/strategy/<BIZ>/experiment-backlog.user.md` | `source_process` | `eligible` | Backlog shifts can imply new implementation work |
| `docs/business-os/strategy/<BIZ>/pricing-decisions.user.md` | `source_process` | `eligible` | Pricing/offer changes are material |
| `docs/business-os/strategy/<BIZ>/channel-policy.user.md` | `source_process` | `eligible` | Channel policy changes affect GTM execution |
| `docs/business-os/strategy/<BIZ>/capacity-plan.user.md` | `source_process` | `eligible` | Capacity constraints impact execution selection |
| `docs/business-os/strategy/<BIZ>/risk-register.user.md` | `source_process` | `eligible` | Risk deltas should generate improve-lane candidates |
| `docs/business-os/strategy/<BIZ>/kpi-pack.user.md` | `source_reference` | `eligible` | Metric baseline shifts are trigger-worthy but data-driven |
| `docs/business-os/strategy/<BIZ>/weekly-demand-plan.user.md` | `source_process` | `eligible` | Demand planning shifts may require DO lane work |

## Inventory totals
| Inventory dimension | Count | Notes |
|---|---:|---|
| Live registry entries loaded from `standing-registry.json` | 0 | File missing |
| Implicit runtime-known pack/telemetry entries inventoried | 7 | 4 pack aliases + 3 trial artifacts |
| High-priority process-level source candidates listed | 10 | Seed set from process-registry v2 |
| Unknown/unclassified live entries | Unknown | Cannot compute until live registry file exists |

## Unknowns and coverage risks
1. **Registry source of truth missing:** cannot prove what runtime should monitor beyond implicit skill behavior.
2. **Pack-path drift observed in strategy tree:** canonical pack files are mostly absent; only legacy `products-aggregate-pack.user.md` is present in sampled strategy files.
3. **Unclassified source-process footprint:** process-registry defines many standing docs that are not represented in runtime registry state, creating silent under-trigger risk under fail-closed defaults.
