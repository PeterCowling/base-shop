---
name: lp-seo
description: S6B phased SEO strategy skill - keyword research, content clustering, SERP analysis, technical audit, and snippet optimization for any business
---

# SEO Strategy Skill (S6B)

Systematic, phased SEO planning for organic search visibility. Works for any business with web presence - SaaS, e-commerce, content, services, or B2B. Produces actionable keyword universes, content clusters, SERP-informed briefs, technical audit checklists, and snippet optimization recommendations.

## Invocation

```bash
# Run a specific phase
/lp-seo keyword-universe --business <BIZ>
/lp-seo content-clusters --business <BIZ>
/lp-seo serp-briefs --business <BIZ>
/lp-seo tech-audit --business <BIZ>
/lp-seo snippet-optimization --business <BIZ>

# Run all phases sequentially
/lp-seo all --business <BIZ>
```

**Required**: `--business <BIZ>` flag pointing to business directory under `docs/business-os/`.

**Optional flags**:
- `--locale <LOCALE>`: Target locale for keyword research (default: en-US)
- `--competitors <COMMA_SEPARATED_URLS>`: Competitor URLs for analysis
- `--existing-content <PATH>`: Path to existing content inventory for tech audit

## Operating Mode

**Model**: Always use `model: "opus"` for all phases.

**Execution Pattern**: Each phase builds on the previous. When running `/lp-seo all`, execute phases sequentially and pass outputs forward. When running a single phase, check for prerequisite outputs and either load them or warn the user.

**Output Location**: All artifacts saved to `docs/business-os/<BIZ>/seo/` with timestamped filenames following pattern: `YYYY-MM-DD-<phase>-<BIZ>.md`.

**Research Sources**: Use WebSearch extensively for keyword research, SERP analysis, and competitive intelligence. Use existing business artifacts (positioning, offer, channel strategy) from upstream skills.

## Inputs

### Common Inputs (All Phases)

Required artifacts from previous startup loop skills:

- **From lp-offer (S2B)**: `docs/business-os/<BIZ>/strategy/YYYY-MM-DD-positioning-<BIZ>.md` - value proposition, target customer, differentiation
- **From lp-channels (S6B)**: `docs/business-os/<BIZ>/strategy/YYYY-MM-DD-channel-strategy-<BIZ>.md` - confirmation that organic search is a prioritized channel

Optional but recommended:

- **From lp-content (S6B)**: Content inventory or sitemap for tech audit phase
- **Competitor URLs**: Via `--competitors` flag for competitive analysis

### Phase-Specific Prerequisites

**Phase 2 (Content Clusters)**: Requires Phase 1 keyword universe output.

**Phase 3 (SERP Briefs)**: Requires Phase 2 content cluster output.

**Phase 4 (Tech Audit)**: Can run independently but benefits from knowing target keywords (Phase 1) and content strategy (Phase 2).

**Phase 5 (Snippet Optimization)**: Requires Phase 3 SERP briefs and Phase 4 tech audit findings.

## Phase 1: Keyword Universe

Build a comprehensive keyword inventory across all customer journey stages.

### Workflow

1. **Load business context**:
   - Read positioning artifact for value prop, customer pain points, product/service terminology
   - Extract core topics, industry vertical, customer language patterns

2. **Seed keyword generation**:
   - Primary seeds: Product/service names, category terms (e.g., "project management software", "vacation rentals")
   - Problem-based seeds: Customer pain points from positioning (e.g., "how to track team tasks")
   - Competitor seeds: Reverse-engineer from `--competitors` flag URLs if provided

3. **Keyword expansion** (use WebSearch):
   - Question modifiers: who, what, where, when, why, how + seed
   - Commercial intent: best, top, review, comparison, alternative, vs + seed
   - Location modifiers: near me, in [city], [location] + seed (if local business)
   - Long-tail variations: Use Google autocomplete patterns (seed + prepositions, seed + for [use case])

4. **Journey stage classification**:
   - **Awareness**: Problem-focused, educational (e.g., "why is team communication hard")
   - **Consideration**: Solution research, comparisons (e.g., "best project management tools for remote teams")
   - **Decision**: Brand + action, pricing, buying signals (e.g., "Asana vs Monday pricing")

