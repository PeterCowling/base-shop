---
Type: Plan
Status: Draft
Domain: Repo
Created: 2026-02-01
Last-updated: 2026-02-01
Last-reviewed: 2026-02-01
Relates-to charter: none
Feature-Slug: multi-writer-git-locking
Baseline-Commit: 82825687a351deb9fc839e2ff7d2fddee88829ad
Overall-confidence: 62%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
---

# Multi-Writer Git Locking Plan

Leases + Path-Tree Lock Store + Per-Agent Index + Branchless Commits + Isolated Caches

## Summary

A single shared checkout does not safely support many concurrent automated writers at scale:

- Git’s default staging (`.git/index`) contends via `.git/index.lock`, serializing unrelated changes.
- One working tree can only have one branch checked out, coupling otherwise independent publish streams.
- Shared caches/outputs introduce nondeterminism and cross-agent contamination.

This plan introduces a multi-writer model that supports many concurrent agents in a single checkout without worktrees:

- Lease-based publish locks scoped to paths/resources (TTL + renew + deterministic expiry).
- Path-tree lock store (directory structure mirrors repo paths) so hierarchical conflicts are fast and readable.
- Per-agent Git index (`GIT_INDEX_FILE`) so staging/tree creation does not contend on `.git/index.lock`.
- Branchless commits using Git plumbing (`read-tree` / `update-index` / `write-tree` / `commit-tree` + `update-ref` CAS) so agents can publish concurrently without checking out branches.
- Isolated caches/outputs per agent so local checks/builds don’t trample shared artifacts.
- Index-only publish (C2): agents publish from an agent-owned index and patch artifacts; the shared working tree is not a required integration surface for correctness.

Coordination strategy:

- Edit-time: optimistic collaboration is permitted (humans can edit; agents can prepare patches).
- Publish-time: leases are required for any path/resource an agent wants to publish.

## Repo State Alignment

This plan previously described certain “current workflow” elements (writer lock scripts + Merge Gate workflow) as if they were present in the committed repo. The fact-check audit confirmed:

### Verified in HEAD (`82825687…`)

- Auto PR exists and triggers on pushes to `work/**` (`.github/workflows/auto-pr.yml`).
- Env/secrets guard hook exists: `scripts/git-hooks/pre-commit-check-env.sh`.
- A workflow references “Merge Gate” (`.github/workflows/auto-close-failing-prs.yml`), but `merge-gate.yml` is not present in HEAD.

### Present only in the working tree (untracked / not in HEAD)

- A repo-wide writer-lock prototype referenced by the prior draft:
  - `scripts/git/writer-lock.sh`
  - `scripts/git-hooks/require-writer-lock.sh`
  - `scripts/agents/with-writer-lock.sh`
  - plus local `package.json` hook wiring changes
- A `merge-gate.yml` workflow file (untracked in the audit).

**Implication for this plan:** This design does not depend on those untracked prototypes being “the current workflow.” Where those prototypes are useful (e.g., emergency fallback writer lock; “Merge Gate” as a named workflow), this plan treats them as explicit rollout decisions: either land them as part of this work, or update the plan and automation to match the canonical state in HEAD.

## Goals

- Enable many agents to publish concurrently from a single checkout with no repo-wide writer lock.
- Make stale-lock resolution deterministic and automatic (TTL-based leases; no humans reaping locks).
- Prevent cross-agent staging/commit contamination (per-agent index + publish wrapper).
- Preserve Git safety (no destructive commands; PR workflow remains canonical).
- Preserve compatibility with existing automation: push `work/**` → Auto PR → CI/merge checks → merge.

## Non-goals

- Mandatory OS-level file locking (non-portable, unreliable across editors).
- Preventing humans from editing files at edit-time (enforcement is at publish time).
- Distributed locking (Redis/D1/etc.) in v1; v1 targets one machine / shared checkout.
- Replacing the repo’s canonical merge gating; this plan integrates with it (whatever is committed and required).

## Constraints & Assumptions

### Constraints

