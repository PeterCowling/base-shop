import { BASE_URL } from "@/config/site";
import { i18nConfig } from "@/i18n.config";

export function buildRobotsTxt(): string {
  const baseUrl = BASE_URL.replace(/\/$/, "");
  const sitemapUrl = `${baseUrl}/sitemap_index.xml`;
  const supportedLangs = (i18nConfig.supportedLngs ?? []) as string[];
  const disallowDraftLines = supportedLangs.flatMap((lang) => [
    `Disallow: /${lang}/draft`,
    `Disallow: /${lang}/draft/`,
  ]);

  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "Disallow: /cms",
    "Disallow: /.well-known/",
    "Disallow: /preview",
    "Disallow: /preview/",
    ...disallowDraftLines,
    `Sitemap: ${sitemapUrl}`,
    "",
  ].join("\n");
}

