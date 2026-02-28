---
Feature-Slug: process-improvements-transitions
Status: Ready-for-planning
Outcome: planning
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Type: code-change
Primary-Skill: lp-do-build
---

# Process Improvements Transitions — Fact-Find Brief

## Scope

### Summary

The `docs/business-os/process-improvements.user.html` report is a generated static HTML file that auto-refreshes every 30 seconds via `<meta http-equiv="refresh" content="30">`. Currently, when a page reload occurs — whether from the 30-second meta-refresh, or when the operator manually opens the page — all idea cards appear instantly with no visual differentiation between cards that existed on the previous load and cards that are newly arrived or have been removed.

The goal is to add animated entry transitions for new cards (items that were not present on the previous page visit) and exit-style visual signals for cards that were removed between visits. Change detection is driven by `localStorage`, comparing the set of `idea_key` values from the previous load against the current load. This makes the report dramatically more scannable in a live-loop context where new ideas accumulate frequently.

### Goals
- New cards (not seen in the previous session) animate in with a brief fade+slide-up on first appearance.
- Removed cards (present last time, absent now) get a short-lived highlight/fade-out indicator so the operator knows the set has changed.
- Change detection is localStorage-based, using the `idea_key` field already present on every `IDEA_ITEMS` entry.
- All CSS and JS additions live inside the HTML template that the generator writes to disk — no external files.
- The generator (`generate-process-improvements.ts`) is the single source of truth: it reads the committed HTML as a template, patches the data arrays, and writes back. Adding CSS/JS to the template is therefore a static change to the HTML file itself (the generator does not strip or replace style/script blocks outside the three variable assignments).

### Non-goals
- No server-side change tracking; this is entirely client-side via localStorage.
- No animation on filter/sort changes (only on cross-reload new/gone detection).
- No support for `RISK_ITEMS` or `PENDING_REVIEW_ITEMS` animations in the first version (those lack a stable `idea_key` field — only `IDEA_ITEMS` has it).
- No changes to the generator's TypeScript logic for classification, sorting, or data collection.

### Constraints and Assumptions
- Constraints:
  - The generator's `updateProcessImprovementsHtml` function patches only the three `var NAME = [...];` array assignment blocks and the `GEN_TS` timestamp. It reads the committed HTML as a template and writes back the full file. New CSS/JS blocks added to the template are not touched by the generator — they persist across regeneration automatically.
  - The drift-check (`runCheck`) compares only the three array assignment blocks plus the JSON data file. Extra CSS/JS blocks are invisible to drift detection and will not cause false positives.
  - The HTML file is a single self-contained document (no build pipeline, no bundler). All CSS and JS must be inline.
  - The page uses `sessionStorage` for filter-state persistence (`pi-filter-biz`, `pi-filter-type`, `pi-filter-tier`). The animation system will use `localStorage` to span across page reloads (30s meta-refresh creates a new page load, not a soft navigation).
  - `localStorage` usage is already present in the file (for the dark/light theme toggle).
- Assumptions:
  - `idea_key` values are stable sha1 hashes and will not change unless the source file path or title changes.
  - The 30-second meta-refresh always reloads the committed HTML from disk — no in-memory SPA state.
  - `prefers-reduced-motion` media query should suppress animations for accessibility.

---

## Outcome Contract

- **Why:** The operator reviews this report regularly during build cycles. With 50+ idea cards that accumulate across many build cycles, distinguishing new arrivals from stable items requires manual scanning. Animations on entry and exit make the delta immediately obvious at a glance.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** After the change, when the process-improvements report reloads (auto-refresh or manual), newly added idea cards animate in with a fade+slide-up over ~350ms, and a "recently removed" indicator briefly highlights any slot where a card was present on the previous load. The operator can immediately identify the delta without manually comparing card lists.
- **Source:** auto

---

## Evidence Audit (Current State)

### Entry Points

