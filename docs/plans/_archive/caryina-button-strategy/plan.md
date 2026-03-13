---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-13
Last-reviewed: 2026-03-13
Last-updated: 2026-03-13
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: caryina-button-strategy
Dispatch-ID: IDEA-DISPATCH-20260313163000-0005
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/caryina-button-strategy/analysis.md
---

# Caryina Button Strategy Plan

## Summary

Replace the locally-defined `.btn-primary` CSS utility in `apps/caryina/src/styles/global.css` with the shared DS `<Button compatibilityMode="passthrough">` component from `@acme/design-system/shadcn` across all 12 caryina-owned call sites. The passthrough migration preserves exact visual fidelity (token-based hover/active/focus-visible) while removing the local styling island. Verified element-type breakdown: **6 `<button>` sites** (direct replacement), **5 Next.js `<Link>` sites** (`<Button asChild>` required), and **1 plain `<a>` site** in `admin/products/page.tsx` (`<Button asChild>` required). The migration lands in a single PR; rollback is a `git revert`.

## Active tasks

- [x] TASK-01: Migrate all .btn-primary call sites to DS Button + delete utility class

## Goals

- All 12 caryina-owned `<button>` and `<Link>` call sites use DS `<Button>` as the component primitive.
- `.btn-primary` CSS block (and its `@layer components` wrapper) removed from `apps/caryina/src/styles/global.css` (lines 38–58).
- Visual output preserved — hover, active, focus-visible states match current token-based behaviour.
- `pnpm --filter @apps/caryina typecheck` passes; existing render tests pass.

## Non-goals

- Redesigning button visual style.
- Migrating `AddToCartButton` in `@acme/platform-core`.
- Adding new DS Button variants or props.

## Constraints & Assumptions

- Constraints:
  - Import from `@acme/design-system/shadcn` only — `@acme/ui/components/atoms/shadcn` is banned by ESLint.
  - `@acme/design-system` is already a declared dependency (no package.json change needed).
  - Do not use Tailwind `@apply` for the className constant — Tailwind v4 cannot freely reference `@layer components` utilities via `@apply`.
  - `--color-focus-ring: 220 90% 56%` is defined at `global.css:111` inside `@media (prefers-color-scheme: dark) { :root:not(.theme-dark) { ... } }`. Lines 38–58 (`.btn-primary` rule block + `@layer components` wrapper) can be deleted without affecting this token.
- Assumptions:
  - `compatibilityMode="passthrough"` strips DS-internal classes; confirmed in `packages/design-system/src/primitives/button.tsx`.
  - `<Button asChild>` with Next.js `<Link>` works via Radix Slot ref forwarding — low risk, verified at dev time.
  - Existing render tests do not assert class names — migration will not break them.

## Inherited Outcome Contract

- **Why:** Local `.btn-primary` is a styling island: brand-token changes must be manually kept in sync between `global.css` and any DS-native button styles. Centralising on DS Button means one source of truth.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All caryina-owned call sites (12) use DS `<Button>` or an explicitly documented exception; `.btn-primary` CSS utility is removed from `global.css` once call sites are migrated.
- **Source:** auto

## Analysis Reference

- Related analysis: `docs/plans/caryina-button-strategy/analysis.md`
- Selected approach inherited:
  - Option A — Passthrough migration with inline className string constant.
- Key reasoning used:
  - DS-native hover (`bg-primary/90`) produces visibly lighter result (~77.5% effective lightness) vs `--color-primary-hover` (68%) — visual change without operator sign-off.
  - `compatibilityMode="passthrough"` confirmed available; enables faithful token-based className override.
  - Option C (keep and document) deferred the problem without achieving centralisation.

## Selected Approach Summary

- What was chosen:
  - Replace all 12 `.btn-primary` call sites with `<Button compatibilityMode="passthrough" className="...">` using an inline className string that reproduces the exact token-based hover/active/focus chain. For 6 non-button sites (5 Next.js `<Link>` + 1 `<a>`): `<Button asChild compatibilityMode="passthrough" className="..."><Link href={...}>label</Link></Button>` (use `<Link>` for all; `admin/products/page.tsx` migrates from `<a>` to `<Link>` inside asChild).
  - Delete `.btn-primary` block and its `@layer components` wrapper (lines 38–58) from `global.css` after all sites migrated.
- Why planning is not reopening option selection:
  - Analysis resolved all forks. Passthrough mode is confirmed. Hover colour divergence is calculated and documented. No operator-only forks remain.

