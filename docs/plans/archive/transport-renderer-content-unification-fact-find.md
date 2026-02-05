---
Type: Fact-Find Brief
Status: Historical
Domain: CMS / UI
Relates-to: transport-renderer-content-unification-plan.md
Created: 2026-01-27
Last-reviewed: 2026-01-27
Intent: Planning (Outcome A - feeds into /plan-feature)
User Priorities: Long-term maintainability, Feature parity, Risk minimization
---

# Transport Renderer Content Unification — Fact-Find Brief

## Executive Summary

This fact-find investigates the three options proposed in `transport-renderer-content-unification-plan.md` for migrating transport routes from `HowToGetHereContent` to a unified guide system. Based on codebase analysis, **Option A (Adapt to GuideSeoTemplate)** is the recommended approach, with Option C (Hybrid Wrapper) as a viable transitional step if risk concerns warrant it.

## Research Scope

Three parallel investigations were conducted:

1. **GuideSeoTemplate block system extensibility** — Can it accommodate transport-specific features?
2. **HowToGetHereContent unique features** — What must be preserved during migration?
3. **Content schema differences** — How much transformation is required?

---

## Finding 1: Block System Architecture

### Current State

The `GuideSeoTemplate` block system is well-architected for extensibility:

| Aspect | Details |
|--------|---------|
| **Block types** | 12 types: `hero`, `genericContent`, `faq`, `gallery`, `serviceSchema`, `breadcrumbs`, `relatedGuides`, `alsoHelpful`, `planChoice`, `transportNotice`, `jsonLd`, `custom` |
| **Schema** | Zod discriminated union (`BlockSchema`) in `blocks/types.ts` |
| **Rendering** | `composeBlocks.tsx` dispatches to slot-based handlers |
| **State management** | `BlockAccumulator` pattern for cross-block coordination |
| **Extensibility** | Moderate-to-high — new block types require schema extension + handler |

### Key Files

- [blocks/types.ts](apps/brikette/src/routes/guides/blocks/types.ts) — Block schema definitions
- [composeBlocks.tsx](apps/brikette/src/routes/guides/blocks/composeBlocks.tsx) — Block composition engine
- [handlers/BlockAccumulator.ts](apps/brikette/src/routes/guides/blocks/handlers/BlockAccumulator.ts) — State management

### Assessment for Option A

The block system **can** accommodate transport-specific features:

| Transport Feature | Block System Approach | Effort |
|-------------------|----------------------|--------|
| Galleries | Existing `gallery` block (already exists) | S — verify compatibility |
| Callouts (tip/cta/aside) | New `callout` block type | M — schema + handler |
| Chiesa Nuova drop-in | New `chiesaNuovaDropIn` block or `custom` block | M — extract to component |
| Link bindings | Extend `genericContent` or add to callout | S — utility function |

**Confidence input:** Block system extensibility is **high confidence (85%)** for adding transport features.

---

## Finding 2: HowToGetHereContent Feature Inventory

### Current State

The transport route rendering pipeline is substantial:

| Metric | Value |
|--------|-------|
| **Total lines** | ~1,100 (main component + helpers) |
| **Main component** | `HowToGetHereContent.tsx` (241 lines) |
| **Section rendering** | `sections.tsx` (~350 lines) |
| **Galleries** | `_galleries.tsx` (~150 lines) |
| **Callouts** | `callouts.ts` (~50 lines) |
| **Chiesa Nuova** | `DropIn.tsx` (~300 lines) |

### Unique Features Requiring Preservation

1. **Recursive section rendering** — Sections can nest arbitrarily via `ContentSection` recursive component
2. **Inline galleries** — Zoomable image arrays with dialog modal, tied to section context
3. **Callout system** — Three types (`tip`, `cta`, `aside`) with distinct styling
4. **Link binding system** — 5 target types:
   - `external` → full URL
   - `howToOverview` → how-to-get-here index
   - `directions` → Google Maps
   - `guide` → guide page
   - `guidesSlug` → experiences index
5. **Chiesa Nuova drop-in** — Embedded guide component shown for specific bus routes
6. **Section extraction** — Utility to pull specific section by path from content tree

### Assessment for Migration

