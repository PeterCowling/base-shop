---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Repo/Git
Workstream: Engineering
Created: 2026-02-11
Last-updated: 2026-02-11
Feature-Slug: writer-lock-enforcement-queue-hardening
Deliverable-Type: code-change
Execution-Track: code
Primary-Execution-Skill: build-feature
Supporting-Skills: re-plan, safe-commit-push-ci
Related-Plan: docs/plans/writer-lock-enforcement-queue-hardening-plan.md
Business-OS-Integration: off
Business-Unit: PLAT
Card-ID:
---

# Writer Lock Enforcement + Queue Hardening Fact-Find Brief

## Scope
### Summary
Audit the newly introduced queued writer-lock flow and command-guard UX for failure modes, bypass vectors, and control gaps that can still cause lost work or wasted agent cycles.

### Goals
- Validate whether FIFO queueing actually preserves single-writer safety under process failures.
- Identify realistic bypass paths for lock enforcement and destructive-command controls.
- Capture planning-ready hardening tasks with evidence and severity.

### Non-goals
- Implementing fixes in this pass.
- Redesigning the entire lock architecture.
- Auditing GitHub remote protections/rulesets.

### Constraints & Assumptions
- Constraints:
  - Keep single-checkout, single-writer operating model.
  - Preserve existing no-destructive-command policy.
  - Keep guidance actionable for both humans and agents.
- Assumptions:
  - Local host PID checks remain the primary stale-lock signal.
  - Current queue model is file-system backed under git common dir.
  - Any fix to orphan-acquire (Finding 1) must account for POSIX PID reuse; binding acquire permission to a live ticket requires more than a PID-alive check (e.g., ticket file existence + PID match together).

## Evidence Audit (Current State)
### Entry Points
- `scripts/git/writer-lock.sh` - writer lock + queue core.
- `scripts/agents/with-writer-lock.sh` - lock wrapper with token export and trap release.
- `scripts/agents/integrator-shell.sh` - default launch path for guarded sessions.
- `scripts/agents/with-git-guard.sh` - PATH-based command guard activation.
- `scripts/agent-bin/git` - destructive-command deny wrapper.
- `scripts/git-hooks/require-writer-lock.sh` - commit/push lock enforcement hook.

### Key Modules / Files
| File | Role | Evidence |
|---|---|---|
| `scripts/git/writer-lock.sh` | Queue and lock lifecycle | `scripts/git/writer-lock.sh:37`, `scripts/git/writer-lock.sh:456` |
| `scripts/agents/with-writer-lock.sh` | Tokenized lock ownership wrapper | `scripts/agents/with-writer-lock.sh:102` |
| `scripts/agents/with-git-guard.sh` | PATH prepend guard model | `scripts/agents/with-git-guard.sh:31` |
| `scripts/agent-bin/git` | Blocked-command UX and guard logic | `scripts/agent-bin/git:74`, `scripts/agent-bin/git:107` |
| `scripts/git-hooks/require-writer-lock.sh` | Hook enforcement + bypass env | `scripts/git-hooks/require-writer-lock.sh:6` |
| `AGENTS.md` | Canonical operator guidance | `AGENTS.md:76` |
| `docs/git-safety.md` | Canonical safety guidance | `docs/git-safety.md:50` |

### Patterns & Conventions Observed
- Queue admission is ticket-based FIFO, but acquire fallback allows progress when queue head is missing.
  - Evidence: `scripts/git/writer-lock.sh:241`
- Queue stale cleanup is PID-based and host-local.
  - Evidence: `scripts/git/writer-lock.sh:160`
- Lock release requires token unless `--force`.
  - Evidence: `scripts/git/writer-lock.sh:562`
- Guard enforcement is session/PATH scoped, not kernel- or shell-global.
  - Evidence: `scripts/agents/with-git-guard.sh:31`

### Data & Contracts
- Lock state:
  - Directory: `<git-common-dir>/base-shop-writer-lock`
  - Fields in `meta`: token, owner pid, started_at, branch, cwd.
  - Evidence: `scripts/git/writer-lock.sh:37`, `scripts/git/writer-lock.sh:365`
- Queue state:
  - Directory: `<git-common-dir>/base-shop-writer-lock-queue/entries`
  - Ticket files include pid/host metadata.
  - Evidence: `scripts/git/writer-lock.sh:39`, `scripts/git/writer-lock.sh:223`

### Dependency & Impact Map
- Upstream dependencies:
  - POSIX shell behavior and process lifecycle semantics.
  - `git rev-parse` for lock storage paths.
- Downstream dependents:
  - All local commit/push operations through hooks.
  - All guarded agent git operations.
