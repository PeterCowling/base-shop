---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: API
Workstream: Engineering
Created: 2026-02-19
Last-updated: 2026-02-19
Feature-Slug: email-system-design-gaps
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/email-system-design-gaps/plan.md
Business-OS-Integration: off
Business-Unit: BRIK
Card-ID: none
---

# Email System Design Gaps — Fact-Find Brief

## Scope

### Summary

The Brikette email pipeline (MCP server tools: `gmail_organize_inbox`, `draft_interpret`, `draft_generate`, `draft_refine`, `prime_process_outbound_drafts`) has eight identified design gaps that need remediation. The gaps span scan coverage, lock durability, deferral automation, policy enforcement, label hygiene on error, observability, Flow 2/3 label attribution, and numeric escalation thresholds. This brief documents exactly what the code does today versus what it should do, so that `/lp-do-plan` can create safe, testable implementation tasks.

### Goals

- Document the exact code state for each of the 8 issues with line-level evidence.
- Identify blast radius and test coverage for each gap.
- Produce a set of suggested task seeds that can be planned and sequenced.

### Non-goals

- Making any code changes during this investigation.
- Designing specific fix implementations (that is for `/lp-do-plan`).

### Constraints & Assumptions

- Constraints:
  - The mcp-server is a standalone Node.js package under `packages/mcp-server`. No framework-level change is available.
  - Processing locks (`processingLocks`) interact with Gmail API state; any change must not create double-processing risk.
  - Prepayment and cancellation template text is operationally and legally fixed; any guard must not break existing template dispatch paths.
- Assumptions:
  - A simple append-only JSON log file is acceptable for Issue 6 (no external logging infra exists).
  - Issues 7 and 8 are considered lower priority (additive label and threshold changes) relative to Issues 2 and 5 (data loss risks).

---

## Evidence Audit (Current State)

### Entry Points

- `packages/mcp-server/src/tools/gmail.ts` — `handleGmailTool(name, args)` — dispatches all Gmail MCP tools; the top-level `handleOrganizeInbox`, `handleGetEmail`, `handleMarkProcessed`, `handleReconcileInProgress` are inner functions.
- `packages/mcp-server/src/tools/draft-interpret.ts` — `handleDraftInterpretTool(name, args)` — produces `EmailActionPlan` JSON.
- `packages/mcp-server/src/tools/draft-generate.ts` — `handleDraftGenerateTool(name, args)` — template selection, gap-fill, policy, quality gate.
- `packages/mcp-server/src/tools/draft-refine.ts` — `handleDraftRefineTool(name, args)` — attestation layer, runs quality gate.
- `packages/mcp-server/src/tools/outbound-drafts.ts` — `handleOutboundDraftTool(name, args)` — dispatches `prime_process_outbound_drafts`.
- `.claude/skills/ops-inbox/SKILL.md` — orchestration instructions for the Claude CLI operator; defines the 7-step pipeline (organize → list → interpret → generate → gap-patch → refine → mark-processed).

### Key Modules / Files

- `packages/mcp-server/src/tools/gmail.ts` — 2750 lines; contains all Gmail API interaction, label constants, `processingLocks`, `handleOrganizeInbox`, `handleGetEmail`, `handleMarkProcessed`, `handleReconcileInProgress`.
- `packages/mcp-server/src/tools/draft-interpret.ts` — 752 lines; `classifyAllScenarios`, `classifyEscalation`, `detectAgreement`, `handleDraftInterpretTool`. Exports `EmailActionPlan` type.
- `packages/mcp-server/src/tools/draft-generate.ts` — 1245 lines; template ranker integration, knowledge gap-fill, policy decision, quality check.
- `packages/mcp-server/src/tools/draft-refine.ts` — 194 lines; attestation layer, delegates to `handleDraftQualityTool`.
- `packages/mcp-server/src/tools/outbound-drafts.ts` — 356 lines; `prime_process_outbound_drafts`, Firebase REST integration, `categoryToLabelNames`.
- `packages/mcp-server/src/tools/policy-decision.ts` — 159 lines; `evaluatePolicy`, `resolveReviewTier`; maps `escalation.tier` to `ReviewTier` (`standard | mandatory-review | owner-alert`).

### Patterns & Conventions Observed

- Label-based state machine — evidence: `LABELS` constant in `gmail.ts` lines 40–65; transitions in `handleMarkProcessed` lines 2260–2363.
- In-memory processing lock — evidence: `processingLocks = new Map<string, number>()` at line 121; used in `handleGetEmail` (lines 2051–2068) and cleared in `handleMarkProcessed` (line 2378).
- `testMode` deprecated, `dryRun` replaces it — evidence: `organizeInboxSchema` at lines 269–274; both params accepted for backward compat.
- Actor enum (`codex | claude | human`) stamped on every `gmail_get_email` and `gmail_mark_processed` call — evidence: `actorToLabelName` at lines 684–694.
- `emailActionPlanVersion` field on `EmailActionPlan` — "1.1.0" when `scenarios[]` is populated — evidence: `draft-interpret.ts` line 737.

