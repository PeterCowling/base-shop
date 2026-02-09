# Dossier Template Specification

This document defines the canonical format for Cabinet Dossiers and Data Gap Proposals.

## Overview

A Dossier is a structured markdown document that captures an idea, hypothesis, or proposal with full attribution, confidence metadata, and decision history. It serves as both a human-readable artifact and a machine-parseable data structure.

## File Structure

Every Dossier consists of:

1. **Dossier Header** — Machine-parseable metadata block
2. **Decision Log** — Attribution and verdict history
3. **Idea Content** — Freeform markdown describing the idea
4. **Supporting Evidence** — Links, data, analysis
5. **Open Questions** — Gaps that block promotion

## Dossier Header Block

### Format

```markdown
<!-- DOSSIER-HEADER -->
Originator-Expert: hopkins
Originator-Lens: marketing
Contributors: bezos, marketing
Confidence-Tier: presentable
Confidence-Score: 75
Pipeline-Stage: promoted
Cluster-ID: BRIK-CLU-001
Rival-Lenses: engineering, finance
VOI-Score: 0.8
<!-- /DOSSIER-HEADER -->
```

### Field Specifications

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `Originator-Expert` | string | Yes | Person-level attribution (e.g., `hopkins`, `bezos`). PRIMARY attribution field. |
| `Originator-Lens` | string | Yes | Lens-level grouping (e.g., `marketing`, `engineering`). |
| `Contributors` | list | No | Comma-separated list of additional contributors. |
| `Confidence-Tier` | enum | Yes | `presentable` / `data-gap` / `hunch` |
| `Confidence-Score` | integer | Yes | 0-100. Must align with tier thresholds. |
| `Pipeline-Stage` | enum | Yes | `candidate` / `filtered` / `promoted` / `worked` / `prioritized` |
| `Cluster-ID` | string | No | Links related ideas (e.g., `BRIK-CLU-001`). |
| `Rival-Lenses` | list | No | Comma-separated list of lenses with competing priorities. |
| `VOI-Score` | float | No | 0-1. Value of Information — how valuable is filling data gaps? |

### Grammar Rules

1. **Delimiters**: Opening `<!-- DOSSIER-HEADER -->` and closing `<!-- /DOSSIER-HEADER -->` on separate lines.
2. **Format**: One field per line. Format: `Key: value`. No multiline values.
3. **Characters**: Header values use `[a-z0-9_-,. ]` only (lowercase alphanumeric, underscore, hyphen, comma, space, dot). No pipes, quotes, or newlines.
4. **Lists**: Comma-separated, whitespace trimmed. Example: `Contributors: bezos, marketing, ops`
5. **Enums**: Must match exactly (case-sensitive).

### Confidence Tier Thresholds

| Tier | Score Range | Criteria |
|------|-------------|----------|
| `presentable` | 60-100 | Passes all 5 presentable idea criteria |
| `data-gap` | 30-59 | Fails 1-2 criteria but has clear question that would make it presentable |
| `hunch` | 0-29 | Fails 3+ criteria. Not persisted (sweep report only). |

### Pipeline Stage Definitions

| Stage | Description |
|-------|-------------|
| `candidate` | Raw idea from sweep or intake. Not yet filtered. |
| `filtered` | Reviewed by lens expert. Either promoted or killed. |
| `promoted` | Passed lens filter. Awaiting cross-lens review. |
| `worked` | In active development or investigation. |
| `prioritized` | Sequenced into roadmap. Has committed resources. |

## Decision Log Block

### Format

```markdown
<!-- DECISION-LOG -->
## hopkins (marketing)
Verdict: promote
Rationale: Strong signal from customer interviews. 3/5 trial users requested this feature unprompted. Aligns with Q1 growth goal. Low effort (2-3 days). No technical blockers identified.

## bezos (engineering)
Verdict: P2
Rationale: Technically feasible. Requires API integration but vendor has good docs. Concern: adds third-party dependency. Recommend we instrument manual event tracking first to validate hypothesis before committing to vendor lock-in.
<!-- /DECISION-LOG -->
```

