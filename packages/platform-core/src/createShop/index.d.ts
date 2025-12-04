import { prepareOptions, createShopOptionsSchema as baseCreateShopOptionsSchema, type CreateShopOptions } from "./schema";
import type { DeployShopResult } from "./deployTypes";
import type { ShopConfig, Environment } from "@acme/types";
import { type ShopDeploymentAdapter } from "./deploymentAdapter";
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
export type { CreateShopOptions, PreparedCreateShopOptions, NavItem } from "./schema";
export type { DeployStatusBase, DeployShopResult } from "./deployTypes";
export { ensureTemplateExists, copyTemplate, readFile, writeFile, } from "./fsUtils";
export { loadTokens, loadBaseTokens } from "./themeUtils";
export { type ShopDeploymentAdapter, CloudflareDeploymentAdapter, defaultDeploymentAdapter, } from "./deploymentAdapter";
