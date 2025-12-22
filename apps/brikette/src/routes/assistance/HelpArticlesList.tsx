// src/routes/assistance/HelpArticlesList.tsx
import { Grid } from "@acme/ui/atoms/Grid";
import { Link } from "react-router-dom";
import type { AppLanguage } from "@/i18n.config";
import { getSlug } from "@/utils/slug";
import { articleSlug } from "@/routes.assistance-helpers";
import type { TFunction } from "i18next";
import { Section } from "@acme/ui/atoms/Section";
import { HELP_ARTICLE_KEYS } from "@/components/assistance/HelpCentreNav";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import { BASE_URL } from "@/config/site";
import type { LinksFunction, MetaFunction } from "react-router";
import { useTranslation } from "react-i18next";
import enAssistanceSection from "@/locales/en/assistanceSection.json";

type Props = {
  lang?: AppLanguage;
  tSection?: TFunction;
  tCommon?: TFunction;
  tCommonEn?: TFunction;
};

function HelpArticlesList({ lang, tSection, tCommon, tCommonEn }: Props) {
  // Fallbacks so the component renders in isolation (smoke tests)
  const resolvedLang = (lang ?? "en") as AppLanguage;
  const { t: tSecHook } = useTranslation("assistanceSection", { lng: resolvedLang });
  const { t: tCommonHook, i18n } = useTranslation("assistanceCommon", { lng: resolvedLang });
  const sectionT: TFunction = (tSection as TFunction) ?? (tSecHook as unknown as TFunction);
  const commonT: TFunction = (tCommon as TFunction) ?? (tCommonHook as unknown as TFunction);
  const commonEnT: TFunction =
    (tCommonEn as TFunction) ??
    ((i18n?.getFixedT?.("en", "assistanceCommon") as unknown as TFunction) ||
      (((k: string) => k) as unknown as TFunction));
  const title = (sectionT("amaHelpCenterLink") as string) || "";
  const items = HELP_ARTICLE_KEYS.map((key) => ({
    key,
    label:
      (commonT(`nav.${key}`) as string) || (commonEnT(`nav.${key}`) as string) || key,
    href: `/${resolvedLang}/${getSlug("assistance", resolvedLang)}/${articleSlug(resolvedLang, key)}`,
  }));

  return (
    <Section padding="none" width="full" className="mb-8 mt-4 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
      <h2 className="mb-4 text-xl font-semibold tracking-tight text-brand-heading dark:text-brand-surface">
        {title}
      </h2>
      <Grid as="ul" className="gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <li key={it.key}>
            <Link
              to={it.href}
              prefetch="intent"
              className="block min-h-10 min-w-10 rounded-lg border border-brand-outline/40 bg-brand-bg px-4 py-3 text-brand-primary underline-offset-4 hover:underline dark:bg-brand-text dark:text-brand-secondary"
            >
              {it.label}
            </Link>
          </li>
        ))}
      </Grid>
    </Section>
  );
}

export default HelpArticlesList;

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