### Grammar Rules

1. **Delimiters**: Opening `<!-- DECISION-LOG -->` and closing `<!-- /DECISION-LOG -->` on separate lines.
2. **Expert Sections**: Each expert gets a `## expert (lens)` heading.
3. **Verdict Line**: `Verdict: value` on its own line. Values: `promote` / `hold` / `kill` or `P1`-`P5`.
4. **Rationale**: `Rationale: text` on next line. Can be multiline. Terminated by next `##` or close delimiter.
5. **Free Text**: Rationale supports markdown, newlines, and any character. No delimiter restrictions.

### Verdict Values

| Value | Meaning |
|-------|---------|
| `promote` | Advance to next stage |
| `hold` | Not now, revisit later |
| `kill` | Reject permanently |
| `P1` - `P5` | Priority ranking (P1 = highest) |

## Presentable Idea Checklist

An idea is "presentable" if it meets ALL 5 criteria:

1. **Customer/user identified** — Who is this for? Named segment or persona.
2. **Problem statement present** — What pain or opportunity? Clear and specific.
3. **At least one feasibility signal** — Technical or commercial evidence this is doable.
4. **Evidence or reasoning chain** — Not just assertion. Data, research, or logical argument.
5. **Business alignment** — How does this serve a known business goal or fill a plan gap?

## Business Tooling Checklists

### Lint (Missing Fields)

Required fields must be present and non-empty:
- `Originator-Expert`
- `Originator-Lens`
- `Confidence-Tier`
- `Confidence-Score`
- `Pipeline-Stage`

### Typecheck (Consistency)

1. **Enum validity**: All enum fields use only allowed values.
2. **Score-tier alignment**:
   - `presentable` → score 60-100
   - `data-gap` → score 30-59
   - `hunch` → score 0-29
3. **Stage progression**: Pipeline stage matches actual position in workflow.
4. **VOI range**: If present, VOI-Score is 0-1.

### Test (Hypothesis)

Every presentable idea must include:
1. **Falsifiable hypothesis** — Clear statement that can be proven wrong.
2. **Measurement plan** — How will we know if we're right?
3. **Success criteria** — What does "works" look like?

## Priority Formula

For ideas competing for resources:

```
Priority = (Impact × Confidence × Signal-Speed) / (Effort × (1 + Risk))
```

### Scoring Guide

| Factor | Scale | Description |
|--------|-------|-------------|
| **Impact** | 0-10 | Revenue, cost savings, strategic value, customer satisfaction |
| **Confidence** | 0-10 | How sure are we this will work? (Usually Confidence-Score / 10) |
| **Signal-Speed** | 0-1 | How fast do we get feedback? 1 = immediate, 0.1 = 6+ months |
| **Effort** | 0-10 | Person-weeks, complexity, coordination cost |
| **Risk** | 0-10 | Downside exposure, reversibility, dependencies |

### Interpretation

- **Higher = better**: Maximize numerator (impact, confidence, signal-speed)
- **Lower = worse**: Minimize denominator (effort, risk)
- **Risk adjustment**: `(1 + Risk)` means Risk = 10 doubles the effort penalty

### Example Calculation

Idea: "Add GA4 to BRIK"
- Impact: 6 (enables data-driven decisions)
- Confidence: 8 (proven tech, clear value)
- Signal-Speed: 0.9 (data flows immediately)
- Effort: 2 (1-2 days)
- Risk: 1 (low risk, easily reversible)

Priority = (6 × 8 × 0.9) / (2 × (1 + 1)) = 43.2 / 4 = **10.8**

## Complete Example: Presentable Dossier

### File: `analytics-instrumentation.md`

