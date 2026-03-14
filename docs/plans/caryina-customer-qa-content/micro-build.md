# Micro-build: caryina-customer-qa-content

**Dispatches**: HBAG-002, HBAG-003, HBAG-004, HBAG-005, HBAG-006, HBAG-007, HBAG-011, HBAG-012
**Built**: 2026-03-14
**Status**: Complete

## Summary

8 sequential content/copy/policy additions to the Caryina app. No new architecture or components. All changes are additive and backward-compatible.

---

## Task 1 — HBAG-002: FAQ expansion

**File**: `data/shops/caryina/site-content.generated.json`

Added 6 new FAQ items to `home.faqItems` (total now 8). All items localised en/de/it.

New items:
- How big are the charms? — PLACEHOLDER (operator must fill dimensions per family)
- What bag does it clip onto? — PLACEHOLDER (operator must describe attachment)
- What is it made from? — PLACEHOLDER (operator must specify materials)
- How do I care for it? — Static answer (wipe with damp cloth, avoid heat/water)
- Can I wash it? — Static answer (no machine wash, wipe gently)
- When will out-of-stock items be restocked? — Static answer (Notify me button, email alert)

**PLACEHOLDER values**: FAQ answers for dimensions, attachment mechanism, and materials. Operator must replace before deploy.

Note: only one physical copy of the JSON exists (`data/shops/caryina/site-content.generated.json`); the `apps/caryina/data/` path does not exist.

---

## Task 2 — HBAG-003: UK import VAT warning

**Files**:
- `apps/caryina/src/app/[lang]/product/[slug]/page.tsx`
- `apps/caryina/src/app/[lang]/cart/page.tsx`

Added a conditional notice block shown when `lang === "en"` only:

> "UK orders may incur import VAT and customs fees on delivery, charged by the carrier. These are not included in the price shown."

Placed below trust strip on PDP and below the cart summary note.

---

## Task 3 — HBAG-004: Payment methods disclosed

**File**: `apps/caryina/src/app/[lang]/support/page.tsx`

Added a "How to pay" card between the Support channels and Policies blocks.

Content: Visa, Mastercard, American Express, Apple Pay, Google Pay.

**PLACEHOLDER**: Operator must confirm exact payment methods enabled in Stripe/Axerve configuration (HTML comment in source).

---

## Task 4 — HBAG-005: Order tracking info

**Files**:
- `apps/caryina/src/app/[lang]/success/page.tsx`
- `apps/caryina/src/app/[lang]/support/page.tsx`

Success page: Added a "Tracking your order" section below the main success message. States DHL as carrier, advises tracking link arrives by email after dispatch, with 2-business-day fallback window (PLACEHOLDER).

Support page: Added a "Track your order" static card between Support channels and the Payment card. Links to DHL tracking page.

**PLACEHOLDER**: Dispatch window (2 business days) — operator to confirm.

---

## Task 5 — HBAG-006: Returns/exchange policy completeness

**File**: `apps/caryina/src/lib/legalContent.ts`

Four additions:

1. **Refund processing timeline** (cooling-off section): "Once we receive and inspect the returned item, we will process your refund within 14 days. Refunds are made to the original payment method."

2. **Pre-dispatch cancellation** (cooling-off section): "If you wish to cancel your order before it is dispatched, contact us immediately via the Support page or email."

3. **Out-of-stock exchange fallback** (voluntary-exchange section): "If the item you wish to exchange for is out of stock at the time of your request, we will offer you a full refund as an alternative."

4. **Returns address** (how-to-return section): "To obtain the return address, contact us via the Support page or email. We will provide return instructions and the address within 48 hours of your request." (With TODO comment noting operator may also list address directly.)

Also added "We ship via DHL." to shipping policy dispatch section (covering HBAG-012 item 2 / HBAG-007).

**PLACEHOLDER**: Operator may choose to list the returns address directly in policy rather than directing to support.

---

## Task 6 — HBAG-007: VAT inclusion statement

**Files**:
- `apps/caryina/src/app/[lang]/product/[slug]/page.tsx`
- `apps/caryina/src/app/[lang]/shop/page.tsx`

PDP: Added `text-xs text-muted-foreground` label directly beneath price amount:
- en: "Price includes VAT"
- de: "Preis inkl. MwSt."
- it: "Prezzo IVA inclusa"

Shop page: Added the same locale-aware label above the family filter row.

---

## Task 7 — HBAG-011: Social media footer links

**File**: `apps/caryina/src/components/SiteFooter.tsx`

Added Instagram and TikTok links above the copyright line, styled consistently as `text-xs hover:text-foreground hover:underline` with `target="_blank" rel="noopener noreferrer"`.

**PLACEHOLDER URLs** (must replace before deploy):
- Instagram: `https://instagram.com/caryina`
- TikTok: `https://tiktok.com/@caryina`

---

## Task 8 — HBAG-012: Minor trust copy improvements

**8.1 — Support SLA on PDP trust strip**
File: `apps/caryina/src/app/[lang]/product/[slug]/PdpTrustStrip.tsx`
Added a 5th trust strip item: "Questions? We reply within 48 hours" with an envelope SVG icon.

**8.2 / 8.6 — DHL named in shipping policy**
File: `apps/caryina/src/lib/legalContent.ts`
Added "We ship via DHL." at the start of the dispatch section paragraph. (Covered under Task 5 above.)

**8.3 — Returns policy link from PDP proof bullets**
File: `apps/caryina/src/app/[lang]/product/[slug]/page.tsx`
Added `<Link href="/{lang}/returns">See our returns policy</Link>` as a `text-xs underline` below the proof bullets list.

**8.4 — Order confirmation mention on success page**
File: `apps/caryina/src/app/[lang]/success/page.tsx`
Added "A confirmation email has been sent to your email address." near the top of the success section.

**8.5 — Cookie banner data summary**
File: `apps/caryina/src/components/ConsentBanner.client.tsx`
Added "(Google Analytics — page visits and device type only. No personal details are collected.)" inline after `strings.message`.

**8.7 (guest checkout note)**: Scope assessed but not added — the `CheckoutClient.client.tsx` does not have a clear entry-point for a guest checkout note separate from the existing legal notice. Skipped as out of scope; it was marked as optional in the task description.

---

## TypeScript status

`pnpm --filter @apps/caryina typecheck` — passes with no errors.

---

## PLACEHOLDER values requiring operator action before deploy

| Location | PLACEHOLDER | Description |
|---|---|---|
| `data/shops/caryina/site-content.generated.json` faqItems[2].answer | Dimensions per family | Operator to fill in actual H×W×D measurements |
| `data/shops/caryina/site-content.generated.json` faqItems[3].answer | Attachment mechanism | Operator to describe clasp/attachment detail |
| `data/shops/caryina/site-content.generated.json` faqItems[4].answer | Materials | Operator to specify body material and hardware |
| `apps/caryina/src/app/[lang]/support/page.tsx` | Payment methods | Confirm Stripe/Axerve payment method configuration |
| `apps/caryina/src/app/[lang]/success/page.tsx` | Dispatch window | Confirm typical dispatch window (default: 2 business days) |
| `apps/caryina/src/lib/legalContent.ts` how-to-return | Returns address | Operator may list address directly instead of directing to support |
| `apps/caryina/src/components/SiteFooter.tsx` | Instagram URL | Replace `https://instagram.com/caryina` with actual handle |
| `apps/caryina/src/components/SiteFooter.tsx` | TikTok URL | Replace `https://tiktok.com/@caryina` with actual handle |
