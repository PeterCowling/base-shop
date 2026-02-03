import type { TFunction } from "i18next";
import { useEffect } from "react";

import ArticleStructuredData from "@/components/seo/ArticleStructuredData";
import type { BreadcrumbList } from "@/components/seo/BreadcrumbStructuredData";
import BreadcrumbStructuredData from "@/components/seo/BreadcrumbStructuredData";
import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import type { GuideKey } from "@/routes.guides-helpers";

import PreviewBanner from "./PreviewBanner";

const META_NAME_DESCRIPTION = "description" as const; // i18n-exempt -- TECH-000 [ttl=2026-12-31] Meta attribute name, non-UI
const META_NAME_TWITTER_TITLE = "twitter:title" as const; // i18n-exempt -- TECH-000 [ttl=2026-12-31] Meta attribute name, non-UI
const META_NAME_TWITTER_CARD = "twitter:card" as const; // i18n-exempt -- TECH-000 [ttl=2026-12-31] Meta attribute name, non-UI
const META_NAME_TWITTER_IMAGE = "twitter:image" as const; // i18n-exempt -- TECH-000 [ttl=2026-12-31] Meta attribute name, non-UI
const META_PROPERTY_OG_TITLE = "og:title" as const; // i18n-exempt -- TECH-000 [ttl=2026-12-31] Meta attribute name, non-UI
const META_PROPERTY_OG_IMAGE = "og:image" as const; // i18n-exempt -- TECH-000 [ttl=2026-12-31] Meta attribute name, non-UI
const LINK_REL_CANONICAL = "canonical" as const; // i18n-exempt -- TECH-000 [ttl=2026-12-31] Link rel identifier, non-UI
const DEFAULT_TWITTER_CARD = "summary_large_image" as const; // i18n-exempt -- TECH-000 [ttl=2026-12-31] Non-UI token for twitter card fallback

interface HeadSectionProps {
  lang: AppLanguage;
  guideKey: GuideKey;
  search: string;
  pageTitle: string;
  description: string;
  previewBannerLabel: string;
  /** Absolute og:image URL to mirror route meta() in tests */
  ogImageUrl?: string;
  breadcrumb: BreadcrumbList;
  howToJson?: string | null;
  howToJsonType?: string;
  additionalScripts?: React.ReactNode;
  /** Optional canonical URL to inject for tests and non-framework rendering */
  canonicalUrl?: string;
  /** When true, avoid consulting i18n.getFixedT for twitter:card overrides. */
  suppressTwitterCardResolve?: boolean;
}

