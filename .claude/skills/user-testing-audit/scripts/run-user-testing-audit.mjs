#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium, devices } from "playwright";
import axeCore from "axe-core";

const DEFAULTS = {
  maxCrawlPages: 80,
  maxAuditPages: 24,
  maxMobilePages: 14,
  screenshotsPerViewport: 8,
  timeoutMs: 90000,
  reportDir: "docs/audits/user-testing",
};

const KEYWORD_PATH_HINTS = [
  "room",
  "deal",
  "offer",
  "help",
  "support",
  "faq",
  "experience",
  "contact",
  "how-to",
  "directions",
  "terms",
  "privacy",
  "cookie",
  "policy",
  "booking",
  "checkout",
];

function parseArgs(argv) {
  const args = {
    url: "",
    slug: "",
    reportDir: DEFAULTS.reportDir,
    maxCrawlPages: DEFAULTS.maxCrawlPages,
    maxAuditPages: DEFAULTS.maxAuditPages,
    maxMobilePages: DEFAULTS.maxMobilePages,
    screenshotsPerViewport: DEFAULTS.screenshotsPerViewport,
    timeoutMs: DEFAULTS.timeoutMs,
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
    if (token === "--max-crawl-pages" && next) {
      args.maxCrawlPages = Number(next);
      i += 1;
      continue;
    }
    if (token === "--max-audit-pages" && next) {
      args.maxAuditPages = Number(next);
      i += 1;
      continue;
    }
    if (token === "--max-mobile-pages" && next) {
      args.maxMobilePages = Number(next);
      i += 1;
      continue;
    }
    if (token === "--screenshots-per-viewport" && next) {
      args.screenshotsPerViewport = Number(next);
      i += 1;
      continue;
    }
    if (token === "--timeout-ms" && next) {
      args.timeoutMs = Number(next);
      i += 1;
      continue;
    }
  }

  return args;
}

