// src/routes/guides/how-to-get-to-positano.additional-scripts.tsx
import { Fragment } from "react";

import ArticleStructuredData from "@/components/seo/ArticleStructuredData";
import BreadcrumbStructuredData, {
  type BreadcrumbList,
} from "@/components/seo/BreadcrumbStructuredData";
import HowToReachPositanoStructuredData from "@/components/seo/HowToReachPositanoStructuredData";
import { BASE_URL } from "@/config/site";
import type { MetaFunction, LinksFunction } from "react-router";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";
import { guideSlug } from "@/routes.guides-helpers";
import type { AppLanguage } from "@/i18n.config";

import type { GuideSeoTemplateContext } from "./_GuideSeoTemplate";
import { OG_IMAGE } from "./how-to-get-to-positano.constants";
import type { GuideKey } from "@/routes.guides-helpers";
// Ensure this file declares GUIDE_KEY/SLUG as named const exports for linting
export const GUIDE_KEY = "howToGetToPositano" satisfies GuideKey;
export const GUIDE_SLUG = "how-to-get-to-positano" as const;
import { getGuidesTranslator } from "./how-to-get-to-positano.translators";

function createLazyGuidesTranslator(locale: string): GuideSeoTemplateContext["translateGuides"] {
  const translator = ((key: string, second?: unknown) => {
    const candidate = getGuidesTranslator(locale);
    if (typeof candidate === "function") {
      return candidate(key, second as never);
    }

    if (second && typeof second === "object") {
      const options = second as { defaultValue?: unknown; returnObjects?: boolean };
      if (options.returnObjects) {
        const fallback = options.defaultValue;
        if (Array.isArray(fallback)) {
          return fallback;
        }
        return [];
      }
      if (Object.prototype.hasOwnProperty.call(options, "defaultValue")) {
        return options.defaultValue ?? key;
      }
    }

    if (typeof second === "string") {
      return second;
    }

    return key;
  }) as GuideSeoTemplateContext["translateGuides"];

  return Object.assign(translator, { $TFunctionBrand: "" as never });
}

const guidesEn = createLazyGuidesTranslator("en");

function resolveGuideString(key: string, fallbackSource = key): string {
  const raw = guidesEn(key, { defaultValue: "" });
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed.length > 0 && trimmed !== key) {
      return trimmed;
    }
  }

  const leaf = fallbackSource.split(".").pop() ?? fallbackSource;
  const withSpaces = leaf
    .replace(/[-_]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  const capitalised = withSpaces.replace(/\b\w/g, (char) => char.toUpperCase());
  return capitalised.trim();
}

const previewHeadline = resolveGuideString(`content.${GUIDE_KEY}.seo.title`, GUIDE_KEY);
const previewDescription = resolveGuideString(`content.${GUIDE_KEY}.seo.description`, GUIDE_KEY);
const breadcrumbHomeLabel = resolveGuideString("breadcrumbs.home", "home");
const breadcrumbGuidesLabel = resolveGuideString("breadcrumbs.guides", "guides");

const previewTranslate = guidesEn as GuideSeoTemplateContext["translateGuides"];

const PREVIEW_ARTICLE = {
  headline: previewHeadline,
  description: previewDescription,
  image: `${BASE_URL}${OG_IMAGE.path}`,
} as const;

const PREVIEW_BREADCRUMB: BreadcrumbList = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: breadcrumbHomeLabel, item: `${BASE_URL}/en` },
    {
      "@type": "ListItem",
      position: 2,
      name: breadcrumbGuidesLabel,
      item: `${BASE_URL}/en/guides`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: PREVIEW_ARTICLE.headline,
      item: `${BASE_URL}/en/guides/how-to-get-to-positano`,
    },
  ],
};

const PREVIEW_CONTEXT: GuideSeoTemplateContext = {
  lang: "en",
  guideKey: GUIDE_KEY,
  metaKey: GUIDE_KEY,
  hasLocalizedContent: true,
  translator: previewTranslate as GuideSeoTemplateContext["translator"],
  translateGuides: previewTranslate,
  sections: [],
  intro: [],
  faqs: [],
  toc: [],
  ogImage: { url: PREVIEW_ARTICLE.image, width: OG_IMAGE.width, height: OG_IMAGE.height },
  article: { title: PREVIEW_ARTICLE.headline, description: PREVIEW_ARTICLE.description },
  canonicalUrl: `${BASE_URL}/en/guides/how-to-get-to-positano`,
};

export function renderAdditionalScripts(_: GuideSeoTemplateContext): JSX.Element {
  return <HowToReachPositanoStructuredData />;
}

export function HowToGetToPositanoStructuredDataPreview(): JSX.Element {
  return (
    <Fragment>
      <ArticleStructuredData
        headline={PREVIEW_ARTICLE.headline}
        description={PREVIEW_ARTICLE.description}
        image={PREVIEW_ARTICLE.image}
      />
      <BreadcrumbStructuredData breadcrumb={PREVIEW_BREADCRUMB} />
      {renderAdditionalScripts(PREVIEW_CONTEXT)}
    </Fragment>
  );
}

export default HowToGetToPositanoStructuredDataPreview;

export const __test__ = { createLazyGuidesTranslator, resolveGuideString } as const;

// Minimal route head to satisfy canonical and twitter card lint rules
export const meta: MetaFunction = ({ data }) => {
  const d = (data || {}) as { lang?: string };
  const lang = (d.lang as string) || "en";
  const path = `/${lang}/${getSlug("experiences", lang as AppLanguage)}/${guideSlug(
    lang as AppLanguage,
    GUIDE_KEY,
  )}`;
  const url = `${BASE_URL}${path}`;
  const title = `guides.meta.${GUIDE_KEY}.title`;
  const description = `guides.meta.${GUIDE_KEY}.description`;
  return buildRouteMeta({
    lang: lang as AppLanguage,
    title,
    description,
    url,
    path,
    image: { src: `${BASE_URL}${OG_IMAGE.path}`, width: OG_IMAGE.width, height: OG_IMAGE.height },
    ogType: "article",
  });
};

export const links: LinksFunction = () => buildRouteLinks();

