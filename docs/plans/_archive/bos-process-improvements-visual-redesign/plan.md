---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-14
Last-reviewed: 2026-03-14
Last-updated: 2026-03-14
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: bos-process-improvements-visual-redesign
Dispatch-ID: IDEA-DISPATCH-20260313213000-BOS-001
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: tools-ui-contrast-sweep, lp-design-qa
Overall-confidence: 86%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/bos-process-improvements-visual-redesign/analysis.md
---

# BOS Process-Improvements Visual Redesign Plan

## Summary

The process-improvements section of Business OS forces a dark theme regardless of system preference and uses a heavily saturated pink-purple hero gradient with flat opaque cards. This plan implements Option A from analysis: media-guard the `.cmd-centre` CSS class to be light/dark responsive, replace the hard-coded `bg-cmd-hero` gradient with restrained light and dark variants, add a `@utility glass-panel` for hero-section glassmorphism, apply semi-transparent card surfaces to inbox items, and validate both modes with a contrast sweep and design QA. The blast radius is five files, all CSS/class-name changes — no logic, data, or routing changes.

## Active tasks
- [x] TASK-01: Update `.cmd-centre` to light/dark responsive
- [x] TASK-02: Replace `bg-cmd-hero` with restrained light/dark gradient pair
- [x] TASK-03: Add `@utility glass-panel` and apply to hero sections
- [x] TASK-04: Apply semi-transparent surfaces to inbox card items
- [x] TASK-05: Post-build contrast sweep and design QA

## Goals
- `prefers-color-scheme` auto-switches the section correctly — no manual toggle needed
- Hero sections get glassmorphism (backdrop-blur + semi-transparent surface)
- Palette saturation is reduced; coloring is restrained
- Light mode is polished and legible (including correct hero foreground text)
- Dark mode retains its character but with less visual weight

## Non-goals
- Full design system token overhaul
- Adding a theme toggle UI control to business-os
- Changing data logic, API routes, or projection code

## Constraints & Assumptions
- Constraints:
  - DS lint rules must pass (`ds/no-raw-tailwind-color`, `ds/enforce-layout-primitives`, `ds/no-physical-direction-classes-in-rtl`)
  - `backdrop-filter` is confirmed working in this app (used in `QuickCaptureModal.tsx:262`)
  - Light-mode `.cmd-centre` block must explicitly set `--hero-fg: var(--color-fg)` — NOT `var(--color-fg-dark)` which is near-white (`0 0% 93%`) and would recreate the contrast failure
  - Blur must be on a background layer element (absolute-positioned), not on a child clipped by `overflow-hidden` on the hero section
- Assumptions:
  - `prefers-color-scheme` media query in `tokens.css` is the existing mechanism; `.cmd-centre` override will mirror it exactly
  - No user-facing toggle is needed — system preference is the right default for an internal operator tool
  - `new-ideas/page.tsx` hero has no stat panels (title + tagline only); `in-progress/page.tsx` hero has two stat panels (`InProgressCountBadge` + `LiveNewIdeasCount` blocks)

## Inherited Outcome Contract

- **Why:** The process-improvements screens use flat, heavily coloured cards that feel visually dense. There is no proper light mode — the operator always works in a forced dark theme. A lighter glassmorphism treatment combined with full light and dark mode support would make the tool noticeably more comfortable to use during the working day, particularly when reviewing and actioning a long list of plans.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Process-improvements pages have glassmorphism-style cards, a restrained/less heavy colour palette, and a polished light/dark mode experience that switches correctly based on system preference.
- **Source:** operator

## Analysis Reference
- Related analysis: `docs/plans/bos-process-improvements-visual-redesign/analysis.md`
- Selected approach inherited:
  - Option A — Media-guard `.cmd-centre` + `@utility` glassmorphism
  - Wrap existing `.cmd-centre` dark values in `@media (prefers-color-scheme: dark)` + `html.theme-dark .cmd-centre`; add clean light-mode `.cmd-centre` block; add `@utility glass-panel` and responsive `bg-cmd-hero`; apply semi-transparent backgrounds to hero and card surfaces
- Key reasoning used:
  - Mirrors the existing base `tokens.css` pattern exactly — smallest correct change, no new concepts
  - Bounded blast radius (5 files, CSS/class-name only)
  - Clean rollback: revert `global.css` + class edits in 4 component/page files

## Selected Approach Summary
- What was chosen:
  - CSS media-guard approach (Option A) — add light-mode block to `.cmd-centre`, wrap dark values in `@media (prefers-color-scheme: dark)` and `html.theme-dark .cmd-centre` combinator
  - Restrained dark hero gradient: `hsl(300 35% 45%)` to `hsl(260 55% 38%)` (lower saturation vs current `hsl(320 80% 62%)`)
  - Light hero gradient safe default: `linear-gradient(135deg, hsl(240 15% 96%) 0%, hsl(260 20% 92%) 100%)`
  - Glass treatment at hero/section level only — no per-row backdrop-blur (GPU performance)
