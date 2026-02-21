# Phase 1: Keyword Universe

**Loads**: `phase-base-contract.md` (output location, common inputs, inter-phase handoff, quality requirements)
**Prerequisites**: lp-offer + lp-channels artifacts
**Output**: `docs/business-os/strategy/<BIZ>/seo/<YYYY-MM-DD>-keyword-universe-<BIZ>.user.md`

Build a comprehensive keyword inventory across all customer journey stages.

## Workflow

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

## Output Template

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

## Quality Checks

- [ ] At least 50 keywords across all journey stages
- [ ] Keywords span awareness, consideration, and decision stages
- [ ] Difficulty levels assessed for top opportunities
- [ ] Quick wins identified (low-hanging fruit)
- [ ] Keywords align with business positioning and value prop
- [ ] Search intent documented for each keyword (informational, navigational, commercial, transactional)
