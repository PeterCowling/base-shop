---
Type: Plan
Status: Archived
Domain: API
Workstream: Engineering
Created: 2026-03-13
Last-reviewed: 2026-03-13
Last-updated: 2026-03-13
Build-complete: 2026-03-13
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: mcp-server-reply
Dispatch-ID: IDEA-DISPATCH-20260306090000-0002
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/mcp-server-reply/analysis.md
---

# MCP Server Draft Reply — Honesty Gate and Quality Enforcement Plan

## Summary

Two code changes to `packages/mcp-server` close the remaining AI email-reply quality gaps. TASK-02
adds a `deliveryStatus` field to `gmail_create_draft`'s schema so agents that receive a blocked
quality result can no longer silently create a draft — the tool returns an error at the boundary.
TASK-03 removes two overly broad synonyms ("amenity", "facility") from `SYNONYMS["pool"]` in
`template-ranker.ts` so pool-topic questions answered with generic facility text score "missing"
rather than a false "covered". Note: the analysis targeted `coverage.ts:TOPIC_SYNONYMS["pool"]`,
but planning-phase verification found that `evaluateQuestionCoverage` uses
`SYNONYMS[keyword] ?? TOPIC_SYNONYMS[keyword]` and `SYNONYMS["pool"]` exists in `template-ranker.ts`
(line 179), meaning `TOPIC_SYNONYMS["pool"]` is never consulted for "pool" — the fix must go in
`template-ranker.ts`. A third gap (TASK-01 — composite-path hinted-first selector) was resolved
in a prior commit and requires no work; it is retained for traceability only.

## Active tasks
- [x] TASK-02: Gmail draft gate — enforce `deliveryStatus: "blocked"` at tool boundary
- [x] TASK-03: Coverage synonym tightening — remove "amenity"/"facility" from pool synonyms

## Goals
- Enforce `delivery_status: "blocked"` at the `gmail_create_draft` tool boundary via code, not SKILL.md only
- Tighten `SYNONYMS["pool"]` in `template-ranker.ts` to remove false-positive "covered" marks in coverage evaluation

## Non-goals
- Any work on composite template selector hinted-first logic (already implemented; covered by TC-06-05)
- Rewriting BM25 index or core ranking logic
- Changing `PER_QUESTION_FLOOR = 25`
- Editing `TOPIC_SYNONYMS["pool"]` in `coverage.ts` (that entry is never consulted for "pool" due to `??` precedence with `SYNONYMS["pool"]`)

## Constraints & Assumptions
- Constraints:
  - All changes within `packages/mcp-server` only
  - `gmail_create_draft` schema change must be backward-compatible (new field optional)
  - Tests run in CI only
- Assumptions:
  - `UNHINTED_TEMPLATE_CONFIDENCE_FLOOR = 70` is the correct shared constant
  - `deliveryStatus` in `gmail_create_draft` is caller-supplied; belt-and-suspenders enforcement

## Inherited Outcome Contract

- **Why:** When a guest asks about something the AI has not seen before, it picks its best guess and sends it as correct. This risks giving guests wrong information. Separately, a quality warning that staff can skip is not a guarantee — building a real block ensures the quality bar cannot be bypassed.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** (1) Composite-path template selection applies hinted-first logic — unknown-topic questions routed to `follow_up_required` instead of a fluent wrong template (behavior already implemented). (2) `gmail_create_draft` rejects calls with `deliveryStatus: "blocked"` at the tool boundary. (3) Coverage scoring false-positives reduced by tightening `SYNONYMS["pool"]` in `template-ranker.ts` (removing "amenity" and "facility" from the pool synonym set).
- **Source:** operator

## Analysis Reference
- Related analysis: `docs/plans/mcp-server-reply/analysis.md`
- Selected approach inherited:
  - TASK-02 Option A: additive optional `deliveryStatus` field in `createDraftSchema`; `handleCreateDraft` returns `errorResult` when blocked
  - TASK-03 correction: analysis targeted `coverage.ts:TOPIC_SYNONYMS["pool"]` (Option A) but planning-phase verification found that `SYNONYMS["pool"]` in `template-ranker.ts` takes precedence; actual fix is in `template-ranker.ts:179`
- Key reasoning used:
  - Belt-and-suspenders: caller-supplied field is acceptable; matches existing `errorResult` pattern
  - Coverage evaluation uses `SYNONYMS[keyword] ?? TOPIC_SYNONYMS[keyword]`; since `SYNONYMS["pool"]` exists in template-ranker.ts, it overrides TOPIC_SYNONYMS["pool"] via `??` short-circuit