- Likely blast radius:
  - High for collaboration throughput and data safety if lock ownership is wrong.
  - High for operator time waste if guidance points to dead-end commands.

### Findings (Prioritized)

#### FINDING 1 (Critical): orphan waiter can still acquire lock after losing queue ticket
- What can go wrong:
  - Waiter ticket is deleted when parent PID dies, but child waiter process may still be alive.
  - If queue becomes empty, child waiter can acquire lock anyway.
- Why:
  - Queue stale cleanup deletes ticket by dead PID (`scripts/git/writer-lock.sh:160`, `scripts/git/writer-lock.sh:173`).
  - Waiter PID in queue entry is parent wrapper PID (`scripts/git/writer-lock.sh:206`).
  - Acquire gate returns allow when queue head missing (`scripts/git/writer-lock.sh:245`).
  - Acquire loop keeps running in child waiter (`scripts/git/writer-lock.sh:473`).
- Impact:
  - Lock can be owned by dead parent PID (false owner), violating intended single-writer control.
- Repro status:
  - Reproduced via isolated temp-repo probe in this session.

#### FINDING 2 (High): docs currently recommend a direct command that can wedge lock ownership flow
- What can go wrong:
  - Guidance tells users to run `writer-lock.sh acquire --wait` directly.
  - That acquires lock but does not export token to caller shell, so normal release fails.
- Why:
  - Recommended in docs/hooks (`AGENTS.md:76`, `docs/git-safety.md:50`, `scripts/git-hooks/require-writer-lock.sh:78`).
  - Release requires matching token unless forced (`scripts/git/writer-lock.sh:559`, `scripts/git/writer-lock.sh:562`).
- Impact:
  - Good-faith recovery can create lock states that require `--force` cleanup.
- Repro status:
  - Reproduced in temp repo: acquire succeeded, non-force release failed with token error.

#### FINDING 3 (High): lock bypass still possible outside guarded sessions via `SKIP_WRITER_LOCK=1`
- What can go wrong:
  - Hook enforcement exits early when `SKIP_WRITER_LOCK=1` is set.
- Why:
  - `require-writer-lock.sh` bypass branch (`scripts/git-hooks/require-writer-lock.sh:6`).
  - Agent guard blocks this only when wrapper is active (`scripts/agent-bin/git:107`).
- Impact:
  - Users/processes not launched in guard path can bypass lock enforcement.

#### FINDING 4 (High): destructive-command guard can be bypassed with absolute git binary
- What can go wrong:
  - PATH-based guard can be bypassed by calling `/usr/bin/git` directly.
- Why:
  - Guard strategy is PATH prepend (`scripts/agents/with-git-guard.sh:31`).
- Impact:
  - Local destructive operations may bypass wrapper-level deny logic (hook protections apply later at commit/push only).

#### FINDING 5 (Medium): status/diagnostics can block behind queue mutex
- What can go wrong:
  - `status` waits on queue mutex with no timeout.
- Why:
  - Infinite mutex loop (`scripts/git/writer-lock.sh:95`).
  - Status acquires mutex before reporting (`scripts/git/writer-lock.sh:302`).
- Impact:
  - During lock incidents, observability command may hang instead of returning diagnostics.

#### FINDING 6 (Medium): `release --force` remains a practical lock-ownership bypass
- What can go wrong:
  - Any local actor can forcibly remove active lock metadata.
- Why:
  - Token checks skipped when `--force` used (`scripts/git/writer-lock.sh:562`).
- Impact:
  - Active owner can be evicted without ownership proof.

#### FINDING 7 (Medium): no automated tests cover queue/orphan invariants
- What can go wrong:
  - Future lock script edits can silently regress safety behavior.
- Why:
  - No queue/writer-lock tests found under `scripts/__tests__/`.
- Impact:
  - High regression risk on critical coordination path.

### Risks (Planning-Phase)
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| PID reuse causes false-positive stale detection after orphan-acquire fix | Medium | High — blocks legitimate writer | Fix must bind acquire to ticket-file-existence + PID match, not PID alone |
| Removing direct `acquire --wait` guidance breaks operator muscle memory | High | Low — learning curve only | TASK-02 must include migration note pointing to wrapper paths |
| Restricting `release --force` slows emergency recovery | Medium | Medium | Open question: hard restriction vs. documented protocol (see Questions § Open) |
| No baseline metrics exist for post-delivery measurement | High | Medium — cannot prove improvement | Add pre-fix instrumentation step for queue wait events and stale-lock recoveries |

