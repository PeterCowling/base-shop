import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const hardcodedExamples: Record<string, any> = {
  Breadcrumbs: {
    items: [
      { label: "Home", href: "/" },
      { label: "Shop", href: "/shop" },
    ],
  },
  Button: { children: "Button" },
  Tag: { children: "Tag" },
  Tooltip: { children: "Info", content: "Tooltip" },
  Accordion: { items: [{ title: "Item 1", content: "Content" }] },
};

const here = fileURLToPath(import.meta.url);

function getComponentNames(componentsDir: string): string[] {
  const names = new Set<string>();

  function walk(dir: string) {
    const indexFile = path.join(dir, "index.ts");
    if (!existsSync(indexFile)) return;
    const src = readFileSync(indexFile, "utf8");

    const starRe = /export\s+\*\s+from\s+["']\.\/(.+?)["'];?/g;
    let starMatch: RegExpExecArray | null;
    while ((starMatch = starRe.exec(src))) {
      walk(path.join(dir, starMatch[1]));
    }

    const namedRe = /export\s+\{([^}]+)\}\s+from\s+["']\.\/(.+?)["'];?/g;
    let namedMatch: RegExpExecArray | null;
    while ((namedMatch = namedRe.exec(src))) {
      const specifiers = namedMatch[1]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      for (const spec of specifiers) {
        if (spec.startsWith("type ")) continue;
        let name = spec;
        if (spec.startsWith("default as ")) {
          name = spec.slice("default as ".length).trim();
        } else if (spec.includes(" as ")) {
          name = spec.split(/\s+as\s+/)[1];
        }
        names.add(name);
      }
    }
  }

  walk(componentsDir);
  return Array.from(names);
}

export function generateExampleProps(shopId: string) {
  const rootDir = path.resolve(path.dirname(here), "..", "..");
  const componentsDir = path.join(
    rootDir,
    "packages",
    "ui",
    "src",
    "components"
  );
  const componentNames = getComponentNames(componentsDir).sort();

  const outDir = path.join(
    rootDir,
    "apps",
    shopId,
    "src",
    "app",
    "upgrade-preview"
  );
  mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "example-props.ts");

  const entries = componentNames.map((name) => {
    const json = JSON.stringify(hardcodedExamples[name] ?? {}, null, 2);
    const indented = json.replace(/\n/g, "\n  ");
    return `  ${name}: ${indented},`;
  });

  const file =
    `// apps/${shopId}/src/app/upgrade-preview/example-props.ts\n` +
    "// Map of example props for all UI components so upgrade previews can render reliably\n\n" +
    "export const exampleProps: Record<string, any> = {\n" +
    entries.join("\n") +
    "\n};\n\n" +
    "export default exampleProps;\n";

  writeFileSync(outPath, file);
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] === currentFile) {
  const slug = process.argv[2];
  if (!slug) {
    console.error(
      "Usage: pnpm ts-node scripts/src/generate-example-props.ts <shop-slug>"
    );
    process.exit(1);
  }
  const shopId = slug.startsWith("shop-") ? slug : `shop-${slug}`;
  generateExampleProps(shopId);
}
