---
Type: Analysis
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: process-improvements-command-centre-redesign
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: tools-design-system
Related-Fact-Find: docs/plans/process-improvements-command-centre-redesign/fact-find.md
Related-Plan: docs/plans/process-improvements-command-centre-redesign/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Process Improvements — Command Centre Redesign Analysis

## Decision Frame

### Summary
The `/process-improvements/new-ideas` and `/process-improvements/in-progress` pages need two things: accurate data (5 confirmed bugs) and a visual identity shift from flat admin report to living command centre. The analysis resolves three strategic choices: (1) how to apply the dark theme without breaking the rest of BOS; (2) how to fix stale counts without touching the lib layer; (3) whether to do a full spatial layout restructure or just re-skin the existing flat list. All three choices interact — the sequencing recommendation is that the three choices form three coherent build phases with clean diffs.

### Goals
- Fix 5 confirmed data-accuracy bugs (B1–B5): stale counts, hardcoded zero, React children count, SSR-locked badge, internal copy labels.
- Resolve visual artefact V1 (hero-foreground tokens outside hero context) as a natural consequence of dark theme application.
- Apply scoped dark command-centre theme — navy/indigo dark palette, gradient hero area, glow utilities — without touching rest of BOS.
- Restructure page layout: hero summary strip with live stats; urgency-tiered swimlanes (overdue → operator actions → queue → deferred collapsed → done timeline); sub-nav with live counts and pulse.
- All existing interactive behaviour (do/defer/decline/mark-done/snooze/bulk) preserved exactly.

### Non-goals
- Full BOS dark-mode switch.
- Lib layer changes (`projection.ts`, `active-plans.ts`, `decision-ledger.ts`).
- Keyboard shortcuts.
- Mobile-first redesign.

### Constraints & Assumptions
- Constraints: Tailwind v4 `@theme inline` pattern; DS component API for interactive controls; no hardcoded hex values in className strings; no `--no-verify` commits; BOS is a live production Workers deployment.
- Assumptions: `isActiveNow` (5-min file-mtime window) is an honest enough signal for "recently active" labelling. DS atoms resolve via `hsl(var(--color-*))` and will correctly inherit `.cmd-centre` scope overrides.

---

## Inherited Outcome Contract

- **Why:** Process-improvements pages are the operator's daily work surface. Currently passive report feel — stale counts, internal jargon, flat lists — undermines daily use. Pages need accurate live state and a command-centre look to be genuinely useful.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Redesigned `/process-improvements/*` pages with: (a) zero data-accuracy regressions on the 5 identified bugs, (b) scoped dark command-centre visual theme, (c) spatial dashboard layout with urgency-tiered sections, and (d) all internal-system copy replaced with operator-facing plain language.
- **Source:** operator

---

## Fact-Find Reference
- Related brief: `docs/plans/process-improvements-command-centre-redesign/fact-find.md`
- Key findings used:
  - B1: `initialInProgressCount` prop is static — auto-refresh never updates it (`NewIdeasInbox.tsx:1573`)
  - B2: `ProcessImprovementsSummary` hardcodes `inProgressCount={0}` (`NewIdeasInbox.tsx:1596`)
  - B3: `InboxSection` count uses React children length, not item count (`NewIdeasInbox.tsx:1433`)
  - B4: `newIdeasCount` on `/in-progress` SSR-locked; API already returns `items` + `inProgressDispatchIds` + `activePlans` (all at `route.ts:22–27`) but `InProgressInbox.tsx:450` only destructures `activePlans` from the refresh response — `items` and `inProgressDispatchIds` are discarded. `newIdeasCount` must be derived from `items.filter(statusGroup === "active").filter(not in inProgressDispatchIds).length`, not from `activePlans`.
  - B5: `priorityReason` shows internal labels ("Queue backlog P2", "Active decision_waiting") in operator UI (`NewIdeasInbox.tsx:758`)
  - V1: Hero stat badges use `hero-foreground` tokens outside the hero section — near-invisible on light surface; self-resolving once dark theme applied
  - Reference design: navy/indigo dark (`~hsl(222 30% 10%)`), gradient hero (pink→purple), glow dots, bold large-number stats, compact rows
  - `packages/themes/dark/tokens.css` uses near-black (`0 0% 4%`) — NOT the target palette; new CSS vars must be net-new
  - `ProcessImprovementsSubNav` has no props; must poll `/api/process-improvements/items` for live counts
  - Critique confirmed: `overallConfidence "—"` already guarded at line 282; zero-task plans already filtered at source — not bugs