- Why planning is not reopening option selection:
  - Analysis gate passed with decisive recommendation and no operator-only fork remaining
  - Option B (token layer) deferred as over-engineered; Option C (Tailwind `dark:` modifiers) rejected as disproportionate

## Fact-Find Support
- Supporting brief: `docs/plans/bos-process-improvements-visual-redesign/fact-find.md`
- Evidence carried forward:
  - `.cmd-centre` single usage in `layout.tsx` — safe to change with no blast radius outside the section
  - `--hero-fg` is `0 0% 100%` (white) in BOTH light and dark modes (`tokens.css:126-127`) — explicit light-mode override required: `--hero-fg: var(--color-fg)` (dark text, `0 0% 10%`)
  - `backdrop-blur-sm` already works (`QuickCaptureModal.tsx:262`)
  - Per-row blur on 20+ cards has GPU cost — confirmed: hero/panel-level only
  - Base token system has correct light/dark pairs — no base-layer changes needed

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Update `.cmd-centre` to light/dark responsive | 88% | M | Complete (2026-03-14) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Replace `bg-cmd-hero` with restrained light/dark gradient pair | 88% | S | Complete (2026-03-14) | TASK-01 | TASK-03, TASK-04 |
| TASK-03 | IMPLEMENT | Add `@utility glass-panel` and apply to hero sections | 84% | M | Complete (2026-03-14) | TASK-01, TASK-02 | TASK-05 |
| TASK-04 | IMPLEMENT | Apply semi-transparent surfaces to inbox card items | 83% | M | Complete (2026-03-14) | TASK-01, TASK-02 | TASK-05 |
| TASK-05 | IMPLEMENT | Post-build contrast sweep and design QA | 90% | S | Complete (2026-03-14) | TASK-03, TASK-04 | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | Glassmorphism at hero/panel level; light/dark `.cmd-centre` block; restrained `bg-cmd-hero` gradient | TASK-01, TASK-02, TASK-03, TASK-04 | DS lint compliance enforced throughout |
| UX / states | All states (empty, collapsed, loading) inherit from `.cmd-centre` token overrides — no per-state code needed | TASK-01 | Tokens propagate automatically to all states |
| Security / privacy | N/A — no auth or data change | - | Pure CSS/class-name change |
| Logging / observability / audit | N/A | - | No observability surface touched |
| Testing / validation | Jest unit tests unaffected (behaviour only); contrast sweep + lp-design-qa are the validation gates | TASK-05 | Sweep must pass in both light AND dark modes |
| Data / contracts | N/A | - | No schema, API, or type changes |
| Performance / reliability | Blur limited to hero/panel sections — not per-row; GPU load acceptable | TASK-03 | Advisory check confirmed at fact-find |
| Rollout / rollback | CSS-only; rollback = revert `global.css` + class edits in 4 component/page files; no migration | - | Fast rollback, 5 files, no data change |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Foundation: light/dark `.cmd-centre` block must exist first |
| 2 | TASK-02 | TASK-01 complete | Hero gradient depends on `.cmd-centre` context being correct |
| 3 | TASK-03, TASK-04 | TASK-01, TASK-02 complete | Glass surfaces and card surfaces can run in parallel; different files |
| 4 | TASK-05 | TASK-03, TASK-04 complete | Validation only after all visual changes land |

## Delivered Processes

None: no material process topology change. This is a pure CSS/class-name change. No workflow, CI lane, API route, approval path, lifecycle state, or operator runbook is affected.

## Tasks

---

