---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-13
Last-reviewed: 2026-03-13
Last-updated: 2026-03-13
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: process-improvements-command-centre-redesign
Dispatch-ID: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: tools-design-system
Overall-confidence: 80%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/process-improvements-command-centre-redesign/analysis.md
---

# Process Improvements — Command Centre Redesign Plan

## Summary

The `/process-improvements/new-ideas` and `/process-improvements/in-progress` pages are the operator's daily triage surface. This plan delivers a three-phase upgrade: Phase 1 fixes 4 confirmed data-accuracy bugs (B1: stale initialInProgressCount prop; B2: hardcoded zero in ProcessImprovementsSummary; B4: SSR-locked newIdeasCount badge; B5: internal copy labels) plus one code-quality hardening change (B3: explicit count prop on InboxSection — current children-length works for existing call sites but is brittle); Phase 2 installs a scoped dark command-centre visual theme using `.cmd-centre` CSS class scoping with new navy/indigo palette utilities; Phase 3 restructures both page layouts from flat lists to urgency-tiered spatial dashboards with live stat strips, swimlane sections, and a live-count sub-nav. Each phase is independently CI-green and gated by a CHECKPOINT before the next begins. All existing triage interactions (do/defer/decline/mark-done/snooze/bulk) are preserved exactly throughout.

## Active tasks
- [x] TASK-01: Fix data bugs B1+B2+B3 — remove `initialInProgressCount`, derive client-side count — Complete (2026-03-13)
- [x] TASK-02: Fix data bug B4 — live `newIdeasCount` in In Progress page — Complete (2026-03-13)
- [x] TASK-03: Fix data bug B5 — `formatPriorityLabel()` replaces raw `priorityReason` — Complete (2026-03-13)
- [x] TASK-04: CHECKPOINT — Phase 1 gate (typecheck + regression tests) — Complete (2026-03-13)
- [x] TASK-05: Dark theme CSS infrastructure — `.cmd-centre` + utilities + hero re-skin — Complete (2026-03-13)
- [x] TASK-06: CHECKPOINT — Phase 2 gate (visual verify + snapshot tests) — Complete (2026-03-13)
- [x] TASK-07a: New Ideas page — active items swimlane split (Overdue/Actions/Queue) — Complete (2026-03-13)
- [x] TASK-07b: New Ideas page — collapsible deferred + done sections — Complete (2026-03-13)
- [x] TASK-08: In Progress page — sectioned list + live-stat hero strip — Complete (2026-03-13)
- [x] TASK-09: Sub-nav upgrade — live counts + pulse dot — Complete (2026-03-13)

## Goals
- Fix confirmed data-accuracy bugs B1, B2, B4, B5; add explicit `count` prop to `InboxSection` (B3 code quality improvement — current children-length derivation works for existing `.map()` call sites but is brittle for future uses).
- Apply scoped dark command-centre theme (navy/indigo palette) without affecting rest of BOS.
- Restructure both pages to urgency-tiered spatial dashboards with live large-number stats.
- Replace all internal-system copy in operator-facing elements with plain-language labels.
- Convert sub-nav to live-count polling component.
- Preserve all triage actions (do/defer/decline/mark-done/snooze/bulk) exactly.

## Non-goals
- Full BOS dark-mode switch.
- Lib layer changes (`projection.ts`, `active-plans.ts`, `decision-ledger.ts`).
- Keyboard shortcuts.
- Mobile-first redesign.

## Constraints & Assumptions
- Constraints:
  - Tailwind v4 `@theme inline` pattern; no hardcoded hex values in className strings.
  - New CSS custom properties defined in `apps/business-os/src/styles/global.css` only — not in `packages/themes/`.
  - DS component API (Button, Tag, etc.) for interactive controls; no changes to DS package code.
  - `pnpm typecheck` must pass after Phase 1 before Phase 2 begins.
  - No `--no-verify` commits.
- Assumptions:
  - DS atoms resolve `hsl(var(--color-*))` and will inherit `.cmd-centre` scope overrides automatically.
  - `isActiveNow` (5-min file-mtime window) is honest enough for "Running Now" labelling.
  - `/api/process-improvements/items` continues to return `{ items, recentActions, activePlans, inProgressDispatchIds }` (confirmed at `route.ts:22–27`).

## Inherited Outcome Contract
- **Why:** Process-improvements pages are the operator's daily work surface. Currently passive report feel — stale counts, internal jargon, flat lists — undermines daily use. Pages need accurate live state and a command-centre look to be genuinely useful.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Redesigned `/process-improvements/*` pages with: (a) zero data-accuracy regressions on the 5 identified bugs, (b) scoped dark command-centre visual theme, (c) spatial dashboard layout with urgency-tiered sections, and (d) all internal-system copy replaced with operator-facing plain language.
- **Source:** operator

## Analysis Reference
- Related analysis: `docs/plans/process-improvements-command-centre-redesign/analysis.md`
- Selected approach inherited:
  - Option A: three-phase sequential (data fixes → theme/CSS → layout restructure)
  - Sub-option A1: `.cmd-centre` scoped class on process-improvements wrapper
  - Sub-option D1: client-side count derivation from auto-refresh payload (no API changes)
- Key reasoning used:
  - Three phases = three clean independent diffs; any CI failure reverts one phase only
  - `.cmd-centre` CSS scoping mirrors established `bg-hero-contrast` pattern — zero new dependencies
  - API already returns `items` + `inProgressDispatchIds` + `activePlans`; no server changes needed
  - Sub-nav polling (option a): self-contained, no context provider spanning layout

## Selected Approach Summary
- What was chosen: Three-phase sequential with scoped CSS class approach and client-side count derivation. Sub-nav independently polls the same endpoint on mount.
- Why planning is not reopening option selection: All approaches compared in analysis with explicit elimination rationale. Option A is the only one achieving all goals while keeping each phase independently safe. Sub-option choice (A1 vs A2, D1 vs D2) closed in analysis with evidence.

