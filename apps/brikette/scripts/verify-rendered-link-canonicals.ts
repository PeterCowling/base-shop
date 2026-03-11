import fs from "node:fs";
import path from "node:path";

import { GUIDES_INDEX } from "@/data/guides.index";
import { guidePath } from "@/routes.guides-helpers";
import { listLocalizedCanonicalAppUrls } from "@/routing/routeInventory";

const DEFAULT_OUT_DIR = "out";
const CANONICAL_ORIGIN = "https://hostel-positano.com";
const LINK_PATTERN = /<a\b[^>]*\bhref=(["'])(.*?)\1/gi;
const SAME_HOSTS = new Set([
  "hostel-positano.com",
  "www.hostel-positano.com",
  "staging.hostel-positano.com",
  "brikette-website.pages.dev",
  "staging.brikette-website.pages.dev",
]);
const REPRESENTATIVE_GUIDE_SECTIONS = [
  "experiences",
  "howToGetHere",
] as const;
const REPRESENTATIVE_ROUTES = [
  "/en",
  "/it",
  "/ja",
  "/it/prenota",
  "/it/prenota-alloggi-privati",
  "/en/book-private-accommodations",
  "/fr/reserver-hebergements-prives",
  "/en/private-rooms/sea-view-apartment",
  "/it/camere-private/appartamento-vista-mare",
] as const;

type Finding = {
  page: string;
  href: string;
  resolvedPath: string;
  reason: string;
};

function parseArgs(argv: string[]): string {
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--out-dir") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("Missing value for --out-dir");
      }
      return value;
    }
    if (arg.startsWith("--out-dir=")) {
      return arg.slice("--out-dir=".length);
    }
  }
  return DEFAULT_OUT_DIR;
}

function resolveAppRoot(): string {
  const cwd = process.cwd();
  const appMarker = path.join(cwd, "src", "i18n.config.ts");
  if (fs.existsSync(appMarker)) return cwd;

  const repoCandidate = path.join(cwd, "apps", "brikette");
  const repoMarker = path.join(repoCandidate, "src", "i18n.config.ts");
  if (fs.existsSync(repoMarker)) return repoCandidate;

  return cwd;
}

function getRepresentativeGuideRoutes(): string[] {
  const liveGuides = GUIDES_INDEX.filter((guide) => guide.status === "live");
  const routes: string[] = [];

  for (const section of REPRESENTATIVE_GUIDE_SECTIONS) {
    const representativeGuide = liveGuides.find((guide) => guide.section === section);
    if (!representativeGuide) {
      throw new Error(`No live guide available for representative section: ${section}`);
    }
    routes.push(guidePath("en", representativeGuide.key), guidePath("it", representativeGuide.key));
  }

  return routes;
}

function getRepresentativeRoutes(): string[] {
  return [...REPRESENTATIVE_ROUTES, ...getRepresentativeGuideRoutes()];
}

function routeToHtmlFile(outDir: string, route: string): string {
  const withoutLeadingSlash = route.replace(/^\/+/, "");
  const directHtml = path.join(outDir, `${withoutLeadingSlash}.html`);
  if (fs.existsSync(directHtml)) return directHtml;

  const nestedIndex = path.join(outDir, withoutLeadingSlash, "index.html");
  if (fs.existsSync(nestedIndex)) return nestedIndex;

  if (route === "/") {
    const rootIndex = path.join(outDir, "index.html");
    if (fs.existsSync(rootIndex)) return rootIndex;
  }

  throw new Error(`Missing rendered HTML for route ${route} in ${outDir}`);
}

function isIgnoredHref(href: string): boolean {
  return (
    href === "" ||
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("javascript:") ||
    href.startsWith("data:") ||
    href.startsWith("blob:")
  );
}

function isIgnoredResolvedPath(pathname: string): boolean {
  return (
    pathname === "" ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/img/") ||
    pathname.startsWith("/fonts/") ||
    pathname.startsWith("/icons/") ||
    pathname === "/favicon.ico" ||
    pathname === "/manifest.json" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    /\/[^/]+\.[a-z0-9]+$/i.test(pathname)
  );
}

function resolveInternalPath(href: string, currentRoute: string): string | null {
  if (isIgnoredHref(href) || href.includes("?")) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(href, `${CANONICAL_ORIGIN}${currentRoute}`);
  } catch {
    return null;
  }

  if (!SAME_HOSTS.has(parsed.hostname)) {
    return null;
  }

  const resolvedPath = parsed.pathname || "/";
  if (isIgnoredResolvedPath(resolvedPath)) {
    return null;
  }

  return resolvedPath;
}

function findRenderedInternalLinkFindings(outDir: string): {
  findings: Finding[];
  pagesAudited: number;
  linksChecked: number;
} {
  const canonicalRoutes = new Set(listLocalizedCanonicalAppUrls());
  const findings: Finding[] = [];
  let linksChecked = 0;

  for (const route of getRepresentativeRoutes()) {
    const htmlPath = routeToHtmlFile(outDir, route);
    const html = fs.readFileSync(htmlPath, "utf8");

    for (const match of html.matchAll(LINK_PATTERN)) {
      const href = match[2] ?? "";
      const resolvedPath = resolveInternalPath(href, route);
      if (!resolvedPath) continue;

      linksChecked += 1;

      if (!canonicalRoutes.has(resolvedPath)) {
        findings.push({
          page: route,
          href,
          resolvedPath,
          reason: "not_in_canonical_route_inventory",
        });
      }
    }
  }

  return {
    findings,
    pagesAudited: getRepresentativeRoutes().length,
    linksChecked,
  };
}

async function main(): Promise<void> {
  const outDirArg = parseArgs(process.argv.slice(2));
  const appRoot = resolveAppRoot();
  const outDir = path.resolve(appRoot, outDirArg);

  if (!fs.existsSync(outDir)) {
    throw new Error(`Output directory does not exist: ${outDir}`);
  }

  const { findings, pagesAudited, linksChecked } = findRenderedInternalLinkFindings(outDir);
  const representativeRoutes = getRepresentativeRoutes();

  if (findings.length > 0) {
    console.error(
      JSON.stringify(
        {
          outDir,
          pagesAudited,
          linksChecked,
          representativeRoutes,
          invalidLinks: findings.length,
          sample: findings.slice(0, 50),
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
    return;
  }

  console.info(
    JSON.stringify(
      {
        outDir,
        pagesAudited,
        linksChecked,
        representativeRoutes,
        invalidLinks: 0,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
