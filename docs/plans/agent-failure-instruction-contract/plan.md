---
Type: Plan
Status: Active
Domain: Platform
Workstream: Engineering
Created: 2026-03-06
Last-reviewed: 2026-03-06
Last-updated: 2026-03-06
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: agent-failure-instruction-contract
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 84%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan-only
artifact: plan
---

# Agent Failure Instruction Contract Plan

## Summary
This plan hardens agent-facing failure messages so blocked paths end ambiguity instead of creating retry loops. The first wave stays deliberately narrow: define a shared failure-message contract, apply it to the shell/guard surfaces where agents are currently blocked most often, then extend the same contract to structured preflight errors where the next action is currently underspecified. The plan avoids changing enforcement semantics; it upgrades the guidance layer and adds tests so the messaging stays aligned with the actual valid recovery path.

## Active tasks
- [x] TASK-01: Define the shared failure-instruction contract and first-wave adoption rules
- [ ] TASK-02: Apply the contract to shell and git/writer-lock guard surfaces
- [ ] TASK-03: Apply the contract to TypeScript preflight and tool-guidance surfaces

## Goals
- Define a minimum agent-failure contract with required fields and examples.
- Remove bare or ambiguous recovery messages from the first-wave guard surfaces.
- Add regression coverage so exact-next-step guidance does not drift.

## Non-goals
- Reworking the underlying git safety or writer-lock enforcement logic.
- Solving every runtime/product error message in the repo in the first wave.
- Building telemetry-heavy efficiency measurement in this implementation cycle.

## Constraints & Assumptions
- Constraints:
  - Fail-closed behavior must remain unchanged.
  - Guidance must name exact next steps and exact non-working retries.
  - Shared messages must stay accurate to the repo’s real valid paths.
- Assumptions:
  - First-wave scope should remain limited to agent guard/preflight surfaces.
  - A small shared contract or helper is cheaper to maintain than ad hoc copy drift across each surface.

## Inherited Outcome Contract
- **Why:** A blocked or failed path should terminate ambiguity, not create more of it. Precise next-step instructions are an efficiency control that prevents retry loops and wasted tool exploration.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Agent-facing failure messages across guards and blocked operations follow a precise contract that says whether retry is valid, what exact next step to take, and when to stop escalating locally.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/agent-failure-instruction-contract/fact-find.md`
- Key findings used:
  - PreToolUse and writer-lock guards already demonstrate the target message pattern.
  - `scripts/agent-bin/git` still has bare infrastructure errors with no exact next-step guidance.
  - Structured preflight surfaces identify failures but do not yet expose a standard recovery contract.

## Proposed Approach
- Option A:
  - Patch each failing surface independently with bespoke copy.
- Option B:
  - Define one minimum failure-instruction contract, then adopt it across the first-wave surfaces with tests.
- Chosen approach:
  - Option B. The problem is consistency and loop prevention, so the solution must start with a shared contract rather than independent wording changes.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Define the shared failure-instruction contract and first-wave adoption checklist | 88% | S | Complete (2026-03-06) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Apply the contract to shell/guard surfaces and lock tests to exact-next-step behavior | 84% | M | Pending | TASK-01 | - |
| TASK-03 | IMPLEMENT | Apply the contract to structured preflight/tool-guidance surfaces and add regression checks | 83% | M | Pending | TASK-01 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Establishes the shared contract and first-wave file list. |
| 2 | TASK-02, TASK-03 | TASK-01 | Parallel-safe after contract wording and fields are fixed. |

## Tasks

### TASK-01: Define the shared failure-instruction contract and first-wave adoption rules
- **Type:** IMPLEMENT
- **Deliverable:** contract doc and adoption checklist embedded in repo-facing guidance; output locations in `AGENTS.md` and/or adjacent repo docs chosen during build
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-06)
- **Build evidence:** Commit `36b85704de`. New section `## Agent Failure Message Contract` added to `AGENTS.md` (lines 92–158). All five required fields defined. Three message classes documented with reference implementations. First-wave adoption checklist names TASK-02 and TASK-03 target files explicitly. VC-01 ✓ (required fields + one real example per class). VC-02 ✓ (TASK-02 and TASK-03 targets derivable from checklist without discovery). Inline execution (Codex offload blocked by lock contention from concurrent session).
- **Artifact-Destination:** `AGENTS.md` new section `## Agent Failure Message Contract` (default target; exact section name confirmed in Red step). Only move to a standalone file if AGENTS.md insertion is blocked by size or scope constraints.
- **Reviewer:** repo/platform maintainer
- **Approval-Evidence:** `None: plan-only phase`
- **Measurement-Readiness:** session-finding review after rollout; no direct metric instrumentation in this task
- **Affects:** `AGENTS.md`, `CLAUDE.md`, `[readonly] docs/plans/agent-failure-instruction-contract/fact-find.md`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 88%
  - Implementation: 93% - contract scope is documentation and policy synthesis, with repo-local evidence already identified
  - Approach: 90% - shared contract addresses the actual failure mode of inconsistent blocked-state guidance
  - Impact: 88% - a common contract reduces drift across the first-wave surfaces
  - Note: per Confidence-Method (min of dimensions), 88% = min(93%, 90%, 88%)
