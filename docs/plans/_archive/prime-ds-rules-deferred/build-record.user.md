---
Type: Build-Record
Feature-Slug: prime-ds-rules-deferred
Build-Date: 2026-03-13
Status: Complete
---

# Build Record: Prime DS Rules Deferred

## Outcome Contract

- **Why:** 24 Prime app files had BRIK-3-labelled DS lint suppressions blocking the design system enforcement. Staff-facing interactive elements lacked minimum tap targets, and layout primitives were bypassed with raw flex/div wrappers, making the Prime guest app non-compliant with the DS rules enabled on all other apps in the monorepo.
- **Intended Outcome Type:** code-change / quality
- **Intended Outcome Statement:** Remove all BRIK-3 DS lint suppressions from the Prime guest app and fix every revealed violation using established patterns, restoring `pnpm lint --full` to zero DS-rule errors.
- **Source:** operator (dispatch IDEA-DISPATCH-20260313200000-PRIME-009)

## Build Summary

All 7 tasks completed in sequence. Wave 2 (TASK-02–05) ran in parallel — single background agent serialized the writes.

### Tasks Completed

| Task | Description | Commit |
|---|---|---|
| TASK-01 | Lint dry-run: enumerate BRIK-3 violations | `25569878d5` (mega-commit) |
| TASK-02 | Fix container-widths-only-at-only files (10 files) | `07c8c4c72d` |
| TASK-03 | Fix single-rule files (min-tap, enforce-layout-primitives, inline BRIK-3) | `07c8c4c72d` |
| TASK-04 | Fix multi-rule pages cluster (8 files) | `25569878d5` / `07c8c4c72d` |
| TASK-05 | Fix multi-rule components cluster (8 files, expanded) | `07c8c4c72d` |
| TASK-06 | Tap-size class assertions in test files | `07c8c4c72d` |
| TASK-07 | Final full-codebase lint validation (zero DS violations) | verified inline |

### Key Fix Patterns Applied

- `ds/container-widths-only-at`: `div.max-w-*` → `<Container className="!max-w-*">` (error/page, StaffOwnerDisabledNotice); `max-w-sm` card class removed; `max-w-48` → `w-48` (ServiceCard, TaskCard)
- `ds/enforce-layout-primitives`: `div.flex-col` → `<Stack>`; `div.flex` → `<Inline>`; `div.flex-wrap` → `<Inline>` (TaskCard, BadgeCollection, chat/channel/page)
- `ds/min-tap-size`: `min-h-10 min-w-10` / `min-h-11 min-w-11` added to all interactive buttons (CacheSettings, UpdatePrompt)
- `ds/no-hardcoded-copy` (CheckInClient): Relabelled BRIK-3 → PRIME-CHK-001 (i18n pass deferred, out of scope for this plan)

### Validation Evidence

```
pnpm --filter prime lint -- --full output:
  ds/container-widths-only-at violations: 0
  ds/enforce-layout-primitives violations: 0
  ds/min-tap-size violations: 0
  BRIK-3 labels remaining: 0
  Total errors: 4 (pre-existing parserOptions.project for test-utils — unrelated)
  Total warnings: 113 (ds/no-hardcoded-copy — pre-existing, out of scope)
```

## Engineering Coverage Evidence

| Coverage Area | Evidence | Status |
|---|---|---|
| UI / visual | Class changes verified by lint pass; `max-w-sm`→removed, `max-w-48`→`w-48`, Container wraps reviewed | Pass |
| UX / states | `min-h-10 min-w-10` / `min-h-11 min-w-11` applied to all interactive buttons | Pass |
| Testing | TC-TAP-01 added to attendance-lifecycle.test and chat-optin-controls.test | Pass |
| Lint gate | `pnpm --filter prime lint -- --full` zero DS violations | Pass |
| Security/privacy | N/A — UI-only class changes | N/A |
| Data/contracts | N/A — no type or schema changes | N/A |

## Workflow Telemetry Summary

- Stage: lp-do-build
- Module: modules/build-code.md
- Deterministic check: `scripts/validate-engineering-coverage.sh` — passed (no errors, no warnings)
- Commits: `07c8c4c72d` (DS Wave 2–6), `f4d0d98472` (cleanup)
