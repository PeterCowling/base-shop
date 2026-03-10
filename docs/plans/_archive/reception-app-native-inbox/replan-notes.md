---
Type: Notes
Status: Active
Domain: Platform
Feature-Slug: reception-app-native-inbox
Last-reviewed: 2026-03-06
Replan-round: 2
---

# Replan Notes: Reception App-Native Inbox

## Round 1 — 2026-03-06

### Scope

Targeted low-confidence IMPLEMENT tasks and their direct dependents:
- `TASK-09` draft pipeline port
- `TASK-05` Gmail-to-D1 sync
- `TASK-06` inbox API routes
- `TASK-07` inbox UI

### Evidence Used

- `packages/mcp-server/src/tools/draft-generate.ts`
  - Uses `fs/promises`, resource loaders, telemetry helpers, and reviewed-ledger helpers.
- `packages/mcp-server/src/tools/draft-quality-check.ts`
  - Reads template data from disk.
- `packages/mcp-server/src/resources/brikette-knowledge.ts`
  - Knowledge loading is file-backed and MCP-local.
- `packages/mcp-server/data/email-templates.json`
  - Source template set is materially larger than the original plan claimed.
- `apps/reception/src/components/appNav/OperationsModal.tsx`
  - Confirms modal-route navigation pattern for inbox entry.
- `apps/reception/src/App.tsx`
  - Confirms auth is enforced by the app wrapper, not a route-group boundary.

### Replan Decisions

- Added `TASK-10` as an `INVESTIGATE` precursor for `TASK-09`.
  - Reason: the draft pipeline port cannot be promoted safely until the extraction map and parity-fixture contract are explicit.
- Added `TASK-11` as a `SPIKE` precursor for `TASK-05`.
  - Reason: sync depends on real Gmail `historyId` semantics and stale-checkpoint behavior, which should not be discovered during implementation.
- Added `TASK-12` as an `INVESTIGATE` precursor for `TASK-07`.
  - Reason: UI implementation should not absorb unresolved state/design decisions after the API contract is known.
- Left `TASK-06` as blocked by upstream evidence rather than creating another precursor.
  - Reason: its uncertainty is derivative of `TASK-05`, not an independent unknown.

### Confidence Effects

- `TASK-09` remains `65%`.
  - Promotion path: `TASK-10` must complete first.
- `TASK-05` remains `70%`.
  - Promotion path: `TASK-11` plus `TASK-04` checkpoint evidence.
- `TASK-06` remains `75%`.
  - Promotion path: complete `TASK-05` and lock the sync/data contract.
- `TASK-07` remains `70%`.
  - Promotion path: complete `TASK-12` against the final `TASK-06` contract.

### Result

Plan readiness is now **Partially ready**.

Runnable now:
- `TASK-01`
- `TASK-02`
- `TASK-03`
- `TASK-08`
- `TASK-10`

Blocked pending precursor evidence:
- `TASK-09`
- `TASK-05`
- `TASK-06`
- `TASK-07`

## Round 2 — 2026-03-06

### Scope

Targeted `TASK-09` only.

Reason:
- `TASK-09` is above the confidence floor at `85%`, but it is too broad for one `/lp-do-build` cycle and conflicts with the repo's atomic-task workflow.

### Evidence Used

- `docs/plans/reception-app-native-inbox/draft-pipeline-port-map.md`
  - The extraction map already names the module boundary, data-pack boundary, and parity fixture corpus for the draft port.
- `packages/mcp-server/src/tools/draft-generate.ts`
  - `1921` lines; still mixes generation logic with file I/O, telemetry, reviewed-ledger writes, and tool-wrapper behavior.
- `packages/mcp-server/src/tools/draft-quality-check.ts`
  - `583` lines; depends on template-file reads and helper modules that should be ported independently of final orchestration.
- `packages/mcp-server/src/tools/draft-interpret.ts`
  - `1091` lines; deterministic and self-contained enough to stand as its own port unit.
- `packages/mcp-server/src/utils/template-ranker.ts`
  - `457` lines; helper extraction is large enough to deserve an explicit task before generation/quality consumers are wired.
- `packages/mcp-server/src/__tests__/draft-pipeline.integration.test.ts`
  - Confirms the fixture surface for `SGL-01`, `SGL-04`, `MLT-01`.
- `packages/mcp-server/src/__tests__/pipeline-integration.test.ts`
  - Confirms the fixture surface for `PP-01`, `IT-01`.

### Replan Decisions

- Split the old monolithic `TASK-09` implementation scope into five explicit precursor units:
  - `TASK-13` — reception data pack + loader modules
  - `TASK-14` — deterministic interpret core port
  - `TASK-15` — generation helpers + policy layer port
  - `TASK-16` — generation core port
  - `TASK-17` — quality-check core + fixture corpus
- Narrowed `TASK-09` to the final assembly step:
  - compose `draft-pipeline.server.ts`
  - wire the reception-local draft-core modules together
  - prove parity on the selected fixture corpus
- Preserved stable task IDs:
  - existing `TASK-09` kept
  - new tasks allocated as `TASK-13` through `TASK-17`

### Confidence Effects

- `TASK-13` enters at `85%`.
  - Reason: data assets and loader replacements are explicit in the port map.
- `TASK-14` enters at `85%`.
  - Reason: interpret logic is deterministic and already isolated from Gmail/runtime concerns.
- `TASK-15` enters at `80%`.
  - Reason: helper extraction is bounded but still spans BM25 ranking, coverage, HTML/signature rendering, and policy helpers.
- `TASK-16` enters at `80%`.
  - Reason: generation core is still substantial, but it is safer once data/loaders and helper layers are already extracted.
- `TASK-17` enters at `80%`.
  - Reason: quality checks are bounded once template access and helper imports are reception-local.
- `TASK-09` stays at `85%`, but becomes smaller and blocked by explicit implementation predecessors instead of hiding all work in one task body.

### Result

Plan readiness remains **Partially ready**.

Runnable now:
- `TASK-13`
- `TASK-14`
- `TASK-15`

Blocked pending precursor completion:
- `TASK-16`
- `TASK-17`
- `TASK-09`
- `TASK-05`
- `TASK-06`
- `TASK-07`