- **Acceptance:**
  - A minimum failure-instruction contract is defined with required fields: failure reason, retry posture, exact next step, exact anti-retry list, escalation/stop condition.
  - First-wave adoption list is explicitly named.
  - The contract differentiates hard-block, recoverable-fallback, and fail-closed-infrastructure cases.
- **Validation contract (VC-01):**
  - VC-01: Contract completeness -> pass when required fields and message classes are explicitly documented with at least one repo-real example per class. Time-box: pass at task acceptance (end of TASK-01 build cycle).
  - VC-02: First-wave scope clarity -> pass when TASK-02 and TASK-03 target files can be derived directly from the contract output without new discovery. Time-box: pass at task acceptance (end of TASK-01 build cycle).
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan:
    - Confirm current repo examples that do and do not satisfy the contract.
  - Green evidence plan:
    - Write the contract and adoption checklist.
  - Refactor evidence plan:
    - Collapse duplicated wording in docs if the contract can point to a single canonical explanation.
- **Planning validation (required for M/L):**
  - Checks run: `None: S-effort task`
  - Validation artifacts: `docs/plans/agent-failure-instruction-contract/fact-find.md`
  - Unexpected findings: None
- **Scouts:** None: task is already bounded by fact-find evidence
- **Edge Cases & Hardening:** Ensure the contract allows fail-closed errors where no retry is valid, not just blocked-command flows.
- **What would make this >=90%:**
  - Already at 90%; only a conflicting existing house style would lower certainty.
- **Rollout / rollback:**
  - Rollout: land contract before any message rewrites
  - Rollback: remove/adjust contract wording with no runtime impact
- **Documentation impact:**
  - High; this task defines the normative wording rules used by follow-on implementation tasks.
- **Notes / references:**
  - Reference strong examples: `.claude/hooks/pre-tool-use-git-safety.sh`, `scripts/git-hooks/require-writer-lock.sh`
  - Artifact placement: default to `AGENTS.md § Agent Failure Message Contract` so all guard/preflight implementors find the contract in their primary reference. A standalone doc in `docs/plans/` is not sufficient — future authors won't look there.

### TASK-02: Apply the contract to shell and git/writer-lock guard surfaces
- **Type:** IMPLEMENT
- **Deliverable:** code/documentation changes that align shell/guard failures to the new contract, plus regression tests
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `scripts/agent-bin/git`, `.claude/hooks/pre-tool-use-git-safety.sh`, `scripts/git-hooks/require-writer-lock.sh`, `scripts/__tests__/git-safety-policy.test.ts`, `scripts/__tests__/pre-tool-use-git-safety.test.ts`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 84%
  - Implementation: 86% - affected files are known and local; message-only changes should be straightforward
  - Approach: 84% - likely requires either shared helper extraction or disciplined copy alignment
  - Impact: 84% - these are the highest-frequency blocked command surfaces for agents