---

## Evaluation Criteria

| Criterion | Why it matters | Weight |
|---|---|---|
| Data accuracy | Wrong numbers break operator trust immediately | Critical |
| Visual impact | Primary goal — command-centre feel, not incremental improvement | High |
| Behaviour preservation | All triage actions must continue to work; regression here is blocking | Critical |
| Build risk / reviewability | Three-phase scope; each phase must be CI-green independently | High |
| Token / DS compliance | Mandatory constraint — no hardcoded values, DS atoms used for controls | Required |
| Rollback safety | Production BOS deployment; each commit must be individually revertable | High |

---

## Options Considered

### Strategic Option Set

The core strategic question is: **how much to change at once, and in what order?**

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| **A: Three-phase sequential** — data fixes → theme/CSS → layout restructure | Each phase has a clean, independently reviewable diff. Data bugs fixed first establishes accuracy baseline before visual work. | Lowest blast radius per commit; easiest CI debugging; each phase can ship independently | Slightly more elapsed time than a single pass | Theme phase touches CSS and markup simultaneously — still complex but contained | **Yes — recommended** |
| **B: Single combined pass** — data + theme + layout in one PR | Fastest wallclock elapsed time | Everything working together is visually cleanest | Any CI failure blocks the entire redesign; mixed diffs are hard to review; regressions harder to bisect | **Reject** |
| **C: Theme-only (no layout restructure)** | Lower scope; faster | Dark colours applied | Does not deliver the "command centre" feel — flat list with dark colours is still a boring dark list. Misses the goal. | Partial goal achievement only | **Reject** |
| **D: Layout restructure without dark theme** | Spatial layout only | Better information architecture | Light-surface spatial layout is just a reorganised admin report. The visual energy comes from the dark palette. The two are complementary; splitting them weakens both. | Partial goal achievement only | **Reject** |

**Options A is the only approach that achieves all goals while keeping each phase independently safe.**

### Theme Approach Sub-Options (within Option A, Phase 2)

| Sub-option | Description | Verdict |
|---|---|---|
| **A1: `.cmd-centre` class on `<main>` (scoped CSS override)** | CSS custom property overrides scoped to a wrapper class in `global.css`. DS atoms pick up overrides automatically via `hsl(var(--color-*))`. Possible brief flash of light background on initial load before CSS resolves. | **Recommended** — matches existing `bg-hero-contrast` utility pattern; zero runtime cost; reversible by removing one class |
| **A2: `data-theme="cmd"` on `<html>` applied server-side in layout** | Prevents flash entirely; requires layout-level server component change and a dedicated CSS selector `[data-theme="cmd"]`. More complex — affects the full HTML document scope. | Over-engineered for one internal page section; flash risk is minimal in practice for an internal operator tool |
| **A3: Inline styles per element** | Highest specificity; no class scope needed | Verbose, unreviewable, non-composable. Reject. |

**Sub-option A1 chosen.** Flash risk is acceptable for an internal operator tool.

### Data Fix Approach Sub-Options (within Option A, Phase 1)

| Sub-option | Description | Verdict |
|---|---|---|
| **D1: Remove `initialInProgressCount` prop; derive all counts client-side** | All count badges (B1, B2, B3, B4) become client-derived from the data already in-flight (auto-refresh returns `activePlans` and `items`). No API changes. No SSR prop threading. | **Recommended** — simplest, self-consistent, no new network requests |
| **D2: Extend API to return pre-computed counts** | API computes and returns counts server-side; clients use them | Adds server surface; counts still stale until next poll; D1 is strictly simpler |
| **D3: Refresh-on-focus / SWR pattern** | Aggressive re-fetch on window focus | More complex; brings in SWR or manual focus listener; no advantage over D1 |

**D1 chosen.**

---

## Engineering Coverage Comparison

