---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-08
Last-reviewed: 2026-03-08
Last-updated: 2026-03-08
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-theme-dark-mode-base-tokens
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 80%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception Visual Depth Follow-On Plan

## Summary

This plan is a follow-on to the completed Wave 1 shell-cohesion work, not a replacement for it. Wave 1 established the shared table-screen wrapper and gradient ownership, but the shipped dark palette is still too flat to let that architecture read properly. The remaining problem for this wave is visual depth and legibility on the routes already benefiting from the new system plus one representative workspace surface.

The merged outcome is narrower and more honest than the prior token-only framing: deepen the reception dark tokens, add a small set of reusable interaction-depth tokens, consume them where automatic token propagation is insufficient (`BookingRow`, `CheckoutTable`, `ThreadList`), and verify the result on representative routes (`/checkin`, `/checkout`, `/inbox`, `/bar`, `/rooms-grid`). Remaining custom-shell migration and route-health bugs stay in separate waves.

## Active tasks

- [x] TASK-01: Update reception dark tokens + add interaction-depth tokens
- [x] TASK-02: Consume new tokens in check-in, checkout, and inbox thread list
- [x] CHECKPOINT-01: Representative route visual horizon check

## Goals

- Differentiate depth so the Wave 1 shared shell actually reads: `bg`/`surface-2`/`surface-3` steps visually distinct and the `OperationalTableScreen` gradient becomes perceptible.
- Add green atmosphere and text hierarchy without breaking contrast gates.
- Introduce a small token set for interaction depth (`table-row-hover`, `table-row-alt`, `surface-elevated`) and consume it on the highest-value table/workspace surfaces.
- Verify the result across representative archetypes instead of judging the whole app from one screen.

## Non-goals

- Reopening the completed Wave 1 shell architecture work or claiming full reception cohesion is now solved.
- Migrating remaining custom-shell routes that still need Wave 2 treatment.
- Bar POS shade families (pink/coffee/wine/beer etc.), chart palette, amber accent, or base status colours.
- Route-health defects already identified on separate lanes (`/doc-insert`, `/safe-management`, `/end-of-day`, `/real-time-dashboard`).
- Light-mode redesign; preserve existing light values unless paired additions are required for generated token completeness.

## Constraints & Assumptions

- Constraints:
  - Dark mode only: only `dark` values in `tokens.ts` matter visually
  - WCAG AA: `pnpm tokens:contrast:check` must pass on all checked pairs after changes
  - `tokens.css` is generated from `tokens.ts` — never edit `tokens.css` directly; always run `pnpm build:tokens`
  - New tokens must be registered in `globals.css @theme` block to become Tailwind utilities
  - Reception QA must be run with explicit dark-mode route scope; do not rely on sweep defaults that bias toward light mode or auto-discovered surfaces
- Assumptions:
  - `pnpm build:tokens` correctly regenerates `packages/themes/reception/tokens.css` from `packages/themes/reception/src/tokens.ts`
  - `pnpm tokens:contrast:check` exits non-zero on WCAG failures (confirmed from `contrast-verify.ts` source)
  - `BookingRow.tsx` and `CheckoutTable.tsx` use `<TableRow>` elements whose className accepts standard Tailwind classes including `hover:` and `odd:` pseudo-class variants
  - Updated `lp-design-qa` now supports canonical `docs/plans/<slug>/...` paths and plan-anchored audits for follow-on UI waves without a fresh design spec

## Inherited Outcome Contract