- `docs/business-os/process-improvements.user.html` — the live operator report. Self-contained HTML+CSS+JS. 2005 lines. Contains all rendering logic inline. Auto-refreshes every 30s.
- `scripts/src/startup-loop/generate-process-improvements.ts` — the generator. Reads the HTML file as a template, patches `IDEA_ITEMS`, `RISK_ITEMS`, `PENDING_REVIEW_ITEMS` array assignments plus `GEN_TS` timestamp, writes back. No other HTML mutation occurs.

### Key Modules / Files

- `docs/business-os/process-improvements.user.html` lines 8–234: CSS `<style>` block (main styles) — the correct injection point for `@keyframes` and animation utility classes.
- `docs/business-os/process-improvements.user.html` line 236: `<style id="sl-theme-css">` — separate auto-generated theme override block. Do NOT inject animation CSS here.
- `docs/business-os/process-improvements.user.html` lines 259–2001: IIFE JavaScript block. Contains `IDEA_ITEMS` array (line 268), `render()` function (line 1811), `renderItem()` function (line 1938), `attachHandlers()` (line 1957), filter state stored in `sessionStorage` (lines 1986–1993), and initial `render()` call (line 1995).
- `scripts/src/startup-loop/generate-process-improvements.ts` lines 664–681: `replaceArrayAssignment()` — patches only `var NAME = [...];` blocks by exact string search and bracket-matching. Does not touch CSS or other JS.
- `scripts/src/startup-loop/generate-process-improvements.ts` lines 705–720: `updateProcessImprovementsHtml()` — the orchestrator. Calls `replaceArrayAssignment` three times, `updateLastClearedFooter`, and `replaceGenTs`. No other HTML sections modified.
- `scripts/src/startup-loop/generate-process-improvements.ts` lines 760–818: `runCheck()` — drift detector. Compares only the three array assignment blocks plus the JSON data file. New CSS/JS blocks will NOT trigger drift.
- `docs/business-os/_data/process-improvements.json` — companion JSON export. Contains `ideaItems`, `riskItems`, `pendingReviewItems` arrays. Not used by the HTML rendering (the HTML renders from its inline data arrays).

### Patterns and Conventions Observed

- The existing `<style>` block (lines 8–234) already uses CSS custom properties extensively and has `transition: all 0.12s` on filter buttons and `transition: opacity 0.12s, box-shadow 0.12s` on summary pills. The pattern of `transition` on interactive elements is established.
- No `@keyframes` animations exist anywhere in the file currently (confirmed by grep: 0 matches for `@keyframes`, `animation`, `fade`, `slide`).
- `localStorage` is already used for theme persistence (line 237: `sl-theme-init` script reads `localStorage.getItem("sl-theme")`). The pattern is established.
- `sessionStorage` is used for filter-state persistence across soft navigations/filter clicks (lines 1986–1993, keys `pi-filter-biz`, `pi-filter-type`, `pi-filter-tier`).
- The rendering is fully innerHTML-based: `render()` builds an HTML string, then `document.getElementById('app').innerHTML = html` (line 1934) atomically replaces the entire `<div id="app">`. There is no DOM diffing. Every render cycle creates new DOM nodes from scratch.
- `renderItem(item)` (line 1938) returns a string of form `<div class="item <type>">...</div>`. The `idea_key` field is available on every `IDEA_ITEMS` entry (line 278 et al.).
- The `idea_key` values are 40-char hex sha1 hashes (e.g., `"a4aed9470643a9a87914a09d4c222ead9419686c"`). They are stable across regenerations unless title or source path changes.
- `RISK_ITEMS` is currently an empty array `[]` (line 1708). `PENDING_REVIEW_ITEMS` has 3 entries (lines 1710–1741) but lacks `idea_key` fields.

### Data and Contracts

- Types/schemas/events:
  - `ProcessImprovementItem` interface (generator line 22): `type`, `business`, `title`, `body`, `suggested_action?`, `source`, `date`, `path`, `idea_key?`, `priority_tier?`, `own_priority_rank?`, `urgency?`, `effort?`, `proximity?`, `reason_code?`
  - `idea_key` is present on all items generated from `IDEA_ITEMS` only. It is derived as `sha1("${sourcePath}::${title}")` via `deriveIdeaKey()` (generator line 402–404).
  - `RISK_ITEMS` and `PENDING_REVIEW_ITEMS` have no `idea_key`; change-detection for those types is out of scope.
