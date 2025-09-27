import { promises as fs } from "node:fs";
import * as path from "node:path";
import { DATA_ROOT } from "../dataRoot";
import { validateShopName } from "../shops/index";

function resolvedBase(base: string): string {
  return path.resolve(base);
}

function ensureInside(base: string, target: string): string {
  const baseResolved = resolvedBase(base) + path.sep;
  const targetResolved = path.resolve(target);
  if (!(targetResolved + path.sep).startsWith(baseResolved)) {
    throw new Error("Resolved path escapes base directory"); // i18n-exempt -- CORE-1010 internal error message
  }
  return targetResolved;
}

export function shopPath(shop: string, ...segments: string[]): string {
  const safeShop = validateShopName(shop);
  const candidate = path.resolve(DATA_ROOT, safeShop, ...segments);
  return ensureInside(DATA_ROOT, candidate);
}

export async function readFromShop(
  shop: string,
  file: string,
  encoding: BufferEncoding | null = "utf8",
): Promise<string | Buffer> {
  const p = shopPath(shop, file);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- CORE-1010 path validated and normalized via shopPath()
  return fs.readFile(p, encoding as BufferEncoding);
}

export async function writeToShop(
  shop: string,
  file: string,
  data: string | Uint8Array,
  encoding: BufferEncoding | null = "utf8",
): Promise<void> {
  const p = shopPath(shop, file);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- CORE-1010 path validated and normalized via shopPath()
  await fs.writeFile(p, data, encoding as BufferEncoding);
}

export async function appendToShop(
  shop: string,
  file: string,
  data: string | Uint8Array,
  encoding: BufferEncoding | null = "utf8",
): Promise<void> {
  const p = shopPath(shop, file);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- CORE-1010 path validated and normalized via shopPath()
  await fs.appendFile(p, data, encoding as BufferEncoding);
}

export async function renameInShop(
  shop: string,
  from: string,
  to: string,
): Promise<void> {
  const src = shopPath(shop, from);
  const dst = shopPath(shop, to);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- CORE-1010 path validated and normalized via shopPath()
  await fs.rename(src, dst);
}

export async function ensureShopDir(shop: string): Promise<void> {
  const dir = shopPath(shop);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- CORE-1010 path validated and normalized via shopPath()
  await fs.mkdir(dir, { recursive: true });
}

export async function listShopsInDataRoot(): Promise<string[]> {
  const base = resolvedBase(DATA_ROOT);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- CORE-1010 directory is internal constant DATA_ROOT
  const entries = await fs.readdir(base, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
}
