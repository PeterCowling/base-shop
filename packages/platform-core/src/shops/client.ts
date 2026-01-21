/**
 * Client-safe exports from shops module.
 * These utilities can be imported in both client and server components.
 *
 * For server-only utilities like checkShopExists and tier guards,
 * import from '@acme/platform-core/shops' instead.
 */

export {
  // Validation
  SHOP_NAME_RE,
  validateShopName,
  // Shop ID helpers
  getShopAppSlug,
  getShopAppPackage,
  getShopWorkflowName,
  normalizeShopId,
  type ShopIdTarget,
  // Shop types and utilities
  type Shop,
  type SanityBlogConfig,
  type ShopDomain,
  getSanityConfig,
  setSanityConfig,
  getEditorialBlog,
  setEditorialBlog,
  getDomain,
  setDomain,
} from "./universal";
