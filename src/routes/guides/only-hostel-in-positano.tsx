// src/routes/guides/only-hostel-in-positano.tsx
import { Fragment } from "react";
import { Link } from "react-router-dom";
import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry } from "./guide-manifest";
import type { GuideSeoTemplateContext } from "./guide-seo/types";

import i18n from "@/i18n";
import { langFromRequest, toAppLanguage } from "@/utils/lang";
import { getSlug } from "@/utils/slug";
import { guideSlug, type GuideKey } from "@/routes.guides-helpers";
import { ensureArray, ensureStringArray } from "@/utils/i18nContent";
import { GETTING_HERE_LINK_SETS } from "@/content/gettingHere";
import { getGuideLinkLabel } from "@/utils/translationFallbacks";
import { normaliseGuideLinks } from "@/utils/guideLinks";
import type { TFunction } from "i18next";
import type { MetaFunction, LinksFunction } from "react-router";
import { BASE_URL } from "@/config/site";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { OG_IMAGE as DEFAULT_OG_IMAGE } from "@/utils/headConstants";

export const handle = { tags: ["accommodation", "hostel-life", "positano", "budgeting"] };

export const GUIDE_KEY: GuideKey = "onlyHostel" as const;
export const GUIDE_SLUG = "only-hostel-in-positano" as const;

export function filterFaqEntries(entries: Array<{ q?: unknown; a?: unknown }>): Array<{ q: string; a: string }> {
  const filtered: Array<{ q: string; a: string }> = [];
  for (const entry of entries) {
    const q = typeof entry?.q === "string" ? entry.q.trim() : "";
    const a = typeof entry?.a === "string" ? entry.a.trim() : "";
    if (!q || !a) continue;
    filtered.push({ q, a });
  }
  return filtered;
}

