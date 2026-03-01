#!/usr/bin/env node

import { spawn } from "node:child_process";
import { once } from "node:events";
import process from "node:process";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";

import { chromium, devices } from "playwright";

const MODE_AUDIT = "audit";
const MODE_TURBOPACK = "turbopack";

const DESKTOP_VIEWPORT = { width: 1440, height: 900 };
const MOBILE_DEVICE = devices["iPhone 13"];

const AUDIT_DEFAULT_BASE_URL = "http://127.0.0.1:3012";
const AUDIT_ROUTES = ["/en/help", "/en/rooms"];

const TURBOPACK_DEFAULT_PORT = 3012;
const TURBOPACK_READINESS_TIMEOUT_SECONDS = 45;
const TURBOPACK_ROUTE_TIMEOUT_SECONDS = 30;
const TURBOPACK_STEP_BUDGET_SECONDS = 8 * 60;
const TURBOPACK_DEV_LOG_LIMIT_LINES = 200;
const BRIKETTE_NODE_POLYFILL_REQUIRE = `--require ${fileURLToPath(new URL("../ssr-polyfills.cjs", import.meta.url))}`;
const TURBOPACK_ROUTE_ASSERTIONS = [
  {
    route: "/en/private-rooms",
    pattern: /application\/ld\+json/i,
    description: "application/ld+json",
  },
  {
    route: "/en/how-to-get-here",
    pattern: /positano/i,
    description: "positano (case-insensitive)",
  },
  {
    route: "/en/breakfast-menu",
    pattern: /menu|breakfast/i,
    description: "menu|breakfast (case-insensitive)",
  },
];

function normalizeBaseUrl(value) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function parseSmokeMode() {
  const modeArg = process.argv.slice(2).find((arg) => arg.startsWith("--mode="));
  if (modeArg) {
    return modeArg.slice("--mode=".length).trim().toLowerCase();
  }

  const modeFromEnv = process.env.BRIKETTE_SMOKE_MODE?.trim().toLowerCase();
  if (modeFromEnv) return modeFromEnv;

  return MODE_AUDIT;
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function resolveTurbopackBaseUrlAndPort() {
  const explicitBaseUrl = process.env.E2E_BASE_URL?.trim();
  if (explicitBaseUrl) {
    const normalized = normalizeBaseUrl(explicitBaseUrl);
    const parsed = new URL(normalized);
    const inferredPort = parsed.port
      ? parsePositiveInteger(parsed.port, TURBOPACK_DEFAULT_PORT)
      : parsed.protocol === "https:"
        ? 443
        : 80;
    return { baseUrl: normalized, port: inferredPort };
  }

  const port = parsePositiveInteger(process.env.BRIKETTE_TURBOPACK_PORT, TURBOPACK_DEFAULT_PORT);
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    port,
  };
}

function appendDevLog(logLines, source, chunk) {
  const lines = chunk
    .toString("utf8")
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean);

  for (const line of lines) {
    logLines.push(`[${source}] ${line}`);
  }

  if (logLines.length > TURBOPACK_DEV_LOG_LIMIT_LINES) {
    logLines.splice(0, logLines.length - TURBOPACK_DEV_LOG_LIMIT_LINES);
  }
}

async function stopProcess(child) {
  if (!child) return;
  if (child.exitCode !== null || child.signalCode !== null) return;

  try {
    child.kill("SIGTERM");
  } catch {
    return;
  }

  const exitedOnTerm = await Promise.race([
    once(child, "exit").then(() => true),
    sleep(5000).then(() => false),
  ]);

  if (!exitedOnTerm) {
    try {
      child.kill("SIGKILL");
      await once(child, "exit");
    } catch {
      // Ignore teardown failures; caller surfaces primary smoke failure.
    }
  }
}

async function runCommand(command, args) {
  return await new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", reject);
    child.on("close", (code, signal) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      const signalSuffix = signal ? ` (signal: ${signal})` : "";
      const stderrSuffix = stderr.trim().length > 0 ? `: ${stderr.trim()}` : "";
      reject(new Error(`${command} ${args.join(" ")} exited with code ${code}${signalSuffix}${stderrSuffix}`));
    });
  });
}

async function fetchHtml(url, timeoutSeconds) {
  const { stdout } = await runCommand("curl", ["-fsS", "--max-time", String(timeoutSeconds), url]);
  return stdout;
}

async function runWithBudget(operation, seconds, label) {
  let budgetTimer;
  try {
    return await Promise.race([
      operation(),
      new Promise((_resolve, reject) => {
        budgetTimer = setTimeout(() => {
          reject(new Error(`${label} exceeded ${seconds}s budget`));
        }, seconds * 1000);
      }),
    ]);
  } finally {
    if (budgetTimer) clearTimeout(budgetTimer);
  }
}

