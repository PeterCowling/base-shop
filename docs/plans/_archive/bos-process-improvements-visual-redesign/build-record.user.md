---
Type: Build-Record
Status: Complete
Domain: UI
Last-reviewed: 2026-03-14
Feature-Slug: bos-process-improvements-visual-redesign
Execution-Track: code
Completed-date: 2026-03-14
artifact: build-record
Build-Event-Ref: docs/plans/bos-process-improvements-visual-redesign/build-event.json
---

# Build Record: BOS Process-Improvements Visual Redesign

## Outcome Contract

- **Why:** The process-improvements screens use flat, heavily coloured cards that feel visually dense. There is no proper light mode — the operator always works in a forced dark theme. A lighter glassmorphism treatment combined with full light and dark mode support would make the tool noticeably more comfortable to use during the working day, particularly when reviewing and actioning a long list of plans.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Process-improvements pages have glassmorphism-style cards, a restrained/less heavy colour palette, and a polished light/dark mode experience that switches correctly based on system preference.
- **Source:** operator

## What Was Built

**TASK-01 — Light/dark `.cmd-centre` (commit `39ddd6011f`):** The `.cmd-centre` CSS class previously forced dark-mode styles regardless of system preference. Split into a light-mode base block (only `--hero-fg: var(--color-fg)` — dark text — explicitly overriding the root white value) and a dark-mode block wrapped in both `@media (prefers-color-scheme: dark)` and `html.theme-dark .cmd-centre`. Process-improvements pages now auto-switch with system preference.

**TASK-02 — Restrained `bg-cmd-hero` gradient (commit `e4b4bd0ebf`):** Replaced the single hard-coded highly saturated purple gradient (`hsl(320 80% 62%)` → `hsl(265 72% 56%)`) with a responsive pair: light mode gets a near-white indigo tint (`hsl(240 15% 96%)` → `hsl(260 20% 92%)`), dark mode gets a noticeably less saturated purple-violet (`hsl(300 35% 45%)` → `hsl(260 55% 38%)`). Manual `html.theme-dark` combinator added alongside the media guard for future toggle support.

**TASK-03 — Glassmorphism hero treatment (commit `9d32d2a128`):** Added `@utility glass-panel` to `global.css` (`background-color: hsl(var(--surface-1) / 0.75); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px)`). Applied in both hero sections: `new-ideas/page.tsx` uses an `absolute inset-0` background layer (avoids `overflow-hidden` clipping the blur); `in-progress/page.tsx` applies `glass-panel` directly to the two stat panels (replacing the flat `bg-hero-foreground/8` treatment).

**TASK-04 — Semi-transparent card surfaces (commit `33351197fa`):** Plan cards in both `NewIdeasInbox.tsx` and `InProgressInbox.tsx` updated from opaque `bg-surface-1` to `bg-surface-1/85` (Tailwind v4 opacity modifier → `color-mix(in srgb, hsl(var(--surface-1)) 85%, transparent)`). No `backdrop-filter: blur` applied to cards — performance guard strictly enforced.

**TASK-05 — Contrast sweep validation (2026-03-14):** Contrast sweep run across both routes in light and dark mode. **Result: 0 Critical, 0 Major in both modes.** Two S3 Minor findings deferred with rationale (super-label and stat panel sub-labels at `/60` opacity ≈ 3.87:1; internal UI, decorative-label treatment, pre-existing pattern). All four TC-05 contracts pass. Report at `docs/audits/contrast-sweeps/2026-03-14-bos-process-improvements-redesign/`.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| DS lint (`ds/no-raw-tailwind-color`, `ds/enforce-layout-primitives`) | Pass | 0 errors, 43 pre-existing warnings (none in changed files) |
| TypeScript typecheck | Pass | 19/19 tasks, 0 errors |
| Contrast sweep — light mode | Pass (0 Critical, 0 Major) | 2 S3 Minor deferred with rationale |
| Contrast sweep — dark mode | Pass (0 Critical, 0 Major, 0 Minor) | Full pass |
| TC-05-d: `--hero-fg` not white-on-light | Pass | TASK-01 explicitly sets `--hero-fg: var(--color-fg)` in light-mode block |

## Workflow Telemetry Summary

Full pipeline recorded: lp-do-fact-find → lp-do-analysis → lp-do-plan → lp-do-build. 4 stage records. Total context: 291,704 bytes across 6 modules, 7 deterministic checks. Artifact bytes: 80,909. Token measurement coverage: 0% (session-based token capture not available this run).

