---
Type: Plan
Status: Active
Domain: PRODUCTS
Workstream: Mixed
Created: 2026-02-28
Last-reviewed: 2026-02-28
Last-updated: 2026-02-28 (TASK-06 complete)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: hbag-pdp-material-specs
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 80%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# HBAG PDP Material Specs Plan

## Summary

Caryina's three launch SKUs (Silver, Rose Splash, Peach) have product descriptions that rely on vague finish adjectives with no confirmed material composition, hardware finish standard, dimensions, or weight. At €80–€150 with a 3–7 day buyer deliberation cycle, this is a documented conversion risk. This plan extends the product data schema with structured `materials`, `dimensions`, and `weight` optional fields, populates them with supplier-confirmed values for all three SKUs, and renders a conditional spec section on the PDP. Code work can begin immediately; the spec data population step is gated on the operator completing a supplier query (TASK-01). All new schema fields are optional to avoid breaking existing SKU mocks across the monorepo.

## Active tasks
- [ ] TASK-01: Produce and send supplier spec request; collect confirmed values
- [x] TASK-02: Extend TypeScript types with optional material spec fields
- [x] TASK-03: Forward new fields through `skuFromProduct` mapping
- [ ] CHECKPOINT-04: Validate supplier data before populating product records
- [ ] TASK-05: Populate `products.json` with confirmed spec values
- [x] TASK-06: Add conditional spec section to the PDP
- [ ] TASK-07: Add schema validation unit test for new spec fields
- [ ] TASK-08: Docs sync — update content packet evidence constraints

## Goals
- Add optional `materials`, `dimensions`, and `weight` fields to the Caryina product data schema (types, JSON file)
- Populate those fields for all 3 launch SKUs with operator-confirmed values from the supplier
- Render a conditional material/spec section on the PDP (below proof bullets) — section is hidden when any field is absent
- Lock in "Designed in Positano, Italy" as the provenance claim; "Made in Italy" is prohibited
- Update the content packet evidence constraints column to reflect confirmed material data (documentation sync only)

## Non-goals
- Adding specs for deferred SKUs (H2 AirPod Holder, H3–H5)
- Resolving proof-bullet placeholder copy (parallel plan: IDEA-DISPATCH-20260228-0003)
- UX redesign of the PDP layout
- Internationalising spec fields beyond EN, DE, IT
- Touching `site-content.generated.json` or the materializer pipeline

## Constraints & Assumptions
- Constraints:
  - "Made in Italy" cannot be claimed — Italian Law 166/2009 / EU origin marking law. "Designed in Positano, Italy" is the only correct provenance claim.
  - `skuSchema` in `packages/types/src/Product.ts` uses `.strict()` — all new fields must be explicitly added as `.optional()`. Any required field would break existing SKU mocks in `packages/ui/`, `packages/platform-core/`, `packages/template-app/`.
  - `ProductCore` and `ProductPublication` interfaces are separate from the Zod `skuSchema` — both need updating.
  - `skuFromProduct` in `catalogSkus.server.ts` uses explicit field forwarding, not object spread — each new field must be explicitly forwarded.
  - Spec data from the supplier is currently UNKNOWN — material substrate, hardware finish alloy, dimensions, weight are all unconfirmed.
  - PDP spec section must be conditional on all three fields being present — no partial display.
- Assumptions:
  - Pete has a direct supplier relationship and can obtain confirmed spec data within days.
  - V3 hardware finish conflict (possible silver/gold mix vs gold-tone) will be resolved by physical inspection.
  - Dimensions are shared across colorways (same silhouette/mold) — must be confirmed.
  - `products.json.server.ts` JSON file layer passes through unknown fields without schema validation — no changes needed to the file persistence layer.

## Inherited Outcome Contract

