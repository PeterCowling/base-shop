---
name: lp-do-worldclass
description: World-class benchmark skill for startup loop. Validates a business goal artifact, generates or refreshes a deep-research prompt, and (when a benchmark result is present) scans business strategy artifacts against world-class standards and emits improvement ideas to queue-state.json.
---

# World-Class Benchmark Orchestrator

`/lp-do-worldclass` is the goal-validation, benchmarking, and ideas-emission layer for startup loop world-class analysis.

This skill does three things:
1. Validate the operator-authored goal artifact at `docs/business-os/strategy/<BIZ>/worldclass-goal.md` and generate or refresh a deep-research prompt
2. When a benchmark result exists and is current, scan strategy artifacts against world-class standards via `modules/scan-phase.md`
3. Emit improvement ideas to queue-state.json via `modules/ideas-phase.md`

Keep this file thin. Do not embed scan rules, benchmark rubrics, or ideas templates here.

## Invocation

```
/lp-do-worldclass --biz <BIZ> [--as-of-date <YYYY-MM-DD>] [--dry-run]
```

### Parameters

| Parameter | Required | Default | Notes |
|---|---|---|---|
| `--biz` | Required | — | Business identifier (e.g. `BRIK`, `PWRB`). Must match a directory under `docs/business-os/strategy/`. |
| `--as-of-date` | Optional | Today (YYYY-MM-DD) | Date used for artifact naming and staleness calculation. |
| `--dry-run` | Optional | — | When present: scan runs and scan output is written, but all queue-state.json writes are skipped. Safe mode for verifying scan behavior. |

## Global Invariants

### Operating mode

**SCAN + BENCHMARK**

### Allowed actions

- Read strategy artifact files, frontmatter, and goal/benchmark artifacts (read-only scan)
- Read `docs/business-os/strategy/<BIZ>/worldclass-goal.md` and `worldclass-benchmark.md`
- Write research prompt to `docs/business-os/strategy/<BIZ>/worldclass-research-prompt.md`
- Write scan output to `docs/business-os/strategy/<BIZ>/worldclass-scan-<YYYY-MM-DD>.md`
- Write dispatch packets to `docs/business-os/startup-loop/ideas/trial/queue-state.json` (with writer lock only; see constraint below)
- Run `scripts/agents/with-writer-lock.sh` to acquire writer lock before any queue writes

### Prohibited actions

- Code changes, refactors, or production data modifications
- Destructive shell or git commands
- Writing to queue-state.json without first acquiring writer lock via `scripts/agents/with-writer-lock.sh`
- Running scan-phase or ideas-phase in any state other than State 3
- Skipping the dry-run flag when the operator passes it — must respect `--dry-run` and never write to queue-state.json in dry-run mode

## State Machine

The skill auto-routes to one of four states based on file presence and version alignment. Evaluate states in order; take the first match.

| State | Condition | Action | Outcome |
|---|---|---|---|
| **1** | `worldclass-goal.md` does not exist | Stop immediately | Emit guidance (see State 1 below) |
| **2** | Goal exists; `worldclass-benchmark.md` does not exist | Run goal-phase only | Stop; instruct operator (see State 2 below) |
| **3** | Goal + benchmark both exist AND `benchmark.goal_version == goal.goal_version` | Run goal-phase → scan-phase → ideas-phase | Emit summary |
| **4** | Goal + benchmark both exist AND `benchmark.goal_version != goal.goal_version` | Stop immediately | Instruct operator to rerun research (see State 4 below) |

### State 1 — No goal artifact

Stop with:

```
No world-class goal found for <BIZ>.
Expected path: docs/business-os/strategy/<BIZ>/worldclass-goal.md
Create a goal artifact from the template at docs/plans/lp-do-worldclass/worldclass-goal.template.md before running lp-do-worldclass.
```

### State 2 — Goal exists; no benchmark

Run goal-phase (validate goal artifact and generate research prompt). Then stop with:

```
Research prompt written to: docs/business-os/strategy/<BIZ>/worldclass-research-prompt.md

Next step: run the prompt in your deep-research tool of choice and paste the result as:
  docs/business-os/strategy/<BIZ>/worldclass-benchmark.md

Ensure the benchmark frontmatter includes:
  goal_version: <value from worldclass-goal.md>

Then re-run /lp-do-worldclass --biz <BIZ> to continue.
```

### State 3 — Goal + current benchmark

Run all three phases in sequence: goal-phase → scan-phase → ideas-phase. Emit a summary to the operator on completion.

### State 4 — Benchmark stale

Stop with:

```
Benchmark is out of date for <BIZ>.
  goal_version in goal:      <goal.goal_version>
  goal_version in benchmark: <benchmark.goal_version>

The goal has changed since the benchmark was gathered. Rerun deep research using the refreshed prompt at:
  docs/business-os/strategy/<BIZ>/worldclass-research-prompt.md

Paste the updated result as docs/business-os/strategy/<BIZ>/worldclass-benchmark.md (replacing the existing file),
ensure frontmatter goal_version matches <goal.goal_version>, then re-run /lp-do-worldclass --biz <BIZ>.
```

## Module Routing

Execute phases in the order shown. Only run scan-phase and ideas-phase in State 3.

1. **Preflight** — validate `--biz` and strategy directory; fail-closed if not (see Preflight Gate below)
2. **State routing** — determine current state from file presence and version alignment (see State Machine above)
3. **`modules/goal-phase.md`** — validate goal artifact structure; generate or refresh the deep-research prompt; write `worldclass-research-prompt.md` *(runs in States 2, 3)*
4. **`modules/scan-phase.md`** — read benchmark; scan strategy artifacts; compare against world-class standards; produce gap table *(runs in State 3 only)*
5. **`modules/ideas-phase.md`** — derive improvement ideas from scan gaps; emit dispatches to queue-state.json (skipped entirely on `--dry-run`) *(runs in State 3 only)*

## Preflight Gate

If `--biz` argument is missing, stop immediately with:

```
Error: --biz is required.
Usage: /lp-do-worldclass --biz <BIZ> [--as-of-date <YYYY-MM-DD>] [--dry-run]
```

If no matching strategy directory exists under `docs/business-os/strategy/<BIZ>/`, stop immediately with:

```
Error: No strategy directory found for business <BIZ>.
Expected path: docs/business-os/strategy/<BIZ>/
Run from repo root and verify the business identifier is correct.
```

## Inputs

| Input | Source | Notes |
|---|---|---|
| Goal artifact | `docs/business-os/strategy/<BIZ>/worldclass-goal.md` | Required in States 2–4; preflight (state routing) fails to State 1 if missing |
| Benchmark artifact | `docs/business-os/strategy/<BIZ>/worldclass-benchmark.md` | Required in States 3–4; absence routes to State 2 |
| Strategy directory | `docs/business-os/strategy/<BIZ>/` | Scanned by scan-phase in State 3 |
| Queue state | `docs/business-os/startup-loop/ideas/trial/queue-state.json` | Written (appended) by ideas-phase; never overwritten; skipped on `--dry-run` |

## Output Paths

- **Research prompt**: `docs/business-os/strategy/<BIZ>/worldclass-research-prompt.md` — written by goal-phase (States 2 and 3)
- **Scan output**: `docs/business-os/strategy/<BIZ>/worldclass-scan-<YYYY-MM-DD>.md` — written by scan-phase (State 3 only; written on both live and dry-run)
- **Queue dispatches**: `docs/business-os/startup-loop/ideas/trial/queue-state.json` — appended by ideas-phase (State 3 live runs only; skipped on `--dry-run`)
