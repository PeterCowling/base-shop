---
Type: Fact-Find
Outcome: Planning
Status: Draft
Domain: CMS / UI / Platform
Created: 2026-01-27
Last-updated: 2026-01-27
Feature-Slug: guide-system-improvements
Related-Plan: docs/plans/guide-system-improvements-plan.md
---

# Guide System Improvements Fact-Find Brief

## Scope

### Summary

Improve the guide system across all dimensions (authoring, performance, SEO, DX, UX, content quality, architecture, operational) with focus on short-term (1-3 months) and medium-term (3-6 months) enhancements. Critical constraint: all improvements must provide migration path for existing 200+ guides across 18 locales.

### Goals

- **Developer Experience**: Reduce friction in creating new guides and block types
- **Content Management**: Improve authoring workflow, validation, and translation management
- **Maintainability**: Reduce cognitive complexity, improve testability, enhance documentation
- **Performance**: Optimize build times and runtime performance
- **Quality**: Enforce content schemas, validate links, improve consistency
- **Extensibility**: Make block system more flexible and reusable

### Non-goals

- CMS integration (long-term, out of scope for this planning cycle)
- Incremental Static Regeneration (requires architectural RFC)
- Complete redesign of guide rendering (maintain current GuideSeoTemplate approach)
- Migration of existing content structure (maintain backward compatibility)

### Constraints & Assumptions

**Constraints:**
- Must provide migration path for 200+ existing guides
- Cannot break existing URLs or SEO
- Must maintain all 18 locale support
- Changes must be backward compatible or provide automated migration
- Short/medium-term focus (1-6 months implementation horizon)

