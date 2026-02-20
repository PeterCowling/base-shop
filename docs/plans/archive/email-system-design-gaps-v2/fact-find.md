---
Type: Fact-Find
Outcome: Planning
Status: Archived
Domain: API
Workstream: Engineering
Created: 2026-02-19
Last-updated: 2026-02-19
Last-reviewed: 2026-02-19
Feature-Slug: email-system-design-gaps-v2
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-build
Supporting-Skills: none
Related-Plan: docs/plans/archive/email-system-design-gaps-v2/plan.md
Relates-to: docs/plans/archive/email-system-design-gaps/fact-find.md
Business-OS-Integration: off
Business-Unit: BRIK # retained for business context; no active BOS card workflow in this fact-find
Card-ID: none # explicit: not bound to a Business OS card
---

# Email System Design Gaps V2 — Fact-Find Brief

## Scope

### Summary

This `v2` fact-find is a fresh audit of the Brikette email system focused on two integration boundaries and three capability outcomes:

1. Gmail interaction correctness (queueing, locking, drafting, reconciliation).
2. Reception software interaction correctness (activity-triggered drafting, booking emails, cancellation processing).
3. Practical capability quality in production:
   - answer scope breadth,
   - answer quality with website/guide/terms references,
   - self-improvement behavior when answers are unknown.

This document supersedes the depth focus of `docs/plans/archive/email-system-design-gaps/fact-find.md` by adding live dry-run process checks and explicit capability scoring inputs.

### Decision Frame

- Decision owner: Pete Cowling (Product/Engineering).
- Operational co-owner: Cristiana Marzano (Reception operations).
- Decision: Are Gmail/reception integration correctness and capability gaps sufficiently characterized to proceed to `/lp-plan`?

### Goals

- Verify end-to-end process validity for Gmail queue handling and reception-triggered draft creation.
- Identify reliability and control gaps at Gmail <-> MCP <-> Reception/Firebase boundaries.
- Quantify current capability posture for scope, quality, and self-improvement.
- Produce planning-ready, evidence-backed task seeds for a `v2` remediation plan.

### Non-goals

- Implementing fixes in this run.
- Redesigning startup-loop or unrelated CMS/repo systems.
- Altering production Gmail labels/data (all runtime checks were read-only or dry-run where applicable).

### Constraints & Assumptions

- Constraints:
  - Fact-find only; no code mutations.
  - Validation should prefer targeted tests and dry-run/runtime-safe tool calls.
  - Gmail remains the authoritative state machine for inbound processing state.
- Assumptions:
  - Current behavior in `packages/mcp-server` and `apps/reception` is representative of deployed workflows.
  - Missing environment prerequisites (DB URL, Octorate storage state) are operational setup gaps, not evidence of code breakage.

---

## Evidence Audit (Current State)

### Entry Points

- `packages/mcp-server/src/tools/gmail.ts` - inbound Gmail orchestration (`gmail_organize_inbox`, `gmail_list_pending`, `gmail_get_email`, `gmail_mark_processed`, `gmail_reconcile_in_progress`).
- `packages/mcp-server/src/tools/draft-interpret.ts` - EmailActionPlan generation and escalation gating output.
- `packages/mcp-server/src/tools/draft-generate.ts` - template selection, knowledge injection, policy application, first quality gate.
- `packages/mcp-server/src/tools/draft-quality-check.ts` - deterministic quality checks.
- `packages/mcp-server/src/tools/draft-refine.ts` - attestation layer for refined drafts.
- `packages/mcp-server/src/tools/guest-email-activity.ts` - reception activity code -> Gmail draft mapping.
- `packages/mcp-server/src/tools/booking-email.ts` - booking app-link draft creation.
- `packages/mcp-server/src/tools/outbound-drafts.ts` - Prime Firebase outbox -> Gmail draft processing.
- `apps/reception/src/services/useEmailGuest.ts` - frontend call path to `/api/mcp/guest-email-activity`.
- `apps/reception/src/services/useBookingEmail.ts` - frontend call path to `/api/mcp/booking-email`.

