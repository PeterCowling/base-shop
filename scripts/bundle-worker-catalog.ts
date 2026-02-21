import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type Localized<T> = Record<string, T>;

type CochlearfitProductRecord = {
  sku: string;
  title?: Localized<string>;
};

type VariantPricingRecord = {
  id: string;
  productSlug: string;
  size: "kids" | "adult";
  color: "sand" | "ocean" | "berry";
  price: number;
  currency: "USD";
  stripePriceId: string;
};

type InventoryRecord = {
  sku: string;
  quantity: number;
};

type WorkerCatalogVariant = {
  id: string;
  stripePriceId: string;
  price: number;
  currency: "USD";
  size: "kids" | "adult";
  color: "sand" | "ocean" | "berry";
  productNameKey: string;
  inStock: boolean;
};

function repoRootFromThisFile(): string {
  const thisFile = fileURLToPath(import.meta.url);
  // scripts/ -> repo root
  return path.resolve(path.dirname(thisFile), "..");
}

function parseArgs(argv: string[]): { dataDir: string; outFile: string } {
  const root = repoRootFromThisFile();
  let dataDir = path.join(root, "data", "shops", "cochlearfit");
  let outFile = path.join(
    root,
    "apps",
    "cochlearfit-worker",
    "src",
    "worker-catalog.generated.ts",
  );

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--data-dir") {
      const next = argv[i + 1];
      if (!next) {
        throw new Error("--data-dir requires a value");
      }
      dataDir = path.resolve(next);
      i += 1;
      continue;
    }
    if (arg === "--out") {
      const next = argv[i + 1];
      if (!next) {
        throw new Error("--out requires a value");
      }
      outFile = path.resolve(next);
      i += 1;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      console.log(
        "Usage: bundle-worker-catalog [--data-dir <shopDir>] [--out <outFile>]",
      );
      process.exit(0);
    }
  }

  return { dataDir, outFile };
}

async function readRequiredJsonArray<T>(filePath: string, label: string): Promise<T[]> {
  if (!existsSync(filePath)) {
    throw new Error(`${label} not found at ${filePath}`);
  }
  const raw = await readFile(filePath, "utf8");
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON array at ${filePath}`);
  }
  return parsed as T[];
}

function pickEn(value: Localized<string> | undefined): string | null {
  if (!value) return null;
  if (typeof value.en === "string" && value.en.trim()) return value.en;
  const first = Object.values(value)[0];
  if (typeof first === "string" && first.trim()) return first;
  return null;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function validatePriceId(id: string, variantId: string): void {
  assert(typeof id === "string" && id.length > 0, `Missing Stripe Price ID for variant ${variantId}`);
  assert(
    id.startsWith("price_"),
    `Stripe Price ID malformed for variant ${variantId}: expected prefix price_`,
  );
}

async function main(): Promise<void> {
  const { dataDir, outFile } = parseArgs(process.argv.slice(2));

  const productsPath = path.join(dataDir, "products.json");
  const variantsPath = path.join(dataDir, "variants.json");
  const inventoryPath = path.join(dataDir, "inventory.json");

  const [products, variants, inventory] = await Promise.all([
    readRequiredJsonArray<CochlearfitProductRecord>(productsPath, "products.json"),
    readRequiredJsonArray<VariantPricingRecord>(variantsPath, "variants.json"),
    readRequiredJsonArray<InventoryRecord>(inventoryPath, "inventory.json"),
  ]);

  const productNameKeyBySlug = new Map<string, string>();
  for (const product of products) {
    assert(product && typeof product === "object", "Invalid product row: expected object");
    assert(typeof product.sku === "string" && product.sku.trim(), "Invalid product row: missing sku");
    const key = pickEn(product.title);
    assert(key, `Product ${product.sku} missing title.en (translation key)`);
    productNameKeyBySlug.set(product.sku, key);
  }

  const stockBySku = new Map<string, number>();
  for (const row of inventory) {
    if (!row || typeof row !== "object") continue;
    if (typeof row.sku !== "string") continue;
    const qty = typeof row.quantity === "number" ? row.quantity : Number(row.quantity);
    stockBySku.set(row.sku, Number.isFinite(qty) ? Math.max(0, Math.floor(qty)) : 0);
  }

  const output: WorkerCatalogVariant[] = [];
  for (const row of variants) {
    assert(row && typeof row === "object", "Invalid variant row: expected object");
    assert(typeof row.id === "string" && row.id.trim(), "Invalid variant row: missing id");
    assert(typeof row.productSlug === "string" && row.productSlug.trim(), `Variant ${row.id} missing productSlug`);
    assert(row.currency === "USD", `Variant ${row.id} has unsupported currency ${String((row as any).currency)}`);
    validatePriceId(row.stripePriceId, row.id);

    const productNameKey = productNameKeyBySlug.get(row.productSlug);
    assert(productNameKey, `Variant ${row.id} references unknown productSlug ${row.productSlug}`);

    const qty = stockBySku.get(row.id);
    output.push({
      id: row.id,
      stripePriceId: row.stripePriceId,
      price: Number(row.price ?? 0),
      currency: "USD",
      size: row.size,
      color: row.color,
      productNameKey,
      inStock: typeof qty === "number" ? qty > 0 : true,
    });
  }

  output.sort((a, b) => a.id.localeCompare(b.id));

  const header = `// This file is generated by scripts/bundle-worker-catalog.ts.
// Do not edit manually.

`;
  const typeDef = `export type WorkerCatalogVariant = {
  id: string;
  stripePriceId: string;
  price: number;
  currency: "USD";
  size: "kids" | "adult";
  color: "sand" | "ocean" | "berry";
  productNameKey: string;
  inStock: boolean;
};

`;
  const body = `export const catalog: ReadonlyArray<WorkerCatalogVariant> = ${JSON.stringify(output, null, 2)};
`;

  await mkdir(path.dirname(outFile), { recursive: true });
  await writeFile(outFile, header + typeDef + body, "utf8");
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`bundle-worker-catalog failed: ${message}`);
  process.exit(1);
});
