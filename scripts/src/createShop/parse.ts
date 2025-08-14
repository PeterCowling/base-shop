import { validateShopName } from "../../../packages/platform-core/src/shops";

/** Command line options for creating a shop. */
export interface Options {
  type: "sale" | "rental";
  theme: string;
  template: string;
  payment: string[];
  shipping: string[];
  name?: string;
  logo?: string;
  contactInfo?: string;
  enableSubscriptions?: boolean;
}

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
