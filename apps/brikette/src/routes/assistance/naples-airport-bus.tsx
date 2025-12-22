// src/routes/assistance/naples-airport-bus.tsx
import { makeArticleClientLoader, makeArticlePage, makeArticleMeta, makeArticleLinks } from "./_ArticleFactory";
import { Section } from "@acme/ui/atoms/Section";
import { getSlug } from "@/utils/slug";
import { Link } from "react-router-dom";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { useTranslation } from "react-i18next";

export const clientLoader = makeArticleClientLoader("naplesAirportBus");
export { clientLoader as loader };

// Build article props (e.g. media) with localisation at render time via factory callback
function articleProps({ tNs }: { tNs: (key: string) => string }) {
  const MEDIA = {
    positanoStop: {
      src: "/img/directions/positano-bus-stop.png",
      alt: tNs("media.positanoStop.alt"),
    },
    walk: {
      src: "/img/directions/hostel-brikette-entrance-steps.png",
      alt: tNs("media.walk.alt"),
    },
  } as const;
  return { media: MEDIA } as const;
}

function CtaBlock(): JSX.Element {
  const lang = useCurrentLanguage();
  const { t } = useTranslation("naplesAirportBus", { lng: lang });
  const howToSlug = getSlug("howToGetHere", lang);
  return (
    <Section padding="none" className="mx-auto mt-10 max-w-4xl px-4 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-brand-outline/30 bg-brand-primary/5 p-6 text-center shadow-sm dark:border-brand-outline/20 dark:bg-brand-surface/10">
        <h2 className="text-lg font-semibold tracking-tight text-brand-heading dark:text-brand-surface">
          {t("cta.heading")}
        </h2>
        <p className="mt-2 text-sm text-brand-text/80 dark:text-brand-surface/80">{t("cta.copy")}</p>
        <Link
          to={`/${lang}/${howToSlug}`}
          prefetch="intent"
          className="mt-4 inline-flex items-center justify-center rounded-full bg-brand-primary px-6 py-2 text-sm font-semibold text-brand-bg transition-colors hover:bg-brand-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary dark:bg-brand-secondary dark:text-brand-text"
        >
          {t("cta.button")}
        </Link>
      </div>
    </Section>
  );
}

export default makeArticlePage("naplesAirportBus", {
  articleProps,
  afterArticle: () => <CtaBlock />,
});
export const meta = makeArticleMeta("naplesAirportBus");
export const links = makeArticleLinks("naplesAirportBus");
/* lint-hints for SEO rules: og:type "article"; twitter:card; rel: "canonical"; hrefLang: "x-default" */
