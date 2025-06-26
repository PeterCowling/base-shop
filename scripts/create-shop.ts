import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { ulid } from "ulid";

const id = process.argv[2];
if (!id) {
  console.error("Usage: pnpm create-shop <id>");
  process.exit(1);
}

interface Options {
  type: "sale" | "rental";
  theme: string;
  payment: string[];
  shipping: string[];
}

function parseArgs(argv: string[]): [string, Options] {
  const id = argv[0];
  if (!id) {
    console.error(
      "Usage: pnpm create-shop <id> [--type=sale|rental] [--theme=name] [--payment=p1,p2] [--shipping=s1,s2]"
    );
    process.exit(1);
  }

  const opts: Options = {
    type: "sale",
    theme: "base",
    payment: [],
    shipping: [],
  };

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

  return [id, opts];
}

const [id, options] = parseArgs(process.argv.slice(2));

// verify theme exists
if (!existsSync(join("packages", "themes", options.theme))) {
  console.error(`Theme '${options.theme}' not found in packages/themes`);
  process.exit(1);
}

cpSync(templateApp, newApp, {
  recursive: true,
  filter: (src) => !/node_modules/.test(src),
});

// tweak package.json with shop name and theme
const pkgPath = join(newApp, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
pkg.name = `@apps/shop-${id}`;
if (pkg.dependencies) {
  Object.keys(pkg.dependencies).forEach((k) => {
    if (k.startsWith("@themes/")) delete pkg.dependencies[k];
  });
  pkg.dependencies[`@themes/${options.theme}`] = "workspace:*";
}
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

// update global CSS theme import
const cssPath = join(newApp, "src", "app", "globals.css");
let css = readFileSync(cssPath, "utf8");
css = css.replace(
  /@themes\/[^/]+\/tokens.css/,
  `@themes/${options.theme}/tokens.css`
);
writeFileSync(cssPath, css);

let envContent = "# Provider credentials\n";
const envVars = [...options.payment, ...options.shipping];
if (envVars.length === 0) envVars.push("stripe");
for (const p of envVars) {
  envContent += `${p.toUpperCase()}_KEY=\n`;
}
envContent += "NEXTAUTH_SECRET=\n";

const newData = join("data", "shops", id);
if (existsSync(newData)) {
  console.error(`Data for shop ${id} already exists`);
  process.exit(1);
}

mkdirSync(newData, { recursive: true });
const settings = { languages: ["en", "de", "it"] };
writeFileSync(
  join(newData, "settings.json"),
  JSON.stringify(settings, null, 2)
);

const shopInfo = {
  id,
  name: id,
  catalogFilters: [],
  themeId: options.theme,
  type: options.type,
  paymentProviders: options.payment,
  shippingProviders: options.shipping,
};
writeFileSync(join(newData, "shop.json"), JSON.stringify(shopInfo, null, 2));

const now = new Date().toISOString();
const sampleProduct: any = {
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
  shop: id,
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

console.log(`Shop "${id}" created.`);
