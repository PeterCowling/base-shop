import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { readEnvFile, validateShopEnv } from "@acme/platform-core/configurator";

interface WriteEnvFilesParams {
  prefixedId: string;
  envVars: Record<string, string>;
  requiredEnvKeys: Set<string>;
  unusedEnvFileKeys: string[];
  envFilePath?: string;
  autoEnv: boolean;
  skipPrompts: boolean;
}

export function writeEnvFiles({
  prefixedId,
  envVars,
  requiredEnvKeys,
  unusedEnvFileKeys,
  envFilePath,
  autoEnv,
  skipPrompts,
}: WriteEnvFilesParams): void {
  const envPath = join("apps", prefixedId, ".env");
  let existingEnv: Record<string, string> = {};
  if (existsSync(envPath)) {
    existingEnv = readEnvFile(envPath);
  }
  const finalEnv = { ...existingEnv, ...envVars };
  writeFileSync(
    envPath,
    Object.entries(finalEnv)
      .map(([k, v]) => `${k}=${v}`)
      .join("\n") + "\n",
  );
  const templatePath = join("apps", prefixedId, ".env.template");
  writeFileSync(
    templatePath,
    [...requiredEnvKeys].map((k) => `${k}=`).join("\n") + "\n",
  );

  const missingEnvKeys = [...requiredEnvKeys].filter(
    (k) => !finalEnv[k] || finalEnv[k] === "",
  );

  let validationError: unknown;
  try {
    validateShopEnv(prefixedId);
  } catch (err) {
    validationError = err;
  }

  if (unusedEnvFileKeys.length) {
    console.warn(
      `Unused variables in ${envFilePath ?? "env file"}: ${unusedEnvFileKeys.join(", ")}`,
    );
  }
  if (missingEnvKeys.length) {
    console.error(
      `Missing environment variables: ${missingEnvKeys.join(", ")}`,
    );
  }
  if (validationError) {
    console.error("\nEnvironment validation failed:\n", validationError);
  } else if (!missingEnvKeys.length) {
    console.log("\nEnvironment variables look valid.");
  }

  if (autoEnv || skipPrompts) {
    console.warn(
      `\nWARNING: placeholder environment variables were written to apps/${prefixedId}/.env. Replace any TODO_* values with real secrets before deployment.`,
    );
  }
}
