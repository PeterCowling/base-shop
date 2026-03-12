---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: "2026-03-12"
Last-reviewed: "2026-03-12"
Last-updated: "2026-03-12"
Build-completed: "2026-03-12"
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: caryina-storefront-customer-experience
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 93%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: None — scope is bounded integration work with no option comparison needed
---

# Caryina Storefront Customer Experience Plan

## Summary

Two customer-facing gaps on the Caryina storefront need closing: (1) no language switcher despite en/de/it support, and (2) product pages missing materials, dimensions, and weight despite the rendering code already being in place. Both tasks are small, independent, and use existing components and schema fields. TASK-01 imports `@acme/ui/LanguageSwitcher` into the Header. TASK-02 populates the three missing data fields in `products.json` for all 3 products.

## Active tasks
- [x] TASK-01: Add LanguageSwitcher to Caryina Header
- [x] TASK-02: Add product physical specs to products.json

## Goals
- Language switcher visible in header on all pages
- Materials, dimensions, and weight displayed on every PDP

## Non-goals
- Redesign header navigation
- Add new locales beyond en/de/it
- Make language switcher preserve current page path (follow-up)
- Rewrite the product data pipeline

## Constraints & Assumptions
- Constraints:
  - Must use existing `@acme/ui/LanguageSwitcher` component directly
  - Product data fields must conform to existing SKU Zod schema (`materials`, `dimensions`, `weight`)
- Assumptions:
  - Reasonable placeholder specs can be used pending operator verification of actual physical measurements
  - Header has visual space for a language switcher (component is small inline text)

## Inherited Outcome Contract

- **Why:** The site supports three languages but customers have no way to switch. Product pages show images and price but no physical details — customers can't judge what they're buying. Both gaps reduce purchase confidence and block non-English conversion.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Language switcher visible in header on all pages; materials, dimensions, and weight displayed on all PDPs.
- **Source:** operator

## Analysis Reference
- Related analysis: None — no formal analysis artifact produced
- Selected approach inherited:
  - Direct integration of existing shared component and data population
- Key reasoning used:
  - Both gaps have existing components and rendering code; no architectural decision or option comparison needed. Fact-find confirmed this at 95% implementation confidence.

## Selected Approach Summary
- What was chosen:
  - TASK-01: Import and render `@acme/ui/LanguageSwitcher` in `Header.tsx` with `current={lang}`
  - TASK-02: Add `materials`, `dimensions`, `weight` fields to all 3 products in `data/shops/caryina/products.json`
- Why planning is not reopening option selection:
  - The fact-find confirmed both gaps are bounded integration work with no design ambiguity. Components exist, schema supports the fields, rendering code is conditional and ready.

## Fact-Find Support
- Supporting brief: `docs/plans/caryina-storefront-customer-experience/fact-find.md`
- Evidence carried forward:
  - `@acme/ui/LanguageSwitcher` renders inline `EN | DE | IT` links, accepts `current` prop
  - Header at `apps/caryina/src/components/Header.tsx` has an icon cluster div where switcher fits naturally
  - PDP at `apps/caryina/src/app/[lang]/product/[slug]/page.tsx:164-198` conditionally renders details section when all three fields present
  - SKU schema defines optional `materials`, `dimensions`, `weight` fields
  - `data/shops/caryina/products.json` has 3 products, all missing these fields

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add LanguageSwitcher to Header | 95% | S | Complete (2026-03-12) | - | - |
| TASK-02 | IMPLEMENT | Add product physical specs to products.json | 90% | S | Complete (2026-03-12) | - | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | LanguageSwitcher rendered in header; details section activates on PDP | TASK-01, TASK-02 | Visual fit verified: component is inline text, header has space |
| UX / states | Switcher links to homepage (not current path); PDP details hidden when data missing (graceful degradation) | TASK-01, TASK-02 | Path-preservation noted as follow-up |
| Security / privacy | N/A | - | No auth or sensitive data involved |
| Logging / observability / audit | N/A | - | No logging changes needed |
| Testing / validation | PDP test with materials data populated | TASK-02 | Existing PDP test suite extended |
| Data / contracts | products.json fields conform to SKU Zod schema | TASK-02 | Schema already defines optional fields |
| Performance / reliability | N/A | - | Static data, no perf concern |
| Rollout / rollback | N/A | - | Simple deploy, instant rollback via revert |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | - | Independent: different files, no shared state |

