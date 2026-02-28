---
Type: Schema-Contract
Status: Active
Version: 1.1.0
Domain: Venture-Studio
Workstream: Mixed
Created: 2026-02-17
Last-updated: 2026-02-26
Owner: startup-loop maintainers
Related-plan: docs/plans/startup-loop-marketing-sales-capability-gap-audit/plan.md
Related-capability: docs/business-os/startup-loop/marketing-sales-capability-contract.md
---

# Startup Loop Artifact Registry

## Purpose

Canonical producer/consumer path contracts for all `lp-*` skill output artifacts. Each row defines the single authoritative filesystem path, the skill that produces it, and the downstream consumers that must read from that path.

Skills MUST use canonical paths from this registry. Stale or legacy paths listed in the compatibility section are invalid input sources.

## Core Artifact Registry

**Scope note.** The rows below are the named canonical artifacts with explicit producer/consumer contracts. They are not a closed list of all standing intelligence. Any artifact meeting the Monitoring Scope qualification criteria in `two-layer-model.md` — competitor snapshots, pricing assumptions, ops runbooks, metrics baselines, SEO inventories, regulatory constraints, etc. — is equally part of Layer A and subject to the same change-detection and trigger logic. Register such artifacts in the Update Triggers table in `two-layer-model.md` when created.

| Artifact ID | Producer | Stage | Canonical Path | Required Fields / Sections | Consumers | Version Marker |
|---|---|---|---|---|---|---|
| `offer` | `lp-offer` | MARKET-06 — Offer design | `docs/business-os/startup-baselines/<BIZ>-offer.md` | ICP segmentation, pain/promise mapping, offer structure, positioning one-pager, pricing/packaging hypothesis, objection map + risk reversal | `lp-channels`, `lp-forecast`, `lp-seo`, `lp-do-critique` | frontmatter `artifact: offer-artifact` |
| `channels` | `lp-channels` | SELL-01 — Channel strategy | `docs/business-os/startup-baselines/<BIZ>-channels.md` | Selected channels (2-3), constraints (stop condition, denominator target, quality metric, owner, review date, spend/timebox), 30-day GTM timeline, budget allocation | `lp-forecast`, `lp-seo`, `lp-do-fact-find` | frontmatter `artifact: channel-strategy` |
| `forecast` | `lp-forecast` | S3 — Forecast | `docs/business-os/startup-baselines/<BIZ>/S3-forecast/YYYY-MM-DD-lp-forecast.user.md` | P10/P50/P90 scenario bands, unit economics (CAC/AOV/margin/CVR), channel ranges, first-14-day validation plan, assumption register | `lp-prioritize`, startup-loop (S4 — Priority) baseline | Dated filename; frontmatter `artifact: forecast` |
| `seo` | `lp-seo` | SELL-01 — SEO companion | `docs/business-os/strategy/<BIZ>/seo/YYYY-MM-DD-<phase>-<BIZ>.user.md` | Phase-specific output (keyword-universe / content-clusters / serp-briefs / tech-audit / snippet-optimization) | `draft-marketing`, `lp-launch-qa`, `lp-metrics` | Dated filename; phase tag in filename |
| `website-content-packet` | startup-loop WEBSITE factory (`compile-website-content-packet`) | WEBSITE-01 / DO — Design & Build | `docs/business-os/startup-baselines/<BIZ>-content-packet.md` | Source Ledger, SEO Focus (Launch-Phase), Page Intent Map, Product Copy Matrix, Copy Approval Rules | WEBSITE-01 first-build contract, `/lp-do-build` website-first-build tasks, app content materializers | frontmatter `Type: Startup-Content-Packet` |
| `briefing_contract` | startup-loop maintainers (`lp-do-build` workflow) | WEBSITE/S10 — operator briefing | `docs/business-os/startup-loop/briefing-contract-schema-v1.md` | Required metadata keys (`business`, `artifact`, `status`, `owner`, `last_updated`, `source_of_truth`, `depends_on`, `decisions`); status taxonomy; contradiction key set; T1 operator-card schema | `scripts/src/startup-loop/contract-lint.ts`, `docs/business-os/startup-loop-output-registry.user.html`, `/lp-do-build` task contracts | frontmatter `Type: Schema-Contract`, `Version: 1.0.0` |
| `product-naming` | `lp-do-assessment-13-product-naming` | ASSESSMENT-13 — Product naming | `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-product-naming.user.md` | Sections: Brand-Product Name Relationship, Product Name Candidates (≥3), TM Pre-Screen Direction, Naming Convention for Future SKUs; frontmatter: `Type: Product-Naming`, `Stage: ASSESSMENT-13` | `lp-do-assessment-14-logo-brief` (required), `lp-do-assessment-15-packaging-brief` (required) | frontmatter `artifact: product-naming` |
| `logo-brief` | `lp-do-assessment-14-logo-brief` | ASSESSMENT-14 — Logo brief | `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-logo-brief.user.md` | Sections: Mark Type, Colour Specification, Typography Specification, Use Case List (≥3), Forbidden Territory (≥2), Reference Inspirations, Optional Wordmark Note; frontmatter: `Type: Logo-Brief`, `Stage: ASSESSMENT-14` | `lp-do-assessment-15-packaging-brief` (required), `/lp-design-spec` (reads Logo Brief section of brand language template) | frontmatter `artifact: logo-brief` |
| `packaging-brief` | `lp-do-assessment-15-packaging-brief` | ASSESSMENT-15 — Packaging brief | `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-packaging-brief.user.md` | Sections: Structural Format, Surface Design Scope, Regulatory Requirements Checklist (≥3 items sourced from reference data), Brand Assets, Print Specification Notes, EAN/Barcode Note, Designer Handoff Checklist; frontmatter: `Type: Packaging-Brief`, `Stage: ASSESSMENT-15` | Operator (production/designer handoff) | frontmatter `artifact: packaging-brief`; **conditional: physical-product profile only** — absence is not an error for non-physical businesses. All consumers must implement absent-file safety. |

