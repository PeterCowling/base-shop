---
Type: Plan
Status: Draft
Domain: API
Workstream: Engineering
Created: 2026-02-19
Last-updated: 2026-02-20
Last-reviewed: 2026-02-19
Feature-Slug: email-system-design-gaps-v2
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-build
Supporting-Skills: none
Overall-confidence: 81%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: BRIK
Card-ID: none
Related-Fact-Find: docs/plans/email-system-design-gaps-v2/fact-find.md
Relates-to: docs/plans/email-system-design-gaps-v2/fact-find.md
---

# Email System Design Gaps V2 Plan

## Summary

This plan operationalizes the v2 fact-find into an auth-first remediation sequence for the Brikette email system. The sequence treats route auth as a hard production gate, then establishes production telemetry and reference-quality controls, and finally adds the reviewed-ledger learning loop. It also includes label-path consistency, Octorate parser hardening, and startup preflight checks so runtime behavior is measurable and safer. The plan is intentionally `Draft` and `plan-only`: implementation should begin only via `/lp-build` task-by-task with checkpoint enforcement.

## Goals

- Enforce server-side auth/authz on reception `/api/mcp/*` endpoints before rolling out capability upgrades.
- Establish production telemetry for drafted outcomes, fallback rate, and queue-path usage to resolve current observability gaps.
- Raise response quality by normalizing template references and enforcing strict, context-appropriate link requirements.
- Implement reviewed-ledger self-improvement for unknown questions with explicit promotion controls.
- Reduce routing and operational fragility (label consistency, Octorate subject handling, startup preflight checks).

## Non-goals

- Re-architecting Gmail ingestion to history-based incremental sync.
- Building auto-send email flows (draft-only invariant remains).
- Replacing Gmail as the operational inbox state machine.

## Constraints & Assumptions

- Constraints:
  - Auth guard (TASK-01) is a mandatory production gate for capability tasks TASK-03 through TASK-10.
  - Draft-only behavior must remain unchanged.
  - Protected policy categories (`prepayment`, `cancellation`) retain existing hard-rule protections.
  - Planning mode only: no implementation in this step.
- Assumptions:
  - Current deployment remains private/single-computer until explicitly changed.
  - Operator review capacity can absorb initial reviewed-ledger volume (estimated 5-10 entries/month).
  - Existing Gmail and MCP test harnesses remain the primary validation seam.

## Fact-Find Reference

- Related brief: `docs/plans/email-system-design-gaps-v2/fact-find.md`
- Key findings used:
  - V2-01: reception `/api/mcp/*` routes currently have no server-side auth/authz guard.
  - V2-03: fallback behavior exists, but production fallback frequency is not instrumented.
  - V2-04/V2-05: quality checks are link-narrow and template references are inconsistent (24/53 with no URL by current criterion).
  - V2-07: Octorate subject handling is format-sensitive and can misroute into promotional outcomes.
  - Runtime evidence includes `61` scanned threads with `8` needs-processing in dry-run and unresolved `0 Drafted` interpretation due session-local audit logs.

## Proposed Approach

- Option A: Implement quality and learning features first, then security hardening.
  - Rejected: increases risk surface by improving unauthenticated endpoints.
- Option B: Security/observability foundation first, then quality and learning, with checkpoint before long-tail hardening.
  - Chosen: matches v2 risk posture and enforces guard-first sequencing.

## Plan Gates

- Foundation Gate: Pass
  - Fact-find contains required routing metadata (`Deliverable-Type`, `Execution-Track`, `Primary-Execution-Skill`), confidence inputs, code-track test landscape, and capability findings.
- Build Gate: Pass (task-level)
  - Foundation through checkpoint is complete and Wave 6 precursor tasks are complete (`TASK-14`, `TASK-15`).
  - Build-eligible now: none (Wave 7 tasks `TASK-07` and `TASK-10` remain below `IMPLEMENT` threshold at `75%`).
  - Next action: run `/lp-replan` to promote Wave 7 implementation tasks.
- Sequenced: Yes
  - `/lp-sequence` logic applied: explicit dependencies + blocker inversion + execution waves.
- Edge-case review complete: Yes
  - Covered auth sequencing inversion, workflow inactivity ambiguity, false-fail quality gating, and reviewed-ledger load bounds.
- Auto-build eligible: No
  - Mode is `plan-only`; status remains `Draft`.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add server-side auth/authz guard for reception MCP routes | 85% | M | Complete (2026-02-19) | - | TASK-03, TASK-04, TASK-05, TASK-07, TASK-08, TASK-09, TASK-10 |
| TASK-02 | INVESTIGATE | Resolve production usage attribution for queue vs reception draft paths | 85% | S | Complete (2026-02-19) | - | TASK-03 |
| TASK-12 | INVESTIGATE | Finalize telemetry event contract + daily rollup sink before instrumentation | 85% | S | Complete (2026-02-19) | TASK-01, TASK-02 | TASK-03 |
| TASK-13 | INVESTIGATE | Produce template reference-scope matrix for all 53 templates | 85% | S | Complete (2026-02-19) | TASK-01 | TASK-04 |
| TASK-03 | IMPLEMENT | Add production telemetry for fallback, drafted outcomes, and path usage | 80% | M | Complete (2026-02-19) | TASK-01, TASK-02, TASK-12 | TASK-05, TASK-06, TASK-07, TASK-09, TASK-10 |
| TASK-04 | IMPLEMENT | Normalize template references and scoping metadata | 80% | M | Complete (2026-02-19) | TASK-01, TASK-13 | TASK-05, TASK-06 |
| TASK-05 | IMPLEMENT | Enforce strict context-aware reference quality checks | 80% | M | Complete (2026-02-20) | TASK-01, TASK-03, TASK-04 | TASK-06 |
| TASK-09 | IMPLEMENT | Unify label attribution for booking and guest-activity draft flows | 85% | M | Complete (2026-02-19) | TASK-01, TASK-03 | TASK-06 |
| TASK-11 | IMPLEMENT | Add startup preflight checks for email system dependencies | 85% | S | Complete (2026-02-19) | - | TASK-06 |
| TASK-06 | CHECKPOINT | Horizon checkpoint after foundation quality/telemetry tranche | 95% | S | Complete (2026-02-20) | TASK-03, TASK-04, TASK-05, TASK-09, TASK-11 | TASK-14, TASK-15, TASK-07, TASK-10 |
| TASK-14 | SPIKE | Probe reviewed-ledger storage/state model and promotion idempotency contract | 80% | S | Complete (2026-02-20) | TASK-06 | TASK-07, TASK-08 |
| TASK-15 | INVESTIGATE | Build 90-day Octorate subject corpus + misroute baseline for parser hardening | 85% | S | Complete (2026-02-20) | TASK-06 | TASK-10 |
| TASK-07 | IMPLEMENT | Build unknown-answer capture and reviewed-ledger ingestion | 75% | M | Pending | TASK-01, TASK-03, TASK-06, TASK-14 | TASK-08 |
| TASK-10 | IMPLEMENT | Harden Octorate routing patterns and replay fixtures | 75% | M | Pending | TASK-03, TASK-06, TASK-15 | - |
| TASK-08 | IMPLEMENT | Build reviewed promotion path from ledger into reusable KB/templates | 75% | M | Pending | TASK-07, TASK-14 | - |

## Parallelism Guide

Execution waves for `/lp-build` subagent dispatch. Later waves require completion of prerequisite blockers.

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-11 | - | Complete: security gate, attribution investigation, and preflight foundation. |
| 2 | TASK-12, TASK-13 | TASK-01 (+ TASK-02 for TASK-12) | New precursor investigations that resolve unresolved design unknowns. |
| 3 | TASK-03, TASK-04 | TASK-12/TASK-13 (+ TASK-01) | Telemetry + template normalization foundation. |
| 4 | TASK-05, TASK-09 | TASK-03 + TASK-04 (+ TASK-01) | Quality enforcement and label-path alignment. |
| 5 | TASK-06 | TASK-03, TASK-04, TASK-05, TASK-09, TASK-11 | Mandatory checkpoint before learning and Octorate hardening rollout. |
| 6 | TASK-14, TASK-15 | TASK-06 | Post-checkpoint precursor spike/investigation for learning and Octorate long-tail reliability. |
| 7 | TASK-07, TASK-10 | TASK-14/TASK-15 (+ TASK-03, TASK-06, TASK-01 for TASK-07) | Learning ingestion and Octorate hardening can run together after precursor evidence lands. |
| 8 | TASK-08 | TASK-07, TASK-14 | Promotion path depends on reviewed-ledger ingestion and spike contract output. |

