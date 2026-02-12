---
Type: Fact-Find
Outcome: Planning
Status: Proposed
Domain: Repo/Git
Workstream: Engineering
Created: 2026-02-10
Last-updated: 2026-02-10
Audit-Ref: be62852bb0 (working-tree)
Feature-Slug: git-enforcement-gap-hardening
Deliverable-Type: code-change
Execution-Track: code
Primary-Execution-Skill: wf-build
Supporting-Skills: wf-replan, ops-ship
Related-Plan: none
Business-OS-Integration: off
Business-Unit: PLAT
Card-ID:
---

# Git Enforcement Gap Hardening Fact-Find

## Scope

### Summary

The repo's git safety system has strong mechanistic enforcement for destructive commands (reset, force-push, rebase, etc.) but leaves four conflict-resolution safeguards as documentation-only guidance. This wf-fact-find audits the enforcement landscape, identifies the highest-value gaps, and provides task-ready evidence for a hardening plan.

This wf-fact-find is intentionally standalone and can seed a new active plan without relying on archived planning artifacts.

### Goals

- Map every git safety control to its enforcement layer(s) with composition semantics.
- Identify controls that are documented as policy but lack mechanistic enforcement.
- Produce task-ready gap descriptions with concrete implementation targets and effort estimates.
- Feed directly into `/wf-plan` for prioritized execution.

### Non-goals

- Re-litigating archived planning strategy.
- Auditing CI/CD pipeline enforcement (GitHub branch protection rules, required status checks, CODEOWNERS). These are a separate scope; they exist and provide additional defense-in-depth at the remote level but are not audited here.
- Changing the documented conflict-resolution procedure itself — only mechanizing its enforcement.

### Constraints & Assumptions

- Constraints:
  - All new enforcement must be additive (no breaking changes to existing workflows).
  - Writer-lock protocol must be respected.
  - No new agent-accessible bypass paths. If an override is introduced, it must be human-only, documented, and explicitly blocked in agent layers.
  - Pre-push hook changes must have low false-positive rates to avoid blocking legitimate pushes.
  - Each change must explicitly declare scope: universal (hooks) or agent-only (guard/PreToolUse/permissions).
- Assumptions:
  - The existing hook installation mechanism (`pnpm run prepare` via simple-git-hooks) is stable and working.
  - `scripts/validate-changes.sh` is already run in the pre-push hook and is the right place to extend lockfile audit.

## Evidence Audit (Current State)

### Scope Boundary: What Is and Is Not Audited

**In scope (local enforcement):**

| Layer | Mechanism | Audience |
|-------|-----------|----------|
| Layer 1 | Policy docs (`docs/git-safety.md`, `AGENTS.md`) | All |
| Layer 2 | Local git hooks (`scripts/git-hooks/`) | All local users |
| Layer 3 | Agent git guard (`scripts/agent-bin/git`) | Agent sessions only |
| Layer 4 | Agent PreToolUse hook (`.claude/hooks/pre-tool-use-git-safety.sh`) | Agent sessions only |
| Layer 5 | Agent permissions (`.claude/settings.json`) | Agent sessions only |

**Out of scope (remote enforcement):**

| Layer | Mechanism | Notes |
|-------|-----------|-------|
| Layer 6 | GitHub branch protection rulesets | Not re-verified in this audit; expected by repo policy docs |
| Layer 7 | CI required status checks | Not re-verified in this audit; expected by repo policy docs |
| Layer 8 | CODEOWNERS | Not audited |

These remote layers provide defense-in-depth but are managed separately and not part of this hardening scope.

### Entry Points

- `scripts/git-hooks/pre-push.sh` — orchestrates pre-push gates (writer lock + safety + validation)
- `scripts/git-hooks/pre-commit.sh` — orchestrates pre-commit gates (writer lock + staged checks)
- `scripts/agent-bin/git` — PATH-level command interceptor for agent sessions
- `.claude/hooks/pre-tool-use-git-safety.sh` — stdin-level command interceptor for agent Bash tool calls
- `.claude/settings.json` — permission-level deny/ask/allow rules for agent sessions
- `scripts/validate-changes.sh` — range-scoped typecheck/lint/test validation gate

