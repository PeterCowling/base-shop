---
Type: Critique-History
Feature-Slug: brik-date-range-picker
---

# Critique History — brik-date-range-picker

## Round 1

- **Date:** 2026-02-28
- **Artifact:** `docs/plans/brik-date-range-picker/fact-find.md`
- **codemoot score:** 7/10 → lp_score 3.5 (partially credible)
- **Verdict:** needs_revision
- **Critical:** 1 — `new Date("YYYY-MM-DD")` timezone-unsafe in disabled-day Matcher
- **Major:** 4 — baseline description (JS enforcement understated); E2E framework (Playwright not Cypress); popover contradiction (resolved + open); design-system DatePicker omitted from analysis
- **Minor:** 1 — react-day-picker in lockfile framing

**Fixes applied before Round 2:**
- Added `parseIsoToLocalDate` helper requirement to planning constraints, TASK-02, and Risks
- Corrected baseline description: JS enforcement via `ensureMinCheckoutForStay`/`normalizeCheckoutForStay` on 3 of 4 surfaces; `ApartmentBookContent` confirmed missing cap
- Changed E2E reference to Playwright (`apps/brikette/e2e/availability-smoke.spec.ts`)
- Reconciled popover question: consolidated into Open question with clear default (inline) and no contradiction
- Added design-system `DatePicker` analysis: wraps `react-datepicker`, no Range Mode, decision to not extend documented
- Updated react-day-picker status: already in lockfile as transitive dep v9.13.0; `pnpm add` promotes to direct dep

## Round 2

- **Date:** 2026-02-28
- **Artifact:** `docs/plans/brik-date-range-picker/fact-find.md`
- **codemoot score:** 8/10 → lp_score 4.0 (credible)
- **Verdict:** needs_revision (residual minor issues)
- **Critical:** 0
- **Major:** 1 — Simulation Trace still referenced `new Date(isoStr)` as "straightforward"
- **Minor:** 1 — `packages/ui` wording ambiguous re: DatePicker existence

**Fixes applied:**
- Simulation Trace row updated: `new Date(isoStr)` replaced with `parseIsoToLocalDate` (TASK-02) requirement
- Patterns section updated: "No shared range picker in packages/ui or packages/design-system"

## Final Status

- **Final lp_score:** 4.0 (credible)
- **Critical remaining:** 0
- **Gate:** PASS → `Status: Ready-for-planning`

---

## Plan critique rounds

### Plan Round 1

- **Date:** 2026-02-28
- **Artifact:** `docs/plans/brik-date-range-picker/plan.md`
- **codemoot score:** 7/10 → lp_score 3.5 (partially credible)
- **Critical:** 0 | **Major:** 5 | **Minor:** 1
- Key issues: "no shared component" inaccurate; TASK-01 depends-on inconsistency; parseIsoToLocalDate Invalid Date unchecked; locale list incomplete (17 not 6); Playwright acceptance overstated; isValidStayRange confusion in BookingWidget.

### Plan Round 2

- **Date:** 2026-02-28
- **Artifact:** `docs/plans/brik-date-range-picker/plan.md`
- **codemoot score:** 7/10 → lp_score 3.5 (partially credible)
- **Critical:** 0 | **Major:** 5 | **Minor:** 1
- Key issues: TASK-01 ISO vs DateRange API inconsistency; safeParseIso local duplication; URL clear semantics underspecified; roomQueryState in wrong task; test scope overstated; "7+" vs 17 locales.

### Plan Round 3 (final)

- **Date:** 2026-02-28
- **Artifact:** `docs/plans/brik-date-range-picker/plan.md`
- **codemoot score:** 8/10 → lp_score 4.0 (credible)
- **Critical:** 0 | **Major:** 2 | **Minor:** 1
- Key issues: safeParseIso missing from TASK-02 implementation plan; safeParseIso missing from TASK-08 validation contract.
- **Final verdict:** credible — `plan+auto` continues to build.