Max parallelism: 3 tasks (Wave 1)
Critical path: TASK-01 -> TASK-12 -> TASK-03 -> TASK-05 -> TASK-06 -> TASK-14 -> TASK-07 -> TASK-08 (8 waves)

## Tasks

### TASK-01: Add server-side auth/authz guard for reception MCP routes
- **Type:** IMPLEMENT
- **Deliverable:** Authenticated/authorized route guards for `booking-email` and `guest-email-activity` API handlers with integration tests in reception app.
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-19)
- **Affects:** `apps/reception/src/app/api/mcp/booking-email/route.ts`, `apps/reception/src/app/api/mcp/guest-email-activity/route.ts`, `apps/reception/src/app/api/mcp/_shared/*`, `apps/reception/src/app/api/mcp/__tests__/*`, `apps/reception/src/services/mcpAuthHeaders.ts`, `apps/reception/src/services/useBookingEmail.ts`, `apps/reception/src/services/useEmailGuest.ts`
- **Depends on:** -
- **Blocks:** TASK-03, TASK-04, TASK-05, TASK-07, TASK-08, TASK-09, TASK-10
- **Confidence:** 85%
  - Implementation: 85% - route surfaces are small and currently direct pass-through handlers.
  - Approach: 85% - existing auth context/role patterns in reception can be reused for server-side checks.
  - Impact: 85% - materially reduces unauthorized invocation risk and enforces architectural gate.
- **Acceptance:**
  - Requests without valid staff auth receive 401/403.
  - Authorized staff requests keep existing successful behavior.
  - Guard behavior is consistent across both MCP proxy routes.
- **Validation contract (TC-01):**
  - TC-01-01: unauthenticated POST to `/api/mcp/booking-email` -> 401/403.
  - TC-01-02: unauthenticated POST to `/api/mcp/guest-email-activity` -> 401/403.
  - TC-01-03: authenticated staff POST to both routes -> 200 and existing payload contract preserved.
  - TC-01-04: non-staff authenticated role -> 403.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: `sed -n '1,160p' apps/reception/src/app/api/mcp/booking-email/route.ts`; `sed -n '1,180p' apps/reception/src/app/api/mcp/guest-email-activity/route.ts`.
  - Validation artifacts: both routes currently lack any auth/authz gate.
  - Unexpected findings: none.
- **Scouts:** Verify preferred server-side auth primitive for Next route handlers in reception app (`None: scoped during build task if helper already exists`).
- **Edge Cases & Hardening:** expired token, malformed auth header, partially authenticated session, role lookup failure fallback.
- **What would make this >=90%:** concrete selection of shared auth middleware helper and green integration tests for all role cases.
- **Rollout / rollback:**
  - Rollout: enable guard paths in both routes simultaneously.
  - Rollback: feature-flag bypass only in emergency internal mode; preserve audit logging of bypass usage.
- **Documentation impact:** update ops runbook for auth failure troubleshooting and local private-mode setup.
- **Notes / references:** `docs/plans/email-system-design-gaps-v2/fact-find.md` V2-01, D1.
- **Scope expansion (build):** Added reception client auth-header propagation (`mcpAuthHeaders` + hook call-sites) so authenticated browser-origin requests continue to satisfy the new server-side route guard.
- **Build evidence:** Commit `6cc3e8556a`; Validation PASS (2026-02-19):
  - `pnpm --filter @apps/reception typecheck`
  - `pnpm --filter @apps/reception lint`
  - `pnpm --filter @apps/reception test -- src/app/api/mcp/_shared/__tests__/staff-auth.test.ts src/app/api/mcp/__tests__/booking-email.route.test.ts src/app/api/mcp/__tests__/guest-email-activity.route.test.ts src/services/__tests__/useBookingEmail.test.ts src/services/__tests__/useEmailGuest.test.tsx --maxWorkers=2`

### TASK-02: Resolve production usage attribution for queue vs reception draft paths
- **Type:** INVESTIGATE
- **Deliverable:** Investigation note appended to plan + metrics baseline for 30-day drafted outcomes and path attribution.
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-19)
- **Affects:** `data/email-audit-log.jsonl`, `[readonly] docs/plans/email-system-design-gaps-v2/fact-find.md`, `docs/plans/email-system-design-gaps-v2/plan.md`
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** 85%
  - Implementation: 85% - bounded data inspection and reporting task.
  - Approach: 85% - direct evidence can close the current 0-Drafted ambiguity.
  - Impact: 85% - clarifies prioritization for downstream telemetry/quality tasks.
- **Questions to answer:**
  - Is queue-driven draft processing actively used in production over the last 30 days?
  - Are drafted outcomes tracked under a different label/path than expected?
  - What minimum counters are required to prevent recurrence of this ambiguity?
- **Acceptance:**
  - Investigation produces explicit attribution statement with date window and evidence source.
  - Plan is updated with any dependency or priority changes implied by findings.
- **Validation contract:** evidence packet includes query outputs and log-window caveats with a clear conclusion.
- **Planning validation:** local audit log checked and confirmed session-local (42 rows, short same-day window).
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** update plan decision log with investigation outcome.
- **Notes / references:** `docs/plans/email-system-design-gaps-v2/fact-find.md` runtime section (`0 Drafted` ambiguity).
- **Build evidence:** Investigation completed (2026-02-19) using read-only evidence sources:
  - **Evidence sources (30-day window = 2026-01-20 to 2026-02-19):**
    - `gmail_list_query(label:"Brikette/Outcome/Drafted" newer_than:30d)` -> `0` emails.
    - `gmail_list_query(in:drafts from:hostelpositano@gmail.com newer_than:30d)` -> `5` draft emails.
    - `gmail_list_query(in:drafts newer_than:30d label:"Brikette/Outcome/Drafted")` -> `0` emails (no overlap with drafts).
    - Queue signals:
      - `gmail_list_query(label:"Brikette/Queue/Needs-Processing" newer_than:30d)` -> `2`.
      - `gmail_list_query(label:"Brikette/Queue/In-Progress" newer_than:30d)` -> `1`.
      - `gmail_list_query(label:"Brikette/Queue/Needs-Decision" newer_than:30d)` -> `1`.
      - `gmail_list_query(label:"Brikette/Queue/Deferred" newer_than:30d)` -> `1`.
    - Outcome signals:
      - `gmail_list_query(label:"Brikette/Outcome/Acknowledged" newer_than:30d)` -> `0`.
      - `gmail_list_query(label:"Brikette/Outcome/Skipped" newer_than:30d)` -> `2`.
    - Review signal:
      - `gmail_list_query(label:"Brikette/Drafts/Ready-For-Review" newer_than:30d)` -> `2`.
    - Volume context:
      - `gmail_list_query(in:inbox newer_than:30d, limit:100)` -> `100` with `hasMore: true` (>=100 inbox messages).
    - Local audit log (`data/email-audit-log.jsonl`):
      - `42` rows, window `2026-02-19T13:40:22.898Z` -> `2026-02-19T17:14:17.939Z`.
      - Actions: `lock-acquired: 8`, `outcome: 21`, `lock-released: 13`.
      - Message IDs are mostly synthetic/session-local (`40/42` with `msg-*` prefixes).
  - **Attribution statement:** queue workflow is active (non-zero queue and review labels), but path attribution for drafted outcomes remains unresolved from current telemetry. Drafts exist without corresponding `Brikette/Outcome/Drafted` labels, which is consistent with route-specific paths that create drafts without `gmail_mark_processed` labeling (`packages/mcp-server/src/tools/booking-email.ts`, `packages/mcp-server/src/tools/guest-email-activity.ts`) and with missing source-path fields in audit events.
  - **Dependency/priority impact:** no dependency reorder required; keep TASK-03 as the next instrumentation dependency for capability tasks.
  - **Minimum counters required (feeds TASK-03):**
    - `draft_created_total{source_path=queue|reception|outbound}`.
    - `outcome_labeled_total{action}` including `drafted`.
    - `draft_without_outcome_total{source_path}`.
    - `queue_transition_total{from_label,to_label}` for queue-state attribution.

