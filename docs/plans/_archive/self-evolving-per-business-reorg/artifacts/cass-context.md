---
Type: Startup-Loop-CASS-Context
Status: Active
Mode: fact-find
Generated: 2026-03-03T09:32:09.570Z
Provider: cass
Slug: self-evolving-per-business-reorg
---

# CASS Context Pack

- Query: startup loop fact-find; feature slug self-evolving-per-business-reorg; topic Restructure self-evolving/ from type-based to per-business directories; prior evidence, reusable decisions, blockers, mitigations
- Top-K target: 8
- Source roots: docs/plans, docs/business-os/startup-loop, .claude/skills, docs/business-os/strategy
- Provider used: cass

## Retrieval Warnings

- CASS_RETRIEVE_COMMAND is not configured; using built-in CASS session-history provider. Set CASS_RETRIEVE_COMMAND to use an external CASS backend.

## CASS Output

### Built-in CASS Provider (session-history retrieval)
- query: startup loop fact-find; feature slug self-evolving-per-business-reorg; topic Restructure self-evolving/ from type-based to per-business directories; prior evidence, reusable decisions, blockers, mitigations
- roots: ~/.claude/projects, ~/.codex/sessions
- hits: 8

| Session File | Line | Snippet |
|---|---:|---|
| ~/.codex/sessions/2026/02/25/rollout-2026-02-25T23-47-26-019c96fc-5961-7691-aa86-e3e2d85541fd.jsonl | 1 | {"timestamp":"2026-02-25T22:48:01.983Z","type":"session_meta","payload":{"id":"019c96fc-5961-7691-aa86-e3e2d85541fd","timestamp":"2026-02-25T22:47:26.305Z","cwd":"/Users/petercowling/base-shop","originator":"codex_vscode","cli_version":"0.104.0-alpha.1","source":"vscode","mode... |
| ~/.codex/sessions/2026/02/25/rollout-2026-02-25T23-47-26-019c96fc-5961-7691-aa86-e3e2d85541fd.jsonl | 2 | {"timestamp":"2026-02-25T22:48:01.985Z","type":"response_item","payload":{"type":"message","role":"developer","content":[{"type":"input_text","text":"<permissions instructions>\nFilesystem sandboxing defines which files can be read or written. `sandbox_mode` is `danger-full-ac... |
| ~/.codex/sessions/2026/02/25/rollout-2026-02-25T23-47-26-019c96fc-5961-7691-aa86-e3e2d85541fd.jsonl | 3 | {"timestamp":"2026-02-25T22:48:01.985Z","type":"response_item","payload":{"type":"message","role":"user","content":[{"type":"input_text","text":"# AGENTS.md instructions for /Users/petercowling/base-shop\n\n<INSTRUCTIONS>\n---\nType: Runbook\nStatus: Canonical\nDomain: Repo\nL... |
| ~/.codex/sessions/2026/02/25/rollout-2026-02-25T23-47-26-019c96fc-5961-7691-aa86-e3e2d85541fd.jsonl | 4 | {"timestamp":"2026-02-25T22:48:01.986Z","type":"response_item","payload":{"type":"message","role":"user","content":[{"type":"input_text","text":"<environment_context>\n <cwd>/Users/petercowling/base-shop</cwd>\n <shell>bash</shell>\n</environment_context>"}]}} |
| ~/.codex/sessions/2026/02/25/rollout-2026-02-25T23-47-26-019c96fc-5961-7691-aa86-e3e2d85541fd.jsonl | 5 | {"timestamp":"2026-02-25T22:48:01.986Z","type":"response_item","payload":{"type":"message","role":"developer","content":[{"type":"input_text","text":"<collaboration_mode># Collaboration Mode: Default\n\nYou are now in Default mode. Any previous instructions for other modes (e.... |
| ~/.codex/sessions/2026/02/25/rollout-2026-02-25T23-47-26-019c96fc-5961-7691-aa86-e3e2d85541fd.jsonl | 6 | {"timestamp":"2026-02-25T22:48:01.986Z","type":"event_msg","payload":{"type":"task_started","turn_id":"019c96fc-e44e-7a63-88aa-a1b0b1f3fb62","model_context_window":258400,"collaboration_mode_kind":"default"}} |
| ~/.codex/sessions/2026/02/25/rollout-2026-02-25T23-47-26-019c96fc-5961-7691-aa86-e3e2d85541fd.jsonl | 7 | {"timestamp":"2026-02-25T22:48:01.986Z","type":"response_item","payload":{"type":"message","role":"user","content":[{"type":"input_text","text":"commit and push any outstanding work. then check ci and fix any issues. repeat until done.\n"}]}} |
| ~/.codex/sessions/2026/02/25/rollout-2026-02-25T23-47-26-019c96fc-5961-7691-aa86-e3e2d85541fd.jsonl | 8 | {"timestamp":"2026-02-25T22:48:01.987Z","type":"event_msg","payload":{"type":"user_message","message":"commit and push any outstanding work. then check ci and fix any issues. repeat until done.\n","images":[],"local_images":[],"text_elements":[]}} |

## How To Use

- Treat this as advisory context only.
- Keep canonical evidence links in fact-find/plan artifacts.
- If retrieval quality is low, refine the query and re-run.

