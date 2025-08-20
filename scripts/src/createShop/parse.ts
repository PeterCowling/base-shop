import { validateShopName } from "../../../packages/platform-core/src/shops";
import type { CreateShopOptions } from "../../../packages/platform-core/src/createShop";

/** Command line options for creating a shop. */
export type Options = CreateShopOptions;

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
} {
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
    enableSubscriptions: false,
    pages: [],
    themeOverrides: {},
    tax: "taxjar",
    navItems: [],
    checkoutPage: [],
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
        opts.payment = val.split(",").filter(Boolean) as Options["payment"];
        break;
      case "shipping":
        opts.shipping = val.split(",").filter(Boolean) as Options["shipping"];
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
      default:
        console.error(`Unknown option ${key}`);
        process.exit(1);
    }
  });

  return { shopId: id, options: opts, themeProvided, templateProvided };
}