### TASK-12: Finalize telemetry event contract + daily rollup sink before instrumentation
- **Type:** INVESTIGATE
- **Deliverable:** Evidence-backed telemetry contract (event names/fields/source-path taxonomy) and one storage sink decision for daily rollups.
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-19)
- **Affects:** `docs/plans/email-system-design-gaps-v2/replan-notes.md`, `docs/plans/email-system-design-gaps-v2/plan.md`, `[readonly] packages/mcp-server/src/tools/draft-generate.ts`, `[readonly] packages/mcp-server/src/tools/gmail.ts`, `[readonly] packages/mcp-server/src/tools/booking-email.ts`, `[readonly] packages/mcp-server/src/tools/guest-email-activity.ts`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-03
- **Confidence:** 85%
  - Implementation: 85% - bounded to call-site mapping and contract selection, no code mutation.
  - Approach: 85% - existing audit-log and quality payload seams provide a concrete baseline for schema design.
  - Impact: 85% - removes the primary held-back unknown that currently caps TASK-03.
- **Questions to answer:**
  - Which event contract fields are mandatory per path (`queue`, `reception`, `outbound`)?
  - Which existing sink (`audit-log jsonl` vs dedicated metrics artifact) will carry daily rollups first?
  - Which backward-compatible defaults apply when source metadata is unavailable?
- **Acceptance:**
  - A telemetry contract table is documented with stable event keys and required fields.
  - One rollup sink decision is explicit with fallback behavior.
  - TASK-03 dependencies and confidence can be reassessed with no unresolved schema unknowns.
- **Validation contract:**
  - Evidence packet includes call-site map + executable baseline checks.
  - Run:
    - `pnpm run test:governed -- jest -- --config packages/mcp-server/jest.config.cjs --runTestsByPath packages/mcp-server/src/__tests__/gmail-audit-log.test.ts packages/mcp-server/src/__tests__/draft-generate.test.ts --maxWorkers=2`
  - Pass condition: tests confirm append-only audit seam and deterministic draft diagnostics fields.
- **Rollout / rollback:** `None: investigation-only task`
- **Documentation impact:** append telemetry contract decision to `replan-notes.md`.
- **Notes / references:** fact-find V2-03 + TASK-02 attribution evidence.
- **Build evidence:** Investigation completed (2026-02-19):
  - Telemetry contract table + source-path defaults + rollup sink decision documented in `docs/plans/email-system-design-gaps-v2/replan-notes.md` (`TASK-12 Output (Build, 2026-02-19)`).
  - Validation PASS:
    - `pnpm run test:governed -- jest -- --config packages/mcp-server/jest.config.cjs --runTestsByPath packages/mcp-server/src/__tests__/gmail-audit-log.test.ts packages/mcp-server/src/__tests__/draft-generate.test.ts --maxWorkers=2`
    - Result: `2/2` suites passed, `28/28` tests passed.

### TASK-13: Produce template reference-scope matrix for all 53 templates
- **Type:** INVESTIGATE
- **Deliverable:** Full template matrix marking `reference_required` vs `reference_optional/excluded`, canonical URL targets, and normalization batches.
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-19)
- **Affects:** `docs/plans/email-system-design-gaps-v2/replan-notes.md`, `docs/plans/email-system-design-gaps-v2/plan.md`, `[readonly] packages/mcp-server/data/email-templates.json`
- **Depends on:** TASK-01
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 85% - bounded inventory/matrix task with deterministic source data.
  - Approach: 85% - template-lint and pipeline fixtures provide concrete categories for scope partitioning.
  - Impact: 85% - removes false-fail risk from TASK-04/TASK-05 by resolving scoping ambiguity first.
- **Questions to answer:**
  - Which templates are factual/policy and must carry canonical references?
  - Which templates are operational-only and should be explicitly excluded from strict link enforcement?
  - Which template families should be normalized first to minimize regression risk?
- **Acceptance:**
  - All 53 templates are classified in a single matrix with explicit rationale.
  - Every in-scope template family maps to canonical URL targets.
  - TASK-04 execution batches are defined with deterministic completion checks.
- **Validation contract:**
  - Evidence packet includes template inventory script output + quality baseline tests.
  - Run:
    - `node -e 'const fs=require("fs");const a=JSON.parse(fs.readFileSync("packages/mcp-server/data/email-templates.json","utf8"));const arr=Array.isArray(a)?a:(a.templates||[]);const no=arr.filter(t=>!/https?:\\/\\//i.test(JSON.stringify(t)));console.log({total:arr.length,noUrl:no.length});'`
    - `pnpm run test:governed -- jest -- --config packages/mcp-server/jest.config.cjs --runTestsByPath packages/mcp-server/src/__tests__/template-lint.test.ts packages/mcp-server/src/__tests__/draft-pipeline.integration.test.ts --maxWorkers=2`
  - Pass condition: inventory totals reconcile and baseline tests pass before normalization sequencing.
- **Rollout / rollback:** `None: investigation-only task`
- **Documentation impact:** add matrix and batch ordering to `replan-notes.md`.
- **Notes / references:** fact-find V2-05, D2.
- **Build evidence:** Investigation completed (2026-02-19):
  - Full 53-template scope matrix + canonical targets + TASK-04 batch checks documented in `docs/plans/email-system-design-gaps-v2/replan-notes.md` (`TASK-13 Output (Build, 2026-02-19)`).
  - Validation PASS:
    - `node -e 'const fs=require("fs");const a=JSON.parse(fs.readFileSync("packages/mcp-server/data/email-templates.json","utf8"));const arr=Array.isArray(a)?a:(a.templates||[]);const no=arr.filter(t=>!/https?:\\/\\//i.test(JSON.stringify(t)));console.log(JSON.stringify({total:arr.length,noUrl:no.length}));'`
    - Result: `{"total":53,"noUrl":24}`
    - `pnpm run test:governed -- jest -- --config packages/mcp-server/jest.config.cjs --runTestsByPath packages/mcp-server/src/__tests__/template-lint.test.ts packages/mcp-server/src/__tests__/draft-pipeline.integration.test.ts --maxWorkers=2`
    - Result: `2/2` suites passed, `27/27` tests passed.

### TASK-03: Add production telemetry for fallback, drafted outcomes, and path usage
- **Type:** IMPLEMENT
- **Deliverable:** Structured counters/events for fallback and path attribution plus daily rollup visibility for operators.
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-19)
- **Affects:** `packages/mcp-server/src/tools/draft-generate.ts`, `packages/mcp-server/src/tools/gmail.ts`, `packages/mcp-server/src/tools/guest-email-activity.ts`, `packages/mcp-server/src/tools/booking-email.ts`, `packages/mcp-server/src/__tests__/*`, `docs/guides/brikette-email-system.html`
- **Depends on:** TASK-01, TASK-02, TASK-12
- **Blocks:** TASK-05, TASK-06, TASK-07, TASK-09, TASK-10
- **Confidence:** 80%
  - Implementation: 80% - event taxonomy and sink decision are now fixed by TASK-12 contract output, leaving bounded implementation work across known seams.
  - Approach: 80% - source-path defaults and required fields were validated with governed tests and call-site mapping; approach is now implementation-ready.
  - Impact: 80% - Held-back test: if telemetry emission overhead or path attribution mismatches occur, dashboard fidelity drops. This is now a measurable implementation risk rather than a planning unknown.
- **Acceptance:**
  - Fallback events are emitted with reason/classification metadata.
  - Drafted outcome counts and source path (queue vs reception-triggered vs outbound) are emitted.
  - Operators can read a daily rollup that explains drafted, deferred, requeued, and fallback totals.
- **Validation contract (TC-03):**
  - TC-03-01: fallback branch in draft generation emits telemetry event with stable key.
  - TC-03-02: queue and reception-triggered flows emit distinct path attribution values.
  - TC-03-03: daily rollup job/report returns deterministic aggregates for a seeded fixture set.
  - TC-03-04: telemetry failures do not break draft generation success path.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: `rg -n "fallback|unknown|requeued|deferred" packages/mcp-server/src/tools/draft-generate.ts`; fact-find runtime evidence review.
  - Validation artifacts: fallback observability gap explicitly confirmed in fact-find.
  - Unexpected findings: no existing production baseline counters in tool outputs.
- **Scouts:** `None: TASK-12 already fixed daily rollup sink to append-only audit-log JSONL.`
- **Edge Cases & Hardening:** duplicate event suppression, timezone normalization, missing actor/path metadata fallback.
- **What would make this >=90%:** approved telemetry schema + golden fixtures proving stable aggregates across all active flows.
- **Rollout / rollback:**
  - Rollout: dark-launch telemetry writes before gating on dashboards.
  - Rollback: disable emission via feature flag while preserving core draft paths.