function usage() {
  return [
    "Usage:",
    "  node .claude/skills/user-testing-audit/scripts/run-user-testing-audit.mjs --url <https://example.com/path> [options]",
    "",
    "Options:",
    "  --slug <name>                       Optional slug for output filenames",
    "  --report-dir <dir>                  Report output directory (default: docs/audits/user-testing)",
    "  --max-crawl-pages <n>               Max pages to discover (default: 80)",
    "  --max-audit-pages <n>               Max desktop pages to audit (default: 24)",
    "  --max-mobile-pages <n>              Max mobile pages to audit (default: 14)",
    "  --screenshots-per-viewport <n>      How many pages get screenshots per viewport (default: 8)",
    "  --timeout-ms <n>                    Navigation timeout (default: 90000)",
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

function normalizeInternalPath(href, origin) {
  try {
    if (!href) return null;
    if (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) {
      return null;
    }

    const parsed = new URL(href, origin);
    if (parsed.origin !== origin) return null;
    parsed.hash = "";

    const normalized = `${parsed.pathname}${parsed.search}`;
    return normalized || "/";
  } catch {
    return null;
  }
}

function unique(values) {
  return [...new Set(values)];
}

function extractImageUrlsFromHtml(html, origin) {
  const matches = html.match(
    /(?:https?:\/\/[^\s"'<>]+\/img\/[^\s"'<>]+\.(?:png|jpe?g|webp|gif|svg|avif)|\/img\/[^\s"'<>]+\.(?:png|jpe?g|webp|gif|svg|avif))/gi,
  );
  if (!matches) return [];

  const normalized = [];
  for (const value of matches) {
    try {
      const parsed = new URL(value, origin);
      if (parsed.origin !== origin) continue;
      parsed.hash = "";
      normalized.push(parsed.toString());
    } catch {
      // ignore malformed URL candidates
    }
  }

  return unique(normalized);
}

function pathDepth(value) {
  return value.split("/").filter(Boolean).length;
}

function selectAuditPaths(startPath, discovered, limit) {
  const normalized = unique(discovered);
  const withoutStart = normalized.filter((item) => item !== startPath);
  const keywordMatches = withoutStart.filter((item) => {
    const lower = item.toLowerCase();
    return KEYWORD_PATH_HINTS.some((hint) => lower.includes(hint));
  });

  const shallow = withoutStart
    .slice()
    .sort((a, b) => {
      const depthDelta = pathDepth(a) - pathDepth(b);
      if (depthDelta !== 0) return depthDelta;
      return a.localeCompare(b);
    })
    .slice(0, 40);

  const ordered = unique([startPath, ...keywordMatches, ...shallow, ...withoutStart]);
  return ordered.slice(0, limit);
}

function isTruthyNumber(value) {
  return Number.isFinite(value) && value >= 0;
}

async function crawlInternalPaths(context, origin, startPath, options) {
  const discovered = new Set([startPath]);
  const visited = new Set();
  const queue = [startPath];
  const pageLinks = {};
  const crawlErrors = [];

  const page = await context.newPage();

  while (queue.length > 0 && visited.size < options.maxCrawlPages) {
    const currentPath = queue.shift();
    if (!currentPath || visited.has(currentPath)) continue;

    visited.add(currentPath);

    try {
      await page.goto(`${origin}${currentPath}`, {
        waitUntil: "domcontentloaded",
        timeout: options.timeoutMs,
      });
      await page.waitForTimeout(1600);

      const hrefs = await page.$$eval("a[href]", (anchors) =>
        anchors.map((anchor) => anchor.getAttribute("href") || "").filter(Boolean),
      );

      const normalized = unique(hrefs.map((href) => normalizeInternalPath(href, origin)).filter(Boolean));

      pageLinks[currentPath] = normalized;

      for (const candidate of normalized) {
        if (!discovered.has(candidate)) discovered.add(candidate);
        if (!visited.has(candidate) && !queue.includes(candidate)) queue.push(candidate);
      }
    } catch (error) {
      crawlErrors.push({
        page: currentPath,
        error: String(error),
      });
    }
  }

  await page.close();

  return {
    discoveredPaths: [...discovered],
    visitedPaths: [...visited],
    pageLinks,
    crawlErrors,
  };
}

async function checkInternalPaths(context, origin, paths) {
  const results = [];

  for (const pagePath of paths) {
    try {
      const response = await context.request.get(`${origin}${pagePath}`, {
        timeout: 30000,
      });
      results.push({
        page: pagePath,
        status: response.status(),
      });
    } catch (error) {
      results.push({
        page: pagePath,
        status: "ERR",
        error: String(error),
      });
    }
  }

  return results;
}

async function sweepImageAssets(context, origin, paths) {
  const assetToPages = new Map();
  const pageFetchErrors = [];

  for (const pagePath of paths) {
    try {
      const response = await context.request.get(`${origin}${pagePath}`, {
        timeout: 30000,
      });
      if (response.status() >= 400) continue;

      const html = await response.text();
      const imageUrls = extractImageUrlsFromHtml(html, origin);

      for (const imageUrl of imageUrls) {
        if (!assetToPages.has(imageUrl)) assetToPages.set(imageUrl, new Set());
        assetToPages.get(imageUrl).add(pagePath);
      }
    } catch (error) {
      pageFetchErrors.push({
        page: pagePath,
        error: String(error),
      });
    }
  }

  const imageChecks = [];
  for (const imageUrl of assetToPages.keys()) {
    try {
      const response = await context.request.get(imageUrl, {
        timeout: 30000,
      });
      imageChecks.push({
        imageUrl,
        status: response.status(),
        pages: [...assetToPages.get(imageUrl)],
      });
    } catch (error) {
      imageChecks.push({
        imageUrl,
        status: "ERR",
        error: String(error),
        pages: [...assetToPages.get(imageUrl)],
      });
    }
  }

  return {
    checkedImageCount: imageChecks.length,
    pageFetchErrors,
    brokenImages: imageChecks
      .filter((item) => item.status === "ERR" || (typeof item.status === "number" && item.status >= 400))
      .sort((a, b) => {
        const aStatus = a.status === "ERR" ? 999 : a.status;
        const bStatus = b.status === "ERR" ? 999 : b.status;
        return bStatus - aStatus;
      }),
  };
}

async function runAxe(page) {
  await page.addScriptTag({ content: axeCore.source });
  return page.evaluate(async () => {
    const run = await window.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
      resultTypes: ["violations"],
    });

    return run.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      description: violation.description,
      nodeCount: violation.nodes.length,
      nodes: violation.nodes.slice(0, 4).map((node) => ({
        target: node.target,
        failureSummary: node.failureSummary,
      })),
    }));
  });
}

