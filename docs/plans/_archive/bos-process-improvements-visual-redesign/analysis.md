---
Type: Analysis
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: bos-process-improvements-visual-redesign
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: tools-ui-contrast-sweep, lp-design-qa
Related-Fact-Find: docs/plans/bos-process-improvements-visual-redesign/fact-find.md
Related-Plan: docs/plans/bos-process-improvements-visual-redesign/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# BOS Process-Improvements Visual Redesign — Analysis

## Decision Frame

### Summary
The `.cmd-centre` CSS class forces a dark theme regardless of system preference and uses heavily saturated blue-navy surfaces with a strong pink-purple hero gradient. The decision is: which architectural approach correctly makes the section light/dark-responsive and adds the glassmorphism depth the operator wants, with minimum blast radius?

### Goals
- `prefers-color-scheme` auto-switches the section correctly — no manual toggle needed
- Hero sections get glassmorphism (backdrop-blur + semi-transparent surface)
- Palette saturation is reduced; coloring is restrained
- Light mode is polished and legible (including correct hero foreground text)
- Dark mode retains its character but with less visual weight

### Non-goals
- Full design system token overhaul
- Adding a theme toggle UI control to business-os
- Changing data logic, API routes, or projection code

### Constraints & Assumptions
- Constraints:
  - DS lint rules must pass (`ds/no-raw-tailwind-color`, `ds/enforce-layout-primitives`, `ds/no-physical-direction-classes-in-rtl`)
  - `backdrop-filter` is confirmed working in this app
  - Edit surfaces: `global.css` (`.cmd-centre` + `bg-cmd-hero` + new utilities), `new-ideas/page.tsx` and `in-progress/page.tsx` (hero glass treatment), `NewIdeasInbox.tsx` and `InProgressInbox.tsx` (card semi-transparent surfaces)
  - `--hero-fg` is white in both modes — light mode must add an explicit override (`--hero-fg: var(--color-fg)` which is the dark foreground token, `0 0% 10%`, appropriate for a light background)
- Assumptions:
  - `prefers-color-scheme` media query in the base `tokens.css` is the existing mechanism; this approach mirrors and extends it
  - No user-facing toggle is needed — system preference is the right default for an internal operator tool

## Inherited Outcome Contract

