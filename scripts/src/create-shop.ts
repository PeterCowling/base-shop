// scripts/create-shop.ts
// Import directly to avoid relying on tsconfig path aliases when using ts-node.
import { readdirSync, existsSync } from "fs";
import readline from "node:readline";
import { join } from "path";
import { createShop } from "../../packages/platform-core/src/createShop";

// When run interactively, the script prompts for a theme and template if they
// are not provided via command-line options.

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

function parseArgs(argv: string[]): [string, Options, boolean, boolean] {
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

if (themeProvided) {
  const themeDir = join("packages", "themes", options.theme);
  if (!existsSync(themeDir)) {
    console.error(`Theme '${options.theme}' not found in packages/themes`);
    process.exit(1);
  }
}

if (templateProvided) {
  const templateDir = join("packages", options.template);
  if (!existsSync(templateDir)) {
    console.error(`Template '${options.template}' not found in packages`);
    process.exit(1);
  }
}

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

// Prompt for template if none was specified on the command line.
async function ensureTemplate() {
  if (!templateProvided && process.stdin.isTTY) {
    const packagesDir = "packages";
    const templates = readdirSync(packagesDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name.startsWith("template"))
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

await ensureTheme();
await ensureTemplate();
await createShop(shopId, options);