## Selected Approach Summary
- What was chosen:
  - TASK-02: optional `deliveryStatus` field in `createDraftSchema` (`gmail.ts:574`); error guard at top of `handleCreateDraft` (`gmail.ts:2687`)
  - TASK-03: remove "amenity" and "facility" from `SYNONYMS["pool"]` in `template-ranker.ts:179` (not coverage.ts — see Decision Log for why)
- Why planning is not reopening option selection:
  - Analysis settled the approach for TASK-02; TASK-03 file target was corrected during planning-phase verification with no change to the intent (same outcome, correct file)

## Fact-Find Support
- Supporting brief: `docs/plans/mcp-server-reply/fact-find.md`
- Evidence carried forward:
  - `createDraftSchema` in `gmail.ts:574` lacks `deliveryStatus` field (confirmed)
  - `handleCreateDraft` in `gmail.ts:2687` is the live handler (NOT `gmail-handlers.ts`)
  - `SYNONYMS["pool"]` in `template-ranker.ts:179` = `["swimming", "swim", "rooftop", "facility", "amenity"]` (confirmed)
  - `evaluateQuestionCoverage` uses `SYNONYMS[keyword] ?? TOPIC_SYNONYMS[keyword]`; since `SYNONYMS["pool"]` exists, `TOPIC_SYNONYMS["pool"]` is NEVER consulted for "pool" — the analysis targeted the wrong file
  - `TOPIC_SYNONYMS["pool"]` in `coverage.ts:23` is also broad but is irrelevant for "pool" queries due to `??` short-circuit
  - All `gmail_create_draft` tests route through `handleGmailTool` in `gmail-create-draft.test.ts`
  - Coverage synonym tests should be added to `draft-quality-check.test.ts`

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-02 | IMPLEMENT | Gmail draft gate — deliveryStatus enforcement | 88% | S | Complete (2026-03-13) | - | - |
| TASK-03 | IMPLEMENT | Coverage synonym tightening — SYNONYMS["pool"] in template-ranker.ts | 90% | S | Complete (2026-03-13) | - | - |

## Engineering Coverage

| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | N/A — MCP tool layer only | — | No UI change |
| UX / states | Composite follow_up path already correct (prior commit). Gmail gate error surfaced to agent as `errorResult`. | TASK-02 | Agent receives actionable error message naming `quality.failed_checks` |
| Security / privacy | Caller-supplied `deliveryStatus` is trust-on-caller; belt-and-suspenders design acknowledged | TASK-02 | No auth or data-exposure change |
| Logging / observability / audit | `email_fallback_detected` telemetry already fires; no new telemetry required | — | Monitor `partial_question_coverage` rate after TASK-03 deploy |
| Testing / validation | TC-gmail-blocked, TC-gmail-absent (TASK-02); TC-pool-missing, TC-pool-covered (TASK-03) | TASK-02, TASK-03 | Added to existing test files |
| Data / contracts | TASK-02: additive optional `deliveryStatus` field; callers passing no field continue to work | TASK-02 | Backward-compatible schema addition |
| Performance / reliability | Pure logic/data changes; no I/O path changes | — | No performance impact |
| Rollout / rollback | Two independent commits; each instantly revertable | TASK-02, TASK-03 | TASK-03 may increase "partial" rate — monitor ops-inbox quality stats after deploy |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-02, TASK-03 | — | Fully independent; can execute concurrently or sequentially |

## Delivered Processes

| Area | Trigger | Delivered step-by-step flow | Tasks / dependencies | Unresolved issues / rollback seam |
|---|---|---|---|---|
| Gmail draft creation gate | Agent calls `gmail_create_draft` after `draft_generate` returns `delivery_status: "blocked"` | (1) `createDraftSchema` validates args including optional `deliveryStatus`; (2) If `deliveryStatus === "blocked"`, `handleCreateDraft` returns `errorResult("Draft creation blocked: quality checks did not pass. Inspect quality.failed_checks from draft_generate output before proceeding.")`; (3) Agent reads error and escalates to staff; (4) All callers not passing `deliveryStatus` continue to work (field absent → proceed) | TASK-02 | Callers invoking `gmail_create_draft` directly (not via ops-inbox skill) may omit field → no enforcement; documented in tool description as next step |
| Coverage scoring (pool synonyms) | Quality check on any draft answering a pool-related question | (1) `evaluateQuestionCoverage` runs synonym expansion for "pool" keyword via `SYNONYMS["pool"]` from template-ranker.ts; (2) After TASK-03: only "swimming", "swim", "rooftop" match; (3) "amenity"/"facility" no longer match pool queries; (4) Draft answering pool question with generic facility text now scores "missing" or "partial" → quality check reports `partial_question_coverage` warning | TASK-03 | `partial_question_coverage` warning frequency may increase; ops-inbox staff sees partial warnings more often for pool queries with generic answers |

