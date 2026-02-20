# Fact-Find Business OS Integration Contract

Use this shared contract for `/lp-do-fact-find` Business OS writes.

## Scope

Applies when:
- brief frontmatter has `Business-OS-Integration: on` (default), and
- `Business-Unit` is present.

## Fail-Closed and Ordering Rules

1. Execute API workflow before finalizing markdown writes that depend on returned IDs.
2. If any API step fails, stop and report the error.
3. Use idempotent card resolution first; never create duplicates.
4. Use optimistic concurrency for PATCH writes.
5. On stage-doc `409`, refetch and retry once; if still conflicted, stop.

## Endpoint Sequence (Canonical)

1. Resolve card identity
- If `Card-ID` exists: `GET /api/agent/cards/:id`
- Else allocate/create via:
  - `POST /api/agent/allocate-id` (optional)
  - `POST /api/agent/cards`

2. Normalize lane for existing cards
- If lane is `Inbox`, patch proposed lane to `Fact-finding`.

3. Upsert `fact-find` stage doc
- `GET /api/agent/stage-docs/:cardId/fact-find`
- If found: `PATCH /api/agent/stage-docs/:cardId/fact-find`
- If not found: `POST /api/agent/stage-docs`

4. Persist brief metadata alignment
- Write `Card-ID` into frontmatter.
- If card already has `Feature-Slug`, keep it as source of truth.

## Payload Shapes and Detailed Examples

Do not duplicate payload JSON here. Use:
- `./card-operations.md`
- `./stage-doc-core.md`

These shared docs are the canonical payload reference.
