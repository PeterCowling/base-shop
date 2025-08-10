import { createRequire } from "node:module";
import preset from "../packages/tailwind-config/src/index.ts";

let moduleUrl = "";
try {
  moduleUrl = (0, eval)("import.meta.url");
} catch {
  moduleUrl = __filename;
}
const nodeRequire = createRequire(moduleUrl);

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
