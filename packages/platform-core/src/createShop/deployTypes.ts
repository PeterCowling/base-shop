// packages/platform-core/src/createShop/deployTypes.ts

import type { Environment } from "@acme/types";

export interface DeployStatusBase {
  status: "pending" | "success" | "error";
  /**
   * Canonical runtime base URL for this shop when available.
   * When absent, callers should fall back to previewUrl.
   */
  url?: string;
  previewUrl?: string;
  instructions?: string;
  error?: string;
  /**
   * Optional logical environment identifier for this deployment
   * (e.g. "dev" | "stage" | "prod").
   */
  /**
   * Optional logical environment identifier for this deployment
   * (e.g. "dev" | "stage" | "prod").
   */
  env?: Environment;
  /**
   * Identifier for the runtime app being deployed, when applicable.
   */
  runtimeAppId?: string;
  /**
   * Logical version identifier for this deploy (for example a hash of componentVersions).
   */
  version?: string;
  /**
   * Underlying platform deploy ID, if available.
   */
  deployId?: string;
  /**
   * Link to deployment logs or dashboard, if available.
   */
  logsUrl?: string;
  /**
   * High-level status of post-deploy smoke tests.
   */
  testsStatus?: "not-run" | "passed" | "failed";
  /**
   * Summary of test failures, if any.
   */
  testsError?: string;
  /**
   * ISO timestamp recording when tests last ran for this deploy.
   */
  lastTestedAt?: string;
}

export type DeployShopResult = DeployStatusBase;
