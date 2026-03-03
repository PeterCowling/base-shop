---
Feature-Slug: process-improvements-transitions
Status: Archived
Execution-Track: code
Deliverable-Type: code-change
Primary-Execution-Skill: lp-do-build
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Replan-round: 0
Foundation-Gate: Pass
Sequenced: Yes
Edge-case-review: Yes
Auto-build-eligible: Yes
Auto-Build-Intent: plan+auto
Domain: UI
Workstream: Operations
Created: 2026-02-27
Last-reviewed: 2026-02-27
Last-updated: 2026-02-27
Relates-to charter: docs/business-os/business-os-charter.md
---

# Process Improvements Transitions — Plan

## Summary

Adds animated entry and exit transitions to `docs/business-os/process-improvements.user.html` so the operator can immediately see which idea cards are new or recently removed on each page reload. Change detection is entirely client-side via `localStorage`, comparing stored `{idea_key, priority_tier, title}` tuples against the current `IDEA_ITEMS` on each load. The entire implementation is inline CSS and JS within the HTML file — the generator script is untouched and its drift check is unaffected. All changes persist across generator reruns because the generator only patches three named `var NAME = [...];` array blocks plus timestamps.

## Active tasks

- [x] TASK-01: Add animation CSS (`@keyframes pi-enter`, `@keyframes pi-gone`, `.item.is-new`, `.pi-gone-section`, `.pi-gone-card`, reduced-motion override)
- [x] TASK-02: Modify `renderItem()` to stamp `data-idea-key`; add localStorage read/write and `firstVisit` guard
- [x] TASK-03: Add post-render animation trigger and ghost "Recently removed" section
- [x] CHECKPOINT-01: Visual behaviour check before generator verification
- [x] TASK-04: Confirm generator drift-check is unaffected after all HTML changes

## Goals

- New idea cards (not present in `pi-seen-keys` localStorage) animate in with a fade+slide-up (~350ms) on page load and auto-refresh.
- A compact "Recently removed since last visit" section briefly highlights ideas that were present on the previous load but absent now, then auto-fades after 6 seconds.
- Change detection is `localStorage`-based using the stable `idea_key` sha1 field on every `IDEA_ITEMS` entry.
- All CSS and JS additions are inline in the HTML file; no external files.
- `prefers-reduced-motion` suppresses all animations.
- The generator script and its drift check require no changes.

## Non-goals

- No animation on filter/sort changes — only on cross-reload new/gone detection.
- No `RISK_ITEMS` or `PENDING_REVIEW_ITEMS` animations (those lack a stable `idea_key`).
- No server-side change tracking.
- No changes to the generator TypeScript (`generate-process-improvements.ts`).

## Constraints & Assumptions

- Constraints:
  - Generator patches only three `var NAME = [...];` array blocks + `GEN_TS` timestamp + footer date. New static CSS/JS in the HTML template are preserved verbatim across regenerations.
  - Drift check (`runCheck()`) compares only those three blocks plus the JSON data file — animation CSS/JS are invisible to it.
  - The HTML file is self-contained (no bundler, no build pipeline). All CSS and JS must be inline.
  - `localStorage` write/read must be guarded in try/catch. The IIFE theme-init script at line 237 guards its read with try/catch (`try{var t=localStorage.getItem("sl-theme")...}catch(e){}`). The new `pi-seen-keys` implementation must guard both read and write in try/catch — matching the theme-init read guard and adding a write guard that the nav theme-toggle omits.
  - The render cycle is full innerHTML replacement — animations must be triggered via double-`requestAnimationFrame` after `document.getElementById('app').innerHTML = html`.
  - Must respect `prefers-reduced-motion` media query.
- Assumptions:
  - `idea_key` sha1 hashes are stable across regenerations unless `sourcePath` or `title` changes. A title edit correctly shows the item as "new" — acceptable behaviour.
  - `localStorage` is available under `file://` protocol (confirmed by existing theme toggle usage).
  - First visit (no `pi-seen-keys` entry): skip all animation, just write current keys. Animation begins from the second load.
  - The "recently removed" ghost section is injected as a standalone section at the top of `#app` (not inline in the original tier position), avoiding any need to match tier section DOM nodes by text.
  - Stored tuple format: `[{k: "<idea_key>", t: "<priority_tier>", n: "<title>"}]` — enough to render a minimal ghost card.

