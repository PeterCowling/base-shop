# Decision Gap Proposal (DGP) Lifecycle

This document defines how sub-presentable ideas are stored, prioritized, picked up, promoted to presentable status, and how hunches are suppressed in the Cabinet system. DGPs now accommodate three types of decision blocks: data gaps, timing mismatches, and dependency holds.

## Overview

Not all good ideas start with complete information, and not all good ideas are ready to act on immediately. The Cabinet system recognizes three confidence tiers:

1. **Presentable** (score 60-100): Passes all 5 presentable criteria, ready for expert review
2. **Decision Gap** (score 30-59): Has promise but decision is blocked by data gaps, timing issues, or dependencies
3. **Hunch** (score 0-29): Too speculative, not worth persisting

The Decision Gap Proposal (DGP) lifecycle manages ideas in tier 2 — storing them with clear resolution paths, prioritizing by value of information or strategic importance, and promoting them once gaps are filled or conditions are met. DGPs encompass three gap types:

- **Data gaps**: Missing information blocks the decision (requires investigation)
- **Timing gaps**: Idea is sound but timing is wrong (requires trigger condition)
- **Dependency gaps**: Prerequisite work must complete first (requires dependency tracking)

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
    |                  Confidence-Tier: decision-gap
    |                      |
    |                      v
    |                  Determine Gap-Type (data/timing/dependency)
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

Decision Gap Proposals are stored as **Idea entities** via the Agent API with specific metadata:

| Field | Value | Purpose |
|-------|-------|---------|
| `Status` | `raw` | Compatible with `/work-idea` entry requirement |
| `Tags` | `["sweep-generated", "cabinet-v1", "dgp", "gap:<type>"]` | Enable filtering for pickup mechanism. Type is `data`, `timing`, or `dependency`. Also add `held` tag if DGP originates from Stage 4 Hold verdict. |
| `Content` | Full Dossier (see below) | Include Dossier Header + resolution plan |

### Dossier Header for DGPs

Every DGP must include a Dossier Header with `Confidence-Tier: decision-gap`, a `Gap-Type`, and additional fields based on the gap type:

```markdown
<!-- DOSSIER-HEADER -->
Originator-Expert: bezos
Originator-Lens: platform
Contributors:
Confidence-Tier: decision-gap
Confidence-Score: 45
Pipeline-Stage: candidate
Cluster-ID: BRIK-CLU-007
Rival-Lenses:
VOI-Score: 0.85
Gap-Type: data
Decision-Blocked: what decision cannot be made
Re-evaluate-When: date or trigger condition
Owner: Pete
<!-- /DOSSIER-HEADER -->
```

**Field definitions**:
- `Gap-Type`: One of `data`, `timing`, or `dependency`
- `Decision-Blocked`: Brief statement of what decision is blocked (e.g., "Go/no-go on marketplace verification")
- `Re-evaluate-When`: For timing/dependency gaps, when to revisit. For data gaps, "after investigation completes"
- `Owner`: Person responsible for tracking resolution

### Required Content Sections

Every DGP must include:

1. **Problem Statement (Provisional)** — Current understanding of the opportunity/pain
2. **Proposed Solution (Sketch)** — High-level approach (not detailed spec)
3. **Blocking Questions or Triggers** — Content varies by Gap-Type:
   - **For Gap-Type=data**: Numbered list of blocking questions + VOI Justification (required)
   - **For Gap-Type=timing**: Trigger conditions + re-evaluation date
   - **For Gap-Type=dependency**: Prerequisite work items + owners
4. **Resolution Plan** — How to resolve the gap:
   - **For data**: Investigation method, timeline, decision gate
   - **For timing**: Monitoring mechanism, who checks the trigger
   - **For dependency**: Tracking mechanism, notification plan
5. **VOI Justification** — Required for Gap-Type=data. Optional for Gap-Type=timing and Gap-Type=dependency.
6. **Presentable Criteria Check** — Which criteria are met, which are missing

## VOI-Score: Value of Information

### Definition

