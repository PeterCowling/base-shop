// scripts/src/quickstart-shop.ts
// A convenience wrapper that scaffolds a shop, validates its environment,
// and starts the dev server in one step.

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
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
import { applyPageTemplate } from "./apply-page-template";
import { ensureRuntime } from "./runtime";
import { prompt, selectOption, selectProviders } from "./utils/prompts";
import {
  listDirNames,
  loadTemplateDefaults,
  loadPresetDefaults,
} from "./utils/templates";

interface Flags {
  id?: string;
  theme?: string;
  template?: string;
  payment?: string[];
  shipping?: string[];
  seed?: boolean;
  seedFull?: boolean;
  brand?: string;
  tokens?: string;
  autoEnv?: boolean;
  config?: string;
  pagesTemplate?: string;
  presets?: boolean;
  autoPlugins?: boolean;
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
      if (key === "seed-full") {
        flags.seedFull = true;
        continue;
      }
      if (key === "auto-env") {
        flags.autoEnv = true;
        continue;
      }
      if (key === "presets") {
        flags.presets = true;
        continue;
      }
      if (key === "auto-plugins") {
        flags.autoPlugins = true;
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
        case "pages-template":
          flags.pagesTemplate = val;
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
        case "config":
          flags.config = val;
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
  let config: Partial<CreateShopOptions> & { id?: string } = {};
  if (args.config) {
    try {
      const raw = readFileSync(args.config, "utf8");
      config = JSON.parse(raw);
    } catch (err) {
      console.error("Failed to load config file:", (err as Error).message);
      process.exit(1);
    }
  }

  let shopId = args.id ?? (config.id as string | undefined);
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
    join(process.cwd(), "packages", "themes")
  );
  let theme = args.theme ?? (config.theme as string | undefined);
  if (!theme) {
    theme = await selectOption(
      "theme",
      themes,
      Math.max(themes.indexOf("base"), 0)
    );
  }

  const templates = listDirNames(
    join(process.cwd(), "packages")
  ).filter((n) => n.startsWith("template-"));
  let template = args.template ?? (config.template as string | undefined);
  if (!template) {
    template = await selectOption(
      "template",
      templates,
      Math.max(templates.indexOf("template-app"), 0)
    );
  }

  const templateDefaults = loadTemplateDefaults(template);
  const presetDefaults = args.presets ? loadPresetDefaults() : {};
  const navItems =
    (config.navItems as CreateShopOptions["navItems"] | undefined) ??
    templateDefaults.navItems ??
    presetDefaults.navItems;
  const pages =
    (config.pages as CreateShopOptions["pages"] | undefined) ??
    templateDefaults.pages ??
    presetDefaults.pages;

  const paymentProviders = await listProviders("payment");
  let payment =
    args.payment ??
    (Array.isArray(config.payment) ? (config.payment as string[]) : undefined);

  const shippingProviders = await listProviders("shipping");
  let shipping =
    args.shipping ??
    (Array.isArray(config.shipping) ? (config.shipping as string[]) : undefined);

  if (args.autoPlugins) {
    payment = paymentProviders.map((p) => p.id);
    shipping = shippingProviders.map((p) => p.id);
  } else {
    if (!payment || payment.length === 0) {
      payment = await selectProviders(
        "payment providers",
        paymentProviders.map((p) => p.id)
      );
    }

    if (!shipping || shipping.length === 0) {
      shipping = await selectProviders(
        "shipping providers",
        shippingProviders.map((p) => p.id)
      );
    }
  }

  const {
    themeOverrides: configOverrides,
    type: configType,
    id: _id,
    theme: _t,
    template: _tp,
    payment: _p,
    shipping: _s,
    navItems: _n,
    pages: _pg,
    ...restConfig
  } = config as Record<string, unknown>;
  void _id;
  void _t;
  void _tp;
  void _p;
  void _s;
  void _n;
  void _pg;

  const themeOverrides: Record<string, string> =
    (configOverrides as Record<string, string> | undefined) ? { ...(configOverrides as Record<string, string>) } : {};

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
    ...restConfig,
    type: (configType as string | undefined) ?? "sale",
    theme,
    template,
    payment,
    shipping,
    ...(navItems && { navItems }),
    ...(pages && { pages }),
    ...(Object.keys(themeOverrides).length > 0 && { themeOverrides }),
  } as unknown as CreateShopOptions;

  const prefixedId = `shop-${shopId}`;
  try {
    await createShop(prefixedId, options);
  } catch (err) {
    console.error("Failed to create shop:", (err as Error).message);
    process.exit(1);
  }

  if (args.seedFull) {
    seedShop(prefixedId, undefined, true);
  } else if (args.seed) {
    seedShop(prefixedId);
  }

  const pageTemplate = args.pagesTemplate ?? (args.presets ? "default" : undefined);
  if (pageTemplate) {
    await applyPageTemplate(prefixedId, pageTemplate);
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

  if (args.presets) {
    spawnSync("pnpm", ["ts-node", "scripts/setup-ci.ts", shopId], {
      stdio: "inherit",
    });
  }

spawnSync("pnpm", ["--filter", `@apps/${prefixedId}`, "dev"], {
    stdio: "inherit",
  });
}

if (process.argv[1]?.includes("quickstart-shop")) {
  ensureRuntime();
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
