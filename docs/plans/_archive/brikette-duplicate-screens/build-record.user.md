# Build Record: brikette-duplicate-screens

**Completed:** 2026-03-13
**Plan:** `docs/plans/brikette-duplicate-screens/plan.md`
**Dispatch:** IDEA-DISPATCH-20260310122535-0004

---

## Outcome Contract

- **Why:** Drift between near-duplicate booking screens was compounding silently; attribution data was absent from all apartment bookings, visual tokens were inconsistent, and the double-room screen had no tests.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Both booking screens use the canonical analytics pattern (attribution present on all handoffs); visual tokens are consistent; double-room has component-level tests matching apartment coverage.
- **Source:** auto

---

## What Was Delivered

Three independent targeted fixes across the two private-room booking screens:

**TASK-01 — Apartment analytics migration** (commit `d5f58b82e0`)
- Replaced `fireHandoffToEngine` (no attribution) with `trackThenNavigate` + `readAttribution` in `ApartmentBookContent.handleCheckout`.
- Extracted `buildAttributionFields` as a pure null-guarded helper — when no attribution carrier is set (direct visit), no attribution fields are added; no error thrown.
- Updated both apartment test files: `ga4-07-apartment-checkout.test.tsx` (added `trackThenNavigate` + `entryAttribution` mocks) and `apartment-booking-url-matrix.test.tsx` (swapped `fireHandoffToEngine` for `trackThenNavigate` with navigate-invoking mock).

**TASK-02 — Visual token drift fix** (commit `4b6fee18b4`)
- 11 CSS class changes in `ApartmentBookContent.tsx`:
  - NR card button: `hover:border-brand-accent` → `hover:border-brand-primary`, `focus-visible:ring-brand-accent` → `focus-visible:ring-brand-primary`
  - NR card footer: `bg-brand-accent/10` → `bg-brand-primary/10`, `group-hover:bg-brand-accent` → `group-hover:bg-brand-primary`
  - NR card CTA span + ArrowRight: `text-brand-accent group-hover:text-brand-on-accent` → `text-brand-primary group-hover:text-brand-on-primary`
  - NR saving badge: `text-brand-heading` → `text-brand-on-accent`
  - Flex saving badge: `text-brand-heading` → `text-brand-on-accent`
  - Date selector card, rate options card, WhatsApp CTA: added `dark:border-white/30`

**TASK-03 — Double-room test suite** (commit `2012430fce`)
- New test file: `apps/brikette/src/test/app/private-rooms/double-room-book-content.test.tsx`
- 5 test cases: NR analytics params (TC-01), flex analytics params (TC-02), disabled state when dates empty (TC-03), NR octorate URL room=433883 (TC-04), flex octorate URL room=433894 (TC-04b).

---

## Engineering Coverage Evidence

| Coverage Area | Status | Evidence |
|---|---|---|
| UI / visual | Delivered | 11 CSS class changes; all 3 dark mode border gaps closed |
| UX / states | N/A | No state logic changes |
| Security / privacy | N/A | No auth/PII changes |
| Logging / observability | Delivered | `handoff_to_engine` events from apartment now carry attribution fields |
| Testing / validation | Delivered | 2 apartment test files updated; 5 double-room tests added |
| Data / contracts | Delivered | Field parity verified: all 10 existing payload fields preserved + 8 attribution fields added |
| Performance / reliability | Pass | Beacon transport preserved via `trackThenNavigate` |
| Rollout / rollback | Delivered | All 3 tasks independently rollbackable via `git revert` |

---

## Workflow Telemetry Summary

| Stage | Records | Avg modules | Avg context bytes | Token coverage |
|---|---:|---:|---:|---:|
| lp-do-build | 1 | 2.00 | 79790 | 0.0% |

Modules loaded: `modules/build-code.md`, `modules/build-validate.md`
Deterministic checks: `scripts/validate-engineering-coverage.sh`

---

## Validation

- Lint: pass (pre-commit hooks, zero warnings)
- Typecheck: pass (`@apps/brikette`)
- Tests: dispatched to CI (tests run in CI only per testing-policy.md)
- Engineering coverage script: pass
