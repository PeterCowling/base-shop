---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-02-12
Last-updated: 2026-02-12
Feature-Slug: ds-customer-facing-lint-escalation
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: /lp-build
Supporting-Skills: /lp-design-system
Related-Plan: docs/plans/ds-customer-facing-lint-escalation-plan.md
Business-OS-Integration: on
Business-Unit: PLAT
Card-ID: pending
---

# P1 — Design System: Escalate Lint Rules for Customer-Facing Apps

## Scope

### Summary

Escalate `ds/no-raw-tailwind-color` from `warn` to `error` for customer-facing apps (Brikette, Prime, XA variants). Currently developers can merge PRs with `bg-blue-600` instead of `bg-accent` because violations are warnings. This means the centralised design system is eroding with every new feature. The baseline system prevents regressions in *existing* files but doesn't catch new files.

### Goals

- Audit and fix any remaining `ds/no-raw-tailwind-color` violations in Brikette, Prime, and XA apps
- Add scoped ESLint config blocks in `eslint.config.mjs` to escalate `ds/no-raw-tailwind-color` to `error` for these apps
- Ensure no existing violations remain (clean baseline for these apps)
- Prevent future regression: new code in these apps must use semantic tokens

### Non-goals

- Migrating Reception, Business-OS, Dashboard, or Skylar (separate work packages)
- Escalating other DS rules beyond `ds/no-raw-tailwind-color`
- Component restructuring

### Constraints & Assumptions

- Constraints:
  - P0 (shared packages cleanup) should land first — otherwise shared-package violations surface as app-level errors
  - Must not break CI for any existing code
  - Exemption comments (`eslint-disable`) require ticket IDs per `ds/require-disable-justification` rule
- Assumptions:
  - Current violation count in these apps is low (Prime ~5, Brikette ~10, XA ~6 per variant — mostly in scripts/tests/dev)
  - Most existing violations are in test files or dev utilities (already exempted by scope)

## Evidence Audit (Current State)

### Current ESLint Config

```
eslint.config.mjs:260 → "ds/no-raw-tailwind-color": "warn"  (global)
eslint.config.mjs:282 → "ds/no-raw-tailwind-color": "error" (CMS only)
```

No scoped error-level overrides exist for Brikette, Prime, or XA.

### Baseline Violations in These Apps

From `tools/eslint-baselines/ds-no-raw-tailwind-color.json`:
- **Brikette:** 0 baselined violations
- **Prime:** 0 baselined violations
- **XA variants:** 0 baselined violations

This means any current violations in these apps are producing warnings that don't block CI.

### Known Violations (from audit)

**Prime** (~5 files):
- Test files: `onboarding.ds-migration.test.tsx` — already in test scope (DS rules off)
- Dev components: `FirebaseMetricsPanel.tsx` — already in `apps/prime/src/components/dev/**` scope (DS rules off)
- QR code generation: may use hex legitimately

**Brikette** (~10 files):
- Scripts: `generate-guide-infographics.ts`, `download-commons-image.ts` — not TSX, may not trigger
- Guide extras: `guideExtras.ts` files — map markers, may need exemption
- `global.css` — needs audit

**XA variants** (~6 files each):
- `xaCatalog.ts` — already has `/* eslint-disable ds/no-raw-color -- XA-0001 */` exemption
- Pattern: product colour swatches for 3D preview

### Dependency

- **Blocked by:** P0 (shared packages cleanup) — otherwise `packages/ui/` violations surface when lint runs at error level

### Test Landscape

- ESLint config changes: validated by `pnpm lint` across all affected apps
- No dedicated tests for lint config, but CI runs lint on every PR
- Risk: false positives from new `error` level catching violations in files not previously audited

## Questions

### Resolved

- Q: Will test files be affected?
  - A: No — tests already have `...offAllDsRules` in eslint config
  - Evidence: `eslint.config.mjs:1211-1213`

- Q: Will XA swatch files break?
  - A: No — already have `eslint-disable` with ticket ID
  - Evidence: `apps/xa/src/lib/xaCatalog.ts:1`

### Open (User Input Needed)

None.

## Confidence Inputs (for /lp-plan)

- **Implementation:** 90% — config change is mechanical; violation cleanup may surface unexpected files
- **Approach:** 95% — escalating to error is the standard enforcement pattern already proven in CMS
- **Impact:** 90% — prevents future erosion; low risk since violation count is near-zero
- **Delivery-Readiness:** 90% — blocked by P0 but otherwise ready
- **Testability:** 95% — `pnpm lint` is the validation gate

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Undiscovered violations in non-test production files | Medium | Low | Run `pnpm lint --filter brikette --filter prime` before escalating |
| Brikette infographic scripts flagged | Low | Low | Scripts are `.ts` not `.tsx`; check if rule applies. Add exemption if needed |

## Suggested Task Seeds

1. Run `pnpm lint` for Brikette, Prime, XA and catalogue all `ds/no-raw-tailwind-color` warnings
2. Fix or exempt (with ticket ID) any production-code violations
3. Add scoped config blocks in `eslint.config.mjs` escalating to `error`
4. Verify CI passes with `pnpm lint`

## Execution Routing Packet

- Primary execution skill: `/lp-build`
- Supporting skills: `/lp-design-system`
- Deliverable acceptance: `pnpm lint` passes with `error` severity for these apps, zero un-exempted violations

## Planning Readiness

- Status: **Ready-for-planning**
- Blocking items: P0 must land first
- Recommended next step: `/lp-plan` (after P0 is complete)
