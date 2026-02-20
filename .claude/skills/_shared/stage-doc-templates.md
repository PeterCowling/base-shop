# Stage Doc Templates

Full markdown templates for creating Business OS stage documents manually or via tooling.
For operational reference (stage types, schema, creation procedures), see `./stage-doc-core.md`.

## Fact-Finding Stage Doc

Created when a card enters the Fact-finding lane (typically from `/lp-do-fact-find` or `/idea-develop`).

```markdown
---
Type: Stage
Card-ID: {CARD-ID}
Stage: fact-find
Created: {DATE}
---

# Fact-Finding: {CARD-TITLE}

## Questions to Answer

### 1. {Question Category}
**Question:** {Specific question to resolve}

**Method:** {How to find the answer}

**Evidence type:** {measurement | customer-input | repo-diff | experiment | legal | assumption}

**Target date:** {When this should be resolved}

**Findings:**
_To be completed during Fact-finding phase_

---

### 2. {Next Question}
...

## Summary of Findings

**Last Updated:** {DATE}

**Key Insights:**
- {Insight 1}
- {Insight 2}

**Risks Identified:**
- {Risk 1}
- {Risk 2}

**Go/No-Go Recommendation:**
- {GO | NO-GO | NEEDS MORE INFO}
- {Rationale}

## Transition Decision

**Next Lane:** {Ready-for-planning | Needs more fact-finding | Dropped}

**Rationale:**
- {Evidence supporting transition}
```

## Planned Stage Doc

Created when `/lp-do-plan` completes with a Card-ID.

```markdown
---
Type: Stage
Card-ID: {CARD-ID}
Stage: plan
Created: {DATE}
Plan-Link: docs/plans/{feature-slug}/plan.md
Plan-Confidence: {%}
---

# Planned: {CARD-TITLE}

## Plan Reference

**Plan Document:** `docs/plans/{feature-slug}/plan.md`

**Overall Confidence:** {%}

## Task Summary

| Task ID | Description | Confidence | Status |
|---------|-------------|------------|--------|
| {ID} | {Description} | {%} | Pending |

## Key Decisions

- {Decision 1}: {Rationale}
- {Decision 2}: {Rationale}

## Build Prerequisites

- [ ] All IMPLEMENT tasks >=80% confidence
- [ ] Dependencies resolved
- [ ] Test infrastructure ready

## Transition Criteria

**To In Progress:**
- Plan approved
- At least one task ready to build
- `/lp-do-build` initiated
```

## Build Stage Doc

Created when `/lp-do-build` starts the first task.

```markdown
---
Type: Stage
Card-ID: {CARD-ID}
Stage: build
Created: {DATE}
Updated: {DATE}
Plan-Link: docs/plans/{feature-slug}/plan.md
---

# Build: {CARD-TITLE}

## Progress Tracker

**Last Updated:** {DATE}

| Task ID | Description | Status | Completed |
|---------|-------------|--------|-----------|
| {ID} | {Description} | {Pending|In Progress|Complete} | {DATE or -} |

## Build Log

### {DATE} - {Task ID}
- **Action:** {What was done}
- **Commits:** {Commit hashes}
- **Validation:** {Tests passed, etc.}
- **Notes:** {Any issues or observations}

## Blockers

_None currently_

## Transition Criteria

**To Done:**
- [ ] All tasks complete
- [ ] All tests passing
- [ ] Documentation updated
- [ ] `pnpm typecheck && pnpm lint` passing
```

## Reflect Stage Doc

Created when card moves to Reflected lane (post-mortem).

```markdown
---
Type: Stage
Card-ID: {CARD-ID}
Stage: reflect
Created: {DATE}
Plan-Link: docs/plans/{feature-slug}/plan.md
---

# Reflect: {CARD-TITLE}

## Summary

**Duration:** {Start date} to {End date}
**Effort:** {Actual vs estimated}
**Outcome:** {Success | Partial | Abandoned}

## What Went Well

- {Positive 1}
- {Positive 2}

## What Could Be Improved

- {Improvement 1}
- {Improvement 2}

## Learnings

### Process Learnings
- {Process learning 1}

### Technical Learnings
- {Technical learning 1}

## Recommendations

**For Future Similar Work:**
- {Recommendation 1}

**Skill/Doc Updates Suggested:**
- {Update suggestion 1}

## Artifacts

- Plan: `docs/plans/{feature-slug}/plan.md`
- Fact-find: `docs/plans/{feature-slug}/fact-find.md`
- Commits: {List of relevant commits}
```
