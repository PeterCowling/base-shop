---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: BOS
Workstream: Engineering
Created: 2026-03-02
Last-updated: 2026-03-02
Critique-Rounds: 3
Critique-Verdict: credible
Critique-Score: 4.0
Feature-Slug: lp-do-ideas-queue-state-sync
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Loop-Gap-Trigger: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/lp-do-ideas-queue-state-sync/plan.md
Trigger-Why: Build completion is not auto-synced to queue-state.json; dispatches remain in auto_executed state indefinitely after their plans are archived, causing completion rate metrics to undercount real throughput.
Trigger-Intended-Outcome: "type: operational | statement: after any lp-do-build post-build archive step, dispatches whose processed_by.fact_find_slug matches the feature slug are automatically written to completed state with completed_by populated | source: operator"
---

# lp-do-ideas Queue-State Sync — Fact-Find Brief

## Scope
### Summary
When `lp-do-build` completes the full build + archive cycle for a plan, the originating dispatch in `docs/business-os/startup-loop/ideas/trial/queue-state.json` is not automatically marked `completed`. The `completed_by` field must be written manually. This means the `counts.completed` metric underreports actual throughput and the `counts.auto_executed` count accumulates stale entries indefinitely.

This fact-find scopes a deterministic, idempotent completion hook that runs as the final step of the lp-do-build post-build flow, after archiving a plan, and writes `completed_by + queue_state: "completed"` to any dispatches whose `processed_by.fact_find_slug` matches the feature slug just archived.

### Goals
- Add a new TypeScript module `scripts/src/startup-loop/lp-do-ideas-queue-state-completion.ts` that exports `markDispatchesCompleted()`. This is a standalone file (not added to `lp-do-ideas-trial-queue.ts`) because it operates directly on the queue.v1 JSON file rather than on the in-memory `TrialQueue` class, and this separation keeps file-I/O concerns out of the in-memory module.
- Emit the new script as an importable module callable from the lp-do-build skill post-build flow.
- Update the `counts` block in queue-state.json on every write.
- Add unit tests covering: normal match, already-completed idempotency, no-match no-op, multi-dispatch match.
- Document the hook invocation step in `lp-do-build/SKILL.md` Plan Completion section.

### Non-goals
- Modifying the `TrialQueue` in-memory class (operates purely on the queue.v1 JSON file).
- Changing the `QueueState` union type in `lp-do-ideas-trial-queue.ts` — `"completed"` is a runtime value already present in queue-state.json but not in the TypeScript union; that type gap can be addressed as a separate tidy-up.
- Touching lp-do-ideas-execution-guarantee logic (handled by a parallel agent).
- Backfilling the 5 already-stale brikette-sales-funnel-analysis dispatches (that is a data-repair task, not in scope for the hook implementation).

### Constraints & Assumptions
- Constraints:
  - Hook must be idempotent: calling it twice with the same slug must produce the same result without mutation.
  - Hook must not mutate dispatches already in `queue_state: "completed"`.
  - Atomic write (temp-rename) required — same pattern as `lp-do-ideas-persistence.ts`.
  - No in-memory queue object dependency — operates purely on the serialized queue.v1 JSON file.
  - Must be callable from the lp-do-build skill SKILL.md post-build flow as a `node --import tsx` invocation or direct TypeScript import.
- Assumptions:
  - `processed_by.fact_find_slug` is the canonical link between a dispatch and the feature slug being archived. Confirmed in queue-state.json data (see evidence below).
  - `completed_by` schema is: `{ plan_path: string; completed_at: string; outcome: string }`. Confirmed from existing completed entries.
  - The `counts` block in queue-state.json is a denormalized summary that must be recomputed on write.

## Outcome Contract

- **Why:** Build completion is not auto-synced to queue-state.json. After a plan is archived, dispatches that triggered it remain in `queue_state: "auto_executed"` indefinitely. The `counts.completed` metric therefore undercounts actual throughput and the `counts.auto_executed` count accumulates stale entries. The hook closes this gap deterministically.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** After lp-do-build archives any plan, dispatches linked to that plan by `processed_by.fact_find_slug` are automatically written to `queue_state: "completed"` with `completed_by` populated. The operation is idempotent and does not touch already-completed dispatches.
- **Source:** operator

## Access Declarations

None. All data sources are local file system reads/writes within the repository. No external APIs, databases, or credentials required.

