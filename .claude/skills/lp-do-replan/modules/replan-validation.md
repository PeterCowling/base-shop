# Replan Module: Validation Contract Repair

Use when IMPLEMENT tasks are missing/incomplete TC/VC contracts.

## Goal

Ensure every IMPLEMENT task has a complete, track-appropriate validation contract.

## Contract Source

- `../../_shared/validation-contracts.md`

## Required Actions

1. Map every acceptance criterion to at least one TC/VC.
2. Ensure metadata completeness:
- code/mixed: test type, location, run command
- business/mixed: validation type, evidence location, verification procedure
3. Enforce effort-based minimums.
4. For business/mixed, enforce fail-first evidence gating/caps.

## If Evidence Missing

If required evidence cannot be produced in replan mode, create precursor tasks and keep IMPLEMENT task below promotion threshold.
