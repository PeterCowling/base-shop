---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: PRODUCTS
Workstream: Mixed
Created: 2026-02-28
Last-updated: 2026-02-28
Feature-Slug: hbag-pdp-material-specs
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/hbag-pdp-material-specs/plan.md
Dispatch-ID: IDEA-DISPATCH-20260228-0004
Trigger-Source: dispatch-routed
Trigger-Why: At €80–€150, material specificity is core to price justification. Buyers deliberate 3–7 days and want to know exactly what they're getting. Missing specs create uncertainty that undermines the premium positioning.
Trigger-Intended-Outcome: type: operational | statement: Add material specs, dimensions (mm), and weight to the product data schema and all 3 SKU descriptions; surface these fields on the PDP; no vague finish adjectives remain as the sole material claim | source: operator
---

# HBAG PDP Material Specs Fact-Find

## Scope

### Summary

Product descriptions for all three Caryina SKUs use vague finish adjectives ("metallic silver", "polished hardware accents", "textured finish") with no alloy type, plating standard, dimensions in mm, or weight. At €80–€150 for a considered purchase with a 3–7 day deliberation cycle, missing material specificity is a conversion risk. The world-class scan (2026-02-28) confirmed this as a major gap in the product-storytelling domain.

This fact-find scopes the work needed to: (1) extend the product data schema with structured `materials`, `dimensions`, and `weight` fields, (2) populate those fields for the 3 launch SKUs with verified copy, (3) surface the new fields on the PDP, and (4) update the content packet so future materializer runs preserve them.

### Goals
- Add optional `materials`, `dimensions`, and `weight` fields to the product data schema (`ProductCore` / `ProductPublication` types and `products.json` JSON shape)
- Write factual material/dimension copy for the 3 current SKUs (Silver, Rose Splash, Peach)
- Render material and dimension data in a dedicated section on the PDP (below the proof bullets, above or integrated with shipping/returns)
- Update `HBAG-content-packet.md` evidence constraints column to reflect that material data is now confirmed (documentation sync only — not a build dependency; `site-content.generated.json` is not touched)
- Lock in the provenance claim as "Designed in Positano" — never "Made in Italy"

### Non-goals
- Adding specs for deferred SKUs (H2 AirPod Holder variants, H3–H5)
- Resolving the separate IDEA-DISPATCH-20260228-0003 (proof bullets showing placeholder copy) — parallel plan
- UX redesign of the PDP layout (spec data slots into the existing layout)
- Internationalising new spec fields beyond EN, DE, IT (same locale set already present)

### Constraints & Assumptions
- Constraints:
  - "Made in Italy" cannot be claimed — manufacturing is China-based. Italian Law 166/2009 and EU origin marking law prohibit this. "Designed in Positano, Italy" is the correct and defensible claim.
  - The `skuSchema` in `packages/types/src/Product.ts` is `.strict()` — adding new fields to the SKU type requires schema change; any new field must be explicitly added.
  - `ProductCore` and `ProductPublication` interfaces in `packages/types/src/Product.ts` are separate from the Zod `skuSchema` — both require updating.
  - Material data from the supplier is currently UNKNOWN (per `2026-02-22-product-from-photo.user.md` §2.3). The product spec doc classifies material substrate as APPARENT (leather-like) but not confirmed. This is the primary blocker for factual claims.
  - Hardware finish alloy type is also UNKNOWN; gold-tone appearance is APPARENT but not specified.
  - Dimensions are absent from all product documentation — no scale reference shot exists, no mm measurements are stated anywhere.
- Assumptions:
  - The operator (Pete) can supply material and dimension data from the supplier before or during the build phase (the plan task should include a data-gathering step as TASK-01 with a concrete capture template).
  - Reasonable interim placeholder values can be used in schema extension tasks, with a gate that prevents publishing until operator-confirmed values are in place.
  - The materializer (HBAG-content-packet.md → site-content.generated.json) does not need to generate `materials`/`dimensions`/`weight` — these live in `products.json` as structured product-data fields, not in the content packet.