### Key Modules / Files

| File | Role | Lines |
|------|------|-------|
| `docs/git-safety.md` | Canonical safety guide and process documentation | 223 |
| `scripts/agent-bin/git` | Agent git wrapper with hard-block deny logic | 303 |
| `.claude/hooks/pre-tool-use-git-safety.sh` | PreToolUse hook with regex-based deny patterns | 200 |
| `.claude/settings.json` | Permission rules (deny/ask/allow) | 109 |
| `scripts/git-hooks/pre-push-safety.sh` | Universal pre-push: blocks protected branches + non-FF | 71 |
| `scripts/git-hooks/pre-push.sh` | Pre-push orchestrator: lock + safety + validation | 42 |
| `scripts/git-hooks/pre-rebase-safety.sh` | Universal rebase block with human bypass | 24 |
| `scripts/git-hooks/prepare-commit-msg-safety.sh` | Universal amend/reuse block with human bypass | 34 |
| `scripts/git-hooks/no-partially-staged.js` | Universal partial-stage/unmerged block | 105 |
| `scripts/git-hooks/require-writer-lock.sh` | Universal writer-lock enforcement | 78 |
| `scripts/validate-changes.sh` | Range-scoped typecheck/lint/test | 367 |
| `scripts/__tests__/git-safety-policy.test.ts` | Table-driven policy enforcement tests (both hook + guard) | 702 |
| `scripts/__tests__/pre-tool-use-git-safety.test.ts` | Standalone PreToolUse hook tests | 212 |

### Enforcement Layer Composition Matrix

This is the core evidence artifact. Each row shows a control objective and exactly which layer(s) enforce it.

**Legend:** Hard = exits non-zero automatically. Ask = can proceed with explicit approval. Bypass = human-only emergency override exists. Soft = documentation/skill instruction only.

| # | Control Objective | L1 Policy | L2 Hooks (universal) | L3 Guard (agent) | L4 PreToolUse (agent) | L5 Permissions (agent) | Composition Notes |
|---|---|---|---|---|---|---|---|
| 1 | Block `reset --hard/--merge/--keep` | Yes | — | Hard | Hard | Hard (deny) | Triple agent coverage; no universal hook (humans rely on discipline + L1) |
| 2 | Block force/mirror push | Yes | Hard (pre-push-safety) | Hard | Hard | Hard (deny) | Full stack. Hook catches at push-time; agent layers catch at command-time |
| 3 | Block non-fast-forward push | Yes | Hard (pre-push-safety via merge-base) | — | — | — | Universal only; agent layers don't check FF (caught by hook at push-time) |
| 4 | Block direct push to protected branches | Yes | Hard (pre-push-safety) | — | — | — | Universal only; additional GitHub ruleset protection at remote |
| 5 | Block rebase | Yes | Hard (pre-rebase-safety; `ALLOW_GIT_REBASE` bypass) | Hard | Hard | Hard (deny) | Full stack. Hook has human bypass; agent layers have no bypass |
| 6 | Block `commit --amend` / commit-message reuse | Yes | Hard (prepare-commit-msg-safety; `ALLOW_COMMIT_MSG_REUSE` bypass) | Hard for `--amend`; none for `-c/-C` | Hard for `--amend`; none for `-c/-C` | Hard deny for `--amend`; ask-gate for `ALLOW_COMMIT_MSG_REUSE=1` | Mixed coverage: `--amend` is full-stack; message-reuse relies primarily on prepare-commit-msg hook |
| 7 | Block hook bypass (`--no-verify`) | Yes | — (by nature) | Hard | Hard (commit); Hard (push) | Ask (commit/push `--no-verify`) | L5 ask-gates it; L3/L4 hard-block it. Net: hard-blocked for agents |
| 8 | Block `SKIP_*` env vars | Yes | — (by nature) | Hard | Hard | Ask | Same as #7: net hard-block for agents; humans can set env vars freely |
| 9 | Require writer lock | Yes | Hard (require-writer-lock in pre-commit + pre-push) | — | — | — | Universal enforcement via hooks |
| 10 | Block partially staged/unmerged commit | — | Hard (no-partially-staged.js) | — | — | — | Universal only; no agent-specific layer |
| 11 | Range-scoped validation before push | — | Hard (pre-push.sh → validate-changes.sh) | — | — | — | Universal only |
| 12 | Block stash pop/apply | Yes | — | Hard | — | Ask | L3 hard-blocks; L5 ask-gates. PreToolUse (L4) does NOT block. Net: hard-blocked for agents when wrapper is on PATH |
| 13 | Block stash drop/clear | Yes | — | Hard | Hard | Hard (deny) | Triple agent coverage; no universal hook |
| 14 | Block `checkout -f`/`restore .`/bulk discard | Yes | — | Hard | Hard | Hard (deny) | Triple agent coverage; no universal hook |
| 15 | Block `clean -f` | Yes | — | Hard | Hard | Hard (deny) | Triple agent coverage; no universal hook |
| 16 | Block worktree ops | Yes | — | Hard | Hard | Hard (deny) | Triple agent coverage; no universal hook |
| 17 | Block `core.hooksPath` override | Yes | — | Hard | Hard | Hard (deny) | Triple agent coverage; no universal hook |
| 18 | **Create pre-merge safety anchor** | **Soft** | — | — | — | — | **GAP: doc-only** |
| 19 | **Enforce `--no-ff` merge** | **Soft** | — | — | — | — | **GAP: doc-only** |
| 20 | **Post-merge no-loss verification** | **Soft** | — | — | — | — | **GAP: doc-only** |
| 21 | **Lockfile regeneration after conflict** | **Soft** | — | — | — | — | **GAP: doc-only** |

