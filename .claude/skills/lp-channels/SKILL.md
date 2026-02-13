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

Required:
- `--business <BIZ>` — business identifier (e.g., BRIK, SEG, INT)

## Operating Mode

RESEARCH + ANALYSIS + STRATEGY + DOCUMENT

This skill:
- Researches channel landscape (paid, organic, owned, earned)
- Analyzes channel-customer fit using ICP and positioning from lp-offer
- Selects 2-3 launch channels with explicit rationale
- Produces cost/constraint analysis for each selected channel
- Designs 30-day GTM timeline with sequenced actions
- Documents channel strategy at `docs/business-os/startup-baselines/<BIZ>-channels.md`
- Does NOT execute campaigns (produces strategy to implement)
- Does NOT select channels without ICP validation (requires lp-offer input)

## Inputs

Required:
- `lp-offer` output (ICP, positioning, objections) from `docs/business-os/startup-baselines/<BIZ>-offer.md`
- `lp-readiness` output (distribution feasibility from RG-02 gate)
- Business context from `docs/business-os/strategy/<BIZ>/` or user-provided description

Optional (enhances quality):
- Competitor channel analysis (where competitors acquire customers)
- Budget constraints (monthly marketing budget)
- Resource constraints (team size, skills, available time)
- Existing channels/audiences (email list, social followers, content library)
- Market research docs from `docs/business-os/market-research/`

## Workflow

### Stage 1: Load Context (RESEARCH)

1. Read `lp-offer` output to extract:
   - ICP demographics and psychographics
   - Positioning statement (where customers expect to find us)
   - Key objections (what content/proof is needed)
2. Read `lp-readiness` output to understand distribution feasibility
3. Load business context from strategy docs
4. Identify 3-5 direct competitors and map their primary acquisition channels
5. Build channel landscape inventory (see Channel Taxonomy below)

**Channel Taxonomy** (classify all channels into these buckets):
- **Paid channels**: Google Ads, Meta Ads, LinkedIn Ads, TikTok Ads, influencer partnerships, affiliate marketing
- **Organic channels**: SEO (blog/content), social media (organic posts), community forums, PR/media coverage
- **Owned channels**: Email marketing, SMS, push notifications, owned community (Slack/Discord)
- **Earned channels**: Word-of-mouth, referrals, reviews/testimonials, partnerships

### Stage 2: Channel-Customer Fit Analysis (ANALYSIS)

For each channel in the landscape, score on 3 dimensions:

| Channel | Customer Fit | Cost Fit | Speed to First Result | Total Score | Notes |
|---------|--------------|----------|-----------------------|-------------|-------|
| Meta Ads | High (ICP on Facebook/Instagram daily) | Medium (CPC $1-3) | Fast (7-14 days to first conversion) | 8/10 | Objection: "too expensive" → need social proof in ads |
| SEO | Medium (ICP searches for solutions, but low intent) | High (mostly time, not budget) | Slow (3-6 months to ranking) | 6/10 | Long tail strategy, not launch channel |

**Scoring rubric**:
- **Customer fit** (0-4 points): Does the ICP use this channel? Do they discover/evaluate solutions here? Do they have intent when they arrive?
- **Cost fit** (0-3 points): Does it fit the budget? What's the cost per acquisition (CPA) benchmark? What's the minimum viable spend?
- **Speed to first result** (0-3 points): How long until first conversion? Can it generate revenue in 30 days?

**Red flag channels** (score <5/10): Deprioritize. Document why they don't fit now (may fit later as business scales).

### Stage 3: Select 2-3 Launch Channels (STRATEGY)

Choose 2-3 channels with highest total scores. For each selected channel, document:

#### Selection Rationale
- **Why this channel fits the ICP**: Specific ICP behavior or platform usage (e.g., "Our ICP is 25-40 urban renters who scroll Instagram 2+ hours/day for design inspiration")
- **Why this channel fits the positioning**: How does the channel align with competitive frame? (e.g., "We position as premium vs. competitors on Craigslist, so Instagram's visual-first format reinforces premium perception")
- **Why this channel fits the objections**: Which objections can this channel address? (e.g., "Meta Ads can show social proof via carousel testimonials to counter 'never heard of you' objection")
- **Why this channel fits the budget/resources**: What's the minimum viable spend and team capacity? (e.g., "Meta Ads requires $500/month minimum + 5 hrs/week for creative iteration")

