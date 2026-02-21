---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Business-OS
Workstream: Mixed
Created: 2026-02-19
Last-updated: 2026-02-19
Feature-Slug: startup-loop-briefing-doc
Execution-Track: business-artifact
Deliverable-Family: doc
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: html-document
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan-Note: plan.md does not exist yet — created by /lp-do-plan at next stage
Business-OS-Integration: off
Business-Unit: none
Card-ID: none
---

# Startup Loop Briefing Doc — Fact-Find Brief

## Scope

### Summary

Replace `docs/business-os/startup-loop-output-registry.user.html` (a path-listing)
with a full-text consolidated briefing document. The new artifact embeds the actual
content of the output artifacts so the operator can read current thinking,
priorities, forecasts, and decisions for HEAD, PET, and BRIK in one place — without
opening any source files.

A business selector (tab strip: HEAD | PET | BRIK) switches between ventures so
only one business is visible at a time, keeping the document readable despite
covering ~6,300 lines of source content.

### Goals

- Embed the actual text of each output artifact, rendered as readable HTML prose
- Organise content within each business into meaningful sections (strategy,
  forecast, offer/ICP, market context, priorities, reference)
- Provide a business tab selector so only one venture is shown at a time
- Match the command-centre aesthetic of `startup-loop-workflow-v2.user.html`
- Remain fully self-contained (single HTML file, no runtime data fetches; Google Fonts CDN is the only network dependency)
- Replace the current path-listing registry at the same filename

### Non-goals

- Live sync with source files (static snapshot)
- Search or cross-business filtering
- Coverage beyond the 44 confirmed artifacts already inventoried

### Constraints & Assumptions

- Constraints:
  - Single self-contained HTML file — no build pipeline, no JS frameworks
  - No runtime data fetches; Google Fonts CDN is the only external dependency
  - Must render cleanly at 1200px–1920px viewports
  - File replaces `docs/business-os/startup-loop-output-registry.user.html`
    (same path and filename)
- Assumptions:
  - Markdown in source files will be converted to HTML manually during the
    build pass (headings → `<h3>/<h4>`, tables → `<table>`, lists → `<ul>/<ol>`)
  - Not every artifact is equally valuable for "current thinking" — a tiered
    inclusion model is used (see Content Tiers below)
  - The snapshot date 2026-02-19 is displayed prominently

---

## Evidence Audit — Content Volume and Structure

### Total corpus size

| Scope | Artifacts | Est. lines |
|-------|----------:|----------:|
| Primary sampled (18 files) | 18 | ~2,554 |
| Remaining artifacts (26 files) | 26 | ~3,742 |
| **Total** | **44** | **~6,296** |

Per-business breakdown (estimated):
- HEAD: 11 artifacts, ~1,200–1,500 lines
- PET: 13 artifacts, ~1,600–1,900 lines (PET-offer.md alone is 327 lines)
- BRIK: 20 artifacts, ~2,800–3,000 lines (most advanced, longest docs)

With a tab selector showing one business at a time, the active DOM is ~1,500–3,000
lines per business — manageable with `<details>/<summary>` collapsibles for
reference-tier content.

### Content Tier Model (confirmed)

The 44 artifacts fall into three tiers based on "current thinking" signal:

**Tier 1 — Current thinking (always visible, full text)**

These documents tell the operator what is being done, why, and what is happening now:

| Artifact | Business | Lines |
|----------|----------|------:|
| plan.user.md | HEAD | 105 |
| plan.user.md | PET | 98 |
| plan.user.md | BRIK | 172 |
| Weekly K/P/C/S Decision | HEAD | 51 |
| Weekly K/P/C/S Decision | PET | ~60 |
| Weekly K/P/C/S Decision | BRIK | 100 |
| Launch Readiness Backlog | HEAD | 61 |
| Launch Readiness Backlog | PET | ~62 |
| Signal Review W08 | BRIK | 207 |
| Offer Design | PET | 327 |
| Naming Shortlist | PET | 364 |

**Tier 2 — Context/foundation (collapsible sections, full text on expand)**

Provide the evidence and model behind T1 decisions:

