---
Type: Fact-Check Audit
Document: docs/plans/multi-writer-git-locking-plan.md
Audit-Ref: working-tree
Repo-Root: /Users/petercowling/base-shop
Audit-Date: 2026-02-01
Auditor: Agent
Method: grep/rg + file reads (nl/sed) + git (status/show/ls-tree)
Status: Complete (focused)
---

# Fact-Check Audit: Multi-Writer Git Locking Plan

> ⚠️ This audit was performed against the working tree, which contains uncommitted changes (including untracked files referenced by the plan). Results may differ from the committed state at `82825687a351deb9fc839e2ff7d2fddee88829ad`.

## Summary

**Scope:** focused (repo-conformance for referenced files/workflows + “current workflow” statements). The majority of the document is a **forward-looking design** (leases/C2/L1/R2) and is intentionally not verified against current repo state.

| Metric | Count |
|--------|-------|
| Total claims identified | 9 |
| Total claims checked | 9 |
| Accurate | 3 |
| Partially accurate | 6 |
| Inaccurate | 0 |
| Outdated | 0 |
| Unverifiable | 0 |

**Accuracy rate:** 33% (Accurate / Total checked)

**Severity breakdown:**
- High severity issues: 2
- Medium severity issues: 1
- Low severity issues: 0

## Issues (Partially Accurate)

### FC-01: “Current workflow uses writer lock” is only true in the working tree (not in HEAD)
- **Claim IDs:** C01, C04, C05, C06, C07
- **Lines:** 20, 67–69
- **Category:** 1 / 5
- **Document says:**
  - “The current workflow relies on a single writer lock to serialize commits/pushes…” (`docs/plans/multi-writer-git-locking-plan.md:20`)
  - “Current writer lock is global: `scripts/git/writer-lock.sh`.” (`docs/plans/multi-writer-git-locking-plan.md:67`)
  - “Git hooks enforce writer lock: `scripts/git-hooks/require-writer-lock.sh` + `package.json` hooks.” (`docs/plans/multi-writer-git-locking-plan.md:68`)
  - “Current model produces “stale-but-alive” locks…” (`docs/plans/multi-writer-git-locking-plan.md:69`)
- **Actual state (committed HEAD `82825687…`):**
  - The writer-lock scripts referenced by the plan do **not** exist in HEAD, and HEAD’s `simple-git-hooks` configuration does **not** invoke `require-writer-lock.sh`.
- **Evidence:**
  - Not in HEAD: `git ls-tree -r --name-only HEAD -- scripts/git/writer-lock.sh scripts/git-hooks/require-writer-lock.sh scripts/agents/with-writer-lock.sh` → *(no output)*
  - HEAD hook wiring: `git show HEAD:package.json | nl -ba` shows `simple-git-hooks` without `require-writer-lock.sh`. (See `package.json@HEAD:153-156` in evidence log.)
  - Working tree contains untracked lock scripts + modified hook wiring: `git status --porcelain -- ...` shows:
    - `?? scripts/git/writer-lock.sh`
    - `?? scripts/git-hooks/require-writer-lock.sh`
    - `?? scripts/agents/with-writer-lock.sh`
    - `M package.json`
- **Severity:** High
- **Suggested fix:**
  - Either (a) commit the writer-lock tooling + hook wiring as the baseline the plan refers to, or (b) revise the plan wording to clarify “current workflow (in this branch/working tree)” vs “current workflow on main/HEAD”.

### FC-02: “Merge Gate” exists only in the working tree, not in HEAD
- **Claim ID:** C03
- **Line:** 42
- **Category:** 3 / 5
- **Document says:** “...push `work/**` → Auto PR → Merge Gate → merge.” (`docs/plans/multi-writer-git-locking-plan.md:42`)
- **Actual state:**
  - Auto PR is present and configured for `work/**` pushes.
  - A workflow named **Merge Gate** is referenced by `.github/workflows/auto-close-failing-prs.yml`, but `.github/workflows/merge-gate.yml` is **not present in HEAD** (it exists as an untracked working-tree file).
