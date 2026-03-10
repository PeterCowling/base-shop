# Channel Research: Load Context and Fit Analysis

Implements Stages 1–2 of the `/lp-channels` workflow: building the channel landscape and scoring channel-customer fit.

## Stage 1: Load Context (RESEARCH)

1. Read `lp-offer` output to extract:
   - ICP demographics and psychographics
   - Positioning statement (where customers expect to find us)
   - Key objections (what content/proof is needed)
2. Read `lp-readiness` output to understand distribution feasibility
3. Load business context from strategy docs
4. If present, load standing GTM artifacts before inventing new structure:
   - `docs/business-os/strategy/<BIZ>/stockist-target-list.user.md`
   - `docs/business-os/strategy/<BIZ>/channel-health-log.user.md`
   - `docs/business-os/strategy/<BIZ>/weekly-demand-plan.user.md`
   - `docs/business-os/strategy/<BIZ>/channel-policy.user.md`
5. Identify 3-5 direct competitors and map their primary acquisition channels
6. Build channel landscape inventory (see Channel Taxonomy below)

**Channel Taxonomy** (classify all channels into these buckets):
- **Paid channels**: Google Ads, Meta Ads, LinkedIn Ads, TikTok Ads, influencer partnerships, affiliate marketing
- **Organic channels**: SEO (blog/content), social media (organic posts), community forums, PR/media coverage
- **Owned channels**: Email marketing, SMS, push notifications, owned community (Slack/Discord)
- **Earned channels**: Word-of-mouth, referrals, reviews/testimonials, partnerships
- **Distribution / physical channels**: boutiques, resort shops, wholesale accounts, distributors, marketplaces with partner-facing merchandising requirements

**Physical-distribution rule**:
- For physical-product businesses, distinguish between pre-live target capture in `stockist-target-list.user.md` and live sell-through actuals in `channel-health-log.user.md`.
- Do not collapse both into one undifferentiated "retail" note.

## Stage 2: Channel-Customer Fit Analysis (ANALYSIS)

For each channel in the landscape, score on 3 dimensions:

| Channel | Customer Fit | Cost Fit | Speed to First Result | Total Score | Notes |
|---------|--------------|----------|-----------------------|-------------|-------|
| Meta Ads | High (ICP on Facebook/Instagram daily) | Medium (CPC $1-3) | Fast (7-14 days to first conversion) | 8/10 | Objection: "too expensive" → need social proof in ads |
| SEO | Medium (ICP searches for solutions, but low intent) | High (mostly time, not budget) | Slow (3-6 months to ranking) | 6/10 | Long tail strategy, not launch channel |

**Scoring rubric**:
- **Customer fit** (0-4 points): Does the ICP use this channel? Do they discover/evaluate solutions here? Do they have intent when they arrive?
- **Cost fit** (0-3 points): Does it fit the budget? What's the cost per acquisition (CPA) benchmark? What's the minimum viable spend?
- **Speed to first result** (0-3 points): How long until first conversion? Can it generate revenue in 30 days?

**Additional scoring lens for distribution / physical channels**:
- Named-door quality matters more than abstract channel volume.
- Evaluate merchandising fit, staff sell-in likelihood, partner terms, display quality, reorder potential, and content spillover.

**Red flag channels** (score <5/10): Deprioritize. Document why they don't fit now (may fit later as business scales).
