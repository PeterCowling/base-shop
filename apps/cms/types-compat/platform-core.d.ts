// Types-compat declarations for @acme/platform-core paths

declare module "@acme/platform-core/shops" {
  export interface Shop {
    id: string;
    slug: string;
    name?: string;
    [k: string]: any;
  }
  export function getShop(id: string): Promise<Shop | null>;
  export function getShopById<T = Shop>(id: string): Promise<T | null>;
  export function getShopBySlug(slug: string): Promise<Shop | null>;
  export function listShops(): Promise<Shop[]>;
  export function createShop(data: Partial<Shop>): Promise<Shop>;
  export function updateShop(id: string, data: Partial<Shop>): Promise<Shop>;
  export function updateShopInRepo(id: string, data: Partial<Shop>): Promise<Shop>;
  export function deleteShop(id: string): Promise<void>;
  export function validateShopName(name: string): string;
  export function checkShopExists(id: string): Promise<boolean>;
  export function resolveDataRoot(shopId?: string): string;
  export function readRepo<T = any>(shopId: string): Promise<T[]>;
  export function writeRepo<T = any>(shopId: string, data: T[]): Promise<void>;
  export function seedShop(shopId: string, options?: any): Promise<void>;
  export function mockShop(overrides?: Partial<Shop>): Shop;
  export function withShop<T>(shopId: string, fn: (shop: Shop) => T | Promise<T>): Promise<T>;
  export interface SanityBlogConfig {
    projectId: string;
    dataset: string;
    token?: string;
    [k: string]: any;
  }
  /** @deprecated Use SanityBlogConfig instead */
  export type SanityConfig = SanityBlogConfig;
  export function getSanityConfig(shop: Shop): SanityBlogConfig | undefined;
  export function setSanityConfig(shop: Shop, config: SanityBlogConfig | undefined): Shop;
  export function setEditorialBlog(shop: Shop, editorial: Shop["editorialBlog"] | undefined): Shop;
}

declare module "@acme/platform-core/shops/health" {
  export interface HealthStatus {
    status: "healthy" | "unhealthy" | "degraded";
    [k: string]: any;
  }
  export function getShopHealth(shopId: string): Promise<HealthStatus>;
  export function checkHealth(shopId: string): Promise<boolean>;
  export function incrementOperationalError(shopId: string, errorType?: string): Promise<void>;
  export function runMaintenanceScan(shopId: string): Promise<any>;
  export function deriveOperationalHealth(shopId: string): Promise<any>;
}

declare module "@acme/platform-core/repositories/blog.server" {
  export interface BlogPost {
    id: string;
    slug: string;
    title: string;
    content?: string;
    [k: string]: any;
  }
  export interface SanityPost {
    _id: string;
    _type: string;
    slug: { current: string };
    title: string;
    body?: any;
    [k: string]: any;
  }
  export interface SanityConfig {
    projectId: string;
    dataset: string;
    token?: string;
    [k: string]: any;
  }
  export function getBlogPost(id: string): Promise<BlogPost | null>;
  export function listBlogPosts(shopId: string): Promise<BlogPost[]>;
  export function createBlogPost(data: Partial<BlogPost>): Promise<BlogPost>;
  export function updateBlogPost(id: string, data: Partial<BlogPost>): Promise<BlogPost>;
  export function deleteBlogPost(id: string): Promise<void>;
  export function slugExists(config: SanityConfig, slug: string, excludeId?: string): Promise<boolean>;
  export function createPost(shopId: string, data: Partial<SanityPost>): Promise<SanityPost>;
  export function updatePost(shopId: string, id: string, data: Partial<SanityPost>): Promise<SanityPost>;
  export function deletePost(shopId: string, id: string): Promise<void>;
  export function publishPost(config: SanityConfig, id: string, publishedAt: string): Promise<void>;
  export function unpublishPost(config: SanityConfig, id: string): Promise<void>;
  export function listPosts(shopId: string): Promise<SanityPost[]>;
  export function getPost(shopId: string, id: string): Promise<SanityPost | null>;
}

declare module "@acme/platform-core/repositories/shop.server" {
  export * from "@acme/platform-core/shops";
}

declare module "@acme/platform-core/repositories/json.server" {
  export function readJson<T>(path: string): Promise<T>;
  export function writeJson<T>(path: string, data: T): Promise<void>;
  export function readShop(shopId: string): Promise<any>;
  export function readSettings(shopId: string): Promise<Record<string, any>>;
  export function writeSettings(shopId: string, settings: Record<string, any>): Promise<void>;
  export function readRepo<T = any>(shopId: string): Promise<T[]>;
  export function writeRepo<T = any>(shop: string, catalogue: T[]): Promise<void>;
  export function getProductById<T extends { id: string } = any>(shop: string, id: string): Promise<T | null>;
  export function updateProductInRepo<T extends { id: string; row_version?: number } = any>(shop: string, patch: Partial<T> & { id: string }): Promise<T>;
  export function duplicateProductInRepo<T = any>(shop: string, productId: string, newId?: string): Promise<T>;
  export function deleteProductFromRepo(shop: string, id: string): Promise<void>;
  export function readAggregates(shopId: string): Promise<any>;
  export function readInventory(shopId: string): Promise<any>;
}

