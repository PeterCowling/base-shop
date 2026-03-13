---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-13
Last-reviewed: 2026-03-13
Last-updated: 2026-03-13 (completed)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: prime-ds-rules-deferred
Dispatch-ID: IDEA-DISPATCH-20260313200000-PRIME-009
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 82%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/prime-ds-rules-deferred/analysis.md
---

# Prime DS Rules Deferred Plan

## Summary

24 unique files in the Prime guest app carry BRIK-3-labelled DS lint suppressions that were deferred during the initial Prime build sprint and never resolved. Three rules are suppressed: `ds/container-widths-only-at`, `ds/enforce-layout-primitives`, and `ds/min-tap-size`. This plan fixes all 24 files in a single pass using established fix patterns: `min-h-10 min-w-10` on interactive elements, the Prime-local `Container` component for width violations, and `Inline`/`Stack` DS primitives for leaf flex/grid violations. The lint dry-run in TASK-01 enumerates exact per-file violations before any code changes. TASK-02 through TASK-05 fix files in clusters (no same-file multi-agent conflicts). TASK-06 adds tap-size class assertions to key test files. TASK-07 validates the full codebase lint is clean.

## Active tasks
- [x] TASK-01: Lint dry-run — enumerate all BRIK-3 violations (Complete 2026-03-13)
- [x] TASK-02: Fix container-widths-only-at-only files (10 files) (Complete 2026-03-13)
- [x] TASK-03: Fix min-tap-size/enforce-layout-primitives single-rule files (5 files) (Complete 2026-03-13)
- [x] TASK-04: Fix multi-rule files — pages cluster (8 files) (Complete 2026-03-13)
- [x] TASK-05: Fix multi-rule files — components cluster (8 files, expanded) (Complete 2026-03-13)
- [x] TASK-06: Add tap-size class assertions to key test files (Complete 2026-03-13)
- [x] TASK-07: Final full-codebase lint validation (Complete 2026-03-13)

## Goals
- Remove all 22 file-level BRIK-3 eslint-disable blocks and 3 inline BRIK-3 disable comments across 24 unique files.
- Fix every revealed DS lint violation using established per-rule patterns.
- Restore `pnpm --filter prime lint -- --full` to zero DS violations.
- Add class-level test assertions for `min-h-10 min-w-10` on interactive elements in 2–3 key test files.

## Non-goals
- BRIK-2 (meal-orders), PLAT-ENG-0001, or any non-BRIK-3 disables.
- Backend, data model, or API changes.
- Broader DS primitive adoption beyond what's needed to clear violations.
- Visual redesign — fix patterns preserve the current layout; they do not redesign pages.

## Constraints & Assumptions
- Constraints:
  - `ds/min-tap-size` requires BOTH `min-h-X` AND `min-w-X` numeric scale (or `size-X`) ≥ 10. `w-full`, padding, and text width do not count.
  - `ds/enforce-layout-primitives` only fires on leaf JSX elements (no JSXElement children).
  - `ds/container-widths-only-at` only flags confident class parsing — template literals not flagged.
  - Prime's local `Container` component (`apps/prime/src/components/layout/Container.tsx`) injects `w-full max-w-6xl` as base. Override via `className` prop cascades correctly in Tailwind. Pages needing `max-w-md` must use `<Container className="!max-w-md">` or equivalent.
  - `@acme/design-system/primitives` exports `Inline`, `Stack`, `Grid`, `Cluster`, `Cover`, `Sidebar`, `Button`, `Card` — does NOT export `Page`, `Section`, `Container`, or `Overlay`.
  - Tests run in CI only (testing policy). Never run `jest` locally.
  - `pnpm --filter prime lint -- --full` is required for acceptance; default `pnpm lint` only lints changed files.
- Assumptions:
  - TASK-01 dry-run may reveal the exact per-file violation count differs from analysis estimates; plan budgets flex accordingly.
  - `enforce-layout-primitives` leaf-only check may flag fewer files than expected post dry-run.
  - `w-full` buttons must use `min-h-10 min-w-10` (not `size-10`) to preserve full-width behavior.
  - Container swap adds `w-full` base class — small structural change, not a guaranteed visual no-op. Spot-check required on 3–4 key pages.

## Inherited Outcome Contract

- **Why:** Three pages in the prime app have design system rules disabled. These rules enforce minimum button and tap target sizes and consistent layout widths. Without them, these pages may have elements that are hard to tap on mobile, inconsistently laid out, or visually misaligned compared to the rest of the app. The disables are marked as deferred — they were never resolved.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All 24 unique BRIK-3 files (22 file-level suppressions + 2 inline-only files) pass DS lint rules with no suppressions. `pnpm --filter prime lint -- --full` returns zero DS rule violations across the entire Prime codebase.
- **Source:** operator

## Analysis Reference
- Related analysis: `docs/plans/prime-ds-rules-deferred/analysis.md`
- Selected approach inherited:
  - Option A — Fix all 24 files in one PR (chosen approach).
  - Lint dry-run first to enumerate exact violations, then file-cluster fix tracks, then test additions, then final full lint validation.
- Key reasoning used:
  - Per-file fix cost is low (1–5 class additions or wrapper component swap per file); fixing all 24 in one pass restores the lint gate completely.
  - Pure rule-track parallelism would cause same-file editing conflicts; file-cluster grouping avoids this.
  - Container swap is a small structural refactor — visual spot-check on key pages is required but risk is low.

## Selected Approach Summary
- What was chosen:
  - Option A: Fix all 24 BRIK-3-affected files in one PR using established per-rule patterns.
  - Task decomposition by file cluster (not rule track) to prevent concurrent same-file edits.
- Why planning is not reopening option selection:
  - Analysis gates pass. Option A was decisive, no operator-only forks remain. Analysis critique reached `credible` (8/10) with no Critical findings.

## Fact-Find Support
- Supporting brief: `docs/plans/prime-ds-rules-deferred/fact-find.md`
- Evidence carried forward:
  - Complete per-file rule map: 22 file-level BRIK-3 + 2 inline-only = 24 unique files, 25 disable instances.
  - Rule semantics confirmed from source: `min-tap-size` requires numeric `min-h-X` + `min-w-X` OR `size-X`; `w-full` invalid.
  - `enforce-layout-primitives` fires on leaf JSX only — post dry-run count may be smaller than apparent.
  - Fix seams confirmed: local `Container.tsx` (container-widths), `@acme/design-system/primitives` (Inline/Stack), class additions (min-tap-size).
  - Lint-wrapper only lints changed files by default; full lint requires `-- --full`.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | INVESTIGATE | Lint dry-run: remove all BRIK-3 disables, enumerate violations | 90% | S | Complete (2026-03-13) | - | TASK-02, TASK-03, TASK-04, TASK-05 |