| Coverage Area | Option A (three-phase) | Option B (single pass) | Chosen implication |
|---|---|---|---|
| UI / visual | Phase-by-phase: P1 minimal change; P2 new CSS utilities + class scoping; P3 full component restructure | All changes land together — harder to isolate visual regressions | Phase 2+3 own all visual work; DS token compliance verified per phase. New `@utility` blocks confined to `global.css` |
| UX / states | P1 fixes data bugs without touching markup; P2 re-skins all states; P3 adds new section states (collapsed deferred, swimlane empty states) | Risk that dark-theme states are incomplete in a combined pass | Each state (loading, empty, error, pending, bulk-select, snooze-picker) explicitly re-skinned in P2; new swimlane empty states added in P3 |
| Security / privacy | N/A in all options — internal operator tool, no PII, no auth changes | Same | N/A |
| Logging / observability / audit | N/A — no changes to decision ledger or API | Same | N/A |
| Testing / validation | P1: regression assertions for B1–B5; P2: snapshot updates; P3: snapshot updates | Single combined snapshot update masks which changes caused failures | Per-phase test updates — P1 adds regression assertions, P2+P3 update snapshots. Existing TC-07/08/09 must pass throughout |
| Data / contracts | P1: `initialInProgressCount` prop removed from `NewIdeasInboxProps`; `ProcessImprovementsSummary` prop signature updated; `InboxSection` gains explicit `count` prop | Contract changes mixed with visual changes — harder to catch type regressions | P1 owns all interface changes. `pnpm typecheck` must pass after P1 before P2 starts |
| Performance / reliability | Scoped CSS vars: zero-cost. Sub-nav adds one `useEffect` + `fetch` on mount (30s poll). No new heavy dependencies | Same net cost | The sub-nav poll is the only new network request; it reuses the same endpoint already polled by both inbox components |
| Rollout / rollback | Three independently revertable commits. Each phase is CI-green before the next starts. | Single revert but a much larger blast radius | P1 → P2 → P3 commit sequence. Production Workers deployment — each commit must pass full CI before dev deployment |

---

## Chosen Approach

**Recommendation: Option A (three-phase sequential) with sub-options A1 (scoped `.cmd-centre` class) and D1 (client-side count derivation).**

### Why this wins
1. **Data correctness first** — fixing the 5 bugs in Phase 1 as isolated, tested changes establishes a clean baseline before any visual work. If Phase 2/3 introduce a regression, the data fixes are already safely on `dev`.
2. **Theme architecture is sound** — scoped CSS custom property override is the established BOS pattern (mirroring `bg-hero-contrast`). It requires zero new dependencies, is trivially revertable, and the DS token system makes it automatic for all DS atoms.
3. **Spatial layout is non-negotiable for the goal** — a dark version of the flat list is still a flat list. The urgency-tiered swimlane structure (overdue → operator actions → queue → deferred → done) is what enables 3-second situational awareness. This must be Phase 3 scope, not deferred.
4. **Sub-nav live counts** — `ProcessImprovementsSubNav` is currently mounted from `layout.tsx` with no props or shared store. The chosen approach is (a): sub-nav independently polls `/api/process-improvements/items` on mount (30s interval). This is self-contained, requires no context provider spanning the layout, and the incremental cost of a third concurrent poll against the same endpoint is negligible. Alternative (b) — shared React context from an existing inbox component — avoids the extra poll but requires prop threading through the layout which currently has no props; the added complexity is not justified for an internal operator tool with no performance constraints.

### What it depends on
- `pnpm typecheck` passing after Phase 1 prop changes before Phase 2 begins.
- DS atoms resolving `hsl(var(--color-*))` correctly inside `.cmd-centre` scope — verify with browser devtools on first render in Phase 2.
- The `/api/process-improvements/items` endpoint continuing to return `{ items, recentActions, activePlans, inProgressDispatchIds }` (confirmed at `route.ts:22–27`) — sub-nav, `InProgressInbox` B4 fix, and the new-ideas hero stats all depend on this payload shape. `InProgressInbox` must expand its type assertion from `{ activePlans }` to the full payload to enable the B4 fix.