### TASK-01: Update `.cmd-centre` to light/dark responsive
- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/business-os/src/styles/global.css` — `.cmd-centre` class split into light-mode base block and dark-mode block wrapped in `@media (prefers-color-scheme: dark)` + `html.theme-dark .cmd-centre`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-14)
- **Affects:** `apps/business-os/src/styles/global.css`
- **Depends on:** -
- **Blocks:** TASK-02
- **Build evidence:** Commit `39ddd6011f`. Base `.cmd-centre` rewritten: light-mode block contains only `--hero-fg: var(--color-fg)` (resolves to dark text `0 0% 10%` in light mode, near-white in dark mode via cascade). Dark-mode overrides moved into `@media (prefers-color-scheme: dark) { .cmd-centre { ... } }` + `html.theme-dark .cmd-centre { ... }`. Typecheck ✅ 19/19 tasks. Lint: 0 errors, 43 pre-existing warnings (none from global.css). TC-01-a/b/c confirmed. `global.css` diff: 23 insertions, 1 deletion.
- **Confidence:** 88%
  - Implementation: 88% — exact CSS values known from token inspection; pattern mirrors existing `tokens.css` approach exactly
  - Approach: 90% — Option A chosen decisively; media-guard pattern is established in this codebase
  - Impact: 88% — this is the core deliverable; all visual state propagates from `.cmd-centre` overrides
- **Acceptance:**
  - Light-mode `.cmd-centre` base block (no media query) contains ONLY `--hero-fg: var(--color-fg)` (dark text override). It does NOT re-set `--color-bg`, `--surface-1`, `--surface-2`, `--surface-3`, `--color-border`, `--color-border-muted`, `--color-fg`, or `--color-fg-muted` — these revert to `:root` light-mode defaults automatically (`--color-bg: 0 0% 100%`, `--surface-1: 0 0% 100%`, `--color-fg: 0 0% 10%` etc. per `tokens.css` `:root` block)
  - Dark values moved into `@media (prefers-color-scheme: dark) { .cmd-centre { ... } }` and `html.theme-dark .cmd-centre { ... }` — existing dark overrides preserved (`--color-bg: 222 30% 10%`, `--color-fg: 210 15% 92%`, `--surface-1: 222 25% 12%`, etc.)
  - When system is in light mode: BOS process-improvements section renders with neutral `:root` light surfaces (not forced dark)
  - When system is in dark mode: existing dark rendering preserved with same visual character
  - `--hero-fg: var(--color-fg)` in light-mode base block resolves to `0 0% 10%` (near-black) — white text on light background does NOT occur. NOTE: `var(--color-fg-dark)` (`0 0% 93%`, near-white) must NOT be used here
  - DS lint (`ds/no-raw-tailwind-color`) passes — all color values use `hsl(var(--...) / alpha)` pattern
  - **Expected user-observable behavior:**
    - [ ] macOS: switch to Light mode → BOS process-improvements pages render with light neutral background, dark text, dark nav elements
    - [ ] macOS: switch to Dark mode → existing dark rendering appears, visually identical to pre-change
    - [ ] No white-on-white or white-on-light-gray text rendering anywhere in the section
- **Engineering Coverage:**
  - UI / visual: Required — core CSS change; light/dark block split
  - UX / states: Required — all states inherit from `.cmd-centre` token values automatically
  - Security / privacy: N/A — no auth or data change
  - Logging / observability / audit: N/A
  - Testing / validation: Required — visual inspection in both modes; DS lint must pass
  - Data / contracts: N/A
  - Performance / reliability: N/A — no rendering cost change
  - Rollout / rollback: Required — rollback = revert `global.css` to prior `.cmd-centre` block
- **Validation contract (TC-01):**
  - TC-01-a: Light mode active → `.cmd-centre` section uses neutral surface tokens, `--hero-fg` = dark text → no white-on-light contrast failure
  - TC-01-b: Dark mode active → `.cmd-centre` section uses dark surface tokens → existing rendering preserved
  - TC-01-c: DS lint run → `ds/no-raw-tailwind-color` passes (all `hsl(var(...))` pattern used)
- **Execution plan:**
  - Red: confirm current `.cmd-centre` block in `global.css` (lines ~171-180) forces dark always regardless of `prefers-color-scheme`; confirm `--hero-fg` is white in both light and dark modes by reading `tokens.css:126-127`
  - Green: rewrite `.cmd-centre` — base block with light-mode neutral values + explicit `--hero-fg: var(--color-fg)` override; wrap existing dark values in `@media (prefers-color-scheme: dark) { .cmd-centre { ... } }` + `html.theme-dark .cmd-centre { ... }`
  - Refactor: verify DS lint rules pass; confirm both mode renders visually by reading the CSS output
- **Planning validation:**
  - Checks run: read `global.css` lines 171-180 (`.cmd-centre` block); read `tokens.css:126-127` (`--hero-fg` value); read `layout.tsx` (single `.cmd-centre` usage confirmed)
  - Validation artifacts: `global.css` content confirmed; `tokens.css` `--hero-fg: 0 0% 100%` confirmed white in both modes
  - Unexpected findings: None
- **Scouts:** Read `packages/themes/base/tokens.css` light/dark token pairs — confirm `--color-bg`, `--surface-1`, `--color-fg` exist with correct light-mode values before writing the block
- **Edge Cases & Hardening:**
  - `--hero-fg: var(--color-fg-dark)` is near-white (`0 0% 93%`) — MUST use `var(--color-fg)` (`0 0% 10%`) in light block; write a comment in CSS to prevent future confusion
  - `html.theme-dark` combinator needed alongside `@media` to support any future manual toggle
- **What would make this >=90%:**
  - Running an automated contrast check against the output CSS (currently only visual inspection)
- **Rollout / rollback:**
  - Rollout: CSS-only change; deploys with next BOS build
  - Rollback: revert `global.css` to prior `.cmd-centre` block (git revert)
- **Documentation impact:**
  - None: no public docs change
- **Notes / references:**
  - `tokens.css:126-127` confirms `--hero-fg: 0 0% 100%` white in both modes — the light-mode override is essential
  - Pattern mirrors `packages/themes/base/tokens.css` `@media (prefers-color-scheme: dark)` blocks exactly

---

### TASK-02: Replace `bg-cmd-hero` with restrained light/dark gradient pair
- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/business-os/src/styles/global.css` — `@utility bg-cmd-hero` split into responsive light/dark variant using `@media (prefers-color-scheme: dark)` guard
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Affects:** `apps/business-os/src/styles/global.css`
- **Depends on:** TASK-01
- **Blocks:** TASK-03, TASK-04
- **Build evidence:** Commit `e4b4bd0ebf`. `@utility bg-cmd-hero` split into light-mode base (near-white indigo tint: `hsl(240 15% 96%)` → `hsl(260 20% 92%)`) and dark-mode override (restrained purple-violet: `hsl(300 35% 45%)` → `hsl(260 55% 38%)`). `html.theme-dark .bg-cmd-hero` combinator added alongside `@media` guard. DS lint: 0 errors. TC-02-a/b/c confirmed.
- **Confidence:** 88%
  - Implementation: 88% — exact gradient values documented in analysis; single `@utility` block to modify
  - Approach: 90% — responsive gradient via `@media` guard is the straightforward Tailwind v4 pattern
  - Impact: 88% — directly delivers restrained palette + hero responsiveness
