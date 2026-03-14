---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: UI
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: bos-process-improvements-visual-redesign
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: tools-ui-contrast-sweep, lp-design-qa
Related-Analysis: docs/plans/bos-process-improvements-visual-redesign/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260313213000-BOS-001
---

# BOS Process-Improvements Visual Redesign — Fact-Find Brief

## Scope

### Summary
The Business OS process-improvements section (Operator Inbox and In Progress) uses a forced dark theme with flat opaque cards and a strong pink-purple hero gradient. The operator has requested: (1) a glassmorphism treatment with semi-transparent surfaces and backdrop blur applied at the hero/section level (not per row-card), (2) lighter and more restrained colouring, and (3) proper light and dark mode support that switches automatically with system preference (`prefers-color-scheme`). No user-visible theme toggle is in scope — automatic switching is sufficient.

### Goals
- Hero section and page-level panels get `backdrop-filter: blur` and semi-transparent backgrounds — glassmorphism applied at section level, not per list-card row
- Hero header gradient is restrained — lower saturation, works in both light and dark
- `.cmd-centre` scoped theme becomes light/dark responsive, automatically following `prefers-color-scheme` — no toggle needed, no toggle in scope
- Light mode is fully usable and visually polished, not just a grey blob
- Dark mode preserves the existing character but with less visual weight

### Non-goals
- Full design system overhaul — changes are scoped to `apps/business-os/src/styles/global.css`, `layout.tsx`, `new-ideas/page.tsx`, `in-progress/page.tsx`, and the two inbox components
- Adding a theme toggle UI control to business-os (the base token system already handles `prefers-color-scheme` automatically)
- Changing any data logic, API routes, or projection code

### Constraints & Assumptions
- Constraints:
  - Must comply with DS lint rules (`ds/no-raw-tailwind-color`, `ds/enforce-layout-primitives`, `ds/no-physical-direction-classes-in-rtl`)
  - `backdrop-filter` is confirmed available (used in `QuickCaptureModal.tsx:262`)
  - Existing Jest component tests cover behaviour only — visual/class changes are low-risk but not zero-risk; any structural change to page/layout markup should be checked against existing test selectors
  - Builds under Webpack (not Turbopack) — Tailwind v4 `@utility` blocks are the correct extension point
- Assumptions:
  - No explicit theme toggle is needed — `prefers-color-scheme` media query in `tokens.css` handles automatic mode switching once `.cmd-centre` stops overriding it
  - The Tailwind v4 `backdrop-blur-*` utilities are available globally without extra config

## Outcome Contract

- **Why:** The process-improvements screens use flat, heavily coloured cards that feel visually dense. There is no proper light mode — the operator always works in a forced dark theme. A lighter glassmorphism treatment combined with full light and dark mode support would make the tool noticeably more comfortable to use during the working day, particularly when reviewing and actioning a long list of plans.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Process-improvements pages have glassmorphism-style cards, a restrained/less heavy colour palette, and a polished light/dark mode experience that switches correctly based on system preference.
- **Source:** operator

## Current Process Map

None: local code path only. This work changes CSS styling and class token overrides only — no multi-step workflow, CI lane, approval path, or lifecycle state is affected.

## Evidence Audit (Current State)

### Entry Points
- `apps/business-os/src/app/process-improvements/layout.tsx` — applies `.cmd-centre` class, wrapping all process-improvements routes
- `apps/business-os/src/app/process-improvements/new-ideas/page.tsx:16` — applies `bg-cmd-hero` on hero section
- `apps/business-os/src/app/process-improvements/in-progress/page.tsx:22` — applies `bg-cmd-hero` on hero section

### Key Modules / Files
- `apps/business-os/src/styles/global.css:171-180` — `.cmd-centre` class: hard-overrides all surface/fg/border tokens to dark navy values. No `@media` guard — overrides light/dark system preference regardless.
- `apps/business-os/src/styles/global.css:134-136` — `@utility bg-cmd-hero`: `linear-gradient(135deg, hsl(320 80% 62%) 0%, hsl(265 72% 56%) 100%)` — strong pink-to-purple, 80% saturation.
- `apps/business-os/src/styles/global.css:138-143` — `cmd-glow-sm` and `cmd-glow-lg` box-shadow utilities exist but are not applied to any process-improvements cards currently.
- `packages/themes/base/tokens.css:1-225` — base token system: full light (`:root`) and dark (`@media (prefers-color-scheme: dark)` + `html.theme-dark`) pairs for all semantic tokens. The token system is already well-structured for light/dark support.
- `apps/business-os/src/components/process-improvements/NewIdeasInbox.tsx:1029` — plan cards: `rounded-xl border bg-surface-1 shadow-elevation-1` — solid opaque surface, no transparency.
- `apps/business-os/src/components/process-improvements/InProgressInbox.tsx:215` — in-progress cards: `rounded-xl border bg-surface-1 shadow-elevation-1` — same opaque pattern.
- `apps/business-os/src/components/capture/QuickCaptureModal.tsx:262` — `backdrop-blur-sm` already used in this app (confirms backdrop-filter support).

