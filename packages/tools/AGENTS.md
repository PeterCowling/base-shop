# tools — Agent Notes

## Purpose
CLI utilities used by repo workflows (e.g., GLB budget checks).

## Operational Constraints
- CLI entrypoint: `packages/tools/src/cli.ts`.
- `budgets:check` reads `budgets.json` under product data and exits non-zero
  on failures; keep output stable for CI parsing.
- Repo root is resolved as `../..` from the package directory; avoid changing
  without updating callers.

## Commands
- Build: `pnpm --filter @acme/tools build`
- Check budgets: `pnpm --filter @acme/tools budgets:check`

## Safe Change Checklist
- Preserve CLI flags: `--product`, `--productId`, `--tier`, `--strict`.
- Keep usage text in sync with CLI behavior.
- Run `budgets:check` after changing budget logic.