- **Documentation impact:** add telemetry key definitions and interpretation notes for operators.
- **Notes / references:** fact-find V2-03, runtime `8/61` signal, and 0-Drafted ambiguity findings.
#### Re-plan Update (2026-02-19)
- Confidence: 75% -> 80% (Evidence: E2)
- Key change: Promoted after TASK-12 contract completion removed schema/sink unknowns and fresh governed tests reconfirmed telemetry seams.
- Dependencies: unchanged (`TASK-01`, `TASK-02`, `TASK-12`).
- Validation contract: unchanged (TC-03 remains complete for implementation phase).
- Notes: `docs/plans/email-system-design-gaps-v2/replan-notes.md`
- **Build evidence:** Implementation completed (2026-02-19):
  - Added telemetry event emission for:
    - fallback detection in `draft_generate`,
    - draft creation in `gmail_create_draft`,
    - labeled outcomes + queue transitions in `gmail_mark_processed`,
    - reception-path drafted/deferred outcomes in booking/activity tools.
  - Added operator daily rollup tool:
    - `gmail_telemetry_daily_rollup` (drafted, deferred, requeued, fallback totals from append-only audit log).
  - Added/updated tests:
    - `packages/mcp-server/src/__tests__/gmail-audit-log.test.ts`
    - `packages/mcp-server/src/__tests__/draft-generate-telemetry.test.ts`
    - `packages/mcp-server/src/__tests__/booking-email.test.ts`
    - `packages/mcp-server/src/__tests__/guest-email-activity.test.ts`
    - compatibility mock update in `packages/mcp-server/src/__tests__/draft-generate.test.ts`
  - Validation PASS:
    - `pnpm exec jest --config packages/mcp-server/jest.config.cjs --runTestsByPath packages/mcp-server/src/__tests__/gmail-audit-log.test.ts packages/mcp-server/src/__tests__/draft-generate.test.ts packages/mcp-server/src/__tests__/draft-generate-telemetry.test.ts packages/mcp-server/src/__tests__/booking-email.test.ts packages/mcp-server/src/__tests__/guest-email-activity.test.ts --maxWorkers=2`
      - Result: `5/5` suites passed, `38/38` tests passed.
    - `pnpm --filter @acme/mcp-server typecheck`
      - Result: pass.
    - `pnpm --filter @acme/mcp-server lint`
      - Result: pass (existing repo warnings only).

### TASK-04: Normalize template references and scoping metadata
- **Type:** IMPLEMENT
- **Deliverable:** Template corpus normalized with canonical references and explicit scope tags for where references are required.
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-19)
- **Affects:** `packages/mcp-server/data/email-templates.json`, `packages/mcp-server/src/__tests__/draft-generate.test.ts`, `packages/mcp-server/src/__tests__/draft-quality-check.test.ts`
- **Depends on:** TASK-01, TASK-13
- **Blocks:** TASK-05, TASK-06
- **Confidence:** 80%
  - Implementation: 80% - TASK-13 delivered full 53-template matrix with batch ordering, reducing implementation uncertainty to execution discipline.
  - Approach: 80% - scope partition (`reference_required` vs `reference_optional_excluded`) and canonical targets are explicitly documented and test-baselined.
  - Impact: 80% - Held-back test: if scope tags are applied inconsistently during edits, strict checks can over-fail. This remains an execution-quality risk, not a planning ambiguity.
- **Acceptance:**
  - Templates requiring factual/policy grounding contain canonical website/guide/terms references.
  - Templates with non-factual or placeholder-only content are explicitly tagged for exclusion from strict link checks.
  - Regression tests cover at least one template per major scenario family.
- **Validation contract (TC-04):**
  - TC-04-01: template scan reports zero missing references for in-scope factual/policy templates.
  - TC-04-02: out-of-scope templates are tagged and excluded by rule, not by silent omission.
  - TC-04-03: generated drafts from updated templates retain tone/policy constraints.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: `node -e 'const fs=require(\"fs\");const a=JSON.parse(fs.readFileSync(\"packages/mcp-server/data/email-templates.json\",\"utf8\"));const arr=Array.isArray(a)?a:(a.templates||[]);const no=arr.filter(t=>!/https?:\\/\\//i.test(JSON.stringify(t)));console.log({total:arr.length,noUrl:no.length});'` (result: `{ total: 53, noUrl: 24 }`).
  - Validation artifacts: quantitative scope of normalization confirmed.
  - Unexpected findings: none.
- **Scouts:** `None: no external dependency required; TASK-13 matrix provides execution map.`
- **Edge Cases & Hardening:** multilingual templates, policy templates with dynamic placeholders, stale URLs.
- **What would make this >=90%:** complete template tagging matrix with reviewer signoff and zero false-fails in dry-run sample pack.
- **Rollout / rollback:**
  - Rollout: commit template changes with snapshot tests.
  - Rollback: revert template file and disable strict-check enforcement toggle.
- **Documentation impact:** update template authoring guidance with scope-tag rules.
- **Notes / references:** fact-find V2-05 criterion definition.
#### Re-plan Update (2026-02-19)
- Confidence: 75% -> 80% (Evidence: E2)
- Key change: Promoted after TASK-13 matrix completion resolved scope ambiguity and fresh governed tests reconfirmed template/pipeline baselines.
- Dependencies: unchanged (`TASK-01`, `TASK-13`).
- Validation contract: unchanged (TC-04 remains complete for implementation phase).
- Notes: `docs/plans/email-system-design-gaps-v2/replan-notes.md`
- **Build evidence:** Implementation completed (2026-02-19):
  - Normalized all `53` templates with explicit metadata:
    - `template_id` (`T01`-`T53`)
    - `reference_scope` (`reference_required` vs `reference_optional_excluded`)
    - `canonical_reference_url` (nullable for excluded templates)
    - `normalization_batch` (`A`-`D`)
  - Added canonical reference links to all in-scope templates and reduced corpus `noUrl` count from `24` to `12` (remaining `12` are explicitly tagged `reference_optional_excluded`).
  - Added TASK-04 regression coverage:
    - metadata/reference scan assertions in `packages/mcp-server/src/__tests__/draft-quality-check.test.ts`
    - policy-safe generation regression over normalized template corpus in `packages/mcp-server/src/__tests__/draft-generate.test.ts`
  - Validation PASS:
    - `node -e 'const fs=require("fs");const templates=JSON.parse(fs.readFileSync("packages/mcp-server/data/email-templates.json","utf8"));const required=templates.filter(t=>t.reference_scope==="reference_required");const missing=required.filter(t=>!t.canonical_reference_url||!(`${t.subject}\\n${t.body}`.includes(t.canonical_reference_url)));const noScope=templates.filter(t=>!t.reference_scope);console.log(JSON.stringify({total:templates.length,required:required.length,optional:templates.filter(t=>t.reference_scope==="reference_optional_excluded").length,missingCanonicalInRequired:missing.length,missingScope:noScope.length},null,2));if(missing.length||noScope.length)process.exit(1);'`
      - Result: `{"total":53,"required":41,"optional":12,"missingCanonicalInRequired":0,"missingScope":0}`
    - `pnpm exec jest --config packages/mcp-server/jest.config.cjs --runTestsByPath packages/mcp-server/src/__tests__/draft-generate.test.ts packages/mcp-server/src/__tests__/draft-quality-check.test.ts packages/mcp-server/src/__tests__/template-lint.test.ts --maxWorkers=2`
      - Result: `3/3` suites passed, `59/59` tests passed.
    - `pnpm --filter @acme/mcp-server typecheck`
      - Result: pass.
    - `pnpm --filter @acme/mcp-server lint`
      - Result: pass (existing repo warnings only).

### TASK-05: Enforce strict context-aware reference quality checks
- **Type:** IMPLEMENT
- **Deliverable:** Expanded `draft_quality_check` rules that require references where applicable and validate appropriateness.
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-20)
- **Affects:** `packages/mcp-server/src/tools/draft-quality-check.ts`, `packages/mcp-server/src/__tests__/draft-quality-check.test.ts`, `packages/mcp-server/src/__tests__/draft-pipeline.integration.test.ts`
- **Depends on:** TASK-01, TASK-03, TASK-04
- **Blocks:** TASK-06
- **Confidence:** 80%
  - Implementation: 80% - upstream prerequisites are complete and applicability metadata now exists in the normalized template corpus (`reference_scope`, `canonical_reference_url`), leaving bounded rule-extension work.
  - Approach: 80% - implementation can extend a single quality gate seam (`draft_quality_check`) with deterministic scenario/scope checks and existing task-scoped test coverage.
  - Impact: 80% - Held-back test: no unresolved design unknown remains that would push this below 80; remaining risk is execution-time regression that is covered by TC-05 and telemetry watch during rollout.
