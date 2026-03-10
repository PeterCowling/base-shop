import fs from "node:fs";
import path from "node:path";

import { getPrivateRoomChildSlug } from "@acme/ui/config/privateRoomChildSlugs";

import { type AppLanguage, i18nConfig } from "../src/i18n.config";
import { getSlug } from "../src/utils/slug";

const DEFAULT_OUT_DIR = "out";

type RouteAudit = {
  expectedHtmlLang?: string;
  expectedHtmlDir?: "ltr" | "rtl";
  route: string;
  forbiddenHtml?: string[];
  forbiddenText?: string[];
};

const APARTMENT_HTML_KEY_LEAKS = [
  "heroTitle",
  "galleryHeading",
  "fitCheck.heading",
  "fitCheck.arrival.label",
  "fitCheck.inside.label",
  "fitCheck.sleeping.label",
  "fitCheck.sound.label",
  "fitCheck.bestFit.label",
] as const;

function buildApartmentRouteAudits(): RouteAudit[] {
  return (i18nConfig.supportedLngs as AppLanguage[]).map((lang) => ({
    route: `/${lang}/${getSlug("apartment", lang)}/${getPrivateRoomChildSlug("apartment", lang)}`,
    expectedHtmlLang: lang,
    expectedHtmlDir: lang === "ar" ? "rtl" : "ltr",
    forbiddenHtml: [...APARTMENT_HTML_KEY_LEAKS],
  }));
}

// Scope note:
// - This guard owns rendered static HTML leaks on high-value commercial routes.
// - Source-level locale coverage stays with test/content-readiness/i18n/commercial-routes-ssr-audit.test.ts.
const ROUTE_AUDITS: RouteAudit[] = [
  {
    route: "/it",
    expectedHtmlLang: "it",
    expectedHtmlDir: "ltr",
    forbiddenHtml: [
      "Enable dark mode",
      "Disable dark mode",
    ],
    forbiddenText: [
      "Direct booking perks available now. See deals",
      "A Beautiful Home Away From Home",
      "Direct booking perks • Best price guaranteed",
      "countReviews",
      "quickLinksSection.guides",
      "quickLinksSection.guidesHint",
      "Book direct →",
    ],
  },
  {
    route: "/it/prenota",
    expectedHtmlLang: "it",
    expectedHtmlDir: "ltr",
    forbiddenHtml: [
      "Enable dark mode",
      "Disable dark mode",
    ],
    forbiddenText: [
      "booking.checkInLabel",
      "booking.checkOutLabel",
      "booking.guestsLabel",
      "booking.buttonAvailability",
      "date.stayHelper",
      "date.clearDates",
      "Book direct with Octorate",
    ],
  },
  {
    route: "/ar",
    expectedHtmlLang: "ar",
    expectedHtmlDir: "rtl",
    forbiddenHtml: [
      "aria-label=\"Enable dark mode\"",
      "title=\"Switch to dark mode\"",
    ],
    forbiddenText: [
      "Home",
      "Rooms",
      "Apartment",
      "Experiences",
      "How to Get Here",
      "Deals",
      "Help",
      "Book direct",
      "Increase guests",
      "Decrease guests",
      "See all rooms",
      "Book private accommodations",
      "Mixed Ensuite Dorm",
    ],
  },
  {
    route: "/ar/tajarib",
    expectedHtmlLang: "ar",
    expectedHtmlDir: "rtl",
    forbiddenText: [
      "under two minutes",
      "Skip third-party fees and get priority help from our Positano team.",
      "View all experience guides",
      "#Beaches",
      "#Hiking",
      "#Day trips",
      "#Boat tours",
      "#Food & Drink",
    ],
  },
  {
    route: "/ja",
    expectedHtmlLang: "ja",
    expectedHtmlDir: "ltr",
    forbiddenHtml: [
      "aria-label=\"Enable dark mode\"",
      "title=\"Switch to dark mode\"",
    ],
    forbiddenText: [
      "Direct booking perks available now. See deals",
      "A Beautiful Home Away From Home",
      "Direct booking perks • Best price guaranteed",
      "countReviews",
      "View all experience guides",
    ],
  },
  {
    route: "/ja/yoyaku",
    expectedHtmlLang: "ja",
    expectedHtmlDir: "ltr",
    forbiddenText: [
      "booking.checkInLabel",
      "booking.checkOutLabel",
      "booking.guestsLabel",
      "booking.buttonAvailability",
      "date.stayHelper",
      "date.clearDates",
      "Book direct with Octorate",
    ],
  },
  ...buildApartmentRouteAudits(),
];

type Finding = {
  route: string;
  token: string;
  surface: "document" | "html" | "text";
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

function stripNonVisibleContent(html: string): string {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findLeaks(outDir: string): Finding[] {
  const findings: Finding[] = [];

  for (const audit of ROUTE_AUDITS) {
    const htmlPath = routeToHtmlFile(outDir, audit.route);
    const html = fs.readFileSync(htmlPath, "utf8");
    const visibleText = stripNonVisibleContent(html);

    if (audit.expectedHtmlLang) {
      const htmlTagMatch = html.match(/<html\b([^>]*)>/i);
      const langMatch = htmlTagMatch?.[1]?.match(/\blang="([^"]*)"/i);
      if (langMatch?.[1] !== audit.expectedHtmlLang) {
        findings.push({
          route: audit.route,
          token: `html lang=${audit.expectedHtmlLang}`,
          surface: "document",
        });
      }
    }

    if (audit.expectedHtmlDir) {
      const htmlTagMatch = html.match(/<html\b([^>]*)>/i);
      const dirMatch = htmlTagMatch?.[1]?.match(/\bdir="([^"]*)"/i);
      if (dirMatch?.[1] !== audit.expectedHtmlDir) {
        findings.push({
          route: audit.route,
          token: `html dir=${audit.expectedHtmlDir}`,
          surface: "document",
        });
      }
    }

    for (const token of audit.forbiddenHtml ?? []) {
      if (html.includes(token)) {
        findings.push({ route: audit.route, token, surface: "html" });
      }
    }

    for (const token of audit.forbiddenText ?? []) {
      if (visibleText.includes(token)) {
        findings.push({ route: audit.route, token, surface: "text" });
      }
    }
  }

  return findings;
}

async function main(): Promise<void> {
  const outDirArg = parseArgs(process.argv.slice(2));
  const appRoot = resolveAppRoot();
  const outDir = path.resolve(appRoot, outDirArg);

  if (!fs.existsSync(outDir)) {
    throw new Error(`Output directory does not exist: ${outDir}`);
  }

  const findings = findLeaks(outDir);

  if (findings.length > 0) {
    console.error(
      JSON.stringify(
        {
          outDir,
          routesAudited: ROUTE_AUDITS.map((audit) => audit.route),
          findings,
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
        routesAudited: ROUTE_AUDITS.map((audit) => audit.route),
        findings: 0,
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
