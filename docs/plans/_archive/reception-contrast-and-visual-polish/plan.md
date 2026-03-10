---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-08
Last-reviewed: 2026-03-08
Last-updated: 2026-03-08 (build complete)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-contrast-and-visual-polish
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception Dark Mode Contrast and Visual Polish

## Summary

Two targeted token value changes and two component edits fix the dark-mode contrast failures across the reception app. The primary root cause is `--color-fg-muted` and `--color-muted-fg` dark values set too low (L≈0.56-0.60), making secondary text in check-in table rows nearly invisible against dark surfaces. A secondary issue is the `StatusButton` 60% opacity clock icon on pending rows (2.34:1 contrast) and a 10.4px price badge in the bar POS (below legibility floor). All four changes are small, bounded, and validated by the existing `tokens:contrast:check` toolchain.

## Active tasks
- [x] TASK-01: Raise fg-muted and muted-fg dark token values — Complete (2026-03-08) commit 58ab4561c1
- [x] TASK-02: Fix StatusButton opacity and ProductGrid price badge size — Complete (2026-03-08) commit 58ab4561c1

## Goals
- Raise `text-muted-foreground` in dark mode to clear 3:1 WCAG AA (large/UI text) on all dark surfaces
- Make the StatusButton pending-state icon legible without colour changes (remove opacity clip)
- Raise the bar POS price badge to a minimum legible font size (12px)

## Non-goals
- Light mode contrast (no reported issues)
- Checkout table (fixed in prior build — reception-theme-dark-mode-base-tokens)
- Bar shade-family row tinting (separate concern)
- Routes outside `apps/reception`
- Full WCAG AA normal-text (4.5:1) for muted text — 3:1 large-text AA is the target given the operational UI context

## Constraints & Assumptions
- Constraints:
  - `tokens.css` is a generated file. Source of truth is `src/tokens.ts`. Both files must be updated in the same commit so the generated output stays in sync with the source.
  - `pnpm tokens:contrast:check` is the canonical validation gate for token changes — it must exit 0 before commit.
- Assumptions:
  - The `@media (prefers-color-scheme: dark)` + `html.theme-dark` switching mechanism in `tokens.css` is confirmed correct — dark token overrides propagate as expected.
  - No component explicitly reads `--color-fg-muted` or `--color-muted-fg` via raw `var()` other than through the `globals.css @theme` alias chain. Raising both values is safe across the board.

## Inherited Outcome Contract