## Loop Output Artifact Registry

These four artifacts are produced by the feature development loop (`/lp-do-fact-find` → `/lp-do-plan` → `/lp-do-build` → operator). They use the `docs/plans/<feature-slug>/` namespace. Full contracts: `docs/business-os/startup-loop/loop-output-contracts.md`.

| Artifact ID | Producer | Stage | Canonical Path | Required Fields / Sections | Consumers | Version Marker |
|---|---|---|---|---|---|---|
| `fact-find` | `/lp-do-fact-find` | Pre-plan intake | `docs/plans/<feature-slug>/fact-find.md` | Scope, Evidence Audit, Confidence Inputs, Planning Readiness; frontmatter: `Status`, `Outcome`, `Execution-Track`, `Deliverable-Type`, `Feature-Slug`, `artifact: fact-find` | `/lp-do-plan` | frontmatter `artifact: fact-find` |
| `plan` | `/lp-do-plan` | Plan authoring | `docs/plans/<feature-slug>/plan.md` | Summary, Tasks (with ID/Type/Status/Confidence/Execution-Skill/Affects/Depends-on), Parallelism Guide, Validation Contracts, Open Decisions; frontmatter: `Status`, `Feature-Slug`, `Execution-Track`, `Last-updated`, `artifact: plan` | `/lp-do-build` | frontmatter `artifact: plan` |
| `build-record` | `/lp-do-build` | Build completion | `docs/plans/<feature-slug>/build-record.user.md` | What Was Built, Tests Run, Validation Evidence, Scope Deviations; frontmatter: `Status: Complete`, `Feature-Slug`, `Completed-date`, `artifact: build-record` | Operator (pre-archival review), Layer A standing-information refresh | frontmatter `artifact: build-record` |
| `results-review` | Operator (human) | Post-build observation (optional) | `docs/plans/<feature-slug>/results-review.user.md` | Observed Outcomes, Standing Updates (or explicit `No standing updates: <reason>`), New Idea Candidates; frontmatter: `Status`, `Feature-Slug`, `Review-date`, `artifact: results-review` | Layer A standing-information refresh; startup-loop feedback loop | frontmatter `artifact: results-review` |

## Path Namespace Rules

