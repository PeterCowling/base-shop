// src/routes/guides/wi-fi-and-work-cafes-positano.tsx
import { memo, useMemo } from "react";
import GuideSeoTemplate from "./_GuideSeoTemplate";
import type { LoaderFunctionArgs } from "react-router-dom";
import i18n from "@/i18n";
import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";
import { langFromRequest } from "@/utils/lang";
import { ensureGuideContent } from "@/utils/ensureGuideContent";
import type { GuideKey } from "@/routes.guides-helpers";
import ImageGallery from "@/components/guides/ImageGallery";
import TableOfContents from "@/components/guides/TableOfContents";
import { useGuideTranslations } from "./guide-seo/translations";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { ensureStringArray } from "@/utils/i18nContent";
import { guideSlug } from "@/routes.guides-helpers";
import { getSlug } from "@/utils/slug";
import { BASE_URL } from "@/config/site";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import { OG_IMAGE as DEFAULT_OG_IMAGE } from "@/utils/headConstants";
import type { MetaFunction, LinksFunction } from "react-router";
import type { AppLanguage } from "@/i18n.config";
import type { NormalizedFaqEntry } from "@/utils/buildFaqJsonLd";
import type { GuideSeoTemplateContext } from "./guide-seo/types";
import { unifyNormalizedFaqEntries } from "@/utils/seo/jsonld";

export const handle = { tags: ["connectivity", "digital-nomads", "positano"] };

export const GUIDE_KEY = "workCafes" as const satisfies GuideKey;
export const GUIDE_SLUG = "wi-fi-and-work-cafes-positano" as const;

