---
Type: Runbook
Status: Canonical
Domain: Repo
Last-reviewed: 2026-02-01
---

# Claude Coding Assistant Guide

Short Claude-specific guidance for Base-Shop. For universal rules and commands, see `AGENTS.md`.
For repo layout, invariants, and doc pointers, see `PROJECT_DIGEST.md`.

## Project Snapshot

Base-Shop is a multilingual, hybrid-rendered e-commerce platform built with Next.js 15 and React 19.
Monorepo: Turborepo + pnpm workspaces.

### Key Technologies
- Next.js 15 (App Router), React 19
- TypeScript, Prisma, PostgreSQL
- Tailwind CSS 4
- Jest, Cypress, Playwright
- Cloudflare Pages

## Model Usage Policy

Always use **sonnet** as the default model for all sub-agents and delegated tasks.
If a task appears too complex for sonnet (multi-package architecture, deep reasoning, or subtle concurrency),
pause and ask the user before escalating.

## Workflow

Feature flow: `/fact-find` → `/plan-feature` → `/build-feature` → `/re-plan` (if confidence <80%).
Workflow entrypoint (progressive disclosure): `docs/agents/feature-workflow-guide.md`.

## Type Intelligence (MCP)

When asked to “check types” or “check TypeScript errors,” use the MCP TypeScript language tools first (fast, on-demand). See `docs/ide/agent-language-intelligence-guide.md` for setup and scripts. `pnpm typecheck && pnpm lint` remains the final validation gate before pushing (and CI re-enforces it before merge).

Prompt template to enforce MCP usage: see `docs/ide/type-check-sop.md`.

## Deep Dives

- Architecture and layering: `docs/architecture.md`
- Plan schema: `docs/AGENTS.docs.md`
- Testing policy: `docs/testing-policy.md`

---

**Previous version:** `docs/historical/CLAUDE-2026-01-17-pre-ralph.md`
