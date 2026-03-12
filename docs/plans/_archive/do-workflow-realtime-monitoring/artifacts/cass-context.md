---
Type: Startup-Loop-CASS-Context
Status: Active
Mode: fact-find
Generated: 2026-03-12T08:38:18.770Z
Provider: cass
Slug: do-workflow-realtime-monitoring
---

# CASS Context Pack

- Query: startup loop fact-find; feature slug do-workflow-realtime-monitoring; topic real-time workflow monitoring alerts; prior evidence, reusable decisions, blockers, mitigations
- Top-K target: 8
- Source roots: docs/plans, docs/business-os/startup-loop, .claude/skills, docs/business-os/strategy
- Provider used: cass

## Retrieval Warnings

- CASS_RETRIEVE_COMMAND is not configured; using built-in CASS session-history provider. Set CASS_RETRIEVE_COMMAND to use an external CASS backend.

## CASS Output

### Built-in CASS Provider (session-history retrieval)
- query: startup loop fact-find; feature slug do-workflow-realtime-monitoring; topic real-time workflow monitoring alerts; prior evidence, reusable decisions, blockers, mitigations
- roots: ~/.claude/projects, ~/.codex/sessions
- hits: 8

| Session File | Line | Snippet |
|---|---:|---|
| ~/.codex/sessions/2026/01/25/rollout-2026-01-25T16-36-19-019bf5cc-83c4-7610-bad0-c7b3b9f3167c.jsonl | 1 | {"timestamp":"2026-01-25T15:36:19.669Z","type":"session_meta","payload":{"id":"019bf5cc-83c4-7610-bad0-c7b3b9f3167c","timestamp":"2026-01-25T15:36:19.652Z","cwd":"/Users/petercowling/base-shop","originator":"codex_vscode","cli_version":"0.89.0","source":"exec","model_provider"... |
| ~/.codex/sessions/2026/01/25/rollout-2026-01-25T16-36-19-019bf5cc-83c4-7610-bad0-c7b3b9f3167c.jsonl | 2 | {"timestamp":"2026-01-25T15:36:19.669Z","type":"response_item","payload":{"type":"message","role":"developer","content":[{"type":"input_text","text":"<permissions instructions>Filesystem sandboxing defines which files can be read or written. `sandbox_mode` is `read-only`: The ... |
| ~/.codex/sessions/2026/01/25/rollout-2026-01-25T16-36-19-019bf5cc-83c4-7610-bad0-c7b3b9f3167c.jsonl | 3 | {"timestamp":"2026-01-25T15:36:19.669Z","type":"response_item","payload":{"type":"message","role":"user","content":[{"type":"input_text","text":"# AGENTS.md instructions for /Users/petercowling/base-shop\n\n<INSTRUCTIONS>\n---\nType: Runbook\nStatus: Canonical\nDomain: Repo\nL... |
| ~/.codex/sessions/2026/01/25/rollout-2026-01-25T16-36-19-019bf5cc-83c4-7610-bad0-c7b3b9f3167c.jsonl | 4 | {"timestamp":"2026-01-25T15:36:19.669Z","type":"response_item","payload":{"type":"message","role":"user","content":[{"type":"input_text","text":"<environment_context>\n <cwd>/Users/petercowling/base-shop</cwd>\n <shell>bash</shell>\n</environment_context>"}]}} |
| ~/.codex/sessions/2026/01/25/rollout-2026-01-25T16-36-19-019bf5cc-83c4-7610-bad0-c7b3b9f3167c.jsonl | 5 | {"timestamp":"2026-01-25T15:36:19.670Z","type":"response_item","payload":{"type":"message","role":"user","content":[{"type":"input_text","text":"You are a helpful assistant. You will be presented with a user prompt, and your job is to provide a short title for a task that will... |
| ~/.codex/sessions/2026/01/25/rollout-2026-01-25T16-36-19-019bf5cc-83c4-7610-bad0-c7b3b9f3167c.jsonl | 6 | {"timestamp":"2026-01-25T15:36:19.670Z","type":"event_msg","payload":{"type":"user_message","message":"You are a helpful assistant. You will be presented with a user prompt, and your job is to provide a short title for a task that will be created from that prompt.\nThe tasks t... |
| ~/.codex/sessions/2026/01/25/rollout-2026-01-25T16-36-19-019bf5cc-83c4-7610-bad0-c7b3b9f3167c.jsonl | 7 | {"timestamp":"2026-01-25T15:36:19.670Z","type":"turn_context","payload":{"cwd":"/Users/petercowling/base-shop","approval_policy":"never","sandbox_policy":{"type":"read-only"},"model":"gpt-5.1-codex-mini","collaboration_mode":{"mode":"custom","model":"gpt-5.1-codex-mini","reaso... |
| ~/.codex/sessions/2026/01/25/rollout-2026-01-25T16-36-19-019bf5cc-83c4-7610-bad0-c7b3b9f3167c.jsonl | 8 | {"timestamp":"2026-01-25T15:36:19.989Z","type":"event_msg","payload":{"type":"token_count","info":null,"rate_limits":{"primary":{"used_percent":14.0,"window_minutes":300,"resets_at":1769363129},"secondary":{"used_percent":4.0,"window_minutes":10080,"resets_at":1769956598},"cre... |

## How To Use

- Treat this as advisory context only.
- Keep canonical evidence links in fact-find/plan artifacts.
- If retrieval quality is low, refine the query and re-run.