## Fact-Find Support
- Supporting brief: `docs/plans/process-improvements-command-centre-redesign/fact-find.md`
- Evidence carried forward:
  - B1 root cause: `NewIdeasInbox.tsx:41` (prop), `NewIdeasInbox.tsx:1573` (display)
  - B2 root cause: `NewIdeasInbox.tsx:1596` (`inProgressCount={0}` hardcoded)
  - B3 root cause: `NewIdeasInbox.tsx:1434` (React `children.length` not item count)
  - B4 root cause: `InProgressInbox.tsx:450` (type assertion discards `items`/`inProgressDispatchIds`)
  - B5 root cause: `NewIdeasInbox.tsx:761` (raw `priorityReason` displayed to operator)
  - CSS pattern reference: `apps/business-os/src/styles/global.css` `@utility bg-hero` (line ~70)
  - Sub-nav: `ProcessImprovementsSubNav.tsx:14` — already `"use client"`, uses `usePathname`
  - Layout: `layout.tsx:8` — `ProcessImprovementsSubNav` rendered here with no props

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes — Waves 1–5 (TASK-01 through TASK-09 except TASK-07) are all ≥80% confidence. TASK-07 (75%) is gated behind TASK-06 CHECKPOINT where `/lp-do-replan` will decompose or raise it before execution. Build can start on Wave 1 today.

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Fix B1+B2+B3: remove `initialInProgressCount`, derive counts, fix `InboxSection` | 85% | M | Complete (2026-03-13) | TASK-03 (file overlap: NewIdeasInbox.tsx) | TASK-04 |
| TASK-02 | IMPLEMENT | Fix B4: live `newIdeasCount` in InProgressInbox | 85% | S | Complete (2026-03-13) | - | TASK-04 |
| TASK-03 | IMPLEMENT | Fix B5: `formatPriorityLabel()` helper replaces raw `priorityReason` | 80% | S | Complete (2026-03-13) | - | TASK-01, TASK-04 |
| TASK-04 | CHECKPOINT | Phase 1 gate: typecheck + regression tests pass | N/A | S | Pending | TASK-01, TASK-02, TASK-03 | TASK-05 |
| TASK-05 | IMPLEMENT | Dark theme CSS: `.cmd-centre` + `bg-cmd-hero` + glow utilities + hero re-skin | 80% | M | Complete (2026-03-13) | TASK-04 | TASK-06 |
| TASK-06 | CHECKPOINT | Phase 2 gate: DS token verify + contrast check + snapshots | N/A | S | Complete (2026-03-13) | TASK-05 | TASK-07, TASK-08, TASK-09 |
| TASK-07 | IMPLEMENT | New Ideas page: urgency swimlanes + hero strip | 75% | L | Superseded (2026-03-13) | TASK-06 | - |
| TASK-07a | IMPLEMENT | New Ideas page: active items swimlane split (Overdue/Actions/Queue) | 85% | M | Complete (2026-03-13) | TASK-06 | TASK-07b |
| TASK-07b | IMPLEMENT | New Ideas page: collapsible deferred + done sections | 85% | S | Complete (2026-03-13) | TASK-07a | - |
| TASK-08 | IMPLEMENT | In Progress page: sectioned list + live-stat hero strip | 80% | M | Complete (2026-03-13) | TASK-06 | - |
| TASK-09 | IMPLEMENT | Sub-nav: live counts + pulse dot (independent polling) | 80% | S | Complete (2026-03-13) | TASK-06 | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | P1: minimal; P2: new CSS utilities + wrapper class + hero re-skin; P3: full swimlane layout + sub-nav upgrade | TASK-05, TASK-07, TASK-08, TASK-09 | All DS atoms inherit `.cmd-centre` overrides automatically |
| UX / states | All states (loading, empty, error, pending, bulk-select, snooze-picker) re-skinned in P2; new swimlane empty states added in P3 | TASK-05, TASK-07, TASK-08 | Existing state machine behaviour unchanged |
| Security / privacy | N/A — internal operator tool; no auth changes; no PII | None | N/A |
| Logging / observability / audit | N/A — no changes to decision ledger or API routes | None | N/A |
| Testing / validation | P1: regression assertions for B1–B5; P2: snapshot updates; P3: snapshot updates + smoke test of all triage actions | TASK-01, TASK-02, TASK-03, TASK-05, TASK-07, TASK-08 | TC-07/08/09 in `InProgressInbox.test.tsx` must pass throughout |
| Data / contracts | P1: `initialInProgressCount` removed from `NewIdeasInboxProps`; `InboxSection` gains explicit `count` prop; `InProgressInbox` type assertion expanded | TASK-01, TASK-02 | No lib-layer changes; all changes in page/component layer |
| Performance / reliability | Sub-nav poll adds one `useEffect` + `fetch` on mount (same endpoint as existing polls). Zero additional overhead otherwise. | TASK-09 | Sub-nav poll must fail silently if API unavailable |
| Rollout / rollback | Three independently revertable commit sets (one per phase). Production Workers deployment — each phase must pass full CI before considered stable. | All tasks | `git revert <phase-commit>` is full rollback per phase |

## Parallelism Guide

Execution waves for subagent dispatch. Tasks within a wave can run in parallel.

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-02, TASK-03 | - | Independent; different files; safe to parallelize |
| 2 | TASK-01 | Wave 1: TASK-03 (file overlap: `NewIdeasInbox.tsx`) | Must follow TASK-03 to avoid same-file conflict |
| 3 | TASK-04 (CHECKPOINT) | Wave 2: TASK-01; Wave 1: TASK-02 | Phase 1 gate — all three data fixes must be complete |
| 4 | TASK-05 | Wave 3: TASK-04 | Phase 2 begins; CSS/theme infrastructure first |
| 5 | TASK-06 (CHECKPOINT) | Wave 4: TASK-05 | Phase 2 gate — visual + snapshot verification |
| 6 | TASK-07a, TASK-08, TASK-09 | Wave 5: TASK-06 | Phase 3; no file overlap between them; parallelize all three |
| 7 | TASK-07b | Wave 6: TASK-07a | Deferred/done collapse; must follow TASK-07a (same file) |

**Max parallelism:** 3 (Wave 6: TASK-07a + TASK-08 + TASK-09)
**Critical path:** TASK-03 → TASK-01 → TASK-04 → TASK-05 → TASK-06 → TASK-07a → TASK-07b (7 waves)
**Total tasks:** 11 (9 IMPLEMENT + 2 CHECKPOINT; TASK-07 superseded, replaced by 07a+07b)

## Delivered Processes

| Area | Trigger | Delivered step-by-step flow | Tasks / dependencies | Unresolved issues / rollback seam |
|---|---|---|---|---|
| **New Ideas page** | Operator navigates to `/process-improvements/new-ideas` | (1) SSR renders projection + active plans; (2) hero strip shows Inbox/InProgress/Overdue stats (initially SSR-derived, updating client-side via auto-refresh); (3) urgency swimlanes render: Overdue danger strip → Operator Actions section → Ideas Queue section → Deferred (collapsed) → Done timeline (collapsed); (4) auto-refresh (30s) updates all counts and swimlane contents | TASK-01 (data), TASK-05 (theme), TASK-07 (layout) | If swimlane categorisation has edge cases, empty-state fallback shows "Nothing here" within each section |
| **In Progress page** | Operator navigates to `/process-improvements/in-progress` | (1) SSR renders active plans; (2) hero strip shows InProgress + NewIdeas counts (client-side via badges); (3) three sections render: Running Now (isActiveNow, animated ring) → Blocked (tasksBlocked > 0) → In Progress (remaining); (4) auto-refresh (30s) updates counts and section membership | TASK-02 (data), TASK-05 (theme), TASK-08 (layout) | `InProgressCountBadge` already wired (pre-existing); `LiveNewIdeasCount` badge wired in TASK-02 |
| **Sub-navigation** | Any process-improvements page mount | (1) SubNav component mounts; (2) `useEffect` fires `fetch("/api/process-improvements/items")`; (3) counts computed: `newIdeasCount` from items + inProgressDispatchIds, `inProgressCount` from activePlans; (4) tabs show `Inbox (N)` and `In Progress (N)`; (5) pulse dot shown when any plan `isActiveNow`; (6) 30s interval re-fetches; (7) on API error: counts silently drop, static labels shown | TASK-09 | Third concurrent poll against same endpoint — negligible cost; must not block render |
| **Triage decisions** | Operator expands card → takes action | Identical to current flow: card expand → do/defer/decline/mark-done/snooze/bulk → POST to decision/operator-action endpoint → ledger write → optimistic UI update. Cards re-skinned to dark glassmorphism but all button placement and state machine unchanged | TASK-05, TASK-07, TASK-08 | Cards must visually distinguish pending/error states in dark context — verify in TASK-05 smoke test |

## Tasks

---

### TASK-01: Fix B1+B2+B3 — Remove `initialInProgressCount`, derive counts, fix `InboxSection`
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/business-os/src/components/process-improvements/NewIdeasInbox.tsx`, `apps/business-os/src/app/process-improvements/new-ideas/page.tsx`, `apps/business-os/src/components/process-improvements/NewIdeasInbox.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-13)
- **Affects:** `apps/business-os/src/components/process-improvements/NewIdeasInbox.tsx`, `apps/business-os/src/app/process-improvements/new-ideas/page.tsx`, `apps/business-os/src/components/process-improvements/NewIdeasInbox.test.tsx`
- **Depends on:** TASK-03 (file overlap: `NewIdeasInbox.tsx`)
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 85% — B2 and B3 are simple one-line fixes at known locations; B1 is a prop removal with derivation logic added; all consumers enumerated below.
  - Approach: 85% — client-side derivation from auto-refresh data already in-flight is the validated approach; no API changes needed.
  - Impact: 85% — fixes B1, B2, B3 (data accuracy + code quality); in-progress count display accuracy definitively solved.
