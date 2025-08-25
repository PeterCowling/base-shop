// packages/zod-utils/src/initZod.ts
// Small initializer that installs the friendly Zod error map.
// Import it directly so Jest can transpile the module without
// choking on top‑level `await`.
// Import the TypeScript source so ts-jest can transpile it during tests.
import { applyFriendlyZodMessages } from "./zodErrorMap";

export function initZod(): void {
  applyFriendlyZodMessages();
}

// Initialize immediately when this module is imported. The export
// remains so callers can re-run if needed.
initZod();
