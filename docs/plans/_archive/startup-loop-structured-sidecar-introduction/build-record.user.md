---
Type: Build-Record
Status: Complete
Feature-Slug: startup-loop-structured-sidecar-introduction
Completed-date: 2026-03-06
Business-Unit: PLAT
artifact: build-record
Build-Event-Ref: docs/plans/startup-loop-structured-sidecar-introduction/build-event.json
---

# Build Record — Startup Loop Structured Sidecar Introduction

## Build Summary

All 6 tasks completed across 4 waves on 2026-03-06.

### What was delivered

Three new scripts and one shared module that eliminate markdown re-parse fragility in the startup loop post-build pipeline:

1. **Shared parse module** (`lp-do-build-results-review-parse.ts`) — extracts parse helpers and `classifyIdeaItem` from `generate-process-improvements.ts` into a shared, testable module consumed by both the new extractor scripts and the existing generate script.

2. **Results-review extractor** (`lp-do-build-results-review-extract.ts`) — reads the finalized `results-review.user.md` after LLM authoring, classifies idea candidates, and writes `results-review.signals.json` atomically.

3. **Pattern-reflection extractor** (`lp-do-build-pattern-reflection-extract.ts`) — reads the finalized `pattern-reflection.user.md` after LLM authoring and writes `pattern-reflection.entries.json` atomically.

4. **Sidecar-prefer branches** — `generate-process-improvements.ts` reads idea candidates from `results-review.signals.json` when present, falling back to markdown parse when absent or malformed. `self-evolving-from-build-output.ts` reads candidates and pattern seeds from the respective sidecars at the file-loading layer, with the same fallback.

5. **Build sequence wiring** — SKILL.md steps 2.1 and 2.55 added to invoke the extractor scripts after each LLM refinement step. `loop-output-contracts.md` updated with sidecar artifact documentation.

### Test coverage

- `lp-do-build-results-review-parse.test.ts`: 5 TCs, all pass
- `lp-do-build-results-review-extract.test.ts`: 7 TCs, all pass
- `lp-do-build-pattern-reflection-extract.test.ts`: 5 TCs, all pass
- `generate-process-improvements.test.ts`: 5 new sidecar-prefer TCs added (TC-04-01 through TC-04-05); pre-existing test-suite failure unrelated to this build (import.meta in lp-do-ideas-codebase-signals-bridge)
- `self-evolving-signal-integrity.test.ts`: 5 new sidecar-prefer TCs (TC-05-01 through TC-05-05), all pass; 2 pre-existing failures in same suite unchanged

### Zero-breaking-change guarantee

All historical plans without sidecars continue to use the existing markdown parse path. No existing API or behaviour changed.

## Outcome Contract

- **Why:** The markdown re-parse in `generate-process-improvements.ts` and `self-evolving-from-build-output.ts` is fragile — regex/bullet-parse bugs silently drop ideas from the operator dashboard. Emitting structured sidecars closes this gap and reduces prompt context for the model.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `generate-process-improvements.ts` reads idea candidates from `results-review.signals.json` when present (falling back to markdown parse when absent), and `self-evolving-from-build-output.ts` reads from both sidecars at the file-loading layer. Zero regressions in existing behaviour.
- **Source:** auto