### Key Modules / Files

- `packages/mcp-server/src/tools/gmail.ts`
- `packages/mcp-server/src/utils/lock-store.ts`
- `packages/mcp-server/src/utils/organize-query.ts`
- `packages/mcp-server/src/tools/draft-interpret.ts`
- `packages/mcp-server/src/tools/draft-generate.ts`
- `packages/mcp-server/src/tools/draft-quality-check.ts`
- `packages/mcp-server/src/tools/draft-refine.ts`
- `packages/mcp-server/src/resources/brikette-knowledge.ts`
- `apps/reception/src/app/api/mcp/booking-email/route.ts`
- `apps/reception/src/app/api/mcp/guest-email-activity/route.ts`

### Patterns & Conventions Observed

- Gmail label state machine and durable lock files are implemented in code, not only documentation (`packages/mcp-server/src/tools/gmail.ts:110`, `packages/mcp-server/src/utils/lock-store.ts:73`).
- Organize inbox uses label-absence query mode by default (`packages/mcp-server/src/tools/gmail.ts:1736`, `packages/mcp-server/src/utils/organize-query.ts:40`).
- Inbound interpretation/classification is deterministic regex/rule based (`packages/mcp-server/src/tools/draft-interpret.ts:461`).
- Draft generation has bounded fallback behavior if template matching fails (`packages/mcp-server/src/tools/draft-generate.ts:1111`).
- Quality checks are deterministic and coverage-keyword based, not semantic fact verification (`packages/mcp-server/src/tools/draft-quality-check.ts:270`, `packages/mcp-server/src/utils/coverage.ts:33`).
- Reception API routes proxy directly to MCP tooling with no inline auth/authz guard (`apps/reception/src/app/api/mcp/booking-email/route.ts:5`, `apps/reception/src/app/api/mcp/guest-email-activity/route.ts:5`).

### Data & Contracts

- Types/schemas/events:
  - `EmailActionPlan` includes intents, scenarios, escalation, and `escalation_required` (`packages/mcp-server/src/tools/draft-interpret.ts:53`).
  - `PolicyDecision` controls mandatory/prohibited content and review tier (`packages/mcp-server/src/tools/policy-decision.ts:28`).
  - `GuestEmailActivityInput` supports selected activity codes and dry-run (`packages/mcp-server/src/tools/guest-email-activity.ts:39`).
- Persistence:
  - Lock files under `data/locks/` via lock store (`packages/mcp-server/src/utils/lock-store.ts:4`).
  - Audit log via JSONL (`packages/mcp-server/src/tools/gmail.ts:171`).
  - Knowledge and draft guidance from static JSON/resources (`packages/mcp-server/src/resources/brikette-knowledge.ts:86`, `packages/mcp-server/src/resources/draft-guide.ts:33`).
- API/contracts:
  - Gmail API via `getGmailClient`.
  - Firebase REST for outbound draft and cancellation processing (`packages/mcp-server/src/tools/outbound-drafts.ts:91`, `packages/mcp-server/src/tools/process-cancellation-email.ts:33`).

### Dependency & Impact Map

- Upstream dependencies:
  - Gmail OAuth credentials/token availability.
  - Firebase URL/API key for cancellation/outbound automation.
  - Octorate email formats for reservation/cancellation monitor routing.
- Downstream dependents:
  - Human review workflow in Gmail Drafts.
  - Reception activity automation paths (`useEmailGuest`, `useBookingEmail`).
  - Operational auditability via labels and local audit log.
- Likely blast radius:
  - Route auth gaps can allow unauthorized draft generation.
  - Classification/template coverage gaps can degrade response quality.
  - Missing learning loop keeps repeated unknowns unresolved across runs.

### Delivery & Channel Landscape

- Audience/recipient:
  - Hostel Brikette operations team (Pete/Cristiana) for inbox and draft approval.
