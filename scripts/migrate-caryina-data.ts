/**
 * One-off migration: caryina products.json + inventory.json → PostgreSQL.
 *
 * Usage:
 *   DATABASE_URL="..." npx tsx scripts/migrate-caryina-data.ts [--dry-run]
 *
 * --dry-run  Print what would be inserted without writing to the database.
 *
 * Idempotent: uses upsert on the (shopId, sku) unique constraint for products
 * and on the (shopId, sku, variantKey) unique constraint for inventory items.
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";


const SHOP = "caryina";
const DATA_DIR = path.resolve(process.cwd(), "data", "shops", SHOP);
const DRY_RUN = process.argv.includes("--dry-run");

function variantKey(sku: string, attrs: Record<string, string>): string {
  const variantPart = Object.entries(attrs)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join("|");
  return variantPart ? `${sku}#${variantPart}` : sku;
}

interface RawProduct {
  id: string;
  sku: string;
  title: Record<string, string>;
  description: Record<string, string>;
  price: number;
  currency: string;
  media: unknown[];
  materials?: Record<string, string>;
  dimensions?: { h: number; w: number; d: number; unit: string };
  weight?: { value: number; unit: string };
  status: string;
  row_version: number;
  created_at: string;
  updated_at: string;
  deposit?: number;
  forSale?: boolean;
  forRental?: boolean;
}

interface RawInventoryItem {
  sku: string;
  productId: string;
  quantity: number;
  variantAttributes: Record<string, string>;
  lowStockThreshold?: number;
}

async function run() {
  const productsPath = path.join(DATA_DIR, "products.json");
  const inventoryPath = path.join(DATA_DIR, "inventory.json");

  if (!fs.existsSync(productsPath)) {
    throw new Error(`products.json not found at ${productsPath}`);
  }
  if (!fs.existsSync(inventoryPath)) {
    throw new Error(`inventory.json not found at ${inventoryPath}`);
  }

  const products: RawProduct[] = JSON.parse(fs.readFileSync(productsPath, "utf-8"));
  const inventory: RawInventoryItem[] = JSON.parse(fs.readFileSync(inventoryPath, "utf-8"));

  console.log(
    `[migrate] Found ${products.length} product(s) and ${inventory.length} inventory row(s) for shop "${SHOP}".`,
  );

  if (DRY_RUN) {
    console.log("\n[dry-run] Products to upsert:");
    for (const p of products) {
      console.log(`  ${p.id}  sku=${p.sku}  price=${p.price}  status=${p.status}`);
    }
    console.log("\n[dry-run] Inventory rows to upsert:");
    for (const item of inventory) {
      const vk = variantKey(item.sku, item.variantAttributes);
      console.log(
        `  sku=${item.sku}  productId=${item.productId}  qty=${item.quantity}  variantKey=${vk}`,
      );
    }
    console.log("\n[dry-run] No writes performed.");
    return;
  }

  const prisma = new PrismaClient();

  try {
    // --- Products ---
    let productUpserted = 0;
    for (const p of products) {
      await prisma.product.upsert({
        where: { shopId_sku: { shopId: SHOP, sku: p.sku } },
        create: {
          id: p.id,
          shopId: SHOP,
          sku: p.sku,
          title: p.title,
          description: p.description,
          media: p.media,
          price: p.price,
          currency: p.currency,
          status: p.status,
          row_version: p.row_version ?? 1,
          forSale: p.forSale ?? true,
          forRental: p.forRental ?? false,
          deposit: p.deposit ?? 0,
          materials: p.materials ?? undefined,
          dimensions: p.dimensions ?? undefined,
          weight: p.weight ?? undefined,
          createdAt: new Date(p.created_at),
          updatedAt: new Date(p.updated_at),
        },
        update: {
          title: p.title,
          description: p.description,
          media: p.media,
          price: p.price,
          currency: p.currency,
          status: p.status,
          row_version: p.row_version ?? 1,
          forSale: p.forSale ?? true,
          forRental: p.forRental ?? false,
          deposit: p.deposit ?? 0,
          materials: p.materials ?? undefined,
          dimensions: p.dimensions ?? undefined,
          weight: p.weight ?? undefined,
          updatedAt: new Date(p.updated_at),
        },
      });
      productUpserted++;
      console.log(`[migrate] Product upserted: ${p.sku}`);
    }

    // --- Inventory ---
    let inventoryUpserted = 0;
    for (const item of inventory) {
      const vk = variantKey(item.sku, item.variantAttributes);
      await prisma.inventoryItem.upsert({
        where: { shopId_sku_variantKey: { shopId: SHOP, sku: item.sku, variantKey: vk } },
        create: {
          shopId: SHOP,
          sku: item.sku,
          productId: item.productId,
          quantity: item.quantity,
          variantAttributes: item.variantAttributes,
          variantKey: vk,
          lowStockThreshold: item.lowStockThreshold ?? null,
        },
        update: {
          quantity: item.quantity,
          lowStockThreshold: item.lowStockThreshold ?? null,
        },
      });
      inventoryUpserted++;
      console.log(`[migrate] InventoryItem upserted: ${item.sku} (${vk})`);
    }

    console.log(
      `\n[migrate] Done. ${productUpserted} product(s) + ${inventoryUpserted} inventory row(s) upserted for shop "${SHOP}".`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

run().catch((err) => {
  console.error("[migrate] Fatal error:", err);
  process.exit(1);
});
