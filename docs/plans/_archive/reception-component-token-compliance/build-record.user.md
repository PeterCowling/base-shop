---
Type: Build-Record
Status: Complete
Feature-Slug: reception-component-token-compliance
Completed-date: 2026-03-08
artifact: build-record
Build-Event-Ref: docs/plans/reception-component-token-compliance/build-event.json
---

# Build Record: Reception Component Token Compliance

**Plan:** `docs/plans/reception-component-token-compliance/plan.md`
**Completed:** 2026-03-08
**Commit:** `ca7ecaa4dc`

## Outcome Contract

- **Why:** Each reception screen reinvents its visual language with hardcoded classes rather than consuming the semantic token system. This causes visual inconsistency and makes theme changes ineffective across the app.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All reception screens consume semantic tokens for surfaces, borders, and text hierarchy — no hardcoded color values or ad-hoc style patterns.
- **Source:** operator

## What Was Built

### TASK-01: Fix CompScreen dynamic class and ModalPreorderDetails border

Replaced the broken dynamic class interpolation `bg-${accentBase}` in CompScreen.tsx with an explicit ternary (`accent === "success" ? "bg-success-main" : "bg-error-main"`), which Tailwind JIT can statically analyse and generate. Removed the now-unused `accentBase` variable. Added `border-border-1` to ModalPreorderDetails.tsx night section borders so they use the standard reception border token instead of relying on the browser default.

### TASK-02: Replace PIN input non-semantic focus colors with semantic tokens

Replaced five non-semantic Tailwind default palette colors (`focus:bg-pink-400`, `focus:bg-purple-400`, `focus:bg-sky-400`, `focus:bg-teal-400`, `focus:bg-amber-400`) in both PinInput.tsx and PinLoginInline.tsx with their semantic equivalents (`focus:bg-accent`, `focus:bg-primary-main`, `focus:bg-info-main`, `focus:bg-success-main`, `focus:bg-warning-main`). Each PIN digit retains a distinct focus colour, now drawn from the semantic token system.

### Additional: OffersModal TypeScript fix

Fixed pre-existing TypeScript errors in OffersModal.tsx (type assertions for discount calculations) that were blocking the commit.

## Validation Results

| Task | Validation | Result |
|---|---|---|
| TASK-01 | TC-01: CompScreen accent="success" has bg-success-main | Pass |
| TASK-01 | TC-02: CompScreen accent="error" has bg-error-main | Pass |
| TASK-01 | TC-03: ModalPreorderDetails has border border-border-1 | Pass |
| TASK-01 | TC-04: Typecheck passes | Pass |
| TASK-01 | TC-05: Lint passes | Pass |
| TASK-02 | TC-01: PIN_BG_CLASSES contains only semantic tokens | Pass |
| TASK-02 | TC-02: PinLoginInline matches PinInput | Pass |
| TASK-02 | TC-03: 6 distinct focus colours maintained | Pass |
| TASK-02 | TC-04: Typecheck passes | Pass |
| TASK-02 | TC-05: Lint passes | Pass |

## Scope Deviations

OffersModal.tsx required TypeScript fixes (type assertions for discount calculation) to pass typecheck. This was a pre-existing issue unrelated to token compliance, fixed to unblock the commit.