**Assumptions:**
- Git-first content workflow remains (no CMS requirement)
- Current GuideSeoTemplate architecture is sound (refine, don't rebuild)
- Block-based composition is the right pattern
- JSON-based content format is acceptable to content authors

---

## Repo Audit (Current State)

### Entry Points

- **Template**: `apps/brikette/src/routes/guides/_GuideSeoTemplate.tsx` (542 lines) — Main orchestrator for content loading, localization, block composition, SEO generation
- **Manifest**: `apps/brikette/src/routes/guides/guide-manifest.ts` (~1500 lines) — Zod-based manifest with 200+ guide entries
- **Block System**: `apps/brikette/src/routes/guides/blocks/` (11 handler files) — Composable block handlers
- **Route Handlers**:
  - `apps/brikette/src/app/[lang]/assistance/[article]/page.tsx` — Assistance guides
  - `apps/brikette/src/app/[lang]/experiences/[slug]/page.tsx` — Experience guides
  - `apps/brikette/src/app/[lang]/how-to-get-here/[slug]/page.tsx` — Transport guides

### Key Modules / Files

**Core Architecture:**
- `_GuideSeoTemplate.tsx` (542 LOC) — Template orchestrator with 35+ props, complex conditional rendering
- `guide-manifest.ts` (~1500 LOC) — Manifest seed array with inline guide definitions
- `blocks/composeBlocks.tsx` (280 LOC) — Block dispatcher with switch-case for 14 block types
- `blocks/types.ts` (450 LOC) — Zod schemas for all block types
- `guide-diagnostics.ts` (320 LOC) — Content completeness analysis

**Content Management:**
- `locales/*/guides/content/` — 200+ guides × 18 locales = 3,600+ JSON files
- `data/guides.index.ts` — Guide metadata with derived section values
- `locales/guides.imports.ts` — Dynamic locale content imports

**SEO & Metadata:**
- `guide-seo/` (25 subdirectories) — Content detection, metadata resolution, structured data generation
- `components/seo/TravelHelpStructuredData.tsx` — Structured data components
- `utils/seo.ts` — Canonical URLs, hreflang generation

**Testing:**
- `test/routes/guides/` (19 test files) — Manifest tests, block tests, coverage tests
- `test/routes/guides/coverage/` — Per-guide coverage test suites

### Patterns & Conventions Observed

**Block Handler Pattern:**
```typescript
export function applyCalloutBlock(
  acc: BlockAccumulator,
  options: CalloutBlockOptions,
  context: GuideSeoTemplateContext
): void {
  // Translate content using context.translateGuides
  // Render to React node
  // Add to appropriate slot via acc.addSlot("article", node)
}
```

**Manifest Entry Pattern:**
```typescript
GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
  key: "guideKey",
  slug: "guide-slug",
  contentKey: "guideKey",
  status: "published",
  areas: ["experience"],
  primaryArea: "experience",
  structuredData: ["Article", "BreadcrumbList"],
  relatedGuides: [],
  blocks: [
    { type: "genericContent", options: { contentKey: "guideKey", showToc: true } }
  ],
  checklist: [
    { id: "translations", status: "complete" },
    { id: "content", status: "complete" }
  ]
})
```

**Content Structure Pattern:**
```json
{
  "seo": { "title": "...", "description": "..." },
  "intro": { "title": "...", "body": "..." },
  "sections": [
    { "id": "section-id", "title": "...", "body": "...", "list": [...] }
  ],
  "callouts": { "tip": "..." }
}
```

### Data & Contracts

**Types/Schemas:**
- `GuideManifestEntry` (Zod) — Manifest entry shape with key, slug, contentKey, status, areas, blocks, etc.
- `GuideBlockDeclaration` (Zod) — Discriminated union of 14 block types
- `GuideSeoTemplateProps` — 35+ optional props for template configuration
- Content schema uses `passthrough()` — permissive, no shape validation

**Persistence:**
- Static JSON files in `locales/*/guides/content/`
- No database persistence
- Git is source of truth

**API/Event Contracts:**
- i18next for localization with `guides` namespace
- Link tokens: `%URL:target|Label%`, `%LINK:guideKey|Label%`, `%HOWTO:slug|Label%`
- Structured data: HowTo, Article, FAQPage, BreadcrumbList schemas

### Dependency & Impact Map

**Upstream Dependencies:**
- i18next for content translation
- Next.js App Router for static generation
- Zod for schema validation
- React for rendering
- Cloudflare Images for hero/gallery optimization

**Downstream Dependents:**
- 200+ guide pages across 3 areas (experiences, assistance, how-to-get-here)
- 3,600+ static pages (200 guides × 18 locales)
- SEO structured data (HowTo, Article, FAQ schemas)
- Navigation components (breadcrumbs, related guides, also helpful)
- Translation infrastructure (18 locale support)

**Blast Radius:**
- Template changes affect ALL 200+ guides
- Manifest schema changes require validation/migration of all entries
- Block type changes impact guides using that block
- Content schema changes require migration of 3,600+ JSON files

### Tests & Quality Gates

**Existing Tests:**
- 19 test files in `test/routes/guides/`
- Coverage tests for select guides (sunrise-hike, path-of-the-gods, etc.)
- Block handler tests (callout, gallery, transport drop-in)
- Manifest override tests
- Placeholder detection tests

**Gaps:**
- No full pipeline integration tests (manifest → content → rendering)
- Block handlers lack comprehensive unit test coverage
- No snapshot tests for manifest changes
- No automated tests for new block type additions
- Mock i18n setup is complex and scattered across test files

**Commands/Suites:**
- `pnpm --filter @apps/brikette test -- --testPathPattern="guides"`
- `pnpm --filter @apps/brikette test -- --testPathPattern="coverage"`
- `pnpm check-i18n-coverage` (manual script)

### Recent Git History (Targeted)

**Recent work (2026-01-27):**
- Transport renderer unification (24 routes migrated to guide system)
- Guide namespace migration (GuideNamespaceKey type introduced)
- All three areas (experiences, assistance, how-to-get-here) now unified under single guide system
- Legacy HowToGetHereContent renderer removed

**Key commits:**
- Guide block system wiring (TASK-01)
- Callout, gallery zoom, transport drop-in blocks added (TASK-02-04)
- Transport migration tooling built (TASK-06)
- All transport routes migrated (TASK-08a-b)

---

## External Research

No external research required. All recommendations based on codebase evidence and established patterns.

---

## Questions

### Resolved

**Q: Is the guide system currently unified across all three areas?**
- A: Yes. Recent migration (2026-01-27) unified all areas under single guide system.
- Evidence: `app/[lang]/assistance/[article]/page.tsx`, `app/[lang]/experiences/[slug]/page.tsx`, `app/[lang]/how-to-get-here/[slug]/page.tsx` all use `GuideContent → GuideSeoTemplate`

**Q: What's the current manifest size and structure?**
- A: ~1500 lines with inline guide definitions in TypeScript manifestSeed array
- Evidence: `guide-manifest.ts` lines 100-1500

**Q: How are content schemas validated?**
- A: Content uses `passthrough()` — no shape validation. Only manifest has Zod validation.
- Evidence: `routes/guides/guide-seo/content-schema.ts` line 15

**Q: What's the block addition process?**
- A: 6-file edit process (types.ts, handler file, handlers/index.ts, composeBlocks.tsx, plus test)
- Evidence: `blocks/` directory structure, composeBlocks.tsx switch statement

**Q: Are there migration tools for content changes?**
- A: Transport migration tool exists (`scripts/migrate-transport-route.ts`) but is specific to transport routes. No general-purpose content migration tool.
- Evidence: `apps/brikette/scripts/migrate-transport-route.ts`

### Open (User Input Needed)

None. All questions resolved through codebase evidence.

---

## Confidence Inputs (for /plan-feature)

### Implementation: 85%

**Current confidence drivers:**
- Patterns are well-established (block handlers, manifest entries, content structure)
- Type safety via Zod reduces implementation risk
- Testing infrastructure exists (19 test files, coverage tests)
- Recent successful migration (transport routes) validates approach

**Gaps reducing confidence:**
- Template complexity (542 lines, 35+ props) increases change risk
- Content migration automation is unproven (only transport tool exists)
- No comprehensive integration test coverage

**What would raise to 90%+:**
- Refactor template into smaller testable components
- Build general-purpose content migration tooling
- Add integration test suite for full pipeline

### Approach: 80%

**Current confidence drivers:**
- Block-based composition is proven and extensible
- Manifest-driven approach separates content from code
- Zod validation catches errors early
- Clear separation of concerns (content, presentation, routing)

**Gaps reducing confidence:**
- Manifest inflation (1500+ lines) suggests need for better organization
- Content schema permissiveness trades safety for flexibility
- Multiple rendering strategies (fallbacks, overrides) create complexity
- Module resolution patterns (GALLERY_MODULES) are fragile

**What would raise to 90%+:**
- Design manifest template/preset system to reduce boilerplate
- Define strict content schemas with migration path
- Simplify fallback chain with clear error boundaries
- Replace module resolution with TypeScript imports

### Impact: 82%

**Current confidence drivers:**
- Blast radius is well-understood (200+ guides, 3,600+ pages)
- Migration path requirement is clear
- Recent transport migration provides precedent
- Git-based workflow allows incremental changes with review

**Gaps reducing confidence:**
- Large changeset risk (3,600+ JSON files if content schema changes)
- Build time impact unknown (no performance metrics)
- Translation workflow implications unclear (18 locales)
- Backward compatibility requirements limit options

**What would raise to 90%+:**
- Add build-time performance monitoring
- Create content migration automation with rollback
- Test migration approach on subset of guides first
- Document translation workflow for schema changes

---

## Planning Constraints & Notes

### Must-Follow Patterns

**Backward Compatibility:**
- All changes must provide migration path for existing 200+ guides
- URLs cannot change (SEO requirement)
- Content structure changes require automated migration
- Gradual rollout preferred over big-bang changes

**Type Safety:**
- Use Zod for all schema validation
- No `any` types in new code
- Discriminated unions for block types
- Runtime validation at system boundaries

**Testing:**
- New block types must include unit tests
- Content migration tools must include validation tests
- Template changes require integration tests
- Migration scripts must be idempotent

**Localization:**
- All content changes must consider 18 locale impact
- Translation coverage reporting required
- Fallback behavior must be documented
- Link tokens must support all areas

### Rollout/Rollback Expectations

**Incremental Rollout:**
- Changes should be feature-flagged or opt-in where possible
- Test on subset of guides before full rollout
- Per-locale or per-area rollout when appropriate
- Monitor for errors/regressions after each phase

**Rollback Capability:**
- Git-based rollback for manifest changes
- Schema changes must support old and new formats during transition
- Content migrations must be reversible
- Document rollback procedure for each major change

### Observability Expectations

**Build-Time:**
- Add metrics for manifest parsing, content loading, block composition
- Report validation errors and warnings
- Track build time per guide
- Surface migration progress

**Runtime:**
- Log fallback usage (which guides use EN fallback)
- Track content completeness
- Monitor broken link tokens
- Report missing translations

---

## Suggested Task Seeds (Non-binding)

### Quick Wins (Short-term: 1-3 months)

1. **Developer tooling improvements**
   - Create `pnpm create-guide` script for interactive guide creation
   - Add block type scaffolding script with test stubs
   - Consolidate test mock setup (reduce i18n boilerplate)

2. **Documentation**
   - Create `guides/README.md` with architecture overview
   - Document block addition process
   - Add troubleshooting guide for common issues

3. **Content validation**
   - Add Zod schema for guide content structure (enforce sections shape)
   - Build-time link token validation (%URL:%, %LINK:%, %HOWTO:%)
   - Integrate i18n coverage reporting into build output

4. **Developer experience**
   - Move manifest seed to `guide-manifest-seed.json` (easier editing)
   - Add "content incomplete" badge when EN fallback used
   - Improve error messages for missing content

### Foundational Improvements (Medium-term: 3-6 months)

5. **Block system enhancements**
   - Introduce block templates/presets (reduce manifest boilerplate)
   - Add block composition/wrapper pattern
   - Replace module resolution with TypeScript imports
   - Generate block option types from Zod schemas

6. **Content management**
   - Create general-purpose content migration tooling
   - Add content lint rules (formatting, consistency)
   - Implement shared FAQ library (reduce duplication)
   - Build content validation dashboard

7. **Template refactoring**
   - Extract GuideSeoTemplate into smaller components
   - Reduce conditional rendering complexity
   - Add integration tests for full pipeline
   - Document template architecture

8. **Performance & monitoring**
   - Add build-time performance metrics
   - Create guide health dashboard
   - Implement pre-deploy validation suite
   - Add manifest diff reporting to CI/PR

---

## Planning Readiness

**Status:** Ready-for-planning

**Recommended next step:** Proceed to `/plan-feature` with focus on quick wins for immediate impact. Prioritize:

1. **Developer tooling** (highest ROI, lowest risk)
2. **Content validation** (catches errors early, improves quality)
3. **Documentation** (reduces onboarding friction)
4. **Manifest reorganization** (enables future improvements)

**Medium-term improvements** (block system, template refactoring) should be planned separately after quick wins are validated.

**Migration strategy:** All improvements designed with migration path. Use pattern:
1. Add new capability alongside old
2. Provide automated migration tool
3. Migrate incrementally with validation
4. Deprecate old approach
5. Remove after transition complete

---

## Appendix: Quick Win Details

### Create Guide Script (pnpm create-guide)

**Purpose:** Reduce friction in creating new guides

**Features:**
- Interactive prompts for guide key, slug, content key, areas, tags
- Generate manifest entry with sensible defaults
- Create content JSON stub in all 18 locales
- Add entry to guides.index.ts
- Optionally generate test file stub

**Effort:** S (2-3 days)
**Impact:** High (DX improvement, consistency)
**Confidence:** 85%

### Link Token Validation

**Purpose:** Catch broken links at build time

**Features:**
- Scan all content JSON for link tokens
- Validate %LINK:guideKey% references exist in manifest
- Validate %HOWTO:slug% references exist in route definitions
- Validate %URL:href% are well-formed URLs
- Report validation errors in build output

**Effort:** S (2-3 days)
**Impact:** High (quality, SEO)
**Confidence:** 90%

### Content Schema Enforcement

**Purpose:** Catch content structure errors early

**Features:**
- Define Zod schema for guide content:
  - `seo: { title: string, description: string }`
  - `intro?: { title: string, body: string }`
  - `sections?: Array<{ id: string, title: string, body?: string, list?: string[] }>`
  - `callouts?: Record<string, string>`
- Validate at build time
- Report schema violations with file paths
- Allow opt-out for guides needing flexibility

**Effort:** S (2-3 days)
**Impact:** High (quality, DX)
**Confidence:** 88%

### Move Manifest to JSON

**Purpose:** Easier editing, better tooling support

**Features:**
- Extract manifestSeed to `guide-manifest-seed.json`
- Add build-time loader (fs + JSON.parse + Zod validation)
- Maintain TypeScript types
- Support JSON schema validation in editors
- Preserve all existing functionality

**Effort:** M (3-5 days)
**Impact:** High (maintainability, DX)
**Confidence:** 80%

**Migration approach:**
1. Create JSON file with all current entries
2. Add loader in guide-manifest.ts
3. Run tests to verify equivalence
4. Switch to JSON loader
5. Remove TypeScript manifestSeed