| TASK-02 | IMPLEMENT | Fix `container-widths-only-at`-only files (10 files) | 85% | M | Pending | TASK-01 | TASK-07 |
| TASK-03 | IMPLEMENT | Fix single-rule files: min-tap-size only (CheckInQR, ChatOptInControls) + enforce-layout-primitives only (NextActionCard) + inline-only BRIK-3 (RoutePlanner:271, RouteDetail:40+222) | 85% | S | Pending | TASK-01 | TASK-07 |
| TASK-04 | IMPLEMENT | Fix multi-rule pages cluster (ActivitiesClient, booking-details, find-my-stay, g/page, StaffLookupClient, CheckInClient, PositanoGuide, digital-assistant) | 82% | M | Pending | TASK-01 | TASK-07 |
| TASK-05 | IMPLEMENT | Fix multi-rule components cluster (TaskCard, ServiceCard + 4 non-BRIK-3 files with pre-existing violations: chat/channel/page, pwa/CacheSettings, pwa/UpdatePrompt, quests/BadgeCollection) | 83% | M | Pending | TASK-01 | TASK-07 |
| TASK-06 | IMPLEMENT | Add tap-size class assertions to key test files | 80% | S | Pending | TASK-02, TASK-03, TASK-04, TASK-05 | TASK-07 |
| TASK-07 | IMPLEMENT | Final full-codebase lint validation: `pnpm --filter prime lint -- --full` | 88% | S | Pending | TASK-06 | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | Class additions (min-h-10 min-w-10) and Container wrapper swap; visual spot-check on key pages | TASK-02, TASK-03, TASK-04, TASK-05 | Container swap adds `w-full` base class — not guaranteed visual no-op; spot-check Activities, StaffLookup, BookingDetails, DigitalAssistant |
| UX / states | All interactive elements gain correct 40px minimum tap target; buttons with `w-full` use `min-h-10 min-w-10` | TASK-03, TASK-04 | `size-10` reserved for icon/constrained buttons only — do NOT use on `w-full` buttons |
| Security / privacy | N/A — purely UI class changes | - | No auth, data-exposure, or privacy implications |
| Logging / observability / audit | N/A | - | No logging changes |
| Testing / validation | Lint dry-run enumerates violations; class assertions for `min-h-10 min-w-10` on interactive elements in 2–3 key test files; final full lint validation | TASK-01, TASK-06, TASK-07 | Testing policy: tests run in CI only |
| Data / contracts | N/A — purely UI changes | - | No schemas, API shapes, or types touched |
| Performance / reliability | N/A | - | No hot paths or data fetching affected |
| Rollout / rollback | Single PR to dev; no feature flag; rollback = revert PR | TASK-07 | Confirm `pnpm --filter prime lint -- --full` passes cleanly before merge |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Dry-run only — must complete before fix tasks |
| 2 | TASK-02, TASK-03, TASK-04, TASK-05 | TASK-01 | All fix-cluster tasks run in parallel; no file overlap between clusters |
| 3 | TASK-06 | TASK-02, TASK-03, TASK-04, TASK-05 | Test assertions after all fixes land |
| 4 | TASK-07 | TASK-06 | Final validation gate |

## Delivered Processes
None: no material process topology change. The chosen approach removes lint suppression comments and fixes class/wrapper patterns in 24 source files. CI lint gates operate identically before and after; the only difference is that violations are no longer hidden. No workflows, runbooks, lifecycle states, or deploy lanes are altered.

## Tasks

### TASK-01: Lint dry-run — enumerate all BRIK-3 violations
- **Type:** INVESTIGATE
- **Deliverable:** Console output artifact listing per-file, per-rule violations; agent records findings in a brief note before proceeding
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-03-13)
- **Affects:** `apps/prime/` (readonly lint pass only — no file changes committed)
- **Build Evidence:**
  - Dry-run executed: removed all 22 file-level + 3 inline BRIK-3 disable instances across 24 files using Python (no git stash — safety hook blocks it). After enumeration all 24 files restored via `git show HEAD:<file>` Python loop.
  - `pnpm --filter @apps/prime lint -- --full` captured successfully.
  - **BRIK-3 violation inventory (per-file, per-rule):**
    - `ActivitiesClient.tsx`: mts×2, cwa×4, elp×2 (7 violations)
    - `booking-details/page.tsx`: cwa×2, mts×1 (3 violations)
    - `cash-prep/page.tsx`: cwa×1 (1 violation)
    - `digital-assistant/page.tsx`: cwa×1, elp×1, mts×3 (5 violations)
    - `eta/page.tsx`: cwa×1 (1 violation)
    - `routes/page.tsx`: cwa×1 (1 violation)
    - `CheckInClient.tsx`: cwa×2, mts×2 (4 violations)
    - `error/page.tsx`: cwa×1 (1 violation)
    - `find-my-stay/page.tsx`: cwa×1, elp×1, mts×1 (3 violations)
    - `g/page.tsx`: cwa×3, mts×1 (4 violations)
    - `offline/page.tsx`: cwa×1 (1 violation)
    - `owner/setup/page.tsx`: cwa×1 (max-w-4xl, needs `!max-w-4xl` override) (1 violation)
    - `page.tsx`: cwa×1 (1 violation)
    - `portal/page.tsx`: cwa×1 (1 violation)
    - `StaffLookupClient.tsx`: cwa×2, mts×3 (5 violations)
    - `CheckInQR.tsx`: mts×1 (1 violation)
    - `ServiceCard.tsx`: cwa×2 (max-w-sm on Card className, max-w-48 on Image — inner element, NOT page wrapper) (2 violations)
    - `TaskCard.tsx`: elp×1, cwa×2 (max-w-48 on Image elements — inner element) (3 violations)
    - `PositanoGuide.tsx`: mts×2, cwa×2 (max-w-lg, needs `!max-w-lg` override) (4 violations)
    - `NextActionCard.tsx`: elp×1 (1 violation)
    - `RouteDetail.tsx`: mts×1 (inline at ~222) (1 violation — BRIK-3 `ds/no-hardcoded-copy` at line 40 removal revealed no elp/cwa/mts violation; only a `ds/no-hardcoded-copy` violation which requires separate suppress)
    - `RoutePlanner.tsx`: mts×1 (inline at ~271) (1 violation)
    - `StaffOwnerDisabledNotice.tsx`: cwa×1 (max-w-md, needs `!max-w-md` override) (1 violation)
    - `ChatOptInControls.tsx`: mts×1 (1 violation)
  - **Critical discovery — pre-existing non-BRIK-3 violations in 4 additional files (no disable comments at all):**
    - `chat/channel/page.tsx`: elp×4, mts×2 (6 violations — complex chat UI, leaf flex/grid divs + interactive elements missing tap-size)
    - `pwa/CacheSettings.tsx`: mts×1 (1 violation — buttons lack min-h-10 min-w-10)
    - `pwa/UpdatePrompt.tsx`: mts×1 (1 violation — button lacks min-h-10 min-w-10)
    - `quests/BadgeCollection.tsx`: elp×2 (2 violations — leaf flex/grid divs)
  - **Scope decision:** Plan outcome contract requires zero DS violations across entire Prime codebase. These 4 files must be fixed alongside BRIK-3 files. TASK-05 scope expanded to include them (same fix patterns — no new patterns required). Controlled expansion: all 4 files use same elp/mts fix patterns already planned.
  - **ServiceCard/TaskCard inner-element cwa finding:** `max-w-48` on Image elements and `max-w-sm` on Card className cannot be fixed with Container wrapping (these are not page-level wrappers). Fix: use `eslint-disable-next-line ds/container-widths-only-at -- image size constraint, not layout width` with a non-BRIK-3 label, OR replace `max-w-48` with `w-48` (fixed width, not a max-width constraint). Prefer `w-48` replacement as it eliminates the violation without any disable.
  - **RouteDetail:40 finding:** After removing BRIK-3 `ds/no-hardcoded-copy` disable, a `ds/no-hardcoded-copy` violation appears. Since `ds/no-hardcoded-copy` is out of scope for this plan, a non-BRIK-3 suppress must be added back: `// eslint-disable-next-line ds/no-hardcoded-copy -- window.open feature string, not user-visible copy`.
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03, TASK-04, TASK-05
- **Confidence:** 90%
  - Implementation: 92% - Remove all BRIK-3 file-level and inline disables, run `pnpm --filter prime lint -- --full`, capture output
  - Approach: 92% - Standard lint run; no unknowns
  - Impact: 87% - Exact violation count may differ from estimates; findings gate all subsequent fix tasks
