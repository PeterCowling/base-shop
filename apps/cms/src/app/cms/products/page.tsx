// apps/cms/src/app/cms/products/page.tsx

import { Tag } from "@acme/ui/components/atoms";

import { listShops } from "../../../lib/listShops";

import ProductsShopChooser from "./ProductsShopChooser.client";

export default async function ProductsIndexPage() {
  const shops = await listShops();
  return (
    <div className="space-y-8 text-foreground">
      <section className="relative overflow-hidden rounded-3xl border border-border/10 bg-hero-contrast text-hero-foreground shadow-elevation-4">
        <div className="relative space-y-4 px-6 py-8">
          <Tag variant="default">
            Catalog · Choose a shop
          </Tag>
          <h1 className="text-3xl font-semibold md:text-4xl">
            Keep every assortment launch-ready
          </h1>
          <p className="text-sm text-hero-foreground/80">
            Select a shop to refine product metadata, bundling, and availability before go-live.
          </p>
        </div>
      </section>

      <ProductsShopChooser shops={shops} />
    </div>
  );
}
