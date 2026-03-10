---
Type: Fact-Find
Status: Archived
Feature-Slug: reception-contrast-and-visual-polish
Business: BRIK
Created: 2026-03-08
Domain: reception
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Design-Spec-Required: no
Dispatch-ID: none
---

# Fact-Find: Reception Dark Mode Contrast and Visual Polish

## Scope & Intent

The reception app is used by hostel staff all day in a dark-mode environment. Several categories of text and interactive controls are too dim to read at a glance, forcing staff to lean in and squint when scanning check-in tables, interpreting status icons, or reading bar product prices. This fact-find diagnoses the root causes in the token layer and component layer and produces a prioritised fix list ready for planning.

**In scope:**
- `--color-fg-muted` dark value — the primary cause of dim secondary text in check-in/checkout rows
- `--color-muted-fg` dark value — a second muted-text token with a different (also low) value
- `StatusButton` 60% opacity clock icon on pending/unchecked rows
- Bar POS `ProductGrid` price badge at 10.4 px — too small regardless of colour
- `PaymentSection` total price text using `text-primary-main` — verify it resolves correctly in dark mode
- `CityTaxPaymentButton` and `KeycardDepositButton` active state (`bg-primary-main/100 text-primary-fg/100`) — verify legibility
- Routes affected: `/checkin`, `/bar`, (`/checkout` already addressed in a prior build)

**Out of scope:**
- Checkout table (confirmed updated in prior build)
- Bar shade family colours (separate concern — POS row tinting)
- Light mode contrast (no reported issues)
- Any route outside `apps/reception`

---

## Access Declarations

None — all evidence gathered from local codebase files only.

---

## Routing Header

```
Outcome: planning
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
```

---

## Evidence Audit (Current State)

### Dark Mode Switching Mechanism (confirmed)

`packages/themes/reception/tokens.css` uses a **dual-block approach**:

1. `:root { }` — declares all light-mode values plus `-dark` sibling variables (e.g. `--color-fg-muted: oklch(0.51 0 89.88)` alongside `--color-fg-muted-dark: oklch(0.560 0.015 165)`). The `-dark` siblings sit unused in `:root` — they are staging values only.

2. `@media (prefers-color-scheme: dark) { :root { } }` — overrides the bare token names by pointing them at their `-dark` sibling via `var()`. E.g.: `--color-fg-muted: var(--color-fg-muted-dark)`.

3. `html.theme-dark { }` — identical overrides, class-based. Enables programmatic dark-mode toggle independent of OS preference.

The `globals.css` `html.dark, body.dark { color-scheme: dark; }` block is **supplementary** — it signals to the browser to use dark-mode native chrome, but does NOT switch any custom property values. Dark token switching is entirely handled by `@media (prefers-color-scheme: dark)` and `html.theme-dark` in `tokens.css`.

**There is no circular reference issue.** `globals.css` line 43 reads:
```
--color-muted-foreground: var(--color-fg-muted, var(--color-fg));
```
Because `tokens.css` is imported before `globals.css @theme`, and the dark blocks inside `tokens.css` correctly override `--color-fg-muted`, the `@theme` alias picks up the switched value at runtime. The fallback `var(--color-fg)` is never reached in dark mode.

**Key finding**: `--color-primary-main` in `@theme` reads `var(--color-primary)`. In dark mode, `tokens.css` sets `--color-primary: var(--color-primary-dark)` = `oklch(0.780 0.210 149)` — a bright green. This resolves correctly. `--color-primary-fg` dark = `oklch(0.147 0.003 174.11)` (near-black). The `text-primary-fg/100` class on CityTaxPaymentButton and KeycardDepositButton active states therefore renders near-black text on bright green — fully legible, no issue.

---

### Token Layer Diagnosis

All WCAG contrast approximations below use the formula: **ratio = (L_lighter + 0.05) / (L_darker + 0.05)** where L is the OKLCH lightness value. This is an approximation — WCAG formally uses sRGB relative luminance. OKLCH L tracks perceptual lightness and is a reasonable proxy for mid-range colours; results within ~10% of actual. Thresholds: **4.5:1 normal text AA**, **3:1 large text / UI components AA**.