### Patterns & Conventions Observed

- **Source-of-truth reference pattern:** Enforcement scripts reference `docs/git-safety.md § Command Policy Matrix` as their canonical source. Evidence: `scripts/agent-bin/git:8`, `.claude/hooks/pre-tool-use-git-safety.sh:2`, `.claude/hooks/session-start.sh:3`, `scripts/__tests__/git-safety-policy.test.ts:4,41`.
- **Table-driven testing:** `git-safety-policy.test.ts` uses a shared `POLICY_TABLE` array to test both the PreToolUse hook and git guard wrapper against the same cases. Currently 67 test cases.
- **Layered deny semantics:** The git wrapper (L3) is the most restrictive layer. Settings permissions (L5) are less restrictive for some operations (e.g., stash pop/apply is ask-gated in L5 but hard-blocked in L3). The wrapper takes precedence when on PATH.
- **Human bypass pattern:** Universal hooks that need emergency overrides use env-var gates (`ALLOW_GIT_REBASE=1`, `ALLOW_COMMIT_MSG_REUSE=1`). These env vars are themselves blocked for agents by L3/L4/L5.

### Incident Evidence

**January 14, 2026 incident** (`docs/historical/RECOVERY-PLAN-2026-01-14.md`):

Timeline (proven by git reflog evidence, lines 23-29):
1. `git stash pop stash@{0}` — attempted stash restore
2. `git reset --hard HEAD` — first reset
3. **`git reset --hard 59f17b748`** — destructive event (reset to old commit)
4. `git stash pop stash@{0}` — failed recovery
5. `git checkout --theirs . 2>/dev/null; git add -A` — bulk discard

**What the incident proves:** Destructive reset + stash operations caused major data loss. The existing mechanistic controls (rows 1, 12-13 in the matrix) now block these exact operations for agents.

**What the incident does NOT prove:** That missing pre-merge safety anchors caused the incident. The timeline shows stash/reset operations, not a merge-without-anchor event.

**Practical implication:** Safety anchors (row 18) are defense-in-depth for merge scenarios. They should be justified as merge-failure mitigation, not as the incident's root cause fix.

## Findings (Prioritized)

### FINDING 1: Phantom source-of-truth section (Critical, trivial fix)

**Problem:** 4 active enforcement files reference `docs/git-safety.md § Command Policy Matrix` as their canonical source of truth, but this section does not exist in the document.

**Files referencing the phantom section:**

