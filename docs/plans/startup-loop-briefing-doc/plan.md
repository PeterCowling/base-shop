---
Type: Plan
Status: Complete
Domain: Business-OS
Relates-to charter: docs/business-os/business-os-charter.md
Workstream: Mixed
Created: 2026-02-19
Last-updated: 2026-02-19
Feature-Slug: startup-loop-briefing-doc
Deliverable-Type: html-document
Startup-Deliverable-Alias: none
Execution-Track: business-artifact
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 80%
Confidence-Method: Per-task confidence = min(Implementation, Approach, Impact); Overall-confidence = effort-weighted average across tasks
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: none
Card-ID: none
---

# Startup Loop Briefing Doc Plan

## Summary

Replace `docs/business-os/startup-loop-output-registry.user.html` (a path-listing) with a
full-text consolidated briefing document. The new artifact embeds the actual content of all
44 output-artifact slots so the operator can read current thinking, priorities, forecasts, and
decisions for HEAD, PET, and BRIK without opening any source files. A tab strip (HEAD | PET | BRIK)
switches between ventures so only one business panel is visible at a time. Six pointer-file slots
(3 market-intelligence + 3 site-upgrade) are resolved to their dated source files before embedding.
The file replaces the current output registry at the same path and matches the command-centre visual
aesthetic of `startup-loop-workflow-v2.user.html`.

## Goals

- Embed actual text of all 44 content slots, rendered as readable HTML prose
- Organise content within each business into T1 (always visible) / T2 (collapsible open) /
  T3 (collapsed) tiers based on "current thinking" signal density
- Provide a tab strip (HEAD | PET | BRIK) so only one venture panel is shown at a time
- Match design tokens of `startup-loop-workflow-v2.user.html` exactly
- Remain self-contained (single HTML file; no runtime data fetches for business content; Google Fonts CDN only)
- Replace current path-listing registry at the same filename

## Non-goals

- Live sync with source files (static snapshot, date 2026-02-19)
- Search or cross-business filtering
- Coverage beyond 44 confirmed content slots (HEAD 11, PET 13, BRIK 20)

## Constraints & Assumptions

- Constraints:
  - Single HTML file — no build pipeline, no JS frameworks
  - No runtime data fetches for business content; Google Fonts CDN is the only network dependency
  - Must render cleanly at 1200px–1920px viewports
  - File must replace `docs/business-os/startup-loop-output-registry.user.html`
    (same path and filename)
- Assumptions:
  - Markdown converted to HTML manually during build (no automated parser)
  - Snapshot date 2026-02-19 displayed prominently
  - Six pointer files are omitted; their dated source files carry all readable content

## Fact-Find Reference

- Related brief: `docs/plans/startup-loop-briefing-doc/fact-find.md`
- Key findings used:
  - 44 content slots confirmed: HEAD 11, PET 13, BRIK 20
  - Counting contract: 38 direct files + 6 pointer slots resolved to dated source files
  - Market-intelligence pointers (T2): HEAD 202 lines, PET 240 lines, BRIK 429 lines
  - Site-upgrade pointers (T2): HEAD 152 lines, PET 142 lines, BRIK 160 lines
  - Tier model locked (T1 always-open, T2 collapsible-open, T3 collapsed)
  - Section layout per panel locked (11-section ordering in fact-find Design Decisions)
  - Markdown-to-HTML conversion rules defined and locked
  - Design reference: `docs/business-os/startup-loop-workflow-v2.user.html`

## Proposed Approach

- Option A: 2 tasks — monolithic build (L) + QA (S). Simpler but no incremental validation;
  failure mid-pass requires restarting the entire content conversion.
- Option B: 5 tasks — shell (M), HEAD panel (M), PET panel (M), BRIK panel (M), QA (S).
  Per-business slot-count VCs gate each panel before proceeding. Smaller, bounded tasks.
- Option C: 3 tasks — shell (M), all panels (L), QA (S). Middle ground; still one large content task.

Chosen: **Option B**. Per-panel decomposition mirrors the document's natural structure.
Sequential shell→HEAD→PET→BRIK→QA is safe for single-file editing. Each panel task
validates its own slot count (VC-01) and pointer resolution (VC-02) before moving on.

## Plan Gates

- Foundation Gate: Pass
- Build Gate: Pass (all executable tasks complete)
- Auto-Continue Gate: Fail (mode is `plan-only`; explicit build-now intent not provided)
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No (plan-only mode; no explicit build intent from user)

## VC Policy

- Shared checklist reference: `docs/business-os/_shared/business-vc-quality-checklist.md`
- Applicability note: this plan's VCs are deterministic document-structure checks (slot counts, pointer resolution, DOM assertions, overflow), not market validation experiments. Timebox/sample clauses are therefore not applicable for these checks.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---------|------|-------------|:----------:|:------:|--------|------------|--------|
| TASK-01 | IMPLEMENT | Build HTML shell + CSS + tab switcher | 80% | M | Complete (2026-02-19) | — | TASK-02 |
| TASK-02 | IMPLEMENT | Populate HEAD panel (11 slots) | 80% | M | Complete (2026-02-19) | TASK-01 | TASK-03, TASK-05 |
| TASK-03 | IMPLEMENT | Populate PET panel (13 slots) | 80% | M | Complete (2026-02-19) | TASK-02 | TASK-04, TASK-05 |
| TASK-04 | IMPLEMENT | Populate BRIK panel (20 slots) | 80% | M | Complete (2026-02-19) | TASK-03 | TASK-05 |
| TASK-05 | IMPLEMENT | Playwright QA — tab switching, tables, overflow | 80% | S | Complete (2026-02-19) | TASK-02, TASK-03, TASK-04 | — |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | TASK-01 | — | Shell only; establishes file and panel scaffolds |
| 2 | TASK-02 | TASK-01 complete | HEAD panel; sequential file edit |
| 3 | TASK-03 | TASK-02 complete | PET panel; sequential file edit |
| 4 | TASK-04 | TASK-03 complete | BRIK panel; largest, resolve both pointers |
| 5 | TASK-05 | TASK-02, TASK-03, TASK-04 complete | Playwright QA; read-only from here |

