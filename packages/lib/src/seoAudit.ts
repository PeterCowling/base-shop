import type { RunnerResult } from "lighthouse";
import desktopConfig from "lighthouse/core/config/desktop-config.js";

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
    lighthouseFn =
      typeof (mod as any).default === "function"
        ? (mod as any).default
        : typeof (mod as any).default?.default === "function"
          ? (mod as any).default.default
          : typeof mod === "function"
            ? (mod as any)
            : undefined;
  } catch {
    // ignore; handled below
  }
  let launch: typeof import("chrome-launcher").launch | undefined;
  try {
    const mod = await import("chrome-launcher");
    launch =
      typeof (mod as any).launch === "function"
        ? (mod as any).launch
        : typeof (mod as any).default?.launch === "function"
          ? (mod as any).default.launch
          : typeof (mod as any).default?.default?.launch === "function"
            ? (mod as any).default.default.launch
            : undefined;
  } catch {
    // ignore; handled below
  }
  if (typeof launch !== "function") {
    throw new Error("chrome-launcher launch function not available");
  }
  if (typeof lighthouseFn !== "function") {
    throw new Error("lighthouse is not a function");
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
