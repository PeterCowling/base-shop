---
Type: Micro-Build
Status: Archived
Created: 2026-03-08
Last-updated: 2026-03-08
Feature-Slug: xa-b-hermes-nav-taxonomy
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260308-XAB-NAV-001
Related-Plan: none
---

# xa-b Hermès Nav Taxonomy Micro-Build

## Scope
- Change: Replace generic fashion-retail nav labels with Hermès bags-only taxonomy — department display labels (Iconic/Everyday/Mini), bag subcategories (Hermès bag families), remove Brands from secondary nav and mega menu.
- Non-goals: No routing changes, no new pages, no type definition changes (XaDepartment/XaCategory slugs preserved as route identifiers), no changes outside nav layer.

## Execution Contract
- Affects:
  - apps/xa-b/src/lib/xaCatalog.ts (add XA_DEPARTMENT_LABELS, update XA_SUBCATEGORIES.bags)
  - apps/xa-b/src/components/XaShell.tsx (use XA_DEPARTMENT_LABELS, remove Brands link)
  - apps/xa-b/src/components/XaMegaMenu.tsx (use XA_DEPARTMENT_LABELS, remove Brands column)
- Acceptance checks:
  - Primary nav labels show "Iconic", "Everyday", "Mini" (not Women/Men/Kids)
  - Mega menu subcategories list Hermès bag families (Birkin, Kelly, etc.)
  - Secondary nav has no "Brands" link
  - Mega menu has no "Brands" column
  - pnpm --filter xa-b typecheck passes with no errors
- Validation commands: pnpm --filter xa-b typecheck
- Rollback note: Revert the three changed files; no DB or config changes.

## Outcome Contract
- **Why:** xa-b is being positioned as a Hermès bags-only boutique; generic multi-brand fashion nav taxonomy misrepresents the product world.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** xa-b header nav displays Hermès-specific tier labels and bag families; Brands link/column removed.
- **Source:** operator
