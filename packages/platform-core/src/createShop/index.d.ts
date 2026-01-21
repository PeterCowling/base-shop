import type { Environment,ShopConfig } from "@acme/types";

import { type ShopDeploymentAdapter } from "./deploymentAdapter";
import type { DeployShopResult } from "./deployTypes";
import { type CreateShopOptions,type createShopOptionsSchema as baseCreateShopOptionsSchema, prepareOptions } from "./schema";
/**
 * Create a new shop app and seed data.
 * Paths are resolved relative to the repository root.
 */
export declare function createShop(id: string, opts?: Partial<CreateShopOptions>, options?: {
    deploy?: boolean;
}, adapter?: ShopDeploymentAdapter): Promise<DeployShopResult>;
export declare function deployShop(id: string, domain?: string, adapter?: ShopDeploymentAdapter): DeployShopResult;
export declare function listThemes(): string[];
/**
 * Update an existing shop to use a different theme.
 *
 * This adjusts the shop app's package dependency and global CSS token import.
 * It returns the default token map for the selected theme so callers can merge
 * in any overrides before persisting to the shop.json file.
 */
export declare function syncTheme(shop: string, theme: string): Record<string, string>;
export declare const createShopOptionsSchema: typeof baseCreateShopOptionsSchema;
export interface ShopCreationState {
    shopId: string;
    status: "pending" | "created" | "partial" | "failed";
    env?: Environment;
    lastConfigHash?: string;
    lastError?: string;
    createdAt?: string;
    updatedAt?: string;
}
export declare function mapConfigToCreateShopOptions(config: ShopConfig): Partial<CreateShopOptions>;
export declare function createShopFromConfig(id: string, config: ShopConfig, options?: {
    deploy?: boolean;
    env?: Environment;
}): Promise<DeployShopResult>;
export { prepareOptions };
export { CloudflareDeploymentAdapter, defaultDeploymentAdapter,type ShopDeploymentAdapter,  } from "./deploymentAdapter";
export type { DeployShopResult,DeployStatusBase } from "./deployTypes";
export { copyTemplate, ensureTemplateExists, readFile, writeFile, } from "./fsUtils";
export type { CreateShopOptions, NavItem, PageConfig, PreparedCreateShopOptions, RequiredPageSlug, SeoConfig } from "./schema";
export { REQUIRED_PAGES_BASIC } from "./schema";
export { loadBaseTokens,loadTokens } from "./themeUtils";