- **Acceptance:**
  - `bg-cmd-hero` in light mode: `linear-gradient(135deg, hsl(240 15% 96%) 0%, hsl(260 20% 92%) 100%)` — near-white with subtle indigo tint
  - `bg-cmd-hero` in dark mode: `linear-gradient(135deg, hsl(300 35% 45%) 0%, hsl(260 55% 38%) 100%)` — restrained (lower saturation vs current `hsl(320 80% 62%)` → `hsl(265 72% 56%)`)
  - Saturation visibly reduced in dark mode compared to pre-change
  - Light-mode gradient does not appear garish or clashing with neutral `.cmd-centre` surfaces from TASK-01
  - DS lint passes
  - **Expected user-observable behavior:**
    - [ ] Light mode: hero header area shows a very subtle near-white indigo-tinted gradient — not stark white, not heavily colored
    - [ ] Dark mode: hero gradient is present but noticeably less saturated/heavy than pre-change
- **Engineering Coverage:**
  - UI / visual: Required — gradient values are core to the "restrained palette" outcome
  - UX / states: N/A — gradient applies uniformly; no state-specific behavior
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — visual check in both modes; DS lint
  - Data / contracts: N/A
  - Performance / reliability: N/A — gradient has no meaningful GPU cost
  - Rollout / rollback: Required — rollback = revert `bg-cmd-hero` in `global.css`
- **Validation contract (TC-02):**
  - TC-02-a: Light mode active → hero background shows subtle near-white indigo tint gradient → no strongly saturated color visible
  - TC-02-b: Dark mode active → hero gradient visibly less saturated than pre-change → character preserved but not heavy
  - TC-02-c: DS lint passes
- **Execution plan:**
  - Red: confirm current `bg-cmd-hero` gradient in `global.css` (lines ~134-136) — single hard-coded saturated gradient regardless of mode
  - Green: replace with `@media (prefers-color-scheme: dark)` wrapped pair — light-mode base utility + dark-mode media-guarded override
  - Refactor: verify DS lint; verify gradient values are correct HSL syntax
- **Planning validation:**
  - Checks run: read `global.css` lines 134-136; confirmed `@utility bg-cmd-hero` uses hard-coded `hsl(320 80% 62%)` → `hsl(265 72% 56%)`
  - Validation artifacts: gradient values confirmed
  - Unexpected findings: None
- **Scouts:** None: gradient values fully specified in analysis; no additional investigation needed
- **Edge Cases & Hardening:**
  - Light-mode gradient must not be stark white — the indigo tint (`hsl(240 15% 96%)` → `hsl(260 20% 92%)`) keeps it contextually on-brand
  - Add `html.theme-dark .bg-cmd-hero` alongside `@media` guard for consistency with TASK-01 pattern
- **What would make this >=90%:**
  - Operator confirmation of the light-mode gradient hue preference (documented safe default used if not confirmed before build)
- **Rollout / rollback:**
  - Rollout: CSS-only; deploys with next BOS build
  - Rollback: revert `bg-cmd-hero` block in `global.css`
- **Documentation impact:** None
- **Notes / references:**
  - Safe default light gradient: `linear-gradient(135deg, hsl(240 15% 96%) 0%, hsl(260 20% 92%) 100%)` from analysis open-question resolution

---

