---
Type: Plan
Status: Draft
Domain: API
Workstream: Engineering
Created: 2026-02-19
Last-updated: 2026-02-19
Last-reviewed: 2026-02-19
Feature-Slug: email-system-design-gaps-v2
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-build
Supporting-Skills: none
Overall-confidence: 79%
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
  - Build-eligible now: TASK-01, TASK-02, TASK-09, TASK-11 (>=80 and unblocked).
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
| TASK-02 | INVESTIGATE | Resolve production usage attribution for queue vs reception draft paths | 85% | S | Pending | - | TASK-03 |
| TASK-03 | IMPLEMENT | Add production telemetry for fallback, drafted outcomes, and path usage | 75% | M | Pending | TASK-01, TASK-02 | TASK-05, TASK-06, TASK-07, TASK-09, TASK-10 |
| TASK-04 | IMPLEMENT | Normalize template references and scoping metadata | 75% | M | Pending | TASK-01 | TASK-05, TASK-06 |
| TASK-05 | IMPLEMENT | Enforce strict context-aware reference quality checks | 75% | M | Pending | TASK-01, TASK-03, TASK-04 | TASK-06 |
| TASK-09 | IMPLEMENT | Unify label attribution for booking and guest-activity draft flows | 85% | M | Pending | TASK-01, TASK-03 | TASK-06 |
| TASK-11 | IMPLEMENT | Add startup preflight checks for email system dependencies | 85% | S | Pending | - | TASK-06 |
| TASK-06 | CHECKPOINT | Horizon checkpoint after foundation quality/telemetry tranche | 95% | S | Pending | TASK-03, TASK-04, TASK-05, TASK-09, TASK-11 | TASK-07, TASK-10 |
| TASK-07 | IMPLEMENT | Build unknown-answer capture and reviewed-ledger ingestion | 75% | M | Pending | TASK-01, TASK-03, TASK-06 | TASK-08 |
| TASK-10 | IMPLEMENT | Harden Octorate routing patterns and replay fixtures | 75% | M | Pending | TASK-03, TASK-06 | - |
| TASK-08 | IMPLEMENT | Build reviewed promotion path from ledger into reusable KB/templates | 75% | M | Pending | TASK-07 | - |

## Parallelism Guide

Execution waves for `/lp-build` subagent dispatch. Later waves require completion of prerequisite blockers.

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-11 | - | Security gate, attribution investigation, and preflight foundation can run in parallel. |
| 2 | TASK-03, TASK-04 | TASK-01 (and TASK-02 for TASK-03) | Telemetry + template normalization foundation. |
| 3 | TASK-05, TASK-09 | TASK-03 + TASK-04 (+ TASK-01) | Quality enforcement and label-path alignment. |
| 4 | TASK-06 | TASK-03, TASK-04, TASK-05, TASK-09, TASK-11 | Mandatory checkpoint before learning and Octorate hardening rollout. |
| 5 | TASK-07, TASK-10 | TASK-06 (+ TASK-03 for both, TASK-01 for TASK-07) | Learning ingestion and Octorate hardening can run together. |
| 6 | TASK-08 | TASK-07 | Promotion path depends on reviewed ledger ingestion output. |

Max parallelism: 3 tasks (Wave 1)
Critical path: TASK-01 -> TASK-03 -> TASK-05 -> TASK-06 -> TASK-07 -> TASK-08 (6 waves)

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
- **Build evidence:** Validation PASS (2026-02-19):
  - `pnpm --filter @apps/reception typecheck`
  - `pnpm --filter @apps/reception lint`
  - `pnpm --filter @apps/reception test -- src/app/api/mcp/_shared/__tests__/staff-auth.test.ts src/app/api/mcp/__tests__/booking-email.route.test.ts src/app/api/mcp/__tests__/guest-email-activity.route.test.ts src/services/__tests__/useBookingEmail.test.ts src/services/__tests__/useEmailGuest.test.tsx --maxWorkers=2`

