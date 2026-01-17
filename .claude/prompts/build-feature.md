# Build Feature

Use this prompt when implementing tasks from an approved plan.

## Mode: BUILDING (One Task at a Time)

### Instructions

0. **Concurrency setup**
   - Ensure you are working in your own worktree + branch (`scripts/git/new-worktree.sh <label>`)
   - Avoid editing global docs (AGENTS.md/CLAUDE.md/indexes) unless you are the designated Docs Custodian

1. **Claim a task** (if parallel work)
   - Open `docs/plans/<feature>-plan.md`
   - If no Plan doc exists yet, stop and switch to plan mode to create it first (don’t implement off a chat-only checklist)
   - Identify the top unchecked `[ ]` task
   - **Claim it** via PR title, comment, or branch name (see Concurrency Protocol § 4)
   - Skip tasks already claimed by others

2. **Study the files**
   - Read ALL files you'll modify
   - Don't assume — understand before changing

3. **Implement**
   - Make the change for THIS task only
   - Follow patterns noted in the plan
   - Keep changes minimal and focused

4. **Validate**
   ```bash
   pnpm typecheck
   pnpm lint
   pnpm --filter <pkg> test -- <affected-file.test.ts> --maxWorkers=2
   ```
   Or: `bash scripts/validate-changes.sh`

5. **Fix if needed**
   - If validation fails, fix before proceeding
   - Never commit failing code

6. **Commit**
   - Clear message: what changed and why
   - Include `Co-Authored-By` attribution

7. **Report progress**
   - **If you are the Docs Custodian:** Mark task `[x]` in the plan file
   - **Otherwise:** Add a comment to your PR: "Completed: Phase X Task Y"
   - The custodian will update checkboxes during merge

8. **Repeat**
   - Move to next unchecked (and unclaimed) task
   - One task per cycle

### Rules

| Rule | Rationale |
|------|-----------|
| ONE task per cycle | Full focus, clear commits |
| NEVER skip validation | Backpressure catches errors early |
| NEVER commit failing code | Broken code hamstrings future iterations |
| Update plan after each task | Persistent state for session recovery |

### Completion

When all tasks show `[x]`:
1. Run final validation
2. Push to remote (if network available)
3. Tell user: "All tasks complete. PR ready for review."
