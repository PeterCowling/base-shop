"use client";

import Link from "next/link";
import { Button, Card, CardContent } from "@/components/atoms/shadcn";
import { Grid as DSGrid } from "@ui/components/atoms/primitives/Grid";
import { Inline } from "@ui/components/atoms/primitives/Inline";
import { useTranslations } from "@acme/i18n";

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
  const t = useTranslations();
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-hero-contrast text-hero-foreground shadow-elevation-4">
      <DSGrid gap={8} className="relative p-8 lg:grid-cols-3 lg:gap-10">
        <div className="space-y-6 lg:col-span-2">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-hero-foreground/80">
              {t("Shop settings")}
            </span>
            <h1 className="text-3xl font-semibold md:text-4xl">
              {t("Keep {shop} running smoothly", { shop })}
            </h1>
            <p className="text-hero-foreground/80">
              {t(
                "Configure languages, service automations, and design tokens so {shop} stays on brand across every channel.",
                { shop },
              )}
            </p>
          </div>
          <Inline gap={3} wrap>
            <Button asChild className="h-11 px-5 text-sm font-semibold">
              <Link href="#service-editors">{t("Configure services")}</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 px-5 text-sm font-semibold border-primary/40 text-hero-foreground hover:bg-primary/10"
            >
              <Link href="#theme-tokens">{t("Review theme tokens")}</Link>
            </Button>
          </Inline>
        </div>
        <Card className="border border-primary/20 bg-surface-2 text-foreground shadow-elevation-5">
          <CardContent className="space-y-5 p-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">{t("Current snapshot")}</h2>
              <p className="text-sm text-muted-foreground">
                {isAdmin
                  ? t("You can update storefront details and commerce settings below.")
                  : t(
                      "You have read-only access. Contact an admin if changes are required.",
                    )}
              </p>
            </div>
            <dl className="space-y-3 text-sm text-muted-foreground">
              {snapshotItems.map((item) => (
                <div key={item.label} className="space-y-1">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {item.label}
                  </dt>
                  <dd className="text-sm font-medium text-foreground">{item.value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </DSGrid>
    </section>
  );
}
