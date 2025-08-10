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

export interface DomainInfo {
  name: string;
  status?: string;
}

export function getDomain(shop: Shop): DomainInfo | undefined {
  return shop.domain;
}

export function setDomain(shop: Shop, domain: DomainInfo | undefined): Shop {
  const next = { ...shop } as Shop & { domain?: DomainInfo };
  if (domain) {
    next.domain = domain;
  } else {
    delete next.domain;
  }
  return next;
}

export type { DomainInfo as ShopDomain };
