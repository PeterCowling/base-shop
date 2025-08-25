// packages/zod-utils/src/initZod.ts
// Small initializer that installs the friendly Zod error map.
// Keep it explicit (no side effects on import) so callers can control when it runs.
import { applyFriendlyZodMessages } from "./zodErrorMap";

export function initZod(): void {
  applyFriendlyZodMessages();
}
