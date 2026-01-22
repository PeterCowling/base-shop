import { createRequire } from "node:module";

import { readFileSync } from "fs";
import { extname,resolve } from "path";

import type { CreateShopOptions } from "@acme/platform-core/createShop";
import { validateShopName } from "@acme/platform-core/shops";

const PAYMENT_PROVIDERS = ["stripe", "paypal"] as const;
const SHIPPING_PROVIDERS = ["dhl", "ups", "premier-shipping"] as const;

function parseList<T extends readonly string[]>(val: string, allowed: T): T[number][] {
  return val
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is T[number] => (allowed as readonly string[]).includes(s));
}

/** Command line options for creating a shop.
 *
 * The CLI only collects a subset of the full `CreateShopOptions` defined by
 * the platform. Many properties have sensible defaults applied by the core
 * `createShop` helper, so our local representation marks every field optional.
 * This allows callers to omit rarely used fields while still benefiting from
 * type safety on the properties we do support.
 */
export type Options = Partial<CreateShopOptions>;

/**
 * Parse command line arguments for the create-shop script.
 * Returns the shop id, parsed options and flags indicating whether
 * theme or template were explicitly provided.
 */
export function parseArgs(argv: string[]): {
  shopId: string;
  options: Options;
  themeProvided: boolean;
  templateProvided: boolean;
  seed: boolean;
} {
  let id = argv[0];
  if (!id) {
    console.error(
      "Usage: pnpm create-shop <id> [--type=sale|rental] [--theme=name] [--payment=p1,p2] [--shipping=s1,s2] [--template=name] [--name=value] [--logo=url] [--contact=info] [--seed] [--config=file]"
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
    enableSubscriptions: false,
  };

  let themeProvided = false;
  let templateProvided = false;
  let seed = false;

  const require = createRequire(process.cwd() + "/");

  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;

    let key: string;
    let val = "";

    if (arg.includes("=")) {
      [key, val] = arg.slice(2).split("=");
    } else {
      key = arg.slice(2);
      if (key !== "seed") {
        val = argv[i + 1] || "";
        if (val.startsWith("--")) val = ""; else i++;
      }
    }

    switch (key) {
      case "config": {
        const cfgPath = resolve(val);
        let cfg: any;
        if (extname(cfgPath) === ".json") {
          cfg = JSON.parse(readFileSync(cfgPath, "utf8"));
        } else {
          const mod = require(cfgPath);
          cfg = mod.default ?? mod;
        }
        Object.assign(opts, cfg);
        if (cfg.theme !== undefined) themeProvided = true;
        if (cfg.template !== undefined) templateProvided = true;
        break;
      }
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
        opts.payment = parseList(val, PAYMENT_PROVIDERS);
        break;
      case "shipping":
        opts.shipping = parseList(val, SHIPPING_PROVIDERS);
        break;
      case "subscriptions":
        opts.enableSubscriptions = val === "" ? true : val !== "false";
        break;
      case "no-subscriptions":
        opts.enableSubscriptions = false;
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
      case "seed":
        seed = true;
        break;
      default:
        console.error(`Unknown option ${key}`);
        process.exit(1);
    }
  }

  return { shopId: id, options: opts, themeProvided, templateProvided, seed };
}
