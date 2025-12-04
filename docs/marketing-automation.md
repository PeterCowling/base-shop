Type: Guide
Status: Active
Domain: Marketing
Last-reviewed: 2025-12-02

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

## Custom campaign stores

Campaigns use Prisma with PostgreSQL as the default backend. The filesystem
store remains available only as a fallback. You can replace either storage
layer by providing your own implementation of the `CampaignStore` interface and
registering it with `setCampaignStore`.

```ts
import { setCampaignStore, type CampaignStore } from "@acme/email";

const memoryStore: CampaignStore = {
  async readCampaigns(shop) {
    return memory[shop] || [];
  },
  async writeCampaigns(shop, campaigns) {
    memory[shop] = campaigns;
  },
  async listShops() {
    return Object.keys(memory);
  },
};

setCampaignStore(memoryStore);
```

This allows persisting campaigns in a database or any other backend.

## Unsubscribe

Each email includes a per-recipient unsubscribe link. When a recipient clicks the link, a request is sent to `/api/marketing/email/unsubscribe` which records an `email_unsubscribe` event. Unsubscribed addresses are automatically skipped by future campaigns.
