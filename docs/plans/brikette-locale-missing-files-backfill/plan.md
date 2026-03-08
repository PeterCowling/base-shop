---
Type: Plan
Status: Active
Domain: UI
Workstream: Engineering
Created: 2026-03-02
Last-reviewed: 2026-03-02
Last-updated: 2026-03-02
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brikette-locale-missing-files-backfill
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas, lp-do-fact-find
Overall-confidence: 93%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Brikette Locale Missing Files Backfill Plan

## Summary
Fix locale coverage debt by backfilling three missing files to all non-EN locales and tightening watchdog thresholds so missing files cannot regress.

## Active tasks
- [x] TASK-01: Backfill missing locale files across all non-EN locales.
- [x] TASK-02: Set weekly watchdog missing-file threshold to `0`.
- [x] TASK-03: Re-run locale coverage and confirm no missing files.

## Inherited Outcome Contract
- **Why:** Close recurring locale-file integrity gap.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Missing locale files drop to zero and weekly watchdog prevents recurrence.
- **Source:** operator

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Backfill `hospitalityPreview.json`, `languageGateway.json`, `briketteToFerryDock.json` | 95% | S | Complete (2026-03-02) | - | TASK-03 |
| TASK-02 | IMPLEMENT | Tighten watchdog `I18N_MAX_MISSING_FILES` to 0 | 94% | S | Complete (2026-03-02) | - | TASK-03 |
| TASK-03 | IMPLEMENT | Validate missing files = 0 in coverage report | 92% | S | Complete (2026-03-02) | TASK-01, TASK-02 | - |

## Acceptance Criteria (overall)
- [x] Locale coverage reports `totalMissingFiles: 0`.
- [x] Weekly watchdog enforces `I18N_MAX_MISSING_FILES=0`.

