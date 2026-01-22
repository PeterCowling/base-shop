import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import enTranslations from "@acme/i18n/en.json";
import { readEnvFile } from "@acme/platform-core/configurator";
import type { CreateShopOptions } from "@acme/platform-core/createShop";

const translations = enTranslations as Record<string, string>;
const t = (key: string, vars?: Record<string, unknown>): string => {
  const template = translations[key] ?? key;
  if (!vars) return template;
  return template.replace(/\{(.*?)\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match,
  );
};

export interface ParsedArgs {
  seed: boolean;
  seedFull: boolean;
  useDefaults: boolean;
  autoEnv: boolean;
  skipPrompts: boolean;
  pagesTemplate?: string;
  vaultCmd?: string;
  config: Partial<CreateShopOptions> & {
    id?: string;
    contact?: string;
    plugins?: string[];
    setupCI?: boolean;
    analyticsEnabled?: boolean;
    leadCaptureEnabled?: boolean;
  };
  envFileVars: Record<string, string>;
  envFilePath?: string;
}

export function parseArgs(argv = process.argv.slice(2)): ParsedArgs {
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

  const configIndex = argv.indexOf("--config");
  const envFileIndex = argv.indexOf("--env-file");
  const profileIndex = argv.indexOf("--profile");
  const rootDir = process.cwd();

  let envFileVars: Record<string, string> = {};
  let envFilePath: string | undefined;
  if (envFileIndex !== -1) {
    envFilePath = argv[envFileIndex + 1];
    if (!envFilePath) {
      console.error(t("cli.initShop.envFilePathRequired"));
      process.exit(1);
    }
    try {
      envFileVars = readEnvFile(envFilePath);
    } catch (err) {
      console.error(
        t("cli.initShop.envFileLoadFailed", { message: (err as Error).message }),
      );
      process.exit(1);
    }
  }

  let config: ParsedArgs["config"] = {};
  if (profileIndex !== -1) {
    const profileArg = argv[profileIndex + 1];
    if (!profileArg) {
      console.error(t("cli.initShop.profilePathRequired"));
      process.exit(1);
    }
    const profilePath =
      profileArg.includes("/") || profileArg.endsWith(".json")
        ? profileArg
        : join(rootDir, "profiles", `${profileArg}.json`);
    const resolvedProfilePath = resolve(rootDir, profilePath);
    try {
       
      const raw = readFileSync(resolvedProfilePath, "utf8");
      config = JSON.parse(raw);
    } catch (err) {
      console.error(
        t("cli.initShop.profileLoadFailed", { message: (err as Error).message }),
      );
      process.exit(1);
    }
  }

  if (configIndex !== -1) {
    const configPath = argv[configIndex + 1];
    if (!configPath) {
      console.error(t("cli.initShop.configPathRequired"));
      process.exit(1);
    }
    const resolvedConfigPath = resolve(rootDir, configPath);
    try {
       
      const raw = readFileSync(resolvedConfigPath, "utf8");
      const fileConfig = JSON.parse(raw);
      config = { ...config, ...fileConfig };
    } catch (err) {
      console.error(
        t("cli.initShop.configLoadFailed", { message: (err as Error).message }),
      );
      process.exit(1);
    }
  }

  return {
    seed,
    seedFull,
    useDefaults,
    autoEnv,
    skipPrompts,
    pagesTemplate,
    vaultCmd,
    config,
    envFileVars,
    envFilePath,
  };
}
