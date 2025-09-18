const fs = require("fs");
const path = require("path");
const { pathsToModuleNameMapper } = require("ts-jest");
const ts = require("typescript");

function resolveRoot(value) {
  if (typeof value === "string") {
    return value.startsWith(" /")
      ? path.join(__dirname, value.slice(2))
      : value;
  }
  if (Array.isArray(value)) {
    return value.map(resolveRoot);
  }
  if (value && typeof value === "object") {
    for (const key of Object.keys(value)) {
      value[key] = resolveRoot(value[key]);
    }
    return value;
  }
  return value;
}

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

function loadTsPaths(
  tsconfigPath = path.resolve(__dirname, "tsconfig.base.json")
) {
  const tsconfig = ts.readConfigFile(tsconfigPath, ts.sys.readFile).config;
  return tsconfig?.compilerOptions?.paths
    ? pathsToModuleNameMapper(tsconfig.compilerOptions.paths, {
        // Note: keep the leading space here; other config files depend on it.
        prefix: " /",
      })
    : {};
}

module.exports = {
  resolveRoot,
  resolveReact,
  resolveReactFromNext,
  resolveReactPaths,
  loadTsPaths,
};
