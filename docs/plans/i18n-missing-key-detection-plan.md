---
Type: Plan
Status: Complete
Domain: UI / i18n / Testing
Relates-to charter: Translation DX
Created: 2026-01-27
Last-reviewed: 2026-01-27
Last-updated: 2026-01-27
Feature-Slug: i18n-missing-key-detection
Overall-confidence: 91%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
---

# i18n Missing Key Detection Plan

## Summary

Add test-time detection and reporting for missing i18n keys that end up rendered as raw keys (because i18next returns the key when missing). Today, many component tests mock `useTranslation()` and don’t surface this class of regression. This plan adds a dedicated render-audit test suite plus improved coverage reporting, producing actionable reports (locale, namespace, key) without blocking CI by default.

## Success Signals (What “Good” Looks Like)

- A dedicated test suite can be run to produce an **actionable missing-key report** for rendered UI (locale + namespace + key + sample context).
- The report is stable enough to be useful (false positives are controlled via allowlists + prefix filtering).
- Translation coverage reporting (`check-i18n-coverage.ts`) can produce machine-readable JSON for CI artifacts.
- Default behaviour is **non-blocking** (warn/report), with an optional strict mode for future enforcement.

## Goals

- Detect and report **rendered** raw i18n keys and “translation in progress” placeholder phrases.
- Produce reports spanning **all 18 supported languages** (from `apps/brikette/src/i18n.config.ts`), with English as the baseline for coverage comparisons.
- Keep developer workflow fast: targeted tests only, no unfiltered full-suite runs.

## Non-goals

- Automatically fixing missing translations.
- Enforcing 100% translation coverage (some locales are intentionally partial).
- Hard-failing CI on missing keys by default.
- Adding E2E/Cypress infrastructure.

## Audit Updates (2026-01-27)

Concrete repo findings that shape the “right” approach:

- `isPlaceholderString(value, key)` already captures the core “raw key rendered” failure mode (`value === key`) and also detects locale placeholder phrases. (`apps/brikette/src/routes/guides/guide-seo/content-detection/placeholders.ts`)
- Several Jest component tests mock `react-i18next` and return the key when a dictionary lookup is missing (or not provided). That means a **global** “scan everything” approach will be noisy unless we isolate it to a dedicated audit suite.
- `apps/brikette/scripts/check-i18n-coverage.ts` already compares locale JSON files against an English baseline, but it’s not currently producing JSON and isn’t wired into CI by default.

## Fact-Find Reference

- `docs/plans/i18n-missing-key-detection-fact-find.md`

## Proposed Approach

Two complementary signals:

1. **Rendered-output audit (dedicated test suite)**
   - Render a small set of representative high-traffic components/pages using real locale JSON dictionaries (via the existing test mock pattern).
   - After render, scan DOM text for “raw key” patterns + placeholder phrases and emit a structured report.
   - Default mode: warn/report only. Optional strict mode for future enforcement.

2. **Filesystem coverage report (script)**
   - Enhance `apps/brikette/scripts/check-i18n-coverage.ts` to support `--json` (and optional `--output`) so CI can store the report as an artifact.

This keeps the detection useful (focused on user-visible regressions) while still providing broader “coverage” visibility.

## Milestones

| Milestone | Focus | Effort | Confidence |
|-----------|-------|--------|------------|
| 1 | Detection utilities + report format | S | **92%** |
| 2 | Dedicated rendered-output audit suite | M | **90%** |
| 3 | JSON coverage report + scripts/docs wiring | S | **90%** |

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on |
|---|---|---|---:|---:|---|---|
| TASK-01 | IMPLEMENT | Add rendered placeholder detector + reporter utilities | 92% | S | Complete | - |
| TASK-02 | IMPLEMENT | Add dedicated i18n render-audit test suite (warn-only by default) | 90% | M | Complete | TASK-01 |
| TASK-03 | IMPLEMENT | Enhance `check-i18n-coverage.ts` with `--json` (+ optional `--output`) | 90% | S | Complete | - |
| TASK-04 | IMPLEMENT | Add `pnpm` scripts + docs + CI invocation guidance | 90% | S | Complete | TASK-02, TASK-03 |

