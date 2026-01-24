Type: Guide
Status: Draft
Domain: DevEx/Tooling
Last-reviewed: 2026-01-24

# Type Check SOP (MCP, no `pnpm typecheck`)

Use this when asked to “check types” or “check TypeScript errors” without running `pnpm typecheck`.

## Preconditions

- VS Code MCP server is running (see `.vscode/.mcp-port`).
- Agents are connected to the MCP endpoint (see `docs/ide/agent-language-intelligence-guide.md`).

Optional: `scripts/mcp/healthcheck-ts-language.sh`

## Required approach

Use the MCP TypeScript language tools first:

- `vscodeDiagnostics` for file-scoped errors/warnings
- `vscodeHover` / `vscodeTypeDefinition` for symbol types
- `vscodeDefinition` / `vscodeReferences` for navigation context

`pnpm typecheck && pnpm lint` remains the final validation gate before commits.

## Prompt template (copy/paste)

```
Check types without running pnpm typecheck. Use the MCP TypeScript tools.

1) Call vscodeDiagnostics on:
- <path/to/file.ts>
- <path/to/file.tsx>

2) If I ask about a symbol’s type, call vscodeHover or vscodeTypeDefinition at the given line/character.

Return only TS errors/warnings. If the file is open, use dirty buffer state.
```

## Example requests

- “Use `vscodeDiagnostics` on `apps/cms/src/app/cms/layout.tsx` and report TS errors.”
- “What is the inferred type of `foo` at line 120, char 18 in `packages/ui/src/components/ThemeToggle.tsx`? Use `vscodeHover`.”
- “Find all references for `useShopEditorSubmit` at line 75, char 10 in `apps/cms/src/app/cms/shop/[shop]/settings/useShopEditorSubmit.ts`.”
