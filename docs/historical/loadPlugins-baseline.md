Type: Research
Status: Historical
Domain: Platform
Last-reviewed: 2025-12-02

# loadPlugins Benchmark Baseline

This benchmark populates a large number of dummy plugin directories and measures the runtime and I/O behavior of `loadPlugins`.

How to use this doc now:

- Treat these numbers as a **historical baseline** for `loadPlugins` performance.
- For current plugin loading behaviour, prefer the plugin and performance docs (`docs/plugins.md`, `docs/performance-budgets.md`) and the actual implementation in `packages/platform-core/src/plugins.ts`.

- Command: `pnpm benchmark:loadPlugins`
- Plugin directories created: 1000 (plus existing workspace plugins)
- Result: `Loaded 1003 plugins in 2677.73 ms`
- I/O operations (`async_hooks` FS events): `{ "FSREQPROMISE": 4015 }`

Runtime exceeded the 500 ms threshold, suggesting that parallelized directory reads may be necessary for larger plugin sets.
