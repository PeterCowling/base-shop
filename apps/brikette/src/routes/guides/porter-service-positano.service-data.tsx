import ArticleStructuredData from "@/components/seo/ArticleStructuredData";
import BreadcrumbStructuredData, {
  type BreadcrumbList,
} from "@/components/seo/BreadcrumbStructuredData";
import ServiceStructuredData from "@/components/seo/ServiceStructuredData";
import { BASE_URL } from "@/config/site";
import guidesBreadcrumbs from "@/locales/en/guides/breadcrumbs.json";
import porterServicesContent from "@/locales/en/guides/content/porterServices.json";
import { guideHref } from "@/routes.guides-helpers";
import { getGuideLinkLabel } from "@/utils/translationFallbacks";

import type { GuideSeoTemplateContext } from "./_GuideSeoTemplate";
// Namespace import to tolerate partial mocks (GUIDE_SLUG optional)
import * as CONSTS from "./porter-service-positano.constants";

type PositanoConstants = typeof import("./porter-service-positano.constants");
const C: Partial<PositanoConstants> = CONSTS;

type TranslateOptions = { defaultValue?: unknown; returnObjects?: boolean };

const FALLBACK_KEY_SLUG = C.GUIDE_KEY
  ? String(C.GUIDE_KEY).replace(/([a-z\d])([A-Z])/g, "$1-$2").replace(/_/g, "-").toLowerCase()
  : "porter-service-positano";

function normaliseSlug(slug: string | undefined): string {
  if (typeof slug !== "string") return FALLBACK_KEY_SLUG;
  const trimmed = slug.trim().replace(/^\/+/u, "").replace(/\/+$/u, "");
  if (trimmed.length === 0) {
    return FALLBACK_KEY_SLUG;
  }
  return trimmed;
}

function buildCanonicalUrl(pathOrLang: string, slug: string | undefined): string {
  const rawSegments = typeof pathOrLang === "string" ? pathOrLang.split("/") : [];
  const segments = rawSegments.map((segment) => segment.trim()).filter((segment) => segment.length > 0);
  const langSegment = (segments[0] ?? "en").toLowerCase();
  const canonicalSlug = normaliseSlug(slug);
  return `${BASE_URL}/${langSegment}/guides/${canonicalSlug}`;
}

function resolveGuideSlug(context: GuideSeoTemplateContext): string {
  const key = C.GUIDE_KEY ?? "porterServices";
  const hrefSegments = guideHref(context.lang, key)
    .split("/")
    .filter((segment) => segment.length > 0);
  const slug = hrefSegments[hrefSegments.length - 1] ?? "";
  if (!slug || slug === FALLBACK_KEY_SLUG) {
    return C.GUIDE_SLUG ?? "porter-service-positano";
  }
  return slug;
}

function resolveGuidePath(context: GuideSeoTemplateContext): string {
  // For structured data, normalise the porter service URL under the
  // conventional "/guides" base regardless of internal routing groups.
  const slug = resolveGuideSlug(context);
  const lang = context.lang;
  return `/${lang}/guides/${slug}`;
}

function resolveServiceName(
  context: GuideSeoTemplateContext,
  fallbackGuides: GuideSeoTemplateContext["translateGuides"],
): string {
  const key = C.GUIDE_KEY ?? "porterServices";
  const slug = resolveGuideSlug(context);
  const slugSegments = slug.split(/[-_]+/).filter((segment) => segment.length > 0);

  const slugDerived = slugSegments
    .map((segment, index) => (index === 0 ? segment.charAt(0).toUpperCase() + segment.slice(1) : segment))
    .join(" ")
    .trim();

  const sanitise = (value: unknown) => {
    if (typeof value !== "string") return "";
    const trimmed = value.trim();
    if (
      trimmed.length === 0 ||
      trimmed === `content.${key}.linkLabel` ||
      trimmed === key ||
      trimmed.toLowerCase().includes("fallback")
    ) {
      return "";
    }
    return trimmed;
  };

  const fallbackLabel = sanitise(getGuideLinkLabel(fallbackGuides, fallbackGuides, key));

  const localizedLabel = context.translateGuides
    ? sanitise(getGuideLinkLabel(context.translateGuides, fallbackGuides, key))
    : "";

  const hasLocalizedLabel = localizedLabel.length > 0;
  const hasFallbackLabel = fallbackLabel.length > 0;
  const fallbackName = (hasLocalizedLabel ? localizedLabel : fallbackLabel) || slugDerived || key;

  if (!hasLocalizedLabel && hasFallbackLabel) {
    return fallbackName;
  }

  const candidate = context.article.title?.trim();
  if (candidate && candidate.length > 0) {
    const words = candidate.split(/\s+/).filter((word) => word.length > 0);
    if (words.length > 1 || slugSegments.length <= 1) {
      return candidate;
    }
    if (words.length === 1) {
      const word = words[0];
      const firstSlug = slugSegments[0]?.toLowerCase();
      if (word && firstSlug && word.toLowerCase() !== firstSlug) {
        return candidate;
      }
    }
  }

  return fallbackName;
}

function resolveServiceUrl(context: GuideSeoTemplateContext): string {
  const path = resolveGuidePath(context);
  const canonical = context.canonicalUrl?.trim();
  if (canonical) {
    try {
      const parsed = new URL(canonical);
      const pathToUse = parsed.pathname && parsed.pathname !== "/" ? parsed.pathname : path;
      parsed.pathname = pathToUse;
      parsed.search = "";
      parsed.hash = "";
      return parsed.toString();
    } catch {
      if (canonical.startsWith("/")) {
        return `${BASE_URL}${canonical}`;
      }
    }
  }

  return buildCanonicalUrl(context.lang, resolveGuideSlug(context));
}

