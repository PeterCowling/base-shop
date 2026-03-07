---
Type: Critique-History
Feature-Slug: reception-inbox-inprogress-recovery
---

# Critique History

## Round 1

- **Route:** codemoot
- **Score:** 8/10 (lp_score: 4.0)
- **Verdict:** needs_revision
- **Severity counts:** 0 Critical, 2 Major (warning), 1 Minor (info)

### Findings

1. **[Major]** Scope contradiction: non-goals said no recovery for `drafted` state, but body proposed D1 recovery for `pending` or `drafted` threads.
2. **[Major]** Ready-for-planning with "no blockers" despite Gmail API access from Worker being unverified (78% Delivery-Readiness, High risk).
3. **[Minor]** D1 inbox does not have an "In-Progress" status -- should name concrete stuck states (`pending` without draft) rather than implying shared state model.

### Fixes Applied

1. Updated non-goals to clarify: threads in `drafted`/`approved` are awaiting intentional operator action and are out of scope. Gmail-side recovery explicitly stays in MCP tool.
2. Eliminated Gmail credentials blocker entirely by adopting split-responsibility architecture: Gmail recovery in MCP tool (agent-scheduled), D1 recovery in Worker cron handler. Delivery-Readiness raised to 82%.
3. Rewrote summary to explicitly name the D1 stuck state: `pending` threads that were admitted but never received a draft. No shared "In-Progress" state implied.

## Round 2

- **Route:** codemoot
- **Score:** 8/10 (lp_score: 4.0)
- **Verdict:** needs_revision
- **Severity counts:** 0 Critical, 2 Major (warning), 1 Minor (info)

### Findings

1. **[Major]** D1 recovery population too broad: `pending` threads with `needsManualDraft: true` are intentional manual-follow-up cases (draft quality/error failure), not stuck threads. Auto-retrying them conflicts with non-goals.
2. **[Major]** Gmail-side automation under-specified: MCP server has no cron scheduler, and no existing unattended agent scheduler identified in the repo. Half of the "automatic recovery" outcome lacks an evidenced trigger mechanism.
3. **[Minor]** Evidence Gap Review stale: still referenced 78% Delivery-Readiness and Gmail credential uncertainty despite body updates.

### Fixes Applied

1. Added `needsManualDraft` exclusion filter to `findStaleAdmittedThreads` query specification and remaining assumptions. Only threads where draft generation never ran (crash/timeout) are recovery candidates.
2. Clarified Gmail-side scheduling: the agent invokes `gmail_reconcile_in_progress` as part of its existing periodic inbox-processing workflow. No new scheduling mechanism is needed -- consistent inclusion in the existing agent workflow is the trigger.
3. Updated Evidence Gap Review to reflect 82% Delivery-Readiness and elimination of Gmail credentials concern.

---

# Plan Critique History

## Round 1 (Plan)

- **Route:** codemoot
- **Score:** 7/10 (lp_score: 3.5)
- **Verdict:** needs_revision
- **Severity counts:** 1 Critical, 2 Major (warning), 1 Minor (info)

### Findings

1. **[Critical]** Cron mechanism unimplementable: Cloudflare cron triggers invoke `scheduled` handler, not `fetch` with bearer header. OpenNext worker.js only exports `fetch` handler -- no `scheduled` handler exists.
2. **[Major]** Recovery omits sync context: TASK-02 did not mirror full `syncInbox` draft generation context (guest matching, prepayment inference, thread context).
3. **[Major]** Failed recovery should set `needsManualDraft: true` to match `syncInbox` behavior on quality/error failure, preventing infinite retry loops.
4. **[Minor]** Confidence math inconsistency between header and calculation block.

### Fixes Applied

1. Changed approach to `worker-entry.ts` wrapper pattern: thin wrapper imports OpenNext worker, re-exports DO classes, delegates `fetch`, adds `scheduled` handler that calls OpenNext handler directly.
2. Updated TASK-02 acceptance to mirror full `syncInbox` context: guest matching, prepayment inference, thread context, draft generation with all fields.
3. Updated TASK-02 to set `needsManualDraft: true` on draft failure/quality failure, matching `syncInbox` behavior.
4. Fixed confidence calculation.

## Round 2 (Plan)

- **Route:** codemoot
- **Score:** 7/10 (lp_score: 3.5)
- **Verdict:** needs_revision
- **Severity counts:** 1 Critical, 2 Major (warning), 1 Minor (info)

### Findings

1. **[Critical]** Worker entry wrapper still uses global `fetch()` to `https://localhost/...` instead of calling the imported OpenNext handler's `fetch(request, env, ctx)` method directly. Global fetch does not use the Worker's own env/ctx bindings.
2. **[Major]** TASK-02 cites `buildThreadContext`, `inferPrepaymentProvider`, `inferPrepaymentStep` but these are non-exported local functions in `sync.server.ts`. Recovery module cannot import them without exporting first.
3. **[Major]** Retry counter `recoveryAttempts` claimed to "reset on next sync" but `buildThreadMetadata` uses `...existing` spread, so unknown metadata keys persist. No reset path defined.
4. **[Minor]** Confidence math inconsistent: calculation says 82% but header reported 83%.

### Fixes Applied

1. Updated approach and TASK-03 acceptance to call `openNextWorker.fetch(syntheticRequest, env, ctx)` directly -- invoking the imported OpenNext handler, not global `fetch()`. Ensures full env/ctx bindings.
2. Added prerequisite step 0 in TASK-02: export `buildThreadContext`, `inferPrepaymentProvider`, `inferPrepaymentStep` from `sync.server.ts` (add `export` keyword only, no logic changes). Added scout confirming these are pure functions safe to export.
3. Corrected retry counter description: counter is intentionally permanent in metadata (persisted via `...existing` spread). After max retries, `needsManualDraft` is set. Operator can manually clear if re-retry desired.
4. Fixed confidence to consistent 82% across header and calculation.

## Round 3 (Plan)

- **Route:** codemoot
- **Score:** 8/10 (lp_score: 4.0)
- **Verdict:** needs_revision (no Critical findings -- credible)
- **Severity counts:** 0 Critical, 2 Major (warning), 2 Minor (info)

### Findings

1. **[Major]** TASK-02 `Affects` list missing `sync.server.ts` despite acceptance requiring export of 3 helper functions from it.
2. **[Major]** TASK-03 TC-06 claims wrapper delegation test but test file is route-auth only; no wrapper-level test strategy.
3. **[Minor]** Assumptions and risk prose stale: still says "invoke API route" / "sends HTTP request" but mechanism is now direct `openNextWorker.fetch()` call.
4. **[Minor]** Observability says "processed/recovered/failed" but TASK-02 return shape is `{ processed, recovered, manualFlagged, skipped }`.

### Fixes Applied

1. Added `sync.server.ts` to TASK-02 `Affects` list with note "(export 3 helpers)".
2. Narrowed TC-06 to manual staging verification; wrapper depends on build output so not unit-testable.
3. Updated assumption and risk table prose to reflect direct `openNextWorker.fetch()` mechanism.
4. Fixed observability section to match TASK-02 return shape.
