// packages/zod-utils/src/initZod.ts
// Small initializer that installs the friendly Zod error map.
// Load the map lazily via dynamic import so Jest's CommonJS parser
// doesn't choke on the ESM build artifact.
const { applyFriendlyZodMessages } = await import("./zodErrorMap.js");

export function initZod(): void {
  applyFriendlyZodMessages();
}

// Initialize immediately when this module is imported. The export
// remains so callers can re-run if needed.
initZod();