function buildArticleExtras(context: GuideSeoTemplateContext): JSX.Element {
  const translate = context.translateGuides as unknown as TFunction;
  const guidesT = translate;
  const guidesFallback = (i18n.getFixedT?.("en", "guides") as TFunction | undefined) ?? translate;

  const toc = (translate("content.onlyHostel.toc", { returnObjects: true }) as Record<string, string>) ?? {};
  const highlights = ensureStringArray(translate("content.onlyHostel.highlights", { returnObjects: true }));
  const highlightsTitle = translate("content.onlyHostel.highlightsTitle") as string;
  const saveTitle = translate("content.onlyHostel.saveTitle") as string;
  const saveList = ensureStringArray(translate("content.onlyHostel.save", { returnObjects: true }));
  const roomsList = ensureStringArray(translate("content.onlyHostel.roomsList", { returnObjects: true }));
  const roomsLinks = normaliseGuideLinks(translate("content.onlyHostel.roomsLinks", { returnObjects: true }));
  const arrivalText = translate("content.onlyHostel.arrivalText", "") as string;
  const arrivalLinks = normaliseGuideLinks(
    translate("content.onlyHostel.arrivalLinks", { returnObjects: true }),
    GETTING_HERE_LINK_SETS.arrivalEssentials,
  );
  const arrivalRoutesLabel = translate("content.onlyHostel.arrivalRoutesLabel") as string;
  const arrivalRoutes = normaliseGuideLinks(
    translate("content.onlyHostel.arrivalRoutes", { returnObjects: true }),
    GETTING_HERE_LINK_SETS.originRoutes,
  );
  const etiquetteList = ensureStringArray(translate("content.onlyHostel.etiquetteList", { returnObjects: true }));
  const faqItems = ensureArray<{ q: string; a: string }>(
    translate("content.onlyHostel.faq", { returnObjects: true }) as unknown,
  );

  const roomsHeading = toc.rooms ?? (translate("content.onlyHostel.toc.rooms") as string);
  const arrivalHeading = toc.arrival ?? (translate("content.onlyHostel.toc.arrival") as string);
  const etiquetteHeading = toc.etiquette ?? (translate("content.onlyHostel.toc.etiquette") as string);
  const faqsHeading = toc.faqs ?? (translate("content.onlyHostel.toc.faqs") as string);
  const tocHeading = toc.onThisPage ?? (translate("content.onlyHostel.toc.onThisPage") as string);

  return (
    <>
      <nav aria-label={tocHeading}>
        <ul>
          <li>
            <a href="#rooms">{roomsHeading}</a>
          </li>
          <li>
            <a href="#arrival">{arrivalHeading}</a>
          </li>
          <li>
            <a href="#etiquette">{etiquetteHeading}</a>
          </li>
          <li>
            <a href="#faqs">{faqsHeading}</a>
          </li>
        </ul>
      </nav>

      <section>
        <h2>{highlightsTitle}</h2>
        <ul>
          {highlights.map((item, index) => (
            <li key={`highlight-${index}`}>{item}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>{saveTitle}</h2>
        <ul>
          {saveList.map((item, index) => (
            <li key={`save-${index}`}>{item}</li>
          ))}
        </ul>
      </section>

      <section id="rooms">
        <h2>{roomsHeading}</h2>
        <ul>
          {roomsList.map((item, index) => (
            <li key={`room-${index}`}>{item}</li>
          ))}
          {roomsLinks.map(({ key, label }, index) => (
            <li key={`room-link-${key}-${index}`}>
              <span>{roomsHeading}: </span>
              <Link to={`/${context.lang}/${getSlug("guides", context.lang)}/${guideSlug(context.lang, key)}`}>
                {label ?? getGuideLinkLabel(guidesT, guidesFallback, key)}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section id="arrival">
        <h2>{arrivalHeading}</h2>
        {arrivalText ? <p>{arrivalText}</p> : null}
        <ul>
          {arrivalLinks.map(({ key }, index) => (
            <li key={`arrival-link-${key}-${index}`}>
              <Link to={`/${context.lang}/${getSlug("guides", context.lang)}/${guideSlug(context.lang, key)}`}>
                {getGuideLinkLabel(guidesT, guidesFallback, key)}
              </Link>
            </li>
          ))}
          {arrivalRoutes.length > 0 ? (
            <li>
              <span>{arrivalRoutesLabel} </span>
              {arrivalRoutes.map(({ key, label }, index) => (
                <Fragment key={`arrival-route-${key}-${index}`}>
                  <Link to={`/${context.lang}/${getSlug("guides", context.lang)}/${guideSlug(context.lang, key)}`}>
                    {label ?? getGuideLinkLabel(guidesT, guidesFallback, key)}
                  </Link>
                  {index < arrivalRoutes.length - 1 ? ", " : null}
                </Fragment>
              ))}
            </li>
          ) : null}
        </ul>
      </section>

      <section id="etiquette">
        <h2>{etiquetteHeading}</h2>
        <ul>
          {etiquetteList.map((item, index) => (
            <li key={`etiq-${index}`}>{item}</li>
          ))}
        </ul>
      </section>

      <section id="faqs">
        <h2>{faqsHeading}</h2>
        {faqItems.map(({ q, a }, index) => (
          <details key={`faq-${index}`}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </section>
    </>
  );
}

function createGuideFaqFallback(): (lang: string) => Array<{ q: string; a: string }> | undefined {
  return (langParam: string) => {
    try {
      const translator =
        (i18n.getFixedT?.(langParam, "guides") as TFunction | undefined) ??
        (i18n.getFixedT?.("en", "guides") as TFunction | undefined);
      if (!translator) return undefined;
      const raw = translator(`content.${GUIDE_KEY}.faq`, { returnObjects: true }) as unknown;
      const fallback = filterFaqEntries(ensureArray(raw));
      return fallback.length > 0 ? [fallback[0]] : undefined;
    } catch {
      return undefined;
    }
  };
}

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer error message
  throw new Error("guide manifest entry missing for onlyHostel");
}

const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry, {
  template: () => ({
    articleExtras: (context) => buildArticleExtras(context),
    guideFaqFallback: createGuideFaqFallback(),
    relatedGuides: { items: [{ key: "reachBudget" }, { key: "sitaTickets" }, { key: "whatToPack" }] },
  }),
  clientLoader: async ({ request }: LoaderFunctionArgs) => {
    const lang = langFromRequest(request);
    await preloadNamespacesWithFallback(lang, ["guides"], { fallbackOptional: false });
    await ensureGuideContent(lang, "onlyHostel", {
      en: () => import("../../locales/en/guides/content/onlyHostel.json"),
      local:
        lang === "en"
          ? undefined
          : () => import(`../../locales/${lang}/guides/content/onlyHostel.json`).catch(() => undefined),
    });
    return null;
  },
  meta: ({ data }) => {
    const payload = (data ?? {}) as { lang?: string };
    const lang = toAppLanguage(payload.lang);
    const path = `/${lang}/${getSlug("experiences", lang)}/${guideSlug(lang, GUIDE_KEY)}`;
    const url = `${BASE_URL}${path}`;
    const image = buildCfImageUrl("/img/hostel-communal-terrace-lush-view.webp", {
      width: DEFAULT_OG_IMAGE.width,
      height: DEFAULT_OG_IMAGE.height,
      quality: 85,
      format: "auto",
    });
    return buildRouteMeta({
      lang,
      title: `guides.meta.${GUIDE_KEY}.title`,
      description: `guides.meta.${GUIDE_KEY}.description`,
      url,
      path,
      image: { src: image, width: DEFAULT_OG_IMAGE.width, height: DEFAULT_OG_IMAGE.height },
      ogType: "article",
      includeTwitterUrl: true,
    });
  },
  links: ({ data }) => {
    const lang = toAppLanguage((data as { lang?: string } | undefined)?.lang);
    const path = `/${lang}/${getSlug("experiences", lang)}/${guideSlug(lang, GUIDE_KEY)}`;
    return buildRouteLinks({ lang, path, origin: BASE_URL });
  },
});

export default Component;
export { clientLoader, meta, links };