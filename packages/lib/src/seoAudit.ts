import type { RunnerResult } from "lighthouse";

export interface SeoAuditResult {
  score: number;
  recommendations: string[];
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

  const chrome = await launch({ chromeFlags: ["--headless"] });
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
          a.score !== 1 &&
          a.scoreDisplayMode !== "notApplicable" &&
          a.title,
      )
      .map((a) => a.title as string);
    return { score, recommendations };
  } finally {
    await chrome.kill();
  }
}
