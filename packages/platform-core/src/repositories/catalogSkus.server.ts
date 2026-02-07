import "server-only";

import type { Locale, ProductPublication, SKU } from "@acme/types";

import { validateShopName } from "../shops";
import type { InventoryItem } from "../types/inventory";

import { readInventory } from "./inventory.server";
import { readRepo } from "./products.server";

function localizedText(
  value: Record<string, string> | undefined,
  locale: Locale,
): string {
  if (!value) return "";
  const direct = value[locale];
  if (typeof direct === "string" && direct) return direct;
  const en = value.en;
  if (typeof en === "string" && en) return en;
  const first = Object.values(value).find((v) => typeof v === "string" && v);
  return typeof first === "string" ? first : "";
}

function productIsVisible(
  product: Pick<ProductPublication, "status">,
  { includeDraft = false }: { includeDraft?: boolean } = {},
): boolean {
  if (includeDraft) return true;
  return product.status === "active";
}

function inventoryMatchesProduct(
  item: Pick<InventoryItem, "productId">,
  product: Pick<ProductPublication, "id" | "sku">,
): boolean {
  if (item.productId === product.id) return true;
  if (product.sku && item.productId === product.sku) return true;
  return false;
}

function skuFromProduct(args: {
  shop: string;
  locale: Locale;
  product: ProductPublication;
  inventory: InventoryItem[];
}): SKU {
  const { locale, product, inventory } = args;
  const title = localizedText(product.title as unknown as Record<string, string>, locale);
  const description = localizedText(
    product.description as unknown as Record<string, string>,
    locale,
  );

  const sizes = Array.from(
    new Set(
      inventory
        .filter((i) => typeof i.quantity === "number" && i.quantity > 0)
        .map((i) => i.variantAttributes?.size)
        .filter((s): s is string => typeof s === "string" && Boolean(s.trim()))
        .map((s) => s.trim()),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const stock = inventory.reduce(
    (sum, i) => sum + (typeof i.quantity === "number" ? i.quantity : 0),
    0,
  );

  return {
    id: product.id,
    slug: product.sku ?? product.id,
    title,
    price: product.price,
    deposit: product.deposit ?? 0,
    stock,
    forSale: product.forSale ?? true,
    forRental: product.forRental ?? false,
    ...(typeof product.dailyRate === "number" ? { dailyRate: product.dailyRate } : {}),
    ...(typeof product.weeklyRate === "number" ? { weeklyRate: product.weeklyRate } : {}),
    ...(typeof product.monthlyRate === "number"
      ? { monthlyRate: product.monthlyRate }
      : {}),
    ...(typeof product.wearAndTearLimit === "number"
      ? { wearAndTearLimit: product.wearAndTearLimit }
      : {}),
    ...(typeof product.maintenanceCycle === "number"
      ? { maintenanceCycle: product.maintenanceCycle }
      : {}),
    ...(product.availability ? { availability: product.availability } : {}),
    media: product.media ?? [],
    sizes,
    description,
  };
}

export async function listShopSkus(
  shop: string,
  locale: Locale,
  { includeDraft = false }: { includeDraft?: boolean } = {},
): Promise<SKU[]> {
  const safeShop = validateShopName(shop);
  const products = await readRepo<ProductPublication>(safeShop);
  const inventory = await readInventory(safeShop).catch(() => [] as InventoryItem[]);

  const visible = products.filter((p) => productIsVisible(p, { includeDraft }));

  return visible.map((product) =>
    skuFromProduct({
      shop: safeShop,
      locale,
      product,
      inventory: inventory.filter((item) => inventoryMatchesProduct(item, product)),
    }),
  );
}

export async function getShopSkuBySlug(
  shop: string,
  slugOrId: string,
  locale: Locale,
  { includeDraft = false }: { includeDraft?: boolean } = {},
): Promise<SKU | null> {
  const safeShop = validateShopName(shop);
  const products = await readRepo<ProductPublication>(safeShop);
  const product = products.find((p) => p.sku === slugOrId || p.id === slugOrId);
  if (!product) return null;
  if (!productIsVisible(product, { includeDraft })) return null;
  const inventory = await readInventory(safeShop).catch(() => [] as InventoryItem[]);
  return skuFromProduct({
    shop: safeShop,
    locale,
    product,
    inventory: inventory.filter((item) => inventoryMatchesProduct(item, product)),
  });
}

export async function getShopSkuById(
  shop: string,
  id: string,
  locale: Locale,
  { includeDraft = false }: { includeDraft?: boolean } = {},
): Promise<SKU | null> {
  return getShopSkuBySlug(shop, id, locale, { includeDraft });
}