- **Acceptance:**
  - Factual/policy scenarios fail when required references are missing.
  - Link-inappropriate scenarios do not fail purely for missing links.
  - Quality output includes actionable failure reasons (`missing_required_reference`, `reference_not_applicable`, etc.).
- **Validation contract (TC-05):**
  - TC-05-01: in-scope factual response without reference -> failed check.
  - TC-05-02: in-scope factual response with valid canonical reference -> pass.
  - TC-05-03: out-of-scope operational response without reference -> pass.
  - TC-05-04: regression fixture pack preserves >= prior pass-rate with expected deltas explained.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: `rg -n "booking_monitor|hasLink" packages/mcp-server/src/tools/draft-quality-check.ts`.
  - Validation artifacts: current check is booking-monitor scoped only.
  - Unexpected findings: none.
- **Scouts:** evaluate whether reference-appropriateness needs explicit scenario map table.
- **Edge Cases & Hardening:** repeated links, malformed URLs, quoted guest text containing unrelated links.
- **What would make this >=90%:** production replay demonstrates reduced reference misses with stable or lower defer rate.
- **Rollout / rollback:**
  - Rollout: staged enablement with metrics watch on defer and manual-edit rates.
  - Rollback: disable strict mode flag and preserve telemetry for postmortem.
- **Documentation impact:** add quality-rule matrix to email operations guide.
- **Notes / references:** fact-find V2-04, D2, false-fail risk row.
#### Re-plan Update (2026-02-19)
- Confidence: 75% -> 75% (Evidence: E2)
- Key change: Kept below threshold; strict-rule rollout remains blocked on upstream precursors/tasks (`TASK-12`, `TASK-13`, `TASK-03`, `TASK-04`).
- Dependencies: unchanged (`TASK-01`, `TASK-03`, `TASK-04`).
- Validation contract: unchanged.
- Notes: `docs/plans/email-system-design-gaps-v2/replan-notes.md`
#### Re-plan Update (2026-02-19, Run 3)
- Confidence: 75% -> 80% (Evidence: E2)
- Key change: prerequisites (`TASK-03`, `TASK-04`) are complete and governed quality/template suites reconfirm task-scoped readiness.
- Dependencies: unchanged (`TASK-01`, `TASK-03`, `TASK-04`).
- Validation contract: unchanged; TC-05-04 regression harness replay remains required at build time (current ESM parser failure documented in replan notes).
- Notes: `docs/plans/email-system-design-gaps-v2/replan-notes.md`
- **Build evidence:** Implementation completed (2026-02-20):
  - Added scenario-aware reference quality enforcement in `packages/mcp-server/src/tools/draft-quality-check.ts`:
    - Loads normalized template reference metadata (`reference_scope`, `canonical_reference_url`) by category.
    - Enforces `missing_required_reference` failures for applicable in-scope categories with no reference links.
    - Emits `reference_not_applicable` warning when links are present but not matched to canonical/allowed references.
    - Preserves booking-monitor hard link requirement (`missing_required_link`) and avoids false-fail enforcement for broad `faq`/`general` buckets.
  - Added/updated TC-05 coverage:
    - `packages/mcp-server/src/__tests__/draft-quality-check.test.ts` now includes:
      - TC-05-01 in-scope missing reference fails.
      - TC-05-02 in-scope canonical reference passes.
      - TC-05-03 out-of-scope operational no-reference passes.
      - TC-05-04 non-applicable reference warning behavior.
    - `packages/mcp-server/src/__tests__/draft-pipeline.integration.test.ts` now mocks Gmail telemetry dependency and maps regression threshold to TASK-05 TC-05-04.
  - Validation PASS:
    - `pnpm run test:governed -- jest -- --config packages/mcp-server/jest.config.cjs --runTestsByPath packages/mcp-server/src/__tests__/draft-quality-check.test.ts packages/mcp-server/src/__tests__/draft-pipeline.integration.test.ts --maxWorkers=2`
      - Result: `2/2` suites passed, `37/37` tests passed.
      - Harness output: quality pass-rate `10/10 (100%)`, average question coverage `100%`.
    - `pnpm --filter @acme/mcp-server typecheck`
      - Result: pass.
    - `pnpm --filter @acme/mcp-server lint`
      - Result: pass (existing package warnings only; no task-scoped lint errors).

### TASK-09: Unify label attribution for booking and guest-activity draft flows
- **Type:** IMPLEMENT
- **Deliverable:** Consistent queue/outcome labeling for booking and guest-activity generated drafts.
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-19)
- **Affects:** `packages/mcp-server/src/tools/booking-email.ts`, `packages/mcp-server/src/tools/guest-email-activity.ts`, `packages/mcp-server/src/tools/gmail.ts`, `packages/mcp-server/src/__tests__/booking-email.test.ts`, `packages/mcp-server/src/__tests__/guest-email-activity.test.ts`
- **Depends on:** TASK-01, TASK-03
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 85% - flow boundaries are clear and already share Gmail label helpers.
  - Approach: 85% - telemetry and label harmonization can be made deterministic per path.
  - Impact: 85% - closes V2-06 and improves operational observability.
- **Acceptance:**
  - Booking and guest-activity flows apply expected outcome labels on draft creation path.
  - No path leaves drafts unlabelled when success response is returned.
  - Label behavior is captured in tests for both happy/error branches.
- **Validation contract (TC-09):**
  - TC-09-01: booking flow success applies configured drafted outcome label.
  - TC-09-02: guest-activity flow success applies configured drafted outcome label.
  - TC-09-03: label mutation failure reports actionable error and does not silently succeed.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: source review of booking/guest tools from fact-find entries.
  - Validation artifacts: V2-06 evidence references exact call paths lacking label attribution.
  - Unexpected findings: none.
- **Scouts:** `None: scoped to existing label map APIs`.
- **Edge Cases & Hardening:** partial Gmail API failure after draft creation, duplicate label application idempotency.
- **What would make this >=90%:** dry-run verification over real sample threads with 100% expected label outcomes.
- **Rollout / rollback:**
  - Rollout: deploy with telemetry and compare drafted label counts day-over-day.
  - Rollback: revert flow-specific label mutations while preserving draft generation.
- **Documentation impact:** update operations guide for expected labels by flow.
- **Notes / references:** fact-find V2-06 and runtime label-volume ambiguity.
- **Build evidence:** Implementation completed (2026-02-19):
  - Added strict drafted-outcome label application helper in `packages/mcp-server/src/tools/gmail.ts`:
    - `applyDraftOutcomeLabelsStrict` now enforces required label presence, applies labels in one modify call, emits `email_outcome_labeled`, and throws actionable errors on failure.
  - Wired both reception draft flows to the helper:
    - `mcp_send_booking_email` applies: `Brikette/Drafts/Ready-For-Review`, `Brikette/Outcome/Drafted`, `Brikette/Agent/Human`, `Brikette/Outbound/Pre-Arrival`.
    - `guest_email_activity` applies: `Brikette/Drafts/Ready-For-Review`, `Brikette/Outcome/Drafted`, `Brikette/Agent/Human`, `Brikette/Outbound/Operations`.
  - Added/updated TC-09 coverage:
    - `packages/mcp-server/src/__tests__/booking-email.test.ts`
    - `packages/mcp-server/src/__tests__/guest-email-activity.test.ts`
  - Validation PASS:
    - `pnpm exec jest --config packages/mcp-server/jest.config.cjs --runTestsByPath packages/mcp-server/src/__tests__/booking-email.test.ts packages/mcp-server/src/__tests__/guest-email-activity.test.ts --maxWorkers=2`
      - Result: `2/2` suites passed, `10/10` tests passed.
    - `pnpm --filter @acme/mcp-server typecheck`
      - Result: pass.
    - `pnpm --filter @acme/mcp-server lint`
      - Result: pass (existing package warnings only; no task-scoped lint errors).