## Inherited Outcome Contract

- **Why:** The operator reviews this report regularly during build cycles. With 50+ idea cards accumulating across many build cycles, distinguishing new arrivals from stable items requires manual scanning. Animations on entry and exit make the delta immediately visible at a glance.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** After the change, when the process-improvements report reloads (auto-refresh or manual), newly added idea cards animate in with a fade+slide-up over ~350ms, and a "recently removed" section briefly highlights any idea that was present on the previous load but is now absent. The operator can identify the delta without manually comparing card lists.
- **Source:** auto

## Fact-Find Reference

- Related brief: `docs/plans/process-improvements-transitions/fact-find.md`
- Key findings used:
  - Precise injection points: main `<style>` block lines 8–234; `renderItem()` at line 1938–1955; IIFE JS block at lines 259–2001; render/attachHandlers calls at lines 1995/1935.
  - Generator preserves all CSS/JS not inside the three patched array blocks (confirmed: `replaceArrayAssignment` lines 664–681, `updateProcessImprovementsHtml` lines 705–720).
  - Drift check (`runCheck` lines 760–818) is scoped to array blocks + JSON — animation additions are invisible.
  - `localStorage` pattern already established at line 237 (theme persistence) with try/catch guard.
  - Full innerHTML replacement at line 1934: animations require post-render class application via double-RAF.
  - First-visit edge case: `pi-seen-keys` absent → skip animation, write keys, animate from second load.
  - Ghost card data shape: `{k, t, n}` tuples needed (not just keys) to render a useful gone indicator.
  - `RISK_ITEMS` is empty; `PENDING_REVIEW_ITEMS` has 3 entries but lacks `idea_key` — both out of scope.

## Proposed Approach

- **Option A** (chosen): Inline CSS + JS in HTML template, `localStorage` key-set tracking with `{k,t,n}` tuples, double-RAF post-render class trigger, dedicated "Recently removed" section injected before the tier sections.
- **Option B** (rejected): Inline CSS only, no JS change-detection — would animate every card on every load, which is worse UX than no animation.
- **Chosen approach:** Option A. All evidence from fact-find confirms this is feasible with no external dependencies and no generator changes. The ghost section injection at the top of `#app` avoids the tier-matching complexity identified in the simulation trace.

## Plan Gates

- Foundation Gate: Pass — fact-find Status was Ready-for-planning; all required fields populated; no open questions.
- Sequenced: Yes — TASK-01 → TASK-02 → TASK-03 → CHECKPOINT-01 → TASK-04; each task's outputs are inputs to the next.
- Edge-case review complete: Yes — first-visit, localStorage unavailable, prefers-reduced-motion, large stagger, meta-refresh all addressed.
- Auto-build eligible: Yes — all IMPLEMENT tasks ≥85% confidence; no Needs-Input or blocking DECISION tasks.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add animation CSS keyframes and utility classes | 90% | S | Complete (2026-02-27) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Stamp `data-idea-key`; add localStorage read/write and firstVisit guard | 90% | M | Complete (2026-02-27) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Post-render animation trigger and ghost "Recently removed" section | 85% | M | Complete (2026-02-27) | TASK-02 | CHECKPOINT-01 |
| CHECKPOINT-01 | CHECKPOINT | Visual behaviour check | 95% | S | Complete (2026-02-27) | TASK-03 | TASK-04 |
| TASK-04 | INVESTIGATE | Confirm generator drift-check unaffected | 90% | S | Complete (2026-02-27) | CHECKPOINT-01 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | None | CSS-only; no JS dependencies |
| 2 | TASK-02 | TASK-01 complete | `data-idea-key` attr + localStorage logic; reads CSS class names from TASK-01 |
| 3 | TASK-03 | TASK-02 complete | Post-render trigger reads `data-idea-key` from DOM; ghost section appended after render |
| 4 | CHECKPOINT-01 | TASK-03 complete | Visual verification in browser |
| 5 | TASK-04 | CHECKPOINT-01 complete | Generator run + drift check |