5. **Difficulty assessment**:
   - Research SERP competition for top 20 keywords via WebSearch
   - Tag as: Low (blog posts, forums, weak DA), Medium (established sites, mixed content types), High (major brands, Wikipedia, top-tier publishers)

### Output Template

```markdown
# Keyword Universe: <BUSINESS_NAME>

**Generated**: YYYY-MM-DD
**Locale**: <LOCALE>
**Total Keywords**: <COUNT>

## Executive Summary

[2-3 sentences: keyword opportunity landscape, primary themes, quick wins vs long-term targets]

## Seed Keywords (Core Topics)

| Seed Keyword | Monthly Search Volume* | Competition Level | Priority |
|--------------|------------------------|-------------------|----------|
| [keyword]    | [Low/Med/High]        | [Low/Med/High]    | [1-5]    |

*Note: Estimated ranges based on autocomplete signals and SERP analysis.

## Expanded Keywords by Journey Stage

### Awareness Stage (Problem/Educational)

| Keyword | Type | Difficulty | Notes |
|---------|------|------------|-------|
| [kw]    | Q/Info | Low/Med/High | [SERP insight] |

### Consideration Stage (Solution Research)

| Keyword | Type | Difficulty | Notes |
|---------|------|------------|-------|
| [kw]    | Comparison/Review | Low/Med/High | [SERP insight] |

### Decision Stage (Commercial/Transactional)

| Keyword | Type | Difficulty | Notes |
|---------|------|------------|-------|
| [kw]    | Commercial/Brand | Low/Med/High | [SERP insight] |

## Competitor Keyword Gaps

[If --competitors provided: Keywords where competitors rank that business doesn't target]

## Quick Win Opportunities

[5-10 keywords: Low competition + relevant + decent volume]

## Long-Term Targets

[5-10 keywords: High value + high competition, require authority building]

## Geographic Considerations

[If local business: Location-specific keyword patterns, local pack opportunities]

## Recommendations

- Primary keyword targets for immediate content creation
- Content gap areas vs competitors
- Authority-building topics for long-term SEO investment
```

### Quality Checks

- [ ] At least 50 keywords across all journey stages
- [ ] Keywords span awareness, consideration, and decision stages
- [ ] Difficulty levels assessed for top opportunities
- [ ] Quick wins identified (low-hanging fruit)
- [ ] Keywords align with business positioning and value prop
- [ ] Search intent documented for each keyword (informational, navigational, commercial, transactional)

## Phase 2: Content Clusters

Group keywords into topical clusters for content strategy and internal linking architecture.

### Workflow

1. **Load keyword universe**:
   - Read Phase 1 output
   - Extract all keywords with metadata (journey stage, difficulty, priority)

2. **Cluster identification**:
   - **Semantic grouping**: Keywords sharing topic/theme (e.g., "project management templates" cluster)
   - **Intent alignment**: Group by user intent even across topics (e.g., all "how to" queries)
   - **Journey stage coherence**: Clusters can span stages but note stage distribution

3. **Pillar page identification**:
   - For each cluster, identify the broad, high-authority topic for a pillar/hub page
   - Example: Pillar = "Project Management Guide", Spokes = "Gantt charts", "Agile vs Waterfall", "PM tools comparison"

4. **Internal linking strategy**:
   - Map spoke-to-pillar relationships
   - Identify horizontal links between related spokes

5. **Content format recommendations**:
   - Match cluster intent to format: guides, comparisons, tools, case studies, FAQs
   - Note mixed-media opportunities: video, interactive tools, downloadable resources

### Output Template

