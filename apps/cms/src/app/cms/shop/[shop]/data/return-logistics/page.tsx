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
      accent: "bg-sky-500/20 text-sky-200",
    },
    {
      label: "Home pickup ZIPs",
      value: String(pickupZipCount || 0),
      caption: "Coverage for scheduled pickups",
      accent: "bg-emerald-500/20 text-emerald-200",
    },
    {
      label: "Tracking",
      value: trackingEnabled ? "Enabled" : "Disabled",
      caption: trackingEnabled ? "Customers receive tracking" : "No tracking numbers",
      accent: trackingEnabled ? "bg-indigo-500/20 text-indigo-200" : "bg-slate-500/20 text-slate-200",
    },
    {
      label: "In-store returns",
      value: inStoreEnabled ? "Allowed" : "Disabled",
      caption: inStoreEnabled ? "Customers can drop off in person" : "Drop-off only",
      accent: inStoreEnabled ? "bg-amber-500/20 text-amber-200" : "bg-slate-500/20 text-slate-200",
    },
  ];

  return (
    <div className="space-y-8 text-white">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(236,72,153,0.18),_transparent_55%)]" />
        <div className="relative space-y-4 px-6 py-7">
          <Tag variant="default" className="bg-white/10 text-white/70">
            Return logistics · {shop}
          </Tag>
          <h1 className="text-3xl font-semibold md:text-4xl">
            Streamline every return and pickup experience
          </h1>
          <p className="text-sm text-white/70">
            Tune carrier preferences, label service, and pickup coverage to keep customers smiling and ops efficient.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickStats.map((stat) => (
              <div
                key={stat.label}
                className={cn(
                  "rounded-2xl border border-white/10 px-4 py-3 backdrop-blur",
                  stat.accent
                )}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                  {stat.label}
                </p>
                <p className="text-xl font-semibold text-white">{stat.value}</p>
                <p className="text-xs text-white/70">{stat.caption}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <Card className="border border-white/10 bg-slate-950/70 shadow-lg">
          <CardContent className="space-y-4 px-6 py-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Return policy configuration</h2>
                <p className="text-sm text-white/70">
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
