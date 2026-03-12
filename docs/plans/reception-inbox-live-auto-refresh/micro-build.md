---
Type: Micro-Build
Status: Complete
Created: 2026-03-11
Last-updated: 2026-03-11
Feature-Slug: reception-inbox-live-auto-refresh
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260311195000-9553
Related-Plan: none
---

# Reception Inbox Live Auto Refresh Micro-Build

## Scope
- Change:
  - Add safe visible-tab auto-refresh for the Reception inbox list so active staff sessions keep the D1-backed inbox view current without pressing `Refresh`.
  - Add a cron-driven internal inbox-sync route so the worker can pull Gmail changes into D1 automatically every minute.
  - Preserve draft-edit safety by avoiding selected-thread detail invalidation during background list refresh.
- Non-goals:
  - Eliminate the remaining inbox list query subqueries for latest draft and latest message direction.
  - Add WebSocket/SSE invalidation or any persistent live transport.
  - Deploy the worker in this build cycle.

## Execution Contract
- Affects:
  - `apps/reception/src/services/useInbox.ts`
  - `apps/reception/src/app/api/internal/inbox-sync/route.ts`
  - `apps/reception/worker-entry.ts`
  - `apps/reception/wrangler.toml`
- Acceptance checks:
  - The inbox list reloads automatically every 15 seconds while the tab is visible and online.
  - Background refresh does not clear the cached selected-thread detail, preventing draft editor resets during polling.
  - The worker exposes an authenticated internal inbox-sync path and routes the one-minute cron trigger to that path.
  - The existing thirty-minute recovery cron remains available.
- Validation commands:
  - `pnpm --filter @apps/reception typecheck`
  - `pnpm --filter @apps/reception lint`
- Rollback note:
  - Revert the polling effect in `useInbox.ts`, remove the internal inbox sync route, and restore the single recovery-only cron handling if auto-refresh or scheduled sync proves noisy in production.

## Outcome Contract
- **Why:** Reception should feel live without staff remembering to press refresh or sync. The UI and worker need a low-cost background update path that stays within the Cloudflare budget and does not disrupt draft editing.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Reception automatically syncs Gmail into D1 on a schedule and refreshes the visible inbox list in active browser sessions, reducing manual refresh work without overwriting in-progress draft edits.
- **Source:** operator

## Build Evidence
- `useInbox.ts` now tracks online status and tab visibility, and it polls the D1-backed inbox list every 15 seconds only while the page is visible and no inbox mutation is in flight.
- `refreshInboxView()` no longer clears the detail cache before reloading the list, so background refresh keeps the selected thread stable instead of rehydrating the draft pane on every poll.
- A new authenticated internal route at `/api/internal/inbox-sync` runs the existing inbox sync pipeline for worker cron use.
- `worker-entry.ts` now distinguishes the one-minute inbox sync cron from the existing thirty-minute recovery cron and calls the appropriate internal route directly through the OpenNext worker.
- `wrangler.toml` now declares both cron schedules and documents the sync auth/enablement variables.

## Validation
- `pnpm --filter @apps/reception typecheck` — pass
- `pnpm --filter @apps/reception lint` — pass with existing warnings only (`13` warnings, `0` errors)

## Remaining Follow-up
- The inbox list query in `repositories.server.ts` still uses per-row subqueries for latest message direction and latest draft; that should be denormalized in the next wave.
- Auto-refresh currently reloads the list, not the selected thread detail; detail invalidation should later become summary-change-driven rather than time-based.
- The scheduled sync path is implemented but not deployed in this build cycle, so production behavior still depends on a deploy to take effect.