- **Why:** The process-improvements screens use flat, heavily coloured cards that feel visually dense. There is no proper light mode — the operator always works in a forced dark theme. A lighter glassmorphism treatment combined with full light and dark mode support would make the tool noticeably more comfortable to use during the working day, particularly when reviewing and actioning a long list of plans.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Process-improvements pages have glassmorphism-style cards, a restrained/less heavy colour palette, and a polished light/dark mode experience that switches correctly based on system preference.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/bos-process-improvements-visual-redesign/fact-find.md`
- Key findings used:
  - `.cmd-centre` is the only scoping mechanism — single usage in `layout.tsx`, safe to change with no blast radius
  - `--hero-fg` is white in both light and dark modes (`tokens.css:126-127`) — explicit light-mode override required
  - `backdrop-blur-sm` already works in business-os (`QuickCaptureModal.tsx:262`) — no config needed
  - Per-row blur on 20+ cards has GPU cost — glassmorphism should target hero/panel level only
  - Base token system already has correct light/dark pairs — no base-layer changes needed
  - `overflow-hidden` on hero section is workable (blur on background layer, not the contained child)

## Evaluation Criteria

| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Blast radius | Fewer files changed = lower regression risk for an internal tool | High |
| Correctness (light/dark) | The fundamental goal is proper mode switching | High |
| DS lint compliance | Violations block CI | High |
| Glassmorphism fidelity | Visual quality of the result | Medium |
| Future-proofing | How easy to extend if BOS gets more sections | Low |

## Options Considered

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A — Media-guard `.cmd-centre` + `@utility` glassmorphism | Wrap existing `.cmd-centre` dark values in `@media prefers-color-scheme: dark` + `html.theme-dark .cmd-centre`; add a clean light-mode `.cmd-centre` block; add `@utility glass-panel` and `@utility bg-cmd-hero-dark`/`bg-cmd-hero-light`; apply semi-transparent backgrounds to cards | Bounded blast radius (5 files); mirrors existing base token pattern exactly | Slightly more CSS rules to maintain; page files need hero glass layer additions | None — pattern is identical to how `tokens.css` handles dark mode | Yes |
| B — Dedicated `--cmd-*` semantic token layer | Add `--cmd-surface-glass`, `--cmd-hero-from`, `--cmd-hero-to`, `--cmd-hero-fg` tokens inside `.cmd-centre`, with explicit light/dark value pairs, then use those tokens in all utilities and components | Clean semantic abstraction; easy to tune per-value | More files changed; token layer grows; over-engineered for BOS-internal tooling at this stage | Token name collisions with future design system expansion | Yes |
| C — Remove `.cmd-centre`, use Tailwind `dark:` modifiers throughout | Delete `.cmd-centre`; apply `dark:bg-...` + `dark:text-...` on every component and page element | Standard Tailwind v4 pattern | Massive edit surface (both inbox components — hundreds of class edits); DS lint rules may conflict; loses the useful isolation that `.cmd-centre` provides; high regression risk | High test/review burden; easy to miss a `dark:` pair | No — disproportionate cost |

## Engineering Coverage Comparison

| Coverage Area | Option A — Media-guard + utilities | Option B — Token layer | Chosen implication |
|---|---|---|---|
| UI / visual | Glassmorphism via `@utility glass-panel`; light/dark via `@media` guard on `.cmd-centre`; restrained `bg-cmd-hero` | Same visual outcome but via token indirection | Option A: direct CSS change; same visual result, fewer abstraction layers |
| UX / states | All states (empty, collapsed, loading) inherit from `.cmd-centre` token overrides — no per-state code needed | Same | Option A: tokens propagate automatically to all states |
| Security / privacy | N/A (no auth or data change) | N/A | N/A |
| Logging / observability / audit | N/A | N/A | N/A |
| Testing / validation | Jest unit tests unaffected; contrast sweep + lp-design-qa post-build are the validation gates | Same | Contrast sweep required for both |
| Data / contracts | N/A | N/A | N/A |
| Performance / reliability | Blur limited to hero/panel sections — not per-row. GPU load acceptable. | Same | Blur placement is the critical control; both options apply blur the same way |
| Rollout / rollback | CSS-only; rollback = revert `global.css` + class-name edits in 2 page files + 2 inbox component files. No migration. | CSS + token file; rollback surface is same or larger. | Option A rollback: 5 files, class-name only — clean and fast |

## Chosen Approach

- **Recommendation:** **Option A — Media-guard `.cmd-centre` + `@utility` glassmorphism**

- **Why this wins:**
  1. **Mirrors the existing pattern exactly.** The base `tokens.css` wraps dark values in `@media (prefers-color-scheme: dark)` and `html.theme-dark`. Making `.cmd-centre` do the same is the smallest correct change — no new concepts introduced.
  2. **Bounded blast radius.** The change touches `global.css` (CSS utilities + `.cmd-centre` override), both page files (hero glass layer), and the two inbox components (card surface classes). All five files are identified and class-name / CSS changes only — no logic changes.
  3. **Clean rollback.** Reverting `global.css` plus the class-name edits in the four component/page files fully restores the prior state. No migration, no data change.
  4. **Sufficient abstraction.** A `@utility glass-panel` class is the right Tailwind v4 extension point — readable, compliant with DS rules, and reusable if other BOS sections want the same treatment.

- **What it depends on:**
  - Correct light-mode neutral values for `.cmd-centre` — must produce legible contrast without being stark white
  - `--hero-fg` override inside the light-mode `.cmd-centre` block to fix white-text-on-light-background contrast failure
  - Hero glassmorphism via a background pseudo-element or absolute-positioned layer (needed because the hero's `overflow-hidden` clips any `backdrop-filter` on its children if they extend beyond bounds)

### Rejected Approaches

- **Option B (token layer)** — Token indirection adds abstraction without fixing any specific gap. The base token system already handles light/dark correctly; adding another `--cmd-*` layer duplicates the concern without benefit for an internal tool. Deferred: revisit if BOS grows to multiple themed sections.
- **Option C (Tailwind `dark:` modifiers throughout)** — Disproportionate edit surface and high regression risk. Loses the clean isolation that `.cmd-centre` provides. Not viable at this scope.

### Open Questions (Operator Input Required)

- Q: Should the light-mode hero gradient be near-white/neutral or a subtle tinted color?
  - Why operator input is required: Preference between two equally correct options — neutral gray vs soft indigo-tinted.
  - Planning impact: Determines specific HSL values for `bg-cmd-hero` light variant. Safe default documented below.
  - **Safe default:** `linear-gradient(135deg, hsl(240 15% 96%) 0%, hsl(260 20% 92%) 100%)` with `--hero-fg` set to `var(--color-fg)` (dark text). Planning uses this default if no operator preference is provided before build begins.

## End-State Operating Model

None: no material process topology change. This is a pure CSS/class-name change. No workflow, CI lane, API route, approval path, or operator runbook is affected.

## Planning Handoff

- Planning focus:
  - **TASK-01 — `.cmd-centre` light/dark fix:** Rewrite `.cmd-centre` to have a base light-mode block (neutral surfaces, `--hero-fg: var(--color-fg)`) and a dark block wrapped in `@media (prefers-color-scheme: dark)` + `html.theme-dark .cmd-centre` combinator. Values must produce WCAG AA contrast in both modes.
  - **TASK-02 — Hero gradient responsiveness:** Replace `@utility bg-cmd-hero` (single hard-coded gradient) with a light-mode utility (`bg-cmd-hero`) and a dark-mode utility or media-aware version. Dark: restrained `hsl(300 35% 45%)` to `hsl(260 55% 38%)` (lower saturation). Light: safe default from Open Questions above, or operator-confirmed value.
  - **TASK-03 — `@utility glass-panel` + apply to hero surfaces:** Add `glass-panel` utility (semi-transparent background + `backdrop-filter: blur(12px)`) to `global.css`. Apply as follows: `new-ideas/page.tsx` has no stat panels in its hero — apply glass treatment to the hero section itself (background layer). `in-progress/page.tsx` has two stat panels (`InProgressCountBadge` + `LiveNewIdeasCount` blocks with `border border-hero-foreground/16 bg-hero-foreground/8`) — apply `glass-panel` to those panels. NOT applied to per-row inbox cards.
  - **TASK-04 — Inbox card surfaces:** Apply semi-transparent surface treatment (`bg-surface-1/80` equivalent via `hsl(var(--surface-1) / 0.85)`) to plan cards in `NewIdeasInbox.tsx` and `InProgressInbox.tsx`. No `backdrop-blur` on cards (performance). Add subtle ambient background depth to the main content area for depth without per-card blur.
  - **TASK-05 — Post-build validation:** Run `tools-ui-contrast-sweep` in both light and dark mode; run `lp-design-qa`; fix all Critical/Major findings before marking complete.

- Validation implications:
  - No Jest test changes expected — unit tests cover behaviour, not class names
  - Contrast sweep is mandatory in both modes before the build is complete
  - `validate-engineering-coverage.sh` must pass on the plan

- Sequencing constraints:
  - TASK-01 before TASK-02 (`.cmd-centre` light/dark must exist before hero background can correctly rely on context)
  - TASK-03 and TASK-04 after TASK-01 + TASK-02 (glass surfaces only make sense once the underlying background tokens are correct)
  - TASK-05 final, post all changes

- Risks to carry into planning:
  - `overflow-hidden` on hero section may clip backdrop-blur on inner children — use a background-layer element (absolute-positioned, behind overflow, outside the clip) or accept blur on the section wrapper itself which sits outside its own overflow
  - `--hero-fg` white in both modes — light-mode `.cmd-centre` block must explicitly set `--hero-fg: var(--color-fg)` (dark foreground, `0 0% 10%`) — NOT `var(--color-fg-dark)` which is near-white (`0 0% 93%`) and would reproduce the contrast failure

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| `overflow-hidden` clipping backdrop-blur on hero children | Low | Medium | Implementation detail — depends on exact DOM structure chosen | Plan task must include blur placement strategy |
| Light-mode contrast failures on glass surfaces | Medium | Medium | Exact values not yet chosen — only confirmed direction | Contrast sweep is the mandatory gate before completion |
| `--hero-fg` override missed in light mode | Low | High | CSS authoring risk — easy to omit | TASK-01 acceptance criteria must explicitly test white text / pale background |
| Hero light-mode values — operator preference gap | Low | Low | Has safe documented default | Use default unless operator confirms preference before build |

## Planning Readiness
- Status: Go
- Rationale: Approach is decisive, all affected files identified, safe defaults documented for open questions, engineering coverage implications clear. No blocking gaps remain.
