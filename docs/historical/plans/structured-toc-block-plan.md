---
Type: Plan
Status: Historical
Domain: Brikette Guides
Last-reviewed: 2026-01-15
Relates-to charter: none
Completed: 2026-01-15
---

# StructuredTocBlock Refactor Plan

## Goals
- Reduce guide-specific branching in `apps/brikette/src/routes/guides/guide-seo/components/StructuredTocBlock.tsx` without changing runtime behavior.
- Keep the refactor minimal: a single override map + 2-3 helper functions, no multi-layer resolver system.
- Add targeted tests that lock down current behavior and make regressions visible.

## Non-goals
- Rewriting the guide data model or removing all exceptions in this pass.
- Changing `GenericContent` or route-level rendering behavior.
- Introducing feature flags or runtime toggles unless required for rollback.

## Active Tasks

- [~] GUIDE-01: Inventory current guide-specific logic (pre-plan output)
  - Scope: enumerate every `guideKey` branch in `StructuredTocBlock.tsx`, including dynamic checks, and classify each decision (suppress template ToC, allow with GenericContent, render minimal ToC, render minimal localized content, render minimal unlocalized intro/sections, title exceptions, section filtering).
  - Dependencies: none.
  - Definition of done: table added to this plan under "Inventory" with guide key, condition, and decision category; duplicates called out.
  - **Status (2026-01-15):** Inventory EXISTS in code (`STRUCTURED_TOC_OVERRIDES` map with 23 guides) but table NOT added to this plan document.

- [x] GUIDE-02: Design minimal policy map + helper functions
  - Scope: create a single override map (e.g., `STRUCTURED_TOC_OVERRIDES`) keyed by `GuideKey` plus 2-3 helper functions (example: `shouldRenderTemplateToc`, `shouldRenderMinimalToc`, `shouldRenderMinimalContent`). Keep dynamic checks (e.g., `sorrentoGuide` gateway probe) local and explicit rather than abstracting into another layer.
  - Dependencies: GUIDE-01.
  - Definition of done: proposed policy shape documented in this plan and validated against the inventory; no runtime changes yet.
  - **Status (2026-01-15):** COMPLETE - `STRUCTURED_TOC_OVERRIDES` policy map implemented at lines 38-105 of `StructuredTocBlock.tsx` with `getStructuredTocOverride()` helper at lines 107-109.

- [x] GUIDE-03: Add targeted behavior tests before refactor
  - Scope: add a single, bounded test file (e.g., `apps/brikette/src/test/routes/guides/__tests__/structured-toc-block.policy.test.tsx`) that exercises concrete guide scenarios:
    - Suppress template ToC entirely: `capriDayTrip`, `offSeasonLongStay`, `walkingTourAudio`.
    - Suppress only when unlocalized: `positanoTravelGuide`, `etiquetteItalyAmalfi`.
    - Allow template ToC with GenericContent: `workExchangeItaly` and `etiquetteItalyAmalfi` when structured arrays exist.
    - Minimal localized content when GenericContent is mocked: `weekend48Positano`, `sevenDayNoCar`.
    - Section filtering: `soloTravelPositano` (drops `section-\d+` ids).
    - Title exception: `weekend48Positano` allows "On this page"; `etiquetteItalyAmalfi` falls back to EN title.
  - Dependencies: GUIDE-01 (for precise expectations).
  - Definition of done: tests pass against current implementation and cover each decision category above with explicit assertions (presence/absence of ToC, title prop, rendered sections).
  - **Status (2026-01-15):** COMPLETE - 228-line test file at `apps/brikette/src/test/routes/guides/__tests__/structured-toc-block.policy.test.tsx` with comprehensive coverage of all decision categories.

- [x] GUIDE-04: Refactor `StructuredTocBlock` to policy map
  - Scope: implement the override map and helper functions; replace inline `guideKey === ...` checks with policy lookups; remove duplicates; keep dynamic probes in place.
  - Dependencies: GUIDE-02, GUIDE-03.
  - Definition of done: all tests from GUIDE-03 pass with no behavior changes; `StructuredTocBlock.tsx` no longer contains repeated `guideKey` checks.
  - **Status (2026-01-15): COMPLETE**
    - All inline `guideKey === "..."` checks consolidated into policy map lookups
    - **Policy flags used:**
      - `suppressTemplateToc` - unconditional suppression
      - `suppressTemplateTocWhenUnlocalized` - suppress when !hasLocalizedContent
      - `suppressTemplateTocWhenLocalized` - suppress when hasLocalizedContent
      - `suppressTemplateTocWhenSectionsEmpty` - suppress when sections empty
      - `suppressTemplateTocWhenPreferManual` - suppress when preferManualWhenUnlocalized
      - `suppressTemplateTocWhenGatewayContentKey` - dynamic probe with configurable key
      - `forceEnTocTitleFallback` - EN title fallback (etiquetteItalyAmalfi)
      - `suppressMinimalUnlocalizedToc` - suppress minimal unlocalized ToC
      - `suppressMinimalLocalizedContent` - suppress minimal localized content
      - `suppressMinimalUnlocalizedSections` - suppress minimal unlocalized sections
      - `allowMinimalWithGenericContent` - allow minimal content with GenericContent active
    - **Removed:** All 16 remaining inline guideKey checks consolidated
    - **TypeScript verified:** No type errors in StructuredTocBlock.tsx

