---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-02-13
Last-updated: 2026-02-13
Feature-Slug: ds-compliance-v2
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: /lp-build
Supporting-Skills: /lp-design-system
Related-Plan: docs/plans/ds-compliance-v2-plan.md
Business-OS-Integration: off
Business-Unit: PLAT
---

# DS Compliance V2 — Non-Color Rules Escalation

## Scope

### Summary

Phase 1 (colour rules) is complete: `ds/no-raw-color` and `ds/no-raw-tailwind-color` are at `error` for every app with 0 violations monorepo-wide. Phase 2 escalates non-colour DS rules — spacing, typography, radius, shadow, z-index, layout, accessibility, and i18n — to close the remaining gaps. The investigation reveals that **most apps are already compliant**: the CMS/UI/Apps ESLint block already sets all non-colour rules to `error` for `apps/*/src/**`, and there are only 55 warnings across 3 packages. The primary work is (1) reception's blanket `offAllDsRules` exemption for non-colour rules and (2) resolving 55 existing warnings.

### Goals

- Escalate non-colour DS rules from `warn` to `error` where violations are zero (free wins)
- Fix the 55 existing warnings (business-os, guide-system, design-system)
- Begin lifting reception's `offAllDsRules` exemption for non-colour rules (phased)
- Achieve full DS rule compliance at `error` level for all production code

### Non-goals

- Changing DS rules for test files, story files, or dev-tools paths (these are legitimately off)
- Migrating reception's layout primitives (437 flex/grid instances) — this is a separate future phase
- Adding new DS rules — only escalating existing ones
- Translating hardcoded copy in internal-only API routes

### Constraints & Assumptions

- Constraints:
  - Reception is a daily-use internal tool — must not disrupt operations
  - No visual regression tests or Storybook for reception
  - `offAllDsRules` is a complete disable (dynamically sets ALL plugin rules to `off`)
  - Only 3 rules have auto-fix: `no-raw-typography`, `require-min-w-0-in-flex`, `no-physical-direction-classes-in-rtl`, `enforce-focus-ring-token`
- Assumptions:
  - Internal-only apps (reception, business-os) can use `eslint-disable` for hardcoded copy in server routes
  - The CMS/UI/Apps ESLint block already enforces non-colour rules at `error` for all apps except reception

## Evidence Audit (Current State)

### Entry Points

- `eslint.config.mjs` — Central ESLint config with layered DS rule architecture
- `packages/eslint-plugin-ds/` — Plugin source (31 non-colour rules)
- `apps/reception/src/` — 973 TS/TSX files, all non-colour DS rules OFF

### Key Modules / Files

- `eslint.config.mjs:33-38` — `offAllDsRules` definition (dynamically disables ALL plugin rules)
- `eslint.config.mjs:1589-1601` — Reception's first override block (`...offAllDsRules`)
- `eslint.config.mjs:2291-2308` — Reception's second override (re-enables only colour rules)
- `packages/eslint-plugin-ds/src/rules/` — Individual rule implementations

### Patterns & Conventions Observed

- **Layered ESLint architecture**: Global baseline (warn) → CMS/UI/Apps block (error) → Per-app overrides — evidence: `eslint.config.mjs`
- **Phase 1 migration pattern**: Enable at `warn` → fix violations → escalate to `error` → archive plan — evidence: 8 completed ds-* plans in `docs/plans/archive/`
- **eslint-disable for domain data**: Product category colours, chart hex values, calendar accents use justified `eslint-disable` — evidence: reception migration commits

### Current DS Rule Architecture

#### Global Baseline (all `**/*.{ts,tsx}` files)

