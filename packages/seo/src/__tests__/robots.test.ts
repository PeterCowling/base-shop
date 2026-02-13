import { buildRobotsMetadataRoute,buildRobotsTxt } from "../robots/index.js";

describe("buildRobotsTxt", () => {
  // TC-01: basic robots.txt with sitemap and disallow
  it("produces valid robots.txt with User-agent, Allow, Disallow, and Sitemap", () => {
    const result = buildRobotsTxt({
      siteUrl: "https://example.com",
      sitemapPaths: ["/sitemap.xml"],
      disallowPaths: ["/api/"],
    });
    expect(result).toContain("User-agent: *");
    expect(result).toContain("Allow: /");
    expect(result).toContain("Disallow: /api/");
    expect(result).toContain("Sitemap: https://example.com/sitemap.xml");
  });

  it("supports multiple sitemaps", () => {
    const result = buildRobotsTxt({
      siteUrl: "https://example.com",
      sitemapPaths: ["/sitemap.xml", "/sitemap_index.xml"],
    });
    expect(result).toContain("Sitemap: https://example.com/sitemap.xml");
    expect(result).toContain("Sitemap: https://example.com/sitemap_index.xml");
  });

  it("strips trailing slash from siteUrl", () => {
    const result = buildRobotsTxt({
      siteUrl: "https://example.com/",
      sitemapPaths: ["/sitemap.xml"],
    });
    expect(result).toContain("Sitemap: https://example.com/sitemap.xml");
    expect(result).not.toContain("Sitemap: https://example.com//sitemap.xml");
  });

  // TC-02: allowIndexing: false → Disallow: /
  it("disallows all when allowIndexing is false", () => {
    const result = buildRobotsTxt({
      siteUrl: "https://example.com",
      allowIndexing: false,
    });
    expect(result).toContain("User-agent: *");
    expect(result).toContain("Disallow: /");
    // Should NOT contain Allow: / when disallowing all
    expect(result).not.toMatch(/^Allow: \/$/m);
  });

  it("includes AI bot rules when aiBotRules provided", () => {
    const result = buildRobotsTxt({
      siteUrl: "https://example.com",
      sitemapPaths: ["/sitemap.xml"],
      aiBotRules: [
        { userAgent: "GPTBot", allow: true },
        { userAgent: "ClaudeBot", allow: true },
      ],
    });
    expect(result).toContain("User-agent: GPTBot");
    expect(result).toContain("User-agent: ClaudeBot");
  });
});

describe("buildRobotsMetadataRoute", () => {
  // TC-03: returns MetadataRoute.Robots shape
  it("returns object with rules array and sitemap array", () => {
    const result = buildRobotsMetadataRoute({
      siteUrl: "https://example.com",
      sitemapPaths: ["/sitemap.xml"],
      disallowPaths: ["/api/"],
      aiBotRules: [
        { userAgent: "GPTBot", allow: true },
        { userAgent: "ClaudeBot", allow: true },
      ],
    });

    expect(result).toHaveProperty("rules");
    expect(result).toHaveProperty("sitemap");
    expect(Array.isArray(result.rules)).toBe(true);
    expect(Array.isArray(result.sitemap)).toBe(true);

    // Default user-agent rule
    const defaultRule = (result.rules as Array<Record<string, unknown>>).find(
      (r) => r.userAgent === "*",
    );
    expect(defaultRule).toBeDefined();
    expect(defaultRule?.allow).toBe("/");
    expect(defaultRule?.disallow).toEqual(["/api/"]);

    // AI bot rules
    const gptRule = (result.rules as Array<Record<string, unknown>>).find(
      (r) => r.userAgent === "GPTBot",
    );
    expect(gptRule).toBeDefined();
    expect(gptRule?.allow).toBe("/");

    // Sitemap
    expect(result.sitemap).toContain("https://example.com/sitemap.xml");
  });

  it("returns Disallow: / when allowIndexing is false", () => {
    const result = buildRobotsMetadataRoute({
      siteUrl: "https://example.com",
      allowIndexing: false,
    });

    const rule = (result.rules as Array<Record<string, unknown>>)[0];
    expect(rule?.userAgent).toBe("*");
    expect(rule?.disallow).toBe("/");
  });
});
