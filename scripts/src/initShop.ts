/* i18n-exempt file -- OPS-3400 CLI-only shop bootstrap prompts; developer-facing copy [ttl=2026-12-31] */
import { validateShopName } from "@acme/platform-core/shops";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
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
import { createShopAndSeed } from "./shop/init";
import type { CreateShopOptions } from "@acme/platform-core/createShop";
import { listDirNames, loadTemplateDefaults } from "./utils/templates";
import { initShopArgs } from "./cli/initShopArgs";
import { collectPluginEnv } from "./env/collectPluginEnv";
import { writeEnvFiles } from "./env/writeEnvFiles";

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
    paymentMeta,
    shippingMeta,
    allPluginMeta,
  } = await initShopArgs();

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
  const logoCfg = config.logo;
  const logo =
    (typeof logoCfg === "string"
      ? logoCfg
      : logoCfg && typeof logoCfg === "object"
        ? logoCfg["desktop-landscape"] || Object.values(logoCfg)[0]
        : undefined) ??
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

  const payment = Array.isArray(config.payment)
    ? (config.payment as ("stripe" | "paypal")[])
    : skipPrompts
      ? []
      : await selectProviders<"stripe" | "paypal">(
          "payment providers",
          paymentMeta.map((p) => p.id) as ("stripe" | "paypal")[],
        );
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
          )[],
        );

  const { selectedPlugins, pluginMap, envVars, requiredEnvKeys, unusedEnvFileKeys } =
    await collectPluginEnv({
      payment,
      shipping,
      paymentMeta,
      shippingMeta,
      allPluginMeta,
      configPlugins: Array.isArray(config.plugins) ? config.plugins : [],
      envFileVars,
      vaultCmd,
      autoEnv,
      skipPrompts,
    });

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
  const analyticsAns =
    typeof config.analyticsEnabled === "boolean"
      ? config.analyticsEnabled
      : skipPrompts
        ? false
        : (await prompt("Enable analytics? (y/N): ", "n")).toLowerCase().startsWith("y");
  const leadAns =
    typeof config.leadCaptureEnabled === "boolean"
      ? config.leadCaptureEnabled
      : skipPrompts
        ? false
        : (await prompt("Enable lead capture forwarder? (y/N): ", "n")).toLowerCase().startsWith("y");
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

  const { id: _id, plugins: _plugins, setupCI: _setupCI, ...restConfig } =
    config as Record<string, unknown>;
  void _id;
  void _plugins;
  void _setupCI;
  const rawOptions = {
    ...restConfig,
    ...(name && { name }),
    ...(logo && { logo: { "desktop-landscape": logo } }),
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

  // Persist default settings toggles
  try {
    const settingsPath = join("data", "shops", prefixedId, "settings.json");
    const settingsRaw = await import("node:fs").then((fs) =>
      fs.readFileSync(settingsPath, "utf8"),
    );
    const settings = JSON.parse(settingsRaw);
    if (!settings.analytics) settings.analytics = {};
    settings.analytics.enabled = analyticsAns;
    if (!settings.leadCapture) settings.leadCapture = {};
    settings.leadCapture.enabled = leadAns;
    await import("node:fs").then((fs) =>
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2)),
    );
  } catch {
    /* ignore */
  }

  writeEnvFiles({
    prefixedId,
    envVars,
    requiredEnvKeys,
    unusedEnvFileKeys,
    envFilePath,
    autoEnv,
    skipPrompts,
  });

  if (ciAns.toLowerCase().startsWith("y")) {
    spawnSync("pnpm", ["ts-node", "scripts/src/setup-ci.ts", shopId], {
      stdio: "inherit",
    });
  }

  console.log(
    `\nNext steps:\n  - Review apps/${prefixedId}/.env\n  - Review data/shops/${prefixedId}/shop.json\n  - Use the CMS Page Builder to lay out your pages\n  - Run: pnpm --filter @apps/${prefixedId} dev`,
  );
}
