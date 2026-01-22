import fs from "node:fs";
import path from "node:path";

import {
  DEFAULT_STOREFRONT as DEFAULT_STOREFRONT_VALUE,
  getStorefrontConfig as getStorefrontConfigValue,
  parseStorefront as parseStorefrontValue,
  XA_CATALOG_STOREFRONTS as XA_CATALOG_STOREFRONTS_VALUE,
} from "./catalogStorefront.ts";
import type {
  XaCatalogStorefront,
  XaCatalogStorefrontConfig,
} from "./catalogStorefront.types";
import { resolveRepoRoot } from "./repoRoot";

export const DEFAULT_STOREFRONT = DEFAULT_STOREFRONT_VALUE;
export const XA_CATALOG_STOREFRONTS = XA_CATALOG_STOREFRONTS_VALUE;
export const parseStorefront = parseStorefrontValue;
export const getStorefrontConfig = getStorefrontConfigValue;
export type { XaCatalogStorefront, XaCatalogStorefrontConfig };

export function resolveCatalogProductsCsvPath(
  storefront?: XaCatalogStorefront | string | null,
): string {
  const config = getStorefrontConfigValue(storefront);
  const defaultPath = path.join(
    "apps",
    "xa-uploader",
    "data",
    `products.${config.id}.csv`,
  );
  const fromEnv =
    config.id === DEFAULT_STOREFRONT_VALUE
      ? process.env.XA_UPLOADER_PRODUCTS_CSV_PATH?.trim()
      : "";
  const selected = fromEnv || defaultPath;
  if (path.isAbsolute(selected)) return selected;
  const repoRoot = resolveRepoRoot();
  const resolved = path.join(repoRoot, selected);
  if (config.id === DEFAULT_STOREFRONT_VALUE && !fromEnv) {
    const legacyPath = path.join(repoRoot, "apps", "xa-uploader", "data", "products.csv");
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123 repo path constructed from known config
    if (!fs.existsSync(resolved) && fs.existsSync(legacyPath)) {
      return legacyPath;
    }
  }
  return resolved;
}

export function resolveStorefrontCatalogPaths(
  storefront?: XaCatalogStorefront | string | null,
): { catalogOutPath: string; mediaOutPath: string } {
  const config = getStorefrontConfigValue(storefront);
  const repoRoot = resolveRepoRoot();
  return {
    catalogOutPath: path.join(repoRoot, "apps", config.appDir, "src", "data", "catalog.json"),
    mediaOutPath: path.join(repoRoot, "apps", config.appDir, "src", "data", "catalog.media.json"),
  };
}
