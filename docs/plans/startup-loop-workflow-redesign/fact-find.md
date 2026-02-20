---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Business-OS
Workstream: Operations
Created: 2026-02-17
Last-updated: 2026-02-17
Feature-Slug: startup-loop-workflow-redesign
Execution-Track: business-artifact
Deliverable-Family: doc
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: doc-rewrite
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/startup-loop-workflow-redesign/plan.md
Business-OS-Integration: off
Business-Unit: BOS
Card-ID: none
---

# Startup Loop Workflow Redesign — Fact-Find Brief

## Scope

### Summary

`docs/business-os/startup-loop-workflow.user.md` (and its companion HTML file) currently conflates two distinct audiences in a single flat document: operators who need "what do I do right now?" answers, and platform engineers who need system-spec detail (MCP tools, D1 schemas, entitySha constraints, stage-result JSON paths). The result is a document that serves neither audience well — operators are forced to navigate through engineering jargon to find their next action, and engineers lack a clean canonical reference.

The redesign separates these concerns by restructuring the document into an operator-first body (visible by default) and a technical appendix (collapsed inside `<details>` blocks), adds a "Today" panel per business showing current blocker → do this → done when, replaces repo-path evidence columns with plain-language action cards, converts gate codes (RG-xx) into plain-language pass/fail questions, and adds an audience toggle in the HTML companion.

### Goals

- Operators can open the document and within 30 seconds see exactly what action to take next for HEAD, PET, or BRIK.
- Plain English throughout the operator layer — no MCP tool names, no D1/entitySha references, no repo path strings.
- Technical detail preserved and accurate in the appendix for engineers and agent runs.
- A single simplified "Loop in 8 steps" diagram replaces five nested Mermaid charts as the primary orientation view.
- HTML companion gains an audience toggle (operator / engineering) so the same file serves both audiences.
- Gate questions are readable by a non-technical operator (e.g., "Have you confirmed your in-stock date?" rather than "RG-03 pass?").
- Sections tagged with `data-audience` attribute so the toggle is semantically grounded.
- HTML is regenerated via `pnpm docs:render-user-html` after every content change.

### Non-goals

- Do not change the underlying startup-loop logic, stage ordering, or artifact contracts.
- Do not alter any referenced artifact files (plan.user.md, forecast docs, measurement-verification docs).
- Do not remove or delete any engineering content — move it to the appendix.
- Do not change the `loop-spec.yaml` canonical source or any MCP tooling.
- Do not redesign the Business OS UI or any persisted BOS data structures.

### Constraints & Assumptions

- Constraints:
  - Source file is `docs/business-os/startup-loop-workflow.user.md`; the HTML companion at `docs/business-os/startup-loop-workflow.user.html` must be regenerated via `pnpm docs:render-user-html -- <path.user.md>` after every edit.
  - The document must remain accurate — engineering content moved to appendix must not be truncated or paraphrased.
  - The "Loop in 8 steps" diagram must remain valid Mermaid syntax rendered in the markdown.
  - The render script (`scripts/src/render-user-doc-html.ts`) currently drops all raw HTML (no `allowDangerousHtml`). TASK-00 must upgrade it before `<details>` and `data-audience` attributes survive the pipeline.
  - Audience toggle JS must be inline in the render script's `wrapHtmlDocument()` — no additional external CDN beyond the existing Mermaid CDN.
- Assumptions:
  - Mermaid already uses a CDN exception (`https://cdn.jsdelivr.net/npm/mermaid@11/`) in `wrapHtmlDocument()` — confirmed in render script. The audience toggle must be inline JS only.
  - The operator audience for this document is primarily Pete as venture-studio operator, with the document also used by AI agents as context.
  - Current business state (HEAD/PET/BRIK gaps) as documented in section 5 of the source file is accurate as of 2026-02-13 and will be updated during the rewrite to reflect the 2026-02-17 current state.

## Evidence Audit (Current State)

### Entry Points

- `docs/business-os/startup-loop-workflow.user.md` — primary source document, read by operators and AI agents; 700+ lines
- `docs/business-os/startup-loop-workflow.user.html` — rendered companion, confirmed to exist

### Key Modules / Files

