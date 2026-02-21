---
Type: Plan
Status: Complete
Domain: Business-OS
Workstream: Mixed
Created: 2026-02-19
Last-updated: 2026-02-19
TASK-01-completed: 2026-02-19
TASK-02-completed: 2026-02-19
Feature-Slug: startup-loop-output-registry
Deliverable-Type: html-document
Startup-Deliverable-Alias: none
Execution-Track: business-artifact
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 80%
Confidence-Method: min(Implementation,Approach,Impact); overall effort-weighted
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: none
Card-ID: none
---

# Startup Loop Output Registry Plan

## Summary

Build a single self-contained HTML file — the "Output Registry" — that surfaces
every decision-grade output artifact produced so far in the startup loop for HEAD,
PET, and BRIK, organised by stage (S0 → S10). The file is a point-in-time
read-only record (snapshot date 2026-02-19), not a task list or planning tool.
It is designed to sit alongside `startup-loop-workflow-v2.user.html` and must
match its exact visual aesthetic: deep navy, Playfair Display headings, JetBrains
Mono data cells, Sora body, gold accent borders, CSS grain texture.

Total confirmed artifacts: HEAD 11, PET 13, BRIK 20.

## Goals

- Provide a single view of all 44 confirmed genuine output artifacts per business,
  per stage
- Enforce deduplication: pointer-files instead of dated sources; latest forecast
  version only; no exec summaries; wrappers instead of their absorbed parts
- Match the command-centre visual aesthetic of `startup-loop-workflow-v2.user.html`
  without diverging on any design token
- Be fully self-contained: a single HTML file with no runtime data fetches

## Non-goals

- Real-time file system sync
- Interactive filtering or search beyond passive CSS
- Coverage beyond HEAD, PET, BRIK
- Coverage of non-startup-loop plan directories

## Constraints & Assumptions

- Constraints:
  - Single HTML file — no build pipeline, no JS frameworks
  - No runtime data fetches (Google Fonts CDN is the only external dependency —
    same as the reference file)
  - File paths are display-only (not clickable links that execute)
- Assumptions:
  - Output path: `docs/business-os/startup-loop-output-registry.user.html`
  - Content snapshot dated 2026-02-19; no live refresh
  - CSS tokens, font URLs, grain texture, and badge classes are copied directly
    from the reference file — no redesign or reinterpretation

## Fact-Find Reference

- Related brief: `docs/plans/startup-loop-output-registry/fact-find.md`
- Key findings used:
  - Full artifact inventory: HEAD 11 / PET 13 / BRIK 20 (all resolved, no open
    questions)
  - Design reference: `docs/business-os/startup-loop-workflow-v2.user.html`
  - Inclusion rules 1–9 (content/frontmatter test, not filename suffix)
  - Deduplication decisions: latest pointer for market-research/site-upgrades;
    latest forecast version; exec summaries excluded
  - Stage-to-artifact mapping fully confirmed

## Proposed Approach

- Option A: Author as a single monolithic HTML file (shell + content in one pass).
- Option B: Build shell first as a separate task, then populate tables.

- Chosen approach: Option A. The design system is small and well-defined (copy
  from reference). The content is fully specified in fact-find. Splitting adds
  overhead with no risk benefit for a 2-task plan.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No (plan-only mode; no explicit build intent from user)

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---------|------|-------------|:----------:|:------:|--------|------------|--------|
| TASK-01 | IMPLEMENT | Build Output Registry HTML | 80% | M | Complete (2026-02-19) | — | TASK-02 |
| TASK-02 | IMPLEMENT | Visual QA against reference HTML | 80% | S | Complete (2026-02-19) | TASK-01 | — |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | TASK-01 | — | Main authoring pass |
| 2 | TASK-02 | TASK-01 complete | Browser review; no build tools |

## Tasks

---

### TASK-01: Build Output Registry HTML

- **Type:** IMPLEMENT
- **Deliverable:** `docs/business-os/startup-loop-output-registry.user.html` —
  self-contained HTML file
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-19)
- **Build evidence:**
  - File created: `docs/business-os/startup-loop-output-registry.user.html`
  - VC-01: HEAD 11 / PET 13 / BRIK 20 paths confirmed via grep (44 total ✓)
  - VC-02: exec-summary appears once only, in the Exclusions section entry — zero in artifact tables ✓
  - VC-03: No dated market-research or site-upgrade sources alongside pointers ✓
  - VC-04: `--bg: #040b18`, `--accent: #c9a84c`, all three font families present ✓
  - VC-05: No `fetch(`, `XMLHttp`, `<script src` ✓ (IntersectionObserver is local DOM only)
- **Artifact-Destination:** Local file; opened in browser alongside
  `startup-loop-workflow-v2.user.html`