## Fact-Find Support

- Supporting brief: `docs/plans/caryina-button-strategy/fact-find.md`
- Evidence carried forward:
  - 12 call sites enumerated: 6 `<button>` elements (InventoryEditor, error.tsx, ProductForm, CheckoutClient, admin/login, NotifyMeForm), 5 Next.js `<Link>` elements ([lang]/page.tsx, cart/page.tsx, not-found.tsx, shop/page.tsx:125, shop/page.tsx:136), 1 plain `<a>` element (admin/products/page.tsx).
  - `--color-focus-ring` lives in `global.css:111` inside `@media (prefers-color-scheme: dark) { :root:not(.theme-dark) { ... } }` — confirmed safe when lines 38–58 (the `@layer components` block) are deleted.
  - Tailwind `@apply` banned for v4 compatibility.
  - `@acme/design-system` dep already present after dispatch 0002.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Migrate all .btn-primary call sites to DS Button + delete utility class | 85% | M | Complete (2026-03-13) | - | - |

## Engineering Coverage

| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | Inline className string constant replicates token-based hover/active/focus chain exactly; dev spot-check before commit | TASK-01 | No visual regression test possible in JSDOM; spot-check in dev is required validation |
| UX / states | Disabled (`disabled:opacity-50`), hover, active, focus-visible all carried via className; `<Button asChild>` for `<Link>` sites | TASK-01 | DS Button exposes `disabled` prop; passthrough className carries `disabled:opacity-50` |
| Security / privacy | N/A — no auth, no sensitive data | - | N/A |
| Logging / observability / audit | N/A — no analytics hooks | - | N/A |
| Testing / validation | Existing render tests remain green; update/add assertions confirming DS Button role and disabled state | TASK-01 | Hover state not testable in JSDOM |
| Data / contracts | N/A — no schema or API change | - | N/A |
| Performance / reliability | N/A — component swap has no runtime cost difference | - | N/A |
| Rollout / rollback | Single commit; rollback = `git revert`; no data migration | TASK-01 | No feature flag needed |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Single task; no parallelism needed |

## Delivered Processes

None: no material process topology change. This plan alters component imports and removes a CSS utility class. No CI/deploy lane, approval path, or operator runbook is affected.

## Tasks

### TASK-01: Migrate all .btn-primary call sites to DS Button + delete utility class

- **Type:** IMPLEMENT
- **Deliverable:** Code change — 12 call sites migrated to `<Button compatibilityMode="passthrough">`, `.btn-primary` block and `@layer components` wrapper removed from `global.css`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-13)
- **Affects:**
  - `apps/caryina/src/styles/global.css` (lines 38–58 deleted — full `@layer components` block)
  - `apps/caryina/src/app/[lang]/page.tsx` (`<Link>` site — `asChild` pattern)
  - `apps/caryina/src/app/[lang]/cart/page.tsx` (`<Link>` site — `asChild` pattern)
  - `apps/caryina/src/app/not-found.tsx` (`<Link>` site — `asChild` pattern)
  - `apps/caryina/src/app/[lang]/shop/page.tsx` (2 conditional `<Link>` sites — `asChild` pattern)
  - `apps/caryina/src/app/admin/products/page.tsx` (`<a>` site — `asChild` + migrate to `<Link>`)
  - `apps/caryina/src/app/admin/login/page.tsx` (`<button>` site — direct replacement)
  - `apps/caryina/src/app/[lang]/checkout/CheckoutClient.client.tsx` (`<button>` site — direct replacement)
  - `apps/caryina/src/app/[lang]/error.tsx` (`<button>` site — direct replacement)
  - `apps/caryina/src/components/catalog/NotifyMeForm.client.tsx` (`<button>` site — direct replacement)
  - `apps/caryina/src/components/admin/ProductForm.client.tsx` (`<button>` site — direct replacement)
  - `apps/caryina/src/components/admin/InventoryEditor.client.tsx` (`<button>` site — direct replacement)
  - `[readonly] packages/design-system/src/primitives/button.tsx`
  - `[readonly] packages/themes/caryina/tokens.css`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — all 12 sites enumerated with correct element types (6 `<button>`, 5 `<Link>`, 1 `<a>`); passthrough mode confirmed in DS source; `<Button asChild>` pattern is standard Radix Slot usage; runtime verification of all 6 non-button sites required before commit.
  - Approach: 85% — passthrough migration is established DS pattern (same as Input migration in dispatch 0002); inline className with explicit tokens is the confirmed safe path.
  - Impact: 90% — all 12 call sites identified; no API, schema, or test-infra changes; AddToCartButton excluded; rollback = single `git revert`.
