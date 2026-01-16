import path from "node:path";
import { createRequire } from "node:module";
import { defineConfig } from "vitest/config";

const require = createRequire(import.meta.url);

const resolveOptional = (specifier: string): string | undefined => {
  try {
    return require.resolve(specifier);
  } catch {
    return undefined;
  }
};

const reactPath = require.resolve("react");
const reactDomPath = require.resolve("react-dom");
const reactDomClientPath = resolveOptional("react-dom/client");
const reactJsxRuntimePath = resolveOptional("react/jsx-runtime");
const reactJsxDevRuntimePath = resolveOptional("react/jsx-dev-runtime");

export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  resolve: {
    alias: [
      { find: /^react$/, replacement: reactPath },
      { find: /^react-dom$/, replacement: reactDomPath },
      ...(reactDomClientPath ? [{ find: /^react-dom\/client$/, replacement: reactDomClientPath }] : []),
      ...(reactJsxRuntimePath ? [{ find: /^react\/jsx-runtime$/, replacement: reactJsxRuntimePath }] : []),
      ...(reactJsxDevRuntimePath ? [{ find: /^react\/jsx-dev-runtime$/, replacement: reactJsxDevRuntimePath }] : []),
      { find: /^@$/, replacement: path.resolve(__dirname, "src") },
      { find: /^@\//, replacement: `${path.resolve(__dirname, "src")}/` },
      { find: /^@tests$/, replacement: path.resolve(__dirname, "../../tests/support") },
      { find: /^@tests\//, replacement: `${path.resolve(__dirname, "../../tests/support")}/` },
      { find: /^@acme\/ui$/, replacement: path.resolve(__dirname, "../../packages/ui/src") },
      { find: /^@acme\/ui\/context\/ModalContext$/, replacement: path.resolve(__dirname, "tests/stubs/ui-modal-context.ts") },
      { find: /^@ui\/context\/ModalContext$/, replacement: path.resolve(__dirname, "tests/stubs/ui-modal-context.ts") },
      { find: /^@acme\/ui\/data\/roomsData$/, replacement: path.resolve(__dirname, "tests/stubs/ui-rooms-data.ts") },
      { find: /^@ui\/data\/roomsData$/, replacement: path.resolve(__dirname, "tests/stubs/ui-rooms-data.ts") },
      { find: /^@acme\/ui\//, replacement: `${path.resolve(__dirname, "../../packages/ui/src")}/` },
      { find: /^@ui$/, replacement: path.resolve(__dirname, "../../packages/ui/src") },
      { find: /^@ui\//, replacement: `${path.resolve(__dirname, "../../packages/ui/src")}/` },
      { find: /^focus-trap-react$/, replacement: path.resolve(__dirname, "tests/stubs/focus-trap-react.tsx") },
      { find: /^react-router$/, replacement: path.resolve(__dirname, "src/compat/react-router.tsx") },
      { find: /^react-router-dom$/, replacement: path.resolve(__dirname, "src/compat/react-router-dom.tsx") },
      { find: /^react-router\/dom$/, replacement: path.resolve(__dirname, "src/compat/react-router-dom.tsx") },
      { find: /^@react-router\/dev\/routes$/, replacement: path.resolve(__dirname, "src/compat/react-router-dev-routes.ts") },
    ],
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: [path.resolve(__dirname, "tests/vitest.setup.ts")],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    testTimeout: 20000,
    hookTimeout: 20000,
    restoreMocks: true,
    clearMocks: true,
    mockReset: true,
  },
});
