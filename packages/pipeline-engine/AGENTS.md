# pipeline-engine — Agent Notes

## Purpose
Stage-K and sensitivity computations used by `@apps/product-pipeline` for
pricing/margin pipeline analysis.

## Operational Constraints
- Functions must remain deterministic and side-effect free.
- Input/output contracts (`StageKInput`, `StageKResult`, sensitivities) are
  consumed by runtime APIs; avoid breaking changes.
- Keep money helpers and rounding behavior stable.

## Commands
- Build: `pnpm --filter @acme/pipeline-engine build`
- Test: `pnpm --filter @acme/pipeline-engine test`

## Safe Change Checklist
- Update types and exports in `src/index.ts` when adding modules.
- Run a scoped product-pipeline test or smoke check after changes.
