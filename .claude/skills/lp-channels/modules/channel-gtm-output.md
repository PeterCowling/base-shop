# Channel GTM Output: Timeline, Documentation, and Quality

Implements Stages 5–6 of the `/lp-channels` workflow plus quality checks and output validation.

## Stage 5: 30-Day GTM Timeline (STRATEGY)

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

**Critical path**: Identify which actions MUST happen on time for GTM to succeed (e.g., pixel installation before ad launch).

**Buffer days**: Add 2-3 day buffer for each deliverable to account for delays (approval, creative iteration, platform bugs).

## Stage 6: Document Artifact (DOCUMENT)

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
4. Self-audit against Quality Checks below

## Quality Checks

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
