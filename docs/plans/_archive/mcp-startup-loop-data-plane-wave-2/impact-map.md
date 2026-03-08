---
Type: Analysis
Status: Complete
Created: 2026-02-13
Last-updated: 2026-02-13
Feature-Slug: mcp-startup-loop-data-plane-wave-2
Task-ID: TASK-02
---

# Wave-2 Impact Map

## Scope
This map identifies the concrete blast radius for wave-2 MCP data-plane work and the current consumer paths that must migrate to canonical `measure_*`/`app_*`/`pack_*` surfaces.

## Current MCP Surface Inventory

### Base MCP (`@acme/mcp-server`)
- Registry/dispatch: `packages/mcp-server/src/tools/index.ts`
- Startup-loop read/status tools: `packages/mcp-server/src/tools/loop.ts`
- BOS guarded tools: `packages/mcp-server/src/tools/bos.ts`
- Existing analytics tools (legacy startup-loop source path): `packages/mcp-server/src/tools/analytics.ts`

### Cloudflare MCP (`@acme/mcp-cloudflare`)
- Registry/dispatch: `packages/mcp-cloudflare/src/tools/index.ts`
- Cloudflare analytics source tools: `packages/mcp-cloudflare/src/tools/analytics.ts`

## Startup-Loop Contract and Artifact Dependencies

### Artifact Contracts (read-side dependencies)
- Manifest contract: `docs/business-os/startup-loop/manifest-schema.md`
- Stage result contract: `docs/business-os/startup-loop/stage-result-schema.md`
- Event/state contract: `docs/business-os/startup-loop/event-state-schema.md`

### Runtime Kernels (reusable compute)
- S10 growth accounting: `scripts/src/startup-loop/s10-growth-accounting.ts`
- S10 diagnosis integration: `scripts/src/startup-loop/s10-diagnosis-integration.ts`
- Metrics aggregate guardrails: `scripts/src/startup-loop/metrics-aggregate.ts`
- Replan trigger lifecycle: `scripts/src/startup-loop/replan-trigger.ts`

### Guarded Write Boundary
- BOS card route with optimistic concurrency: `apps/business-os/src/app/api/agent/cards/[id]/route.ts`
- BOS stage-doc route with optimistic concurrency: `apps/business-os/src/app/api/agent/stage-docs/[cardId]/[stage]/route.ts`

## Consumer and Migration Matrix

| Consumer area | Current source/tool | Wave-2 target | Migration risk | Owner |
|---|---|---|---|---|
| Startup-loop skill prompts and operators | `analytics_*` and ad-hoc refresh docs | `measure_*` + `app_*` + `pack_*` | Medium (tool contract drift) | PLAT |
| Weekly S10 assembly | Script outputs + manual stitching | `pack_weekly_s10_build` | Medium (artifact completeness) | PLAT |
| Cloudflare telemetry consumption | `@acme/mcp-cloudflare` analytics tools | `measure_*` adapter wrapping Cloudflare | Medium-High (testing gap) | PLAT |
| BOS stage decisions and guarded mutations | `bos_*` tools/API routes | unchanged authority, reused by `exp_*`/`ops_*` | Low-Medium (policy strictness) | BOS/PLAT |
| Refresh orchestration | reminder workflows, manual collectors | `refresh_status_*` + guarded `refresh_enqueue_*` | Medium (state machine correctness) | PLAT |

## `analytics_*` Containment and Sunset Prerequisites
- Existing startup-loop-adjacent analytics entrypoints:
  - `analytics_aggregates`
  - `analytics_events`
  - `analytics_summary`
- Sunset preconditions (from fact-find):
  - `measure_*` covers startup-loop metrics for 2 consecutive weekly S10 runs.
  - startup-loop callers are blocked from direct `analytics_*` use within 14 days after trigger.

## Cross-Package Test and Validation Impact

### Existing suites to extend
- Policy gates: `packages/mcp-server/src/__tests__/tool-policy-gates.test.ts`
- Startup-loop integration: `packages/mcp-server/src/__tests__/startup-loop-tools.integration.test.ts`
- S10 deterministic kernel: `scripts/src/startup-loop/__tests__/s10-growth-accounting.test.ts`

### Required additions
- Shared wave-2 contract tests (registry/provenance/redaction/enqueue/anomaly).
- Cloudflare package-local tests in `packages/mcp-cloudflare/src/__tests__/`.
- Adapter contract tests in `packages/mcp-server` covering Cloudflare mapping.

## Affected Areas by Planned Task

| Task | Primary change areas |
|---|---|
| TASK-03 | `packages/mcp-server/src/tools/index.ts`, `packages/mcp-server/src/tools/policy.ts`, new shared contract helpers in `packages/mcp-server/src/lib/` |
| TASK-04 | new tool handlers in `packages/mcp-server/src/tools/`, integration fixtures/tests |
| TASK-06 | refresh/anomaly handlers in `packages/mcp-server/src/tools/loop.ts` (or adjacent wave-2 module), policy contracts/tests |
| TASK-07 | `packages/mcp-server/src/tools/analytics.ts`, `packages/mcp-cloudflare/src/tools/index.ts`, Cloudflare adapter and test suites |
| TASK-08 | `packages/mcp-server/src/tools/bos.ts` plus BOS-contract integration tests |

## Blocking Unknowns Converted to Explicit Gates
- Credential/tenancy model remains a hard decision gate (TASK-01).
- Cloudflare test baseline is mandatory before broad source rollout (TASK-07 acceptance gate).
- Jest haste collisions from `.open-next`, `.worktrees`, `.ts-jest` require constrained runner config during validation.

## Validation Evidence Collected During Mapping
- Registry and dispatch structure confirmed via:
  - `packages/mcp-server/src/tools/index.ts`
  - `packages/mcp-cloudflare/src/tools/index.ts`
- Artifact contract boundaries confirmed via:
  - `docs/business-os/startup-loop/manifest-schema.md`
  - `docs/business-os/startup-loop/stage-result-schema.md`
  - `docs/business-os/startup-loop/event-state-schema.md`
- Tool/test readiness signal confirmed via targeted tests:
  - PASS `scripts/src/startup-loop/__tests__/s10-growth-accounting.test.ts`
  - PASS `packages/mcp-server/src/__tests__/tool-policy-gates.test.ts`

