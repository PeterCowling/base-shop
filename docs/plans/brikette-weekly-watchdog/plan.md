---
Type: Plan
Status: Active
Domain: Infra
Workstream: Engineering
Created: 2026-03-02
Last-reviewed: 2026-03-02
Last-updated: 2026-03-02
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brikette-weekly-watchdog
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Brikette Weekly Watchdog Plan

## Summary
Implement a weekly watchdog workflow for Brikette that runs production smoke checks and locale JSON regression checks. Extend locale coverage tooling to detect untranslated EN-equal strings and expose this in JSON summary output. Keep initial gating regression-based via explicit thresholds from current baseline, then tighten over time.

## Active tasks
- [x] TASK-01: Extend locale coverage script with untranslated-key detection and threshold options.
- [x] TASK-02: Add weekly scheduled GitHub workflow for production smoke + locale watchdog.
- [x] TASK-03: Update existing i18n CI summary output to include untranslated-key counts.

## Inherited Outcome Contract
- **Why:** Prevent silent regressions in production smoke paths and locale quality.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Weekly watchdog workflow runs automatically and surfaces regression failures/artifacts for smoke and locale checks.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/brikette-weekly-watchdog/fact-find.md`

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add untranslated detection + thresholds to locale checker | 92% | M | Complete (2026-03-02) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Add weekly watchdog workflow for production smoke + locale audit | 90% | M | Complete (2026-03-02) | TASK-01 | - |
| TASK-03 | IMPLEMENT | Surface untranslated counts in existing i18n summary output | 93% | S | Complete (2026-03-02) | TASK-01 | - |

## Acceptance Criteria (overall)
- [x] Weekly workflow exists and is schedule-triggered + manually triggerable.
- [x] Production smoke runs automatically in watchdog pipeline.
- [x] Locale checker reports missing files/keys and untranslated keys.
- [x] Locale checker supports regression thresholds for all three counts.
- [x] Existing i18n coverage job summary includes untranslated counts.

## Decision Log
- 2026-03-02: Adopt regression-threshold gating for locale watchdog due to known debt baseline; tighten toward zero in follow-on cycles.

