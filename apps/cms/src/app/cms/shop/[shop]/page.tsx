// apps/cms/src/app/cms/shop/[shop]/page.tsx

import { checkShopExists } from "@lib/checkShopExists.server";
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
    </div>
  );
}
