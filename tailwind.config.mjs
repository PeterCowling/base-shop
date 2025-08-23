// /tailwind.config.mjs
// Use workspace source paths to avoid requiring built packages
import tokens from "./packages/design-tokens/index.ts";
import preset from "./packages/tailwind-config/src/index.ts";

// ------------------------------------------------------------
// Temporary diagnostics
// ------------------------------------------------------------
// eslint-disable-next-line no-console
console.log("[tailwind.config.mjs] loading config");

function inspectCandidate(name, candidate) {
  // eslint-disable-next-line no-console
  console.log(`[tailwind.config.mjs] ${name} type:`, typeof candidate);

  if (typeof candidate === "function") {
    // eslint-disable-next-line no-console
    console.log(
      `[tailwind.config.mjs] ⚠️  ${name} is a function; expected a preset object`
    );
  }

  if (
    candidate?.plugins?.includes(candidate) ||
    candidate?.presets?.includes(candidate)
  ) {
    // eslint-disable-next-line no-console
    console.log(
      `[tailwind.config.mjs] ⚠️  ${name} contains a circular reference to itself`
    );
  }
}

inspectCandidate("tokens", tokens);
inspectCandidate("preset", preset);

if (
  tokens?.plugins?.includes(preset) ||
  tokens?.presets?.includes(preset) ||
  preset?.plugins?.includes(tokens) ||
  preset?.presets?.includes(tokens)
) {
  // eslint-disable-next-line no-console
  console.log(
    "[tailwind.config.mjs] ⚠️  potential circular reference between tokens and preset"
  );
}

/** @type {import('tailwindcss').Config} */
const config = {
  presets: [tokens, preset],
  darkMode: ["class", ".theme-dark"],
  content: [
    "./apps/**/*.{ts,tsx,mdx}",
    "./packages/{ui,platform-core,platform-machine,i18n,themes}/**/*.{ts,tsx,mdx}",
    ".storybook/**/*.{ts,tsx,mdx}",
    // Exclude dependencies and build outputs to avoid slow glob matching
    "!**/node_modules",
    "!**/dist",
    "!**/.next",
  ],
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/container-queries"),
  ],
};

export default config;