| Artifact | Business | Lines |
|----------|----------|------:|
| 90-Day Forecast v2 | HEAD | 200 |
| 90-Day Forecast v2 | PET | 131 |
| 90-Day Forecast v1 | BRIK | 154 |
| Market Intelligence | HEAD | 202 (dated file, not pointer) |
| Market Intelligence | PET | 240 (dated file, not pointer) |
| Market Intelligence | BRIK | 429 (dated file, not pointer) |
| Intake Packet | HEAD | 128 |
| Intake Packet | PET | 141 |
| Intake Packet | BRIK | 176 |
| Prioritization Scorecard | HEAD | ~80 |
| Prioritization Scorecard | PET | ~80 |
| Prioritization Scorecard | BRIK | ~80 |
| Site Upgrade Brief | HEAD | 152 (dated file, not pointer) |
| Site Upgrade Brief | PET | 142 (dated file, not pointer) |
| Site Upgrade Brief | BRIK | 160 (dated file, not pointer) |
| Sales Funnel Brief | BRIK | 244 |
| Octorate Process Reduction Feasibility | BRIK | ~120 |
| Product Spec | BRIK | 299 |
| Brand Dossier | HEAD | ~100 |
| Brand Dossier | PET | ~100 |
| Brand Dossier | BRIK | ~120 |

**Tier 3 — Evidence/operational data (collapsed by default, de-emphasised)**

Baseline data, setup records, and historical snapshots. Not "thinking" — but
useful for cross-reference:

| Artifact | Business | Lines |
|----------|----------|------:|
| Historical Performance Baseline | BRIK | ~100 |
| Octorate Operational Data Baseline | BRIK | ~80 |
| GA4 + Search Console Setup Note | BRIK | ~60 |
| Measurement Verification | BRIK | ~60 |
| Apartment Revenue Architecture | BRIK | ~80 |
| Room Pricing Analysis | BRIK | 74 |
| Prime App Design Branding | BRIK | ~120 |
| Forecast Seed | HEAD/PET/BRIK | ~40–60 each |
| Week 2 Gate Dry-Run | HEAD/PET | ~50 each |

### Pointer resolution (critical — applies to two pointer types)

The output registry includes six `latest.user.md` pointer files — three
`Type: Market-Intelligence-Pointer` and three `Type: Site-Upgrade-Pointer`. Each
pointer is ~20 lines of metadata with no readable content. **The build must
resolve all six to their dated source files; the pointer files themselves are
omitted from the rendered output.**

**Market-intelligence pointers** — resolve and embed as T2
(`docs/business-os/market-research/<BU>/`):
- HEAD: `2026-02-12-market-intelligence.user.md` — 202 lines
- PET: `2026-02-12-market-intelligence.user.md` — 240 lines
- BRIK: `2026-02-15-market-intelligence.user.md` — 429 lines

**Site-upgrade pointers** — resolve and embed as T2
(`docs/business-os/site-upgrades/<BU>/`):
- HEAD: `2026-02-12-upgrade-brief.user.md` — 152 lines
- PET: `2026-02-12-upgrade-brief.user.md` — 142 lines
- BRIK: `2026-02-12-upgrade-brief.user.md` — 160 lines

### Key structural observations

1. **BRIK is materially more complex** — 20 artifacts, ~3,000 lines. The T1 section
   alone (plan + KPCs + signal review) is ~480 lines. Collapsibles are essential.

2. **PET-offer.md and naming shortlist dominate PET T1** — 327 + 364 = 691 lines.
   These are genuinely dense decision-grade docs, not padding. Both should be T1.

3. **Markdown tables are pervasive** — forecast scenario tables, KPI watchlists,
   competitor pricing tables, room pricing matrices. These must be converted to
   `<table>` HTML cleanly, not rendered as pre-formatted text.

4. **HEAD has less T1 depth than PET/BRIK** — plan is 105 lines, KPCs 51 lines,
   launch backlog 61 lines. The forecast (T2) is the richest HEAD document at 200
   lines. HEAD T1 will feel lighter; that's accurate, not a gap.

5. **BRIK market intelligence is the longest single resolved file** — 429 lines
   (HEAD 202, PET 240). All three are T2 (collapsible). BRIK's extra length does
   not affect readability; `<details>` wrapping keeps it out of the initial DOM.

### Delivery & Channel Landscape

- Audience: Operator (Peter) — same as all other Business-OS HTML artifacts
- Channel: Local file, opened in browser alongside `startup-loop-workflow-v2.user.html`
- Existing design system: `startup-loop-workflow-v2.user.html` — CSS tokens, fonts,
  grain texture, sidebar, badge classes all available to copy
- Output path: `docs/business-os/startup-loop-output-registry.user.html` (replaces
  current file at same path)
