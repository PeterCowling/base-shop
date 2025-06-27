// apps/cms/src/app/cms/page.tsx
import { Button } from "@/components/atoms-shim";
import { approveAccount, listPendingUsers } from "@cms/actions/accounts";
import { authOptions } from "@cms/auth/options";
import type { Role } from "@cms/auth/roles";
import { USERS } from "@cms/auth/users";
import type { StatItem } from "@ui/components/organisms/StatsGrid";
import { DashboardTemplate } from "@ui/components/templates";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import fsSync from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

export const metadata: Metadata = {
  title: "Dashboard · Base-Shop",
};

export const revalidate = 0;

type Stats = {
  users: number;
  shops: number;
  products: number;
};

/**
 * Walk upward from the current working directory to locate the monorepo-level
 * `data/shops` folder. Falls back to `<cwd>/data/shops` if the search reaches
 * the filesystem root without a hit.
 */
function resolveDataRoot(): string {
  let dir = process.cwd();

  while (true) {
    const candidate = path.join(dir, "data", "shops");
    if (fsSync.existsSync(candidate)) return candidate;

    const parent = path.dirname(dir);
    if (parent === dir) break; // reached FS root
    dir = parent;
  }

  return path.resolve(process.cwd(), "data", "shops");
}

async function collectStats(): Promise<Stats> {
  const shopsDir = resolveDataRoot();

  let shops: string[] = [];
  try {
    const entries = await fs.readdir(shopsDir, { withFileTypes: true });
    shops = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    shops = [];
  }

  let productCount = 0;
  await Promise.all(
    shops.map(async (shop) => {
      const file = path.join(shopsDir, shop, "products.json");
      try {
        const json = JSON.parse(await fs.readFile(file, "utf8"));
        if (Array.isArray(json)) productCount += json.length;
      } catch {
        /* ignore malformed or missing product files */
      }
    })
  );

  return {
    users: Object.keys(USERS).length,
    shops: shops.length,
    products: productCount,
  };
}

export default async function CmsDashboardPage() {
  const session = await getServerSession(authOptions);

  const { users, shops, products } = await collectStats();

  const stats: StatItem[] = [
    { label: "Users", value: users },
    { label: "Shops", value: shops },
    { label: "Products", value: products },
  ];

  let pending: Awaited<ReturnType<typeof listPendingUsers>> = [];
  if (session?.user.role === "admin") {
    pending = await listPendingUsers();
  }

  async function approve(formData: FormData) {
    "use server";
    await approveAccount(formData);
  }

  const roles: Role[] = [
    "admin",
    "viewer",
    "ShopAdmin",
    "CatalogManager",
    "ThemeEditor",
  ];

  return (
    <div className="space-y-6">
      <DashboardTemplate stats={stats} />
      {session?.user.role === "admin" && (
        <div>
          <h2 className="mb-4 text-xl font-semibold">Account Requests</h2>
          {pending.length === 0 ? (
            <p>No pending requests.</p>
          ) : (
            pending.map((r) => (
              <form
                key={r.id}
                action={approve}
                className="mb-4 rounded border p-3"
              >
                <input type="hidden" name="id" value={r.id} />
                <p>
                  <b>{r.name}</b> ({r.email})
                </p>
                <div className="my-2 flex flex-wrap gap-2">
                  {roles.map((role) => (
                    <label
                      key={role}
                      className="flex items-center gap-1 text-sm"
                    >
                      <input type="checkbox" name="roles" value={role} />
                      {role}
                    </label>
                  ))}
                </div>
                <Button type="submit">Approve</Button>
              </form>
            ))
          )}
        </div>
      )}
    </div>
  );
}
