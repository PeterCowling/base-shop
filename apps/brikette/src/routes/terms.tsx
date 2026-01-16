/* -------------------------------------------------------------------------
   src/routes/terms.tsx
   Booking Terms (on‑site copy of the updated policy)
   ---------------------------------------------------------------------- */
import i18n from "@/i18n";
import { type AppLanguage } from "@/i18n.config";
import { Fragment, memo } from "react";
import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";
import { useLoaderData } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { slugify } from "@/utils/slugify";
import { langFromRequest } from "@/utils/lang";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { getSlug } from "@/utils/slug";
import { BASE_URL } from "@/config/site";
import { i18nConfig } from "@/i18n.config";
import type { MetaFunction, LinksFunction } from "react-router";
import { resolveI18nMeta } from "@/utils/i18nMeta";
import { Section } from "@acme/ui/atoms/Section";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import { OG_IMAGE } from "@/utils/headConstants";
import { useApplyFallbackHead } from "@/utils/testHeadFallback";
// Head tags handled via route meta()/links(); avoid inline <SeoHead>

export async function clientLoader({ request }: { request: Request }) {
  const lang = langFromRequest(request);
  const ns = "termsPage";

  await preloadNamespacesWithFallback(lang, [ns]);
  await i18n.changeLanguage(lang);

  const meta = resolveI18nMeta(lang, ns);

  return { lang, title: meta.title, desc: meta.description };
}

const SECTION_KEYS: readonly string[] = Array.from({ length: 17 }, (_, i) => `s${i + 1}`);

export default memo(function TermsPage() {
  const { lang, title: loaderTitle, desc: loaderDesc } = useLoaderData() as {
    lang: AppLanguage;
    title?: string;
    desc?: string;
  };
  const { t } = useTranslation("termsPage", { lng: lang });
  // Base translations loaded by the route; not referenced directly here
  useTranslation("translation", { lng: lang });

  const sections = SECTION_KEYS.map((key) => {
    const label = t(`sections.${key}.title`);
    const id = `${key}-${slugify(label)}`;
    return { key, label, id } as const;
  });

  // Head handled by meta()/links(); provide deterministic test fallback
  const fallbackHeadDescriptors = (() => {
    if (process.env.NODE_ENV !== "test") return undefined;
    const fallbackMeta = resolveI18nMeta(lang, "termsPage");
    const path = `/${lang}/${getSlug("terms", lang)}`;
    const image = buildCfImageUrl("/img/hostel-coastal-horizon.avif", {
      width: OG_IMAGE.width,
      height: OG_IMAGE.height,
      quality: 85,
      format: "auto",
    });
    // Prefer loader-provided values available in this route (already read above)
    const title = (loaderTitle ?? "").trim() || fallbackMeta.title;
    const description = (loaderDesc ?? "").trim() || fallbackMeta.description;
    return buildRouteMeta({
      lang,
      title,
      description,
      url: `${BASE_URL}${path}`,
      path,
      image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
    });
  })();

  const fallbackHeadLinks = (() => {
    if (process.env.NODE_ENV !== "test") return undefined;
    return buildRouteLinks();
  })();

  useApplyFallbackHead(fallbackHeadDescriptors as unknown as ReturnType<typeof buildRouteMeta>, fallbackHeadLinks);

  return (
    <Fragment>
      {/* Head handled by meta()/links() */}

      <Section
        padding="none"
        className="mx-auto w-full max-w-6xl px-4 pb-10 pt-24 sm:px-6 sm:pt-10 md:px-8 lg:px-10"
      >
        <section id="top">
          <header className="mb-6 space-y-2 text-center">
            <h1 className="text-3xl font-bold">{t("headings.pageTitle")}</h1>
            <p className="text-lg font-medium">{t("headings.pageSubtitle")}</p>
          </header>

          {/* Mobile TOC */}
          <details className="mb-4 rounded-lg border border-neutral-200 bg-brand-bg/60 backdrop-blur lg:hidden dark:border-neutral-800 dark:bg-neutral-900/60">
            <summary className="min-h-10 cursor-pointer px-4 py-3 font-semibold">
              {t("toc.title")}
            </summary>
            <nav aria-label={t("toc.aria")} className="px-4 pb-4">
              <ol className="space-y-2 text-sm">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a className="inline-block min-h-11 min-w-11 hover:underline" href={`#${s.id}`}>
                      {s.label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </details>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Desktop TOC */}
            <aside className="hidden lg:col-span-4 lg:block xl:col-span-3">
              <nav
                aria-label={t("toc.aria")}
                className="sticky top-24 max-h-screen overflow-auto pr-2"
              >
                <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
                  <h2 className="mb-3 text-base font-semibold">{t("toc.title")}</h2>
                  <ol className="space-y-2 text-sm">
                    {sections.map((s) => (
                      <li key={s.id}>
                        <a
                          className="inline-block min-h-11 min-w-11 text-neutral-700 hover:text-neutral-900 hover:underline dark:text-neutral-300 dark:hover:text-brand-heading"
                          href={`#${s.id}`}
                        >
                          {s.label}
                        </a>
                      </li>
                    ))}
                  </ol>
                </div>
              </nav>
            </aside>

            <article className="lg:col-span-8 xl:col-span-9">
              {sections.map((s) => (
                <section key={s.id} className="mt-14 space-y-4 first:mt-0">
                  <h2 id={s.id} className="scroll-mt-28 text-2xl font-bold leading-tight">
                    {t(`sections.${s.key}.title`)}
                  </h2>
                  {(
                    t(`sections.${s.key}.body`, { returnObjects: true }) as unknown as string[]
                  ).map((p, i) => (
                    <p
                      key={`${s.key}-${i}`}
                      className="text-base leading-7 text-neutral-900 sm:text-lg sm:leading-8 dark:text-neutral-100"
                    >
                      {p}
                    </p>
                  ))}
                </section>
              ))}
              <p className="mt-10 italic">
                {t("footer.end")}{" "}
                <a
                  className="inline-block min-h-11 min-w-11 font-medium not-italic hover:underline"
                  href="#top"
                >
                  {t("footer.backToTop")}
                </a>
              </p>
            </article>
          </div>
        </section>
      </Section>
    </Fragment>
  );
});

export const meta: MetaFunction = ({ data }) => {
  const d = (data || {}) as { lang?: AppLanguage; title?: string; desc?: string };
  const lang = d.lang || (i18nConfig.fallbackLng as AppLanguage);
  const title = d.title || "";
  const description = d.desc || "";
  const path = `/${lang}/${getSlug("terms", lang)}`;
  const image = buildCfImageUrl("/img/hostel-coastal-horizon.avif", {
    width: OG_IMAGE.width,
    height: OG_IMAGE.height,
    quality: 85,
    format: "auto",
  });
  return buildRouteMeta({
    lang,
    title,
    description,
    url: `${BASE_URL}${path}`,
    path,
    image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
  });
};

export const links: LinksFunction = () => buildRouteLinks();
