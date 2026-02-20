---
Type: Schema-Contract
Status: Active
Version: 1.1.0
Domain: Venture-Studio
Workstream: Mixed
Created: 2026-02-17
Last-updated: 2026-02-19
Owner: startup-loop maintainers
Related-plan: docs/plans/startup-loop-marketing-sales-capability-gap-audit/plan.md
Related-capability: docs/business-os/startup-loop/marketing-sales-capability-contract.md
---

# Startup Loop Artifact Registry

## Purpose

Canonical producer/consumer path contracts for all `lp-*` skill output artifacts. Each row defines the single authoritative filesystem path, the skill that produces it, and the downstream consumers that must read from that path.

Skills MUST use canonical paths from this registry. Stale or legacy paths listed in the compatibility section are invalid input sources.

## Core Artifact Registry

| Artifact ID | Producer | Stage | Canonical Path | Required Fields / Sections | Consumers | Version Marker |
|---|---|---|---|---|---|---|
| `offer` | `lp-offer` | S2B | `docs/business-os/startup-baselines/<BIZ>-offer.md` | ICP segmentation, pain/promise mapping, offer structure, positioning one-pager, pricing/packaging hypothesis, objection map + risk reversal | `lp-channels`, `lp-forecast`, `lp-seo`, `lp-do-critique` | frontmatter `artifact: offer-artifact` |
| `channels` | `lp-channels` | S6B | `docs/business-os/startup-baselines/<BIZ>-channels.md` | Selected channels (2-3), constraints (stop condition, denominator target, quality metric, owner, review date, spend/timebox), 30-day GTM timeline, budget allocation | `lp-forecast`, `lp-seo`, `lp-do-fact-find` | frontmatter `artifact: channel-strategy` |
| `forecast` | `lp-forecast` | S3 | `docs/business-os/startup-baselines/<BIZ>/S3-forecast/YYYY-MM-DD-lp-forecast.user.md` | P10/P50/P90 scenario bands, unit economics (CAC/AOV/margin/CVR), channel ranges, first-14-day validation plan, assumption register | `lp-prioritize`, startup-loop S4 baseline | Dated filename; frontmatter `artifact: forecast` |
| `seo` | `lp-seo` | S6B companion | `docs/business-os/strategy/<BIZ>/seo/YYYY-MM-DD-<phase>-<BIZ>.user.md` | Phase-specific output (keyword-universe / content-clusters / serp-briefs / tech-audit / snippet-optimization) | `draft-marketing`, `lp-launch-qa`, `lp-metrics` | Dated filename; phase tag in filename |
| `briefing_contract` | startup-loop maintainers (`lp-do-build` workflow) | S6/S10 operator briefing | `docs/business-os/startup-loop/briefing-contract-schema-v1.md` | Required metadata keys (`business`, `artifact`, `status`, `owner`, `last_updated`, `source_of_truth`, `depends_on`, `decisions`); status taxonomy; contradiction key set; T1 operator-card schema | `scripts/src/startup-loop/contract-lint.ts`, `docs/business-os/startup-loop-output-registry.user.html`, `/lp-do-build` task contracts | frontmatter `Type: Schema-Contract`, `Version: 1.0.0` |

## Path Namespace Rules

1. **Flat-file artifacts** (`offer`, `channels`): `docs/business-os/startup-baselines/<BIZ>-<artifact>.md` — no date prefix; overwritten on each run. Single authoritative file per business.
2. **Dated artifacts** (`forecast`): `docs/business-os/startup-baselines/<BIZ>/<stage>-<type>/YYYY-MM-DD-*.user.md` — one file per run; consumers read the most recent file in the directory unless a specific date is required.
3. **Phase artifacts** (`seo`): `docs/business-os/strategy/<BIZ>/seo/YYYY-MM-DD-<phase>-<BIZ>.user.md` — one file per phase per run; phases build on each other (keyword-universe → content-clusters → serp-briefs → tech-audit → snippet-optimization).
4. **Briefing integrity contract** (`briefing_contract`): `docs/business-os/startup-loop/briefing-contract-schema-v1.md` — single authoritative schema for consolidated briefing metadata/taxonomy/contradiction checks.

## S4 Join Barrier Artifact Keys

The S4 stage join barrier in `loop-spec.yaml` requires all three upstream artifacts before proceeding to prioritization:

| Join key | Canonical path template | Resolved by |
|---|---|---|
| `offer` | `docs/business-os/startup-baselines/<BIZ>-offer.md` | `lp-offer` |
| `channels` | `docs/business-os/startup-baselines/<BIZ>-channels.md` | `lp-channels` |
| `forecast` | `docs/business-os/startup-baselines/<BIZ>/S3-forecast/YYYY-MM-DD-lp-forecast.user.md` | `lp-forecast` (most recent dated file in `S3-forecast/`) |

