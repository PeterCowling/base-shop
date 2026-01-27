---
Type: Guide
Status: Active
Domain: Repo / Agents
Last-reviewed: 2026-01-27
---

# Feature Workflow Guide (All Agents)

This is the **entrypoint** for feature work in Base-Shop. It is intentionally short: follow it to pick the right mode, then open the corresponding skill doc for full instructions.

## Start Here

1. Read `AGENTS.md` (universal rules, safety, commands).
2. Read your agent overlay:
   - Codex: `CODEX.md`
   - Claude Code: `CLAUDE.md`
3. Use the workflow below for any non-trivial change.

## The Workflow (Progressive Disclosure)

Read only the skill you need for the current phase:

- **Fact-find:** `.claude/skills/fact-find/SKILL.md`
- **Plan:** `.claude/skills/plan-feature/SKILL.md`
- **Build:** `.claude/skills/build-feature/SKILL.md`
- **Re-plan:** `.claude/skills/re-plan/SKILL.md`

## Phase Selection (Decision Tree)

- **You don’t understand current behavior or blast radius yet** → Fact-find
- **You need tasks + acceptance criteria + confidence** → Plan-feature
- **You have an approved plan + an eligible task** → Build-feature
- **Task is <80% confidence, blocked, or scope changes during build** → Re-plan

## Confidence Index (CI)

In plan docs, **CI** means **Confidence Index** (plan confidence), not CI/CD.

- **CI ≥90:** target/motivation (aim for it when credible)
- **CI 80–89:** build-eligible, but treat remaining unknowns as real (explicit verification steps)
- **CI 60–79:** planning-only/caution; split into INVESTIGATE/DECISION or add “What would make this ≥90%”
- **CI <60:** do not build; re-plan first

**Build gate:** only **IMPLEMENT** tasks that are **≥80%** confidence and unblocked proceed to build.

## Quality Gates (Non-negotiable)

- Targeted tests only; never run unfiltered `pnpm test` (see `docs/testing-policy.md`).
- `pnpm typecheck && pnpm lint` is the baseline validation gate before commits.
- Avoid destructive git commands; follow `AGENTS.md` and `docs/git-safety.md`.

## Outputs by Phase

- **Fact-find:** `docs/plans/<feature>-fact-find.md` (evidence + impact map)
- **Plan-feature:** `docs/plans/<feature>-plan.md` (atomic tasks + CI per task)
- **Build-feature:** code/tests + plan updated per task; commits tied to TASK IDs
- **Re-plan:** plan updated with evidence/decisions/CIs (no implementation changes)