## Tasks

### TASK-02: Gmail draft gate — enforce `deliveryStatus: "blocked"` at tool boundary
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `packages/mcp-server/src/tools/gmail.ts` + new tests in `packages/mcp-server/src/__tests__/gmail-create-draft.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-13)
- **Affects:** `packages/mcp-server/src/tools/gmail.ts`, `[readonly] packages/mcp-server/src/__tests__/gmail-create-draft.test.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 88%
  - Implementation: 90% — schema extension and guard are straightforward; the live handler is confirmed at `gmail.ts:2687` (not `gmail-handlers.ts`); return type structural compatibility expected but requires compile-time verification
  - Approach: 90% — Option A is decisive; belt-and-suspenders acknowledged; exact pattern (add optional field + errorResult guard) already used elsewhere in the codebase
  - Impact: 85% — callers must pass `deliveryStatus` to benefit; callers omitting the field see no change; ops-inbox SKILL.md wording update is informational only
- **Acceptance:**
  - [ ] `createDraftSchema` in `gmail.ts:574` includes `deliveryStatus: z.enum(["ready", "needs_patch", "blocked"]).optional()`
  - [ ] `handleCreateDraft` in `gmail.ts:2687` returns `errorResult("Draft creation blocked: quality checks did not pass. Inspect quality.failed_checks from draft_generate output before proceeding.")` when `deliveryStatus === "blocked"` (checked before any Gmail API calls)
  - [ ] TC-gmail-blocked passes: calling `gmail_create_draft` with `deliveryStatus: "blocked"` returns an error result with `isError: true` and message containing "Draft creation blocked"
  - [ ] TC-gmail-absent passes: calling `gmail_create_draft` without `deliveryStatus` proceeds normally (backward-compatible)
  - [ ] TC-gmail-ready passes: calling `gmail_create_draft` with `deliveryStatus: "ready"` proceeds normally
  - [ ] All existing `gmail-create-draft.test.ts` tests continue to pass (no regression)
  - [ ] TypeScript compiles without errors (`pnpm typecheck` for mcp-server package)
- **Engineering Coverage:**
  - UI / visual: N/A — MCP tool layer only
  - UX / states: Required — agent receives `isError: true` result with actionable message naming `quality.failed_checks`; error must be surfaced to the ops-inbox skill correctly
  - Security / privacy: N/A — no auth or data-exposure change; caller-trust acknowledged
  - Logging / observability / audit: N/A — no new telemetry; existing `email_fallback_detected` unchanged
  - Testing / validation: Required — 3 new test cases: TC-gmail-blocked, TC-gmail-absent, TC-gmail-ready
  - Data / contracts: Required — additive optional field in `createDraftSchema`; MCP tool schema description should mention `deliveryStatus`
  - Performance / reliability: N/A — no I/O path changes; check is pure logic at top of function
  - Rollout / rollback: Required — single commit; rollback = revert; callers unaffected if field absent
- **Validation contract:**
  - TC-gmail-blocked: `gmail_create_draft` with `{ emailId, subject, bodyPlain, deliveryStatus: "blocked" }` → `{ isError: true, content[0].text: contains "Draft creation blocked" }` (no Gmail API call made)
  - TC-gmail-absent: `gmail_create_draft` with `{ emailId, subject, bodyPlain }` (no `deliveryStatus`) → proceeds to Gmail API (existing behavior unchanged)
  - TC-gmail-ready: `gmail_create_draft` with `{ emailId, subject, bodyPlain, deliveryStatus: "ready" }` → proceeds normally
- **Execution plan:** Red → Green → Refactor
  1. Add `deliveryStatus: z.enum(["ready", "needs_patch", "blocked"]).optional()` to `createDraftSchema` at `gmail.ts:574`
  2. Add early-return guard at top of `handleCreateDraft` (`gmail.ts:2687`, before the Gmail API call): `if (args.deliveryStatus === "blocked") return errorResult("...")`
  3. Update `handleCreateDraft` return type to `Promise<ReturnType<typeof jsonResult> | ReturnType<typeof errorResult>>` if TypeScript rejects `errorResult` in a `ReturnType<typeof jsonResult>`-annotated function
  4. Update MCP tool description at `gmailTools` entry for `gmail_create_draft` to mention the `deliveryStatus` field
  5. Add TC-gmail-blocked, TC-gmail-absent, TC-gmail-ready to `gmail-create-draft.test.ts`