### TASK-02: Resolve production usage attribution for queue vs reception draft paths
- **Type:** INVESTIGATE
- **Deliverable:** Investigation note appended to plan + metrics baseline for 30-day drafted outcomes and path attribution.
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
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

### TASK-03: Add production telemetry for fallback, drafted outcomes, and path usage
- **Type:** IMPLEMENT
- **Deliverable:** Structured counters/events for fallback and path attribution plus daily rollup visibility for operators.
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `packages/mcp-server/src/tools/draft-generate.ts`, `packages/mcp-server/src/tools/gmail.ts`, `packages/mcp-server/src/tools/guest-email-activity.ts`, `packages/mcp-server/src/tools/booking-email.ts`, `packages/mcp-server/src/__tests__/*`, `docs/guides/brikette-email-system.html`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-05, TASK-06, TASK-07, TASK-09, TASK-10
- **Confidence:** 75%
  - Implementation: 75% - multiple tool boundaries need consistent event taxonomy.
  - Approach: 75% - telemetry schema design is clear, but production baselines are not yet established.
  - Impact: 80% - Held-back test: if event taxonomy is inconsistent across paths, dashboards become misleading. Because this single unknown could reduce impact, score held to 75.
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
- **Scouts:** confirm storage location for daily rollup output (`None: choose existing audit/log channel during implementation`).
- **Edge Cases & Hardening:** duplicate event suppression, timezone normalization, missing actor/path metadata fallback.
- **What would make this >=90%:** approved telemetry schema + golden fixtures proving stable aggregates across all active flows.
- **Rollout / rollback:**
  - Rollout: dark-launch telemetry writes before gating on dashboards.
  - Rollback: disable emission via feature flag while preserving core draft paths.
- **Documentation impact:** add telemetry key definitions and interpretation notes for operators.
- **Notes / references:** fact-find V2-03, runtime `8/61` signal, and 0-Drafted ambiguity findings.

### TASK-04: Normalize template references and scoping metadata
- **Type:** IMPLEMENT
- **Deliverable:** Template corpus normalized with canonical references and explicit scope tags for where references are required.
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `packages/mcp-server/data/email-templates.json`, `packages/mcp-server/src/__tests__/draft-generate.test.ts`, `packages/mcp-server/src/__tests__/draft-quality-check.test.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-05, TASK-06
- **Confidence:** 75%
  - Implementation: 75% - template edits are broad and require careful scenario-by-scenario review.
  - Approach: 75% - criterion is defined (`https?://`), but exclusion scoping for non-factual templates needs explicit tagging.
  - Impact: 80% - Held-back test: if scoping tags are wrong, strict checks can over-fail; impact held to 75 overall.
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
- **Scouts:** `None: no external dependency required`.
- **Edge Cases & Hardening:** multilingual templates, policy templates with dynamic placeholders, stale URLs.
- **What would make this >=90%:** complete template tagging matrix with reviewer signoff and zero false-fails in dry-run sample pack.
- **Rollout / rollback:**
  - Rollout: commit template changes with snapshot tests.
  - Rollback: revert template file and disable strict-check enforcement toggle.
- **Documentation impact:** update template authoring guidance with scope-tag rules.
- **Notes / references:** fact-find V2-05 criterion definition.

### TASK-05: Enforce strict context-aware reference quality checks
- **Type:** IMPLEMENT
- **Deliverable:** Expanded `draft_quality_check` rules that require references where applicable and validate appropriateness.
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `packages/mcp-server/src/tools/draft-quality-check.ts`, `packages/mcp-server/src/__tests__/draft-quality-check.test.ts`, `packages/mcp-server/src/__tests__/draft-pipeline.integration.test.ts`
- **Depends on:** TASK-01, TASK-03, TASK-04
- **Blocks:** TASK-06
- **Confidence:** 75%
  - Implementation: 75% - rule expansion is straightforward but requires careful scenario gating.
  - Approach: 75% - avoids Goodhart behavior by checking applicability and not only link presence.
  - Impact: 80% - Held-back test: one bad applicability heuristic could increase manual edits significantly; capped at 75.
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

