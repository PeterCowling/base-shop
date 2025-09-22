// vite.config.ts
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    svelte(),
    // Resolve TS path aliases across the monorepo and apps
    tsconfigPaths({ projects: ["tsconfig.base.json", "apps/cms/tsconfig.json"] })
  ],
});
