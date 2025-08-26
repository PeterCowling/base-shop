import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import preset from "../packages/tailwind-config/src/index.ts";

// Build a `require` function that works in both ESM and CJS environments.
// `__filename` is available in CommonJS, while `import.meta.url` works in ESM.
const nodeRequire = createRequire(
  typeof __filename !== "undefined"
    ? __filename
    : fileURLToPath(import.meta.url)
);

let resolvedPresetPath = "<unresolved>";
try {
  resolvedPresetPath = nodeRequire.resolve("@acme/tailwind-config");
  // eslint-disable-next-line no-console
  console.log(
    `[tailwind.config] ✅  @acme/tailwind-config resolved → ${resolvedPresetPath}`
  );
} catch (err) {
  // eslint-disable-next-line no-console
  console.error(
    "[tailwind.config] ❌  @acme/tailwind-config could NOT be resolved.\n" +
      "Is the package in pnpm-workspace.yaml? Did you run `pnpm install`?",
    err
  );
}

// eslint-disable-next-line no-console
console.log(
  "[tailwind.config] ℹ️  preset keys:",
  preset && typeof preset === "object" ? Object.keys(preset) : "not an object"
);