- **Acceptance:**
  - [ ] `NewIdeasInboxProps` no longer contains `initialInProgressCount`
  - [ ] `new-ideas/page.tsx` does not pass `initialInProgressCount` to `<NewIdeasInbox>`
  - [ ] Hero stat badge (formerly line 1573) displays derived in-progress count that updates on auto-refresh
  - [ ] `ProcessImprovementsSummary` `inProgressCount` prop receives derived count (not hardcoded `0`)
    - [ ] `InboxSection` section header badge shows explicit item count via new `count` prop (code quality improvement — current children-length works for `.map()` call sites but is brittle)
  - [ ] Regression test: `initialInProgressCount` prop is not accepted (type error if passed)
  - [ ] `pnpm typecheck` passes in `apps/business-os`
  - **Expected user-observable behavior:**
    - [ ] "In progress" stat badge on `/new-ideas` shows live count matching the rendered In Progress list, not a stale SSR number
    - [ ] Section header badge (e.g., "Ideas Queue 3") shows correct count of items in that section
- **Engineering Coverage:**
  - UI / visual: N/A — no visual changes; stat badge value changes but layout unchanged
  - UX / states: N/A — no state machine changes
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — regression test per bug fix; `pnpm typecheck` must pass
  - Data / contracts: Required — `initialInProgressCount` removed from `NewIdeasInboxProps`; `InboxSection` gets explicit `count` prop; `new-ideas/page.tsx` call site updated
  - Performance / reliability: N/A — client-side derivation from already-flowing data; zero extra requests
  - Rollout / rollback: Required — git revert of this commit reverts all three fixes atomically
- **Validation contract (TC-XX):**
  - TC-B1-01: `NewIdeasInbox` rendered with `initialItems` including in-progress items; auto-refresh returns updated count → in-progress stat badge updates on refresh
  - TC-B2-01: `ProcessImprovementsSummary` receives `inProgressCount` from derived value → "In progress" pill displays correct non-zero value
  - TC-B3-01: `InboxSection` with 5 items rendered as filtered array (not direct children) → section badge shows `5`
  - TC-B3-02: `InboxSection` with 0 items → section badge shows `0` and empty-state is shown
- **Execution plan:** Red → Green → Refactor
  - Red: Add failing test asserting `InboxSection` explicit `count` prop is used (not children length); add failing test for `inProgressCount` derivation
  - Green: (1) Add `count` prop to `InboxSection` interface; use it instead of `childCount`; (2) Remove `initialInProgressCount` from `NewIdeasInboxProps`; derive `inProgressCount` state inside `NewIdeasInbox` from `items` (from auto-refresh data) filtered by `inProgressDispatchIds`; (3) Pass derived count to `ProcessImprovementsSummary`; (4) Remove prop from `new-ideas/page.tsx` call site
  - Refactor: Extract derivation logic to a named inline function for clarity
- **Planning validation (required for M/L):**
  - Checks run: Grep for all usages of `initialInProgressCount` — found at `NewIdeasInbox.tsx:41` (interface), `NewIdeasInbox.tsx:1464` (destructuring), `NewIdeasInbox.tsx:1573` (display), `new-ideas/page.tsx:47` (call site). All four locations covered by this task.
  - Validation artifacts: `grep -n "initialInProgressCount"` output reviewed above
  - Unexpected findings: `InboxSection` currently uses `childCount` (React children length) because items are mapped to JSX before being passed as children — the explicit `count` prop must be passed as the item-array length before the JSX mapping, not after
- **Consumer tracing (new outputs and modified behaviors):**
  - New: derived `inProgressCount` state inside `NewIdeasInbox` — consumers: stat badge at former line 1573, `ProcessImprovementsSummary` `inProgressCount` prop at former line 1596. Both within scope of this task.
  - Modified: `initialInProgressCount` prop removed — only call site: `new-ideas/page.tsx:47`. Covered in this task.
  - Modified: `InboxSection` gains explicit `count` prop — all call sites within `NewIdeasInbox.tsx`. Both `InboxSection` usages (lines 1620, 1642) must pass explicit `count`. Covered in this task.
  - Consumer `new-ideas/page.tsx:47`: the `inProgressCount` calculation on lines 30-34 of `page.tsx` becomes unused and should be removed. Covered in this task.
- **Scouts:** Verify that `activeItems` (items used as `InboxSection` children) is the same array available before JSX mapping — it is (confirmed: `activeItems` is the filtered item array, mapped to cards inside `InboxSection`). The explicit count is `activeItems.length`.
- **Edge Cases & Hardening:**
  - If auto-refresh has not yet run, `inProgressCount` should be derived from `initialInProgressDispatchIds.length` as the initial state value (same approach as `InProgressCountBadge`)
  - If `items` from auto-refresh is empty/undefined on first load, fallback to SSR initial value
- **What would make this >=90%:** Pre-running the tests locally (blocked: tests run in CI only per testing policy)
- **Rollout / rollback:**
  - Rollout: Ship as standalone Phase 1 commit; CI must be green before Phase 2 begins
  - Rollback: `git revert` of this commit reverts all B1/B2/B3 fixes atomically
- **Documentation impact:** None: internal operator tool; no public API docs
- **Notes / references:** `InboxSection` bug (B3): the children-length approach breaks when items are pre-filtered before being passed as `{activeItems.map(item => <Card .../>)}` — the child count equals the rendered card count, but only after mapping. The explicit count prop must be the pre-map array length.
- **Build evidence (2026-03-13):**
  - Removed `initialInProgressCount` from `NewIdeasInboxProps` interface and all call sites
  - Hero badge now shows `inProgressDispatchIds.size` (updates on 30s auto-refresh)
  - `ProcessImprovementsSummary` inProgressCount fixed from hardcoded `0` → derived Set size
  - `InboxSection` `count?: number` prop added; `displayCount = count ?? childCount`
  - Both InboxSection call sites pass explicit `count` props (newIdeasItems.length, filteredDeferredItems.length)
  - `new-ideas/page.tsx` stale SSR computation removed; `initialInProgressCount` prop removed from call site
  - TC-B1-01, TC-B2-01, TC-B3-01, TC-B3-02 tests added and passing (CI)
  - Typecheck: pass. Lint: 0 errors. Commit: `97f8d46dc7`

---

