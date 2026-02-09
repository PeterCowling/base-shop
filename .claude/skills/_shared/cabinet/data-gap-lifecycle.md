# Data Gap Proposal (DGP) Lifecycle

This document defines how sub-presentable ideas are stored, prioritized, picked up, promoted to presentable status, and how hunches are suppressed in the Cabinet system.

## Overview

Not all good ideas start with complete information. The Cabinet system recognizes three confidence tiers:

1. **Presentable** (score 60-100): Passes all 5 presentable criteria, ready for expert review
2. **Data Gap** (score 30-59): Has promise but lacks 1-2 critical pieces of information
3. **Hunch** (score 0-29): Too speculative, not worth persisting

The Data Gap Proposal (DGP) lifecycle manages ideas in tier 2 — storing them with clear investigation targets, prioritizing by value of information, and promoting them once gaps are filled.

## Confidence Gate Decision Tree

```
Candidate Idea (from sweep or intake)
    |
    v
Evaluate against 5 presentable criteria
    |
    +--> [5/5 met] --> Confidence-Score: 60-100
    |                      |
    |                      v
    |                  Confidence-Tier: presentable
    |                      |
    |                      v
    |                  Proceed to Munger/Buffett filter
    |
    +--> [3-4/5 met] --> Confidence-Score: 30-59
    |                      |
    |                      v
    |                  Confidence-Tier: data-gap
    |                      |
    |                      v
    |                  Store as DGP (see Storage section below)
    |
    +--> [0-2/5 met] --> Confidence-Score: 0-29
                           |
                           v
                       Confidence-Tier: hunch
                           |
                           v
                       Log in sweep report only (NOT persisted)
```

## DGP Storage

### Storage Mechanism

Data Gap Proposals are stored as **Idea entities** via the Agent API with specific metadata:

| Field | Value | Purpose |
|-------|-------|---------|
| `Status` | `raw` | Compatible with `/work-idea` entry requirement |
| `Tags` | `["data-gap", "sweep-generated"]` | Enable filtering for pickup mechanism |
| `Content` | Full Dossier (see below) | Include Dossier Header + investigation plan |

### Dossier Header for DGPs

Every DGP must include a Dossier Header with `Confidence-Tier: data-gap` and a mandatory `VOI-Score`:

```markdown
<!-- DOSSIER-HEADER -->
Originator-Expert: bezos
Originator-Lens: platform
Contributors:
Confidence-Tier: data-gap
Confidence-Score: 45
Pipeline-Stage: candidate
Cluster-ID: BRIK-CLU-007
Rival-Lenses:
VOI-Score: 0.85
<!-- /DOSSIER-HEADER -->
```

### Required Content Sections

Every DGP must include:

1. **Problem Statement (Provisional)** — Current understanding of the opportunity/pain
2. **Proposed Solution (Sketch)** — High-level approach (not detailed spec)
3. **Data Gaps (Critical)** — Numbered list of blocking questions
4. **Proposed Investigation** — How to fill the gaps (method, timeline, decision gate)
5. **VOI Justification** — Why filling this gap is valuable (see next section)
6. **Presentable Criteria Check** — Which criteria are met, which are missing

## VOI-Score: Value of Information

### Definition

**VOI-Score** measures how valuable it would be to fill this data gap. Scale: 0-1.

- **0.0** = No value. Even if we had perfect information, we wouldn't act differently.
- **0.5** = Moderate value. Information helps but doesn't fundamentally change the decision.
- **1.0** = Critical value. Information completely determines go/no-go decision.

### Scoring Factors

| Factor | Weight | Question |
|--------|--------|----------|
| **Decision sensitivity** | 40% | How much does the decision change if the data contradicts assumptions? |
| **Uncertainty reduction** | 30% | How much does this reduce our current uncertainty? |
| **Downstream impact** | 20% | How many other decisions depend on this information? |
| **Investigation cost** | 10% | How cheap/fast is it to get the answer? (Lower cost = higher VOI) |