- `docs/business-os/startup-loop-workflow.user.md` — source to be rewritten; contains 5 Mermaid diagrams, stage table, open-tasks table, current-gaps tables (sections 2–5)
- `docs/business-os/startup-loop-workflow.user.html` — HTML companion; must be regenerated post-rewrite
- `docs/business-os/startup-loop/loop-spec.yaml` (referenced as canonical source for stage definitions at spec_version 1.1.0) — not modified by this task
- `pnpm docs:render-user-html` — render script invoked as `pnpm docs:render-user-html -- <path.user.md>`
- `docs/briefs/_templates/briefing-note.md` — confirmed to exist; not directly relevant to this rewrite

### Patterns & Conventions Observed

- Audience-mixed tables: The "Open Tasks" table (section 2.5) mixes operator actions ("HEAD and PET operational confirmations are required") with platform engineering actions ("MCP TASK-05 identity/deployment decision") in the same table, with evidence columns containing raw repo file paths. — evidence: `docs/business-os/startup-loop-workflow.user.md` line ~562–576
- Jargon density in operator sections: Section 2.4 ("Human Operator View") contains MCP tool names (`bos_cards_list`, `bos_stage_doc_patch_guarded`, `entitySha`), D1 references, and API route paths that are not actionable for a human operator. — evidence: lines ~508–554
- Over-modelled stages: Stage table (section 4) lists S1B, S2A, S2B, S3, S4, S5A, S5B, S6, S6B, S7–S10 plus six brand touch-points (BD-1 through BD-6). An operator reading this faces 16+ named stages with sub-stage labels (e.g., "S1B/S2A: Conditional Gates"). — evidence: lines ~594–624
- No "you are here" surface: The document has no top-of-page current-state panel. An operator must scroll through 200+ lines of flow diagrams before reaching "Current Missing Information" in section 5. — evidence: document structure, lines 1–625
- Redundant information sections: "Open Tasks" (section 2.5) substantially overlaps with "Current Missing Information" (section 5) which itself is divided into 5.1 cross-cutting, 5.2 HEAD, 5.3 PET, and 5.4 BRIK subsections with duplicate evidence pointers. — evidence: lines ~562–700+
- Five separate Mermaid diagrams: Sections 2, 2.1, 2.2, 2.3, and 2.4 each contain a distinct Mermaid flowchart. The primary (section 2) is a full end-to-end loop with 12 subgraphs; 2.1 is an existing-business route detail; 2.2 is stage-by-stage data flow; 2.3 is artifact production/consumption chain; 2.4 is MCP overlay. The operator-relevant orientation is buried inside the engineering detail. — evidence: lines ~19–554

### Data & Contracts

- Types/schemas/events:
  - The document references `stage-result.json`, `growth-ledger.json`, `growth-event-payload.json` as persisted output contracts — these are engineering detail and belong in the appendix.
  - `entitySha` write-guard mechanism referenced in section 2.4 — engineering detail, appendix only.
- Persistence:
  - BOS D1 database referenced for cards and stage docs — engineering context, appendix.
  - Manifest pointer at `docs/business-os/startup-baselines/[BIZ]/manifest.json` — engineering context.
- API/contracts:
  - `POST/PATCH /api/agent/*` write paths — engineering detail.
  - MCP tool names (`bos_*`, `loop_*`, `measure_*`) — engineering detail.

### Dependency & Impact Map

- Upstream dependencies:
  - `docs/business-os/startup-loop/loop-spec.yaml` — canonical stage spec; not modified; operator doc must stay consistent with it.
  - Business state docs for HEAD, PET, BRIK in `docs/business-os/strategy/*/plan.user.md` — referenced for "Today" panel content; not modified.
  - Measurement verification and gap docs — referenced as evidence; not modified.
- Downstream dependents:
  - AI agents that read `startup-loop-workflow.user.md` as context when running startup-loop skills. The redesigned document must remain a valid reference — engineering detail must be present in the appendix, not deleted.
  - Operator (Pete) who reads this to know what to do next for each business.
  - HTML companion (`startup-loop-workflow.user.html`) is a direct downstream artifact and must be regenerated.
- Likely blast radius:
  - Low: No code changes. No data schema changes. No agent skill changes. Only the document structure and rendering change.
  - Medium risk for agents: If agent prompts reference specific section numbers or headings, those may break if headings are renamed. Section content is being restructured, not deleted.

### Delivery & Channel Landscape

