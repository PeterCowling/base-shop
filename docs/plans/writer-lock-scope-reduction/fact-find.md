---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-07
Last-updated: 2026-03-07
Feature-Slug: writer-lock-scope-reduction
Execution-Track: business-artifact
Deliverable-Family: doc
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas
Related-Plan: docs/plans/writer-lock-scope-reduction/plan.md
Dispatch-ID: IDEA-DISPATCH-20260307170050-8071
Trigger-Why:
Trigger-Intended-Outcome:
---

# Writer Lock Scope Reduction Fact-Find Brief

## Scope
### Summary
Codify a narrower operational rule for the Base-Shop writer lock so it protects serialized repository writes without serializing long-running build or remote deploy time. The first cycle is documentation and process adoption only: update the canonical runbooks so humans and agents are told to hold the lock around actual git writes and other serialized repo mutations, while running `pnpm build`, verification, and `wrangler` deploy steps outside the lock after artifacts are prepared.

### Goals
- Update canonical repo guidance so writer-lock scope is explicitly tied to repo writes, not all work in a session.
- Document that long read-only discovery and dry runs should stay in guard-only mode.
- Document that build and deploy steps should run outside the writer lock once the artifact is prepared.
- Add incident guidance for long-running external commands that hold the lock longer than expected.

### Non-goals
- Rewriting writer-lock internals, lease semantics, or stale-lock logic in this cycle.
- Adding automatic command blocking for `wrangler` or `pnpm build` under the writer lock.
- Changing git-hook enforcement or queue-state behavior.

### Constraints & Assumptions
- Constraints:
  - This cycle is bounded to documentation and operational process changes.
  - Guidance must stay consistent with the existing single-writer model and must not weaken git safety expectations.
  - Local test execution remains CI-governed; validation for this build should stay doc-safe.
- Assumptions:
  - The operator-approved rule is: lock only around actual git writes or other serialized repo mutations.
  - Build/export/verification/deploy steps can safely run outside the writer lock once the working tree mutation they depend on is complete.

## Outcome Contract
- **Why:** A long remote deploy blocked unrelated commit work because the writer lock scope is broader than the resource it is meant to protect.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Base-Shop runbooks clearly require the writer lock only for serialized repo writes, and they direct build or deploy steps to run outside the lock after artifacts are prepared.
- **Source:** operator

## Access Declarations
- None.

## Evidence Audit (Current State)
### Entry Points
- `AGENTS.md` - canonical repo runbook for writer-lock expectations.
- `docs/git-and-github-workflow.md` - human-facing git workflow troubleshooting.
- `docs/git-hooks.md` - hook troubleshooting and writer-lock recovery guidance.
- `scripts/agents/integrator-shell.sh` - wrapper that currently presents write mode as the default shell mode.
- `scripts/agents/with-writer-lock.sh` - wrapper that holds the lock until the wrapped command exits.
- `scripts/git/writer-lock.sh` - lock lifecycle, stale cleanup, and waiter timeout rules.

### Key Modules / Files
- `AGENTS.md`
  - States agents should start an integrator shell before editing, committing, or pushing, and wrap each write-related command in non-interactive mode.
  - Does not currently spell out that build and deploy commands should be outside the lock unless they are themselves serialized repo mutations.
- `docs/git-and-github-workflow.md`
  - Tells users to hold the writer lock via `integrator-shell.sh -- <command>` when git blocks commit or push.
  - Does not distinguish git writes from long-running pre-commit/pre-push preparation or deploy work.
- `docs/git-hooks.md`
  - Lists status/clean-stale/acquire commands for writer-lock failures.
  - Does not explain how to respond when the lock is live but held by a long external deploy.
- `scripts/agents/integrator-shell.sh`
  - Default write mode acquires the writer lock around the entire wrapped command.
  - Read-only mode already exists and is documented as the path for long audits and dry runs.
- `scripts/agents/with-writer-lock.sh`
  - Acquires the writer lock, exports the token, and releases only on process exit via `trap release_lock EXIT INT TERM`.
- `scripts/git/writer-lock.sh`
  - `clean-stale` refuses cleanup when the holder PID is still live.
  - Waiters time out after 300 seconds by default, but holders have no maximum hold duration.

### Patterns & Conventions Observed
- Canonical policy is documented primarily in `AGENTS.md`, with shorter human-facing restatements in `docs/git-and-github-workflow.md` and `docs/git-hooks.md`.
- Existing guidance is strong on "always acquire the lock before writes" but weak on "release it as soon as the serialized write phase is over."
- The tooling already separates read-only guarded sessions from write sessions; the gap is policy wording and operator guidance, not missing read-only infrastructure.

### Dependency & Impact Map
- Upstream dependencies:
  - Existing writer-lock wrappers and hook enforcement remain the source of truth for git safety.
- Downstream dependents:
  - Agents using `integrator-shell.sh` or `with-writer-lock.sh`.
  - Humans following `AGENTS.md`, `docs/git-and-github-workflow.md`, and `docs/git-hooks.md`.
- Likely blast radius:
  - Repo-wide process expectations for commits, pushes, deploy prep, and incident handling when the lock is held by a live external command.

### Delivery & Channel Landscape
- Audience/recipient:
  - Human operators and coding agents working in the shared checkout.
- Channel constraints:
  - Changes must live in canonical repo runbooks, not only in chat guidance.
- Existing templates/assets:
  - `docs/plans/_templates/fact-find-planning.md`
  - `docs/plans/_templates/plan.md`