| Feature | Migration Complexity | Risk |
|---------|---------------------|------|
| Recursive sections | Medium — guide `genericContent` is simpler | Medium |
| Inline galleries | Low — existing gallery block may work | Low |
| Callouts | Low — straightforward block addition | Low |
| Link bindings | Low — extract to shared utility | Low |
| Chiesa Nuova | Medium — needs careful extraction | Medium |
| Section extraction | Low — utility can be reused | Low |

**Confidence input:** Feature parity is achievable at **moderate confidence (75%)** — the recursive section rendering is the main concern.

---

## Finding 3: Content Schema Differences

### Current State

Significant structural differences exist between route content JSON and guide content JSON:

#### Route Content Structure (object-based)
```json
{
  "meta": { "title": "...", "description": "..." },
  "hero": { "eyebrow": "...", "title": "...", "description": "..." },
  "sections": {
    "overview": { "title": "...", "body": "..." },
    "steps": { "title": "...", "steps": [...] },
    "gallery": { "title": "...", "images": [...] }
  },
  "tip": { ... },
  "cta": { ... }
}
```

#### Guide Content Structure (array-based)
```json
{
  "seo": { "title": "...", "description": "..." },
  "sections": [
    { "id": "overview", "title": "...", "body": [...] },
    { "id": "steps", "title": "...", "body": [...] }
  ],
  "faqs": [...],
  "howToSteps": [...]
}
```

### Key Differences

| Aspect | Route JSON | Guide JSON |
|--------|-----------|------------|
| Sections | Object with named keys | Array with `id` property |
| Body content | String or mixed object | Array of text/link objects |
| Callouts | Top-level (`tip`, `cta`) | Not present (would be blocks) |
| Steps | Nested in section | Top-level `howToSteps` |
| SEO | `meta` object | `seo` object |

### Transformation Assessment

Two migration strategies are possible:

**Strategy A: Content Transformation**
- Write a one-time migration script to transform route JSON → guide JSON
- Pros: Clean architecture, single content format going forward
- Cons: ~24 routes × ~20 locales = ~480 files to transform
- Effort: M (automated script + manual verification)

**Strategy B: Hybrid Schema**
- Extend guide content parsing to accept route schema natively
- Pros: No content migration required
- Cons: Dual schemas increase complexity, testing burden
- Effort: M (schema adaptation + dual-path rendering)

**Recommendation:** Strategy A (Content Transformation) aligns better with long-term maintainability.

**Confidence input:** Content transformation is achievable at **high confidence (80%)** with automated tooling.

---

## Option Analysis (with Confidence Scores)

### Option A: Adapt Transport Routes to GuideSeoTemplate

| Dimension | Score | Evidence |
|-----------|-------|----------|
| **Implementation** | 80% | Block system is extensible; recursive sections need care |
| **Approach** | 85% | Clear architecture; established patterns to follow |
| **Impact** | 85% | URLs stable; incremental migration possible |
| **Overall** | 80% | min(80, 85, 85) = 80% |

**Effort:** L (Large)
- Block development: 3 new blocks (~2-3 days)
- Content transformation: Script + verification (~2-3 days)
- Pilot migration: 1-2 routes (~1 day)
- Batch migration: Remaining routes (~3-5 days)
- Cleanup: Remove deprecated code (~1 day)

**Pros (evidence-based):**
- Single rendering pipeline (finding 1: block system is well-structured)
- Unlocks ToC, FAQs, related guides (finding 1: existing blocks)
- Manifest-driven structured data works automatically (already implemented in TASK-04)
- Long-term maintainability is maximized

**Cons (evidence-based):**
- Recursive section rendering needs careful mapping (finding 2)
- Content migration is mechanical but tedious (finding 3: ~480 files)
- Chiesa Nuova extraction requires isolation testing (finding 2)

### Option B: Keep HowToGetHereContent, Add Missing Features

| Dimension | Score | Evidence |
|-----------|-------|----------|
| **Implementation** | 75% | Feature backport is non-trivial |
| **Approach** | 60% | Maintains two pipelines indefinitely |
| **Impact** | 70% | Feature drift risk; maintenance burden |
| **Overall** | 60% | min(75, 60, 70) = 60% |

