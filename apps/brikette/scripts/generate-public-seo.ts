/* eslint-disable security/detect-non-literal-fs-filename -- SEO-1001 [ttl=2026-12-31] Build-time generator writes only within the app workspace. */

import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { BASE_URL } from "@/config/site";
import { GUIDES_INDEX } from "@/data/guides.index";
import howToGetHereRoutes from "@/data/how-to-get-here/routes.json";
import { type AppLanguage, i18nConfig } from "@/i18n.config";
import { getGuideManifestEntry } from "@/routes/guides/guide-manifest";
import { guidePath } from "@/routes.guides-helpers";
import { listAppRouterUrls } from "@/routing/routeInventory";
import { buildRobotsTxt } from "@/seo/robots";
import type { SlugKey } from "@/types/slugs";
import { getSlug } from "@/utils/slug";

const resolveAppRoot = (): string => {
  const cwd = process.cwd();
  const appLocalMarker = path.join(cwd, "src", "i18n.config.ts");
  if (existsSync(appLocalMarker)) {
    return cwd;
  }

  const repoRootCandidate = path.join(cwd, "apps", "brikette");
  const repoMarker = path.join(repoRootCandidate, "src", "i18n.config.ts");
  if (existsSync(repoMarker)) {
    return repoRootCandidate;
  }

  return cwd;
};

const APP_ROOT = resolveAppRoot();
const PUBLIC_DIR = path.join(APP_ROOT, "public");
const BULK_TODAY_GUARD_MIN_COUNT = 50;
const BULK_TODAY_GUARD_THRESHOLD = 0.95;

export const normalizePathname = (value: string): string => {
  const withLeadingSlash = value.startsWith("/") ? value : `/${value}`;
  if (withLeadingSlash === "/") return withLeadingSlash;
  return withLeadingSlash.replace(/\/+$/, "");
};

const escapeXml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const baseUrl = BASE_URL.replace(/\/$/, "");

const legacyGuidesSlugByLang = new Set(
  (i18nConfig.supportedLngs ?? []).map((lang) => getSlug("guides" as SlugKey, lang as AppLanguage)),
);

const shouldExcludeFromSitemap = (pathname: string): boolean => {
  if (/^\/[a-z]{2}\/draft(\/|$)/i.test(pathname)) return true;
  if (/\/__guides-manifest__(\/|$)/i.test(pathname)) return true;
  if (/\/404(?:\/|$)/i.test(pathname)) return true;

  const parts = pathname.replace(/^\/+/, "").split("/").filter(Boolean);
  const section = parts[1];
  if (section && legacyGuidesSlugByLang.has(section)) return true;

  return false;
};

const resolveSemanticDate = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
};

export type GuideLastmodResolution = {
  lastmod?: string;
  hasConflict: boolean;
};

export const resolveGuideLastmod = (content: unknown): GuideLastmodResolution => {
  if (!content || typeof content !== "object") {
    return { hasConflict: false };
  }

  const payload = content as {
    lastUpdated?: unknown;
    seo?: { lastUpdated?: unknown } | null;
  };

  const preferredDate = resolveSemanticDate(payload.lastUpdated);
  const fallbackDate = resolveSemanticDate(payload.seo?.lastUpdated);
  const hasConflict = Boolean(preferredDate && fallbackDate && preferredDate !== fallbackDate);

  return {
    lastmod: preferredDate ?? fallbackDate,
    hasConflict,
  };
};

const readGuideContent = async (lang: AppLanguage, contentKey: string): Promise<unknown | undefined> => {
  const contentPath = path.join(APP_ROOT, "src", "locales", lang, "guides", "content", `${contentKey}.json`);
  try {
    const raw = await readFile(contentPath, "utf8");
    return JSON.parse(raw) as unknown;
  } catch {
    return undefined;
  }
};

export type GuideLastmodBuildResult = {
  conflictCount: number;
  lastmodByPath: ReadonlyMap<string, string>;
};

export const buildGuideLastmodByPath = async (): Promise<GuideLastmodBuildResult> => {
  const liveGuides = GUIDES_INDEX.filter((guide) => guide.status === "live");
  const langs = i18nConfig.supportedLngs as AppLanguage[];
  const contentCache = new Map<string, unknown | undefined>();
  const lastmodByPath = new Map<string, string>();
  let conflictCount = 0;

  for (const lang of langs) {
    for (const guide of liveGuides) {
      const manifestEntry = getGuideManifestEntry(guide.key);
      const contentKey = manifestEntry?.contentKey ?? guide.key;
      const cacheKey = `${lang}:${contentKey}`;

      let content = contentCache.get(cacheKey);
      if (!contentCache.has(cacheKey)) {
        content = await readGuideContent(lang, contentKey);
        contentCache.set(cacheKey, content);
      }

      const { lastmod, hasConflict } = resolveGuideLastmod(content);
      if (hasConflict) conflictCount += 1;
      if (!lastmod) continue;

      lastmodByPath.set(normalizePathname(guidePath(lang, guide.key)), lastmod);
    }
  }

  return {
    conflictCount,
    lastmodByPath,
  };
};