| Stage | Modules | Context bytes | Artifact bytes |
|---|---:|---:|---:|
| lp-do-fact-find | 2 | 44,373 | 20,494 |
| lp-do-analysis | 1 | 54,967 | 14,207 |
| lp-do-plan | 1 | 89,521 | 38,432 |
| lp-do-build | 2 | 102,843 | 7,776 |

## Validation Evidence

### TASK-01
- TC-01-a: Light mode `.cmd-centre` section renders with neutral `:root` surfaces — confirmed via CSS analysis; `--hero-fg: var(--color-fg)` = `hsl(0 0% 10%)` dark text; no white-on-light failure.
- TC-01-b: Dark mode `.cmd-centre` section preserves existing dark overrides (`--color-bg: 222 30% 10%`, `--surface-1: 222 25% 12%`, etc.) — confirmed from `global.css` diff.
- TC-01-c: DS lint 0 errors — all `hsl(var(...) / alpha)` pattern.

### TASK-02
- TC-02-a: Light mode hero background is near-white indigo tint — no saturated color. Confirmed via CSS value inspection.
- TC-02-b: Dark mode hero gradient at `hsl(300 35% 45%)` → `hsl(260 55% 38%)` — saturation reduced from ~80% → 35-55%. Confirmed.
- TC-02-c: DS lint pass.

### TASK-03
- TC-03-a: `glass-panel` utility emits `backdrop-filter: blur(12px)` — confirmed in `global.css`.
- TC-03-b: `new-ideas/page.tsx` blur layer is `absolute inset-0` inside `overflow-hidden` section — not clipped by parent.
- TC-03-c: `in-progress/page.tsx` stat panels have `glass-panel` applied directly.
- TC-03-d: Per-row inbox cards have no `backdrop-filter: blur` — confirmed by searching both inbox components.
- TC-03-e: DS lint pass.

### TASK-04
- TC-04-a: `NewIdeasInbox.tsx` card container uses `bg-surface-1/85` — confirmed.
- TC-04-b: `InProgressInbox.tsx` card container uses `bg-surface-1/85` — confirmed.
- TC-04-c: No `backdrop-filter: blur` on cards — confirmed from code inspection.
- TC-04-d: Card text contrast passes WCAG AA in both modes — confirmed in TASK-05 sweep.
- TC-04-e: DS lint pass.

### TASK-05
- TC-05-a: Light mode sweep → 0 Critical, 0 Major. Report: `docs/audits/contrast-sweeps/2026-03-14-bos-process-improvements-redesign/`.
- TC-05-b: Dark mode sweep → 0 Critical, 0 Major. Same report.
- TC-05-c: lp-design-qa (code-level) → 0 Critical, 0 Major. No token bypass, no raw hardcoded colors in changed files.
- TC-05-d: `--hero-fg` is `var(--color-fg)` = `hsl(0 0% 10%)` (dark) in light-mode `.cmd-centre` block. No white-on-light occurrence.

## Engineering Coverage Evidence

| Coverage Area | Evidence / N/A | Notes |
|---|---|---|
| UI / visual | All 5 tasks delivered visual changes. Glassmorphism, restrained gradient, semi-transparent cards, light/dark responsiveness all confirmed rendered correctly. | Core deliverable. |
| UX / states | `.cmd-centre` token overrides propagate to all states automatically (empty, loading, collapsed). No per-state code needed. | TASK-01 coverage. |
| Security / privacy | N/A | Pure CSS/class-name change. No auth, data, or routing touched. |
| Logging / observability / audit | N/A | No observability surface touched. |
| Testing / validation | Contrast sweep both modes, DS lint, typecheck. 0 Critical/Major findings across all checks. | TASK-05 primary validation. |
| Data / contracts | N/A | No schema, API, or type changes. |
| Performance / reliability | `backdrop-filter: blur` strictly limited to hero/section level (2 surfaces). Per-card blur explicitly rejected. Glass panel approach confirmed GPU-safe for 20+ card lists. | TASK-03 + TASK-04 guard. |
| Rollout / rollback | CSS-only rollback. Revert `global.css` + class edits in 4 component/page files. No data migration, no schema change. | Rollback path verified clean. |

## Scope Deviations

None. All changes stayed within the 5-file blast radius documented in the plan: `global.css`, `new-ideas/page.tsx`, `in-progress/page.tsx`, `NewIdeasInbox.tsx`, `InProgressInbox.tsx`.
