# Plan BOS Integration Contract

Use this contract when `/lp-do-plan` has `Card-ID` and `Business-OS-Integration` is not `off`.

## Fail-Closed Rules

1. If any BOS API call fails, stop and report the error.
2. Use optimistic concurrency for PATCH operations.
3. On `409`, refetch and retry once; if repeated, stop.

## Endpoint Order (Canonical)

1. Read card (`GET /api/agent/cards/:id`) and lock `Feature-Slug`.
2. Upsert planned stage doc (`plan`) for the card.
3. Patch card `Plan-Link` to `docs/plans/<feature-slug>/plan.md`.
4. If plan is build-eligible and no blocking inputs, transition lane `Fact-finding -> Planned`.
5. Rebuild discovery index per shared contract.

## Payload Shapes

Use canonical payload references:
- `./bos-api-payloads.md`
- `./card-operations.md`
- `./stage-doc-core.md`

Do not inline large payload examples in skill prompts.