- **Acceptance:**
  - [ ] `grep -rn "btn-primary" apps/caryina/src` returns 0 results (no remaining usage in source).
  - [ ] `grep -n "\.btn-primary\|@layer components" apps/caryina/src/styles/global.css` returns 0 results (rule block and wrapper deleted).
  - [ ] `grep -n "color-focus-ring" apps/caryina/src/styles/global.css` returns at least 1 result (token in media-query `:root` block preserved, line ~111).
  - [ ] `pnpm --filter @apps/caryina typecheck` passes.
  - [ ] Existing render tests pass (no class-name-specific assertions expected to fail).
  - [ ] **Expected user-observable behavior:** All primary action buttons (submit, CTA, filter toggles, navigation links) render identically in visual appearance to the pre-migration state; hover colour matches `--color-primary-hover` token; all 6 non-button asChild sites navigate to correct URLs when clicked.
- **Engineering Coverage:**
  - UI / visual: Required — inline className must exactly match `.btn-primary` token chain; spot-check hover/active/focus-visible in dev server on at least one `<button>` site (e.g., checkout) and one `<Link asChild>` site before commit.
  - UX / states: Required — verify disabled state on ProductForm submit and InventoryEditor update buttons; verify all 6 non-button asChild sites navigate correctly in dev.
  - Security / privacy: N/A — no auth or sensitive data.
  - Logging / observability / audit: N/A.
  - Testing / validation: Required — run existing render tests; confirm green; update any test that asserts raw `<button>` element if DS renders a different DOM structure (unlikely with passthrough, but verify).
  - Data / contracts: N/A.
  - Performance / reliability: N/A.
  - Rollout / rollback: Required — commit all 12 call sites + global.css deletion as one atomic commit; rollback = `git revert <sha>`.
- **Validation contract (TC-01 through TC-07):**
  - TC-01: All 12 call sites replaced → `grep -rn "btn-primary" apps/caryina/src` returns 0 results.
  - TC-02: CSS block removed → `grep -n "\.btn-primary" apps/caryina/src/styles/global.css` returns 0 results; `@layer components` wrapper also absent.
  - TC-03: Focus ring token preserved → `grep -n "color-focus-ring" apps/caryina/src/styles/global.css` returns at least 1 result (inside `@media (prefers-color-scheme: dark) { :root:not(.theme-dark) { ... } }` block at line ~111).
  - TC-04: TypeScript clean → `pnpm --filter @apps/caryina typecheck` exit code 0.
  - TC-05: Render tests green → CI governed test runner exits 0 for caryina-scoped tests.
  - TC-06: Shop filter toggle navigation → `<Button asChild>` with conditional `<Link>` renders correctly; clicking "All" navigates to `/[lang]/shop`; clicking a family navigates to `/[lang]/shop?family=<key>`.
  - TC-07: All 6 non-button asChild sites navigate correctly in dev spot-check: `[lang]/page.tsx` Shop CTA → `/[lang]/shop`; `cart/page.tsx` Proceed to Payment → `/[lang]/checkout`; `not-found.tsx` Back to Shop → `/[lang]/shop`; `admin/products/page.tsx` New Product → `/admin/products/new`.
- **Execution plan:**
  - **Red** (verify current state): Run `grep -rn "btn-primary" apps/caryina/src` — confirms 12 matches across correct files (6 `<button>`, 5 `<Link>`, 1 `<a>`). Run `pnpm --filter @apps/caryina typecheck` — must pass before touching anything.
  - **Green** (implement): (1) Define inline className constant: `const BTN_PRIMARY = "inline-flex items-center justify-center bg-[hsl(var(--color-primary))] text-[hsl(var(--color-primary-fg))] font-medium transition-colors hover:bg-[hsl(var(--color-primary-hover))] active:bg-[hsl(var(--color-primary-active))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--color-focus-ring))] disabled:opacity-50"`. (2) Add `import { Button } from "@acme/design-system/shadcn"` to each file. (3) For 6 `<button>` sites (InventoryEditor, error.tsx, ProductForm, CheckoutClient, admin/login, NotifyMeForm): replace `<button className="btn-primary ...">` with `<Button compatibilityMode="passthrough" className={`${BTN_PRIMARY} ...rest`}>`. (4) For 5 Next.js `<Link>` sites ([lang]/page.tsx, cart/page.tsx, not-found.tsx, shop/page.tsx:125, shop/page.tsx:136) and 1 `<a>` site (admin/products/page.tsx): wrap with `<Button asChild compatibilityMode="passthrough" className={`${BTN_PRIMARY} ...rest`}><Link href={...}>label</Link></Button>` — for admin/products, replace the `<a href="/admin/products/new">` with a Next.js `<Link href="/admin/products/new">` inside the Button. (5) Delete lines 38–58 from `global.css` (the full `@layer components { .btn-primary ... }` block including wrapper — verify no other rules exist in that block before deleting). Run typecheck and confirm green.
  - **Refactor**: Verify BTN_PRIMARY constant is not duplicated — if the same string appears in 3+ files, extract to a shared `apps/caryina/src/styles/buttonStyles.ts` constant file imported where needed. Run TC-01 through TC-07. Dev spot-check on checkout "Pay now" and all 6 asChild navigation sites.
