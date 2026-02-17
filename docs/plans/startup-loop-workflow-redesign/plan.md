---
Type: Plan
Status: Complete
Domain: Business-OS
Workstream: Operations
Created: 2026-02-17
Last-updated: 2026-02-17
Feature-Slug: startup-loop-workflow-redesign
Deliverable-Type: doc-rewrite
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-build
Supporting-Skills: none
Overall-confidence: 86%
Confidence-Method: weighted average by effort; per-task sub-scores are informational only
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: BOS
Card-ID: none
---

# Startup Loop Workflow Redesign Plan

## Summary

`docs/business-os/startup-loop-workflow.user.md` currently conflates operator and engineering audiences in a single flat document, forcing operators to navigate through engineering jargon to find their next action. This redesign restructures the document into an operator-first body with a "Today" panel per business (HEAD/PET/BRIK), plain-language gate questions, per-business action cards, and a simplified "Loop in 8 steps" diagram — while preserving all engineering content in an engineering appendix hidden by default in the HTML companion (toggle to reveal). A prerequisite code change (TASK-00) upgrades the render script to support a single `<section data-audience="engineering">` wrapper and injects an audience-toggle button into the HTML companion. The result is a document where an operator can reach their next action for any business within 30 seconds of opening it.

## Goals

- Operators can open the document and within 30 seconds see exactly what action to take next for HEAD, PET, or BRIK.
- Plain English throughout the operator layer — no MCP tool names, no D1/entitySha references, no repo path strings.
- Technical detail preserved and accurate in the appendix for engineers and agent runs.
- A single simplified "Loop in 8 steps" diagram replaces five nested Mermaid charts as the primary orientation view.
- HTML companion gains an audience toggle (operator / engineering) so the same file serves both audiences.
- Gate questions are readable by a non-technical operator (plain yes/no, not RG-xx codes).
- Sections tagged with `data-audience` attribute so the toggle is semantically grounded.
- HTML is regenerated via `pnpm docs:render-user-html` after every content change.

## Non-goals

- Do not change the underlying startup-loop logic, stage ordering, or artifact contracts.
- Do not alter any referenced artifact files (plan.user.md, forecast docs, measurement-verification docs).
- Engineering content may be duplicated: the original version remains verbatim in the engineering appendix; operator-friendly summaries or rewrites are additive new sections, not replacements of the originals.
- Do not change the `loop-spec.yaml` canonical source or any MCP tooling.
- Do not redesign the Business OS UI or any persisted BOS data structures.

## Constraints & Assumptions

- Constraints:
  - Source file is `docs/business-os/startup-loop-workflow.user.md`; the HTML companion must be regenerated via `pnpm docs:render-user-html -- <path.user.md>` after every edit.
  - Original engineering sections (RG table, Open Tasks table, hand-off map, all five Mermaid diagrams, BOS sync contract) are preserved verbatim in the engineering appendix. New operator-friendly versions of those sections are additive — they do not replace the originals.
  - The "Loop in 8 steps" diagram must remain valid Mermaid syntax rendered in the markdown.
  - The render script currently drops all raw HTML (no `allowDangerousHtml`). TASK-00 must upgrade it before `<section data-audience="engineering">` wrapper and `data-audience` attributes survive the pipeline.
  - Audience toggle JS must be inline in `wrapHtmlDocument()` — no additional external CDN beyond the existing Mermaid CDN.
- Assumptions:
  - Mermaid already uses a CDN exception in `wrapHtmlDocument()` — confirmed in render script. The audience toggle is inline JS only.
  - The operator audience is primarily Pete as venture-studio operator, with the document also used by AI agents as context.
  - Current business state (HEAD/PET/BRIK gaps) as documented in section 5 of the source file is accurate as of 2026-02-13 and will be updated during the rewrite to reflect 2026-02-17 current state.

## Operator Naming Registry

Plain-language names used in operator sections, with engineering details behind.

| Operator label | What it is | Engineering detail (path / template) |
|---|---|---|
| Operational Confirmations Form (HEAD) | The structured set of 6 inputs needed to make the HEAD forecast decision-grade | `docs/business-os/startup-baselines/HEAD-forecast-seed.user.md` §"Still missing / needs confirmation" |
| Operational Confirmations Form (PET) | The structured set of inputs needed to make the PET forecast decision-grade | `docs/business-os/startup-baselines/PET-forecast-seed.user.md` §"Required Data to Upgrade" |
| Pre-website Measurement Setup checklist | Steps to configure GA4, Search Console, and event tracking before paid traffic starts | Template: `docs/business-os/workflow-prompts/_templates/pre-website-measurement-bootstrap-prompt.md`; output: `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-pre-website-measurement-setup.user.md` |
| GA4 Standard Report Verification | Opening GA4 standard reports (not Realtime) and confirming non-zero signal for web_vitals and begin_checkout over a 7-day window | `docs/business-os/strategy/BRIK/2026-02-13-measurement-verification.user.md` |
| Forecast Recalibration | Updating the 90-day forecast using measured week-1/2 actuals to replace seed assumptions | Template: `docs/business-os/workflow-prompts/_templates/forecast-recalibration-prompt.md`; output: `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-forecast-recalibration.user.md` |
| Weekly K/P/C/S Decision | The weekly Keep/Pivot/Scale/Kill review for a business | Template: `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md`; output: `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-weekly-kpcs-decision.user.md` |

## Fact-Find Reference

- Related brief: `docs/plans/startup-loop-workflow-redesign/fact-find.md`
- Key findings used:
  - Source document confirmed to have no "you are here" section in first 300 lines; operator actions buried behind engineering jargon (fact-find §Evidence Audit).
  - Per-business gap tables exist in sections 5.2–5.4 and provide all content for "Today" panels (fact-find §Resolved Q4).
  - Render pipeline drops all raw HTML — `allowDangerousHtml: true` is a two-line fix to `remarkRehype()` and `rehypeStringify()` (fact-find §Resolved Extended Q1).
  - "If you have 10/30/60 minutes" uses status-check framing (returning operator), not onboarding framing (fact-find §Resolved Extended Q2).
  - All five original Mermaid diagrams must be preserved intact in the appendix (fact-find §Non-goals).

## Proposed Approach

- Option A: Full document restructure with a single engineering appendix wrapper (Model A toggle) and render-script upgrade.
- Option B: Create a separate operator-facing document, leaving the engineering document unchanged.
- Chosen approach: Option A. A single document with progressive disclosure is preferable to maintaining two diverging files. The engineering appendix is wrapped in one `<section data-audience="engineering">` block; the audience toggle in the HTML companion satisfies both audiences from one source.

## Plan Gates

- Foundation Gate: Pass — fact-find complete, deliverable type confirmed (doc-rewrite), execution track confirmed (mixed), primary execution skill confirmed (lp-build), delivery-readiness 90%.
- Build Gate: Pass — TASK-00 confidence 88% >= 80%; all content tasks confidence >= 82%; no blocking unknowns.
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes (gates pass; not auto-continuing — user did not request it)

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-00 | IMPLEMENT (code) | Upgrade render script: safe HTML passthrough, audience toggle (Model A), TOC filtering, print CSS | 88% | S | Complete (2026-02-17) | - | TASK-06, TASK-11 |
| TASK-01 | IMPLEMENT (biz) | Write "Loop in 8 steps" Mermaid diagram | 85% | S | Complete (2026-02-17) | - | TASK-07 |
| TASK-02 | IMPLEMENT (biz) | Write "Today" operator panels for HEAD, PET, BRIK | 90% | S | Complete (2026-02-17) | - | TASK-07 |
| TASK-03 | IMPLEMENT (biz) | Write operator-facing action cards for each business | 88% | S | Complete (2026-02-17) | - | TASK-07 |
| TASK-04 | IMPLEMENT (biz) | Write plain-language gate questions (additive; original RG table preserved in appendix) | 82% | S | Complete (2026-02-17) | - | TASK-07 |
| TASK-05 | IMPLEMENT (biz) | Add new operator/engineering task tables; original Open Tasks table preserved in appendix | 88% | S | Complete (2026-02-17) | - | TASK-07 |
| TASK-06 | IMPLEMENT (biz) | Add data-audience="engineering" wrapper to engineering appendix (Model A) | 82% | S | Complete (2026-02-17) | TASK-00, TASK-07 | TASK-11 |
| TASK-07 | IMPLEMENT (biz) | Restructure main document body | 85% | L | Complete (2026-02-17) | TASK-01,02,03,04,05,08,09,10 | TASK-06 |
| TASK-08 | IMPLEMENT (biz) | Replace "Practical Reading Order" with "If you have 10/30/60 minutes" | 88% | S | Complete (2026-02-17) | - | TASK-07 |
| TASK-09 | IMPLEMENT (biz) | Add new operator-readable hand-off map; original preserved in engineering appendix | 85% | S | Complete (2026-02-17) | - | TASK-07 |
| TASK-10 | IMPLEMENT (biz) | Rename page purpose statement | 95% | S | Complete (2026-02-17) | - | TASK-07 |
| TASK-11 | CHECKPOINT | Regenerate HTML companion and verify output | 85% | S | Complete (2026-02-17) | TASK-00,06,07 | - |
| TASK-12 | IMPLEMENT (biz) | Audit and fix anchor links after restructure | 88% | S | Complete (2026-02-17) | TASK-07, TASK-11 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-00 | - | Code change; do first; unblocks TASK-06 and TASK-11 |
| 2 | TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, TASK-08, TASK-09, TASK-10 | - | All pure content authoring; fully parallelizable |
| 3 | TASK-07 | TASK-01, 02, 03, 04, 05, 08, 09, 10 | Restructure requires all operator content written first |
| 4 | TASK-06 | TASK-00 + TASK-07 | data-audience tagging requires restructured doc and working pipeline |
| 5 | TASK-11 | All prior TASK-00..10 | Final render verification gate |
| 6 | TASK-12 | TASK-07, TASK-11 | Anchor audit after restructure complete |

