---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Infra
Workstream: Engineering
Created: 2026-03-02
Last-updated: 2026-03-02
Feature-Slug: brikette-weekly-watchdog
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find
Related-Plan: docs/plans/brikette-weekly-watchdog/plan.md
Trigger-Why: Prevent silent production regressions in booking funnel smoke paths and locale JSON quality.
Trigger-Intended-Outcome: "type: measurable | statement: weekly scheduled smoke + locale watchdog runs with artifact output and threshold alerts for regressions | source: operator"
---

# Brikette Weekly Watchdog Fact-Find Brief

## Scope
### Summary
Automate recurring production smoke checks and locale JSON quality checks so regressions are detected without manual runs.

### Goals
- Schedule production smoke checks weekly.
- Schedule locale JSON quality checks weekly.
- Include missing-key and untranslated-key signals in machine-readable output.
- Gate on regression thresholds so CI only breaks when quality worsens.

### Non-goals
- Fix existing locale debt in this cycle.
- Replace current deploy/test workflows.

### Constraints & Assumptions
- Constraints:
  - Existing locale debt is non-zero (`missingFiles=51`, `missingKeys=304`, `untranslatedKeys=3131`).
  - Must reuse existing checks where possible.
- Assumptions:
  - Weekly cadence is sufficient for watchdog signal.

## Outcome Contract
- **Why:** Prevent silent regressions in production smoke paths and locale quality.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Weekly watchdog workflow runs automatically and surfaces regression failures/artifacts for smoke and locale checks.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `.github/workflows/test.yml` - existing i18n coverage job (missing-key only summary).
- `apps/brikette/scripts/e2e/brikette-smoke.mjs` - existing smoke runner with audit mode.
- `apps/brikette/scripts/check-i18n-coverage.ts` - existing locale coverage script (missing files/keys).

### Key Findings
- Smoke checks exist but are not scheduled against production in a dedicated watchdog workflow.
- i18n checks exist but do not classify untranslated EN-equal values.
- Current locale baseline is non-zero, so immediate strict zero-gating would create persistent red runs.

## Questions
### Resolved
- Q: Should this run as strict zero gate now?
  - A: No. Use baseline thresholds first, then tighten toward zero.
  - Evidence: Current baseline from `check-i18n-coverage` is non-zero.

## Confidence Inputs
- Implementation: 92%
- Approach: 90%
- Impact: 88%
- Delivery-Readiness: 93%
- Testability: 90%

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Weekly watchdog fails permanently due to debt | Medium | Medium | Threshold-gated regression mode with explicit baseline constants |
| Untranslated detection false positives | Medium | Low | Heuristic filters for URLs/routes/placeholders/numeric values |