- **Reviewer:** Operator (Peter)
- **Approval-Evidence:** File renders in browser, all 44 artifacts visible, no
  visual regressions vs reference HTML
- **Measurement-Readiness:** None: static reference artifact; no KPIs to track
- **Affects:** `docs/business-os/startup-loop-output-registry.user.html` (new
  file)
- **Depends on:** —
- **Blocks:** TASK-02

- **Confidence:** 80%
  - Implementation: 95% — complete content spec in fact-find, exact CSS available
    from reference file, single-file HTML with no build pipeline
  - Approach: 85% — copy-exact CSS design tokens; content is fully specified;
    minor uncertainty on first-pass visual match requiring small iteration
  - Impact: 95% — clear operator need; directly complements existing workflow HTML
  - Overall (min): 85%; capped to 80% by business fail-first rule (Red/VC plan
    present, no Green evidence yet → max score at multiples of 5 ≤ 84 is 80)

- **Acceptance:**
  - [ ] File exists at `docs/business-os/startup-loop-output-registry.user.html`
  - [ ] All 44 artifacts present: HEAD 11, PET 13, BRIK 20
  - [ ] Each artifact row shows: Stage, Artifact name, Path, Status, Notes
  - [ ] Status badges render (Active, Draft, Hypothesis, Awaiting-Decision)
  - [ ] Deduplication rules applied: no pointer + dated-source duplicates; exec
    summaries absent; only latest forecast version shown
  - [ ] Snapshot date 2026-02-19 prominently displayed
  - [ ] Page renders without layout breaks in a modern browser

- **Validation contract:**
  - VC-01: All 44 paths from the fact-find inventory are present in the file
    verbatim. Check: grep or visual scan of each path string. Pass: 44/44 present.
    Deadline: before TASK-02.
  - VC-02: No exec-summary file appears. Check: grep for `exec-summary` in the
    HTML output section. Pass: 0 matches.
  - VC-03: No duplicate entries for the same path (pointer + dated source). Check:
    each `latest.user.md` pointer appears at most once; its dated target does not
    also appear. Pass: 0 duplicate pairs.
  - VC-04: CSS custom properties `--bg`, `--accent`, `--text`, `--surface`, font
    families `Playfair Display`, `Sora`, `JetBrains Mono` are present in the
    `<style>` block. Pass: all 8 tokens/fonts found.
  - VC-05: File is self-contained (no `<script src=`, no `fetch(`, no `XMLHttp`).
    Pass: 0 matches for those strings.

- **Execution plan:** Red → Green → Refactor (VC-first)
  - Red evidence plan: VCs defined above; open fact-find and confirm 44 artifact
    paths before writing a single line of HTML
  - Green evidence plan: Author HTML in one pass — `<style>` block from reference,
    sidebar nav, three business sections each with stage-grouped tables; run VC-01
    through VC-05 after save
  - Refactor evidence plan: Fix any VC failures; iterate on visual layout until
    side-by-side comparison with reference shows consistent typography, spacing,
    and colour

- **Planning validation:** None: S/M effort; content fully specified; no external
  dependencies to pre-validate
- **Scouts:** None: design reference exists; content spec complete; inclusion rules
  confirmed
- **Edge Cases & Hardening:**
  - PET-offer.md has no `.user.md` suffix — display path exactly as-is, noting
    `Type: Analysis-Output`-style exception in the exclusion footer
  - room-pricing-analysis.md and signal-review-*.md similarly use plain `.md` —
    include; note exception in footer
  - Long file paths may overflow table cells — use `word-break: break-all` or
    monospace wrapping in CSS
  - Missing S2A / S1B stages in HEAD and PET — omit those stage headers entirely
    for those businesses (do not show empty stage rows)

- **What would make this >=90%:**
  - Green evidence (artifact built and VCs passing) → removes fail-first cap and
    raises to >=90%

- **Rollout / rollback:**
  - Rollout: save file to path; open in browser to verify
  - Rollback: delete file — no system state changed

- **Documentation impact:** New file only; no existing docs modified

- **Notes / references:**
  - Design reference: `docs/business-os/startup-loop-workflow-v2.user.html`
  - Content source: `docs/plans/startup-loop-output-registry/fact-find.md`
    (Stage-by-Stage Artifact Inventory section)
  - Inclusion rule 9: filename suffix is not the criterion; use frontmatter
    `Type:` or evident content

---

### TASK-02: Visual QA against reference HTML

- **Type:** IMPLEMENT
- **Deliverable:** Verified visual parity confirmation (operator sign-off or
  diff notes recorded in this plan)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-19)
