// src/routes/guides/only-hostel-in-positano.tsx
import { Fragment, memo } from "react";
import { useTranslation } from "react-i18next";
import type { LinksFunction,MetaFunction } from "react-router";
import type { LoaderFunctionArgs } from "react-router-dom";
import { Link } from "react-router-dom";
import type { TFunction } from "i18next";

import GuideFaqJsonLd from "@/components/seo/GuideFaqJsonLd";
import { BASE_URL } from "@/config/site";
import { GETTING_HERE_LINK_SETS } from "@/content/gettingHere";
import i18n from "@/i18n";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { type GuideKey,guideSlug } from "@/routes.guides-helpers";
import { type NormalizedFaqEntry,normalizeFaqEntries } from "@/utils/buildFaqJsonLd";
import { ensureGuideContent } from "@/utils/ensureGuideContent";
import { normaliseGuideLinks } from "@/utils/guideLinks";
import { OG_IMAGE as DEFAULT_OG_IMAGE } from "@/utils/headConstants";
import { ensureStringArray } from "@/utils/i18nContent";
import { langFromRequest , toAppLanguage } from "@/utils/lang";
import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";
import { buildRouteLinks,buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";
import { getGuideLinkLabel } from "@/utils/translationFallbacks";

import GuideSeoTemplate, { type GuideSeoTemplateContext } from "./_GuideSeoTemplate";

type FilteredFaqEntry = { q: string; a: string | string[] };

export function filterFaqEntries(entries: unknown): FilteredFaqEntry[] {
  if (!Array.isArray(entries)) {
    return [];
  }

  const filtered: FilteredFaqEntry[] = [];

  for (const entry of entries) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const record = entry as { q?: unknown; a?: unknown };
    const question = typeof record.q === "string" ? record.q : "";
    const trimmedQuestion = question.trim();

    if (trimmedQuestion.length === 0) {
      continue;
    }

    if (typeof record.a === "string") {
      const single = record.a;
      if (single.trim().length === 0) {
        continue;
      }

      filtered.push({ q: question, a: single });
      continue;
    }

    if (!Array.isArray(record.a)) {
      continue;
    }

    const answers = ensureStringArray(record.a).filter((value) => value.trim().length > 0);

    if (answers.length === 0) {
      continue;
    }

    filtered.push({ q: question, a: answers });
  }

  return filtered;
}

export const handle = { tags: ["accommodation", "hostel-life", "positano", "budgeting"] };

export const GUIDE_KEY: GuideKey = "onlyHostel" as const;
export const GUIDE_SLUG = "only-hostel-in-positano" as const;