- No approvals required beyond operator visual QA

### Hypothesis & Validation Landscape

This is a static HTML authoring task, not a market hypothesis. Validation is
structural and visual only:
- H1: All T1 content is readable without opening any source file — testable by
  visual inspection and artifact-count grep
- H2: Tab switching works correctly (only one business panel visible at a time) —
  testable via Playwright click-and-assert
- H3: Markdown tables are rendered as `<table>` HTML (not `<pre>` text) — testable
  by DOM query for `<table>` elements
- H4: No horizontal overflow at 1200/1440/1920px — testable by Playwright viewport
  resize

---

## Design Decisions (locked)

### Tab pattern

Three tabs at page top: `HEAD` | `PET` | `BRIK`. Active tab highlighted with
venture colour (purple/green/gold). Tab content panels use `display: none` /
`display: block` toggled via JS click handler. Default: first tab active (HEAD).

### Section layout within each business panel

Each panel contains sections in this order:
1. **Strategy & Outcome** — `plan.user.md` (full, always visible)
2. **This Week** — latest weekly K/P/C/S Decision (full, always visible)
3. **Priorities & Actions** — Launch Readiness Backlog (full, always visible)
4. **Forecast** — forecast doc (full content, in `<details>` open by default)
5. **Offer / ICP** — offer doc or intake ICP section (T1 for PET; T2 collapsed for HEAD/BRIK using intake packet)
6. **Naming** — naming shortlist (PET only, T1)
7. **Market Intelligence** — resolved dated research file (T2, collapsed)
8. **Priorities Scorecard** — (T2, collapsed)
9. **Site Upgrade Brief** — (T2, collapsed)
10. **Supporting Docs** — brand dossier, product spec, feasibility studies, signal review (T2, collapsed)
11. **Reference / Baselines** — T3 data artifacts (collapsed, visually de-emphasised)

Note: section ordering varies by business where a section doesn't apply (e.g. PET
has no T3 baselines; BRIK has no naming shortlist).

### Collapsible pattern

Use HTML `<details>/<summary>` for T2 and T3 sections. T1 sections are always open.
Summary element shows: artifact name, stage tag, status badge, and line count hint.

### Markdown-to-HTML conversion rules

| Markdown | HTML |
|----------|------|
| `# Heading` | `<h3 class="artifact-h1">` |
| `## Section` | `<h4 class="artifact-h2">` |
| `### Sub` | `<h5 class="artifact-h3">` |
| `\| table \|` | `<table class="content-table">` |
| `- list` | `<ul>` |
| `1. list` | `<ol>` |
| `**bold**` | `<strong>` |
| `*italic*` | `<em>` |
| `` `code` `` | `<code>` |
| `---` divider | `<hr class="section-divider">` |
| Frontmatter block | Omitted entirely |

---

## Questions

### Resolved

- Q: Should ALL 44 artifacts be embedded, or a curated subset?
  - A: All 44 content slots, using a content tier model. T1 always visible; T2
    collapsible open-by-default; T3 collapsed. Nothing excluded. **Counting
    contract**: 44 registry slots, 6 of which are pointer files. Each pointer
    slot is filled by its resolved dated source file — the pointer itself is
    omitted. Slot count stays 44; rendered document content comes from 44
    sources (38 direct files + 6 resolved dated files).

- Q: Do pointer files (`latest.user.md`) get embedded as-is?
  - A: No — applies to both pointer types. Resolve each pointer and embed the
    dated source file. Pointer files contain only metadata (~20 lines). Two
    pointer types exist: `Type: Market-Intelligence-Pointer` (3 files, under
    `market-research/`) and `Type: Site-Upgrade-Pointer` (3 files, under
    `site-upgrades/`). Both types are resolved and embedded as T2.

- Q: Tab vs sidebar selector for business switching?
  - A: Tabs. The sidebar pattern is already used for section navigation in the
    workflow HTML. Tabs at the top give a clear business-switching affordance
    without conflating with section nav.

- Q: Does this replace or sit alongside the current output registry?
  - A: Replaces. Same filename `startup-loop-output-registry.user.html`. The
    path-listing is superseded by the full-text version.

### Open

None — all questions resolved.

---

## Confidence Inputs

