import { checkShopExists } from "@acme/lib";
import { readReturnLogistics } from "@platform-core/repositories/returnLogistics.server";
import { notFound } from "next/navigation";
import ReturnLogisticsForm from "./ReturnLogisticsForm";
import { Card, CardContent } from "@/components/atoms/shadcn";
import { Tag } from "@ui/components/atoms";
import { cn } from "@ui/utils/style";

export const revalidate = 0;

export default async function ReturnLogisticsPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop } = await params;
  if (!(await checkShopExists(shop))) return notFound();
  const initial = await readReturnLogistics();
  const carrierCount = initial.returnCarrier.length;
  const pickupZipCount = initial.homePickupZipCodes.length;
  const trackingEnabled = Boolean(initial.tracking);
  const inStoreEnabled = Boolean(initial.inStore);

  const quickStats = [
    {
      label: "Return carriers",
      value: String(carrierCount || 0),
      caption: "Configured shipping partners",
      accent: "bg-info/20 text-foreground",
    },
    {
      label: "Home pickup ZIPs",
      value: String(pickupZipCount || 0),
      caption: "Coverage for scheduled pickups",
      accent: "bg-success/20 text-foreground",
    },
    {
      label: "Tracking",
      value: trackingEnabled ? "Enabled" : "Disabled",
      caption: trackingEnabled ? "Customers receive tracking" : "No tracking numbers",
      accent: trackingEnabled ? "bg-primary/20 text-foreground" : "bg-muted/20 text-foreground",
    },
    {
      label: "In-store returns",
      value: inStoreEnabled ? "Allowed" : "Disabled",
      caption: inStoreEnabled ? "Customers can drop off in person" : "Drop-off only",
      accent: inStoreEnabled ? "bg-warning/20 text-foreground" : "bg-muted/20 text-foreground",
    },
  ];

  return (
    <div className="space-y-8 text-foreground">
      <section className="relative overflow-hidden rounded-3xl border border-border/10 bg-hero text-primary-foreground shadow-xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_hsl(var(--color-accent)/0.18),_transparent_55%)]" />
        <div className="relative space-y-4 px-6 py-7">
          <Tag variant="default">
            Return logistics · {shop}
          </Tag>
          <h1 className="text-3xl font-semibold md:text-4xl">
            Streamline every return and pickup experience
          </h1>
          <p className="text-sm text-muted-foreground">
            Tune carrier preferences, label service, and pickup coverage to keep customers smiling and ops efficient.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickStats.map((stat) => (
              <div
                key={stat.label}
                className={cn(
                  "rounded-2xl border border-border/10 px-4 py-3 backdrop-blur",
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
        <Card className="border border-border/10 bg-surface-2 shadow-lg">
          <CardContent className="space-y-4 px-6 py-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Return policy configuration</h2>
                <p className="text-sm text-muted-foreground">
                  Set preferred carriers, coverage areas, and bag options in one place.
                </p>
              </div>
            </div>
            <ReturnLogisticsForm shop={shop} initial={initial} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
