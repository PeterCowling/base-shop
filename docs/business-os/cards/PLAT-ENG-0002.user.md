---
Type: Card
Lane: Done
Priority: P2
Owner: Pete
ID: PLAT-ENG-0002
Title: Agent Context Optimization Plan
Business: PLAT
Tags:
  - plan-migration
  - devex/tooling
Created: 2026-01-24T00:00:00.000Z
Updated: 2026-02-09T00:00:00.000Z
Status: Done
Last-updated: 2026-02-09
---
# Agent Context Optimization Plan

**Source:** Migrated from `agent-context-optimization-plan.md`


# Agent Context Optimization Plan

## Executive Summary

Reduce the fixed token cost of every Claude Code and Codex session by restructuring always-on context files. The current `.claude/config.json` loads ~2,032 lines across 8 files on every conversation start. This plan replaces that with a lean two-file always-on context (operational rules + a curated digest), while ensuring agents can still navigate the full documentation on demand.

## Current State

### Always-on context (`.claude/config.json` → `contextFiles`)

Measured on 2026-01-24 using four methods: `tiktoken` encodings (`cl100k_base`, `p50k_base`), Anthropic's legacy tokenizer (`@anthropic-ai/tokenizer` v0.0.4), and Anthropic's official heuristic (chars / 3.5).

| File | Chars | Codex (cl100k) | Claude legacy | Claude heuristic | Claude p50k |
|------|-------|----------------|---------------|------------------|-------------|
| CLAUDE.md | 6,525 | 1,639 | 1,894 | 1,864 | 2,023 |
| AGENTS.md | 9,506 | 2,356 | 2,621 | 2,716 | 2,781 |
| README.md | 17,112 | 4,010 | 4,612 | 4,889 | 5,003 |
| docs/architecture.md | 9,880 | 2,313 | 2,603 | 2,823 | 2,794 |
| docs/development.md | 6,437 | 1,620 | 1,776 | 1,839 | 1,938 |

[... see full plan in docs/plans/agent-context-optimization-plan.md]
