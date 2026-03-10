---
Type: Build-Record
Status: Complete
Feature-Slug: reception-count-input-modal
Completed-date: 2026-03-09
artifact: build-record
---

# Build Record: CountInputModal Extraction

## Outcome Contract

- **Why:** Duplicate modal code means any UX or validation change must be applied to two identical files, risking divergence.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Single CountInputModal component replaces both AddKeycardsModal and ReturnKeycardsModal copy-paste pair.
- **Source:** auto

## What Was Built

Extracted the shared keycard count-input modal body into a new `CountInputModal` component at `apps/reception/src/components/till/CountInputModal.tsx`. The component accepts `title`, `submitLabel`, `onConfirm`, and `onCancel` props, wraps with `withModalBackground`, and contains all shared logic: count state, Zod `countSchema` validation (integer ≥ 1), `PasswordReauthInline`, and submit handling. Both `AddKeycardsModal` and `ReturnKeycardsModal` were rewritten as thin wrappers that pass their specific strings and delegate to `CountInputModal`.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter @apps/reception typecheck` | Pass | No type errors |
| `pnpm --filter @apps/reception lint` | Pass | No lint errors |

## Validation Evidence

- TypeScript: no errors on `pnpm --filter @apps/reception typecheck`
- Lint: clean on `pnpm --filter @apps/reception lint`
- Bug scan: 0 findings written to `bug-scan-findings.user.json`
- Both thin wrappers delegate correctly to CountInputModal
- `withModalBackground` applied once (inside CountInputModal) — wrappers do not double-wrap

## Scope Deviations

None.