## Evidence Audit (Current State)

### Entry Points

The lp-do-build skill SKILL.md step 7 ("Plan Completion and Archiving") defines the post-build flow order:

```
1. Produce build-record.user.md
1.5 Emit build-event.json
2. Produce results-review.user.md
2.5 Produce pattern-reflection.user.md
3. Run reflection debt emitter
4. Run bug scan
5. Run pnpm startup-loop:generate-process-improvements
6. Add completed-ideas.json entries
7. Set plan Status: Archived; archive per plan-archiving.md
8. Commit all post-build artifacts via writer lock
```

The queue-state completion hook should be inserted between step 7 (archive) and step 8 (commit), so the completed_by update is included in the single post-build commit.

No existing entry point for this hook exists. The new entry point will be:
- TypeScript module: `scripts/src/startup-loop/lp-do-ideas-queue-state-completion.ts`
- Invocation in SKILL.md: added as step 7.5 after archiving, before commit.

### Key Modules / Files

1. **`scripts/src/startup-loop/lp-do-ideas-trial-queue.ts`** — In-memory queue class and `QueueState` union type. The `QueueState` type does not include `"completed"` but the queue.v1 JSON file already uses it. The new module operates on the JSON file directly, not on the in-memory class.

2. **`docs/business-os/startup-loop/ideas/trial/queue-state.json`** — Target queue.v1 JSON file. Schema: `queue_version: "queue.v1"`, `dispatches: DispatchObject[]`, `counts: { completed, auto_executed, ... }`. Each dispatch object may carry `processed_by.fact_find_slug` and optionally `completed_by`.

3. **`scripts/src/startup-loop/lp-do-ideas-persistence.ts`** — Provides the `atomicWrite` pattern (temp file + rename) used as the canonical write approach. The new module will follow this exact pattern but will not import from this module (it operates on a different file format).

4. **`scripts/src/startup-loop/lp-do-build-event-emitter.ts`** — Reference for atomic write pattern (`writeBuildEvent()`): write to temp, rename. Confirms the idiomatic approach in this codebase.

5. **`.claude/skills/lp-do-build/SKILL.md`** — Post-build flow that needs a new step 7.5. This is a skill documentation file (markdown), not a TypeScript module.

6. **`scripts/src/startup-loop/lp-do-ideas-metrics-runner.ts`** — Reads queue-state.json in queue.v1 format. Confirms the `dispatches[]` array structure and the `processed_by` / `completed_by` pattern in real data.

### Data & Contracts

**queue.v1 dispatch object relevant fields (read from actual data):**

```typescript
interface QueueV1Dispatch {
  dispatch_id: string;
  status: string;           // "completed" | "fact_find_ready" | "auto_executed" | ...
  queue_state: string;      // "completed" | "auto_executed" | "fact_find_ready" | ...
  processed_by?: {
    fact_find_slug: string;
    fact_find_path?: string;
    processed_at: string;
    route: string;
  };
  completed_by?: {           // Written by the new hook
    plan_path: string;
    completed_at: string;
    outcome: string;
  };
  // ... other packet fields
}
```

**`completed_by` schema** confirmed from 11 existing completed entries in queue-state.json:
```json
{
  "plan_path": "docs/plans/_archive/<slug>/plan.md",
  "completed_at": "<ISO 8601 timestamp>",
  "outcome": "<plain-language summary of what was delivered>"
}
```

**`counts` block** must be recomputed on every write:
```json
{
  "enqueued": 7,
  "processed": 14,
  "skipped": 0,
  "error": 0,
  "suppressed": 0,
  "auto_executed": 90,
  "completed": 11,
  "total": 124,
  "fact_find_ready": 100
}
```

The `counts` values are derived from `dispatches[].queue_state` and `dispatches[].status`. The recompute function must iterate the full dispatches array.

**Dispatch lookup key:** `processed_by.fact_find_slug === featureSlug`. This is the confirmed canonical link (verified against 11 existing completed entries and multiple `auto_executed` entries in the queue-state.json).

### Dependency & Impact Map

- **Upstream:** `lp-do-build/SKILL.md` step 7 (archive) produces the archived plan path. The hook receives `featureSlug` and `planPath` as inputs.
- **Downstream consumers of queue-state.json:**
  - `lp-do-ideas-metrics-runner.ts` reads `dispatches[].queue_state` for metrics rollup.
  - `generate-process-improvements.ts` may read queue state for idea lifecycle reporting.
  - `docs/business-os/startup-loop/ideas/trial/queue-state.json` is committed to git — downstream consumers include any tooling reading the repo.