No parallel waves — all panel tasks edit the same single HTML file.

## Tasks

---

### TASK-01: Build HTML shell + CSS + tab switcher

- **Type:** IMPLEMENT
- **Deliverable:** `docs/business-os/startup-loop-output-registry.user.html` — created fresh;
  contains full CSS, tab switcher JS, page header, and three empty panel `<div>` scaffolds
  (HEAD, PET, BRIK) with section-level placeholders inside each
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-19)
- **Artifact-Destination:** Local file; opened in browser alongside
  `startup-loop-workflow-v2.user.html`
- **Reviewer:** Operator (Peter)
- **Approval-Evidence:** File opens in browser showing all three tab buttons and correct
  background/accent colours; panels toggle on tab click
- **Measurement-Readiness:** None — static reference artifact; no KPIs
- **Affects:** `docs/business-os/startup-loop-output-registry.user.html` (creates/replaces);
  `[readonly] docs/business-os/startup-loop-workflow-v2.user.html` (CSS reference only)
- **Depends on:** —
- **Blocks:** TASK-02

- **Confidence:** 80%
  - Implementation: 80% — CSS tokens, font URLs, grain texture all directly readable from
    reference file. Tab switcher is vanilla JS `display:none/block` toggle. Shell-only task
    has no content risk. Pre-cap signal ~90%; capped to 80% by business fail-first rule
    (no Red/Green evidence yet). Held-back test: could CSS copying produce a token mismatch
    that breaks the visual? Yes (e.g. incorrect hex). Mitigation: VC-03 checks exact hex.
    Risk acknowledged; cap justified.
  - Approach: 90% — design system fully defined; tab pattern is established (used in prior
    HTML artifacts); section scaffold layout locked in fact-find
  - Impact: 95% — shell enables all downstream panel tasks; prerequisite for the deliverable

- **Acceptance:**
  - [x] File exists at `docs/business-os/startup-loop-output-registry.user.html`
  - [x] Three tab buttons present (HEAD, PET, BRIK)
  - [x] Clicking each tab shows only that panel (JS toggles correctly)
  - [x] CSS tokens `--bg: #040b18`, `--accent: #c9a84c`, all 3 font families present
  - [x] Three panel `<div>` containers with distinct IDs
  - [x] No horizontal overflow at 1440px (quick check; full multi-width in TASK-05)
  - [x] File is self-contained (no `<script src`, no `fetch(`, no `XMLHttp`)

- **Validation contract:**
  - VC-01: File exists and is non-empty. Check: `ls -lh docs/business-os/startup-loop-output-registry.user.html`. Pass: file present, size > 0.
  - VC-02: Tab switcher present — three tab triggers and JS click handler. Check: grep for venture identifiers (`HEAD`, `PET`, `BRIK`) in tab button elements + JS handler. Pass: all 3 found.
  - VC-03: CSS tokens exact. Check: grep `--bg: #040b18` and `--accent: #c9a84c` and all 3 font family names in `<style>` block. Pass: all 5 found.
  - VC-04: Three panel container IDs present. Check: grep for `id="head"` (or `id="panel-head"`), `id="pet"`, `id="brik"`. Pass: all 3 found.
  - VC-05: Self-contained. Check: grep for `<script src`, `fetch(`, `XMLHttp`. Pass: 0 matches.

- **Execution plan:** Red → Green → Refactor (VC-first)
  - Red evidence plan: VCs defined above; open reference HTML and note exact CSS property names before writing a single line
  - Green evidence plan: Write `<style>` block (copied from reference), page header, tab strip HTML + JS, three empty panel `<div>`s. Run VC-01 through VC-05.
  - Refactor evidence plan: Fix any VC failures; open in browser and compare with reference for visual alignment (font, grain, accent border)

- **Planning validation (required for M/L):**
  - Checks run: Read reference HTML in prior session — CSS tokens `--bg: #040b18`, `--accent: #c9a84c`, font stack Playfair Display/Sora/JetBrains Mono confirmed present
  - Validation artifacts: `docs/business-os/startup-loop-workflow-v2.user.html` (reference); prior output-registry build confirmed CSS copy approach works
  - Unexpected findings: None

- **Scouts:** Reference HTML previously read and CSS tokens verified. No additional probes needed.
- **Edge Cases & Hardening:**
  - Sidebar section nav is used in workflow-v2; do NOT add sidebar here — tabs are the nav affordance. Keep layout single-column within each panel.
  - Snapshot date `2026-02-19` must appear in the page header, not just in a metadata comment.
  - HEAD tab should be active by default (first tab); panel HTML order: HEAD, PET, BRIK.

- **What would make this >=90%:**
  - Green evidence (shell built and all VCs passing) removes fail-first cap → raises to >=90%

- **Rollout / rollback:**
  - Rollout: Save file to path; open in browser to verify tab switching
  - Rollback: Delete file — no system state changed; prior output-registry HTML is in git history

- **Documentation impact:** New file (replaces prior version at same path); no other docs modified

- **Notes / references:**
  - Design reference: `docs/business-os/startup-loop-workflow-v2.user.html`
  - Fact-find tab pattern: `docs/plans/startup-loop-briefing-doc/fact-find.md` §Tab pattern

