---
Status: Complete
Feature-Slug: hbag-pdp-trust-cues
Completed-date: 2026-02-28
artifact: build-record
Build-Event-Ref: docs/plans/hbag-pdp-trust-cues/build-event.json
---

# Build Record — HBAG PDP Trust Cues

## What Was Built

**TASK-01 (Content packet extension):** Added a `TrustStripCopy` interface and `getTrustStripContent(locale)` getter to `apps/caryina/src/lib/contentPacket.ts`. The new optional `productPage.trustStrip` field follows the existing `LocalizedText` pattern used by all other content packet fields. The corresponding `data/shops/caryina/site-content.generated.json` was updated directly (not via materializer) with canonical English copy for all four trust fields: delivery timeframe ("Usually ships in 2–5 business days (EU)"), exchange window ("30-day exchange"), origin ("Designed in Positano, Italy"), and secure payment ("Secure checkout"). A `_manualExtension` key was added as a guard against silent materializer overwrites. Two pre-existing lint violations in `Header.tsx` and `HeaderThemeToggle.client.tsx` (physical-direction classes, non-layered z-index) were fixed as a required precondition for the lint gate to pass.

**TASK-02 (PdpTrustStrip component):** A new server component `apps/caryina/src/app/[lang]/product/[slug]/PdpTrustStrip.tsx` was created. It renders a four-item `<ul data-cy="pdp-trust-strip">` with inline single-stroke SVG icons. Delivery and exchange items are wrapped in `<Link>` elements pointing to the locale-prefixed shipping and returns policy pages respectively. The component returns `null` when `getTrustStripContent` returns `undefined` (materializer re-run safety). No `"use client"` directive — fully server-rendered.

**TASK-03 + TASK-04 (PDP wiring + StickyCheckoutBar trust line, applied atomically):** `page.tsx` was updated to import and render `<PdpTrustStrip lang={lang} />` between the checkout CTA block and the proof points section. `StickyCheckoutBar.client.tsx` received an optional `trustLine?: string` prop with a conditional `<p className="text-xs text-muted-foreground">` rendered below the price/button row. `page.tsx` passes `trustLine={trustStrip?.exchange}` sourced from the content packet — not a hard-coded string. A concurrent agent (`hbag-pdp-shipping-returns`) had committed a constraint-violating hard-coded `trustLine` string; this was corrected in the same commit batch.

**TASK-05 (Tests):** Two new test files created under the `[lang]/product/[slug]/` directory. `PdpTrustStrip.test.tsx` has 5 tests covering the trust strip wrapper, all four trust items, delivery link, exchange link, and null render when content is absent. `StickyCheckoutBar.client.test.tsx` has 3 tests covering the sentinel element, trust line render, and trust line omission. An `IntersectionObserver` mock was written from scratch in `beforeEach` (no existing IO mock exists in this test suite). All 8 tests pass.

## Tests Run

| Command | Result |
|---|---|
| `pnpm --filter @apps/caryina test --testPathPattern="PdpTrustStrip\|StickyCheckoutBar" --no-coverage` | 8 passed, 0 failed |
| `pnpm --filter @apps/caryina typecheck` | 0 errors (clean) |
| `pnpm --filter @apps/caryina lint` | 0 errors (18 pre-existing warnings, none in scope files) |

## Validation Evidence

| Task | Contract | Evidence |
|---|---|---|
| TASK-01 | TC-01: getTrustStripContent("en") returns all four fields | Confirmed via test output and manual review of contentPacket.ts + site-content.generated.json |
| TASK-01 | TC-02: locale fallback to "en" for unlocalized fields | localizedText() fallback confirmed in contentPacket.ts implementation |
| TASK-01 | TC-03: getProductPageContent("en") unchanged | pnpm typecheck passes; no existing callers broken |
| TASK-01 | TC-04: getTrustStripContent returns undefined when trustStrip absent | Implementation checks productPage.trustStrip existence before reading fields |
| TASK-02 | TC-01: data-cy="pdp-trust-strip" wrapper renders | PdpTrustStrip.test.tsx test 1 passes |
| TASK-02 | TC-02: four list items render | PdpTrustStrip.test.tsx test 2 passes |
| TASK-02 | TC-03: delivery item links to /en/shipping | PdpTrustStrip.test.tsx test 3 passes |
| TASK-02 | TC-04: exchange item links to /en/returns | PdpTrustStrip.test.tsx test 4 passes |
| TASK-02 | TC-05: no "use client" directive | Verified in PdpTrustStrip.tsx (line 1 has no "use client") |
| TASK-04 | TC-01: trust line renders when prop provided | StickyCheckoutBar.client.test.tsx test 2 passes |
| TASK-04 | TC-02: no extra p when trustLine absent | StickyCheckoutBar.client.test.tsx test 3 passes |
| TASK-04 | TC-03: trustLine is optional without breaking existing usages | pnpm typecheck passes; prop is ?:string |
| TASK-05 | All 8 tests pass | Confirmed via governed test runner |

## Scope Deviations

- Pre-existing lint violations in `Header.tsx` (`left-1/2` → `start-1/2`, `ml-auto` → `ms-auto`) and `HeaderThemeToggle.client.tsx` (z-index justification comments) were fixed as required by the lint-staged gate. These files were not in TASK-01 scope but the `lint-staged-packages.sh` hook runs full package lint for any staged `@apps/caryina` file, making these fixes a prerequisite for committing. Rationale recorded in plan TASK-01 build evidence.
- `StickyCheckoutBar.client.tsx` modifications were applied by a concurrent agent before this session's wave-3 atomic commit acquired the writer lock. TASK-04 scope was respected (the trustLine prop and conditional render were already present); this session's contribution was fixing the constraint violation in the `trustLine` prop value on `page.tsx` (content-packet-sourced vs. hard-coded).

## Outcome Contract

- **Why:** The worldclass scan identified zero trust cues near the PDP purchase CTA as a major-gap abandonment driver at the €80–€150 price point. For a new/unknown brand with no physical retail, trust cues near the CTA do the work a store environment would do. Closing this gap is expected to reduce purchase hesitation for ICP-A (considered bag buyer, 3–7 day deliberation window) and ICP-B (gift buyer).
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Reduce PDP-to-checkout drop-off by making key policy commitments visible at the moment of decision. Success signal: checkout initiation rate from PDP improves (measured via GA4 begin_checkout / view_item events, once GA4 is configured). Pre-GA4 proxy: no customer support questions about shipping or returns policy from PDP visitors.
- **Source:** auto