- Audience/recipient:
  - Primary: Pete (venture-studio operator) — reads to determine next action per business.
  - Secondary: AI agents (Claude Code, lp-* skills) — read document as startup-loop context.
  - The two audiences have radically different information needs, which is the core problem this redesign solves.
- Channel constraints:
  - The document is a local markdown file served via the docs render pipeline. No email, WhatsApp, or external publishing constraints.
  - HTML companion is a static file; no deployment pipeline beyond the render script.
- Existing templates/assets:
  - `docs/plans/_templates/fact-find-planning.md` — used for this brief.
  - `docs/briefs/_templates/briefing-note.md` — exists but not directly applicable.
  - Five existing Mermaid diagrams in the source file are reusable as appendix content.
- Approvals/owners:
  - Owner: Pete (document `Owner: Pete` in front matter).
  - No external approval required — internal operator document.
- Compliance constraints:
  - None. Internal document only.
- Measurement hooks:
  - Success is qualitative: operator can reach their next action within 30 seconds of opening the document.
  - Secondary: agents reference the document without misreading operator-facing content as engineering spec.

### Hypothesis & Validation Landscape

#### Key Hypotheses

| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | Splitting operator/engineering content into separate layers reduces operator time-to-action from 2+ minutes to under 30 seconds | Correct identification of which content is operator-facing vs engineering | Low — read-through test | Minutes |
| H2 | A "Today" panel per business (HEAD/PET/BRIK) is the highest-value addition for operator usability | Understanding of current per-business blocker state | Low — operator confirmation | Immediate |
| H3 | Plain-language gate questions (replacing RG-xx codes) are sufficient for an operator to self-assess gate pass/fail | Gate logic being translatable without loss of precision | Low — logic review | < 1 hour |
| H4 | The HTML audience toggle (operator/engineering) is technically feasible with the existing render pipeline | Render pipeline supporting inline `<script>` and `data-` attributes | Medium — render test required | < 30 minutes |
| H5 | A single "Loop in 8 steps" diagram oriented at operator understanding replaces the five engineering-detail diagrams as the primary entry point | Ability to distill the loop to 8 operator-meaningful steps | Low — diagram authoring | < 1 hour |

#### Existing Signal Coverage

| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | Source document confirmed to have no "you are here" section in first 300 lines | Direct read of source file | High |
| H2 | Per-business gap tables exist in section 5; content is available to populate "Today" panels | `startup-loop-workflow.user.md` sections 5.2–5.4 | High |
| H3 | RG-01..RG-07 codes referenced in source; gate questions can be written from stage-table descriptions | Source file section 4 | Medium — requires gate logic to be readable from spec |
| H4 | HTML companion confirmed to exist; render script command confirmed in MEMORY.md | Direct file check + MEMORY.md | Medium — render pipeline internals not inspected |
| H5 | Five existing Mermaid diagrams available as appendix content; "8 steps" count is an authoring decision | Source file structure | High |

#### Falsifiability Assessment

- Easy to test:
  - H1: Time a fresh read-through of the redesigned operator section.
  - H2: Validate "Today" panel content against current gap docs.
  - H3: Walk each plain-language gate question against the RG spec to confirm equivalence.
  - H5: Author the 8-step diagram and confirm it renders in Mermaid.
- Hard to test:
  - H4: The render pipeline for `<script>` injection is not confirmed without running `pnpm docs:render-user-html` against a test file containing inline JS.
- Validation seams needed:
  - Run `pnpm docs:render-user-html -- docs/business-os/startup-loop-workflow.user.md` after the rewrite and inspect the HTML output for correct audience-toggle rendering.

#### Recommended Validation Approach

- Quick probes:
  - After writing the "Loop in 8 steps" diagram, confirm it renders in a Mermaid previewer before committing to the document.
  - Draft the audience toggle JS inline and test the render pipeline before finalising the HTML task.
- Structured tests:
  - Read-through the operator layer with fresh eyes (no prior context) and confirm each business's "Today" panel answers: "what is blocking me?" and "what do I do right now?".
- Deferred validation:
  - Formal agent regression test (confirming AI agents can still correctly navigate the document) can be deferred until after the redesign ships.

### Test Landscape

Not investigated: This is a documentation rewrite with no code changes. No automated tests are expected to be added or modified. The render pipeline test (`pnpm docs:render-user-html`) serves as the only validation gate.

### Recent Git History (Targeted)

