// scripts/src/init-shop.ts
// Import createShop directly from the workspace source.  We use a relative
// path because the `@acme/*` aliases are not available in this pared‑down
// environment.  Importing from the compiled package entry point is not
// necessary here since TypeScript will resolve the .ts file directly.
import { execSync, spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import {
  createShop,
  type CreateShopOptions,
} from "../../packages/platform-core/src/createShop";

// Define a minimal shop name validator locally instead of importing from
// `@acme/lib`.  The original implementation trims the input and ensures
// only alphanumeric, underscore, or hyphen characters are present.  A
// descriptive error is thrown when the name is invalid.
const SHOP_NAME_RE = /^[a-z0-9_-]+$/i;
function validateShopName(shop: string): string {
  const normalized = shop.trim();
  if (!SHOP_NAME_RE.test(normalized)) {
    throw new Error(`Invalid shop name: ${shop}`);
  }
  return normalized;
}
// Pull in the environment validator from the platform core source directly.  A
// relative import is used here because the `@acme/*` path aliases are not
// available in this environment.  The imported function validates the
// generated `.env` file for the newly created shop and will throw if any
// required variables are missing or invalid.
import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline/promises";
import { validateShopEnv } from "../../packages/platform-core/src/configurator";
// Import the provider listing utility via the defined subpath export.  This
// module aggregates built‑in payment and shipping providers as well as any
// plugins under packages/plugins.
import { listProviders } from "../../packages/platform-core/src/createShop/listProviders";

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
 * @param label Label describing the provider category.
 * @param providers Array of provider identifiers.
 */
async function selectProviders(
  label: string,
  providers: readonly string[]
): Promise<string[]> {
  console.log(`Available ${label}:`);
  providers.forEach((p, i) => console.log(`  ${i + 1}) ${p}`));
  const ans = await prompt(
    `Select ${label} by number (comma-separated, empty for none): `
  );
  const selections = ans
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const result = new Set<string>();
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
  const paymentProviders = await listProviders("payment");
  const payment = await selectProviders("payment providers", paymentProviders);
  const shippingProviders = await listProviders("shipping");
  const shipping = await selectProviders(
    "shipping providers",
    shippingProviders
  );
  const ciAns = await prompt("Setup CI workflow? (y/N): ");

  const options: CreateShopOptions = {
    ...(name && { name }),
    ...(logo && { logo }),
    ...(contact && { contactInfo: contact }),
    type,
    theme,
    template,
    payment,
    shipping,
  };

  const prefixedId = `shop-${shopId}`;
  try {
    await createShop(prefixedId, options);
  } catch (err) {
    console.error("Failed to create shop:", (err as Error).message);
    process.exit(1);
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