| Category | Rules | Level |
|----------|-------|-------|
| Token enforcement | `no-raw-spacing`, `no-raw-typography`, `no-raw-radius`, `no-raw-shadow`, `no-raw-zindex`, `no-arbitrary-tailwind`, `no-important` | `warn` |
| Layout & media | `enforce-layout-primitives`, `container-widths-only-at`, `require-breakpoint-modifiers`, `forbid-fixed-heights-on-text`, `require-min-w-0-in-flex`, `no-negative-margins`, `no-margins-on-atoms` | `warn` |
| Accessibility | `enforce-focus-ring-token`, `min-tap-size` (44px), `no-misused-sr-only` | `warn` |
| i18n/RTL | `no-hardcoded-copy`, `no-physical-direction-classes-in-rtl` | `warn` |
| Governance | `require-disable-justification` | `warn` |

#### CMS/UI/Apps Enforcement Block (`apps/*/src/**`, `packages/ui/src/components/**`)

All baseline rules **escalated to `error`**, PLUS 6 additional rules:
- `require-aspect-ratio-on-media`, `no-naked-img`, `absolute-parent-guard`, `no-nonlayered-zindex`, `no-unsafe-viewport-units`, `require-disable-justification`

#### Per-App Overrides (non-colour)

| App | Override | Effect |
|-----|----------|--------|
| **Reception** | `...offAllDsRules` + re-enable 2 colour rules | ALL non-colour rules OFF |
| **Prime** | Selective warn for spacing/typography/radius/shadow/zindex/arbitrary/important | Progressive hardening (warn, not error) |
| **Cochlearfit** | `no-unsafe-viewport-units: off`, `no-nonlayered-zindex: off` | 2 rules exempted |
| **CMS** | `min-tap-size: off` for main scope; `warn` for shop-settings | Tap target exemption |
| **Business-OS guides** | `...offAllDsRules` | Guide authoring exempted |

### Current Violation Inventory (55 warnings, 0 errors)

#### By Rule

| Rule | Total | Packages | Files |
|------|-------|----------|-------|
| `ds/no-hardcoded-copy` | **45** | business-os (38 in 11 API route files), guide-system (7 in 2 manifest files) | 13 |
| `ds/min-tap-size` | **5** | business-os (4 in CardActionsPanel.tsx), design-system (1 in StepFlowShell.tsx) | 2 |
| `ds/enforce-layout-primitives` | **2** | design-system (StepProgress.tsx, combobox.tsx) | 2 |
| `ds/enforce-focus-ring-token` | **1** | design-system (slider.tsx) | 1 |
| `ds/no-arbitrary-tailwind` | **1** | design-system (scroll-area.tsx `rounded-[inherit]`) | 1 |
| `ds/no-raw-radius` | **1** | design-system (scroll-area.tsx `rounded-[inherit]`) | 1 |

#### Key Observations

1. **64/67 packages are completely clean** — zero DS violations of any kind
2. All 55 violations are **warnings** (none fail CI)
3. `no-hardcoded-copy` (45) = 82% of all violations — almost all in server-side API routes
4. `design-system` package violations (6) are in low-level primitives — may warrant `eslint-disable`
5. **No violations** from: `no-raw-spacing`, `no-raw-typography`, `no-raw-shadow`, `no-raw-zindex`, `no-important`, `no-negative-margins`, `no-margins-on-atoms`, `no-transition-all`, `require-aspect-ratio-on-media`, `no-naked-img`, `no-overflow-hazards`, `no-nonlayered-zindex`, `no-unsafe-viewport-units`, `absolute-parent-guard`, `require-breakpoint-modifiers`, `forbid-fixed-heights-on-text`, `require-min-w-0-in-flex`, `container-widths-only-at`, `no-misused-sr-only`, `no-physical-direction-classes-in-rtl`, `require-disable-justification`, `icon-button-size`, `no-raw-font`, `require-section-padding`

### Reception Non-Colour Violation Estimates

Since reception has `offAllDsRules`, violations don't appear in lint. Pattern-based search estimates:

| Rule | Est. Violations | Files Hit | Effort to Fix |
|------|----------------|-----------|---------------|
| `ds/no-raw-radius` | **0** | 0 | None |
| `ds/no-raw-shadow` | **0** | 0 | None |
| `ds/no-raw-zindex` | **~1** | 1 | S |
| `ds/no-important` | **~5** | 1 (CSS) | S |
| `ds/no-raw-typography` | **~9** | 5 | S |
| `ds/no-raw-spacing` | **~76** | 45 | M |
| `ds/no-arbitrary-tailwind` | **~77** | 40 (overlaps spacing) | M (net-new ~15 after spacing) |
| `ds/enforce-layout-primitives` | **~437** | ~150 | **L** (14% of files use raw flex) |
| `ds/no-hardcoded-copy` | **Unknown** | ~300+ (internal tool, heavy string use) | **XL** — defer |

**Free wins for reception** (0 violations): `no-raw-radius`, `no-raw-shadow`
**Near-free** (~1-5 violations): `no-raw-zindex`, `no-important`
**Small fixes** (~9): `no-raw-typography`
**Medium** (~76): `no-raw-spacing`
**Massive** (~437): `enforce-layout-primitives` — defer to separate phase
**Unknown/huge**: `no-hardcoded-copy` — defer (internal staff tool)

### Dependency & Impact Map

- Upstream dependencies: None — ESLint config changes only
- Downstream dependents: All apps (config is shared)
- Likely blast radius: LOW — escalating rules that already have 0 violations is safe; reception rule enablement is contained to that app

### Test Landscape

#### Test Infrastructure
- **Frameworks:** Jest + Cypress + Playwright
- **Commands:** `pnpm test`, `pnpm lint`, `pnpm typecheck`
- **CI integration:** `pnpm lint` must pass (error-level rules)

#### Existing Test Coverage
- ESLint plugin has its own test suite: `packages/eslint-plugin-ds/src/__tests__/`
- No tests that assert on specific class names in most apps (safe to change)

#### Testability Assessment
- **Easy to test:** Lint-only changes are validated by `pnpm lint` — binary pass/fail
- **Hard to test:** Visual impact of spacing/typography changes in reception (no Storybook, no visual regression)
- **Test seams needed:** None — lint is the validation gate

#### Recommended Test Approach
- **Lint validation:** `pnpm lint` for every escalation change
- **Per-app lint:** `pnpm --filter <app> lint` for reception-specific work
- **No e2e needed:** These are code-quality enforcement changes, not behaviour changes

### Recent Git History (Targeted)

- `eslint.config.mjs` — Extensive recent changes from Phase 1 colour migrations (8 plans, all complete)
- Pattern established: enable at warn → fix violations → escalate to error
- Commits `cf65f140d3`, `c1cdaf4537`, `514ccbc729`, `0744f747e2` (reception migration)
- Commit `40cdbcc644` (business-os `ds/no-raw-tailwind-color` escalation)

## Questions

### Resolved

- Q: Are non-colour DS rules already at error for most apps?
  - A: Yes. The CMS/UI/Apps ESLint block (`apps/*/src/**`) escalates ALL DS rules to error. Only reception, prime (progressive), cochlearfit (2 rules), and CMS (1 rule) have overrides.
  - Evidence: `eslint.config.mjs` line ~480-530

- Q: How many rules have 0 violations repo-wide?
  - A: 24 out of 31 non-colour rules have 0 violations. 6 rules have 1-45 warnings. 1 rule (`no-hardcoded-copy`) accounts for 82% of all violations.
  - Evidence: `pnpm lint` output analysis

- Q: What would reception look like if we enabled all non-colour rules?
  - A: ~600+ violations, dominated by `enforce-layout-primitives` (~437) and `no-raw-spacing` (~76). But 4 rules would have 0 violations (free wins).
  - Evidence: Pattern-based `rg` searches across `apps/reception/src/`

- Q: Which rules have auto-fix?
  - A: Only 4: `no-raw-typography`, `require-min-w-0-in-flex`, `no-physical-direction-classes-in-rtl`, `enforce-focus-ring-token`
  - Evidence: `packages/eslint-plugin-ds/` rule source code