async function runTurbopackSmoke() {
  const { baseUrl, port } = resolveTurbopackBaseUrlAndPort();
  const devLogs = [];
  let devProcess;
  const existingNodeOptions = process.env.NODE_OPTIONS?.trim();
  const nodeOptions = existingNodeOptions
    ? existingNodeOptions.includes(BRIKETTE_NODE_POLYFILL_REQUIRE)
      ? existingNodeOptions
      : `${existingNodeOptions} ${BRIKETTE_NODE_POLYFILL_REQUIRE}`
    : BRIKETTE_NODE_POLYFILL_REQUIRE;

  const start = Date.now();
  const smokeTask = async () => {
    devProcess = spawn(
      "pnpm",
      ["--dir", "apps/brikette", "exec", "next", "dev", "--port", String(port), "--hostname", "127.0.0.1"],
      {
        env: {
          ...process.env,
          FORCE_COLOR: "0",
          NODE_OPTIONS: nodeOptions,
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );

    devProcess.stdout?.on("data", (chunk) => appendDevLog(devLogs, "stdout", chunk));
    devProcess.stderr?.on("data", (chunk) => appendDevLog(devLogs, "stderr", chunk));
    devProcess.on("error", (error) => {
      appendDevLog(devLogs, "process", error.message);
    });

    let privateRoomsHtml = "";
    let ready = false;
    for (let second = 1; second <= TURBOPACK_READINESS_TIMEOUT_SECONDS; second += 1) {
      if (devProcess.exitCode !== null || devProcess.signalCode !== null) {
        throw new Error("Dev server exited before readiness completed.");
      }

      try {
        privateRoomsHtml = await fetchHtml(`${baseUrl}/en/private-rooms`, 5);
        ready = true;
        break;
      } catch {
        await sleep(1000);
      }
    }

    if (!ready) {
      throw new Error(
        `Readiness timeout (${TURBOPACK_READINESS_TIMEOUT_SECONDS}s) waiting for ${baseUrl}/en/private-rooms`,
      );
    }

    if (!TURBOPACK_ROUTE_ASSERTIONS[0].pattern.test(privateRoomsHtml)) {
      throw new Error(
        `Route /en/private-rooms did not include required text: ${TURBOPACK_ROUTE_ASSERTIONS[0].description}`,
      );
    }

    for (const assertion of TURBOPACK_ROUTE_ASSERTIONS.slice(1)) {
      const html = await fetchHtml(`${baseUrl}${assertion.route}`, TURBOPACK_ROUTE_TIMEOUT_SECONDS);
      if (!assertion.pattern.test(html)) {
        throw new Error(`Route ${assertion.route} did not include required text: ${assertion.description}`);
      }
    }
  };

  try {
    console.info(
      `Running Brikette Turbopack smoke @ ${baseUrl} ` +
        `(readiness=${TURBOPACK_READINESS_TIMEOUT_SECONDS}s, per-route=${TURBOPACK_ROUTE_TIMEOUT_SECONDS}s, budget=${TURBOPACK_STEP_BUDGET_SECONDS}s)`,
    );
    await runWithBudget(smokeTask, TURBOPACK_STEP_BUDGET_SECONDS, "Brikette Turbopack smoke");
    const durationSeconds = ((Date.now() - start) / 1000).toFixed(1);
    console.info(`Brikette Turbopack smoke passed in ${durationSeconds}s.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Brikette Turbopack smoke failed: ${message}`);
    if (devLogs.length > 0) {
      console.error("Recent dev logs:");
      for (const line of devLogs.slice(-120)) {
        console.error(line);
      }
    }
    throw error;
  } finally {
    await stopProcess(devProcess);
  }
}

function isIgnorableResource(pathname) {
  return pathname.startsWith("/_next/") || pathname === "/favicon.ico";
}

async function validateClosedMobileMenu(page, tag, failures) {
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
    await validateClosedMobileMenu(page, tag, failures);
  }
}

async function runAuditSmoke() {
  const baseUrl = normalizeBaseUrl(process.env.E2E_BASE_URL || AUDIT_DEFAULT_BASE_URL);
  const failures = [];

  const browser = await chromium.launch({ headless: true });

  try {
    const desktopContext = await browser.newContext({ viewport: DESKTOP_VIEWPORT });
    for (const route of AUDIT_ROUTES) {
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
    for (const route of AUDIT_ROUTES) {
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

  console.info(`Brikette E2E smoke checks passed for ${AUDIT_ROUTES.join(", ")} @ ${baseUrl}`);
}

async function main() {
  const mode = parseSmokeMode();
  if (mode === MODE_AUDIT) {
    await runAuditSmoke();
    return;
  }

  if (mode === MODE_TURBOPACK) {
    await runTurbopackSmoke();
    return;
  }

  throw new Error(
    `Unknown smoke mode "${mode}". Use --mode=${MODE_AUDIT} or --mode=${MODE_TURBOPACK}.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