```markdown
# Install Google Analytics 4 for Brikette Website

<!-- DOSSIER-HEADER -->
Originator-Expert: hopkins
Originator-Lens: marketing
Contributors: bezos
Confidence-Tier: presentable
Confidence-Score: 75
Pipeline-Stage: promoted
Cluster-ID: BRIK-CLU-001
Rival-Lenses: engineering
VOI-Score: 0.7
<!-- /DOSSIER-HEADER -->

<!-- DECISION-LOG -->
## hopkins (marketing)
Verdict: promote
Rationale: We are flying blind on Brikette. No data on user flows, drop-off points, or content performance. Every marketing decision is guesswork. GA4 is free, well-documented, and we already use it on other properties. This unblocks experiment design and conversion optimization work.

## bezos (engineering)
Verdict: P2
Rationale: Technically trivial (Next.js script tag in layout, 2 hours work). Privacy concern: need cookie banner before GA loads. Recommend we implement banner first (1 day), then GA4 (2 hours), then event tracking layer (3 days). Total effort: 1 week. Low risk, high signal value.
<!-- /DECISION-LOG -->

## Problem

The Brikette website has zero analytics instrumentation. We cannot answer basic questions:
- Which guides are most read?
- Where do users drop off?
- What search terms do people use?
- Which CTAs convert?

This blocks:
- Content prioritization (what to write next?)
- UX optimization (where to improve?)
- Campaign attribution (what channels work?)

## Proposed Solution

Install Google Analytics 4 with:
1. Cookie consent banner (Cookiebot or similar)
2. GA4 base tracking (page views, sessions)
3. Custom event layer (guide reads, search queries, CTA clicks)
4. Monthly reporting dashboard (Looker Studio)

## Feasibility Signals

- **Technical**: Next.js supports GA4 via `next/script`. We've done this 3x on other sites. 2 hours work.
- **Legal**: GDPR compliance via cookie banner. Cookiebot has pre-built Next.js integration. 1 day work.
- **Commercial**: GA4 is free tier. No procurement needed. No ongoing cost unless we hit 10M+ events/month (we won't).

## Evidence

1. **Competitor research**: 8/10 similar sites use GA4. It's industry standard.
2. **Internal need**: Marketing team requested this 3x in last 2 months.
3. **Opportunity cost**: We are currently making content decisions by gut feel. Two recent guides (picked randomly) have received zero engagement according to manual Discord checks. Could have been avoided with data.

## Business Alignment

Supports Q1 2026 goal: "Double organic traffic to Brikette guides."

Cannot measure goal without analytics. Cannot optimize without measurement.

## Hypothesis

"If we instrument GA4 with custom event tracking, we will identify the top 3 content gaps within 30 days, leading to 2 new high-traffic guides by end of Q1."

**Measurement Plan**:
- GA4 dashboard shows top 10 pages by traffic
- Search queries logged via custom event
- Identify topics with high search / low content match
- Validate with 5 user interviews

**Success Criteria**:
- 3 content gaps identified with >100 searches each
- 2 new guides published addressing those gaps
- New guides achieve >500 views in first 30 days

## Open Questions

None. All data gaps filled.

## Priority Calculation

- Impact: 6 (enables data-driven marketing)
- Confidence: 8 (proven tech, clear value)
- Signal-Speed: 0.9 (data flows immediately)
- Effort: 2 (1 week total)
- Risk: 1 (low, reversible)

**Priority = (6 × 8 × 0.9) / (2 × 2) = 10.8**

## Presentable Criteria Check

- [x] Customer/user identified: Marketing team, content creators
- [x] Problem statement: No analytics = blind decision-making
- [x] Feasibility signal: Proven tech, done 3x before, 1 week effort
- [x] Evidence: Competitor research, internal requests, opportunity cost analysis
- [x] Business alignment: Supports Q1 traffic goal, unblocks optimization

**Status: Presentable** ✓
```

## Data Gap Proposal Example

When an idea has promise but lacks critical information, use a Data Gap Proposal:

### File: `marketplace-seller-verification.md`

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
VOI-Score: 0.9
<!-- /DOSSIER-HEADER -->

<!-- DECISION-LOG -->
## bezos (platform)
Verdict: hold
Rationale: Good instinct but missing critical data. We need to know: (1) How many sellers would this affect? (2) What is current fraud rate? (3) What do sellers want — light-touch or heavy-touch verification? Without this, we might build the wrong thing. High VOI — if answers are favorable, this becomes P1.
<!-- /DECISION-LOG -->