## Tasks

---

### TASK-00: Upgrade render script — safe HTML passthrough, audience toggle (Model A), TOC filtering, print CSS

- **Type:** IMPLEMENT
- **Deliverable:** Code change to `scripts/src/render-user-doc-html.ts`
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `scripts/src/render-user-doc-html.ts`
- **Depends on:** -
- **Blocks:** TASK-06, TASK-11
- **Confidence:** 88%
  - Implementation: 90% — changes are specified; all context confirmed from render script inspection
  - Approach: 88% — safe `rehype-sanitize` approach is the standard ecosystem answer for controlled HTML passthrough; TOC filtering and print CSS are straightforward CSS additions
  - Impact: 88% — this change enables the entire audience-split feature; without it, all `<details>` and `data-audience` markup is silently stripped
- **Changes required (4 sub-tasks):**
  - **(a) Safe HTML passthrough with sanitization — correct pipeline order.** The correct order to ensure sanitization actually sees raw HTML nodes (not opaque raw strings) is: `remarkRehype({ allowDangerousHtml: true })` → `rehypeRaw` (turns raw HTML string nodes into real hast nodes) → `rehypeSanitize(schema)` → `rehypeStringify({ allowDangerousHtml: false })`. Without `rehypeRaw`, raw HTML nodes may pass through as opaque strings and `rehypeSanitize` never inspects them — meaning `<script>` could survive. The sanitize schema EXTENDS the default schema (which already allows `p`, `h2`, `table`, `ul`, `pre`, `code`, `blockquote`, and all standard markdown output tags); do not replace the default — only add: `details`, `summary`, `section` to the allowed tags list, and `data-audience` to the allowed attributes list. Explicitly ensure `script`, `style`, `iframe`, `object`, and all `on*` inline event handlers are blocked (they are blocked by the default schema; verify they remain blocked after extension). Check whether `rehype-sanitize` and `rehype-raw` are available in `packages/editorial` dependencies. If not available, implement a minimal allowlist rehype plugin inline (< 30 lines) with the same guarantee.
  - **(b) Audience toggle — Model A.** Inject into `wrapHtmlDocument()`: (1) CSS that hides `[data-audience="engineering"]` by default; (2) a single "Show technical details / Hide technical details" toggle button that toggles a `.show-engineering` class on `<body>`; (3) when `.show-engineering` is present, `[data-audience="engineering"]` becomes visible; (4) print CSS: `@media print { [data-audience="engineering"] { display: none !important; } }` — operator-only print by default. The toggle JS and the Mermaid re-render handler MUST be inside the same `<script type="module">` block that currently imports Mermaid, because `mermaid` is a module-scoped import — a separate script cannot reference it. Concretely: add the toggle button click handler inside the existing `<script type="module">` block, after `mermaid.initialize(...)`, so it can call `mermaid.run()` or equivalent to re-render diagrams that become visible after the toggle. No new CDN. No `<details>` per-section nesting for the audience mechanism.
  - **(c) TOC filtering — required.** Inspect the current render script output for TOC generation code. Based on code inspection of `scripts/src/render-user-doc-html.ts`, no TOC is currently generated — the script only converts markdown to HTML and wraps it. Therefore: (1) TOC filtering for this task is N/A in the current pipeline. (2) Add a comment block in `wrapHtmlDocument()` immediately before the Mermaid script: `// IMPORTANT: If a TOC is ever added to this pipeline, it MUST be generated from headings outside [data-audience="engineering"] when in operator mode. Do not generate TOC from all h2/h3 headings without audience filtering.` (3) Add TC-05 to the validation contract to confirm no auto-TOC exists in the rendered output (so the guard comment is verified to be the correct current state). If a TOC IS found to exist, add JS to filter out headings inside `[data-audience="engineering"]` from the TOC in operator mode before proceeding.
  - **(d) Markdown-inside-raw-HTML test + explicit Fallback A.** Before writing the change, author a test `.user.md` file (temporary) containing both a `<details>` block AND a `<section data-audience="engineering">` block with representative markdown inside each: a `##` heading, a GFM table, a fenced mermaid block, and a bullet list. Render it. Verify all inner content renders as markdown (not escaped text). If inner markdown FAILS to render (a known risk with block HTML in remark/rehype — the processor may treat the entire HTML block as opaque): **Fallback A (preferred):** abandon raw HTML wrappers in the markdown source entirely. Instead, use a standard markdown heading `## Engineering appendix` to mark the start of engineering content, then in `wrapHtmlDocument()` use DOM manipulation (or a rehype plugin) to find that heading and wrap everything from it onwards in `<section data-audience="engineering">...</section>` at render time. This approach requires no raw HTML in markdown, sidesteps the markdown-in-HTML parsing issue entirely, and is safer. If Fallback A is taken, sub-task (a) simplifies to no-op (no sanitization needed; standard pipeline sufficient).
- **Acceptance:**
  - Pipeline order confirmed: `remarkRehype({ allowDangerousHtml: true })` → `rehypeRaw` → `rehypeSanitize(schema)` → `rehypeStringify({ allowDangerousHtml: false })` (or Fallback A: no raw HTML in pipeline at all; wrapper injected in `wrapHtmlDocument()`)
  - Sanitize schema EXTENDS default schema — all standard markdown output tags (`p`, `h1`–`h6`, `table`, `ul`, `ol`, `li`, `pre`, `code`, `blockquote`, etc.) remain allowed; additions are `details`, `summary`, `section`, `data-audience` attr
  - Sanitize blocks `<script>`, inline `on*` handlers, `<iframe>` — confirmed by TC-02
  - Test file with markdown inside `<section data-audience="engineering">` (heading + table + mermaid + bullets) renders all inner content correctly — TC-01 and TC-01b
  - `wrapHtmlDocument()` audience toggle CSS + JS are inside the existing `<script type="module">` block (same module as Mermaid import); toggle click handler calls `mermaid.run()` after showing engineering section
  - Print CSS `@media print { [data-audience="engineering"] { display: none !important; } }` present in `wrapHtmlDocument()`
  - TOC: `wrapHtmlDocument()` contains forward-guard comment; TC-05 confirms no auto-TOC in current rendered output
  - No external CDN added beyond existing Mermaid CDN
  - `pnpm docs:render-user-html -- docs/business-os/startup-loop-workflow.user.md` completes without errors
- **Validation contract (TC-00):**
  - TC-01: Render test file with markdown inside `<details data-audience="engineering"><summary>...</summary>...content...</details>` → heading renders as `<h2>`, table as `<table>`, mermaid as `<pre class="mermaid">`, bullets as `<ul>` (inner markdown parsed correctly)
  - TC-01b: Same test but using `<section data-audience="engineering">...content...</section>` wrapper → same inner markdown parsing verification
  - TC-02: Render test file containing `<script>alert(1)</script>` → rendered HTML does NOT contain `<script>` tag
  - TC-03: Rendered workflow HTML contains audience toggle button; `[data-audience="engineering"]` has `display:none` by default in CSS; toggle button click shows the engineering section
  - TC-04: `@media print` CSS block hides `[data-audience="engineering"]` in rendered HTML
  - TC-05: Inspect rendered HTML for `<nav>` or any element containing links to `h2`/`h3` headings → confirm no auto-generated TOC present (forward-guard comment sufficient for current state)
- **Execution plan:** Red → Green → Refactor
  - Red: Run render command on current source; confirm `<details>` stripped from output.
  - Green: Add sanitized raw HTML passthrough; test markdown-inside-details; add toggle CSS/JS; run render command again; confirm `<details>` preserved and toggle present.
  - Refactor: Confirm no existing `.user.md` files break; review sanitize allowlist for completeness.