- Must work on macOS + Linux. Windows is follow-on (path normalization + filesystem semantics).
- Must be safe under crashes: abandoned leases must expire and be cleaned automatically.
- Must not depend on git worktree or per-agent clones.
- Must tolerate many concurrent agents (including subagents) without lock thrash.

### Assumptions

- Agents can be routed through a wrapper (“Git publish API”) for commits/pushes.
- Humans may bypass wrappers.
- Current HEAD includes an env/secrets guard hook, but does not include a writer-lock hook.
- If we want local “lease required” enforcement for humans, we will add it explicitly (see tasks).
- Shared checkout is on a single host filesystem (local disk or shared volume). Host identity must be stable for safe lease expiry.

## Existing System Notes (as of HEAD)

### Why Git alone doesn’t enforce file-level locking

- File locks are advisory unless every writer cooperates.
- Git hooks trigger at commit/push time, not at edit-time.

Therefore:

- We can enforce “no unauthorized publish” reliably for agents that use the wrapper.
- We can enforce “no unauthorized publish” for humans only if we add local hooks and/or server-side checks.

### Current bottlenecks (independent of writer-lock presence)

- `.git/index.lock` contention: default staging serializes unrelated changes.
- Branch checkout state: one working tree can only have one branch checked out.
- Shared caches/outputs: tooling may write into common locations unless isolated.

## Proposed Approach

### Option C2 (Chosen): Index-only publish + isolated caches

Agents do not rely on the shared working tree for correctness. They publish using:

- per-agent index
- patch or file-content inputs
- branchless commit plumbing
- ref CAS updates

This avoids both:

- working-tree nondeterminism at scale, and
- global staging serialization.

The shared working tree may still be used for humans (review/debug), but agent publish correctness does not depend on it.

### Lock Store Layout Option L1 (Chosen): Path-tree lock storage

Locks are stored as a directory tree that mirrors repo paths. This supports fast hierarchical checks:

- Directory locks: `locks/dir/<path>/meta.json`
- File locks: `locks/file/<path>/meta.json`

No global scans are required to answer “any lock under this directory?”

### Tooling Policy Option R2 (Chosen): Isolated caches and outputs per agent

Agents may run local checks/builds, but they must not share caches/outputs. Standardize per-agent cache roots and route relevant tools through them.

## Lock Model (v1)

### What we lock

We lock publish rights, not edit rights.

- File leases for targeted edits.
- Directory leases for refactors (mutually exclusive with any file leases under that dir).
- Resource leases for shared hotspots (examples):
  - `resource/pnpm-lock.yaml`
  - `resource/.github/workflows`
  - `resource/ref:refs/heads/work/<branch>`
  - optional: `resource/repo-checks` (umbrella for repo-wide operations)

### Conflict rules

- If `locks/dir/<dir>` exists → no file lock allowed under `<dir>`.
- If any file lock exists under `locks/file/<dir>/...` → no dir lock allowed for `<dir>`.
- A file lock conflicts only with the same file.
- Resources conflict only by exact resource key.

### Lease semantics

Each lease is a capability:

- `owner_id`: stable id for the agent session (host + run id)
- `token`: random secret required to renew/release
- `renewed_at_epoch`, `expires_at_epoch`
- `max_total_sec`: maximum cumulative hold time (anti-hoarding)
- `note`: optional human-readable purpose (recommended)
- `steal_reason`: optional audit field when stolen

Stale definition (provable):

- `now_epoch > expires_at_epoch` → stale
- stale leases are automatically cleaned during acquire/status operations

Renewal:

- renew extends TTL, but cannot exceed max total lifetime without explicit override

Steal:

- allowed only via explicit `lock steal` with reason
- logs to an audit log file

## Storage layout (L1 path-tree)

Stored in git common dir:

```
${common_dir}/base-shop-locks/v1/
  locks/
    file/<repo-path>/meta.json
    dir/<repo-path>/meta.json
    resource/<resource-key>/meta.json
  audit/
    events.ndjson
  .mutex/   (short-lived mutex for multi-path atomic acquisition)
```

Notes:

- `<repo-path>` is normalized POSIX-style for storage (forward slashes).
- `meta.json` is written atomically (write temp + rename).