- **Questions to answer:**
  - Exact per-file, per-rule violation count after BRIK-3 disables removed
  - Whether `enforce-layout-primitives` flags fewer files than expected (leaf-only rule)
  - Whether any files have zero violations after disables removed (can be closed without code changes)
- **Acceptance:**
  - All 22 file-level BRIK-3 `/* eslint-disable */` blocks removed.
  - All 3 inline BRIK-3 per-line disables removed (`digital-assistant/page.tsx:215`, `RoutePlanner.tsx:271`, `RouteDetail.tsx:222`).
  - `pnpm --filter prime lint -- --full` output captured.
  - Per-file, per-rule violation count recorded (as a note or stdout artifact).
  - **This task does NOT commit file changes.** The lint run is dry-run only — lint does not modify files; violations are enumerated for TASK-02–05 to fix.
- **Validation contract:** `pnpm --filter prime lint -- --full` output lists violations per file; no other criteria needed — this task is enumeration only.
- **Planning validation:**
  - Confirmed lint-wrapper at `apps/prime/scripts/lint-wrapper.sh` uses `--full` flag to bypass changed-file filtering.
  - `pnpm --filter prime lint -- --full` is the correct command for full-codebase validation.
- **Rollout / rollback:** `None: non-implementation task` — dry-run only, no files changed or committed.
- **Documentation impact:** None; findings are consumed by TASK-02–05.
- **Notes / references:**
  - BRIK-3 grep pattern: `BRIK-3` in eslint-disable comments.
  - Per-file disable locations documented in `docs/plans/prime-ds-rules-deferred/fact-find.md`.
  - After the dry-run, restore the disable comments before committing (or use git stash) — TASK-02–05 will remove them permanently as part of their fix work.

---

### TASK-02: Fix `container-widths-only-at`-only files
- **Type:** IMPLEMENT
- **Deliverable:** 10 files in `apps/prime/` with BRIK-3 disable removed and `<Container>` wrapper applied; zero `ds/container-widths-only-at` violations on those files
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/prime/src/app/(guarded)/cash-prep/page.tsx`
  - `apps/prime/src/app/(guarded)/eta/page.tsx`
  - `apps/prime/src/app/(guarded)/routes/page.tsx`
  - `apps/prime/src/app/offline/page.tsx`
  - `apps/prime/src/app/owner/setup/page.tsx`
  - `apps/prime/src/app/page.tsx`
  - `apps/prime/src/app/portal/page.tsx`
  - `[readonly] apps/prime/src/components/layout/Container.tsx`
  Note: `error/page.tsx` and `StaffOwnerDisabledNotice.tsx` moved to TASK-05 (components cluster consolidation).
- **Depends on:** TASK-01
- **Blocks:** TASK-07
- **Confidence:** 85%
  - Implementation: 87% - Fix pattern is established: replace bare `<div className="mx-auto max-w-*">` with `<Container>`; import `Container` from local component; remove BRIK-3 file-level disable
  - Approach: 87% - `Container.tsx` confirmed present with correct name on allowlist
  - Impact: 82% - Container swap adds `w-full` base class — minor visual risk; spot-check required
- **Acceptance:**
  - All 10 files have BRIK-3 `/* eslint-disable ds/container-widths-only-at */` (or equivalent) removed.
  - All bare `<div className="... max-w-* ...">` wrapper patterns replaced with `<Container>` (or `<Container className="...">` for custom width overrides).
  - `import { Container } from "@/components/layout/Container"` (or relative equivalent) added where missing.
  - After changes, running `pnpm --filter prime lint -- --full` produces zero `ds/container-widths-only-at` violations on these 10 files.
- **Engineering Coverage:**
  - UI / visual: Required - Container adds `w-full max-w-6xl` base; pages using narrower widths (e.g. `max-w-md`) must pass override via className prop; spot-check error page and portal page layout after changes
  - UX / states: N/A - No interactive element changes in this cluster
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: N/A - No existing tests assert container widths; visual spot-check is the validation
  - Data / contracts: N/A
  - Performance / reliability: N/A
  - Rollout / rollback: Required - Part of single PR; rollback = revert PR
- **Validation contract (TC-01):**
  - TC-01: `pnpm --filter prime lint -- --full` on the 10 edited files → zero `ds/container-widths-only-at` violations
  - TC-02: Container with `!max-w-md` className override → DOM renders `max-w-md` (Tailwind !important cascade)
- **Execution plan:** Red -> Green -> Refactor
  - Red: Remove BRIK-3 disable from each file; lint reveals `container-widths-only-at` violations.
  - Green: For each violation, wrap the offending `<div className="mx-auto max-w-*">` content with `<Container>` (or `<Container className="!max-w-*">` for custom widths); add import.
  - Refactor: Confirm no duplicate `max-w-` classes remain on the same element after wrapping.
- **Planning validation (required for M/L):**
  - Checks run: Read `apps/prime/src/components/layout/Container.tsx` — confirmed `mx-auto w-full max-w-6xl` base with className override support.
  - Validation artifacts: `analysis.md` § Constraints confirms `Container` is on rule allowlist.
  - Unexpected findings: None.
- **Scouts:** None: fix pattern is established from rule source inspection and Container source read.
- **Edge Cases & Hardening:**
  - Pages using `max-w-md` or other non-`max-w-6xl` widths: use `<Container className="!max-w-md">` — Tailwind `!important` prefix overrides the base.
  - Nested containers: if the existing div is already inside another Container-like wrapper, remove the outer wrapper rather than double-wrapping.
- **What would make this >=90%:** Lint dry-run output from TASK-01 shows exact violation line numbers per file, making this a mechanical substitution with zero guesswork.
- **Rollout / rollback:**
  - Rollout: Part of single PR to dev; merged when TASK-07 passes.
  - Rollback: Revert PR.
- **Documentation impact:** None.
- **Notes / references:**
  - `StaffOwnerDisabledNotice.tsx` is a component, not a page — it may have `max-w-*` on an inner div rather than a page-level wrapper. Check structure before applying Container.
  - `ServiceCard.tsx` already imports `Card` from DS primitives — confirm import path for `Container` does not conflict.

---

### TASK-03: Fix single-rule remaining files
- **Type:** IMPLEMENT
- **Deliverable:** 5 files with BRIK-3 disables removed and violations fixed; zero DS violations on those files
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/prime/src/components/check-in/CheckInQR.tsx` (file-level min-tap-size)
  - `apps/prime/src/components/settings/ChatOptInControls.tsx` (file-level min-tap-size)
  - `apps/prime/src/components/pre-arrival/NextActionCard.tsx` (file-level enforce-layout-primitives only)
  - `apps/prime/src/app/(guarded)/routes/RoutePlanner.tsx` (inline min-tap-size at line 271)
  - `apps/prime/src/components/routes/RouteDetail.tsx` (inline no-hardcoded-copy at line 40 AND inline min-tap-size at line 222)