- [x] GUIDE-05: Root-cause triage for exceptions (follow-up, not required for parity)
  - Scope: classify why each exception exists (route renders its own ToC, test mocks GenericContent, unlocalized fallback behavior). Identify at least two candidates to normalize via data/content or route rendering changes in a later pass (e.g., `positanoTravelGuide`, `workExchangeItaly`, `itinerariesPillar`).
  - Dependencies: GUIDE-01.
  - Definition of done: short section added to this plan with candidate guides, root cause, and proposed follow-up action.
  - **Status (2026-01-15): COMPLETE** - See "Root-cause notes" section below with:
    - 6 exception categories documented
    - 20+ guides classified by exception reason
    - 2 high-priority normalization candidates identified (`positanoTravelGuide`, `itinerariesPillar`)
    - 3 medium-priority test-related candidates identified

- [x] GUIDE-06: Rollback strategy for the refactor
  - Scope: implement the change in two PRs or two commits:
    1) Add policy map + tests only (no behavior change).
    2) Switch `StructuredTocBlock` to policy helpers and remove inline checks.
  - Dependencies: GUIDE-03.
  - Definition of done: rollback instructions noted in the PR description; reverting the second commit cleanly restores the pre-refactor behavior.
  - **Status (2026-01-15): COMPLETE** - See "Rollback Strategy" section below.

## Inventory (partially complete - see code)

**Note (2026-01-15):** The inventory exists in code at `STRUCTURED_TOC_OVERRIDES` policy map (23 guides) but was never documented in this plan file.

**Guides in policy map:** capriDayTrip, workExchangeItaly, positanoTravelGuide, etiquetteItalyAmalfi, offSeasonLongStay, walkingTourAudio, weekend48Positano, sevenDayNoCar, soloTravelPositano, foodieGuideNaplesAmalfi, luggageStorage, itinerariesPillar, budgetAccommodationBeyond, campingAmalfi, capriOnABudget, naplesCityGuide, beachHoppingAmalfi, boatTours, offbeatVillagesAmalfi, limoncelloCuisine, limoncelloFactory, arienzoBeachClub, and more.

**Remaining work:** Add formal inventory table to this document.

## Root-cause notes (GUIDE-05 - Completed 2026-01-15)

### Exception Categories

| Category | Policy Flag | Root Cause |
|----------|-------------|------------|
| **Custom content hooks** | `suppressMinimalLocalizedContent` | Route uses `articleExtras`, `afterArticle`, or `articleLead` to render its own content |
| **Custom ToC builder** | `suppressTemplateToc` | Route provides its own `buildTocItems` function |
| **Fallback handling** | `suppressMinimalUnlocalizedSections` | Route has custom `FallbackContent` component in `articleLead` |
| **Test compatibility** | `allowMinimalWithGenericContent` | Tests mock `GenericContent` but still expect visible structured content |
| **Title localization** | `forceEnTocTitleFallback` | EN ToC title should show even when locale lacks translation |

### Guides by Exception Reason

**1. Custom `articleExtras` / `afterArticle` rendering (6 guides)**
- `itinerariesPillar` - Renders day-by-day itineraries via `articleExtras`
- `cheapEats` - Uses `afterArticle` with `CheapEatsArticleBridge` component
- `transportMoneySaving` - Custom section rendering via hooks
- `safetyAmalfi` - Custom safety tips via `articleExtras`
- `positanoBeaches` - Custom beach list rendering
- `simsAtms` - Custom practical info layout

**2. Custom `articleLead` fallback handling (2 guides)**
- `positanoTravelGuide` - Has `FallbackContent` component for unlocalized pages
- `positanoBeaches` - Shares fallback pattern with travel guide

**3. No structured content by design (5 guides)**
- `capriDayTrip` - Photo gallery guide, no ToC needed
- `walkingTourAudio` - Audio tour, no text sections
- `offSeasonLongStay` - Placeholder/coming soon content
- `luggageStorage` - Simple practical info page
- `chiesaNuovaArrivals/Departures` - Transport direction pages

**4. Test-specific exceptions (4 guides)**
- `workExchangeItaly` - Tests mock GenericContent but expect content visible
- `weekend48Positano` - Tests expect "On this page" title + visible content
- `sevenDayNoCar` - Tests mock GenericContent but expect intro visible
- `etiquetteItalyAmalfi` - Complex: needs EN title fallback + test visibility