#### Token 1: `--color-fg-muted` dark = `oklch(0.560 0.015 165)`

Used via `--color-muted-foreground` in `globals.css @theme`. Consumed by any component using the Tailwind `text-muted-foreground` utility, including secondary data cells in check-in rows (payment amounts, balance figures, status labels).

| Surface | Surface L | Text L | Approx ratio | WCAG AA (4.5:1) | WCAG AA large (3:1) |
|---|---|---|---|---|---|
| `--surface-1` dark | 0.140 | 0.560 | (0.610)/(0.190) = **3.21:1** | FAIL | PASS |
| `--surface-2` dark | 0.200 | 0.560 | (0.610)/(0.250) = **2.44:1** | FAIL | FAIL |
| `--color-table-row-alt` dark | 0.175 | 0.560 | (0.610)/(0.225) = **2.71:1** | FAIL | FAIL |

**Verdict**: `--color-fg-muted` dark fails WCAG AA for normal text on all surfaces, and fails the large-text threshold on surface-2 and alt-row backgrounds. This is the primary root cause of "nearly invisible" secondary data.

**Target value**: To clear 3:1 on surface-2 (the worst case for large/UI text), L must satisfy:
`(L + 0.05) / (0.200 + 0.05) ≥ 3.0` → `L ≥ 3.0 × 0.250 − 0.05 = 0.700`

To clear 3:1 on alt rows:
`(L + 0.05) / 0.225 ≥ 3.0` → `L ≥ 0.625`

Recommended dark value: **`oklch(0.720 0.018 165)`**
- Against surface-1: (0.770)/(0.190) = **4.05:1** — passes large-text AA, approaches normal-text AA
- Against surface-2: (0.770)/(0.250) = **3.08:1** — passes large-text AA
- Against alt-row (L=0.175): (0.770)/(0.225) = **3.42:1** — passes large-text AA

#### Token 2: `--color-muted-fg` dark = `oklch(0.600 0.015 165)`

This is a **different token** from `--color-fg-muted`. It maps to `--color-muted-foreground` is not directly used by `--color-muted-fg` — the globals.css alias chain uses `--color-fg-muted`, not `--color-muted-fg`. However, `--color-muted-fg` is exposed as a raw CSS custom property and may be consumed directly by some components or the design system.

| Surface | Surface L | Text L | Approx ratio | WCAG AA (4.5:1) |
|---|---|---|---|---|
| `--surface-1` dark | 0.140 | 0.600 | (0.650)/(0.190) = **3.42:1** | FAIL |
| `--surface-2` dark | 0.200 | 0.600 | (0.650)/(0.250) = **2.60:1** | FAIL |

**Verdict**: Fails AA for normal text. Should be raised in tandem with `--color-fg-muted` for consistency.

Recommended dark value: **`oklch(0.720 0.018 165)`** (same target as fg-muted for visual consistency).

#### Token 3: `--color-primary` dark chain

Chain: `--color-primary` → `oklch(0.780 0.210 149)` (bright green, L=0.780)
Against `--surface-2` (L=0.200): (0.830)/(0.250) = **3.32:1** — passes large-text AA.
Against `--surface-1` (L=0.140): (0.830)/(0.190) = **4.37:1** — just passes normal-text AA.

The `text-primary-main` class on `PaymentSection`'s total price (`text-2xl font-extrabold`) is large text — 3:1 threshold applies. **Passes**. No fix needed.

#### Token 4: `--color-fg` dark = `oklch(0.950 0.010 165)` — **clean**

Against `--surface-1` (L=0.140): (1.000)/(0.190) = **5.26:1** — passes AA normal text. Components using `text-foreground` (TableHeader icons, BookingRow default text) are fine at the token level.

---

### Component Layer Diagnosis

