# Phase 5: Snippet Optimization

**Loads**: `phase-base-contract.md` (output location, common inputs, inter-phase handoff, quality requirements)
**Prerequisites**: Phase 3 serp-briefs + Phase 4 tech-audit
**Output**: `docs/business-os/strategy/<BIZ>/seo/<YYYY-MM-DD>-snippet-optimization-<BIZ>.user.md`

Optimize content to capture featured snippets, People Also Ask boxes, and other SERP features. Builds on Phase 3 SERP briefs and Phase 4 tech audit.

## Workflow

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

## Output Template

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

#### Optimization Strategy

**Snippet-Optimized Text** (to insert in page):

> **[Question as H2]?**
>
> [Concise 40-60 word answer. Use clear, simple language. Define terms. Match search intent exactly.]
>
> [Follow with deeper explanation, examples, data, etc.]

**For List Snippets**:
```markdown
## [Question as H2]?

1. [Step/Item 1 - concise, actionable]
2. [Step/Item 2]
3. [Step/Item 3]
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

**Implementation Checklist**:
- [ ] Add snippet-optimized content to page (specific location: [before/after section X])
- [ ] Structure with appropriate heading hierarchy (H2 for question, H3 for subtopics)
- [ ] Add FAQ section targeting PAA questions
- [ ] Implement FAQ schema markup
- [ ] Validate schema with Google Rich Results Test
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
3. **Use simple language**: Avoid jargon in snippet-target text
4. **Lists and tables**: When SERP shows list/table snippets, structure content accordingly
5. **Definitions**: For "what is" queries, lead with clear definition

### Schema Markup Priority

1. **FAQ schema**: Implement on all pages with FAQ sections (targets PAA)
2. **HowTo schema**: Implement on all step-by-step guides
3. **Article schema**: Implement on all blog posts/guides
4. **Product schema**: If e-commerce, implement on all product pages

### Monitoring and Iteration

- **Track weekly**: Featured snippet captures via Google Search Console (Performance > Search Appearance)
- **Update quarterly**: Revisit snippet optimization as SERPs evolve
- **Expand PAA coverage**: As you rank for primary keyword, target related PAA questions with new content

## Technical Prerequisites (from Phase 4 Audit)

- [ ] Structured data validation passing
- [ ] Page speed optimized (fast pages more likely to get snippets)
- [ ] Mobile-friendly (Google uses mobile-first indexing)
```

## Quality Checks

- [ ] 5-10 snippet optimization plans created for highest-value keywords
- [ ] Each plan specifies exact content structure and placement
- [ ] Snippet-optimized text drafted (ready to insert into pages)
- [ ] Schema markup specified with code examples
- [ ] Implementation checklists actionable for content and engineering teams
- [ ] PAA questions identified and FAQ sections planned
- [ ] Success metrics defined (snippet capture, CTR improvement)
- [ ] Plans tied to existing or planned content from Phase 3 briefs
