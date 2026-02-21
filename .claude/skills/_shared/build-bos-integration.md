# Build BOS Integration Contract

Applies when plan has `Card-ID` and `Business-OS-Integration` is not `off`.

## Fail-Closed Rules

1. Any API failure stops build progression.
2. PATCH operations use optimistic concurrency.
3. On `409`, refetch and retry once; if repeated, stop.

## Endpoint Sequence

1. Resolve/read card.
2. Ensure build stage doc exists.
3. On first runnable task, transition lane `Planned -> In progress`.
4. After each completed task, update `Last-Progress` and build stage doc content.
5. When completion gates pass, transition lane `In progress -> Done`.
6. Rebuild discovery index via shared contract.

## Payload References

- `./bos-api-payloads.md`
- `./card-operations.md`
- `./stage-doc-core.md`
- `./discovery-index-contract.md`
