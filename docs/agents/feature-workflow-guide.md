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

- **Fact-find:** `.claude/skills/lp-do-fact-find/SKILL.md`
- **Plan:** `.claude/skills/lp-do-plan/SKILL.md` (auto-runs `/lp-sequence` at the end)
- **Sequence:** `.claude/skills/lp-sequence/SKILL.md` (also runnable standalone)
- **Build:** `.claude/skills/lp-do-build/SKILL.md`
- **Re-plan:** `.claude/skills/lp-do-replan/SKILL.md` (auto-runs `/lp-sequence` at the end)

For non-code deliverables, `/lp-do-build` dispatches to progressive execution skills (for example: `/draft-email`, `/biz-product-brief`, `/draft-marketing`, `/biz-spreadsheet`, `/draft-whatsapp`).

## Phase Selection (Decision Tree)

- **You don't understand current behavior or blast radius yet** → Fact-find
- **You need tasks + acceptance criteria + confidence** → Plan-feature (includes sequencing)
- **You have an approved plan + an eligible task** → Build-feature
- **Task is below its execution threshold (`IMPLEMENT/SPIKE <80`, `INVESTIGATE <60`), blocked, or scope changes during build** → Re-plan (includes sequencing)
- **You need to reorder an existing plan or check parallelism opportunities** → Sequence-plan (standalone)

## Plan Confidence

In plan docs, use **confidence** / **Overall-confidence** terminology for planning confidence.

- **Confidence ≥90:** target/motivation (aim for it when credible)
- **Confidence 80–89:** implementation/spike build-eligible when unblocked
- **Confidence 60–79:** caution; often planning-only unless task type is INVESTIGATE
- **Confidence <60:** do not build; lp-do-replan first

**Build gates:**
- **IMPLEMENT** and **SPIKE** tasks require **≥80%** confidence and unblocked dependencies.
- **INVESTIGATE** tasks require **≥60%** confidence and unblocked dependencies.
- **CHECKPOINT** is procedural and handled by `/lp-do-build` checkpoint flow.

## Scientific Re-Plan Rules

When running `/lp-do-replan`, confidence increases must be evidence-led:

- Do not raise confidence from narrative reasoning alone.
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

- **Fact-find:** `docs/plans/<feature>/fact-find.md` (evidence + impact map)
- **Plan-feature:** `docs/plans/<feature>/plan.md` (atomic tasks + per-task confidence)
- **Build-feature:** code and/or business artifacts + plan updated per task; commits tied to TASK IDs
- **Re-plan:** plan updated with evidence/decisions/confidence (no implementation changes)

## Business OS Card Tracking (Default)

The core loop updates Business OS automatically. No extra user action is required for baseline tracking.

### Baseline Behavior

1. Set `Business-Unit` in lp-do-fact-find frontmatter (or inherit from existing card).
2. Keep `Business-OS-Integration` omitted or `on` (default).
3. Use `Business-OS-Integration: off` only for intentionally standalone work.

### What is automated

- `/idea-generate`: creates prioritized ideas/cards and seeds top-K lp-do-fact-find stage docs.
- `/lp-do-fact-find`: creates/updates card + `lp-do-fact-find` stage doc.
- `/lp-do-plan`: creates `plan` stage doc and applies deterministic `Fact-finding -> Planned` when plan gate passes.
- `/lp-do-build`: applies deterministic `Planned -> In progress` at build start and `In progress -> Done` at completion gate.

### Discovery freshness

Loop write paths rebuild `docs/business-os/_meta/discovery-index.json`. If rebuild fails twice, the skill run fails with explicit `discovery-index stale` output instead of silent success.

### Compatibility

- With `Business-OS-Integration: off`, skills skip card/stage-doc/lane writes.
- Existing docs without the field default to integration on.

**Shared helpers:** `.claude/skills/_shared/card-operations.md` and `.claude/skills/_shared/stage-doc-operations.md`

## Special-Purpose Workflows

- **Business OS coordination:** `docs/business-os/agent-workflows.md` (idea management, card lifecycle, plan updates)
- **Pre-intake problem-first entry:** Use when beginning a startup from a customer problem rather than a committed product. Add `--start-point problem` to `/startup-loop start`. This routes through ASSESSMENT-01 to ASSESSMENT-04 before ASSESSMENT-09 intake:
  - ASSESSMENT-01 Problem framing → `/lp-do-assessment-01-problem-statement` → `docs/business-os/strategy/<BIZ>/problem-statement.user.md`
  - ASSESSMENT-02 Solution-space scan → `/lp-do-assessment-02-solution-profiling` → deep research prompt + operator-filled results artifact
  - ASSESSMENT-03 Solution selection → `/lp-do-assessment-03-solution-selection` → decision record with shortlist and elimination rationale; explicit kill gate if no viable option
  - ASSESSMENT-04 Candidate names → `/lp-do-assessment-04-candidate-names` → naming pipeline (spec, generate 250 candidates, RDAP check, rank shortlist → `<YYYY-MM-DD>-candidate-names.user.md`)
  - ASSESSMENT-05 Name selection → `/lp-do-assessment-05-name-selection` → naming generation spec (Part 1 of the pipeline, invoked by ASSESSMENT-04)
  - Default (`--start-point product` or flag absent) bypasses ASSESSMENT-01 to ASSESSMENT-04 entirely — no behavior change for existing operators.
  - See gate routing: `.claude/skills/startup-loop/modules/cmd-start.md` Gate D
