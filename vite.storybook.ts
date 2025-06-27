import path from "node:path";
import tailwindcss from "tailwindcss";
import { defineConfig } from "vite";

export default defineConfig({
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
  resolve: {
    alias: {
      "@acme/design-tokens": path.resolve(
        __dirname,
        "./packages/design-tokens/src"
      ),
      "@acme/tailwind-config": path.resolve(
        __dirname,
        "./packages/tailwind-config/src"
      ),
    },
  },
  optimizeDeps: { entries: [] },
});
