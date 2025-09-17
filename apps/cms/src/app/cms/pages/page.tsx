// apps/cms/src/app/cms/pages/page.tsx

import Link from "next/link";
import { listShops } from "../../../lib/listShops";
import { Card, CardContent } from "@/components/atoms/shadcn";
import { Tag } from "@ui/components/atoms";

export default async function PagesIndexPage() {
  const shops = await listShops();

  return (
    <div className="space-y-8 text-white">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(147,197,253,0.2),_transparent_55%)]" />
        <div className="relative space-y-4 px-6 py-7">
          <Tag variant="default" className="bg-white/10 text-white/70">
            Content · Choose a shop
          </Tag>
          <h1 className="text-3xl font-semibold md:text-4xl">
            Start crafting the story for each storefront
          </h1>
          <p className="text-sm text-white/70">
            Select a shop to manage its landing pages, navigation, and editorial layouts.
          </p>
        </div>
      </section>

      <section>
        <Card className="border border-white/10 bg-slate-950/70 shadow-lg">
          <CardContent className="grid gap-3 px-6 py-6 sm:grid-cols-2 lg:grid-cols-3">
            {shops.map((shop) => (
              <Link
                key={shop}
                href={`/cms/shop/${shop}/pages`}
                className="group rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-sm font-medium text-white shadow-sm transition hover:border-white/40 hover:bg-white/10"
              >
                <span className="block text-xs uppercase tracking-wider text-white/50">
                  Shop
                </span>
                <span className="text-lg font-semibold">{shop.toUpperCase()}</span>
                <span className="mt-2 block text-xs text-white/60">
                  Manage static pages, navigation routes, and published experiences.
                </span>
              </Link>
            ))}
            {shops.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-sm text-white/70">
                No shops found yet.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
