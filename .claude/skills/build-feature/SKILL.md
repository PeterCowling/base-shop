---
name: build-feature
description: Implement tasks from an approved plan, one at a time. Only builds tasks with 80%+ confidence. If confidence drops during implementation, stops and triggers re-planning.
---

# Build Feature

Implement tasks from an approved plan. Confidence-gated — only proceed when understanding is sufficient.

## Prerequisites

- A plan exists at `docs/plans/<feature>-plan.md`
- Tasks to build have confidence ≥80%
- If any task is below 80%, run `/re-plan` first

## Mode: BUILDING (One Task at a Time)

### Pre-Build Check

Before starting, verify:
1. The plan exists and has confidence scores
2. The task you're about to build is ≥80% confidence
3. No unresolved blockers on this task

**If confidence is below 80%: STOP.** Do not attempt to build. Run `/re-plan` instead.

### Instructions

1. **Select the next eligible task**
   - Must be ≥80% confidence
   - Must have all prerequisite tasks completed
   - Skip tasks below threshold (they need re-planning)

2. **Study the files**
   - Read ALL files you'll modify
   - Verify your understanding matches the plan's confidence assessment
   - If you discover something unexpected: **re-assess confidence**

3. **Confidence re-check during implementation**

   If at any point you realize:
   - The code is more complex than anticipated → confidence drops
   - There are hidden dependencies the plan didn't account for → confidence drops
   - The approach might not be the best long-term solution → confidence drops

   **Updated confidence below 80%?** → STOP building. Enter `/re-plan` for this task.

4. **Implement**
   - Make the change for THIS task only
   - Follow patterns noted in the plan
   - Keep changes minimal and focused

5. **Validate**
   ```bash
   pnpm typecheck
   pnpm lint
   pnpm --filter <pkg> test -- <affected-file.test.ts> --maxWorkers=2
   ```

6. **Fix if needed**
   - If validation fails, fix before proceeding
   - Never commit failing code

7. **Commit**
   - Clear message: what changed and why
   - Include `Co-Authored-By` attribution

8. **Update the plan**
   - Mark task complete
   - Note any confidence changes for remaining tasks
   - If this task revealed new information, update other tasks' confidence scores

9. **Repeat**
   - Move to next eligible task (≥80% confidence, prerequisites met)

### Stopping Conditions

| Condition | Action |
|-----------|--------|
| Task confidence drops below 80% mid-build | Stop. Run `/re-plan` for this task |
| Unexpected dependency discovered | Stop. Update plan, re-assess affected tasks |
| Validation fails and fix is non-obvious | Stop. Re-assess confidence, consider re-planning |
| All eligible tasks complete | Report status to user |
| Genuinely uncertain about the right approach | Ask the user |

### Rules

| Rule | Rationale |
|------|-----------|
| ONE task per cycle | Full focus, clear commits |
| NEVER build below 80% confidence | Low confidence = likely rework |
| NEVER skip validation | Catches errors early |
| NEVER commit failing code | Broken code compounds problems |
| Update confidence after each task | New info affects remaining tasks |
| Ask user when genuinely stuck | Don't guess on important decisions |

### Completion

When all eligible tasks are done:

- **All tasks complete**: "All tasks complete. PR ready for review."
- **Some tasks remain below threshold**: "Completed N/M tasks. Tasks X, Y need re-planning (confidence: 55%, 62%). Run `/re-plan` to address."
