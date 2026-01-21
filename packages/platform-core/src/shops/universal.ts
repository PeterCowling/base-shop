/**
 * Universal shop utilities - safe for both client and server components.
 */

/**
 * A basic regular expression that matches valid shop identifiers.
 * Valid shop names may include alphanumeric characters, underscores
 * or hyphens.  Leading and trailing whitespace is not allowed.
 */
export const SHOP_NAME_RE = /^[a-z0-9_-]+$/i;

/**
 * Legacy app slug aliases for shops that predate the shop-<id> convention.
 */
const LEGACY_APP_SLUGS: Record<string, string> = {
  bcd: "cover-me-pretty",
};

export type ShopIdTarget =
  | "rawId"
  | "appSlug"
  | "appPackage"
  | "workflowName"
  | "cloudflareProjectName";

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

function validateCloudflareProjectName(name: string): string {
  if (name.length > 63) {
    throw new Error(`Cloudflare project name too long: ${name}`);
  }
  if (!/^[a-z0-9-]+$/.test(name)) {
    throw new Error(`Invalid Cloudflare project name: ${name}`);
  }
  return name;
}

/**
 * Get the app directory slug for a shop ID (e.g., "acme" -> "shop-acme").
 * Uses legacy aliases where configured.
 */
export function getShopAppSlug(rawId: string): string {
  const id = validateShopName(rawId);
  return LEGACY_APP_SLUGS[id] ?? `shop-${id}`;
}

/**
 * Get the pnpm package name for a shop (e.g., "acme" -> "@apps/shop-acme").
 */
export function getShopAppPackage(rawId: string): string {
  return `@apps/${getShopAppSlug(rawId)}`;
}

/**
 * Get the workflow filename for a shop (e.g., "acme" -> "shop-acme.yml").
 */
export function getShopWorkflowName(rawId: string): string {
  return `${getShopAppSlug(rawId)}.yml`;
}

/**
 * Normalize a shop ID to a specific target format.
 */
export function normalizeShopId(rawId: string, target: ShopIdTarget): string {
  const id = validateShopName(rawId);
  switch (target) {
    case "rawId":
      return id;
    case "appSlug":
      return getShopAppSlug(id);
    case "appPackage":
      return getShopAppPackage(id);
    case "workflowName":
      return getShopWorkflowName(id);
    case "cloudflareProjectName":
      return validateCloudflareProjectName(getShopAppSlug(id));
    default:
      return id;
  }
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
  editorialBlog?: unknown;
  /**
   * Optional domain configuration associated with the shop.
   */
  domain?: ShopDomain;
  /**
   * A catch‑all index signature to allow arbitrary additional properties.
   */
  [key: string]: unknown;
}

/**
 * Configuration required to connect a shop to a Sanity project.
 * These fields mirror the shape used in the real application while
 * still allowing additional properties.  Using an explicit interface
 * keeps type‑checking in sync with the `@acme/types` package which
 * expects these keys to exist.
 */
export interface SanityBlogConfig {
  projectId: string;
  dataset: string;
  token: string;
  [key: string]: unknown;
}

/**
 * Placeholder type describing a shop domain.  The domain must include a
 * `name` field and may include any other properties relevant to the domain
 * configuration.
 */
export interface ShopDomain {
  /** Fully qualified domain name associated with the shop. */
  name: string;
  [key: string]: unknown;
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