### TASK-09: Unify label attribution for booking and guest-activity draft flows
- **Type:** IMPLEMENT
- **Deliverable:** Consistent queue/outcome labeling for booking and guest-activity generated drafts.
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
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

### TASK-11: Add startup preflight checks for email system dependencies
- **Type:** IMPLEMENT
- **Deliverable:** Deterministic startup preflight for Gmail/Firebase/Octorate/DB prerequisites with actionable operator messaging.
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
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

### TASK-06: Horizon checkpoint - reassess downstream plan
- **Type:** CHECKPOINT
- **Deliverable:** Updated downstream confidence and dependency integrity via `/lp-replan` after foundation tranche.
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/email-system-design-gaps-v2/plan.md`
- **Depends on:** TASK-03, TASK-04, TASK-05, TASK-09, TASK-11
- **Blocks:** TASK-07, TASK-10
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

### TASK-07: Build unknown-answer capture and reviewed-ledger ingestion
- **Type:** IMPLEMENT
- **Deliverable:** Persistence path for unknown-answer events into reviewed ledger with operator review state.
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `packages/mcp-server/src/tools/draft-interpret.ts`, `packages/mcp-server/src/tools/draft-generate.ts`, `packages/mcp-server/src/tools/*ledger*.ts`, `packages/mcp-server/src/__tests__/draft-*.test.ts`, `docs/guides/brikette-email-system.html`
- **Depends on:** TASK-01, TASK-03, TASK-06
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

### TASK-10: Harden Octorate routing patterns and replay fixtures
- **Type:** IMPLEMENT
- **Deliverable:** Expanded Octorate subject parser/pattern set with replay fixtures and misroute tests.
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `packages/mcp-server/src/tools/gmail.ts`, `packages/mcp-server/src/__tests__/gmail-organize-inbox.test.ts`, `packages/mcp-server/src/__fixtures__/octorate/*`
- **Depends on:** TASK-03, TASK-06
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

### TASK-08: Build reviewed promotion path from ledger into reusable KB/templates
- **Type:** IMPLEMENT
- **Deliverable:** Controlled promotion workflow that writes approved ledger entries to reusable knowledge/template assets with audit trail.
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `packages/mcp-server/src/tools/*ledger*.ts`, `packages/mcp-server/src/resources/brikette-knowledge.ts`, `packages/mcp-server/data/email-templates.json`, `packages/mcp-server/src/__tests__/draft-generate.test.ts`, `packages/mcp-server/src/__tests__/ledger-promotion*.test.ts`
- **Depends on:** TASK-07
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

## Risks & Mitigations

- Auth regression blocks internal operations.
  - Mitigation: explicit role-matrix tests and emergency bypass procedure with audit logging.
- Workflow inactivity leads to mis-prioritized quality work.
  - Mitigation: TASK-02 and TASK-03 establish path-attribution baseline before strict-rule rollout.
- Strict reference enforcement increases deferrals/manual edits.
  - Mitigation: TASK-04 precedes TASK-05; monitor defer/manual-edit rates post rollout.
- Reviewed-ledger backlog exceeds operator capacity.
  - Mitigation: threshold of <=1 unknown/operator-day; add batching/escalation if exceeded.
- Octorate pattern drift continues post-fix.
  - Mitigation: fixture-driven tests and recurring 30-day classification review.

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

## Overall-confidence Calculation

- Effort weights: S=1, M=2, L=3
- Task confidence scores:
  - TASK-01 85 (M=2)
  - TASK-02 85 (S=1)
  - TASK-03 75 (M=2)
  - TASK-04 75 (M=2)
  - TASK-05 75 (M=2)
  - TASK-06 95 (S=1)
  - TASK-07 75 (M=2)
  - TASK-08 75 (M=2)
  - TASK-09 85 (M=2)
  - TASK-10 75 (M=2)
  - TASK-11 85 (S=1)
- Weighted sum = 1505
- Total weight = 19
- Overall-confidence = 1505 / 19 = 79.2% -> **79%**
