---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-02-13
Last-updated: 2026-02-13
Feature-Slug: ds-compliance-audit
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: /lp-build
Supporting-Skills: /lp-design-system
Related-Plan: docs/plans/ds-compliance-audit-plan.md
Business-OS-Integration: on
Business-Unit: PLAT
Card-ID: pending
---

# Design System Compliance Audit — Fact-Find Brief

## Scope

### Summary

Repo-wide audit of `ds/no-raw-tailwind-color` enforcement and design system compliance. Seven major apps have been escalated to `error` level (brikette, business-os, cms, dashboard, prime, skylar, xa). This brief catalogues everything that remains non-compliant: 7 warn-level apps (211 violations), 1 rules-off app (reception, 1,460 violations), 16 baselined shared-package violations, and 2 stale fact-find docs.

The goal is to produce a plan that closes the remaining gaps in priority order without disrupting active products.

### Goals

- Escalate `ds/no-raw-tailwind-color` to `error` in all apps where it is currently `warn`
- Reduce the 16-entry baseline to zero (or to a justified minimum with documented exceptions)
- Archive stale fact-find docs for completed migrations
- Establish a clear priority order for the remaining work
- Identify quick wins (apps with <5 violations) vs. planned migrations

### Non-goals

- Migrating `apps/reception/` — already has an active plan (`ds-reception-migration-plan.md`)
- Creating new design tokens — work within the existing token set; flag gaps for separate work
- Migrating non-color DS rules (spacing, typography, radius, etc.) — separate concern
- Addressing `cochlearfit`'s `ds/no-unsafe-viewport-units: off` and `ds/no-nonlayered-zindex: off` exemptions

### Constraints & Assumptions

- Constraints:
  - Must not break any existing lint pass (`pnpm lint` currently green)
  - Baseline changes must be atomic — remove entries only when the underlying code is fixed
  - Apps with <5 violations can be escalated in a single task (fix + config change)
  - Reception is excluded (separate plan)
- Assumptions:
  - xa-j and xa-b share identical component code (39 violations each, same files) — fixing one likely fixes both
  - Token availability is sufficient for most replacements (confirmed for template-app; gaps exist in RatingsBar)

## Evidence Audit (Current State)

### ESLint Configuration Structure

**Source:** `eslint.config.mjs`

| Level | Scope | Apps |
|-------|-------|------|
| `error` | Fully migrated | brikette, business-os, cms, dashboard, prime, skylar, xa |
| `warn` | Global baseline only | cochlearfit, xa-uploader, xa-j, xa-b, product-pipeline, handbag-configurator, cover-me-pretty |
| `off` | `...offAllDsRules` | reception (except `DarkModeToggle.tsx` + `dashboard/**` at warn) |
| `off` | Intentional exemptions | `prime/src/components/dev/**`, `business-os/src/app/guides/**`, storybook, DS plugin tests, `packages/ui` test files |

### Violation Inventory: Warn-Level Apps (211 total)

| App | Violations | Top Pattern | Migration Complexity |
|-----|-----------|-------------|---------------------|
| cochlearfit | 2 | `text-red-700`, `border-red-200`, `bg-red-50` (error states) | Trivial — single commit |
| handbag-configurator | 2 | `text-white`, `bg-black` (loading state in ViewerCanvas) | Trivial — single commit |
| cover-me-pretty | 10 | `text-blue-600` (links), `bg-gray-800/100` (panels) | Low — 8 files |
| product-pipeline | 39 | `text-emerald-600/red-600/amber-800` (status indicators) | Medium — semantic status pattern across 17 stage-card files |
| xa-j | 39 | `bg-white` (30), `text-white` (8), `text-black` (5) | Medium — shared with xa-b |
| xa-b | 39 | Identical to xa-j | Medium — fix xa-j first, verify xa-b follows |
| xa-uploader | 80 | `bg-white` (61), `text-red-700` (15) | Medium — form panel pattern across 11 catalog files |

**Evidence:** Grep counts against `(text|bg|border|ring)-(red|blue|green|gray|zinc|slate|white|black|emerald|amber|...)` patterns across TSX files.