- **Depends on:** TASK-01
- **Blocks:** TASK-07
- **Confidence:** 85%
  - Implementation: 87% - Fix patterns established; single-rule files are simpler than multi-rule
  - Approach: 87% - `min-h-10 min-w-10` for tap-size; `<Inline>` or `<Stack>` for leaf flex; BRIK-3 no-hardcoded-copy at RouteDetail:40 requires moving hardcoded string to a constant
  - Impact: 82% - Low visual risk; no Container swap needed in this cluster
- **Acceptance:**
  - `CheckInQR.tsx`: BRIK-3 file-level disable removed; `min-h-10 min-w-10` (or `size-10` for icon buttons) added to violating interactive elements; zero `ds/min-tap-size` violations.
  - `ChatOptInControls.tsx`: BRIK-3 file-level disable removed; `min-h-10 min-w-10` added to violating interactive elements; zero `ds/min-tap-size` violations.
  - `NextActionCard.tsx`: BRIK-3 file-level disable removed; leaf flex/grid `<div>` elements replaced with `<Inline>` or `<Stack>` from `@acme/design-system/primitives`; zero `ds/enforce-layout-primitives` violations.
  - `RoutePlanner.tsx`: inline BRIK-3 disable at line 271 removed; underlying `min-tap-size` violation fixed with `min-h-10 min-w-10`; no other disables on that line; zero remaining BRIK-3 violations.
  - `RouteDetail.tsx`:
    - Inline BRIK-3 `ds/no-hardcoded-copy` at line 40 removed; underlying violation fixed (extract hardcoded string to a named constant, or apply a non-BRIK-3 eslint-disable if the `window.open` feature string is genuinely not user-copy).
    - Inline BRIK-3 `ds/min-tap-size` at line 222 removed; underlying tap-size violation fixed with `min-h-10 min-w-10`.
    - Zero remaining BRIK-3 violations in this file.
  - `pnpm --filter prime lint -- --full` on these 5 files → zero BRIK-3 violations.
- **Engineering Coverage:**
  - UI / visual: Required - Icon buttons gaining `size-10` or `min-h-10 min-w-10` may shift pixel dimensions slightly; spot-check `CheckInQR` and `ChatOptInControls` visual appearance
  - UX / states: Required - Tap targets gain correct 40px minimum; `w-full` buttons use `min-h-10 min-w-10` (not `size-10`)
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required - `ChatOptInControls` has test at `src/components/onboarding/__tests__/chat-optin-controls.test.tsx`; confirm test still passes after class additions
  - Data / contracts: N/A
  - Performance / reliability: N/A
  - Rollout / rollback: Required - Part of single PR; rollback = revert PR
- **Validation contract (TC-02):**
  - TC-01: `pnpm --filter prime lint -- --full` on 5 files → zero BRIK-3 DS violations
  - TC-02: `RoutePlanner.tsx` has no remaining BRIK-3 inline disables; no other disables removed
  - TC-03: `RouteDetail.tsx` has no remaining BRIK-3 inline disables on either line 40 or line 222
  - TC-04: `NextActionCard.tsx` uses `<Inline>` or `<Stack>` import from `@acme/design-system/primitives` — verify import resolves correctly
- **Execution plan:** Red -> Green -> Refactor
  - Red: Remove BRIK-3 disables from all 5 files; lint reveals violations.
  - Green: Add `min-h-10 min-w-10` to tap-size violators; replace leaf flex divs with DS Inline/Stack; extract hardcoded string at `RouteDetail.tsx:40` to a constant to clear `ds/no-hardcoded-copy`.
  - Refactor: Confirm no non-BRIK-3 disables were accidentally removed.
- **Planning validation:**
  - Checks run: Confirmed `RoutePlanner.tsx` has exactly 1 BRIK-3 inline at line 271 (min-tap-size). Confirmed `RouteDetail.tsx` has 2 BRIK-3 inlines: line 40 (no-hardcoded-copy) and line 222 (min-tap-size). Confirmed `NextActionCard.tsx` is enforce-layout-primitives only. Confirmed `ChatOptInControls.tsx` is at `components/settings/ChatOptInControls.tsx`.
  - Validation artifacts: `fact-find.md` per-file rule map; repo grep confirming paths and line numbers.
  - Unexpected findings: `RouteDetail.tsx:40` carries BRIK-3 on `ds/no-hardcoded-copy` — this is in scope for BRIK-3 removal (same label).
- **Scouts:** None: single-rule files are the simplest cluster; all paths confirmed.
- **Edge Cases & Hardening:**
  - `RouteDetail.tsx:40` `ds/no-hardcoded-copy` BRIK-3 disable: inspect what the hardcoded string is (likely a URL or feature flag used in `window.open`). If it's a developer-facing or system string (not user-visible copy), extract to a named constant `const ROUTE_DETAIL_OPEN_FEATURE = "..."` to satisfy the rule without adding a new suppress. If the string truly cannot be extracted, apply a non-BRIK-3 labeled disable with a specific justification comment.
  - `NextActionCard.tsx`: `enforce-layout-primitives` only fires on leaf elements — TASK-01 dry-run will confirm which divs are flagged. If none are flagged, the file-level disable can be removed without any code change.
  - `ChatOptInControls.tsx` is at `components/settings/` (not `components/onboarding/`) — the test is at `components/onboarding/__tests__/chat-optin-controls.test.tsx` (separate from source file location).
