/* eslint-disable security/detect-non-literal-fs-filename -- DS-9999 [ttl=2026-12-31] Reads shop data from dynamic DATA_ROOT paths */
import "server-only";

import { promises as fs } from "node:fs";
import * as fsSync from "node:fs";
import * as path from "node:path";
import type { Locale } from "@/types/locale";
import type { Product, ProductColor, ProductSize, ProductVariant } from "@/types/product";

type Localized<T> = Record<string, T>;

type CochlearfitProductRecord = {
  id?: string;
  sku: string;
  status?: string;
  title?: Localized<string>;
  description?: Localized<string>;
  media?: Array<{
    url: string;
    type: "image" | "video";
    altText?: string;
    title?: string;
  }>;
  style?: Localized<string>;
  shortDescription?: Localized<string>;
  longDescription?: Localized<string>;
  featureBullets?: Localized<string[]>;
  materials?: Localized<string[]>;
  careInstructions?: Localized<string[]>;
  compatibilityNotes?: Localized<string[]>;
};

type InventoryRecord = {
  sku: string;
  quantity: number;
  variant?: Record<string, string>;
  variantAttributes?: Record<string, string>;
  [key: string]: unknown;
};

type VariantPricingRecord = {
  id: string;
  productSlug: string;
  size: ProductSize;
  color: ProductColor;
  price: number;
  currency: ProductVariant["currency"];
  stripePriceId: string;
};

const SHOP_ID = "cochlearfit";

const COLORS: Array<{ key: ProductColor; label: string; hex: string }> = [
  { key: "sand", label: "Sand", hex: "hsl(var(--color-sand))" },
  { key: "ocean", label: "Ocean", hex: "hsl(var(--color-ocean))" },
  { key: "berry", label: "Berry", hex: "hsl(var(--color-berry))" },
];

const SIZES: Array<{ key: ProductSize; label: string }> = [
  { key: "kids", label: "Kids" },
  { key: "adult", label: "Adult" },
];

