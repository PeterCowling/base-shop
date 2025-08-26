// packages/zod-utils/src/initZod.ts
/* istanbul ignore file */
// Small initializer that installs the friendly Zod error map.
// Import it using Node's `createRequire` so that when this file is
// transpiled to CommonJS (as happens under Jest) it does not emit any
// async `import` helpers that rely on top-level `await`. Using
// `createRequire` keeps the generated code synchronous and works in
// both ESM and CJS test runs.
import { createRequire } from "node:module";
const { applyFriendlyZodMessages } = createRequire(import.meta.url)(
  "./zodErrorMap"
);

export function initZod(): void {
  applyFriendlyZodMessages();
}

// Initialize immediately when this module is imported. The export
// remains so callers can re-run if needed.
initZod();
