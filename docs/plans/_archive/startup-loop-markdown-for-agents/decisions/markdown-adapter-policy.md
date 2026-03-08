---
Type: ADR
Status: Accepted
Domain: Infrastructure
Created: 2026-02-13
Last-updated: 2026-02-14
Related-Plan: docs/plans/startup-loop-markdown-for-agents/plan.md
---

# Markdown Adapter Policy

## Decision
Adopt a Cloudflare-first markdown adapter for startup-loop standing refresh collection. Non-Cloudflare fallback providers are explicitly deferred to a later increment.

## Context
- Startup-loop requires deterministic, replayable source artifacts for standing refresh decisions.
- Cloudflare Markdown for Agents supports `Accept: text/markdown` and `/markdown` suffix behavior for Cloudflare-served origins.
- This wave prioritizes bounded scope and reversible rollout over multi-provider breadth.

## Chosen Option
- Use `loop_content_sources_collect` to fetch markdown via Cloudflare markdown semantics.
- Persist source artifacts under run-scoped paths (`collectors/content/`).
- Return structured classifications for unavailable or contract-mismatch responses:
  - `MARKDOWN_UNAVAILABLE`
  - `MARKDOWN_CONTRACT_MISMATCH`

## Rejected Option
- Implement Cloudflare plus AI Gateway Browser Rendering fallback in the same wave.
- Reason: increased blast radius and lower confidence for single-wave delivery.

## Guardrails
- Source list is explicit per request and only persisted as run artifacts.
- No partial artifact writes on classified fetch failure.
- Pack evidence only references persisted artifacts, never transient fetch responses.

## Promotion Criteria For Fallback
- At least one business requires non-Cloudflare domain coverage for standing refresh.
- Existing quality/coverage metrics show recurring `MARKDOWN_UNAVAILABLE` due to non-Cloudflare origins.
- Add a second adapter behind the same `content.source.v1` contract and prove parity in integration tests.