- Channel constraints:
  - Draft-only output; no auto-send path by design.
- Existing templates/assets:
  - `packages/mcp-server/data/email-templates.json` (53 templates).
  - `packages/mcp-server/data/draft-guide.json`.
- Approvals/owners:
  - Human review before send remains required.
- Compliance constraints:
  - Protected categories (`prepayment`, `cancellation`) cannot be refined (`packages/mcp-server/src/tools/draft-refine.ts:20`).
- Measurement hooks:
  - Audit entries (`lock-acquired`, `lock-released`, `outcome`) in JSONL log (`packages/mcp-server/src/tools/gmail.ts:176`).

### Test Landscape

#### Test Infrastructure

- Frameworks:
  - Jest (governed test runner).
- Commands:
  - `pnpm run test:governed -- jest -- --config packages/mcp-server/jest.config.cjs --maxWorkers=2 --runTestsByPath ...`
  - `pnpm run test:governed -- jest -- --config apps/reception/jest.config.cjs --maxWorkers=2 --runTestsByPath ...`
- CI integration:
  - Existing test suites are present for Gmail, draft pipeline, guest-email activity, booking email, outbound drafts, cancellation processing.

#### Existing Test Coverage (verified this run)

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Gmail organize/label state | Unit | `packages/mcp-server/src/__tests__/gmail-organize-inbox.test.ts`, `packages/mcp-server/src/__tests__/gmail-label-state.test.ts` | Passed |
| Draft pipeline | Integration + Unit | `packages/mcp-server/src/__tests__/draft-pipeline.integration.test.ts`, `packages/mcp-server/src/__tests__/draft-generate.test.ts`, `packages/mcp-server/src/__tests__/draft-quality-check.test.ts`, `packages/mcp-server/src/__tests__/draft-refine.test.ts` | Passed |
| Reception-triggered draft tools | Unit | `packages/mcp-server/src/__tests__/guest-email-activity.test.ts`, `packages/mcp-server/src/__tests__/booking-email.test.ts`, `packages/mcp-server/src/__tests__/outbound-drafts.test.ts` | Passed |
| Cancellation ingestion | Unit | `packages/mcp-server/src/__tests__/process-cancellation-email.test.ts` | Passed |
| Reception service adapters | Unit | `apps/reception/src/services/__tests__/useBookingEmail.test.ts`, `apps/reception/src/services/__tests__/useEmailGuest.test.tsx` | Passed |

#### Coverage Gaps

- Untested paths:
  - Route-level auth/authz for reception MCP endpoints (no guard exists to test).
  - End-to-end semantic answer quality beyond keyword coverage.
  - Automatic learning persistence from unknown question -> approved answer -> future reuse.
- Extinct tests:
  - Not identified in this run.

#### Testability Assessment

- Easy to test:
  - Route guard addition for `/api/mcp/*`.
  - Learning pipeline persistence APIs (write/read assertions).
  - Reference-quality constraints in `draft_quality_check`.
- Hard to test:
  - Real-world semantic correctness against evolving website content.
  - Octorate subject format drift in production streams.
- Test seams needed:
  - Pluggable knowledge source freshness/version checks.
  - Replay harness for real inbox samples to evaluate answer scope over time.

### Runtime Process Validation (Live, 2026-02-19)

- `gmail_organize_inbox({ dryRun: true, limit: 200 })` succeeded.
  - `scannedThreads: 61`, `labeledNeedsProcessing: 8`, `labeledPromotional: 27`, `labeledDeferred: 3`, `processedBookingReservations: 18`, `processedCancellations: 4`.
  - Evidence supports label-absence ingestion and monitor routing working at runtime.
