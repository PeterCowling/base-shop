---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Business-OS
Workstream: Mixed
Created: 2026-02-19
Last-updated: 2026-02-19
Feature-Slug: startup-loop-output-registry
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

> **Note:** S7/S8/S9 stage IDs referenced below were consolidated into stage DO in loop-spec v3.0.0 (2026-02-21).

# Startup Loop Output Registry — Fact-Find Brief

## Scope

### Summary

Build a companion HTML artifact — the "Output Registry" — that surfaces every
decision-grade output artifact produced so far in the startup loop for HEAD, PET,
and BRIK, organised by stage (S0 → S10). It is a read-only record of work done,
not a task list, prompt index, or planning tool.

The artifact is designed to sit alongside `startup-loop-workflow-v2.user.html`
and must match its visual design: deep navy background, Playfair Display headings,
JetBrains Mono data cells, Sora body text, gold accent borders.

### Goals
- Provide a single view of all genuine output artifacts per business, per stage
- Enforce deduplication: pointer-files surface in place of dated sources; wrapper
  docs surface in place of their constituent parts; latest version supersedes
  earlier versions
- Exclude non-output files (prompts, templates, agent-facing docs, rendered HTML
  copies, exec summaries, navigation indexes)
- Match the command-centre visual aesthetic of `startup-loop-workflow-v2.user.html`
- Be self-contained: single HTML file, no external data fetches

### Non-goals
- Real-time sync with the file system (static snapshot only)
- Interactive filtering or search beyond what CSS alone can provide
- Coverage of businesses beyond HEAD, PET, BRIK
- Coverage of non-startup-loop plan directories

### Constraints & Assumptions
- Constraints:
  - Single self-contained HTML file (no build pipeline, no JS frameworks)
  - No runtime data fetches (no XHR/fetch calls for content at runtime); Google
    Fonts CDN is the only external network dependency — same as the reference
    file and acceptable for a dev-only artefact
  - File paths are relative to repo root (`/Users/petercowling/base-shop/`)
  - Artifact is read-only: clicking file paths should open in editor (no routing)
- Assumptions:
  - Artifact lives alongside the workflow HTML at
    `docs/business-os/startup-loop-output-registry.user.html`
  - Content is a point-in-time snapshot dated 2026-02-19; no live refresh
  - Agent-facing (`.agent.md`) and rendered (`.html`) files for the same source
    `.user.md` are excluded — the `.user.md` is the canonical representation
  - Exec summaries (`*-exec-summary.*`) are derivative of their parent forecast
    and are excluded

---

## Evidence Audit — Artifact Inventory

### Inclusion Rules (confirmed)

1. **Genuine outputs only**: research, plans, baselines, forecasts, scorecards,
   decision logs, briefs, feasibility studies, signal reviews.
2. **No prompt/template files**: files whose primary purpose is to feed an AI
   or human process (e.g. `naming-research-prompt.md`, `*-prompt.user.md`).
3. **Pointer-first deduplication**: where a `latest.user.md` pointer exists for
   market-research or site-upgrades, show only the pointer — not the dated
   source it references.
4. **Wrapper-first deduplication**: `plan.user.md` is the canonical strategy
   wrapper; constituent outputs it integrates are shown separately only when they
   contain genuinely distinct content not absorbed by the plan.
5. **Latest version only**: when multiple numbered versions of a document exist
   (e.g. forecast v1 + v2), show only the latest.
6. **Exec summaries excluded**: always derivative; omit.
7. **`.agent.md` variants excluded**: agent-facing pipeline files, not operator
   outputs.
8. **`index.user.md` files excluded**: navigation indexes, not research outputs.
9. **Filename suffix is not the inclusion criterion**: `.user.md` is the
   conventional suffix for operator-facing docs but some genuine outputs use
   plain `.md` (auto-generated analysis files, signal reviews). The test is
   document type declared in frontmatter (`Type: Analysis-Output`, `Type:
   Signal-Review`, etc.) or evident content — not the filename suffix alone.

### Stage-by-Stage Artifact Inventory

#### HEAD (Mini Pet Headband DTC)

