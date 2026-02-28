---
Type: Boundary-Decision
Task: TASK-01
Plan: docs/plans/lp-do-ideas-live-autonomous-activation/plan.md
Created: 2026-02-25
Status: Complete
---

# Live Hook Boundary Decision

## Decision

**Selected boundary**: `scripts/src/startup-loop/lp-do-ideas-live-hook.ts` — a
standalone CLI module invoked by the `/lp-weekly` skill as an advisory side-step
during the SIGNALS weekly cycle.

---

## Evidence: SIGNALS Stage Architecture

SIGNALS (formerly S10) is defined in `docs/business-os/startup-loop/loop-spec.yaml`
(v3.12.0) as the "Weekly readout + experiments" stage:

```yaml
- id: SIGNALS
  name: Weekly readout + experiments
  skill: /lp-experiment
  prompt_required: true
```

- **Skill**: `/lp-experiment` (agent-operated)
- **Orchestrator**: `/lp-weekly` skill wraps the full weekly sequence
- **DAG position**: `[S9B, SIGNALS]` — comes after S9B (launch QA)
- **Not a TypeScript program**: the SIGNALS weekly cycle is orchestrated by Claude
  agents invoking skills, not by a Node.js dispatch script

**Key distinction** — SIGNALS-01 vs SIGNALS:
- `SIGNALS-01` = Forecast (skill `/lp-forecast`, part of SELL container)
- `SIGNALS` = Weekly readout + experiments (skill `/lp-experiment`, standalone weekly stage)

The `lp-do-ideas-go-live-seam.md` references "SIGNALS weekly cycle" to mean the
`SIGNALS` stage operated by `/lp-weekly`.

---

## Evidence: Candidate Boundaries Scanned

### Candidate A: `apps/prime/src/lib/owner/`

Files found:
- `apps/prime/src/lib/owner/kpiReader.ts`
- `apps/prime/src/lib/owner/kpiWriter.ts`
- `apps/prime/src/lib/owner/businessScorecard.ts`
- `apps/prime/src/lib/owner/kpiAggregator.ts`

**Findings**: No SIGNALS dispatch logic. These are KPI read/write helpers for the
Prime app's owner dashboard. No weekly cycle trigger path exists here.

**Verdict**: Rejected — no relevant integration seam; cross-app boundary change
would expand scope without benefit.

### Candidate B: `scripts/src/startup-loop/s10-diagnosis-integration.ts`

This module orchestrates the S10 diagnosis pipeline (bottleneck snapshot,
history ledger, replan trigger, growth accounting). It is invoked after SIGNALS
stage completion, is non-blocking, and has a plugin-step pattern.

**Findings**: Conceptually incorrect coupling. The ideas hook is an intake trigger
for standing-artifact delta processing, not a diagnosis/bottleneck detection step.
Adding it here would:
1. Mix concerns (diagnosis ≠ ideas intake)
2. Complicate rollback (disabling ideas hook would require editing diagnosis code)
3. Risk breaking existing BL-07 test coverage

**Verdict**: Rejected — coupling risk; ideas intake is a separate concern from
diagnosis pipeline.

### Candidate C: `scripts/src/startup-loop/lp-do-ideas-live-hook.ts` (standalone CLI)

Pattern precedent: `lp-do-ideas-trial.ts` has a standalone CLI entry point invoked
via `scripts/package.json` as `startup-loop:lp-do-ideas-trial`. The diagnosis
pipeline follows a similar non-blocking invocation pattern.

The `/lp-weekly` skill can call this as an advisory step:
```bash
pnpm --filter scripts startup-loop:lp-do-ideas-live -- --business <BIZ> ...
```

**Findings**:
- No cross-app changes required
- Full control over advisory-only behavior
- Independent rollback (disable npm script entry)
- Same invocation pattern as trial CLI and diagnosis pipeline
- Non-blocking enforced at the hook caller level in `/lp-weekly`

**Verdict**: Selected — cleanest boundary, lowest scope risk, independent rollback.

---

## Invocation Contract

### Required Inputs

| Parameter | Type | Description |
|---|---|---|
| `--business <BIZ>` | string | Target business identifier (e.g. `BRIK`, `HEAD`) |
| `--registry-path <path>` | string | Path to `live/standing-registry.json` |
| `--queue-state-path <path>` | string | Path to `live/queue-state.json` |
| `--telemetry-path <path>` | string | Path to `live/telemetry.jsonl` |