## Outcome Contract

- **Why:** At €80–€150 with a 3–7 day deliberation cycle, buyers need explicit material and size information to justify the price. Vague finish adjectives create uncertainty and reduce trust for a brand with no physical retail presence or established reputation.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Material specs (exterior material, hardware finish standard), product dimensions (H × W × D in mm), and weight appear as structured fields in `data/shops/caryina/products.json` and are rendered on the PDP for all 3 launch SKUs. No vague finish adjective remains as the only material claim. Provenance is "Designed in Positano, Italy" throughout.
- **Source:** operator

## Access Declarations

| Source | Access Type | Status |
|---|---|---|
| `data/shops/caryina/products.json` | Read/write (local file) | Verified — file exists |
| `packages/types/src/Product.ts` | Read/write (TypeScript type definition) | Verified — file exists |
| `packages/platform-core/src/repositories/catalogSkus.server.ts` | Read (understand mapping) | Verified — file exists |
| `apps/caryina/src/app/[lang]/product/[slug]/page.tsx` | Read/write (PDP rendering) | Verified — file exists |
| `docs/business-os/startup-baselines/HBAG-content-packet.md` | Read/write (content packet source) | Verified — file exists |
| Supplier (Pete's contact) | Operator-only — real-world data | UNVERIFIED — requires operator action |

## Evidence Audit (Current State)

### Entry Points

- `data/shops/caryina/products.json` — canonical product data store; 3 SKUs with `title`, `description`, `media`, `price`, `currency`, `sku`, `id`. No `materials`, `dimensions`, or `weight` fields exist at any level.
- `apps/caryina/src/app/[lang]/product/[slug]/page.tsx` — PDP server component; reads SKU via `readShopSkuBySlug`, renders `product.description` as a paragraph, renders `productPageContent.proofBullets` from `site-content.generated.json`. No material/spec rendering block exists.
- `packages/platform-core/src/repositories/catalogSkus.server.ts` — maps `ProductPublication` → `SKU` type for consumption by the app. The `skuFromProduct` function produces the `SKU` object the PDP receives; any new fields on `ProductPublication` must be explicitly passed through here.

### Key Modules / Files

- `data/shops/caryina/products.json` — data store to extend with new fields
- `packages/types/src/Product.ts` — `skuSchema` (Zod, `.strict()`), `ProductCore`, `ProductPublication` — all three require new optional fields
- `packages/platform-core/src/repositories/catalogSkus.server.ts` — `skuFromProduct` function that maps to `SKU` — must forward new fields
- `apps/caryina/src/app/[lang]/product/[slug]/page.tsx` — PDP server component — must render a new spec section
- `docs/business-os/startup-baselines/HBAG-content-packet.md` — source of truth for copy — needs a `## Material & Spec Data` section documenting the agreed copy (but this is reference, not the live data store)
- `docs/business-os/strategy/HBAG/2026-02-22-product-from-photo.user.md` — §2.3 Materials & Finishes, §2.4 Hardware & Closures, §7 Unknowns — establishes which claims are evidenced vs UNKNOWN

### Patterns & Conventions Observed

- **Localized text pattern:** `products.json` stores `title` and `description` as `{ en: string, de?: string, it?: string }` objects. New `materials` field should follow the same pattern for the human-readable material description.
- **Numeric/unit fields:** Price is stored in minor units (integer). Dimensions and weight are naturally numeric — no existing precedent in this schema for measurement fields; can add as structured objects (e.g. `{ h: number, w: number, d: number, unit: "mm" }`).
- **Strict Zod schema:** `skuSchema` uses `.strict()`, meaning any field not declared will cause a Zod parse error. New optional fields must be added to the Zod schema, not just to the TypeScript interface.
- **`ProductPublication` extends `ProductCore`:** Both must receive new fields. The `catalogSkus.server.ts` `skuFromProduct` maps from `ProductPublication` to `SKU` and currently only passes fields explicitly — spread is not used for these extra fields; each must be forwarded explicitly.
- **JSON server repo pattern:** `products.json.server.ts` reads/writes the JSON file as a passthrough without schema validation — new fields will round-trip correctly without changes to the file-layer.

### Data & Contracts

- Types/schemas/events:
  - `skuSchema` (`packages/types/src/Product.ts:38`) — Zod object schema for the `SKU` type consumed by the PDP. Currently has: `id`, `slug`, `title`, `price`, `deposit`, `stock`, `forSale`, `forRental`, `dailyRate`, `weeklyRate`, `monthlyRate`, `wearAndTearLimit`, `maintenanceCycle`, `availability`, `media`, `sizes`, `description`. No material/spec fields.
  - `ProductCore` (`packages/types/src/Product.ts:78`) — interface including `title: Translated`, `description: Translated`. The separation between `ProductCore` and `skuSchema` means changes need to be made in both.
  - `ProductPublication` (`packages/types/src/Product.ts:113`) — extends `ProductCore` with `shop`, `status`, `row_version`.
  - `SiteContentPayload` in `apps/caryina/src/lib/contentPacket.ts` — not relevant for per-product spec data; material/dimensions/weight belong in `products.json`, not in the content packet.
- Persistence:
  - `data/shops/caryina/products.json` — single flat JSON file; read via `products.json.server.ts`; no schema validation at the file-read layer (raw `JSON.parse`).
- API/contracts:
  - The PDP receives a `SKU` object after mapping through `catalogSkus.server.ts:skuFromProduct`. New material/spec fields must be declared on `SKU` (via `skuSchema`) to be available in the PDP component.

### Dependency & Impact Map

- Upstream dependencies:
  - Supplier (Pete) must provide confirmed material composition, hardware finish alloy, dimensions (H × W × D mm), and weight for each variant — this is currently UNKNOWN per all product documentation.
  - `packages/types/src/Product.ts` — gate; both `skuSchema` and `ProductCore` / `ProductPublication` must be updated before downstream changes can type-check.
- Downstream dependents:
  - `packages/platform-core/src/repositories/catalogSkus.server.ts` — must pass new fields through `skuFromProduct`.
  - `apps/caryina/src/app/[lang]/product/[slug]/page.tsx` — must render new spec section.
  - `data/shops/caryina/products.json` — must be populated with actual values.
  - `docs/business-os/startup-baselines/HBAG-content-packet.md` — `## Product Copy Matrix` should be updated with new evidence constraints now that spec fields are present.
- Likely blast radius:
  - The `skuSchema.strict()` constraint means any test or code that constructs a `SKU` object directly (e.g. tests in `packages/ui`, `packages/platform-core`) will fail TypeScript compilation if new required fields are added. All new fields must be declared `optional()` to avoid breaking existing tests.
  - Search: the `skuSchema` is used in templates, UI tests, and stories across `packages/ui/`, `packages/platform-core/`, and `packages/template-app/` — existing test mocks do not include material/spec fields, so all new fields must be optional.

### Delivery & Channel Landscape

- Audience/recipient: Caryina website PDP visitors — ICP-A (considered bag buyer, 27–42, deliberates 3–7 days, mobile-first); ICP-B (gift buyer). Material specs are a pre-purchase information need, not a marketing asset.
- Channel constraints: Website only for this plan. Etsy listing copy is a separate concern (not in scope); Etsy listing descriptions are not generated from `products.json`.
- Existing templates/assets: No material/spec section exists on the PDP. The proof bullets section (`<section aria-label="Product proof points">`) is the closest existing container; a separate spec block would sit adjacent to or below it.
- Approvals/owners: Pete — must confirm material and dimension data from supplier before copy can be finalised.
- Compliance constraints:
  - "Made in Italy" is prohibited (Italian Law 166/2009 — manufacturing in China; false advertising if claimed). Use "Designed in Positano, Italy" throughout.
  - Material claims must be accurate — do not use "genuine leather" or "PU leather" without confirmation from supplier. Use "structured exterior" or supplier-confirmed material description.
  - REACH and GPSR: for accessories with metal hardware, the material description in product copy may be referenced if a consumer requests substance information. Claims must be accurate.
- Measurement hooks: Post-build — monitor checkout conversion rate (currently no GA4 configured for HBAG; measurement gap noted in worldclass-scan). Proxy metric: reduction in pre-purchase support queries about materials/size.

### Blast-Radius Map

| Area | In/Out of Scope | Reason |
|---|---|---|
| `skuSchema` and TypeScript types | In scope | Gate for all downstream changes |
| `data/shops/caryina/products.json` | In scope | Primary data store for spec values |
| `catalogSkus.server.ts` skuFromProduct | In scope | Mapping layer that passes fields to PDP |
| `apps/caryina` PDP page component | In scope | Renders spec section |
| `HBAG-content-packet.md` | In scope (documentation sync only — not a build dependency) | Evidence constraints column updated to reflect confirmed material data; this is an optional human-readable sync, not a build step |
| `site-content.generated.json` | Out of scope — not modified | Materializer generates page-level copy, not per-product structured data; this file is untouched by this plan |
| Etsy listing copy | Out of scope | Not generated from this data store; separate operational step for Pete |
| `packages/ui` test fixtures | Out of scope — must be aware | New fields must be optional to avoid breaking existing SKU mocks in ui/platform-core/template-app tests |
| Other apps using `skuSchema` (template-app, reception) | Out of scope — must be aware | Optional fields only — no breaking changes |

### Hypothesis & Validation Landscape

#### Key Hypotheses

| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | Adding explicit material specs and dimensions increases conversion by reducing pre-purchase uncertainty | GA4 setup (not yet done for HBAG), at least 30 days of post-launch traffic | Medium (requires live traffic + GA4) | 30–60 days |
| H2 | Buyers who see material specs are less likely to contact support pre-purchase about material/size questions | Support message tracking (manual for now) | Low | 2–4 weeks |
| H3 | Material data from the supplier is obtainable and will be accurate enough to include on the PDP | Pete contacts supplier with a spec request | Low | Days |

#### Existing Signal Coverage

| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | World-class scan confirms "major gap" in product-storytelling; no live conversion data yet | worldclass-scan-2026-02-28.md | Low — scan-based, no A/B |
| H2 | Brand dossier voice section: "Some technical detail is expected — dimensions, material composition, and compatibility matter to this buyer" | 2026-02-21-brand-identity-dossier.user.md | Medium — buyer characterisation supported |
| H3 | Product-from-photo spec doc explicitly lists material as UNKNOWN and dimensions as P0 blocking unknown | 2026-02-22-product-from-photo.user.md §7 | High — the gap is confirmed; supplier data availability untested |

#### Recommended Validation Approach

- Quick probes: Pete requests full BOM spec sheet from supplier with material composition, plating standard, unit dimensions, and weight — this is gated work before PDP copy is finalised.
- Deferred validation: GA4 conversion comparison before/after spec addition — deferred until GA4 is configured.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (unit/integration), Playwright (e2e)
- Commands: `pnpm typecheck && pnpm lint` (local type/lint gate only); full Jest runs via CI only
- CI integration: tests run in reusable-app.yml on PR; local Jest runs are not the standard workflow per repo policy

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| SKU type / schema | Implicit via type checking | `packages/types/src/Product.ts` | No explicit schema validation tests found; type coverage via TypeScript compiler |
| PDP page | Not found | — | No jest tests for `apps/caryina/src/app/[lang]/product/[slug]/page.tsx` found |
| catalogSkus.server.ts | Not found | — | No unit tests found for the mapping function |
| products.json data integrity | Not found | — | No schema validation test for products.json |

#### Coverage Gaps

- Untested paths: PDP render logic, `skuFromProduct` mapping function, products.json schema shape
- Extinct tests: None identified

#### Testability Assessment

- Easy to test: `skuSchema` validation of new fields (unit test with sample products.json entries)
- Hard to test: PDP render with new spec section (no existing test harness; would require React testing setup in `apps/caryina`)
- Test seams needed: Add a lightweight schema validation test for `products.json` shape to catch missing required spec fields before build

#### Recommended Test Approach

- Unit tests for: Zod schema validation of new optional `materials`, `dimensions`, `weight` fields — confirm they accept valid values and remain optional
- TypeScript compilation: run `pnpm typecheck` after type changes — catches breaking changes to existing SKU mock usages

### Recent Git History (Targeted)

- `apps/caryina/src/app/[lang]/product/[slug]/page.tsx` — last touched in commit `88d4ae88ca` ("TASK-10+11 — AddToCartButton, /cart page, checkout-session API"). PDP layout stable; proof bullets section added in prior wave.
- `data/shops/caryina/products.json` — last touched in commit `2ac91e7e5a` ("chore: commit outstanding work"). Schema has been stable since initial population with 3 SKUs.

## Questions

### Resolved

- Q: Should material/spec data live in `products.json` or in `site-content.generated.json`?
  - A: `products.json`. Material specs are per-product structured data, not page-level copy generated from the content packet. The materializer generates copywriting (proofBullets, headings, trust text); product specs are factual product data that belong with the product record.
  - Evidence: `apps/caryina/src/lib/contentPacket.ts` — `SiteContentPayload` has `productPage.proofBullets` as a shared list (not per-SKU), confirming it is unsuitable for per-SKU structured spec data.

- Q: Will adding optional fields to `skuSchema.strict()` break existing tests?
  - A: Only if the fields are added as required. All new fields must be `.optional()`. Existing SKU mocks across `packages/ui`, `packages/platform-core`, and `packages/template-app` do not include any material/spec fields, so these will remain valid if new fields are optional.
  - Evidence: `packages/types/src/Product.ts:38-72` — `skuSchema.strict()` with `.optional()` is already used for `dailyRate`, `weeklyRate`, etc.; the pattern is established.

- Q: What provenance claim is allowed?
  - A: "Designed in Positano, Italy" — confirmed in the brand dossier and repeated in the offer design. "Made in Italy" is prohibited under Italian Law 166/2009 because manufacturing is China-based.
  - Evidence: `docs/business-os/strategy/HBAG/2026-02-21-brand-identity-dossier.user.md` §Brand Claims; `docs/business-os/startup-baselines/HBAG-offer.md` §Objection Map (row 5).

- Q: Should the spec section be shared across all SKUs (same template) or per-SKU (different values)?
  - A: Per-SKU values, shared rendering template. The three variants have different dimensions (all same architecture but distinct colorways), different hardware finish details (V3 has a mixed silver/gold conflict note). Each SKU record in `products.json` needs its own field values; the PDP renders whatever is present in the SKU.
  - Evidence: `docs/business-os/strategy/HBAG/2026-02-22-product-from-photo.user.md` §3 Controlled Variation Table — hardware finish differs by variant; dimensions expected to be shared (same silhouette) but must be confirmed.

- Q: What draft copy should be used for the 3 SKUs while supplier data is outstanding?
  - A: Do not publish spec data with placeholder values. The plan should gate PDP display of the spec section on a non-empty `materials` field. If no data is present, the section is omitted — the current state (no spec section) is no worse than a placeholder. Operator supplies confirmed data as TASK-01 before build publishes.
  - Evidence: Brand dossier voice rules — "do not state material composition unless verified in product docs" (HBAG-content-packet.md §SEO Constraints).

- Q: Where exactly on the PDP should the spec section appear?
  - A: Below the proof bullets section, within the sticky right-hand column. The current PDP layout (`page.tsx:113-128`) has: price → stock badge → CTA → proof bullets. Adding a spec block below proof bullets (above the `border-t` at the bottom of the right-hand column) is the natural slot — it appears before related products and is visible without scrolling on most desktop viewports.
  - Evidence: `apps/caryina/src/app/[lang]/product/[slug]/page.tsx:92-129` — right column `space-y-6` layout.

### Open (Operator Input Required)

- Q: What are the confirmed material composition, hardware finish standard, exact dimensions (H × W × D in mm), and weight (g) for each of the 3 SKU variants?
  - Why operator input is required: This is real-world physical product data from the supplier. The product-from-photo spec doc (2026-02-22) explicitly classifies all material claims as UNKNOWN and lists dimensions as a P0 blocking unknown (§7). No measurement or supplier documentation exists in the repository.
  - Decision impacted: Determines what can be written in `materials`, `dimensions`, and `weight` fields for each product record. Without this, the spec section cannot be populated.
  - Decision owner: Pete (supplier contact)
  - Default assumption: If supplier data is not available before build, the plan implements the schema extension and PDP rendering with a conditional display (section only renders if `materials` field is non-empty), and operator populates data in a follow-up data-entry step. This avoids blocking the code work on the data-gathering step.
  - Capture template for supplier request (use as TASK-01 deliverable):

```
For each of the 3 bag charm variants (Silver / Rose Splash / Peach), please confirm:

1. Exterior shell material: (e.g. "PU leather", "genuine leather", specific material name)
2. Hardware material and finish: (e.g. "zinc alloy, gold electroplating 3-micron", "brass")
3. Interior lining: (material type and colour)
4. Dimensions with bag closed: Height × Width × Depth in mm
5. Weight (without packaging): grams
6. Country of manufacture: (expected: China — for compliance disclosure)
```

## Draft Material/Dimension Copy (Proposed, Pending Supplier Confirmation)

These are the structural copy patterns to use once operator provides confirmed values. Actual values are placeholders (`[TBC]`).

**Silver (V1):**
- `materials.en`: "Metallic reptile-embossed exterior; gold-tone hardware; structured shell"
- `dimensions`: `{ h: [TBC], w: [TBC], d: [TBC], unit: "mm" }`
- `weight`: `{ value: [TBC], unit: "g" }`
- Provenance line: "Designed in Positano, Italy"

**Rose Splash (V2):**
- `materials.en`: "White croc-embossed exterior with pink splatter; gold-tone hardware; structured shell"
- `dimensions`: `{ h: [TBC], w: [TBC], d: [TBC], unit: "mm" }`
- `weight`: `{ value: [TBC], unit: "g" }`
- Provenance line: "Designed in Positano, Italy"

**Peach (V3):**
- `materials.en`: "Pebbled-grain exterior in peach; [confirm: gold or silver/gold] hardware; structured shell"
- `dimensions`: `{ h: [TBC], w: [TBC], d: [TBC], unit: "mm" }`
- `weight`: `{ value: [TBC], unit: "g" }`
- Provenance line: "Designed in Positano, Italy"

Note: Hardware finish on V3 shows a conflict between silver-tone plate + gold twist in product photography — must be resolved with supplier before copy is published. See `2026-02-22-product-from-photo.user.md` §2.4 HW1.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| `products.json` schema and current fields | Yes | None | No |
| `skuSchema` Zod type constraints | Yes | None — `.optional()` pattern established by existing optional fields | No |
| `ProductCore`/`ProductPublication` interfaces | Yes | None | No |
| `catalogSkus.server.ts` mapping function | Yes | [Scope gap Minor]: `skuFromProduct` uses explicit field forwarding, not a spread — any new field must be explicitly forwarded. This is a known implementation requirement, not a gap in the investigation. | No |
| PDP rendering zone | Yes | None — layout identified; spec section slot confirmed | No |
| Content packet / materializer boundary | Yes | None — spec fields belong in products.json, not the content packet | No |
| Supplier data availability | Partial | [Missing domain coverage Major]: Real-world material data is operator-only; cannot be verified from repository. Blocked on supplier query. Mitigated by conditional rendering gate (section hidden if materials empty). | No — mitigated |
| TypeScript breaking change risk (existing SKU mocks) | Yes | None — all new fields will be optional; existing mocks valid | No |
| Provenance claim compliance | Yes | None — "Designed in Positano" is confirmed safe; "Made in Italy" prohibition documented | No |

## Evidence Gap Review

### Gaps Addressed

1. **Citation integrity:** Every claim about current schema state is directly referenced to file+line (Product.ts:38-72, products.json full read, catalogSkus.server.ts:41-93). Material data gaps are explicitly cited to the product-from-photo spec (§2.3, §7).
2. **Boundary coverage:** The strict Zod schema boundary was inspected; the explicit-forwarding pattern in `skuFromProduct` was identified. Both are implementation constraints documented in the plan task seeds.
3. **Testing coverage:** No existing tests for PDP, catalogSkus mapping, or products.json schema validation were found — this gap is documented and a schema validation unit test is recommended.
4. **Business validation:** The open question for supplier data is the single real blocker; the plan mitigates it with a conditional display gate.
5. **Blast radius:** All known dependents (ui tests, platform-core tests, template-app) were identified; all require optional fields only.

### Confidence Adjustments

- Supplier data unknown reduces Delivery-Readiness from ~85 to 68. The conditional display gate allows code work to proceed without blocking on data, but operator must action the supplier query before spec copy is visible to users.
- No existing PDP tests reduces Testability from ~90 to 70.

### Remaining Assumptions

- Supplier can provide accurate material and dimension data when requested — plausible given Pete has a direct supplier relationship.
- V3 hardware finish conflict (silver/gold) can be resolved from inspection of physical product — Pete can confirm by looking at the product.
- Dimensions are shared across colorways (same silhouette, same mold) — very likely given all variants use the same physical architecture, but must be confirmed.

## Confidence Inputs

- **Implementation:** 82%
  - Evidence: Entry point, type schema, data layer, mapping function, and PDP render slot all located and understood. Implementation path is unambiguous: extend 3 interfaces/schemas (optional fields), pass through in mapping, add conditional render block in PDP. All patterns are established in the existing codebase.
  - To reach 90: Operator confirms material data so PDP spec section can be tested with real values; schema validation unit test added.

- **Approach:** 87%
  - Evidence: Storing specs in `products.json` as structured optional fields is the correct pattern (not in the content packet, not as freeform text only). The conditional display approach requires all three fields (`materials`, `dimensions`, `weight`) to be non-empty before the section renders — no partial publication. Per-SKU values, shared rendering template.
  - To reach 90: Confirm with operator that the spec section position (below proof bullets in right column) is acceptable visually before build.

- **Impact:** 78%
  - Evidence: Brand dossier explicitly states buyers expect material and dimension detail at €80–€150 ("Some technical detail is expected"). World-class scan classifies this as a major gap. No live conversion data to quantify impact.
  - To reach 80: Operator confirms supplier data is available and scope is correct.
  - To reach 90: Post-launch: GA4 configured and 30 days of conversion data available.

- **Delivery-Readiness:** 68%
  - Evidence: Code path is clear and all files identified. Blocker: supplier material data. Mitigated by gated implementation approach.
  - To reach 80: Operator provides confirmed material data (or explicitly accepts placeholder-first approach).
  - To reach 90: Confirmed material data available and spec section renders correctly in local dev.

- **Testability:** 70%
  - Evidence: Zod schema validation is straightforward to unit-test. PDP rendering has no existing test harness. TypeScript compilation provides implicit coverage.
  - To reach 80: Add a products.json schema validation test that asserts all active SKUs have non-empty material/dimension fields once operator data is in place.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Supplier cannot provide material/dimension data in a timely manner | Medium | High — spec section cannot launch; gap persists | Conditional display gate ensures code ships; data gathered separately. Pete to set a 5-day deadline on supplier query. |
| V3 hardware finish conflict (silver vs gold) published incorrectly | Medium | Medium — incorrect claim on live PDP | Explicitly flag in TASK-01 supplier query; do not publish hardware claim for V3 until confirmed |
| `skuSchema.strict()` change breaks existing tests | Low | Medium — CI failure | All new fields declared `.optional()`; run `pnpm typecheck` after each schema change as gate |
| "Made in Italy" claim introduced accidentally in new copy | Low | High — false advertising, legal risk | Provenance constraint documented in content packet and brand dossier; code review step in plan |
| Spec section slows PDP render (extra data in JSON response) | Very low | Very low — static file, JSON parse is negligible | No risk at this data volume |

## Planning Constraints & Notes

- Must-follow patterns:
  - All new schema fields must be `.optional()` to maintain backward compatibility with existing SKU mocks.
  - Provenance copy must use "Designed in Positano, Italy" — never "Made in Italy".
  - Material claims must only state what the supplier confirms in writing — no inferring from product photos.
  - PDP spec section must conditionally render — if `materials` field is absent or empty, section is hidden.
- Rollout/rollback expectations:
  - Schema changes are additive/optional — safe to roll back by removing the rendering block and the fields; no data loss.
  - products.json edit is a local file; Git rollback is trivial.
- Observability expectations:
  - No instrumentation needed for spec section itself. Once GA4 is set up (separate plan), conversion rate before/after can be compared.

## Suggested Task Seeds (Non-binding)

- TASK-01: Operator data gathering — produce supplier spec request using the capture template above; confirm material composition, hardware finish, dimensions, and weight for all 3 variants. Operator completes; deliverable is populated values for TASK-02.
- TASK-02: Extend TypeScript types — add optional `materials: { en: string; de?: string; it?: string }`, `dimensions: { h: number; w: number; d: number; unit: "mm" }`, `weight: { value: number; unit: "g" }` to `skuSchema` (Zod optional) and to `ProductCore`/`ProductPublication` interfaces. The `unit` field on `weight` makes the schema unambiguous for display and downstream consumers. Run `pnpm typecheck` as gate.
- TASK-03: Update `skuFromProduct` in `catalogSkus.server.ts` to forward the three new optional fields to the `SKU` output.
- TASK-04: Populate `data/shops/caryina/products.json` with confirmed material, dimension, and weight values for all 3 SKUs. Include provenance as "Designed in Positano, Italy" in the materials description.
- TASK-05: Add a conditional spec section to the PDP (`apps/caryina/src/app/[lang]/product/[slug]/page.tsx`) — renders below proof bullets only if `product.materials` is non-empty AND `product.dimensions` is present AND `product.weight` is present (all three must be populated to show the section); displays material description, dimensions (formatted as "H mm × W mm × D mm"), weight (in grams), and provenance line.
- TASK-06: Add a Zod schema validation unit test asserting all active products.json SKUs have non-empty `materials` field (post data population gate check).
- TASK-07 (docs sync, not build dependency): Update `HBAG-content-packet.md` `## Product Copy Matrix` evidence constraints column to reference confirmed material data. This step has no code dependency and does not affect `site-content.generated.json`.

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - `data/shops/caryina/products.json` — all 3 SKUs have non-empty `materials`, `dimensions`, and `weight` fields with operator-confirmed values
  - `packages/types/src/Product.ts` — `skuSchema` and `ProductCore`/`ProductPublication` updated with optional fields
  - `packages/platform-core/src/repositories/catalogSkus.server.ts` — `skuFromProduct` forwards new fields
  - `apps/caryina/src/app/[lang]/product/[slug]/page.tsx` — spec section renders conditionally
  - `pnpm typecheck` passes with no new errors
  - No "Made in Italy" claim present anywhere in new copy
- Post-delivery measurement plan:
  - Immediate: visual QA — spec section renders on PDP with correct values for all 3 SKUs
  - 30 days: after GA4 configured — compare checkout conversion rate pre/post spec section
  - Ongoing: monitor support messages for material/size queries as a proxy metric

## Planning Readiness

- Status: Ready-for-planning
- Blocking items:
  - TASK-01 (supplier data gathering) is operator-dependent and gates TASK-04 (data population). The plan should sequence TASK-01 first, with TASK-02 and TASK-03 runnable in parallel (code-only, no data dependency). TASK-04 through TASK-07 depend on TASK-01 completion.
- Recommended next step: `/lp-do-plan hbag-pdp-material-specs --auto`
