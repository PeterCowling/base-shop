// src/routes/assistance/travel-help.tsx
import { makeArticleClientLoader, makeArticleLinks, makeArticleMeta, makeArticlePage } from "./_ArticleFactory";
import HowToReachPositanoStructuredData from "@/components/seo/HowToReachPositanoStructuredData";
import TravelHelpStructuredData from "@/components/seo/TravelHelpStructuredData";
import { Section } from "@acme/ui/atoms/Section";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { getSlug } from "@/utils/slug";
import { articleSlug } from "@/routes.assistance-helpers";

function AssistanceArrivingByFerryLink(): JSX.Element {
  const lang = useCurrentLanguage();
  const { t: tAssistanceCommon } = useTranslation("assistanceCommon", { lng: lang });
  return (
    <Section padding="none" className="mx-auto mt-10 max-w-4xl px-4 sm:px-6 lg:px-8">
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <li>
          <Link
            to={`/${lang}/${getSlug("assistance", lang)}/${articleSlug(lang, "arrivingByFerry")}`}
            className="block rounded-lg border border-brand-outline/40 bg-brand-bg px-4 py-3 text-brand-primary underline-offset-4 hover:underline dark:bg-brand-text dark:text-brand-secondary"
          >
            {tAssistanceCommon("nav.arrivingByFerry")}
          </Link>
        </li>
      </ul>
    </Section>
  );
}

export const clientLoader = makeArticleClientLoader("travelHelp");
export { clientLoader as loader };

export default makeArticlePage("travelHelp", {
  additionalScripts: (
    <>
      <HowToReachPositanoStructuredData />
      <TravelHelpStructuredData />
    </>
  ),
  relatedGuides: { items: [{ key: "reachBudget" }, { key: "ferrySchedules" }] },
  afterArticle: () => <AssistanceArrivingByFerryLink />,
});

export const meta = makeArticleMeta("travelHelp");
export const links = makeArticleLinks("travelHelp");