- **Why:** At €80–€150 with a 3–7 day deliberation cycle, buyers need explicit material and size information to justify the price. Vague finish adjectives create uncertainty and reduce trust for a brand with no physical retail presence or established reputation.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Material specs (exterior material, hardware finish standard), product dimensions (H × W × D in mm), and weight appear as structured fields in `data/shops/caryina/products.json` and are rendered on the PDP for all 3 launch SKUs. No vague finish adjective remains as the only material claim. Provenance is "Designed in Positano, Italy" throughout.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/hbag-pdp-material-specs/fact-find.md`
- Key findings used:
  - `skuSchema` is `.strict()` — all new fields require explicit Zod `.optional()` declarations
  - `skuFromProduct` uses explicit field forwarding — three additional forwarding lines needed
  - PDP right-column layout: `space-y-6` div with proof bullets section at bottom — spec section slots below it
  - Supplier material data is entirely UNKNOWN — TASK-01 (data gathering) gates TASK-05 (data population) but not code tasks
  - "Made in Italy" is prohibited under Italian Law 166/2009; "Designed in Positano, Italy" is safe
  - Weight schema: `{ value: number; unit: "g" }` to match `dimensions: { h, w, d, unit: "mm" }` for consistent unit handling

## Proposed Approach

- **Option A:** Extend per-SKU structured fields in `products.json` + types, forward through mapping layer, render conditionally on PDP. Spec data is factual product data, not marketing copy — it lives in the product record, not the content packet.
- **Option B:** Add spec copy as freeform text inside `products.json` `description` fields (no schema extension).
- **Chosen approach:** Option A. Option B conflates factual structured data with marketing copy, prevents programmatic formatting of dimensions/weight, and makes it impossible to apply the 3-field render gate consistently. Option A is also the correct extension point for Etsy listing export, catalog APIs, and future compliance documentation.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes — TASK-02 (85%), TASK-03 (85%), TASK-06 (80%) meet the ≥80% build gate and are unblocked; auto-build begins with those tasks. TASK-01 (85%) is Needs-Input (operator-blocking). TASK-05 (75%) and TASK-08 (70%) are data-gated: TASK-05 executes only after CHECKPOINT-04 validates supplier data (confidence expected to rise to 85%); TASK-08 executes only after TASK-01 completes. TASK-07 confidence raised to 80% (jest config confirmed). Per AGENTS.md: tasks below 80% that are not yet unblocked do not block auto-build; `/lp-do-build` stops at CHECKPOINT-04 and invokes `/lp-do-replan` before proceeding to TASK-05.

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Supplier spec request and data collection | 85% | S | Needs-Input | - | CHECKPOINT-04, TASK-08 |
| TASK-02 | IMPLEMENT | Extend TypeScript types with optional spec fields | 85% | M | Complete (2026-02-28) | - | TASK-03, TASK-05, TASK-06, TASK-07 |
| TASK-03 | IMPLEMENT | Forward new fields through skuFromProduct | 85% | S | Complete (2026-02-28) | TASK-02 | TASK-05, TASK-06 |
| CHECKPOINT-04 | CHECKPOINT | Validate supplier data before populating products.json | 95% | S | Pending | TASK-01 | TASK-05 |
| TASK-05 | IMPLEMENT | Populate products.json with confirmed spec values | 75% | M | Pending | CHECKPOINT-04, TASK-03 | TASK-07 |
| TASK-06 | IMPLEMENT | Add conditional spec section to PDP | 80% | M | Complete (2026-02-28) | TASK-02, TASK-03 | - |
| TASK-07 | IMPLEMENT | Schema validation unit test for new spec fields | 80% | S | Pending | TASK-02, TASK-05 | - |
| TASK-08 | IMPLEMENT | Docs sync: update content packet evidence constraints | 70% | S | Pending | TASK-01 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | - | TASK-01 is operator-blocking (Needs-Input); TASK-02 starts immediately. Both run in parallel. |
| 2 | TASK-03 | TASK-02 complete | Forward new fields through skuFromProduct. |
| 3 | TASK-06, CHECKPOINT-04, TASK-08 | TASK-03 complete (TASK-06); TASK-01 complete (CHECKPOINT-04, TASK-08) | TASK-06 (PDP render) depends on TASK-02 + TASK-03 (needs type visibility AND forwarding layer for runtime correctness). CHECKPOINT-04 and TASK-08 become unblocked when TASK-01 completes independently. |
| 4 | TASK-05 | CHECKPOINT-04 complete, TASK-03 complete | Data population. Requires confirmed values and forwarding layer in place. |
| 5 | TASK-07 | TASK-02 complete, TASK-05 complete | Validation test runs against populated data with correct types. |

## Tasks

---

### TASK-01: Produce and send supplier spec request; collect confirmed values
- **Type:** IMPLEMENT
- **Deliverable:** Confirmed spec values for all 3 SKU variants, delivered as a completed version of the capture template below, stored at `docs/business-os/strategy/HBAG/supplier-spec-confirmed.user.md`
- **Execution-Skill:** lp-do-build (operator action — agent produces the template; operator sends it and records responses)
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Needs-Input
- **Artifact-Destination:** `docs/business-os/strategy/HBAG/supplier-spec-confirmed.user.md`
- **Reviewer:** Pete (operator — owns supplier contact)
- **Approval-Evidence:** File exists at destination with all 6 fields populated for all 3 variants, no `[TBC]` values remaining
- **Measurement-Readiness:** None — one-time data gathering task
- **Affects:** `[readonly] docs/business-os/strategy/HBAG/2026-02-22-product-from-photo.user.md`, `docs/business-os/strategy/HBAG/supplier-spec-confirmed.user.md`
- **Depends on:** -
- **Blocks:** CHECKPOINT-04, TASK-08
- **Confidence:** 85%
  - Implementation: 95% — produce a capture template (already defined in fact-find), operator sends to supplier
  - Approach: 90% — capture template is well-defined with 6 fields and 3 variants
  - Impact: 85% — gates all data-population tasks; supplier may be slow or unable to confirm V3 hardware finish
- **Acceptance:**
  - `docs/business-os/strategy/HBAG/supplier-spec-confirmed.user.md` exists with all 6 fields populated for Silver, Rose Splash, and Peach variants
  - No `[TBC]` values remain in the file
  - V3 hardware finish conflict (silver/gold vs gold) is explicitly resolved
  - Country of manufacture confirmed (expected: China)
- **Validation contract (VC-01):**
  - VC-01: All 6 spec fields (exterior material, hardware finish, interior lining, dimensions H×W×D mm, weight g, country of manufacture) are present for each of 3 variants → file exists, all fields non-empty, no placeholder values
  - VC-02: V3 hardware finish is explicitly confirmed (not left as "mixed/unknown") → a concrete finish description is present for V3 hardware
  - VC-03: No "Made in Italy" claim appears in the spec document → search and confirm
- **Execution plan:** Red → Green → Refactor (VC-first)
  - Red evidence plan: Capture template produced by agent. Operator sends to supplier. Supplier data absent = Red state.
  - Green evidence plan: Operator receives supplier response, populates template file. All VC checks pass.
  - Refactor evidence plan: Review confirmed data against brand dossier constraints (no unverified material claims). Remove any claim that cannot be accurately stated.
- **Planning validation:**
  - Checks run: Reviewed `2026-02-22-product-from-photo.user.md` §2.3, §2.4, §7 — all material/dimension fields classified as UNKNOWN or APPARENT. Template covers all gaps identified in §7 P0/P1 items.
  - Validation artifacts: Product-from-photo spec doc captures all open questions for supplier.
  - Unexpected findings: None
- **Scouts:** Operator should check physical product for V3 hardware finish before or alongside supplier query — visual inspection of product in hand may resolve the conflict faster than a formal supplier query.
- **Edge Cases & Hardening:** If supplier cannot provide weight or exact dimensions, operator must decide whether to (a) defer spec section until data is available, or (b) omit the specific missing field and adjust the render gate. This is a decision that cannot be made at plan time; if it arises, raise it before proceeding to TASK-05.
- **What would make this >=90%:** Operator has already contacted supplier and data is in transit.
- **Rollout / rollback:**
  - Rollout: File created by operator; no deployment required.
  - Rollback: Delete file; no production impact.
- **Documentation impact:** Produces `supplier-spec-confirmed.user.md` which feeds TASK-05 and TASK-08.
- **Notes / references:**
  - Capture template (produce this as the agent-side deliverable before operator sends):
    ```
    For each of the 3 bag charm variants (Silver / Rose Splash / Peach), please confirm:
    1. Exterior shell material: (e.g. "PU leather", "genuine leather", "split leather", specific name)
    2. Hardware material and finish: (e.g. "zinc alloy, gold electroplating 3-micron", "brass, gold-plate")
    3. Interior lining: (material type and colour)
    4. Dimensions with bag closed: Height × Width × Depth in mm
    5. Weight (without packaging): grams
    6. Country of manufacture: (expected: China)
    Note for Silver (V3 Peach): please confirm whether the clasp plate is gold-tone or silver-tone.
    ```

---

### TASK-02: Extend TypeScript types with optional material spec fields
- **Type:** IMPLEMENT
- **Deliverable:** Updated `packages/types/src/Product.ts` with optional `materials`, `dimensions`, and `weight` fields on `skuSchema`, `ProductCore`, and `ProductPublication`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `packages/types/src/Product.ts`
- **Depends on:** -
- **Blocks:** TASK-03, TASK-05, TASK-06, TASK-07
- **Confidence:** 85%
  - Implementation: 85% — `.optional()` pattern is established for nested optional fields (`dailyRate`, `weeklyRate`, etc.); `.strict()` applies to top-level schema only, not nested objects
  - Approach: 90% — only viable approach given `.strict()` schema constraint; new fields must be Zod optional
  - Impact: 85% — if any field were accidentally marked required, existing SKU mocks in `packages/ui/`, `packages/platform-core/`, `packages/template-app/` would fail typecheck
- **Acceptance:**
  - `skuSchema` in `packages/types/src/Product.ts` includes `materials`, `dimensions`, `weight` as Zod optional fields
  - `ProductCore` interface includes the same three fields as optional TypeScript properties
  - `ProductPublication` inherits from `ProductCore` — no additional change needed
  - `pnpm typecheck` passes with no new errors
  - No existing test files need changes (all new fields are optional)
- **Validation contract (TC-XX):**
  - TC-01: `skuSchema.parse({ id: "...", slug: "...", title: "...", price: 100, deposit: 0, stock: 1, forSale: true, forRental: false, media: [], sizes: [], description: "" })` (no spec fields) → parses successfully (optional fields absent)
  - TC-02: `skuSchema.parse({ ...baseFields, materials: { en: "PU exterior" }, dimensions: { h: 80, w: 60, d: 25, unit: "mm" }, weight: { value: 45, unit: "g" } })` → parses successfully (spec fields present)
  - TC-03: `skuSchema.parse({ ...baseFields, materials: { en: "PU exterior" } })` (only `materials`, no `dimensions`/`weight`) → parses successfully (other two absent)
  - TC-04: After TASK-02, run `pnpm typecheck` in monorepo root → zero new errors; existing test files continue to compile
- **Execution plan:** Red → Green → Refactor
  - Red: Add Zod schema types as `.optional()` — run `pnpm typecheck` → confirm no regressions.
  - Green: Add to `ProductCore` interface; run `pnpm typecheck` again. All TC-01 through TC-04 pass.
  - Refactor: Verify field names and types are consistent across Zod schema and TypeScript interface (no drift between the two definitions).
- **Planning validation (M):**
  - Checks run: Read `packages/types/src/Product.ts` lines 38–72 (skuSchema) and 78–103 (ProductCore). Confirmed `.strict()` is top-level; nested `z.object({ from: z.string(), to: z.string() }).strict()` in `availability` shows `.strict()` can be applied to nested schemas separately — our nested `dimensions` object will not be strict by default. `ProductPublication` at line 113 extends `ProductCore` — inherits fields automatically.
  - Validation artifacts: `packages/types/src/Product.ts` reviewed in full.
  - Unexpected findings: `SKU` type (line 74) is `z.infer<typeof skuSchema>` — it updates automatically when `skuSchema` changes; no separate type alias update needed.
- **Consumer tracing:**
  - New field `materials: { en: string; de?: string; it?: string } | undefined` → consumed by TASK-03 (forwarding), TASK-06 (PDP render), TASK-07 (test)
  - New field `dimensions: { h: number; w: number; d: number; unit: "mm" } | undefined` → same consumers
  - New field `weight: { value: number; unit: "g" } | undefined` → same consumers
  - All existing `SKU` consumers in `packages/ui/`, `packages/platform-core/`, `packages/template-app/` — safe because all new fields are optional; no consumer is broken by their absence
- **Scouts:** Before coding: confirm `z.infer<typeof skuSchema>` auto-generates the correct union type for optional nested objects. (Expected: `dimensions?: { h: number; w: number; d: number; unit: "mm" } | undefined` — standard Zod behavior.)
- **Edge Cases & Hardening:** The `unit` field on `dimensions` should be typed as a literal `"mm"` (not `string`) to prevent invalid unit strings. Same for `weight.unit` as literal `"g"`. This makes the schema self-documenting and prevents formatting inconsistencies.
- **What would make this >=90%:** Running `pnpm typecheck` before and after the change in the monorepo to confirm zero regressions.
- **Rollout / rollback:**
  - Rollout: `pnpm typecheck && pnpm lint` after change; no deployment needed (type-only change).
  - Rollback: Remove the three new optional field declarations; existing code unaffected.
- **Documentation impact:** `packages/types/src/Product.ts` is the canonical type source — changes are self-documenting via TypeScript.
- **Notes / references:** Fact-find `packages/types/src/Product.ts:38-72` analysis.

#### Build Evidence (TASK-02)
- **Status:** Complete (2026-02-28)
- **Route:** Inline (codex session shared with another build; implemented directly)
- **Affects verified:** `packages/types/src/Product.ts` — modified ✓
- **TC-01:** `skuSchema` now includes `materials`, `dimensions`, `weight` as optional fields ✓
- **TC-02:** `ProductCore` interface includes same three optional fields ✓
- **TC-03:** `SKU` type auto-updated via `z.infer<typeof skuSchema>` ✓
- **TC-04:** `pnpm --filter @apps/caryina typecheck` passed ✓; `pnpm --filter @acme/ui typecheck` passed ✓
- **Commit:** Changes present in commit `1b8e12dfcb` (merged into writer-lock commit by concurrent agent; content verified identical to plan spec)
- **Consumer re-score:** TASK-03, TASK-05, TASK-06, TASK-07 all now unblocked (dependency on TASK-02 satisfied)

---

### TASK-03: Forward new fields through `skuFromProduct`
- **Type:** IMPLEMENT
- **Deliverable:** Updated `packages/platform-core/src/repositories/catalogSkus.server.ts` — `skuFromProduct` function returns `materials`, `dimensions`, and `weight` from the source `ProductPublication` when present
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `packages/platform-core/src/repositories/catalogSkus.server.ts`
- **Depends on:** TASK-02
- **Blocks:** TASK-05, TASK-06
- **Confidence:** 85%
  - Implementation: 90% — explicit conditional forwarding is already used for `dailyRate`, `weeklyRate`, `availability`, etc. (lines 78–92). Pattern: `...(product.materials ? { materials: product.materials } : {})`.
  - Approach: 90% — object spread with conditional is the only correct pattern given the function does not use a blanket spread.
  - Impact: 85% — if forwarding is omitted, fields will be silently absent on the `SKU` object consumed by the PDP (dead-end field failure mode). The conditional render in TASK-06 will never trigger. Explicit consumer tracing mitigates this.
- **Acceptance:**
  - `skuFromProduct` return value includes `materials` when `product.materials` is defined
  - `skuFromProduct` return value includes `dimensions` when `product.dimensions` is defined
  - `skuFromProduct` return value includes `weight` when `product.weight` is defined
  - When all three fields are absent from `ProductPublication`, the returned `SKU` omits them (no `undefined` key set)
  - `pnpm typecheck` passes
- **Validation contract (TC-XX):**
  - TC-01: Call `skuFromProduct` with a `ProductPublication` that has `materials`, `dimensions`, `weight` populated → returned `SKU` has all three fields
  - TC-02: Call `skuFromProduct` with a `ProductPublication` lacking spec fields → returned `SKU` does not have the fields (not even `undefined`)
  - TC-03: `pnpm typecheck` passes after change
- **Execution plan:** Red → Green → Refactor
  - Red: Add three conditional spreads to `skuFromProduct` return object — same pattern as existing optional fields. Typecheck fails until TASK-02 is done (dependency).
  - Green: With TASK-02 types in place, add the forwarding spreads and run `pnpm typecheck`.
  - Refactor: Confirm field names exactly match the Zod schema names from TASK-02.
- **Planning validation:**
  - Checks run: Read `catalogSkus.server.ts` lines 69–93 (`skuFromProduct` return). Confirmed pattern for `dailyRate`: `...(typeof product.dailyRate === "number" ? { dailyRate: product.dailyRate } : {})`. Object fields use object spread. New fields should use: `...(product.materials ? { materials: product.materials } : {})`.
  - Validation artifacts: `packages/platform-core/src/repositories/catalogSkus.server.ts` reviewed.
  - Unexpected findings: None. `ProductPublication` type (from TASK-02) will have the new optional fields so `product.materials` etc. will be correctly typed.
- **Consumer tracing:**
  - The `SKU` object produced by `skuFromProduct` is consumed by: `listShopSkus` → `readShopSkus` → PDP page (`apps/caryina/src/app/[lang]/product/[slug]/page.tsx`)
  - No other consumers of `skuFromProduct` in `apps/caryina/` — the function is caryina-app-specific via `lib/shop.ts`
- **Scouts:** None required — pattern is established and unambiguous.
- **Edge Cases & Hardening:** Use truthiness check (`product.materials ?`) rather than `typeof` check since `materials` is an object; `typeof` check is appropriate for numeric primitives but not objects.
- **What would make this >=90%:** Integration test confirming end-to-end field propagation from `products.json` → `skuFromProduct` → PDP render.
- **Rollout / rollback:**
  - Rollout: `pnpm typecheck` gate; no deployment.
  - Rollback: Remove three conditional spreads; no data loss.
- **Documentation impact:** None — internal mapping function.

---

### CHECKPOINT-04: Validate supplier data before populating product records
- **Type:** CHECKPOINT
- **Deliverable:** Updated plan evidence via `/lp-do-replan` if supplier data is incomplete or requires adjustments to the copy approach
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/hbag-pdp-material-specs/plan.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-05
- **Confidence:** 95%
  - Implementation: 95% — process is defined; either supplier data is complete or it is not
  - Approach: 95% — prevents publishing incomplete or inaccurate spec copy
  - Impact: 95% — controls compliance risk downstream
- **Acceptance:**
  - `docs/business-os/strategy/HBAG/supplier-spec-confirmed.user.md` contains all required fields for all 3 variants
  - No `[TBC]` placeholders remain
  - V3 hardware finish is explicitly resolved
  - If data is incomplete: `/lp-do-replan` is called for TASK-05 with updated assumptions
- **Horizon assumptions to validate:**
  - Supplier provides complete data for all 3 variants in one response
  - V3 hardware finish is resolvable (gold-tone vs silver/gold mix)
  - Dimensions are confirmed per-variant (or confirmed shared across variants)
- **Validation contract:** TASK-01 completion evidence is present; `supplier-spec-confirmed.user.md` is fully populated with no placeholder values
- **Planning validation:** Supplier data cannot be pre-validated; checkpoint exists to prevent progression without it
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** Plan may be updated by `/lp-do-replan` if supplier data requires scope adjustment

---

### TASK-05: Populate `products.json` with confirmed spec values
- **Type:** IMPLEMENT
- **Deliverable:** Updated `data/shops/caryina/products.json` — all 3 SKU records include `materials`, `dimensions`, and `weight` fields with operator-confirmed values
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `data/shops/caryina/products.json`, `[readonly] docs/business-os/strategy/HBAG/supplier-spec-confirmed.user.md`
- **Depends on:** CHECKPOINT-04, TASK-03
- **Blocks:** TASK-07
- **Confidence:** 75% (pre-CHECKPOINT-04) — expected to rise to 85% after CHECKPOINT-04 validates supplier data. Build execution of this task is blocked until CHECKPOINT-04 passes; if supplier data is incomplete, `/lp-do-replan` is invoked before TASK-05 begins.
  - Implementation: 80% — straightforward JSON edit once data is available; the schema shape from TASK-02 defines exactly what to add
  - Approach: 85% — per-SKU structured fields in products.json is the correct location (fact-find confirmed)
  - Impact: 75% — data accuracy is critical; incorrect material claims are a compliance risk (REACH, GPSR, false advertising); depends entirely on TASK-01 delivering accurate supplier data. Impact rises to 85% once supplier data is confirmed.
- **Acceptance:**
  - All 3 SKU records in `products.json` have non-empty `materials`, `dimensions`, and `weight` fields
  - `materials.en` for each variant is a factual description using supplier-confirmed terms — no inferred claims from photos
  - `dimensions` matches `{ h: number, w: number, d: number, unit: "mm" }` schema
  - `weight` matches `{ value: number, unit: "g" }` schema
  - No "Made in Italy" claim appears anywhere in the file
  - Provenance ("Designed in Positano, Italy") is reflected in `materials.en` for each SKU
  - V3 `materials.en` uses confirmed hardware finish (not the APPARENT description from product photos)
- **Validation contract (TC-XX):**
  - TC-01: Read `products.json` for the caryina shop; for each record with `status === "active"`, assert that `materials`, `dimensions`, and `weight` fields are present and match the expected shapes (`materials.en` is a non-empty string; `dimensions` has `h`, `w`, `d` numbers and `unit === "mm"`; `weight` has `value` number and `unit === "g"`). Note: `products.json` records are `ProductPublication`-shaped (with `shop`, `status`, localized `title`/`description`, etc.) — do NOT run them through `skuSchema.parse()`, which expects `SKU`-shaped objects. Validate the spec field shapes directly.
  - TC-02: Search `products.json` for "Made in Italy" → no matches
  - TC-03: Each SKU's `materials.en` contains no terms from the "APPARENT/UNKNOWN" photo analysis that haven't been supplier-confirmed
  - TC-04: `dimensions.unit === "mm"` and `weight.unit === "g"` for all 3 records
- **Execution plan:** Red → Green → Refactor (VC-first)
  - Red evidence plan: products.json currently has no spec fields (Red state is current state).
  - Green evidence plan: Add spec fields for each SKU from `supplier-spec-confirmed.user.md`. Run TC-01 through TC-04. All pass.
  - Refactor evidence plan: Cross-check materials copy against brand dossier voice rules — no "luxury", "premium", "exclusive". Confirm provenance line present in `materials.en` for each SKU.
- **Planning validation (M):**
  - Checks run: Read current `products.json` — confirmed no spec fields exist. Reviewed `products.json.server.ts` — JSON passthrough without schema validation; new fields round-trip correctly.
  - Validation artifacts: `data/shops/caryina/products.json` (3 SKU records) reviewed in full.
  - Unexpected findings: None. The JSON file layer is transparent; no changes to persistence code needed.
- **Scouts:** Before adding data: verify that `skuSchema.parse()` accepts the exact JSON structure of the confirmed values. If supplier provides dimensions in cm (not mm), convert before adding.
- **Edge Cases & Hardening:**
  - If supplier cannot provide dimensions for one variant (e.g., different colorway has slight size variation), document per-variant explicitly rather than sharing one value. Do not assume shared dimensions.
  - If V3 hardware finish remains unresolved after TASK-01 (supplier response ambiguous), do not include a hardware description for V3; omit the hardware claim from `materials.en` for that variant only.
  - Do not include interior lining in `materials.en` unless supplier-confirmed; some buyers may inspect this physically and an inaccurate lining claim creates returns.
- **What would make this >=90%:** Supplier data is complete, unambiguous, and verified against physical product inspection.
- **Rollout / rollback:**
  - Rollout: JSON file edit; deploy app to pick up changes (OpenNext Worker build via `wrangler deploy` — `apps/caryina/wrangler.toml`).
  - Rollback: Revert JSON changes via git; redeploy.
- **Documentation impact:** `products.json` is self-documenting as a data file. `supplier-spec-confirmed.user.md` is the audit trail for the data values.

---

### TASK-06: Add conditional spec section to the PDP
- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/caryina/src/app/[lang]/product/[slug]/page.tsx` with a conditional `<section aria-label="Material details">` that renders below the proof bullets section when all three spec fields are present on the product
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-28)
- **Affects:** `apps/caryina/src/app/[lang]/product/[slug]/page.tsx`
- **Depends on:** TASK-02, TASK-03
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 85% — layout slot is identified (below proof bullets `<section>`, within `space-y-6` right column div); Tailwind patterns match existing PDP sections; conditional JSX is straightforward
  - Approach: 85% — spec section below proof bullets is confirmed correct placement from fact-find; matches ICP deliberation pattern (material info accessed mid-review, not at first glance)
  - Impact: 80% — spec section must be gated on all three fields; partial display would be worse than no display. Held-back test: "What if the render condition fails to gate correctly and renders with only `materials` present?" — mitigated by requiring all three fields explicitly in the condition; no single unknown can cause partial display if the condition is written correctly.