**Effort:** M (Medium)

**Pros:**
- No content migration required
- Lower initial effort

**Cons (evidence-based):**
- Maintains ~1,100 lines of parallel rendering code (finding 2)
- Feature drift risk is ongoing
- Does not benefit from manifest policies (finding 1)
- Contradicts long-term maintainability goal

**Recommendation:** Do not pursue Option B.

### Option C: Hybrid Wrapper

| Dimension | Score | Evidence |
|-----------|-------|----------|
| **Implementation** | 75% | Integration complexity is medium |
| **Approach** | 75% | Transitional; not a permanent solution |
| **Impact** | 80% | Low risk; reversible |
| **Overall** | 75% | min(75, 75, 80) = 75% |

**Effort:** M (Medium)

**Pros (evidence-based):**
- Leverages existing `GuideSeoTemplate` infrastructure immediately
- Transport routes get guide features (ToC, etc.) without content migration
- Content stays in current location initially (finding 3)
- Lower risk transitional step

**Cons (evidence-based):**
- Two content sources to maintain temporarily
- Integration layer adds complexity (finding 1: slot-based rendering)
- Not a permanent architecture

**Recommendation:** Option C is viable as a transitional step if Option A's effort is a concern, but it does not satisfy long-term maintainability as fully.

---

## Recommendation

**Proceed with Option A (Adapt to GuideSeoTemplate)** based on user priorities:

| Priority | Option A | Option B | Option C |
|----------|----------|----------|----------|
| Long-term maintainability | ✅ Best | ❌ Worst | ⚠️ Transitional |
| Feature parity | ✅ Full | ⚠️ Backport | ✅ Full |
| Risk minimization | ⚠️ Medium (mitigated by incremental approach) | ⚠️ Low | ✅ Low |

Option A scores highest on the user's top two priorities (maintainability, feature parity). The medium risk is mitigated by:

1. **Incremental migration** — One route at a time
2. **Pilot validation** — Verify approach on simple route first
3. **Rollback capability** — Keep deprecated code until cleanup phase
4. **Automated content transformation** — Reduces human error

---

## Planning Handoff Artifacts

### Confidence Inputs for TASK-01 (DECISION)

```markdown
| Option | Overall CI | Recommendation |
|--------|-----------|----------------|
| A | 80% | Proceed — best long-term architecture |
| B | 60% | Reject — contradicts maintainability goal |
| C | 75% | Viable transitional step if A's effort is prohibitive |
```

### Updated Task Confidence Scores

| Task ID | Type | Description | CI | Notes |
|---------|------|-------------|---:|-------|
| TASK-01 | DECISION | Choose migration approach | - | Recommended: Option A |
| TASK-02 | IMPLEMENT | Create galleryBlock | 85% | Existing gallery block may suffice |
| TASK-03 | IMPLEMENT | Create calloutBlock | 85% | Straightforward Zod + handler |
| TASK-04 | IMPLEMENT | Create chiesaNuovaDropInBlock | 75% | Extraction needs isolation testing |
| TASK-05 | DOC | Document content schema mapping | 90% | Mechanical; schemas are understood |
| TASK-06 | IMPLEMENT | Pilot migration: positano-amalfi-bus | 75% | Depends on TASK-02–05 success |
| TASK-07 | IMPLEMENT | Batch migration: remaining routes | 70% | Large effort; scripted transformation |
| TASK-08 | IMPLEMENT | Cleanup: remove deprecated code | 90% | Straightforward after full migration |

### Open Questions Resolved

1. **Gallery images:** Keep in current paths initially; migrate during content transformation.
2. **Content transformation vs. hybrid schema:** Content transformation (Strategy A) recommended for long-term cleanliness.
3. **Priority order for route migration:** By simplicity first (pilot), then by traffic.
4. **Hybrid wrapper as transitional step:** Not required if Option A proceeds; available as fallback.

---

## Next Steps

1. Mark TASK-01 (DECISION) as complete with Option A selected.
2. Update `transport-renderer-content-unification-plan.md` with confidence scores from this brief.
3. Proceed with `/plan-feature` refinement for TASK-02 (galleryBlock) if needed.
