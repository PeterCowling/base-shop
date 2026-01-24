---
Type: Plan
Status: Draft
Domain: DevEx/Tooling
Last-reviewed: 2026-01-24
Relates-to charter: none
Created: 2026-01-24
Created-by: Codex (GPT-5.2)
Last-updated: 2026-01-24
Last-updated-by: Codex (GPT-5)
---

# Agent Language Intelligence Plan (TypeScript in VS Code)

## Executive Summary

Provide both Claude Code and Codex with fast, on-demand TypeScript “semantic truth” (types + diagnostics + navigation) without constantly running `pnpm typecheck`, while preserving `pnpm typecheck && pnpm lint` as the validation gate before commits.

Recommended approach (for this repo + VS Code):

1. **Pin VS Code to the workspace TypeScript** to avoid IDE/CLI drift.
2. **Expose VS Code language features via a local, stable MCP endpoint** (localhost-only, minimal tool surface) so *both* agents can query diagnostics/hover/definition/etc.
3. Treat any **undocumented/experimental** language-to-MCP bridges as convenience-only fallbacks, not dependencies.

## Current State (Verified in `base-shop`, 2026-01-24)

### Repo + TypeScript

- Repo pins `typescript` to `5.8.3` (`package.json → devDependencies.typescript`).
- `tsconfig.base.json` uses modern compiler settings including `moduleResolution: "bundler"`.
- `.vscode/settings.json` currently disables Jest auto-run/watch but **does not** pin VS Code’s TypeScript SDK.

### Agents + MCP

- **Codex CLI**: `codex-cli 0.89.0` is installed; no MCP servers are currently configured (`codex mcp list` shows none).
- **Codex VS Code extension** (`openai.chatgpt` v0.4.66, observed on this machine):
  - Contains a hidden/experimental “LSP MCP” feature gate (`chatgpt.useExperimentalLspMcpServer`, not surfaced in the extension’s contributed settings UI).
  - Registers a command **“Copy Codex CLI args for LSP MCP”**.
  - Exposes only three VS Code language-feature MCP tools (observed by inspecting the installed extension bundle):
    - `vscodeDiagnostics`
    - `vscodeReferences`
    - `vscodeWorkspaceSymbols`
  - **Caveat:** connection details are **session-scoped** (ephemeral Unix socket), so it is not a stable shared dependency for a dual-agent workflow.

### Claude Code

- Repo-level Claude config `.claude/settings.json` currently contains safety hooks but **no** `mcpServers` block.
  - This contradicts some in-repo MCP server README claims (“configured in `.claude/settings.json`”), so treat those as docs drift until re-verified.

## Terminology (Normalize in docs + implementation)

- **VS Code TypeScript “language features”**: VS Code’s built-in TypeScript/JavaScript extension backed by **tsserver**.
  - This is **not** LSP in the strict sense.
- **TypeScript LSP**: `typescript-language-server` (an LSP wrapper around tsserver).
- **MCP**: Model Context Protocol; the agent-facing tool interface we want.

## Goals

1. **Faster inner loop for agents**: types/diagnostics/navigation on demand.
2. **Shared semantics** between Claude Code and Codex where possible.
3. **Low operational overhead**: stable endpoint, predictable startup, documented workflow.
4. **Security-first**: minimal tool surface; localhost-only; no shell execution.
5. **No regression in correctness**: keep `pnpm typecheck && pnpm lint` as the final gate.

## Non-Goals

- Replace `pnpm typecheck` (tsserver/IDE diagnostics differ from `tsc -b` semantics).
- Provide a general-purpose “remote IDE control” endpoint.
- Expose file mutation or command execution over MCP.

## Decision Table (Architecture Options)

