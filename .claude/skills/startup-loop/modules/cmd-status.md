# cmd-status — `/startup-loop status`

## Inputs

- `--business <BIZ>` required

## Steps

1. Read latest stage artifacts for that business.
2. Re-evaluate gates and sync requirements for the current stage:
   - For stages S0–S2: apply Gate A / Gate B / Gate C (defined in `cmd-start.md`).
   - For advance-blocking gates (GATE-BD-00, GATE-BD-01, GATE-BD-03, GATE-BD-08, GATE-S6B-STRAT-01, GATE-S6B-ACT-01): see `cmd-advance.md` for gate definitions.
3. Return run packet with current stage/status.

## Gate Evaluation Note

`status` is a read-only operation — it reports current gating state without attempting to advance.
Re-evaluate the same gates that `advance` would check, but do not trigger any state changes or BOS sync actions.