### Patterns & Conventions Observed
- `.cmd-centre` is only used in `layout.tsx` — no other component applies it. Safe to modify without blast radius.
- `bg-cmd-hero` is only applied in `new-ideas/page.tsx` and `in-progress/page.tsx`. Both are direct class applications, not inside shared components.
- Glow utilities (`cmd-glow-sm`, `cmd-glow-lg`) exist and are defined — unused on cards, available to apply.
- DS lint rule `ds/no-raw-tailwind-color` means semi-transparent backgrounds need to use CSS custom properties (`hsl(var(--...) / 0.08)`) not raw Tailwind palette colors.
- Tailwind v4 `@utility` blocks in `global.css` are the correct way to add named glassmorphism utilities (e.g., `@utility glass-card`).

### Dependency & Impact Map
- Upstream dependencies: `packages/themes/base/tokens.css` (light/dark token values already correct)
- Downstream dependents: `new-ideas/page.tsx` and `in-progress/page.tsx` (hero markup), `NewIdeasInbox.tsx` (plan card surfaces: `bg-surface-1`), `InProgressInbox.tsx` (in-progress card surfaces: `bg-surface-1`)
- Likely blast radius: `global.css` (`.cmd-centre` + `bg-cmd-hero` edits + new utilities), the two page files (hero section markup/class), and the two inbox components (card surface class edits). Logic in all four is unchanged — class-name edits only.

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest + React Testing Library, jest-dom
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/business-os/jest.config.cjs` (CI only — note: config is `.cjs`, not `.ts`)
- CI integration: governed runner in `.github/workflows/ci.yml`

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| NewIdeasInbox | RTL unit | `NewIdeasInbox.test.tsx` | Tests behaviour/state, not visual appearance |
| InProgressInbox | RTL unit | `InProgressInbox.test.tsx` | Tests behaviour/state, not visual appearance |
| ProcessImprovementsSubNav | RTL unit | `ProcessImprovementsSubNav.test.tsx` | Tests count badge logic |

#### Coverage Gaps
- No visual regression tests — CSS class changes won't be caught by Jest
- No snapshot tests covering DOM class names that would detect class changes
- Post-build contrast sweep (via `tools-ui-contrast-sweep`) is the correct validation gate for visual changes

#### Testability Assessment
- Easy to test: unit behaviour is unchanged — existing tests pass without modification
- Hard to test: glassmorphism visual appearance, contrast ratios, backdrop-blur effect
- Test seams needed: contrast sweep after build; `lp-design-qa` for visual review

### Recent Git History (Targeted)
- `apps/business-os/src/styles/global.css` — `.cmd-centre` and `bg-cmd-hero` added during command-centre redesign (plan now archived). These are the primary targets.

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | Flat opaque `bg-surface-1` cards; strong `hsl(320 80% 62%)` hero gradient; `.cmd-centre` forces dark always | Glass surfaces and restrained palette are absent; light mode renders using dark tokens | Yes — this is the core deliverable |
| UX / states | Required | Both pages have empty-state cards, loading states, and collapsed sections (just built in TASK-07b) | Ensure glass effect works at all states including empty-state `border-dashed` cards | Yes |
| Security / privacy | N/A | Pure CSS/styling change; no auth, data, or input handling involved | None | No |
| Logging / observability / audit | N/A | No log or metric changes | None | No |
| Testing / validation | Required | Jest tests cover behaviour, not visuals; `backdrop-blur-sm` already works in this app | No visual regression coverage; contrast sweep is the gate | Yes — contrast sweep + lp-design-qa post-build |
| Data / contracts | N/A | No schema, API, or type changes | None | No |
| Performance / reliability | Required | `backdrop-filter: blur` has GPU cost; applied to many cards in the inbox (potentially 20+ cards visible) | Blur on many elements simultaneously may hurt scroll perf on lower-end hardware | Yes — recommend limiting blur to card-hover or hero section, not every card |
| Rollout / rollback | Required | CSS-only change; no migration needed. Rollback = revert `.cmd-centre` and `bg-cmd-hero` edits | Low risk; instant rollback by reverting one CSS file + page files | Yes — note the simple rollback path |

## Questions

### Resolved
- Q: Does `backdrop-filter` work in this app?
  - A: Yes — `QuickCaptureModal.tsx:262` uses `backdrop-blur-sm` today.
  - Evidence: `apps/business-os/src/components/capture/QuickCaptureModal.tsx:262`

- Q: Does `.cmd-centre` have any usage outside process-improvements?
  - A: No — only `layout.tsx:7` applies it. Safe to change without blast radius.
  - Evidence: grep confirms 1 usage site only.

- Q: Is there a theme toggle in business-os?
  - A: No. The base token system in `tokens.css` handles automatic light/dark switching via `prefers-color-scheme` media query + `html.theme-dark` class. Business-os has no toggle component. Fixing `.cmd-centre` to stop hard-forcing dark is sufficient for correct auto-switching.
  - Evidence: No `ThemeModeDock` or `ThemeToggle` references found in `apps/business-os/src/`.

- Q: Should blur be applied to every card or only selectively?
  - A: Selectively. Applying `backdrop-filter: blur` to every plan card in a 20+ item inbox creates significant GPU load per repaint. Best practice (supported by operator reference image): apply blur to the page-level section header and a maximum of one or two "featured" card surfaces. Regular list cards can use semi-transparent backgrounds without blur. This also avoids the blur-through-overflow-hidden issue on the hero section.
  - Evidence: Reference design uses large single-card blur, not per-row blur in lists.

- Q: What saturation level is "restrained"?
  - A: The reference design used near-neutral darks with accent colours at <30% saturation backgrounds. For the hero gradient, dropping saturation from 80% to ≤40% and lightening the endpoint values produces a similar restrained feel. Exact values are a planning/build decision but the direction is clear.
  - Evidence: Reference image analysis; `hsl(320 80% 62%)` → target approximately `hsl(300 35% 55%)` or a neutral dark gradient in dark mode.

- Q: What value does `--hero-fg` use in light mode?
  - A: `--hero-fg: var(--token-hero-fg, 0 0% 100%)` and `--hero-fg-dark: var(--token-hero-fg-dark, 0 0% 100%)` — **both are white**. `tokens.css:126-127`. This means `text-hero-foreground` is white in both modes. Planning must add a `.cmd-centre` light-mode `--hero-fg` override so hero text is readable on a pale background.
  - Evidence: `packages/themes/base/tokens.css:126-127`

### Open (Operator Input Required)
- Q: Should the hero header background in light mode be a very subtle gradient (nearly white) or a soft tinted panel?
  - Why operator input is required: This is a colour preference decision the operator needs to confirm — both approaches work technically.
  - Decision impacted: `bg-cmd-hero` light-mode value selection.
  - Decision owner: operator (Peter)
  - Default assumption: If no input: use a soft indigo-tinted neutral in light mode (`hsl(240 15% 96%)` to `hsl(260 20% 92%)`), white text replaced with dark foreground. This is consistent with modern SaaS dashboards in light mode.

- Q: How should hero foreground text (currently `text-hero-foreground`, using `--hero-fg` which is white in both modes) be handled in light mode?
  - Why operator input is required: `--hero-fg` is declared as `0 0% 100%` (white) for both light and dark in `packages/themes/base/tokens.css:126-127`. White text on a light/pale hero background fails contrast. The fix requires either (a) overriding `--hero-fg` inside the light-mode `.cmd-centre` rule, or (b) replacing `text-hero-foreground` with a conditional `text-fg` class in light mode, or (c) using a dark hero background in light mode too. This is a design decision with UX implications.
  - Decision impacted: hero text readability in light mode; determines whether hero-fg token gets a per-scope light override or whether the hero always stays dark.
  - Decision owner: operator (Peter)
  - Default assumption: Override `--hero-fg` inside `.cmd-centre`'s light-mode variant to use the dark foreground token (`var(--color-fg)`). This is the simplest token-layer fix — no component changes needed.

## Confidence Inputs
- Implementation: 88% — all files identified, `backdrop-blur` confirmed working, pattern is clear
- Approach: 72% — two viable approaches (token-based vs utility-based) need comparison at analysis
- Impact: 90% — visual improvement is clearly achievable; light mode fix is straightforward
- Delivery-Readiness: 80% — one open question (hero light-mode colour) but has a safe default
- Testability: 75% — visual validation relies on contrast sweep post-build; JS tests unaffected

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Blur on many list cards → scroll jank | Medium | Medium | Apply blur only to hero section and page-level panels, not to per-row cards |
| `overflow-hidden` on hero section clips blur effect | Low | Low | Blur on hero background element sits behind the overflow container, not on child — structurally fine |
| Light mode contrast failures on glass surfaces | Medium | Medium | Run `tools-ui-contrast-sweep` at both light and dark mode after build; fix before marking complete |
| Hard-coded pixel values in `.cmd-centre` don't follow token convention | Low | Low | Migrate to token-referenced values where possible; raw HSL triplets are acceptable in `.cmd-centre` since it IS a token override block |

## Planning Constraints & Notes
- Must-follow patterns:
  - New background utilities go in `@utility` blocks in `global.css` — not inline `style={}` or raw Tailwind class lists
  - Semi-transparent surfaces must use `hsl(var(--...) / <alpha>)` pattern, not raw palette colors
  - `ds/no-raw-tailwind-color` must pass — no `bg-slate-800/40` style raw colors
  - DS layout primitives (`<Inline>`, `<Stack>`) already in place from the command-centre redesign — no regression needed
  - `--hero-fg` is white in both light and dark modes — the light-mode `.cmd-centre` variant MUST override it (e.g. to `var(--color-fg)`) so hero text is readable on a pale background
- Rollout/rollback expectations:
  - CSS-only; rollback by reverting `global.css` and the two page files. No database migration, no data change.
- Observability expectations:
  - None required for a styling change. Post-build contrast sweep is the gate.

## Suggested Task Seeds (Non-binding)
- TASK-01: Update `.cmd-centre` to be light/dark responsive — remove hard dark override, add `@media prefers-color-scheme: dark` guard + `html.theme-dark .cmd-centre` rule, and add a light-mode `--hero-fg` override so hero text is readable
- TASK-02: Replace `bg-cmd-hero` with a responsive pair (light: soft neutral/tinted gradient with dark fg; dark: restrained lower-saturation version of current pink-purple)
- TASK-03: Add glassmorphism `@utility` classes to `global.css` (glass-panel, glass-card-header) and apply to hero sections
- TASK-04: Add ambient glow background depth to main content area (page background layer behind cards)
- TASK-05: Post-build validation — contrast sweep in light + dark mode; lp-design-qa; fix all Critical/Major findings

## Execution Routing Packet
- Primary execution skill: lp-do-build
- Supporting skills: tools-ui-contrast-sweep, lp-design-qa
- Deliverable acceptance package: All CSS changes lint-clean; contrast sweep passes WCAG AA in light and dark; `backdrop-filter` visible in browser at both modes; existing Jest tests pass
- Post-delivery measurement plan: Visual QA by operator in browser; no metrics

## Evidence Gap Review

### Gaps Addressed
- Confirmed `.cmd-centre` has no blast radius (single usage site)
- Confirmed `backdrop-filter` is supported in this app (modal usage)
- Confirmed the base token system already has light/dark pairs — no new tokens needed at base layer
- Confirmed no existing visual regression tests — contrast sweep is the correct post-build gate
- Identified performance risk for per-row blur and recommended a selective application strategy

### Confidence Adjustments
- Implementation confidence raised from 78% (dispatch estimate) to 88% — full file map established
- One open question remains (light-mode hero colour preference) but has a safe default

### Remaining Assumptions
- The base `tokens.css` light-mode values (white backgrounds, dark text) are appropriate for light mode in BOS. They may look too stark — analysis should consider whether a lightly tinted neutral background is better.
- No accessibility audit has been run on the current state. Changes must not regress existing contrast.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| `.cmd-centre` token override | Yes | None — single usage, safe to change | No |
| `bg-cmd-hero` gradient | Yes | None — only on 2 page files | No |
| Glassmorphism on hero section | Yes | `overflow-hidden` on hero section: blur must be on background layer not on contained child | No — structurally workable; note in plan |
| Per-card blur (list items) | Yes | [Performance] [Advisory]: GPU cost of blur on 20+ cards | No — resolved: blur on hero/panels only, not per-row cards |
| Light mode rendering | Partial | Token system handles it automatically once `.cmd-centre` stops overriding | No — confirmed fix path |
| DS lint compliance | Yes | Confirmed: must use `hsl(var(--...) / alpha)` pattern; `ds/no-raw-tailwind-color` enforced | No |
| Test impact | Yes | Existing Jest tests cover behaviour only; visual tests need contrast sweep | No |

## Scope Signal

- **Signal:** right-sized
- **Rationale:** The scope is bounded to one CSS file (`global.css`), one layout wrapper (`layout.tsx`), two page files (hero sections in `new-ideas/page.tsx` and `in-progress/page.tsx`), and the two inbox components (`NewIdeasInbox.tsx`, `InProgressInbox.tsx`) for semi-transparent card backgrounds. All affected files are identified. The token system already handles light/dark at the base layer. No new packages or architecture changes needed.

## Analysis Readiness
- Status: Ready-for-analysis
- Blocking items: None. One open question (light-mode hero colour) has a safe documented default.
- Recommended next step: `/lp-do-analysis bos-process-improvements-visual-redesign`
