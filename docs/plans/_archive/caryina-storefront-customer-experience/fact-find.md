---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: UI
Workstream: Engineering
Created: "2026-03-12"
Last-updated: "2026-03-12"
Feature-Slug: caryina-storefront-customer-experience
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/caryina-storefront-customer-experience/analysis.md
Dispatch-IDs: IDEA-DISPATCH-20260312140500-0006, IDEA-DISPATCH-20260312140500-0007
Work-Package-Reason: Both are Caryina storefront customer experience gaps from the same UX audit — language switcher and product details — targeting the same app and same customer journey
---

# Caryina Storefront Customer Experience Fact-Find

## Scope

### Summary
Two gaps identified during a customer walkthrough of the Caryina storefront:
1. **Language switcher**: The site supports en/de/it but has no UI element allowing customers to switch locale.
2. **Product details**: Product pages lack materials, dimensions, and weight information. The rendering code already exists but the data is missing from products.json.

### Goals
- Add a visible language switcher to the site header
- Display materials, dimensions, and weight on every PDP

### Non-goals
- Redesign the header navigation
- Add new locales beyond the existing en/de/it trio
- Rewrite the product data pipeline

### Constraints & Assumptions
- Constraints:
  - Must use existing `@acme/ui/LanguageSwitcher` or adapt it (no new design-system component)
  - Product data fields must conform to the existing `SKU` Zod schema (`materials`, `dimensions`, `weight`)
- Assumptions:
  - The operator can provide accurate materials, dimensions, and weight for all 3 products
  - The existing header has visual space for a language switcher

## Outcome Contract

- **Why:** The site supports three languages but customers have no way to switch. Product pages show images and price but no physical details — customers can't judge what they're buying. Both gaps reduce purchase confidence and block non-English conversion.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Language switcher visible in header on all pages; materials, dimensions, and weight displayed on all PDPs.
- **Source:** operator

## Current Process Map

None: local code path only.

## Evidence Audit (Current State)

### Entry Points
- `apps/caryina/src/components/Header.tsx` — site header, no language switcher currently
- `apps/caryina/src/app/[lang]/product/[slug]/page.tsx` — PDP, already renders materials/dimensions/weight conditionally (lines 164-198)

### Key Modules / Files
- `packages/ui/src/components/molecules/LanguageSwitcher.tsx` — existing shared component, renders inline `EN | DE | IT` links
- `packages/types/src/Product.ts` — SKU schema with optional `materials`, `dimensions`, `weight` fields
- `data/shops/caryina/products.json` — product catalog, descriptions present, materials/dimensions/weight missing
- `apps/caryina/src/lib/contentPacket.ts` — loads chrome strings including header text
- `packages/i18n/src/locales.ts` — locale constants and resolution (`resolveLocale()`)

### Patterns & Conventions Observed
- **LanguageSwitcher links to `/${locale}` (homepage)** — does not preserve current page path. For a 3-product site this is acceptable as a first pass, but path-preserving variant would be better UX.
  - Evidence: `packages/ui/src/components/molecules/LanguageSwitcher.tsx:15`
- **PDP conditional details section** — renders only when all three fields (materials AND dimensions AND weight) are truthy.
  - Evidence: `apps/caryina/src/app/[lang]/product/[slug]/page.tsx:164`
- **Materials field is multilingual** — `{ en: string, de?: string, it?: string }` with locale fallback to EN.
  - Evidence: `apps/caryina/src/app/[lang]/product/[slug]/page.tsx:176-177`
- **Descriptions already render** — line 122 renders `product.description`, which is multilingual in products.json (en/de/it).
  - Evidence: `apps/caryina/src/app/[lang]/product/[slug]/page.tsx:122`

### Data & Contracts
- Types/schemas:
  - `materials?: { en: string; de?: string; it?: string }` — optional in SKU schema
  - `dimensions?: { h: number; w: number; d: number; unit: "mm" }` — optional in SKU schema
  - `weight?: { value: number; unit: "g" }` — optional in SKU schema
- Persistence:
  - `data/shops/caryina/products.json` — flat JSON file, 3 products
- API/contracts:
  - Products loaded via `readShopSkuBySlug()` → `getShopSkuBySlug()` from platform-core

### Dependency & Impact Map
- Upstream dependencies:
  - `@acme/ui/LanguageSwitcher` — shared component, no changes needed
  - `@acme/types` SKU schema — already supports the fields
- Downstream dependents:
  - PDP rendering — already conditionally handles the fields