- **Build completion evidence (2026-02-19):**
  - Red: pre-change artifact did not contain tab-shell patterns (`git show HEAD:docs/business-os/startup-loop-output-registry.user.html | grep -Eoc "tab-button|showPanel\\("` returned `0`).
  - Green: replaced `docs/business-os/startup-loop-output-registry.user.html` with shell scaffold containing page header, snapshot chip (`2026-02-19`), tab strip (`HEAD|PET|BRIK`), panel placeholders (`id="head"`, `id="pet"`, `id="brik"`), and tab-switch JS handler (`showPanel`).
  - VC-01: pass (`ls -lh` shows file present, `8.2K`).
  - VC-02: pass (`data-panel="head|pet|brik"` and `showPanel()` present).
  - VC-03: pass (`--bg: #040b18`, `--accent: #c9a84c`, and Playfair Display/Sora/JetBrains Mono found).
  - VC-04: pass (all panel IDs found).
  - VC-05: pass (no matches for `<script src`, `fetch(`, or `XMLHttp`).
  - Refactor/QA quick check: Playwright probe at 1440px confirmed default HEAD active, PET/BRIK toggle states correct after clicks, and `scrollWidth <= innerWidth` (no horizontal overflow at this width).

---

### TASK-02: Populate HEAD panel (11 slots)

- **Type:** IMPLEMENT
- **Deliverable:** HEAD panel in `docs/business-os/startup-loop-output-registry.user.html`
  populated with 11 content slots: T1 always-visible, T2 collapsible-open, T3 collapsed.
  Both pointer slots resolved (market-intelligence 202 lines, site-upgrade 152 lines).
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-19)
- **Artifact-Destination:** Same file as TASK-01; HEAD panel section populated
- **Reviewer:** Operator (Peter)
- **Approval-Evidence:** HEAD tab renders all 11 content slots without opening source files;
  T1 sections immediately visible; T2/T3 in collapsibles
- **Measurement-Readiness:** None — static reference artifact
- **Affects:** `docs/business-os/startup-loop-output-registry.user.html` (modifies HEAD panel);
  `[readonly] docs/business-os/strategy/HEAD/plan.user.md`;
  `[readonly] docs/business-os/strategy/HEAD/2026-02-12-weekly-kpcs-decision.user.md`;
  `[readonly] docs/business-os/strategy/HEAD/launch-readiness-action-backlog.user.md`;
  `[readonly] docs/business-os/strategy/HEAD/headband-90-day-launch-forecast-v2.user.md`;
  `[readonly] docs/business-os/market-research/HEAD/2026-02-12-market-intelligence.user.md`;
  `[readonly] docs/business-os/startup-baselines/HEAD-intake-packet.user.md`;
  `[readonly] docs/business-os/strategy/HEAD/2026-02-12-prioritization-scorecard.user.md`;
  `[readonly] docs/business-os/site-upgrades/HEAD/2026-02-12-upgrade-brief.user.md`;
  `[readonly] docs/business-os/strategy/HEAD/brand-identity.user.md`;
  `[readonly] docs/business-os/startup-baselines/HEAD-forecast-seed.user.md`;
  `[readonly] docs/business-os/strategy/HEAD/2026-02-11-week2-gate-dry-run.user.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-03, TASK-05

- **Confidence:** 80%
  - Implementation: 80% — all 11 HEAD source files accessible (confirmed via Glob). Markdown-to-HTML
    conversion rules defined. Pointer files resolved to exact dated source paths. Pre-cap ~90%;
    capped to 80% by business fail-first rule. Held-back test: could complex markdown tables
    (e.g. forecast scenario table) fail to convert cleanly? Yes — this is the medium/medium
    table rendering risk. Mitigation: VC-03 checks `<table>` count; refactor pass tests
    representative tables.
  - Approach: 90% — section layout fully locked in fact-find; T1/T2/T3 tier assignments
    confirmed; pointer resolution paths measured
  - Impact: 95% — HEAD is the default active tab; operator sees it first

- **Acceptance:**
  - [x] All 11 HEAD content slots present as distinct artifact sections
  - [x] T1 sections (plan, kpcs, launch-backlog) not wrapped in `<details>`
  - [x] T2 sections (forecast, market-intel, intake, scorecard, site-upgrade-brief, brand-identity) in `<details open>`
  - [x] T3 sections (forecast-seed, week2-gate-dry-run) in `<details>` (closed by default)
  - [x] Market-intelligence dated file (202 lines) embedded — not the pointer
  - [x] Site-upgrade dated file (152 lines) embedded — not the pointer
  - [x] At least one `<table>` element in HEAD panel (from forecast or KPCs)
  - [x] Frontmatter blocks omitted from all converted content

- **Validation contract:**
  - VC-01: 11 artifact sections present. Check: count distinct artifact `<section>` or `<div class="artifact">` elements inside HEAD panel. Pass: count = 11.
  - VC-02: Pointer resolution confirmed — content of `2026-02-12-market-intelligence.user.md` embedded (grep for a known heading from that file inside HEAD panel). Pass: ≥1 match. Same for `2026-02-12-upgrade-brief.user.md`. Pass: ≥1 match.
  - VC-03: At least one `<table>` inside HEAD panel. Check: grep `<table` between HEAD panel start/end markers. Pass: ≥1 match.
  - VC-04: Frontmatter omitted. Check: grep for `^---` or `^Type:` or `^Status:` inside HEAD panel converted content. Pass: 0 matches.

- **Execution plan:** Red → Green → Refactor (VC-first)
  - Red evidence plan: VCs defined; read each of the 11 HEAD source files before writing any HTML
  - Green evidence plan: Read each source file in slot order (plan → kpcs → backlog → forecast → market-intel → intake → scorecard → upgrade-brief → brand-identity → forecast-seed → week2-dry-run); convert markdown to HTML per conversion rules; insert into HEAD panel. Run VC-01 through VC-04.
  - Refactor evidence plan: Fix any malformed table conversions; verify `<details>` wrapping on T2/T3; confirm frontmatter is absent

- **Planning validation (required for M/L):**
  - Checks run: Glob confirmed all 11 HEAD source file paths exist
  - Validation artifacts: `docs/plans/startup-loop-briefing-doc/fact-find.md` §Tier model (T1/T2/T3 assignments per artifact)
  - Unexpected findings: Intake-packet and forecast-seed files are in `startup-baselines/` (not `strategy/`). Exec-summary files excluded per output-registry curation rules. headband-forecast-v1 excluded by dedup (only latest version per plan); HEAD-forecast-seed.user.md is the distinct T3 seed document.

- **Scouts:** None — all paths confirmed via Glob in prior session.
- **Edge Cases & Hardening:**
  - `HEAD-forecast-seed.user.md` is the T3 forecast-seed artifact for HEAD. The `headband-90-day-launch-forecast-v1.user.md` file remains excluded by latest-version curation (v2 is the included forecast model at T2). Do not include exec-summary files.
  - The forecast-v2 contains scenario tables (P10/P50/P90 bands) — these must be converted to `<table>` not `<pre>`. Test this table first in the refactor pass.
  - `2026-02-11-week2-gate-dry-run.user.md` is T3 (collapsed). Confirm it gets `<details>` without `open` attribute.

- **What would make this >=90%:**
  - Green evidence (HEAD panel built and VCs passing) → removes fail-first cap

- **Rollout / rollback:**
  - Rollout: Save updated file; switch to HEAD tab in browser to verify content
  - Rollback: Restore prior content from git; no other state changed

- **Documentation impact:** Modifies only the single HTML output file

- **Notes / references:**
  - HEAD T1 slot order from fact-find: plan → kpcs → backlog
  - HEAD T2 slot order: forecast-v2 → market-intel (resolved) → intake → scorecard → upgrade-brief (resolved) → brand-identity
  - HEAD T3: forecast-seed, week2-gate-dry-run

- **Build completion evidence (2026-02-19):**
  - Red: scope-gate read completed for all 11 readonly source artifacts in TASK-02 `Affects`; prior shell contained placeholders only, so VC-01 content-count target would fail before conversion.
  - Green: replaced HEAD panel placeholders with 11 converted artifact sections using T1/T2/T3 structure (T1 as direct `<article>` blocks, T2 as `<details open>`, T3 as closed `<details>`), embedding resolved market-intelligence and site-upgrade dated source files.
  - Refactor: added artifact/table/details styling for readability, ensured no runtime fetch logic was introduced, and kept PET/BRIK scaffolds unchanged for downstream tasks.
  - VC-01: pass (`articleCount: 11` inside `#head`).
  - VC-02: pass (`Market Intelligence Pack: HEAD - Cochlear Implant Headbands in Italy` and `HEAD Site Upgrade Brief` headings present inside `#head`).
  - VC-03: pass (`tableCount: 28` in HEAD panel; requirement was `>=1`).
  - VC-04: pass (no `^---`, `^Type:`, or `^Status:` frontmatter markers in converted HEAD panel content).
  - Additional safety check: Playwright probe confirmed tab state still correct (`head=true`, `pet=false`, `brik=false`) and no overflow at 1440px.

