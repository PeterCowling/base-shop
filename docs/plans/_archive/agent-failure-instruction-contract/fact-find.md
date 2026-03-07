---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-06
Last-updated: 2026-03-06
Feature-Slug: agent-failure-instruction-contract
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/agent-failure-instruction-contract/plan.md
Dispatch-ID: IDEA-DISPATCH-20260306135044-0991
artifact: fact-find
---

# Agent Failure Instruction Contract Fact-Find Brief

## Scope
### Summary
Investigate how agent-facing failures and hard blocks are surfaced today across the repo, with emphasis on whether each failure path tells the agent exactly what to do next and what not to retry. The target outcome is a planning-ready brief for a repo-wide failure-instruction contract that reduces retry loops, ineffective tool fan-out, and ambiguous recovery behavior.

### Goals
- Identify current guard/error surfaces that already provide precise next-step guidance.
- Identify surfaces that fail with bare errors or incomplete recovery instructions.
- Define the minimum contract a failure message must satisfy to stop local retry loops.
- Bound the first implementation slice to the highest-leverage agent-facing failure paths.

### Non-goals
- Redesigning the entire git safety policy itself.
- Replacing the writer-lock system or changing queue semantics in this fact-find.
- Solving every operator-facing UX message in the repo; this scope is agent-facing failure and guard surfaces first.

### Constraints & Assumptions
- Constraints:
  - Changes must preserve fail-closed behavior; better guidance must not weaken safety enforcement.
  - The solution has to work for both hook-driven denials and wrapper/preflight failures.
  - Messages must be precise enough to prevent adjacent retries that will fail for the same structural reason.
- Assumptions:
  - The highest-value first slice is repo-local guard surfaces (`git` wrapper, PreToolUse hook, writer-lock enforcement, key preflights), not every product-level runtime error.
  - Documentation and enforcement should align: if a message says "only this path will work," that path must actually be valid in the repo.

## Access Declarations
None.

## Outcome Contract
- **Why:** A blocked or failed path should terminate ambiguity, not create more of it. Precise next-step instructions are an efficiency control that prevents retry loops and wasted tool exploration.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Agent-facing failure messages across guards and blocked operations follow a precise contract that says whether retry is valid, what exact next step to take, and when to stop escalating locally.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `.claude/hooks/pre-tool-use-git-safety.sh` - Claude PreToolUse gate for Bash/git commands.
- `scripts/agent-bin/git` - PATH-level git guard wrapper used by agent sessions.
- `scripts/git-hooks/require-writer-lock.sh` - universal writer-lock enforcement for git writes.
- `.claude/settings.json` - permission-layer deny/ask/allow surface for Claude Bash.
- `.claude/hooks/session-start.sh` - session bootstrap that ensures the git guard is on PATH.
- `scripts/agents/evaluate-git-safety.mjs` - shared evaluator used by guard and hook layers.
- `scripts/src/startup-loop/mcp-preflight.ts` - representative preflight error surface outside git guards.
- `docs/ide/agent-language-intelligence-guide.md` - existing example of explicit fallback/no-retry instructions.

### Key Modules / Files
- `.claude/hooks/pre-tool-use-git-safety.sh`
  - Strong failure-contract example. `block_with_guidance()` prints the blocked reason, the only valid path, and a "Do not retry" list.
- `scripts/git-hooks/require-writer-lock.sh`
  - Strong failure-contract example. Distinguishes "lock not held" from "token missing or mismatched" and provides exact recovery commands.
- `scripts/agent-bin/git`
  - Weak failure-contract example. For missing binary/evaluator/policy it prints bare `ERROR:` lines with no precise next-step recovery.
- `scripts/agents/evaluate-git-safety.mjs`
  - Shared deny engine. Fail-closed output explains the class of failure but does not currently prescribe the next command to run.
- `.claude/settings.json`
  - Declarative permission surface. Can deny/ask/allow, but by itself it does not encode the precise recovery path.
- `scripts/src/startup-loop/mcp-preflight.ts`
  - Representative structured error surface (`MCP_PREFLIGHT_*`) where message payloads identify the failure but not the exact operator/agent recovery step.