### Data & Contracts

- Types/schemas/events:
  - `EmailActionPlan` (exported from `draft-interpret.ts`): `normalized_text`, `language`, `intents`, `agreement`, `workflow_triggers`, `scenario`, `scenarios?`, `escalation`, `thread_summary?`.
  - `EscalationClassification`: `tier: "NONE" | "HIGH" | "CRITICAL"`, `triggers: string[]`, `confidence: number`.
  - `ScenarioClassification`: `category: ScenarioCategory`, `confidence: number` (0–1 range).
  - `PolicyDecision`: `reviewTier: "standard" | "mandatory-review" | "owner-alert"`.
  - `RefineResult` (from `draft-refine.ts`): `draft`, `refinement_applied`, `refinement_source`, `quality`.
  - `OutboundDraftRecord` (from `outbound-drafts.ts`): `to`, `subject`, `bodyText`, `category: "pre-arrival" | "extension-ops"`, `status: "pending" | "drafted" | "sent" | "failed"`.
- Persistence:
  - Gmail label state: source of truth for message routing state; no database.
  - In-memory `processingLocks: Map<string, number>` — volatile, not persisted.
  - Firebase Realtime Database — used by `prime_process_outbound_drafts` for outbound draft records.
- API/contracts:
  - Gmail API v1 (threads.list, messages.get, messages.modify, drafts.create).
  - MCP tool contract: all handlers return `{ content: [{ type: "text", text: string }] }` via `jsonResult` / `errorResult`.

### Dependency & Impact Map

- Upstream dependencies:
  - Gmail API (OAuth2 credentials); `getGmailClient()` in `clients/gmail.ts`.
  - Firebase Realtime Database (outbound-drafts only).
  - `draft_interpret` → `draft_generate` → `draft_quality_check` → `draft_refine` (pipeline chain in ops-inbox skill).
- Downstream dependents:
  - `gmail_reconcile_in_progress` reads the `Brikette/Queue/In-Progress` label, which is set by `handleGetEmail`.
  - `handleMarkProcessed` clears `processingLocks` — dependency from `handleGetEmail` (sets lock) to `handleMarkProcessed` (clears lock).
  - `prime_process_outbound_drafts` imports `LABELS`, `REQUIRED_LABELS`, `ensureLabelMap`, `collectLabelIds` from `gmail.ts`.
- Likely blast radius:
  - Issue 1 (scan scope): affects new emails read by Pete/Cristiana before the bot runs — silently drops them from the queue.
  - Issue 2 (in-memory lock): affects any crash/restart scenario — could allow double-processing of a single email.
  - Issue 5 (label hygiene on error): affects any mid-pipeline tool failure — email can be stuck In-Progress forever without reconcile running.
  - Issues 3, 4, 8 (policy/threshold enforcement): affect draft quality and safety, no data loss risk.
  - Issue 6 (audit trail): affects observability only, no functional impact.
  - Issue 7 (Flow 2/3 label attribution): affects label completeness in Gmail for outbound drafts, low risk.

### Delivery & Channel Landscape

Not investigated: this is a code-change deliverable with no customer-facing channel.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (Node environment).
- Commands: `pnpm --filter @acme/mcp-server test` / `pnpm -w run test:governed`.
- CI integration: yes — mcp-server tests run in CI per `reusable-app.yml`.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Gmail organize inbox | Unit | `src/__tests__/gmail-organize-inbox.test.ts` | Covers classify logic; does not test query string construction |
| Gmail label state | Unit | `src/__tests__/gmail-label-state.test.ts` | Covers label transitions |
| Draft interpret | Unit | `src/__tests__/draft-interpret.test.ts` | Covers scenario classification, escalation, agreement detection |
| Draft generate | Unit | `src/__tests__/draft-generate.test.ts` | Covers template selection, gap-fill, policy |
| Draft refine | Unit | `src/__tests__/draft-refine.test.ts` | Covers attestation, quality gate, identity check, old-schema guard |
| Pipeline integration | Integration | `src/__tests__/draft-pipeline.integration.test.ts` | Covers full pipeline flow |
| Policy decision | Unit | `src/__tests__/policy-decision.test.ts` | Covers `evaluatePolicy` scenarios |
| Draft quality check | Unit | `src/__tests__/draft-quality-check.test.ts` | Covers quality gate checks |

#### Coverage Gaps