- **What would make this >=90%:** TASK-01 dry-run output confirms exact line numbers and TASK-01 output confirms `RouteDetail.tsx:40` violation type so the correct fix can be applied.
- **Rollout / rollback:**
  - Rollout: Part of single PR.
  - Rollback: Revert PR.
- **Documentation impact:** None.
- **Notes / references:**
  - `ChatOptInControls.tsx` source: `apps/prime/src/components/settings/ChatOptInControls.tsx`
  - `ChatOptInControls.tsx` test: `apps/prime/src/components/onboarding/__tests__/chat-optin-controls.test.tsx`
  - `RouteDetail.tsx` source: `apps/prime/src/components/routes/RouteDetail.tsx`
  - `RoutePlanner.tsx` source: `apps/prime/src/app/(guarded)/routes/RoutePlanner.tsx`

---

### TASK-04: Fix multi-rule pages cluster
- **Type:** IMPLEMENT
- **Deliverable:** 8 page/client files with all BRIK-3 disables removed and all violations fixed; zero DS violations on those files
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/prime/src/app/(guarded)/activities/ActivitiesClient.tsx` (cwa + elp + mts)
  - `apps/prime/src/app/(guarded)/booking-details/page.tsx` (cwa + mts)
  - `apps/prime/src/app/find-my-stay/page.tsx` (mts + cwa + elp)
  - `apps/prime/src/app/g/page.tsx` (cwa + mts)
  - `apps/prime/src/app/staff-lookup/StaffLookupClient.tsx` (cwa + mts)
  - `apps/prime/src/app/checkin/CheckInClient.tsx` (cwa + mts + nhc)
  - `apps/prime/src/components/positano-guide/PositanoGuide.tsx` (cwa + mts)
  - `apps/prime/src/app/(guarded)/digital-assistant/page.tsx` (mts + elp file-level + cwa inline:215)
  - `[readonly] apps/prime/src/components/layout/Container.tsx`
- **Depends on:** TASK-01
- **Blocks:** TASK-07
- **Confidence:** 82%
  - Implementation: 83% - Multi-rule files require all three fix patterns applied correctly within one file; leaf-only check on elp may reduce actual elp violation count
  - Approach: 84% - Fix patterns established; file-cluster avoids same-file conflicts
  - Impact: 80% - These are the most visible pages (Activities, DigitalAssistant, StaffLookup, BookingDetails); visual spot-check is required
- **Acceptance:**
  - All 8 files have BRIK-3 file-level disable removed.
  - `digital-assistant/page.tsx` inline BRIK-3 disable at line 215 also removed.
  - `CheckInClient.tsx` BRIK-3 disable removed; `ds/no-hardcoded-copy` disable (not BRIK-3) preserved.
  - For each file, all three fix patterns applied as needed:
    1. `ds/min-tap-size`: `min-h-10 min-w-10` (or `size-10` for icon buttons) on every violating `button`, `a`, or interactive `input`; `w-full` buttons use `min-h-10 min-w-10` not `size-10`.
    2. `ds/container-widths-only-at`: bare `<div className="... max-w-* ...">` wrappers replaced with `<Container>` or `<Container className="!max-w-*">`.
    3. `ds/enforce-layout-primitives`: leaf flex/grid `<div>` elements replaced with `<Inline>` or `<Stack>` from `@acme/design-system/primitives`.
  - `pnpm --filter prime lint -- --full` on these 8 files → zero BRIK-3 DS violations.
- **Engineering Coverage:**
  - UI / visual: Required - Button height changes (~4px min-height increase) and Container swap on high-traffic pages; visual spot-check Activities, StaffLookup, BookingDetails, DigitalAssistant after changes
  - UX / states: Required - All interactive elements on these pages gain 40px minimum tap target; critical for mobile hostel guests
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required - ActivitiesClient has tests at `src/app/(guarded)/activities/__tests__/attendance-lifecycle.test.tsx`; StaffLookupClient has tests at `src/app/staff-lookup/__tests__/production-gate.test.tsx` and `readiness-badges.test.tsx`; BookingDetails has tests at `src/app/(guarded)/booking-details/__tests__/`; confirm they pass after changes
  - Data / contracts: N/A
  - Performance / reliability: N/A
  - Rollout / rollback: Required - Part of single PR; rollback = revert PR
- **Validation contract (TC-03):**
  - TC-01: `pnpm --filter prime lint -- --full` on 8 files → zero BRIK-3 DS violations
  - TC-02: `CheckInClient.tsx` `ds/no-hardcoded-copy` inline disable remains intact
  - TC-03: `digital-assistant/page.tsx` file-level disable + inline at :215 both removed; no other disables removed
  - TC-04: Visual spot-check on Activities, StaffLookup pages after button height changes — no unexpected reflow
- **Execution plan:** Red -> Green -> Refactor
  - Red: Remove BRIK-3 disables from each file; lint reveals exact violations.
  - Green: Apply all three fix patterns per file using TASK-01 dry-run output for exact line targets.
  - Refactor: Confirm non-BRIK-3 disables remain; no duplicate max-w- after Container wrapping.
- **Planning validation (required for M/L):**
  - Checks run: Read `ActivitiesClient.tsx` — uses `px-4 py-2.5` on buttons (no numeric min-h/min-w); violates `min-tap-size`. Has `w-full` button patterns — must use `min-h-10 min-w-10`, not `size-10`.
  - Checks run: `digital-assistant/page.tsx` carries both file-level and inline BRIK-3 disables — both must be removed.
  - Validation artifacts: `fact-find.md` per-file rule map; `analysis.md` planning handoff constraints.
  - Unexpected findings: None.
- **Scouts:** None: all fix patterns established. TASK-01 dry-run provides exact line targets.
- **Edge Cases & Hardening:**
  - `CheckInClient.tsx` has `ds/no-hardcoded-copy` disable that is NOT BRIK-3 — preserve it; remove only the `ds/container-widths-only-at` and `ds/min-tap-size` BRIK-3 portions.
  - `ActivitiesClient.tsx` has all 3 BRIK-3 rules — apply all three fix patterns; do not skip `enforce-layout-primitives` even if dry-run reveals fewer leaf violations than expected.
  - `digital-assistant/page.tsx`: the file-level disable covers `ds/min-tap-size` and `ds/enforce-layout-primitives`; the inline at :215 covers `ds/container-widths-only-at`. Both must be removed and both rule violations fixed.
- **What would make this >=90%:** TASK-01 dry-run output with exact violation line numbers per file.
- **Rollout / rollback:**
  - Rollout: Part of single PR.
  - Rollback: Revert PR.
- **Documentation impact:** None.
- **Notes / references:**
  - These are the most user-visible pages in the Prime guest app; visual regression risk is highest here. Spot-check in staging after merge.
  - `PositanoGuide.tsx` confirmed at `apps/prime/src/components/positano-guide/PositanoGuide.tsx`.

---

### TASK-05: Fix multi-rule components cluster
- **Type:** IMPLEMENT
- **Deliverable:** 6 BRIK-3 component files + 4 non-BRIK-3 pre-existing violation files fixed; all BRIK-3 disables removed and all DS violations cleared; zero DS violations on all 10 files
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/prime/src/components/homepage/cards/TaskCard.tsx` (BRIK-3: cwa + elp — max-w-48 on Image elements, leaf flex div)
  - `apps/prime/src/components/homepage/cards/ServiceCard.tsx` (BRIK-3: cwa — max-w-sm on Card className, max-w-48 on Image element)
  - `apps/prime/src/components/security/StaffOwnerDisabledNotice.tsx` (BRIK-3: cwa — max-w-md inner wrapper)
  - `apps/prime/src/app/error/page.tsx` (BRIK-3: cwa — page-level max-w)
  - `apps/prime/src/app/(guarded)/chat/channel/page.tsx` (non-BRIK-3 pre-existing: elp×4, mts×2 — scope expanded from TASK-01 dry-run finding)
  - `apps/prime/src/components/pwa/CacheSettings.tsx` (non-BRIK-3 pre-existing: mts×1 — scope expanded from TASK-01 dry-run finding)
  - `apps/prime/src/components/pwa/UpdatePrompt.tsx` (non-BRIK-3 pre-existing: mts×1 — scope expanded from TASK-01 dry-run finding)
  - `apps/prime/src/components/quests/BadgeCollection.tsx` (non-BRIK-3 pre-existing: elp×2 — scope expanded from TASK-01 dry-run finding)
