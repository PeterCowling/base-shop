---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: UI
Workstream: Engineering
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: caryina-button-strategy
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-critique
Related-Analysis: docs/plans/caryina-button-strategy/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260313163000-0005
Trigger-Why: Caryina defines its own .btn-primary utility class locally. The shared DS Button from @acme/design-system is available and partially adopted (Input was migrated in the same session). Centralising on the DS Button removes a caryina-local styling island and ensures brand token changes propagate automatically to all buttons.
Trigger-Intended-Outcome: type: operational | statement: All primary call-to-action buttons in caryina use the shared DS Button component or are explicitly documented as out-of-scope; the local .btn-primary CSS utility is removed or kept only as a documented intentional exception | source: auto
---

# Caryina Button Strategy Fact-Find Brief

## Scope

### Summary

Caryina defines its own `.btn-primary` CSS utility in `apps/caryina/src/styles/global.css` rather than using the shared `<Button>` component from `@acme/design-system/shadcn`. This creates a styling island: any brand token change (primary colour, hover shade, radius) must be manually propagated both to the DS button definition and to the local class. This fact-find evaluates whether to adopt the DS Button across all 12 caryina call sites, what the visual delta would be, and what migration effort is required.

### Goals

- Determine the exact visual difference between `.btn-primary` and DS `<Button>` with caryina tokens.
- Establish which call sites are caryina-owned vs shared platform code.
- Produce a migration approach that preserves visual fidelity or accepts a documented intentional change.
- Decide scope: caryina-owned buttons only, or include platform-core AddToCartButton.

### Non-goals

- Redesigning the button visual style beyond what is needed for faithful migration.
- Migrating AddToCartButton in `@acme/platform-core` (shared across businesses — out of scope here).
- Adding new DS Button variants or props not already present.

### Constraints & Assumptions

- Constraints:
  - `@acme/ui/components/atoms/shadcn` import path is banned by ESLint `no-restricted-imports`. All DS imports must use `@acme/design-system/shadcn`.
  - `@acme/design-system` is already a declared dependency after dispatch 0002 (Input migration).
  - CI tests must pass: caryina has integration-level tests for checkout, cart, PDP, and admin pages.
- Assumptions:
  - DS `<Button>` with `compatibilityMode="passthrough"` renders the button element without adding its own bg/padding/radius classes, so caryina can provide explicit className overrides that fully control the visual output — matching the current `.btn-primary` appearance exactly.
  - `rounded-full` is universally applied alongside `.btn-primary` at every call site; this aligns with DS `shape="pill"` or equivalent className override.

## Outcome Contract

- **Why:** Local `.btn-primary` is a styling island: brand-token changes to hover shade, primary colour, or focus ring must be manually kept in sync between global.css and any DS-native button styles. Centralising on the DS Button means one source of truth.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All caryina-owned call sites (12) use DS `<Button>` or an explicitly documented exception; `.btn-primary` CSS utility is removed from global.css once call sites are migrated.
- **Source:** auto

## Current Process Map

None: local code path only. This change alters component imports and a CSS utility class. No CI/deploy lane, approval path, or operator runbook is affected.

## Discovery Contract Output

- **Gap Case ID:** n/a
- **Recommended First Prescription:** n/a
- **Required Inputs:** none
- **Expected Artifacts:** none
- **Expected Signals:** none

### Prescription Candidates

None.

## Evidence Audit (Current State)

### Entry Points

- `apps/caryina/src/styles/global.css:39–57` — `.btn-primary` definition in `@layer components`
- `packages/design-system/src/primitives/button.tsx` — DS Button primitive source
- `packages/ui/src/components/atoms/shadcn/Button.tsx` — re-export from DS primitives (access restricted to `@acme/design-system/shadcn` import path)

### Key Modules / Files

- `apps/caryina/src/styles/global.css` — `.btn-primary` defined at lines 39–57 with hover/active/focus-visible states all consuming caryina tokens.
- `packages/design-system/src/primitives/button.tsx` — DS Button; variant `default` = `bg-primary text-primary-foreground hover:bg-primary/90`; `compatibilityMode="passthrough"` strips DS-internal classes and lets className override everything.
- `packages/themes/caryina/tokens.css` — `--color-primary: 355 55% 75%`, `--color-primary-hover: 355 55% 68%`, `--color-primary-active: 355 55% 61%`, `--color-primary-fg: 355 12% 20%`.
- `packages/platform-core/src/components/shop/AddToCartButton.client.tsx` — uses hardcoded Tailwind classes `bg-primary-main`, `hover:bg-primary-dark`. Not using `.btn-primary`. Not owned by caryina.

