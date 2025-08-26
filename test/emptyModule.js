/* Jest stub for type-only .d.ts imports.
 *
 * Some modules, such as `@acme/zod-utils/initZod`, are mapped to this file
 * during tests.  Those modules expect an `initZod` function to exist, so we
 * provide a no-op implementation here while still exporting an object for
 * other generic stubs.
 */

module.exports = {
  // Flag as an ES module so named imports work with Jest's ESM handling.
  __esModule: true,
  // Provide a noop function so calls like `initZod()` do not throw.
  initZod: () => {},
};