```markdown
# Content Clusters: <BUSINESS_NAME>

**Generated**: YYYY-MM-DD
**Source**: keyword-universe-<BIZ>.md (YYYY-MM-DD)
**Total Clusters**: <COUNT>

## Cluster Summary

| Cluster Name | Pillar Topic | Keyword Count | Difficulty | Priority |
|--------------|--------------|---------------|------------|----------|
| [name]       | [topic]      | [count]       | Avg: Med   | [1-5]    |

## Cluster Details

### Cluster 1: [Name]

**Pillar Page**: [Broad topic for hub page]
**Target Audience**: [From positioning - who needs this info]
**Business Goal**: [Awareness/Consideration/Decision - primary stage]

**Keywords in Cluster** (ordered by priority):

| Keyword | Journey Stage | Difficulty | Search Intent | Recommended Format |
|---------|---------------|------------|---------------|-------------------|
| [kw]    | Awareness     | Low        | Informational | Blog post         |

**Content Strategy**:
- Pillar page scope: [What the comprehensive guide should cover]
- Spoke content pieces: [List of supporting articles/pages]
- Internal linking: [Hub-spoke structure notes]
- Differentiation angle: [How to stand out from competitors on this topic]

**Format Recommendations**:
- [e.g., Ultimate guide (5000+ words), comparison table, interactive calculator, video explainer]

---

[Repeat for each cluster]

## Cross-Cluster Linking Opportunities

[Horizontal links between related clusters - e.g., "Remote Work Tools" cluster links to "Team Communication" cluster]

## Content Gap Analysis

[Topics competitors cover that your keyword universe doesn't address - consider adding]

## Production Prioritization

**Phase 1 (Months 1-3)**: [Clusters to tackle first - usually quick wins + strategic pillars]

**Phase 2 (Months 4-6)**: [Medium difficulty clusters]

**Phase 3 (Months 6-12)**: [Long-term authority plays, high-competition clusters]

## Recommendations

- Start with [X] cluster(s) for immediate content production
- Build pillar pages first to establish topical authority
- Create spoke content iteratively, linking back to pillar
- Update pillar pages as spoke content grows (keep fresh)
```

### Quality Checks

- [ ] 3-8 distinct clusters identified
- [ ] Each cluster has a clear pillar topic
- [ ] Keywords grouped by semantic relevance and intent
- [ ] Internal linking strategy documented
- [ ] Content formats matched to user intent
- [ ] Production prioritization aligns with business goals (quick wins + strategic bets)
- [ ] Clusters cover full customer journey (not just top-of-funnel)

## Phase 3: SERP Briefs

Analyze top-ranking pages for priority keywords to create content briefs that match search intent.

### Workflow

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

### Output Template

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

### Quality Checks

- [ ] 5-10 briefs created for highest-priority keywords
- [ ] Each brief includes SERP analysis with top 10 results reviewed
- [ ] Content structure aligns with top-ranking pages
- [ ] Differentiation angle clear (not just copying competitors)
- [ ] SERP features identified and optimization strategies noted
- [ ] Recommended length and format based on actual SERP data
- [ ] Must-cover topics extracted from top results
- [ ] Media requirements specified
- [ ] Internal linking strategy tied to Phase 2 clusters

## Phase 4: Tech Audit

Audit technical SEO foundations to ensure content can rank. Covers crawlability, indexability, site speed, mobile-friendliness, structured data, and core web vitals.

### Workflow

1. **Scope determination**:
   - If `--existing-content` flag provided: Audit existing site/content inventory
   - If new site/pre-launch: Audit planned tech stack and configuration
   - Use business context to understand site type (e.g., Next.js SSG, WordPress, Shopify)

