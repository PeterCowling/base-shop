# Cabinet Clustering Mechanism

This document defines the deduplication and rivalry clustering mechanism for the Cabinet System. It describes how ideas from multiple lenses are grouped, merged into dossiers, and how agreements and rivalries between lenses are recorded.

## Overview

The clustering phase sits between idea generation and the Munger/Buffett filter. Its purpose is to:

1. **Reduce duplicate attention** — Multiple lenses often identify the same problem or opportunity
2. **Preserve lens diversity** — Each lens's variant is retained as a named perspective within the cluster
3. **Surface agreements** — When lenses converge independently, that's strong signal
4. **Surface rivalries** — When lenses disagree on approach, that highlights genuine tension worth resolving

## Clustering Algorithm

### Single-Session Process

All clustering happens within a single agent session:

1. **Collect all candidate dossiers** from the generation phase
2. **Group by business** (hard boundary — BRIK ideas never cluster with PIPE ideas)
3. **Group by MACRO category** within each business (customer-facing vs infrastructure vs data-quality)
4. **Identify semantic overlaps** within each MACRO group (same problem or opportunity)
5. **Merge each cluster** into a single dossier
6. **Singletons pass through** unchanged (ideas with no match remain standalone)

### Semantic Similarity Heuristic

Two ideas are "semantically similar" if they:

- Target the **same business** (BRIK, PIPE, COVER, etc.)
- Fall within the **same MACRO category** (same job-to-be-done)
- Address the **same core problem or opportunity** (can be phrased differently but same essence)

Example: "Install GA4 for BRIK" and "Add analytics tracking to Brikette" are semantically similar.

### Hard Clustering Boundaries

**These boundaries are NEVER violated:**

1. **Never merge across businesses** — BRIK ideas don't cluster with PIPE ideas, even if they sound similar
2. **Never merge across jobs-to-be-done** — Customer-facing features don't cluster with infrastructure improvements or data-quality fixes
3. **Max cluster size: 4 lens variants** — If more than 4 lenses converge on the same problem, treat as strong signal but split into sub-clusters by approach (e.g., "technical approach" vs "commercial approach")

## Dossier Merging

### Structure

When ideas cluster, the merged dossier has:

1. **Unified Dossier Header** — Inherits highest confidence score from cluster members; lists all contributors
2. **Unified Decision Log** — Combines all expert verdicts from cluster members
3. **Main Idea Content** — Either the most complete variant or a synthesis
4. **Lens Variants Section** — Each lens's original perspective preserved as a named subsection
5. **Agreement Section** — Where lenses converge (what they agree on)
6. **Rivalry Section** — Where lenses disagree (what they disagree on, why, how to resolve)

### Header Field Inheritance

| Field | Inheritance Rule |
|-------|------------------|
| `Originator-Expert` | First dossier in cluster (chronological order) |
| `Originator-Lens` | First dossier in cluster |
| `Contributors` | All experts from all dossiers in cluster |
| `Confidence-Tier` | Highest tier from cluster |
| `Confidence-Score` | Highest score from cluster |
| `Pipeline-Stage` | All cluster members must have same stage (enforced) |
| `Cluster-ID` | Assigned (format: `{BUSINESS}-CLU-{NNN}`) |
| `Rival-Lenses` | Lenses that disagree on approach/priority/feasibility |

### Decision Log Merging

All `<!-- DECISION-LOG -->` sections from cluster members are concatenated. Experts appear in order of contribution. If the same expert appears in multiple cluster members (rare), their entries are merged.

## Agreement Recording

### When to Record Agreement

Agreement is recorded when 2+ lenses independently identify:

- The same problem or opportunity
- Similar approach or solution
- Similar priority or urgency

### Agreement Section Format

```markdown
## Lens Agreement

The following lenses converged independently on this problem:

**marketing + engineering**: Both identified lack of analytics as top blocker. Marketing cited inability to measure campaigns; engineering cited inability to instrument A/B tests.

**finance + ops**: Both flagged manual invoicing as time sink. Finance measured 4 hours/week; ops measured 6 hours/week. Agreement on automation ROI.

**Signal strength**: 3+ lenses agreeing = very high confidence. Prioritize accordingly.
```

### Interpretation

Multiple independent lenses reaching the same conclusion is **strong signal**. It suggests the problem is real, observable from multiple vantage points, and worth acting on.

## Rivalry Recording

### When to Record Rivalry

Rivalry is recorded when lenses disagree on:

- **Approach** — Different solutions to the same problem
- **Priority** — One lens says urgent, another says low-priority
- **Feasibility** — One lens says easy, another says hard
- **Framing** — Different root-cause analysis of the same symptom

### Rivalry Section Format

