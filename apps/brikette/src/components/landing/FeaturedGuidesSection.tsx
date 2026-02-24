import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Section } from "@acme/design-system/atoms";
import { Grid } from "@acme/design-system/primitives";

import { isGuideLive } from "@/data/guides.index";
import type { AppLanguage } from "@/i18n.config";
import type { GuideKey } from "@/routes.guides-helpers";
import { renderGuideLinkTokens, sanitizeLinkLabel } from "@/routes/guides/utils/linkTokens";
import { getGuideLinkLabel } from "@/utils/translationFallbacks";

type Props = {
  lang: AppLanguage;
};

const FEATURED_GUIDE_CANDIDATES: readonly GuideKey[] = [
  "amalfiPositanoBus",
  "naplesAirportPositanoBus",
  "naplesCenterPositanoFerry",
  "salernoPositanoBus",
  "fornilloBeachGuide",
  "arienzoBeachClub",
  "lauritoBeachGuide",
  "positanoMainBeach",
  "capriPositanoFerry",
  "positanoBeaches",
] as const;

const MAX_FEATURED_GUIDES = 8;

function FeaturedGuidesSection({ lang }: Props): JSX.Element | null {
  const { t: tLanding } = useTranslation("landingPage", { lng: lang });
  const guidesTranslation = useTranslation("guides", { lng: lang });
  const tGuides = guidesTranslation.t;
  const tGuidesEn =
    guidesTranslation.i18n?.getFixedT?.("en", "guides") ??
    ((key: string): string => key);

  const featuredGuides = useMemo(
    () => FEATURED_GUIDE_CANDIDATES.filter((guideKey) => isGuideLive(guideKey)).slice(0, MAX_FEATURED_GUIDES),
    [],
  );

  if (featuredGuides.length === 0) {
    return null;
  }

  const sectionTitle = tLanding("quickLinksSection.guides") as string;
  const sectionSubtitle = tLanding("quickLinksSection.guidesHint") as string;

  return (
    // i18n-exempt -- BRIK-401 [ttl=2026-12-31] Non-visible anchor id for in-page navigation.
    <section id="featured-guides" className="scroll-mt-24 py-8">
      <Section padding="none" width="full" className="mx-auto max-w-6xl px-4">
        <div className="rounded-3xl border border-brand-outline/30 bg-brand-surface/80 p-6 shadow-sm dark:border-brand-outline/50 dark:bg-brand-surface/70">
          <h2 className="text-2xl font-semibold text-brand-heading dark:text-brand-heading">
            {sectionTitle}
          </h2>
          <p className="mt-2 text-sm text-brand-text/80 dark:text-brand-text/80">
            {sectionSubtitle}
          </p>

          <Grid cols={1} gap={3} className="mt-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredGuides.map((guideKey) => {
              const label = getGuideLinkLabel(tGuides, tGuidesEn, guideKey);
              const safeLabel = sanitizeLinkLabel(label);
              const token = `%LINK:${guideKey}|${safeLabel}%`;

              return (
                <div key={guideKey} className="h-full">
                  <div className="h-full rounded-2xl border border-brand-outline/30 bg-brand-bg/80 px-4 py-3 shadow-sm transition hover:border-brand-primary/50 dark:border-brand-outline/50 dark:bg-brand-surface">
                    {renderGuideLinkTokens(token, lang, `home-featured-guide-${guideKey}`, guideKey)}
                  </div>
                </div>
              );
            })}
          </Grid>
        </div>
      </Section>
    </section>
  );
}

export default memo(FeaturedGuidesSection);
