---
Type: Analysis
Status: Ready-for-planning
Domain: BOS
Workstream: Engineering
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: reception-bar-bleeper-bugs
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/reception-bar-bleeper-bugs/fact-find.md
Related-Plan: docs/plans/reception-bar-bleeper-bugs/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Reception Bar — Bleeper Bugs Analysis

## Decision Frame
### Summary
Six confirmed defects in the bar/bleeper subsystem of `apps/reception` must be fixed together. The analysis decides whether to apply minimal targeted fixes (Option A), refactor the subsystem more broadly (Option B), or phase critical vs cosmetic fixes (Option C). The decision must account for the interaction between Bug 3 (Go mode ignored) and Bug 6 (auto-fill useEffect makes Go unselectable), which requires coordinated changes.

### Goals
- Fix all 6 confirmed defects with the smallest viable change surface.
- Preserve existing codebase patterns; no architectural changes required.
- Add unit tests for all fixed code paths.

### Non-goals
- Redesigning the bleeper assignment system.
- Adding new bleeper features.
- Refactoring unrelated bar components.

### Constraints & Assumptions
- Constraints:
  - Firebase write API: `useBleeperMutations.setBleeperAvailability` only — no direct Firebase `set()` in components.
  - Testing policy: tests run in CI only, never locally.
  - Error surfacing must use `NotificationProviderWithGlobal` (already in the component tree).
- Assumptions:
  - Bug 3 and Bug 6 should ship together for UX completeness. Bug 3 fixes the backend (Go mode no longer reserves a bleeper). Bug 6 removes confusing pre-fill. They are independent — Go mode is functional after Bug 3 alone. The Go/Bleep toggle in `PayModal.tsx` is separate from the bleep # field.
  - Preorder night keys are ordinal strings `night1/night2`; `getNightIndex()` and `addDays()` utilities already exist in `ModalPreorderDetails.tsx` / `dateUtils.ts`.

## Inherited Outcome Contract

- **Why:** Live audit on 2026-03-13 found these bugs causing incorrect bleeper assignments during bar shifts — staff can't reliably use Go mode, COMP eligibility is wrong, Firebase errors are silent, and the UI misleads. All 6 defects confirmed in source code.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All 6 confirmed bar/bleeper defects resolved: Go mode correctly skips bleeper reservation, COMP screen filters to tonight only, Firebase write failures are surfaced to staff, bleep number field initialises clean, ticket list renders stably without key churn, placeholder text matches actual behaviour.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/reception-bar-bleeper-bugs/fact-find.md`
- Key findings used:
  - Bug 3: `if (usage === "go") { chooseNext(); }` — wrong branch calls chooseNext; fix: skip chooseNext in go branch.
  - Bug 4: `isEligibleForPreorder` checks all nights; night keys are ordinal (`night1/night2`); fix needs `checkInDate` param + `getNightIndex`/`addDays` from `ModalPreorderDetails.tsx`.
  - Bug 5: `setBleeperAvailability` result (`BleeperResult`) not checked; silent failure path.
  - Bug 6: `useEffect` auto-fills `bleepNumber` redundantly with `PaymentSection.displayNumber`; makes Go mode unselectable.
  - Bug 7: `crypto.randomUUID()` as key fallback on every render — replace with index.
  - Bug 8: Placeholder "Leave blank for go" contradicts auto-fill behaviour.

## Evaluation Criteria
| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Change surface (diff size) | Smaller diff = lower regression risk, easier review | High |
| Correctness of fix | Must actually fix the stated bug, not just reduce symptoms | Critical |
| Test coverage achievable | Each fix must be independently verifiable | High |
| Pattern alignment | Fixes should follow existing codebase conventions | Medium |
| Rollback safety | Must be reversible without Firebase migration | High |

## Options Considered
| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A — Minimal targeted fixes | Fix each bug with the smallest possible change; ship all 6 together (Bug 3+6 must be coordinated) | Lowest risk, smallest diff, easy to review per-bug, each fix independently testable | Leaves `doConfirmPayment` logic somewhat procedural but functional | Bug 4 is moderately complex (requires `isEligibleForPreorder` signature change + night-key computation); risk if `checkInDate` is absent for any occupant | **Yes** |
| B — Refactor + fix | Extract bleeper assignment into pure helper `chooseBleeper(usage, bleepNumber, bleepers, findNext): string`; rewrite `doConfirmPayment` to use it; apply all other bug fixes alongside | Cleaner architecture, helper testable in isolation, prevents similar bugs | Higher diff surface on critical payment path; harder to review; adds refactoring risk on production-live code; no net correctness gain vs Option A | Refactoring `doConfirmPayment` introduces regression risk without clear benefit over minimal fix | **Yes but not recommended** |
| C — Phase critical now, cosmetic later | Fix Bugs 3+5+4 now; defer Bug 6+7+8 | Faster delivery of correctness-critical fixes | The Go/Bleep toggle (`bleepUsage` state) lives in `PayModal.tsx` — completely independent of the bleep # field and `bleepNumber` state. Go mode is functional after Bug 3 fix alone. However, phasing adds deploy overhead and leaves confusing UI state; all 6 bugs are in the same subsystem and the full fix is small enough to ship together. | Two deploys for a small fix set; Bug 6 UX confusion persists after Bug 3 fix if deferred | **No — ship all 6 together for simplicity; not because Bug 3 requires Bug 6** |

