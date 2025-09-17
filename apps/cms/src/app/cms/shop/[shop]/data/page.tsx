import Link from "next/link";
import { Button, Card, CardContent } from "@/components/atoms/shadcn";
import { Tag } from "@ui/components/atoms";
import { ArrowRightIcon } from "@radix-ui/react-icons";

const cards = [
  {
    title: "Inventory health",
    eyebrow: "Stock accuracy",
    description:
      "Import CSV updates, adjust quantities, and monitor wear thresholds before they impact fulfillment.",
    bullets: [
      "Bulk upload or export inventory snapshots",
      "Track low-stock alerts and maintenance cycles",
      "Map variant attributes without leaving the grid",
    ],
    href: (shop: string) => `/cms/shop/${shop}/data/inventory`,
    cta: "Manage inventory",
    accent: "from-slate-900 via-slate-950 to-black",
  },
  {
    title: "Rental pricing",
    eyebrow: "Revenue levers",
    description:
      "Fine-tune daily rates, long-term discounts, and damage coverage with guided inputs or raw JSON control.",
    bullets: [
      "Preview deposit rules before publishing",
      "Validate pricing tiers with inline feedback",
      "Switch between form and JSON editors instantly",
    ],
    href: (shop: string) => `/cms/shop/${shop}/data/rental/pricing`,
    cta: "Configure pricing",
    accent: "from-emerald-500/10 via-teal-500/10 to-cyan-500/10",
  },
  {
    title: "Return logistics",
    eyebrow: "Post-rental flows",
    description:
      "Coordinate carrier preferences, pickup coverage, and in-store drop-offs in a single orchestration hub.",
    bullets: [
      "Clarify customer-facing return promises",
      "Audit pickup ZIP coverage at a glance",
      "Document bag and packaging requirements",
    ],
    href: (shop: string) => `/cms/shop/${shop}/data/return-logistics`,
    cta: "Optimize returns",
    accent: "from-rose-500/10 via-fuchsia-500/10 to-purple-500/10",
  },
] as const;

export default async function DataIndex({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop } = await params;
  return (
    <div className="space-y-8 text-white">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.18),_transparent_55%)]" />
        <div className="relative space-y-4 px-6 py-8">
          <Tag variant="default" className="bg-white/10 text-white/70">
            Data operations · {shop}
          </Tag>
          <h1 className="text-3xl font-semibold md:text-4xl">Guide your merchandising source of truth</h1>
          <p className="text-sm text-white/70 md:text-base">
            Keep every dataset in lockstep—from stock availability to deposit policies and return coverage—before you roll
            updates to the storefront.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Systems synced", value: "Inventory · Pricing · Logistics" },
              { label: "Recommended cadence", value: "Weekly merchandising review" },
              { label: "Workflow owner", value: "Operations & merchandising" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/70 backdrop-blur"
              >
                <p className="font-semibold uppercase tracking-wide">{item.label}</p>
                <p className="mt-1 text-sm text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Card
            key={card.title}
            className={`border border-white/10 bg-gradient-to-br ${card.accent} text-white shadow-lg shadow-black/20`}
          >
            <CardContent className="flex h-full flex-col gap-4 p-6">
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-white/70">{card.eyebrow}</span>
                <h2 className="text-xl font-semibold leading-tight">{card.title}</h2>
                <p className="text-sm text-white/70">{card.description}</p>
              </div>
              <ul className="flex flex-1 list-disc flex-col gap-2 pl-5 text-sm text-white/70">
                {card.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
              <Button
                asChild
                className="group mt-auto inline-flex h-11 items-center justify-between rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                <Link href={card.href(shop)}>
                  <span>{card.cta}</span>
                  <ArrowRightIcon className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