### Multi-path acquisition

To avoid partial acquisition deadlocks, `acquire` uses a short-lived global mutex (`.mutex`) only for lock-table operations:

- validate conflicts
- clean expired locks
- create all lock directories
- write all meta files

The mutex is held for milliseconds, not for publish time.

## CLI surface

- `lock acquire <paths...> --ttl <sec> [--wait --timeout <sec>] [--print-token] [--note <text>]`
- `lock renew --token <t> <paths...> [--ttl <sec>]`
- `lock release --token <t> <paths...>`
- `lock status [--json] [--path <prefix>]`
- `lock steal <paths...> --reason <text>` (gated; logs)
- `lock gc` (optional; cleans expired locks)

Paths can be:

- file paths
- directory paths (explicit `--dir`)
- resource keys (explicit `--resource`)

## Git Publishing Model (agents)

### Per-agent index (`GIT_INDEX_FILE`)

Each agent uses its own index file:

`${common_dir}/base-shop-agent-index/<owner_id>.index`

This avoids `.git/index.lock` contention and allows parallel staging.

### Branchless commit plumbing (no checkout)

Publishing does not require checking out branches in the working tree.

Base ref: configurable, usually:

- `refs/heads/work/<branch>` if exists, else
- `origin/main` (or `refs/remotes/origin/main`)

### Publish flow (v1)

Resolve base commit:

- `base_commit = rev-parse <branch> || rev-parse origin/main`

Initialize agent index:

- `GIT_INDEX_FILE=<agent.index> git read-tree <base_commit>`

Apply changes to index (C2 index-only):

- apply a patchset / file-content updates into the index without relying on working tree

Write tree:

- `tree = git write-tree`

Create commit:

- `commit = git commit-tree <tree> -p <base_commit> -m "<msg>"` (plus author/committer env)

Update branch ref with CAS:

- `git update-ref refs/heads/<branch> <commit> <base_commit>`
- if CAS fails: ref advanced; rebase/retry flow (bounded retries)

Push ref:

- `git push origin refs/heads/<branch>:refs/heads/<branch>`

### Branch lease (resource)

To reduce CAS contention, the publish wrapper acquires:

- `resource/ref:refs/heads/<branch>`

TTL short (e.g. 60–120s). This is not global; it only serializes per-branch publishing.

### Publish-time enforcement

The publish wrapper must verify:

- Every changed path in the patchset is covered by a valid lease owned by the token, or is part of an allowed resource lease.
- No forbidden paths are being modified (e.g. protected branches).
- If hybrid OCC is later added: verify base blob OIDs match before applying.

### Policy enforcement parity (local vs CI)

Because C2 bypasses normal git commit hooks, the wrapper runs safety-critical checks, while CI remains the quality gate.

Safety checks in wrapper (required):

- env/secrets guard equivalent to `scripts/git-hooks/pre-commit-check-env.sh`
- lock ownership verification
- protected ref rules (never publish to `main`/`master` from wrapper)
- branch lease acquisition
- deterministic logging (audit trail)

Quality checks (optional locally; required in CI):

- lint/typecheck/tests (can run with isolated caches, but are not required for publish)
- merge gating remains the authoritative merge check

## Shared Working Tree Policy (C2)

Rule: agents do not require the shared working tree to publish.

Agents publish from:

- patchsets produced by their tools, and/or
- file content snapshots

The shared working tree may be used for:

- human review
- debugging
- ad-hoc checks

But agent publish correctness does not depend on it.

### Agent write-time guidance

If an agent writes to the working tree (for convenience), it must:

- hold leases before writing
- restrict edits to leased paths
- not run global “rewrite” tools without explicit resource leases

## Isolated Caches and Outputs (R2)

### Cache root

Standardize:

`${repo_root}/.agent-cache/<owner_id>/`

Provide a wrapper that exports per-agent cache env vars where possible:

- `XDG_CACHE_HOME`
- `TURBO_CACHE_DIR` (if supported by your turbo setup)
- eslint cache location (eslint supports `--cache-location`)
- TypeScript build info paths if configured (e.g. `tsBuildInfoFile` per-agent if needed)