- `gmail_list_pending({ limit: 20 })` returned 2 queue emails.
- `gmail_reconcile_in_progress({ dryRun: true, staleHours: 2, limit: 50 })` returned one stale agreement reply routed to `agreement_received`.
- `prime_process_outbound_drafts({ dryRun: true, firebaseUrl: ... })` succeeded with `No outbound drafts found`.
- `octorate_calendar_check({})` failed due missing storage state file (`.secrets/octorate/storage-state.json`) - operational setup missing, not code failure.
- `health_check` and `health_database` returned degraded DB status (missing `DATABASE_URL`/Prisma availability) while Gmail tools remained callable.
- Additional volume signals from Gmail labels (2026-02-19):
  - `gmail_list_query(label:"Brikette/Queue/Needs-Processing" newer_than:30d)` returned 2 emails.
  - `gmail_list_query(label:"Brikette/Queue/In-Progress" newer_than:30d)` returned 1 email.
  - `gmail_list_query(label:"Brikette/Outcome/Drafted" newer_than:30d)` returned 0 emails.
  - `gmail_list_query(in:inbox newer_than:30d, limit:100)` returned 100 emails with `hasMore: true` (>=100 inbound threads in window).
- Draft pipeline fixture baseline (governed run, 2026-02-19):
  - `draft-pipeline.integration.test.ts` reported `10/10` quality pass and `100%` average question coverage for synthetic fixtures.
  - This harness does not currently emit a production fallback-rate metric.
- Practical workload inference from observed traffic:
  - In the 7-day dry-run window, `8/61` scanned threads (`13.1%`) were routed to `Needs-Processing`.
  - The system currently does not measure what fraction of these `Needs-Processing` threads end in template match vs generic fallback.
- `0 Drafted` ambiguity investigation (2026-02-19):
  - `data/email-audit-log.jsonl` exists but currently contains only `42` rows from `2026-02-19T13:40:22Z` to `2026-02-19T17:14:17Z`.
  - Actor distribution: `codex: 26`, `claude: 3`, `system: 13`; action distribution: `lock-acquired: 8`, `outcome: 21`, `lock-released: 13`.
  - No rows indicate a drafted outcome in the available window.
  - Conclusion: the local audit log does not represent 30-day production workflow usage, so `0` emails on `Brikette/Outcome/Drafted` cannot be attributed to V2-06 alone. Competing hypotheses (workflow inactivity, alternate labeling path, route-specific label behavior) remain.

---

## Issue Analysis (V2)

### Findings by Severity

| ID | Finding | Severity | Evidence |
|---|---|---|---|
| V2-01 | Reception MCP API routes proxy to draft creation with no server-side auth/authz guard | Medium (current private single-computer mode), High if exposure expands | `apps/reception/src/app/api/mcp/booking-email/route.ts:5`, `apps/reception/src/app/api/mcp/guest-email-activity/route.ts:5`; deployment mode decision locked to private/single-computer for now |
| V2-02 | No automatic learning loop for unknown questions; unknowns escalate but do not persist as reusable knowledge | High | `.claude/skills/ops-inbox/SKILL.md:151`, `.claude/skills/ops-inbox/SKILL.md:157`, `packages/mcp-server/src/resources/draft-guide.ts:33` |
| V2-03 | Answer scope bounded by regex scenarios/templates; unmatched inputs can return generic fallback draft | High | `packages/mcp-server/src/tools/draft-interpret.ts:463`, `packages/mcp-server/src/tools/draft-generate.ts:1111`; fixture harness passed `10/10` synthetic cases, but production fallback frequency is not instrumented and recent local audit log is insufficient for 30-day production attribution |
| V2-04 | Quality gate does not globally require website/guide/terms references; link check is narrow (`booking_monitor` only) | Medium | `packages/mcp-server/src/tools/draft-quality-check.ts:306` |
| V2-05 | Template corpus has inconsistent reference richness (24/53 templates with no URL) | Medium | Runtime audit of `packages/mcp-server/data/email-templates.json`; criterion: no `https?://` match in template JSON body (reference-placeholder or non-factual templates may be excluded during normalization scoping) |
| V2-06 | Reception-triggered booking/guest activity draft tools do not apply queue/outcome labels to created drafts | Medium | `packages/mcp-server/src/tools/booking-email.ts:93`, `packages/mcp-server/src/tools/guest-email-activity.ts:213` |
| V2-07 | Octorate monitor matching remains format-sensitive and can classify variants as promotional | Medium | `packages/mcp-server/src/tools/gmail.ts:247`, `packages/mcp-server/src/tools/gmail.ts:255`; in latest `gmail_organize_inbox` dry-run payload, `samples.promotional` (tool-capped first `10` items) contained `4` Octorate reservation-status subjects; separate 30-day promotional query returned `16` Octorate emails |
| V2-08 | Operational setup dependencies are not currently preflight-complete (DB, Octorate session) | Low | `health_check`, `health_database`, `octorate_calendar_check` runtime outputs |

