Type: Plan
Status: Active
Domain: Commerce
Last-reviewed: 2026-01-07
Relates-to charter: docs/commerce-charter.md

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
products/
  bag-001/                       # sample product schema/rules/pricing
```

## Local development

- API: `pnpm --filter @apps/handbag-configurator-api dev` (default `http://localhost:3017`)
- Web: `pnpm --filter @apps/handbag-configurator dev` (default `http://localhost:3016`)

The web scaffold fetches the sample schema from:

- `GET http://localhost:3017/config/schema?productId=bag-001`

Override the API origin for the web app with:

- `HANDBAG_CONFIGURATOR_API_ORIGIN=http://localhost:3017`

## Data contracts (implemented)

Shared package: `packages/product-configurator`

- `SelectionState`
- `ProductConfigSchema`
- `ValidateResponse`
- Zod runtime validators:
  - `selectionStateSchema`
  - `productConfigSchemaSchema`
  - `validateResponseSchema`

Sample product data: `products/bag-001`

- `products/bag-001/config.schema.json` (matches `ProductConfigSchema`)
- `products/bag-001/rules.json` (v1 rules placeholder)
- `products/bag-001/pricing.json`
- `products/bag-001/manufacturing.map.json`
- `products/bag-001/budgets.json`

## GLB conventions (assumed)

Hotspot anchors (empty nodes):

- `hs_body`, `hs_handle`, `hs_hardware`, `hs_lining`, `hs_personalization`

Focus targets (optional but recommended):

- `focus_body`, `focus_handle`, `focus_hardware`, `focus_lining`, `focus_personalization`

Configurable mesh naming (recommended):

- `Body_*`, `Handle_*`, `Hardware_*`, `Lining_*`

## Active tasks

### **COM-PCONF-01 — Foundations (scaffold + shared contracts)**
- Status: ☑
- Scope:
  - Add `apps/handbag-configurator` (Next scaffold).
  - Add `apps/handbag-configurator-api` (schema/validate/price/buildPacket endpoints scaffold).
  - Add `packages/product-configurator` with typed contracts + Zod.
  - Add sample product `products/bag-001` JSON files.
- Definition of done:
  - Web page renders and shows schema JSON for `bag-001`.

### **COM-PCONF-02 — Viewer baseline (GLB loading + KTX2)**
- Status: ☑
- Scope:
  - R3F canvas + renderer config (color management + tone mapping).
  - Tiered GLB loading (`mobile.glb` default; desktop via “HD Preview” toggle).
  - KTX2 loader + optional meshopt decoder; graceful extension fallback.
- Dependencies:
  - Real assets added under `products/bag-001/assets/*`.
- Definition of done:
  - Mobile/desktop tiers swap correctly and render without console errors.

### **COM-PCONF-03 — Mode state machine + UI shell**
- Status: ☑
- Scope:
  - Zustand mode store: `showroom | explore | configure` and transitions.
  - Shell UI (price + config name + CTAs).
  - Configure panel overlay; configure suppresses hotspots; long-press enters explore.
- Definition of done:
  - Mode transitions and hotspot suppression match the UX rules.

### **COM-PCONF-04 — Hotspots (anchors + occlusion + density limits)**
- Status: ☑
- Scope:
  - Read anchors from GLTF; project to screen each frame; occlusion via raycast.
  - Max 6 visible hotspots with relevance sorting.
  - Click hotspot: camera ease to focus target + label.
- Definition of done:
  - Hotspots appear only in explore; never exceed 6; occlusion works.

### **COM-PCONF-05 — Camera controls (soft limits + collision-safe zoom)**
- Status: ☑
- Scope:
  - Orbit controls with soft-clamp limits (no underside).
  - Collision-safe zoom via raycast against proxy/bounds.
  - View-state constraints (exterior vs interior later).
- Definition of done:
  - No clipping; limits feel smooth.

### **COM-PCONF-06 — Lighting rig + lookdev route**
- Status: ☑
- Scope:
  - HDRI environment + subtle camera-relative key light.
  - `/lookdev` page with golden-scene settings shared with viewer.
- Definition of done:
  - Highlights remain readable during rotation; lookdev matches main settings.

### **COM-PCONF-07 — Backend rules engine (v1)**
- Status: ☑
- Scope:
  - Replace scaffold validation with rule-aware validation from `products/<id>/rules.json`.
  - Implement allowed-domains delta computation.
  - Add unit tests for the rules engine.
- Definition of done:
  - Invalid combos return premium messages; valid combos normalize + price + map.

### **COM-PCONF-08 — Budget checker tooling**
- Status: ☑
- Scope:
  - Add a GLB budget checker CLI and CI hook (triangles/materials/textures/memory).
  - Compare against `products/<id>/budgets.json` per tier.
- Definition of done:
  - `pnpm budgets:check` fails with non-zero exit when budgets are exceeded.

## Code entrypoints (scaffold)

- Web: `apps/handbag-configurator/src/app/page.tsx`
- API: `apps/handbag-configurator-api/src/server.ts`
- Shared contracts: `packages/product-configurator/src/types.ts`
- Sample schema: `products/bag-001/config.schema.json`

## Codex-ready prompts (repo-aligned)

### Prompt 1 — Foundations already scaffolded
Confirm `apps/handbag-configurator` and `apps/handbag-configurator-api` still run and that `bag-001` schema renders on the web page. Deliverables: `pnpm --filter @apps/handbag-configurator dev` and `pnpm --filter @apps/handbag-configurator-api dev` work locally and the schema JSON prints.

### Prompt 2+ — Follow the epics above
When implementing epics B–H, use the same file structure as the original plan but rooted at:

- Web: `apps/handbag-configurator/src/**`
- API: `apps/handbag-configurator-api/src/**`