## Tasks

---

### TASK-01: Add animation CSS to the `<style>` block

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `docs/business-os/process-improvements.user.html` (CSS additions only)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/business-os/process-improvements.user.html`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 90%
  - Implementation: 90% — precise injection point confirmed (after line 233, before `</style>` at line 234); CSS-only change with no runtime logic. Held-back test: the only unknown is whether the `@keyframes` name `pi-enter`/`pi-gone` conflicts with any existing animation name — grep confirms 0 existing `@keyframes` or `animation` declarations in the file, so no conflict is possible.
  - Approach: 95% — CSS `@keyframes` + opacity/transform animation is a well-established pattern. No framework or bundler involved.
  - Impact: 90% — CSS is inert until JS applies the classes in TASK-03; adding it here has zero risk to existing rendering.
- **Acceptance:**
  - `@keyframes pi-enter` block present in `<style>` block: opacity 0 + translateY(12px) → 1 + 0, 350ms ease-out.
  - `@keyframes pi-gone` block present: opacity 1 → 0 with 6s duration.
  - `.item.is-new` rule sets `animation: pi-enter 350ms ease-out forwards`.
  - `.pi-gone-section` rule defines the ghost section container style (border, background, padding, `animation: pi-gone 6s ease-in forwards`).
  - `.pi-gone-card` rule defines individual ghost card appearance (muted/dim styling, no hover effects).
  - No `.item.is-gone` class is defined — the ghost cards use `.pi-gone-card` exclusively (not a subclass of `.item`).
  - `@media (prefers-reduced-motion: reduce)` block overrides animation duration to `0.01ms` for `.item.is-new` ONLY. The `.pi-gone-section` is NOT suppressed by reduced-motion — it is a functional signal (the "recently removed" list), not a decorative animation. For reduced-motion users, the section should appear statically and be removed by the 6s `setTimeout` without a fade. The CSS fade is the animation to suppress; the section's visibility and the setTimeout removal are not animations.
  - No existing CSS declarations are altered.
  - Generator re-run after this change leaves the CSS block intact (verified via TASK-04).
- **Validation contract:**
  - TC-01: Open file in browser → existing cards render identically (no visual change without `.is-new` class applied). Pass criterion: page looks identical to pre-change.
  - TC-02: Manually add class `is-new` to a card div via browser DevTools → card fades+slides in. Pass criterion: 350ms animation visible.
  - TC-03: Enable system reduced-motion → TC-02 test shows card appearing instantly. Pass criterion: no visible animation duration.
  - TC-04: Run generator → diff the HTML file → CSS block is unchanged. Pass criterion: git diff shows only data array changes (if any).
- **Planning validation:**
  - Checks run: grep for `@keyframes`, `animation`, `fade`, `slide` in HTML file — 0 matches confirmed (fact-find evidence).
  - Validation artifacts: fact-find grep evidence section; line 234 confirmed as `</style>` end of main style block.
  - Unexpected findings: None.
- **Scouts:** None: all CSS variable names (`--bg`, `--surface`, etc.) are confirmed present in `:root` block (lines 9–40). Animation does not use any custom properties that could be undefined.
- **Edge Cases & Hardening:**
  - `prefers-reduced-motion` override sets `.item.is-new` animation duration to `0.01ms` (not `0s` — some browsers ignore `0s` for keyframe timing). Class is still applied, only duration changes.
  - `.pi-gone-section` uses `animation: pi-gone 6s ease-in forwards` so it fades to opacity 0 and stays hidden after the animation completes. For reduced-motion users, this fade animation is intentionally NOT suppressed because the section's 6s auto-removal (via `setTimeout` in TASK-03) handles its disappearance without requiring animation. The CSS `prefers-reduced-motion` override for `.pi-gone-section` should set `animation: none` and rely solely on the JS `setTimeout` to remove the section from the DOM. This preserves the functional signal (section visible for 6 seconds) without any animation.
- **What would make this >=90%:** Already at 90%. Would reach 95% after TC-01 manual browser confirmation.
- **Rollout / rollback:**
  - Rollout: edit the HTML file, add CSS block before `</style>`.
  - Rollback: revert the HTML file. No deploy required.
- **Documentation impact:** None: internal operator tool, no user-facing docs.
- **Notes / references:**
  - Injection point: line 233 ends `}` (closing `@media prefers-color-scheme` block). Insert new CSS before `</style>` at line 234.
  - `pi-` prefix used for all new class/keyframe names to avoid collisions.

---

### TASK-02: Stamp `data-idea-key`; add localStorage read/write and `firstVisit` guard

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `docs/business-os/process-improvements.user.html` (JS modifications)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `docs/business-os/process-improvements.user.html`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 90%
  - Implementation: 90% — three precise patch points identified: (a) `renderItem()` at line 1939, (b) before the `render()` call at line 1995, (c) after `render()` and `attachHandlers()` calls. All surrounding code is confirmed via file read. Held-back test: the only real unknown is whether the generator's `replaceArrayAssignment` regex could accidentally match the new `pi-seen-keys` variable name or JSON string — but the regex matches only `var UPPER_SNAKE_CASE = [...]` patterns, and `pi-seen-keys` is a string literal inside a `localStorage` call, not a variable assignment. No conflict.
  - Approach: 90% — `localStorage` JSON serialization of `{k,t,n}` tuples is the same pattern as the theme toggle. Double-RAF post-render class application is the standard browser technique for this problem.
  - Impact: 90% — `data-idea-key` attribute is additive to the `.item` div and does not affect any existing CSS or JS that selects `.item` elements.
- **Acceptance:**
  - `renderItem()` line 1939: outer `.item` div has `data-idea-key="..."` attribute stamped when `item.idea_key` is present (`idea_key || ''`).
  - Before `render()` at line 1995: IIFE contains `localStorage` read of `pi-seen-keys`; result parsed into `prevTuples` array; `firstVisit` flag set to `true` when key is absent or parse fails; `prevKeys` Set built from `prevTuples.map(function(t){return t.k;})`.
  - After `render()` + `attachHandlers()`: `localStorage` write of current IDEA_ITEMS keys as `[{k, t, n}]` tuples (guarded in try/catch).
  - `firstVisit === true` → no animation applied, no ghost section injected.
  - IDEA_ITEMS items with `idea_key` appear in DOM with correct `data-idea-key` attribute value.
- **Validation contract:**
  - TC-01: Open file in browser with DevTools. Inspect any `.item` card from the ideas section → `data-idea-key` attribute present with a 40-char hex value. Pass criterion: attribute visible in inspector.
  - TC-02: Clear `pi-seen-keys` from localStorage (DevTools). Reload. → No animation fires. `pi-seen-keys` now written to localStorage with current tuples. Pass criterion: no animation visible; localStorage entry present.
  - TC-03: Reload again (same data). → No animation fires (all keys match). Pass criterion: no animation visible.
  - TC-04: Open DevTools → Application → Local Storage → delete the `pi-seen-keys` entry, then set a new entry with the same key and value `NOT_VALID_JSON` (i.e., invalid JSON). Reload. → Page renders normally; `pi-seen-keys` is silently cleared and rewritten as a valid JSON array. No JS errors reach the console. Pass criterion: page renders correctly, console is clean, `pi-seen-keys` is a valid JSON array after reload.
  - TC-05: RISK_ITEMS and PENDING_REVIEW_ITEMS cards have no `data-idea-key` attribute (or empty string). Pass criterion: DevTools inspector shows no attribute or empty value on those cards.
- **Planning validation:**
  - Checks run: Read `renderItem()` lines 1938–1955 — confirmed `item.type`, `item.title`, `item.body`, `item.suggested_action`, `item.source`, `item.date`, `item.path` are the only fields accessed. Adding `item.idea_key` is additive.
  - Validation artifacts: lines 1938–1955 read verbatim; IDEA_ITEMS entry at line 269–284 confirms `idea_key` field is present and is a 40-char hex string.
  - Unexpected findings: None.
- **Scouts:**
  - `item.idea_key` may be undefined on RISK_ITEMS/PENDING_REVIEW_ITEMS cards → guard with `item.idea_key || ''`. Confirmed correct by fact-find: those items lack the field.
  - localStorage key `pi-seen-keys` does not collide with existing keys `sl-theme`, `pi-filter-biz`, `pi-filter-type`, `pi-filter-tier` (confirmed by grep).
- **Edge Cases & Hardening:**
  - JSON.parse failure (corrupted localStorage): catch block sets `firstVisit = true`, clears the corrupted value, and writes clean state after next render.
  - `idea_key` contains only `[0-9a-f]` hex chars — safe to embed in HTML attribute without escaping, but use `esc()` anyway for defensive consistency.
  - No localStorage write after filter-triggered `render()` calls — the write occurs only in the IIFE's top-level render (initial page load). Filter renders do not update the stored key set (no new items have arrived; no change detection needed).
- **What would make this >=90%:** Already at 90%. Would reach 95% after TC-01 and TC-02 manual browser pass.
- **Rollout / rollback:**
  - Rollout: patch `renderItem()` line 1939; add localStorage read block before line 1995; add localStorage write after line 1935.
  - Rollback: revert the HTML file.
- **Documentation impact:** None.
- **Notes / references:**
  - Exact line references: `renderItem` outer div at line 1939; `render()` call at line 1995; `attachHandlers()` call at line 1935 (inside `render()`); final IIFE statements at lines 1995–2001.
  - localStorage write placed after `render()` + `attachHandlers()` but before the `genEl.textContent` update at line 1997 — this is inside the top-level IIFE flow, not inside any filter-triggered `render()` call.

---

### TASK-03: Post-render animation trigger and ghost "Recently removed" section

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `docs/business-os/process-improvements.user.html` (JS additions after `render()` + `attachHandlers()`)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `docs/business-os/process-improvements.user.html`
- **Depends on:** TASK-02
- **Blocks:** CHECKPOINT-01
- **Confidence:** 85%
  - Implementation: 85% — the double-RAF technique is well-established, but the ghost section DOM injection involves building HTML strings and prepending to `#app` — slightly more complex than the entry animation. The `#app` container is a plain `<div>` with no structure around it (confirmed at line 249), so `insertBefore` or `prepend` will work cleanly. Held-back test: one unresolved question is whether prepending the ghost section HTML to `#app` before `attachHandlers()` re-runs (on a subsequent filter-click) would cause the ghost section to disappear — it would, because `render()` replaces `innerHTML`. This is the correct behaviour: ghost cards are only shown on the initial page load animation pass, not on filter interactions.
  - Approach: 85% — ghost section injection is the recommended "dedicated section" approach from the fact-find (avoids tier-matching complexity). The `setTimeout` 6s auto-remove is a straightforward pattern.
  - Impact: 85% — the ghost section is only shown when at least one gone key exists. Operator first sees animation starting from the second page load. The 6s auto-fade keeps the section unobtrusive.
