# ADR 001: React Router v7 Compatibility Layer for Brikette

**Date:** 2026-01-12
**Status:** Accepted
**Deciders:** Engineering Team
**Technical Story:** Brikette app migration to Next.js 15 with React Router v7 compatibility

## Context

The Brikette application is a multilingual hostel website supporting 18 languages with 253 localized routes and 4,190+ locale files. Originally designed with React Router v7 in mind, the application was migrated to Next.js 15 for its superior deployment flexibility, build tooling, and ecosystem support.

However, the migration presented a significant challenge: **the entire codebase was written using React Router v7 patterns**, including:

- React Router hooks (`useLoaderData`, `useParams`, `useLocation`, `useNavigate`, `useSearchParams`)
- React Router components (`<Link>`, `<NavLink>`, `<Outlet>`)
- React Router loaders (`loader`, `clientLoader`)
- React Router meta functions (`meta`, `links`)
- React Router redirects (`redirect()`)
- React Router route configuration using `@react-router/dev/routes`

The application's architecture relies heavily on these patterns across **all 253 route components** and numerous shared UI components. A complete rewrite to use Next.js App Router patterns would require:

1. Rewriting all 253 route files
2. Converting all loaders to Next.js `page.tsx` components with Server Components
3. Refactoring all UI components that use React Router hooks
4. Restructuring the entire multilingual routing system
5. Migrating metadata generation from React Router's `meta` to Next.js metadata exports
6. Estimated effort: **4-6 weeks** of full-time development

## Decision

We decided to **create a React Router v7 compatibility layer** that bridges React Router patterns to Next.js, allowing the existing codebase to continue using React Router APIs while running on Next.js infrastructure.

The compatibility layer consists of five core modules:

### 1. `router-state.tsx` - State Management & Contexts

Defines the core types and React contexts that mimic React Router's internal state:

```typescript
// Core types matching React Router v7
Location, To, NavigateFunction, RouteMatch, LoaderFunction

// React contexts
RouterStateContext, RouteDataContext, DataRouterStateContext, NavigationContext

// Providers
RouterStateProvider, RouteDataProvider
```

**Key functionality:**
- Location management and navigation
- Router state propagation via contexts
- Fallback navigation using browser APIs
- Redirect handling
- Type-safe state providers

### 2. `route-runtime.ts` - Route Matching & Resolution

Implements the route matching algorithm and loader execution:

```typescript
// Route matching
matchRoutes(entries, segments, params) → MatchResult | null

// Route resolution
resolveRoute(pathname) → ResolvedRoute | redirect | notFound

// Router state construction
buildRouterState(resolved) → RouterState
```

**Key functionality:**
- Hierarchical route matching with wildcard and parameter support
- Loader execution for both `loader` and `clientLoader`
- Metadata aggregation from `meta` and `links` functions
- Redirect and 404 handling
- Dynamic route expansion for static site generation
- Multilingual route support with language parameter injection

### 3. `react-router-dom.tsx` - Hook & Component API

Provides the public API that application code uses:

```typescript
// Hooks
useLocation, useParams, useNavigate, useSearchParams, useLoaderData, useOutlet

// Components
<Link>, <NavLink>, <Outlet>

// Testing utilities
<MemoryRouter>, <Routes>, <Route>
```

**Key functionality:**
- React Router hook compatibility with Next.js `<Link>` delegation
- NavLink with active state detection
- Outlet rendering for nested routes
- Memory router for unit testing
- Prefetch control mapping to Next.js prefetch behavior

### 4. `route-modules.ts` - Module Registry

Auto-generated map of route file paths to dynamic imports:

```typescript
export const routeModules: Record<string, () => Promise<unknown>> = {
  "routes/home.tsx": () => import("@/routes/home"),
  "routes/rooms.tsx": () => import("@/routes/rooms"),
  // ... 250+ more route entries
}
```

**Key functionality:**
- Explicit import paths for bundler compatibility
- Dynamic import support for code splitting
- Type-safe route module loading

### 5. `RouteRenderer.tsx` - Server-Side Rendering Bridge