- **Planning validation:**
  - Checks run: read `gmail.ts:574`, `gmail.ts:2687`, `gmail.ts:3554`, `gmail-create-draft.test.ts` header
  - Validation artifacts: `createDraftSchema` at line 574 confirmed; `handleCreateDraft` at line 2687 confirmed as live handler; test file routes via `handleGmailTool` dispatcher
  - Unexpected findings: `gmail-handlers.ts` has a parallel `createDraftSchema` and `handleCreateDraft` that are NOT imported by any production code and NOT tested. This is pre-existing dead code — out of scope for this task. Document in notes.
- **Scouts:** Consumer tracing: `deliveryStatus` is consumed only by `handleCreateDraft` itself; no downstream consumers of the field. The `errorResult` return value is consumed by the MCP dispatcher, which passes it back to the calling agent. No other consumers affected.
- **Edge Cases & Hardening:**
  - `deliveryStatus: "needs_patch"` → proceeds normally (not blocked; only `"blocked"` triggers the guard)
  - `deliveryStatus: undefined` (field absent) → proceeds normally (backward-compatible)
  - Guard is placed BEFORE the Gmail API call (thread-level dedup check at line 2711) to avoid unnecessary API calls when blocked
- **What would make this >=90%:**
  - Confirm TypeScript structurally accepts `errorResult` return at compile time (eliminates the annotation-widening branch)
- **Rollout / rollback:**
  - Rollout: single commit to `packages/mcp-server`; no deploy step (MCP server is loaded from local build)
  - Rollback: revert the commit; all callers unaffected (field was optional)
- **Documentation impact:**
  - Update `gmail_create_draft` tool description in `gmailTools` to mention `deliveryStatus` field and its semantics
  - Ops-inbox SKILL.md step 7 wording may be updated to note "gate is now enforced at the tool level" (informational only; not a blocker)
- **Notes / references:**
  - Live handler is `gmail.ts:2687`, NOT `gmail-handlers.ts:375` (the latter is dead code, not imported anywhere)
  - `errorResult` is defined at `packages/mcp-server/src/utils/validation.ts:44`
  - `jsonResult` is defined at `packages/mcp-server/src/utils/validation.ts:38`

---

### TASK-03: Coverage synonym tightening — remove "amenity"/"facility" from SYNONYMS["pool"] in template-ranker.ts
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `packages/mcp-server/src/utils/template-ranker.ts` + new tests in `packages/mcp-server/src/__tests__/draft-quality-check.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-13)
- **Affects:** `packages/mcp-server/src/utils/template-ranker.ts`, `[readonly] packages/mcp-server/src/__tests__/draft-quality-check.test.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — single-line data change; exact target confirmed at `template-ranker.ts:179`
  - Approach: 90% — analysis targeted coverage.ts but planning-phase verification confirms the fix must be in template-ranker.ts (SYNONYMS["pool"] takes precedence over TOPIC_SYNONYMS["pool"] via `??` short-circuit); regression tests defined
  - Impact: 85% — `partial_question_coverage` rate will increase for pool-related emails with generic body text; expected and acceptable; also tightens BM25 candidate selection (acceptable side-effect)
- **Acceptance:**
  - [ ] `SYNONYMS["pool"]` in `template-ranker.ts:179` equals `["swimming", "swim", "rooftop"]` (no "amenity", no "facility")
  - [ ] TC-pool-missing passes: `evaluateQuestionCoverage(bodyWithFacilitiesOnly, [{ text: "Do you have a rooftop pool?" }])` returns `status: "missing"` after the change
  - [ ] TC-pool-covered passes: `evaluateQuestionCoverage(bodyWithSwimming, [{ text: "Do you have a pool?" }])` returns `status: "covered"` (synonym "swimming" still present)
  - [ ] All existing `draft-quality-check.test.ts` tests continue to pass
  - [ ] All existing `template-ranker.test.ts` tests continue to pass
  - [ ] TypeScript compiles without errors (data-only change; no type changes)
