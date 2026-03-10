---
Type: Build-Record
Status: Complete
Feature-Slug: reception-statistics-yoy-data-contract
Completed-date: 2026-03-09
artifact: build-record
---

# Build Record: Reception Statistics YoY Data Contract

## Outcome Contract

- **Why:** Year-on-year performance is the key management interest and must use current-year + archived prior-year data with clear source-of-truth rules.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Reception has a documented YoY metric contract that unambiguously defines source nodes, date semantics, and inclusion rules for current-year vs prior-year comparisons.
- **Source:** operator

## What Was Built

Extracted the implicit YoY contract into shared reception modules. Added `apps/reception/src/schemas/statisticsYoySchema.ts` as the canonical response/schema boundary for YoY reporting, including mode, monthly rows, summary, source labels, and explicit provenance/rule metadata. Added `apps/reception/src/lib/statistics/yoyContract.ts` to centralize source-path constants, UTC month/YTD semantics, revenue-mode inclusion rules, archive-fallback provenance, and deterministic aggregation helpers. Updated `apps/reception/src/app/api/statistics/yoy/route.ts` to consume the shared contract and validate its response payload against the schema before returning JSON. Updated `apps/reception/src/components/stats/Statistics.tsx` to consume the shared response type instead of maintaining its own local contract copy. Added focused deterministic coverage in `apps/reception/src/lib/statistics/__tests__/yoyContract.test.ts` and extended route coverage in `apps/reception/src/app/api/statistics/yoy/__tests__/route.test.ts` for provenance and archive-mirror fallback metadata.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter @apps/reception typecheck` | Pass | No type errors |
| `pnpm --filter @apps/reception lint` | Pass with warnings | Existing unrelated warnings only; no errors |

## Validation Evidence

- YoY response shape is now defined in one shared schema file
- Route and UI both consume the shared contract instead of duplicating response types or aggregation rules
- Contract explicitly publishes UTC date semantics, inclusion rules, source paths, and fallback metadata
- Route tests now assert dedicated-archive versus archive-mirror provenance behavior
- Deterministic helper tests now cover UTC month boundaries, inclusion rules, YTD windowing, and fallback metadata

## Scope Deviations

Did not introduce a broader analytics framework or change the operator-facing statistics layout. This build hardened the contract underneath the already-shipped YoY route and screen.
