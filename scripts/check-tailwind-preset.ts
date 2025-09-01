// scripts/check-tailwind-preset.ts

import { createRequire } from "node:module";
import preset from "../packages/tailwind-config/src/index.ts";

// Build a `require` function that works in both ESM and CJS environments.
// `__filename` is available in CommonJS. When unavailable (e.g. ESM execution
// without transpilation), fall back to the current working directory which
// still allows Node's resolver to locate packages in this monorepo.
const nodeRequire = createRequire(
  typeof __filename !== "undefined" ? __filename : process.cwd() + "/"
);

let resolvedPresetPath = " ";
try {
  resolvedPresetPath = nodeRequire.resolve("@acme/tailwind-config");
  console.log(
    `[tailwind.config] ✅  @acme/tailwind-config resolved → ${resolvedPresetPath}`
  );
} catch (err) {
  console.error(
    "[tailwind.config] ❌  @acme/tailwind-config could NOT be resolved.\n" +
      "Is the package in pnpm-workspace.yaml? Did you run `pnpm install`?",
    err
  );
}

console.log(
  "[tailwind.config] ℹ️  preset keys:",
  preset && typeof preset === "object" ? Object.keys(preset) : "not an object"
);
