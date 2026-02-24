import { BASE_URL } from "@/config/site";
import { listAppRouterUrls } from "@/routing/routeInventory";

import {
  assertNoBulkTodayLastmod,
  buildGuideLastmodByPath,
  buildSitemapXml,
  listDirectionPaths,
  resolveGuideLastmod,
} from "../../../scripts/generate-public-seo";

type ParsedSitemapEntry = {
  loc: string;
  lastmod?: string;
};

const URL_ENTRY_PATTERN = /<url><loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?<\/url>/g;
const ISO_UTC_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const baseUrl = BASE_URL.replace(/\/$/, "");

const parseSitemapEntries = (xml: string): ParsedSitemapEntry[] => {
  const entries: ParsedSitemapEntry[] = [];
  for (const match of xml.matchAll(URL_ENTRY_PATTERN)) {
    const [, loc, lastmod] = match;
    entries.push({ loc, lastmod });
  }
  return entries;
};

describe("generate-public-seo lastmod contracts", () => {
  test("TC-12: emits lastmod only for eligible guide-detail URLs and values are ISO UTC", async () => {
    const { lastmodByPath } = await buildGuideLastmodByPath();
    const sitemapXml = buildSitemapXml(["/", ...listDirectionPaths(), ...listAppRouterUrls()], lastmodByPath);
    const entries = parseSitemapEntries(sitemapXml);

    expect(lastmodByPath.size).toBeGreaterThan(0);
    expect(entries.length).toBeGreaterThan(lastmodByPath.size);

    for (const entry of entries) {
      const pathname = entry.loc.replace(baseUrl, "");
      const eligibleLastmod = lastmodByPath.get(pathname);

      if (eligibleLastmod) {
        expect(entry.lastmod).toBe(eligibleLastmod);
        expect(entry.lastmod).toMatch(ISO_UTC_PATTERN);
        expect(new Date(entry.lastmod as string).toISOString()).toBe(entry.lastmod);
      } else {
        expect(entry.lastmod).toBeUndefined();
      }
    }
  }, 60000);

  test("TC-13: prefers lastUpdated over seo.lastUpdated and blocks bulk-today accidents", () => {
    const precedence = resolveGuideLastmod({
      lastUpdated: "2025-06-01",
      seo: { lastUpdated: "2025-01-01" },
    });
    expect(precedence.lastmod).toBe("2025-06-01T00:00:00.000Z");
    expect(precedence.hasConflict).toBe(true);

    const now = new Date("2026-02-22T12:00:00.000Z");
    const bulkToday = Array.from(
      { length: 120 },
      () => "2026-02-22T01:00:00.000Z",
    );
    expect(() => assertNoBulkTodayLastmod(bulkToday, now)).toThrow("bulk-today");
    expect(() =>
      assertNoBulkTodayLastmod(
        ["2026-02-21T01:00:00.000Z", "2026-01-01T00:00:00.000Z"],
        now,
      )).not.toThrow();
  });
});
