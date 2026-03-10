# Build Record: Agent Failure Instruction Contract

**Plan:** `docs/plans/agent-failure-instruction-contract/plan.md`
**Completed:** 2026-03-06
**Commits:** `36b85704de` (TASK-01), `39033b1134` (TASK-02 + TASK-03)

## Outcome Contract

- **Why:** A blocked or failed path should terminate ambiguity, not create more of it. Precise next-step instructions are an efficiency control that prevents retry loops and wasted tool exploration.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Agent-facing failure messages across guards and blocked operations follow a precise contract that says whether retry is valid, what exact next step to take, and when to stop escalating locally.
- **Source:** operator

## What Was Done

### TASK-01: Shared failure-instruction contract defined

Added `## Agent Failure Message Contract` section to `AGENTS.md`. The section defines:
- Five required fields for every failure path: failure reason, retry posture, exact next step, anti-retry list, escalation/stop condition
- Three message classes: hard-block, recoverable-fallback, fail-closed-infrastructure
- Reference implementations per class (pre-tool-use-git-safety.sh, require-writer-lock.sh, agent-bin/git)
- First-wave adoption checklist explicitly naming TASK-02 and TASK-03 target files

### TASK-02: Shell/guard surfaces hardened

- **`scripts/agent-bin/git`**: Replaced three bare `ERROR:` exits with a `fail_closed_infrastructure()` helper function. Each failure case (missing binary, missing evaluator, missing policy JSON) now emits all five contract fields. Example output for missing evaluator:
  ```
  BLOCKED [fail-closed-infrastructure]: git safety evaluator missing: /path/to/evaluator
  Retry posture : escalate-now
  Next step     : scripts/agents/generate-git-safety-policy --write
  Do not retry with:
    retrying the git command without regenerating the evaluator will fail
  Escalation    : surface to operator; do not retry locally
  ```
- **`.claude/hooks/pre-tool-use-git-safety.sh`**: Added `Escalation:` line to `block_with_guidance()` — all deny paths now include five fields.
- **`scripts/git-hooks/require-writer-lock.sh`**: Added `Escalation:` lines to both blocked cases (lock-not-held and token-mismatch).
- **Tests**: 8 new tests in `git-safety-policy.test.ts` asserting escalate-now posture, next-step command, and anti-retry note for infrastructure failures. `pre-tool-use-git-safety.test.ts` deny test.each extended with contract assertions.

### TASK-03: Structured preflight/tool-guidance surfaces hardened

- **`scripts/src/startup-loop/mcp-preflight.ts`**: Added `MCP_PREFLIGHT_RECOVERY` lookup table mapping all 11 `McpPreflightCode` values to recovery guidance strings in `Next: … | retry-posture | Do not: …` format. `printHumanResult()` now emits a `→` recovery line after each error and warning.
- **`docs/ide/agent-language-intelligence-guide.md`**: No changes needed — fallback path and "do not retry until" condition already present (confirmed by analysis subagent).
- **Tests**: New `mcp-preflight-recovery.test.ts` with 7 tests covering error code presence, output format (`→ Next:`, `Do not:`), and specific guidance content.

## Validation Results

| Task | Validation | Result |
|---|---|---|
| TASK-01 | VC-01: required fields + real examples per class | ✓ Pass |
| TASK-01 | VC-02: first-wave targets derivable without discovery | ✓ Pass |
| TASK-02 | TC-01: agent-bin/git infrastructure errors include exact recovery | ✓ Pass |
| TASK-02 | TC-02: PreToolUse + writer-lock remain fail-closed with guidance | ✓ Pass |
| TASK-02 | TC-03: guidance doesn't recommend forbidden commands | ✓ Pass |
| TASK-03 | TC-01: MCP_PREFLIGHT_* failures include recovery guidance in CLI output | ✓ Pass |
| TASK-03 | TC-02: agent-language-intelligence-guide already satisfies contract | ✓ Pass (no-op) |
| TASK-03 | TC-03: structured guidance names one valid action | ✓ Pass |

## Overall Acceptance Criteria

- [x] A shared failure-instruction contract exists and is normative for first-wave agent-facing failures.
- [x] First-wave shell/guard surfaces no longer fail with ambiguous or bare recovery messages.
- [x] First-wave structured preflight/tool-guidance surfaces expose bounded next-step guidance.
- [x] Regression tests or contract checks prevent message drift on the selected first-wave surfaces.

## Execution Notes

- Codex offload was attempted for TASK-01 but blocked by writer lock contention from a concurrent Codex app-server session (pid 7334). TASK-01 executed inline.
- Wave 2 (TASK-02 + TASK-03) dispatched as parallel analysis subagents (wave-dispatch-protocol); diffs applied inline and committed in a single writer-lock transaction.
- All changes scoped to first-wave surfaces; broader runtime/product error surfaces deferred per Non-goals.
