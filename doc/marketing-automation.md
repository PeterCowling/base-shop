# Marketing automation

The `@acme/email` package ships with a small CLI for managing email marketing campaigns.

## Create a campaign

```bash
pnpm --filter @acme/email exec email campaign create <shop> \
  --subject "Launch" \
  --body "<p>Hello world</p>" \
  --recipients "user@example.com" \
  --send-at 2025-01-01T00:00:00Z
```

## List campaigns

```bash
pnpm --filter @acme/email exec email campaign list <shop>
```

## Send due campaigns

```bash
pnpm --filter @acme/email exec email campaign send
```

The scheduler will deliver any campaigns whose `sendAt` timestamp has passed.
