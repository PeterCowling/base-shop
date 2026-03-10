---
Type: Startup-Loop-CASS-Context
Status: Active
Mode: fact-find
Generated: 2026-03-09T17:31:11.704Z
Provider: cass
Slug: startup-loop-assessment-post-build-refresh
---

# CASS Context Pack

- Query: startup loop fact-find; feature slug startup-loop-assessment-post-build-refresh; topic assessment intake packet post-build refresh assessment balance sheet; prior evidence, reusable decisions, blockers, mitigations
- Top-K target: 8
- Source roots: docs/plans, docs/business-os/startup-loop, .claude/skills, docs/business-os/strategy
- Provider used: cass

## Retrieval Warnings

- CASS_RETRIEVE_COMMAND is not configured; using built-in CASS session-history provider. Set CASS_RETRIEVE_COMMAND to use an external CASS backend.

## CASS Output

### Built-in CASS Provider (session-history retrieval)
- query: startup loop fact-find; feature slug startup-loop-assessment-post-build-refresh; topic assessment intake packet post-build refresh assessment balance sheet; prior evidence, reusable decisions, blockers, mitigations
- roots: ~/.claude/projects, ~/.codex/sessions
- hits: 8

| Session File | Line | Snippet |
|---|---:|---|
| ~/.codex/sessions/2026/01/25/rollout-2026-01-25T16-34-29-019bf5ca-d554-7280-9bf2-dc2e5f092889.jsonl | 1 | {"timestamp":"2026-01-25T15:34:29.473Z","type":"session_meta","payload":{"id":"019bf5ca-d554-7280-9bf2-dc2e5f092889","timestamp":"2026-01-25T15:34:29.460Z","cwd":"/Users/petercowling/base-shop","originator":"codex_vscode","cli_version":"0.89.0","source":"exec","model_provider"... |
| ~/.codex/sessions/2026/01/25/rollout-2026-01-25T16-34-29-019bf5ca-d554-7280-9bf2-dc2e5f092889.jsonl | 3 | {"timestamp":"2026-01-25T15:34:29.474Z","type":"response_item","payload":{"type":"message","role":"user","content":[{"type":"input_text","text":"# AGENTS.md instructions for /Users/petercowling/base-shop\n\n<INSTRUCTIONS>\n---\nType: Runbook\nStatus: Canonical\nDomain: Repo\nL... |
| ~/.codex/sessions/2026/01/25/rollout-2026-01-25T16-34-29-019bf5ca-d554-7280-9bf2-dc2e5f092889.jsonl | 7 | {"timestamp":"2026-01-25T15:34:29.476Z","type":"turn_context","payload":{"cwd":"/Users/petercowling/base-shop","approval_policy":"never","sandbox_policy":{"type":"read-only"},"model":"gpt-5.1-codex-mini","collaboration_mode":{"mode":"custom","model":"gpt-5.1-codex-mini","reaso... |
| ~/.codex/sessions/2026/01/25/rollout-2026-01-25T16-34-29-019bf5ca-d554-7280-9bf2-dc2e5f092889.jsonl | 8 | {"timestamp":"2026-01-25T15:34:30.107Z","type":"event_msg","payload":{"type":"token_count","info":null,"rate_limits":{"primary":{"used_percent":13.0,"window_minutes":300,"resets_at":1769363129},"secondary":{"used_percent":3.0,"window_minutes":10080,"resets_at":1769956598},"cre... |
| ~/.codex/sessions/2026/01/25/rollout-2026-01-25T16-34-29-019bf5ca-d554-7280-9bf2-dc2e5f092889.jsonl | 13 | {"timestamp":"2026-01-25T15:34:31.505Z","type":"event_msg","payload":{"type":"token_count","info":{"total_token_usage":{"input_tokens":6665,"cached_input_tokens":6144,"output_tokens":11,"reasoning_output_tokens":0,"total_tokens":6676},"last_token_usage":{"input_tokens":6665,"c... |
| ~/.codex/sessions/2026/03/06/rollout-2026-03-06T10-41-48-019cc286-5143-7ae1-a7be-c4d5c955db9d.jsonl | 1 | {"timestamp":"2026-03-06T09:41:50.312Z","type":"session_meta","payload":{"id":"019cc286-5143-7ae1-a7be-c4d5c955db9d","timestamp":"2026-03-06T09:41:48.488Z","cwd":"/Users/petercowling/base-shop","originator":"codex_exec","cli_version":"0.105.0","source":"exec","model_provider":... |
| ~/.codex/sessions/2026/03/06/rollout-2026-03-06T10-41-48-019cc286-5143-7ae1-a7be-c4d5c955db9d.jsonl | 3 | {"timestamp":"2026-03-06T09:41:50.313Z","type":"response_item","payload":{"type":"message","role":"user","content":[{"type":"input_text","text":"# AGENTS.md instructions for /Users/petercowling/base-shop\n\n<INSTRUCTIONS>\n---\nType: Runbook\nStatus: Canonical\nDomain: Repo\nL... |
| ~/.codex/sessions/2026/03/06/rollout-2026-03-06T10-41-48-019cc286-5143-7ae1-a7be-c4d5c955db9d.jsonl | 6 | {"timestamp":"2026-03-06T09:41:50.313Z","type":"response_item","payload":{"type":"message","role":"user","content":[{"type":"input_text","text":"TASK-04: Apply per-question confidence floor in composite template selection\n\nCONTEXT:\nIn packages/mcp-server, the composite emai... |

## How To Use

- Treat this as advisory context only.
- Keep canonical evidence links in fact-find/plan artifacts.
- If retrieval quality is low, refine the query and re-run.