- **Planning validation:** None required — S-effort with all context confirmed.
- **Scouts:** None — render pipeline internals confirmed via fact-find.
- **Edge Cases & Hardening:**
  - If `rehype-sanitize` / `rehype-raw` not available in `packages/editorial`: implement inline allowlist plugin (< 30 lines), OR take Fallback A (no raw HTML in pipeline at all).
  - Fallback A (if markdown-inside-raw-HTML fails): use `## Engineering appendix` marker heading in markdown; in `wrapHtmlDocument()` DOM-walk the parsed HTML body and wrap all nodes after that heading in `<section data-audience="engineering">`. No sanitization pipeline changes needed. This is the cleaner path if sub-task (d) test fails.
  - Mermaid module scope: the audience toggle JS MUST live in the same `<script type="module">` block as the Mermaid import. A separate non-module script cannot access the `mermaid` ESM import. The toggle handler calls `mermaid.run({ nodes: document.querySelectorAll('.mermaid') })` (or `mermaid.contentLoaded()` per version) after showing the engineering section so diagrams inside the hidden section render correctly.
  - Existing `.user.md` files with no `data-audience` attributes: toggle button renders but has no effect — acceptable.
- **Build evidence (2026-02-17):**
  - Fallback A taken: `rehype-raw` and `rehype-sanitize` not available in `packages/editorial`; no raw HTML in pipeline.
  - `wrapEngineeringAppendix()` added: injects `<section data-audience="engineering">` at `## Engineering appendix` marker heading via string transform.
  - `processFile()` updated: calls `wrapEngineeringAppendix()` after `transformMermaidBlocks()`.
  - `wrapHtmlDocument()` updated: audience toggle CSS (hide/show, print hide), `.audience-toggle` button, toggle JS inside existing `<script type="module">` (same scope as Mermaid import), `mermaid.run()` call on toggle.
  - TC-01b: N/A — no raw HTML in markdown; section wrapper injected at render time (Fallback A).
  - TC-02: Only 1 `<script>` tag in rendered HTML (the module script); no injected scripts from source.
  - TC-03: Toggle button (5 occurrences: button element + 4 CSS/JS references), `data-audience` CSS (4 occurrences: 3 CSS rules + 1 print rule), `mermaid.run` (2 occurrences: comment + call).
  - TC-04: `@media print` rule present hiding `[data-audience="engineering"]`.
  - TC-05: No `<nav>` in rendered HTML — confirmed zero matches; no auto-TOC; guard comment added.
  - Typecheck: no errors in `scripts/src/render-user-doc-html.ts` (pre-existing unrelated errors in `s2-market-intelligence-handoff.ts`).
  - Render command: `pnpm docs:render-user-html -- docs/business-os/startup-loop-workflow.user.md` → success.
- **Rollout / rollback:**
  - Rollout: Edit render script; run render command with TC tests; confirm output.
  - Rollback: `git checkout scripts/src/render-user-doc-html.ts`
- **Documentation impact:** None — render utility only.
- **Notes / references:**
  - Model A: single `<section data-audience="engineering">` wrapper; no nested `<details>` per section for the audience mechanism.
  - Fallback A is preferred if TC-01/TC-01b inner-markdown test fails — it avoids the entire raw-HTML-in-markdown problem.
  - `rehype-sanitize`, `rehype-raw`: check `packages/editorial/package.json` for availability before import.

---

### TASK-01: Write "Loop in 8 steps" Mermaid diagram

- **Type:** IMPLEMENT
- **Deliverable:** Mermaid `flowchart LR` diagram added to `docs/business-os/startup-loop-workflow.user.md` (new section, pre-restructure)
- **Execution-Skill:** lp-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-17)
- **Artifact-Destination:** `docs/business-os/startup-loop-workflow.user.md` — "Loop in 8 steps" section
- **Reviewer:** Pete
- **Approval-Evidence:** None required — internal operational document
- **Measurement-Readiness:** None — qualitative read-through confirms orientation value
- **Affects:** `docs/business-os/startup-loop-workflow.user.md`
- **Depends on:** -
- **Blocks:** TASK-07
- **Confidence:** 85%
  - Implementation: 88% — 8 operator-meaningful steps are specified in the plan brief; diagram authoring is straightforward
  - Approach: 90% — `flowchart LR` with 8 nodes is a well-understood Mermaid pattern; operator-language labels are specified
  - Impact: 85% — replaces 5 nested engineering diagrams as the primary orientation view; risk is that the simplification loses nuance (mitigated: all 5 original diagrams preserved in appendix)
- **Acceptance:**
  - `flowchart LR` diagram with exactly 8 nodes renders without Mermaid parse errors
  - Node labels are operator-language (no stage codes as primary text; stage codes as small parenthetical only)
  - The 8 steps are: 1. Setup, 2. Research, 3. Offer Design, 4. Forecast, 5. Channels, 6. Pick top actions, 7. Execute, 8. Weekly review
  - Arrows represent loop-back from step 8 to step 1
- **Validation contract (VC-01):**
  - VC-01: Paste diagram source into a Mermaid live previewer -> renders without syntax error and 8 nodes visible
  - VC-02: Read node labels aloud — no MCP tool names, no D1/entitySha refs, no stage codes as primary text -> all labels are plain operator English
- **Execution plan:** Red -> Green -> Refactor
  - Red evidence plan: Current document has no 8-step operator diagram (five engineering diagrams only).
  - Green evidence plan: Author `flowchart LR` with 8 nodes per spec; verify Mermaid render; insert into document.
  - Refactor evidence plan: Review labels with operator lens; ensure loop-back arrow is present.
- **Planning validation:** None required — S-effort content task with fully specified content.
- **Scouts:** None — 8-step breakdown is specified and directly derivable from the existing loop-spec.
- **Edge Cases & Hardening:** If 8 steps feels too compressed, a note below the diagram can reference the appendix for full detail.
- **What would make this >=90%:** Pete confirming the 8-step breakdown matches his mental model of the loop.
- **Rollout / rollback:**
  - Rollout: Insert diagram into source doc; regenerate HTML after TASK-07 restructure.
  - Rollback: `git checkout` source doc.
- **Documentation impact:** Adds new section to `startup-loop-workflow.user.md`; existing 5 diagrams moved to appendix in TASK-07.
- **Build evidence (2026-02-17):**
  - Staging file written: `docs/plans/startup-loop-workflow-redesign/sections/task-01-loop-diagram.md`
  - `flowchart LR` with 8 nodes (N1–N8) + NEND terminal; stage codes as parentheticals; loop-back from N8 to N2 (Continue), Scale to N5, Kill to NEND.
  - Assembled into final document by TASK-07 (confirmed at lines ~40–80 of restructured doc).
- **Notes / references:**
  - The 8 operator-meaningful steps: Setup, Research, Offer Design, Forecast, Channels, Pick top actions, Execute, Weekly review.
  - Stage codes (S1, S2A, etc.) appear as small parentheticals only, not primary node labels.

---

### TASK-02: Write "Today" operator panels for HEAD, PET, BRIK

- **Type:** IMPLEMENT
- **Deliverable:** Three "Today" panels added to `docs/business-os/startup-loop-workflow.user.md`
- **Execution-Skill:** lp-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Artifact-Destination:** `docs/business-os/startup-loop-workflow.user.md` — "Today" section (one panel per business)
- **Reviewer:** Pete
- **Approval-Evidence:** None required — internal operational document
- **Measurement-Readiness:** None — "Today" panels are updated weekly as part of S10 cadence
- **Affects:** `docs/business-os/startup-loop-workflow.user.md`
- **Depends on:** -
- **Blocks:** TASK-07
- **Confidence:** 90%
  - Implementation: 92% — content directly from fact-find sections 5.2–5.4; blocker statements, next actions, and done-when criteria are fully specified in the plan brief
  - Approach: 95% — "Today" panel format (blocker + do this + done when) is a minimal, well-understood pattern
  - Impact: 90% — "Today" panel is the highest-value addition for operator time-to-action
- **Acceptance:**
  - Three panels: HEAD, PET, BRIK — each in a consistent format
  - Each panel contains exactly: current blocker statement, "Do this now" single action, "Done when" criterion
  - HEAD panel: blocker = operational confirmations missing; action = fill Operational Confirmations form AND complete Pre-website Measurement Setup checklist; done when = all 6 fields confirmed and timestamped + measurement setup doc at Active status
  - PET panel: blocker = inventory reality and first measured CPC/CVR missing; action = confirm inventory units/arrival date + landed cost, then run 7-day acquisition test; done when = inventory confirmed + first measured CPC/CVR captured + forecast upgraded to decision-grade
  - BRIK panel: blocker = GA4 measurement signal quality gap (web_vitals + begin_checkout not confirmed in standard reports); action = run GA4 report verification for web_vitals + begin_checkout for last 7-day window in standard reports (not realtime); done when = non-zero signal confirmed in standard 7-day GA4 report for both events, then run day-14 forecast recalibration
  - Date stamp of 2026-02-17 on each panel
  - No MCP tool names, no repo paths, no stage codes in operator text
- **Validation contract (VC-02):**
  - VC-01: Read each panel without prior context -> answer "what is blocking [business]?" and "what do I do right now?" within 30 seconds -> both answerable from the panel text alone
  - VC-02: Cross-reference each panel's blocker against fact-find sections 5.2–5.4 -> no material gaps or contradictions
