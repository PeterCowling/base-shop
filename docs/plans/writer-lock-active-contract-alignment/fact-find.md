---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: writer-lock-active-contract-alignment
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas
Related-Plan: docs/plans/writer-lock-active-contract-alignment/plan.md
Trigger-Why: The wrapper hardening landed, but the active build/offload workflow still advertises a stale shared-checkout Codex path and the agent-session guard still misses common launcher forms.
Trigger-Intended-Outcome: type: operational | statement: Base-Shop disables the stale shared-checkout Codex offload as a normal active workflow, widens launcher detection for long-lived locked agent sessions, and aligns active docs/tests with the current lock policy. | source: operator
---

# Writer Lock Active Contract Alignment Fact-Find Brief

## Scope
### Summary
This follow-on fact-find covers the buildable slice left after `writer-lock-operational-hardening`: active skill docs still present shared-checkout `codex exec --sandbox workspace-write` as a normal path, the documented invocation still includes the unsupported `-a never` flag, and the launcher guard still misses common wrapper forms such as `pnpm exec`, `npx`, and `node /path/to/codex`. The bounded fix is to align the active workflow contract, widen the detector, add regression coverage, and scrub still-live stale guidance.

### Goals
- Remove stale `codex exec -a never --sandbox workspace-write` guidance from active workflow docs.
- Stop treating shared-checkout mutable Codex offload as a normal default path while the patch-return pilot is still unresolved.
- Catch additional common launcher forms before they can start a long-lived locked `codex` or `claude` session.
- Add regression coverage for the widened launcher detection.
- Correct still-live stale guidance in non-archived plan docs that would send operators down the old path.

### Non-goals
- Completing the patch-return offload pilot in this slice.
- Replacing the poll-based queue or the underlying writer-lock primitive.
- Enforcing writer ownership for arbitrary working-tree edits outside the existing wrapper and git-hook model.

### Constraints & Assumptions
- Constraints:
  - The current patch-return work remains incomplete and cannot be presented as ready.
  - Active workflow docs must describe a path that is true today, not an aspirational future state.
  - Local validation must respect the CI-only Jest policy.
- Assumptions:
  - Inline build execution is the correct fail-closed default until the patch-return pilot is validated.
  - Broader wrapper detection is safer than continuing to rely on a narrow first-argv check.

## Outcome Contract
- **Why:** The wrapper hardening landed, but the active build/offload workflow still advertises a stale shared-checkout Codex path and the agent-session guard still misses common launcher forms.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Base-Shop disables the stale shared-checkout Codex offload as a normal active workflow, widens launcher detection for long-lived locked agent sessions, and aligns active docs/tests with the current lock policy.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `.claude/skills/_shared/build-offload-protocol.md` still documents `codex exec -a never --sandbox workspace-write` and a full-session writer lock.
- `.claude/skills/lp-do-build/SKILL.md` still routes `CODEX_OK=1` directly into the offload protocol.
- `.claude/skills/lp-do-build/modules/build-code.md`
- `.claude/skills/lp-do-build/modules/build-biz.md`
- `.claude/skills/lp-do-build/modules/build-spike.md`
- `.claude/skills/lp-do-build/modules/build-investigate.md`
- `.claude/skills/ops-ci-fix/SKILL.md` still advertises the stale mutable Codex path.
- `scripts/agents/agent-session-guard.sh` only covers direct invocation, `command`, `env`, `nvm exec`, and shell `-c` wrappers.
- `scripts/__tests__/agent-write-session-guard.test.ts` covers only the currently implemented wrapper cases.
- `docs/plans/agent-setup-improvement-fact-find.md` still instructs `scripts/agents/integrator-shell.sh -- codex`.

### Key Findings
1. Active build/offload docs are stale and still sanction the long-held shared-checkout writer path.
2. The stale path is not just historical wording; active skill routing still treats offload as the normal branch whenever `codex` is installed.
3. Launcher detection misses several practical wrapper forms, which weakens the new explicit opt-in contract.
4. Regression coverage does not protect the missing wrapper forms.
5. Queue wake-up latency and arbitrary file-mutation enforcement remain real issues, but they are separate structural workstreams.

### Recent Runtime Evidence
- `docs/plans/writer-lock-patch-return-offload/spike-01-codex-patch-return.md` invalidated the old `-a never` guidance and showed that the current local runtime did not emit the requested patch artifact promptly.
- `docs/plans/writer-lock-patch-return-offload/runtime-isolation-investigation.md` confirmed the current supported non-interactive `codex exec` surface and isolated-runner contract, but did not validate a new active offload workflow.
- A live writer-lock holder had to be force-killed earlier in this session family, reinforcing that the stale mutable offload path should not remain an active default.

## Questions
### Resolved
- Q: Can the active shared-checkout Codex offload remain the normal documented path while the patch-return pilot is still unresolved?
  - A: No. That leaves an operationally unsafe and partly stale workflow in active use.
- Q: Is there a bounded implementation slice that improves the system now without pretending the patch-return pilot is complete?
  - A: Yes. Disable the stale active offload route in current workflow docs, widen the guard, add coverage, and clean the still-live stale guidance.

### Open
- None for this slice. Structural follow-on work remains in `writer-lock-patch-return-offload`.

## Confidence Inputs
- Implementation: 90%
  - Evidence basis: all target files are directly identified and bounded.
- Approach: 86%
  - Evidence basis: fail-closed inline execution is safer than leaving stale mutable offload as the active default.
- Impact: 84%
  - Evidence basis: removes the currently sanctioned lock-hog path from active instructions and closes the most obvious launcher gaps.

## Scope Signal
Signal: right-sized

Rationale: The slice is limited to active contract alignment, launcher detection, coverage, and one stale live fact-find reference. It deliberately excludes the larger patch-return and queue redesign work already tracked elsewhere.

## Evidence Gap Review
### Gaps Addressed
- Confirmed which active skill docs still advertise the stale mutable Codex path.
- Confirmed the currently implemented launcher cases in `agent-session-guard.sh`.
- Confirmed the current regression coverage gaps in `scripts/__tests__/agent-write-session-guard.test.ts`.

### Confidence Adjustments
- Raised confidence because the fix set is bounded and does not depend on unresolved Codex runtime behavior.

### Remaining Assumptions
- Inline execution is acceptable as the active default until the patch-return pilot is validated.
