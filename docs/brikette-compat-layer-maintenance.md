# React Router Compatibility Layer - Maintenance Guide

**Last Updated:** 2026-01-12
**Target Audience:** Platform team, maintainers
**Related:** [ADR 001](adr/001-react-router-compatibility-layer.md)

## Overview

This guide provides instructions for maintaining the React Router v7 compatibility layer in the Brikette application during Next.js upgrades, dependency updates, and feature enhancements.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Critical Dependencies](#critical-dependencies)
3. [Next.js Upgrade Process](#nextjs-upgrade-process)
4. [Testing Strategy](#testing-strategy)
5. [Common Issues & Solutions](#common-issues--solutions)
6. [Performance Monitoring](#performance-monitoring)
7. [Migration Path](#migration-path)

---

## Architecture Overview

### Component Map

The compatibility layer consists of 5 core modules:

```
apps/brikette/src/compat/
├── router-state.tsx         # State management & contexts (220 lines)
├── route-runtime.ts         # Route matching & resolution (433 lines)
├── react-router-dom.tsx     # Hook & component API (284 lines)
├── route-modules.ts         # Module registry (252 lines, auto-generated)
└── RouteRenderer.tsx        # SSR bridge (117 lines)

Total: ~1,300 lines of core compatibility code
```

### Data Flow

```
User Request
    ↓
Next.js App Router (catch-all route)
    ↓
resolveRoute(pathname) [route-runtime.ts]
    ↓
Match Routes → Execute Loaders → Build Metadata
    ↓
buildRouterState(resolved) [route-runtime.ts]
    ↓
<RouterStateProvider> [router-state.tsx]
    ↓
<RouteRenderer> [RouteRenderer.tsx]
    ↓
Application Components (use hooks from react-router-dom.tsx)
```

### Integration Points with Next.js

| Next.js Feature | Compatibility Layer Usage | File |
|----------------|---------------------------|------|
| `next/link` | Wrapped by `<Link>` component | `react-router-dom.tsx:134` |
| `next/dynamic` | Used for route code splitting | `RouteRenderer.tsx:36` |
| `next/head` | Used for metadata rendering | `RouteRenderer.tsx:105` |
| App Router catch-all | Entry point for routing | `apps/brikette/src/app/[lang]/[[...segments]]/page.tsx` |

---

## Critical Dependencies

### Direct Dependencies

Monitor these packages for breaking changes:

```json
{
  "next": "15.x.x",                    // Primary framework
  "react": "19.x.x",                   // UI library
  "react-dom": "19.x.x",               // DOM renderer
  "@react-router/dev": "^7.x.x",       // Route configuration types
  "react-router": "^7.x.x"             // Type definitions only
}
```

### Dependency Compatibility Matrix

| Next.js Version | React Version | Compatibility Status | Notes |
|-----------------|---------------|---------------------|-------|
| 15.0.0 - 15.2.0 | 19.x | ✅ Tested | Current |
| 14.x | 18.x | ⚠️ Untested | May work with minor changes |
| 16.x (future) | 19.x+ | ❓ Unknown | Test when available |

### Breaking Change Watchlist

**High Risk:**
- Changes to `next/link` component API
- Changes to `next/dynamic` behavior
- Changes to App Router catch-all route handling
- Changes to Next.js metadata API

**Medium Risk:**
- React 19 concurrent features
- Server Components restrictions
- TypeScript type changes

**Low Risk:**
- Build system changes
- CSS/styling changes
- Minor API additions

---

## Next.js Upgrade Process

### Pre-Upgrade Checklist

Before upgrading Next.js, complete these steps:

- [ ] Review Next.js changelog for breaking changes
- [ ] Check if `next/link`, `next/dynamic`, or `next/head` APIs changed
- [ ] Review React version compatibility
- [ ] Backup current working state (git tag)
- [ ] Run full test suite to establish baseline

### Step-by-Step Upgrade

#### 1. Create Feature Branch

```bash
git checkout -b upgrade/nextjs-15.x.x
```

#### 2. Update Dependencies

```bash
# Update Next.js and React
pnpm add next@15.x.x react@19.x.x react-dom@19.x.x

# Update related dependencies
pnpm update @types/react @types/react-dom
```

#### 3. Test Compatibility Layer

Run the compatibility layer test suite:

```bash
# Unit tests for compat layer
pnpm --filter @apps/brikette test __tests__/compat

# Integration tests
pnpm --filter @apps/brikette test:integration

# E2E tests
pnpm --filter @apps/brikette e2e
```

#### 4. Check for Type Errors

```bash
pnpm --filter @apps/brikette typecheck
```

#### 5. Manual Testing Checklist

Test these critical user flows:

- [ ] Homepage loads and renders correctly
- [ ] Navigate between pages using `<Link>` components
- [ ] Browser back/forward buttons work
- [ ] Query parameters persist during navigation
- [ ] Hash fragments work correctly
- [ ] Loaders execute and data displays
- [ ] Multilingual routing (18 languages)
- [ ] 404 pages render correctly
- [ ] Redirects work as expected
- [ ] Meta tags render correctly
- [ ] Dynamic imports work (check Network tab)

#### 6. Performance Benchmarking

Compare performance before and after:

```bash
# Lighthouse CI
pnpm lighthouse:ci

# Build size analysis
pnpm --filter @apps/brikette build
pnpm --filter @apps/brikette analyze

# Check bundle size difference
ls -lh apps/brikette/.next/static/chunks
```

#### 7. Visual Regression Testing

```bash
# Capture screenshots for comparison
pnpm --filter @apps/brikette test:visual
```

### Post-Upgrade Verification

- [ ] All tests passing
- [ ] No new TypeScript errors
- [ ] Bundle size increase <5%
- [ ] Performance metrics stable (±5%)
- [ ] Visual regression tests pass
- [ ] Manual testing complete

### Rollback Plan

If upgrade fails:

```bash
# Revert package.json changes
git checkout package.json pnpm-lock.yaml

# Reinstall previous versions
pnpm install

# Verify tests pass
pnpm test
```

---

## Testing Strategy

### Test Levels

#### 1. Unit Tests (Fast, Isolated)

Location: `apps/brikette/__tests__/compat/`

```bash
# Run all compat layer unit tests
pnpm --filter @apps/brikette test __tests__/compat

# Run specific test file
pnpm --filter @apps/brikette test router-state.test.tsx

# Run with coverage
pnpm --filter @apps/brikette test:coverage __tests__/compat
```

**Coverage Requirements:**
- `router-state.tsx`: >90%
- `route-runtime.ts`: >85%
- `react-router-dom.tsx`: >90%
- `RouteRenderer.tsx`: >80%

#### 2. Integration Tests (Medium, Route-Level)

Test full route resolution and rendering:

```typescript
// Example integration test
it('should render guide page with loader data', async () => {
  const resolved = await resolveRoute('/en/guides/path-of-the-gods');
  expect(resolved).toHaveProperty('result');

  const state = buildRouterState(resolved.result);
  render(
    <RouterStateProvider state={state}>
      <RouteRenderer matches={resolved.result.matches} head={resolved.result.head} />
    </RouterStateProvider>
  );

  expect(screen.getByRole('heading')).toBeInTheDocument();
});
```

#### 3. E2E Tests (Slow, User Flows)

Test critical user journeys:

```typescript
// Cypress E2E test example
describe('Navigation', () => {
  it('should navigate between pages', () => {
    cy.visit('/en');
    cy.findByText('Rooms').click();
    cy.url().should('include', '/en/rooms');
    cy.go('back');
    cy.url().should('eq', Cypress.config().baseUrl + '/en');
  });
});
```

### Testing Edge Cases

The test suite covers these critical edge cases:

**Route Matching:**
- Parameterized routes (`/rooms/:id`)
- Wildcard routes (`/guides/*`)
- Nested routes with multiple levels
- Case-sensitive routing
- URL encoding/decoding
- Empty pathnames
- Trailing slashes

**Navigation:**
- Forward/backward navigation
- Replace vs. push
- External links
- Hash navigation
- Query parameter persistence

**Data Loading:**
- Loader execution order
- Error handling in loaders
- Redirect from loader
- 404 from loader
- Concurrent loader execution

**Metadata:**
- Meta tag generation
- Link tag generation
- Title updates
- Canonical URLs

### Continuous Testing

**Pre-commit Hooks:**
```bash
# .husky/pre-commit
pnpm --filter @apps/brikette test __tests__/compat --passWithNoTests
pnpm --filter @apps/brikette typecheck
```

**CI Pipeline:**
```yaml
# .github/workflows/test.yml
- name: Test Compat Layer
  run: pnpm --filter @apps/brikette test __tests__/compat

- name: E2E Tests
  run: pnpm --filter @apps/brikette e2e
```

---

## Common Issues & Solutions

### Issue 1: TypeScript Errors After Next.js Upgrade

**Symptoms:**
```
Type 'NextLink' is not assignable to type 'ComponentType<LinkProps>'
```

**Cause:** Next.js changed the `Link` component type signature.

**Solution:**
Update the Link wrapper in `react-router-dom.tsx`:

```typescript
// Before
import NextLink from 'next/link';

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ to, replace, prefetch, className, children, preventScrollReset, ...rest }, ref) => {
    // Implementation
  }
);

// After (if types changed)
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ to, replace, prefetch, className, children, preventScrollReset, ...rest }, ref) => {
    const linkProps = {
      href: toHref(to),
      ref,
      // Cast if necessary
    } as React.ComponentProps<typeof NextLink>;

    return <NextLink {...linkProps}>{children}</NextLink>;
  }
);
```

### Issue 2: Dynamic Imports Fail After Upgrade

**Symptoms:**
- Routes don't render
- Console error: "Cannot read property 'default' of undefined"

**Cause:** Changes to `next/dynamic` API.

**Solution:**
Update `RouteRenderer.tsx`:

```typescript
// Check Next.js docs for current dynamic() API
const Component = dynamic(
  () => loader().then((mod) => {
    const routeModule = mod as RouteModule;
    return routeModule.default ?? (() => null);
  }),
  {
    ssr: true,
    // Add any new required options
  }
);
```

### Issue 3: Metadata Not Rendering

**Symptoms:**
- Meta tags missing from page source
- SEO issues

**Cause:** Next.js changed metadata API.

**Solution:**
Check if Next.js introduced new metadata exports. Update `RouteRenderer.tsx` if needed:

```typescript
// May need to migrate to Next.js metadata exports
export async function generateMetadata({ params }) {
  const resolved = await resolveRoute(buildPathname(params));
  return {
    title: resolved.result.head.meta.find(m => 'title' in m)?.title,
    // ...other metadata
  };
}
```

### Issue 4: Route Matching Breaks

**Symptoms:**
- 404 errors on valid routes
- Wrong routes matched

**Cause:** Changes to route segment handling in Next.js.

**Solution:**
Debug route matching:

```typescript
// Add logging to route-runtime.ts
const matchResult = matchRoutes(routes as RouteConfigEntry[], segments);
console.log('Route matching:', { pathname, segments, matchResult });
```

Verify catch-all route structure:
```
apps/brikette/src/app/[lang]/[[...segments]]/page.tsx
```

### Issue 5: Performance Degradation

**Symptoms:**
- Slow page loads
- Large bundle sizes

**Cause:** Changes to code splitting or bundling.

**Solution:**

1. Analyze bundle:
```bash
pnpm --filter @apps/brikette analyze
```

2. Check dynamic imports are working:
```typescript
// Verify in RouteRenderer.tsx
const Component = dynamic(() => loader(), { ssr: true });
```

3. Profile rendering:
```typescript
// Add performance marks
performance.mark('route-resolution-start');
const resolved = await resolveRoute(pathname);
performance.mark('route-resolution-end');
performance.measure('route-resolution', 'route-resolution-start', 'route-resolution-end');
```

### Issue 6: Hydration Errors

**Symptoms:**
- React hydration mismatch warnings
- Content flashing/jumping

**Cause:** SSR/CSR mismatch.

**Solution:**

1. Ensure consistent data between server and client:
```typescript
// Check that loaders run the same on server and client
export const loader = async ({ request, params }) => {
  // Use same data source for SSR and CSR
  const data = await fetchData(params.id);
  return data;
};
```

2. Verify `RouterStateProvider` wraps consistently:
```typescript
// In page.tsx
return (
  <RouterStateProvider state={state}>
    <RouteRenderer matches={matches} head={head} />
  </RouterStateProvider>
);
```

---

## Performance Monitoring

### Key Metrics

Track these metrics before and after changes:

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| Route resolution time | <5ms | <10ms |
| Bundle size (compat layer) | <20KB gzip | <30KB gzip |
| Time to Interactive (TTI) | <3s | <5s |
| Largest Contentful Paint (LCP) | <2.5s | <4s |
| Cumulative Layout Shift (CLS) | <0.1 | <0.25 |

### Monitoring Tools

**Bundle Size:**
```bash
# Analyze bundle composition
pnpm --filter @apps/brikette build
pnpm --filter @apps/brikette analyze

# Check specific chunk sizes
ls -lh apps/brikette/.next/static/chunks | grep compat
```

**Runtime Performance:**
```typescript
// Add to route-runtime.ts
const start = performance.now();
const matchResult = matchRoutes(entries, segments);
const duration = performance.now() - start;

if (duration > 10) {
  console.warn(`Slow route matching: ${duration}ms for ${pathname}`);
}
```

**Lighthouse CI:**
```bash
# Run Lighthouse in CI
pnpm lighthouse:ci

# Compare results
lighthouse-ci compare --target=main --current=HEAD
```

### Performance Optimization Tips

1. **Route Matching:**
   - Keep route definitions shallow
   - Avoid complex regex patterns
   - Use static segments where possible

2. **Dynamic Imports:**
   - Ensure all routes use dynamic imports
   - Don't import routes directly in `route-modules.ts`
   - Use webpack magic comments for better chunk names:
   ```typescript
   () => import(/* webpackChunkName: "route-[request]" */ "@/routes/...")
   ```

3. **Component Caching:**
   - `RouteRenderer.tsx` already caches components
   - Don't clear cache unnecessarily

4. **State Memoization:**
   - `RouterStateProvider` already memoizes contexts
   - Avoid creating new objects in render

---

## Migration Path

### When to Migrate Away from Compatibility Layer

Consider migrating to native Next.js App Router when:

- **Next.js 16+ requires it** - Breaking changes make compat layer unsustainable
- **Team capacity available** - 4-6 weeks of dedicated development time
- **Performance issues emerge** - Compat layer overhead becomes measurable
- **New features needed** - Server Actions, Streaming RSC, or other App Router exclusives

### Incremental Migration Strategy

Don't migrate all at once. Use this phased approach:

#### Phase 1: High-Traffic Routes (Week 1-2)

Migrate most-visited pages first for maximum impact:

1. Homepage (`/en`)
2. Rooms listing (`/en/rooms`)
3. Room detail pages (`/en/rooms/:id`)

**Steps:**
1. Create parallel App Router route: `apps/brikette/src/app/[lang]/rooms/page.tsx`
2. Move loader logic to Server Component
3. Convert metadata to `generateMetadata` export
4. Test with feature flag: `if (useAppRouter) { /* new route */ }`
5. Monitor metrics
6. Switch traffic gradually (10% → 50% → 100%)

#### Phase 2: Static Content (Week 3-4)

Migrate pages without dynamic data:

- About page
- Terms of service
- Privacy policy
- Static guides

**Benefits:**
- Simpler migration (no loaders)
- Can use static generation
- Lower risk

#### Phase 3: Dynamic Features (Week 5-6)

Migrate complex pages:

- Search/filtering
- Dynamic guides
- Assistance hub

**Challenges:**
- Complex loaders
- State management
- Form handling

#### Phase 4: Cleanup (Week 7)

- Remove compatibility layer
- Update all components
- Remove feature flags
- Update documentation

### Parallel Systems Pattern

Run both systems side-by-side:

```typescript
// apps/brikette/src/app/[lang]/[[...segments]]/page.tsx

const USE_APP_ROUTER = process.env.NEXT_PUBLIC_USE_APP_ROUTER === 'true';

if (USE_APP_ROUTER) {
  // New App Router implementation
  return <NativePage params={params} />;
}

// Existing compatibility layer
const resolved = await resolveRoute(pathname);
return (
  <RouterStateProvider state={state}>
    <RouteRenderer matches={resolved.result.matches} head={resolved.result.head} />
  </RouterStateProvider>
);
```

### Migration Checklist Per Route

- [ ] Identify route file in `src/routes/`
- [ ] Extract loader logic
- [ ] Convert to Server Component or Route Handler
- [ ] Update metadata to `generateMetadata`
- [ ] Update links to new route
- [ ] Add feature flag
- [ ] Test with compatibility layer disabled
- [ ] Monitor metrics
- [ ] Gradual rollout
- [ ] Remove compatibility layer usage for this route

---

## Emergency Contacts

**Primary Maintainer:**
Platform Team

**Secondary Contact:**
Tech Lead

**Escalation:**
Engineering Manager

---

## Appendix

### Useful Commands

```bash
# Run full test suite
pnpm --filter @apps/brikette test

# Run only compat tests
pnpm --filter @apps/brikette test __tests__/compat

# Type check
pnpm --filter @apps/brikette typecheck

# Build and analyze
pnpm --filter @apps/brikette build
pnpm --filter @apps/brikette analyze

# E2E tests
pnpm --filter @apps/brikette e2e

# Lighthouse
pnpm lighthouse:ci
```

### Related Documentation

- [ADR 001: React Router Compatibility Layer](adr/001-react-router-compatibility-layer.md)
- [Brikette Improvement Plan](brikette-improvement-plan.md)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Router v7 Documentation](https://reactrouter.com/en/main)

### Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-12 | Initial maintenance guide |

---

**Last Review:** 2026-01-12
**Next Review:** 2026-07-12 (6 months)