- `AGENTS.md`
  - Repo-wide proof that the project already values prescriptive blocked-state instructions via mandatory `IF BLOCKED` sections for procedural guidance.
- `docs/ide/agent-language-intelligence-guide.md`
  - Strong documentation example. Tells agents what fallback to use and explicitly says when not to retry.

### Patterns & Conventions Observed
- **Good pattern: reason + exact path + anti-retry list.**
  - Evidence: `.claude/hooks/pre-tool-use-git-safety.sh:57`, `scripts/git-hooks/require-writer-lock.sh:31`
- **Weak pattern: bare error string without a next-step contract.**
  - Evidence: `scripts/agent-bin/git:33`, `scripts/agent-bin/git:40`, `scripts/agent-bin/git:44`
- **Repo already has a procedural blocked-state standard for human instructions.**
  - Evidence: `AGENTS.md:193`, `AGENTS.md:222`
- **Some docs already encode bounded fallback semantics correctly.**
  - Evidence: `docs/ide/agent-language-intelligence-guide.md:13`, `docs/ide/agent-language-intelligence-guide.md:24`
- **Permission-deny alone is insufficient as an efficiency control.**
  - Evidence: `.claude/settings.json` expresses allow/ask/deny lists, but contains no recovery instructions or stop conditions.

### Data & Contracts
- Types/schemas/events:
  - Dispatch source for this run is `dispatch.v2` with operator-authored why/intended outcome in `docs/plans/agent-failure-instruction-contract/dispatch.v2.json`.
  - Startup-loop MCP preflight emits structured issues with `code`, `message`, and optional `details`, but no standard recovery fields.
- Persistence:
  - Agent-facing failure behavior is implemented directly in scripts and hooks, not in a shared message schema.
- API/contracts:
  - PreToolUse hook contract blocks by exiting `2` after printing guidance.
  - Git guard wrapper delegates to `evaluate-git-safety.mjs`; wrapper-local infrastructure failures exit with bare `ERROR:` messages.

### Dependency & Impact Map
- Upstream dependencies:
  - `.claude/settings.json` permission layer and Bash hook wiring.
  - `.claude/hooks/session-start.sh` PATH bootstrap for `scripts/agent-bin/git`.
  - `.agents/safety/generated/git-safety-policy.json` and `scripts/agents/evaluate-git-safety.mjs` for git-policy evaluation.
- Downstream dependents:
  - All Claude git write/read attempts that pass through Bash or PATH git guard.
  - Any recovery behavior an agent chooses after a guard/preflight failure.
  - Future tool-policy hardening work for Claude Bash permissions and tool selection.
- Likely blast radius:
  - Guard and hook copy changes affect every blocked git/lock failure in Claude sessions.
  - Introducing a shared failure-message helper could touch hook scripts, wrappers, and selected preflights.

### Delivery & Channel Landscape
- Audience/recipient:
  - AI agents operating in this repo, especially Claude/Codex sessions under tool and git guards.
- Channel constraints:
  - Messages must work in terminal stderr and tool-failure output; no rich UI assumptions.
- Existing templates/assets:
  - No shared failure-contract helper exists today; patterns are duplicated in shell scripts and docs.
- Approvals/owners:
  - Repo/platform maintainers for guard scripts, settings, and agent runbooks.
- Compliance constraints:
  - Safety enforcement must remain fail-closed even when message generation fails.
- Measurement hooks:
  - No direct retry-loop metric exists. Efficiency impact will likely need proxy measures such as repeated blocked command patterns or reduced guard churn in session findings.

### Test Landscape
#### Test Infrastructure
- Frameworks:
  - Jest coverage already exists for git-safety policy and PreToolUse behavior.
- Commands:
  - Existing relevant suites include `scripts/__tests__/git-safety-policy.test.ts` and `scripts/__tests__/pre-tool-use-git-safety.test.ts` as cited in repo docs.
