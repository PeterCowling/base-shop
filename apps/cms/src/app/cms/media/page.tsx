// apps/cms/src/app/cms/media/page.tsx

import MediaShopChooser from "./MediaShopChooser.client";
import { Tag } from "@ui/components/atoms";
import { listShops } from "../../../lib/listShops";

export default async function MediaIndexPage() {
  const shops = await listShops();
  return (
    <div className="space-y-8 text-foreground">
      <section className="relative overflow-hidden rounded-3xl border border-border/10 bg-hero text-primary-foreground shadow-xl">
        <div className="relative space-y-4 px-6 py-8">
          <Tag variant="default">
            Media · Choose a shop
          </Tag>
          <h1 className="text-3xl font-semibold md:text-4xl">
            Curate visuals for each storefront
          </h1>
          <p className="text-sm text-primary-foreground/80">
            Select a shop to organise assets, rights, and variants with confidence.
          </p>
        </div>
      </section>

      <MediaShopChooser shops={shops} />
    </div>
  );
}
