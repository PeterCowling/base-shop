# cmd-submit — `/startup-loop submit`

## Inputs

- `--business <BIZ>` required
- `--stage <S#>` required
- `--artifact <path>` required

## Steps

1. Verify artifact exists at provided path.
2. Verify artifact satisfies expected stage output contract:
   - Check artifact filename matches expected stage artifact pattern.
   - Check artifact has required frontmatter fields (Status, business unit, etc.).
   - Check artifact content covers required stage output sections.
3. If artifact is a `*.user.md` doc, render HTML companion:
   ```bash
   pnpm docs:render-user-html -- <artifact>
   ```
4. Return run packet:
   - Usually `awaiting-input` until BOS sync actions are done.
   - Or `ready` if artifact is valid and BOS sync not required for this stage.

## Validation Rules

- Artifact path must be relative to repo root or an absolute path within the repo.
- Artifact must be the canonical output for the declared `--stage`, not a draft or intermediate file.
- If artifact fails validation: return `status: blocked` with exact failing check and required correction.
- Do NOT advance the stage on submit — submit only validates and renders. Use `advance` to progress.