**VOI-Score** measures how valuable it would be to fill this data gap. Scale: 0-1.

**Note**: VOI-Score is **required for Gap-Type=data**. Optional for Gap-Type=timing and Gap-Type=dependency (use strategic priority instead).

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

## Gap-Type Definitions

DGPs accommodate three types of decision blocks:

| Type | When Used | Required Fields | Resolution Mechanism |
|------|-----------|----------------|---------------------|
| `data` | Missing information blocks the decision | VOI-Score, Investigation plan, Decision gate | Investigation fills gaps → promote or kill |
| `timing` | Idea is sound but timing is wrong (too early or waiting for market/user readiness) | Trigger conditions, Re-evaluation date | Trigger fires → re-evaluate |
| `dependency` | Prerequisite work must complete first (technical or strategic) | Prerequisite work items, Owners | Dependency completes → re-evaluate |

### Gap-Type Selection Guide

- **Use `data`** when: You don't know enough to decide. Need research, interviews, analysis, or experiments.
- **Use `timing`** when: The idea is solid but external conditions aren't right yet. Examples: "Wait until Q3 when marketing budget increases", "Revisit after holiday season traffic patterns", "Too early - market not ready".
- **Use `dependency`** when: This idea depends on other work completing first. Examples: "Blocked by API v2 launch", "Needs auth system refactor first", "Depends on marketplace MVP".

## DGP Pickup Mechanism

### When Pickup Occurs

DGP pickup mechanism varies by Gap-Type:

#### Data Gaps

Picked up during sweeps with `improve-data` stance. This stance is explicitly for:

- Fact-finding missions
- Investigation tasks
- Research to fill known data gaps

**Query Logic**:

```typescript
const dgps = await queryIdeas({
  tags: ['dgp', 'gap:data'],
  status: 'raw',
  orderBy: 'VOI-Score DESC'
});
```

**Pickup Order**: DGPs are worked **in VOI-Score descending order**.

**Output**: Investigation produces a **fact-find stage doc** (not a build card). The fact-find doc answers the blocking questions listed in the DGP's "Blocking Questions" section.

#### Timing Gaps

Picked up when trigger conditions are met. Requires active monitoring:

- Owner periodically checks `Re-evaluate-When` date/condition
- When trigger fires, owner schedules re-evaluation sweep
- Re-evaluation sweep promotes DGP if timing is now right

**Query Logic**:

```typescript
const timingDgps = await queryIdeas({
  tags: ['dgp', 'gap:timing'],
  status: 'raw',
  // Filter by Re-evaluate-When <= today
});
```

#### Dependency Gaps

Picked up when prerequisite work completes. Requires notification mechanism:

- Dependency owner notifies DGP owner when work completes
- DGP owner schedules re-evaluation sweep
- Re-evaluation sweep promotes DGP if dependencies are satisfied

**Query Logic**:

```typescript
const depDgps = await queryIdeas({
  tags: ['dgp', 'gap:dependency'],
  status: 'raw',
  // Manual review: check if prerequisites complete
});
```

## Promotion Path

### When to Promote

A DGP is promoted when:

1. All critical data gaps are filled
2. The idea now passes **at least 4/5** presentable criteria (score ≥ 60)
3. The investigation reveals no showstoppers

### How to Promote

Update the Idea entity:

1. **Update Dossier Header**:
   - `Confidence-Tier: decision-gap` → `Confidence-Tier: presentable`
   - `Confidence-Score: 45` → `Confidence-Score: 75` (or appropriate new score)
   - `Pipeline-Stage: candidate` → `Pipeline-Stage: filtered`
   - `Gap-Type: <type>` → Remove this field (no longer needed)

2. **Update Tags**:
   - Remove `dgp`, `gap:<type>`, and `held` tags (if present)
   - Keep `sweep-generated` and `cabinet-v1` tags (preserves provenance)

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

A **hunch** is an idea that scores below **both** the presentable threshold (60) **and** the decision-gap threshold (30).

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
DGP (decision-gap idea)
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
DGP (decision-gap idea)
    |
    X [BLOCKED]
    |
    v