```markdown
## Lens Rivalry

**engineering vs sales** (approach):
- **engineering**: Says "automate the manual invoicing process via Stripe Billing API"
- **sales**: Says "hire a part-time bookkeeper, automation is overkill"
- **Tension**: Build vs buy. Engineering optimizes for scale; sales optimizes for speed.
- **Resolution path**: Prototype Stripe integration (2 days). If integration is <1 week effort, automate. If >1 week, hire.

**marketing vs finance** (priority):
- **marketing**: Says "analytics is P1, we are flying blind"
- **finance**: Says "analytics is P3, we have bigger revenue blockers"
- **Tension**: Measurement vs execution. Marketing wants data; finance wants deals closed.
- **Resolution path**: Estimate analytics ROI in terms of deal velocity. If measurement enables 10%+ more deals, it's P1. Otherwise P3.
```

### Interpretation

Rivalries are **valuable signal**, not noise. They highlight genuine tension in the problem space. The resolution path often reveals which data gap to fill next.

## Clustering Process: Step-by-Step

### Step 1: Collect Candidate Dossiers

Agent reads all dossiers with `Pipeline-Stage: candidate` from the generation phase. Typically 6-24 dossiers (4 businesses × 6 lenses = up to 24 in a full sweep).

### Step 2: Group by Business

Hard partition. Create separate piles for BRIK, PIPE, COVER, BOSO, etc.

### Step 3: Group by MACRO Category

Within each business, group by job-to-be-done:

- **Customer-facing** — Features, UX, content, marketing
- **Infrastructure** — Backend, ops, devops, security
- **Data-quality** — Analytics, reporting, decision-support

### Step 4: Identify Semantic Overlaps

Within each MACRO group, cluster ideas that address the same core problem or opportunity.

**Heuristic**: If two ideas could be solved by the same implementation, they cluster.

**Example clusters**:
- "Install GA4" + "Add analytics" → Same problem
- "Speed up checkout" + "Reduce cart abandonment" → Same problem
- "Improve SEO" + "Increase organic traffic" → Same problem

