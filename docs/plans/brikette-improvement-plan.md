---
Type: Plan
Status: Draft
Domain: Brikette
Last-reviewed: 2026-01-12
Relates-to charter: none
Last-updated: 2026-01-17
Last-updated-by: Codex
---

# Brikette App Improvement Plan

**Date:** 2026-01-12
**Status:** Draft
**Owner:** Engineering Team
**Priority:** High (Production Stability)

---

## Executive Summary

Following a comprehensive code analysis of the Brikette app, we've identified critical technical debt in type safety and error handling, alongside opportunities for performance optimization and code quality improvements. This plan outlines a phased approach to address these issues while maintaining the app's strong fundamentals in performance, i18n, and image optimization.

**Overall Assessment:** B+ (83/100)
**Target Grade:** A (90+)

---

## Current State Analysis

### Strengths to Preserve ✅
- **Image optimization** - Best-in-class Cloudflare Images integration
- **i18n architecture** - 18 languages, 54 namespaces, sophisticated loading
- **Performance** - Lighthouse 0.85+, lean bundles (150-250KB gzip)
- **React Router compatibility layer** - Framework migration flexibility
- **Modal lazy loading** - Smart code splitting pattern
- **Monorepo integration** - Excellent use of workspace packages

### Critical Issues 🔴
1. **Type Safety Crisis** - 491 instances of `as unknown as` across 221 files
2. **Silent Error Suppression** - 40+ empty catch blocks
3. **Component Complexity** - 3 files exceed 500 lines

### Moderate Issues 🟡
4. Code duplication in i18n loading logic
5. Over-optimization (239 useMemo instances)
6. Hardcoded guide-specific logic
7. Sequential API calls in booking flow

---

## Phase 1: Production Stability (Weeks 1-3)

**Goal:** Address critical type safety and error handling issues that pose maintenance risks.

### 1.1 Type Safety Audit and Refactoring

**Priority:** P0 (Blocker)
**Effort:** 2-3 weeks
**Owner:** Senior Frontend Engineer

#### Objectives:
- Eliminate unsafe type assertions in i18n infrastructure
- Create proper type guards for i18next resources
- Establish TypeScript strictness standards

#### Tasks:

**Week 1: Assessment & Planning**
1. Audit all 491 instances of `as unknown as`
   - Categorize by severity (critical path vs. edge cases)
   - Identify root causes (i18next types, legacy code, shortcuts)
   - Create detailed remediation plan

2. Analyze i18next type mismatches
   ```typescript
   // Current problem pattern:
   cb(null, overrideBundle as import("i18next").ResourceKey);

   // Desired solution:
   function isResourceKey(value: unknown): value is ResourceKey {
     // Proper type guard
   }
   ```

**Week 2-3: Implementation**
3. Fix critical path type assertions
   - **Priority 1:** i18n.ts (84 instances)
   - **Priority 2:** buildContent.ts (unsafe Section[] casts)
   - **Priority 3:** GenericContent.tsx, GenericOrFallbackContent.tsx

4. Create type utility library
   ```typescript
   // apps/brikette/src/types/guards.ts
   export function isResourceKey(value: unknown): value is ResourceKey;
   export function isSection(value: unknown): value is Section;
   export function isGuideContent(value: unknown): value is GuideContent;
   ```