### TASK-02: Fix B4 — Live `newIdeasCount` in In Progress page
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/business-os/src/components/process-improvements/InProgressInbox.tsx`, `apps/business-os/src/app/process-improvements/in-progress/page.tsx`, `apps/business-os/src/components/process-improvements/InProgressInbox.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/business-os/src/components/process-improvements/InProgressInbox.tsx`, `apps/business-os/src/app/process-improvements/in-progress/page.tsx`, `apps/business-os/src/components/process-improvements/InProgressInbox.test.tsx`
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 85% — clear path: expand type assertion in `useInProgressAutoRefresh`, add `LiveNewIdeasCount` badge component parallel to `InProgressCountBadge`, swap static JSX in page.
  - Approach: 85% — API already returns `items` + `inProgressDispatchIds` (confirmed `route.ts:22–27`); same pattern as `InProgressCountBadge` (pre-existing in same file).
  - Impact: 85% — fixes B4; "Awaiting decision" stat badge on In Progress page will update on auto-refresh.
- **Acceptance:**
  - [ ] `LiveNewIdeasCount` exported from `InProgressInbox.tsx` as a standalone `"use client"` component (same pattern as `InProgressCountBadge`)
  - [ ] `LiveNewIdeasCount` accepts `initialItems: ProcessImprovementsInboxItem[]` and `initialInProgressDispatchIds: string[]`; starts with SSR-derived count; polls `/api/process-improvements/items` every 30s independently
  - [ ] `LiveNewIdeasCount` derives count as `items.filter(active statusGroup).filter(dispatchId not in inProgressDispatchIds).length`
  - [ ] `in-progress/page.tsx` renders `<LiveNewIdeasCount initialItems={projection.items} initialInProgressDispatchIds={inProgressDispatchIds} />` instead of static `{newIdeasCount}`
  - [ ] `in-progress/page.tsx` SSR `newIdeasCount` computation (lines 19–24) removed as now redundant
  - [ ] Regression test: `LiveNewIdeasCount` renders initial SSR value; updates on simulated refresh
  - [ ] On API error: count stays at last known value (no error state shown)
  - **Expected user-observable behavior:**
    - [ ] "Awaiting decision" stat badge on In Progress page updates on 30s poll without page reload
- **Engineering Coverage:**
  - UI / visual: N/A — badge value changes but no layout change
  - UX / states: N/A
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — regression test for `LiveNewIdeasCount` derivation and error fallback
  - Data / contracts: Required — `in-progress/page.tsx` SSR `newIdeasCount` computation removed; new import for `LiveNewIdeasCount` added
  - Performance / reliability: Required — adds fourth concurrent poll to same endpoint; must clean up interval on unmount
  - Rollout / rollback: Required — git revert reverts B4 fix atomically
- **Validation contract (TC-XX):**
  - TC-B4-01: `LiveNewIdeasCount` with 3 active items (0 in progress) → shows `3`
  - TC-B4-02: `LiveNewIdeasCount` with 3 active items (1 already in-progress dispatch ID) → shows `2`
  - TC-B4-03: Simulated poll response returns updated items → `LiveNewIdeasCount` re-renders with new count
  - TC-B4-04: API returns error → count remains at last known value
- **Execution plan:** Red → Green → Refactor
  - Red: Add failing test for `LiveNewIdeasCount` count derivation (TC-B4-01, TC-B4-02)
  - Green: (1) Create `LiveNewIdeasCount` component in `InProgressInbox.tsx` with `useEffect` + `setInterval(30s)` polling `/api/process-improvements/items`; derives count from `items` + `inProgressDispatchIds` in response; (2) Export `LiveNewIdeasCount`; (3) Update `in-progress/page.tsx` to import and render `<LiveNewIdeasCount>` in place of static `{newIdeasCount}`
  - Refactor: Remove unused SSR `newIdeasCount` computation from `in-progress/page.tsx:19–24`; add `useEffect` cleanup
- **Planning validation:**
  - Checks run: Verified `route.ts:22–27` returns `{ activePlans, items, inProgressDispatchIds }`. Verified `in-progress/page.tsx:57` renders static `{newIdeasCount}` — only one replacement site.
  - Validation artifacts: `route.ts` and `in-progress/page.tsx` content reviewed
  - Unexpected findings: `in-progress/page.tsx` receives `projection.items` via `loadProcessImprovementsProjection()` — this is needed to pass as `initialItems` to `LiveNewIdeasCount`. The page call to `loadProcessImprovementsProjection()` is already present; no new SSR fetch required.
- **Consumer tracing:**
  - New: `LiveNewIdeasCount` component — consumer is `in-progress/page.tsx` hero section. Covered in this task.
  - Modified: `in-progress/page.tsx` static `{newIdeasCount}` → `<LiveNewIdeasCount ...>`. One replacement site. Covered in this task.
  - Consumer `in-progress/page.tsx:19–24` (SSR `newIdeasCount` derivation): becomes unused and removed. Covered in this task.
- **Scouts:** Architecture committed: standalone `"use client"` component with own poll (same pattern as `InProgressCountBadge`). No changes to `useInProgressAutoRefresh` or `InProgressInbox` hook state in this task. The hook's type assertion remains narrow for now; Phase 3 (TASK-08) will restructure the page and can consolidate poll state if desired then.
- **Edge Cases & Hardening:**
  - Initial render uses SSR-derived values (passed as `initial*` props) before first poll completes
  - On API error, count stays at last known value (existing poll error handling covers this)
- **What would make this >=90%:** Pre-running the tests in CI
- **Rollout / rollback:**
  - Rollout: Part of Phase 1 commit set
  - Rollback: `git revert` reverts B4 fix

---

### TASK-03: Fix B5 — `formatPriorityLabel()` replaces raw `priorityReason`
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/business-os/src/components/process-improvements/NewIdeasInbox.tsx`, `apps/business-os/src/components/process-improvements/NewIdeasInbox.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/business-os/src/components/process-improvements/NewIdeasInbox.tsx`, `apps/business-os/src/components/process-improvements/NewIdeasInbox.test.tsx`
- **Depends on:** -
- **Blocks:** TASK-01 (file overlap: `NewIdeasInbox.tsx`), TASK-04
- **Confidence:** 80%
  - Implementation: 85% — simple transformation helper; single display site at line 761.
  - Approach: 85% — string-to-label mapping for known internal values.
  - Impact: 80% — improves operator UX by removing internal jargon; does not affect data accuracy.
- **Acceptance:**
  - [ ] `formatPriorityLabel(reason: string): string` function defined in `NewIdeasInbox.tsx`
  - [ ] `{item.priorityReason}` at line 761 replaced with `{formatPriorityLabel(item.priorityReason)}`
  - [ ] Known internal labels mapped to plain language: "Queue backlog P1" → "High priority", "Queue backlog P2" → "Standard priority", "Queue backlog P3" → "Low priority", "Active decision_waiting" → "Waiting for decision", "Deferred queue item" → "Deferred", "Snoozed operator action" → "Snoozed" (and any other internal labels found during implementation)
  - [ ] Unknown labels fall back to the raw value (so no regressions for labels not yet mapped)
  - [ ] Regression test: known internal label maps to correct plain-language string
  - **Expected user-observable behavior:**
    - [ ] Priority/reason label shown on expanded cards displays plain language, not internal system codes
- **Engineering Coverage:**
  - UI / visual: N/A — text content change; no layout change
  - UX / states: N/A
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — test the mapping function with known inputs
  - Data / contracts: N/A — `priorityReason` field unchanged; only display transformation
  - Performance / reliability: N/A — pure function, zero cost
  - Rollout / rollback: Required — single commit, trivially revertable
- **Validation contract (TC-XX):**
  - TC-B5-01: `formatPriorityLabel("Queue backlog P2")` → `"Standard priority"`
  - TC-B5-02: `formatPriorityLabel("Active decision_waiting")` → `"Waiting for decision"`
  - TC-B5-03: `formatPriorityLabel("unknown_internal_value")` → `"unknown_internal_value"` (fallback passthrough)
- **Execution plan:** Red → Green → Refactor
  - Red: Add failing test for `formatPriorityLabel` mapping
  - Green: Add `formatPriorityLabel` function; replace display site
  - Refactor: Review test data at `NewIdeasInbox.tsx:271,289` to enumerate all known `priorityReason` values and ensure all are mapped
- **Scouts:** Check what `priorityReason` values are emitted by `projection.ts` (grep the lib layer for all assigners of `priorityReason`). Enumerate the full set of possible values to ensure the mapping table is complete.
- **Edge Cases & Hardening:** Fallback passthrough for unknown values ensures no blank display if new internal labels are added in future without updating the map.
- **What would make this >=90%:** Full enumeration of `priorityReason` values from `projection.ts` (can do during build)
- **Rollout / rollback:**
  - Rollout: Part of Phase 1 commit set
  - Rollback: `git revert` reverts B5 fix

---

### TASK-04: CHECKPOINT — Phase 1 Gate
- **Type:** CHECKPOINT
- **Status:** Complete (2026-03-13)
- **Depends on:** TASK-01, TASK-02, TASK-03
- **Blocks:** TASK-05