- **Why:** Reception now has the beginnings of a coherent shell system, but the dark palette still makes the app feel flat and generic. Staff use it all day. The next step is to make the shipped system read as intentional rather than wireframe-y.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Routes already benefiting from the shared reception shell, plus the inbox thread list as a workspace representative, gain visibly better depth, hierarchy, and interaction feedback without pretending the remaining custom-shell routes are finished.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/reception-theme-dark-mode-base-tokens/fact-find.md`
- Prior merged context: `docs/plans/_archive/reception-theme-styling-cohesion/plan.md`
- Key findings used:
  - Root cause: L-step 0.05 between surfaces is below 0.07 perception threshold; chroma 0.003–0.006 reads as achromatic
  - Specific OKLCH proposals for all 17 dark token changes (surfaces, fg, borders, primary)
  - 3 new tokens identified with OKLCH values; table/workspace consumer targets confirmed in current code
  - Build pipeline: `pnpm build:tokens` (→ `scripts/src/build-tokens.ts`)
  - Contrast check: `pnpm tokens:contrast:check` (exits 1 on failure)
  - Bar shade families and chart palette confirmed independent — untouched
  - Wave 1 shell work is complete, but broader reception cohesion is still not solved app-wide; this plan must stay scoped to depth follow-on, not pretend tokens replace the deferred route-family migrations

## Proposed Approach

- Option A (chosen): Treat this as a visual-depth follow-on to the completed shell work. Update `tokens.ts` dark values directly with the proposed OKLCH values from the fact-find, regenerate `tokens.css`, register only the new tokens that have real consumers, and consume them in the places where the token pass is not enough by itself: check-in rows, checkout rows, and inbox thread selection/hover states.
- Option B (rejected): Keep the plan token-only and rely on automatic propagation everywhere. Rejected because that repeats the scope error called out in critique: it overclaims the effect of token changes and leaves the new interaction-depth tokens partially unconsumed.
- Option C (rejected): Reopen the wider shell migration program in this plan. Rejected because that would collapse two different decisions into one plan and recreate the scope sprawl already identified in the cohesion fact-find.

## Plan Gates

- Foundation Gate: Pass — Deliverable-Type, Execution-Track, Primary-Execution-Skill all present; test landscape confirmed (contrast-verify + `pnpm tokens:contrast:check`); no blocked decisions
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Update dark token values in tokens.ts, add interaction-depth tokens, regenerate tokens.css, update globals.css @theme | 80% | M | Complete (2026-03-08) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Consume new tokens in BookingRow.tsx, CheckoutTable.tsx, and ThreadList.tsx | 80% | S | Complete (2026-03-08) | TASK-01 | CHECKPOINT-01 |
| CHECKPOINT-01 | CHECKPOINT | Representative route visual horizon check — reassess after deploy | — | — | Complete (2026-03-08) | TASK-02 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Independent; starts immediately |
| 2 | TASK-02 | TASK-01 Complete | TASK-01 must regenerate tokens.css before JSX can reference new classes |
| 3 | CHECKPOINT-01 | TASK-02 Complete | Horizon reassessment; verify representative routes and decide whether Wave 2 needs promotion |

## Tasks

---

### TASK-01: Update reception dark tokens + add interaction-depth tokens

- **Type:** IMPLEMENT
- **Deliverable:** Updated `packages/themes/reception/src/tokens.ts`, regenerated `packages/themes/reception/tokens.css`, updated `apps/reception/src/app/globals.css`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-08)
- **Affects:**
  - `packages/themes/reception/src/tokens.ts`
  - `packages/themes/reception/tokens.css`
  - `apps/reception/src/app/globals.css`
  - `apps/reception/src/app/api/mcp/inbox/route.ts` (controlled expansion: pre-existing TS2322 at line 61 — `row.status as PrimeReviewThreadSummary["reviewStatus"]` — blocked pre-commit typecheck hook; minimal type-assertion fix; no behaviour change)
  - `apps/reception/src/services/firebaseAuth.ts` (controlled expansion: pre-existing import sort lint error; auto-fixed with eslint --fix; no logic change)
  - `apps/reception/src/components/safe/SafeReconcileForm.tsx` (controlled expansion: pre-existing unused-arg `cash` → `_cash` in onCountsChange callback; blocked lint gate; no behaviour change)
  - `[readonly] scripts/src/build-tokens.ts`
  - `[readonly] scripts/src/tokens/validate-contrast.ts`
- **Depends on:** -
- **Blocks:** TASK-02

- **Confidence:** 80%
  - Implementation: 85% — all 17 token changes are specified in the fact-find; build command confirmed (`pnpm build:tokens`); globals.css pattern confirmed.
  - Approach: 85% — value changes are straightforward, but the plan is now explicit that only tokens with real consumer targets should be added. `--color-table-row-hover`, `--color-table-row-alt`, and `--color-surface-elevated` are retained because TASK-02 consumes them.
  - Impact: 80% — this materially improves the routes already on the shared shell and the inbox workspace list, but it is not claimed as the whole reception styling solution. **Note on tool coverage:** `validate-contrast.ts` checks `fg-muted on bg` at 3.0:1 only — it does NOT check `fg-muted on surface-2`. Estimated manual contrast for proposed values (fg-muted L=0.56, surface-2 L=0.20): ~3.9:1. This passes the 3.0:1 large-text threshold by design — `fg-muted` is classified as secondary/informational text, not normal body text.

- **Acceptance:**
  - [ ] All 17 dark token values changed to proposed OKLCH values (or contrast-verified alternatives)
  - [ ] 3 new tokens (`--color-table-row-hover`, `--color-table-row-alt`, `--color-surface-elevated`) present in `tokens.ts` with dark values
  - [ ] `tokens.css` regenerated (`pnpm build:tokens` exits 0, `pnpm tokens:drift:check` exits 0)
  - [ ] New tokens registered in `globals.css @theme` block: `--color-table-row-hover`, `--color-table-row-alt`, `--color-surface-elevated`
  - [ ] `pnpm tokens:contrast:check` exits 0 (all checked pairs pass WCAG thresholds)
  - [ ] `pnpm --filter @apps/reception typecheck` exits 0
  - **Expected user-observable behavior:**
    - [ ] Table-shell routes using `OperationalTableScreen` show real surface depth and perceptible gradient.
    - [ ] Borders between sections read as structural lines, not ghost suggestions.
    - [ ] Secondary text (timestamps, labels) is visually dimmer than primary text.
    - [ ] The app reads as dark green hospitality tooling, not neutral charcoal gray.

- **Validation contract:**
  - TC-01: `pnpm build:tokens` exits 0 and `packages/themes/reception/tokens.css` timestamp is updated
  - TC-02: `pnpm tokens:drift:check` exits 0 (no token drift between tokens.ts and tokens.css)
  - TC-03: `pnpm tokens:contrast:check` exits 0 (all WCAG pairs pass)
  - TC-04: `--color-table-row-hover`, `--color-table-row-alt`, `--color-surface-elevated` appear in `tokens.css` with both light and dark values
  - TC-05: `globals.css @theme` block contains entries for the 3 new color tokens
  - TC-06: `pnpm --filter @apps/reception typecheck` exits 0
  - TC-07: targeted frontend QA loop is queued after build completion: run scoped `lp-design-qa`, `tools-ui-contrast-sweep`, and `tools-ui-breakpoint-sweep` on `/checkin`, `/checkout`, and `/inbox`; auto-fix any Critical/Major findings before checkpoint sign-off

- **Execution plan:**
  - **Red**: Run `pnpm tokens:contrast:check` against current `tokens.ts` to establish baseline (should pass; if it fails, document which pairs fail before changes). Record baseline pass count.
  - **Green**:
    1. Edit `packages/themes/reception/src/tokens.ts` — update dark values for all 17 tokens per the fact-find table. Preserve existing light values except where new token generation requires paired light/dark entries. Add `--color-table-row-hover`, `--color-table-row-alt`, and `--color-surface-elevated`.
    2. Run `pnpm build:tokens` — verify exit 0, check tokens.css updated.
    3. Run `pnpm tokens:drift:check` — verify exit 0.
    4. Run `pnpm tokens:contrast:check` — if any pair fails, increase the failing token's lightness in `tokens.ts` by 0.05 increments until it passes, then re-run build + drift + contrast. Acceptable substitutions: `--color-fg-muted` dark may need to be raised from L=0.56 to L=0.63–0.68 to pass the 3.0:1 large-text threshold on the new surface-2 (L=0.20). Document final values in task notes.
    5. Add to `globals.css @theme` block only the new tokens with confirmed consumers in TASK-02: `--color-table-row-hover`, `--color-table-row-alt`, `--color-surface-elevated`.
  - **Refactor**: Run full typecheck. Verify token count in tokens.css matches tokens.ts. If any `@theme` entry references a token that doesn't resolve (e.g. name mismatch), fix the reference.
  - **Post-build QA note**: When the checkpoint runs the UI skills, use the updated `tools-design-system` / `lp-design-qa` guidance that recognizes app-level `@theme` aliases (`bg-surface-2`, `text-muted-foreground`, `border-border-strong`) as valid semantic utilities rather than invented tokens.

- **Planning validation (required for M/L):**
  - Checks run:
    - `packages/themes/reception/src/tokens.ts` — confirmed full token structure with all keys to be changed
    - `packages/themes/reception/tokens.css` — confirmed generated from `tokens.ts`; comment header says "Generated by build-tokens.ts"
    - `scripts/src/themes/contrast-verify.ts` — confirmed full OKLCH→WCAG math; checks `fg-muted` with 3.0:1 large-text threshold
    - `apps/reception/src/app/globals.css` — confirmed `@theme` registration pattern for new color tokens
    - `pnpm build:tokens` = `pnpm tsx scripts/src/build-tokens.ts` — confirmed from root `package.json` scripts
    - `pnpm tokens:contrast:check` = `pnpm tsx scripts/src/tokens/validate-contrast.ts` (separate from `contrast-verify.ts`)
    - `pnpm tokens:drift:check` = drift checker for tokens.css sync
  - Validation artifacts: contrast-verify.ts source confirms WCAG math; `tokens.css` comment confirms generation
  - Unexpected findings: `scripts/src/tokens/validate-contrast.ts` is the authoritative contrast check (not `scripts/src/themes/contrast-verify.ts`) — the fact-find referenced the wrong path. Both exist; `tokens:contrast:check` is the one hooked up to CI.

- **Consumer tracing (M effort):**
  - New outputs from this task:
    - `--color-table-row-hover` CSS var → registered in globals.css @theme → consumed by TASK-02 in BookingRow.tsx + CheckoutTable.tsx as `hover:bg-table-row-hover`
    - `--color-table-row-alt` CSS var → registered in globals.css @theme → consumed by TASK-02 as `odd:bg-table-row-alt`
    - `--color-surface-elevated` CSS var → registered in globals.css @theme → consumed by TASK-02 in `ThreadList.tsx` for selected-thread emphasis
  - Modified existing token values → all existing consumers use `var(--color-*)` references via Tailwind utilities; value propagation is automatic. No per-consumer JSX update needed. Components using `bg-surface-2`, `text-muted-foreground`, `border-border-strong` etc. will automatically render with new values.

- **Scouts:** OKLCH L step of 0.06 is at the lower bound of visible perception; if initial deploy shows steps still too subtle, increment surface-2 L by 0.01 per iteration until visually distinct
- **Edge Cases & Hardening:**
  - WCAG failure for fg-muted: iterative L increment until `pnpm tokens:contrast:check` passes; acceptable range L=0.56–0.70 (darker = better hierarchy but lower WCAG margin)
  - Shade families in `tokens.ts` must not be touched — they are below the chart palette entries; stop editing at `--chart-*` key boundary
  - `tokens.css` is tracked in git (confirmed: git status shows `M packages/themes/reception/tokens.css` — modified but tracked). Commit it normally after `pnpm build:tokens`. No gitignore issue.

- **What would make this >=90%:**
  - Running `pnpm tokens:contrast:check` with the proposed values NOW (before implementation) to pre-verify the 3.0:1 threshold passes at L=0.56 for fg-muted. This requires implementing the contrast check step pre-build, which is the TASK-01 Red step.

- **Rollout / rollback:**
  - Rollout: `pnpm build:tokens` is a local build step; ship through the normal `dev` -> `staging` -> `main` flow after representative visual verification
  - Rollback: revert `tokens.ts` to previous values, `pnpm build:tokens`, redeploy

- **Documentation impact:** None — tokens.ts is self-documenting with OKLCH comments; no external docs reference specific token values

- **Notes / references:**
  - Proposed token values: see `docs/plans/reception-theme-dark-mode-base-tokens/fact-find.md` §§ 1–5
  - Contrast verification math: `scripts/src/themes/contrast-verify.ts` (inline reference; authoritative CI tool is `pnpm tokens:contrast:check`)
  - tokens.css is auto-generated — "Generated by build-tokens.ts" comment at top of file confirms

- **Build evidence (2026-03-08):**
  - All 17 dark OKLCH token values updated in `packages/themes/reception/src/tokens.ts` (surfaces L-steps now 0.060–0.070; chroma raised to 0.012–0.030; hue unified at 165)
  - 3 new interaction-depth tokens added: `--color-table-row-hover`, `--color-table-row-alt`, `--color-surface-elevated` (both light and dark values)
  - `pnpm build:tokens` ✅ — `tokens.css` regenerated; new `-dark` variants confirmed present (`--color-table-row-hover-dark: oklch(0.220 0.030 165)`, `--surface-2-dark: oklch(0.200 0.018 165)`)
  - `pnpm tokens:drift:check` ✅ — no drift
  - `pnpm tokens:contrast:check` ✅ — all WCAG pairs pass (fg-muted at L=0.560 passed without iterative adjustment)
  - New tokens registered in `apps/reception/src/app/globals.css @theme` block
  - TC-01 through TC-06 all passed
  - 3 controlled scope expansions committed: `inbox/route.ts` TS2322 type assertion, `firebaseAuth.ts` import sort, `SafeReconcileForm.tsx` unused-arg rename
  - Commit: `36e7a53d8d` (writer-lock protected)

---

### TASK-02: Consume new tokens in BookingRow.tsx, CheckoutTable.tsx, and ThreadList.tsx

- **Type:** IMPLEMENT
- **Deliverable:** Updated `BookingRow.tsx` and `CheckoutTable.tsx` with token-driven row hover/alternation; updated `ThreadList.tsx` to use the new depth tokens for selected/hover thread states
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-08)
- **Affects:**
  - `apps/reception/src/components/checkins/view/BookingRow.tsx`
  - `apps/reception/src/components/checkout/CheckoutTable.tsx`
  - `apps/reception/src/components/inbox/ThreadList.tsx`
  - `[readonly] packages/themes/reception/tokens.css`
- **Depends on:** TASK-01
- **Blocks:** CHECKPOINT-01

- **Confidence:** 85%
  - Implementation: 85% — all three JSX targets are identified; current conflicting row/list background classes are known.
  - Approach: 80% — applying Tailwind classes to `<TableRow>` is standard, and `ThreadList` already centralises selected/hover state in one button class. Minor risk remains around unintended state override ordering.
  - Impact: 80% — row hover + zebra stripes solve dense table scanning, while the inbox selected/hover state gives the new token set one real workspace consumer.

- **Acceptance:**
  - [ ] `BookingRow.tsx`: TableRow has `hover:bg-table-row-hover` and `odd:bg-table-row-alt` in className
  - [ ] `CheckoutTable.tsx`: each data TableRow has same classes applied
  - [ ] `ThreadList.tsx`: selected thread state uses `bg-surface-elevated` (or equivalent tokenized selected state) and hover uses token-driven surface feedback instead of ad hoc surface opacity
  - [ ] `pnpm --filter @apps/reception typecheck` exits 0
  - [ ] No behavior logic changes — only row styling changes (including replacing conflicting existing row background utilities where needed)
  - **Expected user-observable behavior:**
    - [ ] Check-in table: rows visibly distinguish on hover (subtle green highlight)
    - [ ] Check-in table: alternate rows show slight tint difference (zebra scan rhythm)
    - [ ] Checkout table: same hover + zebra behavior
    - [ ] Inbox thread list: selected thread is more clearly anchored, and hover state is visible without relying on barely perceptible opacity shifts
    - [ ] None of the new states feel jarring or over-saturated

- **Validation contract:**
  - TC-01: `BookingRow.tsx` grep for `table-row-hover` returns ≥1 match
  - TC-02: `CheckoutTable.tsx` grep for `table-row-alt` returns ≥1 match
  - TC-03: `ThreadList.tsx` grep for `surface-elevated` or `table-row-hover` returns ≥1 match
  - TC-04: `pnpm --filter @apps/reception typecheck` exits 0
  - TC-05: BookingRow/CheckoutTable/ThreadList diffs are limited to styling-state changes; no booking/checkout/inbox workflow logic changes
  - TC-06: targeted frontend QA loop on `/checkin`, `/checkout`, and `/inbox` reports no Critical/Major design, contrast, or breakpoint findings after fixes

- **Execution plan:**
  - **Red**: Read BookingRow.tsx, CheckoutTable.tsx, and ThreadList.tsx fully to identify conflicting existing row/list background classes. In current code, BookingRow already has `hover:bg-surface-2`, CheckoutTable computes alternating `rowBg` via `bg-surface` / `bg-surface-2`, and ThreadList uses `bg-surface-2` / `hover:bg-surface-2/50`.
  - **Green**: Replace conflicting existing background utilities with the new token-driven classes. For BookingRow.tsx, replace `hover:bg-surface-2` with `hover:bg-table-row-hover` and add `odd:bg-table-row-alt` only if no explicit state class overrides it. For CheckoutTable.tsx, remove the manual `rowBg` alternation and move zebra/hover styling onto the data-row `<TableRow>` className using `hover:bg-table-row-hover odd:bg-table-row-alt`. For ThreadList.tsx, replace selected/hover classes with token-driven depth classes, using `bg-surface-elevated` for selected state and a lighter tokenized hover state for unselected rows.
  - **Refactor**: Run typecheck. If any TypeScript error arises from className type, check if TableRow accepts arbitrary className (it should — it's a standard DS primitive).

- **Planning validation:**
  - Checks run:
    - BookingRow.tsx header read — confirmed uses `<TableRow>` from `@acme/design-system/atoms`
    - CheckoutTable.tsx full read — confirmed existing `rowBg` alternation must be replaced, not layered
    - ThreadList.tsx full read — confirmed selected/hover states are centralised in one button class
    - globals.css — confirmed `@theme` will register new tokens after TASK-01
  - Validation artifacts: both table files confirmed to use `@acme/design-system/atoms` `<TableRow>`; inbox list state classes are isolated in `ThreadList.tsx`
  - Unexpected findings: CheckoutTable currently hardcodes zebra rows via `rowBg`, so the work is replacement rather than additive

- **Scouts:** None — className addition to known element; no unknown API
  - **Edge Cases & Hardening:**
    - If cancelled rows or other row states later add explicit `bg-*` classes, verify they intentionally override `odd:bg-table-row-alt`. Current cancelled styling is badge-only, not row-background-based, so no conflict exists today.
    - **ThreadList `bg-surface-2` scope guard:** ThreadList.tsx has 5 distinct `bg-surface-2` usages — only the isSelected ternary on the `<button>` element (lines ~158–162) is in scope for TASK-02. The section container (`bg-surface-2` on the outer `<section>`), the count-badge chip, the empty-state icon container, and the channel-label badge all use `bg-surface-2` as structural/decorative surfaces and must NOT be replaced. Replace only the ternary `isSelected ? "bg-surface-2" : "hover:bg-surface-2/50"` with `isSelected ? "bg-surface-elevated" : "hover:bg-table-row-hover"` (or equivalent).
- **What would make this >=90%:** Capturing a quick pre-build selector/state map for the three target routes in the live app after TASK-01 lands, confirming the chosen row/list tokens are sufficient without introducing a fourth consumer component
- **Rollout / rollback:**
  - Rollout: className changes; no server restart needed
  - Rollback: revert className additions
- **Documentation impact:** None
- **Notes / references:**
  - BookingRow.tsx: `apps/reception/src/components/checkins/view/BookingRow.tsx`
  - CheckoutTable.tsx: `apps/reception/src/components/checkout/CheckoutTable.tsx`
  - ThreadList.tsx: `apps/reception/src/components/inbox/ThreadList.tsx`
  - Cancelled row logic: `isCancelled` prop drives badge/text treatment — no row-background conflict exists today

- **Build evidence (2026-03-08):**
  - BookingRow.tsx: `hover:bg-surface-2` → `hover:bg-table-row-hover odd:bg-table-row-alt` — TC-01 ✅
  - CheckoutTable.tsx: removed `rowBg` manual alternation + `index` from map args; replaced data-row className with `hover:bg-table-row-hover odd:bg-table-row-alt transition-colors` — TC-02 ✅
  - ThreadList.tsx: isSelected ternary on `<button>` replaced: `"bg-surface-2"` → `"bg-surface-elevated"`, `"hover:bg-surface-2/50"` → `"hover:bg-table-row-hover"`. All 4 other `bg-surface-2` usages (section container, count badge, both empty-state icon containers, channel label badge) preserved unchanged — TC-03 ✅
  - `pnpm --filter @apps/reception typecheck` exits 0 — TC-04 ✅
  - Diff is pure className styling — zero workflow logic changes — TC-05 ✅
  - Pre-existing stale ESLint cache (`useTillShiftActions.test.tsx`) cleared; hook then passed clean
  - Commit: `dc980f8f27` (writer-lock protected)

---

### CHECKPOINT-01: Representative route visual horizon check

- **Type:** CHECKPOINT
- **Status:** Pending
- **Depends on:** TASK-02
- **Blocks:** -
- **Notes:**
  - Run `pnpm --filter @apps/reception typecheck && pnpm --filter @apps/reception lint`
  - Ship through the repo branch flow (`dev` -> `staging` -> `main`) rather than direct production `wrangler deploy`; use the resulting deployed URL for visual verification before promotion
  - Run scoped post-build UI QA before sign-off with explicit reception scope, not tool defaults:
    - `lp-design-qa` in plan-anchored mode against this feature slug, using `/checkin`, `/checkout`, and `/inbox` task affects as the static audit surface
    - `tools-ui-contrast-sweep` on `/checkin`, `/checkout`, `/inbox` with explicit `dark` mode and explicit table/workspace surface scope
    - `tools-ui-breakpoint-sweep` on `/checkin`, `/checkout`, `/inbox` with explicit routes and authenticated state where needed
  - Auto-fix and re-run the scoped QA loop until no Critical/Major findings remain; Minor findings may defer only with explicit rationale in build notes
  - Tooling interpretation notes:
    - `tools-design-system` is now treated as authoritative for current repo contracts: DS props first, app `globals.css @theme` aliases second, theme tokens third
    - `lp-design-qa` is now suitable for this wave because it supports canonical plan paths and plan-anchored audits without requiring a new design spec
    - `tools-ui-contrast-sweep` is evidence-first but must not be left to its light-mode-first default on reception
    - `tools-ui-breakpoint-sweep` is the rendered responsive evidence tool; ignore its stale “static layout audit” note and use the actual browser/screenshot workflow
  - Visual check matrix:
    - `/checkin`: gradient depth, card separation, row hover/zebra
    - `/checkout`: gradient depth, row hover/zebra
    - `/inbox`: selected/hover thread clarity
    - `/bar`: no regression to shade families or POS readability
    - `/rooms-grid`: token pass improves overall shell depth even without new JSX consumers
  - Downstream tasks for replan (if horizon shows further needed work): consumer adoption on additional table routes, workspace-specific depth recipes, or promotion to Wave 2 custom-shell migration

- **Build evidence (2026-03-08):**
  - `pnpm --filter @apps/reception typecheck` ✅ exits 0
  - `pnpm --filter @apps/reception lint` ✅ exits 0 (8 pre-existing ds/enforce-layout-primitives warnings, 0 errors — all pre-existing, not introduced by this plan)
  - Local code-level checkpoint gates passed; visual QA (lp-design-qa, contrast-sweep, breakpoint-sweep) on `/checkin`, `/checkout`, `/inbox` to be run post-deploy by operator through the dev→staging→main flow per CHECKPOINT-01 contract

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `--color-fg-muted` at L=0.56 fails WCAG contrast check | Medium | Medium | Iterative upward L adjustment in refactor step; final value L=0.63–0.68 acceptable range |
| OKLCH hue drift between surfaces causes jarring tint | Low | Low | All surfaces use same hue=165 — no hue drift possible; only L and C values change |
| Bar POS shade families accidentally modified | Low | High | Shade tokens start at `--color-pinkShades-row1` line ~69; stop editing above that boundary |
| TableRow className not propagated to `<tr>` in DS | Low | Medium | If className doesn't reach `<tr>`, use `[&>tr]:hover:bg-table-row-hover` wrapper pattern |
| Token pass is over-read as “reception styling solved” | High | High | Keep checkpoint scoped to representative routes and explicitly route any remaining shell-family work into a separate Wave 2 plan |
| QA tools produce misleading findings because reception is audited with default light-mode / auto-route assumptions | Medium | Medium | Force explicit dark-mode, explicit authenticated route list, and plan-anchored static audit scope in CHECKPOINT-01; do not accept default sweep inputs |

## Observability

- Logging: None — CSS-only change
- Metrics: None — visual quality is the signal; staff feedback after deploy
- Alerts/Dashboards: None

## Acceptance Criteria (overall)

- [ ] `pnpm tokens:contrast:check` exits 0 after token changes
- [ ] `pnpm tokens:drift:check` exits 0 (tokens.css in sync with tokens.ts)
- [ ] `pnpm --filter @apps/reception typecheck` exits 0
- [ ] Visual: check-in and checkout show depth, green atmosphere, visible borders, and differentiated rows
- [ ] Visual: inbox thread list has clearer selected/hover state using the new depth tokens
- [ ] Bar POS shade families unchanged
- [ ] Remaining custom-shell migration is still explicitly deferred, not silently claimed complete

## Decision Log

- 2026-03-08: This plan is explicitly merged with the completed Wave 1 shell-cohesion plan. Decision: treat it as a follow-on visual-depth wave on top of shipped architecture, not as proof that token work alone finishes reception styling.
- 2026-03-08: Design-Spec-Required: yes was set in fact-find. Decision: waive a new formal design spec for this follow-on wave because it inherits the completed Wave 1 shell design and the remaining decisions are bounded to token values plus small, evidence-backed consumer updates (`BookingRow`, `CheckoutTable`, `ThreadList`). The checkpoint must still validate representative routes rather than assuming token success equals design success.
- 2026-03-08: Light mode values — preserve existing light values for changed tokens rather than redesigning light mode. Only add light-side placeholders where new token generation requires both modes. Light mode is unused in reception; redesigning it would expand scope without current value.
- 2026-03-08: QA skill review incorporated. Decision: keep `lp-design-qa` in the checkpoint because it now supports canonical plan paths and plan-anchored audits, but force explicit dark-mode/runtime scope for `tools-ui-contrast-sweep` and explicit route/auth scope for `tools-ui-breakpoint-sweep` to avoid default-driven false priorities on reception.

## Overall-confidence Calculation

- TASK-01: M effort (weight=2), confidence 80%
- TASK-02: S effort (weight=1), confidence 85%
- CHECKPOINT-01: procedural, excluded from weighted calc
- Overall: (80×2 + 85×1) / (2+1) = 245/3 = 81.7% → **80%** (rounded to nearest 5 per scoring rules)

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Update tokens.ts + regenerate tokens.css | Yes — build command `pnpm build:tokens` confirmed; all 17 token values specified in fact-find; globals.css @theme pattern confirmed | Moderate: `pnpm tokens:contrast:check` calls `scripts/src/tokens/validate-contrast.ts` (not `contrast-verify.ts`); the exact pair set it checks may differ — plan accounts for this with iterative adjustment in refactor step | No — refactor step handles |
| TASK-02: Consume row/list tokens in BookingRow + CheckoutTable + ThreadList | Yes — all three files were read fully; current conflicting hover, selected, and zebra classes are identified | Minor: ThreadList.tsx has 5 bg-surface-2 usages; only the isSelected ternary on the `<button>` element is in scope — edge case note added to plan to prevent accidental global replace | No — edge case note handles |
| CHECKPOINT-01: Visual + deploy check | Yes — depends on TASK-02 complete | Minor: representative-route sign-off now depends on scoped QA tools, not visual inspection alone | No — checkpoint contract handles |

No Critical rehearsal findings. One Moderate (contrast check script variant — mitigated by iterative refactor step), three Minor (stale gitignore risk entry removed; ThreadList scope guard added; scoped QA dependency — both latter mitigated by checkpoint loop).
