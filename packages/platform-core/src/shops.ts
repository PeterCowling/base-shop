// packages/platform-core/src/shops.ts
export { SHOP_NAME_RE, validateShopName } from "../../lib/src/validateShopName";

import { prisma } from "./db";

export interface ShopDomainDetails {
  name: string;
  dnsRecordId: string;
  certificateId: string;
}

/**
 * Persist domain information for a shop. Existing shop data is merged and
 * updated with the provided domain details.
 */
export async function saveShopDomain(
  shopId: string,
  details: ShopDomainDetails
): Promise<void> {
  const rec = await prisma.shop.findUnique({ where: { id: shopId } });
  let data: any = { id: shopId };
  if (rec?.data && typeof rec.data === "object") {
    data = { ...rec.data };
  }
  data.domain = details;
  await prisma.shop.upsert({
    where: { id: shopId },
    update: { data },
    create: { id: shopId, data },
  });
}

/**
 * Read domain information for a shop if available.
 */
export async function readShopDomain(
  shopId: string
): Promise<ShopDomainDetails | undefined> {
  const rec = await prisma.shop.findUnique({ where: { id: shopId } });
  const dom = (rec?.data as any)?.domain;
  if (dom && typeof dom === "object" && typeof dom.name === "string") {
    return dom as ShopDomainDetails;
  }
  return undefined;
}