declare module "@acme/platform-core/repositories/pages/index.server" {
  import type { Page } from "@acme/types";

  export type { Page };
  export function getPage(id: string): Promise<Page | null>;
  export function getPages(shopId: string): Promise<Page[]>;
  export function listPages(shopId: string): Promise<Page[]>;
  export function createPage(data: Partial<Page>): Promise<Page>;
  export function updatePage(id: string, data: Partial<Page>): Promise<Page>;
  export function savePage(shopId: string, page: Partial<Page>, previous?: Partial<Page>): Promise<Page>;
  export function updatePage(shopId: string, page: Partial<Page>, previous?: Partial<Page>): Promise<Page>;
  export function deletePage(shopId: string, id: string): Promise<void>;
  export function reorderPages(shopId: string, pageIds: string[]): Promise<void>;
}

declare module "@acme/platform-core/repositories/analytics.server" {
  export interface AnalyticsData {
    [k: string]: any;
  }
  export interface AnalyticsEvent {
    id: string;
    name: string;
    type: string;
    timestamp: string;
    [k: string]: any;
  }
  export function getAnalytics(shopId: string, options?: any): Promise<AnalyticsData>;
  export function trackEvent(event: string, data?: any): Promise<void>;
  export function listEvents(shopId?: string, options?: any): Promise<AnalyticsEvent[]>;
  export function readAggregates(shopId: string): Promise<any>;
}

declare module "@acme/platform-core/repositories/inventory.server" {
  export interface InventoryItem {
    sku: string;
    quantity: number;
    productId?: string;
    variantAttributes?: Record<string, string>;
    lowStockThreshold?: number;
    wearCount?: number;
    wearAndTearLimit?: number;
    maintenanceCycle?: number;
    [k: string]: any;
  }
  export type InventoryMutateFn = (current: InventoryItem | undefined) => InventoryItem;
  export const inventoryRepository: {
    get: (shopId: string) => Promise<InventoryItem[]>;
    update: (shop: string, sku: string, variantAttributes: Record<string, string>, mutate: InventoryMutateFn) => Promise<InventoryItem>;
    [k: string]: any;
  };
  export function getInventory(shopId: string): Promise<InventoryItem[]>;
  export function readInventory(shopId: string): Promise<InventoryItem[]>;
  export function updateInventory(sku: string, quantity: number): Promise<InventoryItem>;
  export function updateInventoryItem(shop: string, sku: string, variantAttributes: Record<string, string>, mutate: InventoryMutateFn): Promise<InventoryItem>;
  export function variantKey(sku: string, attrs: Record<string, string>): string;
}

declare module "@acme/platform-core/repositories/settings.server" {
  export interface SettingsDiffEntry {
    key: string;
    before: any;
    after: any;
    timestamp: string;
    diff: any;
    [k: string]: any;
  }
  export function getSettings(shopId: string): Promise<Record<string, any>>;
  export function readSettings(shopId: string): Promise<Record<string, any>>;
  export function updateSettings(shopId: string, settings: Record<string, any>): Promise<void>;
  export function diffHistory(shopId: string, from?: string, to?: string): Promise<SettingsDiffEntry[]>;
  export function getShopSettings(shopId: string): Promise<Record<string, any>>;
  export function saveShopSettings(shopId: string, settings: Record<string, any>): Promise<void>;
}

declare module "@acme/platform-core/dataRoot" {
  export const dataRoot: string;
  export const DATA_ROOT: string;
  export function getDataPath(...segments: string[]): string;
  export function resolveDataRoot(shopId?: string): string;
}

declare module "@acme/platform-core/createShop" {
  export interface CreateShopInput {
    name: string;
    slug: string;
    [k: string]: any;
  }
  export interface ShopCreationState {
    status: string;
    progress?: number;
    lastError?: string;
    [k: string]: any;
  }
  export interface ThemeInfo {
    id: string;
    name: string;
    [k: string]: any;
  }
  export function createShop(input: CreateShopInput): Promise<any>;
  export function createShopFromConfig(id: string, config: any, options?: { deploy?: boolean; env?: string }): Promise<DeployShopResult>;
  export function readShopCreationState(shopId: string): Promise<ShopCreationState | null>;
  export function listThemes(): string[];
  export function syncTheme(shopId: string, themeId: string): Promise<void>;
  export interface DeployStatusBase {
    status: string;
    progress?: number;
    [k: string]: any;
  }
  export interface DeployShopResult extends DeployStatusBase {
    success: boolean;
    shopId: string;
  }
  export function deployShop(shopId: string, options?: any): Promise<DeployShopResult>;
  export function getLaunchStatus(shopId: string): Promise<DeployStatusBase>;
  export const createShopOptionsSchema: any;
}

