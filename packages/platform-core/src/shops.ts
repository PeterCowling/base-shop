// packages/platform-core/src/shops.ts
// Extend shop utilities with domain persistence helpers.

import fs from "node:fs/promises";
import path from "node:path";

import { DATA_ROOT } from "./dataRoot";

export { SHOP_NAME_RE, validateShopName } from "../../lib/src/validateShopName";

/** Information about a shop's custom domain */
export interface ShopDomainDetails {
  /** The custom domain name */
  domain: string;
  /** Optional Cloudflare DNS record identifier */
  dnsRecordId?: string;
  /** Certificate provisioning status returned from Cloudflare */
  status?: string;
}

function domainPath(shop: string): string {
  return path.join(DATA_ROOT, shop, "domain.json");
}

/**
 * Persist domain information for a shop.
 */
export async function setShopDomain(
  shop: string,
  info: ShopDomainDetails,
): Promise<void> {
  await fs.mkdir(path.dirname(domainPath(shop)), { recursive: true });
  await fs.writeFile(domainPath(shop), JSON.stringify(info, null, 2));
}

/**
 * Read persisted domain information for a shop. Returns `null` if none exists.
 */
export async function getShopDomain(
  shop: string,
): Promise<ShopDomainDetails | null> {
  try {
    const buf = await fs.readFile(domainPath(shop), "utf8");
    return JSON.parse(buf) as ShopDomainDetails;
  } catch {
    return null;
  }
}