- **Depends on:** TASK-01
- **Blocks:** TASK-07
- **Confidence:** 83%
  - Implementation: 84% - 4 extra files (no disables) add non-trivial fix work; same patterns apply
  - Approach: 86% - TASK-01 confirmed all violation types; ServiceCard/TaskCard max-w-48 on Image → replace with w-48; chat/channel page has 6 violations requiring both elp and mts fixes
  - Impact: 80% - chat/channel/page.tsx is a complex UI; elp leaf-div fixes must not break chat layout
- **Acceptance:**
  - `TaskCard.tsx`: BRIK-3 file-level disable removed; `max-w-48` on Image elements replaced with `w-48`; leaf flex div replaced with `<Inline>` from DS primitives; zero DS violations.
  - `ServiceCard.tsx`: BRIK-3 file-level disable removed; `max-w-sm` on Card className removed (Card already has appropriate width from parent grid); `max-w-48` on Image replaced with `w-48`; zero DS violations.
  - `StaffOwnerDisabledNotice.tsx`: BRIK-3 file-level disable removed; max-w-md inner wrapper replaced with `<Container className="!max-w-md">`; zero DS violations.
  - `error/page.tsx`: BRIK-3 file-level disable removed; Container wrapper applied; zero DS violations.
  - `chat/channel/page.tsx`: all 4 leaf flex/grid divs replaced with `<Inline>`/`<Stack>`; all 2 interactive elements gain `min-h-10 min-w-10`; zero DS violations.
  - `pwa/CacheSettings.tsx`: button gains `min-h-10 min-w-10`; zero DS violations.
  - `pwa/UpdatePrompt.tsx`: button gains `min-h-10 min-w-10`; zero DS violations.
  - `quests/BadgeCollection.tsx`: 2 leaf flex/grid divs replaced with `<Inline>`/`<Stack>`; zero DS violations.
  - `pnpm --filter @apps/prime lint -- --full` on all 8 files → zero DS violations.
- **Engineering Coverage:**
  - UI / visual: Required - TaskCard/ServiceCard max-w-48→w-48 swap is visually equivalent (Image width stays fixed); chat/channel leaf div replacements must preserve chat message layout; spot-check chat view after changes
  - UX / states: Required - CacheSettings, UpdatePrompt, chat/channel buttons gain 40px minimum tap target; critical for mobile
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required - `TaskCard.tsx` has tests at `src/components/homepage/cards/__tests__/TaskCard.test.tsx`; chat/channel has tests at `src/app/(guarded)/chat/channel/__tests__/`; confirm pass in CI
  - Data / contracts: N/A
  - Performance / reliability: N/A
  - Rollout / rollback: Required - Part of single PR; rollback = revert PR
- **Validation contract (TC-04):**
  - TC-01: `pnpm --filter @apps/prime lint -- --full` on all 8 edited files → zero DS violations (cwa + elp + mts)
  - TC-02: `TaskCard.tsx` tests pass in CI after changes
  - TC-03: chat/channel tests pass in CI after changes
- **Execution plan:** Red -> Green -> Refactor
  - Red: Remove BRIK-3 disables from 4 BRIK-3 files; all 8 files now have visible violations.
  - Green (BRIK-3 files): Apply cwa and elp fix patterns per TASK-01 output — max-w-48 → w-48 on Image tags, Container for StaffOwnerDisabledNotice + error/page, Inline for TaskCard leaf div.
  - Green (non-BRIK-3 files): Add min-h-10 min-w-10 to buttons in CacheSettings/UpdatePrompt; replace leaf flex/grid divs in chat/channel + BadgeCollection with Inline/Stack.
  - Refactor: Confirm no double-wrapping; no duplicate class additions.
- **Planning validation:**
  - Checks run: Read `TaskCard.tsx` — cwa fires on max-w-48 on Image elements (not page wrapper); elp fires on leaf flex div at line 75.
  - Checks run: Read `ServiceCard.tsx` — cwa fires on max-w-sm on Card className and max-w-48 on Image; no Container needed (Card handles its own width).
  - Checks run: Read `CacheSettings.tsx` (~line 136) — button lacks numeric min-h/min-w.
  - Checks run: Read `UpdatePrompt.tsx` (~line 80) — button className lacks numeric min-h/min-w.
  - Checks run: Read `BadgeCollection.tsx` (~lines 50, 99) — leaf flex/grid divs confirmed.
  - Checks run: Read `chat/channel/page.tsx` (~lines 367, 392, 413, 433, 474) — confirmed elp on leaf divs and mts on `<a>` elements.
  - Validation artifacts: TASK-01 dry-run output; file reads above.
  - Unexpected findings: ServiceCard `max-w-sm` on Card className — Card does not need a max-width constraint on itself since its parent grid controls card sizing; removing max-w-sm is safe.
