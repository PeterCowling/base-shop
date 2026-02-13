---
Type: Plan
Status: Active
Domain: Automation
Workstream: Engineering
Created: 2026-02-11
Last-updated: 2026-02-11
Last-reviewed: 2026-02-11
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-guest-email-cutover
Deliverable-Type: code-change
Execution-Track: code
Primary-Execution-Skill: lp-build
Supporting-Skills: ops-inbox
Overall-confidence: 84%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Business-OS-Integration: on
Business-Unit: BRIK
Card-ID: BRIK-ENG-0020
---

# Reception Guest Email Cutover Plan

## Summary

This plan removes the remaining direct Google Apps Script dependency from reception guest-email activity handling and moves it to the in-repo MCP path. The immediate cutover is draft-first and parity-first for the confirmed high-value activities: code `21` (agreement received) and codes `5/6/7/8` (prepayment progression). For uncertain behavior, the system will fail safe by returning a deferred/manual-review result rather than drafting potentially incorrect emails. A checkpoint is included before phase-2 expansion so we can validate mailbox behavior with real dry-runs before taking on lower-confidence legacy parity work.

## Goals

- Remove direct `script.google.com` calls from reception guest-email flow.
- Keep activity-trigger semantics in `useActivitiesMutations` while routing through MCP.
- Generate drafts (not sends) for activity-driven guest emails.
- Enforce GAS wording parity first for codes `5/6/7/8` and agreement-confirmation wording for code `21`.
- Add tests that replace extinct GAS-url assertions and cover new route/tool contracts.

## Non-goals

- Replacing GAS triggers globally in this plan.
- Migrating unrelated Apps Script systems (Alloggiati, stats, etc.).
- Full parity migration for uncertain code families `2/3/4` in this phase.

## Constraints & Assumptions

- Constraints:
  - No direct external GAS URL use in live reception path.
  - Draft-first mode is required (no automatic send).
  - If behavior is uncertain, return deferred/manual-review outcome.
- Assumptions:
  - Existing template corpus in `packages/mcp-server/data/email-templates.json` is canonical for agreement and prepayment messaging.
  - Reservation code shape remains usable for provider inference where needed (`Hostelworld` vs `Octorate`).

## Fact-Find Reference

- Related brief: `docs/plans/reception-guest-email-cutover-lp-fact-find.md`
- Key findings used here:
  - `useEmailGuest` still calls GAS directly (`apps/reception/src/services/useEmailGuest.ts:36`).
  - Activity-trigger seam is centralized in `useActivitiesMutations` (`apps/reception/src/hooks/mutations/useActivitiesMutations.ts:34`).
  - Existing MCP route pattern already exists for booking email (`apps/reception/src/app/api/mcp/booking-email/route.ts:5`).
  - User decisions resolved:
    - draft-first
    - GAS wording parity first for codes `5/6/7/8`

## Existing System Notes

- Key modules/files:
  - `apps/reception/src/services/useEmailGuest.ts` - direct GAS fetch + simulation mode.
  - `apps/reception/src/hooks/mutations/useActivitiesMutations.ts` - trigger list `[2,3,4,21,5,6,7,8]` and side effect call.
  - `apps/reception/src/services/useBookingEmail.ts` - in-repo MCP route usage pattern.
  - `apps/reception/src/app/api/mcp/booking-email/route.ts` - thin POST passthrough pattern.
  - `packages/mcp-server/data/email-templates.json` - agreement + prepayment copy.
  - `packages/mcp-server/src/tools/gmail.ts` - draft creation + label workflow patterns.
  - `packages/mcp-server/src/utils/workflow-triggers.ts` - prepayment subject metadata (currently mapped to old activity codes 2/3/4/21).
- Patterns to follow:
  - Reception service -> internal API route -> `@acme/mcp-server/*` helper.
  - MCP tool functions return typed success/error payloads and are route-friendly.

## Proposed Approach

Create a new MCP guest-activity draft helper and reception API route for activity-driven guest emails. Refactor `useEmailGuest` to call this route with `bookingRef + activityCode` (and optional context), then update `useActivitiesMutations` to pass through code-aware payloads. Implement known mappings with exact wording parity for `21,5,6,7,8`; return explicit deferred results for unknown/unsupported mappings (starting with `2/3/4`) until phase-2 parity evidence is captured.

- Option A: strict all-code parity in one pass (2/3/4/21/5/6/7/8).
  - Trade-off: higher regression risk now due incomplete live GAS source for `2/3/4` branches.
