// apps/cms/src/app/cms/shop/[shop]/page.tsx

import { checkShopExists } from "@acme/lib";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

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
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Dashboard – {shop}</h2>
      <p>
        Welcome to the {shop} shop dashboard. Use the sidebar to manage content.
      </p>
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
