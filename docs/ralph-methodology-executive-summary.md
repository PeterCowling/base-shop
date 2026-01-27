Type: Guide
Status: Active
Domain: Repo
Last-reviewed: 2026-01-27
Created: 2026-01-17
Created-by: Claude Opus 4.5

# Ralph Methodology Executive Summary — Agent Runbook

Purpose: Provide a concise, agent-focused operating model for working in Base-Shop under the Ralph Methodology (implemented).

---

## Scope and Audience

- Audience: AI agents only.
- Scope: Current, post-Ralph operating state.
- Assumption: Agents read `AGENTS.md`, `CLAUDE.md`, and active plans before acting.

## Agent Model (Capabilities and Constraints)

- Capabilities: read code/docs, edit files, run validation, create commits/PRs.
- Constraints: no persistent memory, limited context window, literal instruction parsing.
- Implication: plans and runbooks are the system of record; keep them explicit and current.

## Operating Model (Current State)

### Session Start

1. Read `AGENTS.md` and `CLAUDE.md`.
2. Open `IMPLEMENTATION_PLAN.md` to find active plans.
3. Open the relevant `docs/plans/<feature>-plan.md`.

### Work Loop (One Task)

1. Claim the task (PR title/comment/branch name).
2. Read all affected files.
3. Implement the change for this task only.
4. Validate (typecheck, lint, targeted tests).
5. Commit.
6. Update plan status (custodian) or report via PR comment.

### Parallel Work

- Use one worktree per agent/human.
- Avoid editing custodian-owned global docs in parallel.
- Use task claiming to prevent duplicate work.

### Deployment Verification

- Post-deploy health checks are mandatory for reliability.
- Do not assume deploy success without verification.

---

## Ralph Methodology (Canonical Principles)

1. Study before edit.
2. Plan is the persistent state.
3. One task per iteration.
4. Validate before commit.
5. Validate after deploy.
6. Thin entrypoints, canonical deep docs.
7. Concurrency by isolation.
8. Never take shortcuts on systemic issues.
9. Explicit over implicit.

## Key Improvements (Implemented)

### 1) Reduced Instruction Size

| Document | Before | After | Reduction |
|----------|--------|-------|-----------|
| AGENTS.md | 766 lines | 114 lines | 85% smaller |
| CLAUDE.md | 771 lines | 159 lines | 79% smaller |
| **Total** | 1,537 lines | 273 lines | **82% smaller** |

Benefit: faster orientation and less context thrash.

### 2) Explicit Workflow Modes

- Planning mode: read and write a plan only.
- Building mode: implement approved plan tasks, one per iteration.
- Skills: `.claude/skills/plan-feature/SKILL.md` and `.claude/skills/build-feature/SKILL.md`.

### 3) Ownership and Task Claiming

- Preferred: draft PR titled with the task.
- Alternate: plan PR comment or branch naming.
- Docs Custodian controls high-conflict global docs.

### 4) Automated Validation Script

- `scripts/validate-changes.sh` enforces validation + targeted tests.
- Supports strict mode; checks for orphaned test processes.

### 5) Post-Deploy Health Checks

- `scripts/post-deploy-health-check.sh` verifies deployed availability.
- Integrated into CI/CD to close the deploy-verify loop.

---

## Runbooks (Common Scenarios)

### Start a New Session

- Read `AGENTS.md` and `CLAUDE.md`.
- Open `IMPLEMENTATION_PLAN.md`.
- Open the relevant plan in `docs/plans/`.
- Choose mode: planning or building.

### Parallel Work

- Create a dedicated worktree: `scripts/git/new-worktree.sh <label>`.
- Claim the task before editing.
- Avoid custodian-owned files unless you are the custodian.

### Catch Bugs Before Commit

- Run `bash scripts/validate-changes.sh`.
- Fix failures immediately; do not commit failing code.

### Deploy Verification

- Ensure health check runs post-deploy.
- Treat failed checks as a failed deploy.

---

## Risk Mitigation (Historical Incidents)

| Incident | Failure Mode | Ralph Mitigation |
|----------|--------------|------------------|
| 2026-01-14 Git reset disaster | Destructive commands used to recover | Destructive commands prohibited; ask for help |
| 2026-01-16 System slowdown | Orphaned test processes | Validation checks for orphans |
| Parallel work conflicts | Multiple agents edited same files | Task claiming + custodian ownership |

---

## Invariants (What Stays the Same)

- Git worktrees for parallel work.
- Plan documents in `docs/plans/` as task state.
- TypeScript, ESLint, Jest remain primary validation tools.
- Cloudflare Pages deployment pipeline remains.
- Branching model (`work/*` branches, PRs to `main`).
- Commit conventions with co-author attribution.

---

## Implementation Phases (Summary)

| Phase | Scope | Risk |
|------|-------|------|
| Phase 0 | Concurrency + custodian | None |
| Phase 1 | New files (policy, scripts, prompts) | Low |
| Phase 2 | Slim AGENTS.md | Medium |
| Phase 3 | Slim CLAUDE.md | Medium |
| Phase 4 | Reframe IMPLEMENTATION_PLAN.md | Low |
| Phase 5 | Reconcile docs | Low |
| Phase 6 | Update indexes | Low |
| Phase 7 | Validate workflows | None |

Rollback: restore from archive; new files are additive.

---

## Success Criteria

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| AGENTS.md size | 766 lines | <=120 lines | `wc -l AGENTS.md` |
| CLAUDE.md size | 762 lines | <=200 lines | `wc -l CLAUDE.md` |
| Context load (words) | ~3,000 | <=1,200 | Combined word count |
| Validation consistency | Manual | 100% automated | `validate-changes.sh` usage |
| Deploy verification | 0% | 100% | Health check in CI |
| Duplicate work incidents | Unknown | 0 | Task claiming in use |

---

## Decision Guide (Common Questions)

- Training required? No. Agents already read the instruction files; updates are documentation-only.
- Can agents work without new scripts? Yes, but validation scripts are expected for consistency.
- What if rules are ignored? Git hooks + CODEOWNERS + CI enforce compliance.
- Mixed agent providers? Use the same `AGENTS.md`; Codex also reads `CODEX.md`.
- Timeline? Phases can be executed independently and incrementally.

---

## Summary

- Use plans as persistent state.
- Enforce one-task iterations with validation gates.
- Isolate parallel work with worktrees and task claiming.
- Verify deployments; do not assume success.

For implementation details, see `docs/plans/ralph-methodology-adoption-plan.md`.
