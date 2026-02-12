import { BASE_URL } from "@/config/site";

export function buildRobotsTxt(): string {
  const baseUrl = BASE_URL.replace(/\/$/, "");
  const sitemapUrl = `${baseUrl}/sitemap_index.xml`;

  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "Disallow: /cms",
    "Disallow: /.well-known/",
    `Sitemap: ${sitemapUrl}`,
    "",
  ].join("\n");
}