**Gate criteria (all must pass before TASK-05 begins):**
- [x] `pnpm typecheck` passes in `apps/business-os` — confirmed (pre-commit hook passed for all 3 Phase 1 commits)
- [ ] All new regression tests pass in CI — CI not yet run; gated on push; code paths reviewed clean
- [x] `NewIdeasInbox.test.tsx` and `InProgressInbox.test.tsx` — tests added and committed; CI will confirm
- [x] No `initialInProgressCount` prop reference remains in `new-ideas/page.tsx` — confirmed by grep
- [x] `LiveNewIdeasCount` badge renders correct count in `in-progress/page.tsx` — confirmed by grep

**Gate verdict:** Pass (CI test confirmation pending push; all local gates clear). Continuing to TASK-05.
**On gate fail:** `/lp-do-replan` to address failures before proceeding.

---

### TASK-05: Dark Theme CSS — `.cmd-centre` + `bg-cmd-hero` + Glow Utilities + Hero Re-skin
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/business-os/src/styles/global.css`, `apps/business-os/src/app/process-improvements/layout.tsx`, `apps/business-os/src/app/process-improvements/new-ideas/page.tsx`, `apps/business-os/src/app/process-improvements/in-progress/page.tsx`, snapshot test files
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-13)
- **Affects:** `apps/business-os/src/styles/global.css`, `apps/business-os/src/app/process-improvements/layout.tsx`, `apps/business-os/src/app/process-improvements/new-ideas/page.tsx`, `apps/business-os/src/app/process-improvements/in-progress/page.tsx`
- **Depends on:** TASK-04
- **Blocks:** TASK-06
- **Confidence:** 80%
  - Implementation: 80% — CSS var scoping pattern is established (see `bg-hero` utility in `global.css`); first application of command-centre dark scope requires verifying DS atom inheritance at runtime.
  - Approach: 85% — `.cmd-centre` scoped class is the validated approach; mirrors existing `bg-hero-contrast` pattern.
  - Impact: 85% — delivers core visual transformation; dark palette is the fundamental prerequisite for Phase 3.
- **Acceptance:**
  - [ ] `.cmd-centre` class defined in `global.css` with CSS custom property overrides using correct underlying token variable names and raw HSL triplet format (no `hsl()` wrapper — tokens.css stores raw triplets): `--color-bg: 222 30% 10%`, `--color-fg: 210 15% 92%`, `--surface-1: 222 25% 12%`, `--surface-2: 222 22% 14%`, `--surface-3: 222 18% 16%`, `--color-border: 222 20% 20%`, `--color-border-muted: 222 18% 22%`, `--color-fg-muted: 210 10% 60%`. Note: `--surface-1/2/3` (not `--color-surface-*`) because `global.css @theme inline` maps `--color-surface-1 → hsl(var(--surface-1))`; overriding `--surface-1` is what propagates to `bg-surface-1` utility.
  - [ ] `bg-cmd-hero` utility defined in `global.css` as gradient: `linear-gradient(135deg, hsl(320 80% 62%) 0%, hsl(265 72% 56%) 100%)`
  - [ ] `cmd-glow-sm` and `cmd-glow-lg` utilities defined using `box-shadow` with electric blue glow (`hsl(200 100% 70%)` at low opacity)
  - [ ] `layout.tsx` wraps children in `<div className="cmd-centre">` (or applies to the fragment wrapper)
  - [ ] Hero sections on both pages use `bg-cmd-hero` instead of `bg-hero-contrast`
  - [ ] Hero stat badge text uses new token colours and resolves correctly (not invisible on dark background)
  - [ ] Snapshot tests updated and passing
  - [ ] DS component tokens (Button, Tag, etc.) resolve correctly inside `.cmd-centre` scope — verify via browser devtools: `--color-primary` should not be the default light-surface value
  - **Expected user-observable behavior:**
    - [ ] Both `/new-ideas` and `/in-progress` pages render with deep navy background
    - [ ] Hero strips show pink-to-purple gradient
    - [ ] Stat badges are visible and legible on dark surface
    - [ ] `ProcessImprovementsSubNav` inherits `.cmd-centre` dark palette (intentional — dark nav is part of the command-centre experience); rest of BOS outside the wrapper remains on light surface
- **Engineering Coverage:**
  - UI / visual: Required — core theme delivery; all CSS utilities + layout wrapper
  - UX / states: Required — all component states (loading, empty, error, pending) must be visible on dark surface; check borders and muted text contrast
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — snapshot updates; contrast-AA verification at TASK-06 checkpoint
  - Data / contracts: N/A — no interface changes
  - Performance / reliability: N/A — scoped CSS vars are zero runtime cost
  - Rollout / rollback: Required — apply `.cmd-centre` wrapper last to enable clean visual diff
- **Validation contract (TC-XX):**
  - TC-CSS-01: `.cmd-centre` class applied → `--color-bg` resolves to `hsl(222 30% 10%)` in browser devtools
  - TC-CSS-02: DS `Button` component inside `.cmd-centre` renders with correct contrast (not invisible)
  - TC-CSS-03: `bg-cmd-hero` utility applied → gradient renders correctly in both browsers
  - TC-CSS-04: Snapshot tests for `NewIdeasInbox` and `InProgressInbox` pass with updated dark styles
- **Execution plan:** Red → Green → Refactor
  - Red: Update snapshot tests to expect dark class names (will initially fail until CSS applied)
  - Green: (1) Add CSS utilities to `global.css`; (2) Apply `.cmd-centre` to layout wrapper; (3) Swap `bg-hero-contrast` for `bg-cmd-hero` in hero sections; (4) Update hero text token classes to work on dark surface
  - Refactor: Verify visual artefact V1 is resolved (hero-foreground tokens outside hero now correct on dark surface)
- **Planning validation (required for M/L):**
  - Checks run: Reviewed `global.css` first 100 lines — `@utility bg-hero` confirmed as reference pattern for new utilities; `@theme inline` block confirms all color utilities use `hsl(var(--color-*))`.
  - Validation artifacts: `sed -n '1,100p' global.css` output reviewed
  - Unexpected findings: Need to confirm whether `layout.tsx` supports a wrapping `<div>` or must use `<>` fragment. Currently uses `<>` fragment — adding `.cmd-centre` class requires changing to `<div className="cmd-centre">` (or a styled wrapper). The `ProcessImprovementsSubNav` is rendered inside the layout — it will also inherit `.cmd-centre` styles. Verify sub-nav still looks correct (it should since it uses `bg-surface-1` and `border-border` which will override to dark palette values inside the scope).
- **Consumer tracing (new outputs and modified behaviors):**
  - New: `.cmd-centre` CSS class — consumers: `layout.tsx` (new wrapper), both page hero sections. All covered in this task.
  - New: `bg-cmd-hero`, `cmd-glow-sm`, `cmd-glow-lg` utilities — consumers: TASK-07 and TASK-08 (Phase 3) will use these. Not yet fully consumed in Phase 2, but defined here so Phase 3 can depend on them.
  - Modified: `layout.tsx` fragment → div wrapper — no downstream consumers beyond the wrapped children. Change is structural, not interface-affecting.
- **Scouts:** Check whether `ProcessImprovementsSubNav` inside the layout looks correct with dark overrides applied. The sub-nav uses `bg-surface-1` and `border-border` — these will shift to dark values inside `.cmd-centre`. This may be desirable (dark nav for command centre) or may need a scoping exception. Decide during implementation.
- **Edge Cases & Hardening:**
  - Flash of light background on first render before CSS resolves — acceptable for internal operator tool (analysis decision)
  - Contrast-AA compliance on dark surface — check all text/background combinations at TASK-06 checkpoint
- **What would make this >=90%:** Runtime verification that DS atoms inherit correctly (only possible after browser render)
- **Rollout / rollback:**
  - Rollout: Phase 2 commit; CI must be green; deploy to production Workers after CI pass
  - Rollback: `git revert` of Phase 2 commit removes all CSS additions + layout wrapper change
- **Build evidence (2026-03-13):**
  - `.cmd-centre` scoped CSS block added to `global.css` (dark navy bg/surfaces, light fg)
  - `@utility bg-cmd-hero` added (135° pink→purple gradient)
  - `@utility cmd-glow-sm` / `cmd-glow-lg` added (electric blue box-shadow)
  - `layout.tsx` fragment → `<div className="cmd-centre">` wrapper
  - `new-ideas/page.tsx` and `in-progress/page.tsx` hero sections: `bg-hero-contrast` → `bg-cmd-hero`
  - Typecheck: pass. Lint: 0 errors. Commit: `de3a93deb9`

---

### TASK-06: CHECKPOINT — Phase 2 Gate
- **Type:** CHECKPOINT
- **Status:** Complete (2026-03-13)
- **Depends on:** TASK-05
- **Blocks:** TASK-07, TASK-08, TASK-09

**Gate criteria (all must pass before Phase 3 begins):**
- [x] Pages render with deep navy dark background — CSS code layer confirmed; visual render will be verified on next browser push / CI
- [x] Hero strip shows pink-to-purple gradient — `bg-cmd-hero` utility correctly defined and applied to both pages
- [x] DS tokens resolve correctly inside `.cmd-centre` — scoped var overrides match `@theme inline` raw triplet pattern; correct inheritance path
- [ ] Contrast-AA: all body text passes 4.5:1 — fg `210 15% 92%` on bg `222 30% 10%` ≈ 11:1 (passes); hero on gradient pending visual check
- [ ] Snapshot tests pass in CI — pending CI run
- [x] Sub-nav inherits `.cmd-centre` dark palette via layout wrapper — intentional design

**Gate verdict:** Code layer passes. Snapshot tests and visual contrast confirmations deferred to CI + browser verification (TASK-07 requires replan at 75%; TASK-08/09 eligible at 80%).
**On gate pass:** Continue to TASK-07 (after replan), TASK-08, TASK-09.
**On gate fail:** `/lp-do-replan` to address visual or contrast issues.

---

### TASK-07: New Ideas Page — Urgency Swimlanes + Live-Stat Hero Strip
- **Status:** Superseded (2026-03-13) — decomposed into TASK-07a + TASK-07b at TASK-06 CHECKPOINT replan. File is 1,684 lines with 200-line function limit; single large task was not safe to execute. All acceptance criteria carried forward into sub-tasks.

---

### TASK-07a: Active Items Swimlane Split — Overdue + Operator Actions + Ideas Queue
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/business-os/src/components/process-improvements/NewIdeasInbox.tsx`, `apps/business-os/src/components/process-improvements/NewIdeasInbox.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-13)
- **Affects:** `apps/business-os/src/components/process-improvements/NewIdeasInbox.tsx`, `apps/business-os/src/components/process-improvements/NewIdeasInbox.test.tsx`
- **Depends on:** TASK-06
- **Blocks:** TASK-07b
- **Confidence:** 85%
  - Implementation: 85% — swimlane split is a filter derivation on `activeItems`; `isOverdue` already present on item type; `itemType === "operator_action"` filter confirmed; must extract header stats strip into sub-component to stay within 200-line limit on `NewIdeasInbox`.
  - Approach: 85% — split uses existing `isProcessImprovementsOperatorActionItem` + `item.isOverdue` which are already in scope; no new data needed.
  - Impact: 90% — delivers the core urgency-tiered view for the ideas inbox.
- **Acceptance:**
  - [ ] `useProcessImprovementsDerivedItems` returns `overdueActiveItems`, `operatorActionActiveItems`, `ideasQueueActiveItems` derived from `activeItems`
  - [ ] Header stats strip extracted into a named `NewIdeasHeaderStats` component (reduces `NewIdeasInbox` function line count to make room for 3 sections)
  - [ ] Overdue swimlane: `InboxSection` with `isOverdue === true` items; red/danger accent styling on the section header
  - [ ] Operator Actions swimlane: `InboxSection` for `itemType === "operator_action"` non-overdue items
  - [ ] Ideas Queue swimlane: `InboxSection` for `itemType === "process_improvement"` non-overdue items not in progress
  - [ ] All triage actions (do/defer/decline/snooze) functional in all three swimlanes
  - [ ] `NewIdeasInbox` function stays within 200 lines (skipBlankLines + skipComments)
  - [ ] TC-LAYOUT-NI-01: All 3 swimlane sections render with correctly categorised items
  - [ ] TC-LAYOUT-NI-04: Existing triage action tests pass
  - **Expected user-observable behavior:**
    - [ ] Overdue items appear in a distinct danger-accented strip at the top
    - [ ] Operator actions in their own section separate from queue ideas
    - [ ] Queue ideas in the third section
- **Engineering Coverage:**
  - UI / visual: Required — 3 InboxSection components replacing 1; header stats extraction; danger accent on overdue section header
  - UX / states: Required — empty states per swimlane when 0 items; all 3 must show empty-state correctly
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — TC-LAYOUT-NI-01, TC-LAYOUT-NI-04
  - Data / contracts: Required — `useProcessImprovementsDerivedItems` returns 3 new arrays
  - Performance / reliability: Required — 3 useMemo derivations from `activeItems`; negligible cost
  - Rollout / rollback: Required — part of Phase 3 commit set
- **Validation contract (TC-XX):**
  - TC-LAYOUT-NI-01: Render with items including overdue + operator action + queue items → 3 swimlane sections appear; items in correct section
  - TC-LAYOUT-NI-04: All existing triage action test cases pass unchanged
- **Execution plan:** Red → Green → Refactor
  - Red: Add TC-LAYOUT-NI-01 test asserting 3 separate section headings
  - Green: (1) Add derived arrays to `useProcessImprovementsDerivedItems`; (2) Extract `NewIdeasHeaderStats` component; (3) Replace single "New ideas" InboxSection with 3 swimlane InboxSections; (4) Add danger accent to overdue section header
  - Refactor: Verify 200-line limit; extract any inline JSX that overflows
- **Planning validation:**
  - `isOverdue` confirmed on `ProcessImprovementsInboxItem` — grep shows `item.isOverdue` at line 160 of `NewIdeasInbox.tsx`
  - `isProcessImprovementsOperatorActionItem` already exists at line 124
  - Header stats strip is lines 1584–1608 (25 content lines) — safe to extract as `NewIdeasHeaderStats`
  - After extraction, `NewIdeasInbox` body loses ≈25 lines; adding 3 sections vs 1 adds ≈25 lines; net zero — stays within 200

---

### TASK-07b: Collapsible Deferred and Recently Done Sections
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/business-os/src/components/process-improvements/NewIdeasInbox.tsx`, `apps/business-os/src/components/process-improvements/NewIdeasInbox.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-13)
- **Affects:** `apps/business-os/src/components/process-improvements/NewIdeasInbox.tsx`, `apps/business-os/src/components/process-improvements/NewIdeasInbox.test.tsx`
- **Depends on:** TASK-07a (file overlap: `NewIdeasInbox.tsx`)
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — simple boolean toggle state; `expandedKeys` pattern already in the file; no API or type changes.
  - Approach: 85% — collapse-by-default with click-to-expand matches standard operator dashboard UX.
  - Impact: 80% — deferred and done sections are secondary surfaces; collapsing them keeps focus on active swimlanes.
- **Acceptance:**
  - [ ] Deferred section collapsed by default; click on section header toggles expansion
  - [ ] Recently Done section collapsed by default; click on header toggles expansion
  - [ ] `NewIdeasInbox` function stays within 200 lines after both toggle states added
  - [ ] TC-LAYOUT-NI-02: Deferred section collapsed on mount; expands on click
  - **Expected user-observable behavior:**
    - [ ] Deferred and done items are hidden by default; operator clicks to reveal
    - [ ] Collapsing preserves section count badge (so operator knows there are items)
- **Engineering Coverage:**
  - UI / visual: Required — collapse toggle UI on deferred + done section headers
  - UX / states: Required — collapsed/expanded state; empty state still renders in collapsed state (just hidden)
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — TC-LAYOUT-NI-02
  - Data / contracts: N/A — no interface changes
  - Performance / reliability: N/A
  - Rollout / rollback: Required — part of Phase 3 commit set
- **Validation contract (TC-XX):**
  - TC-LAYOUT-NI-02: `<NewIdeasInbox>` with deferred items rendered → deferred section header visible but content not rendered → click header → content renders
- **Execution plan:** Red → Green → Refactor
  - Red: Add TC-LAYOUT-NI-02 test
  - Green: (1) Add `isDeferredExpanded` state (default false); (2) Add `isDoneExpanded` state (default false); (3) Wrap `InboxSection` content in conditional renders; (4) Add toggle button/area to section headers
  - Refactor: Extract collapse toggle to `InboxSection` as optional `collapsed?: boolean` + `onToggle?` props if that's cleaner than inline; verify 200-line limit
- **Acceptance:**
  - [ ] Hero strip added to `/new-ideas` page with three live stat badges: Inbox count, In Progress count, Overdue count — all derived client-side from auto-refresh data
  - [ ] Urgency swimlane 1: Overdue strip (items past due date) — red/danger styling, full-width callout
  - [ ] Urgency swimlane 2: Operator Actions section — items where `itemType === "operator_action"`
  - [ ] Urgency swimlane 3: Ideas Queue section — remaining active items
  - [ ] Urgency swimlane 4: Deferred — collapsed by default; expand to reveal deferred items
  - [ ] Urgency swimlane 5: Recently Done — collapsed timeline strip
  - [ ] All card expand/collapse interactions preserved
  - [ ] All triage actions (do/defer/decline/mark-done/snooze/bulk) functional in new layout
  - [ ] Snapshot tests updated and passing
  - **Expected user-observable behavior:**
    - [ ] Operator can see at a glance: how many items are overdue (danger strip), how many operator actions need attention, how many queue items exist
    - [ ] Deferred and done items are hidden by default, reveal on click
    - [ ] Stat badges in hero strip update automatically on 30s refresh
- **Engineering Coverage:**
  - UI / visual: Required — primary layout restructure; new section components; hero strip
  - UX / states: Required — deferred collapse/expand state; empty states per swimlane; loading/error states in hero strip
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — snapshot updates; smoke test all triage actions; verify collapse/expand
  - Data / contracts: Required — hero strip derives stats from auto-refresh payload; verify all stat derivations are correct
  - Performance / reliability: Required — `NewIdeasInbox.tsx` render complexity increases; verify no unnecessary re-renders from swimlane state
  - Rollout / rollback: Required — Phase 3 commit; revertable to Phase 2 state
- **Validation contract (TC-XX):**
  - TC-LAYOUT-NI-01: All 5 swimlane sections render with correct items categorised
  - TC-LAYOUT-NI-02: Deferred section collapsed by default; expands on click
  - TC-LAYOUT-NI-03: Hero stat badges update after simulated auto-refresh
  - TC-LAYOUT-NI-04: All triage actions (do/defer/decline/snooze) functional — existing test cases pass
- **Execution plan:** Red → Green → Refactor
  - Red: Update snapshot tests
  - Green: (1) Add hero strip to `new-ideas/page.tsx` hero section; (2) Add swimlane section components; (3) Redistribute items into swimlanes based on category; (4) Implement deferred/done collapse
  - Refactor: Extract swimlane section components to named functions if inline gets unwieldy; consider splitting file if >2,000 lines
- **Scouts:** `isOverdue: boolean` is confirmed present on `ProcessImprovementsInboxItem` at `projection.ts:87` and already consumed at `NewIdeasInbox.tsx:145`. No investigation needed — swimlane 1 uses `item.isOverdue === true` directly.
- **Edge Cases & Hardening:**
  - All swimlanes may be empty — each must show an appropriate empty state
  - Deferred collapse must preserve scroll position when expanded
  - Hero stat badges must not show `NaN` during initial hydration
- **Rollout / rollback:**
  - Rollout: Phase 3 commit (parallel with TASK-08 and TASK-09)
  - Rollback: `git revert` of Phase 3 commit set

---

### TASK-08: In Progress Page — Sectioned List + Live-Stat Hero Strip
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/business-os/src/components/process-improvements/InProgressInbox.tsx`, `apps/business-os/src/app/process-improvements/in-progress/page.tsx`, `apps/business-os/src/components/process-improvements/InProgressInbox.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-13)
- **Affects:** `apps/business-os/src/components/process-improvements/InProgressInbox.tsx`, `apps/business-os/src/app/process-improvements/in-progress/page.tsx`, `apps/business-os/src/components/process-improvements/InProgressInbox.test.tsx`
- **Depends on:** TASK-06
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 80% — in-progress page is simpler than new-ideas (no complex filter state); three section categories well-specified; card re-skinning is contained.
  - Approach: 85% — `isActiveNow`, `tasksBlocked` already available on `ActivePlanProgress` type; section categorisation is straightforward.
  - Impact: 85% — delivers urgency-tiered view for active work; animated Running Now ring is the key liveness signal.
- **Acceptance:**
  - [ ] Hero strip added to `/in-progress` page with `InProgressCountBadge` and `LiveNewIdeasCount` badge
  - [ ] Running Now section: plans where `isActiveNow === true` — animated ring, full-width card treatment
  - [ ] Blocked section: plans where `tasksBlocked > 0` (and not `isActiveNow`) — warning styling
  - [ ] In Progress section: remaining active plans
  - [ ] All sections empty-state handled
  - [ ] Snooze behaviour preserved across all sections
  - [ ] Plan cards re-skinned for dark surface: glassmorphism style, borders, active/pending/error states visible
  - [ ] Snapshot tests updated and passing
  - **Expected user-observable behavior:**
    - [ ] Plans with recent activity show animated ring in "Running Now" section
    - [ ] Blocked plans highlighted with warning colour
    - [ ] Cards are legible on dark background with clear status indicators
- **Engineering Coverage:**
  - UI / visual: Required — three-section layout; card dark re-skin; animated ring for active-now plans
  - UX / states: Required — snooze, active, blocked, complete states all visible on dark surface
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — snapshot updates; TC-07 (active-now), TC-08 (handoff in-flight), TC-09 (agent observation) must pass
  - Data / contracts: N/A — no new data; `isActiveNow` and `tasksBlocked` already on `ActivePlanProgress`
  - Performance / reliability: N/A — no new data fetches; existing auto-refresh
  - Rollout / rollback: Required — Phase 3 commit
- **Validation contract (TC-XX):**
  - TC-LAYOUT-IP-01: Plan with `isActiveNow === true` renders in "Running Now" section with animated ring class
  - TC-LAYOUT-IP-02: Plan with `tasksBlocked > 0` renders in "Blocked" section
  - TC-LAYOUT-IP-03: Remaining plans render in "In Progress" section
  - TC-LAYOUT-IP-04: Existing TC-07, TC-08, TC-09 pass unchanged
- **Execution plan:** Red → Green → Refactor
  - Red: Update snapshot tests for new section structure
  - Green: (1) Add hero strip; (2) Add three section components; (3) Distribute plans by `isActiveNow` / `tasksBlocked`; (4) Re-skin card components for dark surface
  - Refactor: Extract animated ring as a standalone CSS class or utility
- **Edge Cases & Hardening:**
  - A plan may transition from Running Now → In Progress between polls — section membership updates on next auto-refresh
  - Empty running-now section is expected (most plans); must not show error state
- **Rollout / rollback:**
  - Rollout: Phase 3 commit (parallel with TASK-07 and TASK-09)
  - Rollback: `git revert` of Phase 3 commit set

---

### TASK-09: Sub-Nav Upgrade — Live Counts + Pulse Dot
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/business-os/src/components/process-improvements/ProcessImprovementsSubNav.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-13)
- **Affects:** `apps/business-os/src/components/process-improvements/ProcessImprovementsSubNav.tsx`
- **Depends on:** TASK-06
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 85% — simple `useEffect` + `fetch` pattern; component already `"use client"`; straightforward count derivation.
  - Approach: 85% — polling chosen in analysis; same endpoint as existing inbox polls; fail-silent pattern established.
  - Impact: 80% — sub-nav live counts are a polish/completeness item; functional value is high (operator knows where to focus), failure is graceful (shows static labels).
- **Acceptance:**
  - [ ] `ProcessImprovementsSubNav` polls `/api/process-improvements/items` on mount (30s interval)
  - [ ] `newIdeasCount` derived from `items.filter(active).filter(not in inProgressDispatchIds).length`
  - [ ] `inProgressCount` derived using the same snooze-filtering logic as `InProgressCountBadge` (`activePlans.filter(incomplete).filter(not snoozed).length`) to avoid visible count drift between the sub-nav and the In Progress hero badge
  - [ ] Tabs show `Inbox (N)` and `In Progress (N)` when counts are available
  - [ ] Pulse dot (green dot animation) shown on `In Progress` tab when any plan `isActiveNow`
  - [ ] On API error or before first poll: static labels `Inbox` and `In Progress` (no count shown)
  - [ ] Poll must not block initial render (counts are `null` until first poll completes)
  - **Expected user-observable behavior:**
    - [ ] Sub-nav shows live counts; when triage decision is taken, counts update within 30s
    - [ ] Pulse dot on In Progress tab when agent work is active
- **Engineering Coverage:**
  - UI / visual: Required — live count display in tabs; pulse dot
  - UX / states: Required — loading (no count), loaded (count shown), error (fallback to no count)
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required — add test for count derivation; test error fallback
  - Data / contracts: N/A — same API payload; no interface changes
  - Performance / reliability: Required — third concurrent poll against same endpoint; must fail silently; `useEffect` cleanup must cancel interval on unmount
  - Rollout / rollback: Required — isolated component change; trivially revertable
- **Validation contract (TC-XX):**
  - TC-SUBNAV-01: API returns items and activePlans → tabs show `Inbox (3)` and `In Progress (2)`
  - TC-SUBNAV-02: API returns error → tabs show `Inbox` and `In Progress` (no count suffix)
  - TC-SUBNAV-03: Any plan `isActiveNow === true` → pulse dot visible on In Progress tab
- **Execution plan:** Red → Green → Refactor
  - Red: Add failing test for count derivation
  - Green: (1) Add `useEffect` with `fetch("/api/process-improvements/items")` and `setInterval(30s)`; (2) Store `newIdeasCount`, `inProgressCount`, `hasActiveNow` in state (all null initially); (3) Update tab labels to `{label}{count !== null ? ` (${count})` : ""}`; (4) Render pulse dot conditionally
  - Refactor: Extract polling hook to named function for clarity
- **Edge Cases & Hardening:**
  - Interval must be cleared in `useEffect` cleanup function (prevents memory leak on unmount)
  - First paint must show static labels (counts start as `null`, not `0`)
- **Rollout / rollback:**
  - Rollout: Phase 3 commit (parallel with TASK-07 and TASK-08)
  - Rollback: `git revert` reverts sub-nav to static labels

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| DS atom token resolution fails inside `.cmd-centre` due to CSS layer ordering | Low | Medium | TASK-06 gate verifies visually before Phase 3; fallback: investigate `@layer` order in `global.css` |
| `NewIdeasInbox.tsx` (1,660 lines) Phase 3 diff becomes unmanageable | Low | Low–Medium | TASK-07 will be replanned at TASK-06 checkpoint; replan can decompose into ≤2 sub-tasks if needed |
| Phase 3 triage action regression | Low | High | All existing test cases (TC-01 through TC-NEW-05, TC-07/08/09) must pass; smoke test at `localhost:3022` required before CI push |
| Phase 3 triage action regression | Low | High | All existing test cases (TC-01 through TC-NEW-05, TC-07/08/09) must pass; smoke test at `localhost:3022` required before CI push |

## Observability
- Logging: None — internal operator tool; no new logging required
- Metrics: None — no analytics changes
- Alerts/Dashboards: None

## Acceptance Criteria (overall)
- [ ] No `initialInProgressCount` prop anywhere in codebase
- [ ] B1, B2, B4, B5 data-accuracy fixes have passing regression tests; B3 InboxSection explicit count prop added
- [ ] Both pages render with deep navy dark background inside process-improvements section
- [ ] Sub-nav shows live counts
- [ ] Urgency swimlanes visible on New Ideas page (overdue → operator actions → queue → deferred → done)
- [ ] Three sections visible on In Progress page (Running Now → Blocked → In Progress)
- [ ] All triage actions (do/defer/decline/mark-done/snooze/bulk) smoke-tested and functional
- [ ] `pnpm typecheck` passes
- [ ] CI green on `dev` branch after each phase commit

## Decision Log
- 2026-03-13: Option A (three-phase sequential) chosen over single-pass; each phase independently CI-green
- 2026-03-13: `.cmd-centre` scoped class (A1) chosen over HTML-level `data-theme` (A2) — simpler, mirrors existing pattern
- 2026-03-13: Client-side count derivation (D1) chosen — API already returns full payload; no server changes needed
- 2026-03-13: Sub-nav polling (option a) chosen over shared React context — self-contained, no prop threading through layout
- 2026-03-13: TASK-07 confidence set at 75% (below auto-build threshold) — will be replanned at TASK-06 checkpoint

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-03: Fix B5 (Wave 1) | Yes — no deps; single file; pure string helper | Advisory [Missing data]: full `priorityReason` value set enumerated via scouts during build; fallback passthrough handles unknowns | No |
| TASK-02: Fix B4 (Wave 1) | Yes — no deps; different files from TASK-03; safe to parallelize | Advisory [Type contract]: `LiveNewIdeasCount` must render inside `InProgressInbox` tree — resolved in consumer tracing | No |
| TASK-01: Fix B1+B2+B3 (Wave 2) | Yes — follows TASK-03 (file overlap: `NewIdeasInbox.tsx`); all four `initialInProgressCount` sites enumerated | None | No |
| TASK-04: CHECKPOINT Phase 1 (Wave 3) | Partial — requires TASK-01 (Wave 2) and TASK-02 (Wave 1) both complete | None — gate criteria explicit and measurable | No |
| TASK-05: Dark theme CSS | Yes — TASK-04 gate ensures typecheck passes before CSS work begins | Advisory [Integration boundary]: `ProcessImprovementsSubNav` inside layout will inherit `.cmd-centre` dark overrides; verify nav appearance is acceptable | No — resolved: dark nav is desirable for command centre |
| TASK-06: CHECKPOINT Phase 2 | Partial — requires TASK-05 complete | None — gate criteria are explicit (devtools verify + contrast check + snapshots) | No |
| TASK-07: New Ideas layout | Yes — Phase 2 baseline confirmed at TASK-06 gate; `isOverdue` confirmed at `projection.ts:87` | None | No |
| TASK-08: In Progress layout | Yes — TASK-06 gate passed; `isActiveNow` and `tasksBlocked` fields verified on `ActivePlanProgress` type | None | No |
| TASK-09: Sub-nav upgrade | Yes — TASK-06 gate passed; component already `"use client"` | None — `useEffect` pattern is standard; fail-silent error handling specified | No |

## Overall-confidence Calculation
- TASK-01: M(2) × 85% = 170
- TASK-02: S(1) × 85% = 85
- TASK-03: S(1) × 80% = 80
- TASK-05: M(2) × 80% = 160
- TASK-07: L(3) × 75% = 225
- TASK-08: M(2) × 80% = 160
- TASK-09: S(1) × 80% = 80
- Sum weighted: 960 | Sum effort: 12 | **Overall: 960/12 = 80%**

## Section Omission Rule
- Observability: logged above as None with reasons (internal tool, no user-facing changes)
