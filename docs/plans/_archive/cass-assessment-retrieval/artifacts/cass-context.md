---
Type: Startup-Loop-CASS-Context
Status: Active
Mode: fact-find
Generated: 2026-03-02T21:46:29.183Z
Provider: cass
Slug: cass-assessment-retrieval
---

# CASS Context Pack

- Query: startup loop fact-find; feature slug cass-assessment-retrieval; topic CASS retrieval default source roots assessment containers strategy docs; prior evidence, reusable decisions, blockers, mitigations
- Top-K target: 8
- Source roots: docs/plans, docs/business-os/startup-loop, .claude/skills
- Provider used: cass

## Retrieval Warnings

- CASS_RETRIEVE_COMMAND is not configured; using built-in CASS session-history provider. Set CASS_RETRIEVE_COMMAND to use an external CASS backend.

## CASS Output

### Built-in CASS Provider (session-history retrieval)
- query: startup loop fact-find; feature slug cass-assessment-retrieval; topic CASS retrieval default source roots assessment containers strategy docs; prior evidence, reusable decisions, blockers, mitigations
- roots: ~/.claude/projects, ~/.codex/sessions
- hits: 8

| Session File | Line | Snippet |
|---|---:|---|
| ~/.codex/sessions/2026/01/25/rollout-2026-01-25T18-41-25-019bf63f-0d45-75e0-8ce3-f92d4ad9f958.jsonl | 1 | {"timestamp":"2026-01-25T17:41:25.976Z","type":"session_meta","payload":{"id":"019bf63f-0d45-75e0-8ce3-f92d4ad9f958","timestamp":"2026-01-25T17:41:25.957Z","cwd":"/Users/petercowling/base-shop","originator":"codex_vscode","cli_version":"0.89.0","source":"exec","model_provider"... |
| ~/.codex/sessions/2026/01/25/rollout-2026-01-25T18-41-25-019bf63f-0d45-75e0-8ce3-f92d4ad9f958.jsonl | 2 | {"timestamp":"2026-01-25T17:41:25.976Z","type":"response_item","payload":{"type":"message","role":"developer","content":[{"type":"input_text","text":"<permissions instructions>Filesystem sandboxing defines which files can be read or written. `sandbox_mode` is `read-only`: The ... |
| ~/.codex/sessions/2026/01/25/rollout-2026-01-25T18-41-25-019bf63f-0d45-75e0-8ce3-f92d4ad9f958.jsonl | 3 | {"timestamp":"2026-01-25T17:41:25.976Z","type":"response_item","payload":{"type":"message","role":"user","content":[{"type":"input_text","text":"# AGENTS.md instructions for /Users/petercowling/base-shop\n\n<INSTRUCTIONS>\n---\nType: Runbook\nStatus: Canonical\nDomain: Repo\nL... |
| ~/.codex/sessions/2026/01/25/rollout-2026-01-25T18-41-25-019bf63f-0d45-75e0-8ce3-f92d4ad9f958.jsonl | 7 | {"timestamp":"2026-01-25T17:41:25.979Z","type":"turn_context","payload":{"cwd":"/Users/petercowling/base-shop","approval_policy":"never","sandbox_policy":{"type":"read-only"},"model":"gpt-5.1-codex-mini","collaboration_mode":{"mode":"custom","model":"gpt-5.1-codex-mini","reaso... |
| ~/.codex/sessions/2026/01/25/rollout-2026-01-25T16-36-19-019bf5cc-83c4-7610-bad0-c7b3b9f3167c.jsonl | 1 | {"timestamp":"2026-01-25T15:36:19.669Z","type":"session_meta","payload":{"id":"019bf5cc-83c4-7610-bad0-c7b3b9f3167c","timestamp":"2026-01-25T15:36:19.652Z","cwd":"/Users/petercowling/base-shop","originator":"codex_vscode","cli_version":"0.89.0","source":"exec","model_provider"... |
| ~/.codex/sessions/2026/01/25/rollout-2026-01-25T16-36-19-019bf5cc-83c4-7610-bad0-c7b3b9f3167c.jsonl | 2 | {"timestamp":"2026-01-25T15:36:19.669Z","type":"response_item","payload":{"type":"message","role":"developer","content":[{"type":"input_text","text":"<permissions instructions>Filesystem sandboxing defines which files can be read or written. `sandbox_mode` is `read-only`: The ... |
| ~/.codex/sessions/2026/01/25/rollout-2026-01-25T16-36-19-019bf5cc-83c4-7610-bad0-c7b3b9f3167c.jsonl | 3 | {"timestamp":"2026-01-25T15:36:19.669Z","type":"response_item","payload":{"type":"message","role":"user","content":[{"type":"input_text","text":"# AGENTS.md instructions for /Users/petercowling/base-shop\n\n<INSTRUCTIONS>\n---\nType: Runbook\nStatus: Canonical\nDomain: Repo\nL... |
| ~/.codex/sessions/2026/01/25/rollout-2026-01-25T16-36-19-019bf5cc-83c4-7610-bad0-c7b3b9f3167c.jsonl | 5 | {"timestamp":"2026-01-25T15:36:19.670Z","type":"response_item","payload":{"type":"message","role":"user","content":[{"type":"input_text","text":"You are a helpful assistant. You will be presented with a user prompt, and your job is to provide a short title for a task that will... |

## How To Use

- Treat this as advisory context only.
- Keep canonical evidence links in fact-find/plan artifacts.
- If retrieval quality is low, refine the query and re-run.

