---
Type: Build Record
Plan: docs/plans/bos-standing-data-domain-container-split/plan.md
Feature-Slug: bos-standing-data-domain-container-split
Status: Complete
Build-Date: 2026-03-03
---

# Build Record: BOS Standing Data Domain Container Split

## What Was Built

Reorganised `docs/business-os/strategy/` from a flat file bucket into 5 domain containers (`assessment/`, `product/`, `marketing/`, `sales/`, `legal/`) across 6 active businesses (BRIK, HBAG, HEAD, PET, PWRB, BOS).

### Deliverables

1. **Migration map** — `artifacts/migration-map.json`: 191 file entries classifying every strategy artifact by domain
2. **File migration** — 191 `git mv` operations moving files to domain containers; empty source directories removed
3. **Code fixes** — s6b-gates.ts (assessment/ subdir search with root fallback), contract-lint.ts (optional container segment in canonical path), authorize.ts (2-level deep regex for container access)
4. **Path updates** — naming CLIs (HEAD/assessment/ paths), registry.json (117 substitutions), standing-registry.json (10 substitutions), brik-weekly-kpi-reminder.yml, lp-seo skill modules (6 files → marketing/seo/)
5. **Test updates** — contract-lint.test.ts (new assessment/ container test case), lp-do-ideas-trial.test.ts (5 fixture path substitutions)

### Tasks Completed

| Task | Status | Evidence |
|---|---|---|
| TASK-01 | Complete | migration-map.json: 191 entries, TC-01-01 through TC-01-07 all PASS |
| CP-01 | Complete | Map verified, 0 duplicates, downstream tasks re-scored >= 80% |
| TASK-02 | Complete | 191/191 files at target paths, 0 stale, BRIK/data/ unchanged |
| TASK-03 | Complete | s6b-gates: assessment/ first + root fallback; contract-lint: optional container regex |
| TASK-04 | Complete | authorize.ts: 2-level regex added; naming CLIs: paths updated |
| TASK-05 | Complete | registry.json: 889 entries preserved, 117 subs; standing-registry: 15 entries, 10 subs |
| TASK-06 | Complete | 2 test files updated, 6 substitutions total; pack/root paths unchanged |
| TASK-07 | Complete | Workflow + 6 SEO skill files updated; typecheck clean on scripts + business-os |

### Scope Deviations

- BRIK/apps/reception/ files moved to `BRIK/product/reception/` (not flat `BRIK/product/`) to avoid filename collision with root-level worldclass files
- Total file count 191 vs plan estimate of ~210: `products-aggregate-pack.user.md` excluded per TC-01-04 glob match; initial estimate was rough

### Tests

- TypeScript: `pnpm --filter scripts exec tsc --noEmit` — 0 errors
- TypeScript: `pnpm --filter business-os exec tsc --noEmit` — 0 errors
- CI: pending (push to dev after post-build artifacts committed)

## Outcome Contract

- **Why:** `docs/business-os/strategy/` mixes assessment artifacts, product specs, marketing signals, and sales forecasts in one undifferentiated bucket. As more businesses and processes are added this structure will become unnavigable. Domain containers give each process a clear home, make CASS retrieval more precise, and enforce the `.user.md` + `.user.html` endpoint convention.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `docs/business-os/strategy/<BIZ>/` reorganised into 5 domain containers for all active businesses; all existing content migrated; CASS roots and registries updated to new paths; CI passes.
- **Source:** operator
