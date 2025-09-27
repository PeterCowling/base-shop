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
      "@acme/platform-core/contexts/CartContext": path.resolve(
        __dirname,
        "./.storybook/mocks/CartContext.tsx"
      ),
      "@acme/platform-core/contexts/CurrencyContext": path.resolve(
        __dirname,
        "./.storybook/mocks/CurrencyContext.tsx"
      ),
      // Mock Next.js router hooks used by some components in preview
      "next/navigation": path.resolve(
        __dirname,
        "./.storybook/mocks/nextNavigation.ts"
      ),
      // Mock Next.js Image to a simple <img> for preview performance
      "next/image": path.resolve(
        __dirname,
        "./.storybook/mocks/NextImage.tsx"
      ),
    },
  },
  optimizeDeps: { entries: [] },
});