- **Acceptance:**
  - After `render()` + `attachHandlers()`: if `firstVisit === false` and at least one new key exists (in IDEA_ITEMS but not in `prevKeys`), a double-`requestAnimationFrame` callback applies `.is-new` class + staggered `animation-delay` (index × 30ms, capped at 300ms) to each new item's DOM node via `document.querySelector('[data-idea-key="' + k + '"]')`.
  - After `render()` + `attachHandlers()`: if `firstVisit === false` and at least one gone key exists (in `prevKeys` but not in current IDEA_ITEMS key set), a `.pi-gone-section` div is prepended inside `#app`, containing `.pi-gone-card` elements for each gone item showing title + tier. The section auto-removes after 6s via `setTimeout` (regardless of animation preference — the setTimeout removal is not animation).
  - New item stagger: first new item has `animation-delay: 0ms`, second `30ms`, up to max `300ms` for item 10+.
  - Ghost section HTML has a clear "Recently removed since last visit" heading.
  - All values rendered into ghost card HTML use the existing `esc()` helper for both `n` (title) and `t` (priority_tier) fields read from localStorage tuples — treating them as untrusted on read.
  - Ghost section does not contain `data-idea-key` attributes and does not interfere with filter handlers.
  - When no new items and no gone items: no animation, no ghost section.
