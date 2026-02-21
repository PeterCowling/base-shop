# BOS API Payload Shapes (Shared)

Canonical payload references for skills integrating with Business OS API.

## Source of Truth

- Card payloads: `./card-operations.md`
- Stage-doc payloads: `./stage-doc-operations.md`

## Common Plan-Stage Shapes

### Upsert plan stage doc

- `stage`: `plan`
- `content`: markdown body only (no frontmatter)
- include plan reference and task summary snapshot

### Patch card plan link

- use optimistic concurrency (`baseEntitySha`)
- patch includes:
  - `Plan-Link: docs/plans/<feature-slug>/plan.md`

### Lane transition patch (when eligible)

- set `Lane: Planned`
- set `Last-Progress: YYYY-MM-DD`

## Common Build-Stage Shapes

### Ensure build stage doc

- `stage`: `build`
- `content`: markdown body only (progress tracker/build log)

### Progress patch during execution

- card patch uses optimistic concurrency
- patch includes:
  - `Last-Progress: YYYY-MM-DD`

### Completion lane transition

- patch includes:
  - `Lane: Done`
  - `Last-Progress: YYYY-MM-DD`

For exact request/response examples, use the source-of-truth docs above.
