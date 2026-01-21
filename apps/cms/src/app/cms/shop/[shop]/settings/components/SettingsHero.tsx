"use client";

import { useTranslations } from "@acme/i18n";
import { track } from "@acme/telemetry";
import { Grid as DSGrid } from "@acme/ui/components/atoms/primitives/Grid";
import {
  CmsBuildHero,
  CmsSettingsSnapshot,
  type CmsSettingsSnapshotRow,
} from "@acme/ui/components/cms"; // UI: @acme/ui/components/cms/CmsBuildHero, CmsSettingsSnapshot

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
  const snapshotRows = snapshotItems.map(
    (item) => ({
      id: item.label,
      label: item.label,
      value: item.value,
    }),
  ) as unknown as CmsSettingsSnapshotRow[];
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-hero-contrast text-hero-foreground shadow-elevation-4">
      <DSGrid gap={8} className="relative p-8 lg:grid-cols-3 lg:gap-10">
        <div className="space-y-6 lg:col-span-2">
          <CmsBuildHero
            tag={String(t("Shop settings"))}
            title={String(t("Keep {shop} running smoothly", { shop }))}
            body={String(
              t(
                "Configure languages, service automations, and design tokens so {shop} stays on brand across every channel.",
                { shop },
              ),
            )}
            tone="operate"
            primaryCta={{
              label: String(t("Configure services")),
              href: "#service-editors",
            }}
            secondaryCtas={[
              {
                label: String(t("Review theme tokens")),
                href: "#theme-tokens",
              },
              {
                label: String(t("cms.shop.settings.help.buildGuide")),
                href: "/docs/cms/build-shop-guide.md",
                onClick: () => {
                  track("build_flow_help_requested", {
                    shopId: shop,
                    stepId: "settings",
                    surface: "settingsHero",
                  });
                },
              },
              {
                label: String(t("cms.shop.settings.help.journeyMap")),
                href: "/docs/cms/shop-build-journey-map.md",
                onClick: () => {
                  track("build_flow_help_requested", {
                    shopId: shop,
                    stepId: "settings",
                    surface: "settingsHero",
                  });
                },
              },
            ]}
          />
        </div>
        <CmsSettingsSnapshot
          title={String(t("Current snapshot"))}
          body={
            isAdmin
              ? String(
                  t(
                    "You can update storefront details and commerce settings below.",
                  ),
                )
              : String(
                  t(
                    "You have read-only access. Contact an admin if changes are required.",
                  ),
                )
          }
          rows={snapshotRows}
        />
      </DSGrid>
    </section>
  );
}