| Option | What it is | Fidelity (unsaved buffers) | Stability (shared dependency) | Security risk | Works for Codex | Works for Claude Code |
|--------|------------|----------------------------|-------------------------------|--------------|-----------------|-----------------------|
| A | Use Codex extension’s hidden “LSP MCP” | High | Low (session-scoped + undocumented) | Low (limited tools) | Yes | Possible but brittle |
| B | Adopt a third-party VS Code MCP server extension | High | High | Variable (often broad tools + no auth) | Yes (HTTP) | Unknown (depends on client transport support) |
| C (recommended) | Build an in-repo VS Code extension that exposes **only language tools** via MCP (localhost-only) | High (dirty buffers) | High (dynamic port + sentinel file) | Low (auditable + minimal surface) | Yes (HTTP) | Yes (HTTP — verified) |
| D | Headless TS semantic server (no VS Code), exposed via MCP | Medium (saved files only) | High | Low | Yes | Yes |

**Default recommendation:** Option **C** as the long-term “shared dependency”, with Option **A** as a convenience-only fallback while C is being built.

## Proposed Target Design (Option C — "Sidecar Extension")

### Delivery model

- **Location**: `tools/vscode-mcp-server/` in the monorepo (not a published `.vsix`).
- **Loading**: Symlink into `~/.vscode/extensions/` or use VS Code's local extension loading. Single-dev context means no marketplace packaging overhead.
- **No bridge script needed**: Both Claude Code and Codex connect via HTTP directly to the localhost endpoint.

### Semantic source of truth

- Use **VS Code language features** (tsserver-backed for TS/JS) for:
  - Diagnostics (“Problems”)
  - Hover/type at a position
  - Go-to-definition / type-definition
  - References
  - Document + workspace symbols

### MCP surface (minimal, safe)

Expose only read-only, language-intelligence tools (names illustrative; final names should match existing conventions):

- `vscodeDiagnostics` (file-scoped; TS-only; Error+Warning severity only; uses dirty buffer if open)
- `vscodeHover` (type/hover text at a position)
- `vscodeDefinition` / `vscodeTypeDefinition`
- `vscodeReferences`
- `vscodeDocumentSymbols`
- `vscodeWorkspaceSymbols`

### Transport + stability

- **Bind to `127.0.0.1` only**.
- **Dynamic port + sentinel file**: Listen on port `0` (OS-assigned random free port) to avoid `EADDRINUSE` collisions on window reload or multi-project scenarios. Write the active port number to `.vscode/.mcp-port` (gitignored). Agents read this file to discover the endpoint.
- **Both agents connect via HTTP directly** (verified: Claude Code supports `--transport http`; Codex supports `--url`). No stdio proxy needed.
- Endpoint format: `http://127.0.0.1:<port>/mcp` (port read from sentinel file).

### Dirty buffer support

The extension runs inside the VS Code extension host, which means it has access to `vscode.workspace.textDocuments` — the live, in-memory document state including unsaved edits.

**Behavior for all language tools:**

1. If the file is **open in an editor tab**: query the `TextDocument` from `vscode.workspace.textDocuments` (includes unsaved/dirty changes). Diagnostics and hover will reflect the current buffer state.
2. If the file is **not open**: open it via `vscode.workspace.openTextDocument(uri)` to load from disk, then query.

**Why this matters:** Forcing saves at every step of a multi-step refactor triggers file watchers, bundler rebuilds, and on-save formatters (Prettier/ESLint). Using dirty buffers avoids this thrashing.

### Diagnostic filtering

`vscodeDiagnostics` must **not** return the raw firehose from `vscode.languages.getDiagnostics(uri)`. Unfiltered results include noise from spell checkers, TODO highlighters, and other extensions — confusing agents into "fixing" non-issues.

**Server-side filters (mandatory):**

- **Source**: Only include diagnostics where `source` starts with `ts` or `typescript` (covers `ts`, `ts-plugin`, `typescript`).
- **Severity**: Only include `Error` and `Warning`. Exclude `Information` and `Hint`.

These filters are applied server-side (not client-configurable) to keep the tool surface predictable.

## Security / Trust Boundaries

- **Localhost only**: never bind to `0.0.0.0`, never expose on LAN/VPN.
- **No auth assumed**: treat it as a local developer tool; rely on localhost + minimal surface.
- **No exec / no write tools**: do not include “run shell command”, “edit file”, “apply patch”, etc.
- Prefer **server-side minimization** over client-side allow/deny lists (clients vary; server is the safest choke point).