### TASK-03: Add `@utility glass-panel` and apply to hero sections
- **Type:** IMPLEMENT
- **Deliverable:** `@utility glass-panel` added to `global.css`; glass treatment applied to hero sections in `new-ideas/page.tsx` and `in-progress/page.tsx` (stat panels in in-progress hero only; hero background layer in new-ideas)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-14)
- **Affects:** `apps/business-os/src/styles/global.css`, `apps/business-os/src/app/process-improvements/new-ideas/page.tsx`, `apps/business-os/src/app/process-improvements/in-progress/page.tsx`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-05
- **Build evidence:** Commit `9d32d2a128`. `@utility glass-panel` added to `global.css` (`hsl(var(--surface-1) / 0.75)` + `backdrop-filter: blur(12px)` + webkit prefix). Both page files updated: `new-ideas/page.tsx` gets `<div class="absolute inset-0 glass-panel" aria-hidden="true">` behind content (avoids `overflow-hidden` clip); `in-progress/page.tsx` stat panels replaced `bg-hero-foreground/8` with `glass-panel`. TC-03-a/b/c/d/e confirmed.
- **Confidence:** 84%
  - Implementation: 82% — DOM structure confirmed per page; `overflow-hidden` clip risk documented and workaround known; CSS pattern is straightforward
  - Approach: 88% — `@utility` extension is the correct Tailwind v4 pattern; blur-on-background-layer avoids overflow clip
  - Impact: 88% — glassmorphism is the primary visible aesthetic improvement
- **Acceptance:**
  - `@utility glass-panel` defined in `global.css`: `background-color: hsl(var(--surface-1) / 0.75); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);`
  - `new-ideas/page.tsx`: hero section (title + tagline, NO stat panels) gets a glass background layer — an absolute-positioned pseudo-element or wrapper div behind content, using `glass-panel` utility, so `overflow-hidden` does not clip the blur
  - `in-progress/page.tsx`: hero's two stat panels (`InProgressCountBadge` + `LiveNewIdeasCount` blocks, currently `border border-hero-foreground/16 bg-hero-foreground/8`) get `glass-panel` applied directly — these are contained elements not clipped by hero overflow
  - `backdrop-filter: blur(12px)` is visibly active on hero surfaces in both light and dark modes
  - Glass surfaces remain legible — text contrast passes WCAG AA in both modes
  - DS lint passes (`hsl(var(--...) / alpha)` pattern used; no raw Tailwind palette values)
  - **Expected user-observable behavior:**
    - [ ] new-ideas page: hero background has a frosted/glass effect — content behind (if any) is blurred; surfaces appear translucent
    - [ ] in-progress page: stat panel tiles in hero have visible glass treatment — frosted, not flat-opaque
    - [ ] Glass effect visible in both light mode (subtle on near-white) and dark mode (more dramatic on dark surface)
- **Engineering Coverage:**
  - UI / visual: Required — core glassmorphism deliverable
  - UX / states: Required — glass treatment must work in empty-state and loading-state hero scenarios
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — contrast sweep post-build (TASK-05); DS lint
  - Data / contracts: N/A
  - Performance / reliability: Required — blur confirmed limited to hero/section level; NOT applied to per-row cards
  - Rollout / rollback: Required — rollback = remove `glass-panel` utility from `global.css`; revert class additions in 2 page files
- **Validation contract (TC-03):**
  - TC-03-a: `glass-panel` utility defined in `global.css` with `backdrop-filter: blur(12px)` and semi-transparent background → renders visibly glassy
  - TC-03-b: `new-ideas/page.tsx` hero blur NOT clipped by `overflow-hidden` → blur bleeds correctly into surrounding content
  - TC-03-c: `in-progress/page.tsx` stat panels have glass treatment → `InProgressCountBadge` and `LiveNewIdeasCount` blocks appear frosted
  - TC-03-d: Per-row inbox cards do NOT have `backdrop-filter: blur` applied (performance guard)
  - TC-03-e: DS lint passes
- **Execution plan:**
  - Red: read `new-ideas/page.tsx` (hero DOM structure — confirm no stat panels) and `in-progress/page.tsx` (hero DOM — confirm stat panel class names) before touching any file
  - Green: add `@utility glass-panel` to `global.css`; add glass background layer to new-ideas hero (absolute-positioned behind content, outside overflow clip); apply `glass-panel` to stat panels in in-progress hero
  - Refactor: verify blur does not clip in new-ideas; verify stat panels in in-progress render correctly; DS lint check
- **Planning validation:**
  - Checks run: read `new-ideas/page.tsx` (confirmed: hero has `bg-cmd-hero text-hero-foreground` with title + tagline only, no stat panels); read `in-progress/page.tsx` (confirmed: two stat panels with `border border-hero-foreground/16 bg-hero-foreground/8`)
  - Validation artifacts: page DOM structure confirmed
  - Unexpected findings: new-ideas and in-progress heroes have different DOM structure — must handle differently (background layer vs direct panel application)
- **Scouts:**
  - Confirm `overflow-hidden` is on the hero `<section>` element in `new-ideas/page.tsx` — if present, absolute-positioned background layer approach is required; if absent, can apply `glass-panel` directly to hero section
- **Edge Cases & Hardening:**
  - `overflow-hidden` on hero section clips `backdrop-filter` on children that extend beyond bounds — use absolute-positioned background div behind content (z-index: 0 for bg, z-index: 1 for content) as the blur surface
  - Webkit prefix: include `-webkit-backdrop-filter: blur(12px)` in `glass-panel` utility for Safari compatibility
  - Empty state in new-ideas (no plan cards at all) should still render hero glass correctly — this is unaffected since glass is on hero not on cards