---

### TASK-03: Populate PET panel (13 slots)

- **Type:** IMPLEMENT
- **Deliverable:** PET panel in `docs/business-os/startup-loop-output-registry.user.html`
  populated with 13 content slots. PET-offer.md (327 lines) and candidate-names (364 lines)
  are T1 prominent. Both pointer slots resolved (market-intelligence 240 lines, site-upgrade 142 lines).
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-19)
- **Artifact-Destination:** Same file; PET panel populated
- **Reviewer:** Operator (Peter)
- **Approval-Evidence:** PET tab shows offer doc and naming shortlist as prominent T1 sections;
  all 13 slots present; pointers resolved
- **Measurement-Readiness:** None — static reference artifact
- **Affects:** `docs/business-os/startup-loop-output-registry.user.html` (modifies PET panel);
  `[readonly] docs/business-os/strategy/PET/plan.user.md`;
  `[readonly] docs/business-os/strategy/PET/2026-02-12-weekly-kpcs-decision.user.md`;
  `[readonly] docs/business-os/strategy/PET/launch-readiness-action-backlog.user.md`;
  `[readonly] docs/business-os/startup-baselines/PET-offer.md`;
  `[readonly] docs/business-os/strategy/PET/2026-02-18-candidate-names.user.md`;
  `[readonly] docs/business-os/strategy/PET/italy-90-day-launch-forecast-v2.user.md`;
  `[readonly] docs/business-os/market-research/PET/2026-02-12-market-intelligence.user.md`;
  `[readonly] docs/business-os/startup-baselines/PET-intake-packet.user.md`;
  `[readonly] docs/business-os/strategy/PET/2026-02-12-prioritization-scorecard.user.md`;
  `[readonly] docs/business-os/site-upgrades/PET/2026-02-12-upgrade-brief.user.md`;
  `[readonly] docs/business-os/strategy/PET/brand-identity.user.md`;
  `[readonly] docs/business-os/startup-baselines/PET-forecast-seed.user.md`;
  `[readonly] docs/business-os/strategy/PET/2026-02-11-week2-gate-dry-run.user.md`
- **Depends on:** TASK-02
- **Blocks:** TASK-04, TASK-05

- **Confidence:** 80%
  - Implementation: 80% — all 13 PET source paths accessible. PET-offer.md uses a non-standard
    path (`startup-baselines/`) but was confirmed in output-registry fact-find. Pre-cap ~90%;
    capped to 80% by business fail-first rule. Held-back test: PET T1 is 691 lines (offer + naming)
    — could the HTML output become unwieldy even without collapsibles? Possible, but tab isolation
    means PET panel length doesn't affect HEAD. Score stands at 80%.
  - Approach: 90% — tier assignments locked; PET-specific section layout confirmed in fact-find
  - Impact: 95% — PET offer doc and naming shortlist are the most decision-dense content; operator
    explicitly needs these visible without file-opening

