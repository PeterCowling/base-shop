export { SHOP_NAME_RE, validateShopName } from "./validateShopName";
export { checkShopExists } from "./checkShopExists.server";
/**
 * Re-export Zod helpers from their module files rather than the package
 * root.  The root of @acme/zod-utils lacks a compiled index.d.ts, which
 * causes TS6305 errors.  Importing from the specific module files avoids this.
 */
export {
  applyFriendlyZodMessages,
  friendlyErrorMap,
} from "@acme/zod-utils/zodErrorMap";
export { generateMeta } from "./generateMeta";
export type { ProductData, GeneratedMeta } from "./generateMeta";