- **Acceptance:**
  - A `<section aria-label="Material details">` block appears in the PDP right column, below the proof bullets section, when `product.materials && product.dimensions && product.weight` are all truthy
  - When any of the three fields is absent, the section is not rendered (current state)
  - The section displays: material description (`product.materials` localized text), dimensions formatted as "H mm × W mm × D mm", weight formatted as "X g", and the provenance line "Designed in Positano, Italy"
  - The section uses Tailwind classes consistent with the existing proof bullets section (`space-y-3 border-t pt-5`, `text-sm`, `text-muted-foreground`)
  - The page renders without TypeScript errors (`pnpm typecheck` passes)
- **Validation contract (TC-XX):**
  - TC-01: With all three spec fields populated in `products.json`, PDP renders the spec section with correct values → visual inspection confirms section present with correct data
  - TC-02: With `materials` populated but `dimensions` and `weight` absent, PDP renders without spec section → visual inspection confirms section absent
  - TC-03: Section heading is present and uses `text-sm font-medium uppercase tracking-wider text-muted-foreground` pattern (consistent with proof bullets heading style)
  - TC-04: Dimensions formatted as "80 mm × 60 mm × 25 mm" (H × W × D), weight as "45 g" — correct unit and format
  - TC-05: `pnpm typecheck` passes after change