5. Update tsconfig.json
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "noImplicitAny": true,
       "strictNullChecks": true,
       "noUncheckedIndexedAccess": true
     }
   }
   ```

**Acceptance Criteria:**
- [ ] `as unknown as` instances reduced by 80% (98 remaining max)
- [ ] All i18n.ts type assertions have type guards
- [ ] Zero new TypeScript errors introduced
- [ ] Build passes with `strict: true`
- [ ] Documentation added for remaining necessary casts

**Testing:**
- Run full test suite (unit + E2E)
- Manual QA on guide pages, language switching, booking flow
- TypeScript build verification

---

### 1.2 Error Handling Standardization

**Priority:** P0 (Blocker)
**Effort:** 1 week
**Owner:** Senior Frontend Engineer

#### Objectives:
- Eliminate silent error suppression
- Standardize error logging patterns
- Implement proper error boundaries

#### Tasks:

**Week 1: Implementation**

1. Create error handling utilities
   ```typescript
   // apps/brikette/src/utils/errors.ts

   export function logError(
     error: unknown,
     context: { scope: string; event: string; metadata?: Record<string, unknown> }
   ): void {
     if (IS_DEV) {
       console.error({ ...context, error });
     }
     // Production: send to telemetry
     captureError(error, context);
   }

   export function withErrorBoundary<T>(
     fn: () => T,
     fallback: T,
     context: { scope: string; event: string }
   ): T {
     try {
       return fn();
     } catch (error) {
       logError(error, context);
       return fallback;
     }
   }
   ```

2. Replace all silent catch blocks
   ```typescript
   // Before:
   try {
     debugGuide(DEBUG_KEYS.tocFinalItems, tocItems);
   } catch {
     /* noop */
   }

   // After:
   try {
     debugGuide(DEBUG_KEYS.tocFinalItems, tocItems);
   } catch (error) {
     logError(error, { scope: 'GenericContent', event: 'debugGuideFailed' });
   }
   ```

3. Implement React Error Boundaries
   - Create `ErrorBoundary` component for guide rendering
   - Add fallback UI for translation loading failures
   - Wrap modal components with error boundaries

4. Audit i18n.ts error handling
   - Lines 100-103, 117-120, 129-132, 174-177
   - Add context logging for all catch blocks

**Acceptance Criteria:**
- [ ] Zero empty catch blocks in production code
- [ ] All errors logged with context (scope + event)
- [ ] Error boundaries cover critical UI sections
- [ ] Telemetry receives error events
- [ ] Error handling documentation updated

**Files to Update:**
- GenericContent.tsx (10 catch blocks)
- i18n.ts (8 catch blocks)
- buildContent.ts (3 catch blocks)
- AppLayout.tsx, Root.tsx (error handling consistency)

---

### 1.3 Component Complexity Reduction

**Priority:** P1 (High)
**Effort:** 2 weeks
**Owner:** Frontend Team

#### Objectives:
- Break down components exceeding 500 lines
- Extract reusable hooks and utilities
- Improve testability and maintainability

#### Tasks:

**Week 1: GenericContent.tsx Refactoring (524 lines → ~200 lines)**

1. Extract Table of Contents logic
   ```typescript
   // New file: hooks/useTableOfContents.ts
   export function useTableOfContents(
     sections: Section[],
     guideKey: GuideKey
   ): {
     tocItems: TocItem[];
     hiddenAnchors: string[];
   }
   ```

2. Extract section filtering
   ```typescript
   // New file: utils/guide-sections.ts
   export function filterGuideSections(
     sections: Section[],
     guideKey: GuideKey
   ): { visible: Section[]; hidden: string[] }
   ```

3. Create smaller components
   - `GuideIntro.tsx` - intro text rendering
   - `GuideSections.tsx` - section list
   - `GuideFaqs.tsx` - FAQ rendering
   - `GuideTips.tsx` - tips/warnings/essentials

**Week 2: GenericOrFallbackContent.tsx Refactoring (1,898 lines → ~400 lines)**

4. Extract translation resolvers
   ```typescript
   // New file: utils/guide-translation-resolvers.ts
   export function resolveFaqsHeading(t: TFunction, guideKey: GuideKey): string;
   export function resolveGuideLabel(t: TFunction, key: string): string;
   export function resolveSectionContent(t: TFunction, path: string): Section[];
   ```

5. Split rendering paths
   - `GenericContentRenderer.tsx` - standard guide rendering
   - `FallbackContentRenderer.tsx` - fallback/stub rendering
   - `GuideContentLoader.tsx` - translation loading orchestration

**Acceptance Criteria:**
- [ ] GenericContent.tsx < 250 lines
- [ ] GenericOrFallbackContent.tsx < 500 lines
- [ ] 5+ new reusable hooks/utilities created
- [ ] Test coverage maintained or improved
- [ ] No visual regressions in guide pages

---

## Phase 2: Technical Debt Reduction (Weeks 4-6)

**Goal:** Eliminate code duplication and improve maintainability.

### 2.1 Eliminate Code Duplication

**Priority:** P2 (Medium)
**Effort:** 3 days
**Owner:** Mid-level Frontend Engineer

#### Tasks:

1. Extract shared i18n preloading logic
   ```typescript
   // New file: hooks/useI18nPreloading.ts
   export function useI18nPreloading(
     lang: string,
     namespaces: string[]
   ): {
     loadFor: (nextLang: string | undefined) => Promise<void>;
     isLoading: boolean;
   }
   ```
   - Used by: AppLayout.tsx, Root.tsx
   - Eliminates: ~80 lines of duplication

2. Create test wrapper factory
   ```typescript
   // New file: test/utils/conditional-wrapper.tsx
   export function createConditionalWrapper<P>(
     Component: React.ComponentType<P>,
     condition: boolean
   ): React.ComponentType<P>
   ```
   - Eliminates repetitive ternary patterns

3. Generalize translation fallback resolvers
   ```typescript
   // New file: utils/translation-fallback.ts
   export function createFallbackResolver(config: FallbackConfig) {
     return (t: TFunction, key: string) => {
       // Unified fallback resolution logic
     };
   }
   ```

**Acceptance Criteria:**
- [ ] <50 lines of duplicated logic remaining
- [ ] 3+ utility functions created and documented
- [ ] Test coverage for new utilities
- [ ] All duplicate code replaced with utility calls

---

### 2.2 Remove Over-Optimization

**Priority:** P2 (Medium)
**Effort:** 2 days
**Owner:** Performance Engineer

#### Tasks:

1. Audit all 239 useMemo/useCallback instances
   - Profile render performance with React DevTools
   - Identify genuinely expensive computations
   - Remove memoization from:
     - Static data (roomsData, translation labels)
     - Simple computations (array sorting <100 items)
     - Leaf components with no props

2. Create optimization guidelines
   ```markdown
   ## When to Use useMemo/useCallback

   ✅ Use when:
   - Expensive computations (>10ms measured)
   - Large data transformations (>1000 items)
   - Preventing child re-renders (with React.memo)
   - Referential equality needed for deps

   ❌ Avoid when:
   - Static data or constants
   - Simple calculations (<1ms)
   - Leaf components
   - Creating objects/arrays (often cheaper than memo)
   ```

**Acceptance Criteria:**
- [ ] useMemo/useCallback count reduced by 50% (120 instances remaining)
- [ ] Performance benchmarks show no regression
- [ ] Optimization guidelines documented
- [ ] Code review checklist updated

---

### 2.3 Generalize Guide Special Cases

**Priority:** P2 (Medium)
**Effort:** 2 days
**Owner:** Frontend Engineer

#### Tasks:

1. Create guide configuration system
   ```typescript
   // New file: config/guide-overrides.ts
   interface GuideConfig {
     hideSections?: string[];
     customIntro?: boolean;
     sectionFilterFn?: (section: Section) => boolean;
   }

   export const GUIDE_CONFIGS: Record<GuideKey, GuideConfig> = {
     soloTravelPositano: {
       sectionFilterFn: (section) => !/^section-\d+$/.test(section.id)
     },
     interrailAmalfi: {
       customIntro: true
     }
   };
   ```

2. Remove hardcoded guide checks
   ```typescript
   // Before:
   if (guideKey === ("soloTravelPositano" as GuideKey)) {
     // Special filtering logic
   }

   // After:
   const config = GUIDE_CONFIGS[guideKey];
   if (config?.sectionFilterFn) {
     filtered = sections.filter(config.sectionFilterFn);
   }
   ```

**Acceptance Criteria:**
- [ ] Zero hardcoded guide key checks in components
- [ ] All special cases moved to configuration
- [ ] Configuration is extensible for new guides
- [ ] Documentation for adding guide overrides

---

## Phase 3: Performance Optimization (Weeks 7-8)

**Goal:** Improve runtime performance and user experience.

### 3.1 Parallelize API Calls

**Priority:** P1 (High)
**Effort:** 1 day
**Owner:** Backend Integration Engineer

#### Tasks:

1. Update booking flow in book.tsx
   ```typescript
   // Before:
   const res = await fetch(`/api/octorate/confirm-link?${params}`);
   const altRes = await fetch(`/api/octorate/alternatives?${altParams}`);

   // After:
   const [res, altRes] = await Promise.all([
     fetch(`/api/octorate/confirm-link?${params}`),
     fetch(`/api/octorate/alternatives?${altParams}`)
   ]);
   ```

2. Measure latency improvements
   - Before: Sequential (2 RTTs)
   - After: Parallel (1 RTT)
   - Expected: 50% reduction in booking confirmation time

**Acceptance Criteria:**
- [ ] API calls execute in parallel
- [ ] Error handling properly catches both failures
- [ ] Latency reduced by 40-50%
- [ ] E2E tests pass for booking flow

---

### 3.2 Optimize Bundle Size

**Priority:** P2 (Medium)
**Effort:** 3 days
**Owner:** Performance Engineer

#### Tasks:

1. Evaluate react-datepicker alternatives
   - Consider: @headlessui/react Popover + date utils
   - Potential savings: 20-30KB gzip

2. Assess Swiper usage
   - Inventory: How many carousels? How complex?
   - Consider: CSS-only alternatives if simple
   - Potential savings: 30-40KB gzip

3. Analyze bundle with webpack-bundle-analyzer
   - Identify large dependencies
   - Check for duplicate modules
   - Look for tree-shaking opportunities

4. Add preconnect to Cloudflare CDN
   ```html
   <link rel="preconnect" href="https://imagedelivery.net" />
   <link rel="dns-prefetch" href="https://imagedelivery.net" />
   ```

**Acceptance Criteria:**
- [ ] Bundle size reduced by 10-15%
- [ ] No feature regressions
- [ ] Lighthouse performance score maintained
- [ ] Bundle size monitoring automated

---

## Phase 4: Code Quality Improvements (Ongoing)

**Goal:** Maintain code quality and prevent regression.

### 4.1 Clean Up Debug Infrastructure

**Priority:** P3 (Low)
**Effort:** 1 day
**Owner:** Frontend Engineer

#### Tasks:

1. Isolate test-specific code
   - Remove `isTest` conditionals from AppLayout/Root
   - Create separate test setup files

2. Standardize debug logging
   - All debug calls use `debugGuide()` utility
   - Remove direct console.log/console.error (except logError utility)

3. Consider build-time stripping
   - Use babel plugin to remove debug calls in production
   - Or: webpack DefinePlugin to replace with no-ops

---

### 4.2 Improve Translation Coverage

**Priority:** P3 (Low)
**Effort:** Ongoing
**Owner:** Content Team

#### Tasks:

1. Audit missing translations
   - Identify English-only guides
   - Track fallback usage in telemetry

2. Document translation gaps
   - Create backlog of guides needing translation
   - Prioritize by traffic/importance

3. Simplify fallback logic
   - Once translations complete, remove complexity
   - Reduce `allowEnglishGuideFallback` usage

---

## Success Metrics

### Code Quality Metrics

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| `as unknown as` instances | 491 | <100 | Phase 1 |
| Silent catch blocks | 40+ | 0 | Phase 1 |
| Files >500 lines | 3 | 0 | Phase 1 |
| Duplicated code | ~80 lines | <20 lines | Phase 2 |
| useMemo overuse | 239 | ~120 | Phase 2 |
| Hardcoded guide logic | 20+ | 0 | Phase 2 |

### Performance Metrics

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| Lighthouse Performance | 0.85+ | 0.90+ | Phase 3 |
| LCP | 2.5s | 2.0s | Phase 3 |
| Bundle size (gzip) | 250KB | 220KB | Phase 3 |
| Booking API latency | 2 RTTs | 1 RTT | Phase 3 |

### Overall Grade

| Phase | Target Grade |
|-------|--------------|
| Current | B+ (83/100) |
| After Phase 1 | A- (87/100) |
| After Phase 2 | A (90/100) |
| After Phase 3 | A+ (93/100) |

---

## Risk Assessment

### High Risk
- **Type safety refactoring** - Could introduce runtime errors
  - Mitigation: Comprehensive test coverage, gradual rollout, code review

### Medium Risk
- **Component refactoring** - Visual regressions possible
  - Mitigation: Snapshot tests, manual QA, feature flags

### Low Risk
- **Bundle optimization** - Feature removal risk
  - Mitigation: Usage analytics, A/B testing

---

## Resource Requirements

### Team Allocation

| Phase | Duration | FTE | Roles |
|-------|----------|-----|-------|
| Phase 1 | 3 weeks | 1.5 | Senior Frontend (1.0), QA (0.5) |
| Phase 2 | 3 weeks | 1.0 | Frontend (0.7), Performance (0.3) |
| Phase 3 | 2 weeks | 0.7 | Performance (0.5), Backend (0.2) |
| Phase 4 | Ongoing | 0.2 | Frontend (rotating) |

**Total Effort:** ~12 person-weeks

---

## Dependencies

### Internal
- Access to production telemetry data
- Approval for TypeScript strict mode migration
- Design review for error boundary UI

### External
- None identified

---

## Rollout Strategy

### Phase 1: Gradual Rollout
1. Week 1: Deploy type safety fixes to staging
2. Week 2: Canary deployment (5% traffic)
3. Week 3: Full rollout after monitoring

### Phase 2-3: Feature Flags
- Use feature flags for large refactors
- A/B test bundle optimizations
- Monitor error rates and performance

### Phase 4: Continuous Improvement
- Regular code review focus weeks
- Quarterly tech debt sprints
- Automated quality gates in CI/CD

---

## Appendix: File-by-File Impact Analysis

### Critical Path Files (Require Review)

**Type Safety (Phase 1):**
- `apps/brikette/src/i18n.ts` - 84 type assertions
- `apps/brikette/src/components/guides/GenericContent.tsx` - 50+ assertions
- `apps/brikette/src/components/guides/GenericOrFallbackContent.tsx` - 100+ assertions
- `apps/brikette/src/components/guides/generic-content/buildContent.ts` - 30+ assertions

**Error Handling (Phase 1):**
- `apps/brikette/src/components/guides/GenericContent.tsx` - 10 catch blocks
- `apps/brikette/src/i18n.ts` - 8 catch blocks
- `apps/brikette/src/components/guides/generic-content/buildContent.ts` - 3 catch blocks

**Complexity (Phase 1):**
- `apps/brikette/src/components/guides/GenericOrFallbackContent.tsx` - 1,898 lines
- `apps/brikette/src/components/guides/_GuideSeoTemplate.tsx` - 1,090 lines
- `apps/brikette/src/components/guides/GenericContent.tsx` - 524 lines

---

## Monitoring & Validation

### CI/CD Gates
- TypeScript build with `strict: true`
- ESLint rules for type assertions
- Bundle size regression tests
- Performance benchmarks (Lighthouse CI)

### Production Monitoring
- Error rate by component
- Type assertion usage (custom telemetry)
- Performance metrics (Web Vitals)
- Translation fallback usage

### Success Validation
- Weekly dashboard review
- Monthly tech debt metrics
- Quarterly architecture review

---

## Next Steps

1. **Review & Approval** - Engineering leadership sign-off (Week 0)
2. **Team Kickoff** - Phase 1 planning and assignment (Week 1)
3. **Execution** - Begin type safety audit (Week 1-3)
4. **Weekly Sync** - Progress tracking and blockers (Ongoing)
5. **Retrospective** - After each phase completion

---

**Document Version:** 1.0
**Last Updated:** 2026-01-12
**Next Review:** 2026-02-12 (after Phase 1 completion)

## Active tasks

- **BRIK-01** - Phase 1: Type safety fixes and error handling improvements
