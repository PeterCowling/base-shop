// apps/cms/src/app/cms/orders/page.tsx

import { Tag } from "@acme/design-system/atoms";

import { listShops } from "../../../lib/listShops";

import OrdersShopChooser from "./OrdersShopChooser.client";

export default async function OrdersIndexPage() {
  const shops = await listShops();
  return (
    <div className="space-y-8 text-foreground">
      <section className="relative overflow-hidden rounded-3xl border border-border/10 bg-hero-contrast text-hero-foreground shadow-elevation-4">
        <div className="relative space-y-4 px-6 py-8">
          <Tag variant="default">
            Orders · Choose a shop
          </Tag>
          <h1 className="text-3xl font-semibold md:text-4xl">
            Stay ahead of order flows across storefronts
          </h1>
          <p className="text-sm text-hero-foreground/90">
            Select a shop to review rentals, returns, and risk signals before they escalate.
          </p>
        </div>
      </section>

      <OrdersShopChooser shops={shops} />
    </div>
  );
}
