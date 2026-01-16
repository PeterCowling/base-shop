import { promises as fs } from "node:fs";
import path from "node:path";
import { DATA_ROOT } from "@acme/platform-core/dataRoot";
import { validateShopName } from "@acme/lib";
function campaignsPath(shop) {
    shop = validateShopName(shop);
    return path.join(DATA_ROOT, shop, "campaigns.json");
}
async function readCampaigns(shop) {
    try {
        const buf = await fs.readFile(campaignsPath(shop), "utf8");
        const json = JSON.parse(buf);
        if (Array.isArray(json))
            return json;
    }
    catch { }
    return [];
}
async function writeCampaigns(shop, items) {
    await fs.mkdir(path.dirname(campaignsPath(shop)), { recursive: true });
    await fs.writeFile(campaignsPath(shop), JSON.stringify(items, null, 2), "utf8");
}
async function listShops() {
    try {
        const entries = await fs.readdir(DATA_ROOT, { withFileTypes: true });
        return entries.filter((e) => e.isDirectory()).map((e) => e.name);
    }
    catch {
        return [];
    }
}
export const fsCampaignStore = {
    readCampaigns,
    writeCampaigns,
    listShops,
};