| File | Line | Reference |
|------|------|-----------|
| `scripts/agent-bin/git` | 8 | `# Source of truth: docs/git-safety.md § Command Policy Matrix` |
| `.claude/hooks/pre-tool-use-git-safety.sh` | 2 | `# Source of truth: docs/git-safety.md § Command Policy Matrix (Deny table)` |
| `.claude/hooks/session-start.sh` | 3 | `# The guard enforces docs/git-safety.md § Command Policy Matrix at PATH level.` |
| `scripts/__tests__/git-safety-policy.test.ts` | 4, 41 | Source of truth reference + table derivation comment |

**Impact:** Maintainers cannot locate the "source of truth" that enforcement scripts claim to implement. Policy drift between docs, hooks, and tests becomes invisible.

**Fix:** Add a `## Command Policy Matrix` section to `docs/git-safety.md` containing deny/ask/allow tables that match the current enforcement. All existing references then resolve correctly.

**Effort:** S (< 1 hour). The content already exists across scripts; it just needs to be consolidated into the doc.

**Owner:** Whoever maintains `docs/git-safety.md` (currently: any contributor, gated by pre-commit hooks).

### FINDING 2: Four conflict-procedure controls are soft-only (High value, variable effort)

Rows 18-21 in the enforcement matrix have no mechanistic enforcement at any layer. These are four distinct problems with different solutions:

#### 2a: Pre-merge safety anchor (row 18)

**Current state:** `docs/git-safety.md:122-127` documents creating a backup branch before merge. No hook or script enforces this.

**Risk:** If a merge goes wrong without an anchor, recovery requires manual reflog archaeology.

**Proposed enforcement layer:** Agent git wrapper extension — intercept `git merge` and auto-create `backup/pre-merge-<timestamp>` branch before passing through to real git.

**Scope:** Phase 1 agent-only (wrapper) for low rollout risk. A universal equivalent can be evaluated in Phase 2 if operator variance remains high.

**Effort:** M (half day). Requires wrapper modification + test cases in `git-safety-policy.test.ts`.

**Open question:** Should the anchor be a branch (visible in `git branch`) or a tag (visible in `git tag`)? Tags are lighter-weight but less discoverable. Branch is the documented convention.

#### 2b: Enforce `--no-ff` merge (row 19)

**Current state:** `docs/git-safety.md:133` shows `git merge --no-ff origin/dev`. No enforcement that `--no-ff` is actually used.

**Risk:** Fast-forward merges leave no merge commit, making it harder to identify and revert a bad merge.

**Proposed enforcement layer:** Two options:
- **Option A (config):** Set `merge.ff=false` in `.gitconfig` bootstrap or git hook. Universal. Humans can override with `--ff-only` when intentional.
- **Option B (wrapper):** Agent git wrapper intercepts `git merge` without `--no-ff` and adds it. Agent-only.

**Effort:** S (30 minutes for config approach). The config approach is a one-line change + documentation update.

**Owner:** Hook/config maintainer.

#### 2c: Post-merge no-loss verification (row 20)

**Current state:** `.claude/skills/ops-ship/SKILL.md` documents a post-merge diff check. No hook enforces this.

**Risk:** A merge that silently drops files (e.g., bad conflict resolution) passes through to push without detection.

**Proposed enforcement layer:** Pre-push hook extension. After merge commits, check that no files present in both parent commits are absent in the merge result (deletion-anomaly heuristic).

**Scope:** Universal (pre-push hook). Start in warn mode with no new bypass. Promote to blocking mode after false-positive calibration.

**Effort:** L (1-3 days). This is the hardest item. Requires:
- Heuristic design that distinguishes intentional deletions from resolution errors
- False-positive testing against real merge history
- Rollout mode design (warn -> block) and escalation guidance

**Open question:** What false-positive rate is acceptable? Need to test against recent merge commits to calibrate.

#### 2d: Lockfile regeneration after conflict (row 21)

**Current state:** `docs/git-safety.md:144-146` documents regenerating lockfile. No enforcement.

**Risk:** Manually edited lockfile after conflict leads to non-reproducible installs and dependency drift.

