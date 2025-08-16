// apps/cms/src/app/cms/shop/[shop]/page.tsx

import { checkShopExists } from "@acme/lib";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { promises as fs } from "node:fs";
import path from "node:path";

export const metadata: Metadata = {
  title: "Dashboard · Base-Shop",
};

export default async function ShopDashboardPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop } = await params;
  if (!(await checkShopExists(shop))) return notFound();

  let hasUpgrade = false;
  try {
    await fs.access(
      path.resolve(
        process.cwd(),
        "..",
        `shop-${shop}`,
        "upgrade-changes.json",
      ),
    );
    hasUpgrade = true;
  } catch {
    // no upgrade staged
  }
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Dashboard – {shop}</h2>
      <p>
        Welcome to the {shop} shop dashboard. Use the sidebar to manage content.
      </p>
      {hasUpgrade && (
        <p className="mt-4">
          <a
            href={`/cms/shop/${shop}/upgrade-preview`}
            className="text-blue-600 underline"
          >
            Preview upgrade changes
          </a>
        </p>
      )}
      <form
        action={`/api/shop/${shop}/rollback`}
        method="post"
        className="mt-4"
      >
        <button
          type="submit"
          className="rounded bg-red-600 px-4 py-2 text-white"
        >
          Revert to previous version
        </button>
      </form>
    </div>
  );
}
