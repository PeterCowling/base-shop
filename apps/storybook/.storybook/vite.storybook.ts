// .storybook/vite.storybook.ts
import { defineConfig, type PluginOption } from 'vite';
import path from 'node:path';
import tsconfigPaths from 'vite-tsconfig-paths';
import istanbul from 'vite-plugin-istanbul';
// SVGR is optional; if present we include it
// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- ABC-123
// @ts-ignore
import svgr from 'vite-plugin-svgr';
import tailwindcss from '@tailwindcss/postcss';

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    // Instrumentation is a no-op unless env vars are enabled; safe to include
    istanbul({
      cypress: true,
      include: ['packages/ui/src/**'], // i18n-exempt -- ABC-123 [ttl=2026-01-01]
      extension: ['.ts', '.tsx'],
    }),
    // SVGR (if installed)
    typeof svgr === 'function' ? svgr() : (undefined as unknown as never),
  ].filter(Boolean) as PluginOption[],
  resolve: {
    alias: {
      // Keep aliases in sync with .storybook/main.ts webpackFinal
      '@themes-local': path.resolve(__dirname, '../../../packages/themes'), // i18n-exempt -- ABC-123 [ttl=2026-01-01]
      '@acme/design-tokens': path.resolve( // i18n-exempt -- ABC-123 [ttl=2026-01-01]
        __dirname,
        '../../../packages/design-tokens/src' // i18n-exempt -- ABC-123 [ttl=2026-01-01]
      ),
      '@acme/tailwind-config': path.resolve( // i18n-exempt -- ABC-123 [ttl=2026-01-01]
        __dirname,
        '../../../packages/tailwind-config/src' // i18n-exempt -- ABC-123 [ttl=2026-01-01]
      ),
      '@acme/platform-core/products$': path.resolve( // i18n-exempt -- ABC-123 [ttl=2026-01-01]
        __dirname,
        '../../../packages/platform-core/src/products/index.ts' // i18n-exempt -- ABC-123 [ttl=2026-01-01]
      ),
      // Server-only/module stubs for browser 
      'server-only': false as unknown as string,
      'node:fs': false as unknown as string,
      'node:path': false as unknown as string,
      'node:crypto': false as unknown as string,
      'node:module': false as unknown as string,
      module: false as unknown as string,
    },
  },
  css: {
    // Tailwind v4 via official PostCSS plugin
    postcss: {
      plugins: [tailwindcss], // i18n-exempt -- ABC-123 [ttl=2026-01-01]
    },
  },
});
