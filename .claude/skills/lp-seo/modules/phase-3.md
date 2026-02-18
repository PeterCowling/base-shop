# Phase 3: SERP Briefs

**Loads**: `phase-base-contract.md` (output location, common inputs, inter-phase handoff, quality requirements)
**Prerequisites**: Phase 2 content-clusters output
**Output**: `docs/business-os/strategy/<BIZ>/seo/<YYYY-MM-DD>-serp-briefs-<BIZ>.user.md`

Analyze top-ranking pages for priority keywords to create content briefs that match search intent.

## Workflow

1. **Select target keywords**:
   - From Phase 2 clusters, pick 5-10 high-priority keywords
   - Focus on Phase 1 production priorities (quick wins + strategic pillars)

2. **SERP research per keyword** (use WebSearch):
   - Fetch top 10 organic results for each keyword
   - Identify common content patterns: length, structure, headings, media types
   - Note SERP features: featured snippets, People Also Ask, video carousels, local packs, knowledge panels

3. **Content gap identification**:
   - What do top results cover that others miss?
   - What angles are underserved? (Opportunity for differentiation)

4. **User intent validation**:
   - Does SERP confirm keyword intent assumption from Phase 1?
   - Adjust content brief to match actual SERP intent

5. **Brief creation per keyword**:
   - Recommended length, structure, headings
   - Must-cover topics and subtopics
   - Media requirements (images, videos, infographics)
   - Differentiation angle based on business positioning
   - Target SERP features (e.g., structure content to win featured snippet)

## Output Template

```markdown
# SERP Briefs: <BUSINESS_NAME>

**Generated**: YYYY-MM-DD
**Source**: content-clusters-<BIZ>.md (YYYY-MM-DD)
**Keywords Analyzed**: <COUNT>

## Brief Summary

| Keyword | Target URL/Slug | Content Type | Est. Length | SERP Features | Priority |
|---------|-----------------|--------------|-------------|---------------|----------|
| [kw]    | /path/to/page   | Guide        | 3000 words  | Featured Snip | High     |

---

## Brief 1: [Keyword]

**Target Keyword**: [Primary keyword]
**Secondary Keywords**: [Related keywords to include]
**Target URL**: [Proposed slug/path]
**Content Cluster**: [From Phase 2]
**Journey Stage**: [Awareness/Consideration/Decision]

### SERP Analysis Summary

**Top 10 Results Overview**:
- Average length: [word count]
- Common content types: [blog post, guide, tool, video, landing page]
- Domain authority level: [Mix of high/medium DA sites]

**SERP Features Present**:
- [ ] Featured snippet (type: paragraph/list/table)
- [ ] People Also Ask
- [ ] Video carousel
- [ ] Image pack
- [ ] Local pack
- [ ] Knowledge panel

**Top Ranking Content Patterns**:
1. [Common element - e.g., All include comparison tables]
2. [Common element - e.g., Most have embedded videos]
3. [Common element - e.g., Comprehensive, 2000+ words]

**Content Gaps** (opportunities):
- [e.g., No one addresses [specific angle] from our positioning]
- [e.g., Outdated info - chance to publish fresh data]

### Content Brief

**Primary Goal**: [What user needs to accomplish/learn]
**Recommended Format**: [Ultimate guide / Comparison / How-to / Tool page / Case study]
**Target Length**: [word count range based on SERP analysis]

**Required Sections/Headings**:
1. [H2: Introduction - hook and value prop]
2. [H2: Core topic section 1]
   - [H3: Subtopic]
3. [H2: Core topic section 2]
4. [H2: Practical examples/steps]
5. [H2: FAQ section - target PAA box]
6. [H2: Conclusion + CTA]

**Must-Cover Topics** (from SERP analysis):
- [Topic 1 - all top results include this]
- [Topic 2 - user expectation based on query]

**Differentiation Angle** (from positioning):
- [How this content ties to unique value prop]
- [Unique data, perspective, or case study to include]

**Media Requirements**:
- [ ] Hero image (custom, not stock)
- [ ] [X] supporting images/screenshots
- [ ] Comparison table (if applicable)
- [ ] Embedded video (if competing results have it)
- [ ] Infographic or visual summary

**Snippet Optimization Targets**:
- **Featured Snippet**: [Structure content to answer query in 40-60 words, use list/table if SERP has that format]
- **People Also Ask**: [List PAA questions to answer in FAQ section]

**Internal Links**:
- Link to pillar page: [URL]
- Link to related spoke content: [URLs]

**External Links** (authority):
- [2-3 high-authority sources to cite for credibility]

**CTA Strategy**:
- [Align with journey stage - e.g., newsletter signup for awareness, demo request for decision]

### Success Metrics

- Target: Rank in top 10 within 3 months, top 5 within 6 months
- Secondary: Capture featured snippet if available
- Engagement: Avg. time on page >2 min, <60% bounce rate

---

[Repeat for each priority keyword]

## Production Notes

- Briefs ready for handoff to content team or lp-content/draft-marketing skill
- Update briefs quarterly as SERPs evolve
- Track ranking progress and adjust content based on performance
```

## Quality Checks

- [ ] 5-10 briefs created for highest-priority keywords
- [ ] Each brief includes SERP analysis with top 10 results reviewed
- [ ] Content structure aligns with top-ranking pages
- [ ] Differentiation angle clear (not just copying competitors)
- [ ] SERP features identified and optimization strategies noted
- [ ] Recommended length and format based on actual SERP data
- [ ] Must-cover topics extracted from top results
- [ ] Media requirements specified
- [ ] Internal linking strategy tied to Phase 2 clusters