2. **Crawlability audit**:
   - Check robots.txt configuration (use WebSearch to find site's robots.txt if existing)
   - Review sitemap.xml presence and structure
   - Identify crawl budget issues (large sites: pagination, infinite scroll, duplicate URLs)

3. **Indexability audit**:
   - Check for noindex tags (intentional or accidental)
   - Canonical tag usage and correctness
   - Duplicate content risks (URL parameters, www vs non-www, http vs https)

4. **Page speed and Core Web Vitals**:
   - If existing site: Use WebSearch to check PageSpeed Insights data
   - If new site: Review tech stack for speed best practices (SSG vs SSR, image optimization, lazy loading)
   - Target benchmarks: LCP <2.5s, FID <100ms, CLS <0.1

5. **Mobile-friendliness**:
   - Responsive design check
   - Touch target sizes, viewport configuration
   - Mobile page speed (often slower than desktop)

6. **Structured data**:
   - Identify relevant schema types for business (e.g., Organization, Product, Article, LocalBusiness, FAQ)
   - Check implementation if existing site
   - Recommend schema types if new site

7. **HTTPS and security**:
   - Verify SSL certificate
   - Check for mixed content issues

8. **International/multilingual SEO** (if applicable):
   - Hreflang tags for multi-locale sites
   - URL structure (subdomain vs subdirectory vs ccTLD)

9. **Checklist creation**:
   - Prioritized action items (Critical, High, Medium, Low)
   - Link to relevant documentation or tools

### Output Template

```markdown
# Technical SEO Audit: <BUSINESS_NAME>

**Generated**: YYYY-MM-DD
**Site/Product**: [URL if existing, or "Pre-launch" if new]
**Audit Scope**: [Existing site / Planned architecture]

## Executive Summary

**Overall Health**: [Red/Yellow/Green]

**Critical Issues**: [Count] - [Brief description of blockers]
**High Priority**: [Count]
**Medium Priority**: [Count]
**Low Priority**: [Count]

[2-3 sentences: Biggest risks, quick wins, overall recommendation]

## Audit Findings

### 1. Crawlability

**Status**: [Pass / Needs Attention / Fail]

| Item | Status | Notes | Priority | Action Required |
|------|--------|-------|----------|-----------------|
| robots.txt configured | [Pass/Fail] | [Details] | [C/H/M/L] | [Action] |
| Sitemap.xml present | [Pass/Fail] | [Details] | [C/H/M/L] | [Action] |
| No orphan pages | [Pass/Fail] | [Details] | [M] | [Action] |
| Crawl budget optimization | [Pass/Fail] | [Details] | [M/L] | [Action] |

**Recommendations**:
- [Action item 1]
- [Action item 2]

### 2. Indexability

**Status**: [Pass / Needs Attention / Fail]

| Item | Status | Notes | Priority | Action Required |
|------|--------|-------|----------|-----------------|
| No unintentional noindex | [Pass/Fail] | [Details] | [C] | [Action] |
| Canonical tags correct | [Pass/Fail] | [Details] | [H] | [Action] |
| No duplicate content | [Pass/Fail] | [Details] | [H] | [Action] |
| URL structure clean | [Pass/Fail] | [Details] | [M] | [Action] |

**Recommendations**:
- [Action item 1]

### 3. Page Speed & Core Web Vitals

**Status**: [Pass / Needs Attention / Fail]

| Metric | Current | Target | Status | Priority |
|--------|---------|--------|--------|----------|
| LCP (Largest Contentful Paint) | [X]s | <2.5s | [Pass/Fail] | [C/H] |
| FID (First Input Delay) | [X]ms | <100ms | [Pass/Fail] | [H] |
| CLS (Cumulative Layout Shift) | [X] | <0.1 | [Pass/Fail] | [H] |
| Time to First Byte (TTFB) | [X]ms | <600ms | [Pass/Fail] | [M] |

**Key Issues**:
- [e.g., Unoptimized images slowing LCP]
- [e.g., No lazy loading for below-fold content]

**Recommendations**:
- [Action: Implement next/image or equivalent for automatic optimization]
- [Action: Enable CDN for static assets]
- [Action: Minimize JavaScript bundle size]

### 4. Mobile-Friendliness

**Status**: [Pass / Needs Attention / Fail]

| Item | Status | Notes | Priority |
|------|--------|-------|----------|
| Responsive design | [Pass/Fail] | [Details] | [C] |
| Viewport configured | [Pass/Fail] | [Details] | [C] |
| Touch targets >48px | [Pass/Fail] | [Details] | [H] |
| No horizontal scroll | [Pass/Fail] | [Details] | [H] |
| Mobile page speed | [Pass/Fail] | [Details] | [H] |

**Recommendations**:
- [Action item 1]

### 5. Structured Data

**Status**: [Pass / Needs Attention / Fail]

**Implemented Schema Types**:
- [e.g., Organization, Article, BreadcrumbList]

**Recommended Schema Types** (not yet implemented):
- [ ] Organization (sitewide)
- [ ] WebSite (with sitelinks search box)
- [ ] Article (for blog posts)
- [ ] Product (if e-commerce)
- [ ] FAQ (for FAQ sections - targets featured snippets)
- [ ] LocalBusiness (if local business)
- [ ] Review/AggregateRating (if applicable)

**Validation**:
- [Pass/Fail] - Test with Google Rich Results Test

**Recommendations**:
- Implement [schema type] on [page types]
- Validate all structured data before launch

### 6. HTTPS & Security

**Status**: [Pass / Needs Attention / Fail]

| Item | Status | Notes | Priority |
|------|--------|-------|----------|
| Valid SSL certificate | [Pass/Fail] | [Details] | [C] |
| All resources HTTPS | [Pass/Fail] | [Details] | [C] |
| No mixed content warnings | [Pass/Fail] | [Details] | [H] |
| HTTP to HTTPS redirect | [Pass/Fail] | [Details] | [H] |

### 7. International/Multilingual SEO

**Status**: [Pass / Needs Attention / Fail / N/A]

| Item | Status | Notes | Priority |
|------|--------|-------|----------|
| Hreflang tags implemented | [Pass/Fail/N/A] | [Details] | [H if multilingual] |
| Locale URL structure | [Pass/Fail/N/A] | [Details] | [M] |
| Language switcher UX | [Pass/Fail/N/A] | [Details] | [M] |

**Recommendations**:
- [Action item if multilingual site]

## Prioritized Action Checklist

### Critical (Launch Blockers)

- [ ] [Action item - e.g., Fix noindex on main pages]
- [ ] [Action item - e.g., Install SSL certificate]

### High Priority (Ranking Impact)

- [ ] [Action item - e.g., Optimize LCP to <2.5s]
- [ ] [Action item - e.g., Implement canonical tags]

### Medium Priority (Incremental Gains)

- [ ] [Action item - e.g., Add FAQ schema for snippet optimization]
- [ ] [Action item - e.g., Compress images to WebP format]

### Low Priority (Nice-to-Have)

- [ ] [Action item - e.g., Implement breadcrumb schema]
- [ ] [Action item - e.g., Add social meta tags (OG, Twitter)]

## Tools & Resources

- **Crawl Testing**: Screaming Frog, Google Search Console
- **Page Speed**: PageSpeed Insights, WebPageTest, Lighthouse
- **Structured Data**: Google Rich Results Test, Schema.org validator
- **Mobile**: Google Mobile-Friendly Test
- **Security**: SSL Labs, Why No Padlock

## Recommendations Summary

1. [Top recommendation - usually critical issue]
2. [Second priority]
3. [Third priority]

**Timeline**: Address critical items before launch, high-priority within 1 month, medium within 3 months.
```

### Quality Checks

- [ ] All 7 audit categories completed (crawlability, indexability, speed, mobile, structured data, HTTPS, i18n if applicable)
- [ ] Issues prioritized by severity (Critical, High, Medium, Low)
- [ ] Actionable recommendations provided for each issue
- [ ] Core Web Vitals benchmarked against targets
- [ ] Structured data recommendations tied to content strategy (Phase 2 clusters)
- [ ] Launch-blocker issues clearly flagged
- [ ] Relevant tools and documentation linked

## Phase 5: Snippet Optimization

Optimize content to capture featured snippets, People Also Ask boxes, and other SERP features. Builds on Phase 3 SERP briefs and Phase 4 tech audit.

### Workflow

1. **Feature opportunity identification**:
   - Review Phase 3 SERP briefs for keywords with featured snippets, PAA, or other rich results
   - Prioritize based on keyword value and existing content readiness

2. **Snippet type analysis per keyword**:
   - **Paragraph snippets**: 40-60 word answers, definition style
   - **List snippets**: Numbered or bulleted lists (steps, tips, items)
   - **Table snippets**: Comparison tables, data tables
   - **Video snippets**: Timestamps, transcripts

3. **Content structure recommendations**:
   - Where to place snippet-optimized content in the page (usually near top, after intro)
   - HTML structure (e.g., `<h2>` for question, `<p>` for concise answer, `<ol>` for steps)

4. **Schema markup alignment**:
   - FAQ schema for PAA targeting
   - HowTo schema for step-by-step guides
   - Product schema for e-commerce featured snippets

5. **Per-keyword optimization plan**:
   - Target SERP feature(s)
   - Content adjustments needed
   - Schema to implement
   - Success metrics

### Output Template

```markdown
# Snippet Optimization Plan: <BUSINESS_NAME>

**Generated**: YYYY-MM-DD
**Source**: serp-briefs-<BIZ>.md (YYYY-MM-DD), tech-audit-<BIZ>.md (YYYY-MM-DD)
**Keywords Targeted**: <COUNT>

## Executive Summary

**Featured Snippet Opportunities**: [Count] keywords with active snippets we can target
**PAA Opportunities**: [Count] keywords with People Also Ask boxes
**Other SERP Features**: [Video carousels, local packs, etc.]

[2-3 sentences: Overall snippet landscape, quick wins, expected impact]

## Snippet Opportunities by Type

### Featured Snippet Targets

| Keyword | Current Snippet Holder | Snippet Type | Our Readiness | Priority |
|---------|------------------------|--------------|---------------|----------|
| [kw]    | [competitor domain]    | Paragraph    | [Red/Yellow/Green] | [1-5] |

### People Also Ask Targets

| Primary Keyword | PAA Questions (count) | Our Content Coverage | Priority |
|-----------------|----------------------|----------------------|----------|
| [kw]            | [X] questions        | [X/Y covered]        | [1-5]    |

---

## Optimization Plans

### Keyword 1: [Keyword]

**Target URL**: [/path/to/page]
**Current SERP Position**: [#X or "Not ranking"]
**Current Snippet Holder**: [Domain or "No snippet"]

#### SERP Feature Analysis

**Featured Snippet**:
- Type: [Paragraph / List / Table / Video]
- Current content: [Brief description of what competitor snippet shows]
- Length: [word count if paragraph, item count if list]

**People Also Ask**:
1. [Question 1]
2. [Question 2]
3. [Question 3]

**Other Features**:
- [e.g., Video carousel present - consider creating video]

#### Optimization Strategy

**Content Structure**:
```
[H2 tag]: [Question or topic - match user query phrasing]

[Concise answer paragraph - 40-60 words, definition style]

[Deeper explanation - expand on answer]

[H3]: [Related subtopic]
...

[H2]: Frequently Asked Questions
[Target PAA questions here]
```

**Snippet-Optimized Text** (to insert in page):

> **[Question as H2]?**
>
> [Concise 40-60 word answer. Use clear, simple language. Define terms. Match search intent exactly. This is the snippet target.]
>
> [Follow with deeper explanation, examples, data, etc.]

**For List Snippets**:
```markdown
## [Question as H2]?

1. [Step/Item 1 - concise, actionable]
2. [Step/Item 2]
3. [Step/Item 3]
[Continue - aim for 5-10 items]
```

**For Table Snippets**:
```markdown
## [Question as H2]?

| [Column 1] | [Column 2] | [Column 3] |
|------------|------------|------------|
| [Data]     | [Data]     | [Data]     |
```

**Schema Markup**:
```json
// Implement FAQ schema for PAA targeting
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "[PAA Question 1]",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[Concise answer - same text as on-page FAQ]"
      }
    }
  ]
}
```

[Or HowTo schema for step-by-step guides, Product schema for e-commerce, etc.]

**Implementation Checklist**:
- [ ] Add snippet-optimized content to page (specific location: [before/after section X])
- [ ] Structure with appropriate heading hierarchy (H2 for question, H3 for subtopics)
- [ ] Add FAQ section targeting PAA questions
- [ ] Implement FAQ schema markup
- [ ] Validate schema with Google Rich Results Test
- [ ] Add images/tables/lists if SERP analysis shows they increase snippet chances
- [ ] Keep answer concise and front-loaded (answer in first 40-60 words)

**Success Metrics**:
- [ ] Capture featured snippet within 3 months (if ranking top 10)
- [ ] Appear in PAA box for [X] related queries
- [ ] Increase CTR by [X]% (snippet presence typically boosts CTR)

---

[Repeat for each priority keyword]

## Cross-Cutting Recommendations

### Content Patterns for Snippet Success

1. **Answer-first structure**: Put concise answer immediately after heading, then expand
2. **Match query phrasing**: Use exact question phrasing from searches in H2 tags
3. **Use simple language**: Avoid jargon in snippet-target text (can use jargon in expanded explanation)
4. **Lists and tables**: When SERP shows list/table snippets, structure content accordingly
5. **Definitions**: For "what is" queries, lead with clear definition

### Schema Markup Priority

1. **FAQ schema**: Implement on all pages with FAQ sections (targets PAA)
2. **HowTo schema**: Implement on all step-by-step guides
3. **Article schema**: Implement on all blog posts/guides
4. **Product schema**: If e-commerce, implement on all product pages

### Monitoring and Iteration

- **Track weekly**: Featured snippet captures via Google Search Console (Performance > Search Appearance)
- **Update quarterly**: Revisit snippet optimization as SERPs evolve (snippets change frequently)
- **Expand PAA coverage**: As you rank for primary keyword, target related PAA questions with new content

## Technical Prerequisites (from Phase 4 Audit)

[Reference any tech audit items that must be complete before snippet optimization, e.g.:]
- [ ] Structured data validation passing
- [ ] Page speed optimized (fast pages more likely to get snippets)
- [ ] Mobile-friendly (Google uses mobile-first indexing)

## Production Handoff

- Optimization plans ready for content team or lp-content/draft-marketing skill
- Schema markup ready for engineering implementation
- Track snippet wins in monthly SEO reporting
```

