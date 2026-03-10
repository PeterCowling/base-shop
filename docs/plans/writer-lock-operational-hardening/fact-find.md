---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: writer-lock-operational-hardening
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas
Related-Plan: docs/plans/writer-lock-operational-hardening/plan.md
Trigger-Why: Repeated writer-lock incidents still require manual kill and clean-stale recovery because the docs-only rule change did not remove implicit long-held lock paths or the shared-checkout build-offload exception.
Trigger-Intended-Outcome: type: operational | statement: Base-Shop enforces explicit opt-in for locked interactive shells and locked agent CLI sessions, active runbooks and skills match that contract, and the remaining architectural work is captured as follow-on build tasks. | source: operator
---

# Writer Lock Operational Hardening Fact-Find Brief

## Scope
### Summary
This is the implementation follow-on to `writer-lock-scope-reduction`. The documentation-first cycle landed the minimum-lock-time rule, but current runtime behavior still leaves three gaps: wrappers still allow accidental long-held lock sessions, the active `lp-do-build` offload protocol still sanctions shared-checkout `workspace-write` sessions under the full lock window, and queue wake-up remains coarse poll-based. The first buildable slice is to harden wrapper entrypoints and active runbooks so implicit locked shells and implicit locked agent sessions are no longer normal invocation paths.

### Goals
- Remove implicit locked interactive shell entrypoints from the normal path.
- Require explicit opt-in for long-lived `codex` and `claude` sessions that hold the writer lock.
- Catch the common accidental wrapper forms (`nvm exec ... codex`, `bash -lc 'claude ...'`) instead of only exact first-argv matches.
- Align active runbooks and active skills with the new explicit opt-in contract.
- Capture the remaining offload and queue-latency work as explicit follow-on plan tasks.

### Non-goals
- Replacing the single-writer lock itself in this cycle.
- Completing the build-offload architectural redesign in the same task as wrapper hardening.
- Changing CI requirements or local test policy.

### Constraints & Assumptions
- Constraints:
  - The repo remains single-checkout and single-writer.
  - Local validation must respect the CI-only test execution policy.
  - Active runbooks and active skills need to stay internally consistent after the wrapper contract changes.
- Assumptions:
  - Explicit opt-in is the right immediate control for rare locked interactive shells and rare locked agent sessions.
  - Shared-checkout `workspace-write` offload remains a real architectural exception until a later redesign removes it.

## Outcome Contract
- **Why:** Repeated writer-lock incidents still require manual kill and clean-stale recovery because the docs-only rule change did not remove implicit long-held lock paths or the shared-checkout build-offload exception.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Base-Shop enforces explicit opt-in for locked interactive shells and locked agent CLI sessions, active runbooks and skills match that contract, and the remaining architectural work is captured as follow-on build tasks.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `docs/plans/writer-lock-scope-reduction/plan.md` - completed docs-only adoption cycle.
- `scripts/agents/integrator-shell.sh` - still opens a locked write shell interactively and only blocks exact first-argv `codex|claude`.
- `scripts/agents/with-writer-lock.sh` - still opens a locked shell directly and allows direct locked agent sessions without an explicit opt-in.
- `.claude/skills/_shared/build-offload-protocol.md` - active shared-checkout offload path using `codex exec --sandbox workspace-write` under the full writer-lock window.
- `.claude/skills/ops-ci-fix/SKILL.md` - active Codex offload example using the low-level writer-lock wrapper.
- `scripts/git/writer-lock.sh` and `scripts/git-hooks/writer-lock-window.sh` - current queue/polling primitive plus an unused narrow-window helper.

### Key Modules / Files
- `scripts/agents/integrator-shell.sh`
  - Current write-mode no-arg path opens a locked integrator subshell.
  - Current agent-session guard only checks the first argv token for `codex|claude`.
- `scripts/agents/with-writer-lock.sh`
  - Current no-arg path opens a locked subshell directly.
  - Current command path does not distinguish short git writes from long-lived agent sessions.
- `.claude/skills/_shared/build-offload-protocol.md`
  - Explicitly documents that `workspace-write` offload holds the writer lock for the full mutable session.
- `scripts/git/writer-lock.sh`
  - Waiters poll every 30 seconds in non-interactive runs.
- `scripts/git-hooks/writer-lock-window.sh`
  - Exists as a helper but is not wired into an active workflow.

### Patterns & Conventions Observed
- `writer-lock-scope-reduction` intentionally stopped at documentation and left wrapper enforcement for a later cycle.
- `lp-do-build-codex-offload` intentionally adopted shared-checkout `workspace-write` as the file-writing offload mechanism and accepted the full-session lock tradeoff.
- Git-hook enforcement remains token-based at commit/push time; wrapper correctness still matters because arbitrary file edits are not hook-gated.
- Active runbooks are partly updated, but some active docs still imply interactive locked shells as a normal recovery path.

