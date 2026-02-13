export interface RobotsConfig {
  siteUrl: string;
  allowIndexing?: boolean;
  sitemapPaths?: string[];
  disallowPaths?: string[];
  aiBotRules?: Array<{ userAgent: string; allow: boolean }>;
}

/**
 * Build a robots.txt string from config.
 * Returns plain text suitable for a route handler response.
 */
export function buildRobotsTxt(config: RobotsConfig): string {
  const base = config.siteUrl.replace(/\/$/, "");
  const lines: string[] = [];

  if (config.allowIndexing === false) {
    // i18n-exempt -- SEO-05 robots.txt protocol directives, not user-facing copy [ttl=2027-12-31]
    lines.push("User-agent: *", "Disallow: /");
  } else {
    // i18n-exempt -- SEO-05 robots.txt protocol directives, not user-facing copy [ttl=2027-12-31]
    lines.push("User-agent: *", "Allow: /");
    if (config.disallowPaths) {
      for (const path of config.disallowPaths) {
        lines.push(`Disallow: ${path}`);
      }
    }
  }

  // AI bot-specific rules
  if (config.aiBotRules) {
    for (const rule of config.aiBotRules) {
      lines.push("");
      lines.push(`User-agent: ${rule.userAgent}`);
      lines.push(rule.allow ? "Allow: /" : "Disallow: /");
    }
  }

  // Sitemap entries
  if (config.sitemapPaths) {
    lines.push("");
    for (const path of config.sitemapPaths) {
      lines.push(`Sitemap: ${base}${path}`);
    }
  }

  lines.push("");
  return lines.join("\n");
}