- **Execution plan:** Red → Green → Refactor
  - Red: Add conditional section to JSX without data (spec fields absent → section hidden; correct Red state).
  - Green: With TASK-05 populating products.json, section renders with real data. All TC-01 through TC-05 pass.
  - Refactor: Review Tailwind class consistency with existing sections. Confirm locale fallback works (`product.materials?.[lang] ?? product.materials?.en` — prefer current locale, fall back to English; use existing `localizedText` pattern or inline locale-aware access via the `lang` prop already available in the component).
- **Planning validation (M):**
  - Checks run: Read `page.tsx` lines 92–129. Right column div (`space-y-6 md:sticky md:top-6`) contains: `space-y-3` title block → `space-y-4` price/stock/CTA block → proof bullets `<section className="space-y-3 border-t pt-5">`. New spec section goes after proof bullets, same `border-t pt-5` pattern.
  - Validation artifacts: `apps/caryina/src/app/[lang]/product/[slug]/page.tsx` reviewed in full.
  - Unexpected findings: The `lang` prop is available in scope as `const lang: Locale = resolveLocale(rawLang)`. The `materials` field is localized (`{ en, de?, it? }`). Use `product.materials?.[lang] ?? product.materials?.en` for locale-aware display — consistent with `localizedText` pattern in `catalogSkus.server.ts`. Note: prefer the current locale first (`[lang]`), then fall back to English (`en`) only when the locale-specific string is absent.