### Detailed Assessment Against User Capability Concerns

#### 1) Extent of answer scope

- Current state:
  - Unvalidated in production for pre-modeled categories and common guest intents (synthetic baseline only).
  - Weak for novel combinations, uncommon operational edge cases, and out-of-distribution wording.
  - Measured baseline: synthetic fixture pack passed `10/10`, but that set is narrow and does not represent production long-tail variation.
- Why:
  - Deterministic regex category detection and bounded template inventory dominate behavior.
  - Knowledge injection is bounded to fixed resource URIs and max injection counts.
- Inference:
  - Scope ceiling is structural, not a transient data issue.
  - Production fallback incidence remains unquantified until explicit telemetry is added.
  - Current observed scale indicates this gap is operationally relevant (`8/61` threads required response handling in the latest scan), but fallback share within that response set is still unknown.

#### 2) Answer quality and references

- Current state:
  - Good baseline structure and policy safety.
  - Not consistently "very high" on reference-backed quality.
- Why:
  - Quality checks emphasize coverage, prohibited claims, presence of signature/html, and selective link checks.
  - No global criterion requiring guide/terms/site reference when answering factual/policy questions.
- Inference:
  - Without stronger quality constraints, quality remains template-dependent and non-uniform.

#### 3) Self-improvement over time

- Current state:
  - Escalation behavior exists for unknowns.
  - Automatic capability improvement loop does not exist.
- Initial reviewed-ledger burden estimate:
  - Observed inbound baseline is `>=100` emails per 30 days.
  - If unknown-answer rate is `5-10%` of inbound traffic, expected review volume is `5-10` ledger entries/month.
  - Pilot feasibility threshold: keep review load at or below `1` unknown entry per operator-day; above that, batch review or triage automation is required.
- Why:
  - No write path from "unknown question" + "user-provided answer" into template/knowledge stores.
  - Guidance recommends escalation sentence and manual follow-up, not persistence.
- Inference:
  - System reliability can remain high while learning maturity stays low unless a persistent feedback pipeline is added.

---

## Questions

### Resolved

- Q: Is Gmail queue processing mechanically protected against stale in-progress states?
  - A: Yes, via lock store + startup recovery + reconcile path.
  - Decision owner: Pete Cowling (Engineering).
  - Evidence: `packages/mcp-server/src/utils/lock-store.ts:73`, `packages/mcp-server/src/tools/gmail.ts:1668`.

- Q: Are the draft and reception adapter test suites currently passing?
  - A: Yes. `10/10` mcp-server suites (`117` tests) and `2/2` reception service suites (`11` tests) passed in this run.
  - Decision owner: Pete Cowling (Engineering).
  - Evidence: governed test run outputs (2026-02-19).

- Q: Is protected text for cancellation/prepayment enforced at tool level?
  - A: Yes, refinement hard-rule guard is in code.
  - Decision owner: Pete Cowling (Engineering).
  - Evidence: `packages/mcp-server/src/tools/draft-refine.ts:20`, `packages/mcp-server/src/tools/draft-refine.ts:140`.

### Decisions Locked (2026-02-19)

