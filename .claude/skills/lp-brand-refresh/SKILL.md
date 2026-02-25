# Brand Refresh

`/lp-brand-refresh` is a standalone brand context refresh skill. It updates brand strategy and visual identity documents independently of the ASSESSMENT sequence.

Use this when brand positioning, personality, voice, or visual identity needs updating for a business that has already completed ASSESSMENT-10 and ASSESSMENT-11.

## When NOT to use this

- First-time brand creation → use `/lp-do-assessment-10` then `/lp-do-assessment-11` (assessment sequence)
- Business has not yet completed ASSESSMENT-10/11 → complete assessment first

## Operating mode

**BRAND REFRESH ONLY**

### Allowed actions

- Read existing brand artifacts and supporting docs
- Edit `<YYYY-MM-DD>-brand-profile.user.md` and/or `<YYYY-MM-DD>-brand-identity-dossier.user.md` in place
- Search repo for design/brand context

### Prohibited actions

- Creating brand artifacts from scratch (use assessment path)
- Code changes, deploys, or schema writes
- Modifying ASSESSMENT stage outputs other than brand-profiling and brand-identity

## Required inputs

- Existing `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-brand-profile.user.md` (must exist)
- Existing `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-brand-identity-dossier.user.md` (must exist)
- Operator brief: what has changed and why (provided in the invocation message)

## Outputs

- Updated `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-brand-profile.user.md`
- Updated `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-brand-identity-dossier.user.md`
- Refresh log entry appended to each updated artifact

## Downstream consumers — re-examine after refresh

These stages read brand context on every run. After `/lp-brand-refresh`, review and re-run if materially affected:

| Stage | Reads | Re-run trigger |
|---|---|---|
| `MARKET-06` Offer design | `<YYYY-MM-DD>-brand-profile.user.md` (positioning, voice) | Positioning or personality change |
| `SELL-03` Outreach and content standing | `<YYYY-MM-DD>-brand-profile.user.md` (tone, channel framing) | Voice or audience change |
| `DO` Any brand-facing build task | Both artifacts | Visual identity or copy direction change |

## Process

### Phase 1 — Read and diff

1. Read `<YYYY-MM-DD>-brand-profile.user.md` (audience, personality, voice, positioning vs competitors)
2. Read `<YYYY-MM-DD>-brand-identity-dossier.user.md` (colour palette, typography, imagery direction, token overrides)
3. Read the operator brief
4. Identify which sections are changing and why

### Phase 2 — Route

- Brand strategy changes only → update `<YYYY-MM-DD>-brand-profile.user.md` only
- Visual identity changes only → update `<YYYY-MM-DD>-brand-identity-dossier.user.md` only
- Both → update brand-profiling first, then brand-identity (strategy drives identity)

### Phase 3 — Update and persist

1. Apply changes to the target artifact(s) in place
2. Update `Last-updated` date in frontmatter
3. Append a dated entry to the `## Refresh Log` section at the bottom of each updated artifact (create the section if absent):

```
## Refresh Log

### YYYY-MM-DD
- What changed: <brief description>
- Why: <operator rationale>
- Downstream affected: <MARKET-06 | SELL-03 | DO | none>
```

### Phase 4 — Signal downstream consumers

Report to operator:
- Which artifacts were updated
- Which downstream stages (MARKET-06, SELL-03, DO) are affected
- Whether a full re-run or review-only is warranted for each

## Completion message

> Brand refresh complete. Updated: `<list of updated artifacts>`. Downstream stages to review: `<MARKET-06 | SELL-03 | DO | none>`. Re-run warranted for: `<stages where material change applies>`.