- **Acceptance:**
  - [x] All 13 PET content slots present as distinct artifact sections
  - [x] PET-offer.md and candidate-names both at T1 (no `<details>` wrapper)
  - [x] T2 sections in `<details open>`; T3 in `<details>` (closed)
  - [x] Market-intelligence dated file (240 lines) embedded — not pointer
  - [x] Site-upgrade dated file (142 lines) embedded — not pointer
  - [x] No T3 baselines section for PET (PET has none — omit section header)
  - [x] At least one `<table>` element in PET panel

- **Validation contract:**
  - VC-01: 13 artifact sections in PET panel. Check: count artifact containers inside PET panel. Pass: count = 13.
  - VC-02: Pointer resolution confirmed — grep for known content heading from `2026-02-12-market-intelligence.user.md` inside PET panel. Pass: ≥1 match. Same for `2026-02-12-upgrade-brief.user.md`. Pass: ≥1 match.
  - VC-03: PET-offer.md and candidate-names not in `<details>` wrapper. Check: verify these two artifact containers appear outside any `<details>` tag in PET panel. Pass: 0 enclosing `<details>` found for each.
  - VC-04: At least one `<table>` inside PET panel. Pass: ≥1 match.

- **Execution plan:** Red → Green → Refactor (VC-first)
  - Red evidence plan: Read each PET source file before authoring HTML; confirm PET-offer.md path is `docs/business-os/startup-baselines/PET-offer.md`
  - Green evidence plan: Insert PET panel content in slot order; T1 first (plan → kpcs → backlog → offer → naming), then T2 (forecast → market-intel → intake → scorecard → upgrade-brief → brand-identity), then T3 (forecast-seed, week2-dry-run). Run VCs.
  - Refactor evidence plan: Verify PET candidate-names table (364 lines of shortlist data) renders as `<table>` or structured `<ul>` not `<pre>`. Fix any wrapping issues.

- **Planning validation (required for M/L):**
  - Checks run: PET-offer.md path confirmed (`startup-baselines/PET-offer.md`); candidate-names confirmed at `strategy/PET/2026-02-18-candidate-names.user.md`
  - Validation artifacts: Output-registry fact-find confirmed PET-offer.md inclusion at S2B
  - Unexpected findings: PET does not have a signal-review artifact (BRIK-specific); section 10 "Supporting Docs" for PET contains only brand-identity (no product spec, no sales funnel brief, no signal review)

- **Scouts:** PET-offer.md path non-standard — verified as `docs/business-os/startup-baselines/PET-offer.md`.
- **Edge Cases & Hardening:**
  - PET has no T3 baseline section — omit the "Reference / Baselines" section header entirely for PET panel
  - The naming shortlist (364 lines) may contain tables or lists of name options — convert to structured `<table>` or `<ul>` as appropriate; do not use `<pre>`
  - `italy-90-day-launch-forecast-v2-exec-summary.user.md` is excluded by curation rules (no exec summaries); only `italy-90-day-launch-forecast-v2.user.md` is included

- **What would make this >=90%:**
  - Green evidence (PET panel built and VCs passing)

- **Rollout / rollback:**
  - Rollout: Save updated file; switch to PET tab in browser
  - Rollback: Restore from git; no other state changed

- **Documentation impact:** Modifies only the single HTML output file

- **Notes / references:**
  - PET T1: plan → kpcs → backlog → offer → naming (5 sections)
  - PET T2: forecast-v2 → market-intel (resolved) → intake → scorecard → upgrade-brief (resolved) → brand-identity (6 sections)
  - PET T3: forecast-seed, week2-gate-dry-run (2 sections)

- **Build completion evidence (2026-02-19):**
  - Red: scope-gate read completed for all 13 readonly PET source artifacts in TASK-03 `Affects`; PET panel was still a placeholder scaffold prior to conversion.
  - Green: replaced PET panel placeholders with 13 converted artifact sections in slot order (T1 plan/kpcs/backlog/offer/naming; T2 forecast/market-intel/intake/scorecard/upgrade/brand; T3 forecast-seed/week2-dry-run).
  - Refactor: preserved HEAD panel output from TASK-02 and BRIK scaffold for TASK-04; reused shared artifact styles and maintained tab-switch behavior.
  - VC-01: pass (`articleCount: 13` inside `#pet`).
  - VC-02: pass (`PET Market Intelligence Pack (Italy)` and `PET Site Upgrade Brief` headings present inside `#pet`).
  - VC-03: pass (`pet-offer` and `pet-naming` are `tier-t1` articles outside `<details>` wrappers).
  - VC-04: pass (`tableCount: 35` in PET panel; requirement was `>=1`).
  - Additional acceptance check: no PET “Reference / Baselines” section header emitted (PET has no dedicated baseline section heading).
  - Additional safety check: Playwright probe after clicking PET tab confirmed visibility state (`head=false`, `pet=true`, `brik=false`) and no overflow at 1440px.

---

### TASK-04: Populate BRIK panel (20 slots)

- **Type:** IMPLEMENT
- **Deliverable:** BRIK panel in `docs/business-os/startup-loop-output-registry.user.html`
  populated with 20 content slots. Both pointer slots resolved (market-intelligence 429 lines,
  site-upgrade 160 lines). T3 baselines section present and visually de-emphasised.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-19)
- **Artifact-Destination:** Same file; BRIK panel populated
- **Reviewer:** Operator (Peter)
- **Approval-Evidence:** BRIK tab shows all 20 slots; signal review, product spec, sales funnel
  brief present; T3 baselines collapsed with de-emphasis styling
