import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function repoRootFromRuntimeFile(runtimeFileUrl: string): string {
  const runtimeDir = path.dirname(fileURLToPath(runtimeFileUrl));
  return path.resolve(runtimeDir, "../../../..");
}

const PRODUCT_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/i;
const PRODUCT_FILES = [
  "config.schema.json",
  "manufacturing.map.json",
  "pricing.json",
  "rules.json",
] as const;
type ProductFile = (typeof PRODUCT_FILES)[number];

function assertProductFile(filename: string): asserts filename is ProductFile {
  if (!PRODUCT_FILES.includes(filename as ProductFile)) {
    // i18n-exempt -- ABC-123 [ttl=2026-01-31] non-UI error string
    throw new Error("invalid product file");
  }
}

export async function loadProductJson(productIdRaw: string, filename: string) {
  if (!PRODUCT_ID_PATTERN.test(productIdRaw)) {
    // i18n-exempt -- ABC-123 [ttl=2026-01-31] non-UI error string
    throw new Error("invalid productId");
  }
  assertProductFile(filename);

  const repoRoot = repoRootFromRuntimeFile(import.meta.url);
  const file = path.join(repoRoot, "products", productIdRaw, filename);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123 path built from allowlisted file and validated product id
  const raw = await readFile(file, "utf8");
  return JSON.parse(raw) as unknown;
}
