---
Type: Plan-Artifact
Status: Draft
Domain: Infra
Feature-Slug: cms-webpack-build-oom
Task-ID: TASK-01
Created: 2026-02-23
Last-updated: 2026-02-23
Relates-to: docs/plans/_archive/cms-webpack-build-oom/plan.md
---

# CMS Webpack OOM Profiling Baseline (TASK-01)

## Scope
Capture a reproducible baseline for `@apps/cms` webpack build memory failures across the task's required probe matrix:
- `default`
- `8GB heap`
- `8GB heap + NEXT_BUILD_CPUS=1`

This artifact records machine metadata, raw logs, run timings, and failure signatures for TASK-04 planning validation.

## Machine Class Metadata
- Captured at (UTC): `2026-02-23T13:53:47Z`
- Host OS: `macOS 14.5 (23F79)`
- Kernel: `Darwin 23.5.0`
- CPU: `Apple M1 Pro` (`10` cores)
- RAM: `17179869184` bytes (`16 GiB`)
- Node: `v20.19.4`
- pnpm: `10.12.1`

## Probe Commands
1. `pnpm --filter @apps/cms build`
2. `NODE_OPTIONS=--max-old-space-size=8192 pnpm --filter @apps/cms build`
3. `NEXT_BUILD_CPUS=1 NODE_OPTIONS=--max-old-space-size=8192 pnpm --filter @apps/cms build`

## Raw Artifact Paths
- Summary TSV: `docs/plans/_archive/cms-webpack-build-oom/artifacts/raw/2026-02-23-task-01-r4/run-summary.tsv`
- Default log: `docs/plans/_archive/cms-webpack-build-oom/artifacts/raw/2026-02-23-task-01-r4/default.log`
- 8GB log: `docs/plans/_archive/cms-webpack-build-oom/artifacts/raw/2026-02-23-task-01-r4/heap8.log`
- 8GB + cpus=1 log: `docs/plans/_archive/cms-webpack-build-oom/artifacts/raw/2026-02-23-task-01-r4/heap8_cpus1.log`
- Partial/aborted prior run (superseded): `docs/plans/_archive/cms-webpack-build-oom/artifacts/raw/2026-02-23-task-01/`

## Run Summary
| Variant | Start (UTC) | End (UTC) | Duration (s) | Exit code | Failure signature | `/usr/bin/time` real (s) | Max RSS (bytes) |
|---|---|---|---:|---:|---|---:|---:|
| default | 2026-02-23T13:24:32Z | 2026-02-23T13:32:17Z | 465 | 134 | `FATAL ERROR: Reached heap limit` + `SIGABRT` | 465.17 | 4418158592 |
| heap8 | 2026-02-23T13:32:37Z | 2026-02-23T13:40:32Z | 475 | 134 | `FATAL ERROR: Reached heap limit` + `SIGABRT` | 475.24 | 4650057728 |
| heap8_cpus1 | 2026-02-23T13:40:46Z | 2026-02-23T13:53:34Z | 768 | 134 | `FATAL ERROR: Reached heap limit` + `SIGABRT` | 768.62 | 4461887488 |

## Failure Signature Evidence
All three variants include both:
- `FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory`
- `Command failed with signal "SIGABRT"`

Variant-specific evidence pointers:
- default: `docs/plans/_archive/cms-webpack-build-oom/artifacts/raw/2026-02-23-task-01-r4/default.log`
- heap8: `docs/plans/_archive/cms-webpack-build-oom/artifacts/raw/2026-02-23-task-01-r4/heap8.log`
- heap8_cpus1: `docs/plans/_archive/cms-webpack-build-oom/artifacts/raw/2026-02-23-task-01-r4/heap8_cpus1.log`

## Profiling Output Pointers
- Available profiler-equivalent outputs:
  - V8 GC tail + native OOM stacktrace in each variant log.
  - `/usr/bin/time -lp` process metrics (`real/user/sys`, max RSS) in each variant log.
- Not captured in this baseline:
  - Node heap snapshots / heap profile files.
- Reason not captured:
  - This baseline preserved strict command comparability with the required probe matrix (no additional Node profiler flags injected).