async function auditPage(context, origin, pagePath, viewportLabel, screenshotPath, options) {
  const page = await context.newPage();
  const consoleErrors = [];
  const badResponses = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  page.on("response", (response) => {
    const status = response.status();
    if (status < 400) return;

    let pathname = "";
    try {
      pathname = new URL(response.url()).pathname;
    } catch {
      pathname = response.url();
    }

    badResponses.push({
      status,
      url: response.url(),
      path: pathname,
      method: response.request().method(),
      resourceType: response.request().resourceType(),
    });
  });

  let navStatus = null;
  let navError = null;

  try {
    const response = await page.goto(`${origin}${pagePath}`, {
      waitUntil: "domcontentloaded",
      timeout: options.timeoutMs,
    });
    navStatus = response ? response.status() : null;
    await page.waitForTimeout(1500);
  } catch (error) {
    navError = String(error);
  }

  let dom = null;
  let axeViolations = [];

  if (!navError) {
    dom = await page.evaluate(() => {
      const isVisible = (element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          style.opacity !== "0"
        );
      };

      const root = document.documentElement;
      const body = document.body;

      const images = [...document.querySelectorAll("img")].map((image) => ({
        src: image.currentSrc || image.getAttribute("src") || "",
        alt: image.getAttribute("alt"),
        complete: image.complete,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
      }));

      const brokenImages = images.filter((image) => image.complete && image.naturalWidth === 0);
      const missingAltImages = images.filter((image) => image.alt === null);

      const clickables = [...document.querySelectorAll("a[href], button, [role=button], input, select, textarea")]
        .filter((element) => isVisible(element))
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            tag: element.tagName,
            text: (element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 80),
            ariaLabel: element.getAttribute("aria-label"),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          };
        });

      const tinyTargets24 = clickables.filter((item) => item.width < 24 || item.height < 24);
      const tinyTargets44 = clickables.filter((item) => item.width < 44 || item.height < 44);

      const textBody = document.body ? document.body.innerText : "";
      const i18nKeySamples = [
        ...new Set((textBody.match(/\b[a-z]+(?:\.[a-z0-9_]+){2,}\b/gi) || []).slice(0, 20)),
      ];

      const mobileMenu = (() => {
        const toggle = document.querySelector("button[aria-label*=menu i]");
        const panel =
          document.querySelector("[data-testid*=mobile-menu i]") ||
          document.querySelector("[id*=mobile-menu i]") ||
          document.querySelector(".mobile-menu");

        if (!panel) return null;

        const style = getComputedStyle(panel);
        const linksVisible = [...panel.querySelectorAll("a[href]")].filter((anchor) => isVisible(anchor)).length;
        const panelClass = String(panel.className || "");
        const likelyClosedClass = /translate-y-full|hidden|opacity-0/.test(panelClass);
        const panelVisible = style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
        const hasLeak = Boolean(panelVisible && likelyClosedClass && linksVisible > 0 && style.transform === "none");

        return {
          hasLeak,
          linksVisible,
          panelClass,
          panelTransform: style.transform,
          panelDisplay: style.display,
          panelVisibility: style.visibility,
          toggleExpanded: toggle ? toggle.getAttribute("aria-expanded") : null,
        };
      })();

      return {
        title: document.title,
        htmlLang: root.getAttribute("lang"),
        h1: [...document.querySelectorAll("h1")].map((node) => (node.textContent || "").trim()).filter(Boolean),
        imageCount: images.length,
        brokenImageCount: brokenImages.length,
        brokenImageSamples: brokenImages.slice(0, 8),
        missingAltImageCount: missingAltImages.length,
        missingAltImageSamples: missingAltImages.slice(0, 8),
        clickablesCount: clickables.length,
        tinyTapTargets24: tinyTargets24.length,
        tinyTapTargets44: tinyTargets44.length,
        tinyTapTargets44Samples: tinyTargets44.slice(0, 10),
        hasHorizontalOverflow: root.scrollWidth > root.clientWidth,
        scrollWidth: root.scrollWidth,
        clientWidth: root.clientWidth,
        bodyScrollWidth: body ? body.scrollWidth : null,
        i18nKeySamples,
        mobileMenu,
      };
    });

    axeViolations = await runAxe(page);

    if (screenshotPath) {
      await page.screenshot({ path: screenshotPath, fullPage: true });
    }
  }

  await page.close();

  return {
    page: pagePath,
    viewport: viewportLabel,
    navStatus,
    navError,
    dom,
    consoleErrors,
    badResponses,
    axeViolations,
  };
}

