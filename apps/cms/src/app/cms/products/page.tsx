// apps/cms/src/app/cms/products/page.tsx

import ProductsShopChooser from "./ProductsShopChooser.client";
import { Tag } from "@ui/components/atoms";
import { listShops } from "../../../lib/listShops";

export default async function ProductsIndexPage() {
  const shops = await listShops();
  return (
    <div className="space-y-8 text-foreground">
      <section className="relative overflow-hidden rounded-3xl border border-border/10 bg-slate-950 shadow-xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.25),_transparent_55%)]" />
        <div className="relative space-y-4 px-6 py-8">
          <Tag variant="default">
            Catalog · Choose a shop
          </Tag>
          <h1 className="text-3xl font-semibold md:text-4xl">
            Keep every assortment launch-ready
          </h1>
          <p className="text-sm text-muted-foreground">
            Select a shop to refine product metadata, bundling, and availability before go-live.
          </p>
        </div>
      </section>

      <ProductsShopChooser shops={shops} />
    </div>
  );
}
