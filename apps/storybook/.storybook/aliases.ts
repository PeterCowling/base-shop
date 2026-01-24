import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const nodeFsStub = path.resolve(__dirname, "./mocks/node-fs.js");
const nodePathStub = path.resolve(__dirname, "./mocks/node-path.js");

// Shared alias map for Vite and Webpack Storybook configs to avoid drift between dev/CI.
export const getStorybookAliases = () => ({
  "./header.css": path.resolve(__dirname, "./styles/empty.css"),
  "./button.css": path.resolve(__dirname, "./styles/empty.css"),
  "./page.css": path.resolve(__dirname, "./styles/empty.css"),
  "@themes-local": path.resolve(__dirname, "../../../packages/themes"),
  "@acme/i18n": path.resolve(__dirname, "../../../packages/i18n/src/index.ts"),
  "@acme/i18n$": path.resolve(__dirname, "../../../packages/i18n/src/index.ts"),
  "@acme/i18n/": path.resolve(__dirname, "../../../packages/i18n/src/"),
  "@acme/i18n/package.json": path.resolve(__dirname, "../../../packages/i18n/package.json"),
  "@acme/types": path.resolve(__dirname, "../../../packages/types/src"),
  "@acme/types/package.json": path.resolve(__dirname, "../../../packages/types/package.json"),
  "@acme/page-builder-core": path.resolve(
    __dirname,
    "../../../packages/page-builder-core/src",
  ),
  "@acme/zod-utils": path.resolve(__dirname, "../../../packages/zod-utils/src"),
  "@acme/zod-utils/package.json": path.resolve(__dirname, "../../../packages/zod-utils/package.json"),
  "@acme/design-tokens": path.resolve(__dirname, "../../../packages/design-tokens/src"),
  "@acme/tailwind-config": path.resolve(__dirname, "../../../packages/tailwind-config/src"),
  "@acme/platform-machine": path.resolve(__dirname, "../../../packages/platform-machine/src"),
  "@acme/platform-machine/useFSM": path.resolve(
    __dirname,
    "../../../packages/platform-machine/src/useFSM.ts",
  ),
  "@acme/platform-core/contexts/CartContext": path.resolve(__dirname, "./mocks/CartContext.tsx"),
  "@acme/platform-core/contexts/CurrencyContext": path.resolve(
    __dirname,
    "./mocks/CurrencyContext.tsx",
  ),
  "@acme/platform-core/contexts/ThemeContext": path.resolve(__dirname, "./mocks/ThemeContext.tsx"),
  "@auth": path.resolve(__dirname, "./mocks/auth.ts"),
  // Force UI stories to use pure data-only module to avoid server imports
  "@acme/platform-core/products$": path.resolve(
    __dirname,
    "../../../packages/platform-core/src/products/index.ts",
  ),
  "@acme/platform-core/products/index": path.resolve(
    __dirname,
    "../../../packages/platform-core/src/products/index.ts",
  ),
  // Use Jest-style mocks for Next client modules when running in Storybook
  "next/image": path.resolve(__dirname, "./mocks/next-image.js"),
  "next/navigation": path.resolve(__dirname, "../../../__mocks__/next/navigation.js"),
  "next/headers": path.resolve(__dirname, "../../../__mocks__/next/headers.js"),
  "next/link": path.resolve(__dirname, "../../../__mocks__/next/link.js"),
  "next/link.js": path.resolve(__dirname, "../../../__mocks__/next/link.js"),
  "next/dist/client/router.js": path.resolve(__dirname, "./mocks/next-router.js"),
  "next/dist/client/router": path.resolve(__dirname, "./mocks/next-router.js"),
  "next/server": path.resolve(__dirname, "./mocks/next-server.js"),
  "next/cache": path.resolve(__dirname, "./mocks/next-cache.js"),
  "next/dist/client/components/navigation.js": path.resolve(
    __dirname,
    "./mocks/next-navigation.js",
  ),
  "next/dist/client/components/redirect.js": path.resolve(
    __dirname,
    "./mocks/next-redirect.js",
  ),
  "next/dist/client/components/redirect.js?*": path.resolve(
    __dirname,
    "./mocks/next-redirect.js",
  ),
  "next/dist/compiled/react/jsx-dev-runtime": path.resolve(
    __dirname,
    "./mocks/next-compiled-react-jsx-dev-runtime.js",
  ),
  "next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js": path.resolve(
    __dirname,
    "./mocks/next-compiled-react-jsx-dev-runtime.js",
  ),
  "next/dist/compiled/react": path.resolve(__dirname, "./mocks/next-compiled-react.js"),
  "next/dist/compiled/scheduler": path.resolve(__dirname, "./mocks/next-compiled-scheduler.js"),
  "next/dist/client/components/redirect-status-code": path.resolve(
    __dirname,
    "./mocks/redirect-status-code.js",
  ),
  "next/dist/client/components/redirect-status-code.js": path.resolve(
    __dirname,
    "./mocks/redirect-status-code.js",
  ),
  "@acme/platform-core/contexts/ThemeContext": path.resolve(
    __dirname,
    "./mocks/ThemeContext.tsx",
  ),
  // Third-party SDK not needed in Storybook bundles
  openai: false as unknown as string,
  // Stub server-only/module imports for browser bundle
  "server-only": false as unknown as string,
  "node:fs": nodeFsStub,
  "node:path": nodePathStub,
  "node:crypto": false as unknown as string,
  "node:module": false as unknown as string,
  module: false as unknown as string,
  fs: nodeFsStub,
  path: nodePathStub,
  // Storybook blocks live in addon-docs; alias to avoid extra dep
  "@storybook/blocks": require.resolve("@storybook/addon-docs/blocks"),
  // Deduplicate Emotion to avoid multiple ThemeContexts between blocks/MDX
  "@emotion/react": require.resolve("@emotion/react"),
  "@emotion/styled": require.resolve("@emotion/styled"),
});