- Likely blast radius:
  - Header.tsx (add import + render)
  - products.json (add 3 data fields per product)

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest + React Testing Library
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/caryina/jest.config.cjs`
- CI integration: `caryina.yml` workflow runs tests

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| PDP | Unit | `apps/caryina/src/app/[lang]/product/[slug]/page.test.tsx` | Tests product rendering, mocks SKU data |
| Header | None | — | No dedicated header tests |

#### Coverage Gaps
- No test for language switcher visibility in header
- No test for materials/dimensions rendering on PDP with populated data

#### Recommended Test Approach
- Unit tests for: PDP rendering with materials/dimensions/weight populated
- Visual check: language switcher renders in header

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | LanguageSwitcher component exists; PDP details section exists | Need to integrate switcher into Header; data missing for details section | Verify visual fit of switcher in header |
| UX / states | Required | PDP hides details section when data missing (graceful degradation) | Switcher links to homepage, doesn't preserve current path | Note path-preservation as follow-up |
| Security / privacy | N/A | No auth/sensitive data involved | — | — |
| Logging / observability / audit | N/A | No logging changes needed | — | — |
| Testing / validation | Required | PDP tests exist but mock without materials data | Add test case with materials populated | Ensure test mocks include new fields |
| Data / contracts | Required | SKU schema already defines optional materials/dimensions/weight | products.json needs data populated | Operator must supply accurate physical specs |
| Performance / reliability | N/A | Static data, no perf concern | — | — |
| Rollout / rollback | N/A | Data change + small UI addition, instant rollback via revert | — | — |

## Questions

### Resolved
- Q: Does a language switcher component already exist?
  - A: Yes. `@acme/ui/LanguageSwitcher` renders inline `EN | DE | IT` links.
  - Evidence: `packages/ui/src/components/molecules/LanguageSwitcher.tsx`
- Q: Are product descriptions already in the data?
  - A: Yes. All 3 products have multilingual descriptions (en/de/it) and they already render on line 122 of the PDP.
  - Evidence: `data/shops/caryina/products.json`, `apps/caryina/src/app/[lang]/product/[slug]/page.tsx:122`
- Q: Does the PDP already have UI for materials/dimensions/weight?
  - A: Yes. Lines 164-198 conditionally render a "Details" section when all three fields are present.
  - Evidence: `apps/caryina/src/app/[lang]/product/[slug]/page.tsx:164-198`
- Q: Should the language switcher preserve the current page path?
  - A: The existing component links to `/${locale}` (homepage). For a 3-product site this is acceptable. Path-preservation can be a follow-up.
  - Evidence: `packages/ui/src/components/molecules/LanguageSwitcher.tsx:15`

### Open (Operator Input Required)
- Q: What are the actual materials, dimensions, and weight for each product?
  - Why operator input is required: Physical product specifications are real-world facts not derivable from code
  - Decision impacted: Data accuracy in products.json
  - Decision owner: Product owner / operator
  - Default assumption: Reasonable estimates can be used as placeholders (e.g., "Faux leather with metal hardware", 80x60x30mm, 45g) with a note to verify before launch

## Confidence Inputs
- Implementation: 95% — components and rendering code already exist; just need integration and data
- Approach: 95% — no design ambiguity, patterns are established
- Impact: 85% — language switcher directly enables non-EN conversion; product details increase purchase confidence
- Delivery-Readiness: 90% — blocked only by operator-supplied product specs (can use reasonable defaults)
- Testability: 85% — existing test infrastructure, straightforward to add cases

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| LanguageSwitcher links to homepage, not current path | Medium | Low | Acceptable for launch; path-preservation is a follow-up |
| Product specs inaccurate if using defaults | Medium | Low | Mark as estimates; verify before marketing push |
| LanguageSwitcher visual clash with header layout | Low | Low | Component is small inline text; test visually |

## Planning Constraints & Notes
- Must-follow patterns:
  - Use `@acme/ui/LanguageSwitcher` component directly
  - Product data must match SKU Zod schema for `materials`, `dimensions`, `weight`
- Rollout: Simple deploy, no migration needed
- Observability: None needed for these changes

## Suggested Task Seeds (Non-binding)
- TASK-01: Add LanguageSwitcher to Caryina Header component
- TASK-02: Add materials, dimensions, and weight to all 3 products in products.json
- TASK-03: Verify PDP renders details section correctly with new data

## Execution Routing Packet
- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package: LanguageSwitcher visible in header; details section visible on all 3 PDPs
- Post-delivery measurement plan: Visual verification on dev server

## Scope Signal
- Signal: right-sized
- Rationale: Both gaps have existing components/rendering code. The work is bounded to one header import and one data file update. No architectural decisions needed.

## Evidence Gap Review

### Gaps Addressed
- Confirmed LanguageSwitcher component exists and is usable
- Confirmed PDP already has conditional rendering for materials/dimensions/weight
- Confirmed product descriptions already exist and render
- Confirmed SKU schema supports the required fields

### Confidence Adjustments
- None needed — evidence is complete for both gaps

### Remaining Assumptions
- Product physical specifications (materials, dimensions, weight) will use reasonable defaults pending operator verification

## Rehearsal Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Header integration | Yes | None | No |
| LanguageSwitcher component | Yes | Links to homepage only, not current path | No (acceptable for launch) |
| Product data schema | Yes | None | No |
| PDP rendering code | Yes | None | No |
| Test coverage | Partial | No header tests exist | No (low risk) |

## Analysis Readiness
- Status: Ready-for-analysis
- Blocking items: None
- Recommended next step: `/lp-do-analysis caryina-storefront-customer-experience`