### Scoring Examples

#### High VOI (0.8-1.0)

**Example**: "We don't know if BRIK has any users yet"

- Decision sensitivity: 100% (if zero users, strategy is completely different)
- Uncertainty reduction: 100% (we're currently blind)
- Downstream impact: 90% (marketing, content, features all depend on this)
- Investigation cost: Very low (just query analytics)

**VOI-Score: 0.95**

#### Medium VOI (0.4-0.7)

**Example**: "We don't know which of 3 payment providers sellers prefer"

- Decision sensitivity: 40% (we'll integrate with a provider either way, just changes which one)
- Uncertainty reduction: 60% (we have some priors from other markets)
- Downstream impact: 30% (mostly affects payment team, not whole platform)
- Investigation cost: Medium (10 seller interviews)

**VOI-Score: 0.55**

#### Low VOI (0.1-0.3)

**Example**: "We don't know the exact conversion rate of banner ads"

- Decision sensitivity: 10% (we're not spending much on ads anyway)
- Uncertainty reduction: 30% (we have ballpark estimates from industry benchmarks)
- Downstream impact: 10% (only affects small ad budget allocation)
- Investigation cost: High (need months of data to measure reliably)

**VOI-Score: 0.20**

### Scoring Heuristics

- **If the investigation reveals a showstopper, does the idea die immediately?** → High VOI (0.8+)
- **If the investigation is very favorable, does the idea jump to P1?** → High VOI (0.8+)
- **Does the investigation just help us optimize details?** → Medium VOI (0.4-0.7)
- **Could we make a decent decision without the data?** → Low VOI (0.1-0.3)

## DGP Pickup Mechanism

### When Pickup Occurs

DGPs are picked up during sweeps with `improve-data` stance. This stance is explicitly for:

- Fact-finding missions
- Investigation tasks
- Research to fill known data gaps

### Query Logic

The sweep orchestrator queries the Agent API:

```typescript
const dgps = await queryIdeas({
  tags: ['data-gap'],
  status: 'raw',
  orderBy: 'VOI-Score DESC'
});
```

### Pickup Order

DGPs are worked **in VOI-Score descending order**:

1. First sweep picks highest VOI-Score DGP
2. Investigation converts DGP into fact-finding task card
3. `/work-idea` processes the investigation
4. Repeat with next highest VOI-Score

### Investigation Output

The investigation produces a **fact-find stage doc** (not a build card). The fact-find doc answers the blocking questions listed in the DGP's "Data Gaps (Critical)" section.

## Promotion Path

### When to Promote

A DGP is promoted when:

1. All critical data gaps are filled
2. The idea now passes **at least 4/5** presentable criteria (score ≥ 60)
3. The investigation reveals no showstoppers

### How to Promote

Update the Idea entity:

1. **Update Dossier Header**:
   - `Confidence-Tier: data-gap` → `Confidence-Tier: presentable`
   - `Confidence-Score: 45` → `Confidence-Score: 75` (or appropriate new score)
   - `Pipeline-Stage: candidate` → `Pipeline-Stage: filtered`

2. **Update Tags**:
   - Remove `data-gap` tag
   - Keep `sweep-generated` tag (preserves provenance)

3. **Add Evidence Section**:
   - Append findings from investigation
   - Link to fact-find doc
   - Update "Open Questions" section (should now be empty or minor)

### After Promotion

The promoted idea re-enters the normal pipeline:

```
Promoted DGP (now presentable)
    |
    v
Munger/Buffett filter (confident/circle-of-competence/competitive-advantage)
    |
    +--> [Pass] --> Drucker/Porter filter (customer-job/strategy-fit/resource-check)
    |                   |
    |                   v
    |               Build lane (converted to Kanban card)
    |
    +--> [Fail] --> Dropped
```

The DGP does NOT bypass the filters just because it was investigated. It must still earn its way through Munger/Buffett and Drucker/Porter.

## Hunch Suppression

### Definition

A **hunch** is an idea that scores below **both** the presentable threshold (60) **and** the data-gap threshold (30).

Score range: 0-29.

### Why Suppress?

Hunches are too speculative to be worth storing:

- Missing 3+ presentable criteria
- No clear investigation path
- High noise-to-signal ratio
- Would clog the DGP backlog

### Suppression Mechanism

Hunches are:

- **Logged** in the sweep report (for transparency and pattern detection)
- **NOT persisted** as Idea entities
- **NOT eligible** for pickup in future sweeps

### Sweep Report Entry

```markdown
## Hunches (Not Persisted)

### hopkins (marketing): "Add gamification badges to BRIK guides"
- Confidence-Score: 25
- Missing: Problem statement (why?), evidence (any signal users want this?), feasibility (design/dev effort unknown)
- Rationale: Feels like feature-creep. No customer signal. No business goal alignment.
```

### Hunch Revival

If a hunch gains new evidence (e.g., customer interview reveals demand), it can be re-submitted in a future sweep. The new submission is evaluated fresh — it's not treated as a duplicate.

## DGP→Build Guardrail

### Critical Constraint

**DGPs MUST convert to fact-finding cards, never directly to build cards.**

### Why This Matters

A DGP represents an **investigation target**, not a **build-ready spec**. Converting a DGP directly to a build card would mean:

- Building without validating assumptions
- Skipping the fact-find stage of the feature workflow
- Bypassing the confidence gate that protects against wasted effort

### Allowed Flow

```
DGP (data-gap idea)
    |
    v
Investigation card (fact-find task)
    |
    v
Fact-find stage doc (answers blocking questions)
    |
    v
DGP promoted to presentable (gaps filled)
    |
    v
Munger/Buffett + Drucker/Porter filters
    |
    v
Build lane (Kanban card)
```

### Forbidden Flow

```
DGP (data-gap idea)
    |
    X [BLOCKED]
    |
    v
Build card (implementation task)
```

### Enforcement

The sweep orchestrator must check:

```typescript
if (idea.tags.includes('data-gap')) {
  const cardType = determineCardType(idea);
  if (cardType === 'build') {
    throw new Error(
      'DGP cannot convert directly to build card. ' +
      'Must first complete investigation and promote to presentable.'
    );
  }
}
```

## Complete Example: DGP Lifecycle

### Initial DGP (Stored)

**File**: Idea entity (via Agent API), `Tags: ["data-gap", "sweep-generated"]`

```markdown
# Marketplace Seller Verification System

<!-- DOSSIER-HEADER -->
Originator-Expert: bezos
Originator-Lens: platform
Contributors: hopkins
Confidence-Tier: data-gap
Confidence-Score: 45
Pipeline-Stage: candidate
Cluster-ID: MKTP-CLU-003
Rival-Lenses:
VOI-Score: 0.85
<!-- /DOSSIER-HEADER -->

## Problem (Provisional)

Marketplaces with unverified sellers face trust and fraud issues. We may need identity verification to build seller credibility.

## Proposed Solution (Sketch)

3-tier verification: Email/phone (auto), business registration (API), manual KYC (human).

## Data Gaps (Critical)

1. **Demand signal**: How many sellers in Year 1? (Need: pipeline analysis)
2. **Fraud baseline**: Current fraud rate? (Need: historical data)
3. **Seller preference**: Do sellers want this? What level? (Need: 10 interviews)
4. **Regulatory**: Legally required? (Need: legal memo)

## Proposed Investigation

- Demand: Pipeline analysis (2 days)
- Fraud: Industry benchmarks + operator interviews (3 days)
- Preference: Seller interviews (1 week)
- Regulatory: Legal memo (3 days)

**Decision Gate**: If (demand >50 sellers/yr AND fraud >2% AND sellers prefer verification), promote to P1. Else kill.

## VOI Justification

VOI-Score: 0.85 (Very High)

- Decision sensitivity: 90% (determines if we build this at all)
- Uncertainty reduction: 80% (currently guessing on all 4 gaps)
- Downstream impact: 80% (affects entire marketplace trust model)
- Investigation cost: Low (2 weeks, mostly interviews)

If favorable, this jumps to P1 (high-impact, blocking trust issues). If unfavorable, we save 6 weeks of engineering. Either outcome is very valuable.

## Presentable Criteria Check

- [x] Customer/user identified: Sellers and buyers
- [ ] Problem statement: Provisional. Need fraud data to confirm.
- [x] Feasibility signal: Stripe Identity API exists
- [ ] Evidence: No data yet. Needs investigation.
- [x] Business alignment: Safe Marketplace initiative

**Status: Data Gap** (3/5 met)
```

### Pickup (Next Sweep with `improve-data` Stance)

1. Orchestrator queries ideas with `data-gap` tag, orders by VOI-Score DESC
2. This DGP ranks high (0.85)
3. Orchestrator converts to fact-finding card:

```yaml
title: "Fact-find: Marketplace Seller Verification Need"
description: "Answer 4 blocking questions to determine if verification system is needed"
tasks:
  - Analyze seller pipeline for Year 1 demand
  - Research fraud rates (benchmarks + operator interviews)
  - Interview 10 prospective sellers on verification preference
  - Obtain legal memo on regulatory requirements
decision_gate: "If demand >50 AND fraud >2% AND sellers prefer: promote. Else: kill."
```

### Investigation Completion

Agent completes fact-find, produces stage doc with findings:

- Demand: 120 sellers expected in Year 1
- Fraud: Industry average 5%, peer platform saw 8%
- Preference: 9/10 sellers want verification (builds trust)
- Regulatory: Not required but reduces liability

**Outcome**: All gaps filled. Evidence strongly supports the idea.

### Promotion

Agent updates the Idea entity:

```diff
 <!-- DOSSIER-HEADER -->
 Originator-Expert: bezos
 Originator-Lens: platform
 Contributors: hopkins
-Confidence-Tier: data-gap
+Confidence-Tier: presentable
-Confidence-Score: 45
+Confidence-Score: 75
-Pipeline-Stage: candidate
+Pipeline-Stage: filtered
 Cluster-ID: MKTP-CLU-003
 Rival-Lenses:
 VOI-Score: 0.85
 <!-- /DOSSIER-HEADER -->
```

**Tags updated**: `["sweep-generated"]` (removed `data-gap`)

### Re-Entry to Pipeline

The promoted idea now enters Munger/Buffett filter:

- **Confident?** Yes (75 score, backed by research)
- **Circle of competence?** Yes (we've built verification before)
- **Competitive advantage?** Yes (reduces fraud, builds trust)

Passes Munger/Buffett → Drucker/Porter:

- **Customer job?** Yes (sellers need trust signals)
- **Strategy fit?** Yes (Safe Marketplace initiative)
- **Resources?** Yes (Stripe API, 3-week effort)

Passes Drucker/Porter → **Build lane** (converted to Kanban card).

## Lifecycle Summary

| Stage | Status | Tags | Confidence-Tier | Pipeline-Stage | Action |
|-------|--------|------|-----------------|----------------|--------|
| **Initial** | `raw` | `["data-gap", "sweep-generated"]` | `data-gap` | `candidate` | Store as DGP |
| **Pickup** | `raw` | `["data-gap", "sweep-generated"]` | `data-gap` | `candidate` | Convert to fact-find card |
| **Investigation** | `raw` → `worked` | `["data-gap", "sweep-generated"]` | `data-gap` | `candidate` | Fill gaps |
| **Promotion** | `worked` | `["sweep-generated"]` | `presentable` | `filtered` | Re-enter pipeline |
| **Build** | `converted` | `["sweep-generated"]` | `presentable` | `prioritized` | Kanban card created |

## Version History

- **v1.0** (2026-02-09): Initial specification for Cabinet System CS-04
