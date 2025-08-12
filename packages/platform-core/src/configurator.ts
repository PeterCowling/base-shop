import { envSchema } from "@acme/config/env";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export function readEnvFile(file: string): Record<string, string> {
  const envRaw = readFileSync(file, "utf8");
  const env: Record<string, string> = {};
  for (const line of envRaw.split(/\n+/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    env[key] = rest.join("=");
  }
  Object.keys(env).forEach((k) => {
    if (env[k] === "") delete env[k];
  });
  return env;
}

export function validateEnvFile(file: string): void {
  if (!existsSync(file)) {
    throw new Error(`Missing ${file}`);
  }
  const env = readEnvFile(file);
  envSchema.parse(env);
}

export function validateShopEnv(shop: string): void {
  const envPath = join("apps", shop, ".env");
  validateEnvFile(envPath);
}