### TASK-11: Add startup preflight checks for email system dependencies
- **Type:** IMPLEMENT
- **Deliverable:** Deterministic startup preflight for Gmail/Firebase/Octorate/DB prerequisites with actionable operator messaging.
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-19)
- **Affects:** `packages/mcp-server/src/tools/health.ts` (or equivalent health utilities), `docs/guides/brikette-email-system.html`, `packages/mcp-server/src/__tests__/health*.test.ts`
- **Depends on:** -
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 85% - health check surfaces already exist and can be normalized.
  - Approach: 85% - fail-fast diagnostics are low-risk and align with current ops pain points.
  - Impact: 85% - reduces hidden runtime failures and startup ambiguity.
- **Acceptance:**
  - Startup preflight reports each required dependency with pass/fail state and remediation hint.
  - Missing Octorate storage state and DB URL are explicitly surfaced.
  - Non-critical failures do not crash unrelated Gmail tooling unless configured strict.
- **Validation contract (TC-11):**
  - TC-11-01: missing env var scenario -> clear fail output naming exact variable.
  - TC-11-02: missing storage state file -> clear fail output naming expected path.
  - TC-11-03: all dependencies present -> pass summary.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:** None: requirement states are already known from fact-find runtime checks.
- **Edge Cases & Hardening:** partial dependency availability, stale cached status, local dev overrides.
- **What would make this >=90%:** automated preflight check integrated into operator start sequence with green path verification.
- **Rollout / rollback:**
  - Rollout: enable preflight in startup scripts and docs.
  - Rollback: keep checks as manual tool command fallback.
- **Documentation impact:** update startup checklist and troubleshooting section.
- **Notes / references:** fact-find V2-08.
- **Build evidence:** Validation PASS (2026-02-19):
  - `pnpm run test:governed -- jest -- --config packages/mcp-server/jest.config.cjs --runTestsByPath packages/mcp-server/src/__tests__/health.test.ts --maxWorkers=2`
  - `pnpm --filter @acme/mcp-server typecheck`
  - `pnpm --filter @acme/mcp-server lint` (existing package warnings only; no task-scoped lint errors)

### TASK-06: Horizon checkpoint - reassess downstream plan
- **Type:** CHECKPOINT
- **Deliverable:** Updated downstream confidence and dependency integrity via `/lp-replan` after foundation tranche.
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-20)
- **Affects:** `docs/plans/email-system-design-gaps-v2/plan.md`
- **Depends on:** TASK-03, TASK-04, TASK-05, TASK-09, TASK-11
- **Blocks:** TASK-14, TASK-15, TASK-07, TASK-10
- **Confidence:** 95%
  - Implementation: 95% - process contract is defined.
  - Approach: 95% - checkpoint prevents blind continuation into learning/parser tranche.
  - Impact: 95% - improves safety of downstream execution.
- **Acceptance:**
  - `/lp-build` reaches checkpoint and pauses normal progression.
  - `/lp-replan` updates downstream tasks using fresh evidence.
  - Plan remains sequenced after checkpoint adjustments.
- **Horizon assumptions to validate:**
  - Telemetry baseline is sufficient to prioritize between learning-loop and Octorate hardening work.
  - Strict reference rules do not create unacceptable defer/manual-edit spikes.
- **Validation contract:** checkpoint run recorded in plan decision log with revised confidence notes.
- **Planning validation:** `None: procedural control task`.
- **Rollout / rollback:** `None: planning control task`.
- **Documentation impact:** update plan history with checkpoint outcome.
- **Build evidence:** Checkpoint completed (2026-02-20):
  - Checkpoint assumption review:
    - Telemetry baseline is now live from TASK-03 (path attribution + fallback/drafted outcome signals).
    - Strict reference enforcement from TASK-05 passed regression harness (`draft_quality_check` + `draft-pipeline.integration` at `10/10` fixture pass-rate).
  - `/lp-replan` checkpoint reassessment outcome for downstream tranche:
    - No topology change required; task IDs and dependency graph remain valid.
    - No `/lp-sequence` rerun required.
    - Confidence/dependency status remains:
      - `TASK-14` (`80%`) and `TASK-15` (`85%`) are now the next unblocked runnable tasks.
      - `TASK-07`, `TASK-10`, and `TASK-08` remain blocked by their precursor dependencies (`TASK-14`, `TASK-15`, `TASK-07` respectively).
  - Validation contract satisfied by checkpoint evidence capture in plan + decision log.

### TASK-14: Probe reviewed-ledger storage/state model and promotion idempotency contract
- **Type:** SPIKE
- **Deliverable:** Short prototype/decision packet covering storage format, review-state transitions, promotion idempotency keying, and rollback semantics.
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-20)
- **Affects:** `docs/plans/email-system-design-gaps-v2/replan-notes.md`, `docs/plans/email-system-design-gaps-v2/plan.md`, `packages/mcp-server/src/__tests__/fixtures/startup-loop/learning-ledger.complete.jsonl`, `[readonly] packages/mcp-server/src/resources/brikette-knowledge.ts`
- **Depends on:** TASK-06
- **Blocks:** TASK-07, TASK-08
- **Confidence:** 80%
  - Implementation: 80% - spike scope is bounded to prototype-level contract validation.
  - Approach: 80% - converts unresolved storage/transition unknowns into a tested contract before build.
  - Impact: 80% - removes the largest unresolved design risk across both learning-loop implementation tasks.
- **Acceptance:**
  - Candidate storage model is tested with representative unknown-question records and review transitions.
  - Promotion keying/idempotency strategy is demonstrated on duplicate inputs.
  - Revert/unpublish semantics are documented with one executable proof path.
- **Validation contract (TC-14):**
  - TC-14-01: prototype ingest applies allowed state transitions (`new -> approved/rejected/deferred`) and rejects invalid transitions.
  - TC-14-02: duplicate promotion attempts resolve idempotently to one promoted artifact.
  - TC-14-03: rollback prototype removes/invalidates promoted entry without corrupting ledger history.
  - Test type: contract/prototype.
  - Test location: `packages/mcp-server/src/__tests__/ledger-promotion.spike.test.ts` (or equivalent spike test path).
  - Run: `pnpm run test:governed -- jest -- --config packages/mcp-server/jest.config.cjs --runTestsByPath packages/mcp-server/src/__tests__/ledger-promotion.spike.test.ts --maxWorkers=2`
- **Execution plan:** Red -> Green -> Refactor
- **Rollout / rollback:** `None: spike-only task`
- **Documentation impact:** include contract decision + rejected alternatives in `replan-notes.md`.
- **Notes / references:** fact-find D3 reviewed-ledger decision; lack of dedicated ledger/promotion tests in current suite.
- **Build evidence:** Spike completed (2026-02-20):
  - Added prototype contract suite: `packages/mcp-server/src/__tests__/ledger-promotion.spike.test.ts`.
  - Updated representative ledger fixture states for startup-loop tests: `packages/mcp-server/src/__tests__/fixtures/startup-loop/learning-ledger.complete.jsonl`.
  - Contract decisions validated in prototype:
    - Storage shape: JSONL ledger rows with immutable `entry_id`/`created_at` plus mutable `review_state` + promotion envelope.
    - Allowed transitions: `new -> approved/rejected/deferred`; `deferred -> approved/rejected`; terminal otherwise.
    - Idempotency key: deterministic `faq:<question_hash>` promotion key per approved entry.
    - Rollback: mark promoted artifact `reverted` while preserving ledger history events.
  - Validation PASS:
    - `pnpm run test:governed -- jest -- --config packages/mcp-server/jest.config.cjs --runTestsByPath packages/mcp-server/src/__tests__/ledger-promotion.spike.test.ts --maxWorkers=2`
    - Result: `1/1` suite passed, `3/3` tests passed.

### TASK-15: Build 90-day Octorate subject corpus + misroute baseline for parser hardening
- **Type:** INVESTIGATE
- **Deliverable:** Reproducible subject-corpus baseline (90-day window), variant clustering, and fixture candidate list for TASK-10.
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-20)
- **Affects:** `docs/plans/email-system-design-gaps-v2/replan-notes.md`, `docs/plans/email-system-design-gaps-v2/plan.md`, `[readonly] packages/mcp-server/src/tools/gmail.ts`, `[readonly] packages/mcp-server/src/__tests__/gmail-organize-inbox.test.ts`
- **Depends on:** TASK-06
- **Blocks:** TASK-10
- **Confidence:** 85%
  - Implementation: 85% - bounded query/classification investigation with deterministic output format.
  - Approach: 85% - complements existing unit coverage with production-window frequency evidence.
  - Impact: 85% - reduces long-tail parser drift risk before TASK-10 code changes.