- Untested paths:
  - `handleOrganizeInbox` query string construction — no test verifies the exact query passed to `gmail.users.threads.list`.
  - `processingLocks` behaviour across simulated restarts (in-memory only; no test exists for stale-lock-after-restart).
  - `draft_interpret` escalation not triggering deferral — confirmed by code review: no threshold check in handler.
  - `draft_refine` category guard for prepayment/cancellation — confirmed absent from `draft-refine.ts`.
  - `handleMarkProcessed` error handling (no try/catch around the Gmail API call).
  - `prime_process_outbound_drafts` label attribution — `Outcome/Drafted` and `Agent/*` not tested.
- Extinct tests:
  - None identified.

#### Testability Assessment

- Easy to test:
  - Query string construction (unit-testable by intercepting `gmail.users.threads.list` call).
  - Category guard in `draft_refine` (pure function check).
  - Label attribution in `prime_process_outbound_drafts` (spy on `gmail.users.messages.modify`).
- Hard to test:
  - In-memory lock durability across restarts — requires mocking process restart or externalising the lock.
  - Failure-state label hygiene — requires forcing mid-pipeline exceptions in a test harness.
- Test seams needed:
  - Exposed query construction as a pure helper function (testable without Gmail client).
  - Injected `processingLocks` map (instead of module-level singleton) to allow test isolation.

### Recent Git History (Targeted)

- `packages/mcp-server/src/tools/draft-refine.ts` — `ce5bf75b` "feat(draft-refine): TASK-01 v2 — rework draft_refine as attestation layer" — reworked to receive `refinedBodyPlain` from Claude CLI; quality gate runs inside; no category guard was added in this commit.
- `packages/mcp-server/src/tools/draft-interpret.ts` — `a2d6c7da` "feat(email-autodraft-world-class-upgrade): add escalation tier classification (TASK-03)" — added `classifyEscalation`; `EscalationClassification` has `confidence` field but no numeric deferral threshold.
- `packages/mcp-server/src/tools/gmail.ts` — `3f4876c5` "feat(mcp-server): integrate cancellation parser with Gmail organize (TASK-15)" — added cancellation path in organize; `processingLocks` module-level map introduced earlier.
- `packages/mcp-server/src/tools/outbound-drafts.ts` — `ef0ac1ac` "feat(prime): human-in-the-loop email drafts via Firebase outbox + MCP tool" — initial commit of `prime_process_outbound_drafts`; `categoryToLabelNames` applies `READY_FOR_REVIEW` + `OUTBOUND_PRE_ARRIVAL` / `OUTBOUND_OPERATIONS` but not `PROCESSED_DRAFTED` or any `Agent/*`.

---

## Issue Analysis

### Issue 1 — gmail_organize_inbox Scan Scope

**Finding (confirmed):** The query is constructed at `gmail.ts` line 1571:

```typescript
let query = "is:unread in:inbox";
```

If `specificStartDate` is supplied, the query becomes:
```
is:unread in:inbox after:YYYY/MM/DD before:tomorrow
```

Without `specificStartDate`, the query is exactly `"is:unread in:inbox"` passed to `gmail.users.threads.list` with `maxResults: limit` (default 500).

**Mechanism:** `hasBriketteLabel` (line 1661) is checked per-thread after fetching thread metadata; threads already carrying any `Brikette/*` label are skipped (`skippedAlreadyManaged`). But this skip check happens **after** the Gmail query has already excluded read emails. If Pete/Cristiana reads an email before the bot runs, Gmail removes the `UNREAD` label and the message will not appear in `is:unread in:inbox` at all — the `hasBriketteLabel` guard is never reached for it.

**Label-absence alternative:** A query like `label:INBOX -label:Brikette/Queue/Needs-Processing -label:Brikette/Queue/In-Progress -label:Brikette/Outcome/Drafted ...` would catch read emails. This is more complex (requires enumerating all terminal Brikette labels) but does not depend on UNREAD status.

**Blast radius:** Any email read by Pete or Cristiana via Gmail directly — before `gmail_organize_inbox` runs — is permanently missed by the bot. It stays in Inbox with no Brikette label, never enters the queue. The only recovery is Pete noticing it manually.

---

### Issue 2 — In-Memory Processing Lock

**Finding (confirmed):**

```typescript
// gmail.ts line 120-121
const PROCESSING_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const processingLocks = new Map<string, number>();
```

The lock is set in `handleGetEmail` (line 2084):
```typescript
processingLocks.set(emailId, Date.now());
```

Stale-lock detection in `handleGetEmail` (lines 2052–2064):
```typescript
const isStale = isProcessingLockStale(
  processingLocks.get(emailId),
  msg.internalDate
);
if (isStale) {
  await gmail.users.messages.modify({ ... removeLabelIds: processingLabelIds });
  processingLocks.delete(emailId);
} else {
  return errorResult(`Email ${emailId} is already being processed.`);
}
```