- **Measurement-Readiness:** None — static reference artifact
- **Affects:** `docs/business-os/startup-loop-output-registry.user.html` (modifies BRIK panel);
  `[readonly] docs/business-os/strategy/BRIK/plan.user.md`;
  `[readonly] docs/business-os/strategy/BRIK/2026-02-13-weekly-kpcs-decision.user.md`;
  `[readonly] docs/business-os/strategy/BRIK/signal-review-20260218-1238-W08.md`;
  `[readonly] docs/business-os/strategy/BRIK/2026-02-13-startup-loop-90-day-forecast-v1.user.md`;
  `[readonly] docs/business-os/market-research/BRIK/2026-02-15-market-intelligence.user.md`;
  `[readonly] docs/business-os/startup-baselines/BRIK-intake-packet.user.md`;
  `[readonly] docs/business-os/strategy/BRIK/2026-02-13-prioritization-scorecard.user.md`;
  `[readonly] docs/business-os/site-upgrades/BRIK/2026-02-12-upgrade-brief.user.md`;
  `[readonly] docs/business-os/strategy/BRIK/2026-02-17-brikette-sales-funnel-external-brief.user.md`;
  `[readonly] docs/business-os/strategy/BRIK/2026-02-17-octorate-process-reduction-feasibility.user.md`;
  `[readonly] docs/business-os/strategy/BRIK/product-spec.user.md`;
  `[readonly] docs/business-os/strategy/BRIK/brand-identity.user.md`;
  `[readonly] docs/business-os/strategy/BRIK/2026-02-12-historical-performance-baseline.user.md`;
  `[readonly] docs/business-os/strategy/BRIK/2026-02-14-octorate-operational-data-baseline.user.md`;
  `[readonly] docs/business-os/strategy/BRIK/2026-02-12-ga4-search-console-setup-note.user.md`;
  `[readonly] docs/business-os/strategy/BRIK/2026-02-13-measurement-verification.user.md`;
  `[readonly] docs/business-os/strategy/BRIK/2026-02-12-apartment-revenue-architecture.user.md`;
  `[readonly] docs/business-os/strategy/BRIK/room-pricing-analysis.md`;
  `[readonly] docs/business-os/strategy/BRIK/prime-app-design-branding.user.md`;
  `[readonly] docs/business-os/startup-baselines/BRIK-forecast-seed.user.md`
- **Depends on:** TASK-03
- **Blocks:** TASK-05

- **Confidence:** 80%
  - Implementation: 80% — 20 source files, all accessible (Glob confirmed). BRIK market-intel
    is 429 lines (the longest resolved file — within T2 collapsible). BRIK signal-review is 207
    lines (T1 — always visible). Pre-cap ~90%; capped to 80% by business fail-first rule.
    Held-back test: T3 section comprises 7+ artifacts (baselines, setup notes, pricing data);
    could these be accidentally included without de-emphasis styling? Yes — VC-04 specifically
    checks this. Risk acknowledged; cap justified.
  - Approach: 90% — BRIK section layout and tier assignments fully locked; most complex business
    but all artifacts identified and sized
  - Impact: 95% — BRIK is the most advanced venture; operator reads it most frequently

- **Acceptance:**
  - [x] All 20 BRIK content slots present as distinct artifact sections
  - [x] T1 sections (plan, kpcs, signal-review-W08) not wrapped in `<details>`
  - [x] T2 sections in `<details open>`; T3 baselines in `<details>` (closed) with de-emphasis
  - [x] Market-intelligence dated file (429 lines) embedded — not pointer
  - [x] Site-upgrade dated file (160 lines) embedded — not pointer
  - [x] At least 3 `<table>` elements in BRIK panel (forecast, KPIs, competitor pricing, room pricing)
  - [x] T3 section visually de-emphasised (lower opacity or muted colour class)

- **Validation contract:**
  - VC-01: 20 artifact sections in BRIK panel. Check: count artifact containers inside BRIK panel. Pass: count = 20.
  - VC-02: Both pointer slots resolved. Grep for known heading from `2026-02-15-market-intelligence.user.md` inside BRIK panel. Pass: ≥1 match. Same for `2026-02-12-upgrade-brief.user.md`. Pass: ≥1 match.
  - VC-03: At least 3 `<table>` elements inside BRIK panel. Check: grep `<table` inside BRIK panel. Pass: count ≥ 3.
  - VC-04: T3 section is collapsed and de-emphasised. Check: T3 container uses `<details>` without `open` attribute AND has a CSS class indicating de-emphasis (e.g. `class="tier-3"` or `class="reference-tier"`). Pass: both conditions met.

- **Execution plan:** Red → Green → Refactor (VC-first)
  - Red evidence plan: Read each of the 20 BRIK source files before authoring HTML; verify BRIK signal-review path (check Glob for `signal-review` file under BRIK)
  - Green evidence plan: Insert BRIK panel in slot order. T1: plan → kpcs → signal-review-W08. T2: forecast-v1 → market-intel (resolved, 429 lines) → intake → scorecard → upgrade-brief (resolved) → sales-funnel-brief → octorate-feasibility → product-spec → brand-identity. T3: historical-baseline → octorate-operational-data → ga4-setup → measurement-verification → apartment-revenue → room-pricing → prime-app-branding → forecast-seed → (no week2-dry-run for BRIK). Run VCs.
  - Refactor evidence plan: Verify room-pricing-analysis tables render as `<table>`; check that BRIK market-intel (429 lines) stays inside its `<details>` collapsible without breaking layout; verify T3 de-emphasis class applied

- **Planning validation (required for M/L):**
  - Checks run: Glob and find confirmed all BRIK paths — strategy/BRIK, market-research/BRIK, site-upgrades/BRIK, startup-baselines/BRIK. Signal-review confirmed at `strategy/BRIK/signal-review-20260218-1238-W08.md`. Room-pricing confirmed at `strategy/BRIK/room-pricing-analysis.md`. Intake-packet and forecast-seed confirmed at `startup-baselines/`.
  - Validation artifacts: Output-registry HTML confirms BRIK has 20 entries at S0–S10 stages
  - Unexpected findings: BRIK does not have a candidate-names (BRIK-specific branding is `prime-app-design-branding.user.md`). BRIK week2-gate-dry-run confirmed absent (HEAD/PET only). All 20 Affects paths verified.