export function createAdditionalScripts(
  fallbackGuides: GuideSeoTemplateContext["translateGuides"],
): (context: GuideSeoTemplateContext) => JSX.Element {
  function PorterServicePositanoAdditionalScripts(
    context: GuideSeoTemplateContext,
  ): JSX.Element {
    return (
      <ServiceStructuredData
        name={resolveServiceName(context, fallbackGuides)}
        description={context.article.description}
        image={context.ogImage.url}
        inLanguage={context.lang}
        url={resolveServiceUrl(context)}
      />
    );
  }

  PorterServicePositanoAdditionalScripts.displayName =
    "PorterServicePositanoAdditionalScripts";

  return PorterServicePositanoAdditionalScripts;
}

function resolveFromOptions(key: string, options?: TranslateOptions): unknown {
  if (options?.returnObjects) {
    if (Array.isArray(options.defaultValue)) {
      return options.defaultValue;
    }
    if (options?.defaultValue && typeof options.defaultValue === "object") {
      return options.defaultValue;
    }
    return [];
  }

  if (options && Object.prototype.hasOwnProperty.call(options, "defaultValue")) {
    return options.defaultValue ?? key;
  }

  return key;
}

function createPreviewTranslate(): GuideSeoTemplateContext["translateGuides"] {
  const guideSeo = (porterServicesContent as {
    seo?: { title?: string; description?: string };
  }).seo;
  const breadcrumbsRecord = guidesBreadcrumbs as Record<string, string | undefined>;

  const BREADCRUMBS_PREFIX = "breadcrumbs.";

  const translator = ((key: string, second?: unknown) => {
    if (typeof second === "string") {
      return second;
    }

    const options = (second ?? undefined) as TranslateOptions | undefined;

    if (key.startsWith(BREADCRUMBS_PREFIX)) {
      const breadcrumbKey = key.slice(BREADCRUMBS_PREFIX.length);
      return breadcrumbsRecord[breadcrumbKey] ?? resolveFromOptions(key, options);
    }

    switch (key) {
      case `content.${C.GUIDE_KEY ?? "porterServices"}.linkLabel`:
        return (porterServicesContent as { linkLabel?: string }).linkLabel ?? resolveFromOptions(key, options);
      case `content.${C.GUIDE_KEY ?? "porterServices"}.seo.title`:
        return guideSeo?.title ?? resolveFromOptions(key, options);
      case `content.${C.GUIDE_KEY ?? "porterServices"}.seo.description`:
        return guideSeo?.description ?? resolveFromOptions(key, options);
      default:
        return resolveFromOptions(key, options);
    }
  }) as GuideSeoTemplateContext["translateGuides"];

  return Object.assign(translator, { $TFunctionBrand: "" as never });
}

const PREVIEW_TRANSLATE = createPreviewTranslate();

export const __TESTING__ = {
  buildCanonicalUrl,
  resolveGuideSlug,
  resolveGuidePath,
  resolveServiceName,
  resolveServiceUrl,
  resolveFromOptions,
  createPreviewTranslate,
  readGuideString,
} as const;

function readGuideString(key: string, defaultValue: string): string {
  const raw = PREVIEW_TRANSLATE(key, { defaultValue });
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  return defaultValue;
}

const previewHeadline = readGuideString(
  `content.${C.GUIDE_KEY ?? "porterServices"}.seo.title`,
  String(C.GUIDE_KEY ?? "porterServices"),
);
const previewDescription = readGuideString(
  `content.${C.GUIDE_KEY ?? "porterServices"}.seo.description`,
  previewHeadline,
);

const previewArticle = {
  headline: previewHeadline,
  description: previewDescription,
  image: `${BASE_URL}${C.OG_IMAGE?.path ?? "/img/positano-panorama.avif"}`,
} as const;

const previewPath = guideHref("en", C.GUIDE_KEY ?? "porterServices");

const breadcrumbHome = readGuideString("breadcrumbs.home", "breadcrumbs.home");
const breadcrumbGuides = readGuideString("breadcrumbs.guides", "breadcrumbs.guides");

const PREVIEW_BREADCRUMB: BreadcrumbList = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: breadcrumbHome,
      item: `${BASE_URL}/en`,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: breadcrumbGuides,
      item: `${BASE_URL}/en/guides`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: previewArticle.headline,
      item: `${BASE_URL}${previewPath}`,
    },
  ],
};

const PREVIEW_CONTEXT: GuideSeoTemplateContext = {
  lang: "en",
  guideKey: C.GUIDE_KEY ?? ("porterServices" as const),
  metaKey: C.GUIDE_KEY ?? ("porterServices" as const),
  hasLocalizedContent: true,
  translator: PREVIEW_TRANSLATE,
  translateGuides: PREVIEW_TRANSLATE,
  sections: [],
  intro: [],
  faqs: [],
  toc: [],
  ogImage: {
    url: previewArticle.image,
    width: C.OG_IMAGE?.width ?? 1200,
    height: C.OG_IMAGE?.height ?? 630,
  },
  article: { title: previewArticle.headline, description: previewArticle.description },
  canonicalUrl: `${BASE_URL}${previewPath}`,
};

const previewAdditionalScripts = createAdditionalScripts(PREVIEW_TRANSLATE);

export function PorterServiceStructuredDataPreview(): JSX.Element {
  return (
    <>
      <ArticleStructuredData
        headline={previewArticle.headline}
        description={previewArticle.description}
        image={previewArticle.image}
      />
      <BreadcrumbStructuredData breadcrumb={PREVIEW_BREADCRUMB} />
      {previewAdditionalScripts(PREVIEW_CONTEXT)}
    </>
  );
}

export default PorterServiceStructuredDataPreview;
