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
export declare const SHOP_NAME_RE: RegExp;
/**
 * Validate and normalize a shop name.  The input is trimmed and
 * tested against {@link SHOP_NAME_RE}.  If invalid, an error is thrown.
 * Returns the normalized shop name on success.
 * @param shop Name to validate
 */
export declare function validateShopName(shop: string): string;
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
export interface SanityBlogConfig {
    projectId: string;
    dataset: string;
    token: string;
    [key: string]: unknown;
}
/**
 * Placeholder type describing a shop domain.  The domain must include a
 * `name` and may include any other properties relevant to the domain
 * configuration.
 */
export interface ShopDomain {
    /** Fully qualified domain name associated with the shop. */
    name: string;
    [key: string]: any;
}
/**
 * Retrieve the Sanity blog configuration for a given shop.
 * @param shop The shop object.
 */
export declare function getSanityConfig(shop: Shop): SanityBlogConfig | undefined;
/**
 * Set the Sanity blog configuration on a shop.
 * @param shop The shop to update.
 * @param config The new configuration or undefined to remove it.
 */
export declare function setSanityConfig(shop: Shop, config: SanityBlogConfig | undefined): Shop;
/**
 * Retrieve the editorial blog configuration from a shop.
 * @param shop The shop object.
 */
export declare function getEditorialBlog(shop: Shop): Shop["editorialBlog"] | undefined;
/**
 * Set the editorial blog configuration on a shop.
 * @param shop The shop to update.
 * @param editorial The new editorial blog configuration or undefined to remove it.
 */
export declare function setEditorialBlog(shop: Shop, editorial: Shop["editorialBlog"] | undefined): Shop;
/**
 * Retrieve the domain configuration for a shop.
 * @param shop The shop object.
 */
export declare function getDomain(shop: Shop): ShopDomain | undefined;
/**
 * Set the domain configuration on a shop.
 * @param shop The shop to update.
 * @param domain The new domain or undefined to remove it.
 */
export declare function setDomain(shop: Shop, domain: ShopDomain | undefined): Shop;
