// scripts/src/launch-shop/steps/deploy.ts
/**
 * Deploy step: commit, push, trigger workflow, and wait for completion.
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync, mkdirSync } from "node:fs";
import type { LaunchConfig } from "@acme/platform-core/createShop";
import { getShopWorkflowName, getShopAppSlug } from "@acme/platform-core/shops";
import { LaunchError, type DeployResult } from "../types";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Commit all changes for the new shop.
 */
export function commitChanges(
  shopId: string,
  launchId: string,
  workDir: string = process.cwd()
): void {
  const appSlug = getShopAppSlug(shopId);

  console.log("Staging changes...");
  execSync(`git add apps/${appSlug} .github/workflows data/shops`, {
    cwd: workDir,
    stdio: "inherit",
  });

  console.log("Committing changes...");
  const message = `Launch shop: ${shopId}\n\nLaunch ID: ${launchId}`;
  execSync(`git commit -m "${message}"`, {
    cwd: workDir,
    stdio: "inherit",
  });
}

/**
 * Push changes to remote.
 */
export function pushChanges(
  branch: string,
  workDir: string = process.cwd()
): void {
  console.log(`Pushing to remote branch: ${branch}...`);
  execSync(`git push -u origin ${branch}`, {
    cwd: workDir,
    stdio: "inherit",
  });
}

/**
 * Trigger the shop's workflow and wait for completion.
 */
export async function triggerAndWaitForDeploy(
  config: LaunchConfig,
  shopId: string,
  mode: "preview" | "production"
): Promise<DeployResult> {
  const workflowName =
    config.ci?.workflowName ?? getShopWorkflowName(shopId);
  const branch = mode === "production" ? "main" : getCurrentBranch();
  const commitSha = getCurrentSha();

  console.log(`Triggering workflow: ${workflowName} on branch ${branch}`);
  console.log(`Commit SHA: ${commitSha.slice(0, 7)}`);

  try {
    execSync(`gh workflow run ${workflowName} --ref ${branch}`, {
      stdio: "inherit",
    });
  } catch (e) {
    throw new LaunchError(
      `Failed to trigger workflow: ${(e as Error).message}`,
      "deploy",
      true
    );
  }

  // Poll for run to appear (may take a few seconds)
  console.log("Waiting for workflow run to start...");
  await sleep(5000);

  // Get the run ID, matching by commit SHA
  const runInfo = await getWorkflowRunBySha(workflowName, branch, commitSha);

  if (!runInfo) {
    throw new LaunchError(
      `No workflow run found for SHA ${commitSha.slice(0, 7)} after trigger`,
      "deploy",
      true
    );
  }

  const { runId, runUrl, headSha } = runInfo;
  console.log(`Workflow run started: ${runUrl}`);
  if (headSha !== commitSha) {
    console.log(
      `Note: Run SHA ${headSha.slice(0, 7)} differs from commit ${commitSha.slice(0, 7)}`
    );
  }

  // Poll for completion (max 10 minutes)
  const maxWaitMs = 10 * 60 * 1000;
  const pollIntervalMs = 15 * 1000;
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const status = getRunStatus(runId);

    if (status.completed) {
      if (status.conclusion !== "success") {
        throw new LaunchError(
          `Workflow failed with conclusion: ${status.conclusion}. See: ${runUrl}`,
          "deploy",
          false
        );
      }
      console.log("Workflow completed successfully!");
      break;
    }

    console.log(`Waiting for workflow... status: ${status.status}`);
    await sleep(pollIntervalMs);
  }

  if (Date.now() - startTime >= maxWaitMs) {
    throw new LaunchError(
      `Workflow timed out after 10 minutes. Check status at: ${runUrl}`,
      "deploy",
      false
    );
  }

  // Try to get deploy URL from artifact
  const deployUrl = await tryDownloadDeployMetadata(runId, config);

  return {
    workflowRunId: String(runId),
    workflowRunUrl: runUrl,
    deployUrl,
    healthCheckPassed: true, // CI already ran health checks
  };
}

function getCurrentBranch(): string {
  return execSync("git rev-parse --abbrev-ref HEAD", {
    encoding: "utf8",
  }).trim();
}

interface RunInfo {
  runId: number;
  runUrl: string;
  headSha: string;
}

