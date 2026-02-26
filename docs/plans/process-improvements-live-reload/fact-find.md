---
Plan: process-improvements-live-reload
Status: Ready-for-planning
Type: fact-find
Date: 2026-02-26
---

# Fact-Find: Auto-Reload for process-improvements.user.html

## Goal

When the operator has `docs/business-os/process-improvements.user.html` open in a browser via `file://` URL on macOS, the page should automatically detect that the file has been regenerated and refresh its content — without the operator manually hitting reload and without discarding active filter state.

---

## 1. Current HTML Structure (confirmed from source)

File: `docs/business-os/process-improvements.user.html`

**Key structural facts:**

- All data is **inline** in the HTML as three JS variable assignments: `var IDEA_ITEMS = [...];`, `var RISK_ITEMS = [...];`, `var PENDING_REVIEW_ITEMS = [...];`. These are replaced in-place by the generator on each run.
- The footer contains a `Last cleared: YYYY-MM-DD` text string (line 239) — this is updated by `updateLastClearedFooter()` in the generator whenever the file is regenerated. It is a date-only value (YYYY-MM-DD), not a timestamp.
- There is a second footer span `<span id="footer-generated">` (line 240) that is set to the current wall-clock time **when the browser opens the page** (`new Date().toLocaleString(…)` at line 947). This is a client-side open-time stamp, not a generation signal.
- There is **no embedded generation ID, no millisecond-precision timestamp, no content hash** in the HTML that uniquely identifies a specific regeneration run.
- Filter state (`activeBusiness`, `activeType`) is stored in **plain JS closure variables** — purely in-memory. There is no localStorage or sessionStorage used for filter state. Only the dark/light theme preference is persisted in `localStorage` (key `sl-theme`).

**What the generator writes (confirmed from `generate-process-improvements.ts`):**

- Generator writes atomically via `writeFileSync(tempPath)` + `renameSync(tempPath, filePath)` (lines 617-621).
- It also writes a companion JSON file: `docs/business-os/_data/process-improvements.json` — same data, always in sync with the HTML (lines 635-636).
- The generator is invoked from `scripts/src/startup-loop/generate-process-improvements.ts`. The pre-commit hook auto-stages the result.

---

## 2. Browser API Assessment Under file://

### fetch() to location.href
- **Safari (macOS)**: Allowed. Same-origin `file://` fetch works — Safari treats same-directory file:// URLs as same-origin.
- **Chrome (macOS)**: **Blocked by default.** Chrome applies CORS restrictions to file:// that prohibit cross-origin fetch, and same-origin file:// requests are also blocked by Chrome's renderer security policy (`Access to XMLHttpRequest at 'file://...' from origin 'null' has been blocked by CORS policy`). Requires launching Chrome with `--allow-file-access-from-files` flag.
- **Verdict**: fetch() to location.href is **not cross-browser reliable** under file:// on macOS without a flag.

### XMLHttpRequest to location.href
- Same CORS/security policy as fetch() in both browsers. Chrome blocks it identically.
- **Verdict**: Same failure as fetch() on Chrome.

### `<meta http-equiv="refresh" content="N">`
- Works universally in all browsers, no CORS, no security policy.
- **Downside**: Full page reload on every tick — resets in-memory filter state (`activeBusiness`, `activeType`) back to defaults (`'ALL'` and `'all'`).
- **Verdict**: Works cross-browser but destroys filter state on each refresh.

### FileSystemObserver / FileSystemHandle / FileSystemDirectoryHandle
- Requires an explicit user gesture (button click or file picker interaction) to grant access. Cannot be used for automatic background polling.
- **Verdict**: Not usable for auto-detection without operator action.

### Custom scheme / Service Worker
- Not applicable under file://.

### Hybrid: meta refresh + filter state preservation via URL hash or localStorage
- `<meta http-equiv="refresh">` reloads the whole document. Before reload, filter state could be **written to sessionStorage or localStorage** in an `unload`/`beforeunload` handler. On load, the page reads and restores those values before rendering.
- This approach is universally cross-browser, requires zero CORS privileges, works under file://, and preserves user-selected filters across the hard reload.
- **Verdict: this is the correct mechanism.** It is the only approach that works on both Safari and Chrome under file:// on macOS without any browser flags or user gestures.

