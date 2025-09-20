/* Jest stub for type-only .d.ts imports and initZod.
 *
 * Some modules, such as `@acme/zod-utils/initZod`, are mapped to this file
 * during tests. Those modules expect an `initZod` function to exist, so we
 * provide a no-op implementation here while still exporting a default object
 * for other generic stubs.
 */

// Provide a noop so calls like `initZod()` do not throw in tests.
export const initZod = () => {};

// Default export so both default and named imports are safe.
const defaultExport: Record<string, unknown> = {};
export default defaultExport;

