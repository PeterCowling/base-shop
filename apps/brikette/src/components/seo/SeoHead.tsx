/* eslint-disable ds/no-hardcoded-copy -- SEO-315 [ttl=2026-12-31] Schema.org structured data literals are non-UI. */
// src/components/seo/SeoHead.tsx
// Unified head builder: title/description, OG/Twitter parity, canonical + hreflang
import React, { Fragment, memo, useMemo } from "react";

import type { AppLanguage } from "@/i18n.config";
import { getOrigin, getPathname } from "@/utils/env-helpers";
import { buildLinks,pageHead  } from "@/utils/seo";

type OgImage = { src: string; width?: number | string; height?: number | string; alt?: string };

type Props = {
  lang: AppLanguage;
  title: string;
  description: string;
  /** Absolute URL to the page for og:url + twitter:url */
  url?: string;
  /** OG image block (1200x630 recommended) */
  image?: OgImage;
  /** Override og:type (defaults to "website") */
  ogType?: string;
  /** If false, emit robots noindex,follow */
  isPublished?: boolean;
  /** Optional explicit path for canonical/hreflang (e.g. "/en/foo/bar") */
  path?: string;
  /** Optional override for twitter:card (e.g., "summary") */
  twitterCard?: string;
};

function SeoHead({ lang, title, description, url, image, ogType, isPublished = true, path, twitterCard }: Props): JSX.Element {
  // Resolve canonical path and origin deterministically in all environments
  const origin = useMemo(() => getOrigin(), []);
  const canonicalPath = useMemo(() => (path && path.startsWith("/") ? path : getPathname()), [path]);
  const resolvedUrl = url ?? `${origin}${canonicalPath}`;

  // Canonical + hreflang link descriptors
  const links = useMemo(() => buildLinks({ lang, origin, path: canonicalPath }), [lang, origin, canonicalPath]);

  return (
    <Fragment>
      {pageHead({
        lang,
        title,
        description,
        url: resolvedUrl,
        twitterCard: twitterCard ?? "summary_large_image",
        includeTwitterUrl: Boolean(resolvedUrl),
        ...(image ? { image } : {}),
        ...(ogType ? { ogType } : {}),
      })}
      {links.map((l) => {
        // Ensure stable, unique keys even when two alternates share the same href
        // (e.g., language-specific and x-default pointing to the same URL).
        const key = l.rel === "alternate"
          ? `${l.rel}-${l.href}-${l.hrefLang ?? ""}`
          : `${l.rel}-${l.href || l.hrefLang}`;
        return (
          <link
            key={key}
            rel={l.rel}
            href={l.href}
            {...(l.hrefLang ? { hrefLang: l.hrefLang } : {})}
          />
        );
      })}
      {!isPublished ? <meta name="robots" content="noindex,follow" /> : null}
    </Fragment>
  );
}

export default memo(SeoHead);