Connects the compatibility layer to Next.js rendering:

```typescript
RouteRenderer({ matches, head }) → React.ReactElement
```

**Key functionality:**
- Builds nested route component tree from matches
- Renders `<Head>` tags for SEO metadata
- Component caching for performance
- Dynamic imports with SSR support
- Integration with Next.js `dynamic()` for code splitting

## Integration with Next.js

The compatibility layer integrates with Next.js through a minimal Next.js App Router structure:

```
apps/brikette/src/app/
├── [lang]/
│   └── [[...segments]]/
│       └── page.tsx      # Catch-all route
├── directions/
│   └── [[...segments]]/
│       └── page.tsx      # Static direction routes
└── layout.tsx            # Root layout
```

Each `page.tsx` file:
1. Calls `resolveRoute(pathname)` from the compatibility layer
2. Receives `ResolvedRoute` with matches and metadata
3. Builds `RouterState` from resolved data
4. Wraps rendering in `<RouterStateProvider>`
5. Renders `<RouteRenderer>` with matches and head data

Example implementation:

```typescript
export default async function Page({ params }) {
  const pathname = buildPathname(params);
  const resolved = await resolveRoute(pathname);

  if ('notFound' in resolved) notFound();
  if ('redirect' in resolved) redirect(resolved.redirect.destination);

  const state = buildRouterState(resolved.result);

  return (
    <RouterStateProvider state={state}>
      <RouteRenderer matches={resolved.result.matches} head={resolved.result.head} />
    </RouterStateProvider>
  );
}
```

## Architectural Characteristics

### Size and Complexity

- **Total lines of code:** ~2,000+ lines across 5 modules
- **Route registry:** 250+ route file mappings
- **Supported routes:** 253 localized routes across 18 languages

### Performance Considerations

**Positive:**
- Code splitting via dynamic imports
- Component caching reduces render overhead
- Route matching happens once per request at build time
- Next.js static generation for all routes

**Negative:**
- Additional abstraction layer adds minor overhead
- Route matching algorithm runs on every page load (mitigated by static generation)
- Hydration includes compatibility layer bundle (~15-20KB gzipped)

### Type Safety

The compatibility layer is fully type-safe:
- All React Router types are preserved
- TypeScript ensures correct usage of hooks and components
- Route parameters are type-checked
- Loader data flows through type-safe contexts

## Consequences

### Positive

1. **Zero application code changes required** - All 253 route files work unchanged
2. **Fast migration** - Completed in days vs. weeks of rewriting
3. **Preserved patterns** - Team can continue using familiar React Router patterns
4. **Type safety maintained** - Full TypeScript support throughout
5. **Testing unchanged** - Existing tests continue to work with MemoryRouter
6. **Future flexibility** - Can migrate incrementally to App Router if desired
7. **Best of both worlds** - React Router DX with Next.js deployment benefits

### Negative

1. **Maintenance burden** - Custom code must be maintained alongside Next.js updates
2. **Documentation overhead** - New team members must understand both systems
3. **Debugging complexity** - Issues may span compatibility layer and Next.js
4. **Bundle size** - Additional ~15-20KB for compatibility layer (acceptable for this use case)
5. **Performance overhead** - Minor route matching overhead (mitigated by SSG)
6. **Next.js feature limitations** - Cannot use App Router-specific features (Server Actions, streaming RSC)
7. **Upgrade friction** - Next.js upgrades require testing compatibility layer

### Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Next.js breaking changes | High | Medium | Comprehensive test suite, version pinning |
| React Router drift | Medium | Low | Layer is self-contained, stable API |
| Performance degradation | Medium | Low | Monitoring, static generation, caching |
| Maintenance burden | High | High | Documentation, tests, single ownership |
| Team knowledge gap | Medium | Medium | ADR documentation, training, code comments |

## Alternatives Considered

### Option A: Full Migration to Next.js App Router

**Description:** Rewrite all 253 routes to use Next.js App Router patterns (Server Components, route handlers, metadata exports).

**Pros:**
- Native Next.js patterns
- Access to all App Router features
- No compatibility layer maintenance
- Smaller bundle size

