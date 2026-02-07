import "server-only";

import { existsSync, mkdirSync,readFileSync, writeFileSync } from "node:fs";
import { dirname,join } from "node:path";

import { ulid } from "ulid";

import type { Locale, MediaItem, ProductCore, ProductPublication, PublicationStatus, Translated } from "@acme/types";

import { validateShopName } from "./shops";

// Use partial Translated type for templates (not all locales required)
type PartialTranslated = Partial<Record<Locale, string>>;

// ============================================================
// Types
// ============================================================

/**
 * Product template category for organization.
 */
export type ProductTemplateCategory =
  | "apparel"
  | "accessories"
  | "electronics"
  | "home"
  | "beauty"
  | "food"
  | "rental"
  | "services"
  | "other";

/**
 * Product template definition.
 * Templates are blueprints for creating products with pre-filled values.
 */
export interface ProductTemplate {
  /** Unique template ID */
  id: string;
  /** Human-readable template name */
  name: string;
  /** Template description */
  description?: string;
  /** Template version (semver) */
  version: string;
  /** Category for organization */
  category: ProductTemplateCategory;
  /** Tags for filtering */
  tags?: string[];
  /** Preview image URL */
  previewImage?: string;
  /** Origin: core (built-in) or custom (shop-specific) */
  origin: "core" | "custom";
  /** Whether template is active */
  active: boolean;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;

  // ---- Product blueprint fields ----
  /** Default title (localized, partial - not all locales required) */
  title?: PartialTranslated;
  /** Default description (localized, partial - not all locales required) */
  productDescription?: PartialTranslated;
  /** Default price in minor units */
  price?: number;
  /** Default currency */
  currency?: string;
  /** Default media items */
  media?: MediaItem[];
  /** Rental-specific fields */
  rentalTerms?: string;
  deposit?: number;
  forSale?: boolean;
  forRental?: boolean;
  dailyRate?: number;
  weeklyRate?: number;
  monthlyRate?: number;
  wearAndTearLimit?: number;
  maintenanceCycle?: number;
  /** Variant configuration */
  variants?: ProductVariantConfig;
  /** Custom attributes (key-value) */
  customAttributes?: Record<string, unknown>;
}

/**
 * Variant configuration for templates.
 */
export interface ProductVariantConfig {
  /** Variant attribute names (e.g., ["size", "color"]) */
  attributes: string[];
  /** Predefined variant options */
  options?: Record<string, string[]>;
  /** SKU pattern with placeholders (e.g., "{base}-{size}-{color}") */
  skuPattern?: string;
}

/**
 * Options for cloning a template to a product.
 */
export interface CloneTemplateOptions {
  /** Target shop ID */
  shopId: string;
  /** Template ID to clone */
  templateId: string;
  /** Override values */
  overrides?: Partial<ProductCore>;
  /** Initial status for the cloned product */
  status?: PublicationStatus;
  /** Custom SKU (if not provided, generates from template) */
  sku?: string;
}

/**
 * Result of cloning a template.
 */
export interface CloneTemplateResult {
  success: boolean;
  product?: ProductPublication;
  error?: string;
}

// ============================================================
// Template Storage
// ============================================================

const TEMPLATES_DIR = join("data", "product-templates");
const CORE_TEMPLATES_FILE = join(TEMPLATES_DIR, "core.json");

function ensureTemplatesDir(): void {
  if (!existsSync(TEMPLATES_DIR)) {
    mkdirSync(TEMPLATES_DIR, { recursive: true });
  }
}

function getShopTemplatesPath(shopId: string): string {
  return join("data", "shops", shopId, "product-templates.json");
}

function readTemplatesFile(path: string): ProductTemplate[] {
  if (!existsSync(path)) {
    return [];
  }
  try {
    const content = readFileSync(path, "utf8");
    return JSON.parse(content) as ProductTemplate[];
  } catch {
    return [];
  }
}