### Optional Inputs

| Parameter | Default | Description |
|---|---|---|
| `--phase P0\|P1\|P2\|P3` | `P0` | Cutover phase for routing behavior |
| `--dry-run` | false | Compute dispatch candidates but skip file writes |

### Error Handling

- Hook script exits with code `0` in all non-argument-error cases (advisory)
- Errors are logged to `stderr` as `[lp-do-ideas-live-hook] WARN: <message>`
- Partial write failures must be logged but must not leave corrupted artifacts
- Caller (`/lp-weekly`) wraps invocation in try-catch so any thrown error
  degrades to a warning and does not block SIGNALS advance

### Non-Blocking Guarantee

The invocation contract guarantees advisory-only behavior:
1. Hook never writes startup-loop stage status
2. Hook never calls `/startup-loop advance`
3. Hook failure (non-zero exit or exception) must not propagate to SIGNALS advance gate
4. Enforcement is at two layers: hook CLI design (always exits 0 on runtime error) +
   caller `/lp-weekly` skill wraps in error-tolerant try-catch

---

## No Stage Mutation Contract

The live hook must satisfy the following at the code level (enforced in TASK-03 tests):

| Must NOT happen | Enforcement |
|---|---|
| Write to any `stage_completions` or `status` field in baseline.manifest.json | No import of `manifest-update.ts` |
| Call `replan-trigger.ts` | Not imported |
| Emit stage-result.json | Not a stage module |
| Invoke `/startup-loop advance` | No shell exec / child_process |
| Modify loop-spec.yaml | No write to that path |

---

## Integration Location in `/lp-weekly` Skill

The hook attaches after the SIGNALS standing-artifact snapshot is collected, before
the weekly summary is written. Conceptually:

```
/lp-weekly --biz <BIZ>
  → weekly KPI snapshot
  → standing-artifact SHA computation
  → [NEW] invoke lp-do-ideas-live-hook (advisory, non-blocking)
  → SIGNALS weekly summary / experiment dispatch
```

The exact call-site addition is documented in the go-live seam (§2.1). No change
to `cmd-advance.md` is required or permitted in v1 live mode.

---

## Downstream Task Dependencies Resolved

| Task | Dependency resolved by this decision |
|---|---|
| TASK-02 | Confirmed: create `lp-do-ideas-live.ts` + update routing adapter mode guard |
| TASK-03 | Confirmed: hook file = `lp-do-ideas-live-hook.ts`; integration boundary = `/lp-weekly` advisory step in `scripts/src/startup-loop/` |
| TASK-04 | Confirmed: CLI command `startup-loop:lp-do-ideas-live` in `scripts/package.json` |

---

## Call-Site Map (for TASK-02/03 implementation)

| File | Current state | Change required |
|---|---|---|
| `scripts/src/startup-loop/lp-do-ideas-trial.ts` | `mode !== "trial"` → reject | Create parallel `lp-do-ideas-live.ts` module (preferred pattern from seam doc §2.2) |
| `scripts/src/startup-loop/lp-do-ideas-routing-adapter.ts` | `mode !== "trial"` → reject | Update guard: accept `"trial" \| "live"` |
| `scripts/src/startup-loop/lp-do-ideas-live-hook.ts` | Does not exist | Create — standalone CLI, advisory invocation |
| `scripts/package.json` | No ideas live command | Add `startup-loop:lp-do-ideas-live` entry |
| `.claude/skills/lp-weekly/` | No ideas hook call | Add advisory call-site in weekly orchestration |

---

## Validation Evidence

- `rg SIGNALS apps/prime/src/lib/owner/` → 0 matches (confirmed no SIGNALS dispatch there)
- `rg SIGNALS scripts/src/startup-loop/*.ts` → matches only in test stubs and stage-id-compat (no live hook wiring)
- `cat scripts/package.json` → no `lp-do-ideas-live` or `lp-do-ideas-*` operational command
- `loop-spec.yaml` SIGNALS stage block confirmed: `skill: /lp-experiment`, agent-operated, not a TypeScript script
- `apps/prime/src/lib/owner/` files: kpiReader, kpiWriter, businessScorecard, kpiAggregator — no SIGNALS dispatch
- `s10-diagnosis-integration.ts` confirmed as a separate concern (bottleneck/replan, not ideas intake)