- Persistence:
  - Theme: `localStorage` key `sl-theme` (existing)
  - Filter state: `sessionStorage` keys `pi-filter-biz`, `pi-filter-type`, `pi-filter-tier` (existing)
  - Animation change-detection (to add): `localStorage` key `pi-seen-keys` — a JSON-serialized array of `idea_key` strings from the previous load.
- API/contracts:
  - No external API. The HTML file is static and fully self-contained.

### Dependency and Impact Map

- Upstream dependencies:
  - Generator script (`generate-process-improvements.ts`) must not be broken. The change is to the HTML template only; the generator's patch logic is unaffected.
  - `docs/business-os/_data/completed-ideas.json` controls which `idea_key` values are suppressed from `IDEA_ITEMS`. Items removed from IDEA_ITEMS via completion will show up as "gone" on the operator's next load — which is the correct behaviour.
- Downstream dependents:
  - `runCheck()` in the generator is the only thing that validates the HTML. It only checks array assignment blocks. No risk.
  - No tests currently cover the HTML file (confirmed: no test files reference `process-improvements.user.html`).
- Likely blast radius:
  - Contained entirely within the single HTML file. Generator TypeScript is unchanged. No other files affected.

### Delivery and Channel Landscape

- Audience/recipient: The operator (Peter) reading the report in a browser.
- Channel constraints: Static HTML, no CDN, opened directly as a file or from a local server. Must work with `file://` protocol (localStorage works under `file://` in Chrome/Firefox/Safari).
- Existing templates/assets: The `docs/templates/visual/basic-template.html` scaffold is referenced in MEMORY.md for HTML reports, but this file is a generated report, not a template-built one. The change goes into the HTML file's own `<style>` block.
- Compliance constraints: Must respect `prefers-reduced-motion` for accessibility.
- Measurement hooks: None needed; purely visual enhancement.

---

## Questions

### Resolved

- Q: Does the generator overwrite CSS and JS blocks?
  - A: No. `updateProcessImprovementsHtml` only patches three named `var NAME = [...];` array blocks, the `GEN_TS` timestamp, and the footer date string. All other HTML content, including CSS blocks and JS logic, is preserved verbatim.
  - Evidence: `generate-process-improvements.ts` lines 705–720, `replaceArrayAssignment` lines 664–681.

- Q: Does the drift check flag new CSS/JS blocks?
  - A: No. `runCheck()` compares only the three array assignment blocks (extracted via `extractArrayAssignmentBlock`) and the JSON data file. New CSS/JS blocks are invisible to the drift check.
  - Evidence: `generate-process-improvements.ts` lines 760–795.

- Q: Is there already any animation/transition/localStorage code in the HTML?
  - A: Transitions exist on filter buttons and summary pills (button hover, active states). `localStorage` exists for theme persistence. No `@keyframes`, no `animation` property, no fade/slide patterns exist anywhere in the file.
  - Evidence: grep of `process-improvements.user.html` — 0 matches for `@keyframes`, `animation`, `fade`, `slide`.