### Quality Checks

- [ ] 5-10 snippet optimization plans created for highest-value keywords
- [ ] Each plan specifies exact content structure and placement
- [ ] Snippet-optimized text drafted (ready to insert into pages)
- [ ] Schema markup specified with code examples
- [ ] Implementation checklists actionable for content and engineering teams
- [ ] PAA questions identified and FAQ sections planned
- [ ] Success metrics defined (snippet capture, CTR improvement)
- [ ] Plans tied to existing or planned content from Phase 3 briefs

## Overall Quality Checks (All Phases)

When running `/lp-seo all`, verify these cross-phase quality gates:

- [ ] **Phase continuity**: Each phase builds on previous outputs (keywords → clusters → briefs → tech audit → snippet optimization)
- [ ] **Business alignment**: All recommendations tie back to positioning and value prop from lp-offer
- [ ] **Actionability**: Every artifact includes clear next steps, not just analysis
- [ ] **Prioritization**: Quick wins and strategic bets clearly flagged throughout
- [ ] **Realism**: Recommendations match business resources and timeline (don't recommend 100-page content plan for 2-person startup)
- [ ] **Measurement**: Success metrics defined at each phase
- [ ] **Integration**: References to upstream (lp-offer, lp-channels) and downstream (lp-content, lp-launch-qa) skills

## Red Flags

Stop and escalate to user if you encounter:

- **No organic search in channel strategy**: If lp-channels didn't prioritize organic, confirm with user before proceeding (SEO may be premature)
- **Keyword universe under 30 keywords**: Indicates insufficient research or overly narrow business focus
- **All keywords high-difficulty**: Suggests need for longer-term strategy or pivot to less competitive angles
- **Tech audit reveals launch blockers**: Critical issues (e.g., site not indexable) must be fixed before content strategy makes sense
- **Business positioning unclear**: If lp-offer artifacts missing or vague, keyword research will lack direction
- **Resource constraints**: If business has no content team or budget, recommend starting with 1-2 clusters max (don't over-plan)

## Integration with Startup Loop

### Upstream Dependencies

- **lp-offer (S2B)**: Provides positioning, value prop, target customer language for keyword research
- **lp-channels (S6B)**: Confirms organic search as prioritized channel (if not, SEO may be premature)

### Downstream Consumers

- **lp-content/draft-marketing**: Uses SERP briefs (Phase 3) to create SEO-optimized content
- **lp-launch-qa**: Uses tech audit checklist (Phase 4) to verify SEO readiness before launch
- **lp-metrics**: SEO success metrics feed into OKR tracking (organic traffic, keyword rankings, snippet captures)

### Phase Sequencing

- **Typical flow**: Run `/lp-seo all` after lp-channels confirms organic as a priority channel
- **Iterative usage**: Re-run individual phases quarterly (keyword universe expands, SERPs evolve, tech audit for new features)
- **Content production**: After Phase 3 SERP briefs complete, loop into lp-content/draft-marketing for article creation, then return to Phase 5 snippet optimization after content published

---

**Version**: 1.0
**Last Updated**: 2026-02-13
**Skill Type**: Research + Strategy
**Output Format**: Markdown artifacts with tables, checklists, code examples