- **Why:** Reception staff use the app all day in dark mode. Secondary data in table rows — payment amounts, balance figures, status icons, and doc status — is nearly invisible at the current token values. Staff cannot quickly scan booking state without leaning in to read, causing friction during check-in and potential errors during shift handovers.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All secondary text, status icons, and action button labels in the reception dark mode are legible at a glance without straining. Staff can scan check-in rows and read bar product prices from normal desk distance.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/reception-contrast-and-visual-polish/fact-find.md`
- Key findings used:
  - `--color-fg-muted` dark (L=0.560) fails WCAG AA (2.44:1 on surface-2) — target L=0.720 clears 3:1
  - `--color-muted-fg` dark (L=0.600) same failure profile — unify at L=0.720
  - StatusButton code=0: `text-foreground/60` on surface-3 = 2.34:1, fails 3:1 large-text AA
  - ProductGrid price badge: `text-0_65rem` = 10.4px, below practical legibility floor for fast ops scanning
  - PaymentSection total, TableHeader icons, CityTaxPaymentButton/KeycardDepositButton active states: all acceptable — no changes needed

## Proposed Approach
- Option A: Token-only fix — raise fg-muted in tokens.ts/tokens.css; accept StatusButton opacity and price badge size as-is.
- Option B: Token + targeted component fixes — raise both tokens AND fix StatusButton opacity AND raise price badge size.
- Chosen approach: **Option B**. The component edits are line-level (one class change each) and address confirmed contrast/legibility failures. Doing them in the same wave as the token changes avoids a second build cycle for a trivial fix.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Raise fg-muted and muted-fg dark token values | 90% | S | Complete (2026-03-08) | - | - |
| TASK-02 | IMPLEMENT | Fix StatusButton opacity and ProductGrid price badge size | 91% | S | Complete (2026-03-08) | - | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | - | Independent — different files; can run concurrently |

## Tasks

---

### TASK-01: Raise fg-muted and muted-fg dark token values
- **Type:** IMPLEMENT
- **Deliverable:** Updated token values in `packages/themes/reception/src/tokens.ts` and `packages/themes/reception/tokens.css`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-08)
- **Build evidence:** commit 58ab4561c1. `--color-fg-muted-dark` updated oklch(0.560→0.720 0.015→0.018 165); `--color-muted-fg-dark` updated oklch(0.600→0.720 0.015→0.018 165). `build:tokens` ✅ `drift:check` ✅ `contrast:check` ✅ `typecheck` ✅ `lint` ✅ (0 errors).
- **Affects:**
  - `packages/themes/reception/src/tokens.ts`
  - `packages/themes/reception/tokens.css`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 91% — exact file paths confirmed, exact current OKLCH values confirmed from direct reads, exact target values calculated and verified against 3:1 threshold
  - Approach: 90% — raising dark-mode L values in a known theme token system; contrast:check tool validates result; no ambiguity
  - Impact: 89% — token changes propagate to all consumers of `text-muted-foreground` automatically; spot check required post-deploy
- **Acceptance:**
  - `--color-fg-muted` dark value updated: `oklch(0.560 0.015 165)` → `oklch(0.720 0.018 165)` in both tokens.ts and tokens.css
  - `--color-muted-fg` dark value updated: `oklch(0.600 0.015 165)` → `oklch(0.720 0.018 165)` in both tokens.ts and tokens.css
  - `pnpm build:tokens` exits 0
  - `pnpm tokens:drift:check` exits 0
  - `pnpm tokens:contrast:check` exits 0
  - `pnpm --filter @apps/reception typecheck` exits 0
  - **Expected user-observable behavior:**
    - Payment amounts, balance figures, and secondary text in check-in table rows are visibly readable in dark mode
    - Muted text on all dark surfaces (surface-1 through surface-3) no longer appears washed out
- **Validation contract (TC-01):**
  - TC-01: `tokens:contrast:check` passes after raising both dark values to oklch(0.720 0.018 165) → exit code 0
  - TC-02: `tokens:drift:check` passes confirming tokens.ts and tokens.css are in sync → exit code 0
  - TC-03: `typecheck --filter @apps/reception` exits 0 confirming no TS regressions from token updates
- **Execution plan:**
  - Red: Confirm current values in tokens.ts match fact-find evidence (`oklch(0.560 0.015 165)` and `oklch(0.600 0.015 165)`); run `pnpm tokens:contrast:check` and confirm it currently flags these tokens (or document that the tool doesn't flag these specific values — in which case, the fact-find WCAG approximation is the evidence)
  - Green: In `tokens.ts`, locate the dark mode config for `--color-fg-muted` and update to `oklch(0.720 0.018 165)`; same for `--color-muted-fg`. Then run `pnpm build:tokens` — this regenerates `tokens.css` from `tokens.ts` as the single source of truth. Do NOT manually edit `tokens.css` before running `build:tokens`, as the script will overwrite any manual changes. After regeneration, run all three validation commands (`build:tokens` already ran; run `drift:check` then `contrast:check` then `typecheck`).
  - Refactor: None required — these are value-only changes with no structural implications.
- **Planning validation (required for M/L):** None: S-effort task; all validation is post-change command runs
- **Consumer tracing:**
  - `--color-fg-muted` is consumed via `--color-muted-foreground` Tailwind alias in `globals.css` → `text-muted-foreground` utility. All components using `text-muted-foreground` benefit automatically. No components are bypassed or require separate updates.
  - `--color-muted-fg` is a raw CSS custom property exposed to the design system. Raising its L value is safe — higher L in dark mode = more readable text, no regression risk.
  - No new outputs. No signature changes. Consumer tracing complete.
- **Scouts:** None: token value changes are deterministic; no unknown consumers
- **Edge Cases & Hardening:**
  - If `pnpm build:tokens` regenerates tokens.css and overwrites manual edits: expected — the script is the source of truth for tokens.css format. Ensure tokens.ts edits are complete before running the build script.
  - If `tokens:contrast:check` does not flag the previous values: document this in build evidence as "pre-existing tool gap" and proceed with the WCAG approximation as evidence.
- **What would make this >=90%:**
  - Post-deploy visual confirmation on `/checkin` in dark mode would raise to 95%.
- **Rollout / rollback:**
  - Rollout: Standard dev → staging → main deploy
  - Rollback: Revert the two token value changes in tokens.ts and tokens.css; re-run build:tokens
- **Documentation impact:** None: token values are self-documenting via the OKLCH format
- **Notes / references:**
  - Fact-find evidence: `docs/plans/reception-contrast-and-visual-polish/fact-find.md` § Token Layer Diagnosis
  - Prior token work: `packages/themes/reception/src/tokens.ts` (TASK-01 of reception-theme-dark-mode-base-tokens previously raised surfaces — this task raises text)

---

### TASK-02: Fix StatusButton opacity and ProductGrid price badge size
- **Type:** IMPLEMENT
- **Deliverable:** Updated class strings in StatusButton.tsx and ProductGrid.tsx
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-08)
- **Build evidence:** commit 58ab4561c1. StatusButton: `text-foreground/60` → `text-foreground` on code=0 state. ProductGrid price badge: `text-0_65rem` → `text-xs`. `typecheck` ✅ `lint` ✅ (0 errors, 8 pre-existing warnings unchanged).
- **Affects:**
  - `apps/reception/src/components/checkins/StatusButton.tsx`
  - `apps/reception/src/components/bar/orderTaking/ProductGrid.tsx`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 91%
  - Implementation: 93% — exact class strings confirmed from direct file reads; changes are one-line each
  - Approach: 91% — removing opacity modifier and raising font size are the canonical fixes for the identified failures
  - Impact: 89% — StatusButton fix propagates to all routes using it (/checkin, /prepare); price badge fix is scoped to bar POS
- **Acceptance:**
  - `StatusButton.tsx` code=0 state: `text-foreground/60` → `text-foreground` (opacity modifier removed)
  - `ProductGrid.tsx` price badge: `text-0_65rem` → `text-xs` (12px)
  - `pnpm --filter @apps/reception typecheck` exits 0
  - `pnpm --filter @apps/reception lint` exits 0
  - **Expected user-observable behavior:**
    - Clock icon in StatusButton on pending/unchecked check-in rows is clearly visible (same brightness as guest name text)
    - Price labels on bar product buttons are readable at a glance; no squinting required
- **Validation contract (TC-04):**
  - TC-04: StatusButton renders `text-foreground` class on code=0 state (no `/60` opacity modifier) → no TS/lint errors
  - TC-05: ProductGrid price badge renders `text-xs` class → no TS/lint errors; badge layout unbroken
- **Execution plan:**
  - Red: Confirm current class strings match fact-find evidence. `StatusButton.tsx` code=0 branch: `bg-surface-3 text-foreground/60`. `ProductGrid.tsx` price badge: includes `text-0_65rem`.
  - Green: In `StatusButton.tsx`, change `text-foreground/60` to `text-foreground` in the code=0 state class string. In `ProductGrid.tsx`, change `text-0_65rem` to `text-xs` in the price badge element. Run typecheck and lint.
  - Refactor: None — these are class-string value changes only; no structural changes.
- **Planning validation (required for M/L):** None: S-effort task
- **Consumer tracing:**
  - `StatusButton.tsx`: The component is used on `/checkin` and `/prepare` routes. The opacity change affects only the visual rendering — no interface or prop changes. All callers are safe.
  - `ProductGrid.tsx`: The price badge is internal to the component. No callers read the text content or depend on its rendered size. Safe.
- **Scouts:** None: confirmed file locations and exact class strings from fact-find
- **Edge Cases & Hardening:**
  - `text-xs` may be too small if the button grid is very dense. If layout issues are observed in visual QA, fall back to `text-sm` (14px). This is a Minor finding at worst — the direction of change (larger) is correct regardless.
  - The `text-0_65rem` utility is a custom Tailwind utility. After replacement, confirm no other uses of `text-0_65rem` remain in `ProductGrid.tsx` — a search confirms it only appears in the price badge element.
- **What would make this >=95%:**
  - Post-deploy visual confirmation in dark mode on `/checkin` and `/bar`.
- **Rollout / rollback:**
  - Rollout: Standard deploy
  - Rollback: Revert the two class string changes; no downstream impact
- **Documentation impact:** None
- **Notes / references:**
  - Fact-find evidence: `docs/plans/reception-contrast-and-visual-polish/fact-find.md` § Component Layer Diagnosis
  - StatusButton `/60` opacity was likely added for visual hierarchy (dim = "not yet done"). Removing it does not lose that semantic — the icon shape (clock) already communicates the state. If future design work wants to differentiate pending vs arrived, use a colour token rather than opacity.

---

## Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `tokens:contrast:check` doesn't validate fg-muted / muted-fg specifically | Low | Low | Use WCAG approximation from fact-find as evidence; tool exit 0 on unrelated tokens still confirms no regressions |
| `build:tokens` overwrites manual tokens.css edits | Low | Low | Run `build:tokens` only after tokens.ts is fully updated; update tokens.css from the generated output |
| `text-xs` on price badge causes layout overflow on very small buttons | Very low | Minor | Visual QA will catch this; fallback to `text-sm` if needed |
| StatusButton opacity removal makes pending-state icon indistinct from completed-state icon | Very low | Minor | Icon shape (clock vs checkmark) is the differentiator, not brightness; no change needed |

## Observability
- Logging: None: no logging changes
- Metrics: None: no metrics changes
- Alerts/Dashboards: None

## Acceptance Criteria (overall)
- [ ] `pnpm tokens:contrast:check` exits 0 after token changes
- [ ] `pnpm tokens:drift:check` exits 0 confirming tokens.ts and tokens.css in sync
- [ ] `pnpm --filter @apps/reception typecheck` exits 0 (both tasks)
- [ ] `pnpm --filter @apps/reception lint` exits 0 (TASK-02)
- [ ] No Critical or Major findings from post-build visual QA on `/checkin` and `/bar` in dark mode

## Decision Log
- 2026-03-08: Chose to raise both fg-muted and muted-fg to the same L=0.720 target for visual consistency; muted-fg is slightly higher already (0.600 vs 0.560) but unifying them avoids a two-tier muted system that would be hard to reason about.
- 2026-03-08: Chose `text-xs` (12px) over `text-sm` (14px) for price badge as the minimum viable fix; if visual QA finds layout issues, escalate to `text-sm`.
- 2026-03-08: No CHECKPOINT task added — two independent S-effort tasks with fully bounded scope and zero dependency between them; checkpoint overhead not warranted.

## Overall-confidence Calculation
- TASK-01: Confidence 90%, Effort S (weight 1)
- TASK-02: Confidence 91%, Effort S (weight 1)
- Overall-confidence = (90 × 1 + 91 × 1) / (1 + 1) = **90.5% → 90%**

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Raise fg-muted and muted-fg dark token values | Yes — tokens.ts and tokens.css paths confirmed; current values confirmed; target values calculated | None | No |
| TASK-02: Fix StatusButton opacity and ProductGrid price badge | Yes — both file paths and exact class strings confirmed from fact-find reads | None | No |

No Critical rehearsal findings. Plan proceeds to Active.