### Outputs

Avoid writing shared build outputs unless:

- the app build system can be directed to per-agent output dirs, or
- the agent holds a resource lease like `resource/build:<app>`

In v1:

- prefer CI to produce deploy outputs
- local builds are advisory unless explicitly needed

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on |
|---|---|---|---:|---:|---|---|
| MWGIT-00 | DECISION | Confirm v1 is C2+L1+R2; define hot resources + branch lease rules; reconcile baseline (HEAD vs working-tree prototypes) | 80% | S | Pending | - |
| MWGIT-01 | INVESTIGATE | Audit current HEAD hooks/scripts for wrapper parity + shared-writer hotspots (and document any working-tree deltas we rely on) | 85% | S | Pending | - |
| MWGIT-02 | IMPLEMENT | Implement lock store + CLI (L1 path-tree) with TTL/renew/max-total + audit log | 70% ⚠️ | M | Pending | MWGIT-00 |
| MWGIT-03 | IMPLEMENT | Implement branch/resource leases (ref leases + hot resources) | 70% ⚠️ | M | Pending | MWGIT-02 |
| MWGIT-04 | INVESTIGATE | Spike branchless commit pipeline with per-agent index + CAS `update-ref` | 78% ⚠️ | S | Pending | MWGIT-01 |
| MWGIT-05 | IMPLEMENT | Implement publish wrapper (index-only apply → `commit-tree` → `update-ref` → push) | 60% ⚠️ | L | Pending | MWGIT-02, MWGIT-03, MWGIT-04 |
| MWGIT-06 | IMPLEMENT | Implement per-agent cache env wrapper (R2) + document supported vars per tool | 65% ⚠️ | M | Pending | MWGIT-01 |
| MWGIT-07 | VALIDATE | Integration test harness: locks + publish (temp repo, concurrent runs) | 60% ⚠️ | L | Pending | MWGIT-02, MWGIT-05 |
| MWGIT-08 | DECISION | Writer-lock prototype disposition: do not assume it is “current”; decide to land as emergency-only tool or drop entirely | 75% | S | Pending | MWGIT-00 |
| MWGIT-09 | DECISION | Merge gating alignment: either land `merge-gate.yml` (if intended) or update docs/workflows to reference the canonical required checks | 75% | S | Pending | MWGIT-00 |

> Effort scale: S=1, M=2, L=3.

## Detailed Tasks

### MWGIT-00: Decision capture for v1 policy (C2 + L1 + R2) and baseline reconciliation

- **Type:** DECISION
- **Confidence:** 80%
  - Implementation: 85% — Decision is actionable with clear downstream work items.
  - Approach: 80% — Aligns with long-term scaling; some preference trade-offs remain.
  - Impact: 80% — Affects all later tasks, but blast radius is understood.
- **Scope:**
  - Confirm we are implementing:
    - C2 (index-only publish)
    - L1 (path-tree lock store)
    - R2 (isolated caches)
  - Define initial “hot resources” list:
    - `resource/pnpm-lock.yaml`
    - `resource/.github/workflows`
    - `resource/ref:refs/heads/work/<branch>`
    - optional: `resource/repo-checks`
  - Reconcile plan baseline:
    - treat writer-lock scripts and `merge-gate.yml` as explicit deliverables only if we choose to land them
    - otherwise remove references from “current workflow” descriptions (done in this revision)
- **Acceptance:**
  - Decision recorded + initial resource list defined + baseline decisions captured.

### MWGIT-01: Audit hooks/scripts for wrapper parity and shared-writer hotspots

- **Type:** INVESTIGATE
- **Confidence:** 85%
  - Implementation: 90% — Repo audit with concrete outputs.
  - Approach: 85% — Evidence-first prerequisite to reduce implementation risk.
  - Impact: 85% — Low-risk; informs boundaries and migration plan.