- **No in-memory queue object involved** — the hook operates purely on the JSON file.
- **Blast radius:** narrow. Only dispatches matching the provided `featureSlug` are mutated. Already-completed dispatches are skipped (idempotency guard). Other queue entries are untouched.
- **No cyclic dependency risk.** The new module (`lp-do-ideas-queue-state-completion.ts`) has no imports from the lp-do-build skill itself, only from Node.js built-ins and potentially `lp-do-ideas-persistence.ts` for the atomic write helper.

### Test Landscape

**Existing tests for related modules:**
- `scripts/src/startup-loop/__tests__/lp-do-ideas-trial-queue.test.ts` (1190 lines) — covers in-memory `TrialQueue` class; does not cover the queue.v1 JSON file mutation.
- `scripts/src/startup-loop/__tests__/lp-do-ideas-persistence.test.ts` — covers `persistOrchestratorResult`, `loadQueueState`, `appendTelemetry`. Does not cover queue.v1 format (that format is read by `lp-do-ideas-metrics-runner.ts`, not by `lp-do-ideas-persistence.ts`).

**Coverage gaps for the new hook:**
- No test exists for writing `completed_by` to queue-state.json.
- No test for idempotency on re-run.
- No test for multi-dispatch match (multiple dispatches with the same `fact_find_slug`).

**Required new tests** (in `scripts/src/startup-loop/__tests__/lp-do-ideas-queue-state-completion.test.ts`):
- TC-01: Normal match — one dispatch with matching `fact_find_slug`, `auto_executed` state → written to `completed`, `completed_by` populated.
- TC-02: Idempotency — same call twice with same slug → second call is a no-op; `completed_by` not overwritten.
- TC-03: No-match no-op — slug not present in any dispatch → file unchanged (or `counts` unchanged).
- TC-04: Multi-dispatch match — two dispatches with same `fact_find_slug` → both written to `completed`.
- TC-05: Already-completed guard — dispatch already in `completed` state → skipped (not mutated).
- TC-06: Counts recomputed correctly after write.

**Testability constraints:**
- Tests must write to a temp file (not the live queue-state.json). Use `os.tmpdir()` + random suffix pattern from `lp-do-ideas-persistence.ts`.
- Clock should be injectable for deterministic `completed_at` timestamps.

### Recent Git History (Targeted)

```
cb80017ff6  fix(caryina): support first-write inventory updates
3e549ddbf3  chore: checkpoint pending workspace updates
d9f9d45a82  feat(naming-pipeline): Wave 2 — tm-prescreen-cli.ts + scored candidates
```

`lp-do-ideas-trial-queue.ts` was last touched in commit `c3ddf5e939` (feat xa-ci Wave 4 — XA CI deploy jobs and CHECKPOINT). The change added `CHECKPOINT` routing logic in the build skill, not changes to the queue data structures; no conflict with the new completion hook. `lp-do-ideas-persistence.ts` and `lp-do-ideas-metrics-runner.ts` are untouched recently. Merge risk is low.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| queue.v1 JSON schema (dispatches, counts, processed_by, completed_by) | Yes — verified from 11 existing completed entries | None | No |
| Dispatch lookup key (processed_by.fact_find_slug) | Yes — confirmed in all 11 existing completed entries | None | No |
| Atomic write pattern | Yes — confirmed in lp-do-ideas-persistence.ts and lp-do-build-event-emitter.ts | None | No |
| Idempotency contract | Yes — `completed_by` present → skip; QueueState "completed" → skip | None | No |
| counts recomputation | Yes — counts derived from dispatches[].queue_state; must be recomputed | None | No |
| SKILL.md hook insertion point (step 7.5) | Yes — between archive (step 7) and commit (step 8) | None | No |
| Test coverage (new test file required) | Yes — 6 TC cases defined | None | No |
| Type contract (QueueState union missing "completed") | Partial — "completed" is used in production JSON but not in TypeScript type | Minor: type gap; new module can use string widening or a local extension; does not block | No |
| Impact on lp-do-ideas-metrics-runner.ts | Yes — metrics-runner reads queue_state as string; "completed" is already handled | None | No |