function writeTemplatesFile(path: string, templates: ProductTemplate[]): void {
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(path, JSON.stringify(templates, null, 2));
}

// ============================================================
// Core Templates (Built-in)
// ============================================================

/**
 * Get all core (built-in) product templates.
 */
export function getCoreTemplates(): ProductTemplate[] {
  ensureTemplatesDir();
  return readTemplatesFile(CORE_TEMPLATES_FILE);
}

/**
 * Register a core template.
 * Used during platform setup to add built-in templates.
 */
export function registerCoreTemplate(template: ProductTemplate): void {
  ensureTemplatesDir();
  const templates = readTemplatesFile(CORE_TEMPLATES_FILE);
  const existing = templates.findIndex((t) => t.id === template.id);

  const now = new Date().toISOString();
  const templateWithMeta: ProductTemplate = {
    ...template,
    origin: "core",
    createdAt: template.createdAt || now,
    updatedAt: now,
  };

  if (existing >= 0) {
    templates[existing] = templateWithMeta;
  } else {
    templates.push(templateWithMeta);
  }

  writeTemplatesFile(CORE_TEMPLATES_FILE, templates);
}

// ============================================================
// Shop Templates (Custom)
// ============================================================

/**
 * Get all templates available to a shop (core + custom).
 */
export function getTemplatesForShop(shopId: string): ProductTemplate[] {
  const safeShopId = validateShopName(shopId);

  const coreTemplates = getCoreTemplates();
  const customTemplates = readTemplatesFile(getShopTemplatesPath(safeShopId));

  // Custom templates override core templates with same ID
  const templateMap = new Map<string, ProductTemplate>();
  for (const t of coreTemplates) {
    templateMap.set(t.id, t);
  }
  for (const t of customTemplates) {
    templateMap.set(t.id, t);
  }

  return Array.from(templateMap.values()).filter((t) => t.active);
}

/**
 * Get a specific template by ID.
 */
export function getTemplate(shopId: string, templateId: string): ProductTemplate | null {
  const templates = getTemplatesForShop(shopId);
  return templates.find((t) => t.id === templateId) ?? null;
}

/**
 * Create a custom template for a shop.
 */
export function createShopTemplate(
  shopId: string,
  template: Omit<ProductTemplate, "id" | "origin" | "createdAt" | "updatedAt">
): ProductTemplate {
  const safeShopId = validateShopName(shopId);
  const now = new Date().toISOString();

  const newTemplate: ProductTemplate = {
    ...template,
    id: `custom.${safeShopId}.${ulid()}`,
    origin: "custom",
    active: template.active ?? true,
    createdAt: now,
    updatedAt: now,
  };

  const templates = readTemplatesFile(getShopTemplatesPath(safeShopId));
  templates.push(newTemplate);
  writeTemplatesFile(getShopTemplatesPath(safeShopId), templates);

  return newTemplate;
}

/**
 * Update a custom template.
 */
export function updateShopTemplate(
  shopId: string,
  templateId: string,
  updates: Partial<ProductTemplate>
): ProductTemplate | null {
  const safeShopId = validateShopName(shopId);
  const path = getShopTemplatesPath(safeShopId);
  const templates = readTemplatesFile(path);

  const index = templates.findIndex((t) => t.id === templateId);
  if (index < 0) {
    return null;
  }

  const updated: ProductTemplate = {
    ...templates[index],
    ...updates,
    id: templates[index].id, // Prevent ID change
    origin: templates[index].origin, // Prevent origin change
    updatedAt: new Date().toISOString(),
  };

  templates[index] = updated;
  writeTemplatesFile(path, templates);

  return updated;
}

/**
 * Delete a custom template.
 */