- **Scouts:**
  - Signal-review path confirmed: `docs/business-os/strategy/BRIK/signal-review-20260218-1238-W08.md`
  - BRIK week2-gate-dry-run: confirmed absent — T3 table in fact-find lists HEAD/PET only; BRIK T3 uses BRIK-forecast-seed instead

- **Edge Cases & Hardening:**
  - BRIK T1 is ~480 lines (plan 172 + kpcs 100 + signal-review 207). This is the largest T1 section across all businesses — it is intentional and accurate; do not move signal-review to T2
  - The BRIK market-intel file (429 lines) should remain inside `<details open>` (T2 collapsible-open) but may need an explicit line-count hint in the `<summary>` so the operator knows what they're expanding
  - BRIK has no naming shortlist — omit that section entirely from BRIK panel
  - room-pricing-analysis.md and signal-review use plain `.md` suffix — include as normal; suffix is not the inclusion criterion

- **What would make this >=90%:**
  - Green evidence (BRIK panel built and VCs passing)

- **Rollout / rollback:**
  - Rollout: Save updated file; switch to BRIK tab in browser; scroll through all 20 slots
  - Rollback: Restore from git; no other state changed

- **Documentation impact:** Modifies only the single HTML output file

- **Notes / references:**
  - BRIK T1: plan → kpcs → signal-review-W08 (3 slots, ~480 lines)
  - BRIK T2: forecast-v1 → market-intel (resolved, 429L) → intake → scorecard → upgrade-brief (resolved, 160L) → sales-funnel-brief → octorate-feasibility → product-spec → brand-identity (9 slots)
  - BRIK T3: historical-baseline → octorate-data → ga4-setup → measurement-verification → apartment-revenue → room-pricing → prime-app-branding → forecast-seed (8 slots; no week2-dry-run)

- **Build completion evidence (2026-02-19):**
  - Red: scope-gate read completed for all 20 readonly BRIK source artifacts in TASK-04 `Affects`; BRIK panel was still placeholder content before conversion.
  - Green: replaced BRIK panel placeholders with 20 converted artifact sections in slot order (T1 plan/kpcs/signal-review; T2 forecast/market-intel/intake/scorecard/upgrade/sales-funnel/octorate-feasibility/product-spec/brand; T3 historical/octorate-data/ga4-setup/measurement-verification/apartment-revenue/room-pricing/prime-branding/forecast-seed).
  - Refactor: preserved HEAD/PET outputs from TASK-02/03, retained shared artifact styles, and ensured T3 is wrapped in a de-emphasised `reference-tier` stack with closed `<details>`.
  - VC-01: pass (`articleCount: 20` inside `#brik`).
  - VC-02: pass (`BRIK Market Intelligence Pack - EU Hostel Direct Booking + OTA Distribution` and `BRIK Site Upgrade Brief (Decision-Grade)` headings present inside `#brik`).
  - VC-03: pass (`tableCount: 74` in BRIK panel; requirement was `>=3`).
  - VC-04: pass (`t3ClosedCount: 8` with `referenceTierClass: true`; collapsed + visually de-emphasised).
  - Additional safety check: Playwright probe after clicking BRIK tab confirmed visibility state (`head=false`, `pet=false`, `brik=true`) and no overflow at 1440px.

---

### TASK-05: Playwright QA — tab switching, tables, overflow

- **Type:** IMPLEMENT
- **Deliverable:** QA validation evidence recorded in this task's build-evidence field; no new
  files created. Screenshots saved to `/tmp/briefing-*.png`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-19)
- **Artifact-Destination:** Sign-off recorded in this task; screenshots at `/tmp/briefing-*.png`
- **Reviewer:** Operator (Peter)
- **Approval-Evidence:** All 4 VCs pass; operator visually confirms screenshots show correct
  tab behaviour and readable content
- **Measurement-Readiness:** None — QA gate, not a tracked metric
- **Affects:** `[readonly] docs/business-os/startup-loop-output-registry.user.html`
- **Depends on:** TASK-02, TASK-03, TASK-04
- **Blocks:** —

- **Confidence:** 80%
  - Implementation: 90% — Playwright pattern established from prior output-registry QA (same repo,
    same script approach). VCs are procedural and unambiguous. Held-back test: could Playwright
    fail to load the local HTML file? Unlikely — prior session confirmed `file://` URL loading
    works. Score 90% stands.
  - Approach: 85% — side-by-side visual comparison + automated VC checks is the established
    pattern for this design system; criteria enumerated in VCs
  - Impact: 80% — catches broken tab switching, missing tables, and overflow before the file is
    used. Low effort, clear value. Held-back test: could visual comparison miss a subtle issue?
    Yes (e.g. a T2 section accidentally rendered as T1). Mitigation: VC checks source HTML structure
    directly in TASK-02/03/04 so QA is confirming rendering, not structure. Score 80% confirmed.
  - Overall min = 80%; at threshold — business fail-first cap also = 80% ✓

- **Acceptance:**
  - [x] Tab switching: click each of 3 tabs → only that panel visible; other two hidden
  - [x] `<table>` elements present in rendered DOM across all panels (total ≥ 10)
  - [x] No horizontal scroll/overflow at 1200px, 1440px, 1920px
  - [x] Screenshot at 1440px shows HEAD tab active with T1 content visible