**Cons:**
- **4-6 weeks of development time**
- High risk of introducing bugs during rewrite
- Requires retraining team on App Router patterns
- Interrupts feature development for extended period
- May miss deadline for project requirements

**Decision:** Rejected due to timeline constraints and risk.

### Option B: Stay on React Router v7 with Remix or React Router SPA

**Description:** Continue using pure React Router v7 without Next.js, either with Remix or as a Single Page Application.

**Pros:**
- No compatibility layer needed
- Native React Router patterns
- Simpler architecture

**Cons:**
- Loses Next.js ecosystem benefits (Image optimization, deployment, tooling)
- Remix requires different deployment infrastructure
- SPA mode loses SEO benefits
- Cloudflare Pages deployment is optimized for Next.js
- Team already invested in Next.js tooling

**Decision:** Rejected because Next.js benefits outweigh the compatibility layer cost.

### Option C: Incremental Migration

**Description:** Gradually migrate routes from React Router to App Router over time.

**Pros:**
- Spreads work over time
- Lower risk per change
- Team learns App Router gradually

**Cons:**
- Two routing systems coexist (higher complexity)
- Longer period of technical debt
- Difficult to maintain consistency
- Coordination overhead for partial migration
- Still requires compatibility layer for unmigrated routes

**Decision:** Rejected due to complexity of running dual routing systems.

## Implementation History

### Phase 1: Core Compatibility (Completed)
- Implemented `router-state.tsx` with contexts and types
- Created `route-runtime.ts` with matching algorithm
- Built `react-router-dom.tsx` hook implementations
- Generated `route-modules.ts` registry
- Developed `RouteRenderer.tsx` for SSR

### Phase 2: Next.js Integration (Completed)
- Created minimal App Router structure
- Implemented catch-all routes for dynamic matching
- Connected compatibility layer to Next.js page rendering
- Set up static generation for all routes

### Phase 3: Testing & Validation (Completed)
- Verified all 253 routes render correctly
- Tested loader execution and data flow
- Validated metadata generation
- Confirmed multilingual routing works
- Performance testing and optimization

### Phase 4: Documentation (In Progress - This ADR)
- Document architectural decisions
- Create maintenance guide for Next.js upgrades
- Add comprehensive test coverage
- Training materials for team

## Maintenance Guidelines

### When to Update Compatibility Layer

1. **Next.js major version upgrades** - Test thoroughly, expect breaking changes
2. **React Router API changes** - Rare, but monitor for deprecations
3. **Performance issues discovered** - Profile and optimize matching/rendering
4. **Type errors after dependency updates** - Update type definitions

### Critical Files to Monitor

- `next/link` - Used by `<Link>` component wrapper
- `next/dynamic` - Used for route component loading
- `next/head` - Used for metadata rendering
- `@react-router/dev/routes` - Used for route configuration

### Testing Strategy

1. **Unit tests** - Test route matching, loader execution, hook behavior
2. **Integration tests** - Test full page rendering with Next.js
3. **E2E tests** - Verify critical user flows work end-to-end
4. **Visual regression** - Ensure no visual changes during updates

### Future Migration Path

If/when the team decides to migrate to native App Router:

1. Create parallel App Router routes alongside compat layer
2. Migrate high-traffic routes first for maximum impact
3. Use feature flags to switch between systems
4. Migrate shared components to work with both systems
5. Remove compatibility layer once all routes migrated

## References

- [Brikette Improvement Plan](../brikette-improvement-plan.md) - Section 1.1
- [Next.js Documentation](https://nextjs.org/docs)
- [React Router v7 Documentation](https://reactrouter.com/en/main)
- Implementation: `apps/brikette/src/compat/`
- Route configuration: `apps/brikette/src/routes.tsx`

## Approval

This ADR was reviewed and approved by the engineering team on 2026-01-12.

**Signed off by:**
- Engineering Lead
- Technical Architect
- Platform Team

---

**Next Review Date:** 2026-07-12 (6 months)
**Review Trigger:** Next.js major version upgrade or React Router v8 release
