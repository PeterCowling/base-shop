// packages/zod-utils/src/initZod.ts
// Small initializer that installs the friendly Zod error map.
// Load the map and apply it immediately. Keep the function export so
// callers can re-run if needed.
import { applyFriendlyZodMessages } from "./zodErrorMap";

export function initZod(): void {
  applyFriendlyZodMessages();
}

// Initialize immediately when this module is imported.
initZod();
