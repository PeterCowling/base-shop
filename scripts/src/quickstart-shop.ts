// scripts/src/quickstart-shop.ts
// A convenience wrapper that scaffolds a shop, validates its environment,
// and starts the dev server in one step.

import { execSync, spawnSync } from "node:child_process";
import {
  readdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
} from "node:fs";
import { join } from "node:path";
import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline/promises";
import {
  createShop,
  loadBaseTokens,
  type CreateShopOptions,
} from "@acme/platform-core/createShop";
import { validateShopName } from "@acme/platform-core/shops";
import {
  validateShopEnv,
  readEnvFile,
} from "@acme/platform-core/configurator";
import { listProviders } from "@acme/platform-core/createShop/listProviders";
import { seedShop } from "./seedShop";
import { generateThemeTokens } from "./generate-theme";

/** Ensure Node.js and pnpm meet minimum requirements. */
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

ensureRuntime();

/** Prompt helper returning the user's input or the default value. */
async function prompt(question: string, def = ""): Promise<string> {
  const rl = readline.createInterface({ input, output });
  const answer = (await rl.question(question)).trim();
  rl.close();
  return answer || def;
}

/** Present a list of options and return the selected value. */
async function selectOption(
  label: string,
  options: readonly string[],
  defIndex = 0
): Promise<string> {
  console.log(`Available ${label}:`);
  options.forEach((p, i) => console.log(`  ${i + 1}) ${p}`));
  while (true) {
    const ans = await prompt(
      `Select ${label} by number [${defIndex + 1}]: `,
      String(defIndex + 1)
    );
    const idx = Number(ans) - 1;
    if (!Number.isNaN(idx) && options[idx]) return options[idx];
    console.error(`Invalid ${label} selection.`);
  }
}

/** Present a list of providers and return selected providers. */
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
    if (!Number.isNaN(idx) && providers[idx]) result.add(providers[idx]);
  }
  return Array.from(result);
}

/** List immediate child directory names of a given path. */
function listDirNames(path: URL): string[] {
  return readdirSync(path, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

/** Load default navItems and pages from the template's shop.json if available. */
function loadTemplateDefaults(
  template: string,
): {
  navItems?: CreateShopOptions["navItems"];
  pages?: CreateShopOptions["pages"];
} {
  try {
    const raw = readFileSync(
      new URL(`../../packages/${template}/shop.json`, import.meta.url),
      "utf8",
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

interface Flags {
  id?: string;
  theme?: string;
  template?: string;
  payment?: string[];
  shipping?: string[];
  seed?: boolean;
  brand?: string;
  tokens?: string;
  autoEnv?: boolean;
}

function parseArgs(argv: string[]): Flags {
  const flags: Flags = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const [key, value] = arg.slice(2).split("=");
      if (key === "seed") {
        flags.seed = true;
        continue;
      }
      if (key === "auto-env") {
        flags.autoEnv = true;
        continue;
      }
      const val = value ?? argv[++i];
      switch (key) {
        case "id":
        case "shop":
          flags.id = val;
          break;
        case "theme":
          flags.theme = val;
          break;
        case "template":
          flags.template = val;
          break;
        case "payment":
          flags.payment = val ? val.split(",").map((s) => s.trim()) : [];
          break;
        case "shipping":
          flags.shipping = val ? val.split(",").map((s) => s.trim()) : [];
          break;
        case "brand":
          flags.brand = val;
          break;
        case "tokens":
          flags.tokens = val;
          break;
        default:
          console.error(`Unknown option --${key}`);
          process.exit(1);
      }
    } else if (!flags.id) {
      flags.id = arg;
    }
  }
  return flags;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  let shopId = args.id;
  if (!shopId) {
    shopId = await prompt("Shop ID: ");
  }
  try {
    shopId = validateShopName(shopId);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }

  const themes = listDirNames(
    new URL("../../packages/themes", import.meta.url)
  );
  let theme = args.theme;
  if (!theme) {
    theme = await selectOption(
      "theme",
      themes,
      Math.max(themes.indexOf("base"), 0)
    );
  }

  const templates = listDirNames(
    new URL("../../packages", import.meta.url)
  ).filter((n) => n.startsWith("template-"));
  let template = args.template;
  if (!template) {
    template = await selectOption(
      "template",
      templates,
      Math.max(templates.indexOf("template-app"), 0)
    );
  }

  const { navItems, pages } = loadTemplateDefaults(template);

  const paymentProviders = await listProviders("payment");
  let payment = args.payment;
  if (!payment || payment.length === 0) {
    payment = await selectProviders(
      "payment providers",
      paymentProviders.map((p) => p.id)
    );
  }

  const shippingProviders = await listProviders("shipping");
  let shipping = args.shipping;
  if (!shipping || shipping.length === 0) {
    shipping = await selectProviders(
      "shipping providers",
      shippingProviders.map((p) => p.id)
    );
  }

  const themeOverrides: Record<string, string> = {};
  if (args.brand) {
    try {
      const base = loadBaseTokens();
      const tokens = generateThemeTokens(args.brand);
      for (const [k, v] of Object.entries(tokens)) {
        if (base[k] !== v) themeOverrides[k] = v;
      }
    } catch {
      console.error("Invalid color format.");
    }
  }
  if (args.tokens) {
    try {
      const content = readFileSync(args.tokens, "utf8");
      const json = JSON.parse(content) as Record<string, string>;
      Object.assign(themeOverrides, json);
    } catch {
      console.error("Failed to load token overrides from file.");
    }
  }

  const options = {
    type: "sale",
    theme,
    template,
    payment,
    shipping,
    ...(navItems && { navItems }),
    ...(pages && { pages }),
  } as unknown as CreateShopOptions;

  if (Object.keys(themeOverrides).length > 0) {
    options.themeOverrides = themeOverrides;
  }

  const prefixedId = `shop-${shopId}`;
  try {
    await createShop(prefixedId, options);
  } catch (err) {
    console.error("Failed to create shop:", (err as Error).message);
    process.exit(1);
  }

  if (args.seed) {
    seedShop(prefixedId);
  }

  if (args.autoEnv) {
    const envVars = new Set<string>();
    const providerMap = new Map<string, readonly string[]>();
    paymentProviders.forEach((p) => providerMap.set(p.id, p.envVars));
    shippingProviders.forEach((p) => providerMap.set(p.id, p.envVars));
    for (const id of [...payment, ...shipping]) {
      const vars = providerMap.get(id) ?? [];
      vars.forEach((v) => envVars.add(v));
    }
    const envPath = join("apps", prefixedId, ".env");
    let existing: Record<string, string> = {};
    if (existsSync(envPath)) {
      existing = readEnvFile(envPath);
    }
    for (const key of envVars) {
      if (!existing[key]) {
        existing[key] = process.env[key] ?? `TODO_${key}`;
      }
    }
    writeFileSync(
      envPath,
      Object.entries(existing)
        .map(([k, v]) => `${k}=${v}`)
        .join("\n") + "\n",
    );
  }

  try {
    validateShopEnv(prefixedId);
    console.log("Environment variables look valid.\n");
  } catch (err) {
    console.error("\nEnvironment validation failed:\n", err);
  }

  spawnSync("pnpm", ["--filter", `@apps/${prefixedId}`, "dev"], {
    stdio: "inherit",
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
