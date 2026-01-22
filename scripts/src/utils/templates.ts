import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { CreateShopOptions } from "@acme/platform-core/createShop";

/** List immediate child directory names of a given path. */
export function listDirNames(path: string): string[] {
  return readdirSync(path, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

/** Load default navItems and pages from the template's shop.json if available. */
export function loadTemplateDefaults(
  template: string,
  root = process.cwd(),
): {
  navItems?: CreateShopOptions["navItems"];
  pages?: CreateShopOptions["pages"];
} {
  try {
    const raw = readFileSync(
      join(root, "packages", template, "shop.json"),
      "utf8",
    );
    const data = JSON.parse(raw);
    const defaults: {
      navItems?: CreateShopOptions["navItems"];
      pages?: CreateShopOptions["pages"];
    } = {};
    if (Array.isArray(data.navItems)) defaults.navItems = data.navItems;
    if (Array.isArray(data.pages)) defaults.pages = data.pages;
    return defaults;
  } catch {
    return {};
  }
}

/** Load navigation and page presets from data/templates/default if present. */
export function loadPresetDefaults(
  root = process.cwd(),
): {
  navItems?: CreateShopOptions["navItems"];
  pages?: CreateShopOptions["pages"];
} {
  try {
    const base = join(root, "data", "templates", "default");
    const result: {
      navItems?: CreateShopOptions["navItems"];
      pages?: CreateShopOptions["pages"];
    } = {};
    try {
      const navRaw = readFileSync(join(base, "navigation.json"), "utf8");
      const nav = JSON.parse(navRaw);
      if (Array.isArray(nav)) result.navItems = nav;
    } catch {
      /* ignore */
    }
    try {
      const pagesRaw = readFileSync(join(base, "pages.json"), "utf8");
      const pg = JSON.parse(pagesRaw);
      if (Array.isArray(pg)) result.pages = pg;
    } catch {
      /* ignore */
    }
    return result;
  } catch {
    return {};
  }
}