function resolveDataRoot(): string {
  const env = process.env["DATA_ROOT"];
  if (typeof env === "string" && env.trim()) {
    return path.resolve(env);
  }

  let dir = process.cwd();
  let found: string | undefined;

  while (true) {
    const candidate = path.join(dir, "data", "shops");
    if (fsSync.existsSync(candidate)) {
      found = candidate;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return found ?? path.join(process.cwd(), "data", "shops");
}

function pickLocalized<T>(
  value: Localized<T> | undefined,
  locale: Locale,
): T | undefined {
  if (!value) return undefined;
  if (Object.prototype.hasOwnProperty.call(value, locale)) {
    return value[locale];
  }
  if (Object.prototype.hasOwnProperty.call(value, "en")) {
    return value["en"];
  }
  const first = Object.values(value)[0];
  return first;
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function buildVariants(args: {
  productSlug: string;
  pricing: VariantPricingRecord[];
  stockByVariantId: Map<string, number>;
}): ProductVariant[] {
  const { productSlug, pricing, stockByVariantId } = args;
  const records = pricing.filter((row) => row.productSlug === productSlug);

  if (!records.length) {
    return SIZES.flatMap((size) =>
      COLORS.map((color) => {
        const id = `${productSlug}-${size.key}-${color.key}`;
        const quantity = stockByVariantId.get(id);
        return {
          id,
          size: size.key,
          color: color.key,
          colorLabel: color.label,
          colorHex: color.hex,
          price: 0,
          currency: "USD",
          stripePriceId: `price_${productSlug}_${size.key}_${color.key}`,
          inStock: typeof quantity === "number" ? quantity > 0 : true,
        };
      }),
    );
  }

  const sizeOrder = new Map(SIZES.map((s, idx) => [s.key, idx]));
  const colorOrder = new Map(COLORS.map((c, idx) => [c.key, idx]));

  return records
    .map((row) => {
      const sizeMeta = SIZES.find((s) => s.key === row.size);
      const colorMeta = COLORS.find((c) => c.key === row.color);
      if (!sizeMeta || !colorMeta) return null;
      const quantity = stockByVariantId.get(row.id);
      return {
        id: row.id,
        size: sizeMeta.key,
        color: colorMeta.key,
        colorLabel: colorMeta.label,
        colorHex: colorMeta.hex,
        price: typeof row.price === "number" ? row.price : 0,
        currency: "USD",
        stripePriceId: typeof row.stripePriceId === "string" ? row.stripePriceId : "",
        inStock: typeof quantity === "number" ? quantity > 0 : true,
      } satisfies ProductVariant;
    })
    .filter((row): row is ProductVariant => Boolean(row))
    .sort((a, b) => {
      const sizeDiff = (sizeOrder.get(a.size) ?? 999) - (sizeOrder.get(b.size) ?? 999);
      if (sizeDiff !== 0) return sizeDiff;
      return (colorOrder.get(a.color) ?? 999) - (colorOrder.get(b.color) ?? 999);
    });
}

async function readShopProducts(): Promise<CochlearfitProductRecord[]> {
  const dataRoot = resolveDataRoot();
  const productsPath = path.join(dataRoot, SHOP_ID, "products.json");
  const raw = await readJsonFile<unknown>(productsPath, []);
  return Array.isArray(raw) ? (raw as CochlearfitProductRecord[]) : [];
}

async function readVariantPricing(): Promise<VariantPricingRecord[]> {
  const dataRoot = resolveDataRoot();
  const variantsPath = path.join(dataRoot, SHOP_ID, "variants.json");
  const raw = await readJsonFile<unknown>(variantsPath, []);
  return Array.isArray(raw) ? (raw as VariantPricingRecord[]) : [];
}

async function readStockMap(): Promise<Map<string, number>> {
  const dataRoot = resolveDataRoot();
  const inventoryPath = path.join(dataRoot, SHOP_ID, "inventory.json");
  const raw = await readJsonFile<unknown>(inventoryPath, []);
  const rows = Array.isArray(raw) ? (raw as InventoryRecord[]) : [];
  const map = new Map<string, number>();

  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    if (typeof row.sku !== "string") continue;
    const qty = typeof row.quantity === "number" ? row.quantity : Number(row.quantity);
    map.set(row.sku, Number.isFinite(qty) ? Math.max(0, Math.floor(qty)) : 0);
  }

  return map;
}

export async function listCochlearfitProducts(locale: Locale): Promise<Product[]> {
  const [products, pricing, stockByVariantId] = await Promise.all([
    readShopProducts(),
    readVariantPricing(),
    readStockMap(),
  ]);

  return products
    .filter((product) => (product.status ?? "active") === "active")
    .map((product) => {
      const slug = product.sku;

      const media = Array.isArray(product.media) ? product.media : [];
      const images = media
        .filter((item) => item?.type === "image" && typeof item.url === "string")
        .map((item) => ({
          src: item.url,
          alt:
            item.altText ??
            pickLocalized(product.title, locale) ??
            slug,
          width: 820,
          height: 520,
        }));

      return {
        id: product.id ?? slug,
        slug,
        name: pickLocalized(product.title, locale) ?? slug,
        style: pickLocalized(product.style, locale) ?? "",
        shortDescription:
          pickLocalized(product.shortDescription, locale) ??
          pickLocalized(product.description, locale) ??
          "",
        longDescription:
          pickLocalized(product.longDescription, locale) ??
          pickLocalized(product.description, locale) ??
          "",
        featureBullets: pickLocalized(product.featureBullets, locale) ?? [],
        materials: pickLocalized(product.materials, locale) ?? [],
        careInstructions: pickLocalized(product.careInstructions, locale) ?? [],
        compatibilityNotes: pickLocalized(product.compatibilityNotes, locale) ?? [],
        images,
        variants: buildVariants({
          productSlug: slug,
          pricing,
          stockByVariantId,
        }),
      };
    });
}

export async function getCochlearfitProductBySlug(
  locale: Locale,
  slug: string,
): Promise<Product | null> {
  const products = await listCochlearfitProducts(locale);
  return products.find((p) => p.slug === slug) ?? null;
}

export async function listCochlearfitProductSlugs(): Promise<string[]> {
  const products = await readShopProducts();
  return products
    .filter((product) => (product.status ?? "active") === "active")
    .map((p) => p.sku)
    .filter((sku): sku is string => typeof sku === "string" && sku.length > 0);
}
