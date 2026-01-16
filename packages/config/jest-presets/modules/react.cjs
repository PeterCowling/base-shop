/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * React path resolution for Jest.
 *
 * Ensures a single instance of React across all tests by resolving to either:
 * - Direct react/react-dom packages (when available in workspace)
 * - Next.js compiled React bundles (as fallback)
 *
 * Returns an array of [pattern, replacement] mappings.
 */

const fs = require("fs");
const path = require("path");

function resolveReact() {
  try {
    const reactPkg = require.resolve("react/package.json", {
      paths: [process.cwd()],
    });
    const reactBase = path.dirname(reactPkg);
    const reactDomPkg = require.resolve("react-dom/package.json", {
      paths: [process.cwd()],
    });
    const reactDomBase = path.dirname(reactDomPkg);

    const jsxRuntime = path.join(reactBase, "jsx-runtime.js");
    const jsxDevRuntime = path.join(reactBase, "jsx-dev-runtime.js");
    const domClient = path.join(reactDomBase, "client.js");

    if (
      fs.existsSync(jsxRuntime) &&
      fs.existsSync(jsxDevRuntime) &&
      fs.existsSync(domClient)
    ) {
      return {
        reactPath: reactBase,
        reactDomPath: reactDomBase,
        reactDomClientPath: domClient,
        reactJsxRuntimePath: jsxRuntime,
        reactJsxDevRuntimePath: jsxDevRuntime,
      };
    }
  } catch {
    // fall through to compiled React
  }
  return null;
}

function resolveReactFromNext() {
  const compiledReactPkg = require.resolve(
    "next/dist/compiled/react/package.json"
  );
  const reactPath = path.dirname(compiledReactPkg);
  const compiledReactDomPkg = require.resolve(
    "next/dist/compiled/react-dom/package.json"
  );
  const reactDomPath = path.dirname(compiledReactDomPkg);

  return {
    reactPath,
    reactDomPath,
    reactDomClientPath: require.resolve(
      "next/dist/compiled/react-dom/client.js"
    ),
    reactJsxRuntimePath: require.resolve(
      "next/dist/compiled/react/jsx-runtime.js"
    ),
    reactJsxDevRuntimePath: require.resolve(
      "next/dist/compiled/react/jsx-dev-runtime.js"
    ),
  };
}

function resolveReactPaths() {
  return resolveReact() ?? resolveReactFromNext();
}

/**
 * Returns React path mappings as an array of [pattern, replacement] tuples.
 */
function getReactMappings() {
  const {
    reactPath,
    reactDomPath,
    reactDomClientPath,
    reactJsxRuntimePath,
    reactJsxDevRuntimePath,
  } = resolveReactPaths();

  return [
    ["^react$", reactPath],
    ["^react-dom/client\\.js$", reactDomClientPath],
    ["^react-dom$", reactDomPath],
    ["^react/jsx-runtime$", reactJsxRuntimePath],
    ["^react/jsx-dev-runtime$", reactJsxDevRuntimePath],
  ];
}

module.exports = getReactMappings();