- CI integration:
  - Guard behavior is covered by repo test suites and hook/policy artifacts already under source control.

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Git safety evaluator + hook policy | Integration / table-driven | `scripts/__tests__/git-safety-policy.test.ts`, `scripts/__tests__/pre-tool-use-git-safety.test.ts` | Covers allowed/blocked command semantics; message-quality assertions appear limited to selected legacy substrings, not a repo-wide failure contract. |
| Writer-lock messaging | Implicit / repo evidence | `scripts/git-hooks/require-writer-lock.sh` | Strong guidance exists in script, but no evidence found in this run of a dedicated message-contract test. |

#### Coverage Gaps
- Untested paths:
  - `scripts/agent-bin/git` bare infrastructure failures (`unable to locate real git binary`, missing evaluator, missing policy) have no visible exact-next-step contract and no evidence of dedicated message tests from this run.
  - `scripts/src/startup-loop/mcp-preflight.ts` error objects lack explicit recovery fields or standardized next-step guidance.
- Extinct tests:
  - Not investigated in this run.

#### Testability Assessment
- Easy to test:
  - Guard/hook stderr output for blocked commands and missing-artifact failure modes.
  - Structured preflight payload fields for code/message/recovery contract.
- Hard to test:
  - Measuring actual doom-loop reduction without session telemetry designed for that purpose.
- Test seams needed:
  - Shared message formatter or contract validator that can be asserted across shell and TS surfaces.

#### Recommended Test Approach
- Unit tests for:
  - Shared failure-message builder or validator, if introduced.
  - Structured preflight recovery fields.
- Integration tests for:
  - Hook/guard stderr content on representative blocked commands and missing-policy conditions.
  - Writer-lock hook outputs across both "not held" and "token mismatch" states.
- Contract tests for:
  - Minimum failure-contract fields: reason, retry posture, exact next path, anti-retry list, escalation/stop condition.

### Recent Git History (Targeted)
- Not investigated: no targeted git-history pass was needed to establish current failure-contract behavior because the relevant guard surfaces are directly inspectable in the working tree.

## Questions
### Resolved
- Q: Does the repo already contain an explicit model for precise blocked-state instructions?
  - A: Yes. Procedural runbooks require `IF BLOCKED`, and writer-lock / PreToolUse scripts already print exact recovery commands.
  - Evidence: `AGENTS.md:193`, `scripts/git-hooks/require-writer-lock.sh:31`, `.claude/hooks/pre-tool-use-git-safety.sh:57`
- Q: Is the message-quality gap theoretical, or visible in current agent surfaces?
  - A: Visible now. `scripts/agent-bin/git` emits bare infrastructure errors without prescribing the next valid step.
  - Evidence: `scripts/agent-bin/git:33`, `scripts/agent-bin/git:40`, `scripts/agent-bin/git:44`
- Q: Is there already a good repo-local example of bounded fallback semantics outside git guards?
  - A: Yes. The TypeScript language guide says what fallback to use and explicitly tells agents not to retry until the sentinel changes.
  - Evidence: `docs/ide/agent-language-intelligence-guide.md:24`
- Q: Does the current Claude permission layer itself solve this problem?
  - A: No. It decides allow/ask/deny but does not encode exact next-step recovery instructions.
  - Evidence: `.claude/settings.json`

### Open (Operator Input Required)
None. This fact-find is planning-ready without additional operator-only knowledge.

## Confidence Inputs
### Implementation: 91%
- Evidence basis:
  - The highest-leverage guard surfaces are concrete and small in number.
  - Good and weak patterns are both directly visible in current files.
- What raises this to >=80:
  - Already above threshold.
- What raises this to >=90:
  - Already above threshold; additional message tests would harden confidence further.

### Approach: 89%
- Evidence basis:
  - Repo already favors prescriptive blocked-state guidance in both docs and some guard scripts.
  - A shared failure-contract standard is additive and compatible with existing fail-closed behavior.
- What raises this to >=80:
  - Already above threshold.
- What raises this to >=90:
  - Confirm whether to enforce one shared helper vs a checklist-style contract applied per surface.

### Impact: 84%
- Evidence basis:
  - The failure mode is structurally tied to agent retries and wasted alternative attempts.
  - The user has explicitly identified this as a key efficiency requirement.
- What raises this to >=80:
  - Already above threshold.