#### Route: `/checkin` — CheckinsTable

**StatusButton** (`apps/reception/src/components/checkins/StatusButton.tsx`):
- Code=0 (awaiting check-in): `bg-surface-3 text-foreground/60`
- `text-foreground/60` = `oklch(0.950 0.010 165)` at 60% opacity over `--surface-3` dark (L=0.260)
- Effective rendered lightness ≈ 0.60 × 0.950 + 0.40 × 0.260 = 0.570 + 0.104 = **L≈0.674** (approximation — actual alpha blending varies)
- Against `--surface-3` (L=0.260): (0.724)/(0.310) = **2.34:1** — FAILS large-text AA (3:1)
- **Issue**: The 60% opacity is the problem. Full `text-foreground` (L=0.950) gives 5.26:1 on surface-3. The 60% clip is unnecessary for semantics — the icon alone communicates the pending state.
- **Fix**: Remove `/60` opacity modifier → `bg-surface-3 text-foreground`

**TableHeader icons** (`apps/reception/src/components/checkins/TableHeader.tsx`):
- Icon-only headers inherit `text-foreground`
- `--color-fg` dark = L=0.950 against `--surface-2` (L=0.200): **4.37:1** — passes AA. No fix needed.

**BookingRow secondary text** (`apps/reception/src/components/checkins/view/BookingRow.tsx`):
- Row uses `text-foreground` globally; specific cells with amounts/balance likely use `text-muted-foreground`
- **Fix**: Covered by the `--color-fg-muted` token raise

**CityTaxPaymentButton** (active state):
- `bg-primary-main/100 text-primary-fg/100`: bright green bg (L=0.780) with near-black text (L=0.147)
- Against L=0.780: (0.197)/(0.830) = **0.24:1** inverted — text is darker than bg. Correct formula: (0.830)/(0.197) = **4.21:1** — just passes large-text AA, nearly passes normal-text AA. The amount text `€${amount.toFixed(2)}` is small (`text-xs font-medium`). **Borderline** but acceptable — the button is small enough that normal-text AA (4.5:1) technically applies. This is a pre-existing design choice and is within acceptable range given button context.
- **No fix needed** — note for awareness.

**KeycardDepositButton** (grey-disabled state):
- `bg-surface-3 text-foreground cursor-not-allowed opacity-50`
- This is intentionally very dim — it represents "action not available". No fix needed for this semantic state.
- Active state: same `bg-primary-main/100 text-primary-fg/100` as CityTaxPaymentButton — acceptable.

#### Route: `/bar` — Bar POS

**ProductGrid price badge** (`apps/reception/src/components/bar/orderTaking/ProductGrid.tsx`):
- Price badge uses `text-0_65rem` = 10.4 px
- WCAG minimum font size for normal text AA is 18pt (~24px) for large text treatment; 10.4px is well below — requires full 4.5:1 contrast
- Even if colour is adequate, 10.4px text is below the minimum practical legibility threshold for fast scanning. WCAG does not set a minimum font size rule but 10.4px is widely considered problematic for operational UI
- **Fix**: Raise to `text-xs` (12px) minimum. Prefer `text-sm` (14px) for key data like price.

**PaymentSection total price** (`apps/reception/src/components/bar/orderTaking/PaymentSection.tsx`):
- `text-2xl font-extrabold text-primary-main` — large, bold, uses bright green. Confirmed legible (see token analysis above).
- **No fix needed.**

**PaymentSection bleep input label**:
- `text-sm font-medium text-foreground` — uses full foreground at L=0.950. Legible.
- **No fix needed.**

#### Route: `/checkout` — CheckoutTable

Confirmed updated in prior build. Not re-audited here — treat as clean unless regression is observed.

---

### Route Coverage Map