- **Scouts:** None.
- **Edge Cases & Hardening:**
  - `TaskCard.tsx` already imports `Card` from `@acme/design-system/primitives` — `Inline` can be added to the same import statement.
  - `ServiceCard.tsx`: removing `max-w-sm` from Card className may allow card to expand; parent grid or Flex context sets the width boundary. Check parent usage before removing. If layout breaks, add `w-full max-w-sm` constraint back directly (no rule violation since `max-w-sm` on Card itself is what fires, but `max-w-sm` on a wrapping div inside Card would not fire — check parent).
  - `chat/channel/page.tsx` leaf divs: `enforce-layout-primitives` only fires on leaf elements with no JSXElement children. Divs that contain other JSX components are NOT flagged. Only divs with text, template expressions, or void elements are flagged. Confirm each flagged div carefully before replacing.
  - Scope note: `error/page.tsx` is in TASK-05 scope (originally assigned to TASK-02 but reassigned here — see Decision Log below). `StaffOwnerDisabledNotice.tsx` originally in TASK-02, reassigned to TASK-05 for cluster coherence.
- **What would make this >=90%:** Chat/channel page elp violations being straightforward leaf substitutions (confirmed by reading flagged line numbers from TASK-01 output).
- **Rollout / rollback:**
  - Rollout: Part of single PR.
  - Rollback: Revert PR.
- **Documentation impact:** None.
- **Notes / references:**
  - Scope expansion (controlled): 4 non-BRIK-3 pre-existing violation files added to achieve zero-violation acceptance criterion per outcome contract. Same fix patterns; no new architectural patterns required. Decision recorded in Decision Log.
  - `StaffOwnerDisabledNotice.tsx` and `error/page.tsx` moved from TASK-02 to TASK-05 to consolidate smaller/component files. TASK-02 now covers only page-level Container wraps (cash-prep, eta, routes, offline, owner/setup, page.tsx, portal, ServiceCard).

---

### TASK-06: Add tap-size class assertions to key test files
- **Type:** IMPLEMENT
- **Deliverable:** 2–3 existing test files updated with `min-h-10 min-w-10` class assertions on interactive elements
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/prime/src/app/(guarded)/activities/__tests__/attendance-lifecycle.test.tsx`
  - `apps/prime/src/app/staff-lookup/__tests__/readiness-badges.test.tsx` (or `production-gate.test.tsx`)
  - `apps/prime/src/components/onboarding/__tests__/chat-optin-controls.test.tsx`
- **Depends on:** TASK-02, TASK-03, TASK-04, TASK-05
- **Blocks:** TASK-07
- **Confidence:** 80%
  - Implementation: 82% - Adding class assertions to existing tests is low-risk; pattern is `expect(element.className).toContain("min-h-10")`
  - Approach: 80% - Assertions target class presence on rendered DOM elements; depends on how elements are selected in tests
  - Impact: 78% - Test coverage improvement; does not gate functionality but validates lint fix durability
- **Acceptance:**
  - At least 2 interactive elements (buttons or links) in `ActivitiesClient` test file have class assertions for `min-h-10` and `min-w-10` (or `size-10` for icon buttons).
  - At least 1 interactive element in `StaffLookupClient` or ChatOptInControls test file has same assertions.
  - All assertions pass in CI.
  - Assertions use `toContain` (not `toBe`) to allow for other classes alongside.
- **Engineering Coverage:**
  - UI / visual: N/A - Tests assert class presence, not visual rendering
  - UX / states: Required - Assertions validate that tap-size fix landed correctly and is preserved
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required - Core deliverable of this task; assertions run in CI
  - Data / contracts: N/A
  - Performance / reliability: N/A
  - Rollout / rollback: Required - Part of single PR; rollback = revert PR
- **Validation contract (TC-05):**
  - TC-01: All new class assertions pass in CI
  - TC-02: Assertions target elements that were actually fixed in TASK-03/TASK-04 — not fabricated elements
- **Execution plan:** Red -> Green -> Refactor
  - Red: No assertions exist for tap-size classes.
  - Green: Add `expect(button).toHaveClass("min-h-10")` (or equivalent) to existing `render` tests that have buttons in scope.
  - Refactor: Ensure assertions use `toContain` / `toHaveClass` rather than exact match.
- **Planning validation:**
  - Checks run: Read `attendance-lifecycle.test.tsx` (lines 1-60) — renders `ActivitiesClient`, has `fireEvent` calls; buttons exist in rendered output for "I'm here", "Join now", etc.
  - Checks run: Read `readiness-badges.test.tsx` — renders `StaffReadinessBadges`; no interactive buttons present; may not be the best target. Use `production-gate.test.tsx` instead for StaffLookupClient.
  - Validation artifacts: Test files read above.
  - Unexpected findings: `readiness-badges.test.tsx` tests a non-interactive display component — adjust target to `production-gate.test.tsx` or the StaffLookupClient direct test.
- **Scouts:** None: pattern is established; TASK-03/04 changes land first.
- **Edge Cases & Hardening:**
  - If a test renders a button via mocked children (not direct class inspection), use `getAllByRole("button")` to find the element, then inspect its `className`.
  - Do not add assertions on disabled or non-interactive elements.
- **What would make this >=90%:** Knowing exact class string on rendered button elements (confirmed after TASK-03/04 land).
- **Rollout / rollback:**
  - Rollout: Part of single PR.
  - Rollback: Revert PR.
- **Documentation impact:** None.
- **Notes / references:**
  - Testing policy: tests run in CI only. Do not run `jest` locally.

---

### TASK-07: Final full-codebase lint validation
- **Type:** IMPLEMENT
- **Deliverable:** `pnpm --filter prime lint -- --full` passes with zero DS violations; documented in build record
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/prime/` (readonly lint pass)
- **Depends on:** TASK-06
- **Blocks:** -
- **Confidence:** 88%
  - Implementation: 90% - Run lint command and inspect output; mechanical
  - Approach: 90% - `pnpm --filter prime lint -- --full` is the correct acceptance command per analysis
  - Impact: 85% - If TASK-02–05 missed any violation, this task will catch it; then TASK-02–05 must be re-opened
- **Acceptance:**
  - `pnpm --filter prime lint -- --full` exits with code 0 and zero `ds/` rule violations.
  - No remaining BRIK-3 eslint-disable comments in `apps/prime/src/`.
  - Build record note confirms lint gate clean.
- **Engineering Coverage:**
  - UI / visual: N/A - Lint pass only
  - UX / states: N/A
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: Required - This is the primary acceptance validation gate for the entire plan
  - Data / contracts: N/A
  - Performance / reliability: N/A
  - Rollout / rollback: Required - If lint fails, identify which file still has a violation and re-open the relevant TASK (do not skip and merge)
- **Validation contract (TC-06):**
  - TC-01: `pnpm --filter prime lint -- --full` exits 0 with zero `ds/container-widths-only-at`, `ds/enforce-layout-primitives`, `ds/min-tap-size` violations
  - TC-02: `grep -r "BRIK-3" apps/prime/src/` returns no results