---

## 3. Existing Polling / Refresh in Other BOS Dashboards

Searched all `*.user.html` files in `docs/business-os/` for: `setInterval`, `setTimeout`, `fetch.*location`, `XMLHttpRequest`, `polling`, `auto.*reload`, `auto.*refresh`, `FileSystem`, `watchFile`.

**Finding**: No other BOS dashboard uses any polling or auto-refresh mechanism. The `ideas.user.html` dashboard explicitly includes a user-facing error message telling the operator to serve via HTTP when running under file:// (because it needs `fetch()` to load `queue-state.json`). There is no precedent to reuse.

---

## 4. Change Signal: What Can We Poll?

The HTML needs a way to detect that the file on disk has changed since the page was loaded.

**Option A — Companion JSON file (`_data/process-improvements.json`)**
- The generator always writes this file in sync with the HTML. It contains the full data.
- Under Safari, `fetch('./business-os/_data/process-improvements.json', { cache: 'no-store' })` would succeed, allowing a content-hash comparison. But this fails on Chrome under file://.
- Not viable for cross-browser.

**Option B — Embed a generation timestamp in the HTML itself**
- The generator already sets a `Last cleared: YYYY-MM-DD` date in the footer. This is **date-only precision**, meaning multiple regenerations on the same day produce no change in this signal — it cannot distinguish runs.
- A **millisecond-precision ISO timestamp** embedded as a JS variable (e.g., `var GEN_TS = "2026-02-26T09:11:16.107Z";`) would change on every regeneration. The meta-refresh reload would re-parse the inline data, and on load the page can compare the new `GEN_TS` against the previously saved value in sessionStorage to show a "content refreshed" indicator (or simply let the reload be implicit).

