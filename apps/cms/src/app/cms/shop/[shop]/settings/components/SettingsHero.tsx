import Link from "next/link";
import { Button, Card, CardContent } from "@/components/atoms/shadcn";

import type { SnapshotItem } from "../lib/pageSections";

interface SettingsHeroProps {
  readonly shop: string;
  readonly isAdmin: boolean;
  readonly snapshotItems: SnapshotItem[];
}

export default function SettingsHero({
  shop,
  isAdmin,
  snapshotItems,
}: SettingsHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-hero text-primary-foreground shadow-xl">
      <div className="relative grid gap-8 p-8 lg:grid-cols-[2fr,1fr] lg:gap-10">
        <div className="space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.35em] text-primary-foreground/70">
              Shop settings
            </span>
            <h1 className="text-3xl font-semibold md:text-4xl">
              Keep {shop} running smoothly
            </h1>
            <p className="text-primary-foreground/80">
              Configure languages, service automations, and design tokens so {shop} stays on brand across every channel.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="h-11 px-5 text-sm font-semibold">
              <Link href="#service-editors">Configure services</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 px-5 text-sm font-semibold border-primary/40 text-primary-foreground hover:bg-primary/10"
            >
              <Link href="#theme-tokens">Review theme tokens</Link>
            </Button>
          </div>
        </div>
        <Card className="border border-primary/20 bg-surface-2 text-primary-foreground shadow-2xl">
          <CardContent className="space-y-5 p-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Current snapshot</h2>
              <p className="text-sm text-primary-foreground/70">
                {isAdmin
                  ? "You can update storefront details and commerce settings below."
                  : "You have read-only access. Contact an admin if changes are required."}
              </p>
            </div>
            <dl className="space-y-3 text-sm text-primary-foreground/80">
              {snapshotItems.map((item) => (
                <div key={item.label} className="space-y-1">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-primary-foreground/60">
                    {item.label}
                  </dt>
                  <dd className="text-sm font-medium text-primary-foreground">{item.value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