### Patterns & Conventions Observed

- `.btn-primary` is always combined with `rounded-full` at every call site — no call site uses it without a shape override.
- Every caryina-owned button using `.btn-primary` also specifies `min-h-11 min-w-11` (touch target) and `px-6 py-2.5` or similar spacing.
- DS `<Button>` already in use in caryina for `<Input>` (same package, same import path). No DS component adoption blocker.

**Hover colour divergence — critical finding:**

| Approach | Hover colour value | Source |
|---|---|---|
| `.btn-primary` | `hsl(355 55% 68%)` via `--color-primary-hover` | Explicit darker token |
| DS `<Button variant="default">` | `hsl(355 55% 75% / 0.90)` | `bg-primary/90` transparency |

At white backgrounds these produce subtly different results. The explicit token value (`68%` lightness) is darker and more deliberate. The opacity approach produces a lighter wash. For a pink (`355 55%`) palette on white backgrounds, `bg-primary/90` will mix with white and appear visibly lighter than the explicit token.

**Resolution:** Migration should use `compatibilityMode="passthrough"` and provide an explicit inline `className` string that reproduces the `.btn-primary` hover/active/focus behaviour using the existing caryina tokens, preserving current visual output exactly.

### Data & Contracts

- No schema or API changes. This is a pure front-end CSS/component migration.
- CSS layer: `.btn-primary` is in `@layer components`. After migration this block is deleted.

### Dependency & Impact Map

- Upstream dependencies:
  - `@acme/design-system/shadcn` — already a dep; no new package required.
  - `packages/themes/caryina/tokens.css` — tokens referenced in className overrides; no change to tokens needed.
- Downstream dependents:
  - 12 call sites in caryina (all caryina-owned — see full list below).
  - `AddToCartButton` in platform-core uses neither pattern; explicitly out of scope.
- Likely blast radius:
  - Visual regression on button hover/active states if `compatibilityMode` is not used or className overrides are incomplete.
  - TypeScript: `<Button>` accepts `className`, `disabled`, `type`, `onClick`, `ref`; all props currently on the raw `<button>` elements are valid on DS `<Button>`.

### Call Sites (12)

