---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: UI
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: reception-bar-pos-theming-overhaul
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: tools-design-system, lp-design-qa
Related-Analysis: docs/plans/reception-bar-pos-theming-overhaul/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260312100000-0001
---

# Reception Bar/POS Theming Overhaul Fact-Find Brief

## Scope

### Summary

The bar/POS area of the reception app has 10 confirmed theming issues across 8 files. The issues fall into four categories: (1) redundant `/100` opacity modifiers, (2) incorrect foreground colour pairing on status backgrounds, (3) arbitrary opacity values where semantic tokens should be used, and (4) weak interaction feedback patterns. The bar is the most-used daily interface for reception staff.

### Goals

- Replace all incorrect foreground/background pairings with semantically correct tokens
- Remove redundant `/100` opacity modifiers for code clarity
- Replace arbitrary opacity values with semantic token alternatives where they exist
- Ensure consistent interaction feedback (distinct hover vs active states)

### Non-goals

- Adding dark mode toggle UI (dark mode is handled by CSS variable overrides)
- Redesigning bar layout or component structure
- Changing the shade colour system for product categories (those are correctly themed)
- Adding new tokens to the design system (only using existing ones)

### Constraints & Assumptions

- Constraints:
  - All changes must use existing semantic tokens from `packages/themes/reception/src/tokens.ts` and the base theme
  - No arbitrary hex/RGB values allowed (design system hard rule)
  - Changes are purely className adjustments — no component API or logic changes
- Assumptions:
  - Opacity modifiers on semantic tokens (`/95`, `/80`) are acceptable per Tailwind v4 design system guidance when used intentionally for layering (e.g., backdrop blur)
  - `/100` opacity is redundant (Tailwind default is full opacity) and should be removed for clarity

## Outcome Contract

- **Why:** The bar is the screen staff use most every day. Some button colours use redundant opacity syntax that obscures intent, and status indicators (like 'order ready' or 'order cancelled') use the wrong text colour, making them hard to read against coloured backgrounds. Fixing this means every button, status badge, and price tag looks correct and is easy to read.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All bar/POS components use valid semantic design tokens with correct foreground/background pairing and no redundant opacity values.
- **Source:** operator

## Discovery Contract Output