### Violation Inventory: Baselined Shared Packages (16 total)

**Source:** `tools/eslint-baselines/ds-no-raw-tailwind-color.json`

#### Easy — Mechanical 1:1 swaps (5 violations, template-app)

| File | Line | Violation | Replacement |
|------|------|-----------|-------------|
| `packages/template-app/.../PdpClient.client.tsx` | 24 | `text-gray-700` | `text-muted-foreground` |
| `packages/template-app/.../ReturnForm.tsx` | 129 | `text-red-600` | `text-danger-fg` |
| `packages/template-app/.../page.tsx` (edit-preview) | 118 | `text-red-600` | `text-danger-fg` |
| `packages/template-app/.../Scanner.tsx` | 134 | `text-red-600` | `text-danger-fg` |
| `packages/template-app/.../page.tsx` (upgrade-preview) | 117 | `text-red-600` | `text-danger-fg` |

#### Medium — Needs verification (2 violations, SplitPane)

| File | Line | Violation | Notes |
|------|------|-----------|-------|
| `packages/ui/.../SplitPane.tsx` | 351 | `bg-blue-500` | Resize handle indicator — replace with `bg-primary` |
| `packages/ui/.../SplitPane.tsx` | 369 | `bg-blue-500` | Same pattern |

#### Hard — Needs design decision or new tokens (9 violations, RatingsBar + modals)

| File | Line | Violation | Issue |
|------|------|-----------|-------|
| `packages/ui/.../RatingsBar.tsx` | 26 | `text-black/85` | No 85% opacity text token |
| `packages/ui/.../RatingsBar.tsx` | 34 | `text-white` | Needs semantic context (badge text on dark) |
| `packages/ui/.../RatingsBar.tsx` | 52 | `border-white/15` | `border-1` is 12% — close but not exact |
| `packages/ui/.../RatingsBar.tsx` | 56 | `text-white` | Same as line 34 |
| `packages/ui/.../RatingsBar.tsx` | 97 | `border-white/25` | No matching border token |
| `packages/ui/.../RatingsBar.tsx` | 98 | `bg-white/10` | No 10% white bg token |
| `packages/ui/.../RatingsBar.tsx` | 131 | `ring-white/40` | No ring opacity token |
| `packages/ui/.../RatingsBar.tsx` | 223 | `text-black/85` | Duplicate pattern |
| `packages/ui/.../modals/primitives.tsx` | 19 | `bg-black/60` | Should use `overlay-scrim-2` (64%) or new 60% token |

**Token gap:** RatingsBar uses 5 distinct opacity levels (`/10`, `/15`, `/25`, `/40`, `/85`) that have no exact semantic token match. `overlay-scrim-1` = 40%, `overlay-scrim-2` = 64%. The closest border tokens are `border-1` (12%) and `border-2` (22%).

### Violation Inventory: Reception (excluded — separate plan)

- **1,460 violations** across 172 files (of 974 total)
- Active plan: `docs/plans/ds-reception-migration-plan.md` (Status: Active, 75% confidence, 10 tasks)
- **Not in scope for this fact-find**

### Stale Documentation

| File | Status | Corresponding Plan | Action |
|------|--------|-------------------|--------|
| `docs/plans/ds-skylar-migration-fact-find.md` | Ready-for-planning | `archive/ds-skylar-migration-plan.md` (archived) | Archive |
| `docs/plans/ds-business-os-migration-fact-find.md` | Ready-for-planning | `archive/ds-business-os-migration-plan.md` (archived) | Archive |

Already properly archived (no action needed):
- `archive/ds-shared-packages-cleanup-fact-find.md`
- `archive/ds-customer-facing-lint-escalation-fact-find.md`
- `archive/ds-dashboard-migration-fact-find.md`

### Token System

**Source:** `packages/themes/base/tokens.static.css`, `packages/themes/base/tokens.dynamic.css`

Two-layer system: static fallbacks + dynamic `var(--token-*, fallback)` overrides. All values stored as HSL triplets (e.g., `0 0% 100%`). Available semantic tokens relevant to this migration:

- **Text:** `text-foreground`, `text-muted-foreground`, `text-danger-fg`, `text-primary-fg`
- **Background:** `bg-surface`, `bg-panel`, `bg-muted`, `bg-primary`
- **Border:** `border-1` (12%), `border-2` (22%), `border-3` (38%)
- **Overlay:** `overlay-scrim-1` (40%), `overlay-scrim-2` (64%)
- **Elevation:** `elevation-0` through `elevation-4`

### Per-App Token Integration

All warn-level apps already import `@themes/base/tokens.css` via their global CSS. No apps need token onboarding — only lint rule escalation and code fixes.

### Patterns & Conventions Observed

- **Migrated apps pattern (P1-P4):** Fix violations → escalate rule to `error` → remove baseline entries → commit per-task
- **Quick-win pattern:** Apps with <5 violations can be fixed and escalated in a single task
- **xa-j / xa-b sharing:** Nearly identical file lists and violation counts — evidence of shared component code
- **Status indicator pattern (product-pipeline):** Uses `emerald/red/amber` for success/error/warning — needs `text-success-fg` / `text-danger-fg` / `text-warning-fg` semantic tokens
- **Form panel pattern (xa-uploader):** 61 `bg-white` instances — mechanical swap to `bg-surface` or `bg-panel`

### Test Landscape

#### Test Infrastructure
- **Frameworks:** Jest (unit), Cypress (e2e), Playwright (e2e)
- **Commands:** `pnpm test`, `pnpm lint`, `pnpm typecheck`
- **CI:** All three run on PR; lint is required check

#### Existing Test Coverage
- No visual regression tests for any warn-level app
- Lint pass is the primary gate — if lint passes, DS compliance is enforced
- Template-app and packages/ui have unit tests but none specifically test colour class usage

#### Coverage Gaps
- No visual comparison tooling for before/after migration
- Product-pipeline stage cards have no component tests (status indicator colours untested)

#### Testability Assessment
- **Easy to test:** Lint rule escalation — `pnpm lint` is the test
- **Hard to test:** Visual correctness after token swap (no visual regression)
- **Mitigation:** Side-by-side dev server comparison (manual)

### Recent Git History (Targeted)

- `ce1550beb6` (2026-02-13): SKY-07 — Skylar lint escalation + 26 baseline entries removed
- `40cdbcc644` (2026-02-12): BOS-08 — Business-OS lint escalation to error
- `b157090f35` (2026-02-13): SKY-02..06 — Skylar CSS variable migration (389 violations)
- `4a51f3b4b5` (2026-02-13): SKY-01 — Skylar shell.css foundation
- Pattern: each completed migration follows fact-find → plan → build → archive

## Questions

### Resolved
- Q: Do warn-level apps already have tokens available?
  - A: Yes — all 7 apps import `@themes/base/tokens.css` via their global CSS
  - Evidence: grep for `@themes/base/tokens` across app global CSS files

- Q: Are xa-j and xa-b truly identical?
  - A: Yes — same files, same violation counts (39 each), same patterns
  - Evidence: file-by-file comparison of violation locations

- Q: Does product-pipeline have success/warning/danger semantic tokens available?
  - A: Partially — `text-danger-fg` exists; `text-success-fg` and `text-warning-fg` need verification
  - Evidence: `packages/themes/base/tokens.static.css` grep

- Q: Is RatingsBar's opacity precision intentional?
  - A: Likely yes — it's Brikette-specific UI with deliberate visual design constraints (5 distinct opacity levels)
  - Evidence: Code review of `packages/ui/src/atoms/RatingsBar.tsx`

### Open (User Input Needed)
- Q: Should RatingsBar's 9 violations remain baselined as "intentional brand-specific design", or should we create new opacity tokens?
  - Why it matters: 9 of 16 baseline entries are in this one component. Creating tokens for 5 opacity levels adds DS complexity for a single consumer.
  - Decision impacted: Whether baseline reaches 0 or stabilises at 9
  - Decision owner: Pete (design system owner)
  - Default assumption: Keep baselined with `/* ds-exception: brand-specific opacity */` annotation + risk: sets precedent for other brand-specific exemptions