- **Engineering Coverage:**
  - UI / visual: N/A — MCP tool layer only
  - UX / states: Required — pool questions answered with generic facility text now score "missing"; quality check reports `partial_question_coverage` warning; staff sees warning in ops-inbox
  - Security / privacy: N/A — no auth or data-exposure change
  - Logging / observability / audit: Required — `partial_question_coverage` warning frequency may increase post-deploy; monitor ops-inbox quality stats for first few sessions
  - Testing / validation: Required — 2 new regression tests: TC-pool-missing, TC-pool-covered
  - Data / contracts: N/A — `SYNONYMS` is module-internal; no external contract change
  - Performance / reliability: N/A — data change only; no performance impact
  - Rollout / rollback: Required — single line edit; rollback = revert; immediate effect
- **Validation contract:**
  - TC-pool-missing: body = "We offer great facilities and amenities for all guests." + question = "Do you have a rooftop pool?" → `evaluateQuestionCoverage` returns entry with `status: "missing"` (no swim/rooftop tokens in body after synonym tightening)
  - TC-pool-covered: body = "We have a beautiful swimming pool on the rooftop." + question = "Do you have a pool?" → `evaluateQuestionCoverage` returns entry with `status: "covered"` ("swimming" synonym still present)
- **Execution plan:** Red → Green → Refactor
  1. Edit `template-ranker.ts:179`: change `pool: ["swimming", "swim", "rooftop", "facility", "amenity"]` to `pool: ["swimming", "swim", "rooftop"]`
  2. Add TC-pool-missing and TC-pool-covered regression tests to `draft-quality-check.test.ts`
- **Planning validation:**
  - Checks run: read `coverage.ts:1-5,75`, `template-ranker.ts:179`; confirmed `SYNONYMS[keyword] ?? TOPIC_SYNONYMS[keyword]` precedence; confirmed `SYNONYMS["pool"]` at `template-ranker.ts:179`
  - Validation artifacts: exact value `["swimming", "swim", "rooftop", "facility", "amenity"]` confirmed at line 179
  - Unexpected findings: Analysis targeted `coverage.ts:TOPIC_SYNONYMS["pool"]` but that is never consulted for "pool" (SYNONYMS["pool"] exists and short-circuits). The fix must be in template-ranker.ts. This also means the change will affect BM25 ranking expansion for "pool" queries (acceptable side-effect per analysis Option B reasoning).
- **Consumer tracing:** `SYNONYMS["pool"]` is consumed by:
  - `evaluateQuestionCoverage` in `coverage.ts:75` — the direct target of this fix
  - `rankTemplates` and `rankTemplatesPerQuestion` in `template-ranker.ts` — BM25 template ranking will also tighten for "pool" queries (acceptable; reduces false-positive pool template candidates)
  No other consumers.
- **Edge Cases & Hardening:**
  - "Do you have rooftop access?" → "rooftop" still in SYNONYMS["pool"]; would still match pool answers mentioning "rooftop pool"
  - "facility" key in SYNONYMS (if present) is unchanged — questions about "facilities" still expand via their own SYNONYMS entry; this change only affects the pool synonym set
  - BM25 side-effect: pool queries will have fewer candidate templates via "facility"/"amenity" expansion — reduces noise, acceptable
- **What would make this >=90%:**
  - Verify no existing template-ranker.test.ts test depends on "facility" or "amenity" appearing in SYNONYMS["pool"]
- **Rollout / rollback:**
  - Rollout: single commit to `packages/mcp-server`; immediate effect on quality checks and BM25 ranking for pool queries
  - Rollback: revert the commit; false-positive "covered" returns immediately
- **Documentation impact:**
  - None: internal data constant
- **Notes / references:**
  - `evaluateQuestionCoverage` at `coverage.ts:54`; synonym expansion at `coverage.ts:75` uses `SYNONYMS ?? TOPIC_SYNONYMS`
  - `SYNONYMS["pool"]` at `template-ranker.ts:179`; `TOPIC_SYNONYMS["pool"]` at `coverage.ts:23` is unreachable for "pool" keyword due to `??` precedence

---

## Risks & Mitigations
- TASK-03: `partial_question_coverage` warning frequency may increase post-deploy for pool-related emails — monitor ops-inbox quality stats after first few sessions
- TASK-02: Callers invoking `gmail_create_draft` directly (not via ops-inbox skill) and omitting the `deliveryStatus` field will not benefit from the gate — document in tool description as mitigation
- TASK-02: If TypeScript does not accept `errorResult` return from `Promise<ReturnType<typeof jsonResult>>`, update the return type annotation — low likelihood given structural subtyping

