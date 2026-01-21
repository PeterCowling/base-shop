// scripts/src/launch-shop/steps/ci-setup.ts
/**
 * CI setup step: invoke setup-ci to generate the GitHub Actions workflow.
 */
import { spawnSync } from "node:child_process";
import { LaunchError } from "../types";

/**
 * Run the CI setup step by invoking setup-ci.
 */
export function runCiSetup(
  shopId: string,
  workDir: string = process.cwd()
): void {
  console.log(`Setting up CI workflow for ${shopId}...`);

  const result = spawnSync(
    "pnpm",
    ["ts-node", "scripts/src/setup-ci.ts", shopId],
    {
      cwd: workDir,
      stdio: "inherit",
      encoding: "utf8",
    }
  );

  if (result.status !== 0) {
    throw new LaunchError(
      `setup-ci failed with exit code ${result.status}`,
      "ci-setup",
      true
    );
  }

  console.log(`CI workflow created successfully.`);
}
