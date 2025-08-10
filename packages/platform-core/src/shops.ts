import type { Shop, SanityBlogConfig } from "@types";
export { SHOP_NAME_RE, validateShopName } from "../../lib/src/validateShopName";

export function getSanityConfig(shop: Shop): SanityBlogConfig | undefined {
  return shop.sanityBlog;
}

export function setSanityConfig(
  shop: Shop,
  config: SanityBlogConfig | undefined
): Shop {
  const next = { ...shop } as Shop & { sanityBlog?: SanityBlogConfig };
  if (config) {
    next.sanityBlog = config;
  } else {
    delete next.sanityBlog;
  }
  return next;
}

export type { SanityBlogConfig };