### Rejected Approaches
- **Option B (single pass)** — combines all changes into one diff; CI failures block the entire redesign; regressions impossible to bisect. Rejected for reviewability and rollback safety.
- **Option C (theme-only)** — dark flat list is still a boring list. Misses the command-centre goal. Rejected.
- **Option D (layout without theme)** — spatial layout on a light surface is still a report. The visual energy comes from the dark palette. The two are architecturally coupled. Rejected.
- **Sub-option A2 (HTML-level `data-theme`)** — over-engineered for the use case; flash risk is negligible for an internal operator tool on a fast local network. Rejected.
- **Sub-option D2 (API count extension)** — adds server surface with no advantage over client derivation when the data is already in the refresh response. Rejected.

### Open Questions (Operator Input Required)
None. All technical questions resolved. The one operator preference question (body-class flash on initial load) has a viable default (scoped wrapper is acceptable for internal tool).

---

## End-State Operating Model

| Area | Current state | Trigger | Delivered end state | What remains unchanged | Seams / risks for planning |
|---|---|---|---|---|---|
| **Sub-navigation** | Two static text links, no counts, no liveness | Page mount | Client component independently polls `/api/process-improvements/items` on mount (30s interval); shows live `In Progress (N)` and `Inbox (N)` counts; pulse dot appears when any plan `isActiveNow`; fails silently (shows static labels) if API unavailable | Route structure unchanged | Sub-nav must be converted to a `"use client"` data-fetching component — currently a pure render with no props or context |
| **New Ideas page — header** | Plain title + description; no stats in hero | Page load (SSR + hydration) | Hero strip with `bg-cmd-hero` gradient; large stat badges for Inbox count, In Progress count, Overdue count — all derived client-side from auto-refresh data (not SSR props) | SSR projection load unchanged; `NewIdeasInbox` receives same `initialItems`, `initialRecentActions`, `initialInProgressDispatchIds` props | `initialInProgressCount` prop removed from `NewIdeasInboxProps`; planners must update all call sites |
| **New Ideas page — list** | Flat list: active → deferred → recently done (all visible, same weight) | Data load | Urgency swimlanes: (1) Overdue strip — danger callout; (2) Operator Actions section; (3) Ideas Queue section; (4) Deferred — collapsed by default, expand to reveal; (5) Recently Done — collapsed timeline strip | All card expand/collapse, triage actions, bulk-select, defer-picker, snooze-picker preserved exactly | `InboxSection` count prop change; new section components for each swimlane; `priorityReason` display replaced with `formatPriorityLabel()` helper |
| **In Progress page — header** | Static SSR counts; `inProgressCount` partially fixed (2026-03-13); `newIdeasCount` still SSR-locked | Page load + hydration | Hero strip with `bg-cmd-hero` gradient; `InProgressCountBadge` (already added) for in-progress count; `newIdeasCount` derived client-side by subscribing to `items` + `inProgressDispatchIds` from the auto-refresh payload (API already returns both at `route.ts:22–27`; `InProgressInbox` must destructure them in its poll handler) | `loadActivePlans()` SSR data flow unchanged | `InProgressInbox` auto-refresh must expand its type assertion to include `items` + `inProgressDispatchIds`; no remaining SSR-locked counts after Phase 1 |
| **In Progress page — list** | Flat list by blocked/ratio sort; no urgency separation | Data load | Three sections: (1) Running Now — plans where `isActiveNow` (animated ring, full-width); (2) Blocked — plans where `tasksBlocked > 0`; (3) In Progress — remaining. All snooze behaviour preserved | Snooze logic, auto-refresh, `InProgressCountBadge` unchanged | Plan card must be re-skinned for dark surface while preserving all existing badge/ring logic |
| **Visual theme** | Light surface throughout; `bg-hero-contrast` only in hero sections | `.cmd-centre` class applied to `<main>` in layout | Deep navy background (`hsl(222 30% 10%)`); card surfaces `hsl(222 22% 14%)` elevated; `bg-cmd-hero` gradient hero strip; glow utilities for stat cards; all DS atoms resolve correctly via `hsl(var(--color-*))` token inheritance | Rest of BOS unaffected; `ProcessImprovementsSubNav` and children all inherit the scope | DS atom token resolution must be verified in Phase 2 before Phase 3 layout work begins |
| **Triage decisions** | Expand card → action buttons → POST → optimistic UI update | Card expansion | Identical behaviour; cards re-skinned to dark glassmorphism style | All API endpoints, ledger writes, optimistic update logic | Cards must visually distinguish pending/error states in dark context |

