/* eslint-disable security/detect-non-literal-fs-filename -- SEO-1001 [ttl=2026-12-31] Build-time generator writes only within the app workspace. */

import { copyFile, mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { listDirectionPaths, listLocalizedPaths } from "@/compat/route-runtime";
import { BASE_URL } from "@/config/site";
import { i18nConfig, type AppLanguage } from "@/i18n.config";
import type { SlugKey } from "@/types/slugs";
import { getSlug } from "@/utils/slug";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_ROOT = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(APP_ROOT, "public");

const normalizePathname = (value: string): string => {
  const withSlash = value.startsWith("/") ? value : `/${value}`;
  if (withSlash.length > 1 && withSlash.endsWith("/")) return withSlash.slice(0, -1);
  return withSlash;
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

const buildSitemapXml = (paths: string[]): string => {
  const entries = paths
    .map((pathname) => normalizePathname(pathname))
    .filter((pathname) => !shouldExcludeFromSitemap(pathname))
    .map((pathname) => `${baseUrl}${pathname}`)
    .sort();

  const body = entries.map((loc) => `  <url><loc>${escapeXml(loc)}</loc></url>`).join("\n");
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

const buildRobotsTxt = (): string => {
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

const main = async (): Promise<void> => {
  await ensureDir(PUBLIC_DIR);
  await syncSchemaAssets();

  const sitemapXml = buildSitemapXml(["/", ...listDirectionPaths(), ...listLocalizedPaths()]);
  await writeFile(path.join(PUBLIC_DIR, "sitemap.xml"), sitemapXml, "utf8");

  const sitemapIndexXml = buildSitemapIndexXml();
  await writeFile(path.join(PUBLIC_DIR, "sitemap_index.xml"), sitemapIndexXml, "utf8");

  const robotsTxt = buildRobotsTxt();
  await writeFile(path.join(PUBLIC_DIR, "robots.txt"), robotsTxt, "utf8");
};

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
