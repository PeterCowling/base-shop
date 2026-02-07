// .storybook/vite.storybook.ts
import path from 'node:path';

import tailwindcss from '@tailwindcss/postcss';
import { defineConfig, type PluginOption } from 'vite';
// SVGR is optional; if present we include it
// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- ABC-123
// @ts-ignore
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';

import { getStorybookAliases } from './aliases';

const alias = getStorybookAliases();
const seenServerModuleIds = new Set<string>();

const nextStubResolver = (): PluginOption => ({
  name: 'storybook-next-stub-resolver',
  enforce: 'pre',
  resolveId(source) {
    const redirectStub = path.resolve(__dirname, './mocks/redirect-status-code.js');
    const redirectHelperStub = path.resolve(__dirname, './mocks/next-redirect.js');
    const navigationStub = path.resolve(__dirname, './mocks/next-navigation.js');
    const routerStub = path.resolve(__dirname, './mocks/next-router.js');
    const nextServerStub = path.resolve(__dirname, './mocks/next-server.js');
    const nextCacheStub = path.resolve(__dirname, './mocks/next-cache.js');
    const compiledReactStub = path.resolve(__dirname, './mocks/next-compiled-react.js');
    const compiledJsxStub = path.resolve(
      __dirname,
      './mocks/next-compiled-react-jsx-dev-runtime.js',
    );
    const compiledSchedulerStub = path.resolve(
      __dirname,
      './mocks/next-compiled-scheduler.js',
    );

    if (source.includes('next/dist/client/components/redirect-status-code')) {
      return redirectStub;
    }
    if (source.includes('next/dist/client/components/redirect')) {
      return redirectHelperStub;
    }
    if (source.includes('next/dist/client/components/navigation')) {
      return navigationStub;
    }
    if (source.includes('next/dist/client/router')) {
      return routerStub;
    }
    if (source === 'next/dist/compiled/react' || source.startsWith('next/dist/compiled/react?')) {
      return compiledReactStub;
    }
    if (
      source === 'next/dist/compiled/react/jsx-dev-runtime' ||
      source.startsWith('next/dist/compiled/react/jsx-dev-runtime') ||
      source.includes('next/dist/compiled/react/cjs/react-jsx-dev-runtime')
    ) {
      return compiledJsxStub;
    }
    if (source === 'next/dist/compiled/scheduler' || source.startsWith('next/dist/compiled/scheduler')) {
      return compiledSchedulerStub;
    }
    if (source === 'next/server' || source.startsWith('next/server?')) {
      return nextServerStub;
    }
    if (source === 'next/cache' || source.startsWith('next/cache?')) {
      return nextCacheStub;
    }
    return null;
  },
});

const rscGuard = (): PluginOption => ({
  name: 'storybook-rsc-guard',
  enforce: 'pre',
  transform(this, code, id) {
    if (!/\.(mjs|cjs|tsx?|jsx?)$/.test(id)) return null;
    if (!id.includes('/packages/') && !id.includes('/apps/')) return null;
    const markers = ['"use server"', "'use server'", 'server-only'];
    if (!markers.some((marker) => code.includes(marker))) return null;
    if (!seenServerModuleIds.has(id)) {
      seenServerModuleIds.add(id);
      this.warn(`[storybook-rsc-guard] Skipping server-only module in Storybook bundle: ${id}`);
    }
    const escapedId = id.replace(/\\/g, '\\\\');
    return {
      code: [
        `// Stripped server-only module for Storybook: ${escapedId}`,
        'export const __storybook_rsc_stub = true;',
        'export default function RscStub() {',
        `  throw new Error("Server-only module excluded from Storybook bundle: ${escapedId}");`,
        '}',
        '',
      ].join('\n'),
      map: null,
    };
  },
});

export default defineConfig({
  plugins: [
    nextStubResolver(),
    rscGuard(),
    tsconfigPaths(),
    // SVGR (if installed)
    typeof svgr === 'function' ? svgr() : (undefined as unknown as never),
  ].filter(Boolean) as PluginOption[],
  resolve: {
    alias,
    conditions: ['browser', 'development'],
  },
  optimizeDeps: {
    exclude: [
      '@acme/ui',
      '@acme/platform-core',
      '@acme/platform-machine',
      'next',
      'next/*',
      '@radix-ui/react-popover',
      '@radix-ui/react-portal',
      '@radix-ui/react-dismissable-layer',
      '@radix-ui/react-focus-scope',
      '@radix-ui/react-focus-guards',
      '@radix-ui/react-presence',
      '@radix-ui/react-popper',
    ],
    esbuildOptions: {
      plugins: [
        {
          name: 'sb-next-compiled-react-stub',
          setup(build) {
            const stubContents = 'export * from "react"; export { default } from "react";';
            build.onResolve({ filter: /.*/ }, (args) => {
              const target = args.path.split("?")[0];
              if (
                target !== "next/dist/compiled/react" &&
                !target.startsWith("next/dist/compiled/react/")
              ) {
                return null;
              }
              return {
                path: args.path,
                namespace: "sb-next-compiled-react",
              };
            });
            build.onLoad({ filter: /.*/, namespace: 'sb-next-compiled-react' }, () => ({
              contents: stubContents,
              loader: 'js',
            }));
          },
        },
      ],
    },
  },
  ssr: {
    external: [
      // Keep Next/React client packages external to avoid SSR bundling of "use client" modules
      /^@radix-ui\//,
      '@acme/ui',
      /^@acme\/ui\//,
      '@acme/platform-core',
      /^@acme\/platform-core\//,
      '@acme/platform-machine',
      /^@acme\/platform-machine\//,
    ],
    noExternal: ['@storybook/*'],
  },
  css: {
    // Tailwind v4 via official PostCSS plugin
    postcss: {
      plugins: [tailwindcss], // i18n-exempt -- ABC-123 [ttl=2026-01-01]
    },
  },
});