---

## Planning Handoff

### Planning focus
- **Phase 1 (data fixes):** Remove `initialInProgressCount` prop from `NewIdeasInboxProps` and all call sites; fix B2 (`ProcessImprovementsSummary` hardcoded zero); fix B3 (`InboxSection` explicit `count` prop); fix B4 (`newIdeasCount` in `InProgressInbox` derived client-side from the auto-refresh response — the component must destructure `items` and `inProgressDispatchIds` alongside `activePlans` from the API payload, then compute `items.filter(active).filter(not in inProgressDispatchIds).length`); fix B5 (`formatPriorityLabel()` helper replacing raw `priorityReason`). Add regression test per fix. `pnpm typecheck` must pass.
- **Phase 2 (theme/CSS):** Add `.cmd-centre` class overrides and new utilities (`bg-cmd-hero`, `cmd-glow-*`) to `global.css`. Apply `.cmd-centre` wrapper in `layout.tsx`. Upgrade hero sections on both pages. Re-skin all card variants (dark surface, border, active/pending/error states). Update snapshot tests. Verify DS atom token resolution.
- **Phase 3 (layout):** New Ideas page — urgency swimlanes, hero strip with live stats, collapsed deferred/done sections. In Progress page — Running Now / Blocked / In Progress sections, hero strip with live counts. Sub-nav — convert to data-fetching client component with polling. All card interactions preserved.

### Validation implications
- Phase 1: `pnpm typecheck` required after prop removals; regression assertions for B1–B5 added to test files; CI must be green before Phase 2 begins.
- Phase 2: Browser devtools verification of DS token resolution inside `.cmd-centre`; snapshot updates committed; contrast-AA check on dark surface text.
- Phase 3: All triage actions smoke-tested at `localhost:3022`; snapshot updates committed; sub-nav poll verified (network tab shows single `/api/process-improvements/items` request on mount).

### Sequencing constraints
1. Phase 1 → Phase 2 → Phase 3. Each phase CI-green before next starts.
2. `initialInProgressCount` prop removal (Phase 1) must precede any Phase 2 visual work to avoid cherry-pick complexity.
3. Sub-nav data-fetching conversion (Phase 3) is independent of swimlane layout and can be parallelised within Phase 3 if plan decomposes it into separate tasks.

### Risks to carry into planning
- DS atom resolution inside `.cmd-centre` scope: verify early in Phase 2. If tokens don't inherit correctly, a `@layer` ordering issue in Tailwind v4 may need investigation (low probability based on existing `bg-hero-contrast` pattern working correctly).
- `NewIdeasInbox.tsx` is 1,660 lines: Phase 3 swimlane restructure touches the render output substantially. Keep behaviour-changing and layout-only edits in separate commits within Phase 3 if feasible.
- Sub-nav polling adds a `useEffect` + `fetch` — must fail silently (show static labels, not error state) if the API is unavailable.

---

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| DS atom token resolution fails inside `.cmd-centre` due to CSS layer ordering | Low | Medium — DS components render with wrong colours | Needs browser verification; cannot be confirmed from static analysis | Phase 2 must verify visually before Phase 3 begins; if blocked, investigate `@layer` order in `global.css` |
| `NewIdeasInbox.tsx` (1,660 lines) accumulates a complex diff in Phase 3 | Low | Low — functional risk minimal since behaviour unchanged; review risk medium | Structural complexity is a fact-find-level note, not resolvable in analysis | Plan should decompose Phase 3 into at least 2 tasks: (a) swimlane structure; (b) hero strip + sub-nav. Smaller diffs. |
| CI deploy failure on production BOS Workers between phases | Low | Low — internal tool, no user impact | Deployment process is outside analysis scope | Three-phase commit strategy means any single failure reverts one phase only; keep `dev` branch green throughout |

---

## Planning Readiness
- Status: Go
- Rationale: All 3 gates pass. Evidence gate: fact-find Ready-for-analysis, coverage matrix complete, outcome contract present. Option gate: 4 options compared with explicit elimination rationale. Planning handoff gate: recommendation decisive, rejected options documented, sequencing constraints specified, end-state operating model complete area by area. No operator-only questions remaining.
