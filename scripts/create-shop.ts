import { cpSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const id = process.argv[2];
if (!id) {
  console.error("Usage: pnpm create-shop <id>");
  process.exit(1);
}

const templateApp = join("apps", "shop-abc");
const newApp = join("apps", `shop-${id}`);
if (existsSync(newApp)) {
  console.error(`App ${newApp} already exists`);
  process.exit(1);
}

cpSync(templateApp, newApp, {
  recursive: true,
  filter: (src) => !/node_modules/.test(src),
});

const envContent = `# Provider credentials\nSTRIPE_SECRET_KEY=\nNEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=\nNEXTAUTH_SECRET=\n`;
writeFileSync(join(newApp, ".env.local"), envContent);

const templateData = join("data", "shops", "abc");
const newData = join("data", "shops", id);
if (existsSync(newData)) {
  console.error(`Data for shop ${id} already exists`);
  process.exit(1);
}

mkdirSync(newData, { recursive: true });
cpSync(join(templateData, "products.json"), join(newData, "products.json"));
cpSync(join(templateData, "settings.json"), join(newData, "settings.json"));

console.log(`Shop "${id}" created.`);
