// packages/platform-core/repositories/json.ts
import * as fsSync from "node:fs";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { ulid } from "ulid";
import type { Shop, ShopSettings } from "../../types";
import { LOCALES, type Locale } from "../../types";
import { ProductPublication } from "../products";
import { validateShopName } from "../shops";

/* -------------------------------------------------------------------------- */
/*  Locate monorepo root (= folder that contains /data/shops)                 */
/* -------------------------------------------------------------------------- */
function resolveDataRoot(): string {
  let dir = process.cwd();

  while (true) {
    const candidate = path.join(dir, "data", "shops");
    if (fsSync.existsSync(candidate)) return candidate;

    const parent = path.dirname(dir);
    if (parent === dir) break; // reached filesystem root
    dir = parent;
  }

  // Fallback: original behaviour (likely incorrect inside apps/*)
  return path.resolve(process.cwd(), "data", "shops");
}

const DATA_ROOT = resolveDataRoot();
const DEFAULT_LANGUAGES: Locale[] = [...LOCALES];

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

/** Path like data/shops/abc/products.json */
function filePath(shop: string): string {
  shop = validateShopName(shop);

  return path.join(DATA_ROOT, shop, "products.json");
}

/** Path like data/shops/abc/settings.json */
function settingsPath(shop: string): string {
  shop = validateShopName(shop);

  return path.join(DATA_ROOT, shop, "settings.json");
}

/** Path like data/shops/abc/shop.json */
function shopPath(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "shop.json");
}

/** Ensure `data/shops/<shop>` exists (mkdir -p). */
async function ensureDir(shop: string): Promise<void> {
  shop = validateShopName(shop);

  await fs.mkdir(path.join(DATA_ROOT, shop), { recursive: true });
}

export async function readSettings(shop: string): Promise<ShopSettings> {
  try {
    const buf = await fs.readFile(settingsPath(shop), "utf8");
    const parsed = JSON.parse(buf) as ShopSettings;
    if (Array.isArray(parsed.languages)) return parsed;
  } catch {
    // ignore
  }
  return {
    languages: DEFAULT_LANGUAGES,
    seo: {},
    updatedAt: "",
    updatedBy: "",
  };
}

export async function writeSettings(
  shop: string,
  settings: ShopSettings
): Promise<void> {
  await ensureDir(shop);
  const tmp = `${settingsPath(shop)}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(settings, null, 2), "utf8");
  await fs.rename(tmp, settingsPath(shop));
}

export async function readShop(shop: string): Promise<Shop> {
  try {
    const buf = await fs.readFile(shopPath(shop), "utf8");
    const parsed = JSON.parse(buf) as Shop;
    if (parsed.id) return parsed;
  } catch {
    // ignore
  }
  return {
    id: shop,
    name: shop,
    catalogFilters: [],
    themeId: "base",
    themeTokens: {},
    filterMappings: {},
  };
}

export async function writeShop(shop: string, info: Shop): Promise<void> {
  await ensureDir(shop);
  const tmp = `${shopPath(shop)}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(info, null, 2), "utf8");
  await fs.rename(tmp, shopPath(shop));
}

/* -------------------------------------------------------------------------- */
/*  Public API                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Read catalogue for a shop (returns empty array if file missing/invalid)
 */
export async function readRepo<T = ProductPublication>(
  shop: string
): Promise<T[]> {
  try {
    const buf = await fs.readFile(filePath(shop), "utf8");
    return JSON.parse(buf) as T[];
  } catch {
    // file missing or invalid ⇒ start with empty repo
    return [] as T[];
  }
}

/**
 * Write full catalogue atomically
 */
export async function writeRepo<T = ProductPublication>(
  shop: string,
  catalogue: T[]
): Promise<void> {
  await ensureDir(shop);
  const tmp = `${filePath(shop)}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(catalogue, null, 2), "utf8");
  await fs.rename(tmp, filePath(shop)); // atomic on most POSIX fs
}

/* -------------------------------------------------------------------------- */
/*  CRUD helpers for CMS                                                      */
/* -------------------------------------------------------------------------- */

export async function getProductById<
  T extends { id: string } = ProductPublication,
>(shop: string, id: string): Promise<T | null> {
  const catalogue = await readRepo<T>(shop);
  return catalogue.find((p) => p.id === id) ?? null;
}

export async function updateProductInRepo<
  T extends { id: string; row_version: number } = ProductPublication,
>(
  shop: string,

  patch: Partial<T> & { id: string }
): Promise<T> {
  const catalogue = await readRepo<T>(shop);
  const idx = catalogue.findIndex((p) => p.id === patch.id);

  if (idx === -1) throw new Error(`Product ${patch.id} not found in ${shop}`);

  const updated: T = {
    ...catalogue[idx],
    ...patch,
    row_version: catalogue[idx].row_version + 1,
  };

  catalogue[idx] = updated;
  await writeRepo<T>(shop, catalogue);
  return updated;
}

export async function deleteProductFromRepo<
  T extends { id: string } = ProductPublication,
>(shop: string, id: string): Promise<void> {
  const catalogue = await readRepo<T>(shop);
  const next = catalogue.filter((p) => p.id !== id);
  if (next.length === catalogue.length) {
    throw new Error(`Product ${id} not found in ${shop}`);
  }
  await writeRepo<T>(shop, next);
}

export async function duplicateProductInRepo<
  T extends ProductPublication = ProductPublication,
>(shop: string, id: string): Promise<T> {
  const catalogue = await readRepo<T>(shop);
  const original = catalogue.find((p) => p.id === id);
  if (!original) throw new Error(`Product ${id} not found in ${shop}`);
  const now = new Date().toISOString();
  const copy: T = {
    ...original,
    id: ulid(),
    sku: `${original.sku}-copy`,
    status: "draft",
    row_version: 1,
    created_at: now,
    updated_at: now,
  };
  await writeRepo<T>(shop, [copy, ...catalogue]);
  return copy;
}

export async function getShopById<T = Shop>(shop: string): Promise<T> {
  return readShop(shop) as Promise<T>;
}

export async function updateShopInRepo<T extends { id: string } = Shop>(
  shop: string,
  patch: Partial<T> & { id: string }
): Promise<T> {
  const current = (await readShop(shop)) as unknown as T;
  if (current.id !== patch.id) {
    throw new Error(`Shop ${patch.id} not found in ${shop}`);
  }
  const updated: T = { ...current, ...patch };
  await writeShop(shop, updated as unknown as Shop);
  return updated;
}