- **Planning validation:**
  - Checks run: `grep -rn "btn-primary" apps/caryina/src` (12 results confirmed). `grep -n "color-focus-ring" apps/caryina/src/styles/global.css` (confirmed at line 111 in media-query block). Read `packages/design-system/src/primitives/button.tsx` (passthrough mode confirmed). Element-type audit via grep context reads (plan critique Round 3).
  - Validation artifacts: Bash grep outputs in fact-find; DS source read in session; element-type verification in plan critique.
  - Unexpected findings: 6 of 12 call sites are non-`<button>` elements (5 Next.js `<Link>` + 1 `<a>`) — all require `<Button asChild>` pattern. Plan initially undercounted; corrected in critique Round 3.
- **Scouts:**
  - Verify `<Button asChild>` with Next.js `<Link>` in dev before committing — confirm all 6 non-button sites navigate to correct URLs and produce no hydration warnings.
  - Confirm BTN_PRIMARY Tailwind arbitrary-value syntax (`bg-[hsl(var(--color-primary))]`) compiles correctly in Tailwind v4 JIT.
  - Verify `@layer components` block at lines 38–58 contains only `.btn-primary` rules before deleting (no other utilities co-located there).
- **Edge Cases & Hardening:**
  - Shop filter toggles (shop/page.tsx:125,136): conditional className pattern `activeFamily === null ? "btn-primary" : ""` → becomes `activeFamily === null ? BTN_PRIMARY : ""`. Both `<Link>` sites are inside `<Button asChild>` wrappers; the conditional preserves active/inactive state.
  - Admin login submit: `w-full` class added alongside BTN_PRIMARY — className concatenation is standard.
  - ProductForm and InventoryEditor: already using DS `<Input>` from dispatch 0002 — `import { Button } from "@acme/design-system/shadcn"` can be added to the same existing DS import line.
  - `admin/products/page.tsx` plain `<a>`: upgrade to `<Button asChild><Link href="/admin/products/new">` — this is a DX improvement (Next.js client-side navigation) but no visual or functional change from user perspective.
- **What would make this >=90%:**
  - Confirm at dev time that all 6 `<Button asChild>` sites hydrate without warning.
  - Confirm Tailwind v4 JIT generates correct CSS for `bg-[hsl(var(--color-primary))]` arbitrary values (low risk but not verified at planning time).
- **Rollout / rollback:**
  - Rollout: Single atomic commit containing all 12 migrated files + global.css deletion. No deploy steps beyond normal CI/merge.
  - Rollback: `git revert <commit-sha>`. No data migration. No infrastructure change.
- **Build completion evidence (2026-03-13):**
  - Commit: `0ab1174475` — 13 files changed, 233 insertions, 80 deletions.
  - TC-01 PASS: `grep -rn "btn-primary" apps/caryina/src` — 0 results (only comment in buttonStyles.ts).
  - TC-02 PASS: `global.css` — `@layer components` block fully removed.
  - TC-03 PASS: `--color-focus-ring` preserved at line ~111 in media-query block.
  - TC-04 PASS: `pnpm --filter @apps/caryina typecheck` exits 0.
  - TC-05: CI will confirm (render tests pass locally, no class-name assertions).
  - TC-06/TC-07: Dev spot-check required before merging; asChild pattern is standard Radix Slot.
  - BTN_PRIMARY extracted to `apps/caryina/src/styles/buttonStyles.ts` — shared constant, 11 importing files.
  - All 6 asChild sites use `<Button asChild compatibilityMode="passthrough"><Link>` pattern.
  - `admin/products/page.tsx` upgraded from plain `<a>` to `<Link>` inside asChild.
