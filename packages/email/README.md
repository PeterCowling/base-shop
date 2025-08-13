# @acme/email

Utilities for sending marketing emails.

## Campaign storage

Scheduled campaigns are read and written through a `CampaignStore`.  The default
implementation stores data on the filesystem:

```ts
import { createFsCampaignStore, sendScheduledCampaigns } from "@acme/email";
import { DATA_ROOT } from "@platform-core/dataRoot";

const store = createFsCampaignStore(DATA_ROOT);
await sendScheduledCampaigns(store);
```

To provide a custom store (e.g. backed by a database) implement the interface
and pass it to `sendScheduledCampaigns`:

```ts
import type { CampaignStore, Campaign } from "@acme/email";

class DbStore implements CampaignStore {
  async listShops(): Promise<string[]> {
    return ["shop-a"]; // fetch from database
  }
  async readCampaigns(shop: string): Promise<Campaign[]> {
    return []; // load from database
  }
  async writeCampaigns(shop: string, campaigns: Campaign[]): Promise<void> {
    // persist to database
  }
}

await sendScheduledCampaigns(new DbStore());
```

This allows the scheduler to work with different storage backends without
modifying application code.
