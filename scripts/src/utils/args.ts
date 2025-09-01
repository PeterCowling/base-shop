import { readFileSync } from "node:fs";
import { join } from "node:path";
import { readEnvFile } from "@acme/platform-core/configurator";
import type { CreateShopOptions } from "@acme/platform-core/createShop";

export interface ParsedArgs {
  seed: boolean;
  seedFull: boolean;
  useDefaults: boolean;
  autoEnv: boolean;
  pagesTemplate?: string;
  vaultCmd?: string;
  skipPrompts: boolean;
  envFilePath?: string;
  envFileVars: Record<string, string>;
  config: Partial<CreateShopOptions> & {
    id?: string;
    contact?: string;
    plugins?: string[];
    setupCI?: boolean;
  };
}

export function parseArgs(argv: string[], rootDir: string): ParsedArgs {
  const seed = argv.includes("--seed");
  const seedFull = argv.includes("--seed-full");
  const useDefaults = argv.includes("--defaults");
  const autoEnv = argv.includes("--auto-env");
  const skipPrompts = argv.includes("--skip-prompts");

  const pagesTemplateIndex = argv.indexOf("--pages-template");
  const pagesTemplate =
    pagesTemplateIndex !== -1 ? argv[pagesTemplateIndex + 1] : undefined;

  const vaultCmdIndex = argv.indexOf("--vault-cmd");
  const vaultCmd = vaultCmdIndex !== -1 ? argv[vaultCmdIndex + 1] : undefined;

  const envFileIndex = argv.indexOf("--env-file");
  let envFilePath: string | undefined;
  let envFileVars: Record<string, string> = {};
  if (envFileIndex !== -1) {
    envFilePath = argv[envFileIndex + 1];
    if (!envFilePath) {
      console.error("--env-file flag requires a path");
      process.exit(1);
    }
    try {
      envFileVars = readEnvFile(envFilePath);
    } catch (err) {
      console.error("Failed to load env file:", (err as Error).message);
      process.exit(1);
    }
  }

  let config: ParsedArgs["config"] = {};

  const profileIndex = argv.indexOf("--profile");
  if (profileIndex !== -1) {
    const profileArg = argv[profileIndex + 1];
    if (!profileArg) {
      console.error("--profile flag requires a name or path");
      process.exit(1);
    }
    const profilePath =
      profileArg.includes("/") || profileArg.endsWith(".json")
        ? profileArg
        : join(rootDir, "profiles", `${profileArg}.json`);
    try {
      const raw = readFileSync(profilePath, "utf8");
      config = JSON.parse(raw);
    } catch (err) {
      console.error("Failed to load profile file:", (err as Error).message);
      process.exit(1);
    }
  }

  const configIndex = argv.indexOf("--config");
  if (configIndex !== -1) {
    const configPath = argv[configIndex + 1];
    if (!configPath) {
      console.error("--config flag requires a path");
      process.exit(1);
    }
    try {
      const raw = readFileSync(configPath, "utf8");
      const fileConfig = JSON.parse(raw);
      config = { ...config, ...fileConfig };
    } catch (err) {
      console.error("Failed to load config file:", (err as Error).message);
      process.exit(1);
    }
  }

  return {
    seed,
    seedFull,
    useDefaults,
    autoEnv,
    pagesTemplate,
    vaultCmd,
    skipPrompts,
    envFilePath,
    envFileVars,
    config,
  };
}