- **Execution plan:** Red -> Green -> Refactor
  - Red evidence plan: Current document has no "Today" panel; operator must scroll 200+ lines to reach section 5 gap tables.
  - Green evidence plan: Author three panels using content from fact-find §Resolved Q4; insert into document.
  - Refactor evidence plan: Read panels cold; confirm 30-second time-to-action target; remove any jargon.
- **Planning validation:** None required — S-effort content task; all content specified.
- **Scouts:** None — per-business blocker content confirmed from source document sections 5.2–5.4.
- **Edge Cases & Hardening:** Panels will become stale; add explicit date stamp (2026-02-17) and note that panels are updated weekly as part of S10 cadence.
- **What would make this >=90%:** Already at 90%. Pete confirming panel format matches how he wants to consume the information.
- **Rollout / rollback:**
  - Rollout: Insert panels into source doc; regenerate HTML after TASK-07 restructure.
  - Rollback: `git checkout` source doc.
- **Documentation impact:** Adds "Today" section near top of `startup-loop-workflow.user.md`; section 5 gap tables move to appendix in TASK-07.
- **Build evidence (2026-02-17):**
  - Staging file written: `docs/plans/startup-loop-workflow-redesign/sections/task-02-today-panels.md`
  - Three panels (HEAD/PET/BRIK) with **Current blocker:**, **Do this now:**, **Done when:** labels; date stamped 2026-02-17; zero jargon confirmed.
  - Assembled into final document by TASK-07.
- **Notes / references:**
  - Content sourced from `startup-loop-workflow.user.md` sections 5.2–5.4 (as of 2026-02-13; reviewed for 2026-02-17 accuracy before publishing).

---

### TASK-03: Write operator-facing action cards for each business

- **Type:** IMPLEMENT
- **Deliverable:** Three action cards (HEAD, PET, BRIK) added to `docs/business-os/startup-loop-workflow.user.md`
- **Execution-Skill:** lp-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Artifact-Destination:** `docs/business-os/startup-loop-workflow.user.md` — "Per-business action cards" section
- **Reviewer:** Pete
- **Approval-Evidence:** None required
- **Measurement-Readiness:** None
- **Affects:** `docs/business-os/startup-loop-workflow.user.md`
- **Depends on:** -
- **Blocks:** TASK-07
- **Confidence:** 88%
  - Implementation: 90% — card content (title, why it matters, step-by-step, done criteria) fully specified in plan brief
  - Approach: 92% — action card format (why + steps + done criteria) is standard operator communication pattern
  - Impact: 88% — replaces repo-path evidence columns with actionable plain-language steps
- **Acceptance:**
  - Three cards: HEAD, PET, BRIK — each with plain language title, why it matters, numbered step-by-step "do this", done criteria
  - NO repo paths, NO stage codes, NO MCP/BOS/D1 references in any card
  - HEAD card: "Confirm HEAD operations" — steps: provide in-stock date + sellable units; confirm pricing + bundle options; provide compatibility matrix; confirm payment flow readiness; define returns policy + SLA — done when: all fields completed and timestamped
  - PET card: "Confirm PET supply + run first acquisition test" — steps: confirm inventory units + expected arrival date; confirm landed cost per unit; run a small paid acquisition test (7 days); capture observed CPC and CVR — done when: all inputs collected; upgrade forecast to decision-grade
  - BRIK card: "Restore GA4 measurement signal" — steps: open GA4 standard reports (not realtime); check begin_checkout for last 7 days; check web_vitals for last 7 days; if zero: investigate tag firing with GA4 DebugView on a live browser session; document signal status — done when: non-zero begin_checkout and web_vitals confirmed in standard reports for a 7-day window
- **Validation contract (VC-03):**
  - VC-01: Read each card without codebase context -> every step is actionable by a non-technical operator without further documentation -> no jargon present
  - VC-02: Each card's done criteria is unambiguous — a binary yes/no check -> no vague outcome language
- **Execution plan:** Red -> Green -> Refactor
  - Red evidence plan: Current document mixes repo paths and MCP tool names into operator-facing action items (confirmed in fact-find §Evidence Audit).
  - Green evidence plan: Author three cards per specification; review for jargon.
  - Refactor evidence plan: Read each card as a non-technical operator; flag any remaining jargon.
- **Planning validation:** None required — S-effort; all content specified.
- **Scouts:** None.
- **Edge Cases & Hardening:** If a step requires referencing another document, use a plain label ("Fill the Operational Confirmations form") not a repo path.
- **What would make this >=90%:** Already at 88%. Pete walking through each card and completing at least one step confirms usability.
- **Rollout / rollback:**
  - Rollout: Insert cards into source doc; regenerate HTML after TASK-07 restructure.
  - Rollback: `git checkout` source doc.
- **Documentation impact:** New "Per-business action cards" section in `startup-loop-workflow.user.md`.
- **Build evidence (2026-02-17):**
  - Staging file written: `docs/plans/startup-loop-workflow-redesign/sections/task-03-action-cards.md`
  - Three cards (HEAD/PET/BRIK) with numbered steps; zero repo paths; binary Done when criteria.
  - Assembled into final document by TASK-07.
- **Notes / references:**
  - Card content derived from fact-find §Resolved Q4 and source document section 5.

---

### TASK-04: Write plain-language gate questions

- **Type:** IMPLEMENT
- **Deliverable:** New "Readiness check" section with six plain-language questions added to `docs/business-os/startup-loop-workflow.user.md`; original RG table unchanged and preserved in engineering appendix
- **Execution-Skill:** lp-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Artifact-Destination:** `docs/business-os/startup-loop-workflow.user.md` — "Readiness gates" section
- **Reviewer:** Pete
- **Approval-Evidence:** None required
- **Measurement-Readiness:** None
- **Affects:** `docs/business-os/startup-loop-workflow.user.md`
- **Depends on:** -
- **Blocks:** TASK-07
- **Confidence:** 82%
  - Implementation: 85% — gate questions are specified in the plan brief; RG code mapping is explicit
  - Approach: 88% — replacing code-based gates with plain yes/no questions is a well-understood communication pattern
  - Impact: 82% — slight uncertainty that the 6-question condensation preserves full gate logic without gaps (mitigated: RG codes retained in collapsed appendix)
- **Acceptance:**
  - A new "Readiness check" section with 6 plain-language Yes/No questions is ADDED to the operator body
  - The original RG-01..RG-07 gate table is preserved verbatim in the engineering appendix (not deleted or paraphrased)
  - Questions are:
    1. Is the offer defined clearly enough to test with real customers? (replaces RG-01/RG-02)
    2. Is measurement set up and producing real data? (replaces RG-03)
    3. Do we have baseline data to compare against? (existing businesses only) (replaces RG-04)
    4. Do we have inventory and cost inputs to build a reliable forecast? (replaces RG-05)
    5. Have we chosen our 2–3 launch channels and do we have a plan for each? (replaces RG-06)
    6. Have we selected and scored the top 2–3 things to work on next? (replaces RG-07)
  - RG codes (RG-01..RG-07) are preserved in the engineering appendix section, not deleted
  - Each question is answerable Yes/No without reading any other document
  - No RG codes in the operator body of the questions
- **Validation contract (VC-04):**
  - VC-01: Walk each plain-language question against the original RG spec (from source document section 4) -> each question covers the same logical condition as the RG code(s) it replaces -> no gate logic is lost
  - VC-02: Answer all 6 questions for BRIK based on current state from fact-find -> answers align with known BRIK state (confirms calibration)
- **Execution plan:** Red -> Green -> Refactor
  - Red evidence plan: Current document has only the RG-01..RG-07 coded gate table; no operator-friendly gate questions exist.
  - Green evidence plan: Author 6 plain-language questions per spec; verify RG-code mapping; insert into document as new section.
  - Refactor evidence plan: Walk questions against RG spec; confirm no logic gaps; confirm original RG table is preserved verbatim in appendix.
- **Planning validation:** None required — S-effort; gate mapping is explicit.
- **Scouts:** None — gate questions derived directly from source document section 4.
- **Edge Cases & Hardening:** The "(existing businesses only)" qualifier on Q3 must be retained to prevent new-business operators from failing an inapplicable gate.
- **What would make this >=90%:** Pete answering each question for one business and confirming the gate accurately describes the real condition.
- **Rollout / rollback:**
  - Rollout: Add new gate questions section to source doc; confirm RG table remains in appendix; regenerate HTML.
  - Rollback: `git checkout` source doc.
- **Documentation impact:** "Readiness gates" section in `startup-loop-workflow.user.md` adds new 'Readiness check' section above; original RG table moves to appendix unchanged in TASK-07.
- **Build evidence (2026-02-17):**
  - Staging file written: `docs/plans/startup-loop-workflow-redesign/sections/task-04-gate-questions.md`
  - 6 plain-language questions with Q3 "(existing businesses only)" qualifier; blockquote note pointing to RG-01..RG-07 in appendix.
  - Assembled into final document by TASK-07.
- **Notes / references:**
  - RG codes are engineering/agent reference; they must not be deleted, only preserved in appendix.

---