No critical simulation findings. One minor advisory: the `QueueState` union does not include `"completed"`. The new module will use `string` for the queue_state field when operating on queue.v1 dispatches, which avoids a type regression. A follow-up tidy-up to add `"completed"` to the union is out of scope for this build.

## Scope Signal

Signal: right-sized

Rationale: The change is narrowly scoped — one new TypeScript module (~100 lines), one new test file (~150 lines), one SKILL.md step insertion (~5 lines). All contracts are verified from existing data. No architectural changes required. The "completed" state is already present in production queue-state.json entries; this build merely automates what was previously a manual write.

## Confidence Inputs

- **Implementation:** 90 — All data structures, lookup keys, and write patterns are fully confirmed from existing production data. The only minor gap is the QueueState type union (advisory, does not block implementation).
- **Approach:** 92 — The approach (new standalone module, atomic write, counts recompute, step 7.5 insertion) is proven by 3 existing analogous modules in the same package.
- **Impact:** 85 — Completion rate metrics will reflect true throughput after the hook is added. The 5 stale brikette-sales-funnel-analysis dispatches are not backfilled by this build (separate data-repair task), so the initial delta is modest.
- **Delivery-Readiness:** 92 — Evidence floor met. Entry point, data contract, test plan, and hook insertion point are all confirmed.
- **Testability:** 92 — Standard Node.js file I/O testable with temp files; injectable clock pattern established by existing test files.

What raises each score to >= 90:
- Implementation: already 90; rises to 95 if `QueueState` type union is extended in the same PR.
- Impact: rises to 90 once the stale-dispatch backfill is executed (separate task).

## Risks

1. **Incomplete counts recompute** — If the recompute logic misses a `queue_state` value variant present in production JSON but not enumerated in the function, counts will drift silently. Mitigation: enumerate only the schema-stable keys that already exist in the `counts` block (`enqueued`, `processed`, `skipped`, `error`, `suppressed`, `auto_executed`, `completed`, `total`, `fact_find_ready`). Unknown variants are ignored (not added as new keys) to keep the counts shape stable for downstream consumers.

2. **Hook invoked before archive step completes** — If SKILL.md step 7 (archive) is partially complete when the hook fires, `plan_path` may be incorrect. Mitigation: hook is invoked as step 7.5, after `git mv` confirms success; plan path is passed as an explicit argument.

3. **Multiple fact_find_slug matches across different business contexts** — A `fact_find_slug` could theoretically match dispatches for two different businesses. Mitigation: the hook should accept an optional `business` filter and, if provided, restrict mutation to matching business + slug combinations.

4. **queue-state.json grows unboundedly** — The hook does not address the accumulation of stale entries. Mitigation: out of scope; noted as a future tidy-up.

5. **Concurrent write collision** — Two parallel agents invoking the hook simultaneously could produce a lost-update race. Mitigation: the hook (step 7.5) and the post-build commit (step 8) must both execute inside the writer lock scope. The writer lock must be acquired before step 7.5 fires, not only at commit time. The SKILL.md update for this build will explicitly state that the writer lock scope covers steps 7.5 through 8 (hook write + commit as a single atomic unit).

## Evidence Gap Review

### Gaps Addressed
- Queue.v1 schema confirmed from live file. Observed fact: the live file has 128 dispatch objects in the `dispatches[]` array but `counts.total` reads 124 — a drift of 4 entries. Root cause is not fully traced; it is consistent with the queue.v1 file being hand-managed (new dispatches appended without triggering a counts recompute). The recompute function must always derive counts from the live `dispatches[]` array, not from the existing `counts` block.
- `completed_by` structure confirmed from 11 existing completed entries.
- `processed_by.fact_find_slug` as lookup key confirmed from all 11 completed entries.
- Atomic write pattern confirmed from `lp-do-ideas-persistence.ts` and `lp-do-build-event-emitter.ts`.
- SKILL.md insertion point confirmed from lp-do-build/SKILL.md step-by-step post-build flow.

### Confidence Adjustments
No downward adjustments required. All material evidence confirmed.

### Remaining Assumptions
- The `completed_by.outcome` field will be populated by the build skill with a plain-language summary of what was delivered; the hook module accepts `outcome: string` as a caller-provided parameter rather than auto-generating it.
- The `status` field on a dispatch (distinct from `queue_state`) is also set to `"completed"` for fully-completed entries (confirmed from existing data). The hook must write both `status` and `queue_state`.