- **Acceptance outputs:**
  - Compatibility matrix:
    - which existing checks must be replicated in wrapper (env/secrets guard, protected refs, etc.)
    - which scripts assume `.git/index`
    - which scripts mutate shared caches/outputs
  - List of tools to isolate (eslint cache, TS build info, turbo, Next outputs).
  - Documentation of any working-tree-only prototypes we intend to land (if any).

### MWGIT-02: Lock store + CLI (L1)

- **Type:** IMPLEMENT
- **Confidence:** 70% ⚠️
  - Implementation: 75% — Straightforward design; concurrency edge cases need tests.
  - Approach: 80% — Path-tree store improves readability and correctness under hierarchical checks.
  - Impact: 70% — If wrong, can block publishes; requires strong tests and rollout.
- **Implementation requirements:**
  - Path normalization: store paths with forward slashes; reject `..` and absolute paths
  - TTL + renew + max total lifetime
  - Auto-clean expired locks on status/acquire
  - Multi-path atomic acquisition using `.mutex` (short-lived)
  - Audit log `events.ndjson` (no tokens; redact)
- **Acceptance:**
  - CLI commands listed in “CLI surface” implemented.
  - Hierarchical conflicts enforced:
    - dir vs any file under it
    - file vs same file
  - `status` prints stale hints and contention info.
- **Test plan:**
  - Unit + integration tests for TTL expiry, renew, hierarchical conflicts, multi-acquire atomicity, and audit log redaction.

### MWGIT-03: Branch/resource leases

- **Type:** IMPLEMENT
- **Confidence:** 70% ⚠️
  - Implementation: 75% — Built on MWGIT-02 primitives; semantics must be crisp.
  - Approach: 80% — Per-branch lease reduces CAS contention without reintroducing global locks.
  - Impact: 70% — Incorrect scoping could lead to contention or missed serialization.
- **Acceptance:**
  - Branch lease resource keys:
    - `resource/ref:refs/heads/work/<branch>`
  - Publish wrapper acquires branch lease for publish critical section.
  - Hot resource leases supported and audited.
- **Test plan:**
  - Integration tests: lease contention + expiry + renew behavior for resources.

### MWGIT-04: Spike branchless commit + per-agent index

- **Type:** INVESTIGATE
- **Confidence:** 78% ⚠️
  - Implementation: 80% — Git plumbing is known; repo-specific pitfalls need confirmation.
  - Approach: 85% — Correct direction for scale (removes checkout + index bottlenecks).
  - Impact: 78% — Needs verification for deletes/renames and CAS retry policy.
- **Acceptance:**
  - Two “agents” concurrently create commits on distinct refs without checkout changes.
  - Confirm CAS failure behavior and retry policy.
  - Confirm commit author/committer control is correct.
  - Confirm behavior for deletes/renames (at least at the patch-application layer).

### MWGIT-05: Publish wrapper (C2)

- **Type:** IMPLEMENT
- **Confidence:** 60% ⚠️
  - Implementation: 65% — Needs MWGIT-04 evidence + test harness first.
  - Approach: 85% — Long-term scalable publish API; avoids tech debt.
  - Impact: 60% — Subtle Git bugs could cause data loss; must be proven by tests.
- **Wrapper contract:**
  - Inputs:
    - `--branch work/...`
    - `--base origin/main` (default)
    - `--message ...`
    - `--owner-id ...`
    - `--token ...`
    - `--patch <file>` (one or multiple)
  - Flow:
    - acquire branch lease
    - validate leases for all paths affected by patch
    - init index from base
    - apply patch to index (not necessarily working tree)
    - `commit-tree`
    - `update-ref` CAS
    - push
    - release leases (optional policy)
  - Safety checks:
    - env/secrets guard
    - protected ref rules
    - lock ownership
- **Acceptance:**
  - Wrapper can publish concurrently from one checkout without a global lock.

### MWGIT-06: Per-agent cache wrapper (R2)

- **Type:** IMPLEMENT
- **Confidence:** 65% ⚠️
  - Implementation: 70% — Tool-by-tool env support needs audit; wrapper itself is straightforward.
  - Approach: 80% — Eliminates shared-cache flake and cross-agent contamination.
  - Impact: 65% — Partial isolation can still be leaky; requires doc clarity.