- **Evidence:**
  - Auto PR trigger: `.github/workflows/auto-pr.yml:3-7`
  - Auto-close expects “Merge Gate”: `.github/workflows/auto-close-failing-prs.yml:3-8`
  - Not in HEAD: `git ls-tree -r --name-only HEAD -- .github/workflows/merge-gate.yml` → *(no output)*
  - Working tree: `git status --porcelain -- .github/workflows/merge-gate.yml` → `?? .github/workflows/merge-gate.yml`
- **Severity:** High
- **Suggested fix:**
  - If Merge Gate is intended to be real/required, ensure `.github/workflows/merge-gate.yml` lands in the same change set; otherwise adjust the plan to reference the actual canonical merge check in HEAD.

### FC-03: “Stale-but-alive locks” is accurate as a concept, but depends on uncommitted tooling
- **Claim ID:** C07
- **Line:** 69
- **Category:** 5
- **Document says:** “Current model produces “stale-but-alive” locks (abandoned shells/processes).” (`docs/plans/multi-writer-git-locking-plan.md:69`)
- **Actual state:**
  - In the working tree, the lock wrapper holds the lock for the lifetime of a locked subshell; this can be “alive but abandoned” if left open.
  - In committed HEAD, the referenced writer-lock system does not exist (so this is not a property of HEAD today).
- **Evidence (working tree):**
  - Locked subshell holds lock until exit: `scripts/agents/with-writer-lock.sh:40-45`
  - Lock has no TTL semantics (PID-based only): `scripts/git/writer-lock.sh:45-56`
- **Severity:** Medium
- **Suggested fix:**
  - Clarify in the plan that “stale-but-alive” is an operational outcome of “hold lock for a shell session” (and that TTL leases are proposed to eliminate it).

## Accurate Claims Summary

**High-impact accurate claims (sample):**
- C02: Auto PR workflow triggers on `work/**` pushes — verified in `.github/workflows/auto-pr.yml:3-7`.
- C08: `scripts/git-hooks/pre-commit-check-env.sh` exists in HEAD — verified by file presence and contents.
- C09: `pre-commit-check-env.sh` is an env/secrets guard (blocks commits of local env files) — verified in `scripts/git-hooks/pre-commit-check-env.sh:4-9`.

## Evidence Log

### Files Opened
- `docs/plans/multi-writer-git-locking-plan.md` (claim extraction)
- `package.json` (working-tree hook wiring)
- `scripts/git/writer-lock.sh` (working-tree writer-lock implementation)
- `scripts/git-hooks/require-writer-lock.sh` (working-tree enforcement hook)
- `scripts/agents/with-writer-lock.sh` (working-tree lock wrapper)
- `scripts/git-hooks/pre-commit-check-env.sh` (HEAD hook used as env guard reference)
- `.github/workflows/auto-pr.yml` (Auto PR existence + branch trigger)
- `.github/workflows/auto-close-failing-prs.yml` (Merge Gate reference)

### Search Patterns Used
- `rg: "writer-lock|require-writer-lock|simple-git-hooks|pre-commit-check-env|Merge Gate"` → located the plan’s repo-claims and supporting files.

### Git Commands
- `git rev-parse HEAD` → `82825687a351deb9fc839e2ff7d2fddee88829ad`
- `git status --porcelain -- docs/plans/multi-writer-git-locking-plan.md scripts/git/writer-lock.sh scripts/git-hooks/require-writer-lock.sh scripts/agents/with-writer-lock.sh package.json` → shows plan + lock scripts untracked and `package.json` modified
- `git ls-tree -r --name-only HEAD -- scripts/git/writer-lock.sh scripts/git-hooks/require-writer-lock.sh scripts/agents/with-writer-lock.sh` → *(no output)*
- `git show HEAD:package.json | nl -ba | sed -n '140,170p'` → confirms `simple-git-hooks` in HEAD does not reference `require-writer-lock.sh`
- `git ls-tree -r --name-only HEAD -- .github/workflows/merge-gate.yml` → *(no output)*
- `git status --porcelain -- .github/workflows/merge-gate.yml` → `?? .github/workflows/merge-gate.yml`

### Package Files Checked
- `package.json` (root, working tree + HEAD via `git show`)

## Audit Metadata

- **Scope:** focused
- **Verbosity:** detailed
- **Time spent:** ~25 minutes
- **Large doc mode:** No

