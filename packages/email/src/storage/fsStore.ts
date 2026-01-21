import { promises as fs } from "fs";
import path from "path";

import { validateShopName } from "@acme/lib";
import { DATA_ROOT } from "@acme/platform-core/dataRoot";

import type { Campaign } from "../types";

import type { CampaignStore } from "./types";

function campaignsPath(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "campaigns.json");
}

async function readCampaigns(shop: string): Promise<Campaign[]> {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Path is DATA_ROOT/<validated shop>/campaigns.json [EMAIL-1000]
    const buf = await fs.readFile(campaignsPath(shop), "utf8");
    const json = JSON.parse(buf);
    if (Array.isArray(json)) return json as Campaign[];
  } catch {}
  return [];
}

async function writeCampaigns(shop: string, items: Campaign[]): Promise<void> {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Path is DATA_ROOT/<validated shop> [EMAIL-1000]
  await fs.mkdir(path.dirname(campaignsPath(shop)), { recursive: true });
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Path is DATA_ROOT/<validated shop>/campaigns.json [EMAIL-1000]
  await fs.writeFile(
    campaignsPath(shop),
    JSON.stringify(items, null, 2),
    "utf8",
  );
}

async function listShops(): Promise<string[]> {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Reading fixed DATA_ROOT directory [EMAIL-1000]
    const entries = await fs.readdir(DATA_ROOT, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }
}

export const fsCampaignStore: CampaignStore = {
  readCampaigns,
  writeCampaigns,
  listShops,
};