- **Acceptance:**
  - A `scripts/agents/with-agent-cache.*` (or equivalent) sets:
    - `XDG_CACHE_HOME=.agent-cache/<owner_id>/xdg`
    - eslint cache location (via wrapper args)
    - turbo cache dir if supported
  - Document which tools honor which env vars/flags.

### MWGIT-07: Integration tests

- **Type:** VALIDATE
- **Confidence:** 60% ⚠️
  - Implementation: 65% — Harness is buildable, but needs determinism to avoid flakes.
  - Approach: 80% — Essential to prove concurrency invariants before rollout.
  - Impact: 60% — Flaky tests risk blocking development; deterministic design is required.
- **Acceptance:**
  - Deterministic temp-repo tests cover:
    - TTL expiry + renew
    - hierarchical conflicts
    - branch lease behavior
    - concurrent publish to two refs
    - CAS failure and retry behavior
  - Limit flake by using a fake clock where possible (lock TTL).

### MWGIT-08: Writer-lock prototype disposition

- **Type:** DECISION
- **Confidence:** 75%
  - Implementation: 80% — Mechanical changes with a rollback path (if we choose to land it).
  - Approach: 75% — Emergency-only tooling can help humans, but must not confuse baseline behavior.
  - Impact: 75% — Must avoid implying it’s required/current when it isn’t.
- **Purpose:**
  - The writer-lock tooling referenced in the original draft is not present in HEAD.
  - Decide whether to:
    - land a repo-wide writer lock as emergency-only tooling (explicitly non-default), or
    - drop it entirely to avoid confusing baseline behavior.
- **Acceptance:**
  - Decision recorded; plan/docs/hook wiring updated accordingly.

### MWGIT-09: Merge gating alignment

- **Type:** DECISION
- **Confidence:** 75%
  - Implementation: 80% — Either land the missing workflow or update references.
  - Approach: 75% — Prefer consistency: workflows/docs should match required checks.
  - Impact: 75% — Misalignment creates operational confusion and broken automation.
- **Purpose:**
  - HEAD references “Merge Gate” in workflow logic, but `merge-gate.yml` was not present in HEAD during audit.
- **Acceptance:**
  - Either:
    - commit the Merge Gate workflow (if intended), or
    - update workflows/docs to reference the canonical required checks.

## Risks & Mitigations

- Risk: Agents bypass wrapper and publish without leases.
  - Mitigation: require wrapper for agent publishing; optionally add server-side validation (CI check that validates lock markers/audit events for agent-authored commits).
- Risk: Shared working tree creates noise.
  - Mitigation: C2 removes correctness dependency on working tree; isolate caches; avoid global tooling without resource leases.
- Risk: Lock hoarding.
  - Mitigation: max total lifetime + TTL renew policy + steal logging.
- Risk: Clock skew.
  - Mitigation: single-host assumption; conservative TTL; avoid cross-machine wall-clock assumptions in v1.
- Risk: Git plumbing bugs (data loss or incorrect trees).
  - Mitigation: MWGIT-04 spike + MWGIT-07 harness before widening adoption; bounded retries; explicit “protected refs” rules.

## Observability

- Lock events: acquire/renew/release/steal, redacting tokens.
- Publish events: branch, base commit, changed paths, CAS failures/retries, push result.
- Metrics (optional v1):
  - contention rate per path
  - average wait time
  - expired lock reap count
  - steal count
  - CAS failure count

## Acceptance Criteria (overall)

- [ ] Stale locks expire deterministically by TTL and are auto-cleaned without humans.
- [ ] Multiple agents publish concurrently to different branches from one checkout without worktrees.
- [ ] Publish-time enforcement prevents unauthorized paths/resources from landing via the wrapper.
- [ ] Operational playbook exists: who owns a lease, when it expires, how to wait, how to steal (audited).
- [ ] Plan and automation references match what is actually committed in HEAD (no “current workflow” drift).

## Decision Log

- 2026-02-01: Revised plan to align with fact-check audit; writer-lock and Merge Gate are no longer described as present in HEAD unless explicitly landed.

