import { createRequire } from "node:module";
import preset from "../packages/tailwind-config/src/index.ts";

// Build a `require` function that works in both ESM and CJS environments.
// Accessing `import.meta` directly would cause Jest (which transpiles to
// CommonJS) to throw a syntax error, so we evaluate it lazily via
// `Function` to avoid parsing issues.
const nodeRequire = createRequire(
  // eslint-disable-next-line no-new-func
  (() => {
    try {
      return new Function("return import.meta.url")();
    } catch {
      // eslint-disable-next-line no-undef
      return __filename;
    }
  })()
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