function aggregateFindings(payload) {
  const allResults = [...payload.desktopResults, ...payload.mobileResults];
  const issueList = [];

  const brokenInternal = payload.linkChecks.filter((item) => typeof item.status === "number" && item.status >= 400);
  if (brokenInternal.length > 0) {
    issueList.push({
      id: "broken-internal-routes",
      priority: "P0",
      title: "Internal routes return 4xx/5xx",
      evidence: {
        brokenCount: brokenInternal.length,
        samples: brokenInternal.slice(0, 12),
      },
      acceptanceCriteria: [
        "Every internal navigation route linked from the audited pages returns HTTP 200 (or expected redirect).",
        "No help/support/article link in the audited navigation returns 404.",
        "Automated link check passes for audited internal routes.",
      ],
    });
  }

  const i18nLeaks = allResults
    .filter((result) => result.dom && result.dom.i18nKeySamples && result.dom.i18nKeySamples.length > 0)
    .map((result) => ({
      page: result.page,
      viewport: result.viewport,
      samples: result.dom.i18nKeySamples.slice(0, 5),
    }));

  if (i18nLeaks.length > 0) {
    issueList.push({
      id: "untranslated-i18n-keys",
      priority: "P0",
      title: "Raw i18n keys leak into user-visible UI",
      evidence: {
        pageCount: unique(i18nLeaks.map((item) => item.page)).length,
        samples: i18nLeaks.slice(0, 12),
      },
      acceptanceCriteria: [
        "All user-facing labels, headings, and descriptions resolve to localized strings.",
        "No `namespace.key.path` patterns appear in rendered UI text on audited pages.",
        "Both desktop and mobile snapshots for affected pages show translated content only.",
      ],
    });
  }

  const brokenImagesFromViewportAudits = allResults
    .filter((result) => {
      const domBroken = result.dom ? result.dom.brokenImageCount > 0 : false;
      const networkBroken = result.badResponses.some(
        (response) => response.resourceType === "image" && response.status >= 400,
      );
      return domBroken || networkBroken;
    })
    .map((result) => ({
      page: result.page,
      viewport: result.viewport,
      brokenImageCount: result.dom ? result.dom.brokenImageCount : 0,
      brokenImageResponseCount: result.badResponses.filter(
        (response) => response.resourceType === "image" && response.status >= 400,
      ).length,
    }));

  const brokenImagesFromAssetSweep = payload.imageSweep ? payload.imageSweep.brokenImages : [];
  const totalBrokenImageSignals = brokenImagesFromViewportAudits.length + brokenImagesFromAssetSweep.length;
  if (totalBrokenImageSignals > 0) {
    const brokenPages = unique([
      ...brokenImagesFromViewportAudits.map((item) => item.page),
      ...brokenImagesFromAssetSweep.flatMap((item) => item.pages || []),
    ]);

    issueList.push({
      id: "broken-images",
      priority: brokenImagesFromAssetSweep.length >= 5 ? "P0" : "P1",
      title: "Image assets fail to render",
      evidence: {
        pageCount: brokenPages.length,
        viewportAuditSamples: brokenImagesFromViewportAudits.slice(0, 12),
        assetSweepBrokenCount: brokenImagesFromAssetSweep.length,
        assetSweepSamples: brokenImagesFromAssetSweep.slice(0, 12),
      },
      acceptanceCriteria: [
        "No `img` elements decode to `naturalWidth=0` on audited pages.",
        "No image requests return 4xx/5xx for audited pages and viewports.",
        "Sitewide HTML image-asset sweep reports 0 broken `/img/...` references.",
        "Lazy-loaded images render successfully after full-page scroll.",
      ],
    });
  }

  const colorContrast = allResults
    .map((result) => {
      const violation = result.axeViolations.find((item) => item.id === "color-contrast");
      if (!violation) return null;
      return {
        page: result.page,
        viewport: result.viewport,
        nodeCount: violation.nodeCount,
        help: violation.help,
      };
    })
    .filter(Boolean);

  if (colorContrast.length > 0) {
    issueList.push({
      id: "color-contrast",
      priority: "P1",
      title: "WCAG color contrast failures",
      evidence: {
        pageCount: unique(colorContrast.map((item) => item.page)).length,
        sampleViolations: colorContrast.slice(0, 12),
      },
      acceptanceCriteria: [
        "Text contrast meets WCAG AA thresholds (4.5:1 for normal text, 3:1 for large text).",
        "Axe `color-contrast` reports 0 violations on homepage and key landing pages.",
        "Updated palette passes both desktop and mobile checks.",
      ],
    });
  }

  const mobileMenuLeaks = payload.mobileResults
    .filter((result) => result.dom && result.dom.mobileMenu && result.dom.mobileMenu.hasLeak)
    .map((result) => ({
      page: result.page,
      leak: result.dom.mobileMenu,
    }));

  if (mobileMenuLeaks.length > 0) {
    issueList.push({
      id: "mobile-menu-state-leak",
      priority: "P1",
      title: "Mobile menu appears/focuses when marked closed",
      evidence: {
        pageCount: unique(mobileMenuLeaks.map((item) => item.page)).length,
        samples: mobileMenuLeaks.slice(0, 12),
      },
      acceptanceCriteria: [
        "When menu toggle is closed (`aria-expanded=false`), menu links are not visible or focusable.",
        "Closed-state menu panel has an effective offscreen/hidden transform in computed styles.",
        "Keyboard tab order skips mobile nav links until menu is explicitly opened.",
      ],
    });
  }

  const progressbarName = allResults
    .map((result) => {
      const violation = result.axeViolations.find((item) => item.id === "aria-progressbar-name");
      if (!violation) return null;
      return {
        page: result.page,
        viewport: result.viewport,
        nodeCount: violation.nodeCount,
      };
    })
    .filter(Boolean);

  if (progressbarName.length > 0) {
    issueList.push({
      id: "aria-progressbar-name",
      priority: "P2",
      title: "Progressbar ARIA name missing",
      evidence: {
        pageCount: unique(progressbarName.map((item) => item.page)).length,
        samples: progressbarName.slice(0, 12),
      },
      acceptanceCriteria: [
        "Every `role=progressbar` element has a valid accessible name (`aria-label` or `aria-labelledby`).",
        "Axe `aria-progressbar-name` reports 0 violations on audited pages.",
      ],
    });
  }

  const fetch404s = allResults.flatMap((result) =>
    result.badResponses
      .filter((response) => {
        if (response.resourceType === "document" || response.resourceType === "image") return false;
        return response.status >= 400;
      })
      .map((response) => ({
        page: result.page,
        viewport: result.viewport,
        status: response.status,
        path: response.path,
      })),
  );

  const fetchGroups = {};
  for (const item of fetch404s) {
    const key = `${item.status} ${item.path}`;
    if (!fetchGroups[key]) fetchGroups[key] = { count: 0, pages: new Set() };
    fetchGroups[key].count += 1;
    fetchGroups[key].pages.add(item.page);
  }

  const recurringFetchNoise = Object.entries(fetchGroups)
    .map(([signature, details]) => ({
      signature,
      count: details.count,
      pageCount: details.pages.size,
    }))
    .filter((item) => item.count >= 3)
    .sort((a, b) => b.count - a.count);

  if (recurringFetchNoise.length > 0) {
    issueList.push({
      id: "recurring-network-404-noise",
      priority: "P2",
      title: "Recurring 4xx fetch/XHR errors in console",
      evidence: {
        patternCount: recurringFetchNoise.length,
        samples: recurringFetchNoise.slice(0, 12),
      },
      acceptanceCriteria: [
        "No recurring 4xx fetch/XHR errors appear during page load of audited routes.",
        "Browser console is free from deterministic missing-resource noise in normal navigation.",
      ],
    });
  }

  const tinyTapPages = allResults
    .filter((result) => result.dom && isTruthyNumber(result.dom.tinyTapTargets44) && result.dom.tinyTapTargets44 >= 10)
    .map((result) => ({
      page: result.page,
      viewport: result.viewport,
      tinyTapTargets44: result.dom.tinyTapTargets44,
    }));

  if (tinyTapPages.length > 0) {
    issueList.push({
      id: "touch-target-size",
      priority: "P2",
      title: "Touch targets below recommended size",
      evidence: {
        pageCount: unique(tinyTapPages.map((item) => item.page)).length,
        samples: tinyTapPages.slice(0, 12),
      },
      acceptanceCriteria: [
        "Interactive touch targets meet at least 44x44 CSS pixels on mobile-critical controls.",
        "Lighthouse/Axe touch target checks pass for key conversion flows.",
      ],
    });
  }

  const horizontalOverflow = allResults
    .filter((result) => result.dom && result.dom.hasHorizontalOverflow)
    .map((result) => ({
      page: result.page,
      viewport: result.viewport,
      scrollWidth: result.dom.scrollWidth,
      clientWidth: result.dom.clientWidth,
    }));

  if (horizontalOverflow.length > 0) {
    issueList.push({
      id: "horizontal-overflow",
      priority: "P2",
      title: "Horizontal overflow detected",
      evidence: {
        pageCount: unique(horizontalOverflow.map((item) => item.page)).length,
        samples: horizontalOverflow.slice(0, 10),
      },
      acceptanceCriteria: [
        "No audited page allows unintended horizontal scrolling at target mobile widths.",
        "Decorative/offscreen effects are clipped without widening document scroll width.",
      ],
    });
  }

  return issueList;
}

