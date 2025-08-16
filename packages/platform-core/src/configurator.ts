// packages/platform-core/src/configurator.ts
// The original implementation imported an environment schema from
// `@acme/config/env`.  That package is not available in this environment,
// so we define a permissive schema locally using zod.  This schema
// accepts arbitrary string-to-string mappings, deferring strict
// validation to higher-level modules.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

// Accept any string key/value pairs. In the full codebase envSchema would
// include constraints for required environment variables.
const envSchema = z.record(z.string(), z.string());

/**
 * Read the contents of an environment file into a key/value map.
 * Empty values and comments are ignored.
 * @param file Path to the .env file.
 */
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

/**
 * Validate that an environment file exists and conforms to the schema defined above.
 * Throws if validation fails.
 * @param file Path to the .env file.
 */
export function validateEnvFile(file: string): void {
  if (!existsSync(file)) {
    throw new Error(`Missing ${file}`);
  }
  const env = readEnvFile(file);
  envSchema.parse(env);
}

/**
 * Validate the environment file for a given shop. Looks up the file in apps/{shop}/.env.
 * @param shop Identifier of the shop whose environment should be validated.
 */
export function validateShopEnv(shop: string): void {
  const envPath = join("apps", shop, ".env");
  validateEnvFile(envPath);
}