### Test Landscape (required for `code` or `mixed`)
#### Test Infrastructure
- Frameworks: Jest for script policy tests.
- Existing relevant tests:
  - `scripts/__tests__/git-safety-policy.test.ts`
  - `scripts/__tests__/pre-tool-use-git-safety.test.ts`

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| command deny patterns | policy/unit | `scripts/__tests__/git-safety-policy.test.ts` | good coverage for guard/hook deny/allow patterns |
| pre-tool deny behavior | policy/unit | `scripts/__tests__/pre-tool-use-git-safety.test.ts` | good coverage for text-pattern blocks |
| writer-lock queue invariants | none | none | no automated coverage for queue fairness/orphan ownership |

#### Coverage Gaps (Planning Inputs)
- Untested paths:
  - `scripts/git/writer-lock.sh` queue lifecycle and stale cleanup interactions.
  - wrapper crash/kill scenarios with child waiters.
- Extinct tests:
  - None identified in this audit.

#### Recommended Test Approach
- Add shell integration tests for:
  - FIFO order with 3+ concurrent waiters.
  - killed-parent waiter cannot acquire lock.
  - direct acquire guidance path does not leave unreleasable state.
  - `status` always returns under mutex contention.

### Recent Git History (Targeted)
- Not completed in this pass (working-tree state is highly active and uncommitted).
- This brief uses current working-tree evidence and empirical probes.

## Questions
### Resolved
- Q: Can queue waiters be starved or reordered?
  - A: FIFO ticketing exists, but orphaned waiter path can still violate intended ownership.
  - Evidence: `scripts/git/writer-lock.sh:202`, `scripts/git/writer-lock.sh:241`
- Q: Is command-block guidance now directive?
  - A: Yes, guidance now includes explicit allowed path and disallowed retries.
  - Evidence: `scripts/agent-bin/git:74`, `.claude/hooks/pre-tool-use-git-safety.sh:57`, `scripts/git-hooks/require-writer-lock.sh:47`

### Open (User Input Needed)
- Q: Should `release --force` be restricted to explicit human break-glass context only (with mandatory audit log)?
  - Why it matters: determines whether hard technical restriction is acceptable vs. documented policy only.
  - Decision impacted: lock release contract and operational recovery workflow.
  - Decision owner: Pete
  - Default assumption + risk: default to restrict; risk is slower emergency recovery if no alternate path is provided.

## Confidence Inputs (for /plan-feature)
- Implementation: 90%
  - Root causes are concrete and line-level reproducible.
- Approach: 82%
  - Clear direction exists, but tradeoff on break-glass ergonomics needs explicit decision.
- Impact: 88%
  - Blast radius is well-scoped to local safety/coordination surfaces.
- Delivery-Readiness: 86%
  - Changes are script-level with known validation patterns.
- Testability: 70%
  - Needs new queue/orphan integration tests to raise confidence above 85%.

## Planning Constraints & Notes
- Must-follow patterns:
  - Keep single-writer invariant strictly enforceable.
  - Keep operator guidance fail-safe and non-self-contradictory.
- Rollout/rollback expectations:
  - Roll out behind script-level tests first.
  - Rollback by reverting targeted scripts/docs if queue invariants fail in practice.
- Observability expectations:
  - Status commands should remain fast and non-blocking even during contention.
  - Errors must give one valid path forward, not multiple conflicting options.

## Suggested Task Seeds (Non-binding)
- TASK-01: Fix orphan waiter acquisition by binding acquire permission to live, owned ticket.
- TASK-02: Remove direct `writer-lock.sh acquire --wait` from all user guidance; point only to wrapper paths.
- TASK-03: Decide and implement `release --force` governance (hard restriction + audit, or safer documented protocol).
- TASK-04: Harden guard coverage against absolute-path git usage (or add equivalent hook-layer protections for pre-commit destructive ops).
- TASK-05: Add automated queue/orphan/status contention tests for `writer-lock.sh`.

## Execution Routing Packet
- Primary execution skill:
  - `build-feature`
- Supporting skills:
  - `re-plan`, `safe-commit-push-ci`
- Deliverable acceptance package:
  - queue invariants enforced under failure scenarios,
  - docs/guidance aligned with real lock lifecycle,
  - bypass vectors reduced or explicitly governed,
  - automated regression tests added for critical flows.
- Post-delivery measurement plan:
  - track lock-related incidents and median wait time,
  - track repeated blocked-command retries per session,
  - verify no dead-owner lock acquisitions in one-week soak.
  - Note: no baseline instrumentation exists today; consider pre-fix logging of queue wait events and stale-lock recoveries to establish baselines before deploying fixes.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None for planning.
- Recommended next step:
  - Proceed to `/plan-feature` using this brief as source of truth.

## Pending Audit Work
- Perform targeted git-history review of lock-related files to identify recently introduced regressions vs longstanding behavior.
- Add a small matrix of host/process failure modes not yet exercised (cross-host stale scenarios and queue-mutex stale-on-live-process edge case).