- **Build evidence:**
  - VC-01 font match: PASS (Playfair Display h1, Sora body, JetBrains Mono paths — confirmed via getComputedStyle)
  - VC-02 colour tokens: PASS (--bg #040b18, --accent #c9a84c exact match in DevTools)
  - VC-03 no overflow: PASS at 1200px, 1440px, 1920px
- **Artifact-Destination:** Sign-off recorded in TASK-02 Approval-Evidence field
- **Reviewer:** Operator (Peter)
- **Approval-Evidence:** Operator opens both HTML files side-by-side and confirms
  visual parity; any deltas recorded and either accepted or triaged back to TASK-01
- **Measurement-Readiness:** None: QA gate, not a tracked metric
- **Affects:** `[readonly] docs/business-os/startup-loop-output-registry.user.html`
- **Depends on:** TASK-01
- **Blocks:** —

- **Confidence:** 80%
  - Implementation: 90% — procedural browser review; no tooling required
  - Approach: 85% — side-by-side visual comparison is the established pattern for
    this design system; criteria are enumerated in VCs
  - Impact: 80% — catches visual drift before the file is used; low effort, clear
    value
  - Overall (min): 80%; at threshold — held-back test: could visual comparison
    miss a subtle token mismatch? Yes (e.g. a hex colour slightly off). Mitigation:
    VC-02 checks exact CSS property names, not just visual impression. Score stands
    at 80% with that caveat acknowledged.

- **Acceptance:**
  - [ ] Font families visually match reference (Playfair Display headings, Sora
    body, JetBrains Mono paths)
  - [ ] Background, border, accent colours match reference (deep navy, gold)
  - [ ] Sidebar nav renders with gold left-border pattern
  - [ ] Grain texture visible on body
  - [ ] Stage tables are readable; no overflow or wrapping errors on path strings
  - [ ] All 44 artifact rows visible without scroll truncation issues

- **Validation contract:**
  - VC-01: Open both files in browser tabs; toggle between them; no font-family
    regression. Pass: no visible font difference on headings, body, or table cells.
  - VC-02: Inspect `--bg` and `--accent` values in DevTools; must match reference
    values (`#040b18` and `#c9a84c`). Pass: exact hex match.
  - VC-03: Resize window to 1200px, 1440px, 1920px; no horizontal scroll in main
    content area. Pass: no overflow at any tested width.

- **Execution plan:** Red → Green → Refactor
  - Red evidence plan: VCs above enumerate exact pass criteria before opening
    browser
  - Green evidence plan: Open both files; check each VC; note any failures
  - Refactor evidence plan: If VCs fail, triage back to TASK-01 with specific
    delta notes; re-check after fix

- **Planning validation:** None: procedural QA; no planning investigation needed
- **Scouts:** None: criteria derived directly from reference file
- **Edge Cases & Hardening:** None: read-only review; no state changes possible
- **What would make this >=90%:** Automated pixel-diff tooling (out of scope for
  this artifact)
- **Rollout / rollback:** None: QA task; no files modified
- **Documentation impact:** Record approval evidence in this task field after sign-off

---

## Risks & Mitigations

- **Artifact stale immediately after creation** — Include snapshot date 2026-02-19
  prominently; no false sense of live data
- **Path display overflow in narrow tables** — CSS `word-break: break-all` on path
  cells; tested at three viewport widths in TASK-02 VC-03
- **Visual token drift** — CSS tokens copied verbatim from reference in TASK-01;
  exact hex values validated in TASK-02 VC-02

## Observability

- None: static reference artifact; no runtime, no logging, no metrics

## Acceptance Criteria (overall)

- [ ] `docs/business-os/startup-loop-output-registry.user.html` exists and opens
  in browser
- [ ] All 44 confirmed artifacts present (HEAD 11 / PET 13 / BRIK 20)
- [ ] Visual parity with `startup-loop-workflow-v2.user.html` confirmed by operator
- [ ] Deduplication and inclusion rules verifiably applied (exclusion footer present)
- [ ] Snapshot date 2026-02-19 displayed

## Decision Log

- 2026-02-19: Option A chosen (single authoring pass) over Option B (shell-then-
  populate). Rationale: design system is small and fully defined; no risk benefit
  from splitting.
- 2026-02-19: PET-offer.md (status: Hypothesis) and BRIK room-pricing-analysis.md
  (Type: Analysis-Output) confirmed as genuine outputs and included. See fact-find
  Resolved Q&A for evidence.
- 2026-02-19: Filename suffix (.user.md) is not the inclusion criterion; see
  Inclusion Rule 9 in fact-find.

## Overall-confidence Calculation

- TASK-01: 80%, effort M (weight 2)
- TASK-02: 80%, effort S (weight 1)
- Overall = (80 × 2 + 80 × 1) / (2 + 1) = 240 / 3 = **80%**