**Proposed enforcement layer:** `scripts/validate-changes.sh` extension. If the commit range includes changes to a lockfile AND there were merge commits in the range, verify the lockfile matches regeneration output.

**Scope:** Universal (runs in pre-push via validate-changes.sh).

**Effort:** M (half day). Needs:
- Detection of lockfile changes in the validation range
- Comparison with `pnpm install --lockfile-only` output
- Must stay fast (< 5 seconds for typical cases)

**Owner:** validate-changes.sh maintainer.

### FINDING 3: Enforcement language drift in documentation (Medium value, low effort)

**Problem:** `docs/git-safety.md` describes controls at a single confidence level ("Protection Layers" section, lines 77-117) without distinguishing between hard-blocks, ask-gates, and soft guidance. A reader of the doc cannot tell which protections are mechanistic vs aspirational.

**Impact:** Overconfidence in enforcement coverage. Miscalibrated expectations during incident response.

**Fix:** Adopt consistent terminology in `docs/git-safety.md`:
- "Hard-blocked" for operations that exit non-zero automatically.
- "Ask-gated" for operations that require explicit approval/bypass.
- "Documented procedure" for guidance without enforcement.

**Effort:** S (< 1 hour). Terminology update within existing doc structure.

### FINDING 4: Test coverage gap — stash pop/apply L4 inconsistency

**Problem:** The PreToolUse hook (L4) does NOT block `git stash pop` or `git stash apply`. The git wrapper (L3) does. The test file `git-safety-policy.test.ts` has `skipHook: true` on TC-56 (stash pop) and TC-EXTRA-06 (stash apply), acknowledging this gap. The permission settings (L5) ask-gate these operations.

**Current behavior:** Stash pop/apply is effectively hard-blocked for agents because the wrapper (L3) catches it first. But if the wrapper were ever not on PATH (e.g., a misconfigured session), only the ask-gate in L5 would protect.

**Impact:** Low (defense-in-depth gap only — two layers still protect).

**Fix:** Add stash pop/apply to the PreToolUse hook deny patterns for consistency.

**Effort:** S (15 minutes + test update).

## Data & Contracts

### Types/schemas

No new types. Changes are to shell scripts and markdown docs.

### Persistence

No database changes. Affected files:
- New section in `docs/git-safety.md` (Command Policy Matrix)
- Modified scripts: `scripts/agent-bin/git`, `scripts/validate-changes.sh`, `scripts/git-hooks/pre-push.sh`

### API/event contracts

No API changes. Hook exit-code contracts:
- Exit 0 = allow
- Exit 1 = block (git hooks)
- Exit 2 = block (PreToolUse hooks)

## Dependency & Impact Map

### Upstream dependencies

- `simple-git-hooks` package — installs hooks via `pnpm run prepare`
- `jq` (optional) — used by PreToolUse hook for JSON parsing
- `node` — used by `no-partially-staged.js` and as jq fallback

### Downstream dependents

- Every `git commit` and `git push` in the repo flows through these hooks
- Agent sessions flow through all 5 layers
- CI runs on pushed code but does not use local hooks

### Likely blast radius

- **Finding 1:** Zero blast radius (doc-only change)
- **Finding 2a:** Agent merge operations only
- **Finding 2b:** All merge operations (if config approach) or agent only (if wrapper approach)
- **Finding 2c:** All push operations containing merge commits (universal pre-push)
- **Finding 2d:** All push operations where lockfile changed after merge (universal validate-changes)
- **Finding 3:** Zero blast radius (doc-only change)
- **Finding 4:** Agent stash operations only

## Test Landscape

### Test Infrastructure

- **Frameworks:** Jest (via `@jest/globals`)
- **Commands:** `pnpm jest scripts/__tests__/git-safety-policy.test.ts`, `pnpm jest scripts/__tests__/pre-tool-use-git-safety.test.ts`
- **CI integration:** Tests run as part of standard `pnpm test` in CI
- **Pattern:** Table-driven with `child_process.spawnSync` against real scripts

### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|------|-----------|-------|----------------|
| Git guard wrapper (L3) | Integration | `scripts/__tests__/git-safety-policy.test.ts` | 67 cases covering deny + allow; table-driven |
| PreToolUse hook (L4) | Integration | `scripts/__tests__/git-safety-policy.test.ts` + `pre-tool-use-git-safety.test.ts` | Shared table + standalone edge cases |

### Coverage Gaps (Planning Inputs)

- **No tests for pre-push-safety.sh:** The non-FF check and protected-branch check in `scripts/git-hooks/pre-push-safety.sh` have no automated tests. Testing requires a real or mock git remote.
- **No tests for validate-changes.sh lockfile behavior:** Would need tests if lockfile audit is added.
- **skipHook gaps documented:** TC-56, TC-60, TC-62, TC-EXTRA-06 all have `skipHook: true` — these are known inconsistencies between L3 and L4.

### Testability Assessment

- **Easy to test:** Findings 1, 3 (doc changes, no tests needed), Finding 4 (add deny pattern + test case to existing table)
- **Medium to test:** Findings 2a, 2b (wrapper/config changes, extend existing test table)
- **Hard to test:** Findings 2c, 2d (require realistic merge scenarios with git repos; may need fixture repo setup in test)

### Recommended Test Approach

- **Finding 2a (safety anchor):** Add test cases to `git-safety-policy.test.ts` policy table for `git merge` interception
- **Finding 2b (no-ff):** Verify config is set; no runtime test needed for config approach
- **Finding 2c (deletion anomaly):** Needs dedicated test with fixture repos. Create a test that sets up a merge with intentional and accidental deletions, runs the check, and validates detection
- **Finding 2d (lockfile audit):** Needs test with lockfile conflict fixture. Verify validate-changes.sh detects stale lockfile after merge

## Questions

### Resolved

- Q: Are all enforcement classifications accurate?
  - A: Yes for destructive-command controls, with one important nuance now corrected: row 6 is mixed coverage (full-stack for `--amend`, hook-primary for message reuse).
  - Evidence: `scripts/agent-bin/git`, `.claude/hooks/pre-tool-use-git-safety.sh`, `.claude/settings.json`, `scripts/git-hooks/prepare-commit-msg-safety.sh`

- Q: Does the "Command Policy Matrix" section exist in `docs/git-safety.md`?
  - A: No. Active enforcement files reference it, but it does not exist.
  - Evidence: Active references in `scripts/agent-bin/git`, `.claude/hooks/pre-tool-use-git-safety.sh`, `.claude/hooks/session-start.sh`, and `scripts/__tests__/git-safety-policy.test.ts`; `docs/git-safety.md` has no such heading.

- Q: Was the Jan 14 incident caused by missing safety anchors?
  - A: No. The incident timeline shows stash/reset operations, not a merge-without-anchor event.
  - Evidence: `docs/historical/RECOVERY-PLAN-2026-01-14.md` lines 23-29.

- Q: Is this wf-fact-find coupled to an existing active plan?
  - A: No. It is standalone and intended to seed a fresh plan.
  - Evidence: `Related-Plan: none` in this document header.

### Implementation Defaults (for Planning)

- Q: Should the pre-merge safety anchor be a branch or a tag?
  - Default: Branch (matches current documented convention in `docs/git-safety.md:126-127`).
  - Why: Better discoverability in common troubleshooting flows.

- Q: Should `merge.ff=false` be enforced via git config (universal) or wrapper only (agent-scoped)?
  - Default: Start wrapper-only (agent-scoped), then evaluate universal config after usage data.
  - Why: Lower blast radius for initial rollout.

## Confidence Inputs (for /wf-plan)

- **Implementation:** 82%
  - Most changes are well-understood shell script and config modifications. The deletion-anomaly heuristic (2c) is the only research-grade item.
  - What would raise to 90%: prototype the deletion-anomaly check against 5 real merge commits and measure false-positive rate.

- **Approach:** 85%
  - The layered enforcement model is proven and well-tested. Extending existing layers is lower-risk than building new ones.
  - What would raise to 90%: validate the selected defaults (anchor branch, wrapper-scoped ff enforcement) and confirm lockfile audit performance on representative packages.