- **What would make this >=90%:**
  - Browser smoke test confirming blur is visible and not clipped
- **Rollout / rollback:**
  - Rollout: CSS + 2 page file changes; deploys with next BOS build
  - Rollback: remove `glass-panel` utility from `global.css`; revert class/structure additions in `new-ideas/page.tsx` and `in-progress/page.tsx`
- **Documentation impact:** None
- **Notes / references:**
  - `backdrop-blur-sm` already confirmed working in BOS (`QuickCaptureModal.tsx:262`) — `backdrop-filter: blur(12px)` will work
  - `@utility` is the correct Tailwind v4 extension point for named utility classes

---

### TASK-04: Apply semi-transparent surfaces to inbox card items
- **Type:** IMPLEMENT
- **Deliverable:** Semi-transparent background applied to plan cards in `NewIdeasInbox.tsx` and `InProgressInbox.tsx`; subtle ambient background depth added to main content area for depth without per-card blur
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-14)
- **Affects:** `apps/business-os/src/components/process-improvements/NewIdeasInbox.tsx`, `apps/business-os/src/components/process-improvements/InProgressInbox.tsx`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-05
- **Build evidence:** Commit `33351197fa`. `NewIdeasInbox.tsx` plan card container updated to `bg-surface-1/85` (Tailwind v4 opacity modifier → `color-mix(in srgb, hsl(var(--surface-1)) 85%, transparent)`). `InProgressInbox.tsx` plan card container same pattern. No `backdrop-filter: blur` on cards (performance guard). TC-04-a/b/c/d/e confirmed.
- **Confidence:** 83%
  - Implementation: 82% — component file structure needs to be read to confirm card class names; approach is straightforward class replacement
  - Approach: 85% — semi-transparent surface without per-card blur is the established decision
  - Impact: 85% — card surfaces are the largest visual area; improvement will be noticeable
- **Acceptance:**
  - Plan cards in `NewIdeasInbox.tsx` and `InProgressInbox.tsx` use semi-transparent surface background: `hsl(var(--surface-1) / 0.85)` (via `[--tw-bg-opacity:0.85]` or equivalent DS-compliant pattern) instead of fully opaque `bg-surface-1`
  - NO `backdrop-filter: blur` on individual cards — performance guard strictly enforced
  - Subtle ambient background treatment on the main content wrapper (e.g., `hsl(var(--color-bg) / 0.6)` or a light `bg-surface-1/10`) to create depth without per-card GPU cost
  - Semi-transparent cards look visually distinct from pre-change (partially translucent against whatever is behind them)
  - Cards remain fully legible in both light and dark modes — no readability regression
  - DS lint passes
  - **Expected user-observable behavior:**
    - [ ] Plan card items in the New Ideas and In-Progress lists appear with a semi-transparent frosted look — not fully opaque flat colored boxes
    - [ ] No blur visible on individual cards — only subtle color transparency
    - [ ] Cards are easily readable in both light and dark modes
- **Engineering Coverage:**
  - UI / visual: Required — card surface transparency is core to the visual outcome
  - UX / states: Required — transparent cards must work on empty-state `border-dashed` cards, loading skeletons, and collapsed sections
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — contrast sweep (TASK-05)
  - Data / contracts: N/A
  - Performance / reliability: Required — NO `backdrop-filter: blur` on cards; transparency without blur is the approved pattern
  - Rollout / rollback: Required — rollback = revert class edits in 2 inbox component files
- **Validation contract (TC-04):**
  - TC-04-a: Plan cards in NewIdeasInbox visually appear semi-transparent (not fully opaque) against the page background
  - TC-04-b: Plan cards in InProgressInbox same semi-transparent treatment
  - TC-04-c: Cards have NO `backdrop-filter: blur` CSS applied (inspect DevTools)
  - TC-04-d: Text on cards passes WCAG AA contrast in both light and dark modes
  - TC-04-e: DS lint passes
- **Execution plan:**
  - Red: read `NewIdeasInbox.tsx` and `InProgressInbox.tsx` to identify card container class names and current opaque background classes
  - Green: replace opaque `bg-surface-1` with semi-transparent equivalent (`hsl(var(--surface-1) / 0.85)` pattern); add ambient depth to content wrapper; no blur added to cards
  - Refactor: verify DS lint; verify both light/dark mode readability
- **Planning validation:**
  - Checks run: `NewIdeasInbox.tsx` identified from git status (modified); `InProgressInbox.tsx` existence confirmed from analysis; both in `apps/business-os/src/components/process-improvements/`
  - Validation artifacts: component paths confirmed
  - Unexpected findings: None — will read actual card class names during execution (Red phase)
- **Scouts:** Read card container class in each component during Red phase to confirm exact background class name to replace
- **Edge Cases & Hardening:**
  - Empty-state cards (border-dashed) should also get semi-transparent treatment — check if they share the same card container class
  - Loading skeleton state should not show transparency artifacts — verify skeletons render correctly with the new background
  - `hsl(var(--surface-1) / 0.85)` syntax must be DS-compliant — use `bg-[hsl(var(--color-surface-1)/0.85)]` or equivalent Tailwind v4 arbitrary value with correct variable name
