---
Type: Results-Review
Status: Draft
Feature-Slug: agent-failure-instruction-contract
Review-date: 2026-03-06
artifact: results-review
---

# Results Review

## Observed Outcomes
- AGENTS.md now contains a normative `## Agent Failure Message Contract` section defining five required fields (failure reason, retry posture, exact next step, anti-retry list, escalation/stop condition) and three message classes (hard-block, recoverable-fallback, fail-closed-infrastructure) with reference implementations.
- `scripts/agent-bin/git` replaced three bare `ERROR:` exits with a `fail_closed_infrastructure()` helper that emits all five contract fields with escalate-now posture and `generate-git-safety-policy --write` as next step.
- `.claude/hooks/pre-tool-use-git-safety.sh` and `scripts/git-hooks/require-writer-lock.sh` each gained an `Escalation:` line so all deny/block paths now carry all five contract fields.
- `scripts/src/startup-loop/mcp-preflight.ts` gained `MCP_PREFLIGHT_RECOVERY` table mapping all 11 `McpPreflightCode` values to `→ Next: … | retry-posture | Do not: …` strings emitted after each error/warning line.
- New test coverage: 8 tests in `git-safety-policy.test.ts` (infrastructure failure contract fields), 2 new assertions in `pre-tool-use-git-safety.test.ts` per-deny case, and 7 tests in `mcp-preflight-recovery.test.ts` (code presence, output format, exhaustiveness guard for all 11 codes).
- All three tasks committed in two atomic transactions (`36b85704de` TASK-01, `39033b1134` TASK-02 + TASK-03).

## Standing Updates
- No standing updates: no registered artifacts changed

## New Idea Candidates
<!-- Scan for signals in these five categories. For each, cite a "Trigger observation" from this build. Use "None." if no evidence found for any category.
  1. New standing data source — external feed, API, or dataset suitable for Layer A standing intelligence
  2. New open-source package — library to replace custom code or add capability
  3. New skill — recurring agent workflow ready to be codified as a named skill
  4. New loop process — missing stage, gate, or feedback path in the startup loop
  5. AI-to-mechanistic — LLM reasoning step replaceable with a deterministic script
-->
- New standing data source — None.
- New open-source package — None.
- New skill — None.
- New loop process — None.
- AI-to-mechanistic — None.

## Standing Expansion
- No standing expansion: no new external data sources or artifacts identified

## Intended Outcome Check

<!--
Warn mode (introduced TASK-06, startup-loop-why-intended-outcome-automation, 2026-02-25).
This section is non-blocking during the warn window. After one loop cycle (~14 days) it
will be promoted to a hard gate. A valid verdict keyword is required to clear the warn.
-->

- **Intended:** Agent-facing failure messages across guards and blocked operations follow a precise contract that says whether retry is valid, what exact next step to take, and when to stop escalating locally.
- **Observed:** All first-wave shell/guard surfaces (agent-bin/git, pre-tool-use-git-safety.sh, require-writer-lock.sh) and structured preflight surface (mcp-preflight.ts) now emit all five contract fields on failure. Regression tests validate field presence on all deny paths and all 11 MCP preflight codes. Contract is documented as normative in AGENTS.md.
- **Verdict:** Met
- **Notes:** All 3 tasks completed successfully.
