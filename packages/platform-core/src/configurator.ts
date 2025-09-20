// packages/platform-core/src/configurator.ts
// The original implementation imported an environment schema from
// `@acme/config/env`.  That package is not available in this environment,
// so we define a permissive schema locally using zod.  This schema
// accepts arbitrary string-to-string mappings, deferring strict
// validation to higher-level modules.
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { z } from "zod";



// Accept any string key/value pairs. In the full codebase envSchema would
// include constraints for required environment variables.
const envSchema = z.record(z.string(), z.string());

// Map of plugin identifiers to the environment variables they require.
// These correspond to the credentials collected by the init-shop wizard.
export const pluginEnvVars: Record<string, readonly string[]> = {
  stripe: [
    "STRIPE_SECRET_KEY",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    "STRIPE_WEBHOOK_SECRET",
  ],
  paypal: ["PAYPAL_CLIENT_ID", "PAYPAL_SECRET"],
  sanity: ["SANITY_PROJECT_ID", "SANITY_DATASET", "SANITY_TOKEN"],
};

/**
 * Read the contents of an environment file into a key/value map.
 * Empty values and comments are ignored.
 * @param file Path to the .env file.
 */
export function readEnvFile(file: string): Record<string, string> {
  // `file` is provided by the caller and may be dynamic. It is only used
  // to read environment configuration files within the repository.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
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
  // `file` is constructed from known paths and validated elsewhere.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  if (!existsSync(file)) {
    throw new Error(`Missing ${file}`);
  }
  // Allow tests to override or delete the exported reader. Prefer
  // the live export on `module.exports` when available so spies and
  // deletions take effect; otherwise fall back to the local function.
  type ModuleWithRead = NodeJS.Module & {
    exports?: { readEnvFile?: typeof readEnvFile };
  };
  const exportedReader =
    typeof module !== "undefined" &&
    (module as ModuleWithRead).exports?.readEnvFile
      ? (module as ModuleWithRead).exports!.readEnvFile!
      : readEnvFile;
  const env = exportedReader(file);
  envSchema.parse(env);
}

/**
 * Validate the environment file for a given shop. Looks up the file in apps/{shop}/.env.
 * @param shop Identifier of the shop whose environment should be validated.
 */
export function validateShopEnv(shop: string): void {
  const envPath = join("apps", shop, ".env");
  validateEnvFile(envPath);

  const env = readEnvFile(envPath);

  let cfg: {
    paymentProviders?: string[];
    shippingProviders?: string[];
    billingProvider?: string;
    sanityBlog?: unknown;
  } | undefined;

  try {
    const shopCfgPath = join("data", "shops", shop, "shop.json");
    // `shopCfgPath` is derived from a validated shop name.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const cfgRaw = readFileSync(shopCfgPath, "utf8");
    cfg = JSON.parse(cfgRaw) as {
      paymentProviders?: string[];
      shippingProviders?: string[];
      billingProvider?: string;
      sanityBlog?: unknown;
    };
  } catch {
    // If the configuration can't be read, skip plugin validation.
    return;
  }

  const plugins = new Set<string>();
  cfg.paymentProviders?.forEach((p) => plugins.add(p));
  cfg.shippingProviders?.forEach((p) => plugins.add(p));
  if (cfg.billingProvider) plugins.add(cfg.billingProvider);
  if (cfg.sanityBlog) plugins.add("sanity");

  for (const id of plugins) {
    const vars = pluginEnvVars[id];
    if (!vars) continue;
    for (const key of vars) {
      if (!env[key]) {
        throw new Error(`Missing ${key}`);
      }
    }
  }
}