### Dependency & Impact Map
- Upstream dependencies:
  - Existing writer-lock token contract in `scripts/git-hooks/require-writer-lock.sh`
  - Current active offload patterns in `.claude/skills/_shared/build-offload-protocol.md` and `.claude/skills/ops-ci-fix/SKILL.md`
- Downstream dependents:
  - Human operators following `AGENTS.md`, `docs/git-safety.md`, `docs/git-and-github-workflow.md`, and `docs/business-os/security.md`
  - Agents launched via `integrator-shell.sh` and `with-writer-lock.sh`
  - `lp-do-build` and `ops-ci-fix` offload workflows
- Likely blast radius:
  - Repo-wide shell entrypoint behavior
  - Active runbooks and active skill protocol wording
  - Script-level regression coverage

### Recent Runtime Evidence
- 2026-03-09: a live writer-lock holder had to be terminated manually because a no-op locked shell wrapper remained alive and blocked other work.
- Prior incident: a long Brikette build/export/deploy sequence held the writer lock for the full external command lifetime.
- Current audit finding: `writer-lock-window.sh` exists but no active caller was found in repo search.

## Questions
### Resolved
- Q: Is the completed `writer-lock-scope-reduction` plan sufficient to close the operational problem?
  - A: No. It intentionally stopped at documentation. The remaining issue is runtime behavior in wrappers and active skills.
  - Evidence: `docs/plans/writer-lock-scope-reduction/plan.md`
- Q: Can the current `workspace-write` build-offload path satisfy the minimum-lock-time policy by wrapper tweaks alone?
  - A: No. As long as Codex can mutate the shared checkout at any point during `codex exec`, the full mutable session still requires the lock.
  - Evidence: `.claude/skills/_shared/build-offload-protocol.md`
- Q: Is there a buildable first slice that improves safety without pretending to solve the whole architecture?
  - A: Yes. Harden the wrappers, active runbooks, and active skills now; leave the offload redesign and queue wake-up work as explicit follow-on tasks.
  - Evidence: current wrapper entrypoints and active skill docs are directly editable and bounded.

### Open (Operator Input Required)
- None. The operator already chose to proceed with implementation follow-on work.

## Confidence Inputs
- Implementation: 89%
  - Evidence basis: wrapper, docs, and active skill surfaces are directly identified.
  - What would raise this to >=90: finish the shared detection helper and regression tests cleanly.
- Approach: 84%
  - Evidence basis: explicit opt-in is a coherent immediate control, but it does not solve the offload architecture.
  - What would raise this to >=90: land the offload redesign plan with a concrete replacement for shared-checkout `workspace-write`.
- Impact: 83%
  - Evidence basis: accidental long-held locks will become harder to create, but sanctioned offload sessions remain until follow-on work lands.
  - What would raise this to >=90: remove the shared-checkout offload exception.
- Delivery-Readiness: 88%
  - Evidence basis: no missing operator input and no external dependency for the first task.
  - What would raise this to >=90: confirm active docs and active skills are the full blast radius.
- Testability: 76%
  - Evidence basis: shell-wrapper regressions are testable, but queue latency and architectural offload benefits remain mostly observational until later tasks.
  - What would raise this to >=90: add deterministic tests or instrumentation for queue wake-up and offload lock duration.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Wrapper hardening still leaves active skill docs on the old contract | Medium | Medium | Update active skills in the same task as the wrapper change |
| Explicit opt-in remains bypassable through an unhandled launcher form | Medium | Medium | Cover the known wrapper forms now and keep the detection helper centralized for future extension |
| Queue polling and shared-checkout offload continue causing long wait time | High | Medium | Keep both as explicit follow-on tasks rather than implying they are solved |

## Scope Signal
- **Signal:** sequenced follow-on
- **Rationale:** The work naturally splits into one bounded enforcement task plus two deeper investigations. Folding the architectural redesign into the wrapper patch would hide uncertainty instead of reducing it.

## Primary Evidence List
- `docs/plans/writer-lock-scope-reduction/plan.md`
- `docs/plans/_archive/lp-do-build-codex-offload/plan.md`
- `scripts/agents/integrator-shell.sh`
- `scripts/agents/with-writer-lock.sh`
- `scripts/git/writer-lock.sh`
- `scripts/git-hooks/writer-lock-window.sh`
- `.claude/skills/_shared/build-offload-protocol.md`
- `.claude/skills/ops-ci-fix/SKILL.md`

## Status
- Status: Ready-for-planning
- Primary execution skill: lp-do-build
