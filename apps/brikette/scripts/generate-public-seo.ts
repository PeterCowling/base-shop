/* eslint-disable security/detect-non-literal-fs-filename -- SEO-1001 [ttl=2026-12-31] Build-time generator writes only within the app workspace. */

import { copyFile, mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { BASE_URL } from "@/config/site";
import howToGetHereRoutes from "@/data/how-to-get-here/routes.json";
import { type AppLanguage, i18nConfig } from "@/i18n.config";
import { listAppRouterUrls } from "@/routing/routeInventory";
import { buildRobotsTxt } from "@/seo/robots";
import type { SlugKey } from "@/types/slugs";
import { getSlug } from "@/utils/slug";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_ROOT = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(APP_ROOT, "public");

const normalizePathname = (value: string): string => {
  const withLeadingSlash = value.startsWith("/") ? value : `/${value}`;
  // Ensure trailing slash for all paths except root
  if (withLeadingSlash === "/") return withLeadingSlash;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
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
const listDirectionPaths = (): string[] =>
  Object.keys(howToGetHereRoutes.routes).map((slug) => `/directions/${slug}`);

const main = async (): Promise<void> => {
  await ensureDir(PUBLIC_DIR);
  await syncSchemaAssets();

  // Use App Router URL inventory as source of truth for sitemap
  const sitemapXml = buildSitemapXml(["/", ...listDirectionPaths(), ...listAppRouterUrls()]);
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
