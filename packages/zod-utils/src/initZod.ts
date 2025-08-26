// packages/zod-utils/src/initZod.ts
/* istanbul ignore file */
// Small initializer that installs the friendly Zod error map.
// Import it using `require` so that when this file is transpiled to
// CommonJS (as happens under Jest) it does not emit any async `import`
// helpers that rely on top-level `await`.  Using `require` keeps the
// generated code synchronous and works in both ESM and CJS test runs.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { applyFriendlyZodMessages } = require("./zodErrorMap");

export function initZod(): void {
  applyFriendlyZodMessages();
}

// Initialize immediately when this module is imported. The export
// remains so callers can re-run if needed.
initZod();