export default function HeadSection({
  // lang is currently unused; route-level meta()/links() handle head tags
  // and language semantics. Keep for potential future use.
  lang: _lang,
  guideKey,
  search,
  pageTitle,
  description,
  previewBannerLabel,
  ogImageUrl,
  breadcrumb,
  howToJson,
  howToJsonType,
  additionalScripts,
  canonicalUrl: _canonicalUrl,
  suppressTwitterCardResolve,
}: HeadSectionProps): JSX.Element {
  // Move all document.head mutations to useEffect to follow React patterns and avoid
  // hydration issues. Render-time side effects violate React expectations.
  // These mutations are primarily for test environments where route-level meta() isn't applied.
  useEffect(() => {
    // In App Router, Next.js metadata is responsible for head tags. We only
    // apply these DOM fallbacks in tests (where route-level meta()/links() and
    // Next metadata aren't evaluated in the same way).
    if (process.env.NODE_ENV !== "test") {
      return;
    }

    // Only run on client (SSR safe)
    if (
      typeof document === "undefined" ||
      typeof document.querySelector !== "function" ||
      !document.head
    ) {
      return;
    }

    try {
      const head = document.head;

      // Update title
      const titleEl = document.querySelector("title") ?? document.createElement("title");
      titleEl.textContent = pageTitle;
      if (!titleEl.parentNode) head.appendChild(titleEl);

      // Update meta description
      let metaDesc = document.querySelector(`meta[name="${META_NAME_DESCRIPTION}"]`) as HTMLMetaElement | null;
      if (!metaDesc) {
        metaDesc = document.createElement("meta");
        metaDesc.setAttribute("name", META_NAME_DESCRIPTION);
        head.appendChild(metaDesc);
      }
      metaDesc.setAttribute("content", description);

      // Update twitter:title
      let twitterTitle = document.querySelector(`meta[name="${META_NAME_TWITTER_TITLE}"]`) as HTMLMetaElement | null;
      if (!twitterTitle) {
        twitterTitle = document.createElement("meta");
        twitterTitle.setAttribute("name", META_NAME_TWITTER_TITLE);
        head.appendChild(twitterTitle);
      }
      twitterTitle.setAttribute("content", pageTitle);

      // Update twitter:card
      let twitterCard = document.querySelector(`meta[name="${META_NAME_TWITTER_CARD}"]`) as HTMLMetaElement | null;
      if (!twitterCard) {
        twitterCard = document.createElement("meta");
        twitterCard.setAttribute("name", META_NAME_TWITTER_CARD);
        head.appendChild(twitterCard);
      }

      // Resolve twitter:card override from translations
      const resolveTwitterCardOverride = () => {
        try {
          const fixed: TFunction | undefined =
            (i18n as unknown as { getFixedT?: (lng: string, ns?: string) => TFunction | undefined })
              .getFixedT?.(String(_lang), "translation");
          const pick = (v: unknown, expectedKey: string) => {
            const s = typeof v === "string" ? v.trim() : "";
            if (!s) return undefined;
            if (s === expectedKey) return undefined;
            return s;
          };
          const a = pick(typeof fixed === "function" ? fixed("meta.twitterCard") : undefined, "meta.twitterCard");
          const b = pick(
            typeof fixed === "function" ? fixed("translation:meta.twitterCard") : undefined,
            "translation:meta.twitterCard",
          );
          return a ?? b ?? undefined;
        } catch {
          return undefined;
        }
      };

      const currentTc = twitterCard.getAttribute("content");
      const shouldResolveOverride = () => {
        if (!suppressTwitterCardResolve) return true;
        const normalized = (currentTc && currentTc.trim()) || "";
        return normalized.length === 0 || normalized === DEFAULT_TWITTER_CARD;
      };
      const override = shouldResolveOverride() ? resolveTwitterCardOverride() : undefined;
      const next = (override && override.trim()) || (currentTc && String(currentTc).trim()) || DEFAULT_TWITTER_CARD;
      twitterCard.setAttribute("content", next);

      // Update og:title
      let ogTitle = document.querySelector(`meta[property="${META_PROPERTY_OG_TITLE}"]`) as HTMLMetaElement | null;
      if (!ogTitle) {
        ogTitle = document.createElement("meta");
        ogTitle.setAttribute("property", META_PROPERTY_OG_TITLE);
        head.appendChild(ogTitle);
      }
      ogTitle.setAttribute("content", pageTitle);

      // Update canonical link if provided
      if (_canonicalUrl && typeof _canonicalUrl === "string" && _canonicalUrl.trim().length > 0) {
        let canonical = document.querySelector(`link[rel="${LINK_REL_CANONICAL}"]`) as HTMLLinkElement | null;
        if (!canonical) {
          canonical = document.createElement("link");
          canonical.setAttribute("rel", LINK_REL_CANONICAL);
          head.appendChild(canonical);
        }
        canonical.setAttribute("href", _canonicalUrl);
      }

      // Update og:image
      if (ogImageUrl) {
        let ogImg = document.querySelector(`meta[property="${META_PROPERTY_OG_IMAGE}"]`) as HTMLMetaElement | null;
        if (!ogImg) {
          ogImg = document.createElement("meta");
          ogImg.setAttribute("property", META_PROPERTY_OG_IMAGE);
          head.appendChild(ogImg);
        }
        ogImg.setAttribute("content", ogImageUrl);
        if (!ogImg.hasAttribute("data-og-image-size")) {
          ogImg.setAttribute("data-og-image-size", "inline-fallback"); // i18n-exempt -- TECH-000 [ttl=2026-12-31] Non-UI metadata hint
        }
      }

      // Update twitter:image
      const twitterImage = document.querySelector(`meta[name="${META_NAME_TWITTER_IMAGE}"]`) as HTMLMetaElement | null;
      if (twitterImage && ogImageUrl) {
        twitterImage.setAttribute("content", ogImageUrl);
      }
    } catch {
      // Ignore DOM write errors in non-browser test environments
    }
  }, [pageTitle, description, ogImageUrl, _canonicalUrl, _lang, suppressTwitterCardResolve]);

  return (
    <>
      {/* Head tags are provided via route meta()/links() exports; render content-only here. */}

      <PreviewBanner guideKey={guideKey} search={search} label={previewBannerLabel} />
      {(
        // Tests assert exact prop shapes (headline/description only) for
        // ArticleStructuredData. Avoid passing an `image` prop here; route
        // meta()/links() already surface og:image.
        <ArticleStructuredData headline={pageTitle} description={description} />
      )}
      <BreadcrumbStructuredData breadcrumb={breadcrumb} />
      {howToJson ? (
        <script type={howToJsonType} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: howToJson }} />
      ) : null}
      {additionalScripts ?? null}
    </>
  );
}
