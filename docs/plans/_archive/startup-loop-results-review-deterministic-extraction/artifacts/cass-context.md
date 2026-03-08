---
Type: Startup-Loop-CASS-Context
Status: Active
Mode: plan
Generated: 2026-03-06T14:36:39.749Z
Provider: cass
Slug: startup-loop-results-review-deterministic-extraction
---

# CASS Context Pack

- Query: startup loop plan; feature slug startup-loop-results-review-deterministic-extraction; topic results-review prefill deterministic signal extraction; prior evidence, reusable decisions, blockers, mitigations
- Top-K target: 8
- Source roots: docs/plans, docs/business-os/startup-loop, .claude/skills, docs/business-os/strategy
- Provider used: cass

## Retrieval Warnings

- CASS_RETRIEVE_COMMAND is not configured; using built-in CASS session-history provider. Set CASS_RETRIEVE_COMMAND to use an external CASS backend.

## CASS Output

### Built-in CASS Provider (session-history retrieval)
- query: startup loop plan; feature slug startup-loop-results-review-deterministic-extraction; topic results-review prefill deterministic signal extraction; prior evidence, reusable decisions, blockers, mitigations
- roots: ~/.claude/projects, ~/.codex/sessions
- hits: 8

| Session File | Line | Snippet |
|---|---:|---|
| ~/.codex/sessions/2026/01/25/rollout-2026-01-25T18-41-25-019bf63f-0d45-75e0-8ce3-f92d4ad9f958.jsonl | 1 | {"timestamp":"2026-01-25T17:41:25.976Z","type":"session_meta","payload":{"id":"019bf63f-0d45-75e0-8ce3-f92d4ad9f958","timestamp":"2026-01-25T17:41:25.957Z","cwd":"/Users/petercowling/base-shop","originator":"codex_vscode","cli_version":"0.89.0","source":"exec","model_provider"... |
| ~/.codex/sessions/2026/01/25/rollout-2026-01-25T18-41-25-019bf63f-0d45-75e0-8ce3-f92d4ad9f958.jsonl | 3 | {"timestamp":"2026-01-25T17:41:25.976Z","type":"response_item","payload":{"type":"message","role":"user","content":[{"type":"input_text","text":"# AGENTS.md instructions for /Users/petercowling/base-shop\n\n<INSTRUCTIONS>\n---\nType: Runbook\nStatus: Canonical\nDomain: Repo\nL... |
| ~/.codex/sessions/2026/01/25/rollout-2026-01-25T18-41-25-019bf63f-0d45-75e0-8ce3-f92d4ad9f958.jsonl | 5 | {"timestamp":"2026-01-25T17:41:25.977Z","type":"response_item","payload":{"type":"message","role":"user","content":[{"type":"input_text","text":"You are a helpful assistant. You will be presented with a user prompt, and your job is to provide a short title for a task that will... |
| ~/.codex/sessions/2026/01/25/rollout-2026-01-25T18-41-25-019bf63f-0d45-75e0-8ce3-f92d4ad9f958.jsonl | 6 | {"timestamp":"2026-01-25T17:41:25.977Z","type":"event_msg","payload":{"type":"user_message","message":"You are a helpful assistant. You will be presented with a user prompt, and your job is to provide a short title for a task that will be created from that prompt.\nThe tasks t... |
| ~/.codex/sessions/2026/01/25/rollout-2026-01-25T18-41-25-019bf63f-0d45-75e0-8ce3-f92d4ad9f958.jsonl | 7 | {"timestamp":"2026-01-25T17:41:25.979Z","type":"turn_context","payload":{"cwd":"/Users/petercowling/base-shop","approval_policy":"never","sandbox_policy":{"type":"read-only"},"model":"gpt-5.1-codex-mini","collaboration_mode":{"mode":"custom","model":"gpt-5.1-codex-mini","reaso... |
| ~/.codex/sessions/2026/01/25/rollout-2026-01-25T21-04-52-019bf6c2-61bf-7d93-9de0-41bed2b9681c.jsonl | 1 | {"timestamp":"2026-01-25T20:04:52.817Z","type":"session_meta","payload":{"id":"019bf6c2-61bf-7d93-9de0-41bed2b9681c","timestamp":"2026-01-25T20:04:52.799Z","cwd":"/Users/petercowling/base-shop","originator":"codex_vscode","cli_version":"0.89.0","source":"exec","model_provider"... |
| ~/.codex/sessions/2026/01/25/rollout-2026-01-25T21-04-52-019bf6c2-61bf-7d93-9de0-41bed2b9681c.jsonl | 3 | {"timestamp":"2026-01-25T20:04:52.817Z","type":"response_item","payload":{"type":"message","role":"user","content":[{"type":"input_text","text":"# AGENTS.md instructions for /Users/petercowling/base-shop\n\n<INSTRUCTIONS>\n---\nType: Runbook\nStatus: Canonical\nDomain: Repo\nL... |
| ~/.codex/sessions/2026/01/25/rollout-2026-01-25T21-04-52-019bf6c2-61bf-7d93-9de0-41bed2b9681c.jsonl | 5 | {"timestamp":"2026-01-25T20:04:52.818Z","type":"response_item","payload":{"type":"message","role":"user","content":[{"type":"input_text","text":"You are a helpful assistant. You will be presented with a user prompt, and your job is to provide a short title for a task that will... |

## How To Use

- Treat this as advisory context only.
- Keep canonical evidence links in fact-find/plan artifacts.
- If retrieval quality is low, refine the query and re-run.

