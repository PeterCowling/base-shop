---
Type: Startup-Loop-CASS-Context
Status: Active
Mode: fact-find
Generated: 2026-03-13T18:29:50.068Z
Provider: cass
Slug: prime-activity-duration
---

# CASS Context Pack

- Query: startup loop fact-find; feature slug prime-activity-duration; topic activity duration hardcoded; prior evidence, reusable decisions, blockers, mitigations
- Top-K target: 8
- Source roots: docs/plans, docs/business-os/startup-loop, .claude/skills, docs/business-os/strategy
- Provider used: cass

## Retrieval Warnings

- CASS_RETRIEVE_COMMAND is not configured; using built-in CASS session-history provider. Set CASS_RETRIEVE_COMMAND to use an external CASS backend.

## CASS Output

### Built-in CASS Provider (session-history retrieval)
- query: startup loop fact-find; feature slug prime-activity-duration; topic activity duration hardcoded; prior evidence, reusable decisions, blockers, mitigations
- roots: ~/.claude/projects, ~/.codex/sessions
- hits: 8

| Session File | Line | Snippet |
|---|---:|---|
| ~/.codex/sessions/2026/01/25/rollout-2026-01-25T18-41-25-019bf63f-0d45-75e0-8ce3-f92d4ad9f958.jsonl | 3 | {"timestamp":"2026-01-25T17:41:25.976Z","type":"response_item","payload":{"type":"message","role":"user","content":[{"type":"input_text","text":"# AGENTS.md instructions for /Users/petercowling/base-shop\n\n<INSTRUCTIONS>\n---\nType: Runbook\nStatus: Canonical\nDomain: Repo\nL... |
| ~/.codex/sessions/2026/01/25/rollout-2026-01-25T18-41-25-019bf63f-0d45-75e0-8ce3-f92d4ad9f958.jsonl | 7 | {"timestamp":"2026-01-25T17:41:25.979Z","type":"turn_context","payload":{"cwd":"/Users/petercowling/base-shop","approval_policy":"never","sandbox_policy":{"type":"read-only"},"model":"gpt-5.1-codex-mini","collaboration_mode":{"mode":"custom","model":"gpt-5.1-codex-mini","reaso... |
| ~/.codex/sessions/2026/01/26/rollout-2026-01-26T13-59-00-019bfa62-d7fd-7502-8f03-665e0dfdc388.jsonl | 3 | {"timestamp":"2026-01-26T12:59:00.491Z","type":"response_item","payload":{"type":"message","role":"user","content":[{"type":"input_text","text":"# AGENTS.md instructions for /Users/petercowling/base-shop\n\n<INSTRUCTIONS>\n---\nType: Runbook\nStatus: Canonical\nDomain: Repo\nL... |
| ~/.codex/sessions/2026/01/26/rollout-2026-01-26T13-59-00-019bfa62-d7fd-7502-8f03-665e0dfdc388.jsonl | 7 | {"timestamp":"2026-01-26T12:59:00.493Z","type":"turn_context","payload":{"cwd":"/Users/petercowling/base-shop","approval_policy":"never","sandbox_policy":{"type":"read-only"},"model":"gpt-5.1-codex-mini","collaboration_mode":{"mode":"custom","model":"gpt-5.1-codex-mini","reaso... |
| ~/.codex/sessions/2026/01/27/rollout-2026-01-27T18-01-38-019c0067-55e9-70a2-8a98-1e451c437c09.jsonl | 3 | {"timestamp":"2026-01-27T17:01:38.171Z","type":"response_item","payload":{"type":"message","role":"user","content":[{"type":"input_text","text":"# AGENTS.md instructions for /Users/petercowling/base-shop\n\n<INSTRUCTIONS>\n---\nType: Runbook\nStatus: Canonical\nDomain: Repo\nL... |
| ~/.codex/sessions/2026/01/27/rollout-2026-01-27T18-01-38-019c0067-55e9-70a2-8a98-1e451c437c09.jsonl | 7 | {"timestamp":"2026-01-27T17:01:38.174Z","type":"turn_context","payload":{"cwd":"/Users/petercowling/base-shop","approval_policy":"never","sandbox_policy":{"type":"read-only"},"model":"gpt-5.1-codex-mini","collaboration_mode":{"mode":"custom","model":"gpt-5.1-codex-mini","reaso... |
| ~/.codex/sessions/2026/01/28/rollout-2026-01-28T22-24-33-019c067e-69e3-7c32-bb26-7e7f8cad603b.jsonl | 3 | {"timestamp":"2026-01-28T21:24:33.975Z","type":"response_item","payload":{"type":"message","role":"user","content":[{"type":"input_text","text":"# AGENTS.md instructions for /Users/petercowling/base-shop\n\n<INSTRUCTIONS>\n---\nType: Runbook\nStatus: Canonical\nDomain: Repo\nL... |
| ~/.codex/sessions/2026/01/28/rollout-2026-01-28T22-24-33-019c067e-69e3-7c32-bb26-7e7f8cad603b.jsonl | 7 | {"timestamp":"2026-01-28T21:24:33.976Z","type":"turn_context","payload":{"cwd":"/Users/petercowling/base-shop","approval_policy":"never","sandbox_policy":{"type":"read-only"},"model":"gpt-5.1-codex-mini","collaboration_mode":{"mode":"custom","model":"gpt-5.1-codex-mini","reaso... |

## How To Use

- Treat this as advisory context only.
- Keep canonical evidence links in fact-find/plan artifacts.
- If retrieval quality is low, refine the query and re-run.

