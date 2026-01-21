import { readRbac } from "@cms/lib/server/rbacStore";
import fs from "fs/promises";
import path from "path";

import { resolveDataRoot } from "@acme/platform-core/dataRoot";

export type Stats = {
  users: number;
  shops: number;
  products: number;
};

export type QuickStat = {
  label: string;
  value: string;
  caption: string;
};

const numberFormatter = new Intl.NumberFormat();

export async function collectStats(): Promise<Stats> {
  const shopsDir = resolveDataRoot();

  let shops: string[] = [];
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ENG-1234: Path comes from trusted workspace config (data root)
    const entries = await fs.readdir(shopsDir, { withFileTypes: true });
    shops = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  } catch {
    shops = [];
  }

  let productCount = 0;
  await Promise.all(
    shops.map(async (shop) => {
      const file = path.join(shopsDir, shop, "products.json");
      try {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- ENG-1234: Path assembled from trusted data root and shop dirent
        const buf = await fs.readFile(file, "utf8");
        const json = JSON.parse(buf);
        if (Array.isArray(json)) {
          productCount += json.length;
        }
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
          console.error(`Failed reading ${file}`, err);
        }
      }
    })
  );

  const { users: usersMap } = await readRbac();

  return {
    users: Object.keys(usersMap).length,
    shops: shops.length,
    products: productCount,
  };
}

export function buildQuickStats({ users, shops, products }: Stats): QuickStat[] {
  return [
    {
      // i18n-exempt: ENG-1234 Pending UX copy handoff to i18n
      label: "Active users",
      value: numberFormatter.format(users),
      caption:
        users === 0
          ? "Invite teammates to collaborate" // i18n-exempt: ENG-1234 Pending i18n; non-critical onboarding helper
          : `${users === 1 ? "person" : "people"} with workspace access`,
    },
    {
      // i18n-exempt: ENG-1234 Pending UX copy handoff to i18n
      label: "Live shops",
      value: numberFormatter.format(shops),
      caption:
        shops === 0
          ? "Create your first shop to go live" // i18n-exempt: ENG-1234 Pending i18n; non-critical onboarding helper
          : `${shops === 1 ? "storefront" : "storefronts"} active`,
    },
    {
      // i18n-exempt: ENG-1234 Pending UX copy handoff to i18n
      label: "Catalog size",
      value: numberFormatter.format(products),
      caption:
        products === 0
          ? "No products imported yet" // i18n-exempt: ENG-1234 Pending i18n; non-critical onboarding helper
          : `${products === 1 ? "product" : "products"} across all shops`,
    },
  ];
}
