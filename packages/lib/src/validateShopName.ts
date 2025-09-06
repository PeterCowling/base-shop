export const SHOP_NAME_RE = /^[a-z0-9_-]+$/;
const MAX_SHOP_NAME_LENGTH = 63;

/** Ensure `shop` contains only safe characters and is within length limits. Returns the trimmed name. */
export function validateShopName(shop: string): string {
  const normalized = shop.trim();
  if (
    normalized.length === 0 ||
    normalized.length > MAX_SHOP_NAME_LENGTH ||
    !SHOP_NAME_RE.test(normalized)
  ) {
    throw new Error(`Invalid shop name: ${shop}`);
  }
  return normalized;
}