- **Validation contract:**
  - TC-01: Second page load with same data → no animation, no ghost section. Pass criterion: page visually identical to pre-feature state.
  - TC-02: Manually edit `pi-seen-keys` in DevTools to add a fake key `{k:"aaaa...40chars",t:"P1",n:"Test Gone Item"}`. Reload. → Ghost section appears with "Test Gone Item / P1 — recently removed". Fades out after 6s. Pass criterion: ghost section visible briefly then gone.
  - TC-03: Manually edit `pi-seen-keys` to remove one real key. Reload. → Corresponding card has `.is-new` class applied via double-RAF; card fades+slides in. Pass criterion: animation visible on that card only.
  - TC-04: Filter click after initial load. → Ghost section does not reappear. `render()` replaces `innerHTML`, removing the ghost section — this is correct. Pass criterion: ghost section absent after filter interaction.
  - TC-05: Large number of new items (manually clear all keys from `pi-seen-keys`). → Each new item has staggered delay (0ms, 30ms, 60ms… capped at 300ms). Pass criterion: stagger visible, page does not feel broken with many simultaneous animations.
  - TC-06: `prefers-reduced-motion` enabled. → `.is-new` class is added but animation is suppressed by CSS rule. Pass criterion: items appear instantly with no visible transition.
- **Planning validation:**
  - Checks run: Confirmed `#app` is a plain `<div id="app"></div>` at line 249 — no child wrappers that would interfere with `prepend()` for ghost section.
  - Confirmed that `document.querySelector('[data-idea-key="..."]')` will work after innerHTML replacement because TASK-02 stamps the attribute on each `.item` div.
  - Confirmed filter-triggered `render()` calls (lines 1962, 1971, 1981) do not go through the animation trigger block (animation trigger is top-level IIFE code, not inside `render()`).
  - Unexpected findings: None.
