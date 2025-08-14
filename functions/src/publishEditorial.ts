import { promises as fs } from "node:fs";
import { DATA_ROOT } from "@platform-core/dataRoot";
import { publishQueuedPost } from "@acme/sanity";
import { trackEvent } from "@platform-core/analytics";

async function handleShop(shop: string): Promise<void> {
  try {
    await publishQueuedPost(shop);
    await trackEvent(shop, { type: "editorial_publish", success: true });
  } catch (err) {
    console.error(`editorial publish failed for ${shop}` , err);
    await trackEvent(shop, {
      type: "editorial_publish",
      success: false,
      error: (err as Error).message,
    });
  }
}

export default {
  async scheduled() {
    const entries = await fs.readdir(DATA_ROOT, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      await handleShop(entry.name);
    }
  },
};