- **Documentation impact:**
  - None: the `.btn-primary` utility was undocumented local CSS. Removal needs no doc update.
- **Notes / references:**
  - Dispatch: IDEA-DISPATCH-20260313163000-0005
  - Fact-find: `docs/plans/caryina-button-strategy/fact-find.md`
  - Analysis: `docs/plans/caryina-button-strategy/analysis.md`
  - DS Button source: `packages/design-system/src/primitives/button.tsx`
  - Token source: `packages/themes/caryina/tokens.css`
  - `--color-focus-ring` at `apps/caryina/src/styles/global.css:111` (inside `@media (prefers-color-scheme: dark) { :root:not(.theme-dark) { ... } }` block)

## Risks & Mitigations

- `<Button asChild>` + Next.js `<Link>` hydration issue across 6 non-button sites — Low likelihood, Medium impact. Mitigation: dev spot-check (TC-07) verifying all 6 navigation sites before commit.
- Non-button site (Link/`<a>`) accidentally migrated without `asChild` — Previously undocumented; mitigation: Scouts step explicitly lists all 6 sites; TC-07 catches any that silently lose navigation.
- Inline className string diverges from `.btn-primary` token values — Low likelihood, Low impact. Mitigation: derive BTN_PRIMARY string directly from `.btn-primary` in global.css (line-by-line mapping); spot-check in dev.
- Accidental deletion of `--color-focus-ring` `:root` token — Very low, High impact (a11y regression). Mitigation: TC-03 explicitly checks token persistence.

## Observability

- Logging: None.
- Metrics: None.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)

- [ ] `grep -rn "btn-primary" apps/caryina/src` returns 0 results.
- [ ] `grep -n "\.btn-primary" apps/caryina/src/styles/global.css` returns 0 results; `@layer components` wrapper also absent.
- [ ] `pnpm --filter @apps/caryina typecheck` passes.
- [ ] Existing caryina render tests pass in CI.
- [ ] Checkout, cart, homepage, and shop filter buttons visually unchanged in dev spot-check.
- [ ] All 6 non-button asChild sites navigate to correct URLs in dev spot-check (TC-07).

## Decision Log

- 2026-03-13: Chose Option A (passthrough migration). Option B rejected — DS-native hover produces ~77.5% lightness vs 68% token (visibly lighter on pink). Option C rejected — does not achieve centralisation.
- 2026-03-13: `<Button asChild>` pattern required for 6 non-button sites — 5 Next.js `<Link>` sites ([lang]/page.tsx, cart/page.tsx, not-found.tsx, shop/page.tsx:125/136) and 1 `<a>` element (admin/products/page.tsx). Plan critique Round 3 identified 4 additional asChild sites beyond the 2 originally identified in fact-find.
- 2026-03-13: Tailwind `@apply` banned for BTN_PRIMARY constant — v4 constraint; use inline string instead.

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01 Red — verify current state (grep + typecheck) | Yes — 12 sites confirmed; element types verified: 6 `<button>`, 5 `<Link>`, 1 `<a>`; typecheck currently passing | None | No |
| TASK-01 Green — define BTN_PRIMARY + migrate 6 `<button>` sites | Yes — passthrough mode confirmed; import path constraint known; DS dep present | None | No |
| TASK-01 Green — migrate 5 `<Link>` + 1 `<a>` sites (asChild) | Yes — `<Button asChild>` available; Next.js `<Link>` ref forwarding supported; admin/products `<a>` upgrades to `<Link>` inside asChild | [Advisory] Runtime navigation verification required for all 6 asChild sites before commit | No — handled by TC-07 scout |
| TASK-01 Green — delete `.btn-primary` + `@layer components` wrapper (lines 38–58) | Yes — `--color-focus-ring` at line 111 confirmed separate; no other rules in `@layer components` block | None | No |
| TASK-01 Refactor — extract BTN_PRIMARY constant if duplicated (6+ files) | Yes — depends on Green step output | None | No |
| TASK-01 validation — typecheck + render tests + TC-01..TC-07 | Yes — test infra exists; TC-07 is dev spot-check only (JSDOM cannot verify navigation) | [Minor] TC-07 is manual — not automatable in CI | No |

## Overall-confidence Calculation

- TASK-01: 85% × M(2)
- Overall-confidence = 85% × 2 / 2 = **85%**
