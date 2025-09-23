# Test Coverage — Jest, Cypress CT, Cypress E2E

This repo generates a single, unified coverage report that combines:

- Jest unit/integration coverage (Node + JSDOM)
- Cypress Component Testing coverage (Vite + React)
- Cypress E2E coverage for both client and server routes

## Outputs

- Raw NYC JSON: `.nyc_output/*.json` (Cypress)
- Jest JSON + lcov: `coverage/` (per package/app)
- Merged report: `coverage/merged/coverage.json`
- Final HTML + text summary: `coverage/index.html`

## Commands

1) Run Jest with coverage (workspace‑wide)

```bash
pnpm test:coverage
```

2) Run Cypress CT with coverage (already instrumented via Vite)

```bash
pnpm ct   # headless
# or
pnpm ct:open
```

3) Run Cypress E2E with client+server coverage enabled

```bash
pnpm e2e:coverage
```

- Client coverage is collected by instrumenting Next’s client bundles when `COVERAGE=1`.
- Server coverage is exposed via `GET /api/__coverage__` (only when `COVERAGE=1`) and automatically pulled at the end of the Cypress run.

4) Merge all coverage and generate HTML

```bash
pnpm coverage:merge
```

Open `coverage/index.html` in your browser for a navigable report.

## Notes

- E2E coverage is opt‑in to avoid overhead in normal runs. Use `pnpm e2e` for speed; use `pnpm e2e:coverage` when you need instrumentation.
- If you add another Next app to E2E coverage, add its own `/api/__coverage__` endpoint and extend the Cypress collection step to fetch it before merging.
- To focus on quick E2E checks for PRs, use `pnpm e2e:smoke`. For only Lighthouse budgets, run `pnpm e2e:lh`.

