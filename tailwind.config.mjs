// /tailwind.config.mjs
import preset from "@acme/tailwind-config";
import { createRequire } from "node:module";

/* ------------------------------------------------------------
 *  Runtime diagnostics — module resolution + preset sanity
 * ------------------------------------------------------------ */
const require = createRequire(import.meta.url);

let resolvedPresetPath = "<unresolved>";
try {
  resolvedPresetPath = require.resolve("@acme/tailwind-config");
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

/** @type {import('tailwindcss').Config} */
const config = {
  presets: [preset],
  content: [
    "./apps/**/*.{ts,tsx,mdx}",
    "./packages/{ui,platform-core,platform-machine,i18n,themes}/**/*.{ts,tsx,mdx}",
    ".storybook/**/*.{ts,tsx,mdx}",
  ],
};

export default config;