- D1 (Deployment topology + security boundary): system will run as a private, single-computer workflow for now.
  - Decision owner: Pete Cowling (Product/Engineering), with Cristiana Marzano (Operations) as consulted operator.
  - Decision: treat current exposure as private/internal.
  - Implementation stance: keep route auth/authz guard work in scope as a required hardening control before any multi-user or externally reachable deployment.
  - Impact: V2-01 operational risk is reduced in current mode, but the control gap remains technical debt if topology changes.

- D2 (Quality policy): strict "reference-required" checks for factual/policy answers are approved.
  - Decision owner: Pete Cowling (Product), with Cristiana Marzano (Operations) as consulted operator.
  - Decision: include website/guide/terms links wherever applicable.
  - Sequencing locked: template normalization precedes strict enforcement to avoid predictable false-fails.

- D3 (Learning architecture): reviewed ledger first.
  - Decision owner: Pete Cowling (Engineering/Product), with Cristiana Marzano (Operations) as co-owner for review workflow.
  - Decision: unknown-answer learning persists to a reviewed ledger first, then promoted to reusable templates/KB via approval workflow.
  - Impact: safer self-improvement path with explicit governance and auditability.

---

## Confidence Inputs

- Implementation: 79%
  - Basis: direct code inspection, targeted tests, and live dry-run tool calls across critical paths.
  - Raise to >=80 action: verify production exposure topology for `/api/mcp/*` and add fallback-rate instrumentation for draft generation outcomes.
  - Raise to >=90 action: add route auth integration tests plus replay-based validation for Octorate and long-tail inbox scenarios.

- Approach: 82%
  - Basis: clear root-cause mapping for scope/quality/learning concerns and integration risks.
  - Maintain >=80 / planning note: keep decision-owner attribution and decision-to-task traceability explicit in the implementation plan.
  - Raise to >=90 action: translate locked decisions into acceptance tests and rollout criteria.

- Impact: 85%
  - Basis: identified issues directly affect operational safety and response quality maturity.
  - Maintain >=80 / planning note: confirm active production path usage (queue vs reception-triggered) so impact is prioritized against live traffic.
  - Raise to >=90 action: validate exposure of reception MCP routes in deployed environment and quantify real-world quality misses from inbox replay.

- Delivery-Readiness: 78%
  - Basis: clear task seeds exist, but environment preflight and instrumentation baseline remain.
  - Raise to >=80 action: complete environment prerequisite checks and fallback/unknown telemetry baseline.
  - Raise to >=90 action: complete acceptance tests for locked decisions and validate staged rollout in production-like replay.

- Testability: 74%
  - Basis: strong deterministic unit harnesses exist, but there is no semantic quality benchmark suite, no route-auth coverage, and no learning-loop coverage.
  - Raise to >=80 action: add route-auth tests for `/api/mcp/*`, introduce quality golden-set assertions with reference requirements, and add unknown-answer persistence tests.
  - Raise to >=90 action: add production replay harness with drift/fallback telemetry and periodic scorecard thresholds.

---

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Unauthorized route access to `/api/mcp/*` | Low in current private mode; high if exposure expands | High | Treat auth guard as mandatory hardening; re-assess immediately on any topology change |
| Draft workflow inactivity masks real capability performance | Medium | High | Owner: Pete Cowling. Track actual queue-processing invocations and drafted outcomes before final priority ordering and before plan task #3 rollout |
| Overly broad reference-required rules causing false-fail drafts | Medium | Medium | Phase rollout: audit templates first, then enforce strict checks |
| Learning loop stores low-quality user answers | Medium | High | Require review/approval workflow before promoting to reusable KB |
| Octorate subject drift bypasses monitor routing | Medium | Medium | Expand parser/pattern strategy and replay real inbox fixtures |
| Operational env gaps hide runtime behavior (DB/session missing) | Medium | Medium | Add preflight checks and fail-fast startup diagnostics |
| Label inconsistency between draft flows | Low | Medium | Align label application across booking/guest/outbound paths |
| Auth sequencing inversion (features before route guard) | Low | High | Gate production rollout so #1 auth guard is completed before #2-#6 features |
| Capability regression during rule hardening | Low | Medium | Add snapshot/golden tests for high-volume scenarios |
| Increased manual review load from stricter gates | Medium | Medium | Add triage severity bands and safe defer workflows |

