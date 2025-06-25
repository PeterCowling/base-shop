// packages/platform-core/repositories/json.ts
import * as fsSync from "node:fs";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { ulid } from "ulid";
import type { Locale, ShopSettings } from "../../types";
import { ProductPublication } from "../products";

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
const DEFAULT_LANGUAGES: Locale[] = ["en", "de", "it"];

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

/** Path like data/shops/abc/products.json */
function filePath(shop: string): string {
  return path.join(DATA_ROOT, shop, "products.json");
}

/** Path like data/shops/abc/settings.json */
function settingsPath(shop: string): string {
  return path.join(DATA_ROOT, shop, "settings.json");
}

/** Ensure `data/shops/<shop>` exists (mkdir -p). */
async function ensureDir(shop: string): Promise<void> {
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
  return { languages: DEFAULT_LANGUAGES };
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

/* -------------------------------------------------------------------------- */
/*  Public API                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Read catalogue for a shop (returns empty array if file missing/invalid)
 */
export async function readRepo(shop: string): Promise<ProductPublication[]> {
  try {
    const buf = await fs.readFile(filePath(shop), "utf8");
    return JSON.parse(buf) as ProductPublication[];
  } catch {
    // file missing or invalid ⇒ start with empty repo
    return [];
  }
}

/**
 * Write full catalogue atomically
 */
export async function writeRepo(
  shop: string,
  catalogue: ProductPublication[]
): Promise<void> {
  await ensureDir(shop);
  const tmp = `${filePath(shop)}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(catalogue, null, 2), "utf8");
  await fs.rename(tmp, filePath(shop)); // atomic on most POSIX fs
}

/* -------------------------------------------------------------------------- */
/*  CRUD helpers for CMS                                                      */
/* -------------------------------------------------------------------------- */

export async function getProductById(
  shop: string,
  id: string
): Promise<ProductPublication | null> {
  const catalogue = await readRepo(shop);
  return catalogue.find((p) => p.id === id) ?? null;
}

export async function updateProductInRepo(
  shop: string,
  patch: Partial<ProductPublication> & { id: string }
): Promise<ProductPublication> {
  const catalogue = await readRepo(shop);
  const idx = catalogue.findIndex((p) => p.id === patch.id);
  if (idx === -1) throw new Error(`Product ${patch.id} not found in ${shop}`);

  const updated: ProductPublication = {
    ...catalogue[idx],
    ...patch,
    row_version: catalogue[idx].row_version + 1,
  };

  catalogue[idx] = updated;
  await writeRepo(shop, catalogue);
  return updated;
}

export async function deleteProductFromRepo(
  shop: string,
  id: string
): Promise<void> {
  const catalogue = await readRepo(shop);
  const next = catalogue.filter((p) => p.id !== id);
  if (next.length === catalogue.length) {
    throw new Error(`Product ${id} not found in ${shop}`);
  }
  await writeRepo(shop, next);
}

export async function duplicateProductInRepo(
  shop: string,
  id: string
): Promise<ProductPublication> {
  const catalogue = await readRepo(shop);
  const original = catalogue.find((p) => p.id === id);
  if (!original) throw new Error(`Product ${id} not found in ${shop}`);
  const now = new Date().toISOString();
  const copy: ProductPublication = {
    ...original,
    id: ulid(),
    sku: `${original.sku}-copy`,
    status: "draft",
    row_version: 1,
    created_at: now,
    updated_at: now,
  };
  await writeRepo(shop, [copy, ...catalogue]);
  return copy;
}
