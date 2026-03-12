---
Type: Startup-Loop-CASS-Context
Status: Active
Mode: fact-find
Generated: 2026-03-12T10:13:18.164Z
Provider: cass
Slug: do-workflow-context-bloat-tracking
---

# CASS Context Pack

- Query: startup loop fact-find; feature slug do-workflow-context-bloat-tracking; topic per-module context size tracking in workflow telemetry; prior evidence, reusable decisions, blockers, mitigations
- Top-K target: 8
- Source roots: docs/plans, docs/business-os/startup-loop, .claude/skills, docs/business-os/strategy
- Provider used: cass

## Retrieval Warnings

- CASS_RETRIEVE_COMMAND is not configured; using built-in CASS session-history provider. Set CASS_RETRIEVE_COMMAND to use an external CASS backend.

## CASS Output

### Built-in CASS Provider (session-history retrieval)
- query: startup loop fact-find; feature slug do-workflow-context-bloat-tracking; topic per-module context size tracking in workflow telemetry; prior evidence, reusable decisions, blockers, mitigations
- roots: ~/.claude/projects, ~/.codex/sessions
- hits: 8

| Session File | Line | Snippet |
|---|---:|---|
| ~/.codex/sessions/2025/10/01/rollout-2025-10-01T12-12-33-01999f42-66c1-72a1-b1c7-14cac28a12f8.jsonl | 1 | {"timestamp":"2025-10-01T10:12:33.124Z","type":"session_meta","payload":{"id":"01999f42-66c1-72a1-b1c7-14cac28a12f8","timestamp":"2025-10-01T10:12:33.090Z","cwd":"/Users/petercowling/brikette2025v2","originator":"codex_vscode","cli_version":"0.42.0-alpha.3","instructions":"<!-... |
| ~/.codex/sessions/2025/10/01/rollout-2025-10-01T12-12-33-01999f42-66c1-72a1-b1c7-14cac28a12f8.jsonl | 2 | {"timestamp":"2025-10-01T10:12:33.124Z","type":"response_item","payload":{"type":"message","role":"user","content":[{"type":"input_text","text":"<user_instructions>\n\n<!-- /AGENTS.md -->\n\n# Agents Overview & Machine Index\n\nA **series of machine‑readable files** for toolin... |
| ~/.codex/sessions/2025/10/01/rollout-2025-10-01T12-12-33-01999f42-66c1-72a1-b1c7-14cac28a12f8.jsonl | 3 | {"timestamp":"2025-10-01T10:12:33.124Z","type":"response_item","payload":{"type":"message","role":"user","content":[{"type":"input_text","text":"<environment_context>\n <cwd>/Users/petercowling/brikette2025v2</cwd>\n <approval_policy>on-request</approval_policy>\n <sandbox_mod... |
| ~/.codex/sessions/2025/10/01/rollout-2025-10-01T12-12-33-01999f42-66c1-72a1-b1c7-14cac28a12f8.jsonl | 4 | {"timestamp":"2025-10-01T10:12:33.124Z","type":"response_item","payload":{"type":"message","role":"user","content":[{"type":"input_text","text":"<environment_context>\n <cwd>/Users/petercowling/brikette2025v2</cwd>\n <approval_policy>on-request</approval_policy>\n <sandbox_mod... |
| ~/.codex/sessions/2025/10/01/rollout-2025-10-01T12-12-33-01999f42-66c1-72a1-b1c7-14cac28a12f8.jsonl | 7 | {"timestamp":"2025-10-01T10:12:33.124Z","type":"turn_context","payload":{"cwd":"/Users/petercowling/brikette2025v2","approval_policy":"on-request","sandbox_policy":{"mode":"workspace-write","writable_roots":["/Users/petercowling/brikette2025v2"],"network_access":false,"exclude... |
| ~/.codex/sessions/2025/10/01/rollout-2025-10-01T12-12-33-01999f42-66c1-72a1-b1c7-14cac28a12f8.jsonl | 8 | {"timestamp":"2025-10-01T10:12:33.653Z","type":"event_msg","payload":{"type":"token_count","info":null,"rate_limits":{"primary":{"used_percent":1.0,"window_minutes":299,"resets_in_seconds":10494},"secondary":{"used_percent":0.0,"window_minutes":10079,"resets_in_seconds":597294... |
| ~/.codex/sessions/2025/10/01/rollout-2025-10-01T12-12-33-01999f42-66c1-72a1-b1c7-14cac28a12f8.jsonl | 12 | {"timestamp":"2025-10-01T10:12:42.021Z","type":"event_msg","payload":{"type":"token_count","info":{"total_token_usage":{"input_tokens":9000,"cached_input_tokens":8832,"output_tokens":343,"reasoning_output_tokens":256,"total_tokens":9343},"last_token_usage":{"input_tokens":9000... |
| ~/.codex/sessions/2025/10/01/rollout-2025-10-01T12-12-33-01999f42-66c1-72a1-b1c7-14cac28a12f8.jsonl | 15 | {"timestamp":"2025-10-01T10:12:42.022Z","type":"response_item","payload":{"type":"function_call","name":"shell","arguments":"{\"command\":[\"bash\",\"-lc\",\"rg -n \\\"octorate\|booking\|checkout\|voucher\|coupon\|promo\|discount\|wrangler\|cloudflare\\\" -S --hidden --glob '!node_mod... |

## How To Use

- Treat this as advisory context only.
- Keep canonical evidence links in fact-find/plan artifacts.
- If retrieval quality is low, refine the query and re-run.

