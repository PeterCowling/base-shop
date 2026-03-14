---
Type: Startup-Loop-CASS-Context
Status: Active
Mode: plan
Generated: 2026-03-12T19:29:19.130Z
Provider: cass
Slug: brikette-email-reply-reliability
---

# CASS Context Pack

- Query: startup loop plan; feature slug brikette-email-reply-reliability; topic Brikette guest email reply reliability: stuck emails, duplicate sends, AI overconfidence; prior evidence, reusable decisions, blockers, mitigations
- Top-K target: 8
- Source roots: docs/plans, docs/business-os/startup-loop, .claude/skills, docs/business-os/strategy
- Provider used: cass

## Retrieval Warnings

- CASS_RETRIEVE_COMMAND is not configured; using built-in CASS session-history provider. Set CASS_RETRIEVE_COMMAND to use an external CASS backend.

## CASS Output

### Built-in CASS Provider (session-history retrieval)
- query: startup loop plan; feature slug brikette-email-reply-reliability; topic Brikette guest email reply reliability: stuck emails, duplicate sends, AI overconfidence; prior evidence, reusable decisions, blockers, mitigations
- roots: ~/.claude/projects, ~/.codex/sessions
- hits: 8

| Session File | Line | Snippet |
|---|---:|---|
| ~/.codex/sessions/2026/01/28/rollout-2026-01-28T22-24-33-019c067e-69e3-7c32-bb26-7e7f8cad603b.jsonl | 3 | {"timestamp":"2026-01-28T21:24:33.975Z","type":"response_item","payload":{"type":"message","role":"user","content":[{"type":"input_text","text":"# AGENTS.md instructions for /Users/petercowling/base-shop\n\n<INSTRUCTIONS>\n---\nType: Runbook\nStatus: Canonical\nDomain: Repo\nL... |
| ~/.codex/sessions/2026/01/28/rollout-2026-01-28T22-24-33-019c067e-69e3-7c32-bb26-7e7f8cad603b.jsonl | 7 | {"timestamp":"2026-01-28T21:24:33.976Z","type":"turn_context","payload":{"cwd":"/Users/petercowling/base-shop","approval_policy":"never","sandbox_policy":{"type":"read-only"},"model":"gpt-5.1-codex-mini","collaboration_mode":{"mode":"custom","model":"gpt-5.1-codex-mini","reaso... |
| ~/.codex/sessions/2026/01/25/rollout-2026-01-25T18-41-25-019bf63f-0d45-75e0-8ce3-f92d4ad9f958.jsonl | 3 | {"timestamp":"2026-01-25T17:41:25.976Z","type":"response_item","payload":{"type":"message","role":"user","content":[{"type":"input_text","text":"# AGENTS.md instructions for /Users/petercowling/base-shop\n\n<INSTRUCTIONS>\n---\nType: Runbook\nStatus: Canonical\nDomain: Repo\nL... |
| ~/.codex/sessions/2026/01/25/rollout-2026-01-25T18-41-25-019bf63f-0d45-75e0-8ce3-f92d4ad9f958.jsonl | 7 | {"timestamp":"2026-01-25T17:41:25.979Z","type":"turn_context","payload":{"cwd":"/Users/petercowling/base-shop","approval_policy":"never","sandbox_policy":{"type":"read-only"},"model":"gpt-5.1-codex-mini","collaboration_mode":{"mode":"custom","model":"gpt-5.1-codex-mini","reaso... |
| ~/.codex/sessions/2026/01/12/rollout-2026-01-12T07-12-49-019bb0d5-f201-78e0-a08d-aaf11a30682d.jsonl | 4 | {"timestamp":"2026-01-12T06:12:49.816Z","type":"response_item","payload":{"type":"message","role":"user","content":[{"type":"input_text","text":"# Context from my IDE setup:\n\n## Active file: apps/brikette/src/routes/experiences/components/CtaSection.tsx\n\n## Open tabs:\n- C... |
| ~/.codex/sessions/2026/01/12/rollout-2026-01-12T07-12-49-019bb0d5-f201-78e0-a08d-aaf11a30682d.jsonl | 5 | {"timestamp":"2026-01-12T06:12:49.816Z","type":"event_msg","payload":{"type":"user_message","message":"# Context from my IDE setup:\n\n## Active file: apps/brikette/src/routes/experiences/components/CtaSection.tsx\n\n## Open tabs:\n- CtaSection.tsx: apps/brikette/src/routes/ex... |
| ~/.codex/sessions/2026/01/12/rollout-2026-01-12T07-12-49-019bb0d5-f201-78e0-a08d-aaf11a30682d.jsonl | 17 | {"timestamp":"2026-01-12T06:12:52.617Z","type":"response_item","payload":{"type":"function_call","name":"shell_command","arguments":"{\"command\":\"ls apps/brikette\",\"workdir\":\"/Users/petercowling/base-shop\"}","call_id":"call_DgvJ9T81X68oagUi7QoWmpPJ"}} |
| ~/.codex/sessions/2026/01/12/rollout-2026-01-12T07-12-49-019bb0d5-f201-78e0-a08d-aaf11a30682d.jsonl | 24 | {"timestamp":"2026-01-12T06:12:54.071Z","type":"response_item","payload":{"type":"function_call","name":"shell_command","arguments":"{\"command\":\"cat package.json\",\"workdir\":\"/Users/petercowling/base-shop/apps/brikette\"}","call_id":"call_n0m0M3TbHLLKn1CrkVF3h8Fr"}} |

## How To Use

- Treat this as advisory context only.
- Keep canonical evidence links in fact-find/plan artifacts.
- If retrieval quality is low, refine the query and re-run.

