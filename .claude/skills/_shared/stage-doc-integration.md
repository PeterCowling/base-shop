# Stage Doc Integration Notes

How skills interact with stage documents and which lane transitions they trigger.
For the operational reference (stage types, schema, creation procedures), see `./stage-doc-core.md`.

## Integration with Skills

### From /meta-reflect

When reflecting on completed work with `Card-ID`:
1. Create reflect stage doc with post-mortem
2. Capture learnings and recommendations
3. Suggest lane transition to `Reflected`

## Lane Transitions Triggered by Stage Docs

| Stage Doc Created | Suggests Lane Transition |
|-------------------|--------------------------|
| reflect.user.md | Done -> Reflected |

Use `/lp-do-ideas` or the operator flow to formally propose transitions.

## Related Resources

- Card operations: `.claude/skills/_shared/card-operations.md`
- Dispatch routing: `.claude/skills/lp-do-ideas/SKILL.md`
- Stage types reference: `apps/business-os/src/lib/types.ts` (StageType enum)
- Example stage doc: `docs/business-os/cards/BRIK-ENG-0020/fact-find.user.md`