| File | Usage note |
|---|---|
| `apps/caryina/src/app/admin/products/page.tsx:16` | "Add product" CTA |
| `apps/caryina/src/app/admin/login/page.tsx:61` | Login submit, full-width |
| `apps/caryina/src/app/not-found.tsx:39` | "Go to shop" recovery CTA |
| `apps/caryina/src/app/[lang]/shop/page.tsx:125,136` | Filter toggle buttons (active state) |
| `apps/caryina/src/app/[lang]/checkout/CheckoutClient.client.tsx:399` | "Pay now" submit |
| `apps/caryina/src/app/[lang]/error.tsx:49` | "Try again" recovery CTA |
| `apps/caryina/src/app/[lang]/cart/page.tsx:113` | "Go to checkout" CTA |
| `apps/caryina/src/app/[lang]/page.tsx:105` | Homepage hero CTA |
| `apps/caryina/src/components/catalog/NotifyMeForm.client.tsx:127` | "Notify me" submit |
| `apps/caryina/src/components/admin/ProductForm.client.tsx:112` | Form save/create (already migrated to DS Input) |
| `apps/caryina/src/components/admin/InventoryEditor.client.tsx:91` | Inventory update (already migrated to DS Input) |

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest + React Testing Library (caryina-scoped jest config).
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/caryina/jest.config.cjs`
- CI integration: governed test runner enforced in CI.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Cart page | Unit/render | `cart/page.test.tsx` | Tests cart rendering, checkout CTA existence |
| Checkout | Unit/render | `CheckoutClient.test.tsx` | Tests form submission, pay button states |
| PDP | Unit/render | `product/[slug]/page.test.tsx` | Tests layout, AddToCartButton presence |
| Admin login | Unit/render | `admin/login/page.test.tsx` | Tests form submit button rendering |
| Shop page | Unit/render | `[lang]/shop/page.test.tsx` | Tests filter buttons |
| NotifyMeForm | Unit/render | `NotifyMeForm.client.test.tsx` | Tests submit button state |

#### Coverage Gaps

- No visual regression tests. Button hover/active state cannot be tested in JSDOM — no automated protection against colour drift.
- No accessibility assertion checking `role="button"` or ARIA patterns on DS-migrated buttons specifically.

#### Recommended Test Approach

- Unit: verify DS `<Button>` renders with expected `className` attributes (role, disabled state) — add or update existing snapshot/render tests.
- No new test infrastructure required; existing render tests catch structural regressions.

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | `.btn-primary` in global.css with explicit hover/active token references; DS Button uses opacity-based hover | Hover colour divergence if passthrough className not matched exactly | Yes — must define migration className that preserves token-based hover |
| UX / states | Required | 12 call sites with disabled, hover, active, focus-visible states; all use `.btn-primary` conventions | DS Button must expose all states via passthrough className; `disabled:opacity-50` is already standard | Yes — verify disabled/loading states survive migration |
| Security / privacy | N/A | No auth or sensitive data in button component | None | No |
| Logging / observability / audit | N/A | No analytics hooks on button elements | None | No |
| Testing / validation | Required | Render tests exist for all major pages with buttons | No visual regression tests; hover state untestable in JSDOM | Yes — update render tests post-migration |
| Data / contracts | N/A | No schema or API change | None | No |
| Performance / reliability | N/A | Button component swap has no runtime cost difference | None | No |
| Rollout / rollback | Required | 12 call sites in one app; no feature flag needed; rollback = git revert | If visual regression is missed in code review, no automated catch | Yes — plan should include visual spot-check in dev before commit |

## Questions

### Resolved

- Q: Does `compatibilityMode="passthrough"` on DS Button allow full className override including hover/active?
  - A: Yes. The DS Button primitive accepts `compatibilityMode="passthrough"` which disables its own bg/padding/ring classes. The caller's `className` fully controls the visual output. Confirmed in `packages/design-system/src/primitives/button.tsx`.
  - Evidence: `packages/design-system/src/primitives/button.tsx`

- Q: Is `@acme/design-system` already a declared caryina dependency?
  - A: Yes, added as a load-bearing dependency by dispatch 0002 (Input migration). No new package.json change needed.
  - Evidence: `apps/caryina/package.json` (updated in dispatch 0002 build)

- Q: Should AddToCartButton (platform-core) be included in this migration?
  - A: No. AddToCartButton is shared platform code consumed by multiple businesses; it uses neither `.btn-primary` nor DS Button (uses hardcoded Tailwind classes). A separate platform-level dispatch is warranted but is explicitly out of scope here to keep blast radius bounded.
  - Evidence: `packages/platform-core/src/components/shop/AddToCartButton.client.tsx`

- Q: Should the migration use DS Button `variant="default"` natively or `compatibilityMode="passthrough"` with explicit className?
  - A: Use `compatibilityMode="passthrough"` with a shared inline `className` string constant that replicates the exact token-based hover/active/focus chain. Rationale: the DS native hover (`bg-primary/90`) produces a visually different result on caryina's pink palette vs the explicit `--color-primary-hover` token. Preserving visual fidelity is the lower-risk migration.
  - Evidence: token comparison above; `packages/themes/caryina/tokens.css`

### Open (Operator Input Required)

None. All routing decisions are agent-resolvable from available evidence and business constraints.

## Scope Signal

**Signal: right-sized**

**Rationale:** 12 caryina-owned call sites. DS Button already adopted for Input. Passthrough mode is confirmed available. No schema, API, or multi-step process change. Test infrastructure is in place. AddToCartButton is explicitly excluded to keep blast radius bounded. This is a mechanical migration with one design decision (hover treatment) resolved by the passthrough approach.

## Confidence Inputs

- Implementation: 88%
  - Evidence: DS Button passthrough mode confirmed; 12 call sites fully enumerated; import path constraint known; `@acme/design-system` already a dep.
  - To reach 90%: confirm exact Tailwind class set needed to reproduce `.btn-primary` states in passthrough mode by building locally.
- Approach: 85%
  - Evidence: passthrough migration is the established pattern for this DS (same approach used for Input); hover divergence resolved by explicit className.
  - To reach 90%: verify no CSS specificity conflict between Tailwind utilities and passthrough className at runtime.
- Impact: 90%
  - Evidence: all 12 call sites enumerated; AddToCartButton scoped out; no API changes.
- Delivery-Readiness: 88%
  - Evidence: DS dep ready, all call sites identified, test infra present.
- Testability: 80%
  - Evidence: Render tests exist; hover/active states untestable in JSDOM but non-blocking.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Hover colour divergence if passthrough className is incomplete | Medium | Low (subtle visual only) | Use `compatibilityMode="passthrough"` + explicit token-based hover classes; spot-check in dev before commit |
| CSS specificity: Tailwind utilities and className override conflict | Low | Low | Test locally; Tailwind v4 utility specificity is predictable in passthrough mode |
| Shop filter toggle: `btn-primary` used conditionally with ternary | Low | Low | DS Button accepts conditional className; same ternary pattern preserved |
| AddToCartButton diverges from caryina buttons post-migration | Medium (already diverged) | Low | Out of scope; accept known divergence; flag for platform-level plan |

## Planning Constraints & Notes

- Must-follow patterns:
  - Import from `@acme/design-system/shadcn`, not `@acme/ui/components/atoms/shadcn`.
  - Use `compatibilityMode="passthrough"` on every migrated button element.
  - Replace `.btn-primary` references with an explicit inline `className` string constant that preserves token-based hover/active/focus-visible. Do NOT use Tailwind `@apply` to define the passthrough className constant — in Tailwind v4, `@apply` cannot freely reference `@layer components` utilities. Use direct token references in the className string instead.
  - Two call sites in `apps/caryina/src/app/[lang]/shop/page.tsx:125,136` are `<Link>` elements, not `<button>` elements. Use `<Button asChild compatibilityMode="passthrough" className="..."><Link href={...}>label</Link></Button>` for these two filter toggle sites. Do not attempt `<Button href={...}>` — that prop does not exist on this DS Button.
  - Remove `.btn-primary` from `global.css` only after all 12 call sites are migrated and CI passes.
- Rollout/rollback expectations:
  - Single PR, all 12 call sites + global.css cleanup in one commit. No phased rollout needed.
  - Rollback: `git revert` on the single commit. Zero data migration — no rollback procedure beyond code revert.
  - `--color-focus-ring: 220 90% 56%` is defined at `apps/caryina/src/styles/global.css:111` in the `:root` block, not in `packages/themes/caryina/tokens.css`. Deleting lines 39–57 (the `.btn-primary` rule block) does NOT delete this token. The passthrough className should use `focus-visible:outline-[hsl(var(--color-focus-ring))]` which will continue to resolve correctly. Note: this token is not in the caryina theme package token chain — a future theme consolidation should move it to `tokens.css`.
- Observability expectations: N/A — no runtime metrics or logs involved.

## Suggested Task Seeds (Non-binding)

1. **Define the passthrough className contract** — create a shared string constant that captures hover/active/focus-visible token references and `rounded-full` shape, to be used across all 12 migrated call sites. Do not use Tailwind `@apply` for this (see Planning Constraints).
2. **Migrate all 12 caryina-owned call sites** — replace raw `<button className="btn-primary ...">` with `<Button compatibilityMode="passthrough" className="...">`, one file per logical grouping (admin, customer-facing, catalog). Note: 2 sites in `apps/caryina/src/app/[lang]/shop/page.tsx:125,136` are `<Link>` elements — use `<Button asChild compatibilityMode="passthrough" className="..."><Link href={...}>label</Link></Button>` wrapping rather than replacing with `<Button>` directly.
3. **Remove `.btn-primary` from global.css** — delete lines 39–57 after all call sites are migrated.
4. **Update render tests** — update/add test assertions to verify DS `<Button>` renders with expected role and disabled state.
5. **Typecheck gate** — `pnpm --filter @apps/caryina typecheck` must pass.

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - 0 raw `<button className="btn-primary` patterns remain in caryina src.
  - `.btn-primary` block removed from global.css.
  - `pnpm --filter @apps/caryina typecheck` passes.
  - Existing render tests pass.
