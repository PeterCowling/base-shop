#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { evaluateNoJsRoute } = require("./no-js-predicates.cjs");

const DEFAULTS = {
  reportDir: "docs/audits/user-testing",
  timeoutMs: 30000,
  maxPages: 6000,
  maxSitemaps: 160,
  concurrency: 8,
  includeQuery: true,
};

const HOME_KEY_PATTERN =
  /\b(?:heroSection|introSection|socialProof|locationSection)\.[a-z0-9_.-]+\b/gi;

function parseArgs(argv) {
  const args = {
    url: "",
    slug: "",
    reportDir: DEFAULTS.reportDir,
    timeoutMs: DEFAULTS.timeoutMs,
    maxPages: DEFAULTS.maxPages,
    maxSitemaps: DEFAULTS.maxSitemaps,
    concurrency: DEFAULTS.concurrency,
    includeQuery: DEFAULTS.includeQuery,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];

    if (token === "--url" && next) {
      args.url = next;
      i += 1;
      continue;
    }
    if (token === "--slug" && next) {
      args.slug = next;
      i += 1;
      continue;
    }
    if (token === "--report-dir" && next) {
      args.reportDir = next;
      i += 1;
      continue;
    }
    if (token === "--timeout-ms" && next) {
      args.timeoutMs = Number(next);
      i += 1;
      continue;
    }
    if (token === "--max-pages" && next) {
      args.maxPages = Number(next);
      i += 1;
      continue;
    }
    if (token === "--max-sitemaps" && next) {
      args.maxSitemaps = Number(next);
      i += 1;
      continue;
    }
    if (token === "--concurrency" && next) {
      args.concurrency = Number(next);
      i += 1;
      continue;
    }
    if (token === "--exclude-query") {
      args.includeQuery = false;
      continue;
    }
  }

  return args;
}

function usage() {
  return [
    "Usage:",
    "  node .claude/skills/meta-user-test/scripts/run-full-js-off-sitemap-crawl.mjs --url <https://example.com/en> [options]",
    "",
    "Options:",
    "  --slug <name>            Optional slug for output filenames",
    "  --report-dir <dir>       Output directory (default: docs/audits/user-testing)",
    "  --max-pages <n>          Cap total crawled URLs (default: 6000)",
    "  --max-sitemaps <n>       Cap fetched sitemap docs (default: 160)",
    "  --timeout-ms <n>         Request timeout per URL (default: 30000)",
    "  --concurrency <n>        Concurrent JS-off fetch workers (default: 8)",
    "  --exclude-query          Ignore query params when normalizing sitemap URLs",
  ].join("\n");
}

