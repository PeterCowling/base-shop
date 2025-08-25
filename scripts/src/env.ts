// scripts/src/env.ts
// Import platform helpers from the published package to avoid relying on
// TypeScript path aliases when executing via ts-node.
import {
  createShop,
  loadBaseTokens,
  type CreateShopOptions,
} from "@acme/platform-core/createShop";

// Pull in the shop name validator from the platform core package.
import { validateShopName } from "@acme/platform-core/shops";

import { spawnSync } from "node:child_process";
import { readdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
// Validate the generated environment file for the new shop and throw if any
// required variables are missing or invalid.
import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline/promises";
import {
  validateShopEnv,
  readEnvFile,
  pluginEnvVars,
} from "@acme/platform-core/configurator";
import { seedShop } from "./seedShop";
// Import the provider listing utility via the defined subpath export.  This
// module aggregates built‑in payment and shipping providers as well as any
// plugins under packages/plugins.
import { listProviders } from "@acme/platform-core/createShop/listProviders";
import { generateThemeTokens } from "./generate-theme";

const seed = process.argv.includes("--seed");
const useDefaults = process.argv.includes("--defaults");
const autoEnv = process.argv.includes("--auto-env");
const configIndex = process.argv.indexOf("--config");
const configPath = configIndex !== -1 ? process.argv[configIndex + 1] : undefined;

interface InitConfig extends Partial<CreateShopOptions> {
  id?: string;
  name?: string;
  logo?: string;
  contact?: string;
  type?: "sale" | "rental";
  payment?: ("stripe" | "paypal")[];
  shipping?: ("dhl" | "ups" | "premier-shipping")[];
  plugins?: string[];
  env?: Record<string, string>;
}

let config: InitConfig = {};
if (configPath) {
  try {
    const raw = readFileSync(configPath, "utf8");
    config = JSON.parse(raw) as InitConfig;
  } catch {
    console.error("Failed to load config file.");
    process.exit(1);
  }
}

/**
 * Prompt the user for input. If the user does not provide an answer, return the default value.
 * @param question Text displayed to the user.
 * @param def Optional default value returned when the user provides no answer.
 */
async function prompt(question: string, def = ""): Promise<string> {
  const rl = readline.createInterface({ input, output });
  const answer = (await rl.question(question)).trim();
  rl.close();
  return answer || def;
}

/**
 * Present a list of available providers to the user and return the selected providers.
 * This helper is generic so the returned array preserves the literal types of the
 * provided options.  For example, if `providers` is typed as `("stripe" | "paypal")[]`
 * then the result will be inferred as the same union rather than `string[]`.
 *
 * @param label Label describing the provider category.
 * @param providers Array of provider identifiers.
 */
async function selectProviders<T extends string>(
  label: string,
  providers: readonly T[]
): Promise<T[]> {
  console.log(`Available ${label}:`);
  providers.forEach((p, i) => console.log(`  ${i + 1}) ${p}`));
  const ans = await prompt(
    `Select ${label} by number (comma-separated, empty for none): `
  );
  const selections = ans
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const result = new Set<T>();
  for (const sel of selections) {
    const idx = Number(sel) - 1;
    if (!Number.isNaN(idx) && providers[idx]) {
      result.add(providers[idx]);
    }
  }
  return Array.from(result);
}

/**
 * Return a list of immediate child directory names within the given directory.
 * @param path Directory URL to list.
 */
function listDirNames(path: string): string[] {
  return readdirSync(path, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

interface PluginMeta {
  id: string;
  packageName?: string;
  envVars: readonly string[];
}

function listPlugins(root: string): PluginMeta[] {
  const pluginsDir = join(root, "packages", "plugins");
  try {
    return readdirSync(pluginsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => {
        let packageName: string | undefined;
        try {
          const pkgRaw = readFileSync(
            join(pluginsDir, d.name, "package.json"),
            "utf8",
          );
          packageName = JSON.parse(pkgRaw).name;
        } catch {}
        return {
          id: d.name,
          packageName,
          envVars: pluginEnvVars[d.name] ?? [],
        };
      });
  } catch {
    return [];
  }
}

/**
 * Present a list of options to the user and return the selected option.
 * @param label Label describing the option category.
 * @param options Array of option identifiers.
 * @param defIndex Index of the default option (zero-based).
 */
async function selectOption(
  label: string,
  options: readonly string[],
  defIndex = 0
): Promise<string> {
  console.log(`Available ${label}:`);
  options.forEach((p, i) => console.log(`  ${i + 1}) ${p}`));
  // Keep prompting until a valid option is chosen.
  while (true) {
    const ans = await prompt(
      `Select ${label} by number [${defIndex + 1}]: `,
      String(defIndex + 1)
    );
    const idx = Number(ans) - 1;
    if (!Number.isNaN(idx) && options[idx]) {
      return options[idx];
    }
    console.error(`Invalid ${label} selection.`);
  }
}

/**
 * Prompt for a URL value. Returns undefined if the user enters nothing.
 * Continues prompting until a valid URL is provided.
 * @param question Text displayed to the user.
 */
async function promptUrl(question: string): Promise<string | undefined> {
  while (true) {
    const ans = await prompt(question);
    if (!ans) return undefined;
    try {
      new URL(ans);
      return ans;
    } catch {
      console.error("Invalid URL.");
    }
  }
}

/**
 * Prompt for an email value. Returns undefined if the user enters nothing.
 * Continues prompting until a valid email address is provided.
 * @param question Text displayed to the user.
 */
async function promptEmail(question: string): Promise<string | undefined> {
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  while (true) {
    const ans = await prompt(question);
    if (!ans) return undefined;
    if (emailRe.test(ans)) {
      return ans;
    }
    console.error("Invalid email address.");
  }
}

/**
 * Collect a simple flat list of navigation items from the user.
 * Prompts for a label and URL until a blank label is entered.
 */
async function promptNavItems(): Promise<CreateShopOptions["navItems"]> {
  const items: CreateShopOptions["navItems"] = [];
  while (true) {
    const label = await prompt("Nav label (leave empty to finish): ");
    if (!label) break;
    const url = await prompt("Nav URL: ");
    items.push({ label, url });
  }
  return items;
}

/**
 * Gather basic page entries from the user. Each page requires a slug and
 * title. Components are left empty so the CMS page builder can populate
 * them later.
 */
async function promptPages(): Promise<CreateShopOptions["pages"]> {
  const pages: CreateShopOptions["pages"] = [];
  while (true) {
    const slug = await prompt("Page slug (leave empty to finish): ");
    if (!slug) break;
    const title = await prompt("Page title: ");
    pages.push({ slug, title: { en: title }, components: [] });
  }
  return pages;
}

/**
 * Prompt for theme token overrides in key=value form. Input a blank line to
 * finish. Invalid entries are skipped.
 */
async function promptThemeOverrides(): Promise<Record<string, string>> {
  const overrides: Record<string, string> = {};
  const argv = process.argv.slice(2);
  const brandIndex = argv.indexOf("--brand");
  const tokensIndex = argv.indexOf("--tokens");

  const brandArg = brandIndex !== -1 ? argv[brandIndex + 1] : undefined;
  const tokensFile = tokensIndex !== -1 ? argv[tokensIndex + 1] : undefined;

  if (brandArg || tokensFile) {
    if (brandArg) {
      try {
        const base = loadBaseTokens();
        const tokens = generateThemeTokens(brandArg);
        for (const [k, v] of Object.entries(tokens)) {
          if (base[k] !== v) overrides[k] = v;
        }
      } catch {
        console.error("Invalid color format.");
      }
    }
    if (tokensFile) {
      try {
        const content = readFileSync(tokensFile, "utf8");
        const json = JSON.parse(content) as Record<string, string>;
        Object.assign(overrides, json);
      } catch {
        console.error("Failed to load token overrides from file.");
      }
    }
    return overrides;
  }

  const brand = await prompt(
    "Primary brand color (hex, blank to skip): "
  );
  if (brand) {
    try {
      const base = loadBaseTokens();
      const tokens = generateThemeTokens(brand);
      for (const [k, v] of Object.entries(tokens)) {
        if (base[k] !== v) overrides[k] = v;
      }
    } catch {
      console.error("Invalid color format.");
    }
  }
  while (true) {
    const entry = await prompt(
      "Theme token override (key=value, blank to finish): "
    );
    if (!entry) break;
    const [key, value] = entry.split("=").map((s) => s.trim());
    if (key && value) {
      overrides[key] = value;
    } else {
      console.error("Invalid token override format.");
    }
  }
  return overrides;
}

/**
 * Load default navItems and pages from a template's shop.json if present.
 * @param root Repository root directory.
 * @param template Selected template name.
 */
function loadTemplateDefaults(
  root: string,
  template: string,
): {
  navItems?: CreateShopOptions["navItems"];
  pages?: CreateShopOptions["pages"];
} {
  try {
    const raw = readFileSync(join(root, "packages", template, "shop.json"), "utf8");
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

/**
 * Main entry point for the init-shop CLI. Collects shop configuration
 * through prompts and calls createShop to scaffold a new shop. Validates
 * the resulting environment file and optionally sets up CI.
 */
export async function initShop(): Promise<void> {
  const rawId = config.id ?? (await prompt("Shop ID: "));
  let shopId: string;
  try {
    shopId = validateShopName(rawId);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
  const prefixedId = `shop-${shopId}`;
  const name = config.name ?? (await prompt("Display name (optional): "));
  const logo = config.logo ?? (await promptUrl("Logo URL (optional): "));
  const contact =
    config.contact ?? (await promptEmail("Contact email (optional): "));
  const typeAns =
    config.type ?? (await prompt("Shop type (sale or rental) [sale]: ", "sale"));
  const type: "sale" | "rental" =
    String(typeAns).toLowerCase() === "rental" ? "rental" : "sale";
  const rootDir = process.cwd();
  const themes = listDirNames(join(rootDir, "packages", "themes"));
  const theme =
    config.theme && themes.includes(config.theme)
      ? config.theme
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
      : await selectOption(
          "template",
          templates,
          Math.max(templates.indexOf("template-app"), 0)
        );
  // Narrow the provider lists to the literal union types expected by the shop schema.  Casting here
  // preserves the specific string literals (e.g. "stripe", "paypal") rather than widening them to
  // plain strings.  This allows TypeScript to satisfy the CreateShopOptions constraints without
  // type errors.
  const paymentMeta = (await listProviders("payment")) as (
    | { id: "stripe"; name: string; envVars: readonly string[] }
    | { id: "paypal"; name: string; envVars: readonly string[] }
  )[];
  const payment =
    Array.isArray(config.payment) &&
    config.payment.every((p) => paymentMeta.map((m) => m.id).includes(p))
      ? (config.payment as ("stripe" | "paypal")[])
      : await selectProviders<"stripe" | "paypal">(
          "payment providers",
          paymentMeta.map((p) => p.id) as ("stripe" | "paypal")[],
        );
  const shippingMeta = (await listProviders("shipping")) as (
    | { id: "dhl"; name: string; envVars: readonly string[] }
    | { id: "ups"; name: string; envVars: readonly string[] }
    | { id: "premier-shipping"; name: string; envVars: readonly string[] }
  )[];
  const shipping =
    Array.isArray(config.shipping) &&
    config.shipping.every((s) => shippingMeta.map((m) => m.id).includes(s))
      ? (config.shipping as ("dhl" | "ups" | "premier-shipping")[])
      : await selectProviders<"dhl" | "ups" | "premier-shipping">(
          "shipping providers",
          shippingMeta.map((p) => p.id) as (
            | "dhl"
            | "ups"
            | "premier-shipping"
          )[],
        );
  const allPluginMeta = listPlugins(rootDir);
  const pluginMap = new Map<
    string,
    { packageName?: string; envVars: readonly string[] }
  >();
  for (const m of [...paymentMeta, ...shippingMeta, ...allPluginMeta]) {
    pluginMap.set(m.id, {
      packageName: "packageName" in m ? m.packageName : undefined,
      envVars: m.envVars,
    });
  }
  const selectedPlugins = new Set<string>([...payment, ...shipping]);
  const optionalPlugins = allPluginMeta.filter((p) => !selectedPlugins.has(p.id));
  let extra: string[] = [];
  if (config.plugins) {
    extra = config.plugins;
    extra.forEach((id) => selectedPlugins.add(id));
  } else if (optionalPlugins.length) {
    extra = await selectProviders(
      "plugins",
      optionalPlugins.map((p) => p.id),
    );
    extra.forEach((id) => selectedPlugins.add(id));
  }
  const envVars: Record<string, string> = { ...(config.env ?? {}) };
  for (const id of selectedPlugins) {
    const vars = pluginMap.get(id)?.envVars ?? [];
    for (const key of vars) {
      if (envVars[key] !== undefined) continue;
      if (autoEnv) {
        envVars[key] = `TODO_${key}`;
      } else {
        envVars[key] = await prompt(`${key}: `, "");
      }
    }
  }
  const templateDefaults = loadTemplateDefaults(rootDir, template);
  const navItems =
    config.navItems ??
    (useDefaults && templateDefaults.navItems
      ? templateDefaults.navItems
      : await promptNavItems());
  const pages =
    config.pages ??
    (useDefaults && templateDefaults.pages
      ? templateDefaults.pages
      : await promptPages());
  const themeOverrides =
    config.themeOverrides ?? (await promptThemeOverrides());
  const ciAns = await prompt("Setup CI workflow? (y/N): ");

  // Assemble the options object using the collected values.  The CreateShopOptions
  // interface from the platform core package defines many additional fields
  // (such as navItems, pages, tax, and themeOverrides) which we intentionally
  // omit here.  To satisfy the type checker without providing those defaults,
  // we construct the object and then cast it to CreateShopOptions.  This
  // preserves strong typing while deferring uninitialized fields to the
  // platform core implementation.
  const rawOptions = {
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
    if (seed) {
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

  if (validationError) {
    console.error("\nEnvironment validation failed:\n", validationError);
  } else {
    console.log("\nEnvironment variables look valid.");
  }

  if (autoEnv) {
    console.warn(
      `\nWARNING: placeholder environment variables were written to apps/${prefixedId}/.env. Replace any TODO_* values with real secrets before deployment.`,
    );
  }

  console.log(
    `\nNext steps:\n  - Review apps/${prefixedId}/.env\n  - Review data/shops/${prefixedId}/shop.json\n  - Use the CMS Page Builder to lay out your pages\n  - Run: pnpm --filter @apps/${prefixedId} dev`
  );
}

// No top-level execution; this module exposes initShop for callers.