## Engineering Coverage Comparison
| Coverage Area | Option A (Chosen) | Option B (Rejected) | Chosen implication |
|---|---|---|---|
| UI / visual | Bug 8: replace placeholder text (1 line); Bug 6: field no longer pre-fills on load | Same changes | Fix placeholder copy; remove auto-fill effect |
| UX / states | Bug 3: guard on `if (usage === "go")` makes Go mode functional end-to-end; Bug 4: COMP screen filters to tonight only | Same but `doConfirmPayment` is restructured | Coordinated Bug 3+6 fix required |
| Security / privacy | N/A for both | N/A | — |
| Logging / observability / audit | Bug 5: check `BleeperResult.success`, notify staff on failure via toast | Same | Error notification on Firebase write failure |
| Testing / validation | New unit tests for each fixed path; existing tests not broken | Requires more mock restructuring due to helper extraction | Tests can be written with existing mock-capture pattern |
| Data / contracts | Bug 5: enforce `BleeperResult` return contract at call site | Same | Contract now enforced |
| Performance / reliability | Bug 7: index fallback eliminates UUID key churn | Same | Stable keys on every render |
| Rollout / rollback | Standard Git revert; no Firebase migration | Standard Git revert but larger diff | Git revert is clean |

## Chosen Approach
- **Recommendation:** Option A — Minimal targeted fixes for all 6 bugs, shipped together.
- **Why this wins:** Smallest change surface on production-live payment code. Each bug has a clear, independently testable fix. Bug 3+6 interdependence is handled by shipping together. Pattern alignment is perfect — no new abstractions. Option B adds refactoring risk on a critical payment path without any correctness gain. Option C is excluded because Bug 3 is only effective once Bug 6 removes the UI obstacle.
- **What it depends on:**
  - `checkInDate` being present for checked-in occupants in Bug 4 fix (safe default: return `false` if absent).
  - `getNightIndex()` and `addDays()` from `dateUtils.ts` / `ModalPreorderDetails.tsx` being reusable.
  - `NotificationProviderWithGlobal` being in the component tree above `OrderTakingContainer` (confirmed from `App.tsx`).
  - Bug 3 and Bug 6 are independent fixes; Bug 3 alone makes Go mode correct; Bug 6 removes confusing pre-fill. Ship together for UX completeness, not due to functional dependency.

### Rejected Approaches
- **Option B (Refactor + fix)** — Adds refactoring risk on critical payment path. The `doConfirmPayment` function is messy but correct after the minimal fix; refactoring it adds regression surface without net correctness gain. Deferred to a dedicated refactor task if desired post-fix.
- **Option C (Phased)** — Excluded. Bug 6 is not cosmetic — it is mechanically required for Bug 3's fix to be usable from the UI. Staff cannot select Go mode if the auto-fill useEffect immediately re-fills the field on every keystroke clear. The two must ship together.

### Open Questions (Operator Input Required)
None.

## End-State Operating Model

