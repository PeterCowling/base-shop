import { checkShopExists } from "@acme/lib";
import { readInventory } from "@platform-core/repositories/inventory.server";
import { notFound } from "next/navigation";
import InventoryForm from "./InventoryForm";
import { Card, CardContent } from "@/components/atoms/shadcn";
import { Tag } from "@ui/components/atoms";
import { cn } from "@ui/utils/style";

export const revalidate = 0;

export default async function InventoryPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
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

  const quickStats = [
    {
      label: "Tracked SKUs",
      value: String(totalItems),
      caption: "Items monitored in this shop",
      accent: "bg-surface-3 text-foreground",
    },
    {
      label: "Low stock",
      value: String(lowStockItems.length),
      caption: "At or below threshold",
      accent: "bg-surface-3 text-foreground",
    },
    {
      label: "Maintenance due",
      value: String(maintenanceNeeded.length),
      caption: "Exceeded wear limit",
      accent: "bg-surface-3 text-foreground",
    },
    {
      label: "Variants tracked",
      value: String(variantAttributes.size),
      caption: "Unique attribute dimensions",
      accent: "bg-surface-3 text-foreground",
    },
  ];

  return (
    <div className="space-y-8 text-foreground">
      <section className="relative overflow-hidden rounded-3xl border border-border/10 bg-hero-contrast text-hero-foreground shadow-elevation-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_hsl(var(--color-success)/0.18),_transparent_50%)]" />
        <div className="relative space-y-4 px-6 py-7">
          <Tag variant="default">
            Inventory · {shop}
          </Tag>
          <h1 className="text-3xl font-semibold md:text-4xl">
            Keep stock levels, wear cycles, and attributes aligned
          </h1>
          <p className="text-sm text-hero-foreground/80">
            Adjust thresholds, import updates, and monitor wear & tear before it impacts fulfillment.
          </p>
          <div className="grid gap-3 sm:grid-cols-4">
            {quickStats.map((stat) => (
              <div
                key={stat.label}
                className={cn(
                  "rounded-2xl border border-border/10 px-4 py-3",
                  stat.accent
                )}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </p>
                <p className="text-xl font-semibold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.caption}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <Card className="border border-border/10 bg-surface-2 shadow-elevation-3">
          <CardContent className="space-y-4 px-6 py-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold">Inventory matrix</h2>
                <p className="text-sm text-muted-foreground">
                  Edit quantities, variant attributes, and maintenance data in one place.
                </p>
              </div>
              <Tag className="shrink-0" variant="default">
                {totalItems} items tracked
              </Tag>
            </div>
            <InventoryForm shop={shop} initial={initial} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