`isProcessingLockStale` (lines 696–710): returns `true` if `Date.now() - lockTimestamp > PROCESSING_TIMEOUT_MS` **or** if no in-memory lock exists but `internalDate` is more than 30 minutes old. The fallback to `internalDate` is important: on restart, `processingLocks` is empty, so `lockTimestamp` is `undefined`. The function then checks the message's `internalDate` (the Gmail-side timestamp of the email itself, not when processing started). This means: after a restart, a recently received email (e.g., received 5 minutes ago, currently In-Progress) would appear **not stale** because its `internalDate` is recent — and the function would return `false`, allowing a re-entry attempt to succeed (returns `errorResult` "already being processed") even though no actual lock is held.

**Double-processing risk:** If the mcp-server restarts mid-pipeline:
1. `processingLocks` is empty.
2. The email still has `Brikette/Queue/In-Progress` label (from the previous `handleGetEmail` call).
3. A new call to `handleGetEmail` for the same email: `processingLocks.get(emailId)` returns `undefined`.
4. `isProcessingLockStale(undefined, internalDate)` — if the email was received recently (within 30 min), returns `false`.
5. The call returns `errorResult("already being processed")` — correct false-positive protection, but the email is stuck In-Progress until `handleReconcileInProgress` runs (with `staleHours` default 24 hours).