## Legacy Path Compatibility

Paths that existed before this registry was published. Skills MUST NOT read from these paths. If a skill encounters a legacy path, it should warn the operator and reference the canonical path.

| Legacy path | Status | Canonical replacement |
|---|---|---|
| `docs/business-os/strategy/<BIZ>/YYYY-MM-DD-positioning-<BIZ>.user.md` | Stale — not produced by `lp-offer` | `docs/business-os/startup-baselines/<BIZ>-offer.md` |
| `docs/business-os/strategy/<BIZ>/YYYY-MM-DD-channel-strategy-<BIZ>.user.md` | Stale — not produced by `lp-channels` | `docs/business-os/startup-baselines/<BIZ>-channels.md` |
| `docs/business-os/startup-baselines/<BIZ>/S2-offer-hypothesis/` | Stale — never produced by `lp-offer` | `docs/business-os/startup-baselines/<BIZ>-offer.md` |
| `docs/business-os/startup-baselines/<BIZ>/S2-channel-selection/` | Stale — never produced by `lp-channels` | `docs/business-os/startup-baselines/<BIZ>-channels.md` |

## Producer/Consumer Dependency Graph

```
lp-readiness (S1)
    └── lp-offer (S2B)  →  startup-baselines/<BIZ>-offer.md
            ├── lp-forecast (S3)  →  startup-baselines/<BIZ>/S3-forecast/YYYY-MM-DD.user.md
            │       └── startup-loop S4 join barrier
            ├── lp-other-products (S3B, conditional)  →  strategy/<BIZ>/lp-other-products-prompt.md
            │       └── startup-loop S4 join barrier (optional artifact)
            ├── lp-channels (S6B)  →  startup-baselines/<BIZ>-channels.md
            │       ├── lp-seo (S6B companion)  →  strategy/<BIZ>/seo/YYYY-MM-DD-<phase>-<BIZ>.user.md
            │       └── startup-loop S4 join barrier
            └── lp-do-critique
```

## Validation Rules (for lint tooling)

When startup-loop contract lint runs, apply these checks:

| Check | Rule |
|---|---|
| `offer-consumer-path` | Any lp-* skill referencing `lp-offer` output MUST use `docs/business-os/startup-baselines/<BIZ>-offer.md` |
| `channels-consumer-path` | Any lp-* skill referencing `lp-channels` output MUST use `docs/business-os/startup-baselines/<BIZ>-channels.md` |
| `forecast-consumer-path` | Any consumer of `lp-forecast` output MUST reference `docs/business-os/startup-baselines/<BIZ>/S3-forecast/` |
| `seo-consumer-path` | Any consumer of `lp-seo` output MUST reference `docs/business-os/strategy/<BIZ>/seo/` |
| `no-legacy-path` | Paths in the Legacy Path Compatibility table MUST NOT appear in skill Input sections |
| `briefing-required-fields` | Briefing source artifacts MUST expose canonical lowercase metadata fields listed in `briefing-contract-schema-v1.md` |
| `briefing-status-taxonomy` | Briefing source artifact status MUST be one of `Draft`, `Active`, `Frozen`, `Superseded` (legacy values only allowed during explicit preflight mode) |
| `briefing-contradiction-keys` | P0 keys (`primary_channel_surface`, `primary_icp`, `hero_sku_price_corridor`, `claim_confidence`) MUST not contradict across `source_of_truth: true` artifacts |
| `briefing-operator-card` | Consolidated briefing output MUST contain required T1 operator-card blocks defined by `briefing-contract-schema-v1.md` |

## References

- Capability contract: `docs/business-os/startup-loop/marketing-sales-capability-contract.md` (CAP-01 through CAP-07)
- Demand Evidence Pack schema: `docs/business-os/startup-loop/demand-evidence-pack-schema.md`
- Briefing contract schema: `docs/business-os/startup-loop/briefing-contract-schema-v1.md`
- Stage operator dictionary: `docs/business-os/startup-loop/stage-operator-dictionary.yaml`
- Loop spec: `docs/business-os/startup-loop/loop-spec.yaml`
- Related plan: `docs/plans/startup-loop-marketing-sales-capability-gap-audit/plan.md` (TASK-06)
- Consumer skills: `.claude/skills/lp-offer/SKILL.md`, `.claude/skills/lp-channels/SKILL.md`, `.claude/skills/lp-forecast/SKILL.md`, `.claude/skills/lp-seo/SKILL.md`