- Post-delivery measurement plan: N/A — cosmetic/structural migration only.

## Evidence Gap Review

### Gaps Addressed

- Call site enumeration: complete (12 sites, all confirmed caryina-owned except AddToCartButton which is excluded).
- DS passthrough mode: confirmed in source.
- Hover colour delta: quantified (HSL 355 55% 68% vs transparency-based 90%).
- Import restriction: confirmed (`@acme/design-system/shadcn` required).

### Confidence Adjustments

- No downward adjustments. All material evidence is code-readable and enumerable.

### Remaining Assumptions

- That `compatibilityMode="passthrough"` produces a clean slate for caryina className without CSS specificity leakage. Low risk; the DS primitive is designed for this use case.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| `.btn-primary` CSS definition and token chain | Yes | None | No |
| DS Button passthrough mode availability | Yes | None | No |
| All 12 call sites enumerated and ownership confirmed | Yes | None | No |
| Hover colour divergence between local class and DS default | Yes | [Advisory] Opacity-based hover differs from token-based hover | No — resolved: use passthrough mode |
| AddToCartButton (platform-core) | Yes | Out of scope | No |
| Test landscape: existing render tests | Yes | No hover-state automated test possible | No — known limitation, non-blocking |
| Import path restriction (`@acme/design-system/shadcn`) | Yes | None | No |

## Analysis Readiness

- Status: Ready-for-analysis
- Blocking items: none
- Recommended next step: `/lp-do-analysis caryina-button-strategy`
