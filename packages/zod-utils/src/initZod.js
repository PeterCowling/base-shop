// packages/zod-utils/src/initZod.ts
// Small initializer that installs the friendly Zod error map.
// Import it directly so Jest can transpile the module without
// relying on top-level `await`.
import { applyFriendlyZodMessages } from "./zodErrorMap.js";
export function initZod() {
    applyFriendlyZodMessages();
}
initZod();
