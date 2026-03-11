/* eslint-disable ds/no-hardcoded-copy -- TECH-000 [ttl=2026-12-31] robots.txt directives are crawler protocol literals, not guest-facing copy. */
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
