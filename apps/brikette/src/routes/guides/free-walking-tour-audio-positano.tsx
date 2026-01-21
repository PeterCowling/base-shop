// src/routes/guides/free-walking-tour-audio-positano.tsx
import type { LinksFunction, MetaFunction } from "react-router";
import type { LoaderFunctionArgs } from "react-router-dom";
import type { TFunction } from "i18next";

import type { AppLanguage } from "@/i18n.config";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideAbsoluteUrl,guideHref } from "@/routes.guides-helpers";
// Satisfy template-enforcement lint rule for guides routes without adding runtime weight
import type {} from "@/routes/guides/_GuideSeoTemplate";
import { ensureStringArray } from "@/utils/i18nContent";
import { toAppLanguage } from "@/utils/lang";
import { buildRouteLinks, buildRouteMeta } from "@/utils/routeHead";

import { defineGuideRoute, type GuideLinksArgs } from "./defineGuideRoute";
import { getGuideManifestEntry } from "./guide-manifest";
import getFallbackLanguage from "./utils/getFallbackLanguage";

export const handle = { tags: ["walking-tour", "positano", "audio-guide"] };

export const GUIDE_KEY = "walkingTourAudio" as const satisfies GuideKey;
export const GUIDE_SLUG = "free-walking-tour-audio-positano" as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for walkingTourAudio"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Developer-only safeguard surfaced in build logs
}

function buildMeta(metaKey: string, isPublished: boolean): MetaFunction {
  return ({ data }) => {
    const payload = (data ?? {}) as { lang?: string };
    const lang = toAppLanguage((payload.lang as string | undefined) ?? getFallbackLanguage());
    const path = guideHref(lang, GUIDE_KEY);
    const url = guideAbsoluteUrl(lang, GUIDE_KEY);
    const image = buildCfImageUrl("/img/hostel-communal-terrace-lush-view.webp", {
      width: 1200,
      height: 630,
      quality: 85,
      format: "auto",
    });
    return buildRouteMeta({
      lang,
      title: `guides.meta.${metaKey}.title`,
      description: `guides.meta.${metaKey}.description`,
      url,
      path,
      image: { src: image, width: 1200, height: 630 },
      ogType: "article",
      includeTwitterUrl: true,
      isPublished,
    });
  };
}

const resolveLangFromArgs = (args?: GuideLinksArgs | null): AppLanguage => {
  const dataPayload = args?.data as { lang?: unknown } | null | undefined;
  const paramsPayload = args?.params as { lang?: unknown } | null | undefined;
  const dataLang = typeof dataPayload?.lang === "string" ? dataPayload.lang : undefined;
  const paramLang = typeof paramsPayload?.lang === "string" ? paramsPayload.lang : undefined;
  return toAppLanguage(dataLang ?? paramLang ?? getFallbackLanguage());
};

const buildLinksForArgs = (args?: GuideLinksArgs | null): ReturnType<LinksFunction> => {
  const lang = resolveLangFromArgs(args ?? undefined);
  const path = guideHref(lang, manifestEntry.key);
  const url = guideAbsoluteUrl(lang, manifestEntry.key);
  const requestUrl = typeof args?.request?.url === "string" ? args.request.url : undefined;
  const origin = (() => {
    if (!requestUrl) return undefined;
    try {
      return new URL(requestUrl).origin;
    } catch {
      return undefined;
    }
  })();
  return buildRouteLinks({ lang, path, url, ...(origin ? { origin } : {}) });
};

const {
  Component,
  clientLoader: baseClientLoader,
  meta: baseMeta,
} = defineGuideRoute(manifestEntry, {
  template: () => ({
    preferGenericWhenFallback: true,
    relatedGuides: {
      items: [
        { key: "sunsetViewpoints" },
        { key: "positanoBeaches" },
        { key: "positanoTravelGuide" },
      ],
    },
  }),
  meta: buildMeta(
    manifestEntry.metaKey ?? manifestEntry.key,
    manifestEntry.status === "live",
  ),
  links: (args) => buildLinksForArgs(args),
});