- What raises this to >=90:
  - Add telemetry or session-finding evidence that repeated blocked-command attempts decline after rollout.

### Delivery-Readiness: 87%
- Evidence basis:
  - The affected surfaces are local scripts/docs/settings, not remote systems.
  - Existing tests and patterns provide a clear landing zone for implementation.
- What raises this to >=80:
  - Already above threshold.
- What raises this to >=90:
  - Identify the smallest first-wave file set and lock exact message assertions before implementation.

### Testability: 86%
- Evidence basis:
  - stderr and structured preflight outputs are directly assertable.
  - Existing git-safety test suites already cover adjacent semantics.
- What raises this to >=80:
  - Already above threshold.
- What raises this to >=90:
  - Introduce a shared contract validator or snapshot-based stderr assertions for all first-wave surfaces.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Message guidance drifts from actual valid recovery paths | Medium | High | Keep recovery commands repo-local and test them in the same files that enforce the block. |
| Guidance becomes verbose but still ambiguous | Medium | Medium | Define a minimum contract with required fields, not just longer prose. |
| Different guard layers diverge again | High | Medium | Prefer a shared helper or shared acceptance checklist across shell and TS surfaces. |
| Fail-closed behavior weakens while improving UX | Low | High | Keep enforcement decision path unchanged; improve message generation only. |
| Broader runtime/product error surfaces dilute the first implementation wave | Medium | Medium | Keep plan scope to agent guard/preflight surfaces first; defer product-level messaging. |

## Planning Constraints & Notes
- Must-follow patterns:
  - Preserve fail-closed blocking behavior.
  - Prefer exact commands or exact next tool choices over generic advice.
  - Messages should distinguish `retry allowed`, `retry forbidden`, and `escalate now`.
- Rollout/rollback expectations:
  - Rollout can be incremental by surface: git/writer-lock guards first, then selected TS preflights.
  - Rollback is low-risk because changes are message-contract and test additions rather than behavioral relaxations.
- Observability expectations:
  - At minimum, capture representative failure message examples in tests so regressions are visible in CI.

## Suggested Task Seeds (Non-binding)
- Define a minimum failure-instruction contract with required fields and example wording.
- Audit first-wave surfaces and classify each as compliant, partial, or non-compliant.
- Implement the contract in the highest-leverage non-compliant surfaces (`scripts/agent-bin/git`, `scripts/src/startup-loop/mcp-preflight.ts`, any other guard/preflight chosen in planning).
- Add message-contract tests covering exact-next-step and anti-retry semantics.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - `none`
- Deliverable acceptance package:
  - Updated guard/preflight messaging, aligned docs, and regression tests for the selected first-wave surfaces.
- Post-delivery measurement plan:
  - Review session findings / blocked-command patterns for reduced repeated retries on the same structural error.

## Rehearsal Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Git guard + PreToolUse enforcement surfaces | Yes | None | No |
| Writer-lock blocked-state messaging | Yes | None | No |
| Permission-layer/tool-guidance docs | Yes | None | No |
| Non-git preflight sample surfaces | Partial | [Moderate] Scope sample is representative but not exhaustive; broader repo-wide error surfaces were not fully inventoried in this run. | No |

## Scope Signal
Signal: right-sized

Rationale: The investigation covers the highest-leverage agent-facing blocked/error surfaces and already shows both compliant and non-compliant patterns. It is bounded enough to plan implementation without first auditing every runtime error in the repo.

## Evidence Gap Review
### Gaps Addressed
- Confirmed that the repo already has a strong blocked-state model in some surfaces, so the plan can build on existing patterns rather than inventing a new philosophy.
- Confirmed that the current gap is real in active agent infrastructure, not just in old or archived files.

### Confidence Adjustments
- Delivery-readiness and testability moved above 80 once the guard/preflight surfaces were verified as local, inspectable, and already partially covered by test infrastructure.

### Remaining Assumptions
- First-wave implementation should stay focused on agent guard/preflight surfaces, not broader product runtime errors.
- The best implementation shape is likely a shared contract or helper, but that design choice belongs in planning.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None.
- Recommended next step:
  - `/lp-do-plan agent-failure-instruction-contract --auto`
