---
Type: Card
Lane: Fact-finding
Priority: P2
Owner: Pete
ID: PLAT-ENG-0004
Title: Agent Language Intelligence Plan (TypeScript in VS Code)
Business: PLAT
Tags:
  - plan-migration
  - devex/tooling
Created: 2026-01-24T00:00:00.000Z
Updated: 2026-01-24T00:00:00.000Z
---
# Agent Language Intelligence Plan (TypeScript in VS Code)

**Source:** Migrated from `agent-language-intelligence-plan.md`


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

[... see full plan in docs/plans/agent-language-intelligence-plan.md]
