import { cpSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: pnpm ts-node scripts/src/generate-shop.ts <shop-slug>");
  process.exit(1);
}

const shopId = slug.startsWith("shop-") ? slug : `shop-${slug}`;
const rootDir = path.resolve(__dirname, "..", "..");
const templateDir = path.join(rootDir, "packages", "template-app");
const targetDir = path.join(rootDir, "apps", shopId);

if (existsSync(targetDir)) {
  console.error(`Shop app already exists: ${targetDir}`);
  process.exit(1);
}

// Copy template app contents
cpSync(templateDir, targetDir, {
  recursive: true,
  filter: (src) => {
    const rel = path.relative(templateDir, src);
    return !rel.startsWith("node_modules") && !rel.includes("dist");
  },
});

// Update package.json
const pkgPath = path.join(targetDir, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
pkg.name = `@apps/${shopId}`;
pkg.dependencies = {
  ...pkg.dependencies,
  "@acme/next-config": "workspace:*",
  "@acme/tailwind-config": "workspace:*",
};
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

// Link shared configs
writeFileSync(
  path.join(targetDir, "next.config.mjs"),
  'export { default } from "@acme/next-config/next.config.mjs";\n'
);
writeFileSync(
  path.join(targetDir, "tailwind.config.mjs"),
  'export { default } from "@acme/tailwind-config/tailwind.config.mjs";\n'
);

console.log(`Created shop ${shopId} in apps/`);
