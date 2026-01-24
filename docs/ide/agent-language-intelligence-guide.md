Type: Guide
Status: Draft
Domain: DevEx/Tooling
Last-reviewed: 2026-01-24

# Agent Language Intelligence Guide (VS Code + MCP)

## What this is

A local, read-only MCP endpoint backed by VS Code's TypeScript language features (tsserver). It lets agents query:

- TypeScript diagnostics (errors/warnings only)
- Hover/type info at a position
- Definitions and type definitions
- References
- Document/workspace symbols

This gives fast semantic answers without running `pnpm typecheck` on every change.

**When asked to “check types” or “check TypeScript errors,” agents should use these MCP tools first.** `pnpm typecheck && pnpm lint` remains the final validation gate before commits.

## What this is not

- A replacement for `pnpm typecheck && pnpm lint` (still the validation gate)
- A general-purpose IDE control endpoint
- A file editor or command runner (read-only tools only)

## How it works

- VS Code loads a local extension in `tools/vscode-mcp-server/`.
- The extension starts a localhost-only HTTP MCP server.
- The server binds to a dynamic port and writes it to `.vscode/.mcp-port`.
- Agents connect to `http://127.0.0.1:<port>/mcp` using that sentinel file.

## Installation (local)

1. Build the extension:

```bash
pnpm --filter vscode-mcp-server build
```

2. Load the extension into VS Code:

- Command Palette -> "Developer: Install Extension from Location..."
- Select `tools/vscode-mcp-server/`
- Reload the window when prompted

## Verify it is running

- Open the repo in VS Code.
- Confirm `.vscode/.mcp-port` exists and contains a port number.
- The Output panel should contain "MCP Language Server" logs with the server URL.

## Connect agents

### Helper script

```bash
scripts/mcp/register-ts-language.sh --both
```

Use `--claude` or `--codex` to register only one client.

Related helpers:

```bash
scripts/mcp/show-ts-language-port.sh
scripts/mcp/unregister-ts-language.sh --both
scripts/mcp/sync-ts-language.mjs
scripts/mcp/healthcheck-ts-language.sh
```

### Claude Code

```bash
claude mcp add --transport http ts-language http://127.0.0.1:<port>/mcp
```

### Codex CLI

```bash
codex mcp add ts-language --url http://127.0.0.1:<port>/mcp
```

Replace `<port>` with the value from `.vscode/.mcp-port`.

## Quick verification checklist

1. Open the repo in VS Code and confirm `.vscode/.mcp-port` exists.
2. Run `scripts/mcp/register-ts-language.sh --both`.
3. (Optional) Run `scripts/mcp/healthcheck-ts-language.sh` to confirm the endpoint is reachable.
4. In a Claude/Codex session, call `vscodeDiagnostics` on a known TS file and confirm the response includes only TS errors/warnings.

## Diagnostics behavior

- Diagnostics are filtered server-side:
  - Only `ts`/`typescript` sources
  - Only Error/Warning severity
- This avoids noise from spellcheckers, TODO highlighters, etc.

## Dirty buffer behavior

If a file is open in VS Code, the MCP tools use the in-memory buffer, including unsaved changes. This avoids forcing saves that can trigger formatters or rebuilds during multi-step refactors.

## Security notes

- The server binds to `127.0.0.1` only.
- No auth is assumed; the tool surface is read-only.
- Do not expose the port outside localhost.

## Experimental fallback (Codex LSP MCP)

If the repo-owned extension is unavailable, the Codex VS Code extension may expose an experimental LSP MCP bridge.

**Status:** Best-effort / unstable (undocumented, session-scoped socket).

Notes:
- Requires enabling a hidden setting in the Codex VS Code extension.
- Connection details are ephemeral per VS Code session.
- Tool surface is limited (diagnostics, references, workspace symbols only).

Do not depend on this for the primary workflow.