## Problem (Provisional)

Marketplaces with unverified sellers face trust and fraud issues. We may need identity verification to build seller credibility and protect buyers.

## Proposed Solution (Sketch)

3-tier verification system:
- **Basic**: Email + phone verification (auto, instant)
- **Standard**: Business registration lookup (API, 24hr)
- **Premium**: Manual KYC review (human, 3-5 days)

Verified badges shown in seller profiles and product listings.

## Feasibility Signals

- **Technical**: Stripe Identity API exists. 2-week integration effort (estimate).
- **Commercial**: Stripe Identity costs $1.50/verification. Need volume estimate.

## Data Gaps (Critical)

1. **Demand signal**: How many sellers do we expect in Year 1? (Need: pipeline analysis)
2. **Fraud baseline**: What is our current fraud rate? (Need: historical data from similar platform)
3. **Seller preference**: Do sellers want this? What verification level? (Need: 10 interviews)
4. **Regulatory requirement**: Are we legally required to verify? (Need: legal review)

## Proposed Investigation

**Goal**: Answer the 4 critical questions above within 2 weeks.

**Method**:
- Demand: Analyze current seller pipeline + outreach list (2 days)
- Fraud: Research industry benchmarks + talk to 3 marketplace operators (3 days)
- Preference: Interview 10 prospective sellers (1 week)
- Regulatory: Legal memo from counsel (3 days, parallelized)

**Decision Gate**: If (demand > 50 sellers/year AND fraud risk > 2% AND sellers prefer verification), then promote to P1. Otherwise kill.

## Business Alignment

Supports "Safe Marketplace" initiative. Reduces platform liability risk.

## VOI Justification

VOI-Score: 0.9 (Very High)

If investigation confirms need, this becomes a top-3 priority (high-impact, high-confidence). If investigation disconfirms, we save 6 weeks of engineering effort. Either outcome is very valuable.

## Presentable Criteria Check

- [x] Customer/user identified: Marketplace sellers and buyers
- [ ] Problem statement: Provisional only. Need fraud data to confirm.
- [x] Feasibility signal: Stripe Identity API exists
- [ ] Evidence: No data yet. Needs investigation.
- [x] Business alignment: Supports Safe Marketplace initiative

**Status: Data Gap** (2/5 criteria met)

**Blocking Question**: What is the actual fraud risk and seller demand?
```

## Parsing Reference

### Header Parsing (Pseudocode)

```typescript
function parseDossierHeader(markdown: string): DossierHeader {
  const headerBlock = extractBlock(markdown, 'DOSSIER-HEADER');
  const lines = headerBlock.split('\n').filter(l => l.trim());

  const fields = {};
  for (const line of lines) {
    const [key, ...valueParts] = line.split(':');
    const value = valueParts.join(':').trim();

    // Parse lists
    if (key === 'Contributors' || key === 'Rival-Lenses') {
      fields[key] = value.split(',').map(v => v.trim());
    } else {
      fields[key] = value;
    }
  }

  return fields;
}
```

### Decision Log Parsing (Pseudocode)

```typescript
function parseDecisionLog(markdown: string): Decision[] {
  const logBlock = extractBlock(markdown, 'DECISION-LOG');
  const sections = logBlock.split(/^## /m).filter(s => s.trim());

  return sections.map(section => {
    const [header, ...body] = section.split('\n');
    const [expert, lens] = header.match(/(\w+) \((\w+)\)/).slice(1);

    const verdictLine = body.find(l => l.startsWith('Verdict:'));
    const verdict = verdictLine.split(':')[1].trim();

    const rationaleStart = body.findIndex(l => l.startsWith('Rationale:'));
    const rationale = body.slice(rationaleStart)
      .join('\n')
      .replace(/^Rationale: /, '')
      .trim();

    return { expert, lens, verdict, rationale };
  });
}
```

## Version History

- **v1.0** (2026-02-09): Initial specification for Cabinet System CS-03
