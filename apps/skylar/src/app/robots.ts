import type { MetadataRoute } from "next";

import { buildRobotsMetadataRoute } from "@acme/seo/robots";

const SITE_URL = "https://skylarsrl.com";
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const allowIndexing = process.env["NEXT_PUBLIC_ALLOW_INDEXING"] === "true";

  return buildRobotsMetadataRoute({
    siteUrl: SITE_URL,
    allowIndexing,
    ...(allowIndexing ? { sitemapPaths: ["/sitemap.xml"] } : {}),
  }) as MetadataRoute.Robots;
}