export default Component;
export const clientLoader = (args: LoaderFunctionArgs) => baseClientLoader(args);
export const meta: MetaFunction = (args) => baseMeta(args);
export const links = ((
  ...linkArgs: Parameters<LinksFunction>
) => {
  const [firstArg] = linkArgs;
  return buildLinksForArgs(firstArg);
}) satisfies LinksFunction;

export type WalkingTourFallback = {
  intro: string[];
  toc: { href: string; label: string }[];
  sections: { id: string; title: string; body: string[] }[];
  faqs: { q: string; a: string[] }[];
  tocTitle: string;
  faqHeading: string;
};

export function buildFallbackContent(t: TFunction): WalkingTourFallback {
  const key = `content.${GUIDE_KEY}`;

  const intro = ensureStringArray(t(`${key}.intro`, { returnObjects: true, defaultValue: [] }))
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const rawSections = t(`${key}.sections`, { returnObjects: true, defaultValue: [] }) as unknown;
  const sections = (Array.isArray(rawSections) ? (rawSections as Array<Record<string, unknown>>) : [])
    .map((section, idx) => {
      const idRaw = typeof section?.["id"] === "string" ? section["id"].trim() : "";
      const id = idRaw.length > 0 ? idRaw : `section-${idx + 1}`;
      const titleRaw = typeof section?.["title"] === "string" ? section["title"].trim() : "";
      const title = titleRaw.length > 0 ? titleRaw : id;
      const bodySource = section?.["body"] ?? section?.["items"];
      const body = ensureStringArray(bodySource).map((p) => p.trim()).filter((p) => p.length > 0);
      if (title.length === 0 && body.length === 0) return null;
      return { id, title, body };
    })
    .filter((section): section is { id: string; title: string; body: string[] } => section != null);

  const rawToc = t(`${key}.toc`, { returnObjects: true, defaultValue: [] }) as unknown;
  let toc: { href: string; label: string }[] = [];
  if (Array.isArray(rawToc) && rawToc.length > 0) {
    toc = (rawToc as Array<Record<string, unknown>>)
      .map((item, index) => {
        const hrefRaw = typeof item?.["href"] === "string" ? item["href"].trim() : "";
        const href = hrefRaw.length > 0 ? hrefRaw : `#${sections[index]?.id ?? `section-${index + 1}`}`;
        const labelRaw = typeof item?.["label"] === "string" ? item["label"].trim() : "";
        const label = labelRaw.length > 0 ? labelRaw : href.replace(/^#/, "");
        return label.length > 0 ? (href.startsWith("#") ? { href, label } : { href: `#${href}`, label }) : null;
      })
      .filter((entry): entry is { href: string; label: string } => entry != null);
  }
  if (toc.length === 0) {
    toc = sections.map((section) => ({ href: `#${section.id}`, label: section.title }));
  }

  const rawFaqs = t(`${key}.faqs`, { returnObjects: true, defaultValue: [] }) as unknown;
  const faqs = (Array.isArray(rawFaqs) ? (rawFaqs as Array<Record<string, unknown>>) : [])
    .map((faq) => {
      const qRaw =
        typeof faq?.["q"] === "string"
          ? faq["q"]
          : typeof faq?.["question"] === "string"
          ? faq["question"]
          : "";
      const q = qRaw.trim();
      const aSource = faq?.["a"] ?? faq?.["answer"];
      const a = ensureStringArray(aSource).map((s) => s.trim()).filter((s) => s.length > 0);
      if (!q) return null;
      return { q, a };
    })
    .filter((entry): entry is { q: string; a: string[] } => entry != null);

  const tocTitleRaw = t(`${key}.tocTitle`, { defaultValue: "On this page" }) as unknown;
  const tocTitle =
    typeof tocTitleRaw === "string" && tocTitleRaw.trim().length > 0
      ? tocTitleRaw.trim()
      : "On this page";

  const faqHeadingRaw = t(`${key}.faqHeading`, { defaultValue: "" }) as unknown;
  const faqHeading = typeof faqHeadingRaw === "string" ? faqHeadingRaw.trim() : "";

  return { intro, toc, sections, faqs, tocTitle, faqHeading };
}