- Implementation: 80%
  - Basis: All 44 source files identified and accessible (including 6 pointer
    files resolved to their dated source files). Markdown-to-HTML conversion rules
    defined. Design system available to copy. Tab pattern is straightforward CSS/JS.
  - Cap applied: Business fail-first rule (Red/VC plan present, no Green yet) →
    max score is 80%. Pre-cap signal would be ~90%.

- Approach: 90%
  - Basis: Tier model confirmed. Section layout locked. Collapsible pattern chosen.
    All file sizes measured (including market intel and site-upgrade resolved files).

- Impact: 95%
  - Basis: User explicitly requested this upgrade. The path-list version is
    acknowledged as insufficient; full-text version directly addresses the need.

- Delivery-Readiness: 92%
  - Basis: Source files all readable, design reference available, output path
    confirmed, no approvals needed.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| BRIK market intelligence file is long (429 lines) | Confirmed | Low | Already T2 collapsible; `<details>` keeps it out of initial DOM. Acceptable — does not affect HEAD/PET tabs |
| BRIK panel is significantly longer than HEAD/PET | High | Low | Tab isolation means BRIK length doesn't affect HEAD/PET readability; T3 deep-collapsed |
| Markdown tables with complex cell content render poorly | Medium | Medium | Test representative tables (forecast scenario table, KPI watchlist, competitor pricing) during build refactor pass |
| File size of single HTML becomes large (>500KB) | Low | Low | Static file served locally; no performance budget applies for a dev-only artifact |
| Source file content changes between fact-find and build | Low | Low | Snapshot date clearly labelled; no live sync intended |

---

## Suggested Task Seeds (Non-binding)

1. **Build HEAD panel** — Extract and convert all HEAD artifacts (T1 always-open,
   T2/T3 collapsible). Resolve both pointer types (market-intelligence 202 lines,
   site-upgrade 152 lines) to their dated source files. ~11 content slots.
2. **Build PET panel** — Extract and convert all PET artifacts. Offer doc and naming
   shortlist are T1 prominent. Resolve both pointer types (market-intelligence 240
   lines, site-upgrade 142 lines). ~13 content slots.
3. **Build BRIK panel** — Extract and convert all BRIK artifacts. Most complex:
   20 content slots, signal review, product spec, sales funnel brief. Resolve both
   pointer types (market-intelligence 429 lines, site-upgrade 160 lines).
4. **Build HTML shell + tab switcher** — Page header, tab strip with venture colours,
   JS tab switching, sidebar section nav, CSS from reference file.
5. **Playwright QA** — Tab switching, H1–H4 hierarchy, `<table>` presence, no
   overflow at 1200/1440/1920px.

---

## Execution Routing Packet

- Primary execution skill: `lp-do-build` (business-artifact track → HTML document)
- Supporting skills: none
- Deliverable acceptance package:
  - File replaces `docs/business-os/startup-loop-output-registry.user.html`
  - All 44 content slots rendered (38 direct files + 6 pointer slots resolved
    to their dated source files); tiered T1/T2/T3
  - Tab switching works (one business visible at a time)
  - Markdown tables rendered as `<table>`, not `<pre>`
  - No horizontal overflow at 1200/1440/1920px
  - Snapshot date 2026-02-19 displayed
- Post-delivery measurement plan: None — static reference artifact

---

## Evidence Gap Review

### Gaps Addressed
- Full content volume measured for 44 content slots (~6,296 lines total)
- Tier model derived from content type and "thinking" signal density
- Both pointer types resolved: market-intelligence (HEAD 202, PET 240, BRIK 429
  lines) and site-upgrade (HEAD 152, PET 142, BRIK 160 lines) — all measured
- Counting contract defined: 44 registry slots = 38 direct files + 6 pointer
  slots each filled by their dated source file
- Design decisions locked (tabs, section layout, markdown-to-HTML rules, collapsibles)

### Confidence Adjustments
- BRIK market intelligence (429 lines) is longer than initially estimated (200–400
  range). Still T2 collapsible; no readability impact. Risk row updated to Confirmed.
- BRIK T1 is denser than HEAD/PET T1 (~480 lines vs ~220/~820 respectively due
  to signal review). This is accurate signal about BRIK's more advanced stage.
- Implementation confidence pre-cap is ~90%; capped to 80% by business fail-first
  rule (no Green evidence yet).

### Remaining Assumptions
- Markdown-to-HTML conversion is done manually during build (no automated parser
  available in the HTML build context)

---

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan` to sequence the four build tasks, then
  `/lp-do-build startup-loop-briefing-doc`
