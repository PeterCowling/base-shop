# loadPlugins Benchmark Baseline

This benchmark populates a large number of dummy plugin directories and measures the runtime and I/O behavior of `loadPlugins`.

- Command: `pnpm benchmark:loadPlugins`
- Plugin directories created: 1000 (plus existing workspace plugins)
- Result: `Loaded 1003 plugins in 2677.73 ms`
- I/O operations (`async_hooks` FS events): `{ "FSREQPROMISE": 4015 }`

Runtime exceeded the 500 ms threshold, suggesting that parallelized directory reads may be necessary for larger plugin sets.
