import {
  prepareOptions,
  createShopOptionsSchema as baseCreateShopOptionsSchema,
  type CreateShopOptions,
  type PreparedCreateShopOptions,
  type NavItem,
} from "./schema";

export { createShop } from "./createShop";
export { deployShop, deployShopImpl } from "./deploy";
export {
  repoRoot,
  ensureTemplateExists,
  copyTemplate,
  ensureDir,
  readFile,
  writeFile,
  writeJSON,
  listThemes,
  syncTheme,
} from "./fsUtils";
export { loadTokens, loadBaseTokens } from "./themeUtils";
export {
  type ShopDeploymentAdapter,
  CloudflareDeploymentAdapter,
  defaultDeploymentAdapter,
} from "./deploymentAdapter";
export { prepareOptions };
export type { CreateShopOptions, PreparedCreateShopOptions, NavItem };
export type { DeployStatusBase, DeployShopResult } from "./deployTypes";
export const createShopOptionsSchema = baseCreateShopOptionsSchema.strict();
