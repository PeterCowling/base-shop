// apps/cms/src/app/cms/media/page.tsx

import { Tag } from "@acme/design-system/atoms";

import { listShops } from "../../../lib/listShops";

import MediaShopChooser from "./MediaShopChooser.client";

export default async function MediaIndexPage() {
  const shops = await listShops();
  return (
    <div className="space-y-8 text-foreground">
      <section className="relative overflow-hidden rounded-3xl border border-border/10 bg-hero-contrast text-hero-foreground shadow-elevation-4">
        <div className="relative space-y-4 px-6 py-8">
          <Tag variant="default">
            Media · Choose a shop
          </Tag>
          <h1 className="text-3xl font-semibold md:text-4xl">
            Curate visuals for each storefront
          </h1>
          <p className="text-sm text-hero-foreground/90">
            Select a shop to organise assets, rights, and variants with confidence.
          </p>
        </div>
      </section>

      <MediaShopChooser shops={shops} />
    </div>
  );
}