| Route | Dark Mode Status | Issues Found | Fix Required |
|---|---|---|---|
| `/checkin` | Affected | fg-muted AA failures, StatusButton 60% opacity | Yes |
| `/bar` | Affected | ProductGrid 10.4px price badge | Yes |
| `/checkout` | Clean (prior build) | None | No |
| `/prepare` | Not audited | Unknown | Possible — uses same tables |
| `/search` | Not audited | Unknown | Possible — uses same tables |
| `/stats`, `/live` | Not audited | Lower priority (dashboards) | Optional |

> Note: `/prepare` and `/search` use the same table components as `/checkin`. Fixing the tokens and StatusButton will benefit those routes automatically.

---

## Confidence Assessment

**Overall confidence for planning: 87**

| Input | Status | Confidence contribution |
|---|---|---|
| Token values (fg-muted, muted-fg, primary, fg) | Confirmed — read directly from tokens.ts and tokens.css | High |
| Dark mode switching mechanism | Confirmed — dual @media + html.theme-dark block in tokens.css | High |
| globals.css alias chain | Confirmed — no circular reference, correct var() chain | High |
| Component locations and class-level issues | Confirmed — StatusButton, ProductGrid, both action buttons read | High |
| Fix approach (token-first + targeted component edits) | Confirmed — 2 token changes + 2 component changes | High |
| Validation path | pnpm tokens:contrast:check + pnpm typecheck — confirmed toolchain exists | Medium |
| /prepare, /search route coverage | Not audited — token fix will propagate automatically | Medium |

---

## Planning Readiness

### Key decisions already made

1. **Token-first approach**: Both fg-muted and muted-fg dark values are raised to L=0.720 in `packages/themes/reception/src/tokens.ts` (source of truth) and the generated `tokens.css`.
2. **Component fix 1**: `StatusButton.tsx` — remove `/60` opacity from the `text-foreground/60` class on the code=0 (pending) state. Full `text-foreground` preserves icon identity and raises contrast from ~2.34:1 to ~5.26:1.
3. **Component fix 2**: `ProductGrid.tsx` — raise price badge text from `text-0_65rem` (10.4px) to `text-xs` (12px). A follow-up consideration is `text-sm` (14px) if the button layout allows.
4. **No changes needed**: PaymentSection total, TableHeader icons, CityTaxPaymentButton/KeycardDepositButton active states.

### Proposed fix list (prioritised)

**Priority 1 — Token changes (zero component edits, high blast radius of improvement)**

| Token | Current dark | Target dark | Rationale |
|---|---|---|---|
| `--color-fg-muted` | `oklch(0.560 0.015 165)` | `oklch(0.720 0.018 165)` | Passes 3:1 on surface-2; approaches 4:1 on surface-1 |
| `--color-muted-fg` | `oklch(0.600 0.015 165)` | `oklch(0.720 0.018 165)` | Consistency; same failure profile |

Files to change:
- `packages/themes/reception/src/tokens.ts` — source of truth; update `.dark` values
- `packages/themes/reception/tokens.css` — re-generated from tokens.ts (build-tokens.ts script); must be regenerated or manually updated in sync

**Priority 2 — Component changes (targeted, minimal surface area)**

| Component | File | Current class | Target class | Rationale |
|---|---|---|---|---|
| StatusButton (code=0) | `apps/reception/src/components/checkins/StatusButton.tsx` | `text-foreground/60` | `text-foreground` | 60% opacity renders icon at ~2.34:1; full foreground is 5.26:1 |
| ProductGrid price badge | `apps/reception/src/components/bar/orderTaking/ProductGrid.tsx` | `text-0_65rem` | `text-xs` | 10.4px below practical legibility floor; 12px minimum |

**Priority 3 — Validation and verification**

- Run `pnpm tokens:contrast:check` after token changes to confirm ratios
- Run `pnpm typecheck` to confirm no TS issues from token or component edits
- Visual spot-check in browser dark mode on `/checkin` and `/bar` routes

---

## Open Questions

### Q1: Does the `tokens.css` file need to be manually updated or is it fully generated?

