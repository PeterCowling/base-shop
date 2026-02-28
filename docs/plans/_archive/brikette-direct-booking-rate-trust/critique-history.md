---
Type: Critique-History
Status: Archive
Feature-Slug: brikette-direct-booking-rate-trust
---

# Critique History — brikette-direct-booking-rate-trust

## Plan — Round 1 — 2026-02-27

- Route: codemoot
- lp_score: 3.0 (6/10)
- Verdict: needs_revision
- Severity counts: Critical 1 / Major 3 / Minor 0 / Info 1
- Findings:
  1. [Critical] TASK-03 under-scoped: badge belongs in `packages/ui/src/molecules/RoomCard.tsx` `PriceBlock`, not in brikette wrapper; requires 3-file change including type extension
  2. [Major] TASK-05 test file mismatch: `booking-modals-direct-copy.test.tsx` is wrong surface for RoomCard badge test; should be `ga4-11-select-item-room-ctas.test.tsx`
  3. [Major] TASK-01 consumer tracing incomplete: `offers.perks.discount` consumed by `OffersModal` (opened from multiple surfaces), not just `HomeContent.tsx`
  4. [Major] TASK-03 claim path reference weak: `PolicyFeeClarityPanel.tsx` does not implement WhatsApp claim path; `ApartmentBookContent.tsx` is the correct precedent
  5. [Info] Terminology inconsistency: `getActiveDeal(...).length` vs `getActiveDealCount(...)` — standardized to `getActiveDealCount`
- Action: Applied all fixes; re-scoped TASK-03 to 3-file change; corrected test file references.

## Plan — Round 2 — 2026-02-27

- Route: codemoot
- lp_score: 4.0 (8/10)
- Verdict: needs_revision (score ≥ 4.0 → credible; no Critical findings)
- Severity counts: Critical 0 / Major 2 / Minor 0 / Info 1
- Findings:
  1. [Major] TASK-05 execution plan still referenced `booking-modals-direct-copy.test.tsx` (residual from Round 1)
  2. [Major] TASK-04 evergreen deal object omits required `DealConfig` validity fields — type check will fail
  3. [Info] `getActiveDealCount` helper doesn't exist yet; must be created or use inline filter
- Action: Applied fixes; corrected residual test file reference; added DealConfig type-read Scout; added helper creation note.
- Post-loop gate: score ≥ 4.0, no Critical findings → credible → auto-continue to build.

---

## Round 1 — 2026-02-27

- Route: codemoot
- lp_score: 3.5 (7/10)
- Verdict: needs_revision
- Severity counts: Critical 0 / Major 3 / Minor 0
- Findings:
  1. [Major] Line 81: locale path cited as `apps/brikette/public/locales/en/modals.json` — incorrect; actual path is `apps/brikette/src/locales/en/modals.json`
  2. [Major] Line 107: locale list incomplete (`IT/DE/FR/ES/PT` only) — actual full set is 18 locales
  3. [Major] Line 123: test command guidance (local Jest run) conflicts with CI-only test policy
- Action: Applied all three fixes before Round 2.

## Round 2 — 2026-02-27

- Route: codemoot
- lp_score: 4.0 (8/10)
- Verdict: needs_revision
- Severity counts: Critical 0 / Major 3 / Minor 0
- Findings:
  1. [Major] Line 86: residual `public/locales` reference in Patterns section
  2. [Major] Line 103: residual `public/locales` reference in Dependency map
  3. [Major] Line 123: governed Jest command still listed; CI-only policy prohibits all local test invocation
- Action: Applied all three fixes before Round 3.

## Round 3 (final) — 2026-02-27

- Route: codemoot
- lp_score: 4.0 (8/10)
- Verdict: needs_revision (score ≥ 4.0 → credible; no Critical findings)
- Severity counts: Critical 0 / Major 4 / Minor 0 / Info 1
- Findings:
  1. [Major] Line 122: Cypress listed in test stack; Brikette uses Playwright for E2E (`apps/brikette/scripts/e2e/*.mjs`)
  2. [Major] Line 129: i18n test path incorrect — actual: `apps/brikette/src/test/content-readiness/i18n/i18n-parity-quality-audit.test.ts`
  3. [Major] Line 130: `DirectBookingPerks` coverage marked "Not confirmed" — tests exist at `apps/brikette/src/test/components/booking-modals-direct-copy.test.tsx`
  4. [Major] Line 131: `DealsPageContent` coverage marked "Not confirmed" — tests exist at `apps/brikette/src/test/components/ga4-34-deals-page-promotions.test.tsx`
  5. [Info] Line 86: locale path convention now correct
- Action: Applied factual corrections. Final round — not looping further.
- Post-loop gate: score ≥ 4.0, no Critical findings → credible → proceed to auto-handoff.
