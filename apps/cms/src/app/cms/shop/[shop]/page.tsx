//apps/cms/src/app/cms/shop/[shop]/page.tsx

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard · Base-Shop",
};

export default async function ShopDashboardPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop } = await params;
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Dashboard – {shop}</h2>
      <p>
        Welcome to the {shop} shop dashboard. Use the sidebar to manage content.
      </p>
    </div>
  );
}
