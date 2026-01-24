---
name: plan-feature
description: Create detailed implementation plans with confidence intervals. Use after fact-finding to produce a plan where each task has a confidence percentage covering implementation correctness, approach quality, and impact safety.
---

# Plan Feature

Create an implementation plan with per-task confidence assessments. Only tasks with sufficient confidence should proceed to build.

## Prerequisites

- A fact-find brief exists (from `/fact-find`) OR the feature is well-understood
- Open questions from fact-finding have been resolved

## Mode: PLANNING (No Implementation)

### Instructions

1. **Review the fact-find brief** (if available)
   - Incorporate findings into the plan
   - Use resolved questions as constraints
   - Use confidence inputs to calibrate task-level confidence

2. **Study the codebase** (if not already done in fact-find)
   - Read existing code in the affected areas
   - Check `docs/plans/` for related work
   - If a relevant Plan doc already exists, update it instead of creating a duplicate

3. **Break into atomic tasks**
   - One file or one logical unit per task
   - Order by dependencies (prerequisites first)
   - Include acceptance criteria per task

4. **Assess confidence per task**

   For each task, provide a **confidence percentage (0-100%)** based on three dimensions:

   | Dimension | Question |
   |-----------|----------|
   | **Implementation** | Do we know exactly how to write correct code for this? |
   | **Approach** | Is this the best long-term solution, not just the quickest? |
   | **Impact** | Do we fully understand what this change touches and won't break? |

   The overall confidence is the **minimum** of the three dimensions.

   **Thresholds:**
   - **80%+** → Ready to build
   - **60-79%** → Proceed with caution; flag risks explicitly
   - **Below 60%** → Do NOT build. Trigger `/re-plan` for this task.

5. **Resolve open questions yourself**

   When a task has low confidence:
   - Investigate the repo further (read more code, check tests, trace dependencies)
   - Search externally if it's a knowledge gap about a library or pattern
   - Select the best long-term solution based on evidence
   - Only ask the user when you genuinely cannot determine the right answer

6. **Persist the plan**

   Create/update `docs/plans/<feature>-plan.md` with this structure:

### Plan Template

```markdown
---
Type: Plan
Status: Active
Domain: <CMS | Platform | UI | etc.>
Created: YYYY-MM-DD
Last-updated: YYYY-MM-DD
Overall-confidence: <weighted average %>
---

# <Feature Name> Plan

## Summary
<What we're building and why>

## Fact-Find Reference
<Link to brief or inline summary of key findings>

## Tasks

### TASK-01: <description>
- **Affects:** `path/to/file.ts`
- **Confidence:** 92%
  - Implementation: 95% — clear pattern exists in similar code
  - Approach: 90% — follows established conventions
  - Impact: 90% — only affects this module, tests exist
- **Acceptance:** <what "done" looks like>

### TASK-02: <description>
- **Affects:** `path/to/file.ts`
- **Confidence:** 55% ⚠️ BELOW THRESHOLD
  - Implementation: 70% — unclear how X interacts with Y
  - Approach: 50% — two viable options, unsure which is better long-term
  - Impact: 45% — may affect Z but haven't verified
- **Blockers:** Need to resolve approach question before building
- **Acceptance:** <what "done" looks like>

## Patterns to Follow
- <Reference existing similar code>

## Risks & Mitigations
- <Risk>: <Mitigation>

## Acceptance Criteria (overall)
- [ ] Criterion 1
- [ ] Criterion 2
```

### Output

- Plan file created/updated in `docs/plans/`
- NO code changes
- NO commits (except the plan file itself)

### Decision Points

| Situation | Action |
|-----------|--------|
| All tasks ≥80% confidence | Proceed to `/build-feature` |
| Some tasks 60-79% | Build high-confidence tasks first, then re-assess |
| Any task <60% | Run `/re-plan` on those tasks before building |
| Genuine uncertainty about approach | Ask the user |

### Completion

Tell user the plan status:
- "Plan ready. All tasks at 80%+ confidence. Proceed to build?"
- "Plan ready. Tasks X, Y are below threshold (55%, 62%). Recommend re-planning those before building."