### TASK-05: Add new operator and engineering task tables

- **Type:** IMPLEMENT
- **Deliverable:** Two new tables added to `docs/business-os/startup-loop-workflow.user.md`: "Business Operator Actions" (operator body) and "Platform Engineering Actions" (engineering appendix); original "Open Tasks" table preserved verbatim in engineering appendix
- **Execution-Skill:** lp-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Artifact-Destination:** `docs/business-os/startup-loop-workflow.user.md` — "Business Operator Actions" and "Platform Engineering Actions" sections
- **Reviewer:** Pete
- **Approval-Evidence:** None required
- **Measurement-Readiness:** None
- **Affects:** `docs/business-os/startup-loop-workflow.user.md`
- **Depends on:** -
- **Blocks:** TASK-07
- **Confidence:** 88%
  - Implementation: 90% — current table content confirmed in fact-find; operator vs engineering split is clear from ownership metadata
  - Approach: 92% — two separate tables with different columns per audience is a standard progressive-disclosure pattern
  - Impact: 88% — eliminates the current problem of repo paths and MCP task references appearing in the operator view
- **Acceptance:**
  - "Business Operator Actions" table: columns are Action, Why it matters, Done when — NO evidence paths, NO MCP tool names, NO stage codes; items owned by Pete
  - "Platform Engineering Actions" table: columns are Action, Why it matters, Done when — engineering/agent owned items; stage codes permitted here
  - Each table has its own heading
  - All items from the current "Open Tasks" table appear in at least one of the two new tables (coverage check)
  - The original "Open Tasks" table is preserved verbatim in the engineering appendix as a third reference table
  - Business Operator items include: HEAD operational confirmations, PET inventory + acquisition test, BRIK GA4 signal verification, weekly K/P/C/S decision cadence, standing baseline refresh cadence
  - Platform Engineering items include: MCP TASK-05/06 identity/deployment decision, wave-2 measure_* connectors
- **Validation contract (VC-05):**
  - VC-01: Count items in old "Open Tasks" table -> count items across both new tables -> all items from original appear in at least one new table (coverage check)
  - VC-02: Read "Business Operator Actions" table without codebase context -> no item requires reading a repo file or knowing an MCP tool name to understand
- **Execution plan:** Red -> Green -> Refactor
  - Red evidence plan: Current "Open Tasks" table mixes owner types and includes evidence paths in operator rows (confirmed fact-find §Evidence Audit).
  - Green evidence plan: Sort current items by owner; author two new tables per spec; preserve original "Open Tasks" table in appendix.
  - Refactor evidence plan: Verify item coverage parity; strip any remaining jargon from operator table.
- **Planning validation:** None required — S-effort; source table content confirmed.
- **Scouts:** None.
- **Edge Cases & Hardening:** Items that are co-owned (operator decision triggers engineering action) should appear in the operator table with a note that it triggers a downstream platform action.
- **What would make this >=90%:** Already at 88%. Pete confirming operator table is complete from his perspective.
- **Rollout / rollback:**
  - Rollout: Add two new tables to source doc; confirm original table preserved in appendix; regenerate HTML.
  - Rollback: `git checkout` source doc.
- **Documentation impact:** "Open Tasks" section in `startup-loop-workflow.user.md` supplemented by two new operator/engineering sections; original table preserved in engineering appendix.
- **Build evidence (2026-02-17):**
  - Staging file written: `docs/plans/startup-loop-workflow-redesign/sections/task-05-task-tables.md`
  - Business Operator Actions (9 rows) in operator body; Platform Engineering Actions (4 rows) in engineering appendix.
  - Coverage: all items from original Open Tasks table appear in at least one new table; original Open Tasks preserved verbatim in engineering appendix by TASK-07.
  - Assembled into final document by TASK-07.
- **Notes / references:**
  - Source: `startup-loop-workflow.user.md` lines ~562–576 (current mixed table).

---

### TASK-06: Add data-audience="engineering" wrapper to engineering appendix (Model A)

- **Type:** IMPLEMENT
- **Deliverable:** Engineering appendix section in `docs/business-os/startup-loop-workflow.user.md` wrapped in a single `<section data-audience="engineering">` block
- **Execution-Skill:** lp-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Artifact-Destination:** `docs/business-os/startup-loop-workflow.user.md`
- **Reviewer:** Pete
- **Approval-Evidence:** None required
- **Measurement-Readiness:** None — visual inspection of HTML output confirms correct rendering
- **Affects:** `docs/business-os/startup-loop-workflow.user.md`, `[readonly] scripts/src/render-user-doc-html.ts`
- **Depends on:** TASK-00 (render pipeline must support raw HTML passthrough), TASK-07 (engineering appendix section must exist)
- **Blocks:** TASK-11
- **Confidence:** 82%
  - Implementation: 85% — single wrapper element around the engineering appendix; straightforward mechanical change
  - Approach: 88% — Model A (one wrapper, one CSS rule, one toggle) is simpler than per-section nesting; fewer failure modes
  - Impact: 82% — this is the mechanism that makes the operator/engineering split functional; depends on TASK-00 being correct
- **Model A decision:**
  - One `<section data-audience="engineering">` wraps the entire engineering appendix (everything after the operator body sections)
  - CSS in `wrapHtmlDocument()` hides this section by default: `[data-audience="engineering"] { display: none; }`
  - Toggle button (added in TASK-00) shows/hides it by toggling `.show-engineering` on `<body>`
  - NO nested `<details>` per engineering sub-section for the audience mechanism (avoids the three-mechanism redundancy critique)
  - Individual very large content blocks (e.g., huge diagrams) may optionally use `<details>` for sub-collapse, but this is cosmetic and independent of the audience toggle
- **Acceptance:**
  - Engineering appendix (all content from section 9 onwards in the restructured document) is wrapped in one `<section data-audience="engineering">...</section>` block
  - Operator body sections (sections 1–8) have no `data-audience` attribute or are tagged `data-audience="operator"` — they are visible by default regardless of toggle state
  - After TASK-00 render pipeline upgrade: `<section data-audience="engineering">` block survives the render pipeline (not stripped)
  - Rendered HTML: engineering section is hidden by default (CSS `display: none`); visible when toggle button is clicked
  - No nested `data-audience` attributes inside the engineering wrapper (single mechanism only)
- **Validation contract (VC-06):**
  - VC-01: Run `pnpm docs:render-user-html` → HTML output contains exactly one `<section data-audience="engineering">` block
  - VC-02: Open rendered HTML → operator sections visible without interaction; click "Show technical details" toggle → engineering appendix appears
  - VC-03: Click toggle again → engineering appendix hides again
  - VC-04: Open a Mermaid diagram inside the engineering section after toggling it visible → diagram renders correctly (Mermaid re-initialises on toggle)
- **Execution plan:** Red → Green → Refactor
  - Red: Before TASK-00: render pipeline strips raw HTML (confirmed).
  - Green: After TASK-00 complete: add single `<section data-audience="engineering">` wrapper around engineering appendix; re-render; confirm survival.
  - Refactor: Confirm operator sections unaffected; verify Mermaid diagrams render after toggle.
- **Planning validation:** None required — S-effort, single wrapper change.
- **Scouts:** TASK-00 acceptance criteria confirm render pipeline works before this task begins.
- **Edge Cases & Hardening:**
  - Mermaid CDN initialises on `startOnLoad: true`; diagrams inside the hidden section may not render when toggled visible. Add `details`/`section` `toggle`/click event listener in TASK-00 inline JS to call `mermaid.contentLoaded()` after toggle shows the section.
- **What would make this >=90%:** TASK-00 TC-01 and TC-03 passing (render pipeline confirmed working).
- **Rollout / rollback:**
  - Rollout: Add wrapper; regenerate HTML; verify TASK-11 checkpoint passes.
  - Rollback: `git checkout` source doc.
- **Documentation impact:** Engineering appendix in `startup-loop-workflow.user.md` gains a single `<section>` wrapper.
- **Build evidence (2026-02-17):**
  - Fallback A (from TASK-00): `wrapEngineeringAppendix()` in render script injects `<section data-audience="engineering">` at the `## Engineering appendix` H2 marker — no raw HTML required in markdown.
  - TASK-07 placed `## Engineering appendix` heading verbatim at line 206 of restructured document.
  - Rendered HTML confirms: `<section data-audience="engineering">` present at line 370 of `.user.html`.
  - TASK-06 acceptance: single `<section>` block confirmed; engineering section hidden by default; toggle functional (TASK-11 verified).
- **Notes / references:**
  - Model A decision: single wrapper mechanism chosen over per-section `<details>` + global CSS + toggle (three redundant mechanisms). See decision log.

---

### TASK-07: Restructure main document body

