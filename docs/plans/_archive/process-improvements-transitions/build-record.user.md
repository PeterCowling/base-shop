---
Status: Complete
Feature-Slug: process-improvements-transitions
Completed-date: 2026-02-27
artifact: build-record
---

# Build Record — Process Improvements Transitions

## What Was Built

Animated entry and exit transitions were added inline to `docs/business-os/process-improvements.user.html`. The operator report now detects which idea cards are new or recently removed on each page reload, using `localStorage` to compare the current idea set against the previous visit.

**TASK-01 — Animation CSS:** Two `@keyframes` blocks (`pi-enter` and `pi-gone`) were inserted into the main `<style>` block. `pi-enter` fades and slides a card up over 350ms (opacity 0 + translateY(12px) to opacity 1 + translateY(0)). `pi-gone` fades the recently-removed ghost section out over 6 seconds. Supporting classes `.item.is-new`, `.pi-gone-section`, and `.pi-gone-card` were added, along with a `prefers-reduced-motion` override that suppresses the `.item.is-new` animation duration. The ghost section's 6s fade is also overridden to `animation: none` under reduced motion — its removal is handled by the `setTimeout` in JS, which fires regardless.

**TASK-02 — `data-idea-key` stamping and localStorage logic:** `renderItem()` was patched to stamp a `data-idea-key` attribute on every idea card's outer `.item` div (guarded with `item.idea_key || ''`). Before the top-level `render()` call in the IIFE, a localStorage read of `pi-seen-keys` was added: the stored JSON is parsed into `prevTuples` ({k, t, n} per entry), a `prevKeys` Set is constructed, and a `firstVisit` flag is set to `true` if the key is absent or parse fails. After `render()` and `attachHandlers()`, the current IDEA_ITEMS keys are written back to `pi-seen-keys` as `{k, t, n}` tuples. All localStorage reads and writes are wrapped in try/catch.

**TASK-03 — Post-render animation trigger and ghost section:** Immediately after `attachHandlers()`, a double-`requestAnimationFrame` callback applies `.is-new` and a staggered `animation-delay` (index × 30ms, capped at 300ms) to each new card's DOM node via `document.querySelector('[data-idea-key="..."]')`. When gone keys exist (keys in `prevKeys` absent from the current IDEA_ITEMS), a `.pi-gone-section` div is prepended to `#app` containing `.pi-gone-card` elements for each removed idea (title and priority tier). The section auto-removes from the DOM after 6 seconds via `setTimeout`. All values rendered into ghost card HTML pass through the existing `esc()` helper. Neither block fires on a first visit (`firstVisit === true` guard).

**CHECKPOINT-01 — Browser check:** Page loaded with 85 cards, no console errors. New-card animation confirmed on second load. Ghost section appeared and faded after 6 seconds. First-visit no-animation guard confirmed.

**TASK-04 — Generator drift-check:** Generator re-run completed. All 19 animation identifiers (keyframe names, class names, JS variable names) survived the re-run intact. Drift check reported CHECK OK. The generator's `replaceArrayAssignment` regex targets only `var UPPER_SNAKE_CASE = [...]` blocks — animation CSS and JS are outside those blocks and are invisible to the patcher.

## Tests Run

| Command | Outcome |
|---|---|
| `pnpm --filter scripts startup-loop:generate-process-improvements` | Pass — exit 0, no errors |
| `pnpm --filter scripts check-process-improvements` | Pass — CHECK OK, no drift |
| Browser checkpoint (manual) | Pass — 85 cards loaded, no console errors |

## Validation Evidence

| Task | Contract | Result |
|---|---|---|
| TASK-01 | TC-01: page renders identically without `.is-new` applied | Pass |
| TASK-01 | TC-02: DevTools class injection shows 350ms fade+slide-up | Pass |
| TASK-01 | TC-03: generator run leaves CSS block unchanged | Pass (TASK-04) |
| TASK-02 | TC-01: `data-idea-key` attribute visible on `.item` divs in inspector | Pass |
| TASK-02 | TC-02: clearing `pi-seen-keys` → no animation fires; entry rewritten | Pass |
| TASK-02 | TC-03: second reload with same data → no animation | Pass |
| TASK-03 | TC-01: second load with same data → no ghost section | Pass |
| TASK-03 | TC-02: fake gone key in `pi-seen-keys` → ghost section appears, fades after 6s | Pass |
| TASK-03 | TC-03: key removed from `pi-seen-keys` → corresponding card animates in | Pass |
| CHECKPOINT-01 | All horizon assumptions | Pass |
| TASK-04 | TC-01: generator exits 0 | Pass |
| TASK-04 | TC-02: drift check exits 0 (CHECK OK) | Pass |
| TASK-04 | TC-03: 19 animation identifiers present and unchanged post-run | Pass |

## Scope Deviations

None.

## Outcome Contract

- **Why:** The operator reviews this report regularly during build cycles. With 50+ idea cards accumulating across many build cycles, distinguishing new arrivals from stable items requires manual scanning. Animations on entry and exit make the delta immediately visible at a glance.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** After the change, when the process-improvements report reloads (auto-refresh or manual), newly added idea cards animate in with a fade+slide-up over ~350ms, and a "recently removed" section briefly highlights any idea that was present on the previous load but is now absent. The operator can identify the delta without manually comparing card lists.
- **Source:** auto

## Build Summary

- **Commit:** d27c88626d
- **File changed:** `docs/business-os/process-improvements.user.html` (+134 lines)
- **Tasks completed:** TASK-01, TASK-02, TASK-03, CHECKPOINT-01, TASK-04
- **Generator re-run:** Pass (CHECK OK, 19 animation identifiers confirmed surviving re-run)
- **Browser checkpoint:** Pass (85 cards loaded, no console errors)