function reportHeader(frontmatter) {
  return `---\n${frontmatter.join("\n")}\n---\n`;
}

function formatEvidence(evidence) {
  return JSON.stringify(evidence, null, 2);
}

function buildMarkdownReport(payload, issues, output) {
  const priorityBuckets = { P0: [], P1: [], P2: [] };
  for (const issue of issues) {
    if (!priorityBuckets[issue.priority]) priorityBuckets[issue.priority] = [];
    priorityBuckets[issue.priority].push(issue.id);
  }

  const summaryTableRows = issues
    .map((issue) => `| ${issue.priority} | ${issue.id} | ${issue.title} |`)
    .join("\n");

  const findings = issues
    .map((issue, index) => {
      const acceptance = issue.acceptanceCriteria.map((criterion) => `- [ ] ${criterion}`).join("\n");
      return [
        `### ${index + 1}. [${issue.priority}] ${issue.title}`,
        "",
        `**Issue ID:** \`${issue.id}\``,
        "",
        "**Evidence**",
        "```json",
        formatEvidence(issue.evidence),
        "```",
        "",
        "**Acceptance Criteria**",
        acceptance,
      ].join("\n");
    })
    .join("\n\n");

  const frontmatter = [
    "Type: Audit-Report",
    "Status: Draft",
    "Domain: User-Testing",
    `Target-URL: ${payload.targetUrl}`,
    `Created: ${payload.date}`,
    "Created-by: Claude (user-testing-audit skill)",
    `Audit-Timestamp: ${payload.generatedAt}`,
    `Artifacts-JSON: ${output.jsonRelativePath}`,
    `Artifacts-Screenshots: ${output.screenshotsRelativeDir}`,
  ];

  return [
    reportHeader(frontmatter),
    `# User Testing Audit: ${payload.targetUrl}`,
    "",
    "## Coverage",
    `- Discovered internal paths: ${payload.crawl.discoveredPaths.length}`,
    `- Audited desktop pages: ${payload.desktopResults.length}`,
    `- Audited mobile pages: ${payload.mobileResults.length}`,
    `- Link checks run: ${payload.linkChecks.length}`,
    "",
    "## Priority Summary",
    `- P0 issues: ${priorityBuckets.P0.length}`,
    `- P1 issues: ${priorityBuckets.P1.length}`,
    `- P2 issues: ${priorityBuckets.P2.length}`,
    "",
    "## Findings Index",
    "| Priority | Issue ID | Title |",
    "|---|---|---|",
    summaryTableRows || "| - | - | No findings detected |",
    "",
    "## Detailed Findings",
    findings || "No issues were detected by the automated checks in this run.",
    "",
    "## Notes",
    "- Automated checks are deterministic but not a complete replacement for human exploratory testing.",
    "- Re-run this audit after fixes to confirm regressions are resolved.",
  ].join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.url) {
    console.error(usage());
    process.exitCode = 1;
    return;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(args.url);
  } catch (error) {
    console.error(`Invalid URL: ${args.url}`);
    process.exitCode = 1;
    return;
  }

  if (!Number.isFinite(args.maxCrawlPages) || args.maxCrawlPages <= 0) {
    throw new Error("--max-crawl-pages must be a positive number");
  }
  if (!Number.isFinite(args.maxAuditPages) || args.maxAuditPages <= 0) {
    throw new Error("--max-audit-pages must be a positive number");
  }
  if (!Number.isFinite(args.maxMobilePages) || args.maxMobilePages <= 0) {
    throw new Error("--max-mobile-pages must be a positive number");
  }

  const date = formatDate(new Date());
  const slug = sanitizeSlug(args.slug || `${parsedUrl.hostname}${parsedUrl.pathname}` || "site-audit");

  const startPath = `${parsedUrl.pathname || "/"}${parsedUrl.search || ""}`;
  const reportDir = args.reportDir;
  const reportBase = `${date}-${slug || "site-audit"}`;
  const jsonPath = path.join(reportDir, `${reportBase}.json`);
  const markdownPath = path.join(reportDir, `${reportBase}.md`);
  const screenshotDir = path.join(reportDir, `${reportBase}-screenshots`);

  await fs.mkdir(reportDir, { recursive: true });
  await fs.mkdir(screenshotDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  try {
    const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });

    const crawl = await crawlInternalPaths(desktopContext, parsedUrl.origin, startPath, args);
    const selectedDesktopPaths = selectAuditPaths(startPath, crawl.discoveredPaths, args.maxAuditPages);

    const desktopResults = [];
    for (let index = 0; index < selectedDesktopPaths.length; index += 1) {
      const pagePath = selectedDesktopPaths[index];
      const screenshotPath =
        index < args.screenshotsPerViewport
          ? path.join(screenshotDir, `desktop-${String(index + 1).padStart(2, "0")}-${sanitizeSlug(pagePath) || "root"}.png`)
          : "";

      desktopResults.push(
        await auditPage(desktopContext, parsedUrl.origin, pagePath, "desktop", screenshotPath, args),
      );
    }

    const linkChecks = await checkInternalPaths(desktopContext, parsedUrl.origin, crawl.discoveredPaths.slice(0, 260));
    const imageSweep = await sweepImageAssets(
      desktopContext,
      parsedUrl.origin,
      crawl.discoveredPaths,
    );
    await desktopContext.close();

    const selectedMobilePaths = selectedDesktopPaths.slice(0, Math.min(args.maxMobilePages, selectedDesktopPaths.length));
    const mobileContext = await browser.newContext({ ...devices["iPhone 13"] });
    const mobileResults = [];

    for (let index = 0; index < selectedMobilePaths.length; index += 1) {
      const pagePath = selectedMobilePaths[index];
      const screenshotPath =
        index < args.screenshotsPerViewport
          ? path.join(screenshotDir, `mobile-${String(index + 1).padStart(2, "0")}-${sanitizeSlug(pagePath) || "root"}.png`)
          : "";

      mobileResults.push(
        await auditPage(mobileContext, parsedUrl.origin, pagePath, "mobile", screenshotPath, args),
      );
    }

    await mobileContext.close();

    const payload = {
      generatedAt: new Date().toISOString(),
      date,
      targetUrl: args.url,
      origin: parsedUrl.origin,
      startPath,
      crawl,
      selectedDesktopPaths,
      selectedMobilePaths,
      linkChecks,
      imageSweep,
      desktopResults,
      mobileResults,
    };

    const issues = aggregateFindings(payload);

    await fs.writeFile(jsonPath, JSON.stringify({ ...payload, issues }, null, 2), "utf8");

    const markdown = buildMarkdownReport(payload, issues, {
      jsonRelativePath: path.relative(process.cwd(), jsonPath),
      screenshotsRelativeDir: path.relative(process.cwd(), screenshotDir),
    });

    await fs.writeFile(markdownPath, markdown, "utf8");

    console.log(`Audit complete.`);
    console.log(`- Markdown report: ${path.relative(process.cwd(), markdownPath)}`);
    console.log(`- JSON artifact:   ${path.relative(process.cwd(), jsonPath)}`);
    console.log(`- Screenshots:     ${path.relative(process.cwd(), screenshotDir)}`);
    console.log(`- Issues found:    ${issues.length}`);
    for (const issue of issues) {
      console.log(`  - [${issue.priority}] ${issue.id}: ${issue.title}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