## Findings for TASK-04 Input
1. Reproducibility is confirmed on this machine class: all required variants fail with the same OOM signature.
2. Heap increase to 8GB did not change pass/fail outcome.
3. Reducing build workers to `NEXT_BUILD_CPUS=1` increased wall-clock time substantially (768s vs ~470s) without preventing OOM.
4. Remaining uncertainty is root-cause attribution within the compilation graph; this baseline is sufficient for mitigation-slice design but not for dominant-contributor attribution.

## TASK-04 Mitigation Probe (Dist-Alias Slice)
### Slice Applied
- `apps/cms/next.config.mjs`: for webpack production builds only (`!dev`), alias `@acme/lib` and `@acme/configurator` to package `dist/` outputs instead of `src/`.
- Dev-mode source aliases remain unchanged to preserve HMR/editor behavior.

### Raw Artifact Paths (TASK-04)
- Summary TSV: `docs/plans/_archive/cms-webpack-build-oom/artifacts/raw/2026-02-23-task-04-r1/run-summary.tsv`
- Default log: `docs/plans/_archive/cms-webpack-build-oom/artifacts/raw/2026-02-23-task-04-r1/default.log`
- 8GB log: `docs/plans/_archive/cms-webpack-build-oom/artifacts/raw/2026-02-23-task-04-r1/heap8.log`
- 8GB + cpus=1 log: `docs/plans/_archive/cms-webpack-build-oom/artifacts/raw/2026-02-23-task-04-r1/heap8_cpus1.log`

### TASK-04 Run Summary
| Variant | Start (UTC) | End (UTC) | Duration (s) | Exit code | Failure signature | `/usr/bin/time` real (s) | Max RSS (bytes) |
|---|---|---|---:|---:|---|---:|---:|
| default | 2026-02-23T14:16:43Z | 2026-02-23T14:24:04Z | 441 | 134 | `FATAL ERROR: Reached heap limit` + `SIGABRT` | 441.32 | 3909894144 |
| heap8 | 2026-02-23T14:24:04Z | 2026-02-23T14:33:22Z | 558 | 134 | `FATAL ERROR: Reached heap limit` + `SIGABRT` | 557.46 | 4434542592 |
| heap8_cpus1 | 2026-02-23T14:33:22Z | 2026-02-23T14:40:33Z | 431 | 134 | `FATAL ERROR: Reached heap limit` + `SIGABRT` | 431.15 | 4654759936 |

### Before/After Delta vs TASK-01 Baseline
| Variant | Duration delta (s) | Max RSS delta (bytes) | Pass/fail delta |
|---|---:|---:|---|
| default | -24 | -508264448 | unchanged (`exit 134`, OOM) |
| heap8 | +83 | -215515136 | unchanged (`exit 134`, OOM) |
| heap8_cpus1 | -337 | +192872448 | unchanged (`exit 134`, OOM) |

### Targeted Config-Dependent Validation
- `pnpm --filter @apps/cms lint -- next.config.mjs` -> pass (warnings only; no new errors).
- `pnpm --filter @apps/cms exec jest --ci --runInBand --detectOpenHandles --passWithNoTests --config ./jest.config.cjs "apps/cms/src/app/cms/shop/\\[shop\\]/settings/__tests__/useShopEditorForm.test.ts"` -> pass.
- `pnpm --filter @apps/cms test -- src/lib/__tests__/listShops.test.ts` -> pass.
- `pnpm --filter @apps/cms typecheck` -> fails with existing TS6305 on `packages/theme/dist/index.d.ts` mapping; no new alias-resolution errors were observed in targeted TASK-04 checks.

### Findings After TASK-04 Slice
1. The mitigation changed runtime characteristics but did not clear the OOM blocker: all three required variants still fail with `SIGABRT`.
2. `default` and `8GB+cpus=1` became materially faster than baseline, while `8GB` became slower.
3. Peak RSS dropped for `default` and `8GB`, but increased for `8GB+cpus=1`; memory pressure remains in the same failure class.
4. TASK-05 checkpoint remains required to decide whether to iterate another graph-reduction slice or shift to environment/class strategy under Option A hard-blocker policy.
