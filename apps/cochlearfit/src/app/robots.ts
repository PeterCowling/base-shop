import type { MetadataRoute } from "next";

import { buildRobotsMetadataRoute } from "@acme/seo/robots";

import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const allowIndexing = process.env["NEXT_PUBLIC_ALLOW_INDEXING"] === "true";

  return buildRobotsMetadataRoute({
    siteUrl: SITE_URL,
    allowIndexing,
    ...(allowIndexing
      ? { sitemapPaths: ["/sitemap.xml"], disallowPaths: ["/api/", "/checkout/", "/thank-you/"] }
      : {}),
  }) as MetadataRoute.Robots;
}
