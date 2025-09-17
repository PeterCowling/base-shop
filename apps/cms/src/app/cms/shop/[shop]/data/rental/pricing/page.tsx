import { checkShopExists } from "@acme/lib";
import { readPricing } from "@platform-core/repositories/pricing.server";
import { notFound } from "next/navigation";
import PricingForm from "./PricingForm";
import { Card, CardContent } from "@/components/atoms/shadcn";
import { Tag } from "@ui/components/atoms";
import { cn } from "@ui/utils/style";
import { formatNumber } from "@acme/shared-utils";

export const revalidate = 0;

export default async function PricingPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop } = await params;
  if (!(await checkShopExists(shop))) return notFound();
  const initial = await readPricing();

  const tiers = initial.durationDiscounts.length;
  const depositCodes = Object.entries(initial.damageFees).filter(([, value]) => value === "deposit").length;
  const coverageEnabled = Object.keys(initial.coverage ?? {}).length;

  const quickStats = [
    {
      label: "Base daily rate",
      value: `$${formatNumber(initial.baseDailyRate, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      caption: "Default fallback when no SKU override exists",
      accent: "bg-emerald-500/20 text-emerald-100",
    },
    {
      label: "Discount tiers",
      value: tiers ? String(tiers) : "None",
      caption: tiers ? "Longer bookings receive incentives" : "Add tiers to reward duration",
      accent: tiers ? "bg-sky-500/20 text-sky-100" : "bg-slate-500/30 text-slate-100",
    },
    {
      label: "Deposit defaults",
      value: depositCodes ? `${depositCodes} damage codes` : "None",
      caption: depositCodes ? "Automatically reserve deposits when triggered" : "No deposit rules configured",
      accent: depositCodes ? "bg-amber-500/20 text-amber-100" : "bg-slate-500/30 text-slate-100",
    },
    {
      label: "Coverage entries",
      value: coverageEnabled ? String(coverageEnabled) : "Optional",
      caption: coverageEnabled ? "Fee & waiver rules live for customers" : "Add coverage to offset risk",
      accent: coverageEnabled ? "bg-indigo-500/20 text-indigo-100" : "bg-slate-500/30 text-slate-100",
    },
  ];

  return (
    <div className="space-y-8 text-white">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_55%)]" />
        <div className="relative space-y-4 px-6 py-8">
          <Tag variant="default" className="bg-white/10 text-white/70">
            Rental pricing · {shop}
          </Tag>
          <h1 className="text-3xl font-semibold md:text-4xl">Tune rates, deposits, and coverage with confidence</h1>
          <p className="text-sm text-white/70 md:text-base">
            Build predictable rental revenue by balancing base rates, long-stay discounts, and how you recover for damage or loss.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickStats.map((stat) => (
              <div
                key={stat.label}
                className={cn(
                  "rounded-2xl border border-white/10 px-4 py-3 text-xs text-white/70 backdrop-blur",
                  stat.accent
                )}
              >
                <p className="font-semibold uppercase tracking-wide">{stat.label}</p>
                <p className="mt-1 text-lg font-semibold text-white">{stat.value}</p>
                <p className="text-xs text-white/70">{stat.caption}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <Card className="border border-white/10 bg-slate-950/70 text-white shadow-lg">
          <CardContent className="space-y-4 px-6 py-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">Pricing controls</h2>
                <p className="max-w-2xl text-sm text-white/70">
                  Work through the guided editor, import JSON from finance, or export the latest rules to share with merchandising partners.
                </p>
              </div>
            </div>
            <PricingForm shop={shop} initial={initial} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
