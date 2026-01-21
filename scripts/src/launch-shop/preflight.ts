// scripts/src/launch-shop/preflight.ts
/**
 * Preflight validation for launch-shop orchestrator.
 * Validates config, environment, secrets, and git state before execution.
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import {
  launchConfigSchema,
  REQUIRED_LEGAL_PAGES,
  type LaunchConfig,
} from "@acme/platform-core/createShop";
import { getShopAppSlug } from "@acme/platform-core/shops";
import { validateThemeSelection, getAvailableThemeIds } from "@acme/platform-core/themeRegistry";
import { ensureRuntime } from "../runtime";
import {
  getRequiredGitHubSecrets,
  type DeployTargetType,
} from "./required-secrets";
import type { PreflightResult } from "./types";

export interface PreflightOptions {
  config: LaunchConfig;
  envFilePath?: string;
  vaultCmd?: string;
  mode: "preview" | "production";
  allowDirtyGit: boolean;
  force: boolean;
}

/**
 * Run all preflight checks before launch execution.
 */
export function runPreflight(options: PreflightOptions): PreflightResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const { config, mode } = options;

  // 1. Runtime check (Node 20+, pnpm 10+)
  try {
    ensureRuntime();
  } catch (e) {
    errors.push(`Runtime check failed: ${(e as Error).message}`);
  }

  // 2. Required CLI tools
  const requiredTools = ["git", "gh"];
  for (const tool of requiredTools) {
    try {
      execSync(`which ${tool}`, { stdio: "pipe" });
    } catch {
      errors.push(`Required CLI tool not found: ${tool}`);
    }
  }

  // 3. gh auth status
  try {
    execSync("gh auth status", { stdio: "pipe" });
  } catch {
    errors.push("GitHub CLI not authenticated. Run: gh auth login");
  }

  // 4. Git working tree check
  if (!options.allowDirtyGit) {
    try {
      const status = execSync("git status --porcelain", { encoding: "utf8" });
      if (status.trim() !== "") {
        errors.push(
          "Git working tree is dirty. Use --allow-dirty-git to override."
        );
      }
    } catch (e) {
      errors.push(`Git status check failed: ${(e as Error).message}`);
    }
  }

  // 5. Config schema validation
  const parseResult = launchConfigSchema.safeParse(config);
  if (!parseResult.success) {
    const issues = parseResult.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    errors.push(`Config validation failed: ${issues}`);
  }

  // 5b. Theme validation (LAUNCH-24)
  if (config.theme) {
    const themeValidation = validateThemeSelection(config.theme);
    if (!themeValidation.valid) {
      const available = getAvailableThemeIds();
      errors.push(
        `${themeValidation.error}. Available themes: ${available.join(", ")}`
      );
    }
  }

  // 6. Shop collision check
  const appSlug = getShopAppSlug(config.shopId);
  if (existsSync(`apps/${appSlug}`) && !options.force) {
    errors.push(
      `Shop already exists: apps/${appSlug}. Use --force to overwrite.`
    );
  }

  // 7. TODO_ placeholder detection in env file
  if (options.envFilePath && existsSync(options.envFilePath)) {
    const envContent = readFileSync(options.envFilePath, "utf8");
    const todoMatches = envContent.match(/^[A-Z_]+=TODO_/gm);
    if (todoMatches && mode === "production") {
      errors.push(
        `Found ${todoMatches.length} TODO_ placeholders in env file. Fix before production deploy.`
      );
    } else if (todoMatches) {
      warnings.push(
        `Found ${todoMatches.length} TODO_ placeholders in env file.`
      );
    }
  }

  // 7b. SOPS file existence check
  const sopsFile = `apps/${appSlug}/.env.${mode}.sops`;
  const plainEnvFile = `apps/${appSlug}/.env`;
  const hasSopsFile = existsSync(sopsFile);
  const hasEnvFile = existsSync(plainEnvFile);

  if (mode === "production" && !hasSopsFile && !hasEnvFile && !options.envFilePath) {
    errors.push(
      `No environment file found. Create ${sopsFile} (encrypted) or provide --env-file`
    );
  } else if (hasSopsFile && !hasEnvFile) {
    warnings.push(
      `SOPS file exists (${sopsFile}) but .env not decrypted locally. CI will decrypt automatically if SOPS_AGE_KEY is configured.`
    );
  }

  // 8. GitHub secrets verification
  const deployType = config.deployTarget.type as DeployTargetType;
  const requiredSecrets = getRequiredGitHubSecrets(deployType);

  if (requiredSecrets.length > 0) {
    try {
      const secretList = execSync(
        'gh secret list --json name --jq ".[].name"',
        { encoding: "utf8" }
      );
      const existingSecrets = new Set(secretList.trim().split("\n"));

      const missingSecrets = requiredSecrets.filter(
        (s) => !existingSecrets.has(s)
      );
      if (missingSecrets.length > 0) {
        errors.push(
          `Missing GitHub secrets for ${deployType}: ${missingSecrets.join(", ")}`
        );
      }
    } catch (e) {
      errors.push(`Failed to check GitHub secrets: ${(e as Error).message}`);
    }
  }

  // 9. Provider project name validation
  if (config.deployTarget.projectName) {
    const projectName = config.deployTarget.projectName;
    if (projectName.length > 63) {
      errors.push(
        `Cloudflare project name too long (max 63 chars): ${projectName}`
      );
    }
    if (!/^[a-z0-9-]+$/.test(projectName)) {
      errors.push(
        `Invalid Cloudflare project name (lowercase alphanumeric + hyphens only): ${projectName}`
      );
    }
  }

  // 10. Compliance sign-off validation (LAUNCH-27)
  if (mode === "production") {
    // Check compliance sign-off exists
    if (!config.complianceSignOff) {
      errors.push(
        "Compliance sign-off required for production launch. Add complianceSignOff to config."
      );
    } else {
      // Validate sign-off is recent (within 30 days)
      const signOffDate = new Date(config.complianceSignOff.signedOffAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (signOffDate < thirtyDaysAgo) {
        warnings.push(
          `Compliance sign-off is older than 30 days (${config.complianceSignOff.signedOffAt}). Consider re-certifying.`
        );
      }
    }

    // Check required legal pages are mapped to templates
    const legalPages = config.legalPages ?? {};
    const missingLegalPages = REQUIRED_LEGAL_PAGES.filter(
      (slug) => !legalPages[slug]
    );
    if (missingLegalPages.length > 0) {
      errors.push(
        `Missing required legal page templates: ${missingLegalPages.join(", ")}. ` +
        `Add to legalPages config or use templates from ?group=legal API.`
      );
    }
  } else {
    // Preview mode: warn if compliance not set up
    if (!config.complianceSignOff) {
      warnings.push(
        "No compliance sign-off configured. Required before production launch."
      );
    }
    if (!config.legalPages || Object.keys(config.legalPages).length === 0) {
      warnings.push(
        "No legal pages mapped to templates. Configure legalPages before production."
      );
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Load and validate a launch config file.
 */
export function loadAndValidateConfig(configPath: string): LaunchConfig {
  if (!existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  const content = readFileSync(configPath, "utf8");
  let rawConfig: unknown;

  try {
    rawConfig = JSON.parse(content);
  } catch (e) {
    throw new Error(`Invalid JSON in config file: ${(e as Error).message}`);
  }

  const result = launchConfigSchema.safeParse(rawConfig);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("\n  ");
    throw new Error(`Config validation failed:\n  ${issues}`);
  }

  return result.data;
}