| Stage | Artifact | Path | Status | Notes |
|-------|----------|------|--------|-------|
| S0 | Intake Packet | `docs/business-os/startup-baselines/HEAD-intake-packet.user.md` | Active | Business context, assumptions, and constraints |
| S0 | Forecast Seed | `docs/business-os/startup-baselines/HEAD-forecast-seed.user.md` | Draft | Pre-loop revenue hypothesis |
| S1 | Market Intelligence | `docs/business-os/market-research/HEAD/latest.user.md` | Active | Pointer → 2026-02-12 research report |
| S1 | Brand Dossier | `docs/business-os/strategy/HEAD/brand-dossier.user.md` | Draft | Visual + voice identity |
| S3 | 90-Day Forecast v2 | `docs/business-os/strategy/HEAD/headband-90-day-launch-forecast-v2.user.md` | Draft | P10/P50/P90 scenario model (v1 superseded) |
| S5 | Prioritization Scorecard | `docs/business-os/strategy/HEAD/2026-02-12-prioritization-scorecard.user.md` | Active | Go-item ranking |
| S5B | Strategy Plan | `docs/business-os/strategy/HEAD/plan.user.md` | Active | Canonical strategy wrapper |
| S6B | Site Upgrade Brief | `docs/business-os/site-upgrades/HEAD/latest.user.md` | Active | Pointer → 2026-02-12 upgrade brief |
| S9B | Launch Readiness Backlog | `docs/business-os/strategy/HEAD/launch-readiness-action-backlog.user.md` | Active | Pre-launch action items |
| S10 | Week 2 Gate Dry-Run | `docs/business-os/strategy/HEAD/2026-02-11-week2-gate-dry-run.user.md` | Active | Gate assessment record |
| S10 | Weekly K/P/C/S Decision | `docs/business-os/strategy/HEAD/2026-02-12-weekly-kpcs-decision.user.md` | Active | First weekly decision memo |

**Excluded from HEAD (with reason):**
- `headband-90-day-launch-forecast-v1.user.md` — superseded by v2
- `headband-90-day-launch-forecast-v1-exec-summary.user.md`, `headband-90-day-launch-forecast-v2-exec-summary.user.md` — derivative exec summaries
- `naming-research-prompt.md` — prompt/input file, not an output
- `index.user.md` — navigation index

---

#### PET (Pet Travel Accessories DTC)

| Stage | Artifact | Path | Status | Notes |
|-------|----------|------|--------|-------|
| S0 | Intake Packet | `docs/business-os/startup-baselines/PET-intake-packet.user.md` | Active | Business context and constraints |
| S0 | Forecast Seed | `docs/business-os/startup-baselines/PET-forecast-seed.user.md` | Draft | Pre-loop revenue hypothesis |
| S1 | Market Intelligence | `docs/business-os/market-research/PET/latest.user.md` | Active | Pointer → current research report |
| S1 | Brand Dossier | `docs/business-os/strategy/PET/brand-dossier.user.md` | Draft | Visual + voice identity |
| S2B | Offer Design | `docs/business-os/startup-baselines/PET-offer.md` | Hypothesis | ICP, positioning, pricing (€80), objection map; 6 sections complete |
| S3 | 90-Day Forecast v2 | `docs/business-os/strategy/PET/italy-90-day-launch-forecast-v2.user.md` | Draft | P10/P50/P90 scenario model |
| S5 | Prioritization Scorecard | `docs/business-os/strategy/PET/2026-02-12-prioritization-scorecard.user.md` | Active | Go-item ranking |
| S5B | Strategy Plan | `docs/business-os/strategy/PET/plan.user.md` | Active | Canonical strategy wrapper |
| S6B | Site Upgrade Brief | `docs/business-os/site-upgrades/PET/latest.user.md` | Active | Pointer → 2026-02-12 upgrade brief |
| S6B | Naming Shortlist | `docs/business-os/strategy/PET/2026-02-18-naming-shortlist.user.md` | Awaiting-Decision | Recommends "Vellara" — pending operator decision |
| S9B | Launch Readiness Backlog | `docs/business-os/strategy/PET/launch-readiness-action-backlog.user.md` | Active | Pre-launch action items |
| S10 | Week 2 Gate Dry-Run | `docs/business-os/strategy/PET/2026-02-11-week2-gate-dry-run.user.md` | Active | Gate assessment record |
| S10 | Weekly K/P/C/S Decision | `docs/business-os/strategy/PET/2026-02-12-weekly-kpcs-decision.user.md` | Active | First weekly decision memo |