/**
 * Get the current commit SHA.
 */
function getCurrentSha(): string {
  return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
}

/**
 * Get the workflow run matching the current commit SHA.
 * If no exact match found, falls back to the latest run on the branch.
 */
async function getWorkflowRunBySha(
  workflowName: string,
  branch: string,
  targetSha: string,
  maxRetries: number = 5
): Promise<RunInfo | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const runsJson = execSync(
        `gh run list --workflow=${workflowName} --branch=${branch} --limit=10 --json databaseId,url,headSha,status`,
        { encoding: "utf8" }
      );
      const runs = JSON.parse(runsJson) as Array<{
        databaseId: number;
        url: string;
        headSha: string;
        status: string;
      }>;

      if (runs.length === 0) {
        if (attempt < maxRetries - 1) {
          console.log(
            `No runs found yet, retrying... (${attempt + 1}/${maxRetries})`
          );
          await sleep(3000);
          continue;
        }
        return null;
      }

      // First, try to find a run matching our exact SHA
      const matchingRun = runs.find((r) => r.headSha === targetSha);
      if (matchingRun) {
        return {
          runId: matchingRun.databaseId,
          runUrl: matchingRun.url,
          headSha: matchingRun.headSha,
        };
      }

      // If no exact match, the run may not have appeared yet
      if (attempt < maxRetries - 1) {
        console.log(
          `No run matching SHA ${targetSha.slice(0, 7)} yet, retrying... (${attempt + 1}/${maxRetries})`
        );
        await sleep(3000);
        continue;
      }

      // Fallback to latest run on branch (warn user)
      console.log(
        `Warning: No run matching SHA ${targetSha.slice(0, 7)}, using latest run on branch`
      );
      return {
        runId: runs[0].databaseId,
        runUrl: runs[0].url,
        headSha: runs[0].headSha,
      };
    } catch {
      if (attempt < maxRetries - 1) {
        await sleep(3000);
        continue;
      }
      return null;
    }
  }
  return null;
}

interface RunStatus {
  status: string;
  conclusion: string | null;
  completed: boolean;
}

function getRunStatus(runId: number): RunStatus {
  const statusJson = execSync(
    `gh run view ${runId} --json status,conclusion`,
    { encoding: "utf8" }
  );
  const status = JSON.parse(statusJson) as {
    status: string;
    conclusion: string | null;
  };

  return {
    status: status.status,
    conclusion: status.conclusion,
    completed: status.status === "completed",
  };
}

interface DeployMetadata {
  deployUrl?: string;
  productionUrl?: string;
  gitSha?: string;
  gitRef?: string;
  environment?: string;
  timestamp?: string;
  projectName?: string;
}

/**
 * Download deploy-metadata.json artifact from the workflow run.
 * Retries a few times since artifact upload may take a moment after job completion.
 */
async function tryDownloadDeployMetadata(
  runId: number,
  config: LaunchConfig,
  maxRetries: number = 3
): Promise<string | undefined> {
  const tmpDir = `/tmp/launch-shop-artifacts-${runId}`;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      mkdirSync(tmpDir, { recursive: true });
      execSync(`gh run download ${runId} -n deploy-metadata -D ${tmpDir}`, {
        stdio: "pipe",
      });

      const metadataPath = `${tmpDir}/deploy-metadata.json`;
      if (existsSync(metadataPath)) {
        const metadata = JSON.parse(
          readFileSync(metadataPath, "utf8")
        ) as DeployMetadata;

        if (metadata.deployUrl) {
          console.log(`Deploy URL from artifact: ${metadata.deployUrl}`);
          return metadata.deployUrl;
        }
      }
    } catch {
      // Artifact not available yet - retry
      if (attempt < maxRetries - 1) {
        console.log(
          `Artifact not available yet, retrying... (${attempt + 1}/${maxRetries})`
        );
        await sleep(5000);
        continue;
      }
    }
  }

  // Fallback: construct URL from config
  const projectName = config.deployTarget.projectName;
  if (projectName) {
    const fallbackUrl = `https://${projectName}.pages.dev`;
    console.log(
      `Deploy metadata artifact not available, using fallback URL: ${fallbackUrl}`
    );
    return fallbackUrl;
  }

  console.log("Warning: Could not determine deploy URL");
  return undefined;
}
