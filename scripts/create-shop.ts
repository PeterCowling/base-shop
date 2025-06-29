// scripts/create-shop.ts
// Import directly to avoid relying on tsconfig path aliases when using ts-node.
import { spawnSync } from "child_process";
import { randomBytes } from "crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "fs";
import readline from "node:readline";
import { join } from "path";
import { ulid } from "ulid";
import { LOCALES } from "../packages/types/src/constants";

/* ────────────────────────────────────────────────────────── *
 * Command-line parsing                                       *
 * ────────────────────────────────────────────────────────── */

interface Options {
  type: "sale" | "rental";
  theme: string;
  template: string;
  payment: string[];
  shipping: string[];
}

function parseArgs(argv: string[]): [string, Options, boolean] {
  const id = argv[0];
  if (!id) {
    console.error(
      "Usage: pnpm create-shop <id> [--type=sale|rental] [--theme=name] [--payment=p1,p2] [--shipping=s1,s2] [--template=name]"
    );
    process.exit(1);
  }

  const opts: Options = {
    type: "sale",
    theme: "base",
    template: "template-app",
    payment: [],
    shipping: [],
  };

  let themeProvided = false;

  argv.slice(1).forEach((arg) => {
    if (!arg.startsWith("--")) return;
    const [key, val = ""] = arg.slice(2).split("=");
    switch (key) {
      case "type":
        if (val === "sale" || val === "rental") opts.type = val;
        else {
          console.error("--type must be 'sale' or 'rental'");
          process.exit(1);
        }
        break;
      case "theme":
        opts.theme = val || opts.theme;
        themeProvided = true;

        break;
      case "template":
        opts.template = val || opts.template;
        break;
      case "payment":
        opts.payment = val.split(",").filter(Boolean);
        break;
      case "shipping":
        opts.shipping = val.split(",").filter(Boolean);
        break;
      default:
        console.error(`Unknown option ${key}`);
        process.exit(1);
    }
  });

  return [id, opts, themeProvided];
}

const [shopId, options, themeProvided] = parseArgs(process.argv.slice(2));

async function ensureTheme() {
  if (!themeProvided && process.stdin.isTTY) {
    const themesDir = join("packages", "themes");
    const themes = readdirSync(themesDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    await new Promise<void>((resolve) => {
      rl.question(`Select theme [${themes.join(", ")}]: `, (ans) => {
        if (themes.includes(ans)) options.theme = ans;
        rl.close();
        resolve();
      });
    });
  }
}

await ensureTheme();

/* ────────────────────────────────────────────────────────── *
 * File-system locations                                      *
 * ────────────────────────────────────────────────────────── */

const templateApp = join("packages", options.template);
const newApp = join("apps", shopId);

if (!existsSync(join("packages", "themes", options.theme))) {
  console.error(`Theme '${options.theme}' not found in packages/themes`);
  process.exit(1);
}
if (!existsSync(templateApp)) {
  console.error(`Template '${options.template}' not found in packages`);
  process.exit(1);
}

/* ────────────────────────────────────────────────────────── *
 * Copy template → new app                                    *
 * ────────────────────────────────────────────────────────── */

cpSync(templateApp, newApp, {
  recursive: true,
  filter: (src) => !/node_modules/.test(src),
});

/* ────────────────────────────────────────────────────────── *
 * package.json patching                                      *
 * ────────────────────────────────────────────────────────── */

interface PackageJSON {
  name: string;
  dependencies?: Record<string, string>;
  [key: string]: unknown;
}

const pkgPath = join(newApp, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as PackageJSON;

/* --- guarantee `dependencies` exists to silence TS 18048 --- */
pkg.dependencies ??= {}; // now definitely Record<string, string>

Object.keys(pkg.dependencies).forEach((k) => {
  if (k.startsWith("@themes/")) delete pkg.dependencies![k];
});
pkg.dependencies[`@themes/${options.theme}`] = "workspace:*";
pkg.name = `@apps/shop-${shopId}`;

writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

/* ────────────────────────────────────────────────────────── *
 * Swap the global CSS theme import                           *
 * ────────────────────────────────────────────────────────── */

const cssPath = join(newApp, "src", "app", "globals.css");
const css = readFileSync(cssPath, "utf8").replace(
  /@themes\/[^/]+\/tokens.css/,
  `@themes/${options.theme}/tokens.css`
);
writeFileSync(cssPath, css);

/* ────────────────────────────────────────────────────────── *
 * Seed .env and data folder                                  *
 * ────────────────────────────────────────────────────────── */

function genSecret(bytes = 16): string {
  return randomBytes(bytes).toString("hex");
}

let envContent = `NEXT_PUBLIC_SHOP_ID=${shopId}\n`;
envContent += `PREVIEW_TOKEN_SECRET=${genSecret()}\n`;
const envVars = [...options.payment, ...options.shipping];

if (envVars.length === 0) envVars.push("stripe");
for (const p of envVars) {
  if (p === "stripe") {
    envContent += `STRIPE_SECRET_KEY=${genSecret()}\n`;
    envContent += `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${genSecret()}\n`;
  } else {
    envContent += `${p.toUpperCase()}_KEY=${genSecret()}\n`;
  }
}

envContent += `NEXTAUTH_SECRET=${genSecret()}\n`;
writeFileSync(join(newApp, ".env"), envContent);

const newData = join("data", "shops", shopId);
if (existsSync(newData)) {
  console.error(`Data for shop ${shopId} already exists`);
  process.exit(1);
}
mkdirSync(newData, { recursive: true });

writeFileSync(
  join(newData, "settings.json"),
  JSON.stringify({ languages: [...LOCALES] }, null, 2)
);

writeFileSync(
  join(newData, "shop.json"),
  JSON.stringify(
    {
      id: shopId,
      name: shopId,
      catalogFilters: [],
      themeId: options.theme,
      type: options.type,
      paymentProviders: options.payment,
      shippingProviders: options.shipping,
      priceOverrides: {},
      localeOverrides: {},
    },
    null,
    2
  )
);

/* ────────────────────────────────────────────────────────── *
 * Seed a sample product                                      *
 * ────────────────────────────────────────────────────────── */

interface Product {
  id: string;
  sku: string;
  title: Record<string, string>;
  description: Record<string, string>;
  price: number;
  currency: string;
  images: string[];
  status: string;
  shop: string;
  row_version: number;
  created_at: string;
  updated_at: string;
  deposit?: number;
  rentalTerms?: string;
}

const now = new Date().toISOString();
const sampleProduct: Product = {
  id: ulid(),
  sku: "SAMPLE-1",
  title: { en: "Sample", de: "Sample", it: "Sample" },
  description: {
    en: "Sample product",
    de: "Sample product",
    it: "Sample product",
  },
  price: 1000,
  currency: "EUR",
  images: [],
  status: "draft",
  shop: shopId,
  row_version: 1,
  created_at: now,
  updated_at: now,
};

if (options.type === "rental") {
  sampleProduct.deposit = 1000;
  sampleProduct.rentalTerms = "Return within 30 days";
}

writeFileSync(
  join(newData, "products.json"),
  JSON.stringify([sampleProduct], null, 2)
);

console.log(`Shop "${shopId}" created.`);

// Attempt to run Cloudflare's C3 tool if available
try {
  const result = spawnSync("npx", ["--yes", "create-cloudflare", newApp], {
    stdio: "inherit",
  });
  if (result.status !== 0) {
    console.warn("C3 process failed or not available. Skipping.");
  }
} catch (err) {
  console.warn("C3 not available, skipping.");
}
