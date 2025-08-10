import { promises as fs } from "node:fs";
import * as path from "node:path";
import { DATA_ROOT } from "./dataRoot";

export { SHOP_NAME_RE, validateShopName } from "../../lib/src/validateShopName";

export interface ShopDomainInfo {
  domain: string;
  /** optional identifiers returned by Cloudflare */
  recordId?: string;
  certificateId?: string;
}

function domainFile(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "domain.json");
}

export async function saveShopDomain(
  shop: string,
  info: ShopDomainInfo
): Promise<void> {
  shop = validateShopName(shop);
  await fs.mkdir(path.join(DATA_ROOT, shop), { recursive: true });
  await fs.writeFile(domainFile(shop), JSON.stringify(info, null, 2));
}

export async function getShopDomain(
  shop: string
): Promise<ShopDomainInfo | undefined> {
  shop = validateShopName(shop);
  try {
    const buf = await fs.readFile(domainFile(shop), "utf8");
    return JSON.parse(buf) as ShopDomainInfo;
  } catch {
    return undefined;
  }
}

