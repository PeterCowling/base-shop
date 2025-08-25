import {
  createShop,
  type CreateShopOptions,
} from "@acme/platform-core/createShop";
import { validateShopName } from "@acme/platform-core/shops";
import { spawnSync } from "node:child_process";
import { readdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validateShopEnv, readEnvFile } from "@acme/platform-core/configurator";
import { seedShop } from "./seedShop";
import { listProviders, listPlugins } from "./utils/providers";
import { applyPageTemplate } from "./apply-page-template";
import {
  prompt,
  selectProviders,
  selectOption,
  promptUrl,
  promptEmail,
  promptNavItems,
  promptPages,
} from "./utils/prompt";
import { promptThemeOverrides } from "./utils/theme";

const seed = process.argv.includes("--seed");
const seedFull = process.argv.includes("--seed-full");
const useDefaults = process.argv.includes("--defaults");
const autoEnv = process.argv.includes("--auto-env");
const pagesTemplateIndex = process.argv.indexOf("--pages-template");
const pagesTemplate =
  pagesTemplateIndex !== -1 ? process.argv[pagesTemplateIndex + 1] : undefined;
const skipPrompts = process.argv.includes("--skip-prompts");

function listDirNames(path: string): string[] {
  return readdirSync(path, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

function loadTemplateDefaults(
  root: string,
  template: string
): {
  navItems?: CreateShopOptions["navItems"];
  pages?: CreateShopOptions["pages"];
} {
  try {
    const raw = readFileSync(
      join(root, "packages", template, "shop.json"),
      "utf8"
    );
    const data = JSON.parse(raw);
    const defaults: {
      navItems?: CreateShopOptions["navItems"];
      pages?: CreateShopOptions["pages"];
    } = {};
    if (Array.isArray(data.navItems)) defaults.navItems = data.navItems;
    if (Array.isArray(data.pages)) defaults.pages = data.pages;
    return defaults;
  } catch {
    return {};
  }
}

export async function initShop(): Promise<void> {
  const argv = process.argv.slice(2);
  const configIndex = argv.indexOf("--config");
  const envFileIndex = argv.indexOf("--env-file");
  const profileIndex = argv.indexOf("--profile");
  const rootDir = process.cwd();
  let envFileVars: Record<string, string> = {};
  let envFilePath: string | undefined;
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
  let config: Partial<CreateShopOptions> & {
    id?: string;
    contact?: string;
    plugins?: string[];
    setupCI?: boolean;
  } = {};
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

  const rawId =
    (config.id as string | undefined) ??
    (skipPrompts ? "" : await prompt("Shop ID: "));
  let shopId: string;
  try {
    shopId = validateShopName(rawId);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
  const prefixedId = `shop-${shopId}`;
  const name =
    (config.name as string | undefined) ??
    (skipPrompts ? "" : await prompt("Display name (optional): "));
  const logo =
    (config.logo as string | undefined) ??
    (skipPrompts ? undefined : await promptUrl("Logo URL (optional): "));
  const contact =
    (config.contactInfo as string | undefined) ??
    (config.contact as string | undefined) ??
    (skipPrompts ? undefined : await promptEmail("Contact email (optional): "));
  const typeAns =
    (config.type as string | undefined) ??
    (skipPrompts
      ? "sale"
      : await prompt("Shop type (sale or rental) [sale]: ", "sale"));
  const type: "sale" | "rental" =
    String(typeAns).toLowerCase() === "rental" ? "rental" : "sale";
  const themes = listDirNames(join(rootDir, "packages", "themes"));
  const theme =
    config.theme && themes.includes(config.theme)
      ? config.theme
      : skipPrompts
        ? themes[Math.max(themes.indexOf("base"), 0)]
        : await selectOption(
            "theme",
            themes,
            Math.max(themes.indexOf("base"), 0)
          );
  const templates = listDirNames(join(rootDir, "packages")).filter((n) =>
    n.startsWith("template-")
  );
  const template =
    config.template && templates.includes(config.template)
      ? config.template
      : skipPrompts
        ? templates[Math.max(templates.indexOf("template-app"), 0)]
        : await selectOption(
            "template",
            templates,
            Math.max(templates.indexOf("template-app"), 0)
          );
  const paymentMeta = (await listProviders("payment")) as (
    | { id: "stripe"; name: string; envVars: readonly string[] }
    | { id: "paypal"; name: string; envVars: readonly string[] }
  )[];
  const payment = Array.isArray(config.payment)
    ? (config.payment as ("stripe" | "paypal")[])
    : skipPrompts
      ? []
      : await selectProviders<"stripe" | "paypal">(
          "payment providers",
          paymentMeta.map((p) => p.id) as ("stripe" | "paypal")[]
        );
  const shippingMeta = (await listProviders("shipping")) as (
    | { id: "dhl"; name: string; envVars: readonly string[] }
    | { id: "ups"; name: string; envVars: readonly string[] }
    | { id: "premier-shipping"; name: string; envVars: readonly string[] }
  )[];
  const shipping = Array.isArray(config.shipping)
    ? (config.shipping as ("dhl" | "ups" | "premier-shipping")[])
    : skipPrompts
      ? []
      : await selectProviders<"dhl" | "ups" | "premier-shipping">(
          "shipping providers",
          shippingMeta.map((p) => p.id) as (
            | "dhl"
            | "ups"
            | "premier-shipping"
          )[]
        );
  const allPluginMeta = listPlugins(rootDir);
  type ProviderMeta = {
    id: string;
    envVars: readonly string[];
    packageName?: string;
  };
  const pluginMap = new Map<
    string,
    { packageName?: string; envVars: readonly string[] }
  >();
  for (const m of [
    ...paymentMeta,
    ...shippingMeta,
    ...allPluginMeta,
  ] as ProviderMeta[]) {
    pluginMap.set(m.id, { packageName: m.packageName, envVars: m.envVars });
  }
  const selectedPlugins = new Set<string>([...payment, ...shipping]);
  const optionalPlugins = allPluginMeta.filter(
    (p) => !selectedPlugins.has(p.id)
  );
  let extra: string[] = Array.isArray(config.plugins) ? config.plugins : [];
  if (!extra.length && optionalPlugins.length && !skipPrompts) {
    extra = await selectProviders(
      "plugins",
      optionalPlugins.map((p) => p.id)
    );
  }
  extra.forEach((id) => selectedPlugins.add(id));
  const envVars: Record<string, string> = {};
  const requiredEnvKeys = new Set<string>();
  const usedEnvFileKeys = new Set<string>();
  for (const id of selectedPlugins) {
    const vars = pluginMap.get(id)?.envVars ?? [];
    for (const key of vars) {
      requiredEnvKeys.add(key);
      if (envFileVars[key] !== undefined) {
        envVars[key] = envFileVars[key];
        usedEnvFileKeys.add(key);
        continue;
      }
      if (autoEnv || skipPrompts) {
        envVars[key] = `TODO_${key}`;
      } else {
        envVars[key] = await prompt(`${key}: `, "");
      }
    }
  }
  const unusedEnvFileKeys = Object.keys(envFileVars).filter(
    (k) => !usedEnvFileKeys.has(k)
  );
  const templateDefaults = loadTemplateDefaults(rootDir, template);
  const navItems = Array.isArray(config.navItems)
    ? config.navItems
    : useDefaults && templateDefaults.navItems
      ? templateDefaults.navItems
      : skipPrompts
        ? []
        : await promptNavItems();
  const pages = Array.isArray(config.pages)
    ? config.pages
    : useDefaults && templateDefaults.pages
      ? templateDefaults.pages
      : skipPrompts
        ? []
        : await promptPages();
  const themeOverrides =
    (config.themeOverrides as Record<string, string> | undefined) ??
    (skipPrompts ? {} : await promptThemeOverrides());
  const ciAns =
    typeof config.setupCI === "boolean"
      ? config.setupCI
        ? "y"
        : "n"
      : skipPrompts
        ? "n"
        : await prompt("Setup CI workflow? (y/N): ");

  const {
    id: _id,
    plugins: _plugins,
    setupCI: _setupCI,
    ...restConfig
  } = config as Record<string, unknown>;
  void _id;
  void _plugins;
  void _setupCI;
  const rawOptions = {
    ...restConfig,
    ...(name && { name }),
    ...(logo && { logo }),
    ...(contact && { contactInfo: contact }),
    type,
    theme,
    template,
    payment,
    shipping,
    ...(navItems.length && { navItems }),
    ...(pages.length && { pages }),
    ...(Object.keys(themeOverrides).length && { themeOverrides }),
  };
  const options = rawOptions as unknown as CreateShopOptions;

  try {
    await createShop(prefixedId, options);
    if (seedFull) {
      seedShop(prefixedId, undefined, true);
    } else if (seed) {
      seedShop(prefixedId);
    }
    try {
      const pkgPath = join("apps", prefixedId, "package.json");
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
      pkg.dependencies = pkg.dependencies ?? {};
      for (const id of selectedPlugins) {
        const pkgName = pluginMap.get(id)?.packageName;
        if (pkgName) {
          pkg.dependencies[pkgName] = "workspace:*";
        }
      }
      writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    } catch {}
  } catch (err) {
    console.error("Failed to create shop:", (err as Error).message);
    process.exit(1);
  }

  if (pagesTemplate) {
    await applyPageTemplate(prefixedId, pagesTemplate);
  }

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
      .join("\n") + "\n"
  );

  const missingEnvKeys = [...requiredEnvKeys].filter(
    (k) => !finalEnv[k] || finalEnv[k] === ""
  );

  let validationError: unknown;
  try {
    validateShopEnv(prefixedId);
  } catch (err) {
    validationError = err;
  }

  if (ciAns.toLowerCase().startsWith("y")) {
    spawnSync("pnpm", ["ts-node", "scripts/src/setup-ci.ts", shopId], {
      stdio: "inherit",
    });
  }

  if (unusedEnvFileKeys.length) {
    console.warn(
      `Unused variables in ${envFilePath ?? "env file"}: ${unusedEnvFileKeys.join(", ")}`
    );
  }
  if (missingEnvKeys.length) {
    console.error(
      `Missing environment variables: ${missingEnvKeys.join(", ")}`
    );
  }
  if (validationError) {
    console.error("\nEnvironment validation failed:\n", validationError);
  } else if (!missingEnvKeys.length) {
    console.log("\nEnvironment variables look valid.");
  }

  if (autoEnv || skipPrompts) {
    console.warn(
      `\nWARNING: placeholder environment variables were written to apps/${prefixedId}/.env. Replace any TODO_* values with real secrets before deployment.`
    );
  }

  console.log(
    `\nNext steps:\n  - Review apps/${prefixedId}/.env\n  - Review data/shops/${prefixedId}/shop.json\n  - Use the CMS Page Builder to lay out your pages\n  - Run: pnpm --filter @apps/${prefixedId} dev`
  );
}

// No top-level execution; this module exposes initShop for callers.
