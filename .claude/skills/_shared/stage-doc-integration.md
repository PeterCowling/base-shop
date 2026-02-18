# Stage Doc Integration Notes

How skills interact with stage documents and which lane transitions they trigger.
For the operational reference (stage types, schema, creation procedures), see `./stage-doc-core.md`.

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