- **Scouts:**
  - `document.querySelector('[data-idea-key="' + k + '"]')` — key is a 40-char hex string, safe in attribute selector without escaping. Guard with null-check in case the item was filtered out of view.
  - `prepend()` method is available in all modern browsers; no polyfill needed for a local HTML tool.
  - `setTimeout` 6s auto-remove: store reference and call `clearTimeout` if somehow the section is removed earlier (e.g., page navigates away — not applicable here, but defensive).
- **Edge Cases & Hardening:**
  - Items filtered out of view (e.g., active business filter): `querySelector` returns null for those items → skip applying `.is-new` class silently (null guard).
  - Ghost section removed by `render()` on filter click — correct behaviour; ghost is a one-time signal per page load.
  - All new items on first meaningful load (when `pi-seen-keys` existed but was empty or had different keys): stagger capped at 300ms prevents a wall of animations.
- **What would make this >=90%:** Manual browser test confirming TC-02 and TC-03. The ghost section DOM injection is the main complexity; once TC-02 passes, confidence rises to 90%.
- **Rollout / rollback:**
  - Rollout: add animation trigger block and ghost section block after `render()` + `attachHandlers()` call site in IIFE.
  - Rollback: revert the HTML file.
- **Documentation impact:** None.
- **Notes / references:**
  - The animation trigger block and ghost section block are placed immediately after `attachHandlers()` inside the IIFE but before the `genEl.textContent` update at line 1997.
  - Ghost card template: `<div class="pi-gone-card"><div class="item-top"><div class="item-title">[esc(n)]</div><div class="item-badges">[esc(t)] — recently removed</div></div></div>`. Note: `.pi-gone-card` is NOT a subclass of `.item` — it is a standalone class with its own CSS.
  - All user-supplied values rendered into ghost card HTML must be escaped via the existing `esc()` helper — this covers `n` (title) and `t` (priority_tier) from stored tuples, which although originating from generator output, pass through localStorage and must be treated as untrusted on read.

---

### CHECKPOINT-01: Visual behaviour check before generator verification