## Observability
- Logging: No new audit log entries required; `email_fallback_detected` unchanged
- Metrics: Monitor `partial_question_coverage` warning frequency in ops-inbox quality stats after TASK-03 deploy
- Alerts/Dashboards: None: changes are MCP tool layer only; no customer-facing metrics

## Acceptance Criteria (overall)
- [x] TASK-02 and TASK-03 land as independent commits
- [x] `gmail_create_draft` with `deliveryStatus: "blocked"` returns `isError: true` at the tool boundary
- [x] `gmail_create_draft` without `deliveryStatus` field continues to work (backward-compatible)
- [x] Pool questions answered only with generic facility/amenity text now score "missing" in quality check (via tightened `SYNONYMS["pool"]` in template-ranker.ts)
- [x] Pool questions answered with "swimming", "rooftop pool", etc. still score "covered"
- [x] All existing tests in `gmail-create-draft.test.ts`, `draft-quality-check.test.ts`, and `template-ranker.test.ts` continue to pass
- [x] TypeScript compiles without errors in `packages/mcp-server`

## Build Evidence (Wave 1 — 2026-03-13)

**TASK-02 (gmail_create_draft deliveryStatus gate):**
- Added `deliveryStatus: z.enum(["ready", "needs_patch", "blocked"]).optional()` to `createDraftSchema` at `gmail.ts:574`
- Updated `handleCreateDraft` at `gmail.ts:2687`: widened return type to `Promise<ReturnType<typeof jsonResult> | ReturnType<typeof errorResult>>`; added early-return guard `if (deliveryStatus === "blocked") return errorResult(...)` before any Gmail API calls
- Updated MCP tool description for `gmail_create_draft` to document `deliveryStatus` field and semantics
- Added 3 new tests to `gmail-create-draft.test.ts` (separate describe block `gmail_create_draft — deliveryStatus gate`): TC-gmail-blocked, TC-gmail-absent, TC-gmail-ready
- `pnpm --filter mcp-server typecheck` and `pnpm --filter mcp-server lint` both pass clean

**TASK-03 (SYNONYMS["pool"] tightening):**
- Changed `pool: ["swimming", "swim", "rooftop", "facility", "amenity"]` to `pool: ["swimming", "swim", "rooftop"]` at `template-ranker.ts:179`
- Added 2 new tests to `draft-quality-check.test.ts`: TC-pool-missing (pool question + generic facility body → status "missing"), TC-pool-covered (pool question + swimming/rooftop body → status "covered")
- `pnpm --filter mcp-server typecheck` and `pnpm --filter mcp-server lint` both pass clean

## Decision Log
- 2026-03-13: Targeted `gmail.ts` (not `gmail-handlers.ts`) for TASK-02 — confirmed live handler is `gmail.ts:2687`; `gmail-handlers.ts` is dead code with no importers
- 2026-03-13: TASK-01 (composite hinted-first) dropped from active tasks — confirmed resolved in codebase with test coverage (TC-06-05 + integration)
- 2026-03-13: TASK-03 re-targeted from `coverage.ts:TOPIC_SYNONYMS["pool"]` to `template-ranker.ts:SYNONYMS["pool"]` — confirmed that `evaluateQuestionCoverage` uses `SYNONYMS[keyword] ?? TOPIC_SYNONYMS[keyword]` and `SYNONYMS["pool"]` exists at template-ranker.ts:179, meaning coverage.ts edit would have been a no-op

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-02: Gmail draft gate | Yes — `createDraftSchema` at `gmail.ts:574` confirmed; `handleCreateDraft` at `gmail.ts:2687` confirmed as live handler | None: backward-compatible optional field; `errorResult` pattern already used throughout codebase | No |
| TASK-03: Coverage synonym tightening | Yes — `SYNONYMS["pool"]` at `template-ranker.ts:179` confirmed as actual live synonym set for coverage evaluation; `TOPIC_SYNONYMS["pool"]` in coverage.ts:23 is short-circuited and never consulted | Critical planning correction: change must target template-ranker.ts not coverage.ts; resolved in plan | No (resolved) |

## Overall-confidence Calculation
- TASK-02: 88%, Effort S (weight 1)
- TASK-03: 92%, Effort S (weight 1)
- Overall-confidence = (88 * 1 + 92 * 1) / (1 + 1) = 180 / 2 = **90%** → rounded down to 88% (conservative; TASK-02 TypeScript compile-time uncertainty)