**Non-examples** (don't cluster):
- "Install GA4" + "Add live chat" → Different problems
- "Speed up checkout" + "Add payment methods" → Related but distinct

### Step 5: Merge Each Cluster

For each cluster:

1. Pick the most complete dossier as the base
2. Merge headers (inherit highest confidence, list all contributors)
3. Concatenate decision logs
4. Add "Lens Variants" section with each lens's original idea
5. Add "Agreement" section (what they agree on)
6. Add "Rivalry" section (what they disagree on)
7. Assign Cluster-ID (e.g., `BRIK-CLU-001`)

### Step 6: Output

Clustered dossiers are written to disk, ready for Munger/Buffett filter. Singleton dossiers (no match) pass through unchanged.

## Worked Example

### Scenario: 3 Lenses Identify "No Analytics for BRIK"

#### Input: 3 Candidate Dossiers

**Dossier 1 (Hopkins / Marketing)**:
- Problem: "We can't measure campaign ROI"
- Solution: "Install GA4 with UTM tracking"
- Confidence: 75

**Dossier 2 (Bezos / Engineering)**:
- Problem: "No instrumentation for A/B tests"
- Solution: "Add event tracking layer + GA4"
- Confidence: 70

**Dossier 3 (Munger / Finance)**:
- Problem: "Cannot justify marketing spend without attribution"
- Solution: "Install any analytics tool (GA4, Plausible, Fathom)"
- Confidence: 60

#### Clustering Decision

- Same business: BRIK ✓
- Same MACRO: Customer-facing ✓
- Same problem: Lack of analytics ✓
- Same solution space: Install analytics tooling ✓

**Result**: Cluster into single dossier.

#### Output: Merged Dossier

```markdown
# Install Analytics for Brikette Website

<!-- DOSSIER-HEADER -->
Originator-Expert: hopkins
Originator-Lens: marketing
Contributors: hopkins, bezos, munger
Confidence-Tier: presentable
Confidence-Score: 75
Pipeline-Stage: promoted
Cluster-ID: BRIK-CLU-001
Rival-Lenses: finance
VOI-Score: 0.8
<!-- /DOSSIER-HEADER -->

<!-- DECISION-LOG -->
## hopkins (marketing)
Verdict: promote
Rationale: Cannot measure campaign ROI. Every marketing decision is guesswork. Need UTM tracking and conversion funnels. GA4 is free and well-documented.

## bezos (engineering)
Verdict: promote
Rationale: No instrumentation for A/B tests. Need event tracking layer. GA4 base + custom events = 1 week effort. Low risk, high signal value.

## munger (finance)
Verdict: P2
Rationale: Cannot justify marketing budget without attribution data. Any analytics tool (GA4, Plausible, Fathom) would work. Prefer free tier. Priority depends on marketing spend level — if >$5k/month, this is P1; if <$5k/month, this is P3.
<!-- /DECISION-LOG -->

## Problem

Brikette website has zero analytics instrumentation. This blocks:
- Campaign ROI measurement (marketing)
- A/B test instrumentation (engineering)
- Marketing budget justification (finance)

## Lens Variants

### Marketing Perspective (hopkins)

Focus: UTM tracking and conversion funnels. Need to know which channels drive traffic and which CTAs convert. Proposed: GA4 with campaign tagging standards.

### Engineering Perspective (bezos)

Focus: Event tracking layer for A/B tests. Need custom events for user actions (guide reads, search queries, CTA clicks). Proposed: GA4 base + dataLayer integration.

### Finance Perspective (munger)

Focus: Attribution and budget justification. Need any analytics tool that answers "Is marketing spend working?" Proposed: Tool-agnostic, prefer free tier, GA4 is fine.

## Lens Agreement

All three lenses independently identified lack of analytics as a blocker. Agreement on:
- **Problem**: No measurement = blind decision-making
- **Solution space**: Install analytics tooling (all converged on GA4)
- **Urgency**: High (2 of 3 said P1/P2)

**Signal strength**: 3 lenses agreeing = very high confidence. This is a real problem.

## Lens Rivalry

**engineering vs finance** (priority):
- **engineering**: Says "P1, we need this for A/B testing"
- **finance**: Says "P2-P3, depends on marketing spend level"
- **Tension**: Technical need vs ROI justification. Engineering wants infrastructure; finance wants proof of value.
- **Resolution path**: If current marketing spend >$5k/month, P1. If <$5k/month, P2. Check current spend with ops.

**marketing vs finance** (scope):
- **marketing**: Says "Need full GA4 + UTM + funnels"
- **finance**: Says "Any analytics tool is fine, don't over-engineer"
- **Tension**: Feature completeness vs time-to-signal. Marketing wants robust solution; finance wants quick answer.
- **Resolution path**: Start with GA4 base (2 hours). Add UTM tracking (1 day). Add custom events only if base GA4 proves valuable after 2 weeks.

## Proposed Solution (Synthesized)

**Phase 1 (2 hours)**: Install GA4 base tracking (page views, sessions)
**Phase 2 (1 day)**: Add UTM parameter tracking for campaigns
**Phase 3 (3 days)**: Add custom event layer for A/B tests

**Decision gate**: After Phase 1, review data for 2 weeks. If data is actionable, proceed to Phase 2. If not, consider alternative tools.

## Feasibility Signals

- **Technical**: Next.js supports GA4 via `next/script`. Done 3x on other sites. 2 hours work (engineering).
- **Commercial**: GA4 is free tier. No procurement. No ongoing cost unless >10M events/month (finance).
- **Legal**: GDPR compliance via cookie banner. Cookiebot integration exists. 1 day work (engineering).

## Business Alignment

Supports Q1 2026 goal: "Double organic traffic to Brikette guides." Cannot measure goal without analytics.

## Priority Calculation

- Impact: 6 (enables data-driven decisions)
- Confidence: 7.5 (3 lenses agree, proven tech)
- Signal-Speed: 0.9 (data flows immediately)
- Effort: 2 (1 week phased rollout)
- Risk: 1 (low, reversible)

**Priority = (6 × 7.5 × 0.9) / (2 × 2) = 10.1**

## Presentable Criteria Check

- [x] Customer/user identified: Marketing, engineering, finance teams
- [x] Problem statement: No analytics = blind decision-making across 3 functions
- [x] Feasibility signal: Proven tech, 1 week effort, done 3x before
- [x] Evidence: 3 independent lenses identified same gap
- [x] Business alignment: Supports Q1 traffic goal

**Status: Presentable** ✓
```

## Sweep Report Section

After clustering, the sweep report includes:

```markdown
## Clustering Summary

**Total candidates**: 18 dossiers
**Clusters formed**: 5
**Singletons**: 8
**Ideas merged**: 10 → 5 clustered dossiers

### Cluster Details

- **BRIK-CLU-001**: "Install analytics" (3 lenses: marketing, engineering, finance)
- **BRIK-CLU-002**: "SEO optimization" (2 lenses: marketing, growth)
- **PIPE-CLU-001**: "Automate invoicing" (2 lenses: finance, ops)
- **PIPE-CLU-002**: "Add payment methods" (2 lenses: sales, engineering)
- **BOSO-CLU-001**: "D1 query performance" (2 lenses: engineering, platform)

### Singleton Dossiers

8 ideas had no semantic overlap and passed through unchanged.

### Agreements Recorded

3 clusters show strong convergence (3+ lenses). Prioritize accordingly.

### Rivalries Recorded

4 rivalries flagged. All have clear resolution paths defined.
```

## Version History

- **v1.0** (2026-02-09): Initial specification for Cabinet System CS-05
