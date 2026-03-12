# Micro-Build Record — Reception Inbox Error Boundary

## What was built

Added a React error boundary around the inbox detail panel so that if
ThreadDetailPane, DraftReviewPanel, or AnalyticsSummary throws during render,
the thread list remains functional and staff can recover by switching threads
or clicking "Try again".

## Files changed

| File | Change |
|------|--------|
| `apps/reception/src/components/inbox/InboxErrorBoundary.tsx` | **New** — class component error boundary with friendly fallback UI |
| `apps/reception/src/components/inbox/InboxWorkspace.tsx` | Wrapped detail panel section in `<InboxErrorBoundary>` |

## Design decisions

- **Single boundary around the right panel only.** The thread list is outside
  the boundary so it stays interactive even when the detail pane crashes.
- **Class component** because React requires `componentDidCatch` /
  `getDerivedStateFromError` on class components for error boundaries.
- **Console logging** in `componentDidCatch` for debugging; no external
  error reporting service wired up (keep it simple).
- **"Try again" resets `hasError`** to `false`, causing React to re-mount
  children. Selecting a different thread also clears the error because the
  child tree re-renders with new props.

## Validation

- `pnpm --filter @apps/reception typecheck` — pass
- `pnpm --filter @apps/reception lint` — pass
- Tests run in CI only per project policy
