# Business OS (Read-Only Mirror)

Business OS uses D1 as the canonical store for cards, ideas, and stage docs. This directory is an exported markdown mirror used for review and audit via PRs.

## Source of Truth

- Cards, ideas, and stage docs live in D1.
- Markdown under `docs/business-os/cards/` and `docs/business-os/ideas/` is read-only and exported.
- Use the Business OS UI or the agent API (`/api/agent/*`) for creates/updates.
- Agent skills fail-closed if the API is unavailable (no markdown writes).

## Repo-Native Documents

The following remain repo-native and can be edited via their skills:
- `docs/business-os/strategy/`
- `docs/business-os/people/`
- `docs/business-os/scans/`

## Export Workflow

An export job snapshots D1 to markdown and opens PRs. CI guardrails reject manual edits to exported card/idea/stage-doc paths.