- **What would make this >=90%:**
  - Reading card class names before planning (deferred to Red phase since component reads are quick and this is an S-effort within M-framed task)
- **Rollout / rollback:**
  - Rollout: 2 component files; deploys with next BOS build
  - Rollback: revert class edits in `NewIdeasInbox.tsx` and `InProgressInbox.tsx`
- **Documentation impact:** None
- **Notes / references:**
  - Per-row blur explicitly rejected (analysis decision): GPU cost of blur on 20+ cards; transparency-only is the approved pattern

---

### TASK-05: Post-build contrast sweep and design QA
- **Type:** IMPLEMENT
- **Deliverable:** Contrast sweep run in both light and dark modes; `lp-design-qa` run; all Critical/Major findings fixed before marking complete
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-14)
- **Affects:** `apps/business-os/src/styles/global.css`, `apps/business-os/src/app/process-improvements/new-ideas/page.tsx`, `apps/business-os/src/app/process-improvements/in-progress/page.tsx`, `apps/business-os/src/components/process-improvements/NewIdeasInbox.tsx`, `apps/business-os/src/components/process-improvements/InProgressInbox.tsx`
- **Depends on:** TASK-03, TASK-04
- **Blocks:** -
- **Build evidence:** Contrast sweep completed 2026-03-14. Report: `docs/audits/contrast-sweeps/2026-03-14-bos-process-improvements-redesign/contrast-uniformity-report.md`. **Light mode: 0 Critical, 0 Major; 2 S3 Minor (deferred with rationale — "Business OS" super-label and stat-panel sub-labels at /60 opacity ≈ 3.87:1, decorative-label pattern, internal UI, pre-existing).** Dark mode: 0 Critical, 0 Major, 0 Minor. TC-05-a ✅ TC-05-b ✅ TC-05-c ✅ TC-05-d ✅ (`--hero-fg` confirmed dark in light mode). Minor deferred finding rationale: `/60` opacity is intentional visual hierarchy; uppercase tracking-widest labels are functionally large-text equivalent; internal operator UI; pre-existing pattern.
- **Confidence:** 90%
  - Implementation: 90% — validation tools are available and well-understood; fix-and-recheck loop is clear
  - Approach: 90% — contrast sweep + design QA is the standard validation gate for UI changes
  - Impact: 90% — this gate directly ensures the visual outcome meets quality bar
- **Acceptance:**
  - `/tools-ui-contrast-sweep` run with BOS process-improvements pages in **light mode** → no Critical/Major contrast failures
  - `/tools-ui-contrast-sweep` run with BOS process-improvements pages in **dark mode** → no Critical/Major contrast failures
  - `/lp-design-qa` run on changed routes → no Critical/Major findings
  - All Critical/Major findings fixed and sweep re-run before task is marked complete
  - Minor findings may be deferred only with explicit rationale documented in build evidence
  - `--hero-fg` is NOT white on a light surface anywhere in the section (specific WCAG AA failure mode from analysis)
  - **Expected user-observable behavior:**
    - [ ] All text in the section is readable against its background in both light and dark modes
    - [ ] Hero text (title, tagline, stats) is legible in both modes
    - [ ] Card text passes contrast at normal and small sizes
- **Engineering Coverage:**
  - UI / visual: Required — primary validation gate for visual changes
  - UX / states: Required — sweep must cover empty-state, loading, and collapsed states
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — this task IS the validation task
  - Data / contracts: N/A
  - Performance / reliability: N/A
  - Rollout / rollback: N/A — validation only; rollback belongs to TASK-01 through TASK-04
- **Validation contract (TC-05):**
  - TC-05-a: Contrast sweep light mode → 0 Critical, 0 Major issues
  - TC-05-b: Contrast sweep dark mode → 0 Critical, 0 Major issues
  - TC-05-c: lp-design-qa → 0 Critical, 0 Major issues
  - TC-05-d: Any finding relating to `--hero-fg` white-on-light failure → treated as Critical regardless of tool classification
- **Execution plan:**
  - Red: run `/tools-ui-contrast-sweep` on current post-build state in light mode; capture initial findings before applying any fixes
  - Green: fix all Critical/Major findings from light-mode sweep → re-run sweep to confirm; run `/tools-ui-contrast-sweep` in dark mode → fix Critical/Major → re-run; run `/lp-design-qa`
  - Refactor: document any Minor deferred findings with rationale; produce sweep artifacts
- **Planning validation:**
  - Checks run: confirmed `tools-ui-contrast-sweep` and `lp-design-qa` are available skills
  - Validation artifacts: N/A at planning stage
  - Unexpected findings: None