- **Type:** IMPLEMENT
- **Deliverable:** Rewritten `docs/business-os/startup-loop-workflow.user.md` with operator-first structure
- **Execution-Skill:** lp-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Pending
- **Artifact-Destination:** `docs/business-os/startup-loop-workflow.user.md`
- **Reviewer:** Pete
- **Approval-Evidence:** None required
- **Measurement-Readiness:** None — qualitative read-through is the measurement
- **Affects:** `docs/business-os/startup-loop-workflow.user.md`, `docs/business-os/startup-loop-workflow.user.html`
- **Depends on:** TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, TASK-08, TASK-09, TASK-10
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 88% — all content sections are written by prerequisite tasks; restructure is assembly work; main risk is section ordering and heading choices
  - Approach: 90% — operator-first document structure with progressive disclosure appendix is a standard pattern
  - Impact: 85% — the restructure is the primary user-facing change; risk of agent context disruption from heading renames mitigated by keeping all content present
- **Acceptance:**
  - Document structure matches the specified order:
    1. Front matter (updated: Updated date to 2026-02-17)
    2. Page purpose: "This page tells you what to do next for HEAD, PET, and BRIK — and how to do it." (TASK-10 content)
    3. Today panel (TASK-02 content) — one panel per business
    4. The Loop in 8 steps (TASK-01 diagram)
    5. Readiness gates (TASK-04 plain-language questions)
    6. Business operator actions (TASK-05: operator table)
    7. Per-business action cards (TASK-03 content)
    8. If you have 10/30/60 minutes (TASK-08 content)
    9. Platform engineering actions (TASK-05: engineering table) — inside the engineering appendix wrapper
    10. Stage reference table (existing section 4, intact) — inside the engineering appendix wrapper
    11. Technical appendix — all five Mermaid diagrams, artifact chains, BOS sync contract, original hand-off map (verbatim), original RG table (verbatim), original Open Tasks table (verbatim) — inside the engineering appendix wrapper; individual very large diagrams may optionally use `<details>` for sub-collapse
  - No content from the original document is deleted — all engineering detail is present in sections 9–11
  - All five original Mermaid diagrams are present in the technical appendix
  - HTML companion regenerated after restructure (run `pnpm docs:render-user-html`)
  - Front matter `Updated` field set to 2026-02-17
- **Validation contract (VC-07):**
  - VC-01: Fresh read-through of sections 1–8 without scrolling to appendix → operator can identify their next action for any business within 30 seconds without reading the engineering appendix
  - VC-02: Count Mermaid diagrams in the engineering appendix → exactly 5 diagrams present (same as original document)
  - VC-03: All original engineering sections are present verbatim in the appendix: (a) original RG-01..RG-07 gate table, (b) original "Open Tasks" table (section 2.5), (c) original hand-off map (section 10), (d) all five Mermaid flow diagrams (sections 2, 2.1, 2.2, 2.3, 2.4), (e) BOS sync contract (section 14)
  - VC-04: Operator body (sections 1–8) contains no MCP tool names, no D1/entitySha references, no repo file paths (search for `docs/`, `MCP`, `entitySha`, `D1` in sections 1–8 → zero matches)
- **Execution plan:** Red -> Green -> Refactor
  - Red evidence plan: Current document has engineering content in first 300 lines; operator "Current Missing Information" not reachable within 30 seconds.
  - Green evidence plan: Assemble all TASK-01..10 content into specified structure; move engineering sections to appendix.
  - Refactor evidence plan: Run timed read-through; confirm 30-second time-to-action target; run render check.
- **Planning validation (required for L):**
  - Checks run: Source document read (lines 1–700); all content confirmed present and rearrangeable; fact-find §Evidence Audit confirms no hidden dependencies.
  - Validation artifacts: `docs/plans/startup-loop-workflow-redesign/fact-find.md` §Evidence Audit and §Dependency & Impact Map.
  - Unexpected findings: None — restructure is assembly, not authoring.
- **Scouts:** All prerequisite tasks (TASK-01..05, 08..10) are effectively scouts — each content section is validated before assembly.
- **Edge Cases & Hardening:**
  - Agent prompts that reference specific section numbers or headings may break after restructure. Mitigation: keep heading text consistent where possible; rename only when clarity demands it.
  - Internal anchor links in the markdown must be updated after heading renames. These are audited explicitly in TASK-12.
- **What would make this >=90%:** Pete reading the restructured operator layer cold and confirming 30-second time-to-action target is met.
- **Rollout / rollback:**
  - Rollout: Rewrite source doc; regenerate HTML.
  - Rollback: `git checkout` source doc.
- **Documentation impact:** This is the primary documentation change — the entire `startup-loop-workflow.user.md` is restructured.
- **Build evidence (2026-02-17):**
  - All 8 staging files read and assembled into `docs/business-os/startup-loop-workflow.user.md`.
  - Final document: 1,167 lines total. `## Engineering appendix` marker at line 206.
  - Operator body (lines 1-205): zero `docs/` paths or MCP references confirmed by grep.
  - Engineering appendix (lines 206+): all 6 Mermaid diagrams present (5 from section 2 + 1 from section 3), all original sections 2-14 preserved verbatim.
  - VC-04 jargon search: grep of lines 1-205 for `docs/` and `MCP` returns zero matches.
- **Notes / references:**
  - Restructure is assembly of TASK-01..10 content into specified order; not new authoring.
  - Render HTML immediately after restructure to catch Mermaid or anchor link regressions.

---

### TASK-08: Replace "Practical Reading Order" with "If you have 10/30/60 minutes"

- **Type:** IMPLEMENT
- **Deliverable:** New "If you have 10/30/60 minutes" section in `docs/business-os/startup-loop-workflow.user.md`
- **Execution-Skill:** lp-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Artifact-Destination:** `docs/business-os/startup-loop-workflow.user.md` — "If you have 10/30/60 minutes" section
- **Reviewer:** Pete
- **Approval-Evidence:** None required
- **Measurement-Readiness:** None
- **Affects:** `docs/business-os/startup-loop-workflow.user.md`
- **Depends on:** -
- **Blocks:** TASK-07
- **Confidence:** 88%
  - Implementation: 90% — time-bracket content fully specified in plan brief; status-check framing is clear
  - Approach: 92% — time-boxed "what to do" sections are a standard returning-user navigation pattern
  - Impact: 88% — replaces "Practical Reading Order" which is onboarding-oriented; returning operator needs status-check framing
- **Acceptance:**
  - Section titled "If you have 10/30/60 minutes" replaces "Practical Reading Order"
  - 10-minute bracket: Read Today panel → pick one business → complete the top blocker action (a form fill, a checklist step, a single verification)
  - 30-minute bracket: Run the required checklist in full (measurement verification / baseline refresh / ops input form)
  - 60-minute bracket: Produce the required artifact (day-14 forecast recalibration doc / weekly K/P/C/S decision / complete action card)
  - Framing is status-check (returning operator who already knows the loop), not onboarding
  - No repo paths, no MCP references, no stage codes
- **Validation contract (VC-08):**
  - VC-01: Read the section as a returning operator with 10 minutes available -> section gives a single actionable starting point without ambiguity
  - VC-02: Read the section as a new operator -> section is clearly not onboarding material and defers to the "Today" panel for orientation
- **Execution plan:** Red -> Green -> Refactor
  - Red evidence plan: Current "Practical Reading Order" section is onboarding-oriented; does not serve a returning operator checking status.
  - Green evidence plan: Author three time-bracket entries per spec; replace old section.
  - Refactor evidence plan: Read as returning operator with 10 minutes; confirm clarity.
- **Planning validation:** None required — S-effort; content fully specified.
- **Scouts:** None.
- **Edge Cases & Hardening:** The "60 minutes" bracket names specific artifact types — ensure these names match the actual artifact labels used elsewhere in the document to avoid confusion.
- **What would make this >=90%:** Already at 88%. Pete confirming the 60-minute bracket names the artifacts he actually produces.
- **Rollout / rollback:**
  - Rollout: Replace old section in source doc; regenerate HTML after TASK-07 restructure.
  - Rollback: `git checkout` source doc.
- **Documentation impact:** Replaces "Practical Reading Order" section in `startup-loop-workflow.user.md`.
- **Build evidence (2026-02-17):**
  - Staging file written: `docs/plans/startup-loop-workflow-redesign/sections/task-08-time-brackets.md`
  - Three time brackets (10/30/60 minutes) with status-check framing; zero repo paths; artifact names match document vocabulary.
  - Assembled into final document by TASK-07.
- **Notes / references:**
  - Framing decision confirmed in fact-find §Resolved Extended Q2.

---

### TASK-09: Convert hand-off messages to human-readable action labels

- **Type:** IMPLEMENT
- **Deliverable:** New operator-readable version of the hand-off map added to operator body in `docs/business-os/startup-loop-workflow.user.md`; original hand-off map preserved verbatim in engineering appendix
- **Execution-Skill:** lp-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Artifact-Destination:** `docs/business-os/startup-loop-workflow.user.md` — hand-off map section (section 10 of source)
- **Reviewer:** Pete
- **Approval-Evidence:** None required
- **Measurement-Readiness:** None
- **Affects:** `docs/business-os/startup-loop-workflow.user.md`
- **Depends on:** -
- **Blocks:** TASK-07
- **Confidence:** 85%
  - Implementation: 88% — hand-off map section confirmed in source document; authoring pattern is specified
  - Approach: 90% — operator table with anchor links to engineering appendix is clean and avoids all path-in-operator-body violations
  - Impact: 85% — reduces cognitive load in the operator view; engineering agents get full paths from the preserved verbatim hand-off map in the appendix
