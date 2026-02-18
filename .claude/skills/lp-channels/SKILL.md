---
name: lp-channels
description: Startup channel strategy + GTM skill (S6B). Analyzes channel-customer fit, selects 2-3 launch channels with rationale, and produces a 30-day GTM timeline. Consumes lp-offer output (ICP, positioning, objections) and feeds channel selection to draft-marketing and lp-seo.
---

# lp-channels — Startup Channel Strategy + GTM (S6B)

Produces a channel selection strategy and 30-day go-to-market (GTM) timeline for startups. Analyzes channel-customer fit, cost constraints, and cadence requirements to select 2-3 launch channels. Includes GTM execution plan with sequenced actions and resource allocation.

## Invocation

```
/lp-channels --business <BIZ>
```

Required: `--business <BIZ>` — business identifier (e.g., BRIK, SEG, INT)

## Operating Mode

RESEARCH + ANALYSIS + STRATEGY + DOCUMENT

This skill researches channel landscape, analyzes channel-customer fit using lp-offer ICP/positioning, selects 2-3 launch channels, designs a 30-day GTM timeline, and documents the artifact. Does NOT execute campaigns or select channels without ICP validation.

## Inputs

Required:
- `lp-offer` output: ICP, positioning, objections from `docs/business-os/startup-baselines/<BIZ>-offer.md`
- `lp-readiness` output: distribution feasibility from RG-02 gate
- Business context from `docs/business-os/strategy/<BIZ>/`

**Demand Evidence Pack (DEP) — pre-activation gate (GATE-S6B-ACT-01):**

Before authorizing spend on any selected channel, a valid DEP record must pass the floor defined in `docs/business-os/startup-loop/demand-evidence-pack-schema.md`. Full gate logic is in `modules/channel-strategy.md` (Stage 3). Summary:
- DEP passes → channel eligible for spend authorization.
- DEP missing or fails → mark channel `strategy-only`; do NOT authorize spend.

Optional (enhances quality):
- Competitor channel analysis, budget/resource constraints, existing audiences, market research
- `docs/business-os/strategy/<BIZ>/brand-dossier.user.md` — channel voice and tone alignment
- `docs/business-os/strategy/<BIZ>/messaging-hierarchy.user.md` — channel-specific messaging

## Workflow

### Stages 1–2: Channel Research and Fit Analysis

Load `modules/channel-research.md`:
- Stage 1: Load Context — ICP, readiness, competitor channels, channel taxonomy
- Stage 2: Channel-Customer Fit Analysis — score ≥8 channels on 3 dimensions

### Stages 3–4: Strategy and Cost Analysis

Load `modules/channel-strategy.md`:
- Stage 3: Select 2-3 Launch Channels — rationale, GATE-S6B-ACT-01 enforcement, success metrics
- Stage 4: Cost/Constraint Analysis — budget, resource, and risk tables

### Stages 5–6 + QC + Red Flags: GTM Output and Documentation

Load `modules/channel-gtm-output.md`:
- Stage 5: 30-Day GTM Timeline
- Stage 6: Document Artifact to `docs/business-os/startup-baselines/<BIZ>-channels.md`
- Self-audit QC-01–QC-10 and Red Flags

## Output Contract

Produces single file: `docs/business-os/startup-baselines/<BIZ>-channels.md`

**Artifact registry**: Canonical path defined in `docs/business-os/startup-loop/artifact-registry.md` (artifact ID: `channels`).

**Structure**: metadata frontmatter; executive summary; channel landscape audit; selected channels; cost/constraint analysis; 30-day GTM timeline; month 2+ roadmap; evidence register.

**Downstream compatibility**:
- `draft-marketing`: selected channels, positioning, success metrics
- `lp-seo`: organic channel context, keyword intent from ICP
- `lp-fact-find`: channel strategy to scope go-items
- `startup-loop`: S6B validation gate before S7

## Integration

### Upstream (S2B, S1)
- `/lp-offer --business <BIZ>` (S2B) — MUST consume ICP, positioning, and objections
- `/lp-readiness --business <BIZ>` (S1) — MUST pass RG-02 distribution feasibility gate
- May consume market research from `docs/business-os/market-research/`

### Downstream (S7, S8, S9)
- `/draft-marketing` — channel selection for asset targeting
- `/lp-seo` — organic channel context and ICP keyword intent
- `/lp-fact-find` — scopes go-items from GTM timeline
- `startup-loop` — S6B validation before S7

### Parallel Skills
- Can run in parallel with `/lp-forecast` (S2C) if both consume same lp-offer input
- Does NOT depend on `/lp-measure` (measurement setup), but measurement feeds into success metrics tracking