**Excluded from PET (with reason):**
- `italy-90-day-launch-forecast-v2-exec-summary.user.md` — derivative exec summary
- `2026-02-18-naming-prompt.user.md` — prompt file, not output
- `index.user.md` — navigation index

---

#### BRIK (Brikette Boutique Hotel)

| Stage | Artifact | Path | Status | Notes |
|-------|----------|------|--------|-------|
| S0 | Intake Packet | `docs/business-os/startup-baselines/BRIK-intake-packet.user.md` | Active | Business context and constraints |
| S0 | Forecast Seed | `docs/business-os/startup-baselines/BRIK-forecast-seed.user.md` | Active | Pre-loop revenue hypothesis (Active + Integrated) |
| S1 | Market Intelligence | `docs/business-os/market-research/BRIK/latest.user.md` | Active | Pointer → 2026-02-15 research report |
| S1 | Brand Dossier | `docs/business-os/strategy/BRIK/brand-dossier.user.md` | Active | Visual + voice identity (Active, not Draft) |
| S1B | Historical Performance Baseline | `docs/business-os/strategy/BRIK/2026-02-12-historical-performance-baseline.user.md` | Active | Historical occupancy + revenue data |
| S1B | Octorate Operational Data Baseline | `docs/business-os/strategy/BRIK/2026-02-14-octorate-operational-data-baseline.user.md` | Active | PMS data snapshot |
| S2A | GA4 + Search Console Setup Note | `docs/business-os/strategy/BRIK/2026-02-12-ga4-search-console-setup-note.user.md` | Active | Measurement stack configuration record |
| S2A | Measurement Verification | `docs/business-os/strategy/BRIK/2026-02-13-measurement-verification.user.md` | Active | Verified tracking is live |
| S3 | 90-Day Forecast v1 | `docs/business-os/strategy/BRIK/2026-02-13-startup-loop-90-day-forecast-v1.user.md` | Active | P10/P50/P90 scenario model (only version) |
| S3 | Apartment Revenue Architecture | `docs/business-os/strategy/BRIK/2026-02-12-apartment-revenue-architecture.user.md` | Active | Revenue model for apartment unit |
| S3 | Room Pricing Analysis | `docs/business-os/strategy/BRIK/room-pricing-analysis.md` | Active | OTA rate analysis by room/season from Octorate export; `Type: Analysis-Output` in frontmatter |
| S5 | Prioritization Scorecard | `docs/business-os/strategy/BRIK/2026-02-13-prioritization-scorecard.user.md` | Active | Go-item ranking |
| S5B | Strategy Plan | `docs/business-os/strategy/BRIK/plan.user.md` | Active | Canonical strategy wrapper |
| S6B | Site Upgrade Brief | `docs/business-os/site-upgrades/BRIK/latest.user.md` | Active | Pointer → 2026-02-12 upgrade brief |
| S6B | Sales Funnel External Brief | `docs/business-os/strategy/BRIK/2026-02-17-brikette-sales-funnel-external-brief.user.md` | Active | External brief on funnel conversion |
| S6B | Octorate Process Reduction Feasibility | `docs/business-os/strategy/BRIK/2026-02-17-octorate-process-reduction-feasibility.user.md` | Active | Feasibility study for PMS friction reduction |
| S7 | Product Spec | `docs/business-os/strategy/BRIK/product-spec.user.md` | Active | Website + booking product specification |
| S7 | Prime App Design Branding | `docs/business-os/strategy/BRIK/prime-app-design-branding.user.md` | Active | Design language and brand guidelines |
| S10 | Weekly K/P/C/S Decision | `docs/business-os/strategy/BRIK/2026-02-13-weekly-kpcs-decision.user.md` | Active | First weekly decision memo |
| S10 | Signal Review W08 | `docs/business-os/strategy/BRIK/signal-review-20260218-1238-W08.md` | Active | Week 8 signal quality review |