export const assertNoBulkTodayLastmod = (
  lastmods: Iterable<string>,
  now: Date = new Date(),
): void => {
  const values = Array.from(lastmods);
  if (values.length < BULK_TODAY_GUARD_MIN_COUNT) return;

  const todayPrefix = now.toISOString().slice(0, 10);
  const todayCount = values.filter((value) => value.startsWith(todayPrefix)).length;
  const todayRatio = todayCount / values.length;

  if (todayRatio >= BULK_TODAY_GUARD_THRESHOLD) {
    throw new Error(
      `[generate-public-seo] bulk-today lastmod guard: ${todayCount}/${values.length} (${Math.round(todayRatio * 100)}%) entries are dated ${todayPrefix}.`,
    );
  }
};

export const buildSitemapXml = (paths: string[], lastmodByPath: ReadonlyMap<string, string> = new Map()): string => {
  const uniquePaths = [...new Set(
    paths
      .map((pathname) => normalizePathname(pathname))
      .filter((pathname) => !shouldExcludeFromSitemap(pathname)),
  )];
  const entries = uniquePaths
    .map((pathname) => ({
      lastmod: lastmodByPath.get(pathname),
      loc: `${baseUrl}${pathname}`,
    }))
    .sort((a, b) => a.loc.localeCompare(b.loc));

  const body = entries
    .map(({ loc, lastmod }) =>
      lastmod
        ? `  <url><loc>${escapeXml(loc)}</loc><lastmod>${escapeXml(lastmod)}</lastmod></url>`
        : `  <url><loc>${escapeXml(loc)}</loc></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${body}\n` +
    `</urlset>\n`;
};

const buildSitemapIndexXml = (): string => {
  const sitemapUrl = `${baseUrl}/sitemap.xml`;
  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `  <sitemap><loc>${escapeXml(sitemapUrl)}</loc></sitemap>\n` +
    `</sitemapindex>\n`;
};

const ensureDir = async (dir: string): Promise<void> => {
  await mkdir(dir, { recursive: true });
};

const syncSchemaAssets = async (): Promise<void> => {
  const sourceDir = path.join(APP_ROOT, "src", "schema", "hostel-brikette");
  const targetDir = path.join(PUBLIC_DIR, "schema", "hostel-brikette");
  await ensureDir(targetDir);

  const entries = await readdir(sourceDir, { withFileTypes: true });
  const jsonldFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".jsonld"));

  await Promise.all(
    jsonldFiles.map((entry) =>
      copyFile(path.join(sourceDir, entry.name), path.join(targetDir, entry.name)),
    ),
  );
};

// Direction paths use /directions/:slug prefix (Cloudflare _redirects)
export const listDirectionPaths = (): string[] =>
  Object.keys(howToGetHereRoutes.routes).map((slug) => `/directions/${slug}`);

export const main = async (): Promise<void> => {
  await ensureDir(PUBLIC_DIR);
  await syncSchemaAssets();
  const { conflictCount, lastmodByPath } = await buildGuideLastmodByPath();
  assertNoBulkTodayLastmod(lastmodByPath.values());

  // Use App Router URL inventory as source of truth for sitemap
  const sitemapXml = buildSitemapXml(["/", ...listDirectionPaths(), ...listAppRouterUrls()], lastmodByPath);
  await writeFile(path.join(PUBLIC_DIR, "sitemap.xml"), sitemapXml, "utf8");

  const sitemapIndexXml = buildSitemapIndexXml();
  await writeFile(path.join(PUBLIC_DIR, "sitemap_index.xml"), sitemapIndexXml, "utf8");

  const robotsTxt = buildRobotsTxt();
  await writeFile(path.join(PUBLIC_DIR, "robots.txt"), robotsTxt, "utf8");

  if (conflictCount > 0) {
    console.info(
      `[generate-public-seo] guide lastmod conflict count (lastUpdated vs seo.lastUpdated): ${conflictCount}`,
    );
  }
  console.info(`[generate-public-seo] sitemap lastmod entries emitted: ${lastmodByPath.size}`);
};

if (process.env.JEST_WORKER_ID === undefined) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
