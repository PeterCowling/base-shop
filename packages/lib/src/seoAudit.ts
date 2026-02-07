import dns from "node:dns";
import http from "node:http";
import https from "node:https";

import type { RunnerResult } from "lighthouse";

export interface SeoAuditResult {
  score: number;
  recommendations: string[];
}

async function prewarmUrl(input: string, timeoutMs = 2500): Promise<void> {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return;
  }

  await new Promise<void>((resolve) => {
    const lib = url.protocol === "https:" ? https : http;
    const req = lib.request(
      {
        method: "GET",
        hostname: url.hostname,
        port: url.port || undefined,
        path: `${url.pathname}${url.search}`,
        headers: { "user-agent": "seo-audit-prewarm" },
      },
      (res) => {
        res.resume();
        resolve();
      },
    );
    req.on("error", () => resolve());
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve();
    });
    req.end();
  });
}

/**
 * Run a Lighthouse SEO audit for the given URL and return the score and
 * recommendations for failing audits.
 */
export function resolveLighthouse(mod: unknown): typeof import("lighthouse").default | undefined {
  const record = mod as Record<string, unknown>;
  const defaultRecord = record.default as Record<string, unknown> | undefined;
  if (typeof record.default === "function") {
    return record.default as typeof import("lighthouse").default;
  }
  if (typeof defaultRecord?.default === "function") {
    return defaultRecord.default as typeof import("lighthouse").default;
  }
  if (typeof mod === "function") {
    return mod as typeof import("lighthouse").default;
  }
  return undefined;
}

export function resolveChromeLaunch(mod: unknown): typeof import("chrome-launcher").launch | undefined {
  const record = mod as Record<string, unknown>;
  const defaultRecord = record.default as Record<string, unknown> | undefined;
  const nestedDefault = defaultRecord?.default as Record<string, unknown> | undefined;
  if (typeof record.launch === "function") {
    return record.launch as typeof import("chrome-launcher").launch;
  }
  if (typeof defaultRecord?.launch === "function") {
    return defaultRecord.launch as typeof import("chrome-launcher").launch;
  }
  if (typeof nestedDefault?.launch === "function") {
    return nestedDefault.launch as typeof import("chrome-launcher").launch;
  }
  return undefined;
}

export function resolveDesktopConfig(mod: unknown): unknown {
  const record = mod as Record<string, unknown>;
  return record.default ?? mod;
}

export async function runSeoAudit(url: string): Promise<SeoAuditResult> {
  // Ensure Node-side fetches inside Lighthouse prefer IPv4 for localhost.
  // This avoids flaky failures when ::1 is resolved first but the dev server isn't listening on IPv6 loopback.
  try {
    dns.setDefaultResultOrder("ipv4first");
  } catch {
    // ignore
  }

  // Best-effort warmup for dev servers (robots.txt route compilation is a common source of flakiness).
  try {
    await prewarmUrl(new URL("/robots.txt", url).toString());
  } catch {
    // ignore
  }

  // Resolve the `launch` function from chrome-launcher lazily to support both
  // CommonJS and ESM versions of the library. This mirrors how generateMeta
  // resolves the OpenAI client above.
  let lighthouseFn: typeof import("lighthouse").default | undefined;
  try {
    const mod = await import("lighthouse");
    lighthouseFn = resolveLighthouse(mod);
  } catch {
    // ignore; handled below
  }
  let launch: typeof import("chrome-launcher").launch | undefined;
  try {
    const mod = await import("chrome-launcher");
    launch = resolveChromeLaunch(mod);
  } catch {
    // ignore; handled below
  }
  let desktopConfig: unknown;
  try {
    const mod = await import("lighthouse/core/config/desktop-config.js");
    desktopConfig = resolveDesktopConfig(mod);
  } catch {
    // ignore; handled below
  }
  if (typeof launch !== "function") {
    // i18n-exempt -- DEV-000: internal developer error message, not user-facing copy
    throw new Error("chrome-launcher launch function not available");
  }
  if (typeof lighthouseFn !== "function") {
    // i18n-exempt -- DEV-000: internal developer error message, not user-facing copy
    throw new Error("lighthouse is not a function");
  }
  if (!desktopConfig) {
    // i18n-exempt -- DEV-000: internal developer error message, not user-facing copy
    throw new Error("lighthouse desktop config not available");
  }

  const chrome = await launch({
    chromeFlags: [
      "--headless",
      // Prefer IPv4 loopback for localhost to avoid IPv6 (::1) resolution issues in dev.
      "--host-resolver-rules=MAP localhost 127.0.0.1",
    ],
  });
  try {
    const result: RunnerResult | undefined = await lighthouseFn(
      url,
      {
        port: chrome.port,
        onlyCategories: ["seo"],
      },
      desktopConfig,
    );
    if (!result) {
      // i18n-exempt -- DEV-000: internal developer error message, not user-facing copy
      throw new Error("Lighthouse did not return a result");
    }
    const lhr = result.lhr;
    const score = Math.round((lhr.categories?.seo?.score ?? 0) * 100);
    const recommendations = Object.values(lhr.audits)
      .filter(
        (a) =>
          (a.scoreDisplayMode === "error" || (typeof a.score === "number" && a.score < 1)) &&
          a.scoreDisplayMode !== "notApplicable" &&
          a.title,
      )
      .map((a) => {
        const title = a.title as string;
        if (a.scoreDisplayMode === "error" && a.errorMessage) {
          return `${title}: ${a.errorMessage}`;
        }
        if (typeof a.explanation === "string" && a.explanation.trim().length > 0) {
          return `${title}: ${a.explanation}`;
        }
        if (typeof a.displayValue === "string" && a.displayValue.trim().length > 0) {
          return `${title}: ${a.displayValue}`;
        }
        return title;
      });
    return { score, recommendations };
  } finally {
    await chrome.kill();
  }
}
