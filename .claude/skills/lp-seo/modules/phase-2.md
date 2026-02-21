# Phase 2: Content Clusters

**Loads**: `phase-base-contract.md` (output location, common inputs, inter-phase handoff, quality requirements)
**Prerequisites**: Phase 1 keyword-universe output
**Output**: `docs/business-os/strategy/<BIZ>/seo/<YYYY-MM-DD>-content-clusters-<BIZ>.user.md`

Group keywords into topical clusters for content strategy and internal linking architecture.

## Workflow

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

## Output Template

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

[Horizontal links between related clusters]

## Content Gap Analysis

[Topics competitors cover that your keyword universe doesn't address]

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

## Quality Checks

- [ ] 3-8 distinct clusters identified
- [ ] Each cluster has a clear pillar topic
- [ ] Keywords grouped by semantic relevance and intent
- [ ] Internal linking strategy documented
- [ ] Content formats matched to user intent
- [ ] Production prioritization aligns with business goals (quick wins + strategic bets)
- [ ] Clusters cover full customer journey (not just top-of-funnel)