- **Acceptance:**
  - A NEW "Quick Actions" table is added to the operator body: columns are Action (plain-language label), Stage, Done when — NO repo paths, NO template filenames, NO `<details>` blocks with paths inside the operator table (paths would fail TASK-07 VC-04 jargon search)
  - Each row's Action cell contains only a plain-language label (e.g., "Run: Pre-website Measurement Setup") and an anchor link to the corresponding row in the engineering appendix hand-off map (e.g., `[→ see details](#engineering-appendix)`) — the path itself lives only in the appendix
  - The ORIGINAL hand-off map (section 10) is preserved verbatim in the engineering appendix (not modified)
  - The new operator table and the original engineering table cover the same set of stages/triggers (coverage parity check)
  - TASK-07 VC-04 passes: search for `docs/` in sections 1–8 returns zero matches (no paths in operator body)
- **Validation contract (VC-09):**
  - VC-01: Read each row in the new "Quick Actions" table — no repo path appears in any cell; each action is understandable without repo access
  - VC-02: Confirm original hand-off map is present verbatim in the engineering appendix
  - VC-03: TASK-07 VC-04 grep test — `grep 'docs/' startup-loop-workflow.user.md` limited to sections 1–8 returns zero matches
- **Execution plan:** Red -> Green -> Refactor
  - Red evidence plan: Current hand-off map contains raw template paths as primary cell content; not readable by operator without repo access.
  - Green evidence plan: Author new "Quick Actions" table with plain labels; preserve original hand-off map in engineering appendix.
  - Refactor evidence plan: Read new table without expanding details; confirm orientation without repo knowledge; confirm original preserved verbatim.
- **Planning validation:** None required — S-effort; pattern is consistent and specified.
- **Scouts:** None.
- **Edge Cases & Hardening:** If a row has multiple paths (prompt + output), both paths are present in the verbatim original hand-off map in the engineering appendix. The operator table row links to the appendix section with a single anchor — no paths appear in the operator table itself.
- **What would make this >=90%:** Confirming every row in the source table has been covered in the new operator table (complete coverage).
- **Rollout / rollback:**
  - Rollout: Add new "Quick Actions" table; confirm original hand-off map preserved in appendix; regenerate HTML after TASK-07 restructure.
  - Rollback: `git checkout` source doc.
- **Documentation impact:** New "Quick Actions" operator table added to operator body; original hand-off map preserved verbatim in engineering appendix by TASK-07.
- **Build evidence (2026-02-17):**
  - Staging file written: `docs/plans/startup-loop-workflow-redesign/sections/task-09-quick-actions.md`
  - 10-row plain-language table covering all stages; zero file paths in table cells; blockquote directs to Engineering appendix for paths.
  - Original hand-off map (section 10) preserved verbatim in engineering appendix by TASK-07.
  - VC-03 path check: no `docs/` in staging file — confirmed.
- **Notes / references:**
  - Hand-off map is in section 10 of the current source document.

---

### TASK-10: Rename page purpose statement

- **Type:** IMPLEMENT
- **Deliverable:** Updated purpose statement and front matter in `docs/business-os/startup-loop-workflow.user.md`
- **Execution-Skill:** lp-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Artifact-Destination:** `docs/business-os/startup-loop-workflow.user.md` — front matter + purpose section
- **Reviewer:** Pete
- **Approval-Evidence:** None required
- **Measurement-Readiness:** None
- **Affects:** `docs/business-os/startup-loop-workflow.user.md`
- **Depends on:** -
- **Blocks:** TASK-07
- **Confidence:** 95%
  - Implementation: 95% — trivial content change; two text replacements
  - Approach: 95% — purpose statement rewrite from engineering spec to operator guide is clear and specified
  - Impact: 95% — establishes correct expectations at page load; signals document audience immediately
- **Acceptance:**
  - Purpose section opening changed from: "Define the full startup operating loop from idea/spec input to execution and lp-replanning, with explicit inputs, processing, outputs, and current remaining data gaps for HEAD, PET, and BRIK." to: "This page tells you what to do next for HEAD, PET, and BRIK — and how to do it."
  - Front matter title updated to match the new operator-first framing
  - Front matter `Updated` date set to 2026-02-17
- **Validation contract (VC-10):**
  - VC-01: Read the purpose statement without prior context -> statement immediately communicates "this is a how-to guide for operators", not an engineering spec -> passes first-impression test
  - VC-02: Front matter `Updated` field equals 2026-02-17
- **Execution plan:** Red -> Green -> Refactor
  - Red evidence plan: Current purpose statement is engineering-spec language (confirmed fact-find §Summary).
  - Green evidence plan: Replace purpose text and update front matter.
  - Refactor evidence plan: Read opening 3 lines; confirm operator framing is immediately clear.
- **Planning validation:** None required — S-effort trivial change.
- **Scouts:** None.
- **Edge Cases & Hardening:** None — trivial text change.
- **What would make this >=90%:** Already at 95%.
- **Rollout / rollback:**
  - Rollout: Edit source doc.
  - Rollback: `git checkout` source doc.
- **Documentation impact:** Front matter and opening section of `startup-loop-workflow.user.md`.
- **Build evidence (2026-02-17):**
  - Staging file written: `docs/plans/startup-loop-workflow-redesign/sections/task-10-purpose-statement.md`
  - Front matter `Type: Operator-Guide`, `Updated: 2026-02-17`; H1 title; purpose sentence updated to operator-first framing.
  - Assembled into final document by TASK-07.
- **Notes / references:** None.

---

### TASK-11: Regenerate HTML companion and verify output

- **Type:** CHECKPOINT
- **Deliverable:** Verified `docs/business-os/startup-loop-workflow.user.html` output
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/business-os/startup-loop-workflow.user.html`
- **Depends on:** TASK-00, TASK-06, TASK-07 (and transitively all prior tasks)
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — depends on TASK-00 render script upgrade being correct; all other tasks are doc edits
  - Approach: 95% — process is defined: run command, inspect output
  - Impact: 95% — this is the final gate confirming the entire chain works end-to-end
- **Acceptance:**
  - `pnpm docs:render-user-html -- docs/business-os/startup-loop-workflow.user.md` completes without errors
  - HTML file is produced at `docs/business-os/startup-loop-workflow.user.html`
  - Exactly one `<section data-audience="engineering">` block is present in the HTML output (not stripped)
  - Audience toggle button appears in the rendered HTML
  - All Mermaid diagrams render — including those inside the engineering appendix after toggle (Mermaid re-renders via `mermaid.run()` on toggle)
  - Operator sections are visible by default; engineering appendix is hidden by default (CSS `display: none`, not `<details>` collapse)
  - Clicking "Show technical details" reveals the engineering section; clicking again hides it
- **Horizon assumptions to validate:**
  - TASK-00 render script changes are correct and do not break existing `.user.md` rendering.
  - TASK-06 `<section data-audience="engineering">` wrapper syntax survives the pipeline (either via sanitized passthrough or Fallback A DOM injection).
- **Validation contract:** Run command; open HTML in browser; manually verify: (1) operator sections visible without interaction, (2) engineering appendix hidden by default (not just collapsed — fully absent from view), (3) toggle button present; click reveals engineering section, (4) Mermaid diagrams inside the engineering section render after toggle (no page refresh required), (5) print preview shows operator content only.
- **Planning validation:** Evidence path — `docs/plans/startup-loop-workflow-redesign/fact-find.md` §Validation Seams; render command confirmed in MEMORY.md.
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** `docs/business-os/startup-loop-workflow.user.html` regenerated.
- **Build evidence (2026-02-17):**
  - `pnpm docs:render-user-html -- docs/business-os/startup-loop-workflow.user.md` → success, no errors.
  - HTML: `<section data-audience="engineering">` confirmed at line 370; toggle button confirmed at line 116.
  - `data-audience` attribute count in HTML: 5 (3 CSS rules + 1 HTML element + 1 JS selector) — correct.
  - Mermaid references in HTML: 13 (all 6 diagrams + CDN import + JS handlers).
  - Engineering section hidden by default via CSS `display: none`; print CSS hides it; toggle button shows/hides.

---

### TASK-12: Audit and fix anchor links after restructure

- **Type:** IMPLEMENT
- **Deliverable:** Updated internal anchor links in `docs/business-os/startup-loop-workflow.user.md`
- **Execution-Skill:** lp-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Artifact-Destination:** `docs/business-os/startup-loop-workflow.user.md`
- **Reviewer:** Pete
- **Approval-Evidence:** None required
- **Measurement-Readiness:** None
- **Affects:** `docs/business-os/startup-loop-workflow.user.md`
- **Depends on:** TASK-07 (restructure changes heading IDs), TASK-11 (HTML output needed to check anchor links)
- **Blocks:** -
- **Confidence:** 88%
  - Implementation: 90% — anchor links are enumerable from the markdown source; fix is mechanical
  - Approach: 88% — grep for `#` references in markdown, cross-check against heading IDs in rendered HTML
  - Impact: 88% — broken anchor links silently degrade operator and agent navigation
