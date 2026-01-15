/* -------------------------------------------------------------------------
   src/routes/cookie-policy.tsx
   Cookie Policy (EN-first; other locales fall back to EN until translated)
   ---------------------------------------------------------------------- */
import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import { BASE_URL } from "@/config/site";
import { CONTACT_EMAIL } from "@/config/hotel";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";
import { langFromRequest } from "@/utils/lang";
import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";
import { resolveI18nMeta } from "@/utils/i18nMeta";
import { useApplyFallbackHead } from "@/utils/testHeadFallback";
import type { LinksFunction, MetaFunction } from "react-router";
import { Fragment, memo } from "react";
import { useLoaderData } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Section } from "@acme/ui/atoms/Section";

const NS = "cookiePolicyPage";

export async function clientLoader({ request }: { request: Request }) {
  const lang = langFromRequest(request);
  await preloadNamespacesWithFallback(lang, [NS]);
  await i18n.changeLanguage(lang);
  const meta = resolveI18nMeta(lang, NS);
  return { lang, title: meta.title, desc: meta.description };
}

const SECTION_KEYS = [
  "intro",
  "whatAreCookies",
  "ourUse",
  "localStorage",
  "thirdParties",
  "choices",
  "contact",
] as const;

export default memo(function CookiePolicyPage() {
  const { lang, title: loaderTitle, desc: loaderDesc } = useLoaderData() as {
    lang: AppLanguage;
    title?: string;
    desc?: string;
  };
  const { t } = useTranslation(NS, { lng: lang });

  const sections = SECTION_KEYS.map((key) => ({
    key,
    title: t(`sections.${key}.title`) as string,
  }));

  const fallbackHeadDescriptors = (() => {
    if (process.env.NODE_ENV !== "test") return undefined;
    const fallbackMeta = resolveI18nMeta(lang, NS);
    const path = `/${lang}/${getSlug("cookiePolicy", lang)}`;
    const title = (loaderTitle ?? "").trim() || fallbackMeta.title;
    const description = (loaderDesc ?? "").trim() || fallbackMeta.description;
    return buildRouteMeta({ lang, title, description, url: `${BASE_URL}${path}`, path });
  })();

  const fallbackHeadLinks = (() => {
    if (process.env.NODE_ENV !== "test") return undefined;
    return buildRouteLinks();
  })();

  useApplyFallbackHead(fallbackHeadDescriptors as unknown as ReturnType<typeof buildRouteMeta>, fallbackHeadLinks);

  const lastUpdatedDate = t("lastUpdated.date") as string;

  return (
    <Fragment>
      <Section padding="none" className="mx-auto max-w-5xl p-6 pt-24 sm:pt-10">
        <article id="top">
          <header className="mb-8 space-y-2 text-center">
            <h1 className="text-3xl font-bold text-brand-heading dark:text-brand-surface">
              {t("headings.pageTitle")}
            </h1>
            <p className="text-base font-medium text-brand-text/80 dark:text-brand-surface/80">
              {t("headings.subtitle")}
            </p>
            <p className="text-sm text-brand-text/70 dark:text-brand-surface/70">
              {t("lastUpdated.label")}: {lastUpdatedDate}
            </p>
          </header>

          <details className="mb-8 rounded-2xl border border-brand-outline/20 bg-brand-surface/60 p-4 shadow-sm backdrop-blur lg:hidden dark:border-brand-outline/30 dark:bg-brand-surface/40">
            <summary className="min-h-11 cursor-pointer font-semibold text-brand-heading dark:text-brand-surface">
              {t("toc.title")}
            </summary>
            <nav aria-label={t("toc.aria")} className="mt-3">
              <ol className="space-y-2 text-sm">
                {sections.map((section) => (
                  <li key={section.key}>
                    <a className="inline-block min-h-11 min-w-11 hover:underline" href={`#${section.key}`}>
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </details>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <aside className="hidden lg:col-span-4 lg:block xl:col-span-3">
              <nav aria-label={t("toc.aria")} className="sticky top-24 max-h-screen overflow-auto pr-2">
                <div className="rounded-2xl border border-brand-outline/20 bg-brand-surface/60 p-4 shadow-sm backdrop-blur dark:border-brand-outline/30 dark:bg-brand-surface/40">
                  <h2 className="text-base font-semibold text-brand-heading dark:text-brand-surface">
                    {t("toc.title")}
                  </h2>
                  <ol className="mt-3 space-y-2 text-sm">
                    {sections.map((section) => (
                      <li key={section.key}>
                        <a
                          className="inline-block min-h-11 min-w-11 text-brand-text/80 hover:text-brand-heading hover:underline dark:text-brand-surface/80 dark:hover:text-brand-surface"
                          href={`#${section.key}`}
                        >
                          {section.title}
                        </a>
                      </li>
                    ))}
                  </ol>
                </div>
              </nav>
            </aside>

            <div className="prose prose-neutral prose-li:leading-7 prose-p:leading-7 dark:prose-invert lg:col-span-8 xl:col-span-9">
              {SECTION_KEYS.map((key) => {
                const body = t(`sections.${key}.body`, {
                  returnObjects: true,
                  email: CONTACT_EMAIL,
                }) as unknown;
                const paragraphs = Array.isArray(body)
                  ? body
                  : typeof body === "string" && body.trim()
                    ? [body]
                    : [];
                return (
                  <section key={key}>
                    <h2 id={key} className="scroll-mt-28">
                      {t(`sections.${key}.title`)}
                    </h2>
                    {paragraphs.map((paragraph, index) => (
                      <p key={`${key}-${index}`}>{paragraph}</p>
                    ))}
                  </section>
                );
              })}

              <p className="mt-10 italic">
                <a className="inline-block min-h-11 min-w-11 font-medium not-italic hover:underline" href="#top">
                  {t("footer.backToTop")}
                </a>
              </p>
            </div>
          </div>
        </article>
      </Section>
    </Fragment>
  );
});

export const meta: MetaFunction = ({ data }) => {
  const d = (data || {}) as { lang?: AppLanguage; title?: string; desc?: string };
  const lang = d.lang || (i18nConfig.fallbackLng as AppLanguage);
  const title = d.title || "";
  const description = d.desc || "";
  const path = `/${lang}/${getSlug("cookiePolicy", lang)}`;
  return buildRouteMeta({ lang, title, description, url: `${BASE_URL}${path}`, path });
};

export const links: LinksFunction = () => buildRouteLinks();
