#!/usr/bin/env node

import process from "node:process";

import { chromium, devices } from "playwright";

const DESKTOP_VIEWPORT = { width: 1440, height: 900 };
const MOBILE_DEVICE = devices["iPhone 13"];

const DEFAULT_BASE_URL = "http://127.0.0.1:3012";
const ROUTES = ["/en/help", "/en/rooms"];

function normalizeBaseUrl(value) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function isIgnorableResource(pathname) {
  return pathname.startsWith("/_next/") || pathname === "/favicon.ico";
}

async function runAuditPage(page, context) {
  const { baseUrl, route, viewportLabel, failures, shouldValidateMobileMenu } = context;
  const tag = `[${viewportLabel} ${route}]`;
  const consoleErrors = [];
  const pageErrors = [];
  const networkErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  page.on("response", (response) => {
    const status = response.status();
    if (status < 400) return;

    const resourceType = response.request().resourceType();
    const responseUrl = response.url();

    try {
      const parsed = new URL(responseUrl);
      const base = new URL(baseUrl);
      if (parsed.origin !== base.origin) return;

      const pathWithSearch = `${parsed.pathname}${parsed.search}`;
      if (isIgnorableResource(parsed.pathname)) return;

      networkErrors.push({
        status,
        resourceType,
        path: pathWithSearch,
      });
    } catch {
      // Ignore malformed URLs from browser internals.
    }
  });

  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(900);

  const guideLinkCount = await page.locator('a[href^="/en/help/"],a[href^="/en/assistance/"]').count();
  if (route === "/en/help" && guideLinkCount === 0) {
    failures.push(`${tag} expected at least one help/assistance guide link, found none.`);
  }

  await page.evaluate(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" });
  });
  await page.waitForTimeout(500);

  const brokenImageCandidates = await page.evaluate(() => {
    return Array.from(document.images)
      .filter((img) => img.complete && img.naturalWidth === 0)
      .map((img) => img.currentSrc || img.src)
      .filter(Boolean)
      .slice(0, 20);
  });

  if (brokenImageCandidates.length > 0) {
    failures.push(`${tag} detected broken image render(s): ${brokenImageCandidates.join(", ")}`);
  }

  const helpTxtErrors = networkErrors.filter((entry) => entry.path.includes("/en/help.txt"));
  if (helpTxtErrors.length > 0) {
    failures.push(`${tag} detected /en/help.txt network errors: ${JSON.stringify(helpTxtErrors)}`);
  }

  const significantNetworkErrors = networkErrors.filter((entry) => {
    if (entry.path.includes("/en/help.txt")) return true;
    if (entry.resourceType === "document" || entry.resourceType === "image") return true;
    if (entry.path.startsWith("/img/")) return true;
    return false;
  });

  if (significantNetworkErrors.length > 0) {
    failures.push(`${tag} detected critical network errors: ${JSON.stringify(significantNetworkErrors.slice(0, 10))}`);
  }

  if (consoleErrors.length > 0) {
    failures.push(`${tag} console errors: ${consoleErrors.join(" | ")}`);
  }

  if (pageErrors.length > 0) {
    failures.push(`${tag} uncaught page errors: ${pageErrors.join(" | ")}`);
  }

  if (shouldValidateMobileMenu && route === "/en/help") {
    const menuState = await page.evaluate(() => {
      const toggle = document.querySelector("[data-testid=menu-toggle]");
      const menu = document.querySelector("[data-testid=mobile-menu]");
      const links = menu ? Array.from(menu.querySelectorAll("a[href]")) : [];

      const menuComputed = menu ? window.getComputedStyle(menu) : null;
      const toggleRect = toggle?.getBoundingClientRect();

      return {
        toggleExpanded: toggle?.getAttribute("aria-expanded") ?? null,
        menuAriaHidden: menu?.getAttribute("aria-hidden") ?? null,
        menuClasses: menu?.className ?? "",
        menuInlineTransform: menu instanceof HTMLElement ? menu.style.transform : "",
        menuVisibility: menuComputed?.visibility ?? "",
        menuPointerEvents: menuComputed?.pointerEvents ?? "",
        linkTabIndexes: links.map((link) => link.getAttribute("tabindex")),
        toggleSize: toggleRect
          ? {
              width: Math.round(toggleRect.width),
              height: Math.round(toggleRect.height),
            }
          : null,
      };
    });

    if (menuState.toggleExpanded !== "false") {
      failures.push(`${tag} expected closed mobile toggle aria-expanded=false, got ${menuState.toggleExpanded}`);
    }

    if (menuState.menuAriaHidden !== "true") {
      failures.push(`${tag} expected closed mobile menu aria-hidden=true, got ${menuState.menuAriaHidden}`);
    }

    const hasHiddenClass = menuState.menuClasses.includes("translate-y-full") && menuState.menuClasses.includes("pointer-events-none");
    const hasHiddenInlineTransform = menuState.menuInlineTransform.includes("100%");
    if (!hasHiddenClass || !hasHiddenInlineTransform) {
      failures.push(`${tag} expected closed mobile menu hidden transform classes/styles. classes=${menuState.menuClasses} transform=${menuState.menuInlineTransform}`);
    }

    if (menuState.menuVisibility !== "hidden" || menuState.menuPointerEvents !== "none") {
      failures.push(`${tag} expected closed menu visibility=hidden and pointer-events=none, got visibility=${menuState.menuVisibility}, pointer-events=${menuState.menuPointerEvents}`);
    }

    const allLinksUntabbable = menuState.linkTabIndexes.every((value) => value === "-1");
    if (!allLinksUntabbable) {
      failures.push(`${tag} expected all closed mobile menu links to have tabindex=-1, got ${menuState.linkTabIndexes.join(",")}`);
    }

    if (!menuState.toggleSize || menuState.toggleSize.width < 44 || menuState.toggleSize.height < 44) {
      failures.push(`${tag} expected menu toggle touch target >=44x44, got ${JSON.stringify(menuState.toggleSize)}`);
    }
  }
}

async function run() {
  const baseUrl = normalizeBaseUrl(process.env.E2E_BASE_URL || DEFAULT_BASE_URL);
  const failures = [];

  const browser = await chromium.launch({ headless: true });

  try {
    const desktopContext = await browser.newContext({ viewport: DESKTOP_VIEWPORT });
    for (const route of ROUTES) {
      const page = await desktopContext.newPage();
      await runAuditPage(page, {
        baseUrl,
        route,
        viewportLabel: "desktop",
        failures,
        shouldValidateMobileMenu: false,
      });
      await page.close();
    }
    await desktopContext.close();

    const mobileContext = await browser.newContext({ ...MOBILE_DEVICE });
    for (const route of ROUTES) {
      const page = await mobileContext.newPage();
      await runAuditPage(page, {
        baseUrl,
        route,
        viewportLabel: "mobile",
        failures,
        shouldValidateMobileMenu: true,
      });
      await page.close();
    }
    await mobileContext.close();
  } finally {
    await browser.close();
  }

  if (failures.length > 0) {
    console.error("Brikette E2E smoke checks failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log(`Brikette E2E smoke checks passed for ${ROUTES.join(", ")} @ ${baseUrl}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
