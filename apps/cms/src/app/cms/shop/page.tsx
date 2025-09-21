// apps/cms/src/app/cms/shop/page.tsx

import ShopIndexShopChooser from "./ShopIndexShopChooser.client";
import { Tag } from "@ui/components/atoms";
import { listShops } from "../../../lib/listShops";

export const metadata = {
  title: "Choose shop · Base-Shop",
};

export default async function ShopIndexPage() {
  const shops = await listShops();
  return (
    <div className="space-y-8 text-foreground">
      <section className="relative overflow-hidden rounded-3xl border border-border/10 bg-hero text-primary-foreground shadow-xl">
        <div className="relative space-y-4 px-6 py-8">
          <Tag variant="default">
            Operations · Choose a shop
          </Tag>
          <h1 className="text-3xl font-semibold md:text-4xl">
            Launch operations from the right storefront
          </h1>
          <p className="text-sm text-primary-foreground/80">
            Select a shop to review health, automate workflows, and dive into analytics tailored to that storefront.
          </p>
        </div>
      </section>

      <ShopIndexShopChooser shops={shops} />
    </div>
  );
}