export function deleteShopTemplate(shopId: string, templateId: string): boolean {
  const safeShopId = validateShopName(shopId);
  const path = getShopTemplatesPath(safeShopId);
  const templates = readTemplatesFile(path);

  const index = templates.findIndex((t) => t.id === templateId);
  if (index < 0) {
    return false;
  }

  // Only allow deleting custom templates
  if (templates[index].origin !== "custom") {
    return false;
  }

  templates.splice(index, 1);
  writeTemplatesFile(path, templates);

  return true;
}

// ============================================================
// Template Cloning
// ============================================================

/**
 * Clone a template to create a new product.
 */
export async function cloneTemplateToProduct(
  options: CloneTemplateOptions
): Promise<CloneTemplateResult> {
  const { shopId, templateId, overrides, status = "draft", sku } = options;

  const safeShopId = validateShopName(shopId);
  const template = getTemplate(safeShopId, templateId);

  if (!template) {
    return {
      success: false,
      error: `Template not found: ${templateId}`,
    };
  }

  const now = new Date().toISOString();
  const productId = ulid();
  const generatedSku = sku || generateSkuFromTemplate(template, productId);

  // Helper to fill all locales from partial
  const fillLocales = (partial: PartialTranslated | undefined, fallback: string): Translated => {
    const base = partial ?? {};
    return {
      en: base.en ?? fallback,
      de: base.de ?? base.en ?? fallback,
      it: base.it ?? base.en ?? fallback,
    };
  };

  // Build product from template
  const product: ProductPublication = {
    id: productId,
    shop: safeShopId,
    sku: generatedSku,
    title: overrides?.title ?? fillLocales(template.title, "New Product"),
    description: overrides?.description ?? fillLocales(template.productDescription, ""),
    price: overrides?.price ?? template.price ?? 0,
    currency: overrides?.currency ?? template.currency ?? "USD",
    media: overrides?.media ?? template.media ?? [],
    status,
    row_version: 1,
    created_at: now,
    updated_at: now,
    // Rental fields
    rentalTerms: template.rentalTerms,
    deposit: template.deposit,
    forSale: template.forSale ?? true,
    forRental: template.forRental ?? false,
    dailyRate: template.dailyRate,
    weeklyRate: template.weeklyRate,
    monthlyRate: template.monthlyRate,
    wearAndTearLimit: template.wearAndTearLimit,
    maintenanceCycle: template.maintenanceCycle,
  };

  // Write to products repository
  try {
    const { readRepo, writeRepo } = await import("./repositories/products.server");
    const catalogue = await readRepo(safeShopId);
    await writeRepo(safeShopId, [product, ...catalogue]);

    return {
      success: true,
      product,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to create product: ${(error as Error).message}`,
    };
  }
}

/**
 * Clone a template to create multiple products (batch).
 */
export async function cloneTemplateBatch(
  shopId: string,
  templateId: string,
  count: number,
  options?: {
    skuPrefix?: string;
    status?: PublicationStatus;
  }
): Promise<{
  total: number;
  created: number;
  failed: number;
  products: ProductPublication[];
  errors: string[];
}> {
  const products: ProductPublication[] = [];
  const errors: string[] = [];

  for (let i = 0; i < count; i++) {
    const sku = options?.skuPrefix
      ? `${options.skuPrefix}-${String(i + 1).padStart(3, "0")}`
      : undefined;

    const result = await cloneTemplateToProduct({
      shopId,
      templateId,
      status: options?.status,
      sku,
    });

    if (result.success && result.product) {
      products.push(result.product);
    } else {
      errors.push(result.error || `Failed to create product ${i + 1}`);
    }
  }

  return {
    total: count,
    created: products.length,
    failed: errors.length,
    products,
    errors,
  };
}

/**
 * Create a template from an existing product.
 */
export function createTemplateFromProduct(
  shopId: string,
  product: ProductPublication,
  templateName: string,
  options?: {
    category?: ProductTemplateCategory;
    description?: string;
    tags?: string[];
  }
): ProductTemplate {
  return createShopTemplate(shopId, {
    name: templateName,
    description: options?.description || `Template based on ${product.sku}`,
    version: "1.0.0",
    category: options?.category || "other",
    tags: options?.tags,
    active: true,
    title: product.title,
    productDescription: product.description,
    price: product.price,
    currency: product.currency,
    media: product.media,
    rentalTerms: product.rentalTerms,
    deposit: product.deposit,
    forSale: product.forSale,
    forRental: product.forRental,
    dailyRate: product.dailyRate,
    weeklyRate: product.weeklyRate,
    monthlyRate: product.monthlyRate,
    wearAndTearLimit: product.wearAndTearLimit,
    maintenanceCycle: product.maintenanceCycle,
  });
}

// ============================================================
// Utilities
// ============================================================

function generateSkuFromTemplate(template: ProductTemplate, productId: string): string {
  // Use variant SKU pattern if available
  if (template.variants?.skuPattern) {
    const shortId = productId.slice(-6).toLowerCase();
    return template.variants.skuPattern
      .replace("{base}", template.category.slice(0, 3).toUpperCase())
      .replace("{id}", shortId);
  }

  // Default: category prefix + short ID
  const prefix = template.category.slice(0, 3).toUpperCase();
  const shortId = productId.slice(-8).toUpperCase();
  return `${prefix}-${shortId}`;
}

/**
 * List templates by category.
 */
export function getTemplatesByCategory(
  shopId: string,
  category: ProductTemplateCategory
): ProductTemplate[] {
  return getTemplatesForShop(shopId).filter((t) => t.category === category);
}

/**
 * Search templates by name or tags.
 */
export function searchTemplates(
  shopId: string,
  query: string
): ProductTemplate[] {
  const lowerQuery = query.toLowerCase();
  return getTemplatesForShop(shopId).filter(
    (t) =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description?.toLowerCase().includes(lowerQuery) ||
      t.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}

// ============================================================
// Default Core Templates
// ============================================================

/**
 * Initialize default core templates.
 * Called during platform setup.
 */
export function initializeCoreTemplates(): void {
  const defaultTemplates: ProductTemplate[] = [
    {
      id: "core.apparel.basic-tshirt",
      name: "Basic T-Shirt",
      description: "Simple t-shirt template with size variants",
      version: "1.0.0",
      category: "apparel",
      tags: ["clothing", "tshirt", "basic"],
      origin: "core",
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      title: { en: "T-Shirt" },
      productDescription: { en: "Comfortable cotton t-shirt" },
      price: 2500, // $25.00
      currency: "USD",
      forSale: true,
      forRental: false,
      variants: {
        attributes: ["size", "color"],
        options: {
          size: ["XS", "S", "M", "L", "XL", "XXL"],
          color: ["Black", "White", "Gray", "Navy"],
        },
        skuPattern: "{base}-{size}-{color}",
      },
    },
    {
      id: "core.accessories.basic-bag",
      name: "Basic Bag",
      description: "Simple bag template",
      version: "1.0.0",
      category: "accessories",
      tags: ["bag", "accessories", "basic"],
      origin: "core",
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      title: { en: "Bag" },
      productDescription: { en: "Versatile everyday bag" },
      price: 4900, // $49.00
      currency: "USD",
      forSale: true,
      forRental: false,
    },
    {
      id: "core.rental.basic-equipment",
      name: "Basic Rental Equipment",
      description: "Template for rental equipment with deposit",
      version: "1.0.0",
      category: "rental",
      tags: ["rental", "equipment"],
      origin: "core",
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      title: { en: "Equipment Rental" },
      productDescription: { en: "Equipment available for rental" },
      price: 0,
      currency: "USD",
      forSale: false,
      forRental: true,
      deposit: 5000, // $50.00 deposit
      dailyRate: 2000, // $20/day
      weeklyRate: 10000, // $100/week
      wearAndTearLimit: 100,
      maintenanceCycle: 10,
    },
  ];

  for (const template of defaultTemplates) {
    registerCoreTemplate(template);
  }
}