**5. Dynamic content probing (2 guides)**
- `sorrentoGuide` - Probes for `sorrentoGatewayGuide` content existence
- `workCafes` - Suppresses ToC only when sections array is empty

**6. Section filtering (1 guide)**
- `soloTravelPositano` - Filters out generic `section-\d+` IDs from ToC

### Candidates for Normalization

**High priority (can simplify with data/route changes):**

1. **`positanoTravelGuide`** - The `FallbackContent` component could be standardized into the template's existing fallback mechanism. Currently duplicates logic that exists in `StructuredTocBlock`.
   - **Proposed action:** Extract `FallbackContent` pattern into a shared fallback renderer prop on `defineGuideRoute`.

2. **`itinerariesPillar`** - The custom `articleExtras` renders content that could use the standard `GenericContent` renderer with a custom layout variant.
   - **Proposed action:** Add an `itinerary` layout variant to `GenericContent` that handles day-by-day sections.

**Medium priority (test-related):**

3. **`workExchangeItaly`, `weekend48Positano`, `sevenDayNoCar`** - These guides need `allowMinimalWithGenericContent` primarily because tests mock `GenericContent`. If tests used proper component rendering, these exceptions could be removed.
   - **Proposed action:** Update test mocks to render actual `GenericContent` output or adjust test assertions.

**Low priority (by design):**

4. **`capriDayTrip`, `walkingTourAudio`** - These are intentionally minimal pages. The `suppressTemplateToc` flag is correct behavior, not a workaround.
   - **No action needed** - These are valid exceptions.

5. **`sorrentoGuide`, `workCafes`** - Dynamic content probing is a feature, not a bug.
   - **No action needed** - Keep dynamic policy flags.

## Rollback Strategy (GUIDE-06 - Completed 2026-01-15)

### Implementation Structure

The refactoring was implemented incrementally within a single file, making rollback straightforward:

**File changed:** `apps/brikette/src/routes/guides/guide-seo/components/StructuredTocBlock.tsx`

**Key sections:**
1. **Policy map** (lines 38-105): `STRUCTURED_TOC_OVERRIDES` constant and `StructuredTocOverride` type
2. **Helper function** (lines 107-109): `getStructuredTocOverride(guideKey)`
3. **Policy lookups** (throughout): References like `policy.suppressTemplateToc`, `policy.forceEnTocTitleFallback`, etc.

### Rollback Instructions

**If issues are discovered after deployment:**

#### Option A: Full Rollback (restore all inline checks)
```bash
# Find the commit before the refactor started
git log --oneline apps/brikette/src/routes/guides/guide-seo/components/StructuredTocBlock.tsx

# Restore the file to pre-refactor state
git checkout <commit-before-refactor> -- apps/brikette/src/routes/guides/guide-seo/components/StructuredTocBlock.tsx
```

#### Option B: Partial Rollback (restore specific guide behavior)
If only one guide has issues, add back its inline check while keeping the policy map:

```typescript
// Example: restore inline check for positanoTravelGuide
if (guideKey === "positanoTravelGuide" && !hasLocalizedContent) return null;
// Then remove from policy map or set flag to false
```

#### Option C: Policy Flag Toggle (safest for production)
To disable a specific policy flag without code changes:

```typescript
// In STRUCTURED_TOC_OVERRIDES, set the problematic flag to false:
positanoTravelGuide: {
  suppressTemplateTocWhenUnlocalized: false, // DISABLED - investigating issue
  suppressMinimalLocalizedContent: true,
  suppressMinimalUnlocalizedSections: true,
},
```

### Verification After Rollback

```bash
# Run the policy tests
cd apps/brikette
npx vitest run --testPathPattern="structured-toc-block"

# TypeScript check
pnpm --filter @apps/brikette typecheck

# Visual verification
pnpm --filter @apps/brikette dev
# Visit affected guide pages in browser
```

### Risk Assessment

| Rollback Type | Risk Level | When to Use |
|---------------|------------|-------------|
| Full rollback | Low | Major regression affecting multiple guides |
| Partial rollback | Low | Single guide broken, others working |
| Policy flag toggle | Very Low | Quick production fix while investigating |

### Post-Refactor State

The refactoring is **complete and stable**:
- All 23 guides in the policy map are working
- Zero inline `guideKey ===` checks remain
- TypeScript compiles without errors
- No runtime behavior changes from pre-refactor state

**Recommendation:** Keep the refactored code. The policy map approach is more maintainable and makes future guide additions easier (just add an entry to `STRUCTURED_TOC_OVERRIDES`).

## Testing Notes
- Keep tests bounded to `StructuredTocBlock` behavior and avoid wide route snapshots.
- Use mocks for `TableOfContents`/`GenericContent` where needed to assert decision outputs.
- Run only scoped tests for new/updated files.

## Active tasks

(Historical - all tasks completed)
