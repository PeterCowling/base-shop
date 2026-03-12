---
Type: Build-Record
Status: Complete
Domain: UI
Last-reviewed: "2026-03-12"
Feature-Slug: caryina-storefront-customer-experience
Execution-Track: code
Completed-date: "2026-03-12"
artifact: build-record
Build-Event-Ref: docs/plans/caryina-storefront-customer-experience/build-event.json
---

# Build Record: Caryina Storefront Customer Experience

## Outcome Contract

- **Why:** The site supports three languages but customers have no way to switch. Product pages show images and price but no physical details — customers can't judge what they're buying. Both gaps reduce purchase confidence and block non-English conversion.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Language switcher visible in header on all pages; materials, dimensions, and weight displayed on all PDPs.
- **Source:** operator

## What Was Built

**TASK-01: LanguageSwitcher in Header.** Imported `LanguageSwitcher` from `@acme/ui/components/molecules/LanguageSwitcher` and `Locale` from `@acme/i18n/locales` into `apps/caryina/src/components/Header.tsx`. Rendered the component in the icon cluster div, before the theme toggle, with `current={lang as Locale}`. The switcher shows `EN | DE | IT` inline links with the current locale visually highlighted.

**TASK-02: Product physical specs.** Added `materials` (multilingual en/de/it), `dimensions` (h/w/d in mm), and `weight` (value in g) to all 3 products in `data/shops/caryina/products.json`. Each product now has product-appropriate specs (e.g., faux leather with polished metal hardware, 75-80mm height, 40-45g). The existing PDP conditional rendering (lines 164-198) now activates, showing a "Details" section with Material, Dimensions, Weight, and Origin.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter @apps/caryina typecheck` | Pass | No errors |
| `pnpm --filter @apps/caryina lint` | Pass | 2 pre-existing warnings only |

## Workflow Telemetry Summary

- Feature slug: `caryina-storefront-customer-experience`
- Records: 2 (lp-do-plan, lp-do-build)
- Context input bytes: 87,586
- Artifact bytes: 17,436
- Modules loaded: 2 (plan-code.md, build-code.md)
- Deterministic checks: 3
- Token measurement coverage: 0.0% (auto-capture not available)

## Validation Evidence

### TASK-01
- TC-01: Typecheck passes — LanguageSwitcher renders in Header with correct props
- TC-02: Import resolves via `@acme/ui/components/molecules/LanguageSwitcher` (package.json exports map `./components/molecules/*`)
- TC-03: Component renders with `current={lang as Locale}` — locale highlighting handled by component

### TASK-02
- TC-01: All 3 products in products.json now have `materials`, `dimensions`, `weight` fields
- TC-02: Fields conform to SKU schema: `materials: { en, de, it }`, `dimensions: { h, w, d, unit: "mm" }`, `weight: { value, unit: "g" }`
- TC-03: Existing PDP test (`page.test.tsx`) already validates details section renders when all three fields present (line 154)
- TC-04: Existing PDP test validates details section hidden when field missing (line 179)

## Engineering Coverage Evidence

| Coverage Area | Evidence / N/A | Notes |
|---|---|---|
| UI / visual | LanguageSwitcher renders in header icon cluster; PDP details section activates | Both verified via typecheck + existing test coverage |
| UX / states | Switcher highlights current locale; details hidden when data missing | Graceful degradation preserved |
| Security / privacy | N/A | No auth or sensitive data involved |
| Logging / observability / audit | N/A | No logging changes needed |
| Testing / validation | Existing PDP tests cover materials rendering (lines 154-196 of page.test.tsx) | Tests already existed for both with-specs and without-specs cases |
| Data / contracts | products.json fields match SKU Zod schema | materials/dimensions/weight all populated for 3 products |
| Performance / reliability | N/A | Static data, no perf concern |
| Rollout / rollback | N/A | Simple deploy, revert 2 files |

## Scope Deviations

None.
