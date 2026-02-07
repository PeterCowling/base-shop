/**
 * Custom Jest transformer that wraps ts-jest to handle import.meta expressions.
 *
 * packages/ui source files use `import.meta.env` and `import.meta.vitest`
 * which are valid in ESM/Vite but cause SyntaxError in Jest's CJS mode.
 * This transformer replaces import.meta references with safe stubs before
 * passing to ts-jest.
 *
 * Usage in jest.config:
 *   transform: {
 *     "^.+\\.(ts|tsx)$": ["<path>/jest-import-meta-transform.cjs", { tsconfig, ... }]
 *   }
 */
/* eslint-disable @typescript-eslint/no-require-imports */

const IMPORT_META_PATTERN = /\bimport\.meta\b/;

/**
 * Replace import.meta with safe CJS-compatible stubs:
 * - typeof import.meta → typeof undefined (makes guards evaluate to false)
 * - import.meta.env → (process.env)
 * - import.meta.vitest → undefined
 * - import.meta.url → ""
 * - remaining import.meta → ({})
 */
function stripImportMeta(source) {
  if (!IMPORT_META_PATTERN.test(source)) return source;

  return source
    .replace(/typeof\s+import\.meta\b/g, "typeof undefined")
    .replace(/\bimport\.meta\.env\b/g, "(process.env)")
    .replace(/\bimport\.meta\.vitest\b/g, "undefined")
    .replace(/\bimport\.meta\.url\b/g, '""')
    .replace(/\bimport\.meta\b/g, "({})");
}

module.exports = {
  createTransformer(tsJestConfig) {
    const { default: tsJestDefault } = require("ts-jest");
    const tsJest = tsJestDefault.createTransformer(tsJestConfig);

    return {
      process(sourceText, sourcePath, options) {
        const patched = stripImportMeta(sourceText);
        return tsJest.process(patched, sourcePath, options);
      },
      getCacheKey(sourceText, sourcePath, options) {
        const patched = stripImportMeta(sourceText);
        return tsJest.getCacheKey(patched, sourcePath, options);
      },
    };
  },
};
