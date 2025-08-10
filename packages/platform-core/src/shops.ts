export { SHOP_NAME_RE, validateShopName } from "../../lib/src/validateShopName";

import { promises as fs } from "node:fs";
import fsSync from "node:fs";
import path from "node:path";

import { DATA_ROOT } from "./dataRoot";

export interface ShopDomainDetails {
  domain: string;
  dnsRecordId?: string;
  certificateId?: string;
}

function domainPath(shop: string): string {
  return path.join(DATA_ROOT, shop, "domain.json");
}

export async function readShopDomain(
  shop: string
): Promise<ShopDomainDetails | null> {
  try {
    const buf = await fs.readFile(domainPath(shop), "utf8");
    return JSON.parse(buf) as ShopDomainDetails;
  } catch {
    return null;
  }
}

export function readShopDomainSync(shop: string): ShopDomainDetails | null {
  try {
    const buf = fsSync.readFileSync(domainPath(shop), "utf8");
    return JSON.parse(buf) as ShopDomainDetails;
  } catch {
    return null;
  }
}

export async function writeShopDomain(
  shop: string,
  details: ShopDomainDetails
): Promise<void> {
  await fs.mkdir(path.dirname(domainPath(shop)), { recursive: true });
  await fs.writeFile(domainPath(shop), JSON.stringify(details, null, 2), "utf8");
}