- **Acceptance:**
  - `scripts/agent-bin/git` no longer emits bare infrastructure errors; each failure names the exact next path and retry posture.
  - Existing good shell/guard messages are brought into contract alignment without reducing enforcement strength.
  - Agent-visible tests assert exact-next-step and anti-retry guidance for representative failure classes.
- **Validation contract (TC-02):**
  - TC-01: Missing evaluator/policy and missing real git binary paths in `scripts/agent-bin/git` -> output includes exact recovery command or path, retry posture, and stop/escalation rule.
  - TC-02: Representative blocked git command in PreToolUse and writer-lock hook -> output remains fail-closed and still includes valid next-step guidance.
  - TC-03: Guidance does not recommend a command that the repo itself forbids in the same scenario.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run:
    - Verified target files and current message gaps in fact-find.
    - Verified existing tests around git-safety surfaces.
  - Validation artifacts:
    - `docs/plans/agent-failure-instruction-contract/fact-find.md`
    - `scripts/agent-bin/git`
    - `.claude/hooks/pre-tool-use-git-safety.sh`
    - `scripts/git-hooks/require-writer-lock.sh`
  - Unexpected findings:
    - None so far; exact message assertions may require test updates beyond the two known suites.
- **Scouts:** None: fact-find already covered the relevant first-wave shell surfaces
- **Edge Cases & Hardening:** Infrastructure-failure cases must still fail closed even if helper formatting fails or policy artifacts are missing.
- **What would make this >=90%:**
  - Confirm whether existing test suites already assert stderr content strongly enough, or whether new targeted tests are needed.
- **Rollout / rollback:**
  - Rollout: patch shell surfaces together so guidance is consistent at once
  - Rollback: revert wording/test changes if any message proves inaccurate
- **Documentation impact:**
  - Update any guard docs or comments that cite message semantics if they drift.
- **Notes / references:**
  - Expected user-observable behavior:
    - When an agent hits a blocked or broken git/lock path, the output tells it exactly what to run next and which adjacent retries are forbidden.
  - Evaluator scope: `scripts/agents/evaluate-git-safety.mjs` policy-denial messages that flow through `scripts/agent-bin/git` (not through the PreToolUse hook) are out of scope for this task. The PreToolUse hook intercepts and re-wraps policy denials for Claude sessions; agent-bin/git's evaluator passthrough is a secondary path for non-Claude agents and is deferred to a future wave.