- **Acceptance:**
  - All internal anchor links (`[text](#heading-id)`) in the markdown resolve to a heading that exists in the restructured document
  - No `404 Not Found` or `#undefined` anchors in the rendered HTML (browser check)
  - External links (to other files or URLs) are not changed
- **Validation contract (VC-12):**
  - VC-01: `grep -n '\](#' docs/business-os/startup-loop-workflow.user.md` → for each match, confirm the anchor target heading exists in the document
  - VC-02: Open rendered HTML; use browser Find to search for `#` in the page URL bar while clicking each internal link → no dead anchors
- **Execution plan:** Red → Green → Refactor
  - Red: After TASK-07 restructure, grep for internal links and cross-check against headings — identify broken links.
  - Green: Update broken anchor targets to match new heading IDs in restructured document.
  - Refactor: Re-render and re-verify.
- **Planning validation:** None required — S-effort, fully mechanical.
- **Scouts:** None.
- **Edge Cases & Hardening:** If a heading was renamed for clarity, both the heading and any linking anchor must be updated together.
- **What would make this >=90%:** No broken anchors found (task completes as N/A if no internal anchor links exist).
- **Rollout / rollback:**
  - Rollout: Edit source doc; regenerate HTML.
  - Rollback: `git checkout` source doc.
- **Documentation impact:** `startup-loop-workflow.user.md` anchor links updated.
- **Build evidence (2026-02-17):**
  - Grep for `](#` in restructured `startup-loop-workflow.user.md` → zero matches. No internal anchor links exist in the document.
  - TASK-12 complete as N/A — per plan acceptance criteria: "task completes as N/A if no internal anchor links exist."
- **Notes / references:**
  - Run after TASK-11 so the rendered HTML is available for browser-level anchor testing.

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Mermaid diagrams inside the hidden engineering section do not render when toggled visible | Low | Medium | Toggle handler calls `mermaid.run()` inside the same `<script type="module">` as the Mermaid import (not a separate script); validated in TASK-11 VC |
| Agent runs referencing specific section headings break after restructure | Medium | Medium | Keep all heading content intact; rename only for clarity; audit skill files that hard-reference section names before finalising TASK-07 |
| "Today" panel content is already stale on 2026-02-17 | High | Low | Add explicit date stamp (2026-02-17) to each panel; operator updates panels weekly as part of S10 cadence |
| The 8-step simplification loses nuance that agents need | Low | Medium | All five original Mermaid diagrams retained intact in appendix; 8-step version is additive only |
| TASK-07 assembly breaks internal anchor links | Low | Low | Regenerate HTML after restructure; check rendered anchor links; update `#section-id` references if broken |
| allowDangerousHtml enables XSS if .user.md content is untrusted | Low | Medium | Mitigated by rehype-sanitize allowlist in TASK-00 that blocks script/iframe/inline handlers; CI grep check recommended |
| Original engineering content lost if tasks treat "move to appendix" as "delete" | Medium | High | Explicitly documented in Non-goals and per-task acceptance: originals preserved verbatim; additive operator sections only |

## Observability

- Logging: None — documentation rewrite; no runtime logging.
- Metrics: None automated. Qualitative: operator reads document cold and confirms time-to-action target.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)

- [ ] `docs/business-os/startup-loop-workflow.user.md` restructured with operator sections first (sections 1–8); all engineering content in the engineering appendix (sections 9–11) inside one `<section data-audience="engineering">` wrapper
- [ ] All five original Mermaid diagrams present verbatim in the engineering appendix
- [ ] Original RG-01..RG-07 gate table present verbatim in the engineering appendix
- [ ] Original "Open Tasks" table present verbatim in the engineering appendix
- [ ] Original hand-off map (section 10) present verbatim in the engineering appendix
- [ ] Three "Today" panels (HEAD, PET, BRIK) present near top of document with date stamp 2026-02-17
- [ ] "Loop in 8 steps" Mermaid diagram renders without errors
- [ ] Six plain-language gate questions ADDED to operator body as a new "Readiness check" section; original RG table preserved verbatim in engineering appendix (additive, not replacement)
- [ ] Three per-business action cards present with plain-language steps and done criteria
- [ ] New Business Operator Actions table and Platform Engineering Actions table ADDED; original "Open Tasks" table preserved verbatim in engineering appendix (additive, not replacement)
- [ ] "If you have 10/30/60 minutes" section replaces "Practical Reading Order"
- [ ] New "Quick Actions" operator table present (plain labels, anchor links to appendix — no repo paths); original hand-off map preserved verbatim in engineering appendix
- [ ] Page purpose statement updated to operator-first framing; `Updated` date set to 2026-02-17
- [ ] `pnpm docs:render-user-html -- docs/business-os/startup-loop-workflow.user.md` completes without errors
- [ ] Rendered HTML: operator sections visible by default; engineering appendix hidden by default (`display: none`, not collapse); audience toggle button present and functional
- [ ] Toggle reveals engineering section; Mermaid diagrams inside it render without page refresh
- [ ] Print preview: engineering appendix hidden; operator content only
- [ ] No MCP tool names, repo paths, or D1/entitySha references in operator body sections 1–8 (grep confirms zero matches)

## Decision Log

- 2026-02-17: Chosen Option A (single document with progressive disclosure) over Option B (separate operator/engineering documents). Rationale: single source of truth; avoids divergence; `<section data-audience="engineering">` wrapper with CSS/JS toggle is well-supported. See fact-find §Proposed Approach.
- 2026-02-17: Audience toggle JS will be inline in `wrapHtmlDocument()` (not CDN). Rationale: existing Mermaid CDN is the only allowed external dependency; toggle JS is small enough to inline. See fact-find §Resolved Extended Q1.
- 2026-02-17: "If you have 10/30/60 minutes" uses status-check framing (returning operator), not onboarding framing. Rationale: document is a recurring operational dashboard; onboarding is a separate concern. See fact-find §Resolved Extended Q2.
- 2026-02-17: TASK-00 added as render-script prerequisite. Rationale: render pipeline silently drops all raw HTML without `allowDangerousHtml: true`; this was discovered during fact-find extended Q1.
- 2026-02-17: Model A chosen for audience toggle (single engineering appendix wrapper) over redundant three-mechanism design (per-section `<details>` + CSS hide + toggle). Rationale: simpler UX — one toggle reveals/hides entire engineering section; eliminates confusion of expanded-but-hidden sections. See critique issue 4.
- 2026-02-17: Operator-friendly versions of gate questions (TASK-04), action tables (TASK-05), and hand-off map (TASK-09) are ADDITIVE — original engineering content preserved verbatim in appendix. Rationale: resolves contradiction between "do not remove engineering content" non-goal and transformation tasks. See critique issue 1.
- 2026-02-17: Fallback A established for TASK-00 sub-task (d): if markdown-inside-raw-HTML fails inner-content rendering test, abandon raw HTML in markdown and instead inject `<section data-audience="engineering">` wrapper via DOM manipulation in `wrapHtmlDocument()` using a `## Engineering appendix` marker heading. This is the cleaner path; sanitization pipeline changes become unnecessary. See critique issue 3.
- 2026-02-17: Audience toggle JS must be inside the same `<script type="module">` block as the Mermaid import. Rationale: `mermaid` is an ESM module-scoped import; a separate non-module script cannot access it. Toggle handler must call `mermaid.run()` after showing the engineering section. See critique issue 8.
- 2026-02-17: TASK-09 "Quick Actions" operator table contains NO `<details>` blocks with paths. Rationale: any path in sections 1–8 would fail the TASK-07 VC-04 jargon search. Paths live only in the verbatim original hand-off map in the engineering appendix. See critique issue 5.

## Overall-confidence Calculation

Effort weights: S=1, M=2, L=3

| Task | Confidence | Effort | Weight |
|---|---:|---|---:|
| TASK-00 | 88% | S | 1 |
| TASK-01 | 85% | S | 1 |
| TASK-02 | 90% | S | 1 |
| TASK-03 | 88% | S | 1 |
| TASK-04 | 82% | S | 1 |
| TASK-05 | 88% | S | 1 |
| TASK-06 | 82% | M | 2 |
| TASK-07 | 85% | L | 3 |
| TASK-08 | 88% | S | 1 |
| TASK-09 | 85% | S | 1 |
| TASK-10 | 95% | S | 1 |
| TASK-11 | 85% | S | 1 |
| TASK-12 | 88% | S | 1 |

Weighted sum: (88+85+90+88+82+88)×1 + (82×2) + (85×3) + (88+85+95+85+88)×1 = 521 + 164 + 255 + 441 = 1381
Total weight: 6×1 + 2 + 3 + 5×1 = 16
Overall-confidence: 1381 / 16 = **86%** (unchanged)
