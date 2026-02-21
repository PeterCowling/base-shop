---
Type: Briefing
Outcome: Understanding
Status: Active
Domain: Infra
Created: 2026-02-20
Last-updated: 2026-02-20
Topic-Slug: cloudflare-code-mode-mcp
Source: https://blog.cloudflare.com/code-mode-mcp/
---

# Cloudflare Code Mode MCP — Research Briefing

## Executive Summary

Cloudflare published a technique called "Code Mode" that compresses entire API schemas to ~1,000 tokens by
having AI agents write code against typed SDKs rather than enumerating individual tools. An equivalent
traditional MCP server for Cloudflare's 2,500-endpoint API would consume 1.17M tokens — exceeding most
model context windows. Code Mode holds that fixed regardless of API size.

## Questions Answered

- **What is it?** A two-tool MCP architecture (`search` + `execute`) that lets agents discover and call
  any API endpoint by writing code, rather than having one tool per endpoint.
- **How does it scale?** Token footprint is constant — O(1) not O(n endpoints).
- **Is it secure?** Both tools run inside a V8 isolate (Dynamic Worker). No filesystem access; external
  fetches disabled by default.
- **Does it require Cloudflare?** The pattern is generic. Cloudflare's specific server uses OAuth 2.1 and
  wraps their own API, but the architecture applies to any typed SDK or OpenAPI-spec-backed API.

## The Two-Tool Architecture

```
search(query)   → queries the OpenAPI spec; returns matching endpoints + schemas
execute(code)   → runs authenticated JS code against the API; returns response
```

Both tools are the only two exposed. Agents discover what endpoints exist via `search`, then call them
via `execute`. No individual `dns_list`, `worker_deploy`, etc. tools required.

## Relevance to This Project

### 1. `packages/mcp-server` tool count growth

The brikette MCP server currently exposes ~40 discrete tools. Each new capability (analytics, SEO,
discounts, theme, BOS stage docs, experiments, ops, gmail, etc.) adds more. At some threshold the tool
list will noticeably inflate context on every call.

**Code Mode application**: replace the BOS Agent API tools with a `search`/`execute` pair over the BOS
Agent API's OpenAPI spec. Claude Code could discover and call any BOS endpoint without needing a
registered tool per endpoint.

Relevant current tools that could collapse into this pattern:
- `mcp__brikette__bos_cards_list` / `bos_stage_doc_get` / `bos_stage_doc_patch_guarded`
- `mcp__brikette__exp_allocate_id` / `exp_register` / `exp_rollout_status` / `exp_results_snapshot`
- `mcp__brikette__ops_update_price_guarded`
- `mcp__brikette__loop_manifest_status` / `loop_metrics_summary` / `loop_learning_ledger_status`
- `mcp__brikette__measure_snapshot_get` / `app_run_packet_build` / `pack_weekly_s10_build`

That's ~15 tools that could become 2.

### 2. BOS Agent API as the execution target

The BOS Agent API (`apps/business-os`) already has a typed surface. A Code Mode executor could:
- Import the BOS client SDK
- Run authenticated calls with the existing `x-agent-api-key` header
- Return structured JSON responses

The V8 isolate constraint (no filesystem, no external fetches by default) maps well to how the BOS API
works — it's pure HTTP + JSON with no side-channel dependencies.

### 3. Deploying the MCP server as a Cloudflare Worker

Currently the brikette MCP server runs as a local `node dist/index.js` process tied to a specific
machine. Cloudflare's Code Mode server is a deployed Worker — accessible via OAuth-authenticated HTTP.

**Implication**: migrating `packages/mcp-server` to a Cloudflare Worker (already used for
`apps/business-os`) would:
- Remove local process dependency
- Enable multi-machine / team-shared access
- Allow OAuth 2.1 instead of static `BOS_AGENT_API_KEY`
- Open the door to Code Mode's execute-in-isolate pattern

This is a non-trivial migration but architecturally clean given the existing Cloudflare Workers footprint.

### 4. OAuth 2.1

If the MCP server becomes a deployed service shared across devices or team members, the current static
API key approach becomes a single point of compromise. OAuth 2.1 (as used by Cloudflare's server) would
gate tool access to scoped, revocable tokens.

Not urgent for a single-operator setup, but the design decision matters before the server is deployed.

## Prioritisation

| Opportunity | Effort | Impact | When |
|---|---|---|---|
| Collapse BOS tools to `search`/`execute` | Medium | High (context savings) | When tool count >60 or context pressure noticed |
| Deploy MCP server as Cloudflare Worker | High | Medium (portability) | If multi-device or team access needed |
| OAuth 2.1 for MCP server | Medium | Low (security, single operator) | Only if deployed/shared |

**Immediate action**: none required. File this as a reference for the next `packages/mcp-server` refactor
or when context pressure from the tool list becomes measurable.

## If You Later Want to Change This

- Likely change points:
  - `packages/mcp-server/src/tools/` — each tool file would be replaced/reduced
  - `packages/mcp-server/src/index.ts` — server registration
  - BOS Agent API would need an OpenAPI spec published (currently implicit in route handlers)
- Key risks:
  - `execute()` arbitrary code execution requires careful sandboxing — V8 isolate or equivalent
  - Losing discrete tool signatures removes per-tool permission gating (current tools are individually
    approvable in Claude Code's permission UI)
  - BOS Agent API does not currently have a machine-readable OpenAPI spec — that is a prerequisite

## Source

- Blog post: https://blog.cloudflare.com/code-mode-mcp/
- Cloudflare MCP server (open source): available via Cloudflare's GitHub org