- `docs/business-os/startup-loop-workflow.user.md` — listed as `M` (modified) in current git status; the file has active changes on the `dev` branch.
- `docs/business-os/startup-loop-workflow.user.html` — listed as `M` (modified) in current git status; HTML companion already has pending changes.

## External Research (If Needed)

Not investigated: No external research required. This is a structural redesign of an existing internal document using content already present in the source file and referenced business docs.

## Questions

### Resolved

- Q: Does the HTML companion file exist?
  - A: Yes, confirmed at `docs/business-os/startup-loop-workflow.user.html`.
  - Evidence: Direct file check.

- Q: Does a plans directory for this feature already exist?
  - A: No prior directory found. Created fresh at `docs/plans/startup-loop-workflow-redesign/`.
  - Evidence: Glob check returned no results before directory creation.

- Q: What is the render command for the HTML companion?
  - A: `pnpm docs:render-user-html -- <path.user.md>`
  - Evidence: MEMORY.md (`Render script: pnpm docs:render-user-html -- <path.user.md>`).

- Q: Is the deliverable-routing.yaml routing correct for a doc-rewrite?
  - A: The routing file (`deliverable-routing.yaml`) lists `doc` as a family with subtypes `product-brief` and `marketing-asset`. A doc-rewrite is an internal operational document, not a marketing asset or product brief. The appropriate primary execution skill is `lp-do-build` (doc track). The `Deliverable-Type: doc-rewrite` is a locally defined extension of the `doc` family routing, consistent with how lp-do-build handles non-code deliverables.
  - Evidence: `.claude/skills/lp-do-fact-find/routing/deliverable-routing.yaml`

- Q: What are the current per-business blockers to populate "Today" panels?
  - A: Confirmed from section 5 of source document:
    - HEAD: Blocked on operational confirmations (in-stock date, sellable units, price architecture, compatibility matrix, payment readiness, returns SLA); demand/conversion baselines not measured; region/tax still unresolved; no forecast recalibration artifact.
    - PET: Blocked on inventory units/arrival confirmation, real costs, and observed CPC/CVR; no forecast recalibration artifact; baseline remains draft.
    - BRIK: GA4 `web_vitals` verification pending; refreshed `begin_checkout` report-window confirmation pending; day-14 forecast recalibration pending; weekly K/P/C/S cadence continuation required.
  - Evidence: `startup-loop-workflow.user.md` sections 5.2–5.4.

### Open (User Input Needed)

None remaining — all questions resolved.

### Resolved (Extended)

- Q: Does the `pnpm docs:render-user-html` pipeline support inline `<script>` tags in the markdown source for the audience toggle?
  - A: **No.** The render script (`scripts/src/render-user-doc-html.ts`) uses `remark-rehype` + `rehype-stringify` without `allowDangerousHtml: true`. All raw HTML in markdown source — including `<script>`, `<details>`, `<summary>`, and `data-*` attributes — is silently dropped. The pipeline cannot be used to inject the audience toggle from markdown.
  - Best long-term solution: Add `allowDangerousHtml: true` to both the `remarkRehype()` and `rehypeStringify()` calls in the render script. This is a two-line change that enables all raw HTML passthrough (including `<details>`, `<summary>`, `data-audience`, `<script>`) for all `.user.md` documents going forward. Additionally, add the audience-toggle CSS and JS block directly to `wrapHtmlDocument()` in the render script alongside the existing Mermaid script block. This way the toggle is always present in rendered docs and can be activated by `data-audience` attributes in any document.
  - Impact on task seeds: Add TASK-00 (render script upgrade: `allowDangerousHtml` + audience-toggle injection) as a prerequisite to TASK-06. TASK-00 is a small code change (~10 lines) to `scripts/src/render-user-doc-html.ts`.
  - Decision: Adopt render-script upgrade approach (best long-term). Markdown documents can use native `<details data-audience="engineering">` blocks; render script injects the toggle JS automatically for all documents.