**Option C — Use only the meta refresh (no change detection)**
- Since the full page is reloaded by meta refresh, change detection is not strictly needed. The reload always gets fresh inline data from disk. Filter state is restored from sessionStorage/localStorage. The operator simply sees refreshed content after N seconds, filter intact.
- The only downside is spurious reloads when nothing has changed (e.g., every 30 seconds while the file hasn't been regenerated). This is acceptable — the reload is fast (no network, pure file I/O).

**Recommended approach**: Option C (simple meta refresh interval of 30 seconds) plus Option B (embed `GEN_TS` to optionally show a "refreshed" toast). The meta refresh handles the mechanism; `GEN_TS` gives the page a way to show feedback to the operator ("content updated at 09:11").

---

## 5. Filter State Persistence

**Current state**: `activeBusiness` and `activeType` are **in-memory closure variables only**. They are not persisted anywhere. The theme preference (`sl-theme`) uses `localStorage`. No `sessionStorage` is used by this page.

**What should happen on reload**: Filter state should be restored to what the operator last selected, so a background refresh does not visually interrupt them.

**Implementation**: Before the meta-refresh fires (or unconditionally on every filter change), write `activeBusiness` and `activeType` to `sessionStorage` under keys specific to this page (e.g., `pi-filter-biz` and `pi-filter-type`). On page load, read these keys before calling `render()`. `sessionStorage` persists across same-tab reloads but is cleared when the tab is closed — correct semantics for this use case.

---

## 6. Implementation Plan

### Task 1 — Embed a generation timestamp in the HTML template and generator

**File changed**: `docs/business-os/process-improvements.user.html` (the template) and `scripts/src/startup-loop/generate-process-improvements.ts`.

**What to add to the HTML**: A JS variable assignment near the top of the main script block:

```js
var GEN_TS = "1970-01-01T00:00:00.000Z";
```

This line acts as a placeholder; the generator replaces it on each run with the current `new Date().toISOString()`.

**What to add to the generator**: A new `replaceGenTs()` function mirroring `replaceArrayAssignment()` — regex-replaces the `GEN_TS` value in the HTML string. Called from `updateProcessImprovementsHtml()`. The generator already uses `dateIso` (YYYY-MM-DD) for the footer; `GEN_TS` should use full ISO millisecond precision from `new Date().toISOString()`.

**Why**: Gives the page an unambiguous signal that it has reloaded with fresh content, enabling a lightweight "refreshed at HH:MM:SS" indicator in the footer.

**Acceptance criteria**:
- After running the generator, the HTML contains `var GEN_TS = "2026-02-26T…Z";` with a fresh timestamp.
- The generator's `--check` mode (used by pre-commit hook) accounts for `GEN_TS` drift in the same way it currently skips the `Last cleared` footer (i.e., `GEN_TS` is excluded from drift detection — it changes by design on every run).

Note: The `--check` mode already intentionally ignores `Last cleared` by only comparing the three array variable blocks (`IDEA_ITEMS`, `RISK_ITEMS`, `PENDING_REVIEW_ITEMS`). `GEN_TS` must be similarly excluded — do not include it in the `runCheck()` comparison loop.

### Task 2 — Add meta refresh + filter state persistence to the HTML

**File changed**: `docs/business-os/process-improvements.user.html` (the template only — not the generator, which regenerates only the data array blocks and `GEN_TS`).

**Changes to the HTML**:

1. Add `<meta http-equiv="refresh" content="30">` in `<head>`. Interval of 30 seconds is appropriate — regeneration happens at most every few minutes.

2. Modify `attachHandlers()`: after updating `activeBusiness` / `activeType`, write both to `sessionStorage`:
   ```js
   sessionStorage.setItem('pi-filter-biz', activeBusiness);
   sessionStorage.setItem('pi-filter-type', activeType);
   ```

3. Before the initial `render()` call (line 943), read sessionStorage to restore filter state:
   ```js
   var savedBiz = sessionStorage.getItem('pi-filter-biz');
   var savedType = sessionStorage.getItem('pi-filter-type');
   if (savedBiz) activeBusiness = savedBiz;
   if (savedType) activeType = savedType;
   ```

4. Update `#footer-generated` to show both the open-time and the generation timestamp:
   ```js
   genEl.textContent = 'Generated: ' + new Date(GEN_TS).toLocaleString('it-IT', {…}) + ' — auto-refreshes every 30s';
   ```

**Acceptance criteria**:
- Opening the file in Chrome and Safari and regenerating within 30 seconds causes the page to reload with fresh data.
- After clicking a filter button, regenerating, and waiting for the reload, the same filter is still active after the reload.
- The `Last cleared` footer date reflects the new generation date.
- The footer shows the correct generation time from `GEN_TS`.

---

## 7. What Does NOT Need to Change

- The generator's `runCheck()` / drift detection mode: it already skips the footer date and only compares the three array assignment blocks. `GEN_TS` simply needs to be added to the exclusion (same pattern).
- The companion JSON file (`_data/process-improvements.json`): no changes needed — it is not referenced by the polling mechanism.
- The nav bar or theme toggle: no changes needed.
- Any other `*.user.html` files: this change is scoped to `process-improvements.user.html` only.

---

## 8. Summary of Findings

| Question | Answer |
|---|---|
| Mechanism that works on Safari AND Chrome under file:// | `<meta http-equiv="refresh" content="30">` — universal, no CORS, no flags |
| Why not fetch() polling? | Chrome blocks file:// fetch by default; only works in Safari or with --allow-file-access-from-files |
| Change signal | Embed `var GEN_TS = "…";` (millisecond ISO) in HTML; generator replaces it each run |
| Filter state storage | Currently in-memory only; must add sessionStorage reads/writes for persistence across meta-refresh reloads |
| Existing polling in other dashboards | None — no precedent |
| Generator writes atomically? | Yes — writeFileSync to .tmp then renameSync |
| Pre-commit hook interaction | Hook auto-stages the HTML; `GEN_TS` must be excluded from drift check (same as `Last cleared` footer) |
| Tasks needed | 2 (embed GEN_TS in generator + add meta refresh + sessionStorage to HTML) |