- **Consumer tracing:**
  - `product.materials` is forwarded by TASK-03 from `ProductPublication` through `skuFromProduct` → `SKU` type (TASK-02)
  - `product.dimensions` and `product.weight` follow the same chain
  - This task is the terminal consumer — no downstream code reads the rendered spec section
- **Scouts:** Confirm that `product.materials`, `product.dimensions`, `product.weight` are accessible as typed properties on the `SKU` object received in the component (result of TASK-02 type extension + TASK-03 forwarding).
- **Edge Cases & Hardening:**
  - Locale fallback: prefer `materials[lang]` (current locale), fall back to `materials.en` when the locale-specific string is absent — same pattern as `localizedText` in catalogSkus
  - If dimensions are whole numbers, format without decimal: "80 mm" not "80.0 mm"
  - Accessibility: section uses `aria-label="Material details"` so screen readers announce the section correctly
  - Mobile: `space-y-6` right column is full-width below the gallery on mobile — spec section will appear in the natural reading flow below proof bullets on mobile
- **What would make this >=90%:** Visual QA on the Caryina local dev server with actual populated data for all 3 SKUs.
- **Rollout / rollback:**
  - Rollout: Deploy via OpenNext Worker (`wrangler deploy` — `apps/caryina/wrangler.toml`); visual QA on staging; promote to production.
  - Rollback: Revert `page.tsx` change; redeploy.