function OnlyHostelGuide(): JSX.Element {
  const { i18n: hookI18n } = useTranslation("guides");

  const resolveFaqFallback = (langParam: string): NormalizedFaqEntry[] | undefined => {
    try {
      const fixed = (hookI18n?.getFixedT?.(langParam, "guides") || i18n.getFixedT(langParam, "guides")) as TFunction;
      const raw = fixed(`content.${GUIDE_KEY}.faq`, { returnObjects: true }) as unknown;
      const normalized = normalizeFaqEntries(raw);
      return normalized.length > 0 ? normalized : undefined;
    } catch {
      return undefined;
    }
  };

  return (
    <GuideSeoTemplate
      guideKey={GUIDE_KEY}
      metaKey={GUIDE_KEY}
      relatedGuides={{ items: [{ key: "reachBudget" }, { key: "sitaTickets" }, { key: "whatToPack" }] }}
      renderGenericContent={false}
      genericContentOptions={{ faqHeadingLevel: 3 }}
      guideFaqFallback={resolveFaqFallback}
      additionalScripts={() => (
        <GuideFaqJsonLd
          guideKey={GUIDE_KEY}
          fallback={resolveFaqFallback}
        />
      )}
      articleExtras={(ctx: GuideSeoTemplateContext) => {
        const t: TFunction = ctx.translateGuides as unknown as TFunction;
        const guidesT: TFunction = ctx.translateGuides as unknown as TFunction;
        const guidesEnT: TFunction = (i18n.getFixedT?.("en", "guides") as TFunction) || (ctx.translateGuides as unknown as TFunction);

        const toc = (t("content.onlyHostel.toc", { returnObjects: true }) as Record<string, string>) || {};
        const highlights = ensureStringArray(t("content.onlyHostel.highlights", { returnObjects: true }));
        const saveList = ensureStringArray(t("content.onlyHostel.save", { returnObjects: true }));
        const roomsList = ensureStringArray(t("content.onlyHostel.roomsList", { returnObjects: true }));
        const roomsLinks = normaliseGuideLinks(t("content.onlyHostel.roomsLinks", { returnObjects: true }));
        const arrivalText = t("content.onlyHostel.arrivalText", "");
        const arrivalLinks = normaliseGuideLinks(
          t("content.onlyHostel.arrivalLinks", { returnObjects: true }),
          GETTING_HERE_LINK_SETS.arrivalEssentials,
        );
        const arrivalRoutesLabel = t("content.onlyHostel.arrivalRoutesLabel");
        const arrivalRoutes = normaliseGuideLinks(
          t("content.onlyHostel.arrivalRoutes", { returnObjects: true }),
          GETTING_HERE_LINK_SETS.originRoutes,
        );
        const etiquetteList = ensureStringArray(t("content.onlyHostel.etiquetteList", { returnObjects: true }));
        const faqItems = resolveFaqFallback(ctx.lang) ?? [];

        return (
          <>
            {/* Intro rendered by GenericContent; avoid duplicating here */}

            {/* Highlights */}
            <section>
              <h2>{t("content.onlyHostel.highlightsTitle") as string}</h2>
              <ul>
                {highlights.map((li, i) => (
                  <li key={`highlight-${i}`}>{li}</li>
                ))}
              </ul>
            </section>

            {/* Save */}
            <section>
              <h2>{t("content.onlyHostel.saveTitle") as string}</h2>
              <ul>
                {saveList.map((li, i) => (
                  <li key={`save-${i}`}>{li}</li>
                ))}
              </ul>
            </section>

            {/* ToC */}
            <nav aria-label={toc["onThisPage"] ?? (t("content.onlyHostel.toc.onThisPage") as string)}>
              <ul>
                <li>
                  <a href="#rooms">{toc["rooms"] ?? (t("content.onlyHostel.toc.rooms") as string)}</a>
                </li>
                <li>
                  <a href="#arrival">{toc["arrival"] ?? (t("content.onlyHostel.toc.arrival") as string)}</a>
                </li>
                <li>
                  <a href="#etiquette">{toc["etiquette"] ?? (t("content.onlyHostel.toc.etiquette") as string)}</a>
                </li>
                <li>
                  <a href="#faqs">{toc["faqs"] ?? (t("content.onlyHostel.toc.faqs") as string)}</a>
                </li>
              </ul>
            </nav>

            {/* Rooms */}
            <section id="rooms">
              <h2>{toc["rooms"] ?? (t("content.onlyHostel.toc.rooms") as string)}</h2>
              <ul>
                {roomsList.map((li, i) => (
                  <li key={`room-li-${i}`}>{li}</li>
                ))}
                {roomsLinks.map(({ key, label }, index) => (
                  <li key={`roomlink-${key}-${index}`}>
                    <span>{toc["rooms"] ?? (t("content.onlyHostel.toc.rooms") as string)}: </span>
                    <Link to={`/${ctx.lang}/${getSlug("guides", ctx.lang)}/${guideSlug(ctx.lang, key)}`}>
                      {label ?? getGuideLinkLabel(guidesT, guidesEnT, key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            {/* Arrival */}
            <section id="arrival">
              <h2>{toc["arrival"] ?? (t("content.onlyHostel.toc.arrival") as string)}</h2>
              {arrivalText ? <p>{arrivalText as string}</p> : null}
              <ul>
                {arrivalLinks.map(({ key, label }, index) => (
                  <li key={`arrlink-${key}-${index}`}>
                    <Link to={`/${ctx.lang}/${getSlug("guides", ctx.lang)}/${guideSlug(ctx.lang, key)}`}>
                      {label ?? getGuideLinkLabel(guidesT, guidesEnT, key)}
                    </Link>
                  </li>
                ))}
                {arrivalRoutes.length > 0 ? (
                  <li>
                    <span>{arrivalRoutesLabel as string} </span>
                    {arrivalRoutes.map(({ key, label }, index) => (
                      <Fragment key={`route-${key}-${index}`}>
                        <Link to={`/${ctx.lang}/${getSlug("guides", ctx.lang)}/${guideSlug(ctx.lang, key)}`}>
                          {label ?? getGuideLinkLabel(guidesT, guidesEnT, key)}
                        </Link>
                        {index < arrivalRoutes.length - 1 ? ", " : null}
                      </Fragment>
                    ))}
                  </li>
                ) : null}
              </ul>
            </section>

            {/* Etiquette */}
            <section id="etiquette">
              <h2>{toc["etiquette"] ?? (t("content.onlyHostel.toc.etiquette") as string)}</h2>
              <ul>
                {etiquetteList.map((li, i) => (
                  <li key={`etiq-${i}`}>{li}</li>
                ))}
              </ul>
            </section>

            {/* FAQs */}
            <section id="faqs">
              <h3>{toc["faqs"] ?? (t("content.onlyHostel.toc.faqs") as string)}</h3>
              {faqItems.map(({ question, answer }, index) => (
                <details key={`faq-${index}`}>
                  <summary>{question}</summary>
                  {answer.map((paragraph, paragraphIndex) => (
                    <p key={`faq-${index}-paragraph-${paragraphIndex}`}>{paragraph}</p>
                  ))}
                </details>
              ))}
            </section>
          </>
        );
      }}
    />
  );
}

export default memo(OnlyHostelGuide);

export async function clientLoader({ request }: LoaderFunctionArgs) {
  const lang = langFromRequest(request);
  await preloadNamespacesWithFallback(lang, ["guides"], { fallbackOptional: false });
  await i18n.changeLanguage(lang);
  await ensureGuideContent(lang, "onlyHostel", {
    en: () => import("../../locales/en/guides/content/onlyHostel.json"),
    local:
      lang === "en"
        ? undefined
        : () => import(`../../locales/${lang}/guides/content/onlyHostel.json`).catch(() => undefined),
  });
  return { lang } as const;
}

// Route head: canonical/hreflang + OG/Twitter (incl. twitter:card)
export const meta: MetaFunction = ({ data }: { data?: unknown } = {}) => {
  const lng = toAppLanguage((data as { lang?: string } | undefined)?.lang);
  const path = `/${lng}/${getSlug("experiences", lng)}/${guideSlug(lng, GUIDE_KEY)}`;
  const url = `${BASE_URL}${path}`;
  const image = buildCfImageUrl("/img/hostel-communal-terrace-lush-view.webp", {
    width: DEFAULT_OG_IMAGE.width,
    height: DEFAULT_OG_IMAGE.height,
    quality: 85,
    format: "auto",
  });
  return buildRouteMeta({
    lang: lng,
    title: `guides.meta.${GUIDE_KEY}.title`,
    description: `guides.meta.${GUIDE_KEY}.description`,
    url,
    path,
    image: { src: image, width: DEFAULT_OG_IMAGE.width, height: DEFAULT_OG_IMAGE.height },
    ogType: "article",
    includeTwitterUrl: true,
  });
};
export const links: LinksFunction = () => buildRouteLinks();
