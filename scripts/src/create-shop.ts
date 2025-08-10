// scripts/create-shop.ts
// Import directly to avoid relying on tsconfig path aliases when using ts-node.
import { readdirSync } from "fs";
import readline from "node:readline";
import { execSync } from "node:child_process";
import { join } from "path";
import {
  createShop,
  ensureTemplateExists,
} from "../../packages/platform-core/src/createShop";
import { validateShopName } from "../../packages/platform-core/src/shops";
import { defaultPaymentProviders } from "../../packages/platform-core/src/createShop/defaultPaymentProviders";
import { defaultShippingProviders } from "../../packages/platform-core/src/createShop/defaultShippingProviders";

function ensureRuntime() {
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
    console.error("Failed to determine pnpm version. pnpm v10 or later is required.");
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

/* ────────────────────────────────────────────────────────── *
 * Command-line parsing                                       *
 * ────────────────────────────────────────────────────────── */

interface Options {
  type: "sale" | "rental";
  theme: string;
  template: string;
  payment: string[];
  shipping: string[];
  name?: string;
  logo?: string;
  contactInfo?: string;
}

function parseArgs(argv: string[]): [string, Options, boolean, boolean] {
  let id = argv[0];
  if (!id) {
    console.error(
      "Usage: pnpm create-shop <id> [--type=sale|rental] [--theme=name] [--payment=p1,p2] [--shipping=s1,s2] [--template=name] [--name=value] [--logo=url] [--contact=info]"
    );
    process.exit(1);
  }

  try {
    id = validateShopName(id);
  } catch (err) {
    console.error((err as Error).message);
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
  let templateProvided = false;

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
        templateProvided = true;
        break;
      case "payment":
        opts.payment = val.split(",").filter(Boolean);
        break;
      case "shipping":
        opts.shipping = val.split(",").filter(Boolean);
        break;
      case "name":
        opts.name = val || opts.name;
        break;
      case "logo":
        opts.logo = val;
        break;
      case "contact":
        opts.contactInfo = val;
        break;
      default:
        console.error(`Unknown option ${key}`);
        process.exit(1);
    }
  });

  return [id, opts, themeProvided, templateProvided];
}

const [shopId, options, themeProvided, templateProvided] = parseArgs(
  process.argv.slice(2)
);
if (themeProvided || templateProvided) {
  try {
    ensureTemplateExists(options.theme, options.template);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
}


/** Prompt for theme when none is provided on the command line. */
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

/** Prompt for template when none is provided on the command line. */
async function ensureTemplate() {
  if (!templateProvided && process.stdin.isTTY) {
    const packagesDir = join("packages");
    const templates = readdirSync(packagesDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name.startsWith("template-"))
      .map((d) => d.name);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    await new Promise<void>((resolve) => {
      rl.question(`Select template [${templates.join(", ")}]: `, (ans) => {
        if (templates.includes(ans)) options.template = ans;
        rl.close();
        resolve();
      });
    });
  }
}

/** Prompt for shop name when none is provided on the command line. */
async function ensureName() {
  if (!options.name && process.stdin.isTTY) {
    const defaultName = shopId
      .split(/[-_]/)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    await new Promise<void>((resolve) => {
      rl.question(`Shop name [${defaultName}]: `, (ans) => {
        options.name = ans || defaultName;
        rl.close();
        resolve();
      });
    });
  }
}

/** Prompt for logo URL when none is provided on the command line. */
async function ensureLogo() {
  if (options.logo === undefined && process.stdin.isTTY) {
    const defaultLogo = `https://example.com/${shopId}.png`;
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    await new Promise<void>((resolve) => {
      rl.question(`Logo URL [${defaultLogo}]: `, (ans) => {
        options.logo = ans || "";
        rl.close();
        resolve();
      });
    });
  }
}

/** Prompt for contact info when none is provided on the command line. */
async function ensureContact() {
  if (options.contactInfo === undefined && process.stdin.isTTY) {
    const defaultContact = `support@${shopId}.com`;
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    await new Promise<void>((resolve) => {
      rl.question(`Contact info [${defaultContact}]: `, (ans) => {
        options.contactInfo = ans || "";
        rl.close();
        resolve();
      });
    });
  }
}

/** Prompt for payment providers when none are provided on the command line. */
async function ensurePayment() {
  if (options.payment.length === 0 && process.stdin.isTTY) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    await new Promise<void>((resolve) => {
      rl.question(
        `Select payment providers (comma-separated) [${defaultPaymentProviders.join(", ")}]: `,
        (ans) => {
          options.payment = ans
            .split(",")
            .map((s) => s.trim())
            .filter((p) => defaultPaymentProviders.includes(p));
          rl.close();
          resolve();
        }
      );
    });
  }
}

/** Prompt for shipping providers when none are provided on the command line. */
async function ensureShipping() {
  if (options.shipping.length === 0 && process.stdin.isTTY) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    await new Promise<void>((resolve) => {
      rl.question(
        `Select shipping providers (comma-separated) [${defaultShippingProviders.join(", ")}]: `,
        (ans) => {
          options.shipping = ans
            .split(",")
            .map((s) => s.trim())
            .filter((p) => defaultShippingProviders.includes(p));
          rl.close();
          resolve();
        }
      );
    });
  }
}

await ensureTemplate();
await ensureTheme();
await ensureName();
await ensureLogo();
await ensureContact();
await ensurePayment();
await ensureShipping();
await createShop(shopId, options, { deploy: true });