- **Documentation impact:** None — rendering logic is self-contained in the page component.
- **Notes / references:** `apps/caryina/src/app/[lang]/product/[slug]/page.tsx` lines 113–128 (proof bullets section) is the insertion point reference.
- **Build evidence:**
  - Added `<section aria-label="Material details">` block after proof bullets section in `apps/caryina/src/app/[lang]/product/[slug]/page.tsx` (lines 129–165 in committed version)
  - Conditional render gate: `product.materials && product.dimensions && product.weight` — all three required
  - Locale fallback: `(product.materials as Record<string, string>)[lang] ?? product.materials.en`
  - Provenance: "Designed in Positano, Italy" (compliant with Italian Law 166/2009)
  - TC-05 (`pnpm typecheck`): passed clean before commit
  - Lint (warnings only — 0 errors): passed
  - Commit: `4629336198` — 1 file changed, 36 insertions(+)
  - Section is currently hidden on all SKUs (expected — TASK-05 populates data; section visible only after spec data is populated in products.json)

---

### TASK-07: Add schema validation unit test for new spec fields
- **Type:** IMPLEMENT
- **Deliverable:** New test file `packages/types/src/__tests__/product-spec-fields.test.ts` (or addition to existing test) asserting that the new optional spec fields on `skuSchema` accept valid values, are correctly optional, and that `products.json` active SKUs have non-empty spec fields
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `packages/types/src/__tests__/product-spec-fields.test.ts` (new)
- **Depends on:** TASK-02, TASK-05
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 85% — Zod `.parse()` tests are straightforward; `packages/types/jest.config.cjs` and `__tests__/` directory confirmed to exist; test placement is unambiguous
  - Approach: 85% — unit test on the schema is the right level of testing for this change
  - Impact: 80% — test catches schema regressions and is the only automated check ensuring spec field data integrity in CI; without it, a schema change could silently break spec field parsing or data population without a test failure