## Active Tasks

### Phase 0 — Quick win: eliminate TS version drift

- [x] **AGENT-LANG-01**: Pin VS Code to workspace TypeScript
  - **Scope**:
    - Update `.vscode/settings.json` to use the workspace TS SDK (`node_modules/typescript/lib`).
    - Document the manual fallback: “TypeScript: Select TypeScript Version → Use Workspace Version”.
  - **Definition of done**:
    - A developer opening the repo in VS Code uses TS 5.8.3 for editor diagnostics/completions (matches `package.json`).

### Phase 1 — Decide the shared semantic endpoint

- [x] **AGENT-LANG-02**: Confirm client transport constraints and pick the shared endpoint strategy
  - **Resolution (2026-01-24):**
    - **Claude Code** supports streamable HTTP MCP servers directly (`claude mcp add --transport http <name> <url>`). Verified via official docs.
    - **Codex CLI** supports HTTP via `codex mcp add <name> --url <url>`.
    - **Decision: Option C** (repo-owned VS Code extension). No stdio proxy needed — both agents connect via HTTP directly.
    - Option B rejected: third-party extensions have unpredictable tool surfaces, no localhost-binding guarantees, and add an external dependency.

### Phase 2 — Implement the sidecar extension

- [x] **AGENT-LANG-03**: Create `tools/vscode-mcp-server`
  - **Scope**:
    - Create a VS Code extension in `tools/vscode-mcp-server/` (loaded via symlink to `~/.vscode/extensions/` or VS Code's local extension mechanism — no `.vsix` packaging needed for single-dev use).
    - Expose only read-only language tools (Diagnostics/Hover/Definition/References/Symbols).
    - **CRITICAL: Diagnostic filtering** — `vscodeDiagnostics` must filter to `source` starting with `ts`/`typescript` and severity `Error`/`Warning` only. No spell-checker noise, no TODO highlights.
    - **CRITICAL: Dirty buffer support** — All tools must check `vscode.workspace.textDocuments` for an open (possibly unsaved) document first, falling back to `vscode.workspace.openTextDocument(uri)` for files not currently in an editor tab.
    - **Dynamic port**: Listen on port `0`, write the assigned port to `.vscode/.mcp-port` (gitignored). On deactivation, delete the sentinel file.
  - **Implementation hints**:
    - Use `vscode.languages.getDiagnostics(uri)` with post-filter.
    - Use `vscode.commands.executeCommand('vscode.executeHoverProvider', uri, position)` etc. for hover/definition/references/symbols.
    - Use the MCP TypeScript SDK (`@modelcontextprotocol/sdk`) for HTTP server plumbing.
    - Bind with `server.listen(0, '127.0.0.1')`.
  - **Definition of done**:
    - Server returns correct structured results for representative TS files in this monorepo.
    - Diagnostics are filtered (no non-TS noise).
    - Dirty buffers are used when available.
    - Port collision on reload does not break the server.
    - No mutation/exec tools exist.

- [x] **AGENT-LANG-04**: Add Claude Code wiring
  - **Scope**:
    - Register the HTTP MCP server: `claude mcp add --transport http ts-language http://127.0.0.1:<port>/mcp` (port read from `.vscode/.mcp-port`).
    - Document in the operator guide how to re-register after port changes (or provide a small wrapper script that reads the sentinel file and calls `claude mcp add`).
  - **Definition of done**:
    - Claude Code can call the language tools during a session and receive results.
  - **Resolution (2026-01-24):**
    - Added `mcpServers.ts-language` entry to `.claude/settings.json` with `type: "url"` and `url: "http://127.0.0.1:59238/mcp"` (port read from `.vscode/.mcp-port`).
    - **Dynamic port caveat:** If VS Code restarts and assigns a different port, `.claude/settings.json` must be updated to match `.vscode/.mcp-port`. A wrapper script or hook is a future improvement.

- [x] **AGENT-LANG-05**: Add Codex wiring
  - **Scope**:
    - Register: `codex mcp add ts-language --url http://127.0.0.1:<port>/mcp` (port from sentinel file).
    - Document in the operator guide.
  - **Definition of done**:
    - Codex CLI sessions can call the language tools.

### Phase 3 — Documentation + guardrails

- [x] **AGENT-LANG-06**: Add a short operator guide for humans/agents
  - **Scope**:
    - Create `docs/ide/agent-language-intelligence-guide.md` covering:
      - What it is / what it isn't (tsserver vs `tsc -b`)
      - How to install/load the sidecar extension
      - How to verify the server is running (check `.vscode/.mcp-port` exists)
      - Port discovery: agents read `.vscode/.mcp-port` for the active endpoint
      - Dirty buffer behavior: no save needed during multi-step refactors
      - Diagnostic filtering: only TS errors/warnings are returned
      - Security: localhost only; no auth; read-only
  - **Definition of done**:
    - A developer can follow the guide to enable the workflow.

- [x] **AGENT-LANG-07**: Keep the “experimental Codex LSP MCP” documented as a fallback only
  - **Scope**:
    - Document how to enable it locally (if still present) and its limitations:
      - undocumented setting
      - session-scoped socket
      - limited tool set (diagnostics/references/workspace symbols only)
  - **Definition of done**:
    - No core workflow depends on it; it’s clearly labeled as “best-effort / unstable”.

## Acceptance Criteria (Overall)

- Both agents can:
  - Retrieve file-scoped TypeScript diagnostics (TS-only, Error+Warning) without running `pnpm typecheck`.
  - Get diagnostics that reflect unsaved buffer state (no forced save required).
  - Ask "what is the type of this symbol at this position?" (hover/type).
  - Navigate definitions/references/symbol search to reduce guesswork.
- The shared endpoint:
  - Discovers its port via `.vscode/.mcp-port` sentinel file (survives window reloads without collision).
  - Binds to localhost only.
  - Exposes only read-only tools (no exec/write).
- `pnpm typecheck && pnpm lint` remains the final validation gate before commits/PRs.

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| tsserver vs `tsc -b` differences | False confidence if used as a replacement gate | Keep `pnpm typecheck && pnpm lint` mandatory; document differences |
| Zombie port on window reload | `EADDRINUSE` — agents can't connect | Dynamic port (listen on `0`) + sentinel file; old process releases port on deactivation |
| Diagnostic noise from non-TS extensions | Agent "fixes" spell-check warnings or TODO highlights | Server-side filter: only `source=ts*`, only `Error`/`Warning` severity |
| Stale sentinel file after crash | Agents connect to wrong/dead port | Extension writes sentinel on activate, deletes on deactivate; agents should retry/fail gracefully |
| Performance on monorepo | Slow responses or heavy CPU | Keep tool set small; file-scoped queries; avoid full-workspace scans by default |
| Security exposure from third-party extensions | Potential code execution / data exposure | Prefer repo-owned server; localhost bind; no exec tools; document threats |
| Undocumented Codex feature changes | Breaks fallback | Treat as optional only; keep stable server as primary |

## Resolved Audit Items

- **Claude Code MCP transport (2026-01-24):** Confirmed — Claude Code supports streamable HTTP MCP servers via `claude mcp add --transport http <name> <url>`. No stdio proxy needed. Source: official Claude Code docs.
- **Option B rejected (2026-01-24):** Third-party VS Code MCP server extensions have unpredictable tool surfaces, no localhost-binding guarantees, and introduce an external dependency. Proceeding with Option C (repo-owned).
- **`.vscode/.mcp-port` gitignored (2026-01-24):** Added to `.gitignore` to prevent committing ephemeral port state.

## Remaining Audit Work

- Confirm that `vscode.workspace.textDocuments` reliably returns dirty buffer content for files modified by agents (not just user edits).

## Future Improvements

- ✅ Added a sync script that reads `.vscode/.mcp-port` and updates `.claude/settings.json` plus Codex/Claude registrations (`scripts/mcp/sync-ts-language.mjs`).
- ✅ Added a lightweight health check script to validate endpoint reachability (`scripts/mcp/healthcheck-ts-language.sh`).
- ✅ Added a status bar indicator showing the active MCP port; logs the URL on startup.