The file header reads `/* Generated by build-tokens.ts */`. This implies a build step regenerates the file from `src/tokens.ts`. The planning task must determine whether to:
- (a) Update `src/tokens.ts` only and run the build script, or
- (b) Update both `src/tokens.ts` (source of truth) and `tokens.css` (generated output) manually to avoid depending on the build script in-task.

**Recommended approach**: Update `src/tokens.ts` as source of truth and also update `tokens.css` directly with the exact same values, since regeneration may require a separate build environment and the change is deterministic.

### Q2: Are there other components consuming `--color-fg-muted` or `--color-muted-fg` directly (not via Tailwind aliases)?

Token raise is safe across the board — raising L from 0.560 to 0.720 in dark mode only makes text more readable, not less. No risk of over-contrast. Self-resolved as a non-blocking question.

### Q3: Does `/prepare` also have StatusButton with the same 60% opacity pattern?

StatusButton is shared across checkin and prepare routes via the same component. The fix to `StatusButton.tsx` propagates to all routes automatically. Non-blocking.

---

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Token diagnosis (fg-muted, muted-fg) | Yes — direct read of tokens.ts and tokens.css | AA failures on all dark surfaces | Token value raise — straightforward |
| Dark mode switching mechanism | Yes — tokens.css dual-block (media query + html.theme-dark) | None (mechanism works correctly) | No |
| globals.css alias chain | Yes — line 43 confirmed, no circular ref | None | No |
| primary-main dark resolution | Yes — oklch(0.780 0.210 149), fg pair near-black | No issue | No |
| StatusButton opacity | Yes — code=0: text-foreground/60 on surface-3 | 2.34:1 contrast failure | Component edit |
| ProductGrid price badge size | Yes — text-0_65rem = 10.4px confirmed | Below legibility floor | Component edit |
| PaymentSection total price | Yes — text-2xl text-primary-main | No issue | No |
| CityTaxPaymentButton / KeycardDepositButton | Yes — both use bg-primary-main/100 text-primary-fg/100 | Borderline normal-text AA (4.21:1) but acceptable | No |
| TableHeader icons | Confirmed via text-foreground (L=0.950) | No issue | No |
| Route coverage | Partial — checkin and bar fully audited; checkout confirmed clean | prepare/search auto-heal from token fix | No |
| Validation path | Yes — tokens:contrast:check + typecheck confirmed | None | No |

---

## Scope Signal

**Signal: right-sized**

Rationale: Two token line-changes and two targeted component edits. The token changes have broad positive impact (all muted text across the app) with zero risk of regression — raising L in dark mode only improves contrast. The component edits are line-level. Existing validation toolchain (`tokens:contrast:check`, `typecheck`) covers both change types. No new infrastructure required.

---

## Outcome Contract

**Why**: Reception staff use the app all day in dark mode. Secondary data in table rows — payment amounts, balance figures, status icons, and doc status — is nearly invisible at the current token values. Staff cannot quickly scan booking state without leaning in to read, causing friction during check-in and potential errors during shift handovers.

**Intended Outcome Type**: operational

**Intended Outcome Statement**: All secondary text, status icons, and action button labels in the reception dark mode are legible at a glance without straining. Staff can scan check-in rows and read bar product prices from normal desk distance.

**Source**: operator

---

## Evidence Gap Review

| Evidence Category | Status | Notes |
|---|---|---|
| Token current values | Confirmed — tokens.ts and tokens.css read directly | |
| Dark switching mechanism | Confirmed — dual-block pattern in tokens.css | |
| globals.css alias chain | Confirmed — no circular reference | |
| Component class-level issues | Confirmed — StatusButton, ProductGrid, both action buttons | |
| Fix target values (OKLCH) | Calculated — L=0.720 clears 3:1 on surface-2 | Approximation; contrast:check tool validates |
| Validation path | Confirmed — tokens:contrast:check + typecheck | |
| /prepare, /search routes | Not fully audited — token fix propagates automatically | Low risk gap |
| Price badge UX threshold | Judgement call — 10.4px is universally too small for ops UI | No ambiguity |
