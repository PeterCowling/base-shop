import type { Metadata } from "next";

import { withLocale } from "@/lib/routes";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import type { Locale } from "@/types/locale";

type OpenGraphConfig = {
  title: string;
  description: string;
  url: string;
  type: "website";
  image?: {
    url: string;
    width: number;
    height: number;
    alt: string;
  };
};

export function buildMetadata({
  locale,
  title,
  description,
  path,
  openGraph,
}: {
  locale: Locale;
  title: string;
  description: string;
  path: string;
  openGraph?: OpenGraphConfig;
}): Metadata {
  const canonicalPath = withLocale(path, locale);
  const canonicalUrl = new URL(canonicalPath, SITE_URL).toString();

  const metadata: Metadata = {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
  };

  if (openGraph) {
    metadata.openGraph = {
      title: openGraph.title,
      description: openGraph.description,
      type: openGraph.type,
      url: openGraph.url,
      siteName: SITE_NAME,
      images: openGraph.image
        ? [
            {
              url: openGraph.image.url,
              width: openGraph.image.width,
              height: openGraph.image.height,
              alt: openGraph.image.alt,
            },
          ]
        : undefined,
    };
  }

  return metadata;
}