1. **Flat-file artifacts** (`offer`, `channels`): `docs/business-os/startup-baselines/<BIZ>-<artifact>.md` — no date prefix; overwritten on each run. Single authoritative file per business.
2. **Dated artifacts** (`forecast`): `docs/business-os/startup-baselines/<BIZ>/<stage>-<type>/YYYY-MM-DD-*.user.md` — one file per run; consumers read the most recent file in the directory unless a specific date is required.
3. **Phase artifacts** (`seo`): `docs/business-os/strategy/<BIZ>/seo/YYYY-MM-DD-<phase>-<BIZ>.user.md` — one file per phase per run; phases build on each other (keyword-universe → content-clusters → serp-briefs → tech-audit → snippet-optimization).
4. **Briefing integrity contract** (`briefing_contract`): `docs/business-os/startup-loop/briefing-contract-schema-v1.md` — single authoritative schema for consolidated briefing metadata/taxonomy/contradiction checks.
5. **Loop output artifacts** (`fact-find`, `plan`, `build-record`, `results-review`): `docs/plans/<feature-slug>/<artifact>.md` — flat within the feature slug directory. Full contracts: `docs/business-os/startup-loop/loop-output-contracts.md`.

## Aggregate Pack Registry

These four artifacts are Layer A standing aggregate packs. They are produced by the tail stage of each Layer A domain container and consumed optionally at the (S4) join barrier and by Layer B fact-find briefings. Full contracts: `docs/business-os/startup-loop/aggregate-pack-contracts.md`.

| Artifact ID | Producer | Stage | Canonical Path | Required Fields / Sections | Consumers | Version Marker |
|---|---|---|---|---|---|---|
| `market-pack` | MARKET — domain (`/lp-baseline-merge` consumes) | MARKET-11 — Market baseline | `docs/business-os/strategy/<BIZ>/market-pack.user.md` | ICP Summary, Key Assumptions, Confidence, Evidence Sources, Open Questions, Change-log; frontmatter: `artifact: market-pack`, `confidence`, `last_updated`, `status` | (S4) join barrier (optional), `/lp-do-fact-find` briefing (optional); (S10) readout freshness check | frontmatter `artifact: market-pack` |
| `sell-pack` | SELL — domain | SELL-07 — Sell baseline | `docs/business-os/strategy/<BIZ>/sell-pack.user.md` | ICP Summary, Key Assumptions, Confidence, Evidence Sources, Open Questions, Change-log; frontmatter: `artifact: sell-pack`, `confidence`, `last_updated`, `status` | (S4) join barrier (optional), `/lp-do-fact-find` briefing (optional); (S10) readout freshness check | frontmatter `artifact: sell-pack` |
| `product-pack` | PRODUCTS domain | PRODUCTS-07 | `docs/business-os/strategy/<BIZ>/product-pack.user.md` | ICP Summary, Key Assumptions, Confidence, Evidence Sources, Open Questions, Change-log; frontmatter: `artifact: product-pack`, `confidence`, `last_updated`, `status` | (S4) join barrier (optional), `/lp-do-fact-find` briefing (optional); (S10) readout freshness check | frontmatter `artifact: product-pack` |
| `logistics-pack` | LOGISTICS domain (conditional: `business_profile includes logistics-heavy OR physical-product`) | LOGISTICS-07 | `docs/business-os/strategy/<BIZ>/logistics-pack.user.md` | ICP Summary, Key Assumptions, Confidence, Evidence Sources, Open Questions, Change-log; frontmatter: `artifact: logistics-pack`, `confidence`, `last_updated`, `status`, `conditional: true` | (S4) join barrier (optional, conditional), `/lp-do-fact-find` briefing (optional); (S10) readout freshness check (when LOGISTICS applies). **All consumers must implement absent-file safety — absence is not an error.** | frontmatter `artifact: logistics-pack` |

## (S4) Join Barrier Artifact Keys

The (S4) stage join barrier in `loop-spec.yaml` requires all three upstream artifacts before proceeding to prioritization:

| Join key | Canonical path template | Resolved by |
|---|---|---|
| `offer` | `docs/business-os/startup-baselines/<BIZ>-offer.md` | `lp-offer` |
| `channels` | `docs/business-os/startup-baselines/<BIZ>-channels.md` | `lp-channels` |
| `forecast` | `docs/business-os/startup-baselines/<BIZ>/S3-forecast/YYYY-MM-DD-lp-forecast.user.md` | `lp-forecast` (most recent dated file in `S3-forecast/`) |
| `market_pack` (optional) | `docs/business-os/strategy/<BIZ>/market-pack.user.md` | MARKET-11 — Market baseline |
| `sell_pack` (optional) | `docs/business-os/strategy/<BIZ>/sell-pack.user.md` | SELL-07 — Sell baseline |
| `aggregate_product_pack` (optional) | `docs/business-os/strategy/<BIZ>/product-pack.user.md` | PRODUCTS-07 |
| `aggregate_logistics_pack` (optional, conditional) | `docs/business-os/strategy/<BIZ>/logistics-pack.user.md` | LOGISTICS-07 (absent-safe) |