declare module "@acme/platform-core/products" {
  export interface Product {
    id: string;
    title: string;
    price?: number;
    [k: string]: any;
  }
  export interface ProductPublication {
    id: string;
    productId: string;
    row_version?: number;
    [k: string]: any;
  }
  export function getProduct(id: string): Promise<Product | null>;
  export function getProductById(id: string): Product | null;
  export function getProductById(shop: string, id: string): Promise<Product | null>;
  export function listProducts(shopId: string): Promise<Product[]>;
  export function updateProductInRepo<T extends { id: string; row_version?: number } = ProductPublication>(shop: string, patch: Partial<T> & { id: string }): Promise<T>;
  export function duplicateProductInRepo(shop: string, productId: string, newId?: string): Promise<Product>;
  export function createProductInRepo(data: Partial<Product>): Promise<Product>;
  export function deleteProductFromRepo(shop: string, id: string): Promise<void>;
  export function deleteProductInRepo(productId: string): Promise<void>;
  export function getProductBySlug(slug: string, shopId?: string): Promise<Product | null>;
  export function writeRepo<T = ProductPublication>(shop: string, catalogue: T[]): Promise<void>;
  export const PRODUCTS: Product[];
}

declare module "@acme/platform-core/types/inventory" {
  import { z } from "zod";

  export interface InventoryItem {
    sku: string;
    quantity: number;
    location?: string;
    [k: string]: any;
  }
  export interface StockAdjustment {
    sku: string;
    delta: number;
    reason?: string;
    [k: string]: any;
  }
  export interface StockInflow {
    sku: string;
    quantity: number;
    source?: string;
    [k: string]: any;
  }
  export const inventoryItemSchema: z.ZodObject<any, any, any, InventoryItem>;
  export const stockAdjustmentSchema: z.ZodObject<any, any, any, StockAdjustment>;
  export function variantKey(sku: string, attrs: Record<string, string>): string;
}

declare module "@acme/platform-core/utils" {
  export function slugify(text: string): string;
  export function generateId(): string;
  export function formatDate(date: Date | string): string;
  export function recordMetric(name: string, tags?: Record<string, any>): void;
  export interface LogMeta { [key: string]: unknown; }
  export const logger: {
    error: (message: string, meta?: LogMeta) => void;
    warn: (message: string, meta?: LogMeta) => void;
    info: (message: string, meta?: LogMeta) => void;
    debug: (message: string, meta?: LogMeta) => void;
  };
  export function initTheme(config: any): void;
}

declare module "@acme/platform-core/configurator" {
  export interface ConfiguratorState {
    [k: string]: any;
  }
  export interface ConfiguratorProgress {
    shopId: string;
    progress: number;
    status: string;
    [k: string]: any;
  }
  export type LaunchEnv = "dev" | "stage" | "prod";
  export type LaunchStatus = "ok" | "blocked" | "warning";
  export interface LaunchCheckResult {
    env: LaunchEnv;
    status: LaunchStatus;
    reasons: string[];
    ready?: boolean;
    checks?: any[];
    [k: string]: any;
  }
  export const REQUIRED_CONFIG_CHECK_STEPS: ConfiguratorStepId[];
  export function getConfiguratorState(): ConfiguratorState;
  export function validateShopEnv(shopId: string): Promise<{ valid: boolean; errors?: string[] }>;
  export function getConfiguratorProgressForShop(shopId: string, steps?: ConfiguratorStepId[]): Promise<ConfiguratorProgress>;
  export function runRequiredConfigChecks(shopId: string): Promise<any>;
  export const createShopOptionsSchema: any;
  export const OPTIONAL_CONFIG_CHECK_STEPS: ConfiguratorStepId[];
  export function getLaunchStatus(env: LaunchEnv, shopId: string): Promise<LaunchCheckResult>;
}

declare module "@acme/platform-core" {
  export * from "@acme/platform-core/products";
  export * from "@acme/platform-core/shops";
}

declare module "@acme/platform-core" {
  export * from "@acme/platform-core/products";
  export * from "@acme/platform-core/shops";
}

declare module "@acme/platform-core/*" {
  const content: any;
  export = content;
}