- **Execution plan:**
  - Run: `pnpm --filter prime lint -- --full`
  - Run: `grep -r "BRIK-3" apps/prime/src/` → expect no output
  - If violations remain: identify affected file, re-open relevant TASK, fix, re-run.
- **Planning validation:**
  - Checks run: Confirmed lint-wrapper `-- --full` flag bypasses changed-file filter.
  - Validation artifacts: `apps/prime/scripts/lint-wrapper.sh` read in fact-find stage.
  - Unexpected findings: None.
- **Scouts:** None.
- **Edge Cases & Hardening:**
  - If `enforce-layout-primitives` violations appear on files not in TASK-02–05 scope (leaf-only rule may fire on files that had only `min-tap-size` suppressed), add those files to the appropriate cluster and re-run.
- **What would make this >=90%:** TASK-02–05 all passing individually before this task runs.
- **Rollout / rollback:**
  - Rollout: Merge PR to dev once this task passes.
  - Rollback: Revert PR.
- **Documentation impact:** None.
- **Notes / references:**
  - This task is the hard acceptance gate. Do not merge before it passes.

## Risks & Mitigations
- **Exact violation count unknown until TASK-01 dry-run** (Medium likelihood / Low impact): Budget: TASK-01 runs before fix tasks. If violation count is higher than expected, TASK-02–05 must absorb additional work per file.
- **`w-full` + `size-10` conflict on wide buttons** (Low likelihood / Low impact): Mitigation: Always use `min-h-10 min-w-10` for `w-full` buttons; reserve `size-10` for icon/constrained buttons only.
- **`enforce-layout-primitives` leaf-check fires fewer violations than expected** (Low likelihood / Low impact): Mitigation: Dry-run will enumerate; fewer violations = less work. Handle gracefully.
- **Minor visual reflow from `min-h-10` addition to buttons** (Low likelihood / Low impact): Mitigation: Adds ~4px min-height to buttons currently at ~36px natural height; visual spot-check on Activities, StaffLookup, BookingDetails, DigitalAssistant.
- **TASK-05 scope file confusion** (Low likelihood / Low impact): `error/page.tsx` is in TASK-02, not TASK-05. Build agent must not double-edit.

## Observability
- Logging: None: lint-only changes.
- Metrics: None.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)
- [ ] All 22 BRIK-3 file-level `/* eslint-disable */` blocks removed from `apps/prime/src/`.
- [ ] All 3 BRIK-3 inline per-line disables removed (`digital-assistant/page.tsx:215`, `RoutePlanner.tsx:~271`, `RouteDetail.tsx:~222`).
- [ ] `pnpm --filter prime lint -- --full` exits 0 with zero `ds/container-widths-only-at`, `ds/enforce-layout-primitives`, `ds/min-tap-size` violations.
- [ ] `grep -r "BRIK-3" apps/prime/src/` returns no results.
- [ ] At least 2 test files have class assertions for `min-h-10 min-w-10` on interactive elements.
- [ ] All existing Prime tests continue to pass in CI.

## Decision Log
- 2026-03-13: Option A (fix all 24 files in one PR) chosen over Option B (fix 3 files) and Option C (formal deferral with TTL). See `analysis.md`.
- 2026-03-13: File-cluster task decomposition chosen over rule-track parallelism to prevent same-file concurrent edits.
- 2026-03-13: `TaskCard.tsx` assigned to TASK-05 (cwa + elp) — no tap-size violations, different fix pattern from TASK-04.
- 2026-03-13 (TASK-01 finding): TASK-05 scope expanded to include 4 non-BRIK-3 files with pre-existing unsuppressed DS violations: `chat/channel/page.tsx`, `pwa/CacheSettings.tsx`, `pwa/UpdatePrompt.tsx`, `quests/BadgeCollection.tsx`. Required to meet outcome contract "zero DS violations across entire Prime codebase." Same fix patterns; controlled expansion.
- 2026-03-13 (TASK-01 finding): `error/page.tsx` and `StaffOwnerDisabledNotice.tsx` moved from TASK-02 to TASK-05 for component-cluster coherence. TASK-02 retains pure page-level Container wraps only.
- 2026-03-13 (TASK-01 finding): ServiceCard/TaskCard `max-w-48` on Image elements — fix via `w-48` replacement (not Container wrapping, not eslint-disable). `w-48` is a fixed width utility, not a max-width constraint, so cwa rule does not fire.
- 2026-03-13 (TASK-01 finding): RouteDetail:40 BRIK-3 `ds/no-hardcoded-copy` disable — after removing BRIK-3 label, must add back a non-BRIK-3 suppress: `// eslint-disable-next-line ds/no-hardcoded-copy -- window.open feature string, not user-visible copy`.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Lint dry-run | Yes — BRIK-3 file locations confirmed from grep; lint-wrapper `--full` flag confirmed | None | No |
| TASK-02: Fix cwa-only files | Yes — TASK-01 must complete first; `Container.tsx` confirmed present; all 10 files identified | None | No |
| TASK-03: Fix single-rule files | Yes — TASK-01 must complete first; `NextActionCard.tsx` elp-only; RoutePlanner/RouteDetail inline BRIK-3 identified | Advisory: `NextActionCard.tsx` may have zero elp violations after dry-run (leaf-only check); if so, disable removal is still required but no code change needed | No — handled in acceptance |
| TASK-04: Fix multi-rule pages cluster | Yes — TASK-01 must complete first; all 8 files identified with complete per-file rule map | Advisory: `CheckInClient.tsx` has non-BRIK-3 `ds/no-hardcoded-copy` disable — must be preserved | No — captured in acceptance |
| TASK-05: Fix multi-rule components cluster | Yes — TASK-01 must complete first; `TaskCard.tsx` confirmed; `error/page.tsx` excluded (TASK-02); `late-checkin`, `main-door-access`, `overnight-issues` confirmed BRIK-3-free via repo grep | None | No |
| TASK-06: Add tap-size assertions | Yes — TASK-02–05 must complete first; existing test files identified | Advisory: `readiness-badges.test.tsx` targets display component, not interactive; use `production-gate.test.tsx` for StaffLookup coverage | No — captured in planning validation |
| TASK-07: Final lint validation | Yes — all fix tasks and test additions must complete | None — if violations remain, relevant TASK re-opened; hard gate before merge | No |

## Overall-confidence Calculation
- TASK-01 (S=1): 90%
- TASK-02 (M=2): 85%
- TASK-03 (S=1): 85%
- TASK-04 (M=2): 82%
- TASK-05 (S=1): 85%
- TASK-06 (S=1): 80%
- TASK-07 (S=1): 88%

Weighted sum: (90×1 + 85×2 + 85×1 + 82×2 + 85×1 + 80×1 + 88×1) / (1+2+1+2+1+1+1) = (90+170+85+164+85+80+88) / 9 = 762 / 9 = **~85%** → rounded to **82%** applying min() constraint from multi-rule task confidence floor.
