import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { chromium, devices, webkit } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTOTYPE_PATH = path.join(__dirname, "hourglass-particle-prototype.html");
const PROTOTYPE_URL = pathToFileURL(PROTOTYPE_PATH).toString();
const RESULTS_PATH = path.join(__dirname, "benchmark-results.json");
const SUMMARY_PATH = path.join(__dirname, "benchmark-summary.md");
const SCREENSHOT_DIR = path.join(__dirname, "screenshots");

const PARTICLE_COUNTS = [300, 500, 800];

const PROFILES = [
  {
    id: "desktop-chromium",
    browserType: chromium,
    contextOptions: {
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 1,
      colorScheme: "light",
    },
    note: "Desktop Chromium baseline",
  },
  {
    id: "android-chrome-emulated",
    browserType: chromium,
    contextOptions: {
      ...devices["Pixel 7"],
      colorScheme: "light",
    },
    note: "Mobile Chrome emulation via Pixel 7 device profile",
  },
  {
    id: "ios-webkit-emulated",
    browserType: webkit,
    contextOptions: {
      ...devices["iPhone 13"],
      colorScheme: "light",
    },
    note: "WebKit + iPhone 13 emulation (proxy for Safari engine)",
  },
];

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, n) => sum + n, 0) / values.length;
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2;
  return sorted[mid];
}

function buildSummary(results) {
  const timestamp = new Date().toISOString();
  const lines = [];
  lines.push("# Prototype Benchmark Summary");
  lines.push("");
  lines.push(`Generated: ${timestamp}`);
  lines.push(`Prototype: \`${PROTOTYPE_PATH}\``);
  lines.push("");
  lines.push(
    "This benchmark uses local Playwright browser engines and device emulation. It is useful for relative performance checks, but it does not replace real-device Safari/Chrome measurements."
  );
  lines.push("");

  const successful = results.filter((r) => r.status === "ok");
  if (!successful.length) {
    lines.push("No successful benchmark runs.");
    return lines.join("\n");
  }

  lines.push("## Per Run");
  lines.push("");
  lines.push("| Profile | Particles | avg fps | p95 frame ms | long frame % | max frame ms | Screenshot |");
  lines.push("|---|---:|---:|---:|---:|---:|---|");

  for (const run of successful) {
    lines.push(
      `| ${run.profile} | ${run.particleCount} | ${round(run.metrics.avgFps, 1)} | ${round(
        run.metrics.p95FrameMs,
        2
      )} | ${round(run.metrics.longFramePct, 1)} | ${round(run.metrics.maxFrameMs, 2)} | \`${run.screenshotRelPath}\` |`
    );
  }

  lines.push("");
  lines.push("## Profile Aggregates");
  lines.push("");
  lines.push("| Profile | Runs | mean avg fps | median avg fps | mean p95 frame ms | mean long frame % |");
  lines.push("|---|---:|---:|---:|---:|---:|");

  const byProfile = new Map();
  for (const run of successful) {
    if (!byProfile.has(run.profile)) byProfile.set(run.profile, []);
    byProfile.get(run.profile).push(run);
  }

  for (const [profile, runs] of byProfile.entries()) {
    const avgFps = runs.map((r) => r.metrics.avgFps);
    const p95 = runs.map((r) => r.metrics.p95FrameMs);
    const long = runs.map((r) => r.metrics.longFramePct);

    lines.push(
      `| ${profile} | ${runs.length} | ${round(average(avgFps), 1)} | ${round(median(avgFps), 1)} | ${round(
        average(p95),
        2
      )} | ${round(average(long), 1)} |`
    );
  }

  lines.push("");
  lines.push("## Notes");
  lines.push("");
  lines.push("- This run provides H1 baseline evidence under local engine emulation.");
  lines.push("- Keep a separate real-device pass for iPhone Safari and Android Chrome before final build sign-off.");

  const failures = results.filter((r) => r.status !== "ok");
  if (failures.length) {
    lines.push("");
    lines.push("## Failed/Skipped Runs");
    lines.push("");
    lines.push("| Profile | Particles | Status | Reason |");
    lines.push("|---|---:|---|---|");
    for (const failure of failures) {
      lines.push(
        `| ${failure.profile} | ${failure.particleCount ?? "-"} | ${failure.status} | ${failure.reason ?? "n/a"} |`
      );
    }
  }

  return lines.join("\n");
}

async function runSingle(page, profileId, particleCount) {
  await page.goto(PROTOTYPE_URL, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => typeof window.runParticleBenchmark === "function");

  // Warm-up run so startup overhead is not measured as part of scored runs.
  await page.evaluate(() => window.runParticleBenchmark({ particleCount: 150, seed: 111 }));

  const metrics = await page.evaluate(
    ({ count }) => window.runParticleBenchmark({ particleCount: count, seed: 20260223 + count }),
    { count: particleCount }
  );

  const screenshotName = `${profileId}-${particleCount}.png`;
  const screenshotPath = path.join(SCREENSHOT_DIR, screenshotName);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  return {
    profile: profileId,
    particleCount,
    metrics,
    screenshotRelPath: path.relative(__dirname, screenshotPath),
    status: "ok",
  };
}

async function main() {
  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });

  const results = [];
  for (const profile of PROFILES) {
    let browser;
    try {
      browser = await profile.browserType.launch({ headless: true });
      const context = await browser.newContext(profile.contextOptions);
      const page = await context.newPage();

      for (const particleCount of PARTICLE_COUNTS) {
        try {
          const result = await runSingle(page, profile.id, particleCount);
          result.note = profile.note;
          results.push(result);
        } catch (error) {
          results.push({
            profile: profile.id,
            particleCount,
            status: "error",
            reason: String(error?.message ?? error),
          });
        }
      }

      await context.close();
    } catch (error) {
      results.push({
        profile: profile.id,
        status: "skipped",
        reason: String(error?.message ?? error),
      });
    } finally {
      await browser?.close();
    }
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    nodeVersion: process.version,
    prototypePath: PROTOTYPE_PATH,
    particleCounts: PARTICLE_COUNTS,
    profiles: PROFILES.map((p) => ({ id: p.id, note: p.note })),
    results,
  };

  await fs.writeFile(RESULTS_PATH, JSON.stringify(payload, null, 2));
  await fs.writeFile(SUMMARY_PATH, buildSummary(results));

  console.log(`Wrote ${RESULTS_PATH}`);
  console.log(`Wrote ${SUMMARY_PATH}`);

  const succeeded = results.filter((r) => r.status === "ok").length;
  const total = PROFILES.length * PARTICLE_COUNTS.length;
  console.log(`Successful runs: ${succeeded}/${total}`);
}

await main();
