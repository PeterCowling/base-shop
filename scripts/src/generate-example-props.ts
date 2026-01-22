import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { ExampleProps } from "@acme/types";

import { getComponentNameMap } from "./component-names";

const examples: ExampleProps = {
  Breadcrumbs: {
    items: [
      { label: "Home", href: "/" },
      { label: "Shop", href: "/shop" },
    ],
  },
  Button: { children: "Button" },
  Tag: { children: "Tag" },
  Tooltip: { children: "Info", content: "Tooltip" },
  Accordion: {
    items: [{ title: "Item 1", content: "Content" }],
  },
  Icon: { name: "star" },
  Price: { amount: 19.99, currency: "USD" },
  RatingStars: { rating: 4 },
  SearchBar: {
    label: "Search",
    suggestions: ["Apple", "Banana", "Cherry"],
  },
  StockStatus: { inStock: true },
};

export function generateExampleProps(
  shopId: string,
  root = process.cwd()
): void {
  const componentsDir = path.join(root, "packages", "ui", "src", "components");
  const componentNames = Object.values(getComponentNameMap(componentsDir));
  const names = Array.from(
    new Set(componentNames.filter((n) => /^[A-Z][A-Za-z0-9]*$/.test(n)))
  );
  const map: ExampleProps = {};
  for (const name of names) {
    map[name] = examples[name] ?? {};
  }
  const outPath = path.join(
    root,
    "apps",
    shopId,
    "src",
    "app",
    "upgrade-preview",
    "example-props.ts"
  );
  mkdirSync(path.dirname(outPath), { recursive: true });
  const content = `// apps/${shopId}/src/app/upgrade-preview/example-props.ts
// Map of example props for all UI components so upgrade previews can render reliably

import type { ExampleProps } from "@acme/types";

export const exampleProps: ExampleProps = ${JSON.stringify(map, null, 2)};

export default exampleProps;
`;
  writeFileSync(outPath, content);
}

if (process.argv[1]?.includes("generate-example-props.ts")) {
  const slug = process.argv[2];
  if (!slug) {
    console.error(
      "Usage: pnpm ts-node scripts/src/generate-example-props.ts <shop-id>"
    );
    process.exit(1);
  }
  const shopId = slug.startsWith("shop-") ? slug : `shop-${slug}`;
  generateExampleProps(shopId);
}