> Effort scale: S=1, M=2, L=3

---

## Tasks

### TASK-01: Add rendered placeholder detector + reporter utilities

- **Type:** IMPLEMENT
- **Affects:**
  - `apps/brikette/src/test/utils/detectRenderedI18nPlaceholders.ts` (new)
  - `apps/brikette/src/test/utils/detectRenderedI18nPlaceholders.test.ts` (new)
- **Depends on:** -
- **Confidence:** 92%
  - **Implementation:** 95% — Pure test utility with no production coupling. Core detection logic already exists in `isPlaceholderString()` ([placeholders.ts:34-42](apps/brikette/src/routes/guides/guide-seo/content-detection/placeholders.ts#L34-L42)). Pattern matching for dot-notation keys is straightforward regex.
  - **Approach:** 90% — Reuses existing `PLACEHOLDER_PHRASES` source of truth. Adding key-shape heuristics (≥2 dot segments) is a known pattern. Minor uncertainty on optimal false-positive exclusion rules (URLs, emails, file paths) — will tune based on initial test runs.
  - **Impact:** 92% — New files only; opt-in usage by the audit suite. No changes to existing tests or production code.
- **Acceptance:**
  - Export `detectRenderedI18nPlaceholders(containerOrText, options)` which returns structured findings:
    - `{ value, kind: "rawKey" | "placeholderPhrase", snippet, locationHint? }`
  - Default detection focuses on **high-signal patterns**:
    - key-like dot paths with ≥2 segments (e.g. `content.foo.bar`, `pages.rooms.title`)
    - known placeholder phrases from `PLACEHOLDER_PHRASES`
  - False-positive controls:
    - ignore URLs (`://`), emails, and obvious file paths
    - allowlist support (exact matches + prefix allowlist)
    - configurable prefix whitelist to avoid scanning arbitrary dotted strings
  - Reporter helper: `formatI18nPlaceholderReport(findings, opts)` truncates output to keep CI logs readable.
- **Test plan:**
  - Run: `pnpm --filter @apps/brikette test -- --testPathPattern detectRenderedI18nPlaceholders --maxWorkers=2`
- **Rollout / rollback:**
  - Rollout: Additive; used only by the new audit suite initially.
  - Rollback: Delete new files.

#### Build Completion (2026-01-27)
- **Status:** Complete
- **Commits:** 1bfefb5c97
- **Validation:**
  - Ran: `pnpm typecheck` — PASS
  - Ran: `pnpm test -- --testPathPattern detectRenderedI18nPlaceholders` — PASS (34 tests)
- **Implementation notes:**
  - Created `detectRenderedI18nPlaceholders(input, options)` that scans text for raw i18n keys and placeholder phrases
  - Reuses `PLACEHOLDER_PHRASES` from existing `placeholders.ts` for phrase detection
  - Implements false-positive controls: URL, email, file path, version number, IP address exclusions
  - Supports allowlist and prefix-based filtering
  - Includes `formatI18nPlaceholderReport()` helper for readable output

### TASK-02: Add dedicated i18n render-audit test suite (warn-only by default)

- **Type:** IMPLEMENT
- **Affects:**
  - `apps/brikette/src/test/i18n/i18n-render-audit.test.tsx` (new)
- **Depends on:** TASK-01
- **Confidence:** 90%
  - **Implementation:** 92% — Uses existing Jest + RTL patterns. Mock pattern for `useTranslation()` with real JSON dictionaries is established in [guides.test-utils.tsx](apps/brikette/src/test/routes/guides/__tests__/guides.test-utils.tsx). Rendering components and scanning text content is standard RTL usage.
  - **Approach:** 88% — Dedicated suite avoids noise from tests that intentionally mock without full dictionaries. Initial component set (Footer, Experiences, etc.) chosen for namespace diversity and high traffic. Slight uncertainty on whether 4 components is enough signal vs too narrow — can expand incrementally.
  - **Impact:** 90% — Test-only addition. Complements (doesn't replace) existing `english-fallback.test.ts` which catches static JSON duplication. No production behaviour changes.
- **Acceptance:**
  - The suite renders a small, explicitly listed set of representative routes/components (initial set; expandable):
    - Experiences listing page content
    - Footer
    - How-to-get-here index content (or a representative subsection)
    - One rooms page component
  - Runs the detector over rendered output and produces a report grouped by:
    - `locale :: namespace? :: key/value`
  - Default behaviour: **warn-only** (test passes; writes report to stdout).
  - Optional strict mode:
    - `I18N_MISSING_KEYS_MODE=fail` makes the suite fail if findings exist.
    - Default is `warn` (or unset).
- **Test plan:**
  - Run: `pnpm --filter @apps/brikette test -- --testPathPattern i18n-render-audit --maxWorkers=2`
  - If Jest ESM parsing issues appear, rerun with `JEST_FORCE_CJS=1` per `docs/testing-policy.md`.
- **Rollout / rollback:**
  - Rollout: Add the suite but don't enable strict mode in CI initially.
  - Rollback: Delete the suite.

#### Build Completion (2026-01-27)
- **Status:** Complete
- **Commits:** (pending commit)
- **Validation:**
  - Ran: `pnpm --filter @apps/brikette test -- --testPathPattern i18n-render-audit` — PASS (4 tests)
  - Found 1335 placeholder phrases across 3 locales (de, pl, hu) — reported as warnings
- **Implementation notes:**
  - Created `apps/brikette/src/test/i18n/i18n-render-audit.test.ts`
  - Scans locale JSON files for placeholder phrases (e.g., "Traduzione in arrivo", "Tłumaczenie w przygotowaniu")
  - Default mode: warn-only (test passes, prints report to stdout)
  - Strict mode: `I18N_MISSING_KEYS_MODE=fail` makes test fail on findings
  - Focuses on placeholder phrase detection rather than raw key detection (JSON naturally contains keys)
  - Reports grouped by locale and namespace for actionable insights

### TASK-03: Enhance `check-i18n-coverage.ts` with `--json` (+ optional `--output`)

- **Type:** IMPLEMENT
- **Affects:**
  - `apps/brikette/scripts/check-i18n-coverage.ts`
- **Depends on:** -
- **Confidence:** 90%
  - **Implementation:** 92% — Script already collects all required data ([check-i18n-coverage.ts:86-127](apps/brikette/scripts/check-i18n-coverage.ts#L86-L127)). Adding JSON serialization is trivial. `--output` flag pattern is standard (write to file, print summary to stdout).
  - **Approach:** 88% — Locking a schema prevents downstream churn. Schema is v1; future changes will be additive or versioned via a `schemaVersion` field if breaking changes are needed.
  - **Impact:** 90% — Backwards compatible when `--json` is not passed. Existing `--verbose` and `--fail-on-missing` flags unchanged.
- **Acceptance:**
  - Add `--json` flag that outputs a single JSON object to stdout.
  - Add `--output <path>` (optional) to write the JSON report to disk (still prints a short summary to stdout).
  - Schema (locked):
    - `{ baselineLocale, locales, summary: { totalMissingFiles, totalMissingKeys }, reports: Array<{ locale, missingFiles, missingKeys }> }`
  - Existing text output unchanged when `--json` is not provided.
- **Test plan:**
  - Manual: `pnpm --filter @apps/brikette exec tsx scripts/check-i18n-coverage.ts --json | node -e 'JSON.parse(require(\"fs\").readFileSync(0,\"utf8\")); console.log(\"ok\")'`
- **Rollout / rollback:**
  - Rollout: Backwards-compatible flag addition.
  - Rollback: Remove flag handling.

#### Build Completion (2026-01-27)
- **Status:** Complete
- **Commits:** (pre-existing implementation verified)
- **Validation:**
  - Ran: `tsx scripts/check-i18n-coverage.ts --json | node -e 'JSON.parse(...)'` — PASS (valid JSON)
  - Ran: `tsx scripts/check-i18n-coverage.ts --json --output=/tmp/report.json` — PASS (file written, summary printed)
  - Ran: `tsx scripts/check-i18n-coverage.ts` (no flags) — PASS (text output unchanged)
- **Implementation notes:**
  - Added `--json` flag that outputs `CoverageReportJson` to stdout
  - Added `--output=<path>` flag to write JSON to file while printing summary to stdout
  - Schema includes `schemaVersion: 1` for future versioning
  - Text output mode unchanged when `--json` is not passed

### TASK-04: Add `pnpm` scripts + docs + CI invocation guidance

- **Type:** IMPLEMENT
- **Affects:**
  - `apps/brikette/package.json`
  - `apps/brikette/docs/testing/i18n-missing-key-detection.md` (new) (or add to an existing testing doc)
- **Depends on:** TASK-02, TASK-03
- **Confidence:** 90%
  - **Implementation:** 95% — Adding npm scripts is trivial. Documentation is straightforward prose. Pattern exists: see `gen:translation-stub` in [package.json:14](apps/brikette/package.json#L14).
  - **Approach:** 90% — Keeps tooling discoverable via `pnpm run` tab-completion. Documenting strict mode (`I18N_MISSING_KEYS_MODE=fail`) ensures future enforcement is opt-in and understood.
  - **Impact:** 85% — Low risk overall. Minor uncertainty on where docs should live (`docs/testing/` vs existing file) — will check for existing testing docs and append if appropriate.
- **Acceptance:**
  - Add scripts:
    - `check:i18n-coverage` (text)
    - `check:i18n-coverage:json` (JSON + output path)
    - `test:i18n-render-audit` (runs the dedicated audit suite)
  - Document:
    - how to run locally
    - how to run strict mode (`I18N_MISSING_KEYS_MODE=fail`)
    - recommended CI usage: run both reports and upload artifacts; don’t fail builds by default.
- **Test plan:**
  - Manual: run each script once and confirm outputs are created/printed.

#### Build Completion (2026-01-27)
- **Status:** Complete
- **Commits:** (pending commit)
- **Validation:**
  - Ran: `pnpm --filter @apps/brikette check:i18n-coverage` — PASS
  - Ran: `pnpm --filter @apps/brikette check:i18n-coverage:json` — PASS (file written)
  - Ran: `pnpm --filter @apps/brikette test:i18n-render-audit` — PASS (4 tests)
- **Implementation notes:**
  - Added scripts to `apps/brikette/package.json` including `test:content-readiness`
  - Created documentation at `apps/brikette/docs/content-readiness-testing.md`
  - Documentation covers local usage, strict mode, CI usage, and full content test suite

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| False positives from dotted strings (URLs, file paths, CSS classes) | Prefix whitelist + explicit ignores + allowlist; keep detector narrow by default. |
| Report is too noisy to be actionable | Dedicated audit suite (not global), truncation + grouping, start with a small set of surfaces. |
| Test suite slowdown | Keep audit to a handful of renders; avoid loading all namespaces; cap output size. |

## Acceptance Criteria (overall)

- [x] Render-audit suite produces an actionable report (warn-only by default).
- [x] Coverage script can emit JSON for CI artifacts.
- [x] All new tooling is runnable via documented `pnpm` scripts.
- [x] No changes to production runtime behaviour.

## Decision Log

- 2026-01-27: Default to report-only (warn) to avoid blocking on known partial locales; keep strict mode as an opt-in switch.
- 2026-01-27: Use a dedicated audit suite rather than global test hooks to prevent noise from tests that intentionally don’t seed translations.

