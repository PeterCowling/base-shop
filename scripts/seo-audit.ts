import { fileURLToPath } from "node:url";
import lighthouse from "lighthouse";
import chromeLauncher from "chrome-launcher";

export interface SeoAuditResult {
  score: number;
  recommendations: string[];
}

/**
 * Run a Lighthouse SEO audit for the given URL and return the score and
 * recommendations for failing audits.
 */
export async function runSeoAudit(url: string): Promise<SeoAuditResult> {
  const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless"] });
  try {
    const result = await lighthouse(url, {
      port: chrome.port,
      onlyCategories: ["seo"],
      preset: "desktop",
    });
    const lhr = result.lhr;
    const score = Math.round((lhr.categories?.seo?.score ?? 0) * 100);
    const recommendations = Object.values(lhr.audits)
      .filter((a) =>
        a.score !== 1 &&
        a.scoreDisplayMode !== "notApplicable" &&
        a.title
      )
      .map((a) => a.title as string);
    return { score, recommendations };
  } finally {
    await chrome.kill();
  }
}

const __filename = fileURLToPath(import.meta.url);

// Allow the script to be invoked directly from the command line.
if (process.argv[1] === __filename) {
  const url = process.argv[2] || "http://localhost:3000";
  runSeoAudit(url)
    .then((res) => {
      console.log(JSON.stringify(res));
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
