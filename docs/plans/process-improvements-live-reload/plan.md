---
Type: Plan
Status: Active
Domain: BOS
Workstream: Engineering
Created: 2026-02-26
Last-reviewed: 2026-02-26
Last-updated: 2026-02-26
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: process-improvements-live-reload
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 93%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Process Improvements Live Reload — Plan

## Summary

`docs/business-os/process-improvements.user.html` is a static file opened via `file://` URL in the browser. After a build cycle regenerates the file, the operator must manually reload the browser tab to see the updated data. This plan adds two changes: (1) the generator embeds a millisecond-precision timestamp (`GEN_TS`) on every run, allowing the page to display when content was last generated; and (2) the HTML gains a `<meta http-equiv="refresh" content="30">` tag that reloads the page every 30 seconds, plus sessionStorage persistence for the active filter state so the operator's filter selection survives the reload. Together these changes mean the operator sees refreshed data automatically without any manual action and without losing their active filter.

## Active Tasks
- [ ] TASK-01: Generator — embed millisecond-precision generation timestamp (`GEN_TS`)
- [ ] TASK-02: HTML — add meta refresh and sessionStorage filter persistence

## Goals
- The page auto-refreshes every 30 seconds with the latest data from disk, on both Safari and Chrome under `file://`, with no browser flags required
- Active business/type filter selection persists across the meta-refresh reloads via sessionStorage
- The footer shows when content was generated (from `GEN_TS`) rather than when the browser opened the tab
- The generator's `--check` drift detection mode continues to pass after this change (GEN_TS excluded from drift comparison)

## Non-goals
- Polling or file-watching approaches (fetch-based, XMLHttpRequest, FileSystemObserver) — confirmed unreliable on Chrome under `file://`
- Changes to any other `*.user.html` BOS dashboards
- Changes to the companion JSON file (`_data/process-improvements.json`) or its generation logic
- Any server-side or HTTP-served deployment requirement

## Constraints & Assumptions
- Constraints:
  - The meta refresh interval is fixed at 30 seconds — long enough to avoid disruptive flicker but short enough to catch regenerations promptly
  - `GEN_TS` must NOT be included in the `runCheck()` array-block comparison (it changes on every run by design, same as the `Last cleared` footer date)
  - The HTML file is committed to the repo; changes to the static structure (meta tag, sessionStorage code) persist across generator runs because the generator only overwrites the three array blocks and the `Last cleared` footer
  - sessionStorage semantics are correct: persists within the tab across same-tab reloads, cleared when the tab is closed
- Assumptions:
  - The generator is always run from the `scripts/` directory (confirmed: `runCli()` uses `path.resolve(process.cwd(), "..")`), so `new Date().toISOString()` gives the correct UTC timestamp
  - The placeholder value `"1970-01-01T00:00:00.000Z"` is safe to commit — it is a valid ISO string that the footer date display code can parse without error

## Inherited Outcome Contract
- **Why:** The operator opens the process improvements dashboard while working through a build cycle. After the generator runs (e.g. via pre-commit hook), the browser shows stale data unless they manually reload — a friction point that causes the operator to miss freshly surfaced ideas and risks.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** After this plan is built, opening `process-improvements.user.html` in a browser tab results in the page auto-refreshing every 30 seconds with the latest generated data, preserving any active filter, and showing the generation timestamp in the footer.
- **Source:** auto

## Fact-Find Reference
- Related brief: `docs/plans/process-improvements-live-reload/fact-find.md`
- Key findings used:
  - `fetch()` / XHR to `location.href` are blocked on Chrome under `file://` by default — rules out polling approaches
  - `<meta http-equiv="refresh">` is universally supported, no CORS restrictions, no browser flags needed
  - `activeBusiness` and `activeType` are currently in-memory closure variables only — sessionStorage is the correct lightweight persistence layer for same-tab reload survival
  - The `runCheck()` function already skips the `Last cleared` footer by comparing only the three array blocks — `GEN_TS` must follow the same exclusion pattern

