// scripts/src/launch-shop/steps/report.ts
/**
 * Report step: generate launch report after deployment.
 */
import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import type { LaunchConfig } from "@acme/platform-core/createShop";
import { getShopAppSlug } from "@acme/platform-core/shops";
import type { LaunchReport, StepResult, DeployResult, GoLiveGateResult } from "../types";

export interface GenerateReportParams {
  launchId: string;
  shopId: string;
  config: LaunchConfig;
  deployResult?: DeployResult;
  mode: "preview" | "production";
  steps: StepResult[];
  startTime: number;
  /** Smoke check results from actual test run */
  smokeChecks?: Array<{ endpoint: string; passed: boolean }>;
  /** Go-live gate results (production mode only) */
  goLiveGates?: GoLiveGateResult[];
}

export interface ReportOutput {
  path: string;
  report: LaunchReport;
}

/**
 * Generate a unique launch ID.
 * Format: <timestamp>-<shortHash>
 * Example: 20260118-143052-a1b2c3d
 */
export function generateLaunchId(): string {
  const now = new Date();
  const timestamp = now
    .toISOString()
    .replace(/[-:T]/g, "")
    .slice(0, 14);

  const randomBytes = createHash("sha256")
    .update(String(Date.now()) + String(Math.random()))
    .digest("hex")
    .slice(0, 7);

  return `${timestamp}-${randomBytes}`;
}

/**
 * Generate the launch report and write it to disk.
 */
export function generateReport(params: GenerateReportParams): ReportOutput {
  const {
    launchId,
    shopId,
    config,
    deployResult,
    mode,
    steps,
    startTime,
    smokeChecks: smokeCheckResults,
    goLiveGates,
  } = params;

  const configHash = createHash("sha256")
    .update(JSON.stringify(config))
    .digest("hex")
    .slice(0, 12);

  let gitRef = "unknown";
  try {
    gitRef = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {
    // Ignore git errors
  }

  const report: LaunchReport = {
    launchId,
    shopId,
    configHash,
    gitRef,
    mode,
    deployUrl: deployResult?.deployUrl,
    workflowRunUrl: deployResult?.workflowRunUrl,
    steps,
    goLiveGates,
    smokeChecks: smokeCheckResults ?? [],
    startedAt: new Date(startTime).toISOString(),
    completedAt: new Date().toISOString(),
    totalDurationMs: Date.now() - startTime,
  };

  // Write to data/shops/<appSlug>/launches/<launchId>.json
  const appSlug = getShopAppSlug(shopId);
  const launchesDir = join("data", "shops", appSlug, "launches");

  if (!existsSync(launchesDir)) {
    mkdirSync(launchesDir, { recursive: true });
  }

  const launchPath = join(launchesDir, `${launchId}.json`);
  writeFileSync(launchPath, JSON.stringify(report, null, 2));

  // Also write latest pointer
  const latestPath = join("data", "shops", appSlug, "launch.json");
  writeFileSync(latestPath, JSON.stringify(report, null, 2));

  console.log(`Launch report written to: ${launchPath}`);

  return { path: launchPath, report };
}

/**
 * Print execution plan for --validate mode.
 */
export function printExecutionPlan(config: LaunchConfig): void {
  const appSlug = getShopAppSlug(config.shopId);

  console.log("\n=== Execution Plan ===\n");
  console.log(`Shop ID:        ${config.shopId}`);
  console.log(`App slug:       ${appSlug}`);
  console.log(`App directory:  apps/${appSlug}/`);
  console.log(`Deploy target:  ${config.deployTarget.type}`);
  if (config.deployTarget.projectName) {
    console.log(`Project name:   ${config.deployTarget.projectName}`);
  }
  console.log("");
  console.log("Steps to execute:");
  console.log("  1. Scaffold shop (init-shop --skip-prompts --seed-full)");
  console.log("  2. Setup CI workflow (setup-ci)");
  console.log("  3. Commit and push changes");
  console.log("  4. Trigger workflow and wait for deploy");
  console.log("  5. Generate launch report");

  if (config.smokeChecks && config.smokeChecks.length > 0) {
    console.log("");
    console.log("Smoke checks (run by CI):");
    for (const check of config.smokeChecks) {
      console.log(
        `  - ${check.endpoint} (expected: ${check.expectedStatus ?? 200})`
      );
    }
  }

  console.log("");
}
