import type { RunnerResult } from "lighthouse";

export interface SeoAuditResult {
  score: number;
  recommendations: string[];
}

/**
 * Run a Lighthouse SEO audit for the given URL and return the score and
 * recommendations for failing audits.
 */
export async function runSeoAudit(url: string): Promise<SeoAuditResult> {
  // Resolve the `launch` function from chrome-launcher lazily to support both
  // CommonJS and ESM versions of the library. This mirrors how generateMeta
  // resolves the OpenAI client above.
  let lighthouseFn: typeof import("lighthouse").default | undefined;
  try {
    const mod = await import("lighthouse");
    const record = mod as Record<string, unknown>;
    const defaultRecord = record.default as Record<string, unknown> | undefined;
    const maybeFn =
      typeof record.default === "function"
        ? record.default
        : typeof defaultRecord?.default === "function"
          ? defaultRecord.default
          : typeof mod === "function"
            ? (mod as unknown)
            : undefined;
    lighthouseFn = maybeFn as typeof import("lighthouse").default | undefined;
  } catch {
    // ignore; handled below
  }
  let launch: typeof import("chrome-launcher").launch | undefined;
  try {
    const mod = await import("chrome-launcher");
    const record = mod as Record<string, unknown>;
    const defaultRecord = record.default as Record<string, unknown> | undefined;
    const nestedDefault = defaultRecord?.default as Record<string, unknown> | undefined;
    const maybeLaunch =
      typeof record.launch === "function"
        ? record.launch
        : typeof defaultRecord?.launch === "function"
          ? defaultRecord.launch
          : typeof nestedDefault?.launch === "function"
            ? nestedDefault.launch
            : undefined;
    launch = maybeLaunch as typeof import("chrome-launcher").launch | undefined;
  } catch {
    // ignore; handled below
  }
  let desktopConfig: unknown;
  try {
    const mod = await import("lighthouse/core/config/desktop-config.js");
    const record = mod as Record<string, unknown>;
    desktopConfig = record.default ?? mod;
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
