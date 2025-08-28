// packages/zod-utils/src/initZod.ts
/* istanbul ignore file */
// Small initializer that installs the friendly Zod error map.
// Import the error map synchronously so it works in both ESM and CJS
// environments without relying on Node-specific helpers such as
// `createRequire`, which cannot be bundled for the browser.
import { applyFriendlyZodMessages } from "./zodErrorMap.js";

export function initZod(): void {
  applyFriendlyZodMessages();
}

// Initialize immediately when this module is imported. The export
// remains so callers can re-run if needed.
initZod();

