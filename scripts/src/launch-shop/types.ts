// scripts/src/launch-shop/types.ts
/**
 * Types for the launch-shop orchestrator.
 */

export interface LaunchOptions {
  configPath: string;
  envFilePath?: string;
  vaultCmd?: string;
  mode: "preview" | "production";
  validate: boolean;
  dryRun: boolean;
  force: boolean;
  allowDirtyGit: boolean;
  /** LAUNCH-07: Resume from last successful step */
  resume?: boolean;
  /** LAUNCH-07: Force fresh start, ignoring any existing state */
  fresh?: boolean;
}

export interface LaunchResult {
  success: boolean;
  launchId: string;
  shopId: string;
  deployUrl?: string;
  workflowRunUrl?: string;
  reportPath?: string;
  errors: string[];
  warnings: string[];
}

export type LaunchStep =
  | "preflight"
  | "go-live-gates"
  | "scaffold"
  | "secrets"
  | "ci-setup"
  | "commit"
  | "deploy"
  | "webhook"
  | "smoke"
  | "report";

export interface StepResult {
  name: LaunchStep;
  status: "success" | "failed" | "skipped";
  durationMs: number;
  error?: string;
}

export interface GoLiveGateResult {
  gate: string;
  passed: boolean;
  errors: string[];
  warnings: string[];
}

export interface LaunchReport {
  launchId: string;
  shopId: string;
  configHash: string;
  gitRef: string;
  mode: "preview" | "production";
  deployUrl?: string;
  workflowRunUrl?: string;
  steps: StepResult[];
  goLiveGates?: GoLiveGateResult[];
  smokeChecks: Array<{
    endpoint: string;
    passed: boolean;
  }>;
  startedAt: string;
  completedAt: string;
  totalDurationMs: number;
}

export interface DeployResult {
  workflowRunId: string;
  workflowRunUrl: string;
  deployUrl?: string;
  healthCheckPassed: boolean;
}

export interface PreflightResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export class LaunchError extends Error {
  constructor(
    message: string,
    public readonly step: LaunchStep,
    public readonly recoverable: boolean,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "LaunchError";
  }
}