#### Channel Constraints
- **Budget floor**: Minimum monthly spend to test effectively
- **Budget ceiling**: Maximum monthly spend before diminishing returns
- **Resource requirements**: Team skills needed (design, copywriting, analytics, media buying)
- **Time to competence**: How long to learn the channel if team is new to it?
- **Creative demands**: What assets are needed? (Video, images, copy, landing pages)

#### Success Metrics (30-Day Targets)
- **Volume metric**: Impressions, reach, sessions, or views
- **Engagement metric**: Click-through rate (CTR), engagement rate, time on site
- **Conversion metric**: Leads, purchases, signups (with target conversion rate)
- **Cost metric**: Cost per click (CPC), cost per lead (CPL), cost per acquisition (CPA)
- **Revenue metric** (if applicable): Revenue, average order value (AOV), return on ad spend (ROAS)

**Validation gate**: If any channel lacks a clear 30-day conversion metric, flag it as "awareness only" and ensure at least 1 channel drives conversions.

### Stage 4: Cost/Constraint Analysis (ANALYSIS)

For all selected channels combined, produce:

#### Budget Allocation Table
| Channel | Month 1 Budget | Expected CPA | Expected Conversions | Notes |
|---------|----------------|--------------|----------------------|-------|
| Meta Ads | $1,000 | $50 | 20 leads | Assume 2% conversion rate from traffic |
| SEO (content) | $500 (freelance writer) | N/A (organic) | 0 in Month 1 | Long-tail strategy |
| **Total** | **$1,500** | — | **20 leads** | Budget assumes no existing audience |

#### Resource Allocation Table
| Channel | Team Member | Hours/Week | Activities |
|---------|-------------|------------|------------|
| Meta Ads | Founder (or freelance media buyer) | 5 hrs | Creative testing, audience iteration, daily budget checks |
| SEO (content) | Freelance writer | 10 hrs | 2 blog posts/month (1500 words each) |

#### Risk Register
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Meta Ads CPA exceeds $50 (target) | High | High (burns budget) | Set $30/day limit, pause if CPA >$75 after 100 clicks |
| SEO content gets no traffic in Month 1 | Very High | Low (expected) | Repurpose content for social media to get immediate reach |

### Stage 5: 30-Day GTM Timeline (STRATEGY)

Produce a sequenced timeline with dependencies and milestones.

**Timeline format** (Gantt-style table):

| Week | Action | Owner | Channel | Dependency | Milestone |
|------|--------|-------|---------|------------|-----------|
| Pre-launch | Create Meta Ads account, install pixel | Founder | Meta Ads | None | Pixel verified |
| Pre-launch | Write 3 ad creatives (carousel, video, image) | Founder/Designer | Meta Ads | Pixel verified | Creatives approved |
| Week 1 | Launch Meta Ads campaign ($30/day) | Founder | Meta Ads | Creatives approved | Campaign live |
| Week 1 | Publish blog post #1 (SEO keyword research) | Freelance writer | SEO | None | Post indexed |
| Week 2 | Review Meta Ads performance, pause low CTR creatives | Founder | Meta Ads | Campaign live | 1st optimization |
| Week 2 | Repurpose blog post #1 into 5 social posts | Founder | Organic social | Post indexed | Social posts live |
| Week 3 | Launch second Meta Ads campaign (retargeting) | Founder | Meta Ads | 1st optimization | Retargeting live |
| Week 3 | Publish blog post #2 | Freelance writer | SEO | None | Post indexed |
| Week 4 | Analyze Month 1 results, calculate CPA/CPL | Founder | All channels | All campaigns live | Month 1 report |
| Week 4 | Decide: scale winners, pause losers, iterate creatives | Founder | All channels | Month 1 report | Month 2 plan |

**Critical path**: Which actions MUST happen on time for GTM to succeed? (e.g., pixel installation before ad launch)

**Buffer days**: Add 2-3 day buffer for each deliverable to account for delays (approval, creative iteration, platform bugs)

### Stage 6: Document Artifact (DOCUMENT)

1. Write complete channel strategy to `docs/business-os/startup-baselines/<BIZ>-channels.md`
2. Include metadata header:
   ```yaml
   ---
   business: <BIZ>
   artifact: channel-strategy
   created: <date>
   status: ready-to-execute
   selected-channels: [Meta Ads, SEO, Email]
   budget-month-1: $1500
   ---
   ```
