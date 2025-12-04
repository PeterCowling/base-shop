"use client";

import type { ConfiguratorHeroData } from "../hooks/useConfiguratorDashboardState";
import { ProgressBar } from "./DashboardPrimitives";
import { useTranslations } from "@acme/i18n";
import {
  CmsBuildHero,
  CmsMetricTiles,
  type CmsMetricTile,
} from "@ui/components/cms";

type ConfiguratorHeroProps = ConfiguratorHeroData;

export function ConfiguratorHero({
  description,
  progressPercent,
  essentialProgressLabel,
  resumeCta,
  quickStats,
}: ConfiguratorHeroProps) {
  const t = useTranslations();

  const metricItems: CmsMetricTile[] = quickStats.map((stat) => ({
    id: stat.label,
    label: stat.label,
    value: stat.value,
    caption: stat.caption,
  }));

  return (
    <div className="space-y-6">
      <CmsBuildHero
        tag={String(t("cms.configurator.hero.kicker"))}
        title={String(t("cms.configurator.hero.title"))}
        body={description}
        primaryCta={{
          label: resumeCta.label,
          href: resumeCta.href,
          onClick: resumeCta.onClick,
        }}
        secondaryCtas={[
          {
            label: String(t("cms.configurator.hero.browseAllSteps")),
            href: "#configurator-steps",
          },
          {
            label: String(t("cms.configurator.hero.buildGuide")),
            href: "/docs/cms/build-shop-guide.md",
          },
        ]}
        inlineMeta={metricItems}
        tone="build"
      />
      <ProgressBar value={progressPercent} label={essentialProgressLabel} />
      <CmsMetricTiles items={metricItems} />
    </div>
  );
}

export default ConfiguratorHero;