- **Validation contract:**
  - VC-01: Tab switching functional. Check: Playwright — click HEAD tab, assert PET/BRIK panels have `display:none` (or hidden state); click PET tab, assert HEAD/BRIK hidden; click BRIK tab, assert HEAD/PET hidden. Pass: all 3 states asserted without error.
  - VC-02: Tables rendered in DOM. Check: `page.$$eval('table', els => els.length)` across all panels (expand all `<details>` first to count all). Pass: total `<table>` count ≥ 10.
  - VC-03: No overflow at 1200/1440/1920px. Check: `document.body.scrollWidth > window.innerWidth` at each width. Pass: `false` at all 3 widths.
  - VC-04: Screenshot saved. Check: `ls /tmp/briefing-1440.png`. Pass: file exists and non-zero size.

- **Execution plan:** Red → Green → Refactor (VC-first)
  - Red evidence plan: VCs defined; write Playwright script to `/tmp/check-briefing.mjs` before running
  - Green evidence plan: Run Playwright script against `file:///Users/petercowling/base-shop/docs/business-os/startup-loop-output-registry.user.html`; capture output and screenshots
  - Refactor evidence plan: If any VC fails, triage to the originating task (e.g. overflow → TASK-01 CSS; missing tables → TASK-02/03/04 conversion); fix and re-run QA

- **Planning validation:** None — procedural QA; no planning investigation needed
- **Scouts:** Playwright installed in repo (`node_modules/.bin/playwright`) — confirmed from prior output-registry QA run
- **Edge Cases & Hardening:**
  - Expand all `<details>` elements before counting `<table>` elements so tables in collapsed sections are included in QA counts and visibility checks
  - The BRIK market-intel section (429 lines, collapsible) must not cause overflow when expanded; test at 1200px with details open
- **What would make this >=90%:** Automated pixel-diff tooling vs reference HTML (out of scope)
- **Rollout / rollback:** QA only; no files modified
- **Documentation impact:** Build evidence recorded in this plan task field; no other docs modified

- **Build completion evidence (2026-02-19):**
  - Red: initial Playwright probe failed on selector mismatch (`data-tab` vs implemented `data-panel`), validating that tab assertions were genuinely exercised rather than assumed.
  - Green: executed `/tmp/check-briefing.mjs` against `file:///Users/petercowling/base-shop/docs/business-os/startup-loop-output-registry.user.html` with all details expanded and multi-viewport checks enabled.
  - Refactor: corrected selectors to `data-panel` and tightened the HEAD-visibility assertion to check first `.artifact.tier-t1` visibility, then re-ran full VC suite.
  - VC-01: pass (`head=true/pet=false/brik=false`, then `pet=true`, then `brik=true`).
  - VC-02: pass (`tableCount: 137`, requirement `>=10`).
  - VC-03: pass (`overflow=false` for HEAD/PET/BRIK at 1200px, 1440px, and 1920px).
  - VC-04: pass (`/tmp/briefing-1440.png` exists, non-zero; `10M`, SHA-256 `3d390017b9ed64a0d28a620002943ad88de9a75d6dc850322cb8f10a8a778586`).
  - Additional QA assertion: `headT1Visible: true` at 1440px with HEAD tab active prior to screenshot capture.

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| BRIK market intelligence file (429 lines) causes layout issues when collapsible is expanded | Confirmed | Low | T2 collapsible keeps it off initial DOM; test at 1200px with details open in TASK-05 VC-03 |
| Markdown tables with complex cell content (inline code, multi-col) render poorly | Medium | Medium | Refactor pass in each panel task tests representative tables before marking complete; VC-03 in TASK-04 requires ≥3 tables |
| File size of single HTML becomes large (>500KB) | Low | Low | Static local file; no performance budget; not a blocker |
| BRIK signal-review path not where expected | Low | Medium | Scout in TASK-04 — grep for signal-review before authoring; if not found, route to lp-do-replan |
| Source file content changes between fact-find and build | Low | Low | Snapshot date 2026-02-19 displayed; no live sync intended |

## Observability

None — static reference artifact; no runtime, no logging, no metrics.

## Acceptance Criteria (overall)

- [x] `docs/business-os/startup-loop-output-registry.user.html` exists and opens in browser
- [x] All 44 content slots rendered (HEAD 11 / PET 13 / BRIK 20)
- [x] 6 pointer slots resolved to dated source files (3 market-intel + 3 site-upgrade)
- [x] Tab switching works — one business panel visible at a time
- [x] Markdown tables rendered as `<table>`, not `<pre>` (total ≥ 10 in DOM)
- [x] Visual parity with `startup-loop-workflow-v2.user.html` (CSS tokens exact)
- [x] No horizontal overflow at 1200/1440/1920px
- [x] Snapshot date 2026-02-19 displayed prominently

## Decision Log

- 2026-02-19: Option B chosen (5 tasks: shell + 3 panels + QA) over Option A (monolithic) and
  Option C (3 tasks). Rationale: per-panel VCs allow slot-count validation after each business
  before proceeding; smaller task boundaries reduce rework risk on a ~6,300-line content conversion.
- 2026-02-19: Panel tasks made sequential (not parallel) — all edit the same single HTML file;
  parallel editing would require merge coordination that adds more risk than it saves.
- 2026-02-19: Six pointer slots (3 market-intel + 3 site-upgrade) resolved to dated source files.
  All line counts measured: market-intel HEAD 202, PET 240, BRIK 429; site-upgrade all 2026-02-12,
  HEAD 152, PET 142, BRIK 160.

## Overall-confidence Calculation

- TASK-01: 80%, effort M (weight 2)
- TASK-02: 80%, effort M (weight 2)
- TASK-03: 80%, effort M (weight 2)
- TASK-04: 80%, effort M (weight 2)
- TASK-05: 80%, effort S (weight 1)
- Overall = (80×2 + 80×2 + 80×2 + 80×2 + 80×1) / (2+2+2+2+1) = 720 / 9 = **80%**