function WorkCafes(): JSX.Element {
  const lang = useCurrentLanguage();
  const { translateGuides, tGuides } = useGuideTranslations(lang);
  const hasLocalizedStructuredContent = useMemo(() => {
    try {
      const introRaw = i18n.getResource(lang, "guides", `content.${GUIDE_KEY}.intro`);
      if (Array.isArray(introRaw)) {
        const intro = ensureStringArray(introRaw);
        if (intro.length > 0) {
          return true;
        }
      }
    } catch {
      /* noop */
    }

    try {
      const sectionsRaw = i18n.getResource(lang, "guides", `content.${GUIDE_KEY}.sections`);
      if (Array.isArray(sectionsRaw)) {
        const hasSection = sectionsRaw.some((entry) => {
          if (!entry || typeof entry !== "object") return false;
          const section = entry as { title?: unknown; body?: unknown; items?: unknown };
          const title = typeof section.title === "string" ? section.title.trim() : "";
          const body = ensureStringArray(section.body ?? section.items);
          return title.length > 0 || body.length > 0;
        });
        if (hasSection) {
          return true;
        }
      }
    } catch {
      /* noop */
    }

    return false;
  }, [lang]);
  const shouldRenderGenericContent = hasLocalizedStructuredContent;
  return (
    <GuideSeoTemplate
      guideKey={GUIDE_KEY}
      metaKey={GUIDE_KEY}
      preferManualWhenUnlocalized
      alwaysProvideFaqFallback
      renderGenericContent={shouldRenderGenericContent}
      relatedGuides={{ items: [{ key: "simsAtms" }, { key: "reachBudget" }, { key: "luggageStorage" }] }}
      // Provide a fallback FAQ normaliser so JSON-LD includes valid entries
      // even when structured arrays are incomplete.
      guideFaqFallback={() => {
        const faqsRaw = translateGuides(`content.${GUIDE_KEY}.faqs`, { returnObjects: true }) as unknown;
        const faqFallback = translateGuides(`content.${GUIDE_KEY}.faq`, { returnObjects: true }) as unknown;
        const merged: unknown[] = [];
        if (Array.isArray(faqsRaw)) {
          merged.push(...faqsRaw);
        } else if (faqsRaw && typeof faqsRaw === "object") {
          merged.push(faqsRaw);
        }
        if (Array.isArray(faqFallback)) {
          merged.push(...faqFallback);
        } else if (faqFallback && typeof faqFallback === "object") {
          merged.push(faqFallback);
        }

        return unifyNormalizedFaqEntries(merged) satisfies NormalizedFaqEntry[];
      }}
      // Build a manual ToC list when structured sections are absent.
      buildTocItems={() => {
        if (shouldRenderGenericContent) return null; // defer to default behaviour

        const pick = (key: string, fallback: string): string => {
          const raw = tGuides(key) as unknown;
          const val = typeof raw === "string" ? raw.trim() : "";
          if (!val || val === key) {
            return fallback;
          }
          return val;
        };

        const speeds = pick(`content.${GUIDE_KEY}.toc.speeds`, "Speeds");
        const habits = pick(`content.${GUIDE_KEY}.toc.habits`, "Habits");
        const gear = pick(`content.${GUIDE_KEY}.toc.gear`, "Gear");

        // FAQs label:
        // - If the per‑guide key exists but collapses to empty, treat as explicit opt‑out.
        // - If the key is not present (value === key), use a minimal generic fallback.
        const faqsKey = `content.${GUIDE_KEY}.toc.faqs` as const;
        const faqsRaw = tGuides(faqsKey) as unknown;
        const faqsLocal = typeof faqsRaw === "string" ? faqsRaw.trim() : "";
        // Treat a return value equal to the raw key as "not provided" (missing key)
        const faqsProvided = typeof faqsRaw === "string" && (faqsRaw as string) !== faqsKey;
        const faqs = faqsProvided ? (faqsLocal && faqsLocal !== faqsKey ? faqsLocal : "") : "FAQs";

        const items = [
          speeds ? { href: "#speeds", label: speeds } : null,
          habits ? { href: "#habits", label: habits } : null,
          gear ? { href: "#gear", label: gear } : null,
          faqs ? { href: "#faqs", label: faqs } : null,
        ].filter((v): v is { href: string; label: string } => v != null);

        return items;
      }}
      articleExtras={(ctx: GuideSeoTemplateContext) => {
        // When localized structured arrays exist we defer to GenericContent and
        // only append the gallery section.
        if (shouldRenderGenericContent) {
          const title = ctx.translateGuides("content.workCafes.galleryTitle", {
            defaultValue: ctx.translateGuides("apartmentPage:galleryHeading"),
          }) as string | undefined;
          const items = [
            {
              src: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=800&fit=crop",
              alt: ctx.translateGuides("content.workCafes.gallery.item1Alt") as string,
              caption: ctx.translateGuides("content.workCafes.gallery.item1Caption") as string,
            },
            {
              src: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=1200&h=800&fit=crop",
              alt: ctx.translateGuides("content.workCafes.gallery.item2Alt") as string,
              caption: ctx.translateGuides("content.workCafes.gallery.item2Caption") as string,
            },
          ].filter((it) => typeof it.alt === "string" && it.alt && typeof it.caption === "string" && it.caption);
          const galleryItems = items.filter((it) => typeof it.alt === "string" && it.alt && typeof it.caption === "string" && it.caption) as Array<{
            src: string;
            alt: string;
            caption: string;
          }>;
          return galleryItems.length > 0 ? (
            <section id="gallery">
              {title ? <h2>{title}</h2> : null}
              <ImageGallery items={galleryItems} />
            </section>
          ) : null;
        }

        // When structured sections are missing, render a concise manual lead
        // including connectivity speeds, coverage links, habits and gear.

        const hasStructuredSections = Array.isArray(ctx.sections) && ctx.sections.length > 0;
        const speedsText = ctx.translateGuides(`content.${GUIDE_KEY}.speeds`) as string | undefined;
        const backupText = ctx.translateGuides(`content.${GUIDE_KEY}.backup`) as string | undefined;
        const habitsList = ensureStringArray(
          ctx.translateGuides(`content.${GUIDE_KEY}.habits`, { returnObjects: true }) as unknown,
        );
        const gearList = ensureStringArray(
          ctx.translateGuides(`content.${GUIDE_KEY}.gear`, { returnObjects: true }) as unknown,
        );
        const coverageUrls = (ctx.translateGuides(`content.${GUIDE_KEY}.coverageUrls`, {
          returnObjects: true,
        }) ?? {}) as Record<string, unknown>;
        const coverageLinks = (ctx.translateGuides(`content.${GUIDE_KEY}.coverageLinks`, {
          returnObjects: true,
        }) ?? {}) as Record<string, unknown>;

        const title = ctx.translateGuides("content.workCafes.galleryTitle", {
          defaultValue: ctx.translateGuides("apartmentPage:galleryHeading"),
        }) as string | undefined;
        const items = [
          {
            src: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=800&fit=crop",
            alt: ctx.translateGuides("content.workCafes.gallery.item1Alt") as string,
            caption: ctx.translateGuides("content.workCafes.gallery.item1Caption") as string,
          },
          {
            src: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=1200&h=800&fit=crop",
            alt: ctx.translateGuides("content.workCafes.gallery.item2Alt") as string,
            caption: ctx.translateGuides("content.workCafes.gallery.item2Caption") as string,
          },
        ].filter((it) => typeof it.alt === "string" && it.alt && typeof it.caption === "string" && it.caption);
        const galleryItems = items.filter((it) => typeof it.alt === "string" && it.alt && typeof it.caption === "string" && it.caption) as Array<{
          src: string;
          alt: string;
          caption: string;
        }>;
        const Gallery = galleryItems.length > 0 ? (
          <section id="gallery">
            {title ? <h2>{title}</h2> : null}
            <ImageGallery items={galleryItems} />
          </section>
        ) : null;

        // Build coverage links if present
        const coverageEntries = Object.entries(coverageUrls)
          .map(([key, url]) => {
            const href = typeof url === "string" ? url : "";
            const labelRaw = coverageLinks?.[key];
            const label = typeof labelRaw === "string" ? labelRaw : key;
            return href && label ? { href, label } : null;
          })
          .filter((v): v is { href: string; label: string } => v != null);

        const tocTitle = tGuides(`content.${GUIDE_KEY}.toc.onThisPage`) as string | undefined;
        // Reuse context.toc (from buildTocItems) for the manual ToC items
        const manualTocItems: GuideSeoTemplateContext["toc"] = Array.isArray(ctx.toc) ? ctx.toc : [];

        // Only treat the context-provided ToC as "structured" when the page
        // actually has structured sections. When sections are missing (this
        // manual path), prefer rendering the manual ToC here even if ctx.toc
        // contains items from a custom builder to avoid suppressing the nav.
        const hasStructuredToc = hasStructuredSections && Array.isArray(ctx.toc) && ctx.toc.length > 0;
        return (
          <>
            {/* Manual fallback lead */}
            {manualTocItems.length > 0 && !hasStructuredToc ? (
              <TableOfContents
                items={manualTocItems}
                {...(typeof tocTitle === "string" ? { title: tocTitle } : {})}
              />
            ) : null}

            <section id="speeds">
              <h2>{(ctx.translateGuides(`content.${GUIDE_KEY}.toc.speeds`) as string) || "Speeds"}</h2>
              {speedsText ? <p>{speedsText}</p> : null}
              {coverageEntries.length > 0 ? (
                <ul>
                  {coverageEntries.map(({ href, label }) => (
                    <li key={href}>
                      <a href={href}>{label}</a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>

            <section id="habits">
              <h2>{(ctx.translateGuides(`content.${GUIDE_KEY}.toc.habits`) as string) || "Habits"}</h2>
              {habitsList.length > 0 ? (
                <ul>
                  {habitsList.map((h, i) => (
                    <li key={`h-${i}`}>{h}</li>
                  ))}
                </ul>
              ) : null}
            </section>

            <section id="gear">
              <h2>{(ctx.translateGuides(`content.${GUIDE_KEY}.toc.gear`) as string) || "Gear"}</h2>
              {gearList.length > 0 ? (
                <ul>
                  {gearList.map((g, i) => (
                    <li key={`g-${i}`}>{g}</li>
                  ))}
                </ul>
              ) : null}
            </section>

            {backupText ? (
              <section id="backup">
                <h2>{(ctx.translateGuides("labels.backupPlan") as string) || "Backup plan"}</h2>
                <p>{backupText}</p>
              </section>
            ) : null}

            {/* Keep the lightweight gallery after the manual content */}
            {Gallery}
          </>
        );
      }}
    />
  );
}

export default memo(WorkCafes);

export async function clientLoader({ request }: LoaderFunctionArgs) {
  const lang = langFromRequest(request);
  await preloadNamespacesWithFallback(lang, ["guides"], { fallbackOptional: false });
  await i18n.changeLanguage(lang);
  await ensureGuideContent(lang, "workCafes", {
    en: () => import("../../locales/en/guides/content/workCafes.json"),
    local:
      lang === "en"
        ? undefined
        : () => import(`../../locales/${lang}/guides/content/workCafes.json`).catch(() => undefined),
  });
  return { lang } as const;
}


// Prefer shared head helpers so lints can verify descriptors
export const meta: MetaFunction = ({ data }: { data?: unknown } = {}) => {
  const d = (data ?? {}) as { lang?: AppLanguage };
  const lang = (d.lang ?? "en") as AppLanguage;
  const path = `/${lang}/${getSlug("experiences", lang)}/${guideSlug(lang, GUIDE_KEY)}`;
  const url = `${BASE_URL}${path}`;
  const image = buildCfImageUrl("/img/positano-panorama.avif", {
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
};

export const links: LinksFunction = () => buildRouteLinks();