**Excluded from BRIK (with reason):**
- `2026-02-13-startup-loop-90-day-forecast-v1-exec-summary.user.md` — derivative exec summary
- `2026-02-12-historical-baseline-prompt.user.md`, `2026-02-12-historical-data-request-prompt.user.md` — prompt files
- `product-spec-sources.md` — source list / research input, not output artifact
- `index.user.md` — navigation index

---

### Key Modules / Files

- `docs/business-os/startup-loop-workflow-v2.user.html` — design reference; all
  CSS tokens, font stack, and grain texture should be replicated here
- `docs/business-os/market-research/*/latest.user.md` — pointer pattern to understand
- `docs/business-os/site-upgrades/*/latest.user.md` — pointer pattern to understand

### Patterns & Conventions Observed

- **`latest.user.md` pointer pattern** — market-research and site-upgrades both use
  a pointer file as the canonical entry point. The registry should link to the
  pointer, not the dated source it references.
  Evidence: `docs/business-os/market-research/HEAD/latest.user.md`,
  `docs/business-os/site-upgrades/HEAD/latest.user.md`
- **`.user.md` / `.agent.md` / `.html` triple pattern** — many artifacts exist in
  three forms. The `.user.md` is the canonical form; `.agent.md` and `.html`
  variants are excluded. Some genuine outputs (auto-generated analyses, signal
  reviews) use plain `.md` — see Rule 9; those are included on content grounds.
  Evidence: `strategy/BRIK/plan.user.md`, `strategy/BRIK/plan.agent.md`,
  `strategy/BRIK/plan.user.html`
- **`startup-baselines/` as S0 home** — intake packets and forecast seeds live in
  a shared directory (not per-business strategy directories).
  Evidence: `startup-baselines/HEAD-intake-packet.user.md` etc.
- **BRIK is most advanced** — only business with S1B measurement stage artifacts,
  S7 product spec, and an Active (not Draft) brand dossier.

### Delivery & Channel Landscape

- Audience: operator (Peter) — same audience as `startup-loop-workflow-v2.user.html`
- Channel: local file, opened in browser
- Existing templates/assets: `startup-loop-workflow-v2.user.html` provides the
  full design system (CSS vars, grain texture, badge classes, sidebar pattern)
- Output path: `docs/business-os/startup-loop-output-registry.user.html`

---

## Questions

### Resolved

- Q: Should exec summaries be included?
  - A: No — they are derivative of the parent forecast. Exclude.
  - Evidence: `headband-90-day-launch-forecast-v2-exec-summary.user.md` adds no
    content beyond the parent forecast doc.

- Q: Where multiple forecast versions exist, include all or latest only?
  - A: Latest only. v1 is superseded by v2 for HEAD; exclude v1.
  - Evidence: HEAD has both v1 and v2 forecasts. v2 is more recent and complete.

- Q: Should pointer files or dated source files be shown for market-research/site-upgrades?
  - A: Pointer files only (`latest.user.md`). They are the canonical access point.
  - Evidence: `latest.user.md` pattern present for all 3 businesses in both
    market-research and site-upgrades directories.

- Q: Is `index.user.md` an output artifact?
  - A: No — it is a navigation/index file for the strategy directory. Exclude.

- Q: Should `plan.user.md` appear even though it may wrap earlier outputs?
  - A: Yes — it is the canonical strategy wrapper and the primary planning output
    for S5B. Constituent outputs (forecast seed, etc.) appear separately at their
    own stages when they contain distinct content.

- Q: Is `PET-offer.md` a completed offer output or a working-notes file?
  - A: Genuine output. Has structured frontmatter (`artifact: offer-design`,
    `status: hypothesis`), 6 complete sections (ICP, pain/promise map, offer
    structure, positioning, pricing, objection map), QC self-audit, and evidence
    register. Included at S2B.
  - Evidence: `docs/business-os/startup-baselines/PET-offer.md` lines 1–328.

- Q: Is `BRIK/room-pricing-analysis.md` a standalone pricing analysis or working notes?
  - A: Genuine output. Frontmatter declares `Type: Analysis-Output`, `Status: Active`;
    generated from Octorate data via `scripts/brik/analyse-room-pricing.py`.
    Included at S3.
  - Evidence: `docs/business-os/strategy/BRIK/room-pricing-analysis.md` lines 1–14.

