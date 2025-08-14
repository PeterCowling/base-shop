import type {
  Shop,
  SanityBlogConfig,
  ShopDomain,
} from "@acme/types";
export { SHOP_NAME_RE, validateShopName } from "@acme/lib";

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

export function getEditorialBlog(
  shop: Shop,
): Shop["editorialBlog"] | undefined {
  return (shop as Shop & {
    editorialBlog?: Shop["editorialBlog"];
  }).editorialBlog;
}

export function setEditorialBlog(
  shop: Shop,
  config: Shop["editorialBlog"] | undefined,
): Shop {
  const next = { ...shop } as Shop & {
    editorialBlog?: Shop["editorialBlog"];
  };
  if (config) {
    next.editorialBlog = config;
  } else {
    delete next.editorialBlog;
  }
  return next;
}

export function getDomain(shop: Shop): ShopDomain | undefined {
  return (shop as Shop & { domain?: ShopDomain }).domain;
}

export function setDomain(shop: Shop, domain: ShopDomain | undefined): Shop {
  const next = { ...shop } as Shop & { domain?: ShopDomain };
  if (domain) {
    next.domain = domain;
  } else {
    delete next.domain;
  }
  return next;
}

export type EditorialBlogConfig = NonNullable<Shop["editorialBlog"]>;
export type { SanityBlogConfig, ShopDomain, EditorialBlogConfig };
