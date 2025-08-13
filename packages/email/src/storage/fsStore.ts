import { promises as fs } from "node:fs";
import path from "node:path";
import type { Campaign, CampaignStore } from "./types";

export function createFsCampaignStore(root: string): CampaignStore {
  function campaignsPath(shop: string): string {
    return path.join(root, shop, "campaigns.json");
  }

  return {
    async listShops(): Promise<string[]> {
      return fs.readdir(root).catch(() => []);
    },

    async readCampaigns(shop: string): Promise<Campaign[]> {
      try {
        const buf = await fs.readFile(campaignsPath(shop), "utf8");
        const json = JSON.parse(buf);
        if (Array.isArray(json)) return json as Campaign[];
      } catch {}
      return [];
    },

    async writeCampaigns(shop: string, campaigns: Campaign[]): Promise<void> {
      await fs.mkdir(path.dirname(campaignsPath(shop)), { recursive: true });
      await fs.writeFile(
        campaignsPath(shop),
        JSON.stringify(campaigns, null, 2),
        "utf8"
      );
    },
  };
}
