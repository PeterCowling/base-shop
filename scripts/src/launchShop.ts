// scripts/src/launchShop.ts
/**
 * Main orchestrator for the launch-shop command.
 * Chains: preflight → scaffold → CI setup → deploy → webhook → smoke → report
 *
 * LAUNCH-07: Supports idempotent execution and resume from failures.
 * LAUNCH-17: Includes automated Stripe webhook registration.
 */
import type { LaunchConfig } from "@acme/platform-core/createShop";
import { getShopAppSlug } from "@acme/platform-core/shops";
import { loadAndValidateConfig, runPreflight } from "./launch-shop/preflight";
import {
  runGoLiveGates,
  formatGateResults,
  type GoLiveGatesResult,
} from "./launch-shop/goLiveGates";
import { runScaffold } from "./launch-shop/steps/scaffold";
import { runCiSetup } from "./launch-shop/steps/ci-setup";
import {
  commitChanges,
  pushChanges,
  triggerAndWaitForDeploy,
} from "./launch-shop/steps/deploy";
import {
  runSmokeTests,
  waitForUrlReachable,
  parseConfigSmokeChecks,
  type SmokeCheckResult,
} from "./launch-shop/steps/smoke";
import {
  runWebhookStep,
  type WebhookRegistrationResult,
} from "./launch-shop/steps/webhook";
import {
  generateLaunchId,
  generateReport,
  printExecutionPlan,
} from "./launch-shop/steps/report";
import {
  hashConfig,
  loadCheckpoint,
  createCheckpoint,
  saveCheckpoint,
  markStepCompleted,
  markLaunchFailed,
  markLaunchCompleted,
  checkResumeability,
  shouldSkipStep,
  prepareForResume,
  formatCheckpointStatus,
  getStepIndex,
  type LaunchCheckpoint,
} from "./launch-shop/state";
import type {
  LaunchOptions,
  LaunchResult,
  LaunchStep,
  StepResult,
  LaunchError,
} from "./launch-shop/types";

/**
 * Execute the launch-shop orchestration pipeline.
 * Supports idempotent execution and resume from failures (LAUNCH-07).
 */