- Q: Should the "If you have 10/30/60 minutes" replacement for "Practical Reading Order" be authored for a new business onboarding use-case, or is it specifically for an operator who already knows the loop and is returning for a status check?
  - A: **Status-check framing (returning operator).** The document is a recurring operational dashboard, not onboarding material. An operator opening this document already knows what the loop is — they need to know what to do in the time they have available right now. Onboarding belongs in a separate document. The "Today" panel handles immediate actions; the 10/30/60 section handles depth for operators with more time available in a single session.
  - Decision: Status-check framing adopted. Content for each time bracket:
    - 10 minutes: Read Today panel → pick one business → complete the top blocker action (form fill, checklist, one verification step)
    - 30 minutes: Run the required checklist in full (measurement verification / baseline refresh / ops confirmations)
    - 60 minutes: Produce the required artifact (forecast recalibration doc / weekly K/P/C/S decision / action card completion)

## Confidence Inputs

- Implementation: 90%
  - Evidence: Source file fully read (300 + 300 lines). All content confirmed present and rearrangeable. No code changes. No external dependencies beyond render script.
  - What raises it to >=80: Already above 80. Current level reflects the minor uncertainty about render pipeline script injection.
  - What raises it to >=90: Already at 90. Confirm render pipeline supports inline `<script>` before TASK-06.

- Approach: 85%
  - Evidence: The split operator/engineering structure is a well-understood pattern (progressive disclosure). `<details>` HTML is widely supported. The "Today" panel approach is validated by the existence of per-business gap tables (section 5) providing content. Plain-language gate questions are derivable from the existing stage table.
  - What raises it to >=90: Confirm the 8-step diagram faithfully represents the loop without losing operational meaning; validate with Pete that the "Today" panel format matches how he actually wants to consume the information.

- Impact: 85%
  - Evidence: The current document demonstrably buries operator actions behind engineering content (confirmed by structure read). The redesign directly addresses the identified pain points. Impact is bounded to operator usability and agent context quality — not revenue-critical.
  - What raises it to >=90: Post-delivery read-through confirmation that operator time-to-action target is met.

- Delivery-Readiness: 90%
  - Evidence: Owner is Pete. No external approvals. No channel constraints. All source content exists. Render script command is known. Directory created.
  - What raises it to >=90: Already at 90. Render pipeline script injection question resolved.

- Testability: 80%
  - Evidence: Validation is manual (read-through + render check). No automated test suite applies. The render pipeline check (`pnpm docs:render-user-html`) is the only mechanical gate.
  - What raises it to >=90: Confirm render pipeline produces well-formed HTML with audience attributes intact after a test run before finalizing TASK-06.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Render pipeline does not support inline `<script>` for audience toggle | Medium | Low | Fallback: post-process the HTML file with a separate script injection step, or reference an external `.js` file from the HTML companion |
| Agent runs that reference specific section headings break after restructure | Medium | Medium | Keep all heading content (rename only for clarity); move, don't delete; audit any skill files that hard-reference section names |
| "Today" panel content becomes stale immediately after authoring | High | Low | Panels should be written as of 2026-02-17 with explicit date stamps; operator must update them weekly as part of S10 cadence |
| The "8 steps" simplification loses nuance that agents need | Low | Medium | Keep all five original Mermaid diagrams intact in the appendix; the 8-step version is additive, not a replacement at the engineering level |
| Heading/section ID changes break the HTML companion's internal anchor links | Low | Low | Regenerate HTML after every edit via render script; check anchor links in the rendered output |

## Planning Constraints & Notes

- Must-follow patterns:
  - Operator sections come first; engineering appendix in `<details>` blocks.
  - Every `<details>` block must have a meaningful `<summary>` label.
  - `data-audience="operator"` and `data-audience="engineering"` attributes on all major sections.
  - "Today" panels must include: current blocker statement, single next action ("do this"), done-when criterion.
  - Plain-language gate questions must be answerable Yes/No without reading any other document.
  - HTML regeneration via `pnpm docs:render-user-html -- docs/business-os/startup-loop-workflow.user.md` is mandatory after every substantive edit.
  - No content deletion — engineering detail moves to appendix only.
- Rollout/rollback expectations:
  - The document is version-controlled in git. Rollback is `git checkout` of the prior version.
  - No deployment pipeline. File is local + committed.
- Observability expectations:
  - None automated. Operator reads the document and confirms usability.

## Suggested Task Seeds (Non-binding)

