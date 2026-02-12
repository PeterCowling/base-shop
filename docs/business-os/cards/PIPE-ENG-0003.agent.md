---
Type: Card
Lane: Planned
Priority: P1
Owner: Pete
ID: PIPE-ENG-0003
Title: Handbag Configurator
Business: PIPE
Tags:
  - plan-migration
  - commerce
Created: 2026-01-07T00:00:00.000Z
Updated: 2026-01-07T00:00:00.000Z
Status: Active
Last-updated: 2026-02-05
---
# Handbag Configurator

**Source:** Migrated from `handbag-configurator-implementation-plan.md`


# Handbag Configurator — Implementation Plan (Repo‑Aligned)

This document adapts the original “handbag-configurator” plan to the existing Base‑Shop pnpm/turbo monorepo. Base‑Shop already provides workspace tooling (pnpm workspaces, Turbo, shared TS configs, lint, test), so the “create a new monorepo” step becomes “add new workspaces inside this repo”.

## Repo alignment notes (what changed vs the original plan)

- **No nested monorepo.** The configurator lives as normal workspaces under Base‑Shop: `apps/*`, `packages/*`, plus a new top-level `products/*` folder.
- **App naming avoids collisions.** Base‑Shop already has `apps/api` (Cloudflare worker routes). This plan uses `apps/handbag-configurator-api` for the Node API service.
- **Ports follow repo conventions.** Web runs on `3016`, API runs on `3017` by default (see `docs/dev-ports.md`).
- **Dev commands are filter-first.** Use `pnpm --filter ... dev` instead of `pnpm dev` (which starts many workspaces in this monorepo).

## Workspace layout (current state)

```text
apps/
  handbag-configurator/          # Next.js UI (scaffold)
  handbag-configurator-api/      # Node HTTP API (scaffold)
packages/
  product-configurator/          # shared TS contracts + Zod schemas

[... see full plan in docs/plans/handbag-configurator-implementation-plan.md]
