import path from "path";

import {
  type BaselineFreshnessResult,
  checkBaselinesFreshness,
} from "./baselines-freshness";

const DEFAULT_THRESHOLD_SECONDS = 60 * 60 * 24 * 90; // 90 days

function formatAge(ageSeconds: number | null): string {
  if (ageSeconds === null) {
    return "unknown";
  }
  const days = Math.floor(ageSeconds / (60 * 60 * 24));
  return `${days}d`;
}

function run(): void {
  const repoRoot = process.cwd();
  const baselinesRoot = path.join(
    repoRoot,
    "docs/business-os/startup-baselines"
  );

  const thresholdSeconds = (() => {
    const envValue = process.env.STARTUP_LOOP_STALE_THRESHOLD_SECONDS;
    if (envValue) {
      const parsed = Number(envValue);
      if (Number.isFinite(parsed) && parsed > 0) {
        return Math.floor(parsed);
      }
    }
    return DEFAULT_THRESHOLD_SECONDS;
  })();

  const results = checkBaselinesFreshness({
    baselinesRoot,
    thresholdSeconds,
    nowMs: Date.now(),
  });

  if (results.length === 0) {
    console.log("[baselines-freshness] No standing content files found.");
    return;
  }

  const stale = results.filter((r) => r.status === "stale");
  const warning = results.filter((r) => r.status === "warning");
  const ok = results.filter((r) => r.status === "ok");

  console.log(
    `[baselines-freshness] ${results.length} files checked (threshold: ${Math.floor(thresholdSeconds / (60 * 60 * 24))}d)`
  );
  console.log(
    `  OK: ${ok.length}  Warning: ${warning.length}  Stale: ${stale.length}`
  );

  const printResults = (items: BaselineFreshnessResult[], label: string) => {
    if (items.length === 0) {
      return;
    }
    console.log(`\n${label}:`);
    for (const item of items) {
      console.log(
        `  ${item.file} — ${formatAge(item.ageSeconds)} (source: ${item.source})`
      );
    }
  };

  printResults(stale, "STALE");
  printResults(warning, "WARNING");

  if (process.argv.includes("--verbose")) {
    printResults(ok, "OK");
  }
}

run();