- **Gap Case ID:** n/a
- **Recommended First Prescription:** n/a

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/components/bar/` — bar component root (8 files affected)

### Key Modules / Files

1. `apps/reception/src/components/bar/orderTaking/OrderList.tsx` — order list with submit/cancel buttons
2. `apps/reception/src/components/bar/orderTaking/PaymentSection.tsx` — payment input area
3. `apps/reception/src/components/bar/orderTaking/modal/PayModal.tsx` — payment method modal
4. `apps/reception/src/components/bar/CompScreen.tsx` — completion/kitchen screen
5. `apps/reception/src/components/bar/sales/SalesScreen.tsx` — sales overview with filters
6. `apps/reception/src/components/bar/sales/Ticket.tsx` — individual order ticket
7. `apps/reception/src/components/bar/sales/TicketItems.tsx` — ticket line items
8. `apps/reception/src/components/bar/HeaderControls.tsx` — bar header navigation

### Patterns & Conventions Observed

**Token resolution chain (verified):**
- `receptionSemanticColors` in `apps/reception/tailwind.config.mjs` maps semantic names → CSS variables
- CSS variables defined in `packages/themes/base/tokens.css` (lines 54-77 for status colours)
- Reception overrides in `packages/themes/reception/tokens.css` for primary/surface tokens
- Base tailwind config provides `danger` → `hsl(var(--color-danger))` (line 28 of root `tailwind.config.mjs`)

**Valid utility classes (confirmed):**
- `danger`, `danger-fg`, `danger-foreground` — all resolve via base + reception configs
- `error-main` → `hsl(var(--color-danger))`, `error-light` → `hsl(var(--color-danger-soft))`
- `success-main`, `success-fg`, `warning-main`, `warning-fg`, `info-main`, `info-fg` — all valid
- `primary-main`, `primary-fg`, `primary-light` (→ primary-soft), `primary-dark`, `primary-hover`, `primary-active` — all valid
- `/100` opacity modifier — valid Tailwind v4 syntax (= 100% opacity), but redundant

**Issue classification after verification:**

| # | File | Line | Issue | Verified Severity |
|---|------|------|-------|-------------------|
| 1 | OrderList.tsx | 94 | `bg-primary-main/100`, `text-primary-fg/100` — redundant `/100` | Low (cleanup) |
| 2 | OrderList.tsx | 101 | `border-danger/100`, `text-danger/100`, `hover:bg-danger/10` — redundant `/100`, but `danger` IS valid | Low (cleanup `/100`) |
| 3 | PaymentSection.tsx | 61 | `bg-surface/60` — should be `bg-input`; `focus-visible:focus:ring-2` has double `focus:` prefix | Medium |
| 4 | PayModal.tsx | 39 | `border-primary-main/100 bg-primary-soft/100 text-primary-main/100` — redundant `/100` | Low (cleanup) |
| 5 | PayModal.tsx | 123 | `bg-primary-main/100 text-primary-fg/100` — redundant `/100` | Low (cleanup) |
| 6 | CompScreen.tsx | 58 | `bg-success-main text-primary-fg` — should be `text-success-fg` for correct contrast | High |
| 7 | CompScreen.tsx | 77 | `hover:bg-primary-light/30` — arbitrary opacity on semantic token | Medium |
| 8 | CompScreen.tsx | 112 | `text-primary-fg` on both `bg-success-main` and `bg-error-main` — should use `text-success-fg` / `text-danger-fg` | High |
| 9 | SalesScreen.tsx | 116 | `from-surface via-surface-1 to-surface-1` — surface and surface-1 are aliases for the same value | Low (clarity) |
| 10 | SalesScreen.tsx | 123 | `bg-surface-3/50`, `hover:bg-surface-3/70` — arbitrary opacity on surfaces | Medium |
| 11 | Ticket.tsx | 39 | `text-primary-fg/80` — could use `text-muted-foreground` for secondary text | Low |
| 12 | TicketItems.tsx | 23 | `hover:bg-primary-soft active:bg-primary-soft` — same colour for hover and active (no feedback distinction) | Low |
| 13 | HeaderControls.tsx | 33 | `focus-visible:ring-white/70` — hardcoded `white`, should be `ring-primary-fg/70` or `ring-surface/70` | Medium |
| 14 | HeaderControls.tsx | 43 | `bg-surface/10`, `hover:bg-surface/20` — low opacity for contrast on primary-main background | Medium |

### Data & Contracts

- Types/schemas/events: No schema changes needed — purely className adjustments
- Persistence: N/A
- API/contracts: N/A

### Dependency & Impact Map

- Upstream dependencies:
  - `packages/themes/reception/src/tokens.ts` — token source (no changes needed)
  - `packages/themes/base/tokens.css` — CSS variable definitions (no changes needed)
  - `apps/reception/tailwind.config.mjs` — colour mapping (no changes needed)
- Downstream dependents: None — these are leaf component classNames
- Likely blast radius: Small — each fix is an isolated className string replacement

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest + React Testing Library
- Commands: `pnpm --filter reception test` (CI only per testing policy)
- CI integration: Tests run in CI reusable workflow

#### Existing Test Coverage
- Bar components have minimal direct test coverage for visual presentation
- No visual regression tests exist for bar area

#### Testability Assessment
- Easy to test: Token correctness can be verified by visual inspection after changes
- Hard to test: Contrast ratios in dark mode require browser rendering
- Test seams needed: None — changes are purely presentational

#### Recommended Test Approach
- Visual verification via `/tools-ui-contrast-sweep` after changes
- No new unit tests needed for className changes

### Recent Git History (Targeted)
Not investigated: changes are token fixes, not affected by recent commits.

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | 14 className issues across 8 files; 2 High (wrong fg on status bg), 5 Medium, 7 Low | Incorrect contrast on CompScreen status rows is the primary visual defect | Fix all 14 issues; verify with contrast sweep |
| UX / states | Required | Hover/active states on TicketItems identical; focus ring on HeaderControls uses hardcoded white | Weak interaction feedback in ticket list; focus ring invisible on light backgrounds | Differentiate hover/active; replace hardcoded focus colours |
| Security / privacy | N/A | No auth, data, or input changes | — | — |
| Logging / observability / audit | N/A | No logic changes | — | — |
| Testing / validation | Required | No existing visual tests for bar area | No automated regression catch for theming | Visual verification via contrast sweep post-build |
| Data / contracts | N/A | No schema or API changes | — | — |
| Performance / reliability | N/A | className changes have zero runtime cost | — | — |
| Rollout / rollback | Required | Single commit, no migration needed | Low risk — revert is a single commit | Standard deploy, no feature flag needed |

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Token resolution chain | Yes | None — all tokens verified against base + reception configs | No |
| CompScreen status colours | Yes | High: wrong fg on status backgrounds (2 instances) | No — clear fix identified |
| OrderList/PayModal opacity | Yes | Low: redundant `/100` modifiers (5 instances) | No — mechanical cleanup |
| PaymentSection input styling | Yes | Medium: surface/60 instead of input token; double focus prefix | No — clear fix |
| SalesScreen surfaces | Yes | Medium: arbitrary opacity on surface-3; gradient aliases identical | No — clear fix |
| HeaderControls focus/bg | Yes | Medium: hardcoded white in focus ring; low-opacity surface on primary bg | No — clear fix |
| Ticket secondary text | Yes | Low: opacity modifier instead of semantic token | No — clear fix |
| TicketItems interaction | Yes | Low: identical hover/active states | No — clear fix |

## Scope Signal

- Signal: right-sized
- Rationale: 14 issues across 8 files, all with clear fixes using existing tokens. No architectural changes, no new token definitions, no component API changes. Bounded and well-evidenced.

## Questions

### Resolved

- Q: Is `danger` a valid Tailwind utility in the reception app?
  - A: Yes. The base `tailwind.config.mjs` (line 28) maps `danger` → `hsl(var(--color-danger))`. The reception config also maps `danger-fg` → `hsl(var(--color-danger-fg))`.
  - Evidence: `tailwind.config.mjs:28`, `apps/reception/tailwind.config.mjs:45`

- Q: Is `/100` opacity valid in Tailwind v4?
  - A: Yes, `/100` = 100% opacity. It is syntactically valid but redundant (default is full opacity). Should be removed for clarity, not because it's broken.
  - Evidence: Tailwind v4 docs — opacity modifier range is 0-100.

- Q: Are `success-fg`, `warning-fg`, `info-fg`, `danger-fg` valid in reception?
  - A: Yes. All are mapped in `receptionSemanticColors` (lines 45-48 of reception tailwind config) and the underlying CSS variables exist in `base/tokens.css`.
  - Evidence: `apps/reception/tailwind.config.mjs:45-48`, `packages/themes/base/tokens.css:56-75`

- Q: Should `bg-surface/60` be replaced with `bg-input`?
  - A: Yes. `input` is mapped to `hsl(var(--surface-input))` in the reception semantic colours (line 20). This is the correct semantic token for input backgrounds.
  - Evidence: `apps/reception/tailwind.config.mjs:20`

- Q: What should replace `hover:bg-primary-light/30` in CompScreen?
  - A: Use `hover:bg-primary-soft` (no opacity modifier). `primary-light` already maps to `primary-soft`, and the `/30` creates unnecessarily faint hover feedback.
  - Evidence: `apps/reception/tailwind.config.mjs:29`

### Open (Operator Input Required)

None — all issues have clear, evidence-based resolutions.

## Confidence Inputs

- Implementation: 95% — all fixes are className string replacements with known target tokens
- Approach: 95% — token resolution chain fully verified; each fix maps to an existing semantic token
- Impact: 80% — fixes visual defects staff encounter daily; High issues fix unreadable status text
- Delivery-Readiness: 95% — no dependencies, no blockers, no new tokens needed
- Testability: 70% — visual verification only; no automated contrast tests. Would reach 90% with automated visual regression.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Shade token opacity on bar header (bg-primary-main/95) is intentional for backdrop blur | Low | Low | Preserve /95 on backdrop-blur elements — do not change these |
| HeaderControls bg-surface/10 may be intentionally low-contrast on primary-main header | Low | Medium | Replace with bg-primary-fg/10 for correct contrast; verify visually |
| Removing /100 could theoretically change rendering if tokens emit opacity-aware values | Very Low | Low | Tokens emit HSL triplets; /100 on hsl() = no change |

## Planning Constraints & Notes

- Must-follow patterns:
  - Use semantic token names from `receptionSemanticColors` (not raw CSS variables)
  - Preserve intentional opacity on backdrop-blur elements (bg-primary-main/95)
  - Use design system Button component where applicable (not in scope — existing buttons are custom styled)
- Rollout/rollback expectations:
  - Single commit, standard deploy, revert = single revert
- Observability expectations:
  - Visual verification via contrast sweep post-deploy

## Suggested Task Seeds (Non-binding)

1. Fix CompScreen status foreground colours (High — 2 instances)
2. Clean up redundant /100 opacity across OrderList, PayModal (Low — 5 instances)
3. Replace arbitrary opacity/input tokens in PaymentSection, SalesScreen, HeaderControls (Medium — 5 instances)
4. Improve interaction feedback in TicketItems (Low — 1 instance)

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: tools-design-system, lp-design-qa
- Deliverable acceptance package: All bar className strings use valid semantic tokens; no /100 modifiers; CompScreen status rows use correct -fg tokens; visual contrast sweep passes
- Post-delivery measurement plan: Visual verification of bar screens in both light and dark mode

## Evidence Gap Review

### Gaps Addressed
- Token resolution chain fully verified — all 4 config layers checked (base tokens.ts → base tokens.css → reception tokens.ts → reception tailwind.config.mjs)
- `danger` token confirmed valid (was initially reported as undefined)
- `/100` opacity confirmed valid but redundant (was initially reported as invalid)

### Confidence Adjustments
- Initial severity of issues #1, #2, #4, #5 downgraded from Critical to Low after verification
- Overall issue count refined from 12 to 14 after discovering additional HeaderControls issues

### Remaining Assumptions
- Backdrop-blur elements intentionally use `/95` opacity (not flagged for change)
- `font-body` class in SalesScreen is valid (registered in reception tailwind config)

## Analysis Readiness

- Status: Ready-for-analysis
- Blocking items: None
- Recommended next step: `/lp-do-analysis reception-bar-pos-theming-overhaul`