- Option B: safe cutover for high-confidence codes now + deferred fallback for uncertain codes.
  - Trade-off: some automations move to manual review until phase-2 parity capture.
- Chosen: Option B.
  - Reason: aligns with explicit user instruction to defer when uncertain and avoids wrong outbound drafts.

## Active tasks

- TASK-01 - MCP guest-activity draft contract and parity mapping.
- TASK-02 - Reception route and hook contract migration.
- TASK-03 - Activity-trigger integration with code-aware payload.
- TASK-04 - Replace extinct tests and add new contract coverage.
- TASK-05 - Horizon checkpoint with production dry-run evidence.
- TASK-06 - Phase 2 deferred parity capture for codes `2/3/4`.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Build MCP guest-activity draft helper with draft-first parity mapping for `21,5,6,7,8` and deferred fallback | 84% | M | Complete (2026-02-11) | - | TASK-02, TASK-04 |
| TASK-02 | IMPLEMENT | Add reception API route and refactor `useEmailGuest` to MCP route contract | 86% | M | Complete (2026-02-11) | TASK-01 | TASK-03, TASK-04 |
| TASK-03 | IMPLEMENT | Update `useActivitiesMutations` to pass `activityCode` and handle deferred outcomes safely | 83% | M | Complete (2026-02-11) | TASK-02 | TASK-04, TASK-05 |
| TASK-04 | IMPLEMENT | Replace extinct GAS tests and add new reception + MCP contract tests | 82% | M | Complete (2026-02-11) | TASK-01, TASK-02, TASK-03 | TASK-05 |
| TASK-05 | CHECKPOINT | Reassess cutover with dry-run evidence before enabling broader parity scope | 95% | S | Pending | TASK-03, TASK-04 | TASK-06 |
| TASK-06 | INVESTIGATE | Phase 2 deferred work: capture and encode parity for codes `2/3/4` | 74% ⚠️ | S | Pending | TASK-05 | - |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | TASK-01 | - | Define canonical mapping and draft contract first |
| 2 | TASK-02 | TASK-01 | Route + hook interface migration |
| 3 | TASK-03 | TASK-02 | Activity trigger integration |
| 4 | TASK-04 | TASK-01, TASK-02, TASK-03 | Tests after all interfaces settle |
| 5 | TASK-05 (CHECKPOINT) | TASK-03, TASK-04 | Dry-run gate before broader parity work |
| 6 | TASK-06 | TASK-05 | Deferred phase-2 parity capture |

**Max parallelism:** 1 | **Critical path:** 6 waves | **Total tasks:** 6

## Tasks

### TASK-01: MCP guest-activity draft contract and parity mapping

- **Type:** IMPLEMENT
- **Deliverable:** code-change - `packages/mcp-server/src/tools/guest-email-activity.ts` (+ export shim)
- **Execution-Skill:** lp-build
- **Affects:** `packages/mcp-server/src/tools/guest-email-activity.ts`, `packages/mcp-server/src/guest-email-activity.ts`, `packages/mcp-server/src/tools/index.ts`, `[readonly] packages/mcp-server/data/email-templates.json`, `[readonly] apps/reception/src/constants/activities.ts`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-04
- **Confidence:** 84%
  - Implementation: 86% - Existing booking-email helper pattern is reusable for Gmail draft creation (`packages/mcp-server/src/tools/booking-email.ts`).
  - Approach: 85% - MCP-first route helper removes external dependency and keeps behavior testable.
  - Impact: 84% - Bounded to new helper path; fallback to deferred limits blast radius for unknown mappings.
- **Acceptance:**
  - New helper accepts at least `bookingRef`, `activityCode`, and optional provider/context.
  - Codes `21,5,6,7,8` produce draft payloads using parity template subjects/content.
  - Unknown/unsupported code returns `deferred` (no draft), with machine-readable reason.
  - Output includes explicit `status` (`drafted|deferred|error`) and draft metadata when drafted.