**Reconcile fallback:** `handleReconcileInProgress` queries for all `In-Progress` labeled messages and uses `parseMessageTimestamp` (the email's Date header, not when processing started) to determine staleness against `staleHours`. Default is 24 hours. So a crashed-mid-pipeline email is stuck for up to 24 hours minimum.

---

### Issue 3 — draft_interpret Confidence Enforcement

**Finding (confirmed):** `handleDraftInterpretTool` (lines 709–749) produces an `EmailActionPlan` and returns it via `jsonResult`. There is no conditional logic that mechanically defers based on any numeric threshold.

The `escalation` field has a `confidence` number (0–1):
- `NONE`: `confidence: 0`
- `HIGH`: `0.74` to `0.95` depending on trigger count
- `CRITICAL`: `0.86` to `0.99` depending on trigger count

The `scenario.confidence` field (per-category, 0–1) is also returned.

Neither the `draft_interpret` handler nor the calling skill code contains a threshold check like "if `escalation.tier === 'HIGH' && escalation.confidence > 0.85`, return escalation_required". The `policy-decision.ts` module does consume `escalation.tier` to set `reviewTier: "mandatory-review" | "owner-alert"`, but this only affects `mandatoryContent`, `prohibitedContent`, and tone in the generated draft — it does not block draft creation or force deferral.

**Deferral decision location:** The `ops-inbox/SKILL.md` step 3 says: "If classification is ambiguous or context looks odd, default to `deferred`." This is entirely a natural-language instruction to Claude — there is no code-level gate.

---

### Issue 4 — Hard Rules Are Policy-Only

**Finding (confirmed):** The ops-inbox skill (SKILL.md lines 161–166, 195–198) states:

> Hard-rule categories — do NOT modify under any circumstance:
> - `prepayment` category text
> - `cancellation` category text

This is a text instruction only. Checking `draft-refine.ts` (full file, 194 lines): there is **no code** that checks `actionPlan.scenario.category` or `actionPlan.scenarios[0].category`. The `draftRefineSchema` (lines 50–67) requires `actionPlan.scenario.category: z.string()` but does not validate its value or reject any combination.

`draft-generate.ts` does call `evaluatePolicy(actionPlan)` which uses `actionPlan.scenario.category` to build `PolicyDecision` (prohibited content, mandatory content, template constraints). For `cancellation` category, `prohibitedContent` includes "we will refund", "full refund", etc. However, `evaluatePolicy` operates on **generated body text** (removeForbiddenPhrases), not on the refinement delta — it cannot detect whether a refinement **added** new wording to a prepayment template.

**Code-level guard:** No function in `draft-refine.ts` or `draft-generate.ts` checks the scenario category against a block-list before accepting `refinedBodyPlain`. A guard could be added to `handleDraftRefineTool` that compares `originalBodyPlain` with `refinedBodyPlain` when `actionPlan.scenarios[0].category` is `prepayment` or `cancellation` and rejects if changes are detected.

---

### Issue 5 — Failure-State Label Hygiene

**Finding (confirmed):**

`handleMarkProcessed` (lines 2207–2395): no `try/catch` around the Gmail API call at line 2370:
```typescript
await gmail.users.messages.modify({
  userId: "me",
  id: emailId,
  requestBody: { addLabelIds, removeLabelIds },
});
processingLocks.delete(emailId);
```

If `gmail.users.messages.modify` throws (e.g., network error, rate limit), the exception propagates up to `handleGmailTool`'s outer try/catch (lines 2705–2755), which converts it to an `errorResult`. The `In-Progress` label remains on the email. The `processingLocks.delete(emailId)` at line 2378 is never reached.

The `handleGetEmail` function (lines 2013–2140) similarly has no try/catch — on exception during label modification (lines 2070–2083), the Gmail label state may be partially updated.

**Reconcile coverage:** `handleReconcileInProgress` does cover this scenario eventually — any message with `In-Progress` label older than `staleHours` (default 24h) will be re-routed. But the default 24h window means a failed email is stuck for up to a day.

**Escalation-path impact:** In the ops-inbox pipeline, if `draft_generate` succeeds but `gmail_create_draft` or `gmail_mark_processed` fails, the email remains In-Progress. There is no automatic retry or rollback; the operator must notice the failure and either run reconcile early or manually fix labels.

---

### Issue 6 — Observability / Per-Email Audit Trail

**Finding:** No persistent log exists linking `messageId → tools run → quality gate results → refinement_source`.

The tools emit structured JSON results (via `jsonResult`) which the MCP client (Claude CLI) receives. The MCP client logs to its own session output, but there is no append-only file that persists across sessions.

`loop.ts` (found in the `appendFile` search) contains file-writing logic, suggesting there is precedent for append-only file logging in the mcp-server package.

**Logging infra:** `packages/mcp-server/src/clients/gmail.ts` also matched the appendFile search, though this is likely for OAuth token persistence, not audit logging.

**What retention matters:** The audit trail would need to survive at least one session and ideally be query-able by `messageId`. A simple append-only JSON-lines file (e.g., `packages/mcp-server/data/email-audit-log.jsonl`) is feasible; it would need rotation policy for long-term use but not for MVP.

---

### Issue 7 — Flow 2/3 Label Attribution

**Finding (confirmed):**

`categoryToLabelNames` in `outbound-drafts.ts` (lines 116–127):
```typescript
function categoryToLabelNames(category: string): string[] {
  const labels: string[] = [LABELS.READY_FOR_REVIEW];
  switch (category) {
    case "pre-arrival":
      labels.push(LABELS.OUTBOUND_PRE_ARRIVAL);
      break;
    case "extension-ops":
      labels.push(LABELS.OUTBOUND_OPERATIONS);
      break;
  }
  return labels;
}
```

Labels applied per draft: `Brikette/Drafts/Ready-For-Review` + one of `Brikette/Outbound/Pre-Arrival` / `Brikette/Outbound/Operations`.

Labels **not** applied: `Brikette/Outcome/Drafted` (`LABELS.PROCESSED_DRAFTED`) and any `Brikette/Agent/*` label.

**Schema change required:** No schema change is needed — `LABELS.PROCESSED_DRAFTED` and the `Agent/*` labels already exist in the `LABELS` constant (lines 47, 60–62). This is an additive change to `categoryToLabelNames`.

**User impact:** Without `Outcome/Drafted`, outbound pre-arrival drafts are not distinguishable from inbound drafted emails by label alone. Without `Agent/*`, it is unclear which agent generated the draft.

---

### Issue 8 — Stage 2 Auto-Proceed Threshold

**Finding (confirmed):** This issue overlaps significantly with Issue 3. The `EscalationClassification` type returned by `draft_interpret` (lines 31–35) has `confidence: number`. The `classifyEscalation` function (lines 622–707) computes:

- `HIGH`: confidence = `Math.min(0.95, 0.74 + (highTriggers.length - 1) * 0.06)` — starts at 0.74.
- `CRITICAL`: confidence = `Math.min(0.99, 0.86 + (criticalTriggers.length - 1) * 0.04)` — starts at 0.86.

There is no code anywhere in the pipeline that reads `escalation.confidence` and uses it to auto-defer. The `evaluatePolicy` function reads `escalation.tier` (string enum) but not `escalation.confidence`.

The `scenario` classification also produces per-category `confidence` values (0.6–0.9 range from `classifyAllScenarios`), but no code gates draft creation on these values. There is a draft quality `confidence` returned by `handleDraftQualityTool` and consumed in `draft-generate.ts` at line 1196, but this is a quality confidence (about the draft), not an escalation threshold.

**Conclusion:** Auto-defer threshold is entirely policy-level (in SKILL.md), not code-level. A numeric threshold (e.g., "if `escalation.tier !== 'NONE' && escalation.confidence >= 0.8`, skip draft_generate and return escalation_required") does not exist in any tool.

---

## Questions

### Resolved

- Q: Does `isProcessingLockStale` fall back to `internalDate` on restart?
  - A: Yes. `lockTimestamp` undefined → checks `internalDate`. For recently-received emails, this returns `false`, blocking re-entry. But this is the email's received timestamp, not the processing-started timestamp — making the fallback semantically incorrect for restart scenarios.
  - Evidence: `gmail.ts` lines 696–710.

- Q: Does `draft_refine` check scenario category?
  - A: No. The full 194-line file has zero category-check logic.
  - Evidence: `packages/mcp-server/src/tools/draft-refine.ts` (full read).

- Q: Does `prime_process_outbound_drafts` apply `Outcome/Drafted` or `Agent/*`?
  - A: No. Only `READY_FOR_REVIEW` and one of `OUTBOUND_PRE_ARRIVAL` / `OUTBOUND_OPERATIONS`.
  - Evidence: `outbound-drafts.ts` lines 116–127.

- Q: Is there any numeric confidence threshold that auto-defers in code?
  - A: No. `evaluatePolicy` uses `escalation.tier` string; no numeric threshold gates draft creation anywhere.
  - Evidence: `draft-interpret.ts` handler (lines 709–749), `policy-decision.ts` (full file), `draft-generate.ts` `handleDraftGenerateTool` (lines 1039–1242).

### Open (User Input Needed)

None — all three open questions resolved by Pete (2026-02-19).

### Resolved Decisions

**Decision 1 — Issue 1 scan scope (Pete, 2026-02-19)**

> *"Read/unread is a human UX flag, not a queue primitive. If your processing semantics depend on it, you will always have silent loss modes (mobile previews, client-side auto-mark-read, shared mailbox behaviour, etc.)."*

**Correct long-term target state:**
- Entry label `Brikette/Queue/Needs-Processing` is applied to every eligible inbound email **on arrival** (via Gmail filter or history-based ingestion using `lastHistoryId`).
- Bot scans `label:Brikette/Queue/Needs-Processing` — completely independent of read/unread state.
- Label transitions: acquire → remove `Needs-Processing`, add `In-Progress`; finish → add terminal outcome, remove `In-Progress`; fail → remove `In-Progress`, re-add `Needs-Processing` (optionally add `Brikette/Outcome/Error`).
- Two ingestion mechanisms (choose one for implementation):
  - **Gmail filter** — filters on eligible inbound criteria apply `Needs-Processing` at arrival. Simple but requires reliable scope definition.
  - **History-based ingestion** — store `lastHistoryId`; each run asks Gmail "what changed since last run?" via `users.history.list`, labels new eligible messages `Needs-Processing`, then processes the queue. Naturally incremental, no long inbox queries.

**Transitional path within current code (if full ingestion redesign is a separate track):**
- Option B (time-bounded label-absence query) becomes the **default** — not opt-in. Generate the label-absence query from a single code-owned labels registry (not ad-hoc string concatenation) so it stays correct when new labels are added.
- Option C (flag) is a rollout step only, not the long-term design.

**Decision 2 — Issue 2 in-memory lock (Pete, 2026-02-19)**

> *"Locks must survive process restarts, and 'stale' must be computed from the lock acquisition time, not the email's internalDate."*

**Correct long-term pattern:**
- **File-based durable lock store**: on lock acquire, atomically create `data/locks/<messageId>.json` with `{ lockedAt: <timestamp>, owner: "<pid/session>" }`. On lock release, delete the file.
- **Stale check uses `lockedAt`**, never `internalDate`. If `In-Progress` label exists in Gmail but no lock file exists (crash scenario), treat as reclaimable after a short grace period (5–10 minutes), not after 30 minutes.
- **Reduce reconcile to ≤ 2h** — safety net backstop, not the primary fix.
- **Startup recovery**: at the start of every run (before processing any email), scan `label:Brikette/Queue/In-Progress`, compare each to the lock store, and clean/requeue anything stale. Do not wait for a scheduled daily reconcile.

**Decision 3 — Issues 3 & 8 auto-deferral threshold (Pete, 2026-02-19)**

- `escalation.tier === "CRITICAL"` → always auto-defer (no draft generation).
- `escalation.tier === "HIGH" && escalation.confidence >= 0.80` → auto-defer.
- `escalation.tier === "HIGH" && escalation.confidence < 0.80` → proceed but flag to user.
- `escalation.tier === "NONE"` → proceed normally.

---

## Confidence Inputs

- Implementation: 92%
  - Evidence: All 8 issues confirmed with line-level code evidence. The code paths are fully read and understood.
  - What would raise to >=80: Already above 80. Full read of all relevant files complete.
  - What would raise to >=90: Already above 90. Only remaining uncertainty is the exact query semantics for label-absence (Issue 1) which requires a Gmail API test to validate.

- Approach: 88%
  - Evidence: All three open questions resolved with explicit architectural decisions by Pete (2026-02-19). Fix directions are clear for all 8 issues. Remaining uncertainty is Gmail API behaviour of label-absence query at Brikette inbox scale (requires dryRun validation).
  - What would raise to >=90: dryRun validation of the label-absence query confirming correct thread count and no rate-limit errors.

- Impact: 85%
  - Evidence: Issues 2 and 5 have confirmed data-loss risk (stuck In-Progress for 24h+). Issues 1 (silent miss), 4 (policy bypass risk) are also well-understood. Issues 6, 7, 8 are observability/completeness with lower urgency.
  - What would raise to >=90: Operational data on how often Pete reads emails before the bot runs (Issue 1 blast radius quantification).

- Delivery-Readiness: 82%
  - Evidence: All open questions resolved. Tests exist for all touched modules. Seams for testing lock persistence and query construction need to be added. All changes isolated to mcp-server package.
  - What would raise to >=90: Plan tasks drafted and sequenced; test seams (injected lock store, exposed query builder) confirmed feasible via code read.

- Testability: 80%
  - Evidence: Jest infrastructure is in place. Most fixes are to pure/deterministic logic. Lock persistence and label hygiene on failure are harder to test but testable with mocking.
  - What would raise to >=90: Injected `processingLocks` map (test seam) and exposed query-string builder as a pure function.

---

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Label-absence query is too expensive for Gmail API and causes rate limiting | Medium | Medium | Task 6 mandates dryRun gate before live mutation; query scoped to last 7 days to bound result set |
| File-based lock creates stale lock files on force-kill (no cleanup on crash) | Low | Low | Reconcile (now ≤ 2h) acts as backstop; startup recovery also cleans stale locks at run start |
| Category guard in draft_refine breaks existing test fixtures | Low | Medium | Run draft-refine.test.ts after adding guard; update fixtures |
| Adding `Outcome/Drafted` to outbound drafts labels causes label overlap with inbound Drafted label in Gmail views | Low | Low | Labels are separate; Gmail search can distinguish by `Outbound/*` co-label |
| Auto-deferral threshold too aggressive — over-defers legitimate HIGH escalation emails | Medium | Medium | Start with CRITICAL-only auto-defer; add HIGH as a separate opt-in |
| handleMarkProcessed try/catch fix changes error-result format, breaking skill error detection | Low | Low | Keep outer error propagation identical; only add cleanup-on-error |

---

## Planning Constraints & Notes

- Must-follow patterns:
  - All Gmail label mutations go through `ensureLabelMap` + `collectLabelIds` pattern.
  - All tool handlers return `jsonResult` or `errorResult` (never throw to caller).
  - `PROCESSING_TIMEOUT_MS` constant must remain authoritative for the 30-min threshold.
  - New tests must use the existing Jest Node environment (`/** @jest-environment node */`).
- Rollout/rollback expectations:
  - All changes are isolated to `packages/mcp-server`; no app-layer changes needed.
  - `dryRun: true` flag exists on all mutating tools — new behaviour should be testable in dry-run first.
- Observability expectations:
  - Issue 6 fix (audit log) should be the first task completed so subsequent fixes produce audit events.
- Architecture direction (Issue 1 long-term):
  - The long-term correct pattern is an explicit bot-owned entry label applied on arrival (Gmail filter or history-based ingestion via `users.history.list` + `lastHistoryId`). The bot then scans `label:Brikette/Queue/Needs-Processing` with no dependence on UNREAD state. This is a separate plan track. The transitional fix (Task 6, label-absence query as default) bridges the gap.
- Lock store location: `packages/mcp-server/data/locks/` — this directory must be gitignored.

---

## Suggested Task Seeds (Non-binding)

Sequencing principle: observability first (Issue 6), then data-loss risks (Issues 5, 2), then safety guards (Issues 4, 3/8), then label completeness (Issues 1, 7). Issue 1 ingestion redesign is larger scope and recommended as its own plan track.

1. **Issue 6 — Audit log** (IMPLEMENT, unblocked)
   Add append-only JSON-lines audit log at `packages/mcp-server/data/email-audit-log.jsonl`. Write entries from `handleGetEmail` (lock acquired), `handleMarkProcessed` (outcome), and `draft_refine` (refinement_source). Entry shape: `{ ts, messageId, action, actor, result, refinement_source? }`. Subsequent tasks will add entries for their own events.

2. **Issue 5 — Label hygiene on failure** (IMPLEMENT, unblocked)
   Wrap the `gmail.users.messages.modify` call in `handleMarkProcessed` in a try/catch. On catch: attempt to remove `In-Progress` label; log failure to audit log; return `errorResult` with cleanup status. Mirror for `handleGetEmail`. Do not change the outer `handleGmailTool` error contract.

3. **Issue 2 — Durable lock store** (IMPLEMENT, unblocked)
   - Replace in-memory `processingLocks` map with a file-backed store: `data/locks/<messageId>.json` containing `{ lockedAt: number, owner: string }`.
   - `isProcessingLockStale`: if no lock file exists but Gmail shows `In-Progress`, apply a 5-min grace (not `internalDate` fallback).
   - Add **startup recovery**: at the start of each `handleOrganizeInbox` run, scan `label:Brikette/Queue/In-Progress`, compare to lock store, requeue anything stale (remove `In-Progress`, add `Needs-Processing`).
   - Lower `staleHours` default from 24h to 2h in `handleReconcileInProgress`.
   - Inject lock store as a parameter for test isolation.

4. **Issue 4 — Hard rule category guard** (IMPLEMENT, unblocked)
   In `handleDraftRefineTool`: if `actionPlan.scenarios[0].category` is `"prepayment"` or `"cancellation"` and `refinedBodyPlain.trim() !== originalBodyPlain.trim()`, return `errorResult("Hard rule violation: prepayment/cancellation template text must not be modified. Pass originalBodyPlain unchanged.")`. Add unit test: prepayment scenario + non-identical refined → errorResult; prepayment scenario + identical → passes.

5. **Issue 3/8 — Mechanical deferral gate** (IMPLEMENT, unblocked)
   In `handleDraftInterpretTool`: after computing `escalation`, check `tier + confidence` against decided thresholds (CRITICAL → always defer; HIGH + confidence ≥ 0.80 → defer). When deferral triggered, include `escalation_required: true` in the returned JSON alongside the full action plan. Update `ops-inbox/SKILL.md` to check `escalation_required` field before proceeding to `draft_generate`.

6. **Issue 1 — Transitional: label-absence query** (IMPLEMENT, depends on 3)
   - Build a pure `buildOrganizeQuery(mode: "unread" | "label-absence"): string` function that derives the label-absence query from a single source-of-truth labels registry (not ad-hoc strings). Make it the default.
   - The query form: `in:inbox after:<7-days-ago> -label:<all-terminal-Brikette-labels>`.
   - Add dryRun gate: first run in dryRun to validate thread count and surface any API errors before live mutation.
   - Write unit test for `buildOrganizeQuery` covering label registry completeness.
   - Note: full ingestion redesign (Gmail filter or history-based `lastHistoryId`) is the long-term correct target — this task is the transitional fix. Ingestion redesign should be a separate plan.

7. **Issue 7 — Flow 2/3 label attribution** (IMPLEMENT, unblocked)
   In `outbound-drafts.ts`: add `LABELS.PROCESSED_DRAFTED` to the label set returned by `categoryToLabelNames`. Add `actor` parameter to `prime_process_outbound_drafts` schema (default `"human"` since no AI writes these bodies); apply the corresponding `Agent/*` label. Write unit tests for both label sets.

---

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - All 8 issues have code-level fixes (or explicit decision to defer) per plan tasks.
  - Tests added for each fix covering the previously untested path.
  - `pnpm --filter @acme/mcp-server test` passes.
  - `pnpm typecheck && pnpm lint` passes for mcp-server.
- Post-delivery measurement plan:
  - Run `gmail_organize_inbox` in dryRun mode and compare thread counts before/after Issue 1 fix.
  - Simulate crash-restart and verify reconcile window is reduced (Issue 2).
  - Verify `email-audit-log.jsonl` entries appear for a test email processing run (Issue 6).

---

## Evidence Gap Review

### Gaps Addressed

- Query string construction for `handleOrganizeInbox` — confirmed to be exactly `"is:unread in:inbox"` (line 1571).
- `processingLocks` restart behaviour — confirmed fallback to `internalDate` is semantically incorrect for recently-received emails.
- `draft_interpret` deferral mechanism — confirmed entirely in skill instructions, not code.
- `draft_refine` category guard — confirmed absent.
- `handleMarkProcessed` error handling — confirmed no try/catch around Gmail API call.
- `prime_process_outbound_drafts` label set — confirmed `Outcome/Drafted` and `Agent/*` not applied.
- Escalation confidence threshold — confirmed no numeric gate exists anywhere in the tool chain.

### Confidence Adjustments

- Issue 2 fallback semantics: initially unclear whether `internalDate` fallback was intentional. Code review confirmed it is based on the email's received timestamp, not processing start time — this is a logic bug, not a feature.
- Issue 5: initially believed `handleMarkProcessed` had a try/catch at the outer level that would clean up. Confirmed the outer catch in `handleGmailTool` does not remove the `In-Progress` label.

### Remaining Assumptions

- The Gmail API label-absence query (`-label:X`) is functional and performant enough for the Brikette inbox size (assumed < 5000 messages based on hostel scale).
- Firebase lock storage is not necessary — single-process mcp-server justifies file-based lock.
- Pete reads emails before the morning bot run infrequently enough that Issue 1 is lower priority than Issues 2 and 5.

---

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none. All open questions resolved (2026-02-19).
- Recommended next step:
  - `/lp-do-plan docs/plans/email-system-design-gaps/fact-find.md` — all 7 task seeds are ready to be converted to plan tasks.
  - Issue 1 full ingestion redesign (Gmail filter or `lastHistoryId`) should be treated as a separate plan track after the transitional fix lands.