## Confidence Inputs (for /lp-plan)

- **Implementation:** 88%
  - Strong: 7 apps are trivial to medium complexity; token system is already integrated everywhere; established migration pattern from P1-P4
  - Gap: product-pipeline may need `text-success-fg` / `text-warning-fg` tokens if not present; RatingsBar needs design decision
- **Approach:** 90%
  - Strong: pattern is proven across 7 completed migrations (brikette, business-os, cms, dashboard, prime, skylar, xa)
  - The approach (fix violations → escalate to error → remove baseline) is validated
- **Impact:** 85%
  - Strong: lint-only changes for escalation; token swaps are visual-equivalent
  - Gap: no visual regression tests; product-pipeline status colours are user-facing
- **Delivery-Readiness:** 92%
  - Strong: clear owner (engineering), no external dependencies, no approvals needed (except RatingsBar design decision)
- **Testability:** 85%
  - `pnpm lint` is the primary test; typecheck catches type errors
  - Gap: no automated visual regression

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Product-pipeline status colours lose semantic meaning after token swap | Medium | Medium | Verify `text-success-fg` / `text-warning-fg` exist before swapping; if missing, create tokens first |
| xa-uploader `bg-white` swap changes form appearance on dark themes | Low | Low | xa-uploader is internal tool with no dark mode; `bg-surface` is white in light mode |
| RatingsBar design decision delays baseline cleanup | Medium | Low | Proceed with all other work; RatingsBar is independent |
| Visual regressions in warn-level apps go unnoticed | Low | Medium | Manual dev-server comparison before committing; lint pass confirms DS compliance |
| Fixing xa-j doesn't automatically fix xa-b | Low | Medium | Verify shared code after xa-j fix; if not shared, treat as separate task |

## Planning Constraints & Notes

- Must-follow patterns:
  - Fix violations first, then escalate rule to `error` in eslint.config.mjs (same pattern as P1-P4)
  - Remove baseline entries only when underlying code is fixed
  - One commit per task (task-scoped)
- Rollout/rollback expectations:
  - Direct commit / `git revert` (no feature flags needed)
  - Lint-only changes are safe to revert
- Observability expectations:
  - `pnpm lint` green is the gate
  - Baseline file entry count tracks progress

## Suggested Task Seeds (Non-binding)

**Wave 1 — Quick wins (3 tasks, parallelisable):**
1. Fix cochlearfit (2 violations) + escalate to error
2. Fix handbag-configurator (2 violations) + escalate to error
3. Fix template-app baseline (5 easy violations) + remove baseline entries

**Wave 2 — Medium apps (3 tasks, parallelisable):**
4. Fix cover-me-pretty (10 violations) + escalate to error
5. Fix xa-j (39 violations) + verify xa-b + escalate both to error
6. Fix xa-uploader (80 violations) + escalate to error

**Wave 3 — Complex apps (1-2 tasks):**
7. Fix product-pipeline (39 violations, may need new tokens) + escalate to error
8. Fix SplitPane baseline (2 violations) + modals/primitives (1 violation) + remove baseline entries

**Wave 4 — Design decision (1 task, depends on user input):**
9. RatingsBar — either create opacity tokens or document exceptions

**Housekeeping (1 task, independent):**
10. Archive stale fact-find docs (ds-skylar-migration, ds-business-os-migration)

## Execution Routing Packet

- Primary execution skill: `/lp-build`
- Supporting skills: `/lp-design-system` (token reference)
- Deliverable acceptance package:
  - `pnpm lint` green after each task
  - `pnpm typecheck` green after each task
  - Baseline entry count decreasing per task
  - All warn-level apps escalated to `error` by plan completion
- Post-delivery measurement plan:
  - Baseline file entry count (target: 0 or 9 if RatingsBar excepted)
  - Apps at `error` level count (target: 14 — all except reception which has separate plan)

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None (RatingsBar decision is Wave 4 and doesn't block earlier waves)
- Recommended next step: Proceed to `/lp-plan`
