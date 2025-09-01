import { validateShopName } from "@acme/platform-core/shops";
import { spawnSync, execSync } from "node:child_process";
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validateShopEnv, readEnvFile } from "@acme/platform-core/configurator";
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
} from "./utils/prompts";
import { promptThemeOverrides } from "./utils/theme";
import { parseArgs } from "./utils/args";
import { createShopAndSeed } from "./shop/init";
import type { CreateShopOptions } from "@acme/platform-core/createShop";
import { listDirNames, loadTemplateDefaults } from "./utils/templates";

export async function initShop(): Promise<void> {
  const {
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
  } = parseArgs();

  const rootDir = process.cwd();

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
            Math.max(themes.indexOf("base"), 0),
          );
  const templates = listDirNames(join(rootDir, "packages")).filter((n) =>
    n.startsWith("template-"),
  );
  const template =
    config.template && templates.includes(config.template)
      ? config.template
      : skipPrompts
        ? templates[Math.max(templates.indexOf("template-app"), 0)]
        : await selectOption(
            "template",
            templates,
            Math.max(templates.indexOf("template-app"), 0),
          );
  const paymentMeta = (await listProviders("payment")) as (
    | { id: "stripe"; name: string; envVars: readonly string[] }
    | { id: "paypal"; name: string; envVars: readonly string[] }
  )[];
  const payment = Array.isArray(config.payment)
    ? (config.payment as ("stripe" | "paypal")[])
    : skipPrompts
      ? []
      : await selectProviders<"stripe" | "paypal">
          (
            "payment providers",
            paymentMeta.map((p) => p.id) as ("stripe" | "paypal")[],
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
      : await selectProviders<"dhl" | "ups" | "premier-shipping">
          (
            "shipping providers",
            shippingMeta.map((p) => p.id) as (
              | "dhl"
              | "ups"
              | "premier-shipping"
            )[],
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
    (p) => !selectedPlugins.has(p.id),
  );
  let extra: string[] = Array.isArray(config.plugins) ? config.plugins : [];
  if (!extra.length && optionalPlugins.length && !skipPrompts) {
    extra = await selectProviders(
      "plugins",
      optionalPlugins.map((p) => p.id),
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
      if (vaultCmd) {
        try {
          const val = execSync(`${vaultCmd} ${key}`, { encoding: "utf8" }).trim();
          if (val) {
            envVars[key] = val;
            continue;
          }
        } catch {}
      }
      if (autoEnv || skipPrompts) {
        envVars[key] = `TODO_${key}`;
      } else {
        envVars[key] = await prompt(`${key}: `, "");
      }
    }
  }
  const unusedEnvFileKeys = Object.keys(envFileVars).filter(
    (k) => !usedEnvFileKeys.has(k),
  );
  const templateDefaults = loadTemplateDefaults(template, rootDir);
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
    await createShopAndSeed(prefixedId, options, selectedPlugins, pluginMap, {
      seed,
      seedFull,
    });
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

  if (ciAns.toLowerCase().startsWith("y")) {
    spawnSync("pnpm", ["ts-node", "scripts/src/setup-ci.ts", shopId], {
      stdio: "inherit",
    });
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

  console.log(
    `\nNext steps:\n  - Review apps/${prefixedId}/.env\n  - Review data/shops/${prefixedId}/shop.json\n  - Use the CMS Page Builder to lay out your pages\n  - Run: pnpm --filter @apps/${prefixedId} dev`,
  );
}

// No top-level execution; this module exposes initShop for callers.