| Area | Current state | Trigger | Delivered step-by-step end state | What remains unchanged | Risks / seams to carry into planning |
|---|---|---|---|---|---|
| Payment confirmation — Go mode | Go/Bleep toggle selection is ignored; Go always assigns a bleeper because `doConfirmPayment` calls `chooseNext()` in the go branch | Staff selects Go toggle and taps Pay | (1) `if (usage === "go")` branch does NOT call `chooseNext()`. (2) `finalBleep` remains `"go"`. (3) `if (finalBleep !== "go")` block skipped — no bleeper reserved. (4) `confirmOrder("go", ...)` records the sale without a bleeper number. | Bleep mode path unchanged; `chooseNext()` still called as fallback in bleep branch. | Bug 6 must also be fixed so UI allows Go selection. |
| Payment confirmation — Firebase error handling | `setBleeperAvailability` result silently ignored; write failure allows duplicate bleeper assignments | Firebase write fails during order confirmation | (1) `result = await setBleeperAvailability(n, false)`. (2) If `!result.success`: show error toast via `NotificationProviderWithGlobal` and abort order confirmation. (3) Staff can retry. | Success path unchanged. | Race condition (two simultaneous orders) partially mitigated — full idempotency requires server-side enforcement (out of scope). |
| Bleep # field initialisation | `useEffect` auto-fills `bleepNumber` state on mount from `firstAvailableBleeper`; field shows a number on load even though no order has started | Page load / navigation to /bar | `useEffect` removed. `bleepNumber` state starts and stays `""`. `PaymentSection.displayNumber` (already in place) shows `firstAvailableBleeper` as a visual suggestion without setting state. Staff type to override (bleep mode) or leave blank — the suggestion is displayed but not committed to state. Go mode is selected via the Pay modal toggle, independent of this field. | `PaymentSection.displayNumber` logic unchanged; bleeper suggestion still visible. | None — `doConfirmPayment` bleep branch handles `bleepNumber === ""` via `chooseNext()`; go branch is unaffected. |
| COMP screen eligibility | `isEligibleForPreorder` checks all nights (`Object.values(occPre).some(...)`); guests with past/future preorders show incorrectly | Staff opens COMP screen | `isEligibleForPreorder(id, checkInDate)` checks only `occPre["night" + daysSinceCheckIn]`. Staff see only guests with tonight's preorder. | Rendering, table layout, double-click modal unchanged. | If `checkInDate` is absent for an occupant, function returns `false` (safe default). |
| Ticket item rendering | `key={it.id ?? crypto.randomUUID()}` causes remount on every render for items without `id` | Any state change in bar order | `key={it.id ?? i}` — stable index fallback; no remounts. | Item list rendering logic unchanged. | None. |
| Bleep # placeholder | `'Leave blank for "go"'` contradicts auto-fill; field is never visually blank when a bleeper is available | — | Placeholder updated to `"No bleepers available"` — visible only when `firstAvailableBleeper` is `null` (all 18 in use). | Field display logic unchanged. | None. |

## Planning Handoff
- Planning focus:
  - Bug 3+6 must be sequenced as a single atomic task or two adjacent tasks with no intermediate CI-breaking state (removing the useEffect alone with Bug 3 unfixed leaves an edge case but is not critical).
  - Bug 4 fix: restructure `isEligibleForPreorder` to accept `checkInDate`; reuse `getNightIndex` + `addDays` from existing utilities; also fix `buildRow` plan display (same pattern). Moderate effort — needs careful test fixture (multi-night preorder with today vs non-today nights).
  - Bug 5: check `BleeperResult.success` in `doConfirmPayment`; notification on failure.
  - Bugs 7, 8: trivial — single-line changes.
- Validation implications:
  - Bug 3: unit test `doConfirmPayment` with `usage === "go"` — must not call `setBleeperAvailability`.
  - Bug 4: unit test `isEligibleForPreorder` with (a) only a non-today night → false, (b) tonight's night with eligible data → true, (c) tonight's night with all NA → false.
  - Bug 5: unit test `doConfirmPayment` with `setBleeperAvailability` returning `{ success: false }` — must not call `confirmOrder`.
  - Bug 6: unit test that `bleepNumber` state starts `""` and the useEffect is not present.
  - Bug 7: render test confirming `li` keys are stable across re-renders.
  - Bug 8: snapshot or text test confirming placeholder value.
  - All existing `OrderTakingContainer` and `CompScreen` tests must pass without modification.
- Sequencing constraints:
  - Bug 3 and Bug 6 should ship in the same PR for UX completeness. They are not functionally dependent — Go mode works correctly after Bug 3 alone (the toggle in `PayModal.tsx` is independent of the bleep # field). Bug 6 removes confusing pre-fill state that persists after Bug 3 is fixed.
  - Bug 4 is independent.
  - Bugs 5, 7, 8 are independent.
  - Tests for each bug can be written alongside the fix in the same task.
- Risks to carry into planning:
  - `checkInDate` optionality for Bug 4: handle gracefully with `false` return.
  - `NotificationProviderWithGlobal` API: confirm toast call pattern from another usage site in the codebase before writing Bug 5 fix.

## Risks to Carry Forward
| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| `checkInDate` absent for active occupant in Bug 4 fix | Medium | Low | Field is optional in type; actual Firebase data may always populate it for checked-in guests | Return `false` as safe default; add test case for absent checkInDate |
| Bug 5 fix aborts order on Firebase failure — staff may lose an in-progress order | Low | Medium | Correct behaviour: don't confirm an order if bleeper reservation failed. Toast message should instruct staff to retry. | Toast message must clearly say "Try again" not just "Error" |
| Bug 3+6 interaction leaves edge case: if auto-fill useEffect is removed but Bug 3 fix not yet deployed | N/A | N/A | Both must ship in same deploy | Plan must sequence them in the same PR |

## Planning Readiness
- Status: Go
- Rationale: All 6 bugs have confirmed root causes, fix approaches are clear and localised, no open questions remain. Option A is the decisive recommendation. Engineering coverage is complete. Tests can be written with existing patterns.