- **Type:** CHECKPOINT
- **Deliverable:** updated plan evidence via manual verification result
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/process-improvements-transitions/plan.md`
- **Depends on:** TASK-03
- **Blocks:** TASK-04
- **Confidence:** 95%
  - Implementation: 95% — process is defined
  - Approach: 95% — visual check before generator verification prevents false confidence in TASK-04
  - Impact: 95% — controls downstream risk
- **Horizon assumptions to validate:**
  - `.is-new` animation fires correctly on second load (not first).
  - Ghost section appears for gone items and auto-fades after 6 seconds.
  - No JS console errors introduced by the new code.
  - `prefers-reduced-motion` suppresses animation when system preference is set.
- **Validation contract:** All four horizon assumptions confirmed via browser open + DevTools inspection. If any TC fails, replan TASK-03.
- **Planning validation:** Replan path: if ghost section DOM injection causes issues, fallback is a top-of-page banner listing titles inline (simpler but less visual). TASK-03 acceptance criteria remain the gate.
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** Plan updated with checkpoint result.

---

### TASK-04: Confirm generator drift-check is unaffected

- **Type:** INVESTIGATE
- **Deliverable:** confirmed result — generator runs cleanly, drift check passes
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `[readonly] scripts/src/startup-loop/generate-process-improvements.ts`, `[readonly] docs/business-os/process-improvements.user.html`
- **Depends on:** CHECKPOINT-01
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% — run command is known; fact-find confirmed generator scope (lines 664–720, 760–818).
  - Approach: 95% — drift check is entirely scoped to three array blocks + JSON file; CSS/JS additions are outside those blocks by construction.
  - Impact: 85% — confirming this empirically closes the only remaining residual risk.
- **Acceptance:**
  - Run `pnpm --filter scripts startup-loop:generate-process-improvements`. Exits 0; no errors thrown.
  - Run `pnpm --filter scripts check-process-improvements`. Exits 0; no drift reported.
  - Diff the HTML file after generator run: animation CSS/JS additions are present and unchanged in the diff.
- **Validation contract:**
  - TC-01: `pnpm --filter scripts startup-loop:generate-process-improvements` exits 0. Pass criterion: no error output.
  - TC-02: `pnpm --filter scripts check-process-improvements` exits 0. Pass criterion: no drift-detected output.
  - TC-03: `git diff docs/business-os/process-improvements.user.html` after generator run shows only array-block + timestamp changes (if any new ideas exist), not CSS/JS changes. Pass criterion: animation code present and unchanged in post-run file.
- **Planning validation:**
  - Checks run: Read generator lines 664–720 and 760–818 (confirmed via fact-find). Pattern confirmed: `replaceArrayAssignment` uses `var UPPER_SNAKE = [` exact string match and bracket-counting. CSS/JS blocks cannot match this pattern.
  - Script names confirmed: `startup-loop:generate-process-improvements` and `check-process-improvements` both present in `scripts/package.json`.
  - Unexpected findings: None.
- **Scouts:** None: generator scope is fully confirmed from fact-find evidence.
- **Edge Cases & Hardening:** If the generator run fails for an unrelated reason (e.g., network error fetching data), that is out of scope for this plan. The test is specifically that the animation additions do not cause generator failure.
- **What would make this >=90%:** Already at 90%. Reaches 95% after TC-01 and TC-02 empirical pass.
- **Rollout / rollback:**
  - Rollout: run generator, confirm pass.
  - Rollback: not applicable — this is a read/verify task.
- **Documentation impact:** None.
- **Notes / references:**
  - Exact generator command: `pnpm --filter scripts startup-loop:generate-process-improvements`
  - Exact drift-check command: `pnpm --filter scripts check-process-improvements`
  - Both script names confirmed in `scripts/package.json`.

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Generator future change wipes CSS/JS additions | Low | High | Add inline comment in HTML explaining that CSS/JS blocks below the `<style id="sl-theme-css">` block are static additions preserved by the generator. |
| `localStorage` unavailable (private browsing strict mode) | Very low | Low | try/catch guard on all localStorage reads/writes (TASK-02). Page renders normally without animation. |
| `idea_key` instability on title edit shows edited item as "new" | Low | Low | Acceptable behaviour — a title edit is a material change and showing it as "new" is correct. |
| Ghost section injection causes CSS conflicts | Very low | Low | Ghost section uses dedicated `.pi-gone-section` / `.pi-gone-card` class names with `pi-` prefix. No conflicts with existing `.item` CSS. |
| Double-RAF timing mismatch on very fast page renders | Very low | Low | Double-RAF is the standard reliable pattern for post-innerHTML animation. No known browser issue. |

## Observability

- Logging: None — internal operator tool.
- Metrics: None — purely visual enhancement.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)

- [ ] On first page load (no `pi-seen-keys` in localStorage): no animation fires; localStorage written with current idea keys.
- [ ] On second page load (same data): no animation fires; all keys matched.
- [ ] After generator adds a new idea: new card animates in with fade+slide-up (~350ms) on next load.
- [ ] After idea removed via `completed-ideas.json`: "Recently removed since last visit" section appears briefly on next load and fades after 6 seconds.
- [ ] `prefers-reduced-motion` enabled: all animations suppressed; page renders instantly.
- [ ] Generator re-run after implementing all changes: animation CSS/JS intact; drift check passes.
- [ ] No JS console errors on any load path.

## Decision Log

- 2026-02-27: Ghost card injection approach chosen as dedicated top-of-page "Recently removed" section (not inline in original tier position) — avoids tier-section DOM matching complexity identified in fact-find simulation trace.
- 2026-02-27: `firstVisit` → no animation policy confirmed — prevents visually overwhelming all-cards-animate on first feature deployment.
- 2026-02-27: Stored tuple format `{k, t, n}` confirmed (not keys-only) to support rendering ghost card title and tier in the gone section.

## Overall-confidence Calculation

- TASK-01: confidence 90%, effort S=1
- TASK-02: confidence 90%, effort M=2
- TASK-03: confidence 85%, effort M=2
- CHECKPOINT-01: confidence 95%, effort S=1 (procedural; not weighted)
- TASK-04: confidence 90%, effort S=1

Weighted average (IMPLEMENT tasks only):
- Sum(confidence × effort): (90×1) + (90×2) + (85×2) + (90×1) = 90 + 180 + 170 + 90 = 530
- Sum(effort): 1+2+2+1 = 6
- Overall: 530/6 = 88.3% → **88%**

## Consumer Tracing

- TASK-01 outputs (CSS classes `is-new`, `pi-gone-section`, `pi-gone-card`, keyframes `pi-enter`, `pi-gone`):
  - Consumed by TASK-03 (JS applies these classes to DOM elements).
  - No other consumers — safe.
- TASK-02 outputs (`data-idea-key` attribute on `.item` divs):
  - Consumed by TASK-03 (`document.querySelector('[data-idea-key="..."]')` to apply `.is-new` class).
  - No other consumers — safe.
- TASK-02 outputs (localStorage `pi-seen-keys`):
  - Consumed by itself on next page load (read → `prevKeys` Set construction).
  - Consumed by TASK-03's gone-detection logic (compare `prevKeys` against current IDEA_ITEMS).
  - No other consumers — safe.

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Add CSS keyframes and classes | Yes — `</style>` injection point confirmed at line 234; no existing `@keyframes` names to conflict | None | No |
| TASK-02: Stamp `data-idea-key`; add localStorage logic | Yes — TASK-01 provides class names for reference; `renderItem()` line 1939 confirmed; localStorage pattern established | None | No |
| TASK-03: Post-render animation trigger + ghost section | Yes — TASK-02 provides `data-idea-key` attrs in DOM and `prevKeys` Set; `#app` div confirmed as plain container at line 249 | Minor: items filtered out of view return null from `querySelector` — mitigated by null guard in TASK-03 acceptance | No |
| CHECKPOINT-01: Visual check | Yes — TASK-03 complete; browser open sufficient | None | No |
| TASK-04: Generator drift-check | Yes — HTML file complete after TASK-03; generator run command known | None | No |

## Section Omission Rule

- Supporting-Skills: None — self-contained HTML file, no cross-package dependencies.
- Startup-Deliverable-Alias: none — this is an internal operator tooling improvement.