### Open (User Input Needed)

None — all questions resolved from repo evidence.

## Confidence Inputs (for /lp-plan)

- **Implementation:** 88%
  - Established pattern from Phase 1 (8 completed plans). ESLint config changes are mechanical. Reception violation estimates are approximate but bounded.
  - What would raise to 90%: Running lint with rules enabled (not just pattern search) for reception
- **Approach:** 90%
  - Phased escalation proven by Phase 1. Free-wins-first strategy minimizes risk.
  - What would raise to 95%: Confirming prime's progressive hardening can be escalated safely
- **Impact:** 85%
  - 64/67 packages clean. Reception is the main risk area. No tests assert on class names.
  - What would raise to 90%: Confirming reception's ~76 spacing violations are truly tokenizable (not arbitrary design values)
- **Delivery-Readiness:** 92%
  - Pattern, tooling, and validation all established from Phase 1. No new infrastructure needed.
- **Testability:** 95%
  - `pnpm lint` is the complete validation gate. Binary pass/fail. Existing CI enforces it.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|------|-----------|--------|---------------------------|
| Reception spacing values are non-standard (not tokenizable) | Medium | Low | eslint-disable with justification for truly arbitrary values; most should map to tokens |
| Escalating warn→error breaks CI for apps with hidden violations | Low | Medium | Current lint shows 0 errors for all non-colour rules except reception (rules off) |
| Layout primitives migration (437 instances) creates scope creep | Medium | Medium | Explicitly defer to separate phase; keep `enforce-layout-primitives` at warn for reception |
| `no-hardcoded-copy` violations in BOS API routes are false positives | High | Low | eslint-disable for server-side error messages (not customer-facing UI copy) |
| design-system primitive violations require component refactoring | Low | Low | eslint-disable with justification (scroll-area `rounded-[inherit]` is a valid CSS pattern) |

## Planning Constraints & Notes

- Must-follow patterns:
  - Phase 1 pattern: warn → fix → error → archive
  - Commit convention: `feat(ds-compliance-v2): <description> (TASK-XX)`
  - eslint-disable requires justification with ticket ID
- Rollout/rollback expectations:
  - Each escalation commit is self-contained and git-revertible
  - Reception rules should be enabled incrementally (rule-by-rule, not all at once)
- Observability expectations:
  - `pnpm lint` is the single source of truth
  - Per-app lint for targeted validation

## Suggested Task Seeds (Non-binding)

1. **Free wins — escalate 24 zero-violation rules** for reception (from off → error) — S effort
2. **Fix 6 design-system primitive warnings** — eslint-disable with justification — S effort
3. **Fix 45 no-hardcoded-copy warnings** in business-os + guide-system — eslint-disable for server routes — S effort
4. **Fix 5 min-tap-size warnings** in business-os + design-system — S/M effort
5. **Enable reception token rules** (radius, shadow, zindex, important, typography) — S effort each (0-9 violations per rule)
6. **Enable reception no-raw-spacing** — M effort (76 violations in 45 files)
7. **Escalate to error + verify** — S effort (final lock-down)
8. **Defer**: reception `enforce-layout-primitives` (437 instances) and `no-hardcoded-copy` (unknown, massive) — separate future phase
9. **Cleanup**: Archive stale `ds-reception-migration-fact-find.md`

## Execution Routing Packet

- Primary execution skill: `/lp-build`
- Supporting skills: `/lp-design-system`
- Deliverable acceptance package:
  - `pnpm lint` passes with 0 warnings (excluding explicitly deferred rules)
  - All non-colour DS rules at `error` for all apps (except deferred rules for reception)
  - `offAllDsRules` no longer used in reception's config (replaced with selective rule list)
- Post-delivery measurement plan:
  - CI enforces error-level rules — any regression fails the build
  - Deferred rules tracked in plan for future phase

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: Proceed to `/lp-plan`