### TASK-03: Apply the contract to structured preflight and tool-guidance surfaces
- **Type:** IMPLEMENT
- **Deliverable:** structured error/policy guidance updates for first-wave TS surfaces, plus regression coverage or contract checks
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/mcp-preflight.ts`, `docs/ide/agent-language-intelligence-guide.md`, `[readonly] AGENTS.md`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 83%
  - Implementation: 84% - target surfaces are known, but exact schema shape for structured recovery fields is not yet chosen
  - Approach: 83% - contract must work across both prose docs and structured TS error objects
  - Impact: 83% - this extends the contract beyond git into adjacent agent tool/preflight failures
- **Acceptance:**
  - Selected TS preflight failures expose exact next-step guidance consistent with the contract.
  - Tool-guidance docs clearly state fallback path and bounded no-retry rule where applicable.
  - First-wave structured surfaces use the same conceptual contract as shell surfaces, even if formatting differs.
- **Validation contract (TC-03):**
  - TC-01: Representative `MCP_PREFLIGHT_*` failure includes precise recovery guidance or explicit next-step mapping in its consumer-facing output path.
  - TC-02: Type/tool guidance doc examples specify both fallback and "do not retry until" conditions where applicable.
  - TC-03: Structured guidance remains specific enough that a downstream agent can select one valid next action without branching into multiple speculative retries.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run:
    - Verified `mcp-preflight.ts` currently emits message/code/details but no standard recovery fields.
    - Verified TS language guide already provides a bounded retry rule and fallback path.
  - Validation artifacts:
    - `scripts/src/startup-loop/mcp-preflight.ts`
    - `docs/ide/agent-language-intelligence-guide.md`
  - Unexpected findings:
    - Broader non-git error surfaces were not exhaustively inventoried in fact-find; keep first-wave scope tight.
- **Scouts:** None: first-wave surface is already chosen
- **Edge Cases & Hardening:** Do not force prose-only guidance into machine-oriented error paths if structured fields are a better fit.
- **What would make this >=90%:**
  - Confirm the exact consumer path for `MCP_PREFLIGHT_*` issues and where recovery fields are rendered or read.
- **Rollout / rollback:**
  - Rollout: apply after TASK-01 fixes the contract language
  - Rollback: revert structured-field additions if a consumer cannot tolerate them; retain doc updates
- **Documentation impact:**
  - Moderate; likely updates to tool guidance and possibly nearby preflight docs/comments.
- **Notes / references:**
  - Expected user-observable behavior:
    - When a preflight/tooling prerequisite fails, the output names one concrete next step and states when local retries should stop.
  - Implementation layer decision: add per-code recovery guidance in `printHumanResult()` as the first implementation target. This limits blast radius to CLI output only. Adding a structured `recoveryStep` field to `McpPreflightIssue` (which touches all callers of `runMcpPreflight()`) is deferred unless a non-CLI consumer is identified during build. Confirm this decision by grepping for `runMcpPreflight` callers in the Red step.

## Risks & Mitigations
- Shared contract becomes too abstract to guide implementation.
  - Mitigation: require concrete fields and real repo examples in TASK-01.
- Message contract diverges between shell and structured TS surfaces.
  - Mitigation: test against the same core field checklist, even if formatting differs.
- Build scope expands into unrelated runtime/product messages.
  - Mitigation: keep TASK-03 limited to first-wave preflight/tool-guidance surfaces already audited.
- Contract doc placed where future guard/script authors won't find it.
  - Mitigation: default artifact destination is `AGENTS.md § Agent Failure Message Contract`; this is the primary reference for all agent-facing implementations. Any other placement requires an explicit pointer from AGENTS.md.

## Observability
- Logging:
  - None: this plan does not add new logging by default.
- Metrics:
  - None in first wave; use session findings / repeated blocked-command patterns as a proxy review.
- Alerts/Dashboards:
  - None: not needed for first-wave message-contract work.

## Acceptance Criteria (overall)
- [ ] A shared failure-instruction contract exists and is normative for first-wave agent-facing failures.
- [ ] First-wave shell/guard surfaces no longer fail with ambiguous or bare recovery messages.
- [ ] First-wave structured preflight/tool-guidance surfaces expose bounded next-step guidance.
- [ ] Regression tests or contract checks prevent message drift on the selected first-wave surfaces.

## Decision Log
- 2026-03-06: Chose a contract-first approach over ad hoc message fixes because the root problem is inconsistency and retry-loop prevention, not isolated copy defects.
- 2026-03-06: Limited first-wave implementation to agent guard/preflight surfaces; broader product/runtime failure messaging is deferred.
- 2026-03-06: Set `Auto-Build-Intent: plan-only` because this is shared repo policy work affecting multiple enforcement surfaces; plan approval and task execution can proceed next without forcing build in the same turn.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Define the shared failure-instruction contract and first-wave adoption rules | Yes | None | No |
| TASK-02: Apply the contract to shell and git/writer-lock guard surfaces | Yes | None | No |
| TASK-03: Apply the contract to structured preflight and tool-guidance surfaces | Partial | [Moderate] Structured preflight consumer path may need one extra check during build to confirm where recovery fields are surfaced. | No |

## Overall-confidence Calculation
- S=1, M=2, L=3
- Weighted calculation:
  - TASK-01: 88 x 1 = 88  (corrected: min(93%, 90%, 88%) = 88%)
  - TASK-02: 84 x 2 = 168
  - TASK-03: 83 x 2 = 166
  - Total = 422 / 5 = 84.4%
- Rounded overall confidence: 84%
