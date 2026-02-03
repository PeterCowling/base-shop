# Template Governance

This document defines the rules for maintaining `packages/mcp-server/data/email-templates.json`.

## Lint Rules

The template linter (`pnpm --filter @acme/mcp-server lint:templates`) enforces:

1. **Links must resolve**
   - All `http(s)` links are checked with a HEAD request (fallback to GET).
   - Failing links block CI.

2. **No unfilled placeholders**
   - Any `{placeholder}` tokens are invalid.
   - Replace placeholders with real values or remove them.

3. **Policy consistency**
   - Templates in the `policies` category must reference at least one keyword from the
     current `brikette://policies` resource.

## Updating Templates

1. Edit `packages/mcp-server/data/email-templates.json`.
2. Run the linter:
   ```bash
   pnpm --filter @acme/mcp-server lint:templates
   ```
3. If the linter fails:
   - Fix broken links.
   - Remove placeholders.
   - Ensure policy templates reference policy keywords.

## CI Integration

The linter runs in the main CI workflow under the "Lint" job.
