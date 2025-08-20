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
export function validateShopName(shop) {
    const normalized = shop.trim();
    if (!SHOP_NAME_RE.test(normalized)) {
        throw new Error(`Invalid shop name: ${shop}`);
    }
    return normalized;
}
/**
 * Retrieve the Sanity blog configuration for a given shop.
 * @param shop The shop object.
 */
export function getSanityConfig(shop) {
    return shop.sanityBlog;
}
/**
 * Set the Sanity blog configuration on a shop.
 * @param shop The shop to update.
 * @param config The new configuration or undefined to remove it.
 */
export function setSanityConfig(shop, config) {
    const next = { ...shop };
    if (config) {
        next.sanityBlog = config;
    }
    else {
        delete next.sanityBlog;
    }
    return next;
}
/**
 * Retrieve the editorial blog configuration from a shop.
 * @param shop The shop object.
 */
export function getEditorialBlog(shop) {
    return shop
        .editorialBlog;
}
/**
 * Set the editorial blog configuration on a shop.
 * @param shop The shop to update.
 * @param editorial The new editorial blog configuration or undefined to remove it.
 */
export function setEditorialBlog(shop, editorial) {
    const next = { ...shop };
    if (editorial) {
        next.editorialBlog = editorial;
    }
    else {
        delete next.editorialBlog;
    }
    return next;
}
/**
 * Retrieve the domain configuration for a shop.
 * @param shop The shop object.
 */
export function getDomain(shop) {
    return shop.domain;
}
/**
 * Set the domain configuration on a shop.
 * @param shop The shop to update.
 * @param domain The new domain or undefined to remove it.
 */
export function setDomain(shop, domain) {
    const next = { ...shop };
    if (domain) {
        next.domain = domain;
    }
    else {
        delete next.domain;
    }
    return next;
}