## Proposed Approach
- Option A: fetch-based polling — rejected (Chrome blocks file:// fetch by default)
- Option B: meta refresh + sessionStorage filter persistence + GEN_TS in generator — chosen
- Option C: meta refresh only (no filter persistence) — rejected (filter state loss is disruptive)
- **Chosen approach:** Option B. The meta refresh handles the reload mechanism universally. sessionStorage handles filter state. GEN_TS gives the footer a generation signal and replaces the current open-time display. All changes are minimal and self-contained.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes — TASK-01 must land before TASK-02 because TASK-02 references `GEN_TS` in the footer update
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Embed GEN_TS timestamp in generator and HTML template | 95% | S | Pending | - | TASK-02 |
| TASK-02 | IMPLEMENT | Add meta refresh + sessionStorage filter persistence to HTML | 92% | S | Pending | TASK-01 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Generator change + placeholder in HTML |
| 2 | TASK-02 | TASK-01 complete | Meta tag + sessionStorage + footer using GEN_TS |

## Tasks

### TASK-01: Generator — embed millisecond-precision generation timestamp
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `scripts/src/startup-loop/generate-process-improvements.ts` + `docs/business-os/process-improvements.user.html` (GEN_TS placeholder)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/generate-process-improvements.ts`, `docs/business-os/process-improvements.user.html`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 95%
  - Implementation: 95% — `replaceGenTs()` is a straightforward string replacement following the exact pattern of `updateLastClearedFooter()`; `GEN_TS` exclusion from `runCheck()` is already handled by the existing architecture (only array blocks are compared)
  - Approach: 95% — millisecond ISO timestamp is the only unambiguous per-run signal; approach confirmed in fact-find
  - Impact: 95% — purely additive; no existing behaviour changed
- **Acceptance:**
  - After running the generator, `docs/business-os/process-improvements.user.html` contains `var GEN_TS = "2026-…Z";` with a full ISO millisecond timestamp (not the placeholder `1970-01-01T00:00:00.000Z`)
  - Running the generator twice within the same second produces different GEN_TS values (millisecond precision)
  - Running `pnpm --filter scripts startup-loop:generate-process-improvements -- --check` exits 0 (no drift detected)
  - The `runCheck()` function does NOT compare the `GEN_TS` line — it only compares `IDEA_ITEMS`, `RISK_ITEMS`, and `PENDING_REVIEW_ITEMS` array blocks
- **Validation contract:**
  - TC-01: Run generator → HTML contains `var GEN_TS = "20` (2026 prefix) → pass
  - TC-02: Run `--check` after generator → exits 0 → pass
  - TC-03: Manually set GEN_TS to stale value in HTML → run `--check` → still exits 0 (GEN_TS excluded from check)
- **Execution plan:** Add `var GEN_TS = "1970-01-01T00:00:00.000Z";` to the HTML script block above IDEA_ITEMS. Add `replaceGenTs()` to generator. Call from `updateProcessImprovementsHtml()`. Verify `runCheck()` is unaffected (it only iterates the three named array variables).
- **Edge Cases & Hardening:** If `GEN_TS` placeholder is absent from HTML, `replaceGenTs()` should log a warning and return html unchanged (non-fatal) — same graceful behaviour as `updateLastClearedFooter()` which returns early if pattern not found.
- **Rollout / rollback:**
  - Rollout: committed alongside other changes; pre-commit hook auto-stages the HTML
  - Rollback: revert `generate-process-improvements.ts` change and remove `var GEN_TS` line from HTML
- **Notes / references:**
  - `updateLastClearedFooter()` at line 502 of the generator is the direct model for `replaceGenTs()`
  - `runCheck()` at line 557 iterates only `["IDEA_ITEMS", "RISK_ITEMS", "PENDING_REVIEW_ITEMS"]` — GEN_TS is automatically excluded because it is not in that list

### TASK-02: HTML — add meta refresh and sessionStorage filter persistence
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `docs/business-os/process-improvements.user.html` (static code sections; not touched by generator)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/business-os/process-improvements.user.html`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 92%
  - Implementation: 92% — all three sub-changes are standard browser JS with no library dependencies; sessionStorage API is universal
  - Approach: 95% — confirmed cross-browser in fact-find; meta refresh is the only approach that works on both Safari and Chrome under file://
  - Impact: 90% — small risk that sessionStorage read before render could restore a stale filter key for a business that no longer appears in the data; mitigated by the filter bar rendering ALL data if activeBusiness doesn't match any item (graceful degradation)
- **Acceptance:**
  - `<meta http-equiv="refresh" content="30">` is present in `<head>`
  - After clicking a filter button, the sessionStorage keys `pi-filter-biz` and `pi-filter-type` are updated (verifiable in browser DevTools)
  - Reloading the page (manually or via meta refresh) restores the previously selected filter
  - The `#footer-generated` span displays "Generated: DD/MM/YYYY, HH:MM:SS — auto-refreshes every 30s" (using GEN_TS, not open-time)
  - Running `pnpm --filter scripts startup-loop:generate-process-improvements -- --check` still exits 0 (static HTML changes are not part of the drift check)
- **Validation contract:**
  - TC-01: Open file in browser → wait 30s → page reloads → filter state preserved → pass
  - TC-02: Set filter to BRIK → reload manually → BRIK filter still active → pass
  - TC-03: Footer shows "Generated: …" with a timestamp that matches GEN_TS (not the current time) → pass
  - TC-04: Run `--check` → exits 0 → pass (static HTML changes are outside the drift check scope)
- **Execution plan:**
  1. Add `<meta http-equiv="refresh" content="30">` after the existing `<meta name="viewport">` tag in `<head>`
  2. Add sessionStorage write calls in `attachHandlers()` after `activeBusiness` / `activeType` are updated
  3. Add sessionStorage read and restore before the `render()` call
  4. Update `#footer-generated` to display `'Generated: ' + new Date(GEN_TS).toLocaleString('it-IT', {...}) + ' — auto-refreshes every 30s'`
- **Edge Cases & Hardening:**
  - If sessionStorage is unavailable (private browsing in some browsers), wrap reads/writes in try/catch — silently fall back to default ALL/all filters
  - If `GEN_TS` is the placeholder epoch value (`1970-01-01`), the footer date display will show an obviously old date — acceptable since this only appears before the generator has run once
- **Rollout / rollback:**
  - Rollout: static HTML edits — no build step required; changes survive generator re-runs because the generator only replaces array blocks and the Last cleared footer
  - Rollback: revert the HTML edits

## Risks & Mitigations
- **Risk**: Generator re-run overwrites sessionStorage-related JS code — **Mitigated**: generator only replaces `var IDEA_ITEMS`, `var RISK_ITEMS`, `var PENDING_REVIEW_ITEMS` array blocks and the `Last cleared` footer text. All other code is preserved verbatim.
- **Risk**: `<meta http-equiv="refresh">` causes disruptive page flicker if the page is open and actively being used — **Mitigated**: 30-second interval is long enough that most operator interactions complete well within a single cycle; the filter state is preserved so context is not lost.
- **Risk**: `runCheck()` starts failing because GEN_TS changes on every run — **Mitigated by design**: `runCheck()` only compares the three named array blocks; GEN_TS is a separate variable not in the check loop.

## Observability
- Logging: generator already logs `[generate-process-improvements] updated …`; no additional logging needed
- Metrics: None: tool is a local file; no telemetry infrastructure
- Alerts/Dashboards: None: local file dashboard

## Acceptance Criteria (overall)
- [ ] `var GEN_TS = "2026-…Z";` present in the committed HTML with a fresh timestamp after each generator run
- [ ] `<meta http-equiv="refresh" content="30">` present in `<head>` of the committed HTML
- [ ] Filter state (business + type) persists across a manual page reload when sessionStorage is available
- [ ] `#footer-generated` shows the GEN_TS-based generation time, not the browser open-time
- [ ] `pnpm --filter scripts startup-loop:generate-process-improvements -- --check` exits 0

## Decision Log
- 2026-02-26: Chose meta refresh + sessionStorage over fetch-based polling. Chrome blocks file:// fetch by default; meta refresh is universally supported. Decision confirmed by fact-find section 2.

## Overall-confidence Calculation
- TASK-01: 95% × S(1) = 95
- TASK-02: 92% × S(1) = 92
- Overall: (95 + 92) / 2 = **93%**
