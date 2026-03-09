# ArrivalHome Prop Sprawl — Build Record

**Date:** 2026-03-09
**Business:** BRIK
**Plan slug:** prime-arrival-home-prop-sprawl
**Dispatch:** IDEA-DISPATCH-20260309120000-0003

## What was done

Five individually-passed props on `ArrivalHome` — the check-in code value, its loading state, its stale flag, the offline flag, and the refresh handler — were grouped into a single `ArrivalCodeState` interface. The component now receives `codeState: ArrivalCodeState` instead of five separate props.

Files changed:
- `apps/prime/src/components/arrival/ArrivalHome.tsx` — new `ArrivalCodeState` interface (exported), `ArrivalHomeProps` updated, component body destructures from `codeState`
- `apps/prime/src/components/homepage/GuardedHomeExperience.tsx` — the one production call site updated to pass `codeState={{ ... }}`
- Six test files updated to use the new `codeState` shape

## Validation

- `pnpm --filter @apps/prime typecheck` — passed (0 errors)
- `pnpm --filter @apps/prime lint` — passed (0 errors; 1 pre-existing warning on unrelated `ServiceCard.tsx`)
- Pre-commit hooks (lint-staged, typecheck-staged) — passed

## Outcome Contract

- **Why:** ArrivalHome had 11 props; five of them form a single domain concept (code loading state) but were passed individually, making call sites verbose and the interface harder to scan.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** ArrivalHome prop count reduced from 11 to 7 by grouping the five code-loading props into a single `ArrivalCodeState` config object.
- **Source:** operator
