// apps/cms/src/app/cms/pages/page.tsx

import Link from "next/link";
import { listShops } from "../../../lib/listShops";
import { Card, CardContent } from "@/components/atoms/shadcn";
import { Tag } from "@ui/components/atoms";

export default async function PagesIndexPage() {
  const shops = await listShops();

  return (
    <div className="space-y-8 text-foreground">
      <section className="relative overflow-hidden rounded-3xl border border-border-1 bg-hero-contrast text-hero-foreground shadow-elevation-4">
        <div className="relative space-y-4 px-6 py-7">
          <Tag variant="default">
            Content · Choose a shop
          </Tag>
          <h1 className="text-3xl font-semibold md:text-4xl">
            Start crafting the story for each storefront
          </h1>
          <p className="text-sm text-hero-foreground/90">
            Select a shop to manage its landing pages, navigation, and editorial layouts.
          </p>
        </div>
      </section>

      <section>
        <Card className="border border-border-1 bg-surface-2 shadow-elevation-3">
          <CardContent className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
            {shops.map((shop) => (
              <Link
                key={shop}
                href={`/cms/shop/${shop}/pages`}
                className="group rounded-2xl border border-border-1 bg-surface-2 px-4 py-5 text-sm font-medium text-foreground shadow-elevation-1 transition hover:border-border-3 hover:bg-surface-3"
              >
                <span className="block text-xs uppercase tracking-wider text-foreground">
                  Shop
                </span>
                <span className="text-lg font-semibold text-foreground">{shop.toUpperCase()}</span>
                <span className="mt-2 block text-xs text-foreground">
                  Manage static pages, navigation routes, and published experiences.
                </span>
              </Link>
            ))}
            {shops.length === 0 && (
              <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-5 text-sm text-foreground">
                No shops found yet.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
