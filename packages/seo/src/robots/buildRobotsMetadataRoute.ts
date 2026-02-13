import type { RobotsConfig } from "./buildRobotsTxt.js";

/**
 * Build a MetadataRoute.Robots-compatible object for Next.js `robots.ts` convention.
 */
export function buildRobotsMetadataRoute(
  config: RobotsConfig,
): Record<string, unknown> {
  const base = config.siteUrl.replace(/\/$/, "");

  if (config.allowIndexing === false) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  const rules: Array<Record<string, unknown>> = [
    {
      userAgent: "*",
      allow: "/",
      ...(config.disallowPaths?.length
        ? { disallow: config.disallowPaths }
        : {}),
    },
  ];

  if (config.aiBotRules) {
    for (const rule of config.aiBotRules) {
      rules.push({
        userAgent: rule.userAgent,
        ...(rule.allow ? { allow: "/" } : { disallow: "/" }),
      });
    }
  }

  const result: Record<string, unknown> = { rules };

  if (config.sitemapPaths?.length) {
    result.sitemap = config.sitemapPaths.map((p) => `${base}${p}`);
  }

  return result;
}
