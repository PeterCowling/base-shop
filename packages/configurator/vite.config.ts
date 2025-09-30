// packages/configurator/vite.config.ts
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Lightweight Vite config for the configurator CLI package.
// Note: We intentionally do not include the Svelte plugin here since
// this repo does not contain any Svelte code.
export default defineConfig({
  plugins: [
    // Resolve TS path aliases across the monorepo and local package
    tsconfigPaths(),
  ],
});

