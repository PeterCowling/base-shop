export const SHOP_NAME_RE = /^[a-z0-9_-]+$/i;

/** Ensure `shop` contains only safe characters. Returns the trimmed name. */
export function validateShopName(shop: string): string {
  const normalized = shop.trim();
  if (!SHOP_NAME_RE.test(normalized)) {
    throw new Error(`Invalid shop name: ${shop}`);
  }
  return normalized;
}
