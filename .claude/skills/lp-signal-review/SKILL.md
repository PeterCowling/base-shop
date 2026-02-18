---
name: lp-signal-review
description: Weekly signal strengthening review for startup loop runs. Audits a run against ten structural signal-strengthening principles, scores each on Severity × Support axes, identifies top findings, and emits a Signal Review artifact with ranked Finding Briefs for operator promotion.
---

# Signal Review Orchestrator

`/lp-signal-review` is the audit and emission layer for weekly startup loop signal strengthening.

This skill does three things:
1. Load run artifacts and principle definitions
2. Score all ten principles via `modules/audit-phase.md`
3. Emit ranked Finding Briefs and Signal Review artifact via `modules/emit-phase.md`

Keep this file thin. Do not embed principle definitions, scoring rubrics, or finding templates here.

## Invocation

```
/lp-signal-review --biz <BIZ> --run-root <path> [--as-of-date <YYYY-MM-DD>] [--max-findings <N>] [--self-audit-mode <off|track-only>]
```

### Parameters

| Parameter | Required | Default | Notes |
|---|---|---|---|
| `--biz` | Required | — | Business identifier (e.g., `BRIK`, `PET`). Must match a directory under `docs/business-os/strategy/`. |
| `--run-root` | Required | — | Path to the business strategy root directory (e.g., `docs/business-os/strategy/BRIK/`). All stage artifacts resolved relative to this. In standard S10 dispatch, this is deterministically `docs/business-os/strategy/<BIZ>/`. |
| `--as-of-date` | Optional | Today (YYYY-MM-DD) | Date used for artifact naming and ISO week computation. |
| `--max-findings` | Optional | 3 | Hard cap on Finding Briefs emitted per run. |
| `--self-audit-mode` | Optional | `off` (runs 1–3); `track-only` (run 4+) | `off` = no prior-finding check. `track-only` = emit Unresolved Prior Findings section. `enforce` deferred to v2. |

## Global Invariants

### Operating mode

**AUDIT + EMIT**

### Allowed actions

- Read stage artifacts and prior Signal Review artifacts (read-only).
- Read `.claude/skills/_shared/signal-principles.md` for principle definitions.
- Read `.claude/skills/_shared/evidence-ladder.md` for Support scale calibration.
- Write one Signal Review artifact per run.

### Prohibited actions

- Auto-spawning `/lp-fact-find` calls. Finding Briefs are stubs within the Signal Review; operator promotes manually.
- Creating any files other than the Signal Review artifact.
- Code changes, plan edits, BOS API writes (v1).
- Destructive shell or git commands.

## Inputs

| Input | Source | Notes |
|---|---|---|
| Stage artifacts (S1–S9B) | `run_root` directory | Discovered by stage ID and known path conventions; see `modules/audit-phase.md` for the canonical list |
| Signal principles | `.claude/skills/_shared/signal-principles.md` | Must exist; fail-closed if missing |
| Prior Signal Reviews | `docs/business-os/strategy/<BIZ>/signal-review-*.md` | Read when `self_audit_mode: track-only`; skip when `off` |

## Module Routing

Execute phases in sequence:

1. **`modules/audit-phase.md`** — load stage artifacts; score all ten principles; produce scored principles table
2. **`modules/emit-phase.md`** — dedup; apply novelty gate and cap; emit Signal Review artifact with Finding Briefs

## Self-Check Gate

Before emitting the Signal Review artifact, confirm that the Principle Scores section contains an entry for every principle ID in `signal-principles.md` (P01 through P10). If any principle ID is absent, the skill must fail-closed with:

```
Error: Self-check failed — principle(s) <list> not present in Principle Scores table.
Signal Review not emitted. Check audit-phase output for silent skips.
```

This gate is the primary mechanism for detecting silent principle skips.

## Exit Conditions

| Condition | Description | Signal Review emitted? |
|---|---|---|
| `success-with-findings` | All ten principles scored; 1–max_findings Finding Briefs emitted above threshold | Yes |
| `success-no-findings` | All ten principles scored; all below finding threshold or suppressed by dedup/novelty gate | Yes (Skipped Findings section populated) |
| `partial-success` | `run_root` exists and ≥1 stage artifact found; some artifacts missing; audit degraded for those stages; P09 finding emitted for missing artifacts | Yes (with degraded scores noted) |
| `fail-closed` | `run_root` does not exist, OR `signal-principles.md` is missing/unparseable, OR self-check gate fails | No |

## Output

**Signal Review artifact**: `docs/business-os/strategy/<BIZ>/signal-review-<YYYYMMDD>-<HHMM>-W<ISOweek>.md`

One per run. HHMM timestamp prevents same-day collision on retries. ISO week provides weekly grouping.

See `modules/emit-phase.md` for the required sections of the Signal Review artifact.

## Versioning

Principle definitions are versioned in `.claude/skills/_shared/signal-principles.md`. The Signal Review artifact frontmatter records `principles_version` from that file. If the principles file version changes between runs, note it in the Signal Review header.
