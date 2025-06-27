// apps/cms/src/app/cms/page.tsx
import { USERS } from "@cms/auth/users";
import { DashboardTemplate } from "@ui/components/templates";
import type { Metadata } from "next";
import fs from "node:fs/promises";
import path from "node:path";

export const metadata: Metadata = {
  title: "Dashboard · Base-Shop",
};

async function collectStats() {
  const shopsDir = path.resolve(process.cwd(), "data", "shops");
  let shops: string[] = [];
  try {
    const entries = await fs.readdir(shopsDir, { withFileTypes: true });
    shops = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    shops = [];
  }

  let productCount = 0;
  for (const shop of shops) {
    const file = path.join(shopsDir, shop, "products.json");
    try {
      const json = JSON.parse(await fs.readFile(file, "utf8"));
      if (Array.isArray(json)) productCount += json.length;
    } catch {
      // ignore
    }
  }

  return {
    users: Object.keys(USERS).length,
    shops: shops.length,
    products: productCount,
  };
}

export default async function CmsDashboardPage() {
  const { users, shops, products } = await collectStats();
  const stats = [
    { label: "Users", value: users },
    { label: "Shops", value: shops },
    { label: "Products", value: products },
  ];
  return <DashboardTemplate stats={stats} />;
}