export async function launchShop(options: LaunchOptions): Promise<LaunchResult> {
  const startTime = Date.now();
  const warnings: string[] = [];

  let config: LaunchConfig;

  // 1. Load and validate config
  console.log("Loading configuration...");
  try {
    config = loadAndValidateConfig(options.configPath);
  } catch (e) {
    return createFailureResult("unknown", "unknown", [
      `Config load failed: ${(e as Error).message}`,
    ]);
  }

  const shopId = config.shopId;
  const appSlug = getShopAppSlug(shopId);
  const configHash = hashConfig(config);

  // 2. Check for existing state and determine if resuming
  let checkpoint: LaunchCheckpoint;
  let isResuming = false;

  if (options.fresh) {
    // Force fresh start
    checkpoint = createCheckpoint(generateLaunchId(), shopId, configHash, options.mode);
    console.log("Starting fresh launch (--fresh specified)");
  } else {
    const resumeInfo = checkResumeability(shopId, configHash);

    if (resumeInfo.canResume && resumeInfo.checkpoint) {
      if (options.resume) {
        // Explicitly requested resume
        isResuming = true;
        checkpoint = resumeInfo.checkpoint;
        prepareForResume(checkpoint);
        console.log(`\n=== Resuming Launch: ${shopId} ===`);
        console.log(`Resume from: ${resumeInfo.resumeFromStep}`);
        console.log(`Resume count: ${checkpoint.resumeCount}`);
        console.log("");
      } else {
        // Has resumable state but not explicitly requested
        console.log("\nExisting launch state found:");
        console.log(formatCheckpointStatus(resumeInfo.checkpoint));
        console.log("");
        console.log("Options:");
        console.log("  --resume  Continue from last successful step");
        console.log("  --fresh   Start over, ignoring existing state");
        console.log("");
        return createFailureResult(
          resumeInfo.checkpoint.launchId,
          shopId,
          ["Existing launch state found. Use --resume or --fresh to proceed."],
          warnings
        );
      }
    } else {
      // No resumable state, start fresh
      checkpoint = createCheckpoint(generateLaunchId(), shopId, configHash, options.mode);
      if (resumeInfo.checkpoint && resumeInfo.reason) {
        console.log(`Previous state not resumable: ${resumeInfo.reason}`);
      }
    }
  }

  const launchId = checkpoint.launchId;
  saveCheckpoint(checkpoint);

  console.log(`\n=== Launch Shop: ${shopId} ===`);
  console.log(`Launch ID: ${launchId}`);
  console.log(`App slug: ${appSlug}`);
  console.log(`Mode: ${options.mode}`);
  console.log(`Config hash: ${configHash}`);
  if (isResuming) {
    console.log(`Resuming: yes (attempt ${checkpoint.resumeCount})`);
  }
  console.log("");

  // Helper to track step with checkpoint persistence
  const executeStep = async <T>(
    stepName: LaunchStep,
    fn: () => T | Promise<T>,
    options: { recoverable?: boolean; skipCondition?: () => boolean } = {}
  ): Promise<{ result: T | undefined; skipped: boolean; success: boolean }> => {
    // Check if should skip (already completed in previous run)
    if (shouldSkipStep(checkpoint, stepName)) {
      console.log(`[${stepName}] Skipping (already completed)`);
      return { result: undefined, skipped: true, success: true };
    }

    // Check custom skip condition
    if (options.skipCondition?.()) {
      console.log(`[${stepName}] Skipping (condition met)`);
      const stepResult: StepResult = {
        name: stepName,
        status: "skipped",
        durationMs: 0,
      };
      markStepCompleted(checkpoint, stepResult);
      return { result: undefined, skipped: true, success: true };
    }

    const stepStart = Date.now();
    try {
      const result = await fn();
      const stepResult: StepResult = {
        name: stepName,
        status: "success",
        durationMs: Date.now() - stepStart,
      };
      markStepCompleted(checkpoint, stepResult);
      return { result, skipped: false, success: true };
    } catch (e) {
      const error = e as Error;
      const stepResult: StepResult = {
        name: stepName,
        status: "failed",
        durationMs: Date.now() - stepStart,
        error: error.message,
      };
      checkpoint.completedSteps.push(stepResult);
      markLaunchFailed(
        checkpoint,
        stepName,
        error.message,
        options.recoverable ?? true
      );
      return { result: undefined, skipped: false, success: false };
    }
  };

  // 3. Run preflight validation
  console.log("Running preflight checks...");
  const preflightExec = await executeStep("preflight", () => {
    const result = runPreflight({
      config,
      envFilePath: options.envFilePath,
      vaultCmd: options.vaultCmd,
      mode: options.mode,
      allowDirtyGit: options.allowDirtyGit,
      force: options.force,
    });

    if (result.warnings.length > 0) {
      warnings.push(...result.warnings);
      checkpoint.warnings.push(...result.warnings);
      for (const w of result.warnings) {
        console.warn(`Warning: ${w}`);
      }
    }

    if (!result.ok) {
      throw new Error(result.errors.join("; "));
    }

    return result;
  });

  if (!preflightExec.success && !preflightExec.skipped) {
    console.error("\nPreflight checks failed.");
    return createFailureResult(launchId, shopId, [checkpoint.failedError!], warnings);
  }

  if (!preflightExec.skipped) {
    console.log("Preflight checks passed.\n");
  }

  // 4. Run go-live gates (production mode only)
  let goLiveGatesResult: GoLiveGatesResult | undefined;
  if (options.mode === "production") {
    console.log("Running go-live gates...");
    const gatesExec = await executeStep("go-live-gates", async () => {
      const result = await runGoLiveGates({
        config,
        shopId,
        mode: options.mode,
        skipE2ETest: options.dryRun,
      });

      console.log(formatGateResults(result));

      if (result.warnings.length > 0) {
        warnings.push(...result.warnings);
        checkpoint.warnings.push(...result.warnings);
      }

      // Store gate results in checkpoint
      checkpoint.goLiveGates = result.gates.map((g) => ({
        gate: g.gate,
        passed: g.passed,
        errors: g.errors,
        warnings: g.warnings,
      }));
      saveCheckpoint(checkpoint);

      if (!result.allPassed) {
        throw new Error("Go-live gates failed");
      }

      return result;
    });

    if (!gatesExec.success && !gatesExec.skipped) {
      console.error("\nGo-live gates failed. Cannot proceed with production launch.");
      return createFailureResult(
        launchId,
        shopId,
        checkpoint.goLiveGates?.flatMap((g) => g.errors) ?? [checkpoint.failedError!],
        warnings
      );
    }

    goLiveGatesResult = gatesExec.result;
    if (!gatesExec.skipped) {
      console.log("Go-live gates passed.\n");
    }
  }

  // 5. --validate mode stops here
  if (options.validate) {
    printExecutionPlan(config);
    console.log("Validation complete. No changes made.");
    // Don't persist state for validate-only runs
    return {
      success: true,
      launchId,
      shopId,
      errors: [],
      warnings,
    };
  }

  // 6. Scaffold shop
  const scaffoldExec = await executeStep("scaffold", () => {
    runScaffold(config, {
      envFilePath: options.envFilePath,
      vaultCmd: options.vaultCmd,
      force: options.force,
    });
  });

  if (!scaffoldExec.success && !scaffoldExec.skipped) {
    return createFailureResult(launchId, shopId, [checkpoint.failedError!], warnings);
  }

  // 7. Setup CI workflow
  const ciExec = await executeStep("ci-setup", () => {
    runCiSetup(shopId);
  });

  if (!ciExec.success && !ciExec.skipped) {
    return createFailureResult(launchId, shopId, [checkpoint.failedError!], warnings);
  }

  // 8. --dry-run mode stops here
  if (options.dryRun) {
    console.log("\n=== Dry Run Complete ===");
    console.log(`Shop scaffolded at: apps/${appSlug}/`);
    console.log("No git commit, push, or deploy performed.");
    return {
      success: true,
      launchId,
      shopId,
      errors: [],
      warnings,
    };
  }

  // 9. Commit changes
  const commitExec = await executeStep("commit", () => {
    commitChanges(shopId, launchId);
  });

  if (!commitExec.success && !commitExec.skipped) {
    return createFailureResult(
      launchId,
      shopId,
      [`Commit failed: ${checkpoint.failedError}`],
      warnings
    );
  }

  // Push changes (part of commit step, not separately tracked)
  const branch = options.mode === "production" ? "main" : getCurrentBranch();
  try {
    pushChanges(branch);
  } catch (e) {
    const error = e as Error;
    markLaunchFailed(checkpoint, "commit", `Push failed: ${error.message}`, true);
    return createFailureResult(
      launchId,
      shopId,
      [`Push failed: ${error.message}`],
      warnings
    );
  }

  // 10. Trigger deploy and wait
  let deployResult: Awaited<ReturnType<typeof triggerAndWaitForDeploy>> | undefined;
  const deployExec = await executeStep("deploy", async () => {
    const result = await triggerAndWaitForDeploy(config, shopId, options.mode);
    // Store deploy info in checkpoint for potential resume
    checkpoint.deployUrl = result.deployUrl;
    checkpoint.workflowRunUrl = result.workflowRunUrl;
    saveCheckpoint(checkpoint);
    return result;
  });

  if (!deployExec.success && !deployExec.skipped) {
    return createFailureResult(launchId, shopId, [checkpoint.failedError!], warnings);
  }

  deployResult = deployExec.result ?? {
    workflowRunId: "",
    workflowRunUrl: checkpoint.workflowRunUrl ?? "",
    deployUrl: checkpoint.deployUrl,
    healthCheckPassed: true,
  };

  // 11. Register Stripe webhook (LAUNCH-17)
  let webhookResult: WebhookRegistrationResult | undefined;
  const webhookExec = await executeStep(
    "webhook",
    async () => {
      const result = await runWebhookStep(shopId, deployResult?.deployUrl, {
        dryRun: options.dryRun,
        verbose: true,
      });

      if (result.warnings.length > 0) {
        warnings.push(...result.warnings);
        checkpoint.warnings.push(...result.warnings);
      }

      // Webhook failures are warnings, not fatal (shop can still launch)
      if (!result.success && result.action === "failed") {
        warnings.push(`Webhook registration failed: ${result.error}`);
      }

      return result;
    },
    { recoverable: true }
  );

  if (webhookExec.result) {
    webhookResult = webhookExec.result;
  }

  // 13. Run smoke tests
  let smokeCheckResults: SmokeCheckResult[] = [];
  const smokeExec = await executeStep(
    "smoke",
    async () => {
      if (!deployResult?.deployUrl) {
        console.log("Smoke tests skipped: no deploy URL available");
        warnings.push("Smoke tests skipped: no deploy URL available");
        return [];
      }

      console.log("\nRunning launch smoke tests...");
      const reachable = await waitForUrlReachable(deployResult.deployUrl);

      if (!reachable) {
        warnings.push("Smoke tests skipped: deploy URL not reachable");
        throw new Error("Deploy URL not reachable after retries");
      }

      const smokeChecks = parseConfigSmokeChecks(config.smokeChecks);
      const smokeResult = await runSmokeTests({
        baseUrl: deployResult.deployUrl,
        checks: smokeChecks,
        verbose: true,
      });

      if (!smokeResult.passed) {
        const failedChecks = smokeResult.checks
          .filter((c) => !c.passed)
          .map((c) => `${c.endpoint}: ${c.error}`)
          .join("; ");
        warnings.push(`Smoke test failures: ${failedChecks}`);
        // Smoke failures are warnings, not fatal errors
      }

      return smokeResult.checks;
    },
    { recoverable: true }
  );

  if (smokeExec.result) {
    smokeCheckResults = smokeExec.result;
  }

  // 14. Generate report
  await executeStep("report", () => {
    const report = generateReport({
      launchId,
      shopId,
      config,
      deployResult: deployResult!,
      mode: options.mode,
      steps: checkpoint.completedSteps,
      startTime,
      smokeChecks: smokeCheckResults.map((c) => ({
        endpoint: c.endpoint,
        passed: c.passed,
      })),
      goLiveGates: goLiveGatesResult?.gates.map((g) => ({
        gate: g.gate,
        passed: g.passed,
        errors: g.errors,
        warnings: g.warnings,
      })),
    });
    return report;
  });

  // Mark launch as complete
  markLaunchCompleted(checkpoint);

  console.log("\n=== Launch Complete ===");
  console.log(`Shop ID: ${shopId}`);
  console.log(`Launch ID: ${launchId}`);
  if (deployResult?.deployUrl) {
    console.log(`Deploy URL: ${deployResult.deployUrl}`);
  }
  console.log(`Workflow: ${deployResult?.workflowRunUrl}`);
  console.log(`State: Archived to data/launch-state/archive/`);

  return {
    success: true,
    launchId,
    shopId,
    deployUrl: deployResult?.deployUrl,
    workflowRunUrl: deployResult?.workflowRunUrl,
    reportPath: `data/shops/${shopId}/launches/${launchId}.json`,
    errors: [],
    warnings,
  };
}

function createFailureResult(
  launchId: string,
  shopId: string,
  errors: string[],
  warnings: string[] = []
): LaunchResult {
  return {
    success: false,
    launchId,
    shopId,
    errors,
    warnings,
  };
}

function getCurrentBranch(): string {
  const { execSync } = require("node:child_process");
  return execSync("git rev-parse --abbrev-ref HEAD", {
    encoding: "utf8",
  }).trim();
}