3. Append evidence register at end: list all sources consulted (competitor channel analysis, ICP research, cost benchmarks)
4. Self-audit against Quality Checks (see below)

## Output Contract

Produces single file: `docs/business-os/startup-baselines/<BIZ>-channels.md`

**Structure**:
1. Metadata frontmatter (YAML)
2. Executive summary (2-3 sentences: what channels, why those channels, what's the 30-day goal)
3. Section 1: Channel Landscape Audit (full taxonomy table with scores)
4. Section 2: Selected Channels (2-3 channels with selection rationale, constraints, success metrics)
5. Section 3: Cost/Constraint Analysis (budget allocation, resource allocation, risk register)
6. Section 4: 30-Day GTM Timeline (Gantt-style table with dependencies and milestones)
7. Section 5: Month 2+ Roadmap (what channels to add/scale after Month 1 validation)
8. Evidence Register (sources cited with URLs or file paths)

**Downstream compatibility**:
- `draft-marketing` consumes: Selected channels (for asset targeting), positioning (for messaging), success metrics (for creative testing)
- `lp-seo` consumes: Organic channel context (if SEO is selected channel), keyword intent from ICP
- `lp-fact-find` consumes: Channel strategy to scope go-items (e.g., "build Meta Ads creative library", "set up retargeting pixel")
- `startup-loop` uses at S6B to validate readiness for S7 (execution)

## Quality Checks

Before finalizing, verify:
- QC-01: Channel landscape audit includes ≥8 channels with scores on all 3 dimensions (customer fit, cost fit, speed)
- QC-02: 2-3 channels selected (not 1, not 5+)
- QC-03: Each selected channel has selection rationale (4 "why" statements: ICP, positioning, objections, budget/resources)
- QC-04: Each selected channel has 30-day success metrics (volume, engagement, conversion, cost, revenue as applicable)
- QC-05: Budget allocation table shows total budget ≤ stated budget constraint (or flags "budget gap")
- QC-06: Resource allocation table shows owner and hours/week for each channel
- QC-07: 30-day GTM timeline has ≥10 actions with dependencies and milestones
- QC-08: Timeline includes critical path identification (what must happen on time)
- QC-09: Risk register has ≥3 risks with mitigation plans
- QC-10: Evidence register cites ≥3 sources (competitor analysis, cost benchmarks, or ICP research)

## Red Flags

Invalid outputs that MUST be rejected:
- Only 1 channel selected (not enough diversification)
- 5+ channels selected (too dispersed for startup resources)
- Channel selected without ICP fit rationale (e.g., "LinkedIn Ads" but ICP is B2C consumers)
- No 30-day conversion metric for any channel (all channels are "awareness only")
- Budget allocation exceeds stated budget constraint with no gap flagged
- GTM timeline has actions but no dependencies (unrealistic sequencing)
- No resource allocation (doesn't account for team capacity)
- Success metrics missing cost metrics (CPC, CPL, CPA)
- Positioning from lp-offer not referenced in channel selection rationale
- Evidence register empty or cites non-existent files

## Integration

### Upstream (S2B, S1)
- Preceded by `/lp-offer --business <BIZ>` (S2B) — MUST consume ICP, positioning, and objections
- Preceded by `/lp-readiness --business <BIZ>` (S1) — MUST pass RG-02 distribution feasibility gate
- Reads business context from `docs/business-os/strategy/<BIZ>/`
- May consume market research from `docs/business-os/market-research/` if available

### Downstream (S7, S8, S9)
- `/draft-marketing` uses channel selection for asset targeting (e.g., "create Meta Ads carousel" vs. "create LinkedIn thought leadership")
- `/lp-seo` uses organic channel context (if SEO selected) and ICP keyword intent for content strategy
- `/lp-fact-find` scopes go-items based on GTM timeline (e.g., "pixel setup", "creative production", "landing page optimization")
- `startup-loop` validates channel strategy at S6B before proceeding to S7 (execution)

### Parallel Skills
- Can run in parallel with `/lp-forecast` (S2C) if both consume same lp-offer input
- Does NOT depend on `/lp-measure` (measurement setup), but measurement feeds into success metrics tracking
