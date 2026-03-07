# Critique History — xa-uploader-loading-skeleton

## Round 1
- **Route**: codemoot
- **Score**: 7/10 → lp_score 3.5
- **Verdict**: needs_revision
- **Findings**: 0 Critical, 2 Major, 1 Minor
- **Major 1**: `isLoading={products.length === 0 && session?.authenticated}` is not a truthful loading signal — conflates loading, empty, and error states; needs load-completion-aware flag
- **Major 2**: DS Skeleton `bg-muted` incompatibility claim was inaccurate — live usage confirmed in 3 components (`CatalogSyncPanel`, `CurrencyRatesPanel`, `CatalogProductForm`); `--color-muted` provided by base theme import
- **Minor 1**: `bg-gate-surface` skeleton fill has weak contrast inside panel containers

**Fixes applied**: Corrected DS Skeleton compatibility claim. Added `isCatalogLoading` flag requirement. Noted `bg-gate-surface` contrast issue.

---

## Round 2
- **Route**: codemoot
- **Score**: 5/10 → lp_score 2.5
- **Verdict**: needs_revision
- **Findings**: 1 Critical, 2 Major, 0 Minor
- **Critical**: `isCatalogLoading` naive toggle is incorrect — `loadCatalog()` is reused in save/delete/sync actions (`catalogConsoleActions.ts:376`, `441`, `609`); toggling on all calls would flash skeleton on every action
- **Major 1**: Scope statement inconsistency — goals said "two component files" but document requires hook change in `useCatalogConsole.client.ts`
- **Major 2**: `SKELETON_BLOCK_CLASS` used `bg-gate-border` which does not exist as a `bg-*` utility; conflicts with line 176 guidance

**Fixes applied**: One-shot `isInitialCatalogLoading` pattern introduced. Scope goals updated to include hook. `bg-gate-border` replaced with `bg-gate-surface border border-gate-border`.

---

## Round 3 (Final)
- **Route**: codemoot
- **Score**: 7/10 → lp_score 3.5
- **Verdict**: needs_revision (post-round fixes applied)
- **Findings**: 0 Critical, 2 Major, 1 Minor
- **Major 1**: "Initial-load-only" flag too narrow — storefront-change path also clears products before refetch (`catalogConsoleActions.ts:140–175`; `useCatalogConsole.client.ts:207–215`); flag must cover storefront switches too
- **Major 2**: `bg-gate-border` contradiction still present in constraints section vs resolved in another section
- **Minor 1**: Inline `animate-pulse` drops DS Skeleton's `motion-reduce:animate-none` accessibility guard

**Post-round fixes applied**: `isCatalogHydrating` flag expanded to cover session-auth AND storefront-change effects. Constraint contradiction resolved to single supported pattern (`bg-gate-surface border border-gate-border`). `motion-reduce:animate-none` added to planning constraints and task seeds.

**Final assessment**: Round 3 score 3.5 (partially credible). All Critical findings resolved. Remaining findings were both advisory in nature (planning completeness gaps addressed by in-place fixes). The brief is credible for planning after post-round fixes — no structural infeasibility, no unresolved blockers.
