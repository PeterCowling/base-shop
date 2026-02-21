# Channel Strategy: Selection, Constraints, and Cost Analysis

Implements Stages 3–4 of the `/lp-channels` workflow: selecting 2-3 launch channels with rationale and producing cost/constraint analysis.

## Stage 3: Select 2-3 Launch Channels (STRATEGY)

Choose 2-3 channels with highest total scores. For each selected channel, document:

### Selection Rationale

- **Why this channel fits the ICP**: Specific ICP behavior or platform usage (e.g., "Our ICP is 25-40 urban renters who scroll Instagram 2+ hours/day for design inspiration")
- **Why this channel fits the positioning**: How the channel aligns with competitive frame (e.g., "We position as premium vs. competitors on Craigslist, so Instagram's visual-first format reinforces premium perception")
- **Why this channel fits the objections**: Which objections can this channel address (e.g., "Meta Ads can show social proof via carousel testimonials to counter 'never heard of you' objection")
- **Why this channel fits the budget/resources**: Minimum viable spend and team capacity (e.g., "Meta Ads requires $500/month minimum + 5 hrs/week for creative iteration")

### Channel Constraints

**GATE-S6B-ACT-01 — Demand Evidence Pack (DEP) pre-activation gate:**

Before authorizing spend on any selected channel, verify DEP pass floor (all three conditions required):
1. ≥2 message variants tested per hypothesis; each has a denominator (`impressions`/`conversations`/`visits`) and a `source_tag`.
2. Objection log has ≥5 tagged verbatim objections OR `none_observed: true` with `sample_size` ≥5.
3. Speed-to-lead metric present with `sample_size` ≥1 (waivable pre-launch with explicit operator note).

DEP passes → channel eligible for spend authorization (GATE-S6B-ACT-01 pass).
DEP missing or fails → document gap with failure reason; mark channel `strategy-only`; do NOT authorize spend.

Required fields for authorization (all must be populated):
- **Minimum viable spend or timebox**: Minimum spend (€/£/$) or days to generate a testable result
- **Minimum denominator target**: Impressions/conversations/visits needed to declare test valid
- **Quality metric**: One quality metric beyond volume (e.g., CVR, response-rate, retention-week-1)
- **Stop condition**: Specific observable state that triggers channel exit (e.g., "CPA > €80 after 200 clicks")
- **Owner**: Named person responsible for monitoring and actioning the stop condition
- **Review date**: ISO date for next decision review (max 7 days from spend activation for first test)

Additional context fields (optional but recommended):
- **Budget ceiling**: Maximum monthly spend before diminishing returns
- **Resource requirements**: Team skills needed (design, copywriting, analytics, media buying)
- **Time to competence**: How long to learn the channel if team is new to it?
- **Creative demands**: What assets are needed? (Video, images, copy, landing pages)

### Success Metrics (30-Day Targets)

- **Volume metric**: Impressions, reach, sessions, or views
- **Engagement metric**: Click-through rate (CTR), engagement rate, time on site
- **Conversion metric**: Leads, purchases, signups (with target conversion rate)
- **Cost metric**: Cost per click (CPC), cost per lead (CPL), cost per acquisition (CPA)
- **Revenue metric** (if applicable): Revenue, average order value (AOV), return on ad spend (ROAS)

**Validation gate**: If any channel lacks a clear 30-day conversion metric, flag it as "awareness only" and ensure at least 1 channel drives conversions.

## Stage 4: Cost/Constraint Analysis (ANALYSIS)

For all selected channels combined, produce:

### Budget Allocation Table

| Channel | Month 1 Budget | Expected CPA | Expected Conversions | Notes |
|---------|----------------|--------------|----------------------|-------|
| Meta Ads | $1,000 | $50 | 20 leads | Assume 2% conversion rate from traffic |
| SEO (content) | $500 (freelance writer) | N/A (organic) | 0 in Month 1 | Long-tail strategy |
| **Total** | **$1,500** | — | **20 leads** | Budget assumes no existing audience |

### Resource Allocation Table

| Channel | Team Member | Hours/Week | Activities |
|---------|-------------|------------|------------|
| Meta Ads | Founder (or freelance media buyer) | 5 hrs | Creative testing, audience iteration, daily budget checks |
| SEO (content) | Freelance writer | 10 hrs | 2 blog posts/month (1500 words each) |

### Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Meta Ads CPA exceeds $50 (target) | High | High (burns budget) | Set $30/day limit, pause if CPA >$75 after 100 clicks |
| SEO content gets no traffic in Month 1 | Very High | Low (expected) | Repurpose content for social media to get immediate reach |