### Open (Verify Before Build)

None. All inclusion questions resolved.

---

## Confidence Inputs

- Implementation: 95%
  - Basis: Full artifact inventory confirmed for all 3 businesses, established
    design system to replicate, single-file HTML output with no novel architecture.
    All inclusion questions resolved.

- Approach: 95%
  - Basis: Inclusion rules are well-defined and consistently applied (content/
    frontmatter test, not filename suffix). Deduplication logic is confirmed.
    Stage mapping complete for all 3 businesses.

- Impact: 95%
  - Basis: Clear user need; the workflow HTML already demonstrates the value of
    this companion pattern.

- Delivery-Readiness: 92%
  - Basis: All source artifacts identified; design reference exists; output path
    and format confirmed.

- Testability: 80%
  - Basis: Visual/structural correctness is human-reviewable. No automated tests
    needed for a static HTML artifact.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Artifact stale on next session | High | Low | Include a "Snapshot date: 2026-02-19" note prominently; no false sense of live data |
| Ambiguous artifact classification leads to omissions or false inclusions | Low | Medium | All current questions resolved; apply Rule 9 (frontmatter type test) to any new ambiguous files |
| Visual drift from workflow HTML | Low | Medium | Directly reuse CSS vars and design tokens from the reference file; do not reinvent |
| File path broken if files move | Medium | Low | Paths are documentation, not links that execute; broken paths are a documentation problem only |

---

## Suggested Task Seeds (Non-binding)

1. **Extract CSS design system** — Copy exact CSS vars, font stack, grain texture,
   and badge classes from `startup-loop-workflow-v2.user.html` as the style block.
2. **Build HTML shell** — Sidebar nav, main content area, stage section structure,
   business column layout.
3. **Populate HEAD table** — 11 artifacts across 8 stages (S0, S1, S3, S5, S5B, S6B, S9B, S10).
4. **Populate PET table** — 13 artifacts across 9 stages (S0, S1, S2B, S3, S5, S5B, S6B, S9B, S10).
5. **Populate BRIK table** — 20 artifacts across 10 stages (S0, S1, S1B, S2A, S3, S5, S5B, S6B, S7, S10).
6. **Apply status badges** — Active (green), Draft (amber), Awaiting-Decision
   (blue), Hypothesis (purple) — using existing badge CSS classes from the workflow HTML.
7. **Add exclusion rationale sidebar or footer** — Brief note on what was excluded
   and why, so the registry self-documents its curation logic.
8. **Manual visual QA** — Open in browser, compare against workflow HTML for
   aesthetic consistency.

---

## Execution Routing Packet

- Primary execution skill: `lp-do-build` (business-artifact track → HTML document)
- Supporting skills: none
- Deliverable acceptance package:
  - Self-contained HTML file at `docs/business-os/startup-loop-output-registry.user.html`
  - Visually consistent with `startup-loop-workflow-v2.user.html` (same font stack,
    same CSS tokens, same grain texture, same sidebar pattern)
  - All 3 businesses covered, all confirmed artifacts listed, deduplication rules
    applied, exclusions documented
  - Snapshot date clearly labelled
- Post-delivery measurement plan:
  - None required for a static reference artifact

---

## Evidence Gap Review

### Gaps Addressed
- Full artifact inventory completed for all 3 businesses (HEAD: 11, PET: 13,
  BRIK: 20 confirmed artifacts)
- Stage mapping derived from artifact dates and content types
- Inclusion/exclusion rules validated against the actual directory contents
- Deduplication decisions made explicit for every ambiguous case

### Confidence Adjustments
- Initial assumption was ~15 artifacts per business. Actual counts: HEAD 11,
  PET 13, BRIK 20. BRIK is materially more advanced (S1B measurement stage,
  S7 product work, signal reviews).

### Remaining Assumptions
- Artifact statuses (Active/Draft/Hypothesis) inferred from frontmatter where
  present, or from directory listings; a small number may be inaccurate

---

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none — all inclusion questions resolved, artifact inventory
  complete, design reference confirmed
- Recommended next step: `/lp-do-plan` to sequence the HTML build tasks, then
  `/lp-do-build` to execute
