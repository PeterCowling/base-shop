// apps/cms/src/app/cms/page.tsx
import { Button } from "@/components/atoms/shadcn";
import { approveAccount, listPendingUsers } from "@cms/actions/accounts.server";
import { authOptions } from "@cms/auth/options";
import type { Role } from "@cms/auth/roles";
import { readRbac } from "@cms/lib/rbacStore";
import type { ReactNode } from "react";
import { DashboardTemplate } from "@ui/components/templates";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import fs from "fs/promises";
import path from "path";
import { resolveDataRoot } from "@platform-core/dataRoot";

export const metadata: Metadata = {
  title: "Dashboard · Base-Shop",
};

export const revalidate = 0;

type Stats = {
  users: number;
  shops: number;
  products: number;
};

type StatItem = {
  label: string;
  value: ReactNode;
};

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
        const buf = await fs.readFile(file, "utf8");
        const json = JSON.parse(buf);
        if (Array.isArray(json)) productCount += json.length;
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
      {shops === 0 && (
        <div className="rounded border border-dashed p-4">
          <p className="mb-2">
            No shops found. Get started by creating your first shop.
          </p>
          {session?.user.role === "admin" && (
            <Link
              href="/cms/wizard"
              className="bg-primary hover:bg-primary/90 focus-visible:ring-primary rounded-md px-3 py-2 text-sm text-white focus-visible:ring-2 focus-visible:outline-none"
            >
              Create Shop
            </Link>
          )}
        </div>
      )}
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
