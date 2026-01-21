import { notFound } from "next/navigation";

import { useTranslations as serverT } from "@acme/i18n/useTranslations.server";
import { checkShopExists } from "@acme/platform-core";
import { readInventory } from "@acme/platform-core/repositories/inventory.server";
import { Tag } from "@acme/ui/components/atoms";
import { Grid as DSGrid } from "@acme/ui/components/atoms/primitives";
import { cn } from "@acme/ui/utils/style";

import { Card, CardContent } from "@/components/atoms/shadcn";

import InventoryForm from "./InventoryForm";
import { INVENTORY_STAT_ACCENT, INVENTORY_STAT_CONTAINER } from "./styles";

export const revalidate = 0;

export default async function InventoryPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const t = await serverT("en");
  const { shop } = await params;
  if (!(await checkShopExists(shop))) return notFound();
  const initial = await readInventory(shop);
  const totalItems = initial.length;
  const lowStockItems = initial.filter(
    (item) => {
      const threshold = item.lowStockThreshold ?? 0;
      return Number.isFinite(item.quantity) && item.quantity <= threshold && threshold > 0;
    }
  );
  const maintenanceNeeded = initial.filter(
    (item) => {
      if (typeof item.wearAndTearLimit !== "number" || typeof item.wearCount !== "number") {
        return false;
      }
      return item.wearCount >= item.wearAndTearLimit;
    }
  );
  const variantAttributes = new Set<string>();
  initial.forEach((item) => {
    Object.keys(item.variantAttributes ?? {}).forEach((key) => variantAttributes.add(key));
  });

  const accentClass = INVENTORY_STAT_ACCENT;
  const statContainerClass = INVENTORY_STAT_CONTAINER;
  const quickStats = [
    {
      label: t("cms.inventory.stats.trackedSkus.label"),
      value: String(totalItems),
      caption: t("cms.inventory.stats.trackedSkus.caption"),
      accent: accentClass,
    },
    {
      label: t("cms.inventory.stats.lowStock.label"),
      value: String(lowStockItems.length),
      caption: t("cms.inventory.stats.lowStock.caption"),
      accent: accentClass,
    },
    {
      label: t("cms.inventory.stats.maintenance.label"),
      value: String(maintenanceNeeded.length),
      caption: t("cms.inventory.stats.maintenance.caption"),
      accent: accentClass,
    },
    {
      label: t("cms.inventory.stats.variantAttrs.label"),
      value: String(variantAttributes.size),
      caption: t("cms.inventory.stats.variantAttrs.caption"),
      accent: accentClass,
    },
  ];

  return (
    <div className="space-y-8 text-foreground">
      <section className="relative overflow-hidden rounded-3xl border border-border/10 bg-hero-contrast text-hero-foreground shadow-elevation-4">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-success/20 to-transparent" />
        <div className="relative space-y-4 px-6 py-7">
          <Tag variant="default">{t("cms.inventory.tag").replace("{shop}", shop)}</Tag>
          <h1 className="text-3xl font-semibold md:text-4xl">
            {t("cms.inventory.heading")}
          </h1>
          <p className="text-sm text-hero-foreground/80">
            {t("cms.inventory.subheading")}
          </p>
          {/* i18n-exempt — utility classes only inside stat cards */}
          <DSGrid cols={1} gap={3} className="sm:grid-cols-4">
            {quickStats.map((stat) => (
              <div
                key={stat.label}
                className={cn(statContainerClass, stat.accent)}
                >
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </p>
                <p className="text-xl font-semibold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.caption}</p>
              </div>
            ))}
          </DSGrid>
        </div>
      </section>

      <section>
        <Card className="border border-border/10 bg-surface-2 shadow-elevation-3">
          <CardContent className="space-y-4 px-6 py-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold">{t("cms.inventory.matrix.title")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("cms.inventory.matrix.desc")}
                </p>
              </div>
              <Tag className="shrink-0" variant="default">
                {t("cms.inventory.itemsTracked").replace("{count}", String(totalItems))}
              </Tag>
            </div>
            <InventoryForm shop={shop} initial={initial} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
