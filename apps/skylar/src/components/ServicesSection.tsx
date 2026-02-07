'use client';

import { useTranslations } from "@acme/i18n";

import { Grid } from "@/components/primitives/Grid";
import { joinClasses } from "@/lib/joinClasses";
import type { Locale } from "@/lib/locales";

const SERVICE_KEYS = [
  "services.list.design",
  "services.list.distribution",
  "services.list.platform",
];

type ServicesSectionProps = {
  lang: Locale;
};

export default function ServicesSection({ lang }: ServicesSectionProps) {
  const translator = useTranslations();
  const isZh = lang === "zh";
  const isIt = lang === "it";
  const cardBase = ["rounded-2xl", "p-5", "transition", "hover:shadow-lg"];
  const cardPanelZh = ["border-accent/50", "bg-panel/50", "text-fg"];
  const cardPanelEn = ["border-border", "bg-panel", "text-fg"];
  const introColor = "text-muted-foreground";

  if (isIt) {
    return (
      <section className="milan-services">
        <div className="milan-services__header">
          <p className="milan-eyebrow">{translator("services.heading")}</p>
          <p className="milan-services__intro">{translator("services.intro")}</p>
        </div>
        <div className="milan-services__list">
          {SERVICE_KEYS.map((key, index) => (
            <div key={key} className="milan-services__item">
              <span className="milan-services__index">{String(index + 1).padStart(2, "0")}</span>
              <p className="milan-services__copy">{translator(key)}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="font-display text-4xl uppercase skylar-heading-tracking">
          {translator("services.heading")}
        </p>
        <p className={`font-body text-base leading-6 ${introColor}`}>
          {translator("services.intro")}
        </p>
      </div>
      <Grid cols={1} gap={4} className="md:grid-cols-3">
        {SERVICE_KEYS.map((key) => (
          <div
            key={key}
            className={joinClasses(
              ...cardBase,
              "skylar-card",
              ...(isZh ? cardPanelZh : cardPanelEn)
            )}
          >
            <p className="font-body text-sm uppercase skylar-subheading-tracking">
              {translator(key)}
            </p>
          </div>
        ))}
      </Grid>
    </section>
  );
}