- Approvals/owners:
  - Operator already approved the narrower lock-scope rule in chat.
- Compliance constraints:
  - Guidance must not introduce bypasses (`SKIP_WRITER_LOCK`, `--no-verify`) or weaken commit/push gating.
- Measurement hooks:
  - No existing metric for lock-hold duration is documented in the current repo guidance.

### Recent Git / Runtime Evidence
- Live observation from 2026-03-07:
  - A shell launched via `scripts/agents/with-writer-lock.sh` held the lock while running a full Brikette build/export/verify/deploy pipeline ending in `pnpm exec wrangler pages deploy ...`.
  - The lock owner remained live for more than 30 minutes while unrelated commit work was blocked.
  - During the deploy, the working tree was in a transient mutated state because the shell had moved route directories to `_off` locations and relied on an `EXIT` trap to restore them.

## Questions
### Resolved
- Q: Is this a direct-build micro-task under `lp-do-ideas`?
  - A: No. The issue affects canonical repo process guidance across multiple runbooks and requires a scoped planning artifact before execution.
  - Evidence: queue routing judgment plus the breadth of impacted docs and safety policy surfaces.
- Q: Is a code change required in the first cycle to deliver the operator-approved outcome?
  - A: No. The requested outcome is an operational rule adoption. Updating the canonical runbooks is sufficient for the first bounded cycle; enforcement can be evaluated later as a follow-on.
  - Evidence: operator-selected actions were phrased as operational rules, not wrapper redesign requirements.
- Q: Does the repo already provide a read-only path that supports the narrower policy?
  - A: Yes. `integrator-shell.sh --read-only -- <command>` already exists and is explicitly documented for long read-only discovery/planning sessions.
  - Evidence: `scripts/agents/integrator-shell.sh` usage/help and `AGENTS.md` Git Rules section.

### Open (Operator Input Required)
- None. The scope and desired rule were explicitly chosen by the operator.

## Confidence Inputs
- Implementation: 94%
  - Evidence basis: bounded to documentation artifacts with clear target files and no code/runtime change required.
  - What would raise this to >=80: already above threshold.
  - What would raise this to >=90: already above threshold.
- Approach: 91%
  - Evidence basis: current tooling already supports read-only vs write-mode separation, so clarifying the rule is coherent with existing system behavior.
  - What would raise this to >=80: already above threshold.
  - What would raise this to >=90: already above threshold.
- Impact: 84%
  - Evidence basis: explicit guidance should reduce accidental long lock holds, but behavior change depends on humans/agents following the updated runbooks.
  - What would raise this to >=80: already above threshold.
  - What would raise this to >=90: add later telemetry or hard enforcement proving adoption.
- Delivery-Readiness: 92%
  - Evidence basis: target files are identified, no external approvals remain, and docs-only validation is low-risk.
  - What would raise this to >=80: already above threshold.
  - What would raise this to >=90: already above threshold.
- Testability: 78%
  - Evidence basis: documentation changes are reviewable and grep-verifiable, but their real-world effect on lock duration is not directly testable in this cycle.
  - What would raise this to >=80: add a narrow validation rule or future metric around long-held locks.
  - What would raise this to >=90: implement and measure enforcement or telemetry in a follow-on build.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Operators continue wrapping whole deploy pipelines under the lock out of habit | Medium | Medium | Put the narrower rule in canonical docs and include explicit examples of what should and should not be wrapped |
| Documentation-only change is insufficient to stop future incidents | Medium | Medium | Record enforcement as adjacent later work rather than silently expanding this cycle |
| Guidance accidentally weakens lock expectations for real repo mutations | Low | High | State explicitly that git writes and other serialized repo mutations still require the lock |

## Rehearsal Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Canonical repo runbook (`AGENTS.md`) | Yes | None | No |
| Human git workflow guide | Yes | None | No |
| Hook troubleshooting guide | Yes | None | No |
| Wrapper semantics evidence | Yes | None | No |
| Future enforcement work | Partial | Moderate: follow-on enforcement is intentionally out of scope for this cycle | No |

## Scope Signal
- **Signal:** right-sized
- **Rationale:** The requested outcome is an operational rule change, and the minimum effective deliverable is a coordinated update to the canonical runbooks that already govern writer-lock usage. Expanding this cycle into enforcement logic would materially change scope and move beyond the operator-approved rule-adoption ask.

## Evidence Gap Review
### Gaps Addressed
- Confirmed the canonical policy surfaces that currently describe writer-lock usage.
- Confirmed the wrapper semantics that cause the lock to last for the full wrapped command lifetime.
- Confirmed the stale-cleanup and waiter-timeout behavior that makes long live holders operationally painful.

### Confidence Adjustments
- Increased Implementation and Delivery-Readiness confidence because the target change is docs-only and all target files are directly identified.
- Kept Testability below 80 because this cycle improves guidance rather than adding measurable enforcement.

### Remaining Assumptions
- The operator intends this cycle to stop at rule adoption, not automatic wrapper enforcement.
- Future enforcement, if needed, can be handled as a follow-on idea after observing whether the runbook update changes behavior.

## Primary Evidence List
- `AGENTS.md`
- `docs/git-and-github-workflow.md`
- `docs/git-hooks.md`
- `scripts/agents/integrator-shell.sh`
- `scripts/agents/with-writer-lock.sh`
- `scripts/git/writer-lock.sh`

## Status
- Status: Ready-for-planning
- Primary execution skill: lp-do-build
