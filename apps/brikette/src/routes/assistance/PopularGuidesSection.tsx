// src/routes/assistance/PopularGuidesSection.tsx
import { useTranslation } from "react-i18next";
import type { LinksFunction, MetaFunction } from "react-router";
import { Link } from "react-router-dom";

import { BASE_URL } from "@/config/site";
import type { AppLanguage } from "@/i18n.config";
import enAssistanceSection from "@/locales/en/assistanceSection.json";
import { guideSlug } from "@/routes.guides-helpers";
import { buildRouteLinks,buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";

function PopularGuidesSection({ lang }: { lang: AppLanguage }) {
  const { t } = useTranslation("assistanceSection", { lng: lang });
  return (
    <section className="mb-10 mt-4">
      <h2 className="mb-4 text-xl font-semibold tracking-tight text-brand-heading dark:text-brand-surface">
        {t("popularGuides")}
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <li>
          <Link
            to={`/${lang}/${getSlug("guides", lang)}/${guideSlug(lang, "reachBudget")}`}
            prefetch="intent"
            className="block min-h-10 min-w-10 rounded-lg border border-brand-outline/40 bg-brand-bg px-4 py-3 text-brand-primary underline-offset-4 hover:underline dark:bg-brand-text dark:text-brand-secondary"
          >
            {t("guideReachBudget")}
          </Link>
        </li>
        <li>
          <Link
            to={`/${lang}/${getSlug("guides", lang)}/${guideSlug(lang, "ferrySchedules")}`}
            prefetch="intent"
            className="block min-h-10 min-w-10 rounded-lg border border-brand-outline/40 bg-brand-bg px-4 py-3 text-brand-primary underline-offset-4 hover:underline dark:bg-brand-text dark:text-brand-secondary"
          >
            {t("guideFerrySchedules")}
          </Link>
        </li>
        <li>
          <Link
            to={`/${lang}/${getSlug("guides", lang)}/${guideSlug(lang, "pathOfTheGods")}`}
            prefetch="intent"
            className="block min-h-10 min-w-10 rounded-lg border border-brand-outline/40 bg-brand-bg px-4 py-3 text-brand-primary underline-offset-4 hover:underline dark:bg-brand-text dark:text-brand-secondary"
          >
            {t("guidePathOfTheGods")}
          </Link>
        </li>
      </ul>
    </section>
  );
}

export default PopularGuidesSection;

// Provide meta()/links() to satisfy route head lint rules when this file is treated as a route file.
export const meta: MetaFunction = () => {
  const lang = "en" as AppLanguage;
  const path = `/${lang}/${getSlug("assistance", lang)}`;
  const url = `${BASE_URL}${path}`;
  const title =
    typeof enAssistanceSection?.meta?.title === "string" ? enAssistanceSection.meta.title : "";
  const description =
    typeof enAssistanceSection?.meta?.description === "string"
      ? enAssistanceSection.meta.description
      : "";
  return buildRouteMeta({
    lang,
    title,
    description,
    url,
    path,
  });
};

export const links: LinksFunction = () => buildRouteLinks();