- Q: Can `localStorage` be used for cross-reload key tracking on `file://`?
  - A: Yes. `localStorage` is available under `file://` in Chrome, Firefox, and Safari (under same-origin policy for file:// — same file path = same origin). The existing theme-toggle already uses `localStorage` under this same condition.
  - Evidence: Line 237 of the HTML, which uses `localStorage` for theme persistence.

- Q: What stable identifier can be used to detect new/removed items?
  - A: `idea_key` — a sha1 hash of `sourcePath::title`, present on every IDEA_ITEMS entry. It is stable across regenerations unless title or source path changes.
  - Evidence: `generate-process-improvements.ts` lines 402–404, `renderItem` implementation and IDEA_ITEMS array data.

- Q: Does the render cycle use DOM diffing or full innerHTML replacement?
  - A: Full innerHTML replacement. `render()` builds an HTML string and sets `document.getElementById('app').innerHTML = html` atomically. There is no incremental DOM update. This means animations must be triggered *after* the innerHTML swap, not during it.
  - Evidence: `process-improvements.user.html` line 1934: `document.getElementById('app').innerHTML = html;`

- Q: Should RISK_ITEMS and PENDING_REVIEW_ITEMS also animate?
  - A: No. They have no `idea_key` field and no stable per-item identifier. They would require title-based hashing as a workaround, which adds fragility. Out of scope for this plan; IDEA_ITEMS only.
  - Evidence: Line 1708 (`RISK_ITEMS` is empty) and lines 1710–1741 (PENDING_REVIEW_ITEMS lack `idea_key`).

- Q: What happens to the animation on the very first page visit (no prior localStorage state)?
  - A: With no prior key in `pi-seen-keys`, all current items would be classified as "new" and all would animate in simultaneously. This would be visually overwhelming on first load. The correct approach is to treat a missing `pi-seen-keys` key as meaning "no animation on this load" — only update the stored set, don't animate. Animation starts from the second load onward.
  - Evidence: UX reasoning. Confirmed feasible via localStorage null-check before animation.

### Open (Operator Input Required)

None. All questions are resolvable from evidence or UX reasoning.

---

## Hypothesis and Validation Landscape

### Key Hypotheses

| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | CSS `@keyframes` fade+slide animation added to `.item.is-new` class will be visually smooth and not jarring | CSS-only, no framework | Open browser, verify visually | < 5 min |
| H2 | localStorage key set stored as JSON survives the 30s meta-refresh and correctly identifies deltas | localStorage + JSON serialization | Manual test: add an item, reload | < 10 min |
| H3 | Post-innerHTML trigger via `requestAnimationFrame` correctly causes enter animation (avoids instant-apply issue) | RAF scheduling after DOM insertion | Visual inspection | < 5 min |
| H4 | `prefers-reduced-motion` media query disabling animations works correctly | CSS media query | System-level setting toggle | < 5 min |

### Existing Signal Coverage

| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | Existing `transition` properties in CSS confirm browser rendering works in this file | `process-improvements.user.html` lines 93, 117 | High |
| H2 | Theme `localStorage` already survives reloads in this file | `process-improvements.user.html` line 237 | High |
| H3 | Standard browser RAF pattern — well-established for post-innerHTML animation triggering | MDN/browser spec | High |
| H4 | Standard CSS pattern — well-established | MDN | High |

---

## Test Landscape

### Test Infrastructure

- Frameworks: None applicable (generated static HTML, no Jest coverage)
- Commands: Manual browser open + observe
- CI integration: `runCheck()` only validates array blocks. No automated test of HTML rendering exists.

### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Generator data collection | Jest unit tests | `scripts/src/startup-loop/__tests__/generate-process-improvements.test.ts` (inferred path) | Data collection and HTML patching covered; rendering logic is in-browser JS and not covered |
| Animation/rendering | None | — | No tests exist or are needed for CSS animations |

### Coverage Gaps

- Untested paths: CSS animation correctness (intentionally not testable in Jest — browser-only)
- The `renderItem` function and `render()` function have no automated test coverage. This is pre-existing and acceptable for a single-operator internal tool.

### Recommended Test Approach

- Manual verification only: open the HTML in a browser, observe that:
  1. On first load, no animation occurs.
  2. On second load with same data, no animation occurs.
  3. After adding a new item (by running the generator with a new idea), the new card animates in on the next load.
  4. After removing an item (via completed-ideas.json), a "gone" indicator appears briefly on the next load.
  5. `prefers-reduced-motion` suppresses animation when system preference is set.

---

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Generator future change wipes the CSS/JS additions | Low | High | The generator is clearly scoped to three array patches + two string patterns. If a future developer changes the generator to do full-HTML regeneration, they would need to preserve static blocks. Document in code comment. |
| `idea_key` instability on title edit causes spurious "new" signal | Low | Low | `idea_key` is a sha1 of `sourcePath::title`. Title edits are rare and would correctly show the edited item as "new" (which is a reasonable behaviour). |
| `localStorage` unavailable (private browsing with strict settings) | Very low | Low | Guard all `localStorage` reads/writes in try/catch (pattern already established in the file). |
| First-load "all animate" problem if pi-seen-keys is absent | Certain without mitigation | Medium | Mitigated by skipping animation when `pi-seen-keys` is absent (treat null as "first visit, no animation"). |
| `requestAnimationFrame` timing causes animation to be missed on very fast renders | Very low | Low | Double-RAF (two nested `requestAnimationFrame` calls) is the standard pattern to guarantee layout is committed before class toggle. |
| Exit/gone animation for removed items is harder than entry (item no longer in DOM) | Certain — removed items are absent from the new render | Medium | Use a "ghost" card approach: after rendering new DOM, check for keys that were present last time but absent now, and briefly inject a visually-distinct placeholder card that auto-fades. This requires storing not just keys but also enough info to render a minimal placeholder (title is sufficient). |
| Large number of "new" items on first meaningful load (e.g. 50+ ideas all marked new) | Possible on first use of the feature | Medium | Stagger animation delay proportionally (e.g. 20ms per card, capped at 300ms max stagger). The delay is CSS `animation-delay` applied inline. |
| CSS animation conflicts with dark/light theme toggle | Very low | Low | Animations are opacity/transform based, not color-based. No conflict with theme CSS variables. |
| Meta-refresh timing: 30s refresh creates a new page context; sessionStorage filter is restored but animation fires again | Low | Low | Animation fires only for items whose `idea_key` was not in localStorage at load time. If no new items arrived, no animation fires. Correct behavior. |
| Ghost/gone card is confusing if operator doesn't know what it represents | Low | Low | Add a clear tooltip or label "Recently removed" to the ghost card. |

---

## Simulation Trace

| Step | What happens | Success criterion | Failure mode |
|---|---|---|---|
| 1. HTML template modification | Add `@keyframes pi-enter` + `.item.is-new` CSS to the main `<style>` block (lines 8–234). Add `@keyframes pi-gone` + `.item.is-gone` CSS for the ghost card. Add `prefers-reduced-motion` override. | CSS present in committed HTML file; generator does not remove it on next run | Generator overwrites — not possible given its scoped patch mechanism |
| 2. JS: load previous keys from localStorage | At IIFE start, before first `render()`, load `pi-seen-keys` from localStorage. If absent, set `firstVisit = true`. | `prevKeys` is a Set of idea_key strings or null | localStorage parse error — guard with try/catch |
| 3. JS: render() produces new DOM | Existing `render()` call at line 1995 runs unchanged, producing fresh DOM via `innerHTML = html` | DOM is populated with item divs containing `data-idea-key` attributes | renderItem must be modified to add `data-idea-key="..."` attribute to each `.item` div |
| 4. JS: renderItem modification | `renderItem(item)` adds `data-idea-key="${item.idea_key}"` to the outer `.item` div when `item.idea_key` exists | Each IDEA_ITEMS card has `data-idea-key` in DOM | No `idea_key` on non-idea items — acceptable, they simply don't animate |
| 5. JS: post-render animation trigger | After `innerHTML = html`, if not `firstVisit`, use double-RAF to add `.is-new` class to items whose `data-idea-key` is not in `prevKeys` | New cards get `.is-new` class; existing cards get nothing | Too-early class add before layout commit — mitigated by double-RAF |
| 6. JS: ghost cards for removed items | After render, for each key in `prevKeys` not found in current IDEA_ITEMS, inject a minimal ghost `.item.is-gone` card into the matching tier section | Ghost card appears briefly with "Recently removed" label then fades out | Identifying the correct tier section to inject into requires the previous item's tier — need to store `{key, tier, title}` tuples, not just keys |
| 7. JS: update localStorage | After triggering animations, write the current `idea_key` set to `pi-seen-keys` | localStorage updated with current keys; next load uses this as baseline | localStorage write error — guard with try/catch |
| 8. Auto-refresh (30s) | Page reloads. Step 2 reads the just-stored keys. If no new ideas arrived, no animation fires. If new ideas arrived (generator ran between reloads), the new keys animate in. | Correct delta detection | None expected |
| 9. Generator re-run | `generate-process-improvements.ts` runs, patches only array blocks and timestamps. CSS/JS additions are untouched. | HTML still contains animation CSS/JS after generator run | Not possible given generator design |
| 10. Drift check | `runCheck()` runs. Checks only array blocks + JSON file. Animation CSS/JS causes no false positive. | Check passes | Not possible given drift check scope |

**Key implementation decision from simulation:**

Step 6 reveals that to show a "gone" ghost card in the right visual position (correct tier section), the localStorage store must persist `{idea_key, priority_tier, title}` tuples, not just key strings. This is a small but important detail that informs the data shape stored in `pi-seen-keys`.

---

## Evidence Gap Review

### Gaps Addressed

- Generator patch scope confirmed (lines 664–720 of generator): CSS/JS additions in the HTML template survive regeneration.
- Drift check scope confirmed (lines 760–818): animation additions don't trigger false positives.
- Stable identifier confirmed: `idea_key` sha1 hash on every IDEA_ITEMS entry.
- localStorage pattern confirmed as established in this exact file (theme toggle).
- Full render cycle confirmed as innerHTML replacement (no DOM diffing): animations must be post-render.
- First-visit edge case identified and mitigated via null-check on `pi-seen-keys`.
- Ghost card positioning challenge identified: requires storing `{idea_key, priority_tier, title}` tuples for gone-detection.

### Confidence Adjustments

- Implementation confidence: 90% — all injection points identified, approach is proven (CSS animations + localStorage), no framework dependencies.
- Approach confidence: 85% — the ghost card approach for gone items is slightly more complex than entry animations (requires DOM injection into specific tier sections); could be simplified to a top-of-page banner listing recently removed titles instead.
- Impact confidence: 80% — the operator's actual workflow improvement depends on how frequently ideas are added/removed between reloads; with 50+ ideas currently and several new ones per build cycle, the signal is high.
- Delivery readiness: 95% — all implementation files identified, no blockers.
- Testability: 70% — visual/manual only; no automated tests applicable.

### Remaining Assumptions

- The "gone" card injection approach assumes that the tier section DOM element is queryable after `innerHTML = html` by matching `tier` value from the stored tuple. This requires that tier section headings are stable identifiers (they are text-only labels like "High — next sprint, direct path"). The implementation will need to either add `data-tier` attributes to section wrappers or match by section heading text. A simpler alternative is to show gone items in a dedicated "Recently Removed" section rather than inline in their original tier — this eliminates the section-matching problem entirely and is the recommended fallback.
- The animation stagger (20ms per card, capped) assumes that items are rendered in DOM order. Since `render()` iterates TIER_ORDER and then items within each tier, DOM order matches render order. Confirmed.

---

## Outcome Contract (Precise Specification)

### Animation Behaviour

**Entry animation (new items):**
- CSS class: `.item.is-new`
- Keyframe: `pi-enter` — opacity 0 + translateY(12px) → opacity 1 + translateY(0)
- Duration: 350ms, ease-out
- Stagger: Each new item gets `animation-delay: N * 30ms` where N is its index among new items (0, 1, 2, …), capped at 10 items max stagger (300ms max delay)
- Trigger: double-`requestAnimationFrame` after `innerHTML = html`
- Guard: skip entirely if `pi-seen-keys` absent from localStorage (first visit)
- `prefers-reduced-motion`: suppress animation (class still added but duration 0ms via media query override)

**Gone indicator (removed items):**
- Approach: inject a compact `.item.is-gone` ghost card into a dedicated "Recently Removed" section at the top of `#app`, listing title and previous tier. The ghost section auto-collapses after 6 seconds via a `setTimeout` that removes the section from the DOM.
- Ghost card content: `[title] [tier badge] — recently removed`
- Ghost section header: "Recently removed since last visit" (plain text, no system-internal terms)
- Duration: visible for 6 seconds, fades out with CSS `animation: pi-gone 6s forwards` (opacity 1 → 0 with final keyframe removing display)
- Guard: only shown if at least one gone item exists

### localStorage Change-Detection

- **Key stored:** `pi-seen-keys` in `localStorage`
- **Value format:** JSON array of objects: `[{k: "<idea_key>", t: "<priority_tier>", n: "<title>"}]`
- **Written:** after every successful render, before page unload (synchronous at end of IIFE, after animations triggered)
- **Read:** at IIFE start, before first `render()` call
- **Missing key behavior:** `firstVisit = true` → no animation, no ghost cards → write current state to localStorage

### Generator Changes Required

1. **`renderItem` function** (line 1938 of HTML): Add `data-idea-key="${esc(item.idea_key || '')}"` attribute to the outer `.item` div. This is a static change to the HTML file template — the generator will preserve it on re-runs.
2. **CSS block** (inside main `<style>` tag, after line 233 closing brace of existing CSS): Add `@keyframes pi-enter`, `.item.is-new` animation rule, `@keyframes pi-gone`, `.item.is-gone` animation rule, `@media (prefers-reduced-motion: reduce)` override.
3. **JS block** (inside the IIFE, before the `render()` call at line 1995): Add localStorage read, `prevKeys` Set construction, and `firstVisit` flag.
4. **JS block** (after `render()` and `attachHandlers()` calls at lines 1995–1935): Add post-render animation trigger function, ghost card injection, and localStorage write.

The generator TypeScript itself requires **no changes** — all modifications are to the HTML template file that the generator reads as input.

### How to Verify It Works

1. Open `docs/business-os/process-improvements.user.html` in a browser.
2. Confirm: no animation on first load (localStorage key absent).
3. Reload the page. Confirm: no animation (same data, all keys now in localStorage).
4. Run `pnpm --filter scripts startup-loop:generate-process-improvements` to regenerate (no new ideas expected unless build cycle ran). Reload. Confirm: no animation (no delta).
5. Manually add a test entry to a results-review file, regenerate. Reload. Confirm: new card animates in with fade+slide.
6. Mark that idea as complete in `completed-ideas.json`, regenerate. Reload. Confirm: "Recently removed" ghost section appears briefly and fades.
7. Verify `@media (prefers-reduced-motion: reduce)` override: enable reduced motion in OS settings, reload. Confirm: cards appear instantly (no animation).
8. Verify generator preserves changes: run the generator again after adding animations. Confirm HTML file still contains animation CSS/JS.

---

## Planning Constraints and Notes

- Must-follow patterns:
  - All CSS/JS must be inline in the HTML file (no external deps).
  - `localStorage` read/write must be guarded in try/catch (established pattern in the file).
  - Do not modify the generator's TypeScript — HTML template change only.
  - Respect `prefers-reduced-motion`.
- Rollout/rollback expectations:
  - This is a local file. Rollback = revert the HTML file to previous version. No deploy required.
- Observability expectations:
  - None beyond manual visual verification.

## Suggested Task Seeds (Non-binding)

- TASK-01: Add animation CSS (`@keyframes pi-enter`, `.item.is-new`, `@keyframes pi-gone`, `.item.is-gone`, `prefers-reduced-motion` override) to the `<style>` block in `process-improvements.user.html`.
- TASK-02: Modify `renderItem()` to add `data-idea-key` attribute; add localStorage load/write logic and `firstVisit` guard; add post-render animation trigger using double-RAF.
- TASK-03: Add ghost "Recently removed" section injection logic using `prevKeys` delta comparison.
- TASK-04: Manual verification pass per the verification checklist above.

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package: `process-improvements.user.html` committed with animation CSS/JS; generator re-run produces correct output and drift check passes.
- Post-delivery measurement plan: Visual verification by operator on next build cycle run.
