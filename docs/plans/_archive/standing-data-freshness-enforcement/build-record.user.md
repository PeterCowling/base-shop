---
Type: Build-Record
Status: Complete
Feature-Slug: standing-data-freshness-enforcement
Completed-date: 2026-03-03
artifact: build-record
Build-Event-Ref: docs/plans/standing-data-freshness-enforcement/build-event.json
---

# Build Record: Standing Data Freshness Enforcement

## Outcome Contract

- **Why:** Standing data files are the input to every startup-loop stage decision. Without freshness enforcement, an agent or operator can make a strategy decision based on a 3-month-old offer doc without any warning. The baselines reorganisation made this visible — the files are now tidy but still have no way to signal when they need refreshing.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Startup-baselines files have a freshness enforcement mechanism — stale files are surfaced automatically via a script or preflight check, so decisions are never silently made on outdated standing data.
- **Source:** operator

## What Was Built

Created a standalone baselines freshness checker module (`baselines-freshness.ts`) that scans `.md` files in `docs/business-os/startup-baselines/<BIZ>/` subdirectories, reads frontmatter dates (normalizing 6 observed field variants: `last_updated`, `Last-updated`, `Updated`, `Last-reviewed`, `created`, `Created`), falls back to git commit date when frontmatter is missing, and classifies each file as ok (< 45d), warning (45-90d), or stale (> 90d). Extended mcp-preflight with a new `baseline-content-freshness` check that surfaces warnings for stale standing content. Added a CLI script (`pnpm check-baselines-freshness`) for on-demand invocation. Wrote 16 tests covering all 9 TC contracts plus additional edge cases.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `npx tsc --noEmit --project scripts/tsconfig.json` | Pass | Local typecheck clean |
| `pnpm check-baselines-freshness` | Pass | 18 files checked, all OK |
| CI: Unit tests + Lint + Typecheck | Pending | Push `f03eabc8de` — CI run #22632199499 |

## Validation Evidence

### TASK-01
- TC-01: `last_updated: 2026-01-01` at eval date 2026-03-03 → "warning" (62 days). Implemented in test.
- TC-02: `Updated: 2025-11-01` → "stale" (123 days). Implemented in test.
- TC-03: `Last-reviewed: 2026-02-28` → "ok" (3 days). Implemented in test.
- TC-04: No frontmatter date → git commit date fallback. Implemented with injectable `gitDateFn`.
- TC-05: No frontmatter AND no git date → "stale" with source "unknown". Implemented in test.
- TC-06: `_templates/` excluded. Verified only business subdirectory files scanned.
- TC-07: mcp-preflight `baseline-content-freshness` → "warn" when stale files present. Integration test.
- TC-08: mcp-preflight `baseline-content-freshness` → "pass" when all fresh. Integration test.
- TC-09: CLI exits 0 and outputs summary. Validated locally (18 files, all OK).

## Scope Deviations

None. All files in the Affects list were created/modified as planned. No scope expansion needed.
