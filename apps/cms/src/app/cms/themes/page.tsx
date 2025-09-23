// apps/cms/src/app/cms/themes/page.tsx

import ThemesShopChooser from "./ThemesShopChooser.client";
import { Tag } from "@ui/components/atoms";
import { listShops } from "../../../lib/listShops";

export default async function ThemesIndexPage() {
  const shops = await listShops();
  return (
    <div className="space-y-8 text-foreground">
      <section className="relative overflow-hidden rounded-3xl border border-border/10 bg-hero-contrast text-hero-foreground shadow-elevation-4">
        <div className="relative space-y-4 px-6 py-8">
          <Tag variant="default">
            Themes · Choose a shop
          </Tag>
          <h1 className="text-3xl font-semibold md:text-4xl">
            Tailor the look and feel per shop
          </h1>
          <p className="text-sm text-hero-foreground/90">
            Select a shop to swap themes, adjust palettes, and preview storefronts before publishing.
          </p>
        </div>
      </section>

      <ThemesShopChooser shops={shops} />
    </div>
  );
}