- **Validation contract:**
  - TC-01: code `21` -> subject `Agreement Received`, body starts with agreed wording -> `status=drafted`.
  - TC-02: code `5` -> first-attempt prepayment template selection honors provider split and parity wording.
  - TC-03: code `6/7/8` -> maps to second/third/success prepayment templates.
  - TC-04: code `2/3/4` -> returns `status=deferred` with reason `unsupported-activity-code` (phase-2).
  - TC-05: Gmail client unavailable -> helper returns/throws structured error consumed by route.
  - **Acceptance coverage:** TC-01..TC-03 cover parity mappings, TC-04 deferred safety path, TC-05 failure behavior.
  - **Validation type:** unit (node jest)
  - **Validation location/evidence:** `packages/mcp-server/src/__tests__/guest-email-activity.test.ts` (new)
  - **Run/verify:** `pnpm exec jest --ci --runInBand --detectOpenHandles --passWithNoTests --config ./jest.config.cjs --rootDir packages/mcp-server -- src/__tests__/guest-email-activity.test.ts --maxWorkers=2`
- **Execution plan:**
  - **Code/mixed tasks:** Red -> Green -> Refactor
  - **Red evidence:** add tests for code map and deferred behavior first; verify failures before implementation.
  - **Green evidence:** implement helper and pass TC-01..TC-05.
  - **Refactor evidence:** extract mapping constants and keep return shape stable.
- **Scouts:**
  - Template presence for target subjects -> file lookup in `packages/mcp-server/data/email-templates.json:8`, `packages/mcp-server/data/email-templates.json:53`, `packages/mcp-server/data/email-templates.json:58`, `packages/mcp-server/data/email-templates.json:63`, `packages/mcp-server/data/email-templates.json:93` -> confirmed.
  - Reservation/provider inference precedent -> `apps/brikette-scripts/src/booking-monitor/_EmailsHelper.gs:49` -> confirmed.
- **Planning validation:**
  - Checks run: `pnpm exec jest --ci --runInBand --detectOpenHandles --passWithNoTests --config ./jest.config.cjs --rootDir packages/mcp-server -- src/__tests__/draft-generate.test.ts --maxWorkers=2` - PASS (16 tests).
  - Validation artifacts written: none yet.
  - Unexpected findings: root-level targeted jest command needed `--rootDir packages/mcp-server` to avoid monorepo/worktree haste collisions.
- **What would make this >=90%:**
  - Capture 3+ real production examples per code family and assert body parity snapshots.
- **Rollout / rollback:**
  - Rollout: helper introduced behind new route only; no existing caller switched until TASK-02/03.
  - Rollback: stop routing calls to new route and revert helper files.
- **Documentation impact:**
  - Update `packages/mcp-server/docs/email-autodraft-system.md` with new guest-activity helper contract.
- **Notes / references:**
  - Existing draft helper pattern: `packages/mcp-server/src/tools/booking-email.ts:43`.
  - Existing workflow metadata mismatch to watch: `packages/mcp-server/src/utils/workflow-triggers.ts:69` vs reception code constants `apps/reception/src/constants/activities.ts:6`.

### TASK-02: Reception route + `useEmailGuest` contract migration

