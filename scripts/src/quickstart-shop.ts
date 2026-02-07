// scripts/src/quickstart-shop.ts
// A convenience wrapper that scaffolds a shop, validates its environment,
// and starts the dev server in one step.

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { validateShopEnv } from "@acme/platform-core/configurator";
import { type CreateShopOptions,loadBaseTokens } from "@acme/platform-core/createShop";
import { validateShopName } from "@acme/platform-core/shops";

import { parseQuickstartArgs } from "./cli/parseQuickstartArgs";
import { quickstartPrompts } from "./cli/quickstartPrompts";
import { generateThemeTokens } from "./generate-theme";
import { ensureRuntime } from "./runtime";
import { createShopAndSeed } from "./shop/createShopAndSeed";
import { prompt } from "./utils/prompts";

async function main(): Promise<void> {
  const args = parseQuickstartArgs(process.argv.slice(2));
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

  const promptResult = await quickstartPrompts(args, config);
  const {
    theme,
    template,
    payment,
    shipping,
    navItems,
    pages,
    pageTemplate,
    paymentProviders,
    shippingProviders,
  } = promptResult;

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
    (configOverrides as Record<string, string> | undefined)
      ? { ...(configOverrides as Record<string, string>) }
      : {};

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

  const buildResult = spawnSync("pnpm", ["-r", "build"], {
    stdio: "inherit",
  });

  if (buildResult.error) {
    console.error("Failed to run pnpm -r build:", buildResult.error.message);
    process.exit(1);
  }

  if (buildResult.status !== 0) {
    process.exit(buildResult.status ?? 1);
  }

  try {
    await createShopAndSeed(
      prefixedId,
      options,
      args,
      pageTemplate,
      paymentProviders,
      shippingProviders,
    );
  } catch (err) {
    console.error("Failed to create shop:", (err as Error).message);
    process.exit(1);
  }

  try {
    validateShopEnv(prefixedId);
    console.log("Environment variables look valid.\n");
  } catch (err) {
    console.error("\nEnvironment validation failed:\n", err);
  }

  if (args.presets) {
    spawnSync("pnpm", ["ts-node", "scripts/src/setup-ci.ts", shopId!], {
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
