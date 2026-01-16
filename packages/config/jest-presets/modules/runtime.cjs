/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Runtime module mappings for Jest.
 *
 * Provides functions for resolving module paths at runtime based on
 * the environment and available dependencies.
 *
 * These are needed when path resolution depends on pnpm structure or
 * package availability that can't be determined statically.
 */

/**
 * Resolves the MSW interceptors ClientRequest module.
 *
 * pnpm may nest @mswjs/interceptors beneath MSW's own node_modules,
 * so we need to resolve it at runtime rather than hard-coding the path.
 *
 * Returns an array of [pattern, replacement] mappings.
 */
function getMswInterceptorsMappings() {
  const interceptorsClientRequestPath = (() => {
    try {
      return require.resolve("@mswjs/interceptors/ClientRequest", {
        paths: [process.cwd()],
      });
    } catch {
      return null;
    }
  })();

  if (interceptorsClientRequestPath) {
    return [
      ["^@mswjs/interceptors/ClientRequest$", interceptorsClientRequestPath],
    ];
  } else {
    // Fallback to empty module if MSW is not available
    return [
      ["^@mswjs/interceptors/ClientRequest$", " /test/emptyModule.ts"],
    ];
  }
}

/**
 * Get all runtime module mappings.
 *
 * Returns an array of [pattern, replacement] tuples.
 */
function getRuntimeMappings() {
  return [
    ...getMswInterceptorsMappings(),
  ];
}

module.exports = getRuntimeMappings();