---

## Planning Constraints & Notes

- Must-follow patterns:
  - Keep Gmail label state machine and lock-store invariants intact.
  - Preserve protected category guardrails (`prepayment`, `cancellation`).
  - Avoid introducing auto-send behavior; draft-only remains invariant.
  - Auth guard (V2-01) must be implemented and validated before any production rollout of #2-#6 capability improvements, regardless of current private topology.
- Rollout/rollback expectations:
  - Security and quality gating should be feature-flagged or staged to avoid operational shock.
  - Learning pipeline should launch in reviewed mode before any auto-promotion.
- Observability expectations:
  - Extend audit logging to capture unknown-answer events and learning decisions.
  - Add route-level auth-denied telemetry for monitoring.

---

## Suggested Task Seeds (Non-binding)

1. Add server-side auth/authz middleware/guards for reception MCP API routes and verify deployment exposure topology (mandatory gate for production rollout of #2-#6).
2. Normalize/upgrade template set to include canonical website/guide/terms references for factual/policy responses.
3. Implement global reference-quality checks in `draft_quality_check` (depends on #2; do not roll out before #1).
4. Add fallback/unknown outcome telemetry (draft generation classification + fallback counter + daily rollup; do not roll out before #1).
5. Build unknown-answer capture pipeline (queue + user-provided answer record + approval state).
6. Add reviewed learning promotion path into knowledge resources/templates with audit trail (depends on #5; do not roll out before #1).
7. Unify label attribution for booking and guest-activity draft creation paths.
8. Harden Octorate routing with broader patterns/parser strategy plus replay test fixtures.
9. Add environment preflight checks for Firebase/Octorate/Gmail dependencies at startup.

---

## Execution Routing Packet

- Primary execution skill:
  - `lp-build`
- Supporting skills:
  - none
- Deliverable acceptance package:
  - route auth tests,
  - quality rule tests,
  - learning-loop persistence tests,
  - end-to-end dry-run verification scripts,
  - operator-facing runbook updates.
- Post-delivery measurement plan:
  - track unresolved-question rate,
  - track reference-link compliance rate,
  - track deferred-for-human volume and conversion to reusable knowledge.

---

## Evidence Gap Review

### Gaps Addressed

- Verified existing tests by executing targeted governed suites (not only listing files).
- Inspected integration boundaries (Gmail, Firebase, reception API routes, Octorate checks).
- Exercised runtime-safe tool calls (`organize`, `pending`, `reconcile`, outbound dry-run).
- Checked error/fallback paths and operational readiness signals.
- Investigated `0 Drafted` ambiguity with local audit-log read; confirmed available log window is session-local, not a 30-day production usage history.

### Confidence Adjustments

- Tempered implementation confidence because route exposure and fallback frequency are not yet measured in production.
- Reduced delivery-readiness confidence due unresolved environment preflight and policy choices.
- Lowered testability confidence due absent semantic quality, route-auth, and learning-loop coverage.

### Remaining Assumptions

- Current private single-computer deployment model remains in place until explicitly changed.
- Reference-required enforcement can be rolled out without unacceptable false-fail volume after template normalization.
- Reviewed-ledger promotion workflow is operated consistently (no bypass writes to templates/KB).
- Local audit-log coverage will be extended (or replaced with durable metrics) to support real production usage attribution in subsequent planning cycles.

---

## Planning Readiness

- Status: Ready-for-planning
- Blocking items:
  - Plan creation: unblocked.
  - Implementation kickoff: blocked on initial instrumentation baseline tasks (#1-#4) and environment preflight completion because Delivery-Readiness is `78%` (<80 implementation threshold).
- Recommended next step:
  - `/lp-plan docs/plans/archive/email-system-design-gaps-v2/fact-find.md`