- **Acceptance:**
  - 90-day Octorate subject sample window and extraction method are documented.
  - Variants are grouped into parser-covered vs uncovered classes with counts.
  - Fixture candidates are enumerated for direct adoption in TASK-10 tests.
- **Validation contract:**
  - Evidence packet includes query outputs + classification worksheet + reproducible extraction command(s).
  - Pass condition: sample frame and baseline are explicit enough to evaluate pre/post TASK-10 misroute deltas.
- **Rollout / rollback:** `None: investigation-only task`
- **Documentation impact:** append baseline table and fixture backlog into `replan-notes.md`.
- **Notes / references:** fact-find V2-07 sampling clarification and outstanding long-tail uncertainty.
- **Build evidence:** Investigation completed (2026-02-20):
  - Reproducible 90-day extraction commands (Gmail MCP):
    - `newer_than:90d from:noreply@smtp.octorate.com`
    - `newer_than:90d from:noreply@smtp.octorate.com subject:"NEW RESERVATION"`
    - `newer_than:90d from:noreply@smtp.octorate.com subject:"NEW CANCELLATION"`
    - `newer_than:90d from:noreply@smtp.octorate.com subject:"Reservation" subject:"Confirmed"`
    - `newer_than:90d from:noreply@smtp.octorate.com subject:"Reservation" subject:"Cancelled"`
    - `newer_than:90d from:noreply@smtp.octorate.com subject:"NEW MODIFICATION"`
    - `newer_than:90d from:noreply@smtp.octorate.com subject:"has been changed"`
    - `newer_than:90d from:noreply@smtp.octorate.com subject:"Allow login in Octorate"`
    - `newer_than:90d from:noreply@smtp.octorate.com subject:"A customer saved their research"`
    - Promotional baseline: `newer_than:90d label:"Brikette/Outcome/Promotional" from:noreply@smtp.octorate.com`
  - 90-day variant baseline (as of 2026-02-20):
    - `NEW RESERVATION`: `100` returned with `hasMore=true` (tool-capped; true volume >100).
    - `NEW CANCELLATION`: `31` returned in sample run (`hasMore=false`).
    - `Reservation <code> Confirmed`: `35` (`hasMore=false`).
    - `Reservation <code> Cancelled`: `3` (`hasMore=false`).
    - `NEW MODIFICATION`: `5` (`hasMore=false`).
    - `Reservation <code> has been changed`: `1` (`hasMore=false`).
    - `Allow login in Octorate`: `9` (`hasMore=false`).
    - `A customer saved their research`: `4` (`hasMore=false`).
  - Parser coverage grouping against current monitor regexes in `packages/mcp-server/src/tools/gmail.ts`:
    - Explicitly covered: `NEW RESERVATION`, `NEW CANCELLATION`.
    - Uncovered operational variants: `Reservation ... Confirmed`, `Reservation ... Cancelled`, `NEW MODIFICATION`, `Reservation ... has been changed`.
    - Non-operational/system variants: `Allow login in Octorate`, `A customer saved their research`.
  - Misroute baseline (promotional-labeled Octorate): exact count `23` (derived via limit probe: `limit=22 -> hasMore=true`, `limit=23 -> hasMore=false`).
    - `NEW CANCELLATION`: `18`
    - `NEW MODIFICATION`: `2`
    - `Reservation ... Cancelled`: `1`
    - `A customer saved their research`: `2`
    - `Allow login in Octorate`: `0`
  - Additional routing signal: `Brikette/Workflow/Cancellation-{Received|Processed|Parse-Failed|Booking-Not-Found}` queries returned `0` Octorate messages in 90 days, so parser reliability currently depends on queue/promotional routing rather than workflow labels.
  - Fixture candidates for TASK-10 test expansion:
    - Promote to covered-operational fixtures: `Reservation ... Confirmed`, `Reservation ... Cancelled`, `NEW MODIFICATION`, `Reservation ... has been changed`.
    - Keep promotional fixtures: `Allow login in Octorate`, `A customer saved their research`.

### TASK-07: Build unknown-answer capture and reviewed-ledger ingestion
- **Type:** IMPLEMENT
- **Deliverable:** Persistence path for unknown-answer events into reviewed ledger with operator review state.
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `packages/mcp-server/src/tools/draft-interpret.ts`, `packages/mcp-server/src/tools/draft-generate.ts`, `packages/mcp-server/src/tools/*ledger*.ts`, `packages/mcp-server/src/__tests__/draft-*.test.ts`, `docs/guides/brikette-email-system.html`
- **Depends on:** TASK-01, TASK-03, TASK-06, TASK-14
- **Blocks:** TASK-08
- **Confidence:** 75%
  - Implementation: 75% - new persistence and review-state transitions are required.
  - Approach: 75% - reviewed-ledger-first model is chosen, but schema details remain to be finalized.
  - Impact: 80% - Held-back test: if review workflow is too heavy, adoption drops. Score held at 75 pending pilot data.
- **Acceptance:**
  - Unknown-answer events create ledger records with question/context/source metadata.
  - Records support review states (`new`, `approved`, `rejected`, `deferred`).
  - No automatic template/KB mutation occurs from ingestion step.
- **Validation contract (TC-07):**
  - TC-07-01: unknown scenario triggers ledger record creation.
  - TC-07-02: duplicate unknown detection is idempotent by defined key.
  - TC-07-03: approved/rejected state transitions enforce allowed transition rules.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: fact-find reviewed-ledger decision and burden estimate review.
  - Validation artifacts: D3 lock + burden threshold (`<=1` unknown/operator-day target).
  - Unexpected findings: none.
- **Scouts:** choose ledger storage backend consistent with existing mcp-server persistence patterns.
- **Edge Cases & Hardening:** PII minimization, duplicate unknowns, multilingual questions, stale unresolved records.
- **What would make this >=90%:** pilot month confirms review throughput below threshold with low rejection churn.
- **Rollout / rollback:**
  - Rollout: ingestion-only mode first, no promotion writes.
  - Rollback: disable ledger writes while retaining escalation behavior.
- **Documentation impact:** add operator SOP for reviewing unknown entries.
- **Notes / references:** fact-find D3 and reviewed burden estimate.
#### Re-plan Update (2026-02-19)
- Confidence: 75% -> 75% (Evidence: E1/E2)
- Key change: Added TASK-14 spike as mandatory precursor for storage/transition contract before ingestion implementation.
- Dependencies: updated to include `TASK-14`.
- Validation contract: unchanged (TC-07), now paired with upstream `TC-14` spike contract.
- Notes: `docs/plans/email-system-design-gaps-v2/replan-notes.md`

### TASK-10: Harden Octorate routing patterns and replay fixtures
- **Type:** IMPLEMENT
- **Deliverable:** Expanded Octorate subject parser/pattern set with replay fixtures and misroute tests.
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `packages/mcp-server/src/tools/gmail.ts`, `packages/mcp-server/src/__tests__/gmail-organize-inbox.test.ts`, `packages/mcp-server/src/__fixtures__/octorate/*`
- **Depends on:** TASK-03, TASK-06, TASK-15
- **Blocks:** -
- **Confidence:** 75%
  - Implementation: 75% - parser extension is straightforward but variant coverage may be broad.
  - Approach: 75% - replay fixtures reduce drift risk; unknown long-tail formats remain.
  - Impact: 75% - improved routing expected, but true production miss-rate remains to be measured.
- **Acceptance:**
  - Known reservation/cancellation/modification variants are routed to correct monitor outcomes.
  - Regression tests include prior misclassified examples.
  - Promotional false-positives from Octorate sample set are reduced against baseline.
- **Validation contract (TC-10):**
  - TC-10-01: fixture set of known Octorate reservation-status subjects routes to booking/cancellation handlers.
  - TC-10-02: non-operational Octorate marketing/news subjects remain promotional.
  - TC-10-03: dry-run sample classification summary produced before/after change.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: fact-find V2-07 sample evidence review (`4/10` tool-capped promotional sample; `16` Octorate promotional in 30-day query).
  - Validation artifacts: exact sampling frame documented.
  - Unexpected findings: none.
- **Scouts:** `None: fixture collection can start from existing sampled subjects`.
- **Edge Cases & Hardening:** locale variants, prefix/suffix noise, booking provider-specific wording changes.
- **What would make this >=90%:** stable 30-day production trend showing reduced Octorate promotional misroutes.
- **Rollout / rollback:**
  - Rollout: deploy pattern changes behind classification debug logging.
  - Rollback: restore previous pattern set while keeping fixtures.
