---
Type: Guide
Status: Active
Domain: Repo / Agents
Last-reviewed: 2026-02-09
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
- **Plan:** `.claude/skills/plan-feature/SKILL.md` (auto-runs `/sequence-plan` at the end)
- **Sequence:** `.claude/skills/sequence-plan/SKILL.md` (also runnable standalone)
- **Build:** `.claude/skills/build-feature/SKILL.md`
- **Re-plan:** `.claude/skills/re-plan/SKILL.md` (auto-runs `/sequence-plan` at the end)

For non-code deliverables, `/build-feature` dispatches to progressive execution skills (for example: `/draft-email-message`, `/write-product-brief`, `/draft-marketing-asset`, `/create-ops-spreadsheet`, `/draft-whatsapp-message`).

## Phase Selection (Decision Tree)

- **You don't understand current behavior or blast radius yet** → Fact-find
- **You need tasks + acceptance criteria + confidence** → Plan-feature (includes sequencing)
- **You have an approved plan + an eligible task** → Build-feature
- **Task is <80% confidence, blocked, or scope changes during build** → Re-plan (includes sequencing)
- **You need to reorder an existing plan or check parallelism opportunities** → Sequence-plan (standalone)

## Confidence Index (CI)

In plan docs, **CI** means **Confidence Index** (plan confidence), not CI/CD.

- **CI ≥90:** target/motivation (aim for it when credible)
- **CI 80–89:** build-eligible, but treat remaining unknowns as real (explicit verification steps)
- **CI 60–79:** planning-only/caution; split into INVESTIGATE/DECISION or add “What would make this ≥90%”
- **CI <60:** do not build; re-plan first

**Build gate:** only **IMPLEMENT** tasks that are **≥80%** confidence and unblocked proceed to build.

## Scientific Re-Plan Rules

When running `/re-plan`, confidence increases must be evidence-led:

- Do not raise CI from narrative reasoning alone.
- Use an evidence ladder:
  - **E1:** static repo audit (small uplift only)
  - **E2:** executable verification (tests/probes/scripts)
  - **E3:** precursor spike/prototype outcome
- If uncertainty remains after audit, add explicit **precursor INVESTIGATE/SPIKE tasks** and make blocked tasks depend on them.
- Avoid promoting tasks from **<80% to ≥80%** unless key unknowns are closed with E2+ evidence.

## Quality Gates (Non-negotiable)

- Targeted tests only; never run unfiltered `pnpm test` (see `docs/testing-policy.md`).
- `pnpm typecheck && pnpm lint` is the baseline validation gate (also enforced by git hooks where available).
- Avoid destructive git commands; follow `AGENTS.md` and `docs/git-safety.md`.

## Outputs by Phase

- **Fact-find:** `docs/plans/<feature>-fact-find.md` (evidence + impact map)
- **Plan-feature:** `docs/plans/<feature>-plan.md` (atomic tasks + CI per task)
- **Build-feature:** code and/or business artifacts + plan updated per task; commits tied to TASK IDs
- **Re-plan:** plan updated with evidence/decisions/CIs (no implementation changes)

## Business OS Card Tracking (Default)

The core loop updates Business OS automatically. No extra user action is required for baseline tracking.

### Baseline Behavior

1. Set `Business-Unit` in fact-find frontmatter (or inherit from existing card).
2. Keep `Business-OS-Integration` omitted or `on` (default).
3. Use `Business-OS-Integration: off` only for intentionally standalone work.

### What is automated

- `/ideas-go-faster`: creates prioritized ideas/cards and seeds top-K fact-find stage docs.
- `/fact-find`: creates/updates card + `fact-find` stage doc.
- `/plan-feature`: creates `plan` stage doc and applies deterministic `Fact-finding -> Planned` when plan gate passes.
- `/build-feature`: applies deterministic `Planned -> In progress` at build start and `In progress -> Done` at completion gate.

### Discovery freshness

Loop write paths rebuild `docs/business-os/_meta/discovery-index.json`. If rebuild fails twice, the skill run fails with explicit `discovery-index stale` output instead of silent success.

### Compatibility

- With `Business-OS-Integration: off`, skills skip card/stage-doc/lane writes.
- Existing docs without the field default to integration on.

**Shared helpers:** `.claude/skills/_shared/card-operations.md` and `.claude/skills/_shared/stage-doc-operations.md`

## Special-Purpose Workflows

- **Business OS coordination:** `docs/business-os/agent-workflows.md` (idea management, card lifecycle, plan updates)
