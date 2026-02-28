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

## Availability gate (run before any vscodeDiagnostics call)

1. Check that `.vscode/.mcp-port` exists and is non-empty. If missing: ts-language server is not running — **skip all `vscodeDiagnostics` calls and fall back to `pnpm --filter <pkg> typecheck` for each affected package.**
2. Call `vscodeDiagnostics` on one file. If the call errors or returns no connection: same fallback as above.
3. This gate is session-scoped. Once marked unavailable, do not retry `vscodeDiagnostics` — **unless** `.vscode/.mcp-port` appears, changes, or a re-registration step (`scripts/mcp/register-ts-language.sh`) succeeds within the same session.

**Do not use `mcp__ide__getDiagnostics` or any `mcp__ide__*` tool for type-checking. That is the Claude Code built-in IDE server, not this ts-language server.**

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