## Legacy Path Compatibility

Paths that existed before this registry was published. Skills MUST NOT read from these paths. If a skill encounters a legacy path, it should warn the operator and reference the canonical path.

| Legacy path | Status | Canonical replacement |
|---|---|---|
| `docs/business-os/strategy/<BIZ>/YYYY-MM-DD-positioning-<BIZ>.user.md` | Stale — not produced by `lp-offer` | `docs/business-os/startup-baselines/<BIZ>-offer.md` |
| `docs/business-os/strategy/<BIZ>/YYYY-MM-DD-channel-strategy-<BIZ>.user.md` | Stale — not produced by `lp-channels` | `docs/business-os/startup-baselines/<BIZ>-channels.md` |
| `docs/business-os/startup-baselines/<BIZ>/offer-hypothesis/` | Stale — never produced by `lp-offer` | `docs/business-os/startup-baselines/<BIZ>-offer.md` |
| `docs/business-os/startup-baselines/<BIZ>/channel-selection/` | Stale — never produced by `lp-channels` | `docs/business-os/startup-baselines/<BIZ>-channels.md` |

## Producer/Consumer Dependency Graph

```
ASSESSMENT stage sequence (GATE-ASSESSMENT-01 enforces completion at ASSESSMENT→MEASURE)
    ASSESSMENT-10 (brand profiling)  →  strategy/<BIZ>/<YYYY-MM-DD>-brand-profile.user.md
        └── ASSESSMENT-11 (brand identity)  →  strategy/<BIZ>/<YYYY-MM-DD>-brand-identity-dossier.user.md
                └── ASSESSMENT-13 (product naming)  →  strategy/<BIZ>/<YYYY-MM-DD>-product-naming.user.md
                        └── ASSESSMENT-14 (logo brief)  →  strategy/<BIZ>/<YYYY-MM-DD>-logo-brief.user.md
                                ├── ASSESSMENT-15 (packaging brief, conditional: physical-product)
                                │       →  strategy/<BIZ>/<YYYY-MM-DD>-packaging-brief.user.md
                                └── /lp-design-spec (reads Logo Brief section of brand language template)

GATE-ASSESSMENT-01 passed
    └── lp-offer (MARKET-06)  →  startup-baselines/<BIZ>-offer.md
            ├── lp-forecast (S3)  →  startup-baselines/<BIZ>/S3-forecast/YYYY-MM-DD.user.md
            │       └── startup-loop S4 join barrier
            ├── lp-other-products (PRODUCT-02, conditional, PRODUCT container)  →  strategy/<BIZ>/lp-other-products-prompt.md
            │       └── startup-loop S4 join barrier (optional artifact)
            ├── lp-channels (SELL-01)  →  startup-baselines/<BIZ>-channels.md
            │       ├── lp-seo (SELL-01 companion)  →  strategy/<BIZ>/seo/YYYY-MM-DD-<phase>-<BIZ>.user.md
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
- Loop output contracts (feature dev loop artifacts): `docs/business-os/startup-loop/loop-output-contracts.md`
- Aggregate pack contracts (market-pack, sell-pack, product-pack, logistics-pack): `docs/business-os/startup-loop/aggregate-pack-contracts.md`
- Two-layer architecture contract: `docs/business-os/startup-loop/two-layer-model.md`
- Carry-mode schema: `docs/business-os/startup-loop/carry-mode-schema.md`
- Stage operator dictionary: `docs/business-os/startup-loop/stage-operator-dictionary.yaml`
- Loop spec: `docs/business-os/startup-loop/loop-spec.yaml`
- Related plan: `docs/plans/startup-loop-marketing-sales-capability-gap-audit/plan.md` (TASK-06)
- Related plan: `docs/plans/startup-loop-standing-info-gap-analysis/plan.md` (TASK-07)
- Consumer skills: `.claude/skills/lp-offer/SKILL.md`, `.claude/skills/lp-channels/SKILL.md`, `.claude/skills/lp-forecast/SKILL.md`, `.claude/skills/lp-seo/SKILL.md`
- Feature dev loop skills: `.claude/skills/lp-do-fact-find/SKILL.md`, `.claude/skills/lp-do-plan/SKILL.md`, `.claude/skills/lp-do-build/SKILL.md`