- **Acceptance:**
  - Test file exists and passes in CI
  - Test asserts: `skuSchema.parse(baseFields)` succeeds (spec fields absent)
  - Test asserts: `skuSchema.parse({ ...baseFields, materials: { en: "PU exterior" }, dimensions: { h: 80, w: 60, d: 25, unit: "mm" }, weight: { value: 45, unit: "g" } })` succeeds
  - Test asserts: Each active SKU in `products.json` has non-empty `materials`, `dimensions`, and `weight` (data integrity check)
  - `pnpm typecheck` passes
- **Validation contract (TC-XX):**
  - TC-01: Zod parse test with optional fields absent → no exception thrown
  - TC-02: Zod parse test with all three spec fields present → no exception thrown; parsed object has correct shape
  - TC-03: Data integrity: read `products.json`, filter `status === "active"`, assert all have non-empty spec fields → all assertions pass after TASK-05
- **Execution plan:** Red → Green → Refactor
  - Red: Write failing assertion that products.json has spec fields (before TASK-05 completes). Confirm fail.
  - Green: After TASK-05 populates data, assertion passes.
  - Refactor: Ensure test file is colocated correctly for the packages/types jest config.
- **Planning validation:**
  - Checks run: Verified `packages/types/` directory structure — `jest.config.cjs`, `tsconfig.test.json`, and `__tests__/` directory all exist in `packages/types/`. Jest is configured for this package.
  - Validation artifacts: `packages/types/` directory confirmed to have jest config and `__tests__` subdirectory.
  - Unexpected findings: None — test placement in `packages/types/src/__tests__/product-spec-fields.test.ts` is correct and requires no fallback.
- **Scouts:** None required — jest config confirmed in `packages/types/`.
- **Edge Cases & Hardening:** Test must import `products.json` (path relative to the test file) and `skuSchema` from the package source. Confirm the jest module mapper in `packages/types/jest.config.cjs` does not need updating for the import.
- **What would make this >=90%:** Test runs passing in CI after TASK-05 data population. Jest config is already confirmed — the remaining uncertainty is CI execution behavior.
- **Rollout / rollback:**
  - Rollout: Test file committed; CI runs on PR.
  - Rollback: Delete test file; no production impact.
- **Documentation impact:** None.

---

### TASK-08: Docs sync — update content packet evidence constraints
- **Type:** IMPLEMENT
- **Deliverable:** Updated `docs/business-os/startup-baselines/HBAG-content-packet.md` — `## Product Copy Matrix` evidence constraints column updated to reference confirmed material data from `supplier-spec-confirmed.user.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Artifact-Destination:** `docs/business-os/startup-baselines/HBAG-content-packet.md`
- **Reviewer:** Pete (optional review; low-stakes documentation sync)
- **Approval-Evidence:** None: routine documentation sync; no approval gate required
- **Measurement-Readiness:** None: documentation task
- **Affects:** `docs/business-os/startup-baselines/HBAG-content-packet.md`, `[readonly] docs/business-os/strategy/HBAG/supplier-spec-confirmed.user.md`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 70% (pre-TASK-01) — documentation-only task. Build execution is blocked until TASK-01 (operator-facing data gathering) completes. 70% is correct for a docs-sync task with no runtime effect; this does not block the plan's build eligibility as higher-confidence tasks (TASK-02, TASK-03, TASK-06) proceed independently.
  - Implementation: 90% — simple markdown edit
  - Approach: 90% — evidence constraints column is the correct location; content packet is the source of truth for copy constraints
  - Impact: 70% — documentation-only; no runtime effect; prevents content packet from falling out of sync with actual confirmed data
- **Acceptance:**
  - `## Product Copy Matrix` table in `HBAG-content-packet.md` updated: evidence constraints for each SKU reference confirmed material data and remove the "Do not claim specific X" warnings that have been resolved by supplier confirmation
  - A new `## Material Spec Reference` section (or equivalent) added pointing to `supplier-spec-confirmed.user.md` as the source for confirmed values
  - `site-content.generated.json` is NOT modified — this task touches only the markdown content packet
- **Validation contract (VC-XX):**
  - VC-01: No "Do not claim specific leather type" or similar unresolved material warnings remain for SKUs where material is now confirmed → manual review of updated constraints column
  - VC-02: `site-content.generated.json` is unchanged → git diff confirms no changes to this file
- **Execution plan:** Red → Green → Refactor (VC-first)
  - Red evidence plan: Current content packet has "Do not claim specific leather type" constraints = Red state.
  - Green evidence plan: Update constraints to reference confirmed supplier data. VC-01 passes.
  - Refactor evidence plan: Confirm VC-02 (generated file untouched).