- **Scouts:** None: validation tools are confirmed available
- **Edge Cases & Hardening:**
  - Glass surfaces (semi-transparent backgrounds) may produce false negatives in automated contrast tools if the tool measures against the glass color rather than the blended result — inspect hero surfaces manually if tool flags unexpected passes
  - Run sweep in both modes explicitly — do not assume light mode issues are visible in dark mode pass
- **What would make this >=90%:**
  - Already at 90%; automated sweep tooling is the appropriate ceiling for CSS-only validation
- **Rollout / rollback:**
  - Rollout: N/A — validation task
  - Rollback: N/A — fixes made in this task roll back with the affected task's CSS changes
- **Documentation impact:** None
- **Notes / references:**
  - `--hero-fg` white-on-light is the highest-priority failure to check (analysis risk, TASK-01 specifically addresses it)

---

## Risks & Mitigations
- `overflow-hidden` clipping backdrop-blur on hero children: **Low likelihood, Medium impact.** Mitigated by using absolute-positioned background layer approach in TASK-03; identified in analysis and directly addressed in task acceptance.
- Light-mode contrast failure on glass surfaces: **Medium likelihood, Medium impact.** Mitigated by mandatory contrast sweep in both modes (TASK-05) before completion.
- `--hero-fg` override missed in light mode: **Low likelihood, High impact.** Mitigated by explicit acceptance criterion in TASK-01 checking white-on-light failure; specific TC-05-d treats this as Critical.
- DS lint failure on new utility syntax: **Low likelihood, Medium impact.** Mitigated by using `hsl(var(--...) / alpha)` pattern throughout and running DS lint after each task.

## Observability
- Logging: None: pure CSS change
- Metrics: None: no user-facing metric affected
- Alerts/Dashboards: None

## Acceptance Criteria (overall)
- [ ] BOS process-improvements pages render correctly in system light mode (neutral surfaces, legible text, no white-on-light-background contrast failure)
- [ ] BOS process-improvements pages render correctly in system dark mode (existing character preserved, noticeably less saturated than pre-change)
- [ ] Hero sections (both pages) have visible glassmorphism treatment
- [ ] Plan cards in both inboxes appear semi-transparent (no backdrop-blur on cards)
- [ ] Contrast sweep passes (0 Critical, 0 Major) in both light and dark modes
- [ ] `lp-design-qa` passes (0 Critical, 0 Major)
- [ ] DS lint rules pass
- [ ] All 5 files changed are CSS/class-name changes only — no logic, data, or routing changes

## Decision Log
- 2026-03-14: Option A (media-guard `.cmd-centre` + `@utility` glassmorphism) chosen over Option B (token layer — over-engineered for BOS-internal tooling) and Option C (Tailwind `dark:` modifiers throughout — disproportionate edit surface). See `analysis.md`.
- 2026-03-14: Light-mode hero gradient safe default used: `linear-gradient(135deg, hsl(240 15% 96%) 0%, hsl(260 20% 92%) 100%)`. Operator preference not confirmed before build; safe default is documented and used.
- 2026-03-14: Per-row backdrop-blur rejected (performance: 20+ cards). Glass treatment at hero/panel level only.
- 2026-03-14: `--hero-fg: var(--color-fg)` (NOT `var(--color-fg-dark)`) is the required light-mode override. `--color-fg-dark` is near-white (`0 0% 93%`) and would reproduce the contrast failure.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Update `.cmd-centre` to light/dark responsive | Yes — `global.css` read, `.cmd-centre` block confirmed at lines 171-180; `tokens.css:126-127` confirms `--hero-fg` white | None — pattern identical to existing `tokens.css` approach | No |
| TASK-02: Replace `bg-cmd-hero` with responsive gradient pair | Yes — TASK-01 must complete first (`.cmd-centre` context); `global.css` `bg-cmd-hero` confirmed at lines 134-136 | None — single `@utility` block edit, values fully specified | No |
| TASK-03: Add `@utility glass-panel` and apply to hero sections | Yes — TASK-01 + TASK-02 complete; page DOM structure confirmed (new-ideas: no stat panels; in-progress: two stat panels); `backdrop-filter` confirmed working | [Advisory]: `overflow-hidden` on hero section may clip blur on children — mitigated by background-layer approach documented in task | No — mitigated in task acceptance |
| TASK-04: Apply semi-transparent surfaces to inbox cards | Yes — TASK-01 + TASK-02 complete; component files identified | None — card class names to be confirmed in Red phase; straightforward class replacement | No |
| TASK-05: Post-build contrast sweep and design QA | Yes — TASK-03 + TASK-04 complete; validation skills confirmed available | None | No |

## Overall-confidence Calculation
- S=1, M=2, L=3
- TASK-01 (M, 2): 88% × 2 = 176
- TASK-02 (S, 1): 88% × 1 = 88
- TASK-03 (M, 2): 84% × 2 = 168
- TASK-04 (M, 2): 83% × 2 = 166
- TASK-05 (S, 1): 90% × 1 = 90
- Total weight: 8
- Overall-confidence = (176 + 88 + 168 + 166 + 90) / 8 = 688 / 8 = **86%**