- **Type:** IMPLEMENT
- **Deliverable:** code-change - new route + hook API update
- **Execution-Skill:** lp-build
- **Affects:** `apps/reception/src/app/api/mcp/guest-email-activity/route.ts`, `apps/reception/src/services/useEmailGuest.ts`, `[readonly] apps/reception/src/app/api/mcp/booking-email/route.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-03, TASK-04
- **Confidence:** 86%
  - Implementation: 88% - booking-email route/hook patterns already exist and are directly reusable.
  - Approach: 86% - consolidates all reception outbound email calls through internal API surface.
  - Impact: 86% - API-contract change is scoped to one hook and one callsite chain.
- **Acceptance:**
  - New route `POST /api/mcp/guest-email-activity` delegates to MCP helper and normalizes errors to JSON.
  - `useEmailGuest` no longer accepts `enableEmail` simulation mode.
  - `useEmailGuest.sendEmailGuest` accepts structured payload including `activityCode`.
  - No `script.google.com` reference remains in `useEmailGuest`.
- **Validation contract:**
  - TC-06: hook posts to `/api/mcp/guest-email-activity` with `bookingRef + activityCode`.
  - TC-07: route propagates MCP success payload (drafted/deferred).
  - TC-08: route returns `{success:false,error}` with status 400 on helper exceptions.
  - TC-09: grep confirms no GAS URL in `apps/reception/src/services/useEmailGuest.ts`.
  - **Acceptance coverage:** TC-06..TC-09 map 1:1 to acceptance bullets.
  - **Validation type:** unit + contract
  - **Validation location/evidence:** `apps/reception/src/services/__tests__/useEmailGuest.test.tsx`, new route test file under `apps/reception/src/app/api/mcp/guest-email-activity/__tests__/route.test.ts`.
  - **Run/verify:** `pnpm --filter reception test -- src/services/__tests__/useEmailGuest.test.tsx --maxWorkers=2`
- **Execution plan:**
  - **Code/mixed tasks:** Red -> Green -> Refactor
  - **Red evidence:** update tests to expect new route and confirm they fail on old GAS URL behavior.
  - **Green evidence:** route + hook implementation passes updated tests.
  - **Refactor evidence:** keep shared request/response types co-located to avoid drift.
- **Scouts:**
  - Existing route passthrough style -> `apps/reception/src/app/api/mcp/booking-email/route.ts:5` -> confirmed.
  - Existing hook route call style -> `apps/reception/src/services/useBookingEmail.ts:117` -> confirmed.
- **Planning validation:**
  - Checks run: reviewed route + hook pattern files with line-level references.
  - Validation artifacts written: none yet.
  - Unexpected findings: existing `useEmailGuest` test contains extinct GAS-url assertions and must be replaced.
- **What would make this >=90%:**
  - Route-level tests passing with both drafted and deferred payloads.
- **Rollout / rollback:**
  - Rollout: merge route/hook change before mutation callsite update.
  - Rollback: revert hook to previous implementation and disable route usage.
- **Documentation impact:**
  - Update `apps/reception/README.md` route list to include `/api/mcp/guest-email-activity`.
- **Notes / references:**
  - GAS endpoint currently hardcoded at `apps/reception/src/services/useEmailGuest.ts:36`.

### TASK-03: Activity-trigger integration (`useActivitiesMutations`)

- **Type:** IMPLEMENT
- **Deliverable:** code-change - activity side-effect callsite migration
- **Execution-Skill:** lp-build
- **Affects:** `apps/reception/src/hooks/mutations/useActivitiesMutations.ts`, `[readonly] apps/reception/src/constants/activities.ts`
- **Depends on:** TASK-02
- **Blocks:** TASK-04, TASK-05
- **Confidence:** 83%
  - Implementation: 85% - single side-effect seam (`maybeSendEmailGuest`) is isolated and already code-gated.
  - Approach: 84% - code-aware payload keeps trigger ownership in existing mutation boundary.
  - Impact: 83% - path runs on every relevant activity write; needs explicit deferred/error handling.
- **Acceptance:**
  - `maybeSendEmailGuest` passes `reservationCode` + triggering `code` to `useEmailGuest`.
  - For deferred result, warning is logged with activity code and reservation reference.
  - `addActivity` still completes successfully even when email drafting is deferred.
  - Trigger list remains explicit and unchanged unless deliberately revised.
- **Validation contract:**
  - TC-10: for relevant code and reservation found, hook calls `sendEmailGuest({ bookingRef, activityCode })`.
  - TC-11: when helper returns deferred, mutation logs warning and does not throw.
  - TC-12: when reservationCode missing, existing warning path still triggers.
  - TC-13: non-relevant code does not call `sendEmailGuest`.
  - **Acceptance coverage:** TC-10..TC-13 cover invocation, defer behavior, error tolerance, and guard rails.
  - **Validation type:** unit
  - **Validation location/evidence:** new `apps/reception/src/hooks/mutations/__tests__/useActivitiesMutations.test.ts`.
  - **Run/verify:** `pnpm --filter reception test -- src/hooks/mutations/__tests__/useActivitiesMutations.test.ts --maxWorkers=2`
- **Execution plan:**
  - **Code/mixed tasks:** Red -> Green -> Refactor
  - **Red evidence:** add side-effect tests first; verify current implementation fails new payload/deferred expectations.
  - **Green evidence:** update hook and pass all side-effect tests.
  - **Refactor evidence:** extract small helper for result logging if needed.
- **Scouts:**
  - Current trigger codes and callsite confirmed at `apps/reception/src/hooks/mutations/useActivitiesMutations.ts:34` and `apps/reception/src/hooks/mutations/useActivitiesMutations.ts:52`.
- **Planning validation:**
  - Checks run: source inspection + data lookup path confirmation.
  - Validation artifacts written: none yet.
  - Unexpected findings: none.
- **What would make this >=90%:**
  - Live dry-run evidence for each mapped code showing intended drafted/deferred outcomes.
- **Rollout / rollback:**
  - Rollout: deploy with draft-first status-only response; no send path.
  - Rollback: disable `maybeSendEmailGuest` call and keep activity logging intact.
- **Documentation impact:**
  - None.
- **Notes / references:**
  - Current side effect call sits after DB write in `addActivity`, preserving write-first semantics (`apps/reception/src/hooks/mutations/useActivitiesMutations.ts:112`).

### TASK-04: Replace extinct tests and add contract coverage

- **Type:** IMPLEMENT
- **Deliverable:** code-change - updated/new tests for reception and mcp-server
- **Execution-Skill:** lp-build
- **Affects:** `apps/reception/src/services/__tests__/useEmailGuest.test.tsx`, `apps/reception/src/hooks/mutations/__tests__/useActivitiesMutations.test.ts` (new), `packages/mcp-server/src/__tests__/guest-email-activity.test.ts` (new), `[readonly] packages/mcp-server/src/__tests__/draft-generate.test.ts`
- **Depends on:** TASK-01, TASK-02, TASK-03
- **Blocks:** TASK-05
- **Confidence:** 82%
  - Implementation: 84% - existing test harness patterns are clear in both packages.
  - Approach: 82% - replaces obsolete contract assertions with route/tool contract tests.
  - Impact: 82% - broadens safety net across both app and server boundaries.
- **Acceptance:**
  - Old GAS-url assertion tests are removed/replaced.
  - New tests cover drafted/deferred/error outcomes end-to-end at unit/contract seams.
  - Existing unaffected tests still pass.
- **Validation contract:**
  - TC-14: updated `useEmailGuest` test validates route payload and response handling.
  - TC-15: new `useActivitiesMutations` tests validate code-trigger behavior and deferred tolerance.
  - TC-16: new MCP helper tests validate parity mapping for `21,5,6,7,8` and deferred for `2/3/4`.
  - TC-17: existing agreement generation test remains green (`draft-generate` TC-02b).
  - **Acceptance coverage:** TC-14..TC-17 fully cover acceptance bullets.
  - **Validation type:** unit + contract
  - **Validation location/evidence:** test files above.
  - **Run/verify:**
    - `pnpm --filter reception test -- src/services/__tests__/useEmailGuest.test.tsx --maxWorkers=2`
    - `pnpm --filter reception test -- src/hooks/mutations/__tests__/useActivitiesMutations.test.ts --maxWorkers=2`
    - `pnpm exec jest --ci --runInBand --detectOpenHandles --passWithNoTests --config ./jest.config.cjs --rootDir packages/mcp-server -- src/__tests__/guest-email-activity.test.ts --maxWorkers=2`
    - `pnpm exec jest --ci --runInBand --detectOpenHandles --passWithNoTests --config ./jest.config.cjs --rootDir packages/mcp-server -- src/__tests__/draft-generate.test.ts --maxWorkers=2`
- **Execution plan:**
  - **Code/mixed tasks:** Red -> Green -> Refactor
  - **Red evidence:** old tests fail once GAS URL is removed.
  - **Green evidence:** all new/updated tests pass.
  - **Refactor evidence:** shared mock setup extraction where duplicated.
- **Scouts:**
  - Extinct test identified: `apps/reception/src/services/__tests__/useEmailGuest.test.tsx:51` (hardcoded GAS URL assertion).
- **Planning validation:**
  - Checks run:
    - `pnpm --filter reception test -- src/services/__tests__/useEmailGuest.test.tsx --maxWorkers=2` - PASS (2 tests).
    - `pnpm --filter reception test -- src/hooks/orchestrations/emailAutomation/__tests__/useEmailProgressActions.test.ts --maxWorkers=2` - PASS (2 tests).
    - `pnpm exec jest --ci --runInBand --detectOpenHandles --passWithNoTests --config ./jest.config.cjs --rootDir packages/mcp-server -- src/__tests__/draft-generate.test.ts --maxWorkers=2` - PASS (16 tests).
  - Validation artifacts written: none yet.
  - Unexpected findings:
    - Root `pnpm test` is guard-blocked by policy; targeted commands required.
    - Without `--rootDir packages/mcp-server`, jest hits monorepo/worktree haste collisions.
- **What would make this >=90%:**
  - Add one integration-style test from route POST payload through helper mock and assert response normalization.
- **Rollout / rollback:**
  - Rollout: merge tests with implementation; no separate deploy action.
  - Rollback: revert test updates together with implementation revert.
- **Documentation impact:**
  - None.
- **Notes / references:**
  - Existing agreement behavior assertion: `packages/mcp-server/src/__tests__/draft-generate.test.ts:205`.

### TASK-05: Horizon checkpoint - dry-run and reassess remaining scope

- **Type:** CHECKPOINT
- **Deliverable:** plan reassessment record in this plan + dry-run evidence summary
- **Execution-Skill:** lp-build
- **Affects:** `docs/plans/reception-guest-email-cutover-plan.md` (status updates + findings)
- **Depends on:** TASK-03, TASK-04
- **Blocks:** TASK-06
- **Confidence:** 95%
  - Implementation: 95% - procedural checkpoint with defined evidence gates.
  - Approach: 95% - catches regression before extending parity scope.
  - Impact: 95% - reduces risk of hidden behavior drift.
- **Acceptance:**
  - Run dry-runs for at least one sample each of codes `21`, `5`, `6`, `7`, `8` and capture exact drafted subject/body outcomes.
  - Confirm route/helper returns deferred for `2/3/4` with actionable reason.
  - Record go/no-go for disabling remaining live GAS dependency in reception guest-email path.
- **Horizon assumptions to validate:**
  - Known-code parity is acceptable in real mailbox output.
  - Deferred fallback is operationally acceptable until phase-2 parity lands.
- **Notes / references:**
  - Build should pause here for reassessment before phase-2 scope.

### TASK-06: Phase 2 deferred work - parity capture for activity codes `2/3/4`

- **Type:** INVESTIGATE
- **Deliverable:** parity matrix artifact + recommended mapping update
- **Execution-Skill:** lp-build
- **Affects:** `[readonly] live GAS endpoint behavior`, `docs/plans/reception-guest-email-cutover-plan.md`, potential follow-up changes in `packages/mcp-server/src/tools/guest-email-activity.ts`
- **Depends on:** TASK-05
- **Blocks:** -
- **Confidence:** 74% ⚠️ BELOW THRESHOLD
  - Implementation: 78% - extraction process is clear but source behavior is outside repo.
  - Approach: 74% - needs empirical parity capture before coding.
  - Impact: 74% - wrong mapping risks guest-facing regression.
- **Blockers / questions to answer:**
  - What exact draft content/branching does live GAS produce for codes `2/3/4`?
  - Are there provider/channel conditions affecting those messages?
- **Acceptance:**
  - Capture at least 3 real examples per code (`2/3/4`) from live behavior.
  - Produce mapping recommendation with exact subject/body source.
  - Update this plan with concrete implementation follow-up tasks.
- **What would make this >=90%:**
  - Committed fixture corpus + approved mapping matrix from operator review.
- **Notes / references:**
  - Current uncertain area is explicitly deferred by design.

## Risks & Mitigations

- Risk: wrong template mapping for activity codes causes guest confusion.
  - Mitigation: known-code-only mapping + explicit deferred fallback for uncertain codes + checkpoint dry-run.
- Risk: stale/obsolete tests mask regressions.
  - Mitigation: replace extinct GAS URL tests and add code-aware route/helper tests.
- Risk: monorepo jest collisions reduce validation reliability.
  - Mitigation: use targeted commands with `--rootDir packages/mcp-server` for mcp-server tests.

## Observability

- Logging:
  - Log each guest-activity draft attempt with `bookingRef`, `activityCode`, and outcome (`drafted|deferred|error`).
- Metrics:
  - Count drafts created by activity code.
  - Count deferred outcomes by reason.
  - Count route/helper failures.
- Alerts/Dashboards:
  - Daily review of deferred counts for `2/3/4` during phase-2 prep.

## Acceptance Criteria (overall)

- [ ] `useEmailGuest` has no direct GAS URL dependency.
- [ ] Activity-triggered guest emails route through reception API + MCP helper.
- [ ] Draft-first behavior is enforced for all mapped codes.
- [ ] Wording parity is implemented for `21,5,6,7,8`.
- [ ] Unknown/uncertain mappings return deferred and do not draft.
- [ ] Targeted reception and mcp-server tests pass.

## Decision Log

- 2026-02-11: Selected draft-first mode for activity-triggered guest emails.
- 2026-02-11: Selected GAS wording parity first for codes `5/6/7/8`.
- 2026-02-11: Chose safe-phase cutover (known mappings now, deferred fallback for `2/3/4`) to avoid incorrect outbound drafts.
- 2026-02-11: Completed TASK-01..TASK-04 implementation and validation; next gate is TASK-05 dry-run checkpoint.