- **Documentation impact:** update monitor-pattern maintenance note for operators.
- **Notes / references:** fact-find V2-07.
#### Re-plan Update (2026-02-19)
- Confidence: 75% -> 75% (Evidence: E2)
- Key change: Added TASK-15 investigation to quantify 90-day subject variants before parser hardening.
- Dependencies: updated to include `TASK-15`.
- Validation contract: unchanged (TC-10), pending fixture enrichment from TASK-15.
- Notes: `docs/plans/email-system-design-gaps-v2/replan-notes.md`

### TASK-08: Build reviewed promotion path from ledger into reusable KB/templates
- **Type:** IMPLEMENT
- **Deliverable:** Controlled promotion workflow that writes approved ledger entries to reusable knowledge/template assets with audit trail.
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `packages/mcp-server/src/tools/*ledger*.ts`, `packages/mcp-server/src/resources/brikette-knowledge.ts`, `packages/mcp-server/data/email-templates.json`, `packages/mcp-server/src/__tests__/draft-generate.test.ts`, `packages/mcp-server/src/__tests__/ledger-promotion*.test.ts`
- **Depends on:** TASK-07, TASK-14
- **Blocks:** -
- **Confidence:** 75%
  - Implementation: 75% - promotion writes need schema-safe merge logic and audit hooks.
  - Approach: 75% - governance is defined but promotion conflict handling needs explicit policy.
  - Impact: 75% - should improve answer scope over time, but measurable lift depends on unknown volume and approval quality.
- **Acceptance:**
  - Only approved ledger entries are eligible for promotion.
  - Promotion writes are auditable, reversible, and idempotent.
  - Draft generation can consume promoted knowledge without regressions.
- **Validation contract (TC-08):**
  - TC-08-01: approved record promotes successfully and appears in runtime knowledge reads.
  - TC-08-02: rejected/deferred records are not promoted.
  - TC-08-03: duplicate promotion request is idempotent.
  - TC-08-04: rollback/unpublish path removes promoted entry cleanly.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: D3 decision lock review and fact-find assumption/risk scan.
  - Validation artifacts: reviewed-ledger-first architecture explicitly mandated.
  - Unexpected findings: none.
- **Scouts:** define conflict policy when promotion target key already exists.
- **Edge Cases & Hardening:** conflicting answers, outdated policy references, multilingual duplication.
- **What would make this >=90%:** two release cycles with stable promotion quality metrics and low rollback rate.
- **Rollout / rollback:**
  - Rollout: start with manual approval and low-volume promotion window.
  - Rollback: disable promotion writer and revert promoted entries from audit log map.
- **Documentation impact:** add knowledge promotion SOP and quality checklist.
- **Notes / references:** fact-find D3 and risks on low-quality learning promotion.
#### Re-plan Update (2026-02-19)
- Confidence: 75% -> 75% (Evidence: E1)
- Key change: Added TASK-14 as explicit precursor to lock idempotency/revert semantics before promotion writes.
- Dependencies: updated to include `TASK-14` alongside `TASK-07`.
- Validation contract: unchanged (TC-08), now gated by upstream spike evidence.
- Notes: `docs/plans/email-system-design-gaps-v2/replan-notes.md`

## Risks & Mitigations

- Auth regression blocks internal operations.
  - Mitigation: explicit role-matrix tests and emergency bypass procedure with audit logging.
- Workflow inactivity leads to mis-prioritized quality work.
  - Mitigation: TASK-02 baseline plus TASK-12 contract investigation before TASK-03 instrumentation rollout.
- Strict reference enforcement increases deferrals/manual edits.
  - Mitigation: TASK-13 scope matrix precedes TASK-04 and TASK-05; monitor defer/manual-edit rates post rollout.
- Reviewed-ledger backlog exceeds operator capacity.
  - Mitigation: threshold of <=1 unknown/operator-day; TASK-14 spike defines ingestion/promotion controls before TASK-07/TASK-08.
- Octorate pattern drift continues post-fix.
  - Mitigation: TASK-15 90-day baseline + fixture-driven TASK-10 parser tests + recurring 30-day classification review.

## Observability

- Logging:
  - Auth-denied route events for MCP endpoints.
  - Draft path attribution (`queue`, `reception`, `outbound`) and fallback reason events.
  - Reviewed-ledger lifecycle events (`created`, `approved`, `promoted`, `reverted`).
- Metrics:
  - drafted outcomes/day by path.
  - fallback rate per 100 drafted attempts.
  - reference-compliance and reference-appropriateness rates.
  - unknown capture rate and reviewed-ledger aging distribution.
- Alerts/Dashboards:
  - spike in fallback rate.
  - zero drafted outcomes despite inbound queue volume.
  - unknown backlog above operator threshold.

## Acceptance Criteria (overall)

- [ ] Auth guard is deployed and validated before any production rollout of capability tasks TASK-03 to TASK-10.
- [ ] Production telemetry resolves fallback/outcome/path attribution ambiguity.
- [ ] Reference-quality enforcement runs with context-appropriate behavior and controlled false-fail rate.
- [ ] Reviewed-ledger loop exists with explicit approval/promotion controls and auditability.
- [ ] Label consistency and Octorate routing reliability improve with regression coverage.
- [ ] Startup preflight diagnostics are actionable and documented.

## Decision Log

- 2026-02-19: D1 locked - deployment mode private/single-computer for now; auth hardening still mandatory before broader rollout.
- 2026-02-19: D2 locked - strict reference-required policy for factual/policy answers.
- 2026-02-19: D3 locked - reviewed-ledger-first learning architecture.
- 2026-02-19: `/lp-plan` mode selected as `plan-only`; no automatic `/lp-build` handoff.
- 2026-02-19: `/lp-replan` (standard mode) added precursor chain TASK-12/TASK-13/TASK-14/TASK-15; stable task IDs preserved and execution resequenced.
- 2026-02-19: `/lp-build` completed TASK-13 and recorded template scope matrix evidence; no further build-eligible tasks until `/lp-replan`.
- 2026-02-19: `/lp-replan` (standard mode) promoted TASK-03 and TASK-04 to 80% after precursor completion + fresh E2 validation; Wave 3 is now build-eligible.
- 2026-02-19: `/lp-build` completed TASK-03 telemetry implementation; Wave 3 now has TASK-04 remaining.
- 2026-02-19: `/lp-build` completed TASK-04 template normalization and scope tagging; Wave 4 is open with TASK-09 build-eligible and TASK-05 below confidence threshold.
- 2026-02-19: `/lp-build` completed TASK-09 drafted-outcome label harmonization for booking and guest-activity flows; no further build-eligible tasks until `/lp-replan` promotes TASK-05.
- 2026-02-19: `/lp-replan` (standard mode) promoted TASK-05 to 80% after prerequisite completion and fresh governed E2 checks; Wave 4 is now build-eligible for TASK-05 before checkpoint TASK-06.
- 2026-02-20: `/lp-build` completed TASK-05 strict context-aware reference quality enforcement with full TC-05 validation; next runnable task is checkpoint TASK-06.
- 2026-02-20: `/lp-build` executed checkpoint TASK-06 and reassessed downstream tranche; no resequencing required, Wave 6 (`TASK-14`, `TASK-15`) is now build-eligible.
- 2026-02-20: `/lp-build` completed Wave 6 precursor tasks (`TASK-14` spike + `TASK-15` investigation). Wave 7 remains blocked by confidence threshold (`TASK-07`, `TASK-10` at `75%`), requiring `/lp-replan` before further implementation.

## Overall-confidence Calculation

- Effort weights: S=1, M=2, L=3
- Task confidence scores:
  - TASK-01 85 (M=2)
  - TASK-02 85 (S=1)
  - TASK-12 85 (S=1)
  - TASK-13 85 (S=1)
  - TASK-03 80 (M=2)
  - TASK-04 80 (M=2)
  - TASK-05 80 (M=2)
  - TASK-09 85 (M=2)
  - TASK-11 85 (S=1)
  - TASK-06 95 (S=1)
  - TASK-14 80 (S=1)
  - TASK-15 85 (S=1)
  - TASK-07 75 (M=2)
  - TASK-10 75 (M=2)
  - TASK-08 75 (M=2)
- Weighted sum = 1870
- Total weight = 23
- Overall-confidence = 1870 / 23 = 81.3% -> **81%**
