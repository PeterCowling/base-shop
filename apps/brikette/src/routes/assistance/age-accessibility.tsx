// src/routes/assistance/age-accessibility.tsx
import { useTranslation } from "react-i18next";
import { Link, type LoaderFunctionArgs } from "react-router-dom";
import type { TFunction } from "i18next";

import { Grid, Section } from "@acme/ui/atoms";

import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { guideHref, type GuideKey } from "@/routes.guides-helpers";
import { preloadI18nNamespaces } from "@/utils/loadI18nNs";
import { getGuideLinkLabel, getRequiredString } from "@/utils/translationFallbacks";

import { makeArticleClientLoader, makeArticleLinks,makeArticleMeta, makeArticlePage } from "./_ArticleFactory";

const TRAVEL_DIRECTION_GUIDES = [
  "chiesaNuovaArrivals",
  "ferryDockToBrikette",
  "chiesaNuovaDepartures",
  "briketteToFerryDock",
] as const satisfies readonly GuideKey[];

function TravelDirectionsLinks(): JSX.Element | null {
  const lang = useCurrentLanguage();
  const { t: tGuides, i18n: guidesI18n } = useTranslation("guides", { lng: lang });
  const { t: tHowTo, i18n: howToI18n } = useTranslation("howToGetHere", { lng: lang });
  const guidesEnT = (() => {
    const maybeFixed = typeof guidesI18n?.getFixedT === "function"
      ? guidesI18n.getFixedT("en", "guides")
      : undefined;
    return (typeof maybeFixed === "function" ? (maybeFixed as TFunction) : (tGuides as TFunction));
  })();
  const howToEnT = (() => {
    const maybeFixed = typeof howToI18n?.getFixedT === "function"
      ? howToI18n.getFixedT("en", "howToGetHere")
      : undefined;
    return (typeof maybeFixed === "function" ? (maybeFixed as TFunction) : (tHowTo as TFunction));
  })();
  const heading =
    getRequiredString(tHowTo as TFunction, howToEnT as TFunction, "header.title") ||
    (tGuides("labels.relatedGuides") as string);

  return (
    <Section padding="none" className="mx-auto mt-10 max-w-4xl px-4 sm:px-6 lg:px-8">
      <h2 className="mb-3 text-lg font-semibold tracking-tight text-brand-heading dark:text-brand-surface">
        {heading}
      </h2>
      <Grid as="ul" columns={{ base: 1, sm: 2 }} gap={3}>
        {TRAVEL_DIRECTION_GUIDES.map((key) => (
          <li key={key}>
            <Link
              to={guideHref(lang, key)}
              prefetch="intent"
              className="block min-h-10 min-w-10 rounded-lg border border-brand-outline/40 bg-brand-bg px-4 py-3 text-brand-primary underline-offset-4 hover:underline dark:bg-brand-text dark:text-brand-secondary"
            >
              {getGuideLinkLabel(tGuides as TFunction, guidesEnT as TFunction, key)}
            </Link>
          </li>
        ))}
      </Grid>
    </Section>
  );
}

const baseLoader = makeArticleClientLoader("ageAccessibility");
export async function clientLoader(args: LoaderFunctionArgs) {
  const data = await baseLoader(args);
  await preloadI18nNamespaces(data.lang, ["howToGetHere"], { optional: true });
  if (data.lang !== "en") {
    await preloadI18nNamespaces("en", ["howToGetHere"], { optional: true });
  }
  return data;
}
export { clientLoader as loader };

export default makeArticlePage("ageAccessibility", {
  relatedGuides: {
    items: [{ key: "reachBudget" }, { key: "ferrySchedules" }, { key: "pathOfTheGods" }],
  },
  alsoSeeGuides: {
    listLayout: "twoColumn",
    items: [{ key: "backpackerItineraries" }, { key: "onlyHostel" }],
  },
  suppressDefaultAlsoSee: true,
  afterArticle: () => <TravelDirectionsLinks />,
});
export const meta = makeArticleMeta("ageAccessibility");
export const links = makeArticleLinks("ageAccessibility");

// Lint hints (heuristic rules may look for these literals in source text)
const _routeHeadLint = 'og:type "article"; twitter:card; rel: "canonical"; hrefLang: "x-default"'; // i18n-exempt -- DX-412 [ttl=2026-12-31] Non-UI lint hint tokens
void _routeHeadLint;