- **Impact:** 88%
  - Blast radius is well-mapped. Most changes are additive extensions to existing scripts. Doc changes have zero blast radius. Hook changes have universal impact but are gated by `pnpm run prepare`.
  - What would raise to 90%: run the lockfile audit extension against 3 real lockfile-conflict scenarios and confirm < 5 second overhead.

- **Delivery-Readiness:** 80%
  - Clear ownership (hook/script maintainer), clear quality gates (existing test harness), clear deployment path (commit + `pnpm run prepare`).
  - What would raise to 90%: confirm that all test fixtures can be created without a real remote (mock git repo in tmpdir).

- **Testability:** 78%
  - Easy items (1, 3, 4) need no new test infra. Medium items (2a, 2b) extend existing table. Hard items (2c, 2d) need fixture repo setup.
  - What would raise to 90%: build a reusable fixture-repo helper for merge-scenario tests.

## Planning Constraints & Notes

- Must-follow patterns:
  - All enforcement scripts must reference `docs/git-safety.md § Command Policy Matrix` as source of truth (once the section exists).
  - Test cases must be added to the shared `POLICY_TABLE` in `git-safety-policy.test.ts` for any new deny/allow patterns.
  - Hook scripts must use the same exit-code contract: 0 = allow, non-zero = block.
- Rollout/rollback expectations:
  - Hook changes take effect after `pnpm run prepare`. Rollback = revert commit + re-run prepare.
  - Config changes (merge.ff) take effect immediately. Rollback = unset config.
  - Wrapper changes take effect in next agent session. Rollback = revert commit.
- Observability expectations:
  - All blocks must emit a clear stderr message explaining what was blocked and why.
  - Follow the existing pattern: `BLOCKED: <reason>` for hard blocks.

## Suggested Task Seeds (Non-binding)

1. **Add Command Policy Matrix section to `docs/git-safety.md`** — Finding 1. Consolidate deny/ask/allow tables from current enforcement scripts. S effort. No dependencies.
2. **Standardize enforcement language in `docs/git-safety.md`** — Finding 3. Update Protection Layers section with hard-block/ask-gate/documented-procedure terminology. S effort. Depends on #1.
3. **Add stash pop/apply to PreToolUse hook deny patterns** — Finding 4. Add patterns + test cases. S effort. No dependencies.
4. **Add `--no-ff` enforcement to agent git wrapper** — Finding 2b (wrapper approach). Intercept `git merge` without `--no-ff` flag. S effort. No dependencies.
5. **Add pre-merge safety anchor to agent git wrapper** — Finding 2a. Auto-create backup branch before merge passthrough. M effort. No dependencies.
6. **Add lockfile-regeneration audit to validate-changes.sh** — Finding 2d. Detect stale lockfile after merge conflict. M effort. No dependencies.
7. **Add post-merge deletion-anomaly check to pre-push hook** — Finding 2c. Detect files lost in merge resolution. L effort. Needs prototype/spike first.

Recommended execution order: (1, 2 in doc lane) + (3, 4, 5, 6 in implementation lane) → 7

## Execution Routing Packet

- Primary execution skill: `/wf-build`
- Supporting skills: `/wf-replan` (for Finding 2c spike if needed), `/ops-ship`
- Deliverable acceptance package:
  - All doc changes pass markdown lint
  - All script changes have corresponding automated tests: use `git-safety-policy.test.ts` for policy-pattern changes, and dedicated fixture/integration tests when policy-table tests are insufficient
  - `pnpm jest scripts/__tests__/git-safety-policy.test.ts` passes
  - `pnpm jest scripts/__tests__/pre-tool-use-git-safety.test.ts` passes
  - Pre-push hook changes tested with at least one real push cycle
- Post-delivery measurement plan:
  - Monitor for false-positive blocks in agent sessions (check session logs for unexpected BLOCKED messages)
  - Monitor pre-push hook execution time (should not add > 5 seconds)

## Planning Readiness

- Status: **Ready-for-planning**
- Blocking items: None for planning. Implementation defaults are preselected in this document.
- Recommended next step: Proceed to `/wf-plan`