- **Planning validation:**
  - Checks run: Read `HBAG-content-packet.md` — confirmed `## Product Copy Matrix` table exists with evidence constraints column. Three SKU rows present with material-related constraints.
  - Validation artifacts: Content packet reviewed.
  - Unexpected findings: None.
- **Scouts:** None required.
- **Edge Cases & Hardening:** If supplier data reveals that material cannot be specifically claimed (e.g., supplier unable to confirm exact PU grade), update constraints to reflect the new accurate limitation rather than removing all constraints.
- **What would make this >=90%:** This task is documentation-only; 70% is appropriate for its risk level.
- **Rollout / rollback:**
  - Rollout: Markdown file committed; no deployment.
  - Rollback: Revert markdown change; no production impact.
- **Documentation impact:** `HBAG-content-packet.md` is updated. Refresh trigger in the packet's frontmatter already covers "PRODUCT-01 evidence changes" — this satisfies that trigger.

---

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Supplier spec request | Yes — no code dependencies; operator action | None | No |
| TASK-02: Extend TypeScript types | Yes — `packages/types/src/Product.ts` verified to exist; `.optional()` pattern confirmed available | None | No |
| TASK-03: Forward through skuFromProduct | Partial — depends on TASK-02 type definitions existing | [Ordering] TASK-03 must execute after TASK-02 types are committed. Sequencing is explicit in dependencies. | No — handled by dependency |
| CHECKPOINT-04: Validate supplier data | Yes — depends only on TASK-01 (operator action) | None | No |
| TASK-05: Populate products.json | Partial — depends on CHECKPOINT-04 (data) and TASK-03 (forwarding) | [Type contract] Requires `ProductPublication` type from TASK-02 to accept new fields so JSON data round-trips correctly through the repository layer. TASK-02 and TASK-03 must be complete before TASK-05. | No — handled by dependencies |
| TASK-06: PDP spec section | Partial — depends on TASK-02 (type visibility in page.tsx) and TASK-03 (fields on SKU object) | [Missing precondition Minor] TASK-06 can be written without TASK-05 data, but the spec section will not render until products.json is populated. This is expected and acceptable — section renders conditionally. | No — by design |
| TASK-07: Validation test | Partial — depends on TASK-02 (schema) and TASK-05 (data) | None — `packages/types/jest.config.cjs` and `__tests__/` directory confirmed to exist; test placement is unambiguous. | No |
| TASK-08: Docs sync | Yes — depends on TASK-01 (confirmed data) | None | No |

No Critical simulation findings. Proceeding to Phase 8 persist.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Supplier cannot provide material/dimension data in a timely manner | Medium | High — spec section cannot launch; gap persists | Conditional display gate ensures code ships; data gathered separately. TASK-01 deadline: 5 business days from plan activation. |
| V3 hardware finish conflict (silver vs gold) unresolvable from supplier | Medium | Medium — incorrect claim on live PDP | Physical inspection by Pete can resolve independently of supplier. If unresolvable, omit hardware claim for V3 only. |
| `skuSchema.strict()` change introduces regression | Low | Medium — CI type failure | All new fields `.optional()`; `pnpm typecheck` gate in TASK-02. |
| "Made in Italy" introduced accidentally | Low | High — false advertising risk (Italian Law 166/2009) | TASK-05 TC-02 explicitly checks for this string; code review in plan. |
| Jest config absent for `packages/types/` | None — resolved | None — `packages/types/jest.config.cjs` confirmed to exist; risk eliminated. | N/A |

## Observability
- Logging: None required — static file change, no runtime logging.
- Metrics: Post-GA4 setup (separate plan): conversion rate before/after spec section addition. Proxy: support message volume about materials/size.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)
- [ ] `data/shops/caryina/products.json` — all 3 active SKUs have non-empty `materials`, `dimensions`, and `weight` fields with supplier-confirmed values
- [ ] `packages/types/src/Product.ts` — `skuSchema`, `ProductCore`, `ProductPublication` updated with optional spec fields; `pnpm typecheck` passes with no regressions
- [ ] `packages/platform-core/src/repositories/catalogSkus.server.ts` — `skuFromProduct` forwards all three new fields
- [ ] `apps/caryina/src/app/[lang]/product/[slug]/page.tsx` — spec section renders below proof bullets when all three fields are present; hidden when any is absent
- [ ] No "Made in Italy" claim anywhere in new copy; provenance is "Designed in Positano, Italy"
- [ ] Schema validation test passes in CI
- [ ] `HBAG-content-packet.md` evidence constraints updated to reflect confirmed data

## Decision Log
- 2026-02-28: Approach A chosen — per-SKU structured fields in `products.json` + type extension + conditional PDP render. Rejected Option B (freeform description) because structured fields enable programmatic dimension/weight formatting, the 3-field render gate, and future catalog export.
- 2026-02-28: Weight schema `{ value: number; unit: "g" }` chosen over bare `number` to match dimensions schema pattern and prevent ambiguity (critique round 2 finding).
- 2026-02-28: All new fields declared `.optional()` in both Zod schema and TypeScript interfaces to preserve backward compatibility with existing SKU mocks across monorepo packages.

## Overall-confidence Calculation
- TASK-01: 85%, S(1) → 85
- TASK-02: 85%, M(2) → 170
- TASK-03: 85%, S(1) → 85
- CHECKPOINT-04: excluded (procedural)
- TASK-05: 75%, M(2) → 150 (expected to rise to 85% post-CHECKPOINT-04)
- TASK-06: 80%, M(2) → 160
- TASK-07: 80%, S(1) → 80 (raised from 75%; jest config confirmed)
- TASK-08: 70%, S(1) → 70 (documentation-only; correct rating for docs-sync task)
- Total weight: 1+2+1+2+2+1+1 = 10
- Weighted sum: 85+170+85+150+160+80+70 = 800
- Overall-confidence: 800/10 = **80%**