0. TASK-00 — Upgrade render script: add `allowDangerousHtml: true` to `remarkRehype()` + `rehypeStringify()`, inject audience-toggle CSS + JS into `wrapHtmlDocument()` in `scripts/src/render-user-doc-html.ts`
1. TASK-01 — Write "Loop in 8 steps" Mermaid diagram (operator-oriented; replaces 5 diagrams as primary)
2. TASK-02 — Write "Today" operator panels for HEAD, PET, BRIK (current blocker + do this + done when)
3. TASK-03 — Write operator-facing action cards for each business (plain language, no repo paths, no RG codes)
4. TASK-04 — Write plain-language gate questions replacing RG-01..RG-07 table entries
5. TASK-05 — Separate owner rows: Business Operator Tasks table vs Platform/Engineering Tasks table
6. TASK-06 — Add `data-audience` attributes and `<details data-audience="engineering">` wrappers to markdown source; operator sections default visible, engineering appendix collapsed
7. TASK-07 — Restructure main document body (operator sections first; all engineering content moved to `<details>` appendix)
8. TASK-08 — Replace "Practical Reading Order" with "If you have 10/30/60 minutes" section (status-check framing for returning operator)
9. TASK-09 — Convert hand-off messages to human-readable action labels (paths behind `<details>` "Show details")
10. TASK-10 — Rename page purpose statement at top to "What to do next for HEAD, PET, BRIK"
11. TASK-11 — Regenerate HTML companion via `pnpm docs:render-user-html -- docs/business-os/startup-loop-workflow.user.md` and verify audience toggle renders correctly

**Suggested sequencing:**
- TASK-00 first (render script prerequisite for TASK-06 and TASK-11 to work correctly)
- TASK-01 through TASK-05 parallelizable (pure content authoring, no dependencies between them)
- TASK-07 depends on TASK-01..05 complete (restructure requires all operator content written first)
- TASK-06 depends on TASK-00 and TASK-07 (`data-audience` tagging requires restructured document and working pipeline)
- TASK-08, TASK-09, TASK-10 can run in parallel with TASK-07
- TASK-11 is the final gate; depends on all prior tasks complete

## Execution Routing Packet

- Primary execution skill:
  - `lp-do-build` (doc track) — document authoring and restructuring
- Supporting skills:
  - none — this is a pure document rewrite; no code or data pipeline involvement
- Deliverable acceptance package:
  - Rewritten `docs/business-os/startup-loop-workflow.user.md` with operator/engineering split, "Today" panels, plain-language gates, 8-step diagram
  - Regenerated `docs/business-os/startup-loop-workflow.user.html` with audience toggle
  - Operator can reach their next action for any business within 30 seconds of opening the document
  - All engineering content from the original document is preserved in `<details>` appendix
- Post-delivery measurement plan:
  - Pete reads the document cold (no prior context) and times time-to-action
  - Confirm all five original Mermaid diagrams are present (in appendix) and render correctly in the HTML companion
  - Confirm HTML audience toggle shows operator sections by default and engineering sections on toggle

## Evidence Gap Review

### Gaps Addressed

- Citation integrity: All claims in this brief are traced to direct reads of the source file (`startup-loop-workflow.user.md` lines 1–300 and 400–700) or to confirmed file existence checks.
- Boundary coverage: No integration or security boundaries apply (documentation-only task). Render pipeline boundary identified and flagged as the sole technical uncertainty.
- Business validation coverage: Per-business gap state (HEAD/PET/BRIK) is explicitly sourced from sections 5.2–5.4 of the source document.
- Hypothesis coverage: Five hypotheses identified; existing signal coverage assessed for each.

### Confidence Adjustments

- Implementation confidence held at 90% (not 95%+) due to unconfirmed render pipeline `<script>` injection behaviour.
- Delivery-Readiness held at 90% (not 95%+) for the same reason.
- No confidence reductions applied to content hypotheses (H1–H3, H5) as evidence is directly observable from the source file.

### Remaining Assumptions

- Render pipeline supports inline `<script>` passthrough (flagged as open question; low risk with identified fallback).
- "Today" panel content from section 5 of the source file accurately reflects the state as of the document's `Updated: 2026-02-13` date; content must be reviewed for accuracy as of 2026-02-17 before publishing.
- The operator audience for this document will not change in scope (no new businesses beyond HEAD, PET, BRIK during this redesign).

## Planning Readiness

- Status: Ready-for-planning
- Blocking items:
  - None blocking plan creation. The open question about render pipeline `<script>` injection should be resolved before TASK-06 is executed (not before planning).
- Recommended next step:
  - `/lp-do-plan` — all evidence is sufficient to produce a validation-first, ordered task plan.