## Delivered Processes

None: no material process topology change.

## Tasks

### TASK-01: Add LanguageSwitcher to Caryina Header
- **Type:** IMPLEMENT
- **Deliverable:** code-change to `apps/caryina/src/components/Header.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-12)
- **Affects:** `apps/caryina/src/components/Header.tsx`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% - component exists, single import + render
  - Approach: 98% - no design ambiguity
  - Impact: 90% - directly enables non-EN conversion
- **Acceptance:**
  - [ ] `LanguageSwitcher` renders in header on all pages
  - [ ] Current locale is visually highlighted (bold/underline)
  - [ ] Clicking a locale navigates to `/{locale}` homepage
  - **Expected user-observable behavior:**
    - [ ] User sees `EN | DE | IT` text links in the header icon cluster area
    - [ ] Current language is visually distinct (underlined/bold)
    - [ ] Clicking a different language loads the site in that language
- **Engineering Coverage:**
  - UI / visual: Required - render LanguageSwitcher in header icon cluster, before theme toggle
  - UX / states: Required - current locale highlighted; links to homepage only (path-preservation is follow-up)
  - Security / privacy: N/A - no auth or sensitive data
  - Logging / observability / audit: N/A - no logging needed
  - Testing / validation: N/A - low-risk single import; visual verification sufficient
  - Data / contracts: N/A - no data changes
  - Performance / reliability: N/A - static render
  - Rollout / rollback: N/A - revert single file
- **Validation contract (TC-01):**
  - TC-01: Header renders on `/en` -> LanguageSwitcher visible with EN highlighted
  - TC-02: Header renders on `/de` -> LanguageSwitcher visible with DE highlighted
  - TC-03: Click IT link -> navigates to `/it` homepage
- **Execution plan:**
  1. Import `LanguageSwitcher` from `@acme/ui/LanguageSwitcher` and `Locale` from `@acme/i18n/locales`
  2. Render `<LanguageSwitcher current={lang as Locale} />` in the icon cluster div, before `<HeaderThemeToggle />`
  3. Visual verification on dev server
- **Planning validation (required for M/L):** None: S effort
- **Scouts:** None: component API verified in fact-find
- **Edge Cases & Hardening:** None: component handles all 3 locales, no error states possible
- **What would make this >=90%:**
  - Already at 95%
- **Rollout / rollback:**
  - Rollout: deploy with next release
  - Rollback: revert single file change
- **Documentation impact:** None
- **Post-build QA:** Run targeted visual check of header at mobile and desktop breakpoints
- **Notes / references:**
  - `packages/ui/src/components/molecules/LanguageSwitcher.tsx` — component source
  - Fact-find note: switcher links to homepage only, path-preservation is a follow-up

### TASK-02: Add product physical specs to products.json
- **Type:** IMPLEMENT
- **Deliverable:** code-change to `data/shops/caryina/products.json`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-12)
- **Affects:** `data/shops/caryina/products.json`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% - data fields match existing schema
  - Approach: 95% - no ambiguity
  - Impact: 85% - product details increase purchase confidence
- **Acceptance:**
  - [ ] All 3 products in products.json have `materials`, `dimensions`, and `weight` fields
  - [ ] Fields conform to SKU Zod schema types
  - [ ] PDP renders "Details" section with Material, Dimensions, Weight, Origin
  - **Expected user-observable behavior:**
    - [ ] User sees a "Details" section on every product page below the trust strip
    - [ ] Material description shown in the user's selected language
    - [ ] Dimensions shown as H x W x D in mm
    - [ ] Weight shown in grams
- **Engineering Coverage:**
  - UI / visual: Required - PDP details section activates when all three fields present (existing conditional at line 164)
  - UX / states: Required - details section hidden when fields missing (graceful degradation already in place)
  - Security / privacy: N/A - no sensitive data
  - Logging / observability / audit: N/A - no logging needed
  - Testing / validation: Required - extend PDP test mock to include materials/dimensions/weight, verify details section renders
  - Data / contracts: Required - fields must match SKU schema: `materials: { en, de?, it? }`, `dimensions: { h, w, d, unit: "mm" }`, `weight: { value, unit: "g" }`
  - Performance / reliability: N/A - static JSON data
  - Rollout / rollback: N/A - revert data file
- **Validation contract (TC-02):**
  - TC-01: Load PDP for silver product -> "Details" section visible with Material, Dimensions, Weight, Origin
  - TC-02: Load PDP in DE locale -> Material text shows German description
  - TC-03: All 3 products have details section visible
  - TC-04: PDP test with materials data in mock -> details section renders
- **Execution plan:**
  1. Add `materials` (multilingual), `dimensions` (h/w/d/mm), `weight` (value/g) to all 3 products in `data/shops/caryina/products.json`
  2. Use reasonable placeholder specs: faux leather with metal hardware, ~80x60x30mm, ~45g (these are mini bag charms)
  3. Extend PDP test mock to include new fields and verify details section renders
  4. Visual verification on dev server
- **Planning validation (required for M/L):** None: S effort
- **Scouts:** None: schema verified in fact-find, PDP rendering code verified at lines 164-198
- **Edge Cases & Hardening:**
  - Materials field uses locale fallback to EN when translation missing (already handled at PDP line 176-177)
  - Details section only renders when ALL three fields present (existing guard at line 164)
- **What would make this >=90%:**
  - Operator confirms actual physical specs (currently using reasonable estimates)
- **Rollout / rollback:**
  - Rollout: deploy with next release
  - Rollback: revert data file
- **Documentation impact:** None
- **Post-build QA:** Run targeted visual check of PDP details section at mobile and desktop breakpoints
- **Notes / references:**
  - Open operator question: actual materials, dimensions, weight (using reasonable defaults)
  - `apps/caryina/src/app/[lang]/product/[slug]/page.tsx:164-198` — conditional rendering code
  - `packages/types/src/Product.ts` — SKU schema

## Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| LanguageSwitcher links to homepage, not current path | Medium | Low | Acceptable for launch; path-preservation is a follow-up |
| Product specs inaccurate if using defaults | Medium | Low | Mark as estimates; verify before marketing push |
| LanguageSwitcher visual clash with header layout | Low | Low | Component is small inline text; test visually |

## Observability
- Logging: None needed
- Metrics: None needed
- Alerts/Dashboards: None needed

## Acceptance Criteria (overall)
- [ ] Language switcher visible in header on all pages with current locale highlighted
- [ ] All 3 PDPs show Details section with Material, Dimensions, Weight, Origin
- [ ] Existing tests pass; new PDP test case with materials data passes

## Decision Log
- 2026-03-12: No analysis stage needed — fact-find confirmed bounded integration work with no option comparison. Both tasks use existing components/schema/rendering code.
- 2026-03-12: Product specs use reasonable placeholder values pending operator verification.
- 2026-03-12: Path-preserving language switcher deferred as follow-up — homepage linking acceptable for 3-product site launch.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Add LanguageSwitcher to Header | Yes | None | No |
| TASK-02: Add product physical specs | Yes | None | No |

## Overall-confidence Calculation
- TASK-01: 95% * S(1) = 95
- TASK-02: 90% * S(1) = 90
- Overall = (95 + 90) / 2 = 93%
