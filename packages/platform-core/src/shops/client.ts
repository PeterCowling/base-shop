/**
 * Client-safe exports from shops module.
 * These utilities can be imported in both client and server components.
 *
 * For server-only utilities like checkShopExists and tier guards,
 * import from '@acme/platform-core/shops' instead.
 */

export {
  getDomain,
  getEditorialBlog,
  getSanityConfig,
  getShopAppPackage,
  // Shop ID helpers
  getShopAppSlug,
  getShopWorkflowName,
  normalizeShopId,
  type SanityBlogConfig,
  setDomain,
  setEditorialBlog,
  setSanityConfig,
  // Shop types and utilities
  type Shop,
  // Validation
  SHOP_NAME_RE,
  type ShopDomain,
  type ShopIdTarget,
  validateShopName,
} from "./universal";
