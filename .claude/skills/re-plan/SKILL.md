---
name: re-plan
description: Re-plan tasks with insufficient confidence. Loops back through fact-finding for specific tasks, resolves uncertainties, and updates the plan with improved confidence scores.
---

# Re-Plan

Address tasks where confidence is too low to build. Investigates further, resolves uncertainties, and updates the plan.

## When to Use

- A task in the plan has confidence below 80%
- Confidence dropped during building (unexpected complexity discovered)
- New information invalidated assumptions in the plan
- Build was stopped due to uncertainty

## Workflow

### 1. Identify the Gap

For each low-confidence task, determine which dimension is weak:

| Dimension | Symptom | Resolution approach |
|-----------|---------|-------------------|
| **Implementation** (<80%) | Don't know HOW to write it | Read more code, find similar patterns, check external docs |
| **Approach** (<80%) | Not sure this is the RIGHT way | Compare alternatives, assess long-term implications, check for precedent |
| **Impact** (<80%) | Not sure what else this TOUCHES | Trace dependencies, check imports/exports, review test coverage |

### 2. Targeted Fact-Finding

For each weak dimension, investigate specifically:

**Implementation gaps:**
- Find similar code in the repo that solves an analogous problem
- Read library/framework docs for the specific API you need
- Check if there's a test that demonstrates the expected behavior

**Approach gaps:**
- List the viable alternatives (minimum 2)
- For each: what are the long-term implications?
- Select based on: maintainability, consistency with existing patterns, minimal coupling
- Document WHY the chosen approach is best (not just WHAT it is)

**Impact gaps:**
- Run dependency traces: what imports/uses the code you'll change?
- Check test coverage: are the affected paths tested?
- Look for integration points: does this cross package boundaries?

### 3. Resolve Open Questions

For each question that's blocking confidence:

1. **Investigate the repo** — read code, check tests, trace flows
2. **Search externally** — if it's a knowledge gap about a tool or pattern
3. **Select the best long-term solution** — based on evidence, not convenience
4. **Document the decision** — include rationale and evidence

**Only ask the user when:**
- Two approaches are genuinely equivalent and it's a preference decision
- The question involves business logic you can't determine from code
- You've investigated thoroughly and still can't determine the right answer

### 4. Update the Plan

For each re-planned task, update the plan doc:

```markdown
### TASK-02: <description> (RE-PLANNED)
- **Affects:** `path/to/file.ts`
- **Previous confidence:** 55% ⚠️
- **Updated confidence:** 88% ✓
  - Implementation: 90% — found pattern in `similar-file.ts:42`
  - Approach: 85% — Option B selected (rationale: lower coupling, consistent with X)
  - Impact: 88% — traced all 3 consumers, tests exist for each
- **Resolution:**
  - Investigated: <what you looked at>
  - Decision: <what you chose and why>
  - Evidence: <file paths, docs, patterns that support this>
- **Acceptance:** <what "done" looks like>
```

### 5. Re-Assess Related Tasks

After resolving one task's uncertainties, check:
- Did this new information affect other tasks' confidence?
- Are there new dependencies or ordering changes?
- Should any tasks be split or merged?

### 6. Decision Point

| Updated confidence | Action |
|-------------------|--------|
| All tasks ≥80% | Return to `/build-feature` |
| Still below 80% after investigation | Ask the user — you've hit a genuine uncertainty |
| Investigation revealed the plan is wrong | Rewrite affected tasks, re-assess |

## Quality Checks

- [ ] Each weak dimension was specifically investigated (not just re-guessed)
- [ ] Decisions include rationale and evidence, not just conclusions
- [ ] Related tasks were re-assessed for knock-on effects
- [ ] Plan doc is updated with new confidence scores
- [ ] Only asked the user for things that couldn't be self-resolved

## Common Pitfalls

- Don't just bump confidence numbers without doing actual investigation
- Don't ask the user questions you could answer by reading the code
- Don't ignore impact analysis — it's usually the hardest to get right
- Don't re-plan the entire plan when only specific tasks are low-confidence
- Do focus investigation on the specific weak dimension
- Do document evidence so future sessions don't re-investigate
