Type: Contract
Status: Canonical
Domain: Product-Pipeline
Last-reviewed: 2025-12-26

Canonical code:
- apps/product-pipeline/src/app/**
- apps/product-pipeline/src/routes/api/**
- apps/product-pipeline/scripts/runner.ts
- apps/product-pipeline/migrations/**
- packages/pipeline-engine/**

# Product Pipeline Contract

If behaviour in this doc contradicts the code, treat the code as canonical and update this doc as a follow‑up.

This contract describes the currently implemented Product Pipeline system: its deployment topology, storage, API surfaces, and stage model.

## Topology

- UI: Next.js app at `apps/product-pipeline/src/app/**`.
- Worker API: route handlers at `apps/product-pipeline/src/routes/api/**`.
- Storage/bindings:
  - D1: `PIPELINE_DB` (`apps/product-pipeline/wrangler.toml`)
  - R2 evidence: `PIPELINE_EVIDENCE` (`apps/product-pipeline/wrangler.toml`)
  - Queue: `PIPELINE_QUEUE` producer binding (`apps/product-pipeline/wrangler.toml`)

## Stage model (API surfaces)

Stage endpoints live under `apps/product-pipeline/src/routes/api/stages/**`.

The current stage set includes (non-exhaustive; treat code as truth):

- `P`: triage + dedupe + promotion budgets (`apps/product-pipeline/src/routes/api/stages/p/run.ts`)
- `M`: evidence capture enqueue + runner/queue worker integration (`apps/product-pipeline/src/routes/api/stages/m/queue.ts`, plus runner routes below)
- `A/B/C/D/K/N/R/S`: additional pipeline stages (`apps/product-pipeline/src/routes/api/stages/*/run.ts`)
- `K` lane comparison helpers: `apps/product-pipeline/src/routes/api/stages/k/compare-lanes.ts`

## Runner contract (human-gated capture)

Runner routes live under `apps/product-pipeline/src/routes/api/runner/**`:

- `claim` / `complete`: claim and complete Stage M jobs.
- `status` / `ping`: runner liveness and status reporting.

The default runner implementation is the CLI script:

- `apps/product-pipeline/scripts/runner.ts`

## Artifacts and evidence

- Artifact upload/download APIs: `apps/product-pipeline/src/routes/api/artifacts/**`
- Evidence objects are stored in R2 (`PIPELINE_EVIDENCE`) and referenced from stage runs and (where applicable) logistics lanes.

## Logistics lanes (implemented)

Logistics lane CRUD is exposed via:

- `apps/product-pipeline/src/routes/api/logistics/lanes/**`
- `apps/product-pipeline/src/routes/api/logistics/lane-versions/**`
- Evidence upload for lanes: `apps/product-pipeline/src/routes/api/logistics/evidence/upload.ts`

Stage integration points include:

- Applying lanes for economics inputs in stage flows (see `apps/product-pipeline/src/routes/api/stages/**` and UI pages under `apps/product-pipeline/src/app/**`).

## Primary invariants

- All writes are auditable (stage runs and activity logs are persisted; evidence links are stable).
- Stage M acquisition is bounded and may be human-gated; it is not “crawl everything”.