# Discovery Index Contract

Shared contract for skills that mutate ideas/cards/stage-doc state.

## Index File

`docs/business-os/_meta/discovery-index.json`

## Rebuild Trigger

Rebuild after successful writes affecting discovery surfaces:
- ideas
- cards
- stage docs
- deterministic lane transitions

## Rebuild Command

```bash
docs/business-os/_meta/rebuild-discovery-index.sh > docs/business-os/_meta/discovery-index.json
```

## Failure Handling

1. Retry once after short backoff.
2. On repeated failure, stop and report:
- command
- retries
- stderr summary
- operator rerun command
3. Do not claim discovery freshness on failure.