function sanitizeSlug(raw) {
  return String(raw || "")
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function formatDate(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function unique(values) {
  return [...new Set(values)];
}

function decodeXml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractLocValues(xml) {
  return unique(
    [...String(xml || "").matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)]
      .map((match) => decodeXml(match[1]))
      .filter(Boolean)
  );
}

function toAbsoluteUrl(raw, base) {
  try {
    return new URL(raw, base).toString();
  } catch {
    return "";
  }
}

function normalizeInternalPath(raw, origin, includeQuery) {
  try {
    const parsed = new URL(raw, origin);
    if (parsed.origin !== origin) return null;
    parsed.hash = "";
    if (!includeQuery) parsed.search = "";
    return `${parsed.pathname}${parsed.search}` || "/";
  } catch {
    return null;
  }
}

function htmlToText(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function readAttr(tag, attrName) {
  const pattern = new RegExp(
    `${attrName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    "i"
  );
  const match = String(tag || "").match(pattern);
  return match ? (match[1] || match[2] || match[3] || "").trim() : "";
}

function extractHeadSignals(html, routePath) {
  const tags = String(html || "").match(/<link\b[^>]*>/gi) || [];
  let canonicalHref = "";
  const hreflangValues = [];

  for (const tag of tags) {
    const rel = readAttr(tag, "rel")
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    if (rel.includes("canonical") && !canonicalHref) {
      canonicalHref = readAttr(tag, "href");
    }
    if (rel.includes("alternate")) {
      const hreflang = readAttr(tag, "hreflang").toLowerCase();
      if (hreflang) hreflangValues.push(hreflang);
    }
  }

  const langMatch = String(routePath || "")
    .toLowerCase()
    .match(/^\/([a-z]{2})(?:\/|$)/);
  const lang = langMatch ? langMatch[1] : "";
  const hasSelfHreflang =
    !lang ||
    hreflangValues.some(
      (value) => value === lang || value.startsWith(`${lang}-`)
    );

  return {
    canonicalHref,
    hreflangValues: unique(hreflangValues).slice(0, 20),
    hasCanonical: Boolean(canonicalHref),
    hasSelfHreflang,
  };
}

function routeTemplate(routePath) {
  const clean = String(routePath || "/")
    .split("?")[0]
    .replace(/\/+$/, "")
    .toLowerCase();
  const lang = clean.match(/^\/([a-z]{2})(?:\/|$)/)?.[1] || "";

  if (lang && clean === `/${lang}`) return "home";
  if (lang && clean === `/${lang}/rooms`) return "rooms";
  if (lang && /^\/[a-z]{2}\/rooms\/[^/]+$/.test(clean)) return "roomDetail";
  if (lang && clean === `/${lang}/experiences`) return "experiences";
  if (lang && clean === `/${lang}/how-to-get-here`) return "howToGetHere";
  if (lang && clean === `/${lang}/deals`) return "deals";
  return "other";
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "user-agent": "base-shop-meta-user-test/1.0" },
    });

    const headers = {};
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    const text = await response.text().catch(() => "");
    return {
      status: response.status,
      finalUrl: response.url,
      headers,
      text,
      error: "",
    };
  } catch (error) {
    return {
      status: "ERR",
      finalUrl: url,
      headers: {},
      text: "",
      error: String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function collectSitemapLocs(origin, timeoutMs, maxSitemaps) {
  const queue = [new URL("/sitemap.xml", origin).toString()];
  const visited = new Set();
  const pageLocs = new Set();
  const errors = [];

  while (queue.length > 0 && visited.size < maxSitemaps) {
    const sitemapUrl = queue.shift();
    if (!sitemapUrl || visited.has(sitemapUrl)) continue;
    visited.add(sitemapUrl);

    const response = await fetchWithTimeout(sitemapUrl, timeoutMs);
    if (response.status === "ERR" || response.status >= 400) {
      errors.push({
        sitemapUrl,
        status: response.status,
        error: response.error,
      });
      continue;
    }

    const xml = response.text;
    const locValues = extractLocValues(xml);

    if (/<sitemapindex\b/i.test(xml)) {
      for (const value of locValues) {
        const nextSitemap = toAbsoluteUrl(value, sitemapUrl);
        if (nextSitemap && !visited.has(nextSitemap)) queue.push(nextSitemap);
      }
      continue;
    }

    for (const value of locValues) pageLocs.add(value);
  }

  return {
    sitemapsVisited: [...visited],
    pageLocs: [...pageLocs],
    sitemapErrors: errors,
  };
}

function aggregateFindings(rows, preflight) {
  const issues = [];
  const keyRows = rows.filter((row) => row.template !== "other");
  const topNavFailures = keyRows.filter(
    (row) =>
      row.status === 200 &&
      (!row.noJs.hasMeaningfulH1 || !row.noJs.hasNoBailoutMarker)
  );
  if (topNavFailures.length > 0) {
    issues.push({
      id: "full-crawl-no-js-shell",
      priority: "P0",
      title: "Key routes fail no-JS shell checks",
      evidence: { count: topNavFailures.length, sample: topNavFailures.slice(0, 20) },
    });
  }

  const bookingLeakFailures = keyRows.filter(
    (row) =>
      row.status === 200 && row.noJs.hasNoBookingFunnelI18nLeak === false
  );
  if (bookingLeakFailures.length > 0) {
    issues.push({
      id: "full-crawl-booking-key-leak",
      priority: "P0",
      title: "Booking-funnel i18n key leakage in initial HTML",
      evidence: { count: bookingLeakFailures.length, sample: bookingLeakFailures.slice(0, 20) },
    });
  }

  const ctaFallbackFailures = keyRows.filter(
    (row) => row.status === 200 && row.noJs.hasBookingCtaFallback === false
  );
  if (ctaFallbackFailures.length > 0) {
    issues.push({
      id: "full-crawl-booking-cta-fallback",
      priority: "P0",
      title: "Booking CTA fallback missing in initial HTML",
      evidence: { count: ctaFallbackFailures.length, sample: ctaFallbackFailures.slice(0, 20) },
    });
  }

  const hreflangFailures = rows.filter(
    (row) =>
      row.status === 200 &&
      row.isHtml &&
      row.isLocalizedPath &&
      row.head.hasSelfHreflang === false
  );
  if (hreflangFailures.length > 0) {
    issues.push({
      id: "full-crawl-hreflang-self-missing",
      priority: "P1",
      title: "Localized pages missing self hreflang",
      evidence: { count: hreflangFailures.length, sample: hreflangFailures.slice(0, 30) },
    });
  }

  const canonicalMissing = rows.filter(
    (row) => row.status === 200 && row.isHtml && row.head.hasCanonical === false
  );
  if (canonicalMissing.length > 0) {
    issues.push({
      id: "full-crawl-canonical-missing",
      priority: "P1",
      title: "Canonical missing on HTML pages",
      evidence: { count: canonicalMissing.length, sample: canonicalMissing.slice(0, 30) },
    });
  }

  const failingStatus = rows.filter(
    (row) => row.status === "ERR" || row.status >= 400
  );
  if (failingStatus.length > 0) {
    issues.push({
      id: "full-crawl-http-failures",
      priority: "P1",
      title: "HTTP/network failures in sitemap URLs",
      evidence: { count: failingStatus.length, sample: failingStatus.slice(0, 30) },
    });
  }

  if (preflight.llms.status === "ERR" || preflight.llms.status >= 400) {
    issues.push({
      id: "full-crawl-llms-unavailable",
      priority: "P2",
      title: "llms.txt unavailable",
      evidence: { llms: preflight.llms },
    });
  }

  return issues;
}

function statusHistogram(rows) {
  const map = new Map();
  for (const row of rows) {
    const key = String(row.status);
    map.set(key, (map.get(key) || 0) + 1);
  }
  return [...map.entries()].sort((a, b) => Number(b[1]) - Number(a[1]));
}

function buildMarkdown(payload, output) {
  const findingsRows = payload.issues
    .map((issue) => `| ${issue.priority} | ${issue.id} | ${issue.title} |`)
    .join("\n");

  const detail = payload.issues
    .map((issue, idx) =>
      [
        `### ${idx + 1}. [${issue.priority}] ${issue.title}`,
        "",
        `**Issue ID:** \`${issue.id}\``,
        "",
        "```json",
        JSON.stringify(issue.evidence, null, 2),
        "```",
      ].join("\n")
    )
    .join("\n\n");

  const statusRows = statusHistogram(payload.rows)
    .map(([status, count]) => `| ${status} | ${count} |`)
    .join("\n");

  return [
    "---",
    "Type: Audit-Report",
    "Status: Draft",
    "Domain: User-Testing",
    `Target-URL: ${payload.targetUrl}`,
    `Created: ${payload.date}`,
    "Created-by: Claude (meta-user-test skill)",
    `Audit-Timestamp: ${payload.generatedAt}`,
    `Artifacts-JSON: ${output.jsonRelativePath}`,
    "---",
    "",
    `# Full JS-off Sitemap Crawl: ${payload.targetUrl}`,
    "",
    "## Coverage",
    `- Sitemaps visited: ${payload.sitemapsVisited.length}`,
    `- URLs discovered from sitemap: ${payload.urlsDiscovered}`,
    `- URLs crawled: ${payload.rows.length}`,
    `- HTML pages crawled: ${payload.rows.filter((row) => row.isHtml && row.status === 200).length}`,
    "",
    "## Preflight",
    `- robots.txt status: ${payload.preflight.robots.status}`,
    `- sitemap.xml status: ${payload.preflight.sitemap.status}`,
    `- llms.txt status: ${payload.preflight.llms.status}`,
    "",
    "## Status Histogram",
    "| Status | Count |",
    "|---|---:|",
    statusRows || "| - | 0 |",
    "",
    "## Findings Index",
    "| Priority | Issue ID | Title |",
    "|---|---|---|",
    findingsRows || "| - | - | No findings detected |",
    "",
    "## Detailed Findings",
    detail || "No issues detected.",
  ].join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.url) {
    console.error(usage());
    process.exitCode = 1;
    return;
  }

  const parsed = new URL(args.url);
  if (!Number.isFinite(args.maxPages) || args.maxPages <= 0) {
    throw new Error("--max-pages must be a positive number");
  }
  if (!Number.isFinite(args.maxSitemaps) || args.maxSitemaps <= 0) {
    throw new Error("--max-sitemaps must be a positive number");
  }
  if (!Number.isFinite(args.timeoutMs) || args.timeoutMs <= 0) {
    throw new Error("--timeout-ms must be a positive number");
  }
  if (!Number.isFinite(args.concurrency) || args.concurrency <= 0) {
    throw new Error("--concurrency must be a positive number");
  }

  const date = formatDate(new Date());
  const slug = sanitizeSlug(
    args.slug || `${parsed.hostname}${parsed.pathname}` || "site"
  );
  const reportBase = `${date}-${slug}-full-js-off-crawl`;
  const reportDir = args.reportDir;
  const jsonPath = path.join(reportDir, `${reportBase}.json`);
  const markdownPath = path.join(reportDir, `${reportBase}.md`);

  await fs.mkdir(reportDir, { recursive: true });

  const preflight = {
    robots: await fetchWithTimeout(
      new URL("/robots.txt", parsed.origin),
      args.timeoutMs
    ),
    sitemap: await fetchWithTimeout(
      new URL("/sitemap.xml", parsed.origin),
      args.timeoutMs
    ),
    llms: await fetchWithTimeout(
      new URL("/llms.txt", parsed.origin),
      args.timeoutMs
    ),
  };

  const sitemapData = await collectSitemapLocs(
    parsed.origin,
    args.timeoutMs,
    args.maxSitemaps
  );
  const discoveredPaths = unique(
    sitemapData.pageLocs
      .map((loc) => normalizeInternalPath(loc, parsed.origin, args.includeQuery))
      .filter(Boolean)
  );

  const startPath =
    normalizeInternalPath(
      `${parsed.pathname}${parsed.search}`,
      parsed.origin,
      args.includeQuery
    ) || "/";
  const targets = unique([startPath, ...discoveredPaths]).slice(0, args.maxPages);
  const rows = [];
  let cursor = 0;

  const worker = async () => {
    while (cursor < targets.length) {
      const idx = cursor;
      cursor += 1;
      const routePath = targets[idx];
      const targetUrl = new URL(routePath, parsed.origin).toString();
      const response = await fetchWithTimeout(targetUrl, args.timeoutMs);
      const contentType = response.headers["content-type"] || "";
      const isHtml =
        typeof response.status === "number" &&
        response.status < 400 &&
        /text\/html|application\/xhtml\+xml/i.test(contentType);
      const template = routeTemplate(routePath);
      const routeKey = template === "other" ? "other" : template;
      const routeCheck = isHtml
        ? evaluateNoJsRoute({
            routeKey,
            routePath,
            status: response.status,
            html: response.text,
          })
        : null;
      const head = isHtml
        ? extractHeadSignals(response.text, routePath)
        : {
            canonicalHref: "",
            hreflangValues: [],
            hasCanonical: false,
            hasSelfHreflang: true,
          };
      const bodyText = isHtml ? htmlToText(response.text) : "";

      rows.push({
        routePath,
        targetUrl,
        finalUrl: response.finalUrl,
        status: response.status,
        error: response.error,
        contentType,
        xRobotsTag: response.headers["x-robots-tag"] || "",
        isHtml,
        isLocalizedPath: /^\/[a-z]{2}(?:\/|$)/i.test(routePath),
        template,
        noJs: {
          hasMeaningfulH1: routeCheck?.checks?.hasMeaningfulH1 ?? null,
          hasNoBailoutMarker: routeCheck?.checks?.hasNoBailoutMarker ?? null,
          hasNoBookingFunnelI18nLeak:
            routeCheck?.checks?.hasNoBookingFunnelI18nLeak ?? null,
          hasBookingCtaFallback:
            routeCheck?.checks?.hasBookingCtaFallback ?? null,
          hasVisibleBookingCtaLabel:
            routeCheck?.checks?.hasVisibleBookingCtaLabel ?? null,
        },
        samples: {
          homeI18nKeys:
            template === "home"
              ? unique((bodyText.match(HOME_KEY_PATTERN) || []).slice(0, 8))
              : [],
          bookingI18nKeys:
            routeCheck?.bookingFunnelI18nKeyLeakSamples?.slice(0, 8) || [],
        },
        head,
      });
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(args.concurrency, targets.length) }, worker)
  );
  rows.sort((a, b) => a.routePath.localeCompare(b.routePath));

  const payload = {
    generatedAt: new Date().toISOString(),
    date,
    targetUrl: args.url,
    origin: parsed.origin,
    urlsDiscovered: discoveredPaths.length,
    sitemapsVisited: sitemapData.sitemapsVisited,
    sitemapErrors: sitemapData.sitemapErrors,
    preflight,
    rows,
  };

  payload.issues = aggregateFindings(rows, preflight);

  await fs.writeFile(jsonPath, JSON.stringify(payload, null, 2), "utf8");
  await fs.writeFile(
    markdownPath,
    buildMarkdown(payload, {
      jsonRelativePath: path.relative(process.cwd(), jsonPath),
    }),
    "utf8"
  );

  console.log("Full JS-off crawl complete.");
  console.log(`- Markdown report: ${path.relative(process.cwd(), markdownPath)}`);
  console.log(`- JSON artifact:   ${path.relative(process.cwd(), jsonPath)}`);
  console.log(`- Issues found:    ${payload.issues.length}`);
  for (const issue of payload.issues) {
    console.log(`  - [${issue.priority}] ${issue.id}: ${issue.title}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