Build card (implementation task)
```

### Enforcement

The sweep orchestrator must check:

```typescript
if (idea.tags.includes('dgp')) {
  const cardType = determineCardType(idea);
  if (cardType === 'build') {
    throw new Error(
      'DGP cannot convert directly to build card. ' +
      'Must first complete resolution and promote to presentable.'
    );
  }
}
```

## Complete Example: DGP Lifecycle

### Initial DGP (Stored)

**File**: Idea entity (via Agent API), `Tags: ["sweep-generated", "cabinet-v1", "dgp", "gap:data"]`

```markdown
# Marketplace Seller Verification System

<!-- DOSSIER-HEADER -->
Originator-Expert: bezos
Originator-Lens: platform
Contributors: hopkins
Confidence-Tier: decision-gap
Confidence-Score: 45
Pipeline-Stage: candidate
Cluster-ID: MKTP-CLU-003
Rival-Lenses:
VOI-Score: 0.85
Gap-Type: data
Decision-Blocked: Go/no-go on seller verification system
Re-evaluate-When: after investigation completes
Owner: Pete
<!-- /DOSSIER-HEADER -->

## Problem (Provisional)

Marketplaces with unverified sellers face trust and fraud issues. We may need identity verification to build seller credibility.

## Proposed Solution (Sketch)

3-tier verification: Email/phone (auto), business registration (API), manual KYC (human).

## Blocking Questions (Gap-Type: data)

1. **Demand signal**: How many sellers in Year 1? (Need: pipeline analysis)
2. **Fraud baseline**: Current fraud rate? (Need: historical data)
3. **Seller preference**: Do sellers want this? What level? (Need: 10 interviews)
4. **Regulatory**: Legally required? (Need: legal memo)

## Resolution Plan (Investigation)

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

1. Orchestrator queries ideas with `dgp` and `gap:data` tags, orders by VOI-Score DESC
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
-Confidence-Tier: decision-gap
+Confidence-Tier: presentable
-Confidence-Score: 45
+Confidence-Score: 75
-Pipeline-Stage: candidate
+Pipeline-Stage: filtered
 Cluster-ID: MKTP-CLU-003
 Rival-Lenses:
 VOI-Score: 0.85
-Gap-Type: data
-Decision-Blocked: Go/no-go on seller verification system
-Re-evaluate-When: after investigation completes
-Owner: Pete
 <!-- /DOSSIER-HEADER -->
```

**Tags updated**: `["sweep-generated", "cabinet-v1"]` (removed `dgp` and `gap:data`)

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

| Stage | Status | Tags | Confidence-Tier | Gap-Type | Pipeline-Stage | Action |
|-------|--------|------|-----------------|----------|----------------|--------|
| **Initial** | `raw` | `["dgp", "gap:<type>", "sweep-generated", "cabinet-v1"]` | `decision-gap` | `data`/`timing`/`dependency` | `candidate` | Store as DGP |
| **Pickup** | `raw` | `["dgp", "gap:<type>", "sweep-generated", "cabinet-v1"]` | `decision-gap` | varies | `candidate` | Convert to resolution task |
| **Resolution** | `raw` → `worked` | `["dgp", "gap:<type>", "sweep-generated", "cabinet-v1"]` | `decision-gap` | varies | `candidate` | Fill gaps or wait for trigger |
| **Promotion** | `worked` | `["sweep-generated", "cabinet-v1"]` | `presentable` | (removed) | `filtered` | Re-enter pipeline |
| **Build** | `converted` | `["sweep-generated", "cabinet-v1"]` | `presentable` | (removed) | `prioritized` | Kanban card created |

## Version History

- **v1.1** (2026-02-09): Renamed from "Data Gap Proposal" to "Decision Gap Proposal". Added Gap-Type field (data/timing/dependency) to accommodate three types of holds. Updated tags structure, dossier header fields, pickup mechanisms, and content requirements to support all three gap types.
- **v1.0** (2026-02-09): Initial specification for Cabinet System CS-04
