import fs from "fs/promises";
import path from "path";
import { resolveDataRoot } from "@platform-core/dataRoot";
import { readRbac } from "@cms/lib/server/rbacStore";

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
      label: "Active users",
      value: numberFormatter.format(users),
      caption:
        users === 0
          ? "Invite teammates to collaborate"
          : `${users === 1 ? "person" : "people"} with workspace access`,
    },
    {
      label: "Live shops",
      value: numberFormatter.format(shops),
      caption:
        shops === 0
          ? "Create your first shop to go live"
          : `${shops === 1 ? "storefront" : "storefronts"} active`,
    },
    {
      label: "Catalog size",
      value: numberFormatter.format(products),
      caption:
        products === 0
          ? "No products imported yet"
          : `${products === 1 ? "product" : "products"} across all shops`,
    },
  ];
}
