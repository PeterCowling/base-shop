// scripts/src/init-shop.ts
// Import platform helpers from the published package to avoid relying on
// TypeScript path aliases when executing via ts-node.
import { createShop, type CreateShopOptions } from "@acme/platform-core/createShop";

// Pull in the shop name validator from the platform core package.
import { validateShopName } from "@acme/platform-core/shops";

import { execSync, spawnSync } from "node:child_process";
import {
  readdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
} from "node:fs";
import { join } from "node:path";
// Validate the generated environment file for the new shop and throw if any
// required variables are missing or invalid.
import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline/promises";
import { validateShopEnv } from "@acme/platform-core/configurator";
// Import the provider listing utility via the defined subpath export.  This
// module aggregates built‑in payment and shipping providers as well as any
// plugins under packages/plugins.
import {
  listProviders,
  type ProviderMeta,
} from "@acme/platform-core/createShop/listProviders";

/**
 * Ensure that the runtime meets the minimum supported versions for Node.js and pnpm.
 * Exits the process with an error if requirements are not met.
 */
function ensureRuntime(): void {
  const nodeMajor = Number(process.version.replace(/^v/, "").split(".")[0]);
  if (nodeMajor < 20) {
    console.error(
      `Node.js v20 or later is required. Current version: ${process.version}`
    );
    process.exit(1);
  }

  let pnpmVersion: string;
  try {
    pnpmVersion = execSync("pnpm --version", { encoding: "utf8" }).trim();
  } catch {
    console.error(
      "Failed to determine pnpm version. pnpm v10 or later is required."
    );
    process.exit(1);
  }

  const pnpmMajor = Number(pnpmVersion.split(".")[0]);
  if (pnpmMajor < 10) {
    console.error(
      `pnpm v10 or later is required. Current version: ${pnpmVersion}`
    );
    process.exit(1);
  }
}

// Validate the runtime immediately when this script loads.
ensureRuntime();

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

interface PluginChoice extends ProviderMeta {
  packageName: string;
}

async function selectPlugins(
  plugins: PluginChoice[],
): Promise<PluginChoice[]> {
  if (!plugins.length) return [];
  console.log("Available plugins:");
  plugins.forEach((p, i) =>
    console.log(`  ${i + 1}) [ ] ${p.name}`)
  );
  const ans = await prompt(
    "Select plugins by number (comma-separated, empty for none): "
  );
  const selections = ans
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const chosen: PluginChoice[] = [];
  for (const sel of selections) {
    const idx = Number(sel) - 1;
    if (!Number.isNaN(idx) && plugins[idx]) {
      chosen.push(plugins[idx]);
    }
  }
  return chosen;
}

/**
 * Return a list of immediate child directory names within the given directory.
 * @param path Directory URL to list.
 */
function listDirNames(path: URL): string[] {
  return readdirSync(path, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
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
 * Main entry point for the init-shop CLI. Collects shop configuration
 * through prompts and calls createShop to scaffold a new shop. Validates
 * the resulting environment file and optionally sets up CI.
 */
async function main(): Promise<void> {
  const rawId = await prompt("Shop ID: ");
  let shopId: string;
  try {
    shopId = validateShopName(rawId);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
  const name = await prompt("Display name (optional): ");
  const logo = await promptUrl("Logo URL (optional): ");
  const contact = await promptEmail("Contact email (optional): ");
  const typeAns = await prompt("Shop type (sale or rental) [sale]: ", "sale");
  const type: "sale" | "rental" =
    typeAns.toLowerCase() === "rental" ? "rental" : "sale";
  const themes = listDirNames(
    new URL("../../packages/themes", import.meta.url)
  );
  const theme = await selectOption(
    "theme",
    themes,
    Math.max(themes.indexOf("base"), 0)
  );
  const templates = listDirNames(
    new URL("../../packages", import.meta.url)
  ).filter((n) => n.startsWith("template-"));
  const template = await selectOption(
    "template",
    templates,
    Math.max(templates.indexOf("template-app"), 0)
  );
  // Narrow the provider lists to the literal union types expected by the shop schema.  Casting here
  // preserves the specific string literals (e.g. "stripe", "paypal") rather than widening them to
  // plain strings.  This allows TypeScript to satisfy the CreateShopOptions constraints without
  // type errors.
  const paymentProviderMetas = await listProviders("payment");
  const paymentProviders = paymentProviderMetas.map((p) => p.id) as (
    | "stripe"
    | "paypal"
  )[];
  const payment = await selectProviders<"stripe" | "paypal">(
    "payment providers",
    paymentProviders
  );
  const shippingProviderMetas = await listProviders("shipping");
  const shippingProviders = shippingProviderMetas.map((p) => p.id) as (
    | "dhl"
    | "ups"
    | "premier-shipping"
  )[];
  const shipping = await selectProviders<"dhl" | "ups" | "premier-shipping">(
    "shipping providers",
    shippingProviders
  );

  // Detect plugins
  const pluginDirs = listDirNames(
    new URL("../../packages/plugins", import.meta.url)
  );
  const pluginChoices: PluginChoice[] = [];
  for (const dir of pluginDirs) {
    try {
      const mod = await import(`../../packages/plugins/${dir}/index.ts`);
      const plugin = mod.default ?? {};
      const pkg = JSON.parse(
        readFileSync(
          new URL(`../../packages/plugins/${dir}/package.json`, import.meta.url),
          "utf8",
        ),
      ) as { name: string };
      const prefix = String(plugin.id ?? dir)
        .replace(/-/g, "_")
        .toUpperCase();
      const env = plugin.defaultConfig
        ? Object.keys(plugin.defaultConfig).map((k: string) =>
            `${prefix}_${k.replace(/([A-Z])/g, "_$1").toUpperCase()}`,
          )
        : [];
      pluginChoices.push({
        id: plugin.id ?? dir,
        name: plugin.name ?? dir,
        env,
        packageName: pkg.name,
      });
    } catch {
      // ignore invalid plugins
    }
  }
  const selectedPlugins = await selectPlugins(pluginChoices);
  const pluginEnv: Record<string, string> = {};
  for (const p of selectedPlugins) {
    for (const env of p.env) {
      pluginEnv[env] = await prompt(`${p.name} - ${env}: `);
    }
  }

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
  };
  const options = rawOptions as unknown as CreateShopOptions;

  const prefixedId = `shop-${shopId}`;
  try {
    await createShop(prefixedId, options);
  } catch (err) {
    console.error("Failed to create shop:", (err as Error).message);
    process.exit(1);
  }

  // Inject selected plugins into package.json and .env
  const appDir = join("apps", prefixedId);
  try {
    const pkgPath = join(appDir, "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as {
      dependencies?: Record<string, string>;
    };
    pkg.dependencies ??= {};
    for (const p of selectedPlugins) {
      pkg.dependencies[p.packageName] = "workspace:*";
    }
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  } catch {
    // ignore package.json errors
  }

  try {
    const envPath = join(appDir, ".env");
    let env = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
    for (const [k, v] of Object.entries(pluginEnv)) {
      env += `${k}=${v}\n`;
    }
    writeFileSync(envPath, env);
  } catch {
    // ignore env file errors
  }

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

  console.log(
    `\nNext steps:\n  - Review apps/${prefixedId}/.env\n  - Review data/shops/${prefixedId}/shop.json\n  - Use the CMS Page Builder to lay out your pages\n  - Run: pnpm --filter @apps/${prefixedId} dev`
  );
}

// Execute the CLI.
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
