# Plan Feature

Use this prompt when starting a new feature or multi-file change.

## Mode: PLANNING (No Implementation)

### Instructions

0. **Concurrency setup**
   - Ensure you are working in your own worktree + branch (`scripts/git/new-worktree.sh <label>`)
   - If another agent is actively editing the same plan/doc file, coordinate before proceeding

1. **Study the requirements**
   - Read specs, issues, or user request carefully
   - Clarify ambiguities before proceeding

2. **Study the codebase**
   - Use "study" — understand patterns, don't assume something isn't implemented
   - Check `docs/plans/` (and any domain plan dirs like `docs/cms-plan/`) for related work
   - If a relevant Plan doc already exists, update it instead of creating a duplicate
   - Read existing code in the affected areas

3. **Gap analysis**
   - What exists vs what's needed?
   - What patterns should we follow?
   - What are the dependencies?

4. **Create the plan**
   - Create/update a Plan doc (`docs/plans/<feature>-plan.md` by default; use a domain plan directory if one exists)
   - Use the standard metadata header
   - Break into atomic tasks (one file/function per task)
   - Order by dependencies (prerequisites first)
   - Include acceptance criteria
   - If the plan is derived from an audit, include a short "Findings / Gaps" section (or link the audit doc)

### Handling Audit Limits

When audit/exploration work hits a limit (context window, time, scope), **do not simply stop**. Instead:

1. **Pause and document** — Write a `## Pending Audit Work` section in the plan
2. **Be specific** — Include enough detail that resuming is faster than starting fresh:
   - What areas/files were already examined
   - What areas remain unexplored
   - Specific questions that need answering
   - Search patterns or entry points for resumption
3. **Mark partial findings** — Tag incomplete items with `(partial)` or `(needs-verification)`
4. **Estimate remaining scope** — e.g., "~15 more files in `packages/ui/`" or "3 remaining subsystems"

**Example `Pending Audit Work` section:**

```markdown
## Pending Audit Work

**Completed:**
- Reviewed all files in `packages/platform-core/src/cart/`
- Mapped cart → pricing → inventory flow

**Remaining:**
- [ ] `packages/platform-core/src/orders/` — not yet examined
- [ ] Verify `calculateShipping()` handles edge cases (file: `shipping.ts:45-120`)
- [ ] Check integration between `OrderService` and external payment adapters

**Resumption hints:**
- Start with `grep -r "OrderService" packages/` to find all consumers
- Key file: `packages/platform-core/src/orders/index.ts` — exports map
- Open question: Does `refund()` handle partial refunds? (see `returns.ts`)
```

This ensures future sessions can pick up efficiently rather than re-auditing completed areas.

### Plan Template

```markdown
---
Type: Plan
Status: Active
Domain: <CMS | Platform | UI | etc.>
Last-reviewed: YYYY-MM-DD
Relates-to charter: <path to charter, or "none">
Created: YYYY-MM-DD
Created-by: Claude <model> | Codex | <Human name>
Last-updated: YYYY-MM-DD
Last-updated-by: <same format>
---

# <Feature Name> Plan

## Summary
<What we're building and why>

## Active tasks

- **FEAT-01**: <description> (affects: file.ts)
- **FEAT-02**: <description> (affects: other.ts)
- **FEAT-03**: <description> (affects: test.ts)

## Patterns to Follow
- <Reference existing similar code>

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Notes
- <Dependencies, risks, open questions>

## Pending Audit Work (if applicable)
<!-- Include this section when audit/exploration hit limits -->

**Completed:**
- <Areas/files already examined>

**Remaining:**
- [ ] <Area not yet examined>
- [ ] <Specific verification needed> (file: `path:lines`)

**Resumption hints:**
- <Search patterns, key files, entry points>
- <Open questions to investigate>
```

### Output

- Plan file created/updated in `docs/plans/`
- NO code changes
- NO commits (except the plan file itself)

### Completion

Tell user: "Plan ready at `docs/plans/<name>-plan.md`. Review and approve, then switch to build mode."
