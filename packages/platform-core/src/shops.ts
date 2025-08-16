// packages/platform-core/src/shops.ts
/**
 * In the original repository this file re‑exported types from
 * `@acme/types` and validation utilities from `@acme/lib`. Those
 * packages are not available in this environment, so we provide
 * minimal type definitions and validation helpers locally.
 */

/**
 * A basic regular expression that matches valid shop identifiers.
 * Valid shop names may include alphanumeric characters, underscores
 * or hyphens.  Leading and trailing whitespace is not allowed.
 */
export const SHOP_NAME_RE = /^[a-z0-9_-]+$/i;

/**
 * Validate and normalize a shop name.  The input is trimmed and
 * tested against {@link SHOP_NAME_RE}.  If invalid, an error is thrown.
 * Returns the normalized shop name on success.
 * @param shop Name to validate
 */
export function validateShopName(shop: string): string {
  const normalized = shop.trim();
  if (!SHOP_NAME_RE.test(normalized)) {
    throw new Error(`Invalid shop name: ${shop}`);
  }
  return normalized;
}

/**
 * Minimal representation of a shop.  Additional properties may be
 * present on the object and will be preserved by update helpers.
 */
export interface Shop {
  /**
   * Optional Sanity blog configuration associated with the shop.
   */
  sanityBlog?: SanityBlogConfig;
  /**
   * Optional editorial blog configuration.
   */
  editorialBlog?: any;
  /**
   * Optional domain configuration associated with the shop.
   */
  domain?: ShopDomain;
  /**
   * A catch‑all index signature to allow arbitrary additional properties.
   */
  [key: string]: any;
}

/**
 * Placeholder type describing the configuration of a Sanity blog.
 * In the full codebase this would include the specific fields
 * required by the CMS, but here it is left as an object with
 * arbitrary keys.
 */
export type SanityBlogConfig = Record<string, unknown>;

/**
 * Placeholder type describing a shop domain.  The domain may include
 * a name and any other properties relevant to the domain configuration.
 */
export interface ShopDomain {
  name?: string;
  [key: string]: any;
}

/**
 * Retrieve the Sanity blog configuration for a given shop.
 * @param shop The shop object.
 */
export function getSanityConfig(shop: Shop): SanityBlogConfig | undefined {
  return shop.sanityBlog;
}

/**
 * Set the Sanity blog configuration on a shop.
 * @param shop The shop to update.
 * @param config The new configuration or undefined to remove it.
 */
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

/**
 * Retrieve the editorial blog configuration from a shop.
 * @param shop The shop object.
 */
export function getEditorialBlog(
  shop: Shop
): Shop["editorialBlog"] | undefined {
  return (shop as Shop & { editorialBlog?: Shop["editorialBlog"] })
    .editorialBlog;
}

/**
 * Set the editorial blog configuration on a shop.
 * @param shop The shop to update.
 * @param editorial The new editorial blog configuration or undefined to remove it.
 */
export function setEditorialBlog(
  shop: Shop,
  editorial: Shop["editorialBlog"] | undefined
): Shop {
  const next = { ...shop } as Shop & { editorialBlog?: Shop["editorialBlog"] };
  if (editorial) {
    next.editorialBlog = editorial;
  } else {
    delete next.editorialBlog;
  }
  return next;
}

/**
 * Retrieve the domain configuration for a shop.
 * @param shop The shop object.
 */
export function getDomain(shop: Shop): ShopDomain | undefined {
  return (shop as Shop & { domain?: ShopDomain }).domain;
}

/**
 * Set the domain configuration on a shop.
 * @param shop The shop to update.
 * @param domain The new domain or undefined to remove it.
 */
export function setDomain(shop: Shop, domain: ShopDomain | undefined): Shop {
  const next = { ...shop } as Shop & { domain?: ShopDomain };
  if (domain) {
    next.domain = domain;
  } else {
    delete next.domain;
  }
  return next;
}

// Re-export relevant types so callers do not need to import @acme/types directly.
export type { SanityBlogConfig, Shop, ShopDomain };
