import path from "path";

export type McpPreflightProfile = "local" | "ci" | "deployed";

export interface McpPreflightOptions {
  profile?: McpPreflightProfile;
  repoRoot?: string;
}

export interface McpPreflightResolvedConfig {
  profile: McpPreflightProfile;
  repoRoot: string;
  startupLoopArtifactRoot: string;
  staleThresholdSeconds: number;
  localSettingsPath: string;
  mcpServerName: string;
  ciDeployedRegistrationFlag: string;
}

function asPositiveInt(value: string | undefined, fallbackValue: number): number {
  if (!value) {
    return fallbackValue;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallbackValue;
  }
  return Math.floor(parsed);
}

export function resolveMcpPreflightConfig(
  options: McpPreflightOptions = {},
  env: NodeJS.ProcessEnv = process.env
): McpPreflightResolvedConfig {
  const repoRoot = options.repoRoot ?? process.cwd();
  const profile: McpPreflightProfile = options.profile ?? (env.CI ? "ci" : "local");
  const startupLoopArtifactRoot =
    env.STARTUP_LOOP_ARTIFACT_ROOT?.trim() || repoRoot;

  return {
    profile,
    repoRoot,
    startupLoopArtifactRoot,
    staleThresholdSeconds: asPositiveInt(
      env.STARTUP_LOOP_STALE_THRESHOLD_SECONDS,
      60 * 60 * 24 * 30
    ),
    localSettingsPath: path.join(repoRoot, ".claude/settings.json"),
    mcpServerName: env.MCP_SERVER_NAME?.trim() || "base-shop",
    ciDeployedRegistrationFlag:
      env.MCP_STARTUP_LOOP_SERVER_REGISTERED?.trim() || "",
  };
}

export function isTruthyFlag(value: string | undefined): boolean {
  if (!value) {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}
