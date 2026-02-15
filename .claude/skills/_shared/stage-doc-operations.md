# Stage Doc Operations Helper

Shared helper for creating and managing Business OS stage documents. Stage docs track the evidence and progress at each phase of a card's lifecycle.

## Stage Types

| Stage | Canonical API Key | File Name | When Created | Purpose |
|-------|-------------------|-----------|--------------|---------|
| Fact-finding | `fact-find` | `fact-find.user.md` | Card enters Fact-finding lane | Track evidence gathering questions and findings |
| Planned | `plan` | `plan.user.md` | `/lp-plan` completes with Card-ID | Link to plan doc, track confidence |
| Build | `build` | `build.user.md` | `/lp-build` starts first task | Track task completion progress |
| Reflect | `reflect` | `reflect.user.md` | Card enters Reflected lane | Post-mortem and learnings |

**Note:** When calling stage-doc endpoints, always use the **stage-doc type** (`fact-find|plan|build|reflect`), never a skill slug (e.g. `lp-fact-find`). Legacy aliases may be accepted during a compatibility window but must not be emitted by skills.

## File Location

Stage docs are stored in the card's directory:

```
docs/business-os/cards/<CARD-ID>/
├── fact-find.user.md       (Fact-finding stage, canonical)
├── plan.user.md            (Planned stage, canonical)
├── build.user.md           (Build stage)
└── reflect.user.md         (Reflect stage)
```

**Note:** Canonical stage docs use the `.user.md` suffix. Some tooling may also maintain an optional `.agent.md` companion, but the agent API contract treats `.user.md` as canonical.

## Frontmatter Schema

```yaml
---
Type: Stage
Card-ID: <CARD-ID>           # e.g., BRIK-ENG-0021
Stage: <STAGE>               # fact-find | plan | build | reflect
Created: YYYY-MM-DD          # Creation date
# Optional fields
Updated: YYYY-MM-DD          # Last update date
---
```

## Stage Templates

### Fact-Finding Stage Doc

Created when a card enters the Fact-finding lane (typically from `/lp-fact-find` or `/idea-develop`).

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

### Planned Stage Doc

Created when `/lp-plan` completes with a Card-ID.

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
- `/lp-build` initiated
```

### Build Stage Doc

Created when `/lp-build` starts the first task.

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

### Reflect Stage Doc

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

## Step-by-Step Stage Doc Creation

### 1. Ensure Card Directory Exists

```bash
mkdir -p docs/business-os/cards/{CARD-ID}
```

### 2. Create Stage Doc

Create the appropriate stage doc file based on the stage type:

| Stage | File to Create |
|-------|----------------|
| Fact-finding | `docs/business-os/cards/{CARD-ID}/fact-find.user.md` |
| Planned | `docs/business-os/cards/{CARD-ID}/plan.user.md` |
| Build | `docs/business-os/cards/{CARD-ID}/build.user.md` |
| Reflect | `docs/business-os/cards/{CARD-ID}/reflect.user.md` |

### 3. Validate

```bash
pnpm docs:lint
```

## Evidence Types

Stage docs reference evidence types for tracking what kind of data supports findings:

| Type | Description | Examples |
|------|-------------|----------|
| `measurement` | Quantitative data | Metrics, benchmarks, performance numbers |
| `customer-input` | Feedback from users | Surveys, interviews, support tickets |
| `repo-diff` | Code analysis | File changes, API contracts, dependencies |
| `experiment` | Testing outcomes | A/B tests, prototypes, spikes |
| `financial-model` | Business analysis | ROI calculations, cost estimates |
| `vendor-quote` | External pricing | Service quotes, license costs |
| `legal` | Compliance review | GDPR, ToS, legal opinions |
| `assumption` | Unverified belief | Must be validated before build |

## Idempotency

Before creating a stage doc, check if one already exists:

```bash
if [ -f "docs/business-os/cards/${CARD_ID}/fact-find.user.md" ]; then
  echo "Stage doc already exists"
  # Update instead of create, or skip
fi
```

## Integration with Skills

### From /lp-fact-find

When `/lp-fact-find` completes with `Business-Unit`:
1. Create card (see card-operations.md)
2. Create `fact-find` stage doc with initial questions from the lp-fact-find brief
3. Card starts in `Fact-finding` lane

### From /lp-plan

When `/lp-plan` completes with `Card-ID`:
1. Create `plan` stage doc with plan link and confidence
2. Update card frontmatter with `Plan-Link` and `Plan-Confidence`
3. Suggest lane transition to `Planned`

### From /lp-build

When `/lp-build` starts first task with `Card-ID`:
1. Create build stage doc with task list from plan
2. Update stage doc after each task completion
3. Suggest lane transition to `Done` when all tasks complete

### From /meta-reflect

When reflecting on completed work with `Card-ID`:
1. Create reflect stage doc with post-mortem
2. Capture learnings and recommendations
3. Suggest lane transition to `Reflected`

## Lane Transitions Triggered by Stage Docs

| Stage Doc Created | Suggests Lane Transition |
|-------------------|--------------------------|
| fact-find.user.md | Inbox -> Fact-finding |
| plan.user.md | Fact-finding -> Planned |
| build.user.md | Planned -> In progress |
| reflect.user.md | Done -> Reflected |

Use `/idea-advance` to formally propose transitions.

## Related Resources

- Card operations: `.claude/skills/_shared/card-operations.md`
- Lane transitions: `.claude/skills/idea-advance/SKILL.md`
- Stage types reference: `apps/business-os/src/lib/types.ts` (StageType enum)
- Example stage doc: `docs/business-os/cards/BRIK-ENG-0020/fact-find.user.md`
